from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime
from app.dependencies.database import Base

class ConsentState(str, enum.Enum):
    PENDIENTE = "pendiente"
    OTORGADO = "otorgado"
    REVOCADO = "revocado"

class Consent(Base):
    __tablename__ = "consents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    titular = Column(String(255), nullable=False, index=True) # Identificación de la persona
    titular_email = Column(String(255), nullable=True, index=True)
    acceptance_token_hash = Column(String(64), nullable=True, unique=True, index=True)
    notice_version = Column(String(50), nullable=True)
    notice_text = Column(Text, nullable=True)
    finalidades_consentidas = Column(Text, nullable=True)
    treatment_id = Column(String(36), ForeignKey("data_treatments.id"), nullable=False)
    fecha_otorgado = Column(DateTime, nullable=True)
    fecha_expiracion = Column(DateTime, nullable=True)
    fecha_renovacion = Column(DateTime, nullable=True)
    medio = Column(String(100), nullable=False) # ej: "web", "papel", "email"
    estado = Column(SQLEnum(ConsentState), default=ConsentState.PENDIENTE, nullable=False)
    fecha_revocado = Column(DateTime, nullable=True)
    comprobante_url = Column(String(500), nullable=True)
    organization_id = Column(String(36), nullable=True) # Listo para cuando el proyecto sea multi-tenant
    
    # relationship comentada hasta que se cree el modelo DataTreatment
    # treatment = relationship("DataTreatment", backref="consents")

    treatment = relationship("DataTreatment", back_populates="consents", overlaps="treatment")