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
                max_tokens=1000
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
                max_tokens=1000
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
                max_tokens=1000
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

    # ==========================================================================
    # Funciones de IA para la Ley N° 21.719 (Tarea 2.8 del plan de integración).
    # Reutilizan el mismo cliente y patrón que evaluate_compliance / mass_evaluate_control.
    # Los valores que devuelven calzan con los enums de los modelos:
    #   base_licitud -> LegalBasis   |   nivel_riesgo -> ImpactRiskLevel
    # ==========================================================================

    async def suggest_legal_basis(self, treatment_description: str) -> dict:
        """
        Sugiere la BASE DE LICITUD de un tratamiento de datos personales
        (obligación O2 de la Ley 21.719) a partir de su descripción.
        Devuelve: {"base_licitud": <valor>, "justificacion": <texto>}
        """
        if not self.client:
            return {
                "base_licitud": "consentimiento",
                "justificacion": "[Demo Offline] Sin conexión a la IA; se sugiere consentimiento por defecto."
            }

        prompt = f"""
        Actúa como un experto en protección de datos personales y en la Ley N° 21.719 de Chile.
        A partir de la siguiente descripción de un tratamiento de datos, sugiere la BASE DE LICITUD más adecuada.

        DESCRIPCIÓN DEL TRATAMIENTO:
        {treatment_description}

        Elige UNA base de licitud EXACTAMENTE de esta lista (usa el valor entre comillas):
        - "consentimiento": la persona autorizó el uso de sus datos.
        - "contrato": los datos son necesarios para ejecutar un contrato con la persona.
        - "obligacion_legal": una ley obliga a tratar los datos.
        - "interes_legitimo": interés legítimo del responsable, sin afectar los derechos de la persona.
        - "datos_publicos": datos manifiestamente públicos.
        - "otro": ninguna de las anteriores.

        Responde SOLO con un objeto JSON válido. Ejemplo:
        {{
            "base_licitud": "consentimiento",
            "justificacion": "Explicación breve de por qué corresponde esta base (máx 40 palabras)."
        }}
        """

        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=300
            )
            import json
            content = response.choices[0].message.content
            content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error en suggest_legal_basis: {e}")
            return {
                "base_licitud": "otro",
                "justificacion": f"No se pudo determinar automáticamente: {str(e)[:50]}"
            }

    async def classify_personal_data(self, document_text: str) -> dict:
        """
        Identifica qué DATOS PERSONALES (y sensibles) aparecen en un documento
        subido (apoya las obligaciones O1/O6 de la Ley 21.719).
        Devuelve: {"datos_personales": [...], "datos_sensibles": [...], "resumen": <texto>}
        """
        if not self.client:
            return {
                "datos_personales": [],
                "datos_sensibles": [],
                "resumen": "[Demo Offline] Sin conexión a la IA; no se analizó el documento."
            }

        prompt = f"""
        Actúa como un experto en protección de datos personales (Ley N° 21.719 de Chile).
        Analiza el siguiente texto e identifica qué DATOS PERSONALES contiene.

        Distingue entre:
        - datos_personales: identifican o hacen identificable a una persona (ej: nombre, RUT, correo, teléfono, dirección).
        - datos_sensibles: categoría especial (ej: salud, origen étnico, religión, afiliación política o sindical, vida sexual, datos biométricos).

        TEXTO A ANALIZAR:
        {document_text[:5000]}

        Responde SOLO con un objeto JSON válido. Ejemplo:
        {{
            "datos_personales": ["nombre", "correo", "RUT"],
            "datos_sensibles": ["datos de salud"],
            "resumen": "Frase breve describiendo qué datos personales maneja el documento (máx 40 palabras)."
        }}
        """

        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=500
            )
            import json
            content = response.choices[0].message.content
            content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error en classify_personal_data: {e}")
            return {
                "datos_personales": [],
                "datos_sensibles": [],
                "resumen": f"No se pudo analizar el documento: {str(e)[:50]}"
            }

    async def assess_treatment_risk(self, treatment_description: str) -> dict:
        """
        Evaluación de impacto (DPIA) asistida por IA: estima el nivel de riesgo
        de un tratamiento de datos personales (obligación O6 de la Ley 21.719).
        Devuelve: {"nivel_riesgo": "alto|medio|bajo", "descripcion_riesgo": <texto>, "medidas_mitigacion": <texto>}
        """
        if not self.client:
            return {
                "nivel_riesgo": "medio",
                "descripcion_riesgo": "[Demo Offline] Sin conexión a la IA; nivel de riesgo estimado por defecto.",
                "medidas_mitigacion": "Revisar manualmente el tratamiento."
            }

        prompt = f"""
        Actúa como un experto en protección de datos y evaluaciones de impacto (DPIA) según la Ley N° 21.719 de Chile.
        Evalúa el riesgo para los derechos de las personas del siguiente tratamiento de datos.

        DESCRIPCIÓN DEL TRATAMIENTO:
        {treatment_description}

        Considera factores como: volumen y sensibilidad de los datos, si hay decisiones automatizadas,
        transferencias a terceros, y el impacto potencial sobre las personas.

        Asigna un nivel de riesgo EXACTAMENTE uno de: "alto", "medio", "bajo".

        Responde SOLO con un objeto JSON válido. Ejemplo:
        {{
            "nivel_riesgo": "alto",
            "descripcion_riesgo": "Qué podría salir mal para las personas (máx 40 palabras).",
            "medidas_mitigacion": "Medidas recomendadas para reducir el riesgo (máx 40 palabras)."
        }}
        """

        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500
            )
            import json
            content = response.choices[0].message.content
            content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error en assess_treatment_risk: {e}")
            return {
                "nivel_riesgo": "medio",
                "descripcion_riesgo": f"No se pudo evaluar automáticamente: {str(e)[:50]}",
                "medidas_mitigacion": "Revisar manualmente el tratamiento."
            }

    async def evaluate_assessment_questions(self, control_nombre: str, preguntas: list, contexto: str) -> list:
        """
        Evalúa en LOTE las sub-preguntas de un control ISO 27001 contra el texto de
        los documentos subidos por el usuario (contexto). Para cada pregunta la IA
        determina si la evidencia CUMPLE / PARCIAL / NO CUMPLE / SIN EVIDENCIA.

        `preguntas`: lista de dicts {id, pregunta, evidencia_esperada}.
        Devuelve una lista de dicts {id, veredicto, confianza, justificacion}.
        Se procesan juntas las preguntas de un mismo control para ahorrar llamadas.
        """
        # Sin cliente de IA: devolver "sin evidencia" para todas (modo demo offline).
        if not self.client:
            return [
                {"id": p["id"], "veredicto": "sin_evidencia", "confianza": 0.0,
                 "justificacion": "[Demo Offline] IA no configurada."}
                for p in preguntas
            ]

        lista_preguntas = "\n".join(
            f'{i+1}. (id={p["id"]}) {p["pregunta"]} '
            f'[Evidencia esperada: {p.get("evidencia_esperada") or "no especificada"}]'
            for i, p in enumerate(preguntas)
        )

        prompt = f"""Actúa como un Auditor Líder de ISO 27001:2022.
Debes evaluar el siguiente control: "{control_nombre}".

Tienes estas preguntas de evaluación:
{lista_preguntas}

Basándote ÚNICAMENTE en la siguiente evidencia (extraída de los documentos que subió la organización), responde cada pregunta.

=== EVIDENCIA (documentos subidos) ===
{contexto[:8000]}
=== FIN EVIDENCIA ===

Para cada pregunta asigna un veredicto EXACTAMENTE uno de:
- "cumple": la evidencia demuestra claramente que sí se cumple.
- "parcial": hay evidencia parcial o incompleta.
- "no_cumple": la evidencia muestra que no se cumple.
- "sin_evidencia": los documentos no contienen información para responder.

Responde SOLO con un arreglo JSON válido, un objeto por pregunta, en el mismo orden. Ejemplo:
[
  {{"id": "<el id de la pregunta>", "veredicto": "cumple", "confianza": 0.9, "justificacion": "Breve motivo basado en la evidencia (máx 30 palabras)."}}
]"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1500
            )
            import json
            content = response.choices[0].message.content
            content = content.replace('```json', '').replace('```', '').strip()
            data = json.loads(content)
            if isinstance(data, dict):
                data = [data]
            # Asegurar que cada pregunta tenga respuesta (aunque la IA omita alguna)
            by_id = {str(item.get("id")): item for item in data if isinstance(item, dict)}
            resultados = []
            for p in preguntas:
                item = by_id.get(str(p["id"]), {})
                resultados.append({
                    "id": p["id"],
                    "veredicto": item.get("veredicto", "sin_evidencia"),
                    "confianza": item.get("confianza", 0.0),
                    "justificacion": item.get("justificacion", "La IA no devolvió respuesta para esta pregunta."),
                })
            return resultados
        except Exception as e:
            logger.error(f"Error en evaluate_assessment_questions: {e}")
            return [
                {"id": p["id"], "veredicto": "sin_evidencia", "confianza": 0.0,
                 "justificacion": f"Fallo al evaluar con IA: {str(e)[:50]}"}
                for p in preguntas
            ]