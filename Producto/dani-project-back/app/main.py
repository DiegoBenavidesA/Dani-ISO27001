# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uuid
import os

from app.config import settings
from app.dependencies.database import engine, Base, AsyncSessionLocal

# --- Routers ---
from app.routes import auth, risk, evidence, documents, users, treatments
from app.routes import chat
from app.routes import gap_analysis
from app.routes import ai_routes
from app.routes import compliance
from app.routes import capa
from app.routes import notifications
from app.routes import report
from app.routes import impact
from app.routes import consents
from app.routes import data_requests
from app.routes import breaches
from app.routes import vendors
from app.routes import assessment_questions
from app.routes import integrations # NUEVO ROUTER DE INTEGRACIONES

from app.routes import organizations
from fastapi import Depends
from app.dependencies.auth import RequireRole, ELEVATED_READ, ELEVATED_NO_DPO, ELEVATED_WRITE, LEY_ROLES

# --- Modelos base (se importan para que SQLAlchemy los registre) ---
from app.models.organization import Organization   
from app.models.control_status import ControlStatus   
from app.models.assessment_answer import AssessmentAnswer  
from app.models.iso_controls import ISOCControl
from app.models.capa import CAPA
from app.models.document import Document, DocumentAcknowledgement
from app.models.evidence import Evidence

# --- Modelos Ley N° 21.719 ---
from app.models.data_treatment import DataTreatment
from app.models.consent import Consent
from app.models.data_subject_request import DataSubjectRequest
from app.models.data_breach import DataBreach
from app.models.vendor import Vendor
from app.models.impact_assessment import ImpactAssessment


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.environ.get("VERCEL"):
        logger.info("⚡ Entorno Vercel detectado: se omite el setup de arranque")
        yield
        return

    async with engine.begin() as conn:
        from sqlalchemy import text
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)

        await conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug VARCHAR(120);"))
        await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_organizations_slug ON organizations (slug);"))

        await conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS erp_url VARCHAR(500);"))
        await conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS erp_api_key VARCHAR(255);"))

        # NUEVO: Crear la columna push_token en users si no existe para evitar UndefinedColumnError
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token VARCHAR(255);"))

        _consent_cols = [
            "ADD COLUMN IF NOT EXISTS titular_email VARCHAR(255)",
            "ADD COLUMN IF NOT EXISTS acceptance_token_hash VARCHAR(64)",
            "ADD COLUMN IF NOT EXISTS notice_version VARCHAR(50)",
            "ADD COLUMN IF NOT EXISTS notice_text TEXT",
            "ADD COLUMN IF NOT EXISTS finalidades_consentidas TEXT",
            "ADD COLUMN IF NOT EXISTS fecha_expiracion TIMESTAMP",
            "ADD COLUMN IF NOT EXISTS fecha_renovacion TIMESTAMP",
            "ADD COLUMN IF NOT EXISTS comprobante_url VARCHAR(500)",
        ]
        for _col in _consent_cols:
            await conn.execute(text(f"ALTER TABLE consents {_col};"))
        await conn.execute(text("ALTER TABLE consents ALTER COLUMN fecha_otorgado DROP NOT NULL;"))
        await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_consents_acceptance_token_hash ON consents (acceptance_token_hash);"))

        await conn.execute(text("ALTER TABLE data_subject_requests ADD COLUMN IF NOT EXISTS titular_email VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE data_subject_requests ADD COLUMN IF NOT EXISTS origen VARCHAR(20) DEFAULT 'interno';"))

        await conn.execute(text("ALTER TABLE evidences ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_evidences_organization_id ON evidences (organization_id);"))
        await conn.execute(text("ALTER TABLE evidence_chunks ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_evidence_chunks_organization_id ON evidence_chunks (organization_id);"))
        await conn.execute(text("ALTER TABLE evidences ADD COLUMN IF NOT EXISTS extracted_text TEXT;"))

        for tabla in ("risks", "documents", "capas"):
            await conn.execute(text(f"ALTER TABLE {tabla} ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);"))
            await conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{tabla}_organization_id ON {tabla} (organization_id);"))

        for tabla in ("data_treatments", "impact_assessments"):
            await conn.execute(text(f"ALTER TABLE {tabla} ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);"))
            await conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{tabla}_organization_id ON {tabla} (organization_id);"))

        for _col in (
            "categorias_datos TEXT",
            "origen VARCHAR(255)",
            "destinatarios TEXT",
            "transferencias_internacionales TEXT",
            "plazo_conservacion VARCHAR(100)",
            "responsable VARCHAR(255)",
        ):
            await conn.execute(text(f"ALTER TABLE data_treatments ADD COLUMN IF NOT EXISTS {_col};"))

    logger.info("✅ Database tables created/verified")

    async with engine.connect() as conn:
        from sqlalchemy import text
        conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
        for valor in ("SUPERADMIN", "OWNER"):
            await conn.execute(text(f"ALTER TYPE userrole ADD VALUE IF NOT EXISTS '{valor}';"))
        await conn.execute(text("ALTER TYPE consentstate ADD VALUE IF NOT EXISTS 'PENDIENTE';"))
    logger.info("✅ Enums verificados (userrole, consentstate)")

    from app.utils.slug import slug_unico
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select as _select
        sin_slug = await session.execute(_select(Organization).where(Organization.slug.is_(None)))
        for org in sin_slug.scalars().all():
            org.slug = await slug_unico(session, org.nombre, Organization)
        await session.commit()

    from app.services.auth_service import AuthService
    from app.models.user import User, UserRole

    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        super_email = os.environ.get("SUPERADMIN_EMAIL", "superadmin@dani27001.com")
        super_pass = os.environ.get("SUPERADMIN_PASSWORD", "superadmin123")

        res_super = await session.execute(select(User).where(User.email == super_email))
        superadmin = res_super.scalar_one_or_none()

        if not superadmin:
            superadmin = User(
                id=str(uuid.uuid4()),
                full_name="Super Admin",
                email=super_email,
                hashed_password=AuthService.get_password_hash(super_pass),
                role=UserRole.SUPERADMIN,
                organization_id=None,
                is_active=True,
            )
            session.add(superadmin)
            await session.commit()
            logger.info(f"✅ Superadmin de plataforma creado: {super_email}")
        elif superadmin.role != UserRole.SUPERADMIN or superadmin.organization_id is not None:
            superadmin.role = UserRole.SUPERADMIN
            superadmin.organization_id = None
            await session.commit()
            logger.info("✅ Superadmin de plataforma corregido")

        res_admin = await session.execute(select(User).where(User.email == "admin@dani27001.com"))
        admin = res_admin.scalar_one_or_none()
        if admin and admin.role != UserRole.OWNER:
            admin.role = UserRole.OWNER
            await session.commit()
            logger.info("✅ admin@dani27001.com ahora es OWNER de su empresa")

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://dani-iso-27001.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Org-Id"],
)

