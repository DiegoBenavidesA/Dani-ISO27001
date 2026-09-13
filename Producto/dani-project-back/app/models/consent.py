from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime
from app.dependencies.database import Base

class ConsentState(str, enum.Enum):
    OTORGADO = "otorgado"
    REVOCADO = "revocado"

class Consent(Base):
    __tablename__ = "consents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    titular = Column(String(255), nullable=False, index=True) # Identificación de la persona
    treatment_id = Column(String(36), ForeignKey("data_treatments.id"), nullable=False)
    fecha_otorgado = Column(DateTime, default=datetime.utcnow, nullable=False)
    medio = Column(String(100), nullable=False) # ej: "web", "papel", "email"
    estado = Column(SQLEnum(ConsentState), default=ConsentState.OTORGADO, nullable=False)
    fecha_revocado = Column(DateTime, nullable=True)
    comprobante_url = Column(String(500), nullable=True)
    organization_id = Column(String(36), nullable=True) # Listo para cuando el proyecto sea multi-tenant
    
    # relationship comentada hasta que se cree el modelo DataTreatment
    # treatment = relationship("DataTreatment", backref="consents")

    treatment = relationship("DataTreatment", back_populates="consents", overlaps="treatment")