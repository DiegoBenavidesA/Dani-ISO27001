import uuid
import enum
from sqlalchemy import Column, String, Text, DateTime, Enum, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.dependencies.database import Base

class DocumentStatus(str, enum.Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chapter_id = Column(String(50), nullable=False, unique=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.DRAFT, nullable=False)
    version = Column(String(20), default="v1.0", nullable=False)

    # Campos requeridos por la diapositiva de arquitectura
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    generated_by_ai = Column(Boolean, default=False, nullable=False)
    organization_id = Column(String(36), index=True, nullable=True)  # Multi-tenant

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    creator = relationship("User", foreign_keys=[user_id])

class DocumentAcknowledgement(Base):
    __tablename__ = "document_acknowledgements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
