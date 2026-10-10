from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, require_admin, get_current_org
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.services.auth_service import AuthService
from app.services.email_service import send_email_async, build_invitation_email
from app.config import settings

router = APIRouter(prefix="/api/users", tags=["Users"])

ROLES_ASIGNABLES = {"owner", "admin", "manager", "auditor", "dpo", "employee"}
ROLE_LABELS = {"owner": "Owner (Dueño)", "admin": "Administrador", "manager": "Manager", "auditor": "Auditor", "dpo": "DPO", "employee": "Empleado"}


# --- Reglas de gestión de usuarios (multi-tenant + anti-escalada de roles) ---

def puede_asignar_rol(actor_role: str, target_role: str) -> bool:
    """¿El rol 'actor' puede asignar el rol 'target'?"""
    if actor_role == "superadmin":
        return True                      # superadmin puede asignar cualquier rol
    if target_role == "superadmin":
        return False                     # nadie más puede crear un superadmin
    if target_role == "owner":
        return actor_role == "owner"     # solo el owner (o superadmin) asigna owner
    # owner y admin pueden asignar el resto (admin, manager, auditor, dpo, employee)
    return actor_role in ("owner", "admin")


def mismo_ambito(actor: dict, target_user: User) -> bool:
    """superadmin ve todas las empresas; el resto solo la suya."""
    if actor.get("role") == "superadmin":
        return True
    return target_user.organization_id == actor.get("organization_id")


@router.get("")
@router.get("/")
async def get_all_users(
    request: Request,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Multi-tenant:
    #  - owner/admin: solo los usuarios de su propia empresa.
    #  - superadmin en el panel de plataforma (sin X-Org-Id): TODOS los usuarios.
    #  - superadmin "dentro" de una empresa (envía X-Org-Id): solo los de esa empresa.
    query = select(User)
    if current_user.get("role") != "superadmin":
        query = query.where(User.organization_id == current_user.get("organization_id"))
    else:
        org_override = request.headers.get("X-Org-Id")
        if org_override:
            query = query.where(User.organization_id == org_override)
    result = await db.execute(query)
    users = result.scalars().all()

    # Nombre de la empresa de cada usuario (para la vista global del superadmin).
    from app.models.organization import Organization
    org_ids = {u.organization_id for u in users if u.organization_id}
    orgs_map = {}
    if org_ids:
        ores = await db.execute(select(Organization).where(Organization.id.in_(org_ids)))
        orgs_map = {o.id: o.nombre for o in ores.scalars().all()}

    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "is_active": user.is_active,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "department": "General",  # Mapeo por defecto ya que no existe en BD
            "organization_id": user.organization_id,
            "organization_name": orgs_map.get(user.organization_id) if user.organization_id else None,
        }
        for user in users
    ]

class InviteUserRequest(BaseModel):
    """Invitar un usuario a MI empresa (owner/admin)."""
    name: Optional[str] = None
    email: str
    role: str = "employee"


