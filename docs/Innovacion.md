# Innovación — NormIA

Este documento explica qué problema resuelve NormIA, qué la diferencia de otras formas de abordar el cumplimiento normativo y qué valor concreto agrega. Todo lo descrito corresponde a funcionalidades implementadas en el repositorio; las referencias a archivos permiten verificarlo.

---

## 1. Problema que resuelve

La **Ley N.º 21.719** de protección de datos personales entra en plena vigencia el **1 de diciembre de 2026** y obliga a toda organización que trate datos personales en Chile a demostrar cumplimiento ante la nueva Agencia de Protección de Datos Personales. Entre sus exigencias más críticas está **notificar a la Agencia una vulneración de seguridad dentro de 72 horas**.

Al mismo tiempo, muchas de estas organizaciones ya trabajan —o quieren trabajar— con **ISO/IEC 27001:2022** para la seguridad de la información.

Hoy, en la práctica, esto se resuelve con:

- **Planillas Excel y documentos sueltos**, que no muestran el estado real de cumplimiento ni guardan trazabilidad.
- **Consultorías externas**, costosas y puntuales: entregan un diagnóstico en una fecha, pero no acompañan el día a día.
- **Herramientas GRC internacionales**, caras, en inglés y sin conocimiento de la normativa chilena.

Para una pyme o una organización mediana, esto significa que **no sabe cuánto le falta para cumplir**, no tiene un procedimiento claro cuando ocurre un incidente y depende de especialistas que no puede pagar de forma permanente.

## 2. Qué hace diferente a NormIA

### 2.1 Evaluación con IA a partir de la evidencia real de la empresa

En vez de un cuestionario que el usuario contesta "a mano", NormIA **evalúa el cumplimiento leyendo los documentos que la empresa sube** (políticas, procedimientos, contratos, registros).

- Los documentos se dividen en fragmentos y se convierten en *embeddings* que se guardan en PostgreSQL con **pgvector** (`app/services/embedding_service.py`, tabla `evidence_chunks`).
- Para cada pregunta de evaluación, la IA recupera los fragmentos más relevantes (**RAG**, *Retrieval-Augmented Generation*) y emite un veredicto —cumple, cumple parcialmente o no cumple— con su **justificación y nivel de confianza** (`app/routes/assessment_questions.py`, tabla `assessment_answers`).
- El resultado alimenta el **Análisis de Brechas** y la **Declaración de Aplicabilidad (SOA)** de ISO 27001 (`GapAnalysisScreen.jsx`).

**Por qué es innovador:** el diagnóstico deja de depender de la opinión de quien responde y pasa a estar respaldado por documentos verificables, que es justamente lo que pedirá un auditor o la Agencia.

### 2.2 Dos marcos en una sola plataforma: ISO 27001 y Ley 21.719

- **ISO 27001:2022:** banco de 117 preguntas de evaluación (`app/data/catalogo_iso27001.json`) sobre cláusulas y controles del Anexo A.
- **Ley 21.719:** banco propio de **24 preguntas** organizadas en las **8 obligaciones** de la ley (`app/data/catalogo_ley21719.json`): tratamiento de datos, licitud y consentimiento, derechos de los titulares, vulneraciones de seguridad, encargados del tratamiento, evaluación de impacto, gobernanza y seguridad de los datos.
- El usuario elige contra qué marco evaluar, y la IA usa un **prompt de auditor distinto para cada uno**.

**Por qué es innovador:** la Ley 21.719 exige "medidas de seguridad apropiadas", y ISO 27001 es la forma más reconocida de demostrarlas. NormIA aprovecha ese vínculo: el trabajo hecho para ISO también sirve como evidencia para la ley, sin duplicar esfuerzo.

### 2.3 Gestión de vulneraciones con plazo legal de 72 horas

El módulo de vulneraciones (`app/routes/breaches.py`, `BreachesScreen.jsx`) traduce el procedimiento de la ley a un flujo guiado:

