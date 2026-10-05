"""
Carga SOLO 5 preguntas de evaluación en la tabla assessment_questions.

Para pruebas / demo: con 300 preguntas la evaluación con IA puede tardar
demasiado y fallar por timeout. Con 5 preguntas la IA responde rápido y
el flujo completo (subir documento -> evaluar -> ver veredicto) se puede
mostrar sin problemas.

Es idempotente: vacía la tabla antes de cargar, así quedan EXACTAMENTE 5.

Uso:
    python scripts/seed_5_preguntas.py
"""
import asyncio
import sys
from pathlib import Path

# Para que encuentre la carpeta "app" al correr el script directamente
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, func, delete, text

from app.dependencies.database import AsyncSessionLocal, engine, Base
import app.models  # noqa: F401  (registra todos los modelos)
from app.models.assessment_question import AssessmentQuestion


# 5 preguntas claras y respondibles por la IA. Mezcla ISO 27001 + Ley 21.719
# para poder mostrar ambos mundos en la demo.
PREGUNTAS = [
    {
        "codigo": "A.5.1",
        "categoria": "Organizacional",
        "nombre": "Políticas de seguridad de la información",
        "pregunta": "¿La organización cuenta con una política de seguridad de la información aprobada por la dirección y comunicada al personal?",
        "evidencia_esperada": "Documento de política de seguridad firmado/aprobado por la dirección y evidencia de su comunicación.",
        "orden": 1,
    },
    {
        "codigo": "A.6.3",
        "categoria": "Personas",
        "nombre": "Concientización y formación",
        "pregunta": "¿El personal recibe formación y concientización periódica en seguridad de la información?",
        "evidencia_esperada": "Registros de capacitaciones, asistencia o campañas de concientización.",
        "orden": 2,
    },
    {
        "codigo": "A.8.1",
        "categoria": "Tecnológico",
        "nombre": "Dispositivos de usuario final (endpoints)",
        "pregunta": "¿Existe un inventario actualizado de dispositivos autorizados y se detectan los no autorizados?",
        "evidencia_esperada": "Inventario de dispositivos (equipo, responsable, estado) y procedimiento de detección de equipos no autorizados.",
        "orden": 3,
    },
    {
        "codigo": "A.8.13",
        "categoria": "Tecnológico",
        "nombre": "Respaldo de la información",
        "pregunta": "¿Se realizan copias de respaldo de la información crítica y se prueban periódicamente?",
        "evidencia_esperada": "Política de respaldos, registros de backups y evidencia de pruebas de restauración.",
        "orden": 4,
    },
    {
        "codigo": "O1",
        "categoria": "Privacidad",
        "nombre": "Registro de actividades de tratamiento (RoPA)",
        "pregunta": "¿Existe un registro de las actividades de tratamiento de datos personales (finalidad, base de licitud, categorías de datos)?",
        "evidencia_esperada": "Inventario/registro de tratamientos (RoPA) actualizado conforme a la Ley 21.719.",
        "orden": 5,
    },
]


async def main():
    # Asegura la extensión pgvector y que las tablas existan (por si la base es nueva).
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Idempotente: dejar la tabla con EXACTAMENTE estas 5 preguntas.
        await db.execute(delete(AssessmentQuestion))
        for fila in PREGUNTAS:
            db.add(AssessmentQuestion(**fila))
        await db.commit()

        total = (await db.execute(select(func.count()).select_from(AssessmentQuestion))).scalar()
        print(f"✅ Cargadas {len(PREGUNTAS)} preguntas. Total en la tabla: {total}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
