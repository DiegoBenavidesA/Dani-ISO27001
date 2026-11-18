"""Consumo de la IA (Groq) frente a sus límites por minuto y por día.

Qué informa Groq y cómo se usa:
- En cada respuesta envía encabezados con el límite y lo que queda de tokens
  por minuto (TPM) y de solicitudes por día (RPD), y en cuánto tiempo se
  recuperan por completo. Esos valores son exactos y se toman tal cual.
- Los tokens por día (TPD) NO vienen en los encabezados. Groq los repone de
  forma continua (el límite diario repartido en 24 horas), así que se llevan
  con ese mismo modelo: se suman los tokens de cada respuesta y se descuenta
  lo que Groq repone por segundo. Cuando Groq rechaza por límite diario, su
  mensaje trae el uso real ("Used N") y con eso se sincroniza la cuenta.
  Lo que use la misma clave fuera de la plataforma no se ve hasta esa
  sincronización.

El estado se guarda en la tabla uso_ia para no perderlo si el servidor se reinicia.
"""
import json
import logging
import os
import re
import time

logger = logging.getLogger(__name__)

LIMITE_TPD_POR_DEFECTO = int(os.getenv("AI_LIMITE_TOKENS_DIA", "200000"))
SEGUNDOS_DIA = 86400

_estado = None          # dict con el último estado conocido
_cargado = False        # si ya se intentó leer desde la base de datos


def _nuevo_estado(ahora: float) -> dict:
    return {
        "tpd_limite": LIMITE_TPD_POR_DEFECTO, "tpd_usado": 0.0, "tpd_t": ahora, "tpd_sincronizado": None,
        "tpm_limite": None, "tpm_restantes": None, "tpm_reinicio": None, "tpm_t": None,
        "rpd_limite": None, "rpd_restantes": None, "rpd_reinicio": None, "rpd_t": None,
        "ultima_llamada": None,
    }


def estado(ahora: float = None) -> dict:
    global _estado
    if _estado is None:
        _estado = _nuevo_estado(ahora or time.time())
    return _estado


def reiniciar_para_pruebas():
    global _estado, _cargado
    _estado, _cargado = None, True


def duracion_a_segundos(texto) -> float:
    """Convierte las duraciones de Groq ("2m59.56s", "7.66s", "1h2m", "120ms") a segundos."""
    if not texto:
        return 0.0
    total = 0.0
    for valor, unidad in re.findall(r"([\d.]+)(ms|h|m|s)", str(texto)):
        v = float(valor)
        total += {"h": 3600, "m": 60, "s": 1, "ms": 0.001}[unidad] * v
    return total


def _tpd_usado_ahora(e: dict, ahora: float) -> float:
    tasa = e["tpd_limite"] / SEGUNDOS_DIA
    return max(0.0, e["tpd_usado"] - tasa * max(0.0, ahora - e["tpd_t"]))


def registrar_cabeceras(cabeceras, ahora: float = None):
    """Toma los límites y lo que queda, tal como los informa Groq."""
    ahora = time.time() if ahora is None else ahora
    e = estado(ahora)
    h = {k.lower(): v for k, v in dict(cabeceras).items()}
    try:
        if "x-ratelimit-limit-tokens" in h:
            e["tpm_limite"] = int(float(h["x-ratelimit-limit-tokens"]))
            e["tpm_restantes"] = int(float(h.get("x-ratelimit-remaining-tokens", e["tpm_limite"])))
            e["tpm_reinicio"] = duracion_a_segundos(h.get("x-ratelimit-reset-tokens"))
            e["tpm_t"] = ahora
        if "x-ratelimit-limit-requests" in h:
            e["rpd_limite"] = int(float(h["x-ratelimit-limit-requests"]))
            e["rpd_restantes"] = int(float(h.get("x-ratelimit-remaining-requests", e["rpd_limite"])))
            e["rpd_reinicio"] = duracion_a_segundos(h.get("x-ratelimit-reset-requests"))
            e["rpd_t"] = ahora
    except (TypeError, ValueError) as err:
        logger.warning(f"Encabezados de límite de la IA no reconocidos: {err}")


def registrar_tokens(tokens: int, ahora: float = None):
    ahora = time.time() if ahora is None else ahora
    e = estado(ahora)
    e["tpd_usado"] = _tpd_usado_ahora(e, ahora) + max(0, int(tokens or 0))
    e["tpd_t"] = ahora
    e["ultima_llamada"] = ahora


