from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.dependencies.database import Base

class DataTreatment(Base):
    __tablename__ = "data_treatments"
    
    # Identificación básica
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    nombre = Column(String(255), nullable=False) 
    finalidad = Column(Text, nullable=False) 
    base_licitud = Column(String(100), nullable=False) 
    categorias_datos = Column(Text, nullable=True) 
    
    # Flujo y ciclo de vida de los datos (Obligación O1)
    origen = Column(String(255), nullable=True)
    destinatarios = Column(Text, nullable=True)
    transferencias_internacionales = Column(Text, nullable=True)
    plazo_conservacion = Column(String(100), nullable=True)
    responsable = Column(String(255), nullable=True)
    
    # Preparación Multi-tenant
    organization_id = Column(String(36), nullable=True)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    consents = relationship("Consent", back_populates="treatment")
    vendors = relationship("Vendor", back_populates="treatment")
    impact_assessments = relationship("ImpactAssessment", back_populates="treatment")