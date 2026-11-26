"""Reglas de roles (nadie cambia su propio rol) y eliminación de empresas por el superadmin."""
import asyncio
import os
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest
from fastapi import HTTPException

import app.routes.organizations as orgs
from app.dependencies.database import Base
from app.models.user import UserRole
from app.routes.users import cambio_propio_prohibido, puede_asignar_rol
from app.services.borrar_empresa import _cargar_modelos, plan_de_borrado


def _usuario(uid="u1", rol=UserRole.ADMIN):
    return SimpleNamespace(id=uid, role=rol)


def test_un_admin_no_puede_cambiar_su_propio_rol_ni_desactivarse():
    yo = {"user_id": "u1", "role": "admin"}
    assert "propio rol" in cambio_propio_prohibido(yo, _usuario(), "owner", None)
    assert "propio rol" in cambio_propio_prohibido(yo, _usuario(), "employee", None)
    assert "desactivar" in cambio_propio_prohibido(yo, _usuario(), None, False)
    assert cambio_propio_prohibido(yo, _usuario(), "admin", True) is None  # guardar sin cambiar el rol


def test_un_admin_puede_cambiar_el_rol_de_otros_pero_no_asignar_dueno():
    yo = {"user_id": "u1", "role": "admin"}
    assert cambio_propio_prohibido(yo, _usuario("u2", UserRole.EMPLOYEE), "manager", None) is None
    assert puede_asignar_rol("admin", "manager") is True
    assert puede_asignar_rol("admin", "owner") is False
    assert puede_asignar_rol("owner", "owner") is True


def test_el_superadmin_si_puede_cambiar_cualquier_rol():
    assert cambio_propio_prohibido({"user_id": "s", "role": "superadmin"}, _usuario("s"), "owner", False) is None


def test_el_plan_de_borrado_va_de_hijos_a_padres():
    _cargar_modelos()
    orden = [t.name for t, _ in plan_de_borrado(Base.metadata, "org")]
    assert "organizations" not in orden
    for hijo, padre in [("evidence_chunks", "evidences"), ("document_acknowledgements", "documents"),
                        ("document_acknowledgements", "users"), ("risk_assessments", "risks"),
                        ("evidences", "risks"), ("documents", "users")]:
        assert orden.index(hijo) < orden.index(padre), (hijo, padre)
    for tabla in ("data_breaches", "assessment_answers", "registro_actividad", "capas", "evidence_requests"):
        assert tabla in orden


def _db_con(org):
    res = MagicMock(); res.scalar_one_or_none.return_value = org
    db = AsyncMock(); db.execute.return_value = res
    return db


def test_no_se_elimina_una_empresa_activa():
    db = _db_con(SimpleNamespace(id="o", nombre="Clínica", activo=True))
    with pytest.raises(HTTPException) as exc:
        asyncio.run(orgs.delete_organization("o", orgs.OrganizationDelete(confirmacion="Clínica"), {"role": "superadmin"}, db))
    assert exc.value.status_code == 400 and "suspende" in exc.value.detail


def test_hay_que_escribir_el_nombre_exacto():
    db = _db_con(SimpleNamespace(id="o", nombre="Clínica", activo=False))
    with pytest.raises(HTTPException) as exc:
        asyncio.run(orgs.delete_organization("o", orgs.OrganizationDelete(confirmacion="clinica"), {"role": "superadmin"}, db))
    assert "no coincide" in exc.value.detail


def test_empresa_suspendida_y_confirmada_se_elimina():
    db = _db_con(SimpleNamespace(id="o", nombre="Clínica", activo=False))
    with patch("app.services.borrar_empresa.borrar_empresa", AsyncMock(return_value={"filas": {"users": 2}, "archivos": ["a.pdf"]})), \
         patch("app.services.borrar_empresa.quitar_archivos", AsyncMock(return_value=1)):
        r = asyncio.run(orgs.delete_organization("o", orgs.OrganizationDelete(confirmacion="Clínica"), {"role": "superadmin"}, db))
    assert r["filas"] == {"users": 2} and r["archivos_borrados"] == 1


def test_el_usuario_de_la_sesion_trae_su_correo_en_sub():
    """Sin "sub", "Aprobado por", el correo del registro de actividad y quien
    aceptó un riesgo quedaban vacíos."""
    from app.dependencies.auth import get_current_user
    u = asyncio.run(get_current_user({"sub": "ana@clinica.cl", "role": "admin", "user_id": "u1", "organization_id": "o"}))
    assert u["sub"] == "ana@clinica.cl" and u["email"] == "ana@clinica.cl"
