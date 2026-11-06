import os

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

from unittest.mock import MagicMock, AsyncMock

from fastapi.testclient import TestClient

from app.dependencies.database import get_db
from app.main import app
from app.services.auth_service import AuthService


client = TestClient(app)


def _token(role: str, organization_id=None):
    return AuthService.create_access_token(
        {
            "sub": f"{role}@example.com",
            "role": role,
            "user_id": f"{role}-test-id",
            "organization_id": organization_id,
        }
    )


def _auth_headers(role: str, organization_id="organization-test-id", include_org=True):
    headers = {"Authorization": f"Bearer {_token(role, organization_id)}"}
    if include_org:
        headers["X-Org-Id"] = "organization-test-id"
    return headers


async def _fake_db():
    yield AsyncMock()


app.dependency_overrides[get_db] = _fake_db


def _mock_get_breaches_result():
    result = MagicMock()
    result.scalars.return_value.all.return_value = []
    db = AsyncMock()
    db.execute.return_value = result
    return db


def test_breaches_sin_token_requiere_autenticacion():
    response = client.get("/api/breaches/")
    assert response.status_code in (401, 403)


def test_roles_sin_permiso_reciben_403():
    for role in ("employee", "manager", "auditor"):
        response = client.get("/api/breaches/", headers=_auth_headers(role))
        assert response.status_code == 403, role


def test_owner_y_superadmin_tienen_acceso_al_router():
    for role in ("owner", "superadmin"):
        db = _mock_get_breaches_result()

        async def override_db():
            yield db

        app.dependency_overrides[get_db] = override_db
        headers = _auth_headers(role, None if role == "superadmin" else "organization-test-id")
        if role == "superadmin":
            headers["X-Org-Id"] = "organization-test-id"
        response = client.get("/api/breaches/", headers=headers)
        assert response.status_code == 200, role


def test_superadmin_sin_org_id_recibe_403():
    headers = {"Authorization": f"Bearer {_token('superadmin', None)}"}
    response = client.get("/api/breaches/", headers=headers)
    assert response.status_code == 403


def test_crear_breach_con_descripcion_corta_rechaza_422():
    token = _token("admin", "organization-test-id")
    response = client.post(
        "/api/breaches/",
        headers={"Authorization": f"Bearer {token}", "X-Org-Id": "organization-test-id"},
        json={"descripcion": "corta"},
    )
    assert response.status_code == 422


def test_resolver_breach_con_resolucion_corta_rechaza_422():
    token = _token("admin", "organization-test-id")
    response = client.post(
        "/api/breaches/breach-test/resolver",
        headers={"Authorization": f"Bearer {token}", "X-Org-Id": "organization-test-id"},
        json={"causa_raiz": "Causa suficientemente larga", "resolucion": "corta"},
    )
    assert response.status_code == 422
