# Innovación de NormIA

Este documento explica qué problema resuelve NormIA, en qué se diferencia de otras formas de abordar el cumplimiento normativo y qué valor agrega. Todo lo descrito está implementado en el repositorio; las rutas de archivo indican dónde comprobarlo.

## 1. Problema que resuelve

La Ley N.º 21.719 de protección de datos personales entra en plena vigencia el 1 de diciembre de 2026. Desde esa fecha, toda organización que trate datos personales en Chile debe poder demostrar su cumplimiento ante la Agencia de Protección de Datos Personales, y debe notificarle cualquier vulneración de seguridad dentro de 72 horas. Muchas de estas organizaciones también trabajan, o quieren trabajar, con ISO/IEC 27001:2022 para la seguridad de la información.

Hoy esto se resuelve de tres maneras:

- Con planillas Excel y documentos sueltos, que no muestran el estado real de cumplimiento ni dejan registro de quién hizo qué.
- Con consultorías externas, que entregan un diagnóstico en una fecha determinada y tienen un costo alto para mantenerlas en el tiempo.
- Con herramientas GRC internacionales, que son caras, están en inglés y no incluyen la normativa chilena.

Una pyme o una organización mediana termina sin saber cuánto le falta para cumplir y sin un procedimiento claro para actuar cuando ocurre un incidente.

## 2. Qué hace diferente a NormIA

### 2.1 Evaluación con IA basada en la evidencia de la empresa

En lugar de un cuestionario que alguien contesta según su opinión, NormIA evalúa el cumplimiento a partir de los documentos que la empresa sube: políticas, procedimientos, contratos y registros.

Los documentos se dividen en fragmentos y se transforman en vectores (embeddings) que se guardan en PostgreSQL con la extensión pgvector (`app/services/embedding_service.py`, tabla `evidence_chunks`). Para cada pregunta de evaluación, el sistema recupera los fragmentos más relacionados y la IA entrega un veredicto con su justificación y nivel de confianza (`app/routes/assessment_questions.py`, tabla `assessment_answers`). Esta técnica se conoce como RAG (Retrieval-Augmented Generation). Los resultados alimentan el Análisis de Brechas y la Declaración de Aplicabilidad (SOA) de ISO 27001.

Así, el diagnóstico queda respaldado por documentos verificables, que es lo mismo que pedirá un auditor o la Agencia.

### 2.2 ISO 27001 y Ley 21.719 en la misma plataforma

La plataforma tiene un banco de 117 preguntas para ISO 27001 (`app/data/catalogo_iso27001.json`) y otro de 24 preguntas para la Ley 21.719, organizadas según las 8 obligaciones de la ley (`app/data/catalogo_ley21719.json`). El usuario elige contra qué marco evaluar y la IA usa instrucciones de auditor distintas para cada uno.

La Ley 21.719 exige medidas de seguridad apropiadas para proteger los datos personales, e ISO 27001 es la forma más reconocida de demostrarlas. Por eso, la evidencia que la empresa reúne para ISO también le sirve para la ley.

### 2.3 Gestión de vulneraciones con el plazo legal de 72 horas

El módulo de vulneraciones (`app/routes/breaches.py`, `BreachesScreen.jsx`) convierte el procedimiento de la ley en un flujo guiado para el owner, el administrador y el DPO de la empresa:

1. El responsable registra lo ocurrido con sus propias palabras y cuándo se detectó, sin tener que clasificar la gravedad.
2. La IA analiza el reporte y propone la gravedad, los datos posiblemente afectados, si corresponde notificar a la Agencia y a los titulares, las acciones inmediatas y las preguntas que faltan responder.
3. El owner, los administradores y el DPO reciben un aviso en la plataforma y por correo.
4. Una persona confirma o corrige la evaluación de la IA. La decisión final siempre es humana.
5. La plataforma calcula el plazo de 72 horas desde la detección y alerta cuando está por vencer o ya venció.
6. Se registra la notificación a la Agencia y, al cerrar el caso, la causa raíz y cómo se resolvió.

Queda constancia de quién reportó, quién confirmó y quién resolvió cada vulneración (`reportado_por`, `confirmada_por`, `resuelta_por`).

### 2.4 Asistente con el contexto de la empresa

El asistente DANI (`app/routes/chat.py`, `ChatDANI.jsx`) responde considerando el estado actual de la organización: avance de la SOA, brechas detectadas y riesgos registrados, además de fragmentos de la normativa.

### 2.5 Generación de documentos del sistema de gestión

El Generador de Documentos (`app/routes/documents.py`, `DocGeneratorScreen.jsx`) redacta borradores de políticas y procedimientos de ISO 27001 y de la Ley 21.719. El equipo los revisa y los publica, y los trabajadores confirman su lectura en el Portal de Empleados (`document_acknowledgements`).

### 2.6 Varias empresas en una sola instalación

Cada registro de una empresa lleva su `organization_id`, y las consultas se filtran por la organización del usuario (`app/dependencies/tenant.py`). Una consultora puede atender a varios clientes desde la misma plataforma, con roles diferenciados (superadmin, owner, admin, manager, auditor, DPO y empleado), sin que una empresa vea los datos de otra.

## 3. Valor que agrega

| Para quién | Valor |
|---|---|
| Pymes y organizaciones medianas | Saber cuánto les falta para cumplir la Ley 21.719 e ISO 27001 y qué hacer primero, sin una consultoría permanente. |
| Encargado de cumplimiento o DPO | Evidencias, brechas, documentos y vulneraciones en un solo lugar, con registro listo para una auditoría o una fiscalización. |
| Trabajadores | Acceso a las políticas que deben conocer y confirmación de su lectura. |
| Consultoras | Atender a varios clientes desde una sola plataforma, con los datos de cada uno separados. |

| Alternativa | Limitación | Cómo la resuelve NormIA |
|---|---|---|
| Planillas y documentos sueltos | No muestran el estado real ni quién hizo cada cambio | Evaluación basada en evidencia y registro de cada acción |
| Consultoría externa | Costo alto y diagnóstico puntual | Diagnóstico que se actualiza cuando la empresa sube nueva evidencia |
| Herramientas GRC internacionales | Caras, en inglés y sin la ley chilena | En español y con la Ley 21.719 incorporada |

## 4. Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| IA generativa | Groq (proveedor principal) y DeepSeek (alternativo), mediante una API compatible con OpenAI |
| Búsqueda semántica | Embeddings con FastEmbed y PostgreSQL con pgvector |
| Backend | FastAPI con SQLAlchemy asíncrono |
| Frontend | React |
| Infraestructura | Render (backend), Vercel (frontend), Neon (PostgreSQL), Supabase Storage (evidencias) y Brevo (correo) |

## 5. Límites actuales

- La IA propone y una persona confirma las decisiones de cumplimiento y de notificación.
- La evaluación depende de la evidencia que suba la empresa: sin documentos, la IA no puede afirmar que se cumple un requisito.
- Hoy solo el owner, los administradores y el DPO pueden registrar vulneraciones; permitir que cualquier trabajador las reporte está pendiente.
- Los módulos de tratamientos, consentimientos y solicitudes de titulares se retiraron por indicación del docente; esas obligaciones se evalúan con las preguntas de la Ley 21.719.
