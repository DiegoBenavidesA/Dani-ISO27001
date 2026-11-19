"""Sala de Auditoría: lo que la empresa le muestra al auditor externo.

- Carpetas por cláusula ISO 27001 (4 a 10 y Anexo A) con el puntaje del
  Análisis de Brechas, los documentos de esa cláusula y las evidencias.
- Vista del auditor: el servidor entrega solo documentos publicados. Para el
  rol auditor esa vista es obligatoria; no depende de un interruptor en pantalla.
- Registro de actividad con verificación de la cadena de hashes.
- Paquete ZIP que respeta las carpetas elegidas y si se incluye el registro.
"""
import csv
import html
import io
import re
import zipfile
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import RequireRole, get_current_org
from app.dependencies.database import get_db
from app.dependencies.tenant import scope_to_org
from app.models.assessment_answer import AssessmentAnswer
from app.models.assessment_question import AssessmentQuestion
from app.models.document import Document, DocumentStatus
from app.models.evidence import Evidence
from app.models.organization import Organization
from app.models.registro_actividad import RegistroActividad
from app.models.user import User
from app.services.document_catalog import DOCUMENTOS
from app.services.registro import NOMBRE_ACCION, registrar, verificar_cadena

router = APIRouter(prefix="/api/sala-auditoria", tags=["Sala de Auditoría"])

# Dueño, administrador, encargado y auditor (superadmin y owner pasan siempre).
PUEDEN_VER = RequireRole(["admin", "manager", "auditor"])

CLAUSULAS = [
    ("4", "Contexto de la organización"), ("5", "Liderazgo"), ("6", "Planificación"),
    ("7", "Apoyo"), ("8", "Operación"), ("9", "Evaluación del desempeño"), ("10", "Mejora"),
    ("A", "Anexo A: controles"),
]
VALOR_VEREDICTO = {"cumple": 1.0, "parcial": 0.5, "no_cumple": 0.0, "sin_evidencia": 0.0}
NOMBRE_ESTADO = {"draft": "Borrador", "review": "En revisión", "approved": "Aprobado", "published": "Publicado"}


def clausula_de_codigo(codigo: str) -> str | None:
    """'4.1' -> '4'; '10.2' -> '10'; 'A.5.1' -> 'A'."""
    codigo = (codigo or "").strip()
    if codigo.startswith("A."):
        return "A"
    m = re.match(r"^(\d+)", codigo)
    return m.group(1) if m and m.group(1) in {c for c, _ in CLAUSULAS} else None


def clausula_de_documento(chapter_id: str) -> str | None:
    """Los documentos del generador se guardan como 'chapter_<clave del catálogo>'."""
    doc = DOCUMENTOS.get((chapter_id or "").removeprefix("chapter_"))
    if not doc or doc["marco"] != "iso27001":
        return None
    return clausula_de_codigo(doc["clausula"])


def puntajes_por_clausula(preguntas: list, respuestas: dict) -> dict:
    """preguntas: [(id, codigo)]; respuestas: {question_id: veredicto}.
    Mismo cálculo que el Resultado del Análisis de Brechas: Sí = 1, Parcial = 0,5,
    No o sin evidencia = 0; 'No aplica' no cuenta."""
    salida = {c: {"total_preguntas": 0, "evaluadas": 0, "cumplen": 0, "suma": 0.0} for c, _ in CLAUSULAS}
    for qid, codigo in preguntas:
        c = clausula_de_codigo(codigo)
        if not c:
            continue
        s = salida[c]
        veredicto = respuestas.get(qid)
        if veredicto == "no_aplica":
            continue
        s["total_preguntas"] += 1
        if veredicto in VALOR_VEREDICTO:
            s["evaluadas"] += 1
            s["suma"] += VALOR_VEREDICTO[veredicto]
            s["cumplen"] += veredicto == "cumple"
    for s in salida.values():
        s["puntaje"] = round(s["suma"] / s["evaluadas"] * 100) if s["evaluadas"] else None
        del s["suma"]
    return salida


def _fecha(d) -> str | None:
    return d.strftime("%d-%m-%Y") if d else None


def _vista_auditor(current_user: dict, pedido: bool) -> bool:
    return True if current_user.get("role") == "auditor" else pedido


