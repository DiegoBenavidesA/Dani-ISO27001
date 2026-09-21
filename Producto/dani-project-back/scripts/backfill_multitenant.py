"""
Backfill multi-tenant (N7 del PLAN_MULTITENANT).

Deja lista una base EXISTENTE para multi-empresa sin perder datos:
  1. Crea (si no existe) una EMPRESA POR DEFECTO.
  2. Asegura que la columna organization_id exista en 'users' (para bases viejas).
  3. Asigna esa empresa a todos los usuarios y a todas las filas que tengan
     organization_id sin asignar (NULL), en TODAS las tablas que tengan esa
     columna (detectadas automáticamente).

Es idempotente: se puede correr varias veces sin duplicar ni pisar datos.

Uso:
    python scripts/backfill_multitenant.py
"""
import asyncio
import sys
import uuid
from pathlib import Path

# Para que encuentre la carpeta "app" al correr el script directamente
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text

from app.dependencies.database import engine, Base
import app.models  # registra todos los modelos

DEFAULT_ORG_NAME = "Empresa Demo"


async def main():
    # Asegura que existan todas las tablas (incluida organizations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with engine.begin() as conn:
        # 1) Empresa por defecto (idempotente por nombre)
        row = (await conn.execute(
            text("SELECT id FROM organizations WHERE nombre = :n"),
            {"n": DEFAULT_ORG_NAME}
        )).fetchone()
        if row:
            org_id = row[0]
            print(f"Empresa por defecto ya existe: {org_id}")
        else:
            org_id = str(uuid.uuid4())
            await conn.execute(
                text("INSERT INTO organizations (id, nombre, activo, plan, created_at, updated_at) "
                     "VALUES (:id, :n, true, 'basico', NOW(), NOW())"),
                {"id": org_id, "n": DEFAULT_ORG_NAME}
            )
            print(f"Empresa por defecto creada: {org_id}")

        # 2) Asegura columna organization_id en users (bases viejas)
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_organization_id ON users (organization_id)"))

        # 3) Backfill de TODAS las tablas que tengan organization_id
        tablas = (await conn.execute(text(
            "SELECT table_name FROM information_schema.columns "
            "WHERE column_name = 'organization_id' AND table_schema = 'public' "
            "ORDER BY table_name"
        ))).fetchall()

        print("\nBackfill por tabla (filas actualizadas):")
        for (tabla,) in tablas:
            res = await conn.execute(
                text(f'UPDATE "{tabla}" SET organization_id = :org WHERE organization_id IS NULL'),
                {"org": org_id}
            )
            print(f"  {tabla}: {res.rowcount}")

        # 4) N6: copiar el estado actual de iso_controls a control_status
        #    (por empresa). Idempotente: solo inserta los que aún no existen
        #    para esta empresa. El catálogo iso_controls NO se toca.
        res = await conn.execute(text(
            """
            INSERT INTO control_status
                (id, control_id, organization_id, applies, status, justification, score, document_id, created_at, updated_at)
            SELECT gen_random_uuid()::text, ic.control_id, CAST(:org AS varchar),
                   COALESCE(ic.applies, true), COALESCE(ic.status, 'No Implementado'),
                   ic.justification, COALESCE(ic.score, 0), ic.document_id, NOW(), NOW()
            FROM iso_controls ic
            WHERE NOT EXISTS (
                SELECT 1 FROM control_status cs
                WHERE cs.control_id = ic.control_id AND cs.organization_id = CAST(:org AS varchar)
            )
            """
        ), {"org": org_id})
        print(f"\nN6 control_status sembrados desde iso_controls: {res.rowcount}")

    await engine.dispose()
    print("\n✅ Backfill completado. Todos los datos existentes pertenecen a la empresa por defecto.")


if __name__ == "__main__":
    asyncio.run(main())
