"""Eliminación definitiva de una empresa y de todos sus datos.

Solo la usa el superadmin, y únicamente sobre una empresa suspendida y
confirmando su nombre. Borra en orden inverso a las dependencias para no
romper las claves foráneas:

- tablas con columna organization_id: las filas de esa empresa;
- tablas sin esa columna que apuntan, directa o indirectamente, a filas que
  se borran (aceptaciones de políticas, evaluaciones de riesgos): esas filas;
- al final, la empresa.

Los archivos de las evidencias se borran del almacenamiento después de
confirmar la transacción.
"""
import importlib
import logging
import pkgutil

from sqlalchemy import delete, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

import app.models as paquete_modelos
from app.dependencies.database import Base

logger = logging.getLogger(__name__)


def _cargar_modelos():
    """Importa todos los modelos para que aparezcan en Base.metadata."""
    for m in pkgutil.iter_modules(paquete_modelos.__path__):
        importlib.import_module(f"app.models.{m.name}")


def plan_de_borrado(metadata, org_id: str) -> list:
    """Lista de (tabla, condición) en el orden en que se borran (hijos primero).
    Una tabla con organization_id se filtra por esa columna. Una tabla sin ella
    se borra si apunta a filas que se van a borrar (aunque sea a través de otra
    tabla, como acciones de remediación de un análisis de un usuario)."""
    condiciones = {}
    for tabla in metadata.sorted_tables:  # padres antes que hijos
        if tabla.name == "organizations":
            continue
        if "organization_id" in tabla.c:
            condiciones[tabla.name] = tabla.c.organization_id == org_id
            continue
        partes = []
        for col in tabla.columns:
            for fk in col.foreign_keys:
                padre = fk.column.table
                if padre.name in condiciones:
                    partes.append(col.in_(select(fk.column).where(condiciones[padre.name])))
        if partes:
            condiciones[tabla.name] = or_(*partes)
    return [(t, condiciones[t.name]) for t in reversed(metadata.sorted_tables) if t.name in condiciones]


async def _existe(db: AsyncSession, nombre: str) -> bool:
    return (await db.execute(text("SELECT to_regclass(:t)"), {"t": nombre})).scalar() is not None


async def borrar_empresa(db: AsyncSession, org_id: str) -> dict:
    """Borra la empresa y sus datos. Devuelve cuántas filas se borraron por tabla
    y la lista de archivos a quitar del almacenamiento."""
    _cargar_modelos()
    archivos = []
    if await _existe(db, "evidences"):
        from app.models.evidence import Evidence
        archivos = [u for (u,) in (await db.execute(
            select(Evidence.file_url).where(Evidence.organization_id == org_id)
        )).all() if u and not u.startswith("local:")]

    conteo = {}
    for tabla, condicion in plan_de_borrado(Base.metadata, org_id):
        if not await _existe(db, tabla.name):
            continue
        filas = (await db.execute(delete(tabla).where(condicion))).rowcount or 0
        if filas:
            conteo[tabla.name] = filas

    org_tabla = Base.metadata.tables["organizations"]
    await db.execute(delete(org_tabla).where(org_tabla.c.id == org_id))
    await db.commit()
    return {"filas": conteo, "archivos": archivos}


async def quitar_archivos(archivos: list) -> int:
    """Borra del almacenamiento los archivos de las evidencias. Si alguno falla
    se registra y se sigue: los datos ya se borraron."""
    from app.services.storage_service import storage_service
    borrados = 0
    for ruta in archivos:
        try:
            await storage_service.delete(ruta)
            borrados += 1
        except Exception as e:
            logger.warning(f"No se pudo borrar el archivo {ruta}: {e}")
    return borrados
