# scripts/load_ley_21719.py
import asyncio
import json
import os
import sys
from pathlib import Path

# Para que encuentre la carpeta "app"
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import delete
from app.dependencies.database import engine, AsyncSessionLocal, Base
import app.models  # Registra todos los modelos en Base.metadata
from app.models.law_obligation import LawObligation


async def load_ley_21719():
    print("⚖️ Cargando catálogo de obligaciones de la Ley 21.719...")

    # Ruta al archivo JSON
    file_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "app",
        "data",
        "ley_21719.json"
    )

    with open(file_path, "r", encoding="utf-8") as f:
        obligations_data = json.load(f)

    # Nos aseguramos de que la tabla exista
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Insertamos las obligaciones
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Limpiamos la tabla primero para evitar duplicados en recargas
            await session.execute(delete(LawObligation))

            for orden, obligation_data in enumerate(obligations_data):
                obligation = LawObligation(
                    codigo=obligation_data["codigo"],
                    categoria=obligation_data["categoria"],
                    nombre=obligation_data["nombre"],
                    referencia_legal=obligation_data["referencia_legal"],
                    descripcion=obligation_data["descripcion"],
                    modulo=obligation_data.get("modulo"),
                    orden=orden
                )
                session.add(obligation)

        print(
            f"✅ ¡Éxito! Se cargaron {len(obligations_data)} "
            "obligaciones de la Ley 21.719."
        )


if __name__ == "__main__":
    asyncio.run(load_ley_21719())