"""Auditoría externa: lo que la empresa le entrega al auditor externo.

- Documentos del Generador con su referencia a la norma. El auditor solo ve los
  publicados (el servidor lo fuerza por su rol); la empresa ve todos, marcados.
- Evidencias de la empresa.
- Registro de actividad con verificación de la cadena de hashes.
- Paquete ZIP con una carpeta de documentos y otra de evidencias.

El puntaje del Análisis de Brechas no se muestra aquí: es una autoevaluación
interna de la empresa y el auditor saca sus propias conclusiones.
"""
import csv
import html
import io
import re
import zipfile
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import RequireRole, get_current_org
from app.dependencies.database import get_db
from app.dependencies.tenant import scope_to_org
from app.models.document import Document, DocumentStatus
from app.models.evidence import Evidence
from app.models.organization import Organization
from app.models.registro_actividad import RegistroActividad
from app.models.user import User
from app.services.document_catalog import DOCUMENTOS
from app.services.registro import NOMBRE_ACCION, registrar, verificar_cadena

router = APIRouter(prefix="/api/sala-auditoria", tags=["Auditoría externa"])

# Dueño, administrador, encargado y auditor (superadmin y owner pasan siempre).
PUEDEN_VER = RequireRole(["admin", "manager", "auditor"])

NOMBRE_ESTADO = {"draft": "Borrador", "review": "En revisión", "approved": "Aprobado", "published": "Publicado"}


def referencia_de_documento(chapter_id: str) -> str:
    """Qué exige el documento: 'ISO 27001, 4.3' o 'Ley 21.719' (los del
    Generador se guardan como 'chapter_<clave del catálogo>')."""
    doc = DOCUMENTOS.get((chapter_id or "").removeprefix("chapter_"))
    if not doc:
        return ""
    return f"ISO 27001, {doc['clausula']}" if doc["marco"] == "iso27001" else "Ley 21.719"


def _orden_catalogo(chapter_id: str) -> int:
    claves = list(DOCUMENTOS)
    clave = (chapter_id or "").removeprefix("chapter_")
    return claves.index(clave) if clave in claves else len(claves)


def _fecha(d) -> str | None:
    return d.strftime("%d-%m-%Y") if d else None


def _solo_publicados(current_user: dict) -> bool:
    """El auditor recibe solo lo publicado; la empresa ve también lo demás."""
    return current_user.get("role") == "auditor"


async def _contenido(db: AsyncSession, org_id: str, solo_publicados: bool) -> dict:
    org = (await db.execute(select(Organization).where(Organization.id == org_id))).scalar_one_or_none()

    docs = (await db.execute(scope_to_org(select(Document), Document, org_id))).scalars().all()
    if solo_publicados:
        docs = [d for d in docs if d.status == DocumentStatus.PUBLISHED]
    docs = sorted(docs, key=lambda d: (_orden_catalogo(d.chapter_id), d.title or ""))
    documentos = []
    for d in docs:
        estado = d.status.value if hasattr(d.status, "value") else d.status
        documentos.append({
            "id": d.id, "titulo": d.title, "referencia": referencia_de_documento(d.chapter_id),
            "version": d.version, "estado": estado, "estado_nombre": NOMBRE_ESTADO.get(estado, estado),
            "aprobado_por": d.aprobado_por, "aprobado_en": _fecha(d.aprobado_en),
            "publicado_en": _fecha(d.publicado_en), "_doc": d,
        })

    evidencias = (await db.execute(
        scope_to_org(select(Evidence), Evidence, org_id).order_by(Evidence.created_at.desc())
    )).scalars().all()
    ids = {e.uploaded_by for e in evidencias if e.uploaded_by}
    nombres = dict((await db.execute(select(User.id, User.full_name).where(User.id.in_(ids)))).all()) if ids else {}

    return {
        "empresa": org.nombre if org else "",
        "documentos": documentos,
        "evidencias": [{
            "id": e.id, "nombre": e.title or e.file_name, "fecha": _fecha(e.created_at),
            "subido_por": nombres.get(e.uploaded_by), "tamano": e.file_size or 0,
            "archivo_guardado": bool(e.file_url) and not e.file_url.startswith("local:"), "_ev": e,
        } for e in evidencias],
    }


def _sin_internos(datos: dict) -> dict:
    """Quita los objetos de la base de datos antes de responder."""
    for d in datos["documentos"]:
        d.pop("_doc", None)
    for e in datos["evidencias"]:
        e.pop("_ev", None)
    return datos


@router.get("/contenido")
async def contenido(
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(PUEDEN_VER),
    db: AsyncSession = Depends(get_db),
):
    return _sin_internos(await _contenido(db, org_id, _solo_publicados(current_user)))


# ------------------------------------------------------------ registro
async def _filas_registro(db, org_id: str):
    return (await db.execute(
        select(RegistroActividad).where(RegistroActividad.organization_id == org_id)
        .order_by(RegistroActividad.fecha.asc(), RegistroActividad.id.asc())
    )).scalars().all()


