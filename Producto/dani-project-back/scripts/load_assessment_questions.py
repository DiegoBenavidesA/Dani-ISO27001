"""
Carga el catálogo de preguntas de evaluación (app/data/catalogo_iso27001.json)
en la tabla assessment_questions.

Uso:
    python scripts/load_assessment_questions.py            # carga TODAS
    python scripts/load_assessment_questions.py --limit 5  # solo las primeras 5 (prueba)

Es idempotente: vacía la tabla antes de cargar, así no duplica si lo corres de nuevo.
"""
import asyncio
import json
import os
import sys
from pathlib import Path

# Para que encuentre la carpeta "app" al correr el script directamente
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, func, delete

from app.dependencies.database import AsyncSessionLocal, engine, Base
import app.models  # noqa  (registra todos los modelos)
from app.models.assessment_question import AssessmentQuestion

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "app", "data", "catalogo_iso27001.json")


def _flatten(catalogo):
    """Convierte el catálogo (controles con sub_preguntas) en filas planas."""
    filas = []
    orden = 0
    for item in catalogo:
        for sp in item.get("sub_preguntas", []):
            filas.append({
                "codigo": item["codigo"],
                "categoria": item["categoria"],
                "nombre": item["nombre"],
                "pregunta": sp["pregunta"],
                "evidencia_esperada": sp.get("evidencia_esperada"),
                "orden": orden,
            })
            orden += 1
    return filas


async def main(limit=None):
    with open(DATA_PATH, encoding="utf-8") as f:
        catalogo = json.load(f)

    filas = _flatten(catalogo)
    if limit:
        filas = filas[:limit]

    # Asegura que la tabla exista
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Idempotente: limpiar antes de cargar
        await db.execute(delete(AssessmentQuestion))
        for fila in filas:
            db.add(AssessmentQuestion(**fila))
        await db.commit()

        total = (await db.execute(select(func.count()).select_from(AssessmentQuestion))).scalar()
        print(f"Cargadas {len(filas)} preguntas. Total en la tabla: {total}")

    await engine.dispose()


if __name__ == "__main__":
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
    asyncio.run(main(limit))
