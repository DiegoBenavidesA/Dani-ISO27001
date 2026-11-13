# Innovación de NormIA

> **Actualizado:** 13 de noviembre de 2026. La descripción de funciones se contrastó con el código del repositorio.

Este documento explica qué problema resuelve NormIA, en qué se diferencia de otras formas de abordar el cumplimiento normativo y qué valor agrega. Las funcionalidades se contrastaron con el repositorio; las rutas de archivo indican dónde comprobarlas y la sección de límites identifica aspectos pendientes o que requieren validación.

## 1. Problema que resuelve

La entrada en vigencia general de la Ley N.º 21.719 de protección de datos personales está prevista para el 1 de diciembre de 2026. Las organizaciones a las que se aplique la ley deberán cumplir las obligaciones correspondientes; entre ellas, notificar a la Agencia dentro de 72 horas las vulneraciones que deban notificarse conforme a la ley. NormIA busca ayudar a organizar y documentar parte de esa gestión. Muchas organizaciones también trabajan, o quieren trabajar, con ISO/IEC 27001:2022 para la seguridad de la información.

Hoy esto se resuelve de tres maneras:

- Con planillas Excel y documentos sueltos, que no muestran el estado real de cumplimiento ni dejan registro de quién hizo qué.
- Con consultorías externas, cuyo alcance puede ser puntual y cuyo costo de acompañamiento depende del servicio contratado.
- Con herramientas GRC que pueden requerir configuración, localización o módulos adicionales para cubrir normativa chilena.

Estas alternativas no son equivalentes entre sí y sus capacidades varían. Una pyme u organización mediana puede tener dificultades para conocer sus brechas y mantener un procedimiento claro para actuar cuando ocurre un incidente.

## 2. Qué hace diferente a NormIA

### 2.1 Evaluación con IA basada en la evidencia de la empresa

En lugar de un cuestionario que alguien contesta según su opinión, NormIA evalúa el cumplimiento a partir de los documentos que la empresa sube: políticas, procedimientos, contratos y registros.

Los documentos se dividen en fragmentos y se transforman en vectores (embeddings) que se guardan en PostgreSQL con la extensión pgvector (`app/services/embedding_service.py`, tabla `evidence_chunks`). Para cada pregunta de evaluación, el sistema recupera fragmentos relacionados y la IA entrega un veredicto con justificación y nivel de confianza (`app/routes/assessment_questions.py`, tabla `assessment_answers`). Esta técnica se conoce como RAG (Retrieval-Augmented Generation). Los resultados ISO alimentan el Análisis de Brechas y la Declaración de Aplicabilidad (SOA); los resultados de la Ley 21.719 se presentan en su evaluación correspondiente.

La evidencia recuperada ayuda a fundamentar el diagnóstico, pero su calidad depende de los documentos aportados y la respuesta de IA requiere revisión humana. Una evaluación de NormIA no equivale por sí sola a una certificación ni determina el cumplimiento legal ante la Agencia.

### 2.2 ISO 27001 y Ley 21.719 en la misma plataforma

La plataforma tiene un banco de 117 preguntas para ISO 27001 (`app/data/catalogo_iso27001.json`) y un catálogo con 8 obligaciones y 24 subpreguntas para la Ley 21.719 (`app/data/catalogo_ley21719.json`). El usuario elige contra qué marco evaluar y la IA usa instrucciones de auditor distintas para cada uno.

Ambos marcos pueden compartir evidencia pertinente, aunque cumplir uno no implica automáticamente cumplir el otro.

### 2.3 Gestión de vulneraciones con el plazo legal de 72 horas

El módulo de vulneraciones (`app/routes/breaches.py`, `BreachesScreen.jsx`) ofrece un flujo guiado para el owner, el administrador y el DPO de la empresa:

1. El responsable registra lo ocurrido con sus propias palabras y cuándo se detectó, sin tener que clasificar la gravedad.
2. La IA analiza el reporte y propone la gravedad, los datos posiblemente afectados, si corresponde notificar a la Agencia y a los titulares, las acciones inmediatas y las preguntas que faltan responder.
3. El owner, los administradores y el DPO reciben un aviso en la plataforma y por correo.
4. Una persona confirma o corrige la evaluación de la IA. La decisión final siempre es humana.
5. La plataforma calcula un plazo de 72 horas desde la detección y alerta cuando está por vencer o ya venció.
6. Una persona registra que notificó a la Agencia cuando corresponde; al cerrar el caso se guarda la causa raíz y cómo se resolvió.