async def _datos(db: AsyncSession, org_id: str, vista_auditor: bool) -> dict:
    org = (await db.execute(select(Organization).where(Organization.id == org_id))).scalar_one_or_none()
    meta = org.meta_cumplimiento if org and org.meta_cumplimiento else 85

    preguntas = (await db.execute(
        select(AssessmentQuestion.id, AssessmentQuestion.codigo).where(AssessmentQuestion.marco == "iso27001")
    )).all()
    respuestas = dict((await db.execute(
        select(AssessmentAnswer.question_id, AssessmentAnswer.veredicto).where(AssessmentAnswer.organization_id == org_id)
    )).all())
    puntajes = puntajes_por_clausula(preguntas, respuestas)

    docs = (await db.execute(scope_to_org(select(Document), Document, org_id).order_by(Document.title))).scalars().all()
    if vista_auditor:
        docs = [d for d in docs if d.status == DocumentStatus.PUBLISHED]
    docs_por_clausula = {}
    for d in docs:
        c = clausula_de_documento(d.chapter_id)
        if c:
            estado = d.status.value if hasattr(d.status, "value") else d.status
            docs_por_clausula.setdefault(c, []).append({
                "id": d.id, "chapter_id": d.chapter_id, "titulo": d.title, "version": d.version,
                "estado": estado, "estado_nombre": NOMBRE_ESTADO.get(estado, estado),
                "aprobado_por": d.aprobado_por, "aprobado_en": _fecha(d.aprobado_en),
                "publicado_en": _fecha(d.publicado_en), "_doc": d,
            })

    evidencias = (await db.execute(
        scope_to_org(select(Evidence), Evidence, org_id).order_by(Evidence.created_at.desc())
    )).scalars().all()
    ids = {e.uploaded_by for e in evidencias if e.uploaded_by}
    nombres = dict((await db.execute(select(User.id, User.full_name).where(User.id.in_(ids)))).all()) if ids else {}

    carpetas = []
    for c, nombre in CLAUSULAS:
        p = puntajes[c]
        estado = "sin_evaluar" if p["puntaje"] is None else ("cumple" if p["puntaje"] >= meta else "bajo")
        carpetas.append({
            "id": c, "nombre": f"{c}. {nombre}" if c != "A" else nombre, "tipo": "clausula",
            "puntaje": p["puntaje"], "estado": estado, "evaluadas": p["evaluadas"],
            "total_preguntas": p["total_preguntas"], "cumplen": p["cumplen"],
            "documentos": docs_por_clausula.get(c, []),
        })
    carpetas.append({
        "id": "evidencias", "nombre": "Evidencias de la empresa", "tipo": "evidencias",
        "evidencias": [{
            "id": e.id, "nombre": e.title or e.file_name, "fecha": _fecha(e.created_at),
            "subido_por": nombres.get(e.uploaded_by), "tamano": e.file_size or 0,
            "archivo_guardado": bool(e.file_url) and not e.file_url.startswith("local:"), "_ev": e,
        } for e in evidencias],
    })
    return {"empresa": org.nombre if org else "", "meta": meta, "vista_auditor": vista_auditor, "carpetas": carpetas}


def _sin_internos(datos: dict) -> dict:
    """Quita los objetos de la base de datos antes de responder."""
    for carpeta in datos["carpetas"]:
        for d in carpeta.get("documentos", []):
            d.pop("_doc", None)
        for e in carpeta.get("evidencias", []):
            e.pop("_ev", None)
    return datos


@router.get("/carpetas")
async def carpetas(
    vista_auditor: bool = True,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(PUEDEN_VER),
    db: AsyncSession = Depends(get_db),
):
    return _sin_internos(await _datos(db, org_id, _vista_auditor(current_user, vista_auditor)))


# ------------------------------------------------------------ registro
async def _filas_registro(db, org_id: str):
    return (await db.execute(
        select(RegistroActividad).where(RegistroActividad.organization_id == org_id)
        .order_by(RegistroActividad.fecha.asc(), RegistroActividad.id.asc())
    )).scalars().all()


def _fila_json(f: RegistroActividad) -> dict:
    return {
        "id": f.id, "fecha": f.fecha.strftime("%d-%m-%Y %H:%M") + " UTC", "fecha_iso": f.fecha.isoformat() + "Z",
        "usuario": f.usuario_nombre or f.usuario_email or "Sistema", "email": f.usuario_email, "rol": f.rol,
        "ip": f.ip, "accion": f.accion, "accion_nombre": NOMBRE_ACCION.get(f.accion, f.accion),
        "tipo_recurso": f.tipo_recurso, "recurso": f.recurso, "detalle": f.detalle,
    }


