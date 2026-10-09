from sqlalchemy import Column, String, Text, ForeignKey, JSON, Enum, Integer, Boolean, DateTime, func
from sqlalchemy.orm import relationship
import enum
from app.dependencies.database import Base
import uuid

class EvidenceType(str, enum.Enum):
    DOCUMENT = "document"
    SCREENSHOT = "screenshot"
    LOG = "log"
    AUDIT_REPORT = "audit_report"
    POLICY = "policy"
    PROCEDURE = "procedure"

class Evidence(Base):
    __tablename__ = "evidences"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    organization_id = Column(String(36), index=True, nullable=True)  # Multi-tenant
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    evidence_type = Column(Enum(EvidenceType), default=EvidenceType.DOCUMENT)
    file_url = Column(String(1000), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    
    # 🔴 SOLUCIÓN: Cambiamos "metadata" por "evidence_metadata" para evitar conflictos
    evidence_metadata = Column(JSON, default={})
    # Texto extraído del documento al subirlo (para IA/evaluación sin depender
    # del almacenamiento externo ni del indexado en segundo plano).
    extracted_text = Column(Text, nullable=True)
    
    indexing_status = Column(String(20), default="pending")  # pending | indexing | done | error
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    is_verified = Column(Boolean, default=False)
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    # Relaciones
    risk_id = Column(String(36), ForeignKey("risks.id"))
    risk = relationship("Risk", back_populates="evidences")
    uploaded_by = Column(String(36), ForeignKey("users.id"))
    uploader = relationship("User", foreign_keys=[uploaded_by])