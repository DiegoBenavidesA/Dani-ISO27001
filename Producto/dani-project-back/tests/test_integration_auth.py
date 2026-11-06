import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import AuthService


client = TestClient(app)


def test_protected_risk_route_requires_token():
    response = client.get("/api/risks/")

    assert response.status_code == 401


def test_employee_cannot_access_elevated_risk_write_route():
    token = AuthService.create_access_token(
        {
            "sub": "employee@example.com",
            "role": "employee",
            "user_id": "employee-test-id",
            "organization_id": "organization-test-id",
        }
    )

    response = client.get(
        "/api/risks/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_superadmin_must_select_an_organization():
    token = AuthService.create_access_token(
        {
            "sub": "superadmin@example.com",
            "role": "superadmin",
            "user_id": "superadmin-test-id",
            "organization_id": None,
        }
    )

    response = client.get(
        "/api/risks/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
