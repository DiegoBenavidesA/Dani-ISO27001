"""Pruebas del motivo que se muestra cuando Supabase Storage rechaza un archivo
y de los encabezados que se envían según el tipo de clave."""
import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

from app.services import storage_service as modulo
from app.services.storage_service import StorageService, motivo_rechazo


def test_clave_invalida():
    m = motivo_rechazo(400, '{"statusCode":"403","error":"Unauthorized","message":"Invalid Compact JWS"}')
    assert "clave de Supabase no es válida" in m and "Invalid Compact JWS" in m


def test_clave_sin_permiso():
    m = motivo_rechazo(400, '{"statusCode":"403","message":"new row violates row-level security policy"}')
    assert "service_role" in m


def test_bucket_inexistente():
    assert "bucket no existe" in motivo_rechazo(400, '{"statusCode":"404","message":"Bucket not found"}')


def test_tipo_de_archivo_no_permitido():
    assert "tipo de archivo" in motivo_rechazo(415, '{"message":"mime type application/pdf is not supported"}')


def test_respuesta_que_no_es_json():
    m = motivo_rechazo(502, "<html>Bad gateway</html>")
    assert "502" in m and "Bad gateway" in m


def test_clave_jwt_va_tambien_como_bearer(monkeypatch):
    monkeypatch.setattr(modulo.settings, "SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiJ9.x.y")
    h = StorageService()._headers()
    assert h["apikey"].startswith("eyJ") and h["Authorization"].startswith("Bearer eyJ")


def test_clave_nueva_solo_va_en_apikey(monkeypatch):
    monkeypatch.setattr(modulo.settings, "SUPABASE_SERVICE_KEY", "sb_secret_abc123")
    h = StorageService()._headers()
    assert h["apikey"] == "sb_secret_abc123" and "Authorization" not in h
