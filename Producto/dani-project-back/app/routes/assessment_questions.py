import asyncio
import os
import tempfile
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, get_current_org
from app.models.assessment_question import AssessmentQuestion
from app.models.assessment_answer import AssessmentAnswer
from app.services.ai_service import AIService
from app.services.embedding_service import EmbeddingService


router = APIRouter(
    prefix="/api/assessment-questions",
    tags=["Assessment Questions"]
)

ai_service = AIService()

# La extracción de texto (PDF/Word) vive en EmbeddingService.
# Se instancia de forma perezosa para evitar cargar componentes
# pesados al importar el módulo.
_embedding_service = None


def _get_embedding_service():
    global _embedding_service

    if _embedding_service is None:
        _embedding_service = EmbeddingService()

    return _embedding_service


# =========================================================
# SCHEMAS
# =========================================================

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


class AnswerResponse(BaseModel):
    id: str
    question_id: str
    organization_id: str
    veredicto: str
    confianza: Optional[float] = None
    justificacion: Optional[str] = None

    class Config:
        from_attributes = True


# =========================================================
# PREGUNTAS
# Catálogo GLOBAL: NO lleva organization_id.
# =========================================================

@router.get("/", response_model=List[QuestionResponse])
async def get_questions(
    categoria: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AssessmentQuestion)

    if categoria:
        stmt = stmt.where(
            AssessmentQuestion.categoria == categoria
        )

    stmt = stmt.order_by(AssessmentQuestion.orden)

    result = await db.execute(stmt)

    return result.scalars().all()


# =========================================================
# RESPUESTAS
# Son MULTI-TENANT: cada empresa solo puede recuperar
# sus propias respuestas.
# =========================================================

@router.get(
    "/answers",
    response_model=List[AnswerResponse]
)
async def get_answers(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(AssessmentAnswer)
        .where(
            AssessmentAnswer.organization_id == org_id
        )
        .order_by(AssessmentAnswer.created_at)
    )

    result = await db.execute(stmt)

    return result.scalars().all()


@router.get(
    "/answers/{question_id}",
    response_model=AnswerResponse
)
async def get_answer_by_question(
    question_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AssessmentAnswer).where(
        AssessmentAnswer.question_id == question_id,
        AssessmentAnswer.organization_id == org_id
    )

    result = await db.execute(stmt)
    answer = result.scalar_one_or_none()

    if not answer:
        raise HTTPException(
            status_code=404,
            detail="Respuesta no encontrada"
        )

    return answer


# =========================================================
# EVALUAR CON IA
#
# - El catálogo de preguntas es global.
# - Los resultados se guardan en AssessmentAnswer.
# - organization_id SIEMPRE se obtiene desde el JWT.
# - Si una empresa revalida una pregunta, se actualiza su
#   respuesta anterior en vez de crear un duplicado.
# =========================================================

@router.post("/evaluate")
async def evaluate_with_ai(
    files: List[UploadFile] = File(...),
    question_ids: str = Form(""),
    current_user: dict = Depends(get_current_user),
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    # -----------------------------------------------------
    # 1. Extraer texto de los documentos
    # -----------------------------------------------------

    emb = _get_embedding_service()
    contexto = ""

    for f in files:
        data = await f.read()

        suffix = os.path.splitext(
            f.filename or ""
        )[1] or ".bin"

        tmp_path = None

        try:
            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=suffix
            ) as tmp:
                tmp.write(data)
                tmp_path = tmp.name

            texto = emb.extract_text_from_file(
                tmp_path,
                f.content_type or ""
            )

            if texto:
                contexto += (
                    f"\n\n### Documento: {f.filename}\n"
                    f"{texto}"
                )

        except Exception as e:
            # Un archivo ilegible no debe tumbar toda
            # la evaluación.
            contexto += (
                f"\n\n### Documento: {f.filename}\n"
                f"[No se pudo leer: {str(e)[:60]}]"
            )

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    if not contexto.strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "No se pudo extraer texto de los "
                "documentos subidos."
            )
        )

    # -----------------------------------------------------
    # 2. Cargar preguntas
    # -----------------------------------------------------

    stmt = select(AssessmentQuestion)

    ids = [
        x.strip()
        for x in question_ids.split(",")
        if x.strip()
    ]

    if ids:
        stmt = stmt.where(
            AssessmentQuestion.id.in_(ids)
        )

    stmt = stmt.order_by(
        AssessmentQuestion.orden
    )

    preguntas = (
        await db.execute(stmt)
    ).scalars().all()

    if not preguntas:
        return {
            "total": 0,
            "results": []
        }

    # -----------------------------------------------------
    # 3. Evaluación IA por lotes
    # -----------------------------------------------------

    TAMANO_LOTE = 12

    lotes = [
        preguntas[i:i + TAMANO_LOTE]
        for i in range(
            0,
            len(preguntas),
            TAMANO_LOTE
        )
    ]

    sem = asyncio.Semaphore(3)

    async def evaluar_lote(qs):
        async with sem:
            items = [
                {
                    "id": q.id,
                    "pregunta": (
                        f"[{q.codigo}] {q.pregunta}"
                    ),
                    "evidencia_esperada":
                        q.evidencia_esperada
                }
                for q in qs
            ]

            return await ai_service.evaluate_assessment_questions(
                "Varios controles ISO 27001 / Ley 21.719",
                items,
                contexto
            )

    lotes_res = await asyncio.gather(
        *[
            evaluar_lote(qs)
            for qs in lotes
        ]
    )

    resultados = [
        item
        for sub in lotes_res
        for item in sub
    ]

    # -----------------------------------------------------
    # 4. Persistir resultados POR EMPRESA
    # -----------------------------------------------------

    question_ids_resultado = [
        str(item.get("id"))
        for item in resultados
        if item.get("id")
    ]

    respuestas_existentes = {}

    if question_ids_resultado:
        existing_stmt = select(
            AssessmentAnswer
        ).where(
            AssessmentAnswer.organization_id == org_id,
            AssessmentAnswer.question_id.in_(
                question_ids_resultado
            )
        )

        existing_result = await db.execute(
            existing_stmt
        )

        respuestas_existentes = {
            answer.question_id: answer
            for answer
            in existing_result.scalars().all()
        }

    for item in resultados:
        question_id = str(
            item.get("id") or ""
        ).strip()

        if not question_id:
            continue

        veredicto = item.get(
            "veredicto",
            "sin_evidencia"
        )

        # Solo aceptamos estados conocidos.
        if veredicto not in {
            "cumple",
            "parcial",
            "no_cumple",
            "sin_evidencia"
        }:
            veredicto = "sin_evidencia"

        confianza = item.get(
            "confianza",
            0.0
        )

        try:
            confianza = float(confianza)
        except (TypeError, ValueError):
            confianza = 0.0

        justificacion = item.get(
            "justificacion"
        )

        existing = respuestas_existentes.get(
            question_id
        )

        if existing:
            # Revalidación de la misma pregunta para
            # la misma organización.
            existing.veredicto = veredicto
            existing.confianza = confianza
            existing.justificacion = justificacion

        else:
            answer = AssessmentAnswer(
                question_id=question_id,
                organization_id=org_id,
                veredicto=veredicto,
                confianza=confianza,
                justificacion=justificacion
            )

            db.add(answer)

    await db.commit()

    # -----------------------------------------------------
    # 5. Mantener el formato que ya espera el frontend
    # -----------------------------------------------------

    return {
        "total": len(resultados),
        "results": resultados
    }