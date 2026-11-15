"""Solicitudes de evidencia.

Flujo: una persona con permiso de escritura pide a un usuario de la empresa que
suba un documento antes de una fecha. El asignado recibe un correo. Cuando sube
algo al Centro de Evidencias, la solicitud pasa a "subida" y quien la pidió ve
un aviso en la campana. Quien la pidió revisa el archivo y la marca como
"recibida" o la devuelve a "pendiente".
"""
from datetime import date, datetime
from html import escape as html_escape
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies.auth import get_current_org, get_current_user, RequireRole, ELEVATED_WRITE
from app.dependencies.database import get_db
from app.dependencies.tenant import get_scoped_or_404
from app.models.evidence import Evidence
from app.models.evidence_request import EvidenceRequest
from app.models.user import User, UserRole
from app.services.email_service import send_email_async

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/evidence-requests", tags=["Evidence Requests"])

# Solo pueden recibir solicitudes los roles que pueden subir evidencias.
ROLES_QUE_SUBEN = [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER]
ROLES_QUE_GESTIONAN = ("superadmin", "owner", "admin")


class SolicitudCrear(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=300)
    control: str | None = Field(None, max_length=20)
    asignado_a: str
    fecha_limite: date


def _rol(u: User) -> str:
    return u.role.value if hasattr(u.role, "value") else str(u.role)


async def _usuarios(db: AsyncSession, ids) -> dict:
    ids = {i for i in ids if i}
    if not ids:
        return {}
    filas = (await db.execute(select(User).where(User.id.in_(ids)))).scalars().all()
    return {u.id: u for u in filas}


def _puede_gestionar(s: EvidenceRequest, user: dict) -> bool:
    return user.get("role") in ROLES_QUE_GESTIONAN or s.solicitado_por == user.get("user_id")


def _a_json(s: EvidenceRequest, usuarios: dict, evidencias: dict, hoy: date, user: dict) -> dict:
    asignado = usuarios.get(s.asignado_a)
    solicitante = usuarios.get(s.solicitado_por)
    ev = evidencias.get(s.evidence_id)
    return {
        "id": s.id,
        "titulo": s.titulo,
        "control": s.control,
        "asignado_a": s.asignado_a,
        "asignado_nombre": asignado.full_name if asignado else "Usuario eliminado",
        "asignado_email": asignado.email if asignado else None,
        "solicitado_por": s.solicitado_por,
        "solicitante_nombre": solicitante.full_name if solicitante else "Usuario eliminado",
        "fecha_limite": s.fecha_limite.isoformat(),
        "estado": s.estado,
        "vencida": s.estado == "pendiente" and s.fecha_limite < hoy,
        "evidence_id": s.evidence_id,
        "evidencia_nombre": ev.title if ev else None,
        "subida_en": s.subida_en.isoformat() if s.subida_en else None,
        "recordatorio_en": s.recordatorio_en.isoformat() if s.recordatorio_en else None,
        # Para que la pantalla sepa qué acciones mostrar a quien consulta.
        "soy_asignado": s.asignado_a == user.get("user_id"),
        "puedo_gestionar": _puede_gestionar(s, user),
    }


