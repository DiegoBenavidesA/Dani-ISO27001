"""
Recrea las tablas OPERATIVAS de la Ley 21.719 para corregir "schema drift"
(tablas creadas con modelos viejos que ya no coinciden con el código actual).

Qué hace:
  1. Borra (DROP ... CASCADE) las 6 tablas operativas de la Ley + el tipo enum
     viejo `legal_basis`.
  2. Las recrea desde los modelos ACTUALES (create_all).

NO toca: usuarios, controles ISO, catálogos (assessment_questions, law_obligations),
ni las tablas de estado por empresa (control_status, assessment_answers).

⚠️ BORRA los datos de esas 6 tablas (tratamientos, consentimientos, solicitudes,
brechas, proveedores, evaluaciones de impacto). En un entorno de DEMO no hay
problema. NO lo corras contra una base con datos reales que debas conservar.

Por seguridad, exige el flag --confirm para ejecutar:
    python scripts/reset_ley_tables.py --confirm

Recuerda apuntar DATABASE_URL a la base correcta antes de correrlo.
Después, corre:  python scripts/backfill_multitenant.py
"""
import asyncio
import sys

from sqlalchemy import text

from app.dependencies.database import engine, Base
import app.models  # registra todos los modelos

TABLAS = [
    "consents",
    "vendors",
    "impact_assessments",
    "data_subject_requests",
    "data_breaches",
    "data_treatments",   # al final: la referencian las demás
]


async def main():
    async with engine.begin() as conn:
        for t in TABLAS:
            await conn.execute(text(f'DROP TABLE IF EXISTS {t} CASCADE'))
        # El tipo enum viejo que causaba el conflicto en base_licitud
        await conn.execute(text('DROP TYPE IF EXISTS legal_basis'))
        print("Tablas operativas de la Ley eliminadas.")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Tablas recreadas desde los modelos actuales.")

    # Verificación rápida de data_treatments
    async with engine.begin() as conn:
        q = text("""SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name='data_treatments'
                    AND column_name IN ('base_licitud','transferencias_internacionales','created_at')
                    ORDER BY column_name""")
        print("\nVerificación data_treatments:")
        for r in (await conn.execute(q)).fetchall():
            print(f"  {r[0]:32} {r[1]:20} nullable={r[2]}")

    await engine.dispose()
    print("\n✅ Listo. Ahora corre: python scripts/backfill_multitenant.py")


if __name__ == "__main__":
    if "--confirm" not in sys.argv:
        print("⚠️  Este script BORRA y recrea las 6 tablas operativas de la Ley 21.719.")
        print("    Si estás seguro (entorno demo, sin datos reales que conservar), ejecútalo con:")
        print("        python scripts/reset_ley_tables.py --confirm")
        sys.exit(1)
    asyncio.run(main())
