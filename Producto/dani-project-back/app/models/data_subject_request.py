from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
import enum
import uuid
from datetime import datetime
from app.dependencies.database import Base

class RequestType(str, enum.Enum):
    ACCESO = "acceso"
    RECTIFICACION = "rectificacion"
    CANCELACION = "cancelacion"
    OPOSICION = "oposicion"
    PORTABILIDAD = "portabilidad"

class RequestState(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PROCESO = "en_proceso"
    RESUELTA = "resuelta"

class DataSubjectRequest(Base):
    __tablename__ = "data_subject_requests"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    titular = Column(String(255), nullable=False, index=True)
    tipo = Column(SQLEnum(RequestType), nullable=False)
    descripcion = Column(Text, nullable=False)
    
    # Fechas y plazos
    fecha_solicitud = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_limite = Column(DateTime, nullable=False) # Calculada desde el servicio (+30 días hábiles)
    
    # Gestión
    estado = Column(SQLEnum(RequestState), default=RequestState.PENDIENTE, nullable=False)
    responsable = Column(String(255), nullable=True)
    respuesta = Column(Text, nullable=True)
    
    # Multi-tenant y auditoría
    organization_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)