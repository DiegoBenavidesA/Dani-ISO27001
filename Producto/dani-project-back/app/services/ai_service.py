# app/services/ai_service.py - Versión para DeepSeek
from openai import AsyncOpenAI  # DeepSeek usa el mismo SDK que OpenAI
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        # Configuracion general apuntando al API key y URL dinámica
        self.api_key = settings.AI_API_KEY
        
        if not self.api_key:
            logger.warning("⚠️ API key no configurada")
            self.client = None
        else:
            # Configurar cliente
            self.client = AsyncOpenAI(
                api_key=self.api_key,
                base_url=settings.AI_BASE_URL
            )
            logger.info(f"✅ AI client inicializado en {settings.AI_BASE_URL}")
    
    async def chat(self, message: str, context: str = None, language: str = "es", history: list = None) -> str:
        """Enviar mensaje a DeepSeek con contexto RAG opcional e idioma de respuesta."""
        if not self.client:
            return "Error: API key no configurada"

        lang_map = {
            "es": ("Español", "De acuerdo a tus documentos subidos, no encontré evidencia sobre"),
            "en": ("English", "Based on your uploaded documents, I found no evidence about"),
            "pt": ("Português", "Com base nos seus documentos enviados, não encontrei evidência sobre"),
        }
        lang_name, no_evidence_phrase = lang_map.get(language, lang_map["es"])

        system_content = (
            "You are DANI, an ISO 27001 and information security expert. You respond professionally and with structure.\n\n"
            "FORMATTING RULES — STRICTLY ENFORCED:\n"
            "• NEVER use markdown syntax. Forbidden characters: ** * # ## ### _ __ ` ``` > ~~\n"
            "• Section titles: write in UPPERCASE followed by a colon (e.g. 'ANALYSIS:')\n"
            "• Bullet points: use the • character only\n"
            "• Numbered lists: use '1.' '2.' '3.' format\n"
            "• Key terms or emphasis: write in UPPERCASE (e.g. CONTROL A.5.15, NOT COMPLIANT)\n"
            "• Separate sections with a single blank line\n"
            "• The interface renders plain text only — markdown symbols will appear as literal characters and must NOT be used\n\n"
            "LENGTH RULES — STRICTLY ENFORCED:\n"
            "• Your total response must fit within 1500 tokens. Plan before you write.\n"
            "• If the topic is complex, prioritize: give 2-3 key points well-explained rather than 6 points half-finished.\n"
            "• ALWAYS end with a complete closing sentence. Never leave a thought, list, or section unfinished.\n"
            "• If you sense you are running out of space mid-response, immediately wrap up with a short summary sentence and stop. A short complete answer is always better than a long truncated one."
        )
        if context:
            system_content += (
                f"\n\n[ORGANIZATION EVIDENCE CONTEXT]\n{context}\n\n"
                f"RESPONSE RULES:\n"
                f"1. Base your response on the information provided in the context above.\n"
                f"2. If the documentation provides compliance evidence, indicate it technically and clearly.\n"
                f"3. If the documentation does not provide sufficient information, be honest and say: '{no_evidence_phrase}...'."
            )
        system_content += f"\n\n⚠️ MANDATORY LANGUAGE DIRECTIVE: You MUST respond EXCLUSIVELY in {lang_name}. This rule overrides everything else."
        
        try:
            messages_payload = [{"role": "system", "content": system_content}]
            if history:
                # Keep last 10 turns (5 user + 5 assistant) to stay within context window
                messages_payload.extend(history[-10:])
            messages_payload.append({"role": "user", "content": message})

            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=messages_payload,
                temperature=0.7,
                max_tokens=3500,
            )

            import re

            content      = response.choices[0].message.content
            finish_reason = getattr(response.choices[0], 'finish_reason', None)

            # Detect truncation: either the provider said so, or the text ends mid-word/mid-sentence
            last_char  = content.rstrip()[-1] if content.rstrip() else ''
            was_cut    = (finish_reason == "length") or last_char.isalnum() or last_char in ',;:'

            if was_cut:
                # Find the last sentence-ending punctuation followed by whitespace or end-of-string
                matches = list(re.finditer(r'[.!?](?=\s|\n|$)', content))
                if matches and matches[-1].end() > len(content) * 0.3:
                    content = content[:matches[-1].end()].rstrip()
                    logger.warning(
                        f"⚠️ Respuesta cortada (finish_reason={finish_reason}). "
                        f"Truncada en última oración completa ({len(content)} chars)."
                    )

            return content
            
        except Exception as e:
            logger.error(f"Error en AI Service: {e}")

            context_note = ""
            if context:
                context_note = f"\n\n*(RAG Vector Search completed: found relevant fragments — \"{context[:150]}...\")*"

            fallback_response = (
                f"🤖 **[DANI OFFLINE - DEMO MODE RAG]**{context_note}\n\n"
                f"Analyzing your query: *\"{message}\"*\n\n"
                f"From the **ISO 27001:2022** perspective, this query is addressed by reviewing the corresponding normative guidelines in your evidence. "
                f"I suggest reviewing your policies on **Awareness and Training (Clause 7.3)** and "
                f"**Access Controls (A.5.15)**.\n\n"
                f"*(Demo notice: AI engine returned error: {str(e)[:50]}... This is a fallback simulation demonstrating local RAG processing with embeddings).* 😉"
            )
            return fallback_response
    
    async def analyze_risk(self, risk_description: str) -> dict:
        """Analizar un riesgo usando DeepSeek"""
        if not self.client:
            return {"error": "IA no disponible"}
        
        prompt = f"""
        Como experto en ISO 27001, analiza el siguiente riesgo:
        
        Riesgo: {risk_description}
        
        Responde SOLO en formato JSON (sin markdown):
        {{
            "risk_level": "critical|high|medium|low",
            "recommended_controls": ["control1", "control2"],
            "mitigation_steps": ["paso1", "paso2"],
            "priority": "alta|media|baja"
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=300
            )
            
            import json
            content = response.choices[0].message.content
            # Limpiar caracteres no JSON
            content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Error en analyze_risk: {e}")
            return {
                "risk_level": "high",
                "recommended_controls": ["A.5.15 Control de acceso", "A.8.24 Criptografía"],
                "mitigation_steps": ["1. Realizar auditoría de accesos.", "2. Enforzar TLS 1.3.", "3. Implementar MFA."],
                "priority": "alta"
            }

    async def generate_document(self, prompt: str) -> str:
        """Genera un capítulo completo del SGSI — usa max_tokens alto para no truncar"""
        if not self.client:
            return "Error: API key no configurada"

        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": "Eres un Consultor Lead Implementer y Auditor Líder de ISO 27001 con 20 años de experiencia. Redacta documentos extensos, formales y listos para producción."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=3000
            )
            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Error en generate_document: {e}")
            raise

    async def evaluate_compliance(self, document_text: str, control_title: str, control_desc: str) -> dict:
        """Auditar un documento contra un control de la ISO 27001"""
        if not self.client:
            # Fallback simulado
            return {
                "score": 2,
                "status": "implemented",
                "justification": "[Demo Offline] El documento analizado evidencia lineamientos sólidos que satisfacen plenamente los requerimientos de este control normativo."
            }
            
        prompt = f"""
        Actúa como un Auditor Líder de ISO 27001. Tu objetivo es evaluar si el documento proporcionado por la empresa cumple con los requisitos del siguiente control normativo.
        
        CONTROL A EVALUAR:
        Título: {control_title}
        Descripción: {control_desc}
        
        DOCUMENTO DE LA EMPRESA (EVIDENCIA):
        {document_text[:5000]}
        
        EVALUACIÓN:
        1. Analiza estrictamente si el documento aborda lo que exige el control.
        2. Asigna un puntaje numérico: 0 (No aborda el control), 1 (Aborda parcialmente), 2 (Cumple totalmente).
        3. Determina el estado: "implemented" (si es 2), "planned" (si es 1), o "notImplemented" (si es 0).
        4. Redacta una justificación técnica y formal explicando tu decisión como auditor (max 50 palabras).
        
        Responde SOLO con un objeto JSON válido. Ejemplo:
        {{
            "score": 2,
            "status": "implemented",
            "justification": "Tu justificación técnica aquí..."
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=400
            )
            
            import json
            content = response.choices[0].message.content
            content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Error en evaluate_compliance: {e}")
            return {
                "score": 1,
                "status": "planned",
                "justification": f"Fallo en la llamada a la IA: {str(e)[:50]}"
            }

    async def mass_evaluate_control(self, control_title: str, control_desc: str, context_chunks: str) -> dict:
        """Auditar un control contra multiples fragmentos RAG extraídos de todos los documentos"""
        if not self.client:
            return {
                "score": 2,
                "status": "implemented",
                "justification": "[Demo Offline] Según el RAG masivo, la organización cumple con este control adecuadamente."
            }
            
        prompt = f"""
        Actúa como un Auditor Líder de ISO 27001. Tu objetivo es evaluar si la empresa cumple con el siguiente control normativo, basándote ÚNICAMENTE en los fragmentos de documentación corporativa recuperados (Contexto RAG).
        
        CONTROL A EVALUAR:
        Título: {control_title}
        Descripción: {control_desc}
        
        CONTEXTO CORPORATIVO RECUPERADO (RAG):
        {context_chunks}
        
        EVALUACIÓN:
        1. Analiza estrictamente si los fragmentos abordan lo que exige el control. Si el contexto está vacío, asume que no hay evidencia.
        2. Asigna un puntaje numérico: 0 (No aborda el control / Sin evidencia), 1 (Aborda parcialmente), 2 (Cumple totalmente).
        3. Determina el estado: "implemented" (si es 2), "planned" (si es 1), o "notImplemented" (si es 0).
        4. Redacta una justificación técnica y formal explicando tu decisión como auditor (max 50 palabras).
        
        Responde SOLO con un objeto JSON válido. Ejemplo:
        {{
            "score": 2,
            "status": "implemented",
            "justification": "Tu justificación técnica aquí..."
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=400
            )
            
            import json
            content = response.choices[0].message.content
            content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Error en mass_evaluate_control: {e}")
            return {
                "score": 0,
                "status": "notImplemented",
                "justification": f"Fallo en la evaluación masiva con IA: {str(e)[:50]}"
            }