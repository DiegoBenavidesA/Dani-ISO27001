# scripts/load_iso_controls.py
import asyncio
import sys
from pathlib import Path
import json

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.dependencies.database import AsyncSessionLocal, engine, Base
import app.models  # noqa  (registra todos los modelos para create_all)
from app.services.iso_parser import ISOParser
from app.models.iso_controls import ISOCControl

async def load_iso_controls():
    """Cargar controles ISO 27001 en la base de datos"""
    print("📖 Cargando controles ISO 27001:2022...")

    # Base nueva: asegurar la extensión pgvector y que existan las tablas.
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)

    parser = ISOParser()
    standard = parser.parse_standard()
    
    async with AsyncSessionLocal() as session:
        # Limpiar controles existentes
        from sqlalchemy import delete
        await session.execute(delete(ISOCControl))
        
        # Cargar nuevos controles
        for control_data in standard["controls"]:
            
            control = ISOCControl(
                # Buscamos "control_id", si no existe buscamos "id", y si no, ponemos "N/A"
                control_id=control_data.get("control_id", control_data.get("id", "N/A")),
                title=control_data.get("title", "Sin título"),
                description=control_data.get("description", "Sin descripción"),
                category=control_data.get("category", "General"),
                clause_reference=control_data.get("clause_reference"),
                implementation_guide=control_data.get("implementation_guide"),
                related_controls=control_data.get("related_controls", []),
                attributes=control_data.get("attributes", {})
            )
            session.add(control)
        
        await session.commit()
    
    print(f"✅ Cargados {len(standard['controls'])} controles")
    print("\n📊 Distribución por categoría:")
    
    categories = {}
    for c in standard["controls"]:
        cat = c["category"]
        categories[cat] = categories.get(cat, 0) + 1
    
    for cat, count in categories.items():
        print(f"   - {cat}: {count} controles")

async def main():
    await load_iso_controls()

if __name__ == "__main__":
    asyncio.run(main())