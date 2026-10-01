# app/utils/slug.py
"""Utilidades para generar slugs de organización (URL multi-tenant)."""
import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


def slugify(texto: str) -> str:
    """Convierte un nombre de empresa en un slug apto para URL.

    "Acme Corp S.A."  ->  "acme-corp-s-a"
    Quita acentos, pasa a minúsculas y reemplaza lo no alfanumérico por "-".
    """
    if not texto:
        return "empresa"
    # Quitar acentos (á -> a, ñ -> n).
    texto = unicodedata.normalize("NFKD", texto)
    texto = texto.encode("ascii", "ignore").decode("ascii")
    texto = texto.lower().strip()
    texto = re.sub(r"[^a-z0-9]+", "-", texto)  # no alfanumérico -> guion
    texto = re.sub(r"-+", "-", texto).strip("-")  # colapsar/limpiar guiones
    return texto or "empresa"


# Slugs reservados por la app (rutas del frontend / prefijo del superadmin).
# Ninguna empresa puede tomarlos para no chocar con esas URLs.
SLUGS_RESERVADOS = {"admin", "plataforma", "login", "activar", "api", "static"}


async def slug_unico(db: AsyncSession, base: str, Organization) -> str:
    """Devuelve un slug único, agregando un sufijo -2, -3... si ya existe."""
    base = slugify(base)
    # Si el nombre genera un slug reservado, lo desplazamos con un sufijo.
    if base in SLUGS_RESERVADOS:
        base = f"{base}-org"
    candidato = base
    n = 2
    while True:
        existe = await db.execute(
            select(Organization).where(Organization.slug == candidato)
        )
        if existe.scalar_one_or_none() is None:
            return candidato
        candidato = f"{base}-{n}"
        n += 1
