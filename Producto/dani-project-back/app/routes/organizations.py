from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
import logging

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, RequireRole, require_superadmin
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.services.auth_service import AuthService
from app.services.email_service import send_email_async, build_invitation_email
from app.utils.slug import slug_unico
from app.config import settings

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])
logger = logging.getLogger(__name__)

class OrganizationCreate(BaseModel):
    nombre: str
    identificador: Optional[str] = None
    plan: Optional[str] = "basico"

class OrganizationUpdate(BaseModel):
    nombre: Optional[str] = None
    identificador: Optional[str] = None
    activo: Optional[bool] = None
    plan: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    nombre: str
    slug: Optional[str] = None
    identificador: Optional[str] = None
    activo: bool
    plan: str

    class Config:
        from_attributes = True


# Roles que el superadmin puede asignar al invitar (todos menos superadmin).
ROLES_ASIGNABLES = {"owner", "admin", "manager", "auditor", "dpo", "employee"}


class InviteUserRequest(BaseModel):
    """Invitar un usuario (por correo) a una empresa existente."""
    email: str
    role: str = "owner"
    name: Optional[str] = None


class InviteUserResponse(BaseModel):
    user_id: str
    email: str
    role: str
    email_sent: bool = False
    activation_url: Optional[str] = None

@router.get("/", response_model=List[OrganizationResponse])
async def get_all_organizations(
    current_user: dict = Depends(require_superadmin),  # Solo superadmin (cross-tenant)
    db: AsyncSession = Depends(get_db)
):
    """Obtener todas las organizaciones registradas (solo superadmin)"""
    result = await db.execute(select(Organization).order_by(Organization.created_at.desc()))
    return result.scalars().all()


# ---- Panel de la plataforma (solo superadmin) ---------------------------------

UMBRAL_CUMPLE = 90  # % desde el que una empresa se cuenta como "cumple" en el panel
VALOR_VEREDICTO = {"cumple": 1.0, "parcial": 0.5, "no_cumple": 0.0, "sin_evidencia": 0.0}


def resumen_cumplimiento(orgs, filas, usuarios_activos: int) -> dict:
    """orgs: [(id, nombre, activo)]; filas: [(org_id, marco, veredicto, cantidad)].
    Mismo cálculo que el Resultado del Análisis de Brechas: Sí = 1, Parcial = 0,5,
    No o sin evidencia = 0; "No aplica" no cuenta."""
    nombres = {o[0]: o[1] for o in orgs}
    acum = {}  # (org, marco) -> [suma, respondidas]
    for org_id, marco, veredicto, cantidad in filas:
        if org_id not in nombres or veredicto not in VALOR_VEREDICTO:
            continue
        a = acum.setdefault((org_id, marco), [0.0, 0])
        a[0] += VALOR_VEREDICTO[veredicto] * cantidad
        a[1] += cantidad

    def marco(clave):
        empresas = [
            {"id": org_id, "nombre": nombres[org_id], "pct": round(s / n * 100), "respondidas": n}
            for (org_id, m), (s, n) in acum.items() if m == clave and n
        ]
        empresas.sort(key=lambda e: (-e["pct"], e["nombre"]))
        return {"evaluadas": len(empresas), "cumplen": sum(1 for e in empresas if e["pct"] >= UMBRAL_CUMPLE),
                "top": empresas[:5]}

    return {
        "empresas_activas": sum(1 for o in orgs if o[2]),
        "total_empresas": len(orgs),
        "usuarios_activos": usuarios_activos,
        "umbral_cumple": UMBRAL_CUMPLE,
        "iso27001": marco("iso27001"),
        "ley21719": marco("ley21719"),
    }


