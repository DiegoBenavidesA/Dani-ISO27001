"""Documentos que genera el Generador de Docs y el contexto que recibe la IA.

ISO 27001 no pide "un documento por cláusula": pide información documentada
concreta (alcance, política, proceso de riesgos, objetivos, etc.). La lista
de abajo sigue esos documentos. Los dos de la Ley 21.719 son los que la ley
pide demostrar: cómo se tratan los datos y cómo se gestionan las
vulneraciones.

Para que el borrador no sea genérico, la IA recibe:
  - el nombre de la empresa,
  - las respuestas del Análisis de Brechas de las preguntas relacionadas
    (veredicto y justificación de la IA),
  - fragmentos de las evidencias subidas que más se relacionan,
  - en los documentos de riesgos, los riesgos del Mapa de Riesgos.
Lo que no esté respaldado por esa información debe quedar marcado como
PENDIENTE en el texto, no inventado.
"""
import re
import unicodedata

from sqlalchemy import select

DOCUMENTOS = {
    # ------------------------------------------------------------ ISO 27001
    "iso_alcance": {
        "marco": "iso27001", "clausula": "4.3", "titulo": "Alcance del SGSI",
        "codigos": ["4.1", "4.2", "4.3", "4.4"],
        "secciones": ["Propósito", "Contexto interno y externo", "Partes interesadas y sus requisitos",
                      "Alcance: procesos, sedes, sistemas y personas incluidos", "Exclusiones y su justificación",
                      "Interfaces y dependencias con terceros"],
    },
    "iso_politica": {
        "marco": "iso27001", "clausula": "5.2", "titulo": "Política de Seguridad de la Información",
        "codigos": ["5.1", "5.2", "5.3", "A.5.1", "A.5.2", "A.5.4"],
        "secciones": ["Propósito", "Alcance", "Compromiso de la dirección", "Principios y objetivos generales",
                      "Roles y responsabilidades", "Cumplimiento y sanciones", "Revisión de la política"],
    },
    "iso_riesgos": {
        "marco": "iso27001", "clausula": "6.1.2 y 6.1.3", "titulo": "Metodología de Evaluación y Tratamiento de Riesgos",
        "codigos": ["6.1", "6.1.3", "8.2", "8.3"], "usa_riesgos": True,
        "secciones": ["Propósito y alcance", "Criterios de aceptación del riesgo", "Escala de probabilidad e impacto",
                      "Identificación y análisis de riesgos", "Opciones de tratamiento", "Declaración de Aplicabilidad",
                      "Responsables y frecuencia de revisión"],
    },
    "iso_plan_tratamiento": {
        "marco": "iso27001", "clausula": "6.1.3 e) y 8.3", "titulo": "Plan de Tratamiento de Riesgos",
        "codigos": ["6.1.3", "8.3"], "usa_riesgos": True,
        "secciones": ["Propósito", "Riesgos a tratar y su nivel", "Controles seleccionados por riesgo",
                      "Responsables y plazos", "Riesgo residual y aceptación por los dueños del riesgo"],
    },
    "iso_objetivos": {
        "marco": "iso27001", "clausula": "6.2", "titulo": "Objetivos de Seguridad de la Información",
        "codigos": ["6.2", "9.1"],
        "secciones": ["Propósito", "Objetivos medibles", "Indicadores y metas", "Responsables y recursos",
                      "Plazos y forma de evaluación"],
    },
    "iso_auditoria": {
        "marco": "iso27001", "clausula": "9.2", "titulo": "Programa de Auditoría Interna",
        "codigos": ["9.2"],
        "secciones": ["Propósito y alcance", "Frecuencia y planificación", "Criterios y métodos",
                      "Selección e independencia de los auditores", "Informe de resultados y seguimiento"],
    },
    "iso_revision": {
        "marco": "iso27001", "clausula": "9.3", "titulo": "Procedimiento de Revisión por la Dirección",
        "codigos": ["9.3", "9.1"],
        "secciones": ["Propósito", "Frecuencia y participantes", "Entradas de la revisión",
                      "Resultados y decisiones", "Registro (acta) de la revisión"],
    },
    "iso_mejora": {
        "marco": "iso27001", "clausula": "10.1 y 10.2", "titulo": "Procedimiento de No Conformidades y Acción Correctiva",
        "codigos": ["10.1", "10.2"],
        "secciones": ["Propósito y alcance", "Detección y registro de no conformidades", "Análisis de causa",
                      "Acciones correctivas y plazos", "Verificación de eficacia", "Mejora continua"],
    },
    # ------------------------------------------------------------ Ley 21.719
    "ley_pol": {
        "marco": "ley21719", "clausula": "Ley 21.719", "titulo": "Política de Tratamiento de Datos Personales",
        "claves": ["principio", "licitud", "consentimiento", "categorias especiales", "derecho", "interesado",
                   "titular", "registro", "tratamiento de datos personales", "encargado", "transferencia",
                   "responsabilidad", "delegado", "gobernanza", "informacion"],
        "secciones": ["Identificación del responsable y contacto", "Datos que se tratan y con qué finalidad",
                      "Base de licitud de cada tratamiento", "Datos sensibles y de niños, niñas y adolescentes",
                      "Comunicación a terceros, encargados y transferencias internacionales",
                      "Plazos de conservación", "Derechos de los titulares y cómo ejercerlos",
                      "Medidas de seguridad", "Actualización de la política"],
    },
    "ley_bre": {
        "marco": "ley21719", "clausula": "Ley 21.719", "titulo": "Protocolo de Gestión de Vulneraciones de Seguridad",
        "claves": ["brecha", "vulneracion", "seguridad"],
        "secciones": ["Propósito y alcance", "Qué se considera una vulneración", "Detección y registro",
                      "Evaluación de gravedad y del riesgo para los titulares", "Contención y mitigación",
                      "Comunicación a la Agencia de Protección de Datos Personales",
                      "Comunicación a los titulares afectados", "Roles y responsables", "Lecciones aprendidas"],
    },
}

