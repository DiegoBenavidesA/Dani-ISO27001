"""Solicitud de evidencia: una persona de la empresa le pide a otra que suba un
documento antes de una fecha. Antes vivía solo en el navegador de quien la
creaba (localStorage), así que nadie más la veía."""
import uuid
from sqlalchemy import Column, String, Date, DateTime, func

from app.dependencies.database import Base


class EvidenceRequest(Base):
    __tablename__ = "evidence_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), index=True, nullable=False)
    titulo = Column(String(300), nullable=False)
    control = Column(String(20), nullable=True)
    asignado_a = Column(String(36), nullable=False, index=True)      # users.id
    solicitado_por = Column(String(36), nullable=False, index=True)  # users.id
    fecha_limite = Column(Date, nullable=False)
    # pendiente -> subida (el asignado subió algo) -> recibida (quien pidió la revisó)
    estado = Column(String(20), nullable=False, default="pendiente")
    evidence_id = Column(String(36), nullable=True)
    subida_en = Column(DateTime, nullable=True)
    recordatorio_en = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
