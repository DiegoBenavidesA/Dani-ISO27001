# app/services/question_evaluator.py
"""
Motor de evaluación de preguntas con IA, pensado para cientos de preguntas.

Antes, cada lote de 10 preguntas mandaba a la IA los primeros 8.000 caracteres
del documento: con ~500 preguntas eran ~50 llamadas repitiendo el mismo texto
(chocando con el límite por minuto de Groq y con el timeout del navegador), y
todo lo que venía después de esos 8.000 caracteres se ignoraba.

Ahora:
  1. Filtro por relevancia: se compara cada pregunta con los fragmentos del
     documento por palabras clave en español (ponderadas por lo específicas
     que son). Las preguntas sin relación quedan como "sin_evidencia" sin
     gastar llamadas a la IA.
  2. Contexto por fragmentos: a la IA se le envían solo los fragmentos
     relevantes para cada lote (de cualquier parte del documento).
  3. Trabajo en segundo plano: la evaluación corre como un job con progreso
     consultable, en vez de una única petición HTTP que se corta.
"""
import asyncio
import json
import logging
import time
import uuid
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# ---- Parámetros del filtro y de los lotes ---------------------------------
UMBRAL_RELEVANCIA = 0.40      # proporción mínima (ponderada) de términos de la pregunta presentes en un fragmento
MIN_CANDIDATAS = 25           # siempre se evalúan al menos las N más parecidas
TAMANO_LOTE = 15              # preguntas por llamada a la IA
FRAGMENTOS_POR_PREGUNTA = 3   # fragmentos más relevantes por pregunta
MAX_CONTEXTO = 7000           # caracteres de contexto por llamada
LLAMADAS_EN_PARALELO = 2      # respeta el límite por minuto del plan gratuito
MAX_FRAGMENTOS = 600          # tope de fragmentos a comparar (documentos enormes)

JUSTIFICACION_FILTRADA = (
    "No se encontró en los documentos contenido relacionado con esta pregunta "
    "(descartada por el filtro automático de relevancia)."
)

# ---- Almacén de jobs en memoria ------------------------------------------
# Render (plan gratuito) corre una sola instancia, así que basta con memoria.
# Si el servidor se reinicia, los jobs en curso se pierden y el frontend lo
# informa como error.
JOBS: Dict[str, dict] = {}
_JOB_TTL_SEGUNDOS = 3600


def _limpiar_jobs_viejos():
    ahora = time.time()
    for jid in [j for j, d in JOBS.items() if ahora - d["created"] > _JOB_TTL_SEGUNDOS]:
        JOBS.pop(jid, None)


def crear_job(org_id: str, total: int) -> str:
    _limpiar_jobs_viejos()
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {
        "id": job_id, "org_id": org_id, "status": "running", "stage": "Preparando documentos",
        "done": 0, "total": total, "result": None, "error": None, "created": time.time(),
    }
    return job_id


def obtener_job(job_id: str, org_id: str) -> Optional[dict]:
    job = JOBS.get(job_id)
    if not job or job["org_id"] != org_id:
        return None
    return {k: v for k, v in job.items() if k not in ("org_id", "created")}


# ---- Filtro por relevancia (palabras clave en español) --------------------
# Se probó con embeddings, pero el modelo multilingüe no está disponible en
# fastembed 0.2.2 y el de respaldo (bge-small-en, solo inglés) da similitudes
# casi iguales para cualquier texto en español, así que no filtraba nada. Los
# modelos multilingües disponibles pesan 1–2 GB (más que la RAM de Render
# gratis). Este filtro léxico no necesita modelo y es instantáneo.

import math
import re as _re
import unicodedata as _ud

_STOPWORDS = set("""
a al algo algun alguna algunas alguno algunos ante antes asi aun cada como con contra cual cuales cuando de del desde donde dos e el ella ellas ellos en entre era es esa esas ese eso esos esta estan estas este esto estos fue fueron ha han hay hasta la las le les lo los mas me mi mientras mismo muy nada ni no nos o otra otras otro otros para pero poco por que quien se sea segun ser si sin sobre son su sus tal tambien tiene tienen todo todos tu un una unas uno unos y ya
existe existen cuenta cuentan cuente realiza realizan realizado realizada se forma manera mediante traves debe deben debera puede pueden
organizacion empresa entidad institucion documentado documentada documentados documentadas documento documentos definido definida definidos
definidas establecido establecida establecidos establecidas procedimiento procedimientos proceso procesos politica politicas control controles
gestion informacion seguridad datos personales periodicamente periodica periodico formal formalmente adecuado adecuada adecuados adecuadas
actualizado actualizada vigente registro registros evidencia esperada aprobado aprobada implementado implementada aplica aplican
""".split())


