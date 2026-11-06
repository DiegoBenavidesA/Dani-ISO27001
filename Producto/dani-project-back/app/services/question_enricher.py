"""
Mejora de preguntas importadas desde PDF.

Los checklists en PDF traen afirmaciones ("Se recogen los datos con fines
explícitos"), no preguntas; el texto viene con palabras y números partidos por
la extracción ("1 4 años", "INFORMACIÓ N") y sin evidencia esperada, que es lo
que la IA necesita para evaluar los documentos de una empresa.

1. limpiar_texto_pdf / a_pregunta / nombre_corto: arreglo determinista, sin IA,
   que se aplica siempre al importar.
2. enriquecer: la IA redacta, por lotes, un título corto, la pregunta y la
   evidencia esperada de cada ítem. Si la IA falla, queda el arreglo 1.
"""
import asyncio
import json
import logging
import re
from typing import Callable, List, Optional

logger = logging.getLogger(__name__)

TAMANO_LOTE = 12
MARCO_NOMBRE = {"iso27001": "ISO/IEC 27001:2022", "ley21719": "Ley 21.719 de Protección de Datos Personales (Chile)"}


def limpiar_texto_pdf(texto: str) -> str:
    s = re.sub(r"\s+", " ", str(texto or "")).strip()
    s = re.sub(r"(?<=\d) (?=\d)", "", s)                        # "1 4 años" -> "14 años"
    s = re.sub(r"(\w) ([NS])(?=[\s.,;:)»]|$)", r"\1\2", s)       # "INFORMACIÓ N" -> "INFORMACIÓN"
    s = re.sub(r"\s+([.,;:])", r"\1", s)                         # "INTERESADO ." -> "INTERESADO."
    s = re.sub(r"\bDER ECHOS\b", "DERECHOS", s)
    s = re.sub(r"\bINTERESAD O\b", "INTERESADO", s)
    s = re.sub(r"(INTERESADO) DER$", r"\1", s)                   # inicio del título siguiente que se coló
    return s.strip(" -")


def a_pregunta(texto: str) -> str:
    """'Se recogen los datos…' -> '¿Se recogen los datos…?'"""
    s = limpiar_texto_pdf(texto).rstrip(" .;:")
    if not s:
        return s
    if s.startswith("¿") or s.endswith("?"):
        return s if s.startswith("¿") else "¿" + s
    return f"¿{s[0].upper()}{s[1:]}?"


def nombre_corto(texto: str, maximo: int = 90) -> str:
    """Título sin cortar palabras a la mitad."""
    s = limpiar_texto_pdf(texto).strip("¿? .")
    if len(s) <= maximo:
        return s
    corte = s[:maximo].rsplit(" ", 1)[0].rstrip(",;:")
    return corte + "…"


def _prompt(marco: str, lote: List[dict]) -> str:
    items = "\n".join(
        f'{i}. [Tema: {it["categoria"]}] {it["texto"]}' for i, it in enumerate(lote)
    )
    return f"""Eres auditor experto en {MARCO_NOMBRE.get(marco, marco)}.
Estos ítems vienen de un checklist de cumplimiento. Para cada uno devuelve:
- "nombre": título breve (máximo 80 caracteres), sin cortar palabras.
- "pregunta": el ítem redactado como pregunta de auditoría en español, cerrada (Sí/No), empezando con "¿". Conserva el sentido exacto; no agregues requisitos nuevos.
- "evidencia_esperada": qué documento o registro concreto demostraría el cumplimiento (máximo 200 caracteres).

ÍTEMS:
{items}

Responde SOLO con un arreglo JSON, un objeto por ítem y en el mismo orden:
[{{"i": 0, "nombre": "...", "pregunta": "¿...?", "evidencia_esperada": "..."}}]"""


def _parsear(respuesta: str) -> list:
    texto = (respuesta or "").replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(texto)
    except json.JSONDecodeError:
        m = re.search(r"\[.*\]", texto, re.DOTALL)
        if not m:
            return []
        try:
            data = json.loads(m.group(0))
        except json.JSONDecodeError:
            return []
    return data if isinstance(data, list) else []


async def _llamar(ai_service, prompt: str) -> str:
    """Reintenta ante el límite por minuto de Groq."""
    ultimo = None
    for espera in (0, 15, 30, 45):
        if espera:
            await asyncio.sleep(espera)
        try:
            return await ai_service.generate_document(prompt)
        except Exception as e:
            ultimo = e
            logger.warning(f"Mejora de preguntas: la IA falló ({str(e)[:80]}); reintentando…")
    raise ultimo


async def enriquecer(ai_service, marco: str, items: List[dict], on_progress: Optional[Callable[[int], None]] = None) -> List[dict]:
    """items: [{"categoria", "texto"}] -> [{"nombre", "pregunta", "evidencia_esperada", "con_ia"}] en el mismo orden."""
    salida = [
        {"nombre": nombre_corto(it["texto"]), "pregunta": a_pregunta(it["texto"]), "evidencia_esperada": None, "con_ia": False}
        for it in items
    ]
    for inicio in range(0, len(items), TAMANO_LOTE):
        lote = items[inicio:inicio + TAMANO_LOTE]
        try:
            respuesta = await _llamar(ai_service, _prompt(marco, lote))
            for r in _parsear(respuesta):
                try:
                    i = int(r.get("i"))
                except (TypeError, ValueError):
                    continue
                if not 0 <= i < len(lote):
                    continue
                pregunta = limpiar_texto_pdf(r.get("pregunta") or "")
                if len(pregunta) < 10:
                    continue
                if not pregunta.startswith("¿"):
                    pregunta = "¿" + pregunta.lstrip("¿")
                if not pregunta.endswith("?"):
                    pregunta = pregunta.rstrip(" .") + "?"
                salida[inicio + i] = {
                    "nombre": nombre_corto(r.get("nombre") or pregunta, 120),
                    "pregunta": pregunta[:1000],
                    "evidencia_esperada": (limpiar_texto_pdf(r.get("evidencia_esperada") or "") or None),
                    "con_ia": True,
                }
        except Exception as e:
            logger.error(f"Mejora de preguntas: lote {inicio} sin IA ({str(e)[:120]})")
        if on_progress:
            on_progress(min(inicio + TAMANO_LOTE, len(items)))
    return salida
