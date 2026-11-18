from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text

from app.dependencies.database import Base


class UsoIA(Base):
    """Último estado conocido del consumo de la IA frente a sus límites (una fila por proveedor)."""
    __tablename__ = "uso_ia"

    id = Column(String(20), primary_key=True)          # "groq"
    datos = Column(Text, nullable=True)                 # JSON con límites, restantes y tiempos
    actualizado = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
