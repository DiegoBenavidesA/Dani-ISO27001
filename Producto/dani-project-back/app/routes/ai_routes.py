# app/routes/ai_routes.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.ai_service import AIService
from app.dependencies.auth import get_current_user, require_superadmin
from app.services import uso_ia

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    message: str

@router.get("/uso")
async def uso_de_la_ia(current_user: dict = Depends(require_superadmin)):
    """Consumo de la IA frente a los límites de Groq por minuto y por día.
    Es uno solo para toda la plataforma, por eso solo lo ve el superadministrador."""
    await uso_ia.cargar()
    return uso_ia.resumen()


@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Chat con DeepSeek (experto ISO 27001)"""
    ai_service = AIService()
    response = await ai_service.chat(request.message)
    return {"response": response}