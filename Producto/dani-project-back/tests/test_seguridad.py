"""Pruebas de seguridad que no necesitan base de datos ni servidor.

Cubren la validación de tokens (RNF-05), la regla de aislamiento por empresa
(RNF-08 y RNF-09), la matriz anti-escalada de roles (RNF-06) y el almacenamiento
de contraseñas (RNF-11).
"""
import asyncio
import os
from datetime import datetime, timedelta

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from jose import jwt
from starlette.requests import Request

from app.config import settings
from app.dependencies.auth import get_current_org
from app.main import app
from app.routes.users import puede_asignar_rol
from app.services.auth_service import AuthService

client = TestClient(app)
RUTA = "/api/risks/"


def token_admin(**extra):
    datos = {"sub": "admin@empresa-a.cl", "role": "admin", "user_id": "u-a", "organization_id": "org-a"}
    datos.update(extra)
    return datos


def get(token):
    return client.get(RUTA, headers={"Authorization": f"Bearer {token}"})


# ---------- RNF-05: validación de tokens ----------

def test_token_firmado_con_otra_clave_es_rechazado():
    falso = jwt.encode({**token_admin(), "exp": datetime.utcnow() + timedelta(hours=1)},
                       "clave-de-un-atacante", algorithm=settings.ALGORITHM)
    assert get(falso).status_code == 401


def test_token_expirado_es_rechazado():
    vencido = AuthService.create_access_token(token_admin(), expires_delta=timedelta(minutes=-1))
    assert get(vencido).status_code == 401


def test_token_sin_firma_alg_none_es_rechazado():
    sin_firma = jwt.encode(token_admin(), "", algorithm="HS256").rsplit(".", 1)[0] + "."
    assert get(sin_firma).status_code == 401


def test_token_alterado_es_rechazado():
    valido = AuthService.create_access_token(token_admin())
    cabecera, cuerpo, firma = valido.split(".")
    otro_cuerpo = AuthService.create_access_token(token_admin(role="superadmin")).split(".")[1]
    assert get(f"{cabecera}.{otro_cuerpo}.{firma}").status_code == 401


def test_texto_cualquiera_como_token_es_rechazado():
    assert get("esto-no-es-un-jwt").status_code == 401


def test_token_de_activacion_no_sirve_como_sesion():
    """El enlace de activación de cuenta no debe permitir usar la API."""
    activacion = AuthService.create_activation_token("u-a")
    assert get(activacion).status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {activacion}"}).status_code == 401


# ---------- RNF-08 y RNF-09: alcance por empresa ----------

def peticion(cabeceras=None, query=b""):
    return Request({"type": "http", "method": "GET", "path": "/", "query_string": query,
                    "headers": [(k.lower().encode(), v.encode()) for k, v in (cabeceras or {}).items()]})


def org(usuario, cabeceras=None, query=b""):
    return asyncio.run(get_current_org(peticion(cabeceras, query), usuario))


def test_usuario_normal_ignora_x_org_id_de_otra_empresa():
    usuario = {"role": "admin", "organization_id": "org-a"}
    assert org(usuario, {"X-Org-Id": "org-b"}) == "org-a"
    assert org(usuario, query=b"org_id=org-b") == "org-a"


def test_usuario_sin_empresa_es_rechazado():
    with pytest.raises(HTTPException) as e:
        org({"role": "employee", "organization_id": None})
    assert e.value.status_code == 403


def test_superadmin_solo_accede_a_la_empresa_que_selecciona():
    superadmin = {"role": "superadmin", "organization_id": None}
    assert org(superadmin, {"X-Org-Id": "org-b"}) == "org-b"
    with pytest.raises(HTTPException) as e:
        org(superadmin)
    assert e.value.status_code == 403


# ---------- RNF-06: anti-escalada de roles ----------

@pytest.mark.parametrize("actor,objetivo,permitido", [
    ("admin", "superadmin", False),
    ("admin", "owner", False),
    ("admin", "admin", True),
    ("admin", "dpo", True),
    ("owner", "superadmin", False),
    ("owner", "owner", True),
    ("manager", "employee", False),
    ("employee", "employee", False),
    ("superadmin", "owner", True),
])
def test_matriz_de_asignacion_de_roles(actor, objetivo, permitido):
    assert puede_asignar_rol(actor, objetivo) is permitido


# ---------- RNF-11: contraseñas ----------

def test_contrasena_se_guarda_como_hash_bcrypt():
    hash_ = AuthService.get_password_hash("Clave-de-prueba-123")
    assert hash_ != "Clave-de-prueba-123"
    assert hash_.startswith("$2")
    assert AuthService.verify_password("Clave-de-prueba-123", hash_)
    assert not AuthService.verify_password("otra-clave", hash_)