@router.get("/registro")
async def registro(
    accion: str | None = None,
    dias: int | None = Query(None, ge=1, le=3650),
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(PUEDEN_VER),
    db: AsyncSession = Depends(get_db),
):
    filas = await _filas_registro(db, org_id)
    integridad = verificar_cadena(filas)
    desde = datetime.utcnow() - timedelta(days=dias) if dias else None
    visibles = [f for f in filas if (not accion or f.accion == accion) and (not desde or f.fecha >= desde)]
    visibles.reverse()  # lo más reciente primero
    return {
        "filas": [_fila_json(f) for f in visibles[:500]], "total": len(visibles),
        "desde": filas[0].fecha.strftime("%d-%m-%Y") if filas else None,
        "integridad": integridad,
    }


def _csv_registro(filas) -> bytes:
    salida = io.StringIO()
    w = csv.writer(salida, delimiter=";")
    w.writerow(["Fecha (UTC)", "Usuario", "Correo", "Rol", "IP", "Acción", "Tipo", "Recurso", "Detalle", "Hash"])
    for f in filas:
        w.writerow([f.fecha.strftime("%d-%m-%Y %H:%M:%S"), f.usuario_nombre or "", f.usuario_email or "", f.rol or "",
                    f.ip or "", NOMBRE_ACCION.get(f.accion, f.accion), f.tipo_recurso, f.recurso, f.detalle or "", f.hash])
    return ("\ufeff" + salida.getvalue()).encode("utf-8")  # BOM para que Excel lea las tildes


@router.get("/registro/csv")
async def registro_csv(
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(PUEDEN_VER),
    db: AsyncSession = Depends(get_db),
):
    filas = await _filas_registro(db, org_id)
    await registrar(db, org_id, current_user, "exporto", "registro", "Registro de actividad", f"{len(filas)} filas en CSV")
    return StreamingResponse(io.BytesIO(_csv_registro(filas)), media_type="text/csv; charset=utf-8",
                             headers={"Content-Disposition": "attachment; filename=Registro_de_actividad.csv"})


# ------------------------------------------------------------ paquete
def markdown_a_html(texto: str) -> str:
    """Conversión sencilla del Markdown que produce el generador (títulos,
    listas, tablas, negritas y cursivas) para armar el PDF."""
    def en_linea(s: str) -> str:
        s = html.escape(s)
        s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
        return re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<i>\1</i>", s)

    partes, lista, tabla, parrafo = [], None, [], []

    def cerrar():
        nonlocal lista, tabla, parrafo
        if parrafo:
            partes.append(f"<p>{en_linea(' '.join(parrafo))}</p>"); parrafo = []
        if lista:
            partes.append(f"</{lista}>"); lista = None
        if tabla:
            filas = [f for f in tabla if not re.fullmatch(r"\|?[\s:\-|]+\|?", f)]
            html_filas = []
            for i, f in enumerate(filas):
                celdas = [c.strip() for c in f.strip().strip("|").split("|")]
                etiqueta = "th" if i == 0 else "td"
                html_filas.append("<tr>" + "".join(f"<{etiqueta}>{en_linea(c)}</{etiqueta}>" for c in celdas) + "</tr>")
            partes.append("<table>" + "".join(html_filas) + "</table>"); tabla = []

    for linea in (texto or "").splitlines():
        l = linea.rstrip()
        m_titulo = re.match(r"^(#{1,6})\s+(.*)", l)
        m_lista = re.match(r"^\s*[-*]\s+(.*)", l)
        m_num = re.match(r"^\s*\d+[.)]\s+(.*)", l)
        if not l.strip():
            cerrar()
        elif l.lstrip().startswith("|"):
            if parrafo or lista:
                t = tabla; tabla = []; cerrar(); tabla = t
            tabla.append(l)
        elif m_titulo:
            cerrar(); n = min(len(m_titulo.group(1)), 4)
            partes.append(f"<h{n}>{en_linea(m_titulo.group(2))}</h{n}>")
        elif m_lista or m_num:
            tipo = "ul" if m_lista else "ol"
            if parrafo or tabla or (lista and lista != tipo):
                cerrar()
            if not lista:
                partes.append(f"<{tipo}>"); lista = tipo
            partes.append(f"<li>{en_linea((m_lista or m_num).group(1))}</li>")
        else:
            if lista or tabla:
                cerrar()
            parrafo.append(l.strip())
    cerrar()
    return "\n".join(partes)


