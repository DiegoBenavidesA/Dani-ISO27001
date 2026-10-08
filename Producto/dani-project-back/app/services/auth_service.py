from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # --- Tokens de activación de cuenta (invitación por correo) ---
    @staticmethod
    def create_activation_token(user_id: str, days_valid: int = 7) -> str:
        """Token firmado de un solo propósito para activar/definir contraseña."""
        return AuthService.create_access_token(
            data={"sub": user_id, "purpose": "activation"},
            expires_delta=timedelta(days=days_valid),
        )

    @staticmethod
    def verify_activation_token(token: str) -> str:
        """Valida un token de activación y devuelve el user_id. Lanza 400 si no sirve."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except JWTError:
            raise HTTPException(status_code=400, detail="El enlace de activación es inválido o expiró.")
        if payload.get("purpose") != "activation" or not payload.get("sub"):
            raise HTTPException(status_code=400, detail="El enlace de activación no es válido.")
        return payload["sub"]