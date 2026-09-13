from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.dependencies.database import Base


class ImpactRiskLevel(str, enum.Enum):
    """Nivel de riesgo estimado del tratamiento evaluado."""
    ALTO = "alto"
    MEDIO = "medio"
    BAJO = "bajo"


class ImpactStatus(str, enum.Enum):
    """Estado de la evaluación de impacto."""
    PENDIENTE = "pendiente"
    EN_PROCESO = "en_proceso"
    COMPLETADA = "completada"


class ImpactAssessment(Base):
    """
    Evaluación de impacto en la protección de datos (DPIA / PIA).

    Tarea 1.6 del plan de integración. Corresponde a la obligación O6 de la
    Ley N° 21.719: analizar y documentar el riesgo antes de realizar
    tratamientos de alto impacto para los derechos de los titulares, junto con
    las medidas de mitigación. Cada evaluación se asocia a un tratamiento.
    """
    __tablename__ = "impact_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)

    # A qué tratamiento corresponde esta evaluación (FK -> data_treatments)
    treatment_id = Column(String(36), ForeignKey("data_treatments.id"), nullable=True)

    nivel_riesgo = Column(Enum(ImpactRiskLevel, name="impact_risk_level"), default=ImpactRiskLevel.MEDIO, nullable=False)
    descripcion_riesgo = Column(Text, nullable=True)             # Qué podría salir mal
    medidas_mitigacion = Column(Text, nullable=True)             # Cómo se controla el riesgo
    estado = Column(Enum(ImpactStatus, name="impact_status"), default=ImpactStatus.PENDIENTE, nullable=False)
    responsable = Column(String(255), nullable=True)

    # Preparado para multi-empresa (multi-tenant).
    organization_id = Column(String(36), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    treatment = relationship("DataTreatment", back_populates="impact_assessments")
