"""
Carga los catálogos de preguntas de evaluación en la tabla assessment_questions.
Cada catálogo pertenece a un marco normativo:

    iso27001 -> app/data/catalogo_iso27001.json
    ley21719 -> app/data/catalogo_ley21719.json

Uso:
    python scripts/load_assessment_questions.py                    # carga ambos marcos
    python scripts/load_assessment_questions.py --marco ley21719   # solo un marco
    python scripts/load_assessment_questions.py --limit 5          # solo las primeras 5 de cada marco (prueba)

Es idempotente: antes de cargar un marco borra SUS preguntas (y las respuestas
asociadas), así no duplica si lo corres de nuevo y no toca el otro marco.
"""
import asyncio
import json
import os
import sys
from pathlib import Path

# Para que encuentre la carpeta "app" al correr el script directamente
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, func, delete, text

from app.dependencies.database import AsyncSessionLocal, engine, Base
import app.models  # noqa  (registra todos los modelos)
from app.models.assessment_question import AssessmentQuestion
from app.models.assessment_answer import AssessmentAnswer

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "app", "data")
CATALOGOS = {
    "iso27001": os.path.join(DATA_DIR, "catalogo_iso27001.json"),
    "ley21719": os.path.join(DATA_DIR, "catalogo_ley21719.json"),
}


def _flatten(catalogo, marco):
    """Convierte el catálogo (controles con sub_preguntas) en filas planas."""
    filas = []
    orden = 0
    for item in catalogo:
        for sp in item.get("sub_preguntas", []):
            filas.append({
                "marco": marco,
                "codigo": item["codigo"],
                "categoria": item["categoria"],
                "nombre": item["nombre"],
                "pregunta": sp["pregunta"],
                "evidencia_esperada": sp.get("evidencia_esperada"),
                "orden": orden,
            })
            orden += 1
    return filas


async def main(marcos, limit=None):
    # Asegura la extensión pgvector, que las tablas existan y la columna marco
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS marco VARCHAR(20) NOT NULL DEFAULT 'iso27001';"))

    async with AsyncSessionLocal() as db:
        for marco in marcos:
            with open(CATALOGOS[marco], encoding="utf-8") as f:
                filas = _flatten(json.load(f), marco)
            if limit:
                filas = filas[:limit]

            # Idempotente: limpiar solo este marco (primero las respuestas, por la FK)
            ids_marco = select(AssessmentQuestion.id).where(AssessmentQuestion.marco == marco)
            await db.execute(delete(AssessmentAnswer).where(AssessmentAnswer.question_id.in_(ids_marco)))
            await db.execute(delete(AssessmentQuestion).where(AssessmentQuestion.marco == marco))
            for fila in filas:
                db.add(AssessmentQuestion(**fila))
            await db.commit()
            print(f"[{marco}] cargadas {len(filas)} preguntas.")

        total = (await db.execute(select(func.count()).select_from(AssessmentQuestion))).scalar()
        print(f"Total en la tabla: {total}")

    await engine.dispose()


if __name__ == "__main__":
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
    marcos = list(CATALOGOS)
    if "--marco" in sys.argv:
        elegido = sys.argv[sys.argv.index("--marco") + 1]
        if elegido not in CATALOGOS:
            sys.exit(f"Marco no válido: {elegido}. Usa: {', '.join(CATALOGOS)}")
        marcos = [elegido]
    asyncio.run(main(marcos, limit))
