"""Registro de actividad de cada empresa (ISO 27001, 8.15 y 9.2).

Cada acción importante (aprobar o publicar un documento, subir o borrar una
evidencia, exportar el paquete de auditoría, cambiar un riesgo...) deja una
fila con quién la hizo, desde qué IP y cuándo. Las filas no se editan ni se
borran: cada una guarda el hash de la anterior, así que si alguien modifica
una fila en la base de datos la cadena deja de calzar y se nota.
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Index, String, Text

from app.dependencies.database import Base


class RegistroActividad(Base):
    __tablename__ = "registro_actividad"
    __table_args__ = (Index("ix_registro_actividad_org_fecha", "organization_id", "fecha"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), nullable=False, index=True)
    fecha = Column(DateTime, nullable=False, default=datetime.utcnow)

    usuario_id = Column(String(36), nullable=True)
    usuario_email = Column(String(255), nullable=True)
    usuario_nombre = Column(String(255), nullable=True)
    rol = Column(String(30), nullable=True)
    ip = Column(String(64), nullable=True)

    # creo, modifico, elimino, aprobo, publico, acepto, exporto, descargo
    accion = Column(String(20), nullable=False)
    tipo_recurso = Column(String(30), nullable=False)  # documento, evidencia, riesgo, incidente, usuario, paquete
    recurso = Column(String(500), nullable=False)
    detalle = Column(Text, nullable=True)

    hash_anterior = Column(String(64), nullable=True)
    hash = Column(String(64), nullable=False)
