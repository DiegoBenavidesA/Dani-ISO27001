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