def _normalizar_texto(texto: str) -> str:
    texto = _ud.normalize("NFKD", (texto or "").lower())
    return "".join(c for c in texto if not _ud.combining(c))


def _terminos(texto: str) -> List[str]:
    """Palabras significativas, recortadas a una raíz simple (plural/género)."""
    salida = []
    for palabra in _re.findall(r"[a-z0-9]+", _normalizar_texto(texto)):
        if len(palabra) < 4 or palabra in _STOPWORDS:
            continue
        salida.append(palabra[:6])  # respaldo/respaldos -> respal
    return salida


def _texto_pregunta(q) -> str:
    partes = [q.nombre or "", q.pregunta or ""]
    if getattr(q, "evidencia_esperada", None):
        partes.append(q.evidencia_esperada)
    return " ".join(p for p in partes if p)


def seleccionar_relevantes(preguntas, documentos, embedding_service):
    """Devuelve (candidatas, descartadas, fragmentos, fragmentos_por_pregunta).

    documentos: lista de (titulo, texto). Para cada pregunta se mide qué
    proporción de sus términos (ponderados por lo poco comunes que son entre
    todas las preguntas) aparece en cada fragmento del documento.
    """
    fragmentos = []  # (titulo, texto)
    for titulo, texto in documentos:
        for frag in embedding_service.chunk_text(texto, chunk_size=900, overlap=150):
            if frag.strip():
                fragmentos.append((titulo, frag.strip()))
    fragmentos = fragmentos[:MAX_FRAGMENTOS]
    if not fragmentos:
        return list(preguntas), [], fragmentos, {}

    terminos_preg = [set(_terminos(_texto_pregunta(q))) for q in preguntas]
    terminos_frag = [set(_terminos(f)) for _, f in fragmentos]

    # Peso de cada término según en cuántas preguntas aparece: los que salen
    # en casi todas ("acceso", "personal"...) pesan poco; los específicos, mucho.
    n = len(preguntas)
    df = {}
    for ts in terminos_preg:
        for t in ts:
            df[t] = df.get(t, 0) + 1
    idf = {t: math.log(1 + n / c) for t, c in df.items()}

    puntajes, frags_por_preg = [], {}
    for q, ts in zip(preguntas, terminos_preg):
        total = sum(idf[t] for t in ts) or 1.0
        por_frag = [(sum(idf[t] for t in ts & tf) / total, j) for j, tf in enumerate(terminos_frag)]
        por_frag.sort(reverse=True)
        puntajes.append(por_frag[0][0] if por_frag else 0.0)
        frags_por_preg[q.id] = [j for s, j in por_frag[:FRAGMENTOS_POR_PREGUNTA] if s > 0] or [0]

    orden = sorted(range(n), key=lambda i: -puntajes[i])
    elegidas = {i for i in orden[:MIN_CANDIDATAS] if puntajes[i] > 0} | {i for i, s in enumerate(puntajes) if s >= UMBRAL_RELEVANCIA}

    candidatas, descartadas = [], []
    for i, q in enumerate(preguntas):
        (candidatas if i in elegidas else descartadas).append(q)
    logger.info(f"Filtro de relevancia: {len(candidatas)} de {n} preguntas van a la IA.")
    return candidatas, descartadas, fragmentos, {q.id: frags_por_preg[q.id] for q in candidatas}


def _contexto_lote(lote, fragmentos, frags_por_preg) -> str:
    if frags_por_preg:
        indices = sorted({j for q in lote for j in frags_por_preg.get(q.id, [])})
    else:
        indices = list(range(len(fragmentos)))
    partes, largo = [], 0
    for j in indices:
        titulo, texto = fragmentos[j]
        bloque = f"### {titulo}\n{texto}\n"
        if largo + len(bloque) > MAX_CONTEXTO:
            break
        partes.append(bloque)
        largo += len(bloque)
    return "\n".join(partes)


# ---- Llamadas a la IA ------------------------------------------------------

