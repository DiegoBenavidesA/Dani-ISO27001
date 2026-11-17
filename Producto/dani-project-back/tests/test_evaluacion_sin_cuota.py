"""Pruebas de la evaluación cuando la IA falla: las preguntas que la IA no
evaluó no se guardan como "sin evidencia" y se informa cuántas quedaron."""
import asyncio
import json
import os
from types import SimpleNamespace

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest

from app.services import question_evaluator as qe


class _Fragmentador:
    @staticmethod
    def chunk_text(texto, chunk_size=900, overlap=150):
        return [texto]


DOC = [("politica.pdf", "La clínica cifra los respaldos con AES y prueba la restauración de respaldos cada trimestre.")]


def _preguntas(n):
    return [SimpleNamespace(id=f"q{i}", codigo="A.8.13", nombre="Respaldo de información",
                            pregunta=f"¿Se prueban los respaldos cifrados? ({i})", evidencia_esperada=None, marco="iso27001")
            for i in range(n)]


def _respuesta_ok(prompt):
    ids = [p["id"] for p in json.loads(prompt.split("Responde a estas preguntas basadas SOLAMENTE en los fragmentos:\n")[1].split("\n\nInstrucciones")[0])]
    return json.dumps([{"id": i, "veredicto": "cumple", "confianza": 0.9, "justificacion": "politica.pdf"} for i in ids])


class _IA:
    def __init__(self, fallar_desde=None, error="Error code: 429 - tokens per day (TPD): Limit 200000"):
        self.llamadas = 0
        self.fallar_desde = fallar_desde
        self.error = error

    async def generate_document(self, prompt):
        self.llamadas += 1
        if self.fallar_desde is not None and self.llamadas >= self.fallar_desde:
            raise RuntimeError(self.error)
        return _respuesta_ok(prompt)


def _evaluar(ia, n=30):
    from app.routes.assessment_questions import extract_json_from_text
    return asyncio.run(qe.evaluar_preguntas(ia, _Fragmentador(), _preguntas(n), DOC, extract_json_from_text, lambda *a: None))


def test_sin_fallas_todas_se_evaluan():
    resultados, enviadas, sin_evaluar, motivo = _evaluar(_IA())
    assert len(resultados) == 30 and sin_evaluar == [] and motivo is None
    assert all(r["veredicto"] == "cumple" for r in resultados)


def test_cuota_diaria_agotada_no_guarda_sin_evidencia_y_no_reintenta(monkeypatch):
    monkeypatch.setattr(qe, "LLAMADAS_EN_PARALELO", 1)
    ia = _IA(fallar_desde=2)
    resultados, enviadas, sin_evaluar, motivo = _evaluar(ia)
    assert len(resultados) == 15 and len(sin_evaluar) == 15
    assert not any("no devolvió" in (r.get("justificacion") or "") for r in resultados)
    assert "cuota diaria" in motivo
    assert ia.llamadas == 2  # el segundo grupo falla una vez y no se reintenta


def test_respuesta_invalida_deja_las_preguntas_sin_evaluar():
    class _IAInvalida(_IA):
        async def generate_document(self, prompt):
            return "esto no es json"
    resultados, enviadas, sin_evaluar, motivo = _evaluar(_IAInvalida(), n=15)
    assert resultados == [] and len(sin_evaluar) == 15 and motivo


def test_detecta_el_limite_diario():
    assert qe.es_cuota_diaria(RuntimeError("Rate limit reached ... on tokens per day (TPD): Limit 200000"))
    assert not qe.es_cuota_diaria(RuntimeError("Rate limit reached ... on tokens per minute (TPM)"))