VEREDICTOS = {"cumple": "Cumple", "parcial": "Parcial", "no_cumple": "No cumple",
              "sin_evidencia": "Sin evidencia", "no_aplica": "No aplica"}

# Groq (plan gratuito, gpt-oss-120b) permite 8.000 tokens por minuto, y una
# sola llamada no puede pasarse de eso: entrada + respuesta (hasta 3.000).
# Por eso la información de la empresa se acota a unos 13.000 caracteres
# (cerca de 3.500 tokens) más las instrucciones.
MAX_RESPUESTAS = 40
MAX_CARACTERES_RESPUESTAS = 7000
MAX_EVIDENCIAS = 3
MAX_TEXTO_EVIDENCIA = 2000


def _sin_acentos(s: str) -> str:
    return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()


def pregunta_aplica(doc: dict, codigo: str, categoria: str) -> bool:
    """¿La pregunta del Análisis de Brechas se relaciona con este documento?"""
    if doc["marco"] == "iso27001":
        return any(codigo == c or codigo.startswith(c + ".") for c in doc["codigos"])
    cat = _sin_acentos(categoria)
    return any(k in cat for k in doc["claves"])


def _palabras(texto: str) -> set:
    return {p for p in re.findall(r"[a-z]{5,}", _sin_acentos(texto))}


def elegir_evidencias(evidencias: list, palabras_doc: set) -> list:
    """Ordena las evidencias (nombre, texto) por cuántas palabras del documento
    comparten y devuelve las más relacionadas con al menos 3 coincidencias."""
    puntuadas = []
    for nombre, texto in evidencias:
        comunes = len(_palabras(texto[:20000]) & palabras_doc)
        if comunes >= 3:
            puntuadas.append((comunes, nombre, texto))
    puntuadas.sort(key=lambda x: -x[0])
    return [(n, t) for _, n, t in puntuadas[:MAX_EVIDENCIAS]]