def _de_la_empresa(filas, current_user: dict | None = None):
    """Las acciones del superadmin (soporte de la plataforma) no son de la
    empresa: no las ve el auditor ni la empresa, y no van en el CSV ni en el
    paquete. Solo el propio superadmin las ve en pantalla. La verificación de
    la cadena se hace siempre sobre todas las filas."""
    if current_user and current_user.get("role") == "superadmin":
        return list(filas)
    return [f for f in filas if f.rol != "superadmin"]


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
    visibles = [f for f in _de_la_empresa(filas, current_user) if (not accion or f.accion == accion) and (not desde or f.fecha >= desde)]
    visibles.reverse()  # lo más reciente primero
    return {
        "filas": [_fila_json(f) for f in visibles[:500]], "total": len(visibles),
        "desde": filas[0].fecha.strftime("%d-%m-%Y") if filas else None,
        "incluye_soporte": current_user.get("role") == "superadmin",
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
    filas = _de_la_empresa(await _filas_registro(db, org_id))
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


PARTES = ("documentos", "riesgos", "aceptacion", "evidencias", "registro")


@router.get("/paquete")
async def paquete(
    incluir: str = Query(",".join(PARTES)),
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(PUEDEN_VER),
    db: AsyncSession = Depends(get_db),
):
    """ZIP para el auditor: Documentos/ (los publicados en PDF, el registro de
    riesgos y la aceptación de políticas) y Evidencias/. Nunca lleva borradores."""
    from app.models.risk import Risk
    from app.routes.documents import _firmas_por_documento
    from app.services.storage_service import storage_service

    partes = {p.strip() for p in incluir.split(",") if p.strip() in PARTES}
    datos = await _contenido(db, org_id, solo_publicados=True)
    ahora = datetime.utcnow()
    contenido = []  # (ruta, descripción) para el índice

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        if "documentos" in partes:
            for d in datos["documentos"]:
                doc = d["_doc"]
                encabezado = (f"<h1>{html.escape(doc.title)}</h1><p class='meta'>{html.escape(d['referencia'])} · Versión {html.escape(doc.version or '')}"
                              f" · Aprobado por {html.escape(doc.aprobado_por or 'sin registro')} el {d['aprobado_en'] or '-'}"
                              f" · Publicado el {d['publicado_en'] or '-'}</p>")
                ruta = f"Documentos/{_nombre_archivo(doc.title)}_{doc.version}.pdf"
                zf.writestr(ruta, pdf_desde_html(encabezado + markdown_a_html(doc.content or "")))
                contenido.append((ruta, f"{d['referencia']} · {doc.version}"))

        if "riesgos" in partes:
            riesgos = (await db.execute(scope_to_org(select(Risk), Risk, org_id).order_by(Risk.title))).scalars().all()
            filas = [(r.title, r.likelihood, r.impact, r.risk_level.value if r.risk_level else "",
                      r.status.value if r.status else "", r.owner, _fecha(r.due_date) or "") for r in riesgos]
            ruta = "Documentos/Registro_de_riesgos.pdf"
            zf.writestr(ruta, pdf_desde_html(
                f"<h1>Registro de riesgos</h1><p class='meta'>{html.escape(datos['empresa'])} · {len(riesgos)} riesgos · ISO 27001, 6.1.2 y 8.2</p>"
                + _tabla_html(["Riesgo", "Prob.", "Impacto", "Nivel", "Estado", "Responsable", "Plazo"], filas)))
            contenido.append((ruta, f"ISO 27001, 6.1.2 y 8.2 · {len(riesgos)} riesgos"))

        if "aceptacion" in partes:
            publicados = [d["_doc"] for d in datos["documentos"]]
            firmas = await _firmas_por_documento(db, publicados, org_id)
            filas = [(d.title, d.version, f"{firmas.get(d.id, {}).get('aceptaron', 0)} de {firmas.get(d.id, {}).get('total', 0)}")
                     for d in publicados]
            ruta = "Documentos/Aceptacion_de_politicas.pdf"
            zf.writestr(ruta, pdf_desde_html(
                "<h1>Aceptación de políticas por los trabajadores</h1><p class='meta'>ISO 27001, 7.3 · solo cuenta la versión vigente</p>"
                + _tabla_html(["Documento", "Versión", "Aceptaron"], filas)))
            contenido.append((ruta, "ISO 27001, 7.3"))

        if "evidencias" in partes:
            evs = datos["evidencias"]
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
            contenido.append(("Evidencias/", f"{len(evs)} evidencias con su índice"))

        integridad = None
        if "registro" in partes:
            todas = await _filas_registro(db, org_id)
            integridad = verificar_cadena(todas)
            filas = _de_la_empresa(todas)
            zf.writestr("Registro_de_actividad.csv", _csv_registro(filas))
            contenido.append(("Registro_de_actividad.csv", f"{len(filas)} acciones: quién creó, aprobó, publicó o descargó"))

        indice = (f"<h1>Paquete de auditoría</h1><p class='meta'>{html.escape(datos['empresa'])} · "
                  f"generado el {ahora.strftime('%d-%m-%Y %H:%M')} UTC"
                  + ("" if current_user.get("role") == "superadmin" else f" por {html.escape(current_user.get('sub') or '')}") + "</p>"
                  "<p>Solo se incluyen documentos publicados por la dirección.</p>"
                  "<h2>Contenido</h2>" + _tabla_html(["Archivo", "Detalle"], contenido))
        if integridad:
            indice += ("<h2>Registro de actividad</h2><p>" + (
                "Cadena íntegra: ninguna acción fue modificada ni borrada." if integridad["integra"] else
                f"Atención: la cadena no calza desde la acción del {integridad['primera_alterada']['fecha']}.") + "</p>")
        zf.writestr("00_Indice.pdf", pdf_desde_html(indice))

    await registrar(db, org_id, current_user, "exporto", "paquete", "Paquete de auditoría",
                    "Incluye: " + ", ".join(p for p in PARTES if p in partes))
    buf.seek(0)
    nombre_zip = f"Paquete_Auditoria_{_nombre_archivo(datos['empresa'])}_{ahora.strftime('%Y-%m-%d')}.zip"
    return StreamingResponse(buf, media_type="application/zip",
                             headers={"Content-Disposition": f"attachment; filename={nombre_zip}",
                                      "Access-Control-Expose-Headers": "Content-Disposition"})
