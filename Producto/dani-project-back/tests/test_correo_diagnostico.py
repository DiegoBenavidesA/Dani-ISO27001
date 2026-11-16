"""Pruebas del diagnóstico de correo (botón "Probar correo")."""
import asyncio
import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.services import email_service
from app.services.auth_service import AuthService

client = TestClient(app)


def headers(rol):
    token = AuthService.create_access_token(
        {"sub": f"{rol}@prueba.local", "role": rol, "user_id": f"id-{rol}", "organization_id": "org-prueba"})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.parametrize("rol", ["employee", "manager", "auditor", "dpo"])
def test_solo_administradores_prueban_el_correo(rol):
    assert client.post("/api/users/correo/prueba", headers=headers(rol)).status_code == 403


def test_sin_configuracion_explica_que_falta(monkeypatch):
    monkeypatch.setattr(settings, "BREVO_API_KEY", "")
    monkeypatch.setattr(settings, "SMTP_USER", "")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "")
    r = client.post("/api/users/correo/prueba", headers=headers("admin"))
    assert r.status_code == 200
    datos = r.json()
    assert datos["enviado"] is False and datos["metodo"] is None
    assert "BREVO_API_KEY" in datos["detalle"]
    assert datos["destinatario"] == "admin@prueba.local"


def _respuesta_falsa(codigo, cuerpo):
    def post(*args, **kwargs):
        return httpx.Response(codigo, json=cuerpo)
    return post


def test_brevo_con_remitente_sin_verificar(monkeypatch):
    monkeypatch.setattr(settings, "BREVO_API_KEY", "clave-de-prueba")
    monkeypatch.setattr(settings, "EMAIL_FROM", "avisos@empresa.cl")
    monkeypatch.setattr(email_service.httpx, "post", _respuesta_falsa(400, {"message": "Sender avisos@empresa.cl is not valid"}))
    datos = asyncio.run(email_service.diagnosticar_correo("destino@empresa.cl"))
    assert datos["enviado"] is False and datos["metodo"] == "brevo"
    assert "verifícalo en Brevo" in datos["detalle"]
    assert "clave-de-prueba" not in str(datos)


def test_brevo_con_clave_invalida(monkeypatch):
    monkeypatch.setattr(settings, "BREVO_API_KEY", "clave-mala")
    monkeypatch.setattr(settings, "EMAIL_FROM", "avisos@empresa.cl")
    monkeypatch.setattr(email_service.httpx, "post", _respuesta_falsa(401, {"message": "Key not found"}))
    datos = asyncio.run(email_service.diagnosticar_correo("destino@empresa.cl"))
    assert datos["enviado"] is False and "BREVO_API_KEY" in datos["detalle"]


def test_brevo_envia_correctamente(monkeypatch):
    monkeypatch.setattr(settings, "BREVO_API_KEY", "clave-de-prueba")
    monkeypatch.setattr(settings, "EMAIL_FROM", "avisos@empresa.cl")
    monkeypatch.setattr(email_service.httpx, "post", _respuesta_falsa(201, {"messageId": "x"}))
    datos = asyncio.run(email_service.diagnosticar_correo("destino@empresa.cl"))
    assert datos["enviado"] is True and datos["detalle"] is None
