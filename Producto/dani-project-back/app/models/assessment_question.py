from sqlalchemy import Column, String, Text, Integer
from datetime import datetime
from sqlalchemy import DateTime
import uuid
from app.dependencies.database import Base


class AssessmentQuestion(Base):
    """
    Pregunta estándar del cuestionario de evaluación ISO 27001:2022.

    Es un CATÁLOGO de referencia (igual que los controles ISO): las preguntas
    son las mismas para todas las empresas, por eso NO llevan organization_id.
    Cada control/cláusula tiene varias sub-preguntas, cada una con la
    "evidencia esperada" que la IA debe buscar en los documentos subidos.

    El flujo pedido por el docente: el usuario sube documentos y la IA responde
    cada pregunta (Cumple / Parcial / No cumple) usando esa evidencia. La
    respuesta por empresa se guarda aparte (no en esta tabla de catálogo).
    """
    __tablename__ = "assessment_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)

    # A qué control/cláusula pertenece (ej: "4.1", "A.8.34")
    codigo = Column(String(50), nullable=False, index=True)
    categoria = Column(String(100), nullable=False)   # Cláusula, Organizacional, Personas, Físico, Tecnológico
    nombre = Column(String(255), nullable=False)       # Nombre del control/cláusula

    # La pregunta en sí y la evidencia que la IA debe buscar
    pregunta = Column(Text, nullable=False)
    evidencia_esperada = Column(Text, nullable=True)

    # Orden para mostrarlas en el mismo orden del catálogo
    orden = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
