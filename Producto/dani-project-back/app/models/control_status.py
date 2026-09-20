from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
import uuid
from app.dependencies.database import Base


class ControlStatus(Base):
    """
    Estado de implementación de un control ISO **por empresa** (multi-tenant, N6).

    PROBLEMA que resuelve: hoy la tabla `iso_controls` mezcla el CATÁLOGO global
    (título, descripción, categoría — igual para todas las empresas) con el
    ESTADO de cada empresa (applies/status/score/justification/document_id). En
    multi-tenant eso no puede convivir: el catálogo es compartido, el estado es
    de cada inquilino.

    Esta tabla saca ese estado a un lugar por-empresa. La clave (control_id +
    organization_id) garantiza una fila de estado por control y por empresa.

    NOTA (tarea T3): la lógica de compliance.py / gap_analysis.py todavía lee y
    escribe el estado en `iso_controls`. La migración para que usen esta tabla
    es la tarea T3; hasta entonces los campos de estado en `iso_controls` quedan
    como "compatibilidad" y no deben considerarse la fuente de verdad multi-empresa.
    """
    __tablename__ = "control_status"
    __table_args__ = (
        UniqueConstraint("control_id", "organization_id", name="uq_control_status_control_org"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)

    # Referencia al control del catálogo (ej: "5.1", "A.8.34").
    control_id = Column(String(50), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)

    applies = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="No Implementado", nullable=False)  # Implementado / Planificado / No Implementado
    justification = Column(Text, nullable=True)
    score = Column(Integer, default=0, nullable=False)
    document_id = Column(String(36), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