Queda constancia de quién reportó, quién confirmó y quién resolvió cada vulneración (`reportado_por`, `confirmada_por`, `resuelta_por`).

### 2.4 Asistente con el contexto de la empresa

El asistente de la plataforma (`app/routes/chat.py`, `ChatDANI.jsx`) responde considerando el avance de la SOA, las vulneraciones registradas y fragmentos relacionados de las evidencias y la normativa oficial recuperados por RAG. El contexto en vivo no incluye el registro de riesgos.

### 2.5 Generación de documentos del sistema de gestión

El Generador de Documentos (`app/routes/documents.py`, `DocGeneratorScreen.jsx`) redacta borradores de políticas y procedimientos de ISO 27001 y de la Ley 21.719. El equipo los revisa y los publica, y los trabajadores confirman su lectura en el Portal de Empleados (`document_acknowledgements`).

### 2.6 Varias empresas en una sola instalación

La plataforma admite varias organizaciones y almacena su identificador en los registros correspondientes. Los endpoints que aplican las dependencias de aislamiento filtran las consultas por organización (`app/dependencies/tenant.py`). El superadmin puede administrar organizaciones y seleccionar una empresa; existen roles diferenciados (superadmin, owner, admin, manager, auditor, DPO y empleado). La separación debe validarse en todos los flujos antes de afirmar que cubre integralmente cada módulo.

## 3. Valor que agrega

| Para quién | Valor |
|---|---|
| Pymes y organizaciones medianas | Saber cuánto les falta para cumplir la Ley 21.719 e ISO 27001 y qué hacer primero, sin una consultoría permanente. |
| Encargado de cumplimiento o DPO | Evidencias, brechas, documentos y vulneraciones en un solo lugar, con registro listo para una auditoría o una fiscalización. |
| Trabajadores | Acceso a las políticas que deben conocer y confirmación de su lectura. |
| Consultoras | Administrar varias organizaciones desde una plataforma con contexto por empresa; la cobertura de aislamiento debe validarse para todos los flujos. |

| Alternativa | Limitación | Cómo la resuelve NormIA |
|---|---|---|
| Planillas y documentos sueltos | Pueden requerir actualización y seguimiento manual | Centraliza evaluaciones y evidencias cargadas |
| Consultoría externa | El alcance y la continuidad dependen del servicio contratado | Permite actualizar evaluaciones al incorporar evidencia |
| Herramientas GRC sin configuración local | Pueden requerir adaptación a requisitos chilenos | Incluye una evaluación basada en la Ley 21.719 |

## 4. Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| IA generativa | Groq (`openai/gpt-oss-120b` cuando está configurada su clave); DeepSeek (`deepseek-chat`) como alternativa por configuración. Se consume mediante el SDK compatible con OpenAI (`app/config.py`) |
| Búsqueda semántica | Embeddings con FastEmbed y PostgreSQL con pgvector |
| Backend | FastAPI con SQLAlchemy asíncrono |
| Frontend | React |
| Infraestructura | Render (backend), Vercel (frontend), Neon/PostgreSQL, Supabase Storage (si está configurado; existe alternativa local) y Brevo (correo, con SMTP alternativo) |

## 5. Límites actuales

- La IA propone resultados y una persona debe revisar las decisiones de cumplimiento y notificación. El módulo registra la notificación, pero no la envía automáticamente a la Agencia ni a los titulares.
- La evaluación depende de la evidencia que suba la empresa; sin documentos pertinentes, puede resultar sin evidencia. La IA no certifica el cumplimiento.
- La interfaz de gestión de vulneraciones solo está disponible para superadmin con una empresa seleccionada, owner, admin y DPO. Aunque el endpoint acepta usuarios autenticados, falta habilitar y validar un formulario accesible para cualquier trabajador.
- La arquitectura incluye filtros por organización, pero la cobertura integral de aislamiento multiempresa debe validarse antes de garantizarla para todos los módulos.
- Los módulos de tratamientos, consentimientos y solicitudes de titulares se retiraron por indicación del docente; esas obligaciones se evalúan con las preguntas de la Ley 21.719.
