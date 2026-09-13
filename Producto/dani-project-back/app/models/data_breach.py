from sqlalchemy import Column, String, Text, Integer, DateTime, Enum as SQLEnum
import enum
import uuid
from datetime import datetime
from app.dependencies.database import Base

class SeverityLevel(str, enum.Enum):
    BAJA = "baja"
    MEDIA = "media"
    ALTA = "alta"
    CRITICA = "critica"

class BreachState(str, enum.Enum):
    DETECTADA = "detectada"
    EN_INVESTIGACION = "en_investigacion"
    NOTIFICADA = "notificada"
    CERRADA = "cerrada"

class DataBreach(Base):
    __tablename__ = "data_breaches"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    fecha_deteccion = Column(DateTime, nullable=False)
    descripcion = Column(Text, nullable=False)
    datos_afectados = Column(Text, nullable=False) # ej: "Nombres, correos, contraseñas"
    cantidad_afectados = Column(Integer, nullable=True) # Puede no saberse al inicio
    gravedad = Column(SQLEnum(SeverityLevel), nullable=False)
    
    # Plazos (Obligación O4: 72 horas)
    fecha_limite_notificacion = Column(DateTime, nullable=False)
    fecha_notificacion = Column(DateTime, nullable=True)
    
    # Gestión
    estado = Column(SQLEnum(BreachState), default=BreachState.DETECTADA, nullable=False)
    medidas_tomadas = Column(Text, nullable=True)
    responsable = Column(String(255), nullable=True)
    
    # Multi-tenant y auditoría
    organization_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)