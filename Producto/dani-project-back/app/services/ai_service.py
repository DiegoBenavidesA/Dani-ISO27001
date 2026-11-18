# app/services/ai_service.py - Versión para DeepSeek
from openai import AsyncOpenAI  # DeepSeek usa el mismo SDK que OpenAI
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def proteger_datos_personales(cliente):
    """Toda llamada a la IA pasa primero por el ocultamiento de datos personales
    (RUT, correos, teléfonos y tarjetas), sin importar qué función la haga."""
    from app.services.datos_personales import ocultar_mensajes
    original = cliente.chat.completions.create

    async def create_sin_datos_personales(*args, **kwargs):
        if "messages" in kwargs:
            kwargs["messages"] = ocultar_mensajes(kwargs["messages"])
        return await original(*args, **kwargs)

    cliente.chat.completions.create = create_sin_datos_personales
    return cliente


class AIService:
    def __init__(self):
        # Configuracion general apuntando al API key y URL dinámica
        self.api_key = settings.AI_API_KEY
        
        if not self.api_key:
            logger.warning("⚠️ API key no configurada")
            self.client = None
        else:
            import httpx
            from app.services import uso_ia
            self.client = AsyncOpenAI(
                api_key=self.api_key,
                base_url=settings.AI_BASE_URL,
                timeout=30.0,
                max_retries=1,
                # Cada respuesta pasa por uso_ia para medir tokens y límites de Groq.
                http_client=httpx.AsyncClient(timeout=30.0, event_hooks={"response": [uso_ia.al_recibir_respuesta]}),
            )
            proteger_datos_personales(self.client)
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

            last_char  = content.rstrip()[-1] if content.rstrip() else ''
            was_cut    = (finish_reason == "length") or last_char.isalnum() or last_char in ',;:'

            if was_cut:
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
            response = await self.client.chat.completions.create(model=settings.AI_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.3, max_tokens=1000)
            import json
            content = response.choices[0].message.content
            content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error en analyze_risk: {e}")
            return { "risk_level": "high", "recommended_controls": ["A.5.15 Control de acceso"], "mitigation_steps": ["1. Auditoría."], "priority": "alta" }

    async def sugerir_controles_riesgo(self, riesgo: dict, catalogo: dict) -> list:
        """Pide a la IA de 2 a 5 controles del Anexo A (ISO 27001:2022) que
        traten este riesgo. La IA solo puede elegir códigos del catálogo; lo que
        no exista se descarta. Lanza RuntimeError si la IA no está disponible
        o no responde algo usable (no hay respuesta inventada de respaldo)."""
        if not self.client:
            raise RuntimeError("La IA no está configurada en el servidor.")
        lista = "\n".join(f"{c} {n}" for c, n in catalogo.items())
        prompt = f"""
        Eres consultor de ISO 27001:2022. Para el riesgo descrito, elige de 2 a 5
        controles del Anexo A que lo traten directamente. Usa SOLO códigos de esta lista:
        {lista}

        RIESGO: {riesgo.get("title")}
        DESCRIPCIÓN: {riesgo.get("description") or "sin descripción"}
        CATEGORÍA: {riesgo.get("category")}
        PROBABILIDAD ACTUAL (1-5): {riesgo.get("likelihood")}
        IMPACTO ACTUAL (1-5): {riesgo.get("impact")}

        Para cada control indica qué reduce: "probabilidad" si hace menos probable
        que ocurra (prevención) o "impacto" si limita el daño cuando ocurre
        (detección, respuesta, respaldo). "puntos" es cuánto lo reduce en la
        escala 1-5: 1 (ayuda) o 2 (lo reduce claramente). "accion" es una frase
        concreta de qué implementar en esta empresa para este riesgo.

        Responde SOLO un arreglo JSON, sin texto adicional:
        [{{"codigo": "A.8.5", "accion": "...", "reduce": "probabilidad", "puntos": 2}}]
        """
        import json
        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL, messages=[{"role": "user", "content": prompt}],
                temperature=0.2, max_tokens=900)
            contenido = response.choices[0].message.content.replace('```json', '').replace('```', '').strip()
            datos = json.loads(contenido)
        except Exception as e:
            logger.error(f"Error en sugerir_controles_riesgo: {e}")
            raise RuntimeError("La IA no respondió con controles válidos. Intenta de nuevo.")
        return limpiar_controles_sugeridos(datos, catalogo)

    async def generate_document(self, prompt: str) -> str:
        if not self.client: return "Error: API key no configurada"
        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL, messages=[{"role": "system", "content": "Eres Consultor Lead Implementer ISO 27001."}, {"role": "user", "content": prompt}], temperature=0.5, max_tokens=3000
            )
            return response.choices[0].message.content
        except Exception as e: raise

    async def evaluate_compliance(self, document_text: str, control_title: str, control_desc: str) -> dict:
        if not self.client:
            return { "score": 2, "status": "implemented", "justification": "[Demo Offline] Satisface el control normativo." }
        prompt = f"CONTROL: {control_title}\nDESC: {control_desc}\nDOC:\n{document_text[:5000]}\nEVALUACION:\nResponder en JSON: {{'score': 2, 'status': 'implemented', 'justification': '...'}}"
        try:
            response = await self.client.chat.completions.create(model=settings.AI_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.2, max_tokens=1000)
            import json
            return json.loads(response.choices[0].message.content.replace('```json', '').replace('```', '').strip())
        except Exception as e:
            return { "score": 1, "status": "planned", "justification": f"Fallo: {str(e)[:50]}" }

    async def mass_evaluate_control(self, control_title: str, control_desc: str, context_chunks: str) -> dict:
        if not self.client:
            return { "score": 2, "status": "implemented", "justification": "[Demo Offline] Satisface el control normativo." }
        prompt = f"CONTROL: {control_title}\nDESC: {control_desc}\nRAG CONTEXT:\n{context_chunks}\nResponder JSON: {{'score': 2, 'status': 'implemented', 'justification': '...'}}"
        try:
            response = await self.client.chat.completions.create(model=settings.AI_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.2, max_tokens=1000)
            import json
            return json.loads(response.choices[0].message.content.replace('```json', '').replace('```', '').strip())
        except Exception as e:
            return { "score": 0, "status": "notImplemented", "justification": f"Fallo: {str(e)[:50]}" }

    async def suggest_legal_basis(self, treatment_description: str) -> dict:
        if not self.client: return { "base_licitud": "consentimiento", "justificacion": "[Demo]" }
        prompt = f"TRATAMIENTO:\n{treatment_description}\nElige base licitud (consentimiento, contrato, obligacion_legal, interes_legitimo, datos_publicos). Responde JSON: {{'base_licitud': '...', 'justificacion': '...'}}"
        try:
            response = await self.client.chat.completions.create(model=settings.AI_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.2, max_tokens=300)
            import json
            return json.loads(response.choices[0].message.content.replace('```json', '').replace('```', '').strip())
        except Exception as e: return { "base_licitud": "otro", "justificacion": "Error" }

    async def classify_personal_data(self, document_text: str) -> dict:
        if not self.client: return { "datos_personales": [], "datos_sensibles": [], "resumen": "Demo" }
        prompt = f"Analiza datos personales y sensibles:\n{document_text[:5000]}\nResponder JSON: {{'datos_personales': [], 'datos_sensibles': [], 'resumen': '...'}}"
        try:
            response = await self.client.chat.completions.create(model=settings.AI_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.2, max_tokens=500)
            import json
            return json.loads(response.choices[0].message.content.replace('```json', '').replace('```', '').strip())
        except Exception as e: return { "datos_personales": [], "datos_sensibles": [], "resumen": "Error" }

    async def assess_treatment_risk(self, treatment_description: str) -> dict:
        if not self.client: return { "nivel_riesgo": "medio", "descripcion_riesgo": "Demo", "medidas_mitigacion": "Demo" }
        prompt = f"DPIA de este tratamiento:\n{treatment_description}\nResponder JSON: {{'nivel_riesgo': 'alto|medio|bajo', 'descripcion_riesgo': '...', 'medidas_mitigacion': '...'}}"
        try:
            response = await self.client.chat.completions.create(model=settings.AI_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.3, max_tokens=500)
            import json
            return json.loads(response.choices[0].message.content.replace('```json', '').replace('```', '').strip())
        except Exception as e: return { "nivel_riesgo": "medio", "descripcion_riesgo": "Error", "medidas_mitigacion": "Error" }

    async def evaluate_assessment_questions(self, control_nombre: str, preguntas: list, contexto: str) -> list:
        if not self.client: return [ {"id": p["id"], "veredicto": "sin_evidencia", "confianza": 0.0, "justificacion": "Demo"} for p in preguntas ]
        lista_preguntas = "\n".join(f'{i+1}. (id={p["id"]}) {p["pregunta"]}' for i, p in enumerate(preguntas))
        prompt = f"Control: {control_nombre}\nPreguntas:\n{lista_preguntas}\nEvidencia:\n{contexto[:8000]}\nResponder JSON Array."
        try:
            response = await self.client.chat.completions.create(model=settings.AI_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.2, max_tokens=3500)
            import json
            data = json.loads(response.choices[0].message.content.replace('```json', '').replace('```', '').strip())
            if isinstance(data, dict): data = [data]
            by_id = {str(item.get("id")): item for item in data if isinstance(item, dict)}
            return [ { "id": p["id"], "veredicto": by_id.get(str(p["id"]), {}).get("veredicto", "sin_evidencia"), "confianza": by_id.get(str(p["id"]), {}).get("confianza", 0.0), "justificacion": by_id.get(str(p["id"]), {}).get("justificacion", "") } for p in preguntas ]
        except Exception as e: return [ {"id": p["id"], "veredicto": "sin_evidencia", "confianza": 0.0, "justificacion": "Error"} for p in preguntas ]

def limpiar_controles_sugeridos(datos, catalogo: dict) -> list:
    """Deja solo controles que existen en el catálogo, sin repetir, con
    'reduce' y 'puntos' válidos. Máximo 5."""
    resultado, vistos = [], set()
    if not isinstance(datos, list):
        return resultado
    for d in datos:
        if not isinstance(d, dict):
            continue
        codigo = str(d.get("codigo", "")).strip().upper()
        if codigo not in catalogo or codigo in vistos:
            continue
        reduce = str(d.get("reduce", "")).strip().lower()
        if reduce not in ("probabilidad", "impacto"):
            continue
        try:
            puntos = int(d.get("puntos", 1))
        except (TypeError, ValueError):
            puntos = 1
        vistos.add(codigo)
        resultado.append({
            "id": codigo,
            "codigo": codigo,
            "nombre": catalogo[codigo],
            "accion": str(d.get("accion", "")).strip()[:240],
            "reduce": reduce,
            "puntos": max(1, min(2, puntos)),
        })
        if len(resultado) == 5:
            break
    return resultado
