from datetime import datetime
import uuid

from sqlalchemy import Column, String, Text, Integer, DateTime

from app.dependencies.database import Base


class LawObligation(Base):
    """
    Catálogo global de obligaciones de la Ley 21.719.

    Este catálogo es común para todas las organizaciones.
    El estado de cumplimiento de cada empresa debe manejarse
    por separado.
    """

    __tablename__ = "law_obligations"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
        index=True
    )

    codigo = Column(String(50), unique=True, nullable=False, index=True)
    categoria = Column(String(100), nullable=False)
    nombre = Column(String(255), nullable=False)
    referencia_legal = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=False)
    modulo = Column(String(100), nullable=True)
    orden = Column(Integer, nullable=False, default=0)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )