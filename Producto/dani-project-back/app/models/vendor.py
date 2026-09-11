from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.dependencies.database import Base


class ContractStatus(str, enum.Enum):
    """Estado del contrato/acuerdo con el proveedor."""
    VIGENTE = "vigente"
    PENDIENTE = "pendiente"
    VENCIDO = "vencido"


class Vendor(Base):
    """
    Proveedor / encargado de tratamiento de datos personales.

    Tarea 1.5 del plan de integración. Corresponde a la obligación O5 de la
    Ley N° 21.719: controlar a los terceros que acceden o tratan datos
    personales por cuenta de la organización, mediante un contrato/acuerdo.
    Cada proveedor se asocia (opcionalmente) al tratamiento en el que participa.
    """
    __tablename__ = "vendors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)

    nombre = Column(String(255), nullable=False)
    datos_compartidos = Column(Text, nullable=True)              # Qué datos personales se le comparten
    pais = Column(String(100), nullable=True)                    # País del proveedor (relevante para transferencias)
    estado_contrato = Column(Enum(ContractStatus, name="contract_status"), default=ContractStatus.PENDIENTE, nullable=False)

    # A qué tratamiento pertenece este proveedor (FK -> data_treatments)
    treatment_id = Column(String(36), ForeignKey("data_treatments.id"), nullable=True)

    # Preparado para multi-empresa (multi-tenant).
    organization_id = Column(String(36), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    treatment = relationship("DataTreatment", back_populates="vendors")
