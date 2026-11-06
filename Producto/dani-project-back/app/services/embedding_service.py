# app/services/embedding_service.py
import os
import logging
import re
import threading
from typing import List, Optional

logger = logging.getLogger(__name__)

# Intentar importar fastembed
try:
    from fastembed import TextEmbedding
    FASTEMBED_AVAILABLE = True
except ImportError:
    FASTEMBED_AVAILABLE = False
    logger.warning("⚠️ La librería 'fastembed' no está instalada. Ejecutando EmbeddingService en MODO SIMULADO de respaldo.")

# Intentar importar pymupdf (fitz)
try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("⚠️ La librería 'pymupdf' (fitz) no está instalada. El extractor de PDF avanzado no estará disponible.")

try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False

try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False


class EmbeddingService:
    def __init__(self):
        # CAMBIO: el __init__ YA NO carga el modelo de embeddings. Antes,
        # aquí mismo vivía el bloque "if FASTEMBED_AVAILABLE: try: ...
        # TextEmbedding(...)", lo que significaba que apenas se instanciaba
        # EmbeddingService() (cosa que evidence.py hace a nivel de módulo,
        # es decir, en CADA import de app.main) se disparaba la descarga de
        # un modelo de ~66MB desde Hugging Face. En Vercel eso corre en
        # cada cold start —incluso para un simple login—, lo cual es lento
        # y puede agotar el timeout de la función o fallar por filesystem
        # efímero. Ahora el __init__ solo deja todo preparado, sin cargar
        # nada todavía.
        self.model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        self.embedding_model = None
        self._model_loaded = False
        # Una sola generación a la vez: con varios documentos en paralelo la
        # memoria se suma y Render (512 MB) reinicia el servidor.
        self._lock = threading.Lock()

    def _ensure_model_loaded(self):
        # CAMBIO: NUEVO método. Contiene el mismo try/except que antes
        # estaba en __init__, pero ahora se ejecuta solo la primera vez que
        # de verdad se necesita generar un embedding (carga perezosa /
        # lazy load), llamado desde generate_embeddings() más abajo. Así,
        # endpoints que no tocan evidencias (login, riesgos, compliance,
        # etc.) nunca pagan el costo de esta carga.
        if self._model_loaded:
            return
        self._model_loaded = True

        if not FASTEMBED_AVAILABLE:
            return

        try:
            self.embedding_model = TextEmbedding(model_name=self.model_name, threads=1)
            logger.info(f"✅ Modelo de embeddings multilingüe '{self.model_name}' inicializado con éxito.")
        except Exception as e:
            logger.warning(f"⚠️ No se pudo inicializar '{self.model_name}': {e}. Reintentando con BAAI/bge-small-en-v1.5.")
            try:
                self.model_name = "BAAI/bge-small-en-v1.5"
                self.embedding_model = TextEmbedding(model_name=self.model_name, threads=1)
                logger.info(f"✅ Fallback exitoso: Modelo '{self.model_name}' inicializado.")
            except Exception as fallback_err:
                logger.error(f"❌ Error al cargar modelo de fallback: {fallback_err}. Activando modo simulado.")
                self.embedding_model = None

    def extract_text_from_file(self, file_path: str, mime_type: str) -> str:
        """Extrae el texto completo de un archivo PDF, DOCX o TXT."""
        # Sin cambios respecto a tu versión actual.
        if not os.path.exists(file_path):
            logger.error(f"El archivo no existe en la ruta: {file_path}")
            return ""

        text = ""
        try:
            # 1. Procesar PDF
            if "pdf" in mime_type or file_path.lower().endswith(".pdf"):
                if PYMUPDF_AVAILABLE:
                    doc = fitz.open(file_path)
                    for page in doc:
                        extracted = page.get_text()
                        if extracted:
                            text += extracted + "\n"
                elif PYPDF_AVAILABLE:
                    with open(file_path, "rb") as f:
                        reader = pypdf.PdfReader(f)
                        for page in reader.pages:
                            extracted = page.extract_text()
                            if extracted:
                                text += extracted + "\n"

            # 2. Procesar Word (DOCX)
            elif "word" in mime_type or "officedocument" in mime_type or file_path.lower().endswith(".docx"):
                if DOCX_AVAILABLE:
                    doc = docx.Document(file_path)
                    for paragraph in doc.paragraphs:
                        if paragraph.text:
                            text += paragraph.text + "\n"

            # 3. Procesar Texto plano (TXT)
            else:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()

        except Exception as e:
            logger.error(f"Error al extraer texto de {file_path}: {e}")

        return text.strip()

    def chunk_text(self, text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
        """
        Divide un bloque de texto en fragmentos lógicos con solapamiento.
        Usa un Recursive Character Splitter para respetar saltos de párrafo, oraciones y palabras.
        """
        # Sin cambios respecto a tu versión actual.
        if not text:
            return []

        chunks = []
        separators = ["\n\n", "\n", ". ", " ", ""]

        def _split_recursive(text_to_split: str, separators_list: List[str]) -> List[str]:
            if len(text_to_split) <= chunk_size:
                return [text_to_split]

            separator = ""
            for sep in separators_list:
                if sep in text_to_split:
                    separator = sep
                    break

            if separator == "":
                start = 0
                sub_chunks = []
                while start < len(text_to_split):
                    sub_chunks.append(text_to_split[start:start+chunk_size])
                    start += chunk_size - overlap
                return sub_chunks

            splits = text_to_split.split(separator)
            final_chunks = []
            current_buffer = []
            current_length = 0

            for part in splits:
                if not part.strip():
                    continue
                if current_length + len(part) + len(separator) > chunk_size:
                    if current_buffer:
                        joined = separator.join(current_buffer)
                        final_chunks.append(joined)
                        overlap_buffer = []
                        overlap_len = 0
                        for p in reversed(current_buffer):
                            if overlap_len + len(p) + len(separator) <= overlap:
                                overlap_buffer.insert(0, p)
                                overlap_len += len(p) + len(separator)
                            else:
                                break
                        current_buffer = overlap_buffer
                        current_length = overlap_len

                current_buffer.append(part)
                current_length += len(part) + len(separator)

            if current_buffer:
                final_chunks.append(separator.join(current_buffer))

            refined_chunks = []
            next_seps = separators_list[separators_list.index(separator)+1:]
            for chunk in final_chunks:
                if len(chunk) > chunk_size and len(next_seps) > 0:
                    refined_chunks.extend(_split_recursive(chunk, next_seps))
                else:
                    refined_chunks.append(chunk)

            return refined_chunks

        return _split_recursive(text, separators)

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Genera representaciones vectoriales para una lista de textos."""
        if not texts:
            return []

        # CAMBIO: aquí se dispara la carga perezosa del modelo. La primera
        # vez que se llama, carga el modelo real (puede tardar); las
        # siguientes veces dentro de la misma invocación "warm", _model_loaded
        # ya es True y no vuelve a intentar cargarlo.
        with self._lock:
            self._ensure_model_loaded()

            if self.embedding_model:
                try:
                    # Lotes chicos y 1 hilo: con los valores por defecto (lote 256)
                    # el proceso supera 1,5 GB al indexar un PDF mediano.
                    embeddings_generator = self.embedding_model.embed(texts, batch_size=4)
                    return [list(e) for e in embeddings_generator]
                except Exception as e:
                    logger.error(f"Error generando embeddings con fastembed: {e}")

        # Fallback / Modo Simulado: Generar vectores deterministicos simulados de 384 dimensiones
        logger.warning("⚙️ Generando embeddings simulados de 384 dimensiones para la demo.")
        simulated_embeddings = []
        for text in texts:
            h = hash(text)
            vector = []
            for i in range(384):
                val = ((h * (i + 1)) % 1000) / 1000.0 - 0.5
                vector.append(val)
            simulated_embeddings.append(vector)

        return simulated_embeddings

    def generate_single_embedding(self, text: str) -> List[float]:
        """Genera el embedding para un único texto."""
        # Sin cambios — internamente ya pasa por generate_embeddings(), que
        # es donde está el lazy load.
        vectors = self.generate_embeddings([text])
        return vectors[0] if vectors else [0.0] * 384

    def process_normative_pdf(self, file_path: str, document_name: str) -> List[dict]:
        """
        Procesa un PDF de base normativa aplicando extracción avanzada (cabeceras/pies recortados),
        chunking contextual y generación de embeddings.

        Retorna una lista de diccionarios listos para insertar en PostgreSQL.
        """
        # Sin cambios respecto a tu versión actual.
        if not PYMUPDF_AVAILABLE:
            logger.error("❌ No se puede procesar la base normativa de forma avanzada porque 'pymupdf' no está disponible.")
            return []

        if not os.path.exists(file_path):
            logger.error(f"❌ El archivo no existe en: {file_path}")
            return []

        doc = fitz.open(file_path)
        processed_chunks = []

        clause_regex = re.compile(
            r'(?:Cl[áa]usula|Secci[oó]n|Control)\s+(\d+(?:\.\d+)*)|(A\.\d+\.\d+)',
            re.IGNORECASE
        )

        for page_num in range(len(doc)):
            page = doc[page_num]
            rect = page.rect
            height = rect.height

            header_threshold = height * 0.08
            footer_threshold = height * 0.92

            blocks = page.get_text("blocks")
            blocks.sort(key=lambda b: (b[1], b[0]))

            page_text_blocks = []
            for b in blocks:
                x0, y0, x1, y1, text, block_no, block_type = b
                if y0 > header_threshold and y1 < footer_threshold:
                    clean_text = text.strip()
                    if clean_text:
                        page_text_blocks.append(clean_text)

            page_text = "\n".join(page_text_blocks)
            if not page_text.strip():
                continue

            match = clause_regex.search(page_text)
            clause_reference = "General"
            if match:
                clause_reference = match.group(1) or match.group(2)

            raw_chunks = self.chunk_text(page_text, chunk_size=1000, overlap=200)

            for idx, raw_chunk in enumerate(raw_chunks):
                context_prefix = f"[Norma: {document_name} | Cláusula: {clause_reference} | Página: {page_num + 1}]\n"
                enriched_content = context_prefix + raw_chunk

                embedding = self.generate_single_embedding(enriched_content)

                processed_chunks.append({
                    "document_name": document_name,
                    "clause": clause_reference,
                    "page_number": page_num + 1,
                    "chunk_index": idx,
                    "content": enriched_content,
                    "raw_text": raw_chunk,
                    "embedding": embedding
                })

        logger.info(f"✅ Procesados con éxito {len(processed_chunks)} fragmentos RAG para {document_name}.")
        return processed_chunks

# Instancia compartida: cada EmbeddingService carga su propia copia del modelo.
embedding_service = EmbeddingService()
