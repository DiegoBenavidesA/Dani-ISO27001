# app/dependencies/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, DateTime
from sqlalchemy.pool import NullPool
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# ============================================
# 📌 VECTOR SUPPORT (pgvector)
# ============================================
PGVECTOR_SUPPORTED = False

try:
    from pgvector.sqlalchemy import Vector
    PGVECTOR_SUPPORTED = True
    print("✅ pgvector soportado")
except ImportError:
    print("⚠️ pgvector no disponible, usando fallback")


class TimestampMixin:
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL no está configurada en el archivo .env")

if "postgresql://" in DATABASE_URL and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    print("✅ Convertida URL a formato asyncpg")

# asyncpg NO entiende algunos parámetros de la URL estilo libpq (sslmode,
# channel_binding) que agregan Neon/Supabase. Los quitamos; asyncpg negocia el
# SSL igual con esos proveedores. (Para URLs que no los traen, esto es no-op.)
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
_p = urlsplit(DATABASE_URL)
_q = [(k, v) for k, v in parse_qsl(_p.query) if k not in ("sslmode", "channel_binding")]
DATABASE_URL = urlunsplit((_p.scheme, _p.netloc, _p.path, urlencode(_q), _p.fragment))

print(f"🔗 Conectando a BD: {DATABASE_URL[:60]}...")

USING_PGBOUNCER = ":6543" in DATABASE_URL

connect_args = {}
if USING_PGBOUNCER:
    # CAMBIO: statement_cache_size=0 + prepared_statement_cache_size=0 NO
    # bastan por sí solos para evitar el DuplicatePreparedStatementError.
    # asyncpg sigue nombrando los prepared statements de forma secuencial
    # (__asyncpg_stmt_1__, _2__, ...) incluso con el cache desactivado, y
    # como PgBouncer en modo "transaction" reutiliza la misma conexión física
    # de Postgres entre distintas conexiones lógicas, ese nombre secuencial
    # puede chocar con uno que quedó de una sesión anterior que compartió la
    # misma conexión de backend.
    #
    # La solución real: forzar que CADA prepared statement tenga un nombre
    # único garantizado (UUID), eliminando por completo la posibilidad de
    # colisión, sin importar cómo PgBouncer reutilice las conexiones.
    connect_args = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4()}__",
    }
    print("🔁 Detectado puerto 6543 (Supabase PgBouncer): prepared statements con nombre único (UUID)")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    poolclass=NullPool,
    connect_args=connect_args,
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()