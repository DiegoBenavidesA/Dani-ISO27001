import os

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_responde_estado_healthy():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_preflight_cors_localhost_es_aceptado():
    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_preflight_cors_sitio_malicioso_no_es_aceptado():
    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": "https://sitio-malicioso.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert "access-control-allow-origin" not in response.headers


def test_login_sin_password_responde_422():
    response = client.post("/api/auth/login", json={"email": "usuario@example.com"})
    assert response.status_code == 422
