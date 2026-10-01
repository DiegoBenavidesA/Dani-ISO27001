from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import re
import logging

from app.dependencies.auth import get_current_user
from app.services.auth_service import AuthService
from app.dependencies.database import get_db
from app.models import User
from app.models.user import UserRole

from app.models.organization import Organization
from app.utils.slug import slug_unico

router = APIRouter(prefix="/api/auth", tags=["Auth"])
security = HTTPBearer()
logger = logging.getLogger(__name__)

# --- 1. ESQUEMAS DE DATOS ---
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    empresa: str # T6: Nombre de la nueva empresa a crear

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "employee"
    name: str = ""
    # Multi-tenant: identifican la empresa del usuario para la URL /:slug/...
    # El superadmin de plataforma no tiene empresa, por eso son opcionales.
    organization_id: str | None = None
    organization_slug: str | None = None
    organization_name: str | None = None

# --- 2. RUTAS DE AUTENTICACIÓN ---

@router.post("/register")
async def register(register_data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # ... (Mantiene las validaciones de contraseña e email que ya tenías) ...
    
    try:
        query = select(User).where(User.email == register_data.email)
        result = await db.execute(query)
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(status_code=409, detail="El correo ya está registrado en el sistema")
    except HTTPException:
        raise
        
    try:
        # T6: CREACIÓN ATÓMICA DE EMPRESA + USUARIO
        # 1. Crear la Organización (con slug único para la URL multi-tenant)
        slug = await slug_unico(db, register_data.empresa, Organization)
        nueva_empresa = Organization(nombre=register_data.empresa, slug=slug)
        db.add(nueva_empresa)
        await db.flush() # flush asigna un ID a nueva_empresa sin comitear aún

        # 2. Crear el Usuario y vincularlo
        hashed_pwd = AuthService.get_password_hash(register_data.password)
        new_user = User(
            email=register_data.email,
            full_name=register_data.name,
            hashed_password=hashed_pwd,
            organization_id=nueva_empresa.id, # Vinculación
            role=UserRole.OWNER # El primer usuario de una empresa nueva es su OWNER (dueño)
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return {
            "message": "Empresa y usuario creados exitosamente",
            "user_id": new_user.id,
            "organization_id": nueva_empresa.id,
            "organization_slug": nueva_empresa.slug,
            "organization_name": nueva_empresa.nombre,
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar: {str(e)}")

    
@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == login_data.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not AuthService.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado. Contacte al administrador."
        )
    
    # Multi-tenant: buscamos la empresa del usuario (si tiene) para exponer su
    # slug y nombre al frontend (arma la URL /:slug/...).
    org = None
    if user.organization_id:
        org_res = await db.execute(
            select(Organization).where(Organization.id == user.organization_id)
        )
        org = org_res.scalar_one_or_none()

    access_token = AuthService.create_access_token(
        data={
            "sub": user.email,
            "user_id": str(user.id),
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            # Multi-tenant (N4): la empresa del usuario viaja en el token.
            "organization_id": user.organization_id,
        }
    )

    return TokenResponse(
        access_token=access_token,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
        name=user.full_name,
        organization_id=user.organization_id,
        organization_slug=org.slug if org else None,
        organization_name=org.nombre if org else None,
    )

class ActivateRequest(BaseModel):
    token: str
    new_password: str


@router.get("/activate/{token}")
async def get_activation_info(token: str, db: AsyncSession = Depends(get_db)):
    """Devuelve los datos de la invitación para mostrarlos en la pantalla de activación."""
    user_id = AuthService.verify_activation_token(token)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="La cuenta de esta invitación ya no existe.")

    org_nombre = None
    if user.organization_id:
        org_res = await db.execute(select(Organization).where(Organization.id == user.organization_id))
        org = org_res.scalar_one_or_none()
        org_nombre = org.nombre if org else None

    return {
        "email": user.email,
        "name": user.full_name,
        "organization": org_nombre,
    }


@router.post("/activate")
async def activate_account(data: ActivateRequest, db: AsyncSession = Depends(get_db)):
    """Activa la cuenta invitada definiendo la contraseña propia del usuario."""
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres.")

    user_id = AuthService.verify_activation_token(data.token)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="La cuenta de esta invitación ya no existe.")

    user.hashed_password = AuthService.get_password_hash(data.new_password)
    user.is_active = True
    await db.commit()
    return {"message": "Cuenta activada. Ya puedes iniciar sesión."}


@router.post("/verify")
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    return {"valid": True, "user": payload.get("sub")}

@router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener información del usuario actual"""
    # CAMBIO: get_current_user solo trae lo que viene en el JWT (email, role,
    # user_id) — no full_name ni is_active. Antes esto devolvía "id": None,
    # "full_name": None, "is_active": None siempre, sin crashear pero sin
    # datos reales. Ahora consultamos la BD con el user_id del token para
    # devolver el usuario completo de verdad.
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_active": user.is_active
    }


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cambiar contraseña del usuario autenticado"""
    # CAMBIO: get_current_user devuelve "user_id", no "id".
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not AuthService.verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    pwd = data.new_password
    if len(pwd) < 8:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")

    user.hashed_password = AuthService.get_password_hash(data.new_password)
    await db.commit()
    return {"message": "Contraseña actualizada correctamente"}