# --- Include routers ---
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(risk.router, dependencies=[Depends(RequireRole(ELEVATED_WRITE))]) 
app.include_router(evidence.router, dependencies=[Depends(RequireRole(ELEVATED_NO_DPO))]) 
app.include_router(documents.router) 
app.include_router(compliance.router, dependencies=[Depends(RequireRole(ELEVATED_READ))]) 
app.include_router(chat.router) 
app.include_router(gap_analysis.router) 
app.include_router(capa.router) 
app.include_router(notifications.router) 
app.include_router(report.router, dependencies=[Depends(RequireRole(ELEVATED_READ))])
app.include_router(ai_routes.router)
app.include_router(integrations.router, dependencies=[Depends(RequireRole(ELEVATED_WRITE))])

# --- Routers Ley N° 21.719 ---
_ley = [Depends(RequireRole(LEY_ROLES))]
app.include_router(treatments.router, dependencies=_ley)
app.include_router(consents.router, dependencies=_ley)
app.include_router(consents.public_router) 
app.include_router(data_requests.router, dependencies=_ley)
app.include_router(data_requests.public_router) 
app.include_router(breaches.router, dependencies=_ley)
app.include_router(vendors.router, dependencies=_ley)
app.include_router(impact.router, dependencies=_ley)

app.include_router(assessment_questions.router, dependencies=[Depends(RequireRole(ELEVATED_NO_DPO))])
app.include_router(organizations.router)  

@app.get("/")
async def root():
    return {"message": "DANI27001 API", "status": "operational", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("🚀 Iniciando servidor FastAPI")
    print("=" * 50)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info", reload=False)