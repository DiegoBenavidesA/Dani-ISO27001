from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.auth_service import AuthService

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    return {
        "email": payload.get("sub"),
        "role": payload.get("role", "user"),
        "user_id": payload.get("user_id"),
        # Multi-tenant (N4): empresa del usuario, extraída del token.
        "organization_id": payload.get("organization_id"),
    }


async def get_current_org(current_user: dict = Depends(get_current_user)) -> str:
    """
    Devuelve el organization_id de la empresa del usuario autenticado.

    Multi-tenant (N4): es la pieza que usarán TODOS los endpoints por-empresa
    para saber a qué inquilino pertenece la petición. Si el usuario no tiene
    empresa asignada (situación temporal hasta el backfill de N7), lanza 403
    para no exponer datos sin ámbito de empresa.
    """
    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no tiene una empresa asignada."
        )
    return org_id

async def require_admin(current_user = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

class RequireRole:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    async def __call__(self, current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para esta acción."
            )
        return current_user