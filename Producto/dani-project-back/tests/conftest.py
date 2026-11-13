"""Configuración común de las pruebas sin servidor.

Las pruebas crean tokens para usuarios ficticios y no tienen base de datos, así
que aquí se reemplaza solo la consulta que confirma que el usuario sigue activo.
La validación del token (firma, expiración y tipo) sigue siendo la real. La
consulta a la base de datos se prueba aparte en test_seguridad.py y en
tests/security/prueba_seguridad.py contra el sistema en ejecución.
"""
import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

from fastapi import Depends

from app.dependencies.auth import token_payload, usuario_activo
from app.main import app


async def _usuario_activo_sin_bd(payload: dict = Depends(token_payload)) -> dict:
    return payload


app.dependency_overrides[usuario_activo] = _usuario_activo_sin_bd
