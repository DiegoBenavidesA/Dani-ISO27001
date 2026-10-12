from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import json

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, get_current_org
from app.services.ai_service import AIService
from app.services.embedding_service import EmbeddingService
from app.models.evidence_chunk import EvidenceChunk
from app.models.normative_chunk import NormativeChunk
from app.models.gap_analysis import ControlImplementation  # <-- Importación corregida
from app.models.data_breach import DataBreach
from app.models.data_treatment import DataTreatment

router = APIRouter(prefix="/api/chat", tags=["Chat IA"])
ai_service = AIService()
embedding_service = EmbeddingService()

class HistoryItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "es"
    history: Optional[List[HistoryItem]] = []

@router.post("/")
async def chat_endpoint(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):
    """
    Recibe el mensaje de React. 
    1. Inyecta el estado ACTUAL de la empresa (Progreso SOA, Brechas, RoPA).
    2. Busca fragmentos en RAG (Evidencias + Normativa).
    3. Envía a la IA para responder de forma inteligente.
    """
    context = ""
    context_blocks = []
    
    # ========================================================
    # 1. INYECCIÓN DE CONTEXTO EN VIVO (Base de Datos Real)
    # ========================================================
    try:
        # A) Resumen de Controles ISO 27001 (SOA)
        controls = (await db.execute(select(ControlImplementation).where(ControlImplementation.organization_id == org_id))).scalars().all()
        applies = [c for c in controls if c.applicable]
        implemented = [c for c in applies if c.status == 'implemented']
        score = int((len(implemented) / len(applies)) * 100) if applies else 0
        
        # B) Resumen de Brechas de Datos
        breaches = (await db.execute(select(DataBreach).where(DataBreach.organization_id == org_id))).scalars().all()
        breaches_activas = [b for b in breaches if b.estado not in ['notificada', 'cerrada']]
        
        # C) Resumen de Tratamientos RoPA
        treatments = (await db.execute(select(DataTreatment).where(DataTreatment.organization_id == org_id))).scalars().all()
        
        live_data = f"""
        --- CONTEXTO EN VIVO DE LA EMPRESA DEL USUARIO ---
        Progreso de Cumplimiento ISO 27001: {score}%
        Controles aplicables: {len(applies)} | Implementados: {len(implemented)}
        Brechas de Datos Registradas: {len(breaches)} en total | {len(breaches_activas)} activas.
        Tratamientos RoPA Registrados: {len(treatments)}
        ---------------------------------------------------
        """
        context_blocks.append(live_data)
    except Exception as e:
        print(f"Error cargando contexto en vivo: {e}")

    # ========================================================
    # 2. BÚSQUEDA RAG (Vectores)
    # ========================================================
    try:
        query_vector = embedding_service.generate_single_embedding(request.message)
        
        # Evidencias internas
        try:
            from app.models.evidence import Evidence
            ev_stmt = select(EvidenceChunk).join(EvidenceChunk.evidence).options(selectinload(EvidenceChunk.evidence))
            if current_user.get("role") == "employee":
                ev_stmt = ev_stmt.where(Evidence.uploaded_by == current_user["user_id"])
            ev_stmt = ev_stmt.order_by(EvidenceChunk.embedding.cosine_distance(query_vector)).limit(2)
            for chunk in (await db.execute(ev_stmt)).scalars().all():
                context_blocks.append(f"--- EVIDENCIA INTERNA ---\nDoc: {chunk.evidence.title if chunk.evidence else 'N/A'}\nTexto: {chunk.content}")
        except: pass

        # Normativa Oficial
        try:
            norm_stmt = select(NormativeChunk).order_by(NormativeChunk.embedding.cosine_distance(query_vector)).limit(2)
            for chunk in (await db.execute(norm_stmt)).scalars().all():
                context_blocks.append(f"--- NORMATIVA OFICIAL ({chunk.clause}) ---\nRequisito: {chunk.content}")
        except: pass
            
        if context_blocks:
            context = "\n\n".join(context_blocks)
            
    except Exception as rag_err:
        print(f"⚠️ Error RAG: {rag_err}")

    # ========================================================
    # 3. LLAMADA A LA IA
    # ========================================================
    
    # Instrucciones base para que DANI asuma su rol
    system_prompt = (
        "Eres DANI, un asistente experto en ciberseguridad, ISO 27001 y Ley 21.719 de Chile. "
        "Utiliza el CONTEXTO EN VIVO proporcionado para responder a preguntas sobre el estado de la empresa del usuario. "
        "Sé directo, profesional, claro y no inventes datos que no estén en el contexto."
    )

    # Inyectamos las instrucciones del sistema como el primer mensaje invisible
    conversation_history = [{"role": "system", "content": system_prompt}]
    
    # Agregamos el historial real de la ventana de React
    conversation_history.extend([{"role": h.role, "content": h.content} for h in request.history])

    reply = await ai_service.chat(
        request.message,
        context=context,
        language=request.language,
        history=conversation_history,
    )
    
    return {"reply": reply}