async def _enviar_correo(s: EvidenceRequest, asignado: User, solicitante_nombre: str, recordatorio: bool) -> bool:
    if not asignado.email:
        return False
    limite = s.fecha_limite.strftime("%d/%m/%Y")
    asunto = ("Recordatorio: " if recordatorio else "") + f"Se te solicitó subir evidencia antes del {limite}"
    url = f"{settings.FRONTEND_URL.rstrip('/')}/"
    control = f"<br><strong>Control:</strong> {html_escape(s.control)}" if s.control else ""
    html = f"""<div style="font-family:Arial,sans-serif;max-width:560px;color:#0f172a">
<h2 style="color:#004ac6;margin:0 0 12px">{'Recordatorio de evidencia pendiente' if recordatorio else 'Nueva solicitud de evidencia'}</h2>
<p>{html_escape(solicitante_nombre)} te pidió subir el siguiente documento a NormIA:</p>
<p style="background:#f1f5f9;padding:12px;border-radius:8px"><strong>{html_escape(s.titulo)}</strong>{control}<br>
<strong>Fecha límite:</strong> {limite}</p>
<p>Súbelo en NormIA → Centro de Evidencias → Solicitudes, con el botón "Subir" de esta solicitud.</p>
<p><a href="{url}" style="background:#004ac6;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;display:inline-block">Abrir NormIA</a></p>
</div>"""
    texto = f"{solicitante_nombre} te pidió subir '{s.titulo}' a NormIA antes del {limite}. Centro de Evidencias > Solicitudes."
    try:
        return bool(await send_email_async(asignado.email, asunto, html, texto))
    except Exception as e:  # el correo no debe impedir crear la solicitud
        logger.error(f"No se pudo enviar la solicitud de evidencia a {asignado.email}: {e}")
        return False


@router.get("/usuarios")
async def usuarios_asignables(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(RequireRole(ELEVATED_WRITE)),
):
    """Usuarios activos de la empresa que pueden subir evidencias."""
    filas = (await db.execute(select(User).where(
        User.organization_id == org_id,
        User.is_active.is_(True),
        User.role.in_(ROLES_QUE_SUBEN),
    ).order_by(User.full_name))).scalars().all()
    return [{"id": u.id, "nombre": u.full_name, "email": u.email, "rol": _rol(u)} for u in filas]


