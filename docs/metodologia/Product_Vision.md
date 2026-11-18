# Product Vision de NormIA

Equipo: Celine Alcaíno, Raúl Barrera y Justo Cano. Metodología: Scrum. Proyecto APT de Ingeniería en Informática, Duoc UC, 2026.

## 1. Problema

La Ley N.º 21.719 de protección de datos personales entra en vigencia general el 1 de diciembre de 2026. Desde esa fecha, las organizaciones que tratan datos personales en Chile deben demostrar su cumplimiento ante la Agencia de Protección de Datos Personales y reportarle, sin dilaciones indebidas, las vulneraciones de seguridad que afecten datos personales. Muchas de ellas también trabajan con ISO/IEC 27001:2022 para la seguridad de la información.

Hoy esa gestión suele hacerse con planillas y documentos sueltos que no muestran el estado real de cumplimiento, o con consultorías puntuales. Una pyme no sabe con claridad cuánto le falta para cumplir ni tiene un procedimiento definido cuando ocurre un incidente.

El proyecto partió de una plataforma GRC existente (DANI) orientada solo a ISO 27001. La oportunidad era integrar en ella la Ley 21.719, aprovechando su arquitectura, sus evidencias y su motor de IA, en lugar de construir una solución nueva.

## 2. Usuarios y partes interesadas

| Perfil | Necesidad principal |
|---|---|
| Encargado de cumplimiento o DPO | Saber qué le falta para cumplir, gestionar los incidentes de seguridad y reportar a tiempo las vulneraciones de datos personales |
| Responsable de seguridad de la información | Evaluar controles ISO 27001, riesgos y evidencias |
| Auditor interno | Consultar evaluaciones y evidencias sin modificarlas |
| Owner o administrador de la empresa | Gestionar usuarios y permisos de su organización |
| Consultora (superadmin) | Atender a varias empresas desde una sola plataforma |
| Trabajadores | Conocer y confirmar la lectura de las políticas |

Partes interesadas indirectas: el docente, en el rol de cliente, y las personas cuyos datos protege cada organización.

## 3. Declaración de visión

> Para organizaciones chilenas que deben cumplir ISO/IEC 27001 y la Ley N.º 21.719, que necesitan saber cuánto les falta para cumplir y responder a tiempo ante un incidente de seguridad, NormIA es una plataforma GRC que evalúa el cumplimiento con inteligencia artificial a partir de los documentos de la propia empresa y guía la gestión de incidentes de seguridad y el reporte oportuno de las vulneraciones de datos personales. A diferencia de las planillas o de las herramientas GRC internacionales, trabaja en español, incorpora la ley chilena y deja registro de cada decisión, siempre con revisión humana.

## 4. Propuesta de valor

| Pilar | Qué entrega |
|---|---|
| Evaluación basada en evidencia | La IA responde las preguntas de ISO 27001 y de la Ley 21.719 a partir de los documentos subidos, con justificación y nivel de confianza |
| Dos marcos en una plataforma | La evidencia reunida para ISO 27001 también respalda las medidas de seguridad que exige la ley |
| Incidentes de seguridad (ISO 27001 y Ley 21.719) | Registro simple, clasificación según si afectan datos personales, análisis con IA, aviso a los responsables, confirmación humana y plazo interno de 72 horas para reportar las vulneraciones |
| Varias empresas | Cada organización ve solo sus datos, con roles diferenciados |

## 5. Objetivos

Objetivo general: integrar los requerimientos de la Ley N.º 21.719 en la plataforma GRC existente, ampliando sus funciones de gestión del cumplimiento de la seguridad de la información.

Objetivos específicos:

1. Levantar con el cliente los requerimientos de la Ley 21.719 que debe soportar la plataforma.
2. Analizar la arquitectura existente y diseñar las modificaciones de datos, interfaces y flujos.
3. Desarrollar la evaluación de la Ley 21.719 y la gestión de vulneraciones de seguridad.
4. Adaptar la IA existente para evaluar ambos marcos y apoyar el análisis de vulneraciones.
5. Validar la integración con pruebas automatizadas de funcionamiento, seguridad y rendimiento.

## 6. Alcance del MVP y restricciones

El producto mínimo entregado incluye:

- Evaluación con IA de ISO 27001 (339 preguntas sobre 24 requisitos y 93 controles) y de la Ley 21.719 (265 preguntas del listado de cumplimiento de la AEPD entregado por el docente, en 7 temas), con Análisis de Brechas y Declaración de Aplicabilidad.
- Gestión de incidentes de seguridad para ISO 27001 y la Ley 21.719: clasificación según si afectan datos personales, análisis de IA, revisión humana, aviso a los responsables, plazo interno de 72 horas para las vulneraciones, registro del reporte a la Agencia, vínculo con el riesgo materializado y cierre con causa raíz.
- Gestión de empresas, usuarios y roles, con datos separados por organización.
- Centro de evidencias, generador de documentos, mapa de riesgos y asistente con el contexto de la empresa.
- Despliegue en la nube y ejecución local con Docker Compose.

Quedan fuera del MVP:

- Los módulos independientes de tratamientos, consentimientos, solicitudes de titulares, proveedores y evaluación de impacto. Se desarrollaron en los sprints 1 a 3 y se retiraron el 30 de octubre de 2026 por indicación del docente; sus obligaciones se evalúan con las preguntas de la ley.
- El envío automático de la notificación a la Agencia: la plataforma registra la notificación, pero la hace una persona.
- El reporte de vulneraciones por cualquier trabajador y la recuperación de contraseña por correo.

Restricciones:

- Plazo: 18 semanas de la asignatura, divididas en definición, desarrollo y presentación.
- Equipo: tres integrantes, con roles de líder y analista, backend y frontend.
- Plataforma heredada: la tecnología ya estaba definida (React, FastAPI y PostgreSQL) y el código no lo escribió el equipo.
- Presupuesto cero: Render, Vercel, Neon y Groq en planes gratuitos, con 512 MB de memoria en el servidor, suspensión por inactividad y límite de llamadas a la IA por minuto.

## 7. Límites

NormIA apoya la gestión del cumplimiento, pero no lo certifica. Una evaluación de la plataforma no equivale a una certificación ISO 27001 ni asegura el cumplimiento legal ante la Agencia. La IA propone y una persona decide, y la calidad de la evaluación depende de los documentos que suba la empresa.

Documentos relacionados: [Product Backlog](Product_Backlog.md), [Sprint Backlog](Sprint_Backlog.md), [Definition of Done](Definition_of_Done.md), [Retrospectivas](Retrospectivas.md), [Documento de diseño](../tecnico/Documento_de_Diseno.md) e [Innovación](../Innovacion.md).
