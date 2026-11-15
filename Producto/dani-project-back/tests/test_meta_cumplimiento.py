"""Pruebas de la meta interna de cumplimiento de la SOA (PUT /api/gap-analysis/meta)."""
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


@pytest.mark.parametrize("rol", ["employee", "auditor", "dpo"])
def test_roles_sin_permiso_no_cambian_la_meta(rol):
    r = client.put("/api/gap-analysis/meta", json={"meta": 90}, headers=headers(rol))
    assert r.status_code == 403


@pytest.mark.parametrize("meta", [0, 101, -5])
def test_meta_fuera_de_rango_es_rechazada(meta):
    r = client.put("/api/gap-analysis/meta", json={"meta": meta}, headers=headers("admin"))
    assert r.status_code == 422


def test_meta_sin_token_es_rechazada():
    assert client.put("/api/gap-analysis/meta", json={"meta": 90}).status_code in (401, 403)
