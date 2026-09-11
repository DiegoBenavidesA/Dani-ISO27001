# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uuid
import os
from datetime import datetime
from app.routes import chat
from app.routes import gap_analysis
from app.routes import ai_routes

from app.config import settings
from app.dependencies.database import engine, Base, AsyncSessionLocal
from app.routes import auth, risk, evidence, documents, users
from app.routes import compliance
from app.routes import capa
from app.routes import notifications
from app.routes import report
from app.models.iso_controls import ISOCControl
from app.models.capa import CAPA
from app.models.document import Document, DocumentAcknowledgement
from app.models.evidence import Evidence

# --- Modelos Ley N° 21.719 (integración de protección de datos personales) ---
# Se importan para que SQLAlchemy los registre y cree sus tablas al arrancar.
from app.models.data_treatment import DataTreatment      # Tarea 1.1 - Registro de tratamientos (RoPA)
from app.models.vendor import Vendor                      # Tarea 1.5 - Proveedores / encargados
from app.models.impact_assessment import ImpactAssessment # Tarea 1.6 - Evaluación de impacto (DPIA)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # CAMBIO: con Mangum usamos lifespan="off" (ver app/api/index.py), así
    # que este bloque YA NO corre dentro de Vercel. Lo dejamos intacto para
    # que tu entorno LOCAL (uvicorn) siga funcionando igual que hoy.
    # El setup equivalente para producción está en scripts/setup_supabase.py,
    # que corres UNA VEZ manualmente apuntando a la DATABASE_URL de Supabase.
    if os.environ.get("VERCEL"):
        logger.info("⚡ Entorno Vercel detectado: se omite el setup de arranque (ya ejecutado vía scripts/setup_supabase.py)")
        yield
        return
    
    async with engine.begin() as conn:
        from sqlalchemy import text
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables created/verified")

    from app.services.auth_service import AuthService
    from app.models.user import User, UserRole

    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == "admin@dani27001.com"))
        admin = result.scalar_one_or_none()

        if not admin:
            admin_email = os.environ.get("ADMIN_EMAIL", "admin@dani27001.com")
            admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
            admin_user = User(
                id=str(uuid.uuid4()),
                full_name="Admin User",
                email=admin_email,
                hashed_password=AuthService.get_password_hash(admin_password),
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin_user)
            await session.commit()
            logger.info(f"✅ Admin user created: {admin_email}")

    logger.info("✅ Backend ready!")
    yield

    logger.info("👋 Shutting down...")
    await engine.dispose()

app = FastAPI(
    title="DANI27001 API",
    description="Security Compliance Management System for ISO 27001",
    version="1.0.0",
    lifespan=lifespan
)

# CAMBIO: agregamos también el origin sin regex, por si necesitas un dominio
# fijo que no termine en *.vercel.app (ej. un dominio propio de la empresa).
# Reemplaza la URL de ejemplo por la real cuando la tengas, o bórrala si solo
# usarás el subdominio *.vercel.app (ya cubierto por allow_origin_regex).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://dani-iso-27001.vercel.app",  # <- dominio propio de la empresa, si aplica
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(risk.router)
app.include_router(evidence.router)
app.include_router(documents.router)
app.include_router(compliance.router)
app.include_router(chat.router)
app.include_router(gap_analysis.router)
app.include_router(capa.router)
app.include_router(notifications.router)
app.include_router(report.router)
app.include_router(ai_routes.router)

@app.get("/")
async def root():
    return {
        "message": "DANI27001 API",
        "status": "operational",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("🚀 Iniciando servidor FastAPI")
    print("=" * 50)
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info",
        reload=False
    )