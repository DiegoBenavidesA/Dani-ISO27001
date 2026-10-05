"""
⚠️  RESET TOTAL DE LA BASE DE DATOS  ⚠️

Borra TODO (tablas, tipos enum, datos) y deja la base limpia con las tablas
vacías recién creadas. Pensado para pruebas en LOCAL, no para producción.

Qué hace, en orden:
    1. DROP SCHEMA public CASCADE   -> elimina absolutamente todo
    2. CREATE SCHEMA public          -> esquema vacío de nuevo
    3. CREATE EXTENSION vector       -> re-habilita pgvector
    4. create_all                    -> recrea las tablas vacías

Después de correrlo, al iniciar el backend (uvicorn) el lifespan vuelve a
crear el superadmin y demás cuentas semilla. Las preguntas quedan en 0:
para cargarlas usa  scripts/seed_5_preguntas.py.

Uso:
    python scripts/reset_db.py          # pide confirmación escribiendo BORRAR
    python scripts/reset_db.py --yes    # sin confirmación (para automatizar)

NUNCA lo corras apuntando a la base de producción (revisa tu DATABASE_URL).
"""
import asyncio
import sys
from pathlib import Path

# Para que encuentre la carpeta "app" al correr el script directamente
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text

from app.dependencies.database import engine, Base, DATABASE_URL
import app.models  # noqa: F401  (importa y registra TODOS los modelos)


async def main():
    # Mostrar a qué base apunta (ocultando la contraseña) para evitar accidentes.
    destino = DATABASE_URL
    if "@" in destino:
        destino = destino.split("@", 1)[1]  # deja solo host/base, sin credenciales
    print(f"🎯 Base de datos destino: ...@{destino}")

    async with engine.begin() as conn:
        print("💣 Eliminando el esquema public (todas las tablas y tipos)...")
        await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))

        print("🧩 Re-habilitando la extensión pgvector...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))

        print("🏗️  Recreando las tablas vacías...")
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose()
    print("✅ Base de datos reiniciada. Inicia el backend para sembrar el superadmin.")
    print("   Luego corre: python scripts/seed_5_preguntas.py")


if __name__ == "__main__":
    if "--yes" not in sys.argv:
        print("⚠️  Esto BORRARÁ TODA la base de datos (no se puede deshacer).")
        confirm = input("Escribe BORRAR para continuar: ").strip()
        if confirm != "BORRAR":
            print("Cancelado. No se tocó nada.")
            sys.exit(0)
    asyncio.run(main())
