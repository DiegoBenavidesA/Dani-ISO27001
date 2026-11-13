# Product Backlog de NormIA

> **Proyecto:** integración de la Ley N.º 21.719 en una plataforma GRC orientada a ISO/IEC 27001.
> **Metodología:** Scrum (ver [Sprint Backlog](Sprint_Backlog.md), [Definition of Done](Definition_of_Done.md) y [Retrospectivas](Retrospectivas.md)).
> **Responsable del backlog:** Justo Cano (Líder de proyecto / Analista), según el plan de trabajo de la Entrega 1.

El Product Backlog reúne todas las historias de usuario del producto, ordenadas por prioridad. El estado de cada historia se verificó contra el código del repositorio; la columna **Evidencia** indica dónde comprobarlo.

**Convenciones**

- **Prioridad (MoSCoW):** *Must* (imprescindible), *Should* (importante), *Could* (deseable).
- **Tamaño:** estimación relativa del esfuerzo: S (pequeño), M (mediano), L (grande).
- **Estado:** *Hecho* (implementado y disponible), *Retirado* (implementado y luego retirado del alcance por indicación del docente el 30-10-2026, commit `390b324`), *Por hacer*.

---

## Épica 1: Vulneraciones de seguridad (Ley 21.719, notificación en 72 horas)

| ID | Historia de usuario | Criterios de aceptación | Prioridad | Tamaño | Sprint | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| PB-01 | Como **usuario con acceso al módulo** (owner, admin, DPO o superadmin), quiero reportar una vulneración describiendo lo ocurrido, para iniciar su gestión sin tener que clasificarla. | La pantalla exige una descripción de al menos 10 caracteres y permite indicar cuándo se detectó; queda registrado quién reportó y se calcula el límite de 72 horas. | Must | S | 4 | Hecho | `POST /api/breaches/`, `BreachesScreen.jsx`, permisos en `Sidebar.jsx` |
| PB-02 | Como **encargado de cumplimiento**, quiero que la IA analice el reporte, para tener una propuesta de gravedad y de acciones de inmediato. | La IA propone gravedad, datos posiblemente afectados, si notificar a la Agencia y a los titulares, acciones inmediatas y preguntas; si falla, se puede reintentar. | Must | M | 4 | Hecho | `_analizar_y_avisar`, `POST /{id}/analizar` |
| PB-03 | Como **owner, admin o DPO**, quiero recibir un aviso cuando se reporta una vulneración, para actuar dentro del plazo. | Notificación en la plataforma y correo a los responsables de la organización. | Must | S | 4 | Hecho | `_avisar_responsables`, `notifications.py` |
| PB-04 | Como **DPO o administrador autorizado**, quiero confirmar o corregir la evaluación de la IA, para que la decisión final sea humana. | Se registran gravedad confirmada, afectados, datos afectados, medidas de contención y si requiere notificación; queda quién confirmó y cuándo. | Must | M | 4 | Hecho | `PUT /{id}/revision` (`RequireRole(["admin", "dpo"])`) |
| PB-05 | Como **DPO**, quiero ver cuánto queda del plazo de 72 horas, para no incumplir la ley. | El plazo se calcula desde la detección; se alerta cuando está por vencer o venció. | Must | S | 4 | Hecho | `fecha_limite_notificacion`, pruebas en `test_breaches_flujo.py` |
| PB-06 | Como **DPO o administrador autorizado**, quiero registrar que notifiqué a la Agencia, para dejar constancia. | Solo se permite después de confirmar la revisión; se guarda la fecha y hora del registro. | Must | S | 4 | Hecho | `POST /{id}/notify` (`RequireRole(["admin", "dpo"])`) |
| PB-07 | Como **DPO o administrador autorizado**, quiero cerrar la vulneración indicando la causa raíz y cómo se resolvió, para aprender del incidente. | Se exige confirmar la revisión; si requiere notificación no se puede cerrar antes de registrarla; queda quién resolvió y cuándo. | Must | S | 4 | Hecho | `POST /{id}/resolver` (`RequireRole(["admin", "dpo"])`) |
| PB-31 | Como **trabajador**, quiero reportar una vulneración desde un formulario accesible, para avisar a los responsables aunque no tenga acceso al módulo de gestión. | Un usuario de cualquier rol de la empresa puede enviar el reporte desde la interfaz; llega a owner, admin y DPO. | Should | S | — | Por hacer | El endpoint permite reportes de usuarios autenticados, pero `Sidebar.jsx` solo muestra el módulo a superadmin, owner, admin y DPO |
| PB-08 | Como **DPO**, quiero registrar la comunicación a los titulares afectados, para cumplir cuando la vulneración los expone a un riesgo. | Registro de fecha, medio y contenido de la comunicación. | Should | M | — | Por hacer | Hoy solo la IA indica si corresponde |

