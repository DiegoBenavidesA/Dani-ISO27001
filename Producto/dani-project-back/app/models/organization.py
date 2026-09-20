from sqlalchemy import Column, String, Boolean, DateTime
from datetime import datetime
import uuid
from app.dependencies.database import Base


class Organization(Base):
    """
    Empresa / organización que usa la plataforma (multi-tenant).

    Tarea N1 del PLAN_MULTITENANT. Cada organización es un "inquilino": sus
    usuarios y sus datos (riesgos, evidencias, tratamientos, etc.) quedan
    aislados de las demás empresas mediante el campo organization_id que llevan
    las tablas por-empresa. Los catálogos globales (controles ISO, preguntas,
    normativa, prompts) NO pertenecen a una empresa: son compartidos.
    """
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)

    nombre = Column(String(255), nullable=False)
    # Identificador tributario/legal de la empresa (ej: RUT en Chile). Opcional.
    identificador = Column(String(100), nullable=True)

    # Estado del inquilino (permite desactivar una empresa sin borrar sus datos).
    activo = Column(Boolean, default=True, nullable=False)
    # Plan contratado (a futuro para límites/facturación). Texto libre por ahora.
    plan = Column(String(50), default="basico", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