CSS_PDF = """
body { font-family: sans-serif; font-size: 10pt; line-height: 1.4; }
h1 { font-size: 16pt; } h2 { font-size: 13pt; } h3, h4 { font-size: 11pt; }
table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #999; padding: 3px; font-size: 9pt; }
th { background: #eee; } .meta { color: #555; font-size: 9pt; }
"""


def pdf_desde_html(cuerpo: str) -> bytes:
    import fitz
    salida = io.BytesIO()
    story = fitz.Story(html=f"<body>{cuerpo}</body>", user_css=CSS_PDF)
    escritor = fitz.DocumentWriter(salida)
    pagina = fitz.paper_rect("a4")
    area = pagina + (50, 50, -50, -50)
    mas = True
    while mas:
        dispositivo = escritor.begin_page(pagina)
        mas, _ = story.place(area)
        story.draw(dispositivo)
        escritor.end_page()
    escritor.close()
    return salida.getvalue()


def _nombre_archivo(texto: str) -> str:
    limpio = "".join(c if c.isalnum() or c in " ._-" else "_" for c in (texto or "documento")).strip()
    return re.sub(r"\s+", "_", limpio)[:90] or "documento"


def _tabla_html(encabezados: list, filas: list) -> str:
    cab = "".join(f"<th>{html.escape(str(h))}</th>" for h in encabezados)
    cuerpo = "".join("<tr>" + "".join(f"<td>{html.escape(str(c if c is not None else ''))}</td>" for c in f) + "</tr>" for f in filas)
    return f"<table><tr>{cab}</tr>{cuerpo}</table>"


