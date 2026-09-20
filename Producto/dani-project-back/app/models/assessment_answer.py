from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
import uuid
from app.dependencies.database import Base


class AssessmentAnswer(Base):
    """
    Respuesta a una pregunta de evaluación ISO, **por empresa** (multi-tenant, N6).

    El catálogo `assessment_questions` es GLOBAL (las mismas preguntas para
    todas las empresas). Pero la RESPUESTA (lo que la IA determinó a partir de
    los documentos de una empresa: cumple / parcial / no cumple) es de cada
    empresa. Esta tabla guarda esa respuesta de forma persistente.

    Hoy el resultado de "Evaluar con IA" vive solo en el navegador
    (localStorage). Con esta tabla, la tarea T3 podrá persistir el resultado por
    empresa y así soportar la "revalidación" del lado servidor.

    La clave (question_id + organization_id) garantiza una respuesta por
    pregunta y por empresa.
    """
    __tablename__ = "assessment_answers"
    __table_args__ = (
        UniqueConstraint("question_id", "organization_id", name="uq_assessment_answer_question_org"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)

    question_id = Column(String(36), ForeignKey("assessment_questions.id"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)

    # cumple / parcial / no_cumple / sin_evidencia
    veredicto = Column(String(30), nullable=False, default="sin_evidencia")
    confianza = Column(Float, nullable=True)
    justificacion = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