@router.post("/invite", status_code=status.HTTP_201_CREATED)
async def invite_user(
    data: InviteUserRequest,
    current_user: dict = Depends(require_admin),
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Invita un usuario (correo + rol) a la empresa del actor.

    - owner/admin invitan a SU empresa (org del token).
    - superadmin invita a la empresa que esté viendo (cabecera X-Org-Id).
    El usuario se crea inactivo y define su contraseña al activar desde el correo.
    """
    if data.role not in ROLES_ASIGNABLES:
        raise HTTPException(status_code=400, detail="Rol no válido para invitación.")

    # Anti-escalada: un admin no puede crear un owner, etc.
    if not puede_asignar_rol(current_user.get("role"), data.role):
        raise HTTPException(status_code=403, detail=f"No tienes permisos para asignar el rol '{data.role}'.")

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo.")

    org_res = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_res.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada.")

    try:
        import secrets
        invited = User(
            full_name=(data.name.strip() if data.name and data.name.strip() else data.email.split("@")[0]),
            email=data.email,
            hashed_password=AuthService.get_password_hash(secrets.token_urlsafe(32)),
            role=UserRole(data.role),
            organization_id=org.id,
            is_active=False,
        )
        db.add(invited)
        await db.commit()
        await db.refresh(invited)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al invitar usuario: {str(e)}")

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

    return {"user_id": invited.id, "email": invited.email, "role": data.role, "email_sent": email_sent, "activation_url": activation_url}


class CreateUserRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "employee"
    department: str = "General"

@router.post("")
@router.post("/")
async def create_user(
    user_data: CreateUserRequest,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Check if exists
    query = select(User).where(User.email == user_data.email)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")
    
    # Hash password
    hashed_pwd = AuthService.get_password_hash(user_data.password)

    # Map string role to Enum
    try:
        role_enum = UserRole(user_data.role)
    except ValueError:
        role_enum = UserRole.EMPLOYEE

    # Anti-escalada: no puedes crear un usuario con un rol superior al que
    # tu propio rol permite asignar.
    if not puede_asignar_rol(current_user.get("role"), role_enum.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes permisos para asignar el rol '{role_enum.value}'."
        )

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_pwd,
        role=role_enum,
        is_active=True,
        # Multi-tenant: el usuario nuevo pertenece a la empresa del creador.
        organization_id=current_user.get("organization_id"),
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {"message": "Usuario creado exitosamente", "id": new_user.id}


class PreferencesRequest(BaseModel):
    audit_cycle_day: Optional[int] = None
    twofa_enabled: Optional[bool] = None


@router.get("/me/preferences")
async def get_my_preferences(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # CAMBIO: get_current_user devuelve la clave "user_id", no "id".
    # Usar "id" aquí causaba un KeyError no controlado (crash duro de la
    # función en Vercel: 500 sin headers CORS).
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user.preferences or {}


@router.patch("/me/preferences")
async def update_my_preferences(
    data: PreferencesRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # CAMBIO: mismo fix, "user_id" en vez de "id".
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    prefs = dict(user.preferences or {})
    if data.audit_cycle_day is not None:
        prefs["audit_cycle_day"] = data.audit_cycle_day
    if data.twofa_enabled is not None:
        prefs["twofa_enabled"] = data.twofa_enabled

    user.preferences = prefs
    await db.commit()
    return {"message": "Preferencias guardadas", "preferences": prefs}


@router.get("/{user_id}")
async def get_user_by_id(
    user_id: str,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Multi-tenant: no puedes ver usuarios de otra empresa.
    if not mismo_ambito(current_user, user):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_active": user.is_active,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "department": "General"
    }

class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    department: Optional[str] = None

@router.put("/{user_id}")
async def update_user(
    user_id: str,
    user_data: UpdateUserRequest,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Multi-tenant: no puedes tocar usuarios de otra empresa.
    if not mismo_ambito(current_user, user):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Proteger al owner: solo el superadmin u otro owner puede modificar a un owner.
    rol_objetivo_actual = user.role.value if hasattr(user.role, 'value') else str(user.role)
    if rol_objetivo_actual == "owner" and current_user.get("role") not in ("superadmin", "owner"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para modificar al owner de la empresa."
        )

    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.email is not None:
        # Check if email is already taken by another user
        if user_data.email != user.email:
            dup_query = select(User).where(User.email == user_data.email)
            dup_res = await db.execute(dup_query)
            if dup_res.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="El correo ya está registrado por otro usuario.")
        user.email = user_data.email
    if user_data.role is not None:
        try:
            nuevo_rol = UserRole(user_data.role)
        except ValueError:
            nuevo_rol = None
        if nuevo_rol is not None:
            # Anti-escalada: no puedes asignar un rol superior al permitido.
            if not puede_asignar_rol(current_user.get("role"), nuevo_rol.value):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No tienes permisos para asignar el rol '{nuevo_rol.value}'."
                )
            user.role = nuevo_rol
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
        
    await db.commit()
    await db.refresh(user)
    
    return {
        "message": "Usuario actualizado exitosamente",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "is_active": user.is_active
        }
    }

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Multi-tenant: no puedes eliminar usuarios de otra empresa.
    if not mismo_ambito(current_user, user):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Proteger al owner: solo el superadmin u otro owner puede eliminar a un owner.
    rol_objetivo = user.role.value if hasattr(user.role, 'value') else str(user.role)
    if rol_objetivo == "owner" and current_user.get("role") not in ("superadmin", "owner"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar al owner de la empresa."
        )

    await db.delete(user)
    await db.commit()

    return {"message": "Usuario eliminado exitosamente"}