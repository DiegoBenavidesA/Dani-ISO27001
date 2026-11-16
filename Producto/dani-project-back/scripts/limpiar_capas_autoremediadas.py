"""
Borra las acciones correctivas (CAPA) que creó la antigua "Remediación
autónoma" del Análisis Predictivo IA. Esa función no ejecutaba nada: solo
registraba la CAPA como resuelta al 100%, así que esos registros afirman
correcciones que nunca ocurrieron.

Se identifican por las dos marcas que ponía esa función:
  - el título empieza con "[AUTO-REMEDIADO]"
  - el responsable es "NormIA Autonomous Engine"

Uso:
    python scripts/limpiar_capas_autoremediadas.py            # solo muestra cuáles borraría
    python scripts/limpiar_capas_autoremediadas.py --borrar   # las borra
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, delete, and_

from app.dependencies.database import AsyncSessionLocal
import app.models  # noqa  (registra todos los modelos)
from app.models.capa import CAPA

FILTRO = and_(CAPA.title.like("[AUTO-REMEDIADO]%"), CAPA.assignee == "NormIA Autonomous Engine")


async def main(borrar: bool):
    async with AsyncSessionLocal() as db:
        capas = (await db.execute(select(CAPA).where(FILTRO))).scalars().all()
        if not capas:
            print("No hay CAPAs creadas por la remediación autónoma. Nada que borrar.")
            return
        print(f"CAPAs creadas por la remediación autónoma: {len(capas)}")
        for c in capas:
            print(f"  - {c.nc_code} | empresa {c.organization_id} | {c.title}")
        if not borrar:
            print("\nNo se borró nada. Para borrarlas, vuelve a ejecutar con --borrar.")
            return
        resultado = await db.execute(delete(CAPA).where(FILTRO))
        await db.commit()
        print(f"\nBorradas: {resultado.rowcount}")


if __name__ == "__main__":
    asyncio.run(main("--borrar" in sys.argv))
