"""Extracción de texto de las evidencias que sube una empresa.

Antes, al subir un Word o una imagen, el servidor guardaba los bytes del
archivo decodificados como si fueran texto. Un .docx es un ZIP, así que la IA
evaluaba caracteres sin sentido. Este módulo lee cada formato con su librería
y devuelve cadena vacía para los que no contienen texto legible (imágenes).
"""
import io

EXTENSIONES_IMAGEN = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff", ".heic")
EXTENSIONES_TEXTO = (".txt", ".md", ".csv", ".json", ".log", ".xml", ".html", ".htm")


def es_imagen(filename: str) -> bool:
    return (filename or "").lower().endswith(EXTENSIONES_IMAGEN)


def _pdf(data: bytes) -> str:
    from pypdf import PdfReader
    texto = []
    for page in PdfReader(io.BytesIO(data)).pages:
        t = page.extract_text()
        if t:
            texto.append(t)
    return "\n".join(texto)


def _docx(data: bytes) -> str:
    import docx
    doc = docx.Document(io.BytesIO(data))
    partes = [p.text for p in doc.paragraphs if p.text.strip()]
    for tabla in doc.tables:
        for fila in tabla.rows:
            celdas = [c.text.strip() for c in fila.cells if c.text.strip()]
            if celdas:
                partes.append(" | ".join(celdas))
    return "\n".join(partes)


def _xlsx(data: bytes) -> str:
    from openpyxl import load_workbook
    libro = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    partes = []
    for hoja in libro.worksheets:
        partes.append(f"Hoja: {hoja.title}")
        for fila in hoja.iter_rows(values_only=True):
            valores = [str(v) for v in fila if v is not None and str(v).strip()]
            if valores:
                partes.append(" | ".join(valores))
    return "\n".join(partes)


def extraer_texto(data: bytes, filename: str) -> str:
    """Texto legible del archivo, o "" si el formato no tiene texto (imágenes,
    PDF escaneados, formatos desconocidos)."""
    nombre = (filename or "").lower()
    try:
        if nombre.endswith(".pdf"):
            return _pdf(data).strip()
        if nombre.endswith(".docx"):
            return _docx(data).strip()
        if nombre.endswith((".xlsx", ".xlsm")):
            return _xlsx(data).strip()
        if nombre.endswith(EXTENSIONES_TEXTO):
            try:
                return data.decode("utf-8").strip()
            except UnicodeDecodeError:
                return data.decode("latin-1", errors="ignore").strip()
    except Exception as e:  # un archivo dañado no debe impedir guardar la evidencia
        print(f"No se pudo extraer texto de {filename}: {e}")
    return ""


def texto_guardado_valido(texto: str, filename: str) -> str:
    """Las evidencias subidas antes de este módulo pueden tener guardados los
    bytes de un Word (empiezan con "PK", la firma de un ZIP) o de una imagen
    leídos como texto. Ese texto no sirve y se descarta."""
    texto = (texto or "").strip()
    if not texto or es_imagen(filename) or texto.startswith("PK\x03\x04"):
        return ""
    return texto
