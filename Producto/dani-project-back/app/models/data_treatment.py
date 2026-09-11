from sqlalchemy import Column, String, Text, Boolean, JSON, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.dependencies.database import Base


class LegalBasis(str, enum.Enum):
    """Bases de licitud posibles para un tratamiento (Ley N° 21.719)."""
    CONSENTIMIENTO = "consentimiento"
    CONTRATO = "contrato"
    OBLIGACION_LEGAL = "obligacion_legal"
    INTERES_LEGITIMO = "interes_legitimo"
    DATOS_PUBLICOS = "datos_publicos"
    OTRO = "otro"


class DataTreatment(Base):
    """
    Registro de actividades de tratamiento de datos personales (RoPA).

    Tarea 1.1 del plan de integración. Corresponde a la obligación O1 de la
    Ley N° 21.719: inventario de qué datos personales maneja la organización,
    con qué finalidad, bajo qué base legal, de dónde provienen y por cuánto
    tiempo se conservan. Es la tabla central del módulo de la ley: las demás
    (proveedores, evaluaciones de impacto, consentimientos, etc.) se relacionan
    con un tratamiento.
    """
    __tablename__ = "data_treatments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)

    nombre = Column(String(255), nullable=False)                 # Nombre del tratamiento (ej: "Gestión de clientes")
    finalidad = Column(Text, nullable=False)                     # Para qué se usan los datos
    base_licitud = Column(Enum(LegalBasis, name="legal_basis"), default=LegalBasis.CONSENTIMIENTO, nullable=False)
    categorias_datos = Column(JSON, default=[])                  # Ej: ["nombre", "correo", "RUT"]
    origen = Column(String(255), nullable=True)                  # De dónde provienen los datos
    destinatarios = Column(Text, nullable=True)                  # A quién se comunican los datos
    transferencias_internacionales = Column(Boolean, default=False, nullable=False)
    plazo_conservacion = Column(String(255), nullable=True)      # Cuánto se conservan (ej: "5 años")
    responsable = Column(String(255), nullable=True)             # Responsable del tratamiento

    # Preparado para multi-empresa (multi-tenant). Hoy puede quedar en null;
    # cuando exista la tabla de organizaciones, aquí se guardará a qué empresa
    # pertenece el registro, para aislar los datos entre clientes.
    organization_id = Column(String(36), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones con las tablas que dependen del tratamiento
    vendors = relationship("Vendor", back_populates="treatment", cascade="all, delete-orphan")
    impact_assessments = relationship("ImpactAssessment", back_populates="treatment", cascade="all, delete-orphan")