@router.get("/paquete")
async def paquete(
    carpetas: str = Query("4,5,6,7,8,9,10,A,evidencias"),
    incluir_registro: bool = True,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(PUEDEN_VER),
    db: AsyncSession = Depends(get_db),
):
    """ZIP para el auditor. Solo lleva documentos PUBLICADOS: son la versión
    oficial; los borradores no se entregan."""
    from app.models.risk import Risk
    from app.routes.documents import _firmas_por_documento
    from app.services.storage_service import storage_service

    elegidas = [c.strip() for c in carpetas.split(",") if c.strip()]
    datos = await _datos(db, org_id, vista_auditor=True)
    por_id = {c["id"]: c for c in datos["carpetas"]}
    ahora = datetime.utcnow()
    contenido = []  # (ruta, descripción) para el resumen

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for c, nombre in CLAUSULAS:
            if c not in elegidas:
                continue
            carpeta = por_id[c]
            base = f"Clausula_{c}_{_nombre_archivo(nombre)}" if c != "A" else "Anexo_A_Controles"
            for d in carpeta["documentos"]:
                doc = d["_doc"]
                encabezado = (f"<h1>{html.escape(doc.title)}</h1><p class='meta'>Versión {html.escape(doc.version or '')}"
                              f" · Aprobado por {html.escape(doc.aprobado_por or 'sin registro')} el {d['aprobado_en'] or '-'}"
                              f" · Publicado el {d['publicado_en'] or '-'}</p>")
                ruta = f"{base}/{_nombre_archivo(doc.title)}_{doc.version}.pdf"
                zf.writestr(ruta, pdf_desde_html(encabezado + markdown_a_html(doc.content or "")))
                contenido.append((ruta, f"Documento publicado {doc.version}"))
            if c == "6":
                riesgos = (await db.execute(scope_to_org(select(Risk), Risk, org_id).order_by(Risk.title))).scalars().all()
                filas = [(r.title, r.likelihood, r.impact, r.risk_level.value if r.risk_level else "",
                          r.status.value if r.status else "", r.owner, _fecha(r.due_date) or "") for r in riesgos]
                ruta = f"{base}/Registro_de_riesgos.pdf"
                zf.writestr(ruta, pdf_desde_html(
                    f"<h1>Registro de riesgos</h1><p class='meta'>{html.escape(datos['empresa'])} · {len(riesgos)} riesgos · ISO 27001, 6.1.2 y 8.2</p>"
                    + _tabla_html(["Riesgo", "Prob.", "Impacto", "Nivel", "Estado", "Responsable", "Plazo"], filas)))
                contenido.append((ruta, f"{len(riesgos)} riesgos"))
            if c == "7":
                publicados = [d["_doc"] for cc in datos["carpetas"] for d in cc.get("documentos", [])]
                firmas = await _firmas_por_documento(db, publicados, org_id)
                filas = [(d.title, d.version, f"{firmas.get(d.id, {}).get('aceptaron', 0)} de {firmas.get(d.id, {}).get('total', 0)}")
                         for d in publicados]
                ruta = f"{base}/Aceptacion_de_politicas.pdf"
                zf.writestr(ruta, pdf_desde_html(
                    "<h1>Aceptación de políticas por los trabajadores</h1><p class='meta'>ISO 27001, 7.3 · solo cuenta la versión vigente</p>"
                    + _tabla_html(["Documento", "Versión", "Aceptaron"], filas)))
                contenido.append((ruta, "Concientización"))

        if "evidencias" in elegidas:
            evs = por_id["evidencias"]["evidencias"]
            zf.writestr("Evidencias/Indice_de_evidencias.pdf", pdf_desde_html(
                f"<h1>Índice de evidencias</h1><p class='meta'>{len(evs)} evidencias</p>"
                + _tabla_html(["Evidencia", "Subida", "Subida por", "Archivo"],
                              [(e["nombre"], e["fecha"], e["subido_por"] or "", "Incluido" if e["archivo_guardado"] else "Solo texto")
                               for e in evs])))
            usados = set()
            for e in evs:
                if not e["archivo_guardado"]:
                    continue
                try:
                    datos_archivo = await storage_service.download(e["_ev"].file_url)
                except Exception:
                    continue
                nombre = _nombre_archivo(e["_ev"].file_name or e["nombre"])
                base_n, n = nombre, 2
                while nombre in usados:
                    nombre = f"{n}_{base_n}"; n += 1
                usados.add(nombre)
                zf.writestr(f"Evidencias/{nombre}", datos_archivo)
            contenido.append(("Evidencias/", f"{len(evs)} evidencias"))

        integridad = None
        if incluir_registro:
            filas = await _filas_registro(db, org_id)
            integridad = verificar_cadena(filas)
            zf.writestr("Registro_de_actividad.csv", _csv_registro(filas))
            contenido.append(("Registro_de_actividad.csv", f"{len(filas)} acciones"))

        puntajes = [(c["nombre"], f"{c['puntaje']} %" if c["puntaje"] is not None else "Sin evaluar",
                     f"{c['evaluadas']} de {c['total_preguntas']}", len(c["documentos"]))
                    for c in datos["carpetas"] if c["tipo"] == "clausula" and c["id"] in elegidas]
        resumen = (f"<h1>Paquete de auditoría ISO 27001</h1><p class='meta'>{html.escape(datos['empresa'])} · "
                   f"generado el {ahora.strftime('%d-%m-%Y %H:%M')} UTC por {html.escape(current_user.get('sub') or '')}</p>"
                   "<h2>Cumplimiento por cláusula</h2>"
                   + _tabla_html(["Cláusula", "Puntaje", "Preguntas evaluadas", "Documentos publicados"], puntajes)
                   + f"<p class='meta'>Meta de la empresa: {datos['meta']} %. Solo se incluyen documentos publicados.</p>"
                   + "<h2>Contenido</h2>" + _tabla_html(["Archivo", "Detalle"], contenido))
        if integridad:
            resumen += ("<h2>Registro de actividad</h2><p>" + (
                f"Cadena íntegra: {integridad['verificadas']} acciones verificadas." if integridad["integra"] else
                f"Atención: la cadena no calza desde la acción del {integridad['primera_alterada']['fecha']}.") + "</p>")
        zf.writestr("00_Resumen.pdf", pdf_desde_html(resumen))

    await registrar(db, org_id, current_user, "exporto", "paquete", "Paquete de auditoría",
                    "Carpetas: " + ", ".join(elegidas) + (" · con registro de actividad" if incluir_registro else ""))
    buf.seek(0)
    nombre_zip = f"Paquete_Auditoria_{_nombre_archivo(datos['empresa'])}_{ahora.strftime('%Y-%m-%d')}.zip"
    return StreamingResponse(buf, media_type="application/zip",
                             headers={"Content-Disposition": f"attachment; filename={nombre_zip}",
                                      "Access-Control-Expose-Headers": "Content-Disposition"})
