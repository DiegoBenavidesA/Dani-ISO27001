from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.services.auth_service import AuthService

security = HTTPBearer()


async def token_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Valida la firma, la expiración y el tipo del token."""
    return AuthService.verify_token(credentials.credentials)


async def usuario_activo(payload: dict = Depends(token_payload), db: AsyncSession = Depends(get_db)) -> dict:
    """
    Comprueba que el usuario del token siga existiendo y esté activo.

    El token dura varias horas; sin esta consulta, un usuario suspendido o
    eliminado seguiría entrando con el token que obtuvo antes. FastAPI reutiliza
    la misma sesión de base de datos durante toda la petición, así que solo
    agrega una consulta liviana.
    """
    from app.models.user import User  # import diferido: evita ciclos al cargar los modelos

    user_id = payload.get("user_id")
    consulta = select(User.is_active).where(User.id == user_id) if user_id else \
        select(User.is_active).where(User.email == payload.get("sub"))
    activo = (await db.execute(consulta)).scalar_one_or_none()
    if not activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión ya no es válida. Inicia sesión nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


async def get_current_user(payload: dict = Depends(usuario_activo)):
    return {
        "email": payload.get("sub"),
        "role": payload.get("role", "user"),
        "user_id": payload.get("user_id"),
        # Multi-tenant (N4): empresa del usuario, extraída del token.
        "organization_id": payload.get("organization_id"),
    }


async def get_current_org(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> str:
    """
    Devuelve el organization_id de la empresa a la que aplica la petición.

    Multi-tenant (N4): es la pieza que usarán TODOS los endpoints por-empresa
    para saber a qué inquilino pertenece la petición.

    Caso especial superadmin (cross-tenant): el superadmin de la plataforma NO
    pertenece a ninguna empresa. Cuando "entra" a una empresa desde el panel,
    el frontend envía la cabecera `X-Org-Id` con la empresa seleccionada, y aquí
    la usamos como ámbito. Para el resto de usuarios se ignora esa cabecera y se
    usa siempre la empresa de su token (aislamiento).
    """
    if current_user.get("role") == "superadmin":
        override = request.headers.get("X-Org-Id") or request.query_params.get("org_id")
        if override:
            return override
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El superadmin debe seleccionar una empresa para ver sus datos."
        )

    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no tiene una empresa asignada."
        )
    return org_id

# Roles con privilegio de administración. superadmin (plataforma) y owner
# (dueño de la empresa) siempre pueden hacer lo que puede un admin, por eso
# se incluyen aquí y "pasan" cualquier chequeo de rol elevado sin tener que
# listarlos uno por uno en cada endpoint.
PRIVILEGED_ROLES = {"superadmin", "owner", "admin"}

# Grupos de roles para RequireRole (superadmin y owner SIEMPRE pasan además,
# por la jerarquía definida en RequireRole.__call__).
# ELEVATED_READ  -> pueden VER cumplimiento / gap analysis / Ley 21.719 (incl. auditor y dpo).
# ELEVATED_WRITE -> pueden MODIFICAR (auditor y dpo quedan como solo-lectura).
ELEVATED_READ = ["admin", "manager", "auditor", "dpo"]
ELEVATED_WRITE = ["admin", "manager"]
# Igual que ELEVATED_READ pero SIN dpo (p. ej. el módulo de riesgos, que el
# dpo no gestiona según la matriz de permisos).
ELEVATED_NO_DPO = ["admin", "manager", "auditor"]
# Módulos de la Ley 21.719: los gestiona el DPO (y admin). Manager y auditor
# NO entran aquí. (owner y superadmin pasan siempre por la jerarquía.)
LEY_ROLES = ["admin", "dpo"]


async def require_admin(current_user = Depends(get_current_user)):
    if current_user.get("role") not in PRIVILEGED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


async def require_superadmin(current_user = Depends(get_current_user)):
    """
    SOLO superadmin (operador de la plataforma). A diferencia de require_admin,
    aquí NO pasa el owner: se usa para acciones cross-tenant, como ver o
    administrar TODAS las empresas.
    """
    if current_user.get("role") != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requiere privilegios de superadministrador (plataforma)."
        )
    return current_user

class RequireRole:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    async def __call__(self, current_user: dict = Depends(get_current_user)):
        role = current_user.get("role")
        # superadmin y owner tienen, como mínimo, privilegios de admin:
        # pasan cualquier chequeo de rol elevado.
        if role in ("superadmin", "owner") or role in self.allowed_roles:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos suficientes para esta acción."
        )