## Épica 2: Evaluación de cumplimiento ISO 27001 y Ley 21.719

| ID | Historia de usuario | Criterios de aceptación | Prioridad | Tamaño | Sprint | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| PB-09 | Como **encargado de cumplimiento**, quiero evaluar mi empresa contra la Ley 21.719, para saber cuánto me falta. | Banco de 24 preguntas basado en las 8 obligaciones de la ley. | Must | M | Transversal | Hecho | `app/data/catalogo_ley21719.json` |
| PB-10 | Como **encargado de cumplimiento**, quiero elegir si evalúo ISO 27001 o Ley 21.719, para no mezclar los marcos. | Cada evaluación usa solo las preguntas y el prompt de auditor del marco elegido. | Must | M | Transversal | Hecho | columna `marco`, `GapAnalysisScreen.jsx` |
| PB-11 | Como **encargado de cumplimiento**, quiero que la IA responda las preguntas usando los documentos que subí, para que el diagnóstico tenga respaldo. | Veredicto, nivel de confianza y justificación por pregunta, a partir de la evidencia (RAG). | Must | L | Transversal | Hecho | `assessment_questions.py`, `embedding_service.py` |
| PB-12 | Como **administrador**, quiero cargar preguntas desde un Excel, para actualizar el banco sin programar. | Valida formato `.xlsx`, evita duplicados dentro del mismo marco y ofrece plantilla. | Should | M | Transversal | Hecho | carga masiva en `assessment_questions.py` |
| PB-13 | Como **auditor**, quiero ver las brechas y la Declaración de Aplicabilidad (SOA), para planificar las mejoras. | Brechas por control y SOA exportable. | Must | L | Transversal | Hecho | `gap_analysis.py`, `compliance.py` |

## Épica 3: Evidencias y documentos

| ID | Historia de usuario | Criterios de aceptación | Prioridad | Tamaño | Sprint | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| PB-14 | Como **encargado de cumplimiento**, quiero subir un documento de evidencia y que se indexe en segundo plano, para usarlo en las evaluaciones sin esperar el procesamiento. | Se puede subir un archivo por operación; ante fallos transitorios mientras despierta el servidor, el cliente reintenta automáticamente y muestra el estado de indexación. | Must | M | Transversal | Hecho | `evidence.py`, `evidenceAPI.upload`, `EvidenceCenterScreen.jsx` |
| PB-15 | Como **encargado de cumplimiento**, quiero que se rechacen archivos de más de 10 MB, para evitar fallas y demoras. | Mensaje claro al superar el límite (RNF-03). | Should | S | — | Por hacer | Sin validación de tamaño hoy |
| PB-16 | Como **encargado de cumplimiento**, quiero generar borradores de políticas con IA, para no partir de cero. | Borradores de ISO 27001 y Ley 21.719 editables. | Should | M | Transversal | Hecho | `documents.py`, `DocGeneratorScreen.jsx` |
| PB-17 | Como **trabajador**, quiero leer y confirmar las políticas publicadas, para dejar constancia de que las conozco. | Se registra la confirmación con fecha. | Could | S | Transversal | Hecho | `document_acknowledgements` |

## Épica 4: Plataforma multiempresa

| ID | Historia de usuario | Criterios de aceptación | Prioridad | Tamaño | Sprint | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| PB-18 | Como **consultora**, quiero administrar varias empresas, para atender a distintos clientes. | El superadmin elige la empresa; cada usuario solo ve los datos de la suya. | Must | L | Transversal | Hecho | `tenant.py`, `OrganizationsScreen.jsx`, `test_integration_auth.py` |
| PB-19 | Como **owner**, quiero invitar usuarios y asignarles roles, para repartir responsabilidades. | Roles owner, admin, manager, auditor, DPO y employee; invitación por correo. | Must | M | Transversal | Hecho | `users.py`, `UserManagementScreen.jsx` |
| PB-20 | Como **usuario**, quiero usar la plataforma desde el celular, para revisar alertas fuera de la oficina. | Pantallas adaptadas a celular y tablet, sin desplazamiento horizontal. | Should | M | Transversal | Hecho | estilos responsive en `src/pages` |
| PB-21 | Como **usuario**, quiero un asistente que conozca el estado de mi empresa, para saber qué hacer después. | El chat usa el avance de la SOA, las vulneraciones registradas, las evidencias disponibles y la normativa oficial recuperada por RAG. | Could | M | Transversal | Hecho | `chat.py`, `ChatDANI.jsx` |

