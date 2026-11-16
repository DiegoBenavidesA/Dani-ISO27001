"""Pruebas de "Analizar con IA" en el Mapa de Riesgos: los controles salen de
la IA según el riesgo y solo se aceptan códigos reales del Anexo A."""
import asyncio
import json
import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest

from app.routes.risk import controles_anexo_a
from app.services.ai_service import AIService, limpiar_controles_sugeridos

CATALOGO = controles_anexo_a()


def test_el_catalogo_tiene_los_93_controles_del_anexo_a():
    assert len(CATALOGO) == 93
    assert "A.8.5" in CATALOGO and "A.5.37" in CATALOGO and "A.12.6.1" not in CATALOGO


def test_se_descartan_codigos_inexistentes_repetidos_o_mal_formados():
    datos = [
        {"codigo": "A.8.5", "accion": "MFA en VPN", "reduce": "probabilidad", "puntos": 2},
        {"codigo": "A.8.5", "accion": "repetido", "reduce": "probabilidad", "puntos": 2},
        {"codigo": "A.12.6.1", "accion": "versión 2013", "reduce": "probabilidad", "puntos": 2},
        {"codigo": "a.8.13", "accion": "respaldos", "reduce": "impacto", "puntos": 9},
        {"codigo": "A.5.24", "accion": "sin tipo", "reduce": "otro", "puntos": 1},
        "texto suelto",
    ]
    r = limpiar_controles_sugeridos(datos, CATALOGO)
    assert [c["codigo"] for c in r] == ["A.8.5", "A.8.13"]
    assert r[1]["puntos"] == 2 and r[1]["reduce"] == "impacto"
    assert r[0]["nombre"] == CATALOGO["A.8.5"]


def test_maximo_cinco_controles():
    datos = [{"codigo": c, "reduce": "probabilidad", "puntos": 1} for c in list(CATALOGO)[:8]]
    assert len(limpiar_controles_sugeridos(datos, CATALOGO)) == 5


def test_respuesta_que_no_es_lista_no_produce_controles():
    assert limpiar_controles_sugeridos({"codigo": "A.8.5"}, CATALOGO) == []


def test_sin_ia_configurada_no_inventa_controles():
    servicio = AIService()
    servicio.client = None
    with pytest.raises(RuntimeError):
        asyncio.run(servicio.sugerir_controles_riesgo({"title": "Robo de notebook"}, CATALOGO))


class _ClienteFalso:
    """Imita al cliente de la IA y guarda el prompt recibido."""
    def __init__(self, respuesta):
        self.respuesta = respuesta
        self.prompt = None
        self.chat = self
        self.completions = self

    async def create(self, **kwargs):
        self.prompt = kwargs["messages"][0]["content"]
        mensaje = type("M", (), {"content": self.respuesta})
        eleccion = type("C", (), {"message": mensaje})
        return type("R", (), {"choices": [eleccion]})


def test_la_ia_recibe_el_riesgo_y_el_catalogo():
    cliente = _ClienteFalso(json.dumps([
        {"codigo": "A.8.1", "accion": "Cifrar los notebooks", "reduce": "impacto", "puntos": 2},
        {"codigo": "A.7.9", "accion": "Política de equipos fuera de la oficina", "reduce": "probabilidad", "puntos": 1},
    ]))
    servicio = AIService()
    servicio.client = cliente
    r = asyncio.run(servicio.sugerir_controles_riesgo(
        {"title": "Robo de notebook con datos de clientes", "description": "Equipos sin cifrar", "category": "security", "likelihood": 3, "impact": 4},
        CATALOGO))
    assert "Robo de notebook con datos de clientes" in cliente.prompt
    assert "A.8.24" in cliente.prompt  # el catálogo va en el prompt
    assert [c["codigo"] for c in r] == ["A.8.1", "A.7.9"]


def test_respuesta_invalida_de_la_ia_es_un_error():
    servicio = AIService()
    servicio.client = _ClienteFalso("no es json")
    with pytest.raises(RuntimeError):
        asyncio.run(servicio.sugerir_controles_riesgo({"title": "x"}, CATALOGO))