@router.get("/resumen")
async def resumen_plataforma(
    current_user: dict = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Datos del panel de la plataforma: empresas, usuarios y cumplimiento por empresa."""
    from sqlalchemy import func
    from app.models.assessment_answer import AssessmentAnswer
    from app.models.assessment_question import AssessmentQuestion
    orgs = (await db.execute(select(Organization.id, Organization.nombre, Organization.activo))).all()
    filas = (await db.execute(
        select(AssessmentAnswer.organization_id, AssessmentQuestion.marco, AssessmentAnswer.veredicto, func.count())
        .join(AssessmentQuestion, AssessmentQuestion.id == AssessmentAnswer.question_id)
        .group_by(AssessmentAnswer.organization_id, AssessmentQuestion.marco, AssessmentAnswer.veredicto)
    )).all()
    usuarios = (await db.execute(
        select(func.count()).select_from(User).where(User.is_active.is_(True), User.organization_id.isnot(None))
    )).scalar() or 0
    return resumen_cumplimiento([tuple(o) for o in orgs], [tuple(f) for f in filas], usuarios)

@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    current_user: dict = Depends(require_superadmin),  # Solo superadmin crea empresas manualmente
    db: AsyncSession = Depends(get_db)
):
    """Crear una nueva empresa manualmente (solo superadmin)"""
    datos = org_data.dict(exclude_unset=True)
    new_org = Organization(**datos)
    new_org.slug = await slug_unico(db, new_org.nombre, Organization)
    db.add(new_org)
    await db.commit()
    await db.refresh(new_org)
    return new_org


@router.post(
    "/{org_id}/invite",
    response_model=InviteUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def invite_user_to_organization(
    org_id: str,
    data: InviteUserRequest,
    current_user: dict = Depends(require_superadmin),  # Solo superadmin
    db: AsyncSession = Depends(get_db),
):
    """Invitar un usuario a una empresa existente (por correo).

    Crea el usuario inactivo y sin contraseña usable, y le envía un correo con
    un enlace para activar la cuenta y definir su propia contraseña.
    """
    if data.role not in ROLES_ASIGNABLES:
        raise HTTPException(status_code=400, detail="Rol no válido para invitación.")

    org_res = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_res.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada.")

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo.")

    try:
        import secrets
        invited = User(
            full_name=(data.name.strip() if data.name and data.name.strip() else data.email.split("@")[0]),
            email=data.email,
            hashed_password=AuthService.get_password_hash(secrets.token_urlsafe(32)),
            role=UserRole(data.role),
            organization_id=org.id,
            is_active=False,  # se activa al definir su contraseña
        )
        db.add(invited)
        await db.commit()
        await db.refresh(invited)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al invitar usuario: {str(e)}")

    # Enviar invitación (si falla el correo, el usuario ya quedó creado).
    ROLE_LABELS = {"owner": "Owner (Dueño)", "admin": "Administrador", "manager": "Manager", "auditor": "Auditor", "dpo": "DPO", "employee": "Empleado"}
    token = AuthService.create_activation_token(invited.id)
    activation_url = f"{settings.FRONTEND_BASE_URL}/activar/{token}"
    html, text = build_invitation_email(
        invited.full_name, org.nombre, activation_url, ROLE_LABELS.get(data.role, data.role)
    )
    email_sent = await send_email_async(
        invited.email,
        f"Invitación a {org.nombre} — GRC",
        html,
        text,
        from_name=org.nombre,  # remitente = nombre de la empresa
    )

    return InviteUserResponse(
        user_id=invited.id,
        email=invited.email,
        role=data.role,
        email_sent=email_sent,
        activation_url=activation_url,
    )

@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    update_data: OrganizationUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Actualizar datos de una empresa.
    Solo el superadmin (cualquier empresa) o el owner de ESA empresa pueden hacerlo.
    Un admin NO puede modificar la configuración de la empresa.
    """
    role = current_user.get("role")
    es_superadmin = role == "superadmin"
    es_owner_de_esta = role == "owner" and current_user.get("organization_id") == org_id
    if not (es_superadmin or es_owner_de_esta):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el superadmin o el owner de la empresa pueden modificarla."
        )

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")

    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(org, key, value)

    await db.commit()
    await db.refresh(org)
    return org

class OrganizationDelete(BaseModel):
    confirmacion: str  # el nombre exacto de la empresa


@router.delete("/{org_id}")
async def delete_organization(
    org_id: str,
    data: OrganizationDelete,
    current_user: dict = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Elimina para siempre una empresa y todos sus datos (usuarios, documentos,
    evidencias y sus archivos, riesgos, incidentes, respuestas y registro).
    Solo el superadmin, solo si la empresa está suspendida y escribiendo su nombre."""
    from app.services.borrar_empresa import borrar_empresa, quitar_archivos

    org = (await db.execute(select(Organization).where(Organization.id == org_id))).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    if org.activo:
        raise HTTPException(status_code=400, detail="Primero suspende la empresa; solo se puede eliminar una empresa suspendida.")
    if (data.confirmacion or "").strip() != (org.nombre or "").strip():
        raise HTTPException(status_code=400, detail="El nombre escrito no coincide con el de la empresa.")

    nombre = org.nombre
    resultado = await borrar_empresa(db, org_id)
    archivos = await quitar_archivos(resultado["archivos"])
    logger.warning(f"Empresa eliminada por {current_user.get('sub')}: {nombre} ({org_id}) · filas {resultado['filas']} · archivos {archivos}")
    return {"message": f"Se eliminó la empresa {nombre}.", "filas": resultado["filas"], "archivos_borrados": archivos}
