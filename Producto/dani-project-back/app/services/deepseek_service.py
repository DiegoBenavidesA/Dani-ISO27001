import openai
from sqlalchemy import select
from app.config import settings
from app.dependencies.database import AsyncSessionLocal
from app.models.prompt import AIPrompt

class DeepSeekService:
    def __init__(self):
        # Configuración compatible con OpenAI apuntando de forma dinámica a Groq o DeepSeek
        import httpx
        from app.services import uso_ia
        from app.services.ai_service import proteger_datos_personales
        self.client = proteger_datos_personales(openai.AsyncOpenAI(
            api_key=settings.AI_API_KEY,
            base_url=settings.AI_BASE_URL,
            http_client=httpx.AsyncClient(timeout=60.0, event_hooks={"response": [uso_ia.al_recibir_respuesta]}),
        ))
        
    async def get_prompt_from_db(self, prompt_name: str):
        """Busca el prompt en PostgreSQL por su nombre único"""
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(AIPrompt).where(AIPrompt.name == prompt_name))
            return result.scalar_one_or_none()

    async def analyze_risk(self, risk: dict, prompt_name: str = "riesgo_analisis_inicial") -> dict:
        """Analyze risk using DeepSeek Chat y Prompts Dinámicos"""
        prompt_data = await self.get_prompt_from_db(prompt_name)
        if not prompt_data:
            return {"error": f"No se encontró el prompt '{prompt_name}' en la base de datos."}

        user_message = prompt_data.user_prompt_template.format(
            title=risk.get('title', 'N/A'),
            description=risk.get('description', 'N/A')
        )
        
        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL, # Dynamic model based on active key
                messages=[
                    {"role": "system", "content": prompt_data.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7
            )
            
            return {
                "analysis": response.choices[0].message.content,
                "model_used": settings.AI_MODEL,
                "prompt_used": prompt_name
            }
        except Exception as e:
            # Capturamos el error de saldo o conexión externa
            print(f"⚠️ Groq API error o sin saldo ({str(e)}). Activando simulación experta de respaldo.")
            
            # Devolvemos una simulación de respuesta experta de primer nivel basada en el prompt enviado
            return {
                "analysis": f"🤖 **[MODO DEMO - DANI COMPLIANCE]**\n\nHe recibido tu requerimiento técnico relacionado con la normativa: *\"{risk.get('title', 'Evaluación de Riesgo')}\"*.\n\nAl analizar el vector bajo los estándares de la **ISO 27001:2022**, se determina la necesidad de aplicar de forma prioritaria las directrices del **Anexo A (Controles de Seguridad)**, enfocándose en la segregación de funciones, endurecimiento perimetral (Hardening) y cifrado de datos en tránsito utilizando protocolos criptográficos TLS 1.3. \n\n*Nota: El motor principal de IA (Groq/Llama) no está configurado correctamente o requiere una nueva API Key.*",
                "model_used": "simulated-fallback",
                "prompt_used": prompt_name
            }

    async def chat_with_dani(self, message: str) -> dict:
        prompt_data = await self.get_prompt_from_db("chat_general_iso27001")
        sys_prompt = prompt_data.system_prompt if prompt_data else "Eres DANI, experto en ISO 27001. Responde en español."
        
        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL, # Dynamic model based on active key
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.7
            )
            return {"reply": response.choices[0].message.content}
        except Exception as e:
            print(f"⚠️ Groq Chat API error: {str(e)}")
            # Fallback brillante para la demostración
            fallback_response = (
                f"🤖 **[DANI OFFLINE - MODO DEMO]**\n\n"
                f"Analizando tu mensaje: *\"{message}\"*\n\n"
                f"Te comento que desde la perspectiva de la **ISO 27001:2022**, esta consulta requeriría revisar los controles del **Anexo A**. "
                f"Te recomiendo específicamente revisar los lineamientos sobre **Concientización y Capacitación (Cláusula 7.3)** y "
                f"los **Controles de Acceso (A.5.15)**.\n\n"
                f"*(Aviso Interno para la Demo: La API Key de Groq no se ha configurado o es inválida. Esta es una respuesta simulada de respaldo para que puedas continuar con la demostración sin interrupciones).* 😉"
            )
            return {"reply": fallback_response}