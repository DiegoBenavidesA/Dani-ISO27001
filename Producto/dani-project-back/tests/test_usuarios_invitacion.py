"""Pruebas del reenvío de invitaciones de usuario."""
import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import AuthService

client = TestClient(app)


def headers(rol):
    token = AuthService.create_access_token(
        {"sub": f"{rol}@prueba.local", "role": rol, "user_id": f"id-{rol}", "organization_id": "org-prueba"})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.parametrize("rol", ["employee", "manager", "auditor", "dpo"])
def test_solo_administradores_reenvian_invitaciones(rol):
    r = client.post("/api/users/u1/reenviar-invitacion", headers=headers(rol))
    assert r.status_code == 403


def test_reenviar_invitacion_sin_token_es_rechazado():
    assert client.post("/api/users/u1/reenviar-invitacion").status_code in (401, 403)
