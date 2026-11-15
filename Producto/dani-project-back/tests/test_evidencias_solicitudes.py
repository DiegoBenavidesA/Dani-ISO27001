"""Pruebas de la lectura de evidencias y de las solicitudes de evidencia."""
import asyncio
import io
import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import AuthService
from app.services.text_extraction import extraer_texto, texto_guardado_valido
from app.routes.evidence_requests import vincular_subida
from app.models.evidence_request import EvidenceRequest

client = TestClient(app)


def headers(rol):
    token = AuthService.create_access_token(
        {"sub": f"{rol}@prueba.local", "role": rol, "user_id": f"id-{rol}", "organization_id": "org-prueba"})
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------- lectura de archivos

def test_word_se_lee_como_texto_y_no_como_zip():
    import docx
    doc = docx.Document()
    doc.add_paragraph("Política de control de acceso aprobada por la gerencia")
    tabla = doc.add_table(rows=1, cols=2)
    tabla.rows[0].cells[0].text = "Responsable"
    tabla.rows[0].cells[1].text = "Jefe de TI"
    buf = io.BytesIO()
    doc.save(buf)
    texto = extraer_texto(buf.getvalue(), "politica.docx")
    assert "control de acceso" in texto
    assert "Responsable | Jefe de TI" in texto
    assert not texto.startswith("PK")


def test_excel_se_lee_por_hoja_y_fila():
    from openpyxl import Workbook
    libro = Workbook()
    libro.active.title = "Proveedores"
    libro.active.append(["Proveedor", "Contrato firmado"])
    libro.active.append(["Acme", "Sí"])
    buf = io.BytesIO()
    libro.save(buf)
    texto = extraer_texto(buf.getvalue(), "registro.xlsx")
    assert "Hoja: Proveedores" in texto
    assert "Acme | Sí" in texto


@pytest.mark.parametrize("nombre", ["captura.png", "foto.JPG", "scan.webp"])
def test_imagenes_no_generan_texto(nombre):
    assert extraer_texto(b"\x89PNG\r\n\x1a\n\x00\x00basura", nombre) == ""


def test_archivo_danado_no_rompe_la_subida():
    assert extraer_texto(b"esto no es un pdf", "roto.pdf") == ""


def test_texto_guardado_de_un_word_antiguo_se_descarta():
    assert texto_guardado_valido("PK\x03\x04\x14\x00 basura binaria", "politica.docx") == ""
    assert texto_guardado_valido("basura de imagen", "foto.png") == ""
    assert texto_guardado_valido("  Texto real  ", "politica.pdf") == "Texto real"


# ---------------------------------------------------------------- permisos de solicitudes

@pytest.mark.parametrize("rol", ["employee", "dpo"])
def test_roles_sin_acceso_a_evidencias_no_ven_solicitudes(rol):
    assert client.get("/api/evidence-requests/", headers=headers(rol)).status_code == 403


@pytest.mark.parametrize("ruta,metodo", [
    ("/api/evidence-requests/", "post"),
    ("/api/evidence-requests/x/recordatorio", "post"),
    ("/api/evidence-requests/x/recibida", "post"),
    ("/api/evidence-requests/x", "delete"),
    ("/api/evidence-requests/usuarios", "get"),
])
def test_auditor_solo_lee_solicitudes(ruta, metodo):
    cuerpo = {"titulo": "Registro", "asignado_a": "u1", "fecha_limite": "2099-01-01"}
    kwargs = {"json": cuerpo} if metodo == "post" else {}
    r = getattr(client, metodo)(ruta, headers=headers("auditor"), **kwargs)
    assert r.status_code == 403


@pytest.mark.parametrize("cuerpo", [
    {"asignado_a": "u1", "fecha_limite": "2099-01-01"},                 # sin título
    {"titulo": "Registro", "fecha_limite": "2099-01-01"},               # sin asignado
    {"titulo": "Registro", "asignado_a": "u1", "fecha_limite": "mañana"},  # fecha inválida
])
def test_solicitud_incompleta_es_rechazada(cuerpo):
    assert client.post("/api/evidence-requests/", json=cuerpo, headers=headers("admin")).status_code == 422


def test_solicitudes_sin_token_son_rechazadas():
    assert client.get("/api/evidence-requests/").status_code in (401, 403)


# ---------------------------------------------------------------- subida vinculada

class _Resultado:
    def __init__(self, filas):
        self._filas = filas

    def scalars(self):
        return self

    def all(self):
        return self._filas


class _SesionFalsa:
    """Devuelve las solicitudes que cumplen el filtro y registra el commit."""
    def __init__(self, filas):
        self.filas = filas
        self.commits = 0
        self.ultima_consulta = None

    async def execute(self, consulta):
        self.ultima_consulta = str(consulta)
        return _Resultado(self.filas)

    async def commit(self):
        self.commits += 1


def _solicitud(estado="pendiente"):
    return EvidenceRequest(id="s1", organization_id="org", titulo="Registro", asignado_a="u1",
                           solicitado_por="u2", estado=estado)


def test_subir_evidencia_marca_la_solicitud_como_subida():
    s = _solicitud()
    db = _SesionFalsa([s])
    cambiadas = asyncio.run(vincular_subida(db, "org", "u1", "ev-9"))
    assert cambiadas == 1 and s.estado == "subida" and s.evidence_id == "ev-9" and s.subida_en
    assert db.commits == 1


def test_subida_con_solicitud_indicada_filtra_por_esa_solicitud():
    db = _SesionFalsa([])
    asyncio.run(vincular_subida(db, "org", "u1", "ev-9", "s1"))
    assert "evidence_requests.id" in db.ultima_consulta
    assert db.commits == 0  # nada que cambiar, no hay commit


def test_subida_sin_usuario_no_toca_solicitudes():
    db = _SesionFalsa([_solicitud()])
    assert asyncio.run(vincular_subida(db, "org", None, "ev-9")) == 0
    assert db.ultima_consulta is None


# ---------------------------------------------------------------- diagnóstico del almacenamiento

@pytest.mark.parametrize("rol", ["manager", "auditor"])
def test_diagnostico_de_almacenamiento_solo_para_administradores(rol):
    assert client.get("/api/evidence/almacenamiento", headers=headers(rol)).status_code == 403


def test_diagnostico_sin_configuracion_no_expone_claves(monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "SUPABASE_URL", "")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_KEY", "")
    r = client.get("/api/evidence/almacenamiento", headers=headers("admin"))
    assert r.status_code == 200
    datos = r.json()
    assert datos["configurado"] is False and datos["bucket_accesible"] is False
    assert set(datos) == {"configurado", "url_definida", "clave_definida", "bucket", "bucket_accesible", "detalle"}
