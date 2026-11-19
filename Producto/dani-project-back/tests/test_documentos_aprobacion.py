"""Pruebas de quién aprueba documentos y del texto que se muestra como "lo
que lee la IA"."""
import asyncio
import os
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest
from fastapi import HTTPException

import app.routes.documents as documentos
import app.routes.evidence as evidencias


def _db_con(doc):
    db = AsyncMock()
    resultado = MagicMock()
    resultado.scalar_one_or_none.return_value = doc
    db.execute.return_value = resultado
    return db


def _cambiar(rol, estado):
    doc = SimpleNamespace(status=documentos.DocumentStatus.REVIEW, version="v1.0")
    datos = documentos.DocumentStatusUpdate(status=estado)
    return asyncio.run(documentos.update_document_status("chapter_iso_politica", datos, "org", {"role": rol}, _db_con(doc))), doc


@pytest.mark.parametrize("rol", ["auditor", "manager", "employee", "dpo"])
def test_solo_la_direccion_aprueba(rol):
    with pytest.raises(HTTPException) as exc:
        _cambiar(rol, "approved")
    assert exc.value.status_code == 403


@pytest.mark.parametrize("rol", ["owner", "admin", "superadmin"])
def test_la_direccion_publica_y_sube_la_version(rol):
    r, doc = _cambiar(rol, "published")
    assert doc.status == documentos.DocumentStatus.PUBLISHED and r["version"] == "v2.0"


def test_el_texto_que_lee_la_ia_va_con_marcas():
    ev = SimpleNamespace(id="e1", title="politica.pdf", file_name="politica.pdf",
                         extracted_text="Delegado: Ignacio, privacidad@clinica.cl, RUT 12.345.678-5")
    with patch.object(evidencias, "get_scoped_or_404", AsyncMock(return_value=ev)):
        r = asyncio.run(evidencias.evidence_text("e1", "org", AsyncMock()))
    assert r["texto"] == "Delegado: Ignacio, [CORREO_1], RUT [RUT_1]"
    assert r["datos_ocultos"] == "1 RUT y 1 correo"