1. **Cualquier trabajador reporta** lo ocurrido con sus propias palabras; no necesita saber evaluar la gravedad.
2. **La IA analiza el reporte** y propone gravedad, datos posiblemente afectados, si corresponde notificar a la Agencia y a los titulares, acciones inmediatas y preguntas para completar la investigación.
3. **Los responsables (owner, admin y DPO) reciben un aviso** automático por notificación y correo.
4. **Una persona confirma o corrige** la evaluación de la IA: la decisión final siempre es humana.
5. La plataforma **cuenta las 72 horas** desde la detección y alerta cuando el plazo está por vencer o venció.
6. Se registra la **notificación a la Agencia** y, al cerrar, la **causa raíz y cómo se resolvió**.

**Por qué es innovador:** combina la rapidez de la IA con la responsabilidad humana que exige la ley, y deja un registro auditable de quién reportó, quién confirmó y quién resolvió (`reportado_por`, `confirmada_por`, `resuelta_por`).

### 2.4 Asistente DANI con el contexto de la empresa

El chat DANI (`app/routes/chat.py`, `ChatDANI.jsx`) no responde de forma genérica: **incorpora el estado actual de la organización** (avance de la SOA, brechas detectadas, riesgos) y fragmentos normativos para orientar al usuario sobre qué hacer a continuación.

### 2.5 Generación de documentos del sistema de gestión

El Generador de Documentos (`app/routes/documents.py`, `DocGeneratorScreen.jsx`) redacta **borradores de políticas y procedimientos** de ISO 27001 y de la Ley 21.719, que luego el equipo revisa, ajusta y publica para que los trabajadores los lean y confirmen (`document_acknowledgements`).

### 2.6 Multiempresa desde el diseño

Cada registro de la empresa lleva `organization_id`, y todas las consultas se filtran por la organización del usuario (`app/dependencies/tenant.py`). Esto permite que **una consultora atienda a varios clientes desde una sola instalación**, con roles diferenciados (`superadmin`, `owner`, `admin`, `manager`, `auditor`, `dpo`, `employee`) y sin que los datos de una empresa sean visibles para otra.

## 3. Valor que agrega

| Para quién | Valor |
|---|---|
| **Pymes y organizaciones medianas** | Saber cuánto les falta para cumplir la Ley 21.719 e ISO 27001, con un plan de acción priorizado, sin contratar una consultoría permanente. |
| **Encargado de cumplimiento / DPO** | Un solo lugar para evidencias, brechas, documentos y vulneraciones, con trazabilidad lista para una auditoría o una fiscalización. |
| **Trabajadores** | Un canal simple para reportar incidentes y acceso a las políticas que deben conocer. |
| **Consultoras** | Atender a varios clientes desde una sola plataforma, con los datos de cada uno aislados. |

**Diferencia clave frente a las alternativas:**

| Alternativa | Limitación | Cómo la resuelve NormIA |
|---|---|---|
| Planillas y documentos sueltos | Sin trazabilidad ni estado real | Evaluación respaldada en evidencia y registro de cada acción |
| Consultoría externa | Costosa y puntual | Diagnóstico continuo y asistente disponible siempre |
| GRC internacionales | Caras, en inglés, sin ley chilena | En español, con la Ley 21.719 incorporada |

## 4. Tecnologías que lo hacen posible

| Componente | Tecnología |
|---|---|
| IA generativa | Groq (proveedor principal) y DeepSeek (alternativo), mediante API compatible con OpenAI |
| Búsqueda semántica | Embeddings con FastEmbed y PostgreSQL + pgvector |
| Backend | FastAPI con SQLAlchemy asíncrono |
| Frontend | React |
| Infraestructura | Render (backend), Vercel (frontend), Neon (PostgreSQL), Supabase Storage (evidencias), Brevo (correo) |

## 5. Límites actuales

Para que la propuesta de valor sea honesta:

- La IA **propone**; las decisiones de cumplimiento y de notificación siempre las confirma una persona.
- La calidad de la evaluación depende de la evidencia que la empresa suba: sin documentos, la IA no puede afirmar cumplimiento.
- Los módulos independientes de tratamientos, consentimientos y solicitudes de titulares se retiraron por indicación del docente; esas obligaciones se evalúan hoy mediante las preguntas de la Ley 21.719 en el Análisis de Brechas.
