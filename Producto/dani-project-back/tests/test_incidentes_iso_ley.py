"""Pruebas de incidentes: todos se gestionan (ISO 27001) y solo los que afectan
datos personales son vulneraciones de la Ley 21.719 con reporte a la Agencia."""
import os

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

import app.routes.breaches as breaches
from app.routes.breaches import BreachReview, BreachRiesgo, link_risk, notify_breach, review_breach, _parsear_objeto


def run(coro):
    return asyncio.run(coro)


def _breach(**kw):
    base = dict(estado="en_investigacion", gravedad_confirmada=True, notificacion_requerida=True,
                afecta_datos_personales=None, riesgo_id=None, confirmada_por="x", fecha_confirmacion=None)
    base.update(kw)
    return SimpleNamespace(**base)


def test_incidente_sin_datos_personales_no_se_reporta_a_la_agencia():
    breach = _breach(afecta_datos_personales=False)
    with patch.object(breaches, "get_scoped_or_404", AsyncMock(return_value=breach)):
        with pytest.raises(HTTPException) as exc:
            run(notify_breach("b", "org", {"email": "a@x.cl"}, AsyncMock()))
    assert exc.value.status_code == 400 and "no afecta datos personales" in exc.value.detail


def test_la_revision_sin_datos_personales_quita_la_obligacion_de_reportar():
    breach = _breach()
    data = BreachReview(gravedad="media", afectados_estimacion="desconocido", notificacion_requerida=True,
                        afecta_datos_personales=False)
    with patch.object(breaches, "get_scoped_or_404", AsyncMock(return_value=breach)), \
         patch.object(breaches, "_nombre_usuario", AsyncMock(return_value="Admin")):
        r = run(review_breach("b", data, "org", {"email": "a@x.cl"}, AsyncMock()))
    assert r.afecta_datos_personales is False and r.notificacion_requerida is False


def test_la_revision_con_datos_personales_mantiene_el_reporte():
    breach = _breach()
    data = BreachReview(gravedad="critica", afectados_estimacion="desconocido", notificacion_requerida=True,
                        afecta_datos_personales=True)
    with patch.object(breaches, "get_scoped_or_404", AsyncMock(return_value=breach)), \
         patch.object(breaches, "_nombre_usuario", AsyncMock(return_value="Admin")):
        r = run(review_breach("b", data, "org", {"email": "a@x.cl"}, AsyncMock()))
    assert r.afecta_datos_personales is True and r.notificacion_requerida is True


def test_no_se_puede_desclasificar_algo_ya_reportado():
    breach = _breach(estado="notificada")
    data = BreachReview(gravedad="media", afectados_estimacion="desconocido", notificacion_requerida=True,
                        afecta_datos_personales=False)
    with patch.object(breaches, "get_scoped_or_404", AsyncMock(return_value=breach)):
        with pytest.raises(HTTPException):
            run(review_breach("b", data, "org", {"email": "a@x.cl"}, AsyncMock()))


def test_asociar_y_quitar_el_riesgo_materializado():
    breach = _breach()
    llamadas = []

    async def scoped(db, modelo, ident, org, detail=None):
        llamadas.append(modelo.__name__)
        return breach if modelo.__name__ == "DataBreach" else SimpleNamespace(id=ident)

    with patch.object(breaches, "get_scoped_or_404", scoped):
        r = run(link_risk("b", BreachRiesgo(riesgo_id="riesgo-1"), "org", {"email": "a@x.cl"}, AsyncMock()))
        assert r.riesgo_id == "riesgo-1" and "Risk" in llamadas  # el riesgo debe ser de la misma empresa
        r = run(link_risk("b", BreachRiesgo(riesgo_id=None), "org", {"email": "a@x.cl"}, AsyncMock()))
        assert r.riesgo_id is None


def test_la_ia_propone_si_afecta_datos_personales():
    assert _parsear_objeto('{"afecta_datos_personales": false, "gravedad": "media"}')["afecta_datos_personales"] is False
    assert _parsear_objeto('{"gravedad": "media"}')["afecta_datos_personales"] is None
