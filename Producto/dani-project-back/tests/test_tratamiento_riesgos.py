"""Pruebas del tratamiento de riesgos (ISO 27001, 6.1.3 y 8.2) y del resumen
del panel de la plataforma."""
import asyncio
import os
from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest
from fastapi import HTTPException

import app.routes.risk as rutas
from app.models.risk import RiskLevel, RiskStatus
from app.routes.organizations import resumen_cumplimiento
from app.routes.risk import RiskUpdate, nivel_por_puntaje, residual, update_risk

USUARIO = {"sub": "camila@clinica.cl", "user_id": "u1", "role": "admin"}


def run(c):
    return asyncio.run(c)


def _riesgo(**kw):
    base = dict(id="r1", title="Robo de notebook", description="d", category="security", likelihood=4, impact=5,
                risk_level=RiskLevel.CRITICAL, status=RiskStatus.OPEN, owner="camila@clinica.cl",
                due_date=None, controls=[], mitigation_plan=None, residual_likelihood=None,
                residual_impact=None, aceptado_por=None, aceptado_en=None, revision_fecha=None, closed_at=None)
    base.update(kw)
    return SimpleNamespace(**base)


def _actualizar(riesgo, datos, responsable=None):
    with patch.object(rutas, "get_scoped_or_404", AsyncMock(return_value=riesgo)), \
         patch.object(rutas, "_validar_responsable", AsyncMock(return_value=responsable or SimpleNamespace(email="x"))), \
         patch.object(rutas, "_avisar_responsable", AsyncMock()), \
         patch.object(rutas, "_responder", AsyncMock(side_effect=lambda db, rs, org: rs)):
        return run(update_risk("r1", RiskUpdate(**datos), "org", USUARIO, AsyncMock()))


def test_niveles_y_riesgo_residual():
    assert nivel_por_puntaje(20) == RiskLevel.CRITICAL and nivel_por_puntaje(12) == RiskLevel.HIGH
    assert nivel_por_puntaje(4) == RiskLevel.MEDIUM and nivel_por_puntaje(3) == RiskLevel.LOW
    plan = [{"reduce": "impacto", "puntos": 2}, {"reduce": "probabilidad", "puntos": 1}]
    assert residual(4, 5, plan) == (3, 3)
    assert residual(1, 1, plan) == (1, 1)  # nunca baja de 1


def test_editar_probabilidad_recalcula_el_nivel():
    r = _actualizar(_riesgo(), {"likelihood": 1, "impact": 3})
    assert r.risk_level == RiskLevel.LOW


def test_probabilidad_fuera_de_rango_se_rechaza():
    with pytest.raises(HTTPException):
        _actualizar(_riesgo(), {"likelihood": 7})


def test_el_plan_solo_guarda_controles_reales_y_calcula_el_residual():
    plan = [{"codigo": "A.8.24", "accion": "Cifrar notebooks", "reduce": "impacto", "puntos": 2},
            {"codigo": "A.99.1", "accion": "inventado", "reduce": "impacto", "puntos": 2}]
    r = _actualizar(_riesgo(), {"controls": plan, "status": "in_review"})
    assert [c["codigo"] for c in r.controls] == ["A.8.24"]
    assert (r.residual_likelihood, r.residual_impact) == (4, 3)


def test_aceptar_registra_quien_y_cuando_y_fija_la_revision_anual():
    r = _actualizar(_riesgo(status=RiskStatus.IN_REVIEW), {"status": "accepted"})
    assert r.aceptado_por == "camila@clinica.cl" and r.aceptado_en is not None
    assert timedelta(days=364) < r.revision_fecha - datetime.utcnow() <= timedelta(days=365)


def test_cerrar_registra_la_fecha_y_reabrir_la_quita():
    r = _actualizar(_riesgo(), {"status": "closed"})
    assert r.closed_at is not None
    r = _actualizar(r, {"status": "open"})
    assert r.closed_at is None


def test_responder_marca_tratamiento_vencido_y_revision_pendiente():
    ayer = datetime.utcnow() - timedelta(days=1)
    vencido = _riesgo(id="a", due_date=ayer, status=RiskStatus.IN_REVIEW)
    por_revisar = _riesgo(id="b", status=RiskStatus.ACCEPTED, revision_fecha=ayer)
    db = AsyncMock()
    vacio = SimpleNamespace(all=lambda: [], scalars=lambda: SimpleNamespace(all=lambda: []))
    db.execute.return_value = vacio
    salida = run(rutas._responder(db, [vencido, por_revisar], "org"))
    assert salida[0]["tratamiento_vencido"] and not salida[0]["revision_pendiente"]
    assert salida[1]["revision_pendiente"] and not salida[1]["tratamiento_vencido"]


def test_resumen_del_panel_usa_el_mismo_calculo_que_el_resultado():
    orgs = [("o1", "Clínica", True), ("o2", "Tienda", True), ("o3", "Inactiva", False)]
    filas = [("o1", "iso27001", "cumple", 9), ("o1", "iso27001", "parcial", 2), ("o1", "iso27001", "no_aplica", 5),
             ("o2", "iso27001", "no_cumple", 3), ("o2", "iso27001", "cumple", 1),
             ("o1", "ley21719", "sin_evidencia", 4)]
    r = resumen_cumplimiento(orgs, filas, usuarios_activos=7)
    assert r["empresas_activas"] == 2 and r["total_empresas"] == 3 and r["usuarios_activos"] == 7
    assert [(e["nombre"], e["pct"]) for e in r["iso27001"]["top"]] == [("Clínica", 91), ("Tienda", 25)]
    assert r["iso27001"]["cumplen"] == 1 and r["iso27001"]["evaluadas"] == 2
    assert r["ley21719"]["top"][0]["pct"] == 0 and r["ley21719"]["cumplen"] == 0
