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

from app.routes import auth, risk, evidence, organizations
from fastapi import Depends
from app.dependencies.auth import RequireRole, ELEVATED_READ, ELEVATED_NO_DPO, ELEVATED_WRITE, LEY_ROLES

# --- Modelos base (se importan para que SQLAlchemy los registre) ---
from app.models.organization import Organization   # Multi-tenant (N1)
from app.models.control_status import ControlStatus   # Multi-tenant (N6)
from app.models.assessment_answer import AssessmentAnswer  # Multi-tenant (N6)
from app.models.iso_controls import ISOCControl
from app.models.capa import CAPA
from app.models.document import Document, DocumentAcknowledgement
from app.models.evidence import Evidence

# --- Modelos Ley N° 21.719 ---
# Se importan para que SQLAlchemy los registre y cree sus tablas al arrancar.
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
    # CAMBIO: con Mangum usamos lifespan="off" (ver app/api/index.py), así
    # que este bloque YA NO corre dentro de Vercel. Lo dejamos intacto para
    # que tu entorno LOCAL (uvicorn) siga funcionando igual que hoy.
    # El setup equivalente para producción está en scripts/setup_supabase.py,
    # que corres UNA VEZ manualmente apuntando a la DATABASE_URL de Supabase.

    if os.environ.get("VERCEL"):
        logger.info(
            "⚡ Entorno Vercel detectado: se omite el setup de arranque "
            "(ya ejecutado vía scripts/setup_supabase.py)"
        )
        yield
        return

    async with engine.begin() as conn:
        from sqlalchemy import text

        await conn.execute(
            text("CREATE EXTENSION IF NOT EXISTS vector;")
        )

        await conn.run_sync(Base.metadata.create_all)

        # Multi-tenant (slug en URL): en BDs creadas antes de agregar la columna
        # `slug`, create_all NO altera tablas existentes. La agregamos a mano de
        # forma idempotente para no romper entornos ya existentes.
        await conn.execute(
            text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug VARCHAR(120);")
        )
        await conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_organizations_slug "
                "ON organizations (slug);"
            )
        )

        # Consentimientos: columnas nuevas (trazabilidad, aviso versionado, token).
        # create_all no altera tablas existentes, así que las agregamos idempotentes.
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
        await conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_consents_acceptance_token_hash "
                "ON consents (acceptance_token_hash);"
            )
        )

        # Solicitudes de titulares: columnas del canal público.
        await conn.execute(
            text("ALTER TABLE data_subject_requests ADD COLUMN IF NOT EXISTS titular_email VARCHAR(255);")
        )
        await conn.execute(
            text("ALTER TABLE data_subject_requests ADD COLUMN IF NOT EXISTS origen VARCHAR(20) DEFAULT 'interno';")
        )

        # Evidencias multi-tenant: la columna organization_id faltaba.
        await conn.execute(text("ALTER TABLE evidences ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_evidences_organization_id ON evidences (organization_id);"))
        await conn.execute(text("ALTER TABLE evidence_chunks ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_evidence_chunks_organization_id ON evidence_chunks (organization_id);"))
        await conn.execute(text("ALTER TABLE evidences ADD COLUMN IF NOT EXISTS extracted_text TEXT;"))

        # Riesgos, documentos y CAPA multi-tenant: faltaba organization_id en la BD.
        for tabla in ("risks", "documents", "capas"):
            await conn.execute(text(f"ALTER TABLE {tabla} ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);"))
            await conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{tabla}_organization_id ON {tabla} (organization_id);"))

    logger.info("✅ Database tables created/verified")

    # Roles nuevos (multi-tenant): el tipo enum `userrole` en Postgres se creó
    # con los valores antiguos. Agregar valores al enum de Python NO altera el
    # tipo en la BD, así que hay que hacerlo con ALTER TYPE ... ADD VALUE.
    # ADD VALUE no puede correr dentro de la misma transacción que lo usa, por
    # eso usamos una conexión en AUTOCOMMIT.
    async with engine.connect() as conn:
        from sqlalchemy import text
        conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
        for valor in ("SUPERADMIN", "OWNER"):
            await conn.execute(
                text(f"ALTER TYPE userrole ADD VALUE IF NOT EXISTS '{valor}';")
            )
    logger.info("✅ Enum userrole verificado (SUPERADMIN/OWNER)")

    # Rellenar slugs faltantes (empresas creadas antes de esta feature).
    from app.utils.slug import slug_unico
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select as _select
        sin_slug = await session.execute(
            _select(Organization).where(Organization.slug.is_(None))
        )
        for org in sin_slug.scalars().all():
            org.slug = await slug_unico(session, org.nombre, Organization)
        await session.commit()

    from app.services.auth_service import AuthService
    from app.models.user import User, UserRole

    async with AsyncSessionLocal() as session:
        from sqlalchemy import select

        # 1) Cuenta de plataforma DEDICADA (superadmin). Es cross-tenant, no
        #    pertenece a ninguna empresa. Se puede configurar por variables de
        #    entorno; por defecto usa estas credenciales.
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

        # 2) La cuenta antigua admin@dani27001.com pasa a ser OWNER de su empresa
        #    (deja de ser superadmin). Solo si existe (BDs ya creadas).
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
        "https://dani-iso-27001.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Org-Id",
    ],
)


# --- Include routers ---

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(risk.router, dependencies=[Depends(RequireRole(ELEVATED_WRITE))])  # riesgos: owner/admin/manager (auditor y dpo no)
app.include_router(evidence.router, dependencies=[Depends(RequireRole(ELEVATED_NO_DPO))])  # ISO: owner/admin/manager/auditor
app.include_router(documents.router)  # el portal del empleado usa este router (leer/aceptar políticas)
app.include_router(compliance.router, dependencies=[Depends(RequireRole(ELEVATED_READ))])  # dashboard/cumplimiento: todo el equipo
app.include_router(chat.router)  # el chat lo usan también los empleados (con su propio filtro)
app.include_router(gap_analysis.router)  # ya tiene candado por endpoint
app.include_router(capa.router)  # ya tiene candado por endpoint
app.include_router(notifications.router)  # notificaciones por usuario
app.include_router(report.router, dependencies=[Depends(RequireRole(ELEVATED_READ))])
app.include_router(ai_routes.router)

# --- Routers Ley N° 21.719 (owner/admin/dpo) ---
_ley = [Depends(RequireRole(LEY_ROLES))]
app.include_router(treatments.router, dependencies=_ley)
app.include_router(consents.router, dependencies=_ley)
app.include_router(consents.public_router)  # páginas públicas del titular (sin login)
app.include_router(data_requests.router, dependencies=_ley)
app.include_router(data_requests.public_router)  # canal público del titular (sin login)
app.include_router(breaches.router, dependencies=_ley)
app.include_router(vendors.router, dependencies=_ley)
app.include_router(impact.router, dependencies=_ley)
# Evaluación ISO (no es Ley): owner/admin/manager/auditor.
app.include_router(assessment_questions.router, dependencies=[Depends(RequireRole(ELEVATED_NO_DPO))])

app.include_router(organizations.router)  

@app.get("/")
async def root():
    return {
        "message": "DANI27001 API",
        "status": "operational",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }


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