def registrar_error_cuota(texto: str, ahora: float = None):
    """Sincroniza con el uso real que Groq informa al rechazar por límite."""
    ahora = time.time() if ahora is None else ahora
    e = estado(ahora)
    dia = re.search(r"tokens per day \(TPD\): Limit (\d+), Used (\d+)", texto or "")
    if dia:
        e["tpd_limite"] = int(dia.group(1))
        e["tpd_usado"] = float(dia.group(2))
        e["tpd_t"] = ahora
        e["tpd_sincronizado"] = ahora
    minuto = re.search(r"tokens per minute \(TPM\): Limit (\d+), Used (\d+)", texto or "")
    if minuto:
        e["tpm_limite"] = int(minuto.group(1))
        e["tpm_restantes"] = max(0, int(minuto.group(1)) - int(minuto.group(2)))
        espera = re.search(r"try again in ([\dhms.]+)", texto or "")
        e["tpm_reinicio"] = duracion_a_segundos(espera.group(1)) if espera else 60.0
        e["tpm_t"] = ahora


def _recuperado(limite, restantes, reinicio, t, ahora):
    """Lo que queda ahora, sabiendo que Groq lo repone de forma pareja hasta 'reinicio'."""
    if limite is None or restantes is None or t is None:
        return None, None
    pasado = max(0.0, ahora - t)
    if not reinicio or pasado >= reinicio:
        return limite, 0.0
    actual = restantes + (limite - restantes) * (pasado / reinicio)
    return min(limite, actual), reinicio - pasado


def resumen(ahora: float = None) -> dict:
    ahora = time.time() if ahora is None else ahora
    e = estado(ahora)
    tpm_rest, tpm_falta = _recuperado(e["tpm_limite"], e["tpm_restantes"], e["tpm_reinicio"], e["tpm_t"], ahora)
    rpd_rest, rpd_falta = _recuperado(e["rpd_limite"], e["rpd_restantes"], e["rpd_reinicio"], e["rpd_t"], ahora)
    tpd_usado = _tpd_usado_ahora(e, ahora)
    tasa = e["tpd_limite"] / SEGUNDOS_DIA
    return {
        "minuto": None if tpm_rest is None else {
            "limite": e["tpm_limite"], "usados": round(e["tpm_limite"] - tpm_rest), "restantes": round(tpm_rest),
            "se_recupera_en_s": round(tpm_falta, 1),
        },
        "dia": {
            "limite": e["tpd_limite"], "usados": round(tpd_usado), "restantes": round(max(0.0, e["tpd_limite"] - tpd_usado)),
            "se_recupera_por_minuto": round(tasa * 60), "se_recupera_en_s": round(tpd_usado / tasa) if tasa else 0,
            "sincronizado_con_groq": e["tpd_sincronizado"],
        },
        "solicitudes_dia": None if rpd_rest is None else {
            "limite": e["rpd_limite"], "usados": round(e["rpd_limite"] - rpd_rest), "restantes": round(rpd_rest),
            "se_recupera_en_s": round(rpd_falta, 1),
        },
        "ultima_llamada": e["ultima_llamada"],
        "ahora": ahora,
    }


# ---- Persistencia ------------------------------------------------------------

async def cargar():
    global _cargado, _estado
    if _cargado:
        return
    _cargado = True
    try:
        from sqlalchemy import select
        from app.dependencies.database import AsyncSessionLocal
        from app.models.uso_ia import UsoIA
        async with AsyncSessionLocal() as db:
            fila = (await db.execute(select(UsoIA).where(UsoIA.id == "groq"))).scalar_one_or_none()
            if fila and fila.datos:
                guardado = json.loads(fila.datos)
                _estado = {**_nuevo_estado(time.time()), **guardado}
    except Exception as err:
        logger.warning(f"No se pudo leer el uso de la IA guardado: {err}")


async def guardar():
    try:
        from app.dependencies.database import AsyncSessionLocal
        from app.models.uso_ia import UsoIA
        async with AsyncSessionLocal() as db:
            fila = await db.get(UsoIA, "groq")
            if fila is None:
                fila = UsoIA(id="groq")
                db.add(fila)
            fila.datos = json.dumps(estado())
            await db.commit()
    except Exception as err:
        logger.warning(f"No se pudo guardar el uso de la IA: {err}")


async def al_recibir_respuesta(respuesta):
    """Gancho de httpx: se ejecuta con cada respuesta de la IA."""
    try:
        await cargar()
        ahora = time.time()
        registrar_cabeceras(respuesta.headers, ahora)
        if "text/event-stream" in respuesta.headers.get("content-type", ""):
            return
        await respuesta.aread()
        if respuesta.status_code == 200:
            uso = (respuesta.json() or {}).get("usage") or {}
            registrar_tokens(uso.get("total_tokens", 0), ahora)
        elif respuesta.status_code == 429:
            registrar_error_cuota(respuesta.text, ahora)
        await guardar()
    except Exception as err:  # medir el consumo nunca debe romper la llamada
        logger.warning(f"No se pudo registrar el uso de la IA: {err}")
