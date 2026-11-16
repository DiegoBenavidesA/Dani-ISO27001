"""Pruebas del Generador de Docs: qué documentos existen, qué preguntas usa
cada uno y qué información recibe la IA."""
import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routes import documents as rutas_documentos
from app.services.auth_service import AuthService
from app.services.document_catalog import (
    DOCUMENTOS, armar_prompt, elegir_evidencias, fuentes, pregunta_aplica, _palabras,
)

client = TestClient(app)


def headers(rol):
    token = AuthService.create_access_token(
        {"sub": f"{rol}@prueba.local", "role": rol, "user_id": f"id-{rol}", "organization_id": "org-prueba"})
    return {"Authorization": f"Bearer {token}"}


def test_catalogo_tiene_los_documentos_iso_y_los_dos_de_la_ley():
    r = client.get("/api/documents/catalogo", headers=headers("admin"))
    assert r.status_code == 200
    ids = {d["id"] for d in r.json()}
    assert {"iso_alcance", "iso_politica", "iso_riesgos", "iso_objetivos", "ley_pol", "ley_bre"} <= ids
    assert all(d["marco"] in ("iso27001", "ley21719") for d in r.json())


def test_documento_desconocido_da_404():
    r = client.post("/api/documents/generate/chapter_7", json={}, headers=headers("admin"))
    assert r.status_code == 404


def test_preguntas_iso_se_eligen_por_clausula():
    alcance = DOCUMENTOS["iso_alcance"]
    assert pregunta_aplica(alcance, "4.3", "Cláusula")
    assert not pregunta_aplica(alcance, "5.2", "Cláusula")
    politica = DOCUMENTOS["iso_politica"]
    assert pregunta_aplica(politica, "A.5.1", "Organizacional")
    assert not pregunta_aplica(politica, "A.5.15", "Organizacional")  # A.5.1 no incluye A.5.15


def test_preguntas_de_la_ley_se_eligen_por_tema():
    assert pregunta_aplica(DOCUMENTOS["ley_bre"], "12", "Brechas de seguridad de los datos personales")
    assert not pregunta_aplica(DOCUMENTOS["ley_bre"], "3", "Derechos de los interesados")
    assert pregunta_aplica(DOCUMENTOS["ley_pol"], "3", "Derechos de los interesados")


def test_evidencias_se_eligen_por_relacion_con_el_documento():
    palabras = _palabras("Protocolo de vulneraciones: detección, notificación a la agencia y a los titulares afectados")
    evidencias = [
        ("menu_casino.pdf", "Lunes porotos, martes tallarines, miércoles pescado."),
        ("procedimiento_incidentes.pdf", "Ante una vulneración se registra la detección, se notifica a la agencia y a los titulares afectados."),
    ]
    elegidas = elegir_evidencias(evidencias, palabras)
    assert [n for n, _ in elegidas] == ["procedimiento_incidentes.pdf"]


CTX = {
    "empresa": "Comercial Andes SpA",
    "respuestas": ["- [4.3] ¿El alcance está documentado? -> No cumple. No se encontró documento de alcance."],
    "evidencias": [("organigrama.pdf", "Gerencia general, área de TI con dos personas.")],
    "riesgos": ["- Robo de notebook (probabilidad 3, impacto 4, nivel high)"],
    "preguntas_relacionadas": 12,
}


def test_el_prompt_lleva_la_empresa_las_respuestas_y_las_evidencias():
    p = armar_prompt("iso_alcance", CTX)
    assert "Comercial Andes SpA" in p
    assert "No cumple. No se encontró documento de alcance." in p
    assert "organigrama.pdf" in p and "área de TI" in p
    assert "PENDIENTE:" in p
    for seccion in DOCUMENTOS["iso_alcance"]["secciones"]:
        assert seccion in p
    assert "Robo de notebook" not in p  # los riesgos solo van en los documentos de riesgos


def test_los_documentos_de_riesgos_reciben_el_mapa_de_riesgos():
    assert "Robo de notebook" in armar_prompt("iso_plan_tratamiento", CTX)


def test_el_prompt_de_la_ley_habla_de_la_ley_21719():
    p = armar_prompt("ley_bre", CTX)
    assert "Ley N° 21.719" in p and "Agencia" in p


def test_resumen_de_fuentes():
    f = fuentes(CTX)
    assert f == {"respuestas": 1, "preguntas_relacionadas": 12, "evidencias": ["organigrama.pdf"], "riesgos": 1}


def test_generar_usa_el_contexto_de_la_empresa(monkeypatch):
    async def contexto_falso(db, org_id, doc_id):
        assert org_id == "org-prueba" and doc_id == "ley_pol"
        return dict(CTX)

    recibido = {}

    async def ia_falsa(prompt):
        recibido["prompt"] = prompt
        return "# Política de Tratamiento de Datos Personales\n..."

    monkeypatch.setattr(rutas_documentos, "armar_contexto", contexto_falso)
    monkeypatch.setattr(rutas_documentos.ai_service, "generate_document", ia_falsa)
    r = client.post("/api/documents/generate/chapter_ley_pol", json={}, headers=headers("admin"))
    assert r.status_code == 200
    assert r.json()["fuentes"]["evidencias"] == ["organigrama.pdf"]
    assert "Comercial Andes SpA" in recibido["prompt"]


def test_sin_ia_configurada_no_se_genera_nada(monkeypatch):
    async def contexto_falso(db, org_id, doc_id):
        return dict(CTX)

    async def ia_sin_clave(prompt):
        return "Error: API key no configurada"

    monkeypatch.setattr(rutas_documentos, "armar_contexto", contexto_falso)
    monkeypatch.setattr(rutas_documentos.ai_service, "generate_document", ia_sin_clave)
    r = client.post("/api/documents/generate/chapter_iso_politica", json={}, headers=headers("admin"))
    assert r.status_code == 503
