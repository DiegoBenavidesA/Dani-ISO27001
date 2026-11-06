import os

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

import app.routes.breaches as breaches
from app.routes.breaches import BreachCreate, BreachResolve, create_breach, notify_breach, resolve_breach


def run(coro):
    return asyncio.run(coro)


def test_notificar_sin_revision_confirmada_rechaza():
    breach = SimpleNamespace(gravedad_confirmada=False, estado="detectada")
    db = AsyncMock()

    with patch.object(breaches, "get_scoped_or_404", AsyncMock(return_value=breach)):
        with pytest.raises(HTTPException) as exc:
            run(notify_breach("breach-id", "org-id", {"email": "admin@example.com"}, db))
    assert exc.value.status_code in (400, 409)


def test_resolver_requiere_notificacion_de_agencia_si_aplica():
    breach = SimpleNamespace(
        gravedad_confirmada=True,
        estado="en_investigacion",
        notificacion_requerida=True,
    )
    db = AsyncMock()
    data = BreachResolve(
        causa_raiz="Configuración incorrecta del acceso",
        resolucion="Se revocaron accesos y se documentó el cierre",
    )

    with patch.object(breaches, "get_scoped_or_404", AsyncMock(return_value=breach)):
        with pytest.raises(HTTPException) as exc:
            run(resolve_breach("breach-id", data, "org-id", {"email": "admin@example.com"}, db))
    assert exc.value.status_code in (400, 409)


def test_resolver_sin_notificacion_requerida_permite_cierre():
    breach = SimpleNamespace(
        gravedad_confirmada=True,
        estado="en_investigacion",
        notificacion_requerida=False,
    )
    db = AsyncMock()
    data = BreachResolve(
        causa_raiz="Configuración incorrecta del acceso",
        resolucion="Se revocaron accesos y se documentó el cierre",
    )

    with patch.object(breaches, "get_scoped_or_404", AsyncMock(return_value=breach)):
        result = run(resolve_breach("breach-id", data, "org-id", {"email": "admin@example.com"}, db))

    assert result.estado == "cerrada"
    assert result.resolucion == data.resolucion
    db.commit.assert_awaited()


def test_plazo_72_horas_se_calcula_desde_fecha_deteccion(monkeypatch):
    fecha_deteccion = datetime(2026, 11, 5, 18, 30, tzinfo=timezone(timedelta(hours=-3)))
    db = AsyncMock()

    async def fake_analysis(*args, **kwargs):
        return None

    monkeypatch.setattr(breaches, "_analizar_y_avisar", fake_analysis)
    monkeypatch.setattr(
        breaches.asyncio,
        "create_task",
        lambda coro: coro.close(),
    )

    result = run(
        create_breach(
            BreachCreate(
                descripcion="Se detectó acceso indebido a datos personales",
                fecha_deteccion=fecha_deteccion,
            ),
            "org-id",
            {"email": "admin@example.com", "user_id": None},
            db,
        )
    )

    fecha_utc = breaches._utc_naive(fecha_deteccion)
    assert result.fecha_limite_notificacion == fecha_utc + timedelta(hours=72)