ROL_POR_MARCO = {
    "iso27001": "un Auditor Líder ISO/IEC 27001:2022",
    "ley21719": "un auditor experto en la Ley 21.719 de Protección de Datos Personales de Chile",
}


def _prompt_lote(contexto: str, lote) -> str:
    preguntas_json = json.dumps([{"id": q.id, "pregunta": q.pregunta, "codigo": q.codigo} for q in lote], ensure_ascii=False)
    # Todas las preguntas de una evaluación son del mismo marco normativo.
    marco = getattr(lote[0], "marco", "iso27001") if lote else "iso27001"
    rol = ROL_POR_MARCO.get(marco, ROL_POR_MARCO["iso27001"])
    return f"""Eres {rol}. Evalúa SOLO contra ese marco. Estos son los fragmentos relevantes de los documentos de la empresa:
{contexto}

Responde a estas preguntas basadas SOLAMENTE en los fragmentos:
{preguntas_json}

Instrucciones:
1. Si los fragmentos muestran explícitamente que cumplen la pregunta, "veredicto" es "cumple".
2. Si muestran cumplimiento parcial o falta información clave, "veredicto" es "parcial".
3. Si no mencionan el tema o no hay evidencia, "veredicto" es "sin_evidencia".
4. "justificacion" debe ser una breve razón de tu veredicto citando el documento.

MUY IMPORTANTE: Tu respuesta DEBE ser un arreglo JSON válido y NADA MÁS. No incluyas bloques de código markdown, ni texto introductorio, ni comentarios.

Ejemplo de formato esperado:
[
  {{ "id": "id_pregunta_1", "veredicto": "cumple", "confianza": 0.9, "justificacion": "El documento menciona..." }},
  {{ "id": "id_pregunta_2", "veredicto": "sin_evidencia", "confianza": 0.1, "justificacion": "No se menciona en el texto proporcionado." }}
]
"""


async def _llamar_con_reintentos(ai_service, prompt: str) -> str:
    """Reintenta si Groq responde 429 (límite por minuto) o hay un corte de red."""
    esperas = [0, 15, 30, 45]
    ultimo_error = None
    for espera in esperas:
        if espera:
            await asyncio.sleep(espera)
        try:
            return await ai_service.generate_document(prompt)
        except Exception as e:  # RateLimitError, APITimeoutError, etc.
            ultimo_error = e
            logger.warning(f"Llamada a la IA falló ({str(e)[:80]}); reintentando…")
    raise ultimo_error


async def evaluar_preguntas(ai_service, embedding_service, preguntas, documentos, extract_json, on_progress):
    """Evalúa las preguntas y devuelve la lista de resultados por pregunta."""
    candidatas, descartadas, fragmentos, frags_por_preg = await asyncio.to_thread(
        seleccionar_relevantes, preguntas, documentos, embedding_service
    )

    resultados = [
        {"id": q.id, "veredicto": "sin_evidencia", "confianza": 0.0, "justificacion": JUSTIFICACION_FILTRADA}
        for q in descartadas
    ]
    on_progress(len(descartadas), "Evaluando con IA las preguntas relacionadas")

    lotes = [candidatas[i:i + TAMANO_LOTE] for i in range(0, len(candidatas), TAMANO_LOTE)]
    sem = asyncio.Semaphore(LLAMADAS_EN_PARALELO)

    async def evaluar_lote(lote):
        async with sem:
            contexto = _contexto_lote(lote, fragmentos, frags_por_preg)
            try:
                texto = await _llamar_con_reintentos(ai_service, _prompt_lote(contexto, lote))
                parsed = extract_json(texto) or []
            except Exception as e:
                logger.error(f"Lote sin respuesta de la IA: {e}")
                parsed = []
            ids_ok = {str(r.get("id")) for r in parsed if isinstance(r, dict)}
            faltantes = [
                {"id": q.id, "veredicto": "sin_evidencia", "confianza": 0.0,
                 "justificacion": "Error: la IA no devolvió una respuesta válida para esta pregunta."}
                for q in lote if str(q.id) not in ids_ok
            ]
            salida = [r for r in parsed if isinstance(r, dict)] + faltantes
            on_progress(len(lote), None)
            return salida

    for sub in await asyncio.gather(*[evaluar_lote(l) for l in lotes]):
        resultados.extend(sub)
    return resultados, len(candidatas)