## Épica 5: Calidad y entrega

| ID | Historia de usuario | Criterios de aceptación | Prioridad | Tamaño | Sprint | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| PB-22 | Como **equipo**, queremos pruebas automáticas de permisos y del flujo de vulneraciones, para detectar errores antes de publicar. | 24 pruebas que se ejecutan sin base de datos ni IA real. | Must | M | Transversal | Hecho | `Producto/dani-project-back/tests/` |
| PB-23 | Como **evaluador**, quiero levantar el proyecto con un solo comando, para revisarlo sin configurar nada. | `docker compose up --build` levanta base de datos, backend y frontend. | Should | M | Transversal | Hecho | `Producto/docker-compose.yml` |
| PB-24 | Como **equipo**, queremos pruebas de punta a punta en el navegador, para validar los flujos completos. | Login, evaluación y vulneraciones automatizados (Playwright). | Could | L | — | Por hacer | Hoy se prueban manualmente |

## Épica 6: Módulos planificados en la Entrega 1 y retirados del alcance

Se implementaron según el plan de sprints de la Entrega 1 y se retiraron el 30-10-2026 por indicación del docente (commit `390b324`). Sus tablas se conservan en la base de datos y las obligaciones correspondientes se evalúan hoy con las preguntas de la Ley 21.719 (PB-09).

| ID | Historia de usuario | Prioridad original | Tamaño | Sprint | Estado | Evidencia |
|---|---|---|---|---|---|---|
| PB-25 | Como **encargado**, quiero registrar las actividades de tratamiento (RoPA). | Must | L | 1 | Retirado | `d60d075`, tabla `data_treatments` |
| PB-26 | Como **encargado**, quiero registrar y consultar consentimientos. | Must | L | 2 | Retirado | `2ec1e88`, tablas `consents`, `consent_history` |
| PB-27 | Como **titular**, quiero aceptar o revocar mi consentimiento desde un enlace. | Should | M | 2 | Retirado | `2ec1e88`, `3551b90` |
| PB-28 | Como **titular**, quiero ejercer mis derechos de acceso, rectificación, supresión, oposición y portabilidad. | Must | L | 3 | Retirado | `2ec1e88`, tabla `data_subject_requests` |
| PB-29 | Como **encargado**, quiero registrar a los proveedores que tratan datos por cuenta de la empresa. | Should | M | — | Retirado | tabla `vendors` |
| PB-30 | Como **DPO**, quiero hacer una evaluación de impacto antes de un tratamiento de alto riesgo. | Should | M | — | Retirado | tabla `impact_assessments` |

## Épica 7: Gestión de riesgos, acciones correctivas y auditoría

| ID | Historia de usuario | Criterios de aceptación | Prioridad | Tamaño | Sprint | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| PB-32 | Como **gestor de riesgos**, quiero registrar y mantener los riesgos de mi organización, para priorizar su tratamiento. | Se puede crear, consultar, editar y cambiar el estado de un riesgo; el nivel se calcula según probabilidad e impacto y se pueden consultar estadísticas por nivel. | Must | M | Transversal | Hecho | `risk.py`, `RiskMapScreen.jsx`, `riskAPI` |
| PB-33 | Como **responsable de cumplimiento**, quiero registrar y dar seguimiento a no conformidades y acciones correctivas, para controlar su resolución. | Se registra la no conformidad con responsable, vencimiento, prioridad y fuente; se puede actualizar su estado y progreso, y consultar el avance por estado. | Should | M | Transversal | Hecho | `capa.py`, `CAPATracker.jsx`, `capaAPI` |
| PB-34 | Como **auditor**, quiero descargar un paquete de auditoría con las evidencias y riesgos de mi organización, para preparar la revisión. | Se genera un ZIP con informes PDF de evidencias organizados por cláusula ISO 27001, los archivos disponibles, el registro de riesgos y un resumen ejecutivo. | Should | M | Transversal | Hecho | `GET /api/evidence/export/zip`, `evidence.py` |

---

## Resumen

| Estado | Historias |
|---|---|
| Hecho | 24 |
| Por hacer | 4 (PB-08, PB-15, PB-24, PB-31) |
| Retirado del alcance | 6 (PB-25 a PB-30) |
| **Total** | **34** |
