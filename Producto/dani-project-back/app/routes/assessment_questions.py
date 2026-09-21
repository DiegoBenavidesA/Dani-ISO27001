import asyncio
import os
import tempfile
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.assessment_question import AssessmentQuestion
from app.services.ai_service import AIService
from app.services.embedding_service import EmbeddingService


router = APIRouter(
    prefix="/api/assessment-questions",
    tags=["Assessment Questions"]
)

ai_service = AIService()

# La extracción de texto (PDF/Word) vive en EmbeddingService. Se instancia
# perezosamente para no cargar nada pesado al importar el módulo.
_embedding_service = None


def _get_embedding_service():
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service


class QuestionResponse(BaseModel):
    id: str
    codigo: str
    categoria: str
    nombre: str
    pregunta: str
    evidencia_esperada: Optional[str] = None
    orden: int

    class Config:
        from_attributes = True


# =========================================================
# READ — Listar preguntas del catálogo (opcionalmente por categoría)
# =========================================================

@router.get("/", response_model=List[QuestionResponse])
async def get_questions(
    categoria: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AssessmentQuestion)
    if categoria:
        stmt = stmt.where(AssessmentQuestion.categoria == categoria)
    stmt = stmt.order_by(AssessmentQuestion.orden)

    result = await db.execute(stmt)
    return result.scalars().all()


# =========================================================
# EVALUAR CON IA
# Recibe los documentos subidos, extrae su texto y pide a la IA que responda
# cada pregunta (cumple / parcial / no_cumple / sin_evidencia).
#
# - question_ids vacío  -> evalúa TODAS las preguntas ("Evaluar con IA").
# - question_ids con lista -> evalúa solo esas ("Revalidar con IA": el frontend
#   manda solo las que NO están en 'cumple', para no reprocesar las ya aprobadas).
# =========================================================

@router.post("/evaluate")
async def evaluate_with_ai(
    files: List[UploadFile] = File(...),
    question_ids: str = Form(""),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1) Extraer el texto de todos los documentos subidos
    emb = _get_embedding_service()
    contexto = ""
    for f in files:
        data = await f.read()
        suffix = os.path.splitext(f.filename or "")[1] or ".bin"
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(data)
                tmp_path = tmp.name
            texto = emb.extract_text_from_file(tmp_path, f.content_type or "")
            if texto:
                contexto += f"\n\n### Documento: {f.filename}\n{texto}"
        except Exception as e:
            # Un archivo ilegible no debe tumbar toda la evaluación.
            contexto += f"\n\n### Documento: {f.filename}\n[No se pudo leer: {str(e)[:60]}]"
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    if not contexto.strip():
        raise HTTPException(
            status_code=400,
            detail="No se pudo extraer texto de los documentos subidos."
        )

    # 2) Cargar las preguntas a evaluar (todas, o solo las indicadas)
    stmt = select(AssessmentQuestion)
    ids = [x.strip() for x in question_ids.split(",") if x.strip()]
    if ids:
        stmt = stmt.where(AssessmentQuestion.id.in_(ids))
    stmt = stmt.order_by(AssessmentQuestion.orden)
    preguntas = (await db.execute(stmt)).scalars().all()

    if not preguntas:
        return {"total": 0, "results": []}

    # 3) Evaluar en LOTES GRANDES (no una llamada por control).
    #    Antes se hacía 1 llamada por control (~117 llamadas) y con el límite de
    #    tasa de Groq eso tardaba minutos o no terminaba. Ahora agrupamos varias
    #    preguntas por llamada (TAMANO_LOTE) para reducir mucho las llamadas.
    TAMANO_LOTE = 12
    lotes = [preguntas[i:i + TAMANO_LOTE] for i in range(0, len(preguntas), TAMANO_LOTE)]

    sem = asyncio.Semaphore(3)

    async def evaluar_lote(qs):
        async with sem:
            items = [
                {"id": q.id, "pregunta": f"[{q.codigo}] {q.pregunta}", "evidencia_esperada": q.evidencia_esperada}
                for q in qs
            ]
            return await ai_service.evaluate_assessment_questions(
                "Varios controles ISO 27001 / Ley 21.719", items, contexto
            )

    lotes_res = await asyncio.gather(*[evaluar_lote(qs) for qs in lotes])
    resultados = [item for sub in lotes_res for item in sub]

    return {"total": len(resultados), "results": resultados}
