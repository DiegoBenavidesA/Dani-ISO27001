"""Pruebas del paquete de auditoría: incluye todas las evidencias, con su
índice y los archivos originales que estén guardados."""
import asyncio
import io
import os
import zipfile
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import app.routes.evidence as evidencias


def _ev(nombre, url, texto="Politica de seguridad aprobada"):
    return SimpleNamespace(title=nombre, file_name=nombre, file_url=url, extracted_text=texto,
                           evidence_metadata={"control": "General", "source": "Centro de Evidencias"},
                           verified_at=datetime(2026, 11, 18), description=None)


def _resultado(filas):
    r = MagicMock()
    r.scalars.return_value.all.return_value = filas
    return r


async def _leer(respuesta):
    datos = b""
    async for parte in respuesta.body_iterator:
        datos += parte
    return zipfile.ZipFile(io.BytesIO(datos))


def test_el_paquete_incluye_todas_las_evidencias_aunque_su_control_sea_general():
    evs = [_ev("politica.pdf", "org/1_politica.pdf"), _ev("respaldos.pdf", "org/2_respaldos.pdf"),
           _ev("solo_texto.pdf", "local:solo_texto.pdf"), _ev("politica.pdf", "org/3_politica.pdf")]
    db = AsyncMock()
    db.execute.side_effect = [_resultado(evs), _resultado([])]

    with patch.object(evidencias.storage_service, "download", AsyncMock(return_value=b"%PDF-1.4 contenido")):
        respuesta = asyncio.run(evidencias.export_evidences_zip("org", db))
        z = asyncio.run(_leer(respuesta))

    nombres = z.namelist()
    assert "Evidencias/Indice_de_Evidencias.pdf" in nombres
    archivos = sorted(n for n in nombres if n.startswith("Evidencias/") and not n.endswith("Indice_de_Evidencias.pdf"))
    # 3 originales guardados (la de solo texto no tiene archivo); el nombre repetido no se pisa.
    assert archivos == ["Evidencias/2_politica.pdf", "Evidencias/politica.pdf", "Evidencias/respaldos.pdf"]
    assert not any(n.startswith("Clausula_") for n in nombres)
