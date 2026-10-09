# app/models/evidence_chunk.py
from sqlalchemy import Column, String, Text, ForeignKey, Integer, DateTime, func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.dependencies.database import Base
import uuid

# Subclase avanzada para permitir fallback automático si pgvector no está instalado en PostgreSQL local
class SafeVector(Vector):
    def get_col_spec(self, **kw):
        from app.dependencies.database import PGVECTOR_SUPPORTED
        if PGVECTOR_SUPPORTED:
            return f"vector({self.dim})"
        else:
            return "FLOAT[]"

class EvidenceChunk(Base):
    __tablename__ = "evidence_chunks"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    organization_id = Column(String(36), index=True, nullable=True)  # Multi-tenant
    evidence_id = Column(String(36), ForeignKey("evidences.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(SafeVector(384), nullable=True)  # Usamos SafeVector en lugar de Vector directo
    chunk_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship to the main Evidence model
    evidence = relationship("Evidence")