@router.get("/")
async def listar(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    filas = (await db.execute(
        select(EvidenceRequest).where(EvidenceRequest.organization_id == org_id)
        .order_by(EvidenceRequest.created_at.desc())
    )).scalars().all()
    usuarios = await _usuarios(db, [x for s in filas for x in (s.asignado_a, s.solicitado_por)])
    ev_ids = [s.evidence_id for s in filas if s.evidence_id]
    evidencias = {}
    if ev_ids:
        evs = (await db.execute(select(Evidence).where(Evidence.id.in_(ev_ids), Evidence.organization_id == org_id))).scalars().all()
        evidencias = {e.id: e for e in evs}
    hoy = date.today()
    return [_a_json(s, usuarios, evidencias, hoy, current_user) for s in filas]


@router.post("/", status_code=201)
async def crear(
    datos: SolicitudCrear,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(RequireRole(ELEVATED_WRITE)),
):
    if datos.fecha_limite < date.today():
        raise HTTPException(status_code=400, detail="La fecha límite no puede estar en el pasado.")
    asignado = (await db.execute(select(User).where(
        User.id == datos.asignado_a, User.organization_id == org_id, User.is_active.is_(True),
    ))).scalar_one_or_none()
    if not asignado:
        raise HTTPException(status_code=400, detail="El usuario asignado no pertenece a esta empresa.")
    if asignado.role not in ROLES_QUE_SUBEN:
        raise HTTPException(status_code=400, detail="Ese usuario no tiene permiso para subir evidencias.")

    s = EvidenceRequest(
        organization_id=org_id,
        titulo=datos.titulo.strip(),
        control=(datos.control or None),
        asignado_a=asignado.id,
        solicitado_por=current_user.get("user_id"),
        fecha_limite=datos.fecha_limite,
        estado="pendiente",
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)

    solicitante = await db.get(User, current_user.get("user_id"))
    correo = await _enviar_correo(s, asignado, solicitante.full_name if solicitante else "Un usuario", recordatorio=False)
    usuarios = {asignado.id: asignado}
    if solicitante:
        usuarios[solicitante.id] = solicitante
    return {**_a_json(s, usuarios, {}, date.today(), current_user), "correo_enviado": correo}


@router.post("/{solicitud_id}/recordatorio")
async def recordatorio(
    solicitud_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(RequireRole(ELEVATED_WRITE)),
):
    s = await get_scoped_or_404(db, EvidenceRequest, solicitud_id, org_id)
    if not _puede_gestionar(s, current_user):
        raise HTTPException(status_code=403, detail="Solo quien hizo la solicitud o un administrador puede reenviarla.")
    if s.estado != "pendiente":
        raise HTTPException(status_code=400, detail="La solicitud ya no está pendiente.")
    asignado = await db.get(User, s.asignado_a)
    if not asignado:
        raise HTTPException(status_code=400, detail="El usuario asignado ya no existe.")
    solicitante = await db.get(User, current_user.get("user_id"))
    enviado = await _enviar_correo(s, asignado, solicitante.full_name if solicitante else "Un usuario", recordatorio=True)
    if not enviado:
        raise HTTPException(status_code=502, detail="No se pudo enviar el correo. Revisa la configuración de correo del servidor.")
    s.recordatorio_en = datetime.utcnow()
    await db.commit()
    return {"message": f"Recordatorio enviado a {asignado.email}"}


@router.post("/{solicitud_id}/recibida")
async def marcar_recibida(
    solicitud_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(RequireRole(ELEVATED_WRITE)),
):
    s = await get_scoped_or_404(db, EvidenceRequest, solicitud_id, org_id)
    if not _puede_gestionar(s, current_user):
        raise HTTPException(status_code=403, detail="Solo quien hizo la solicitud o un administrador puede cerrarla.")
    if s.estado != "subida":
        raise HTTPException(status_code=400, detail="Solo se puede marcar como recibida una solicitud con un documento subido.")
    s.estado = "recibida"
    await db.commit()
    return {"message": "Solicitud marcada como recibida"}


@router.post("/{solicitud_id}/devolver")
async def devolver(
    solicitud_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(RequireRole(ELEVATED_WRITE)),
):
    """El documento subido no era el correcto: la solicitud vuelve a pendiente."""
    s = await get_scoped_or_404(db, EvidenceRequest, solicitud_id, org_id)
    if not _puede_gestionar(s, current_user):
        raise HTTPException(status_code=403, detail="Solo quien hizo la solicitud o un administrador puede devolverla.")
    if s.estado != "subida":
        raise HTTPException(status_code=400, detail="Solo se puede devolver una solicitud con un documento subido.")
    s.estado, s.evidence_id, s.subida_en = "pendiente", None, None
    await db.commit()
    return {"message": "Solicitud devuelta a pendiente"}


@router.delete("/{solicitud_id}")
async def eliminar(
    solicitud_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(RequireRole(ELEVATED_WRITE)),
):
    s = await get_scoped_or_404(db, EvidenceRequest, solicitud_id, org_id)
    if not _puede_gestionar(s, current_user):
        raise HTTPException(status_code=403, detail="Solo quien hizo la solicitud o un administrador puede eliminarla.")
    await db.delete(s)
    await db.commit()
    return {"message": "Solicitud eliminada"}


async def vincular_subida(db: AsyncSession, org_id: str, user_id: str, evidence_id: str, solicitud_id: str | None = None) -> int:
    """Al subir una evidencia, marca como "subida" las solicitudes pendientes
    del usuario. Si se indica una solicitud, solo esa. Devuelve cuántas cambió."""
    if not user_id:
        return 0
    consulta = select(EvidenceRequest).where(
        EvidenceRequest.organization_id == org_id,
        EvidenceRequest.asignado_a == user_id,
        EvidenceRequest.estado == "pendiente",
    )
    if solicitud_id:
        consulta = consulta.where(EvidenceRequest.id == solicitud_id)
    filas = (await db.execute(consulta)).scalars().all()
    ahora = datetime.utcnow()
    for s in filas:
        s.estado, s.evidence_id, s.subida_en = "subida", evidence_id, ahora
    if filas:
        await db.commit()
    return len(filas)