async def armar_contexto(db, org_id: str, doc_id: str) -> dict:
    """Junta lo que la empresa ya tiene sobre este documento."""
    from app.models.organization import Organization
    from app.models.assessment_question import AssessmentQuestion
    from app.models.assessment_answer import AssessmentAnswer
    from app.models.evidence import Evidence
    from app.models.risk import Risk
    from app.services.text_extraction import texto_guardado_valido

    doc = DOCUMENTOS[doc_id]
    org = (await db.execute(select(Organization).where(Organization.id == org_id))).scalar_one_or_none()

    preguntas = (await db.execute(
        select(AssessmentQuestion).where(AssessmentQuestion.marco == doc["marco"]).order_by(AssessmentQuestion.orden)
    )).scalars().all()
    preguntas = [q for q in preguntas if pregunta_aplica(doc, q.codigo, q.categoria)]
    respuestas = {}
    if preguntas:
        filas = (await db.execute(select(AssessmentAnswer).where(
            AssessmentAnswer.organization_id == org_id,
            AssessmentAnswer.question_id.in_([q.id for q in preguntas]),
        ))).scalars().all()
        respuestas = {a.question_id: a for a in filas}

    lineas_resp = []
    for q in preguntas:
        a = respuestas.get(q.id)
        if not a:
            continue
        linea = f"- [{q.codigo}] {q.pregunta} -> {VEREDICTOS.get(a.veredicto, a.veredicto)}"
        if a.justificacion:
            linea += f". {a.justificacion.strip()[:160]}"
        lineas_resp.append(linea)
    # Primero las que no se cumplen: son las que el documento debe marcar.
    orden = {"No cumple": 0, "Sin evidencia": 1, "Parcial": 2, "Cumple": 3}
    lineas_resp.sort(key=lambda l: min((v for k, v in orden.items() if f"-> {k}" in l), default=4))
    acotadas, total = [], 0
    for linea in lineas_resp[:MAX_RESPUESTAS]:
        if total + len(linea) > MAX_CARACTERES_RESPUESTAS:
            break
        acotadas.append(linea)
        total += len(linea) + 1
    lineas_resp = acotadas

    evidencias = []
    for ev in (await db.execute(select(Evidence).where(Evidence.organization_id == org_id))).scalars().all():
        nombre = ev.file_name or ev.title or "documento"
        texto = texto_guardado_valido(ev.extracted_text, nombre)
        if texto:
            evidencias.append((nombre, texto))
    palabras_doc = _palabras(" ".join([doc["titulo"], *doc["secciones"], *(q.pregunta for q in preguntas)]))
    elegidas = elegir_evidencias(evidencias, palabras_doc)

    riesgos = []
    if doc.get("usa_riesgos"):
        for r in (await db.execute(select(Risk).where(Risk.organization_id == org_id))).scalars().all():
            nivel = r.risk_level.value if hasattr(r.risk_level, "value") else r.risk_level
            riesgos.append(f"- {r.title} (probabilidad {r.likelihood}, impacto {r.impact}, nivel {nivel})")

    return {
        "empresa": org.nombre if org else "la empresa",
        "respuestas": lineas_resp,
        "evidencias": elegidas,
        "riesgos": riesgos[:40],
        "preguntas_relacionadas": len(preguntas),
    }


def armar_prompt(doc_id: str, ctx: dict) -> str:
    doc = DOCUMENTOS[doc_id]
    if doc["marco"] == "iso27001":
        rol = "consultor experto en ISO/IEC 27001:2022"
        marco = f"ISO/IEC 27001:2022, cláusula {doc['clausula']}"
    else:
        rol = "abogado experto en protección de datos personales en Chile"
        marco = "la Ley N° 21.719 de Protección de Datos Personales de Chile"
    respuestas = "\n".join(ctx["respuestas"]) or "La empresa todavía no responde estas preguntas del Análisis de Brechas."
    evidencias = "\n\n".join(
        f"### {nombre}\n{texto[:MAX_TEXTO_EVIDENCIA]}" for nombre, texto in ctx["evidencias"]
    ) or "No hay evidencias relacionadas subidas."
    riesgos = ("\nRIESGOS REGISTRADOS EN EL MAPA DE RIESGOS:\n" + ("\n".join(ctx["riesgos"]) or "Ninguno registrado.")) if DOCUMENTOS[doc_id].get("usa_riesgos") else ""
    secciones = "\n".join(f"## {i}. {s}" for i, s in enumerate(doc["secciones"], 1))
    return f"""Actúa como {rol}. Redacta en español de Chile el documento "{doc['titulo']}" de la empresa {ctx['empresa']}, para cumplir {marco}.

Usa la información real de la empresa que viene abajo. Reglas:
- Lo que la información respalda, escríbelo como práctica vigente de {ctx['empresa']}.
- Donde una respuesta dice "No cumple", "Parcial" o "Sin evidencia", o donde falte un dato (nombres, cargos, plazos, sistemas), no lo inventes: escribe una línea que empiece con "PENDIENTE:" indicando qué debe definir la empresa.
- No cites artículos ni números de la norma o de la ley que no estés seguro de que existen.
- Usa títulos en Markdown con exactamente estas secciones, en este orden:
# {doc['titulo']}
{secciones}

RESPUESTAS DEL ANÁLISIS DE BRECHAS RELACIONADAS:
{respuestas}

FRAGMENTOS DE EVIDENCIAS SUBIDAS POR LA EMPRESA:
{evidencias}
{riesgos}
"""


def fuentes(ctx: dict) -> dict:
    """Resumen de lo que se usó, para mostrarlo bajo el borrador."""
    return {
        "respuestas": len(ctx["respuestas"]),
        "preguntas_relacionadas": ctx["preguntas_relacionadas"],
        "evidencias": [n for n, _ in ctx["evidencias"]],
        "riesgos": len(ctx["riesgos"]),
    }
