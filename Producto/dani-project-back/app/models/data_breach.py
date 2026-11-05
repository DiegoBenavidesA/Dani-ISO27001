from sqlalchemy import Column, String, Text, Integer, DateTime, Boolean, JSON, Enum as SQLEnum
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
    DETECTADA = "detectada"              # reportada, falta la revisión de owner/admin
    EN_INVESTIGACION = "en_investigacion"  # gravedad confirmada por una persona
    NOTIFICADA = "notificada"            # notificada a la Agencia
    CERRADA = "cerrada"                  # resuelta (causa raíz y cómo se resolvió)

class DataBreach(Base):
    __tablename__ = "data_breaches"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    # Desde aquí corren las 72 h: cuando la empresa tomó conocimiento.
    fecha_deteccion = Column(DateTime, nullable=False)
    descripcion = Column(Text, nullable=False)
    reportado_por = Column(String(255), nullable=True)

    # Quien reporta solo cuenta qué pasó; estos datos los propone la IA y los
    # confirma owner/admin durante la revisión.
    datos_afectados = Column(Text, nullable=True) # ej: "Nombres, correos, contraseñas"
    cantidad_afectados = Column(Integer, nullable=True)
    afectados_estimacion = Column(String(20), nullable=True)  # exacto | aproximado | desconocido
    gravedad = Column(SQLEnum(SeverityLevel), nullable=True)

    # Análisis de la IA: {gravedad, justificacion, datos_posibles, notificar_agencia,
    # notificar_titulares, acciones_inmediatas, preguntas}
    analisis_ia = Column(JSON, nullable=True)
    analisis_estado = Column(String(20), nullable=True)  # pendiente | listo | error

    # Revisión humana
    gravedad_confirmada = Column(Boolean, default=False, nullable=False)
    notificacion_requerida = Column(Boolean, nullable=True)
    confirmada_por = Column(String(255), nullable=True)
    fecha_confirmacion = Column(DateTime, nullable=True)
    
    # Plazos (Obligación O4: 72 horas)
    fecha_limite_notificacion = Column(DateTime, nullable=False)
    fecha_notificacion = Column(DateTime, nullable=True)
    
    # Gestión
    estado = Column(SQLEnum(BreachState), default=BreachState.DETECTADA, nullable=False)
    medidas_tomadas = Column(Text, nullable=True)  # medidas de contención
    responsable = Column(String(255), nullable=True)

    # Cierre
    causa_raiz = Column(Text, nullable=True)
    resolucion = Column(Text, nullable=True)
    resuelta_por = Column(String(255), nullable=True)
    fecha_resolucion = Column(DateTime, nullable=True)
    
    # Multi-tenant y auditoría
    organization_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
