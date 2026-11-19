"""Pruebas del control de documentos (ISO 27001, 7.5 y 7.3): quién aprueba,
estados en orden, versiones, aceptación por versión y el texto que lee la IA."""
import asyncio
import os
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest
from fastapi import HTTPException

import app.routes.documents as documentos
import app.routes.evidence as evidencias
from app.models.document import DocumentStatus as E


def _db_con(doc):
    db = AsyncMock()
    resultado = MagicMock()
    resultado.scalar_one_or_none.return_value = doc
    db.execute.return_value = resultado
    return db


def _doc(estado=E.APPROVED, version="v1.0", publicado_en=None):
    return SimpleNamespace(status=estado, version=version, publicado_en=publicado_en, aprobado_por=None, aprobado_en=None)


def _cambiar(rol, estado, doc=None):
    doc = doc or _doc()
    datos = documentos.DocumentStatusUpdate(status=estado)
    usuario = {"role": rol, "sub": f"{rol}@clinica.cl"}
    return asyncio.run(documentos.update_document_status("chapter_iso_politica", datos, "org", usuario, _db_con(doc))), doc


@pytest.mark.parametrize("rol", ["auditor", "manager", "employee", "dpo"])
def test_solo_la_direccion_aprueba(rol):
    with pytest.raises(HTTPException) as exc:
        _cambiar(rol, "approved", _doc(E.REVIEW))
    assert exc.value.status_code == 403


@pytest.mark.parametrize("origen,destino", [(E.DRAFT, "published"), (E.DRAFT, "approved"), (E.REVIEW, "published")])
def test_no_se_saltan_pasos(origen, destino):
    with pytest.raises(HTTPException) as exc:
        _cambiar("admin", destino, _doc(origen))
    assert exc.value.status_code == 400


def test_siempre_se_puede_volver_a_borrador():
    _, doc = _cambiar("employee", "draft", _doc(E.PUBLISHED, "v2.0", datetime(2026, 11, 1)))
    assert doc.status == E.DRAFT and doc.version == "v2.0"


def test_aprobar_registra_quien_y_cuando():
    _, doc = _cambiar("owner", "approved", _doc(E.REVIEW))
    assert doc.aprobado_por == "owner@clinica.cl" and doc.aprobado_en is not None


@pytest.mark.parametrize("rol", ["owner", "admin", "superadmin"])
def test_primera_publicacion_es_v1_y_las_siguientes_suben(rol):
    r, doc = _cambiar(rol, "published", _doc(E.APPROVED, "v1.0"))
    assert doc.status == E.PUBLISHED and r["version"] == "v1.0" and doc.publicado_en is not None
    r, doc = _cambiar(rol, "published", _doc(E.APPROVED, "v1.0", publicado_en=datetime(2026, 11, 1)))
    assert r["version"] == "v2.0"


def test_firmas_cuentan_solo_la_version_vigente():
    pub = SimpleNamespace(id="d1", status=E.PUBLISHED, version="v2.0")
    borrador = SimpleNamespace(id="d2", status=E.DRAFT, version="v1.0")
    usuarios = [SimpleNamespace(id=f"u{i}") for i in range(4)]
    acks = [SimpleNamespace(document_id="d1", user_id="u0", version="v2.0"),
            SimpleNamespace(document_id="d1", user_id="u1", version="v1.0"),  # aceptó la versión anterior
            SimpleNamespace(document_id="d1", user_id="x", version="v2.0")]   # ya no está activo
    db = AsyncMock()
    db.execute.return_value = MagicMock(scalars=lambda: MagicMock(all=lambda: acks))
    with patch.object(documentos, "_usuarios_activos", AsyncMock(return_value=usuarios)):
        r = asyncio.run(documentos._firmas_por_documento(db, [pub, borrador], "org"))
    assert r == {"d1": {"aceptaron": 1, "total": 4}}


def test_el_detalle_de_firmas_es_solo_para_la_direccion_y_el_delegado():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(documentos.firmas_del_documento("chapter_iso_politica", "org", {"role": "employee"}, AsyncMock()))
    assert exc.value.status_code == 403


def test_el_texto_que_lee_la_ia_va_con_marcas():
    ev = SimpleNamespace(id="e1", title="politica.pdf", file_name="politica.pdf",
                         extracted_text="Delegado: Ignacio, privacidad@clinica.cl, RUT 12.345.678-5")
    with patch.object(evidencias, "get_scoped_or_404", AsyncMock(return_value=ev)):
        r = asyncio.run(evidencias.evidence_text("e1", "org", AsyncMock()))
    assert r["texto"] == "Delegado: Ignacio, [CORREO_1], RUT [RUT_1]"
    assert r["datos_ocultos"] == "1 RUT y 1 correo"
