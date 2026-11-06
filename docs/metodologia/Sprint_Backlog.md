# Sprint Backlog — NormIA (plataforma GRC)

> **Proyecto:** Integración de requerimientos de la Ley N.º 21.719 en una plataforma GRC existente orientada a ISO/IEC 27001.  
> **Metodología:** enfoque ágil basado en Scrum, definido en la Entrega 1.  
> **Corte de evidencia:** historial Git compartido hasta el 06-11-2026 (80 commits sin merges) y actualización de `main` hasta `662e1d2`.  
> **Naturaleza del registro:** reconstrucción documental de la planificación y del trabajo observable en Git; **no equivale a un tablero Scrum oficial ni a un acta de aceptación del cliente**.

## 1. Propósito y criterios de lectura

Este Sprint Backlog relaciona el plan académico del equipo con los cambios trazables del repositorio. Separa expresamente:

- **Planificado:** actividades, semanas y responsables indicados en la *Definición Proyecto APT* (Entrega 1).
- **Evidencia Git:** commits que permiten reconocer desarrollos, correcciones o pruebas relacionados con cada tema. Las fechas de estos commits **no se interpretan como fechas de inicio o término del sprint**.
- **Estado verificado:** solo se declara completado cuando existen pruebas y aceptación suficientes. Cuando faltan, se utiliza **Por validar**.
- **Cambio de alcance:** una funcionalidad que apareció en commits históricos puede haber sido modificada o retirada posteriormente; no se presenta como disponible actualmente sin comprobarlo.

**Nota:** la guía de Entrega 1 establece la definición del Product Backlog como actividad, pero no aporta un inventario completo y priorizado de historias con identificadores, estimaciones y criterios de aceptación. Las historias siguientes son una **descomposición documental propuesta** de los objetivos y actividades de esa guía; deben contrastarse con el tablero del equipo, si existe.

## 2. Contexto de la planificación original

**Objetivo general:** integrar los requerimientos de la Ley N.º 21.719 de protección de datos personales en la plataforma GRC existente, ampliando sus funcionalidades de gestión del cumplimiento de la seguridad de la información.

La planificación académica considera **18 semanas**, con etapas de definición, desarrollo iterativo y presentación. La guía propone cuatro sprints de desarrollo, además de actividades transversales de diseño, pruebas y documentación.

| Sprint planificado | Tema | Semanas del plan | Responsables consignados en la guía |
|---|---|---|---|
| 1 | Registro de actividades de tratamiento | 6–8 | Raúl Barrera (backend) y Celine Alcaíno (frontend) |
| 2 | Gestión de consentimientos | 8–10 | Raúl Barrera (backend) y Celine Alcaíno (frontend) |
| 3 | Derechos de los titulares | 10–12 | Raúl Barrera (backend) y Celine Alcaíno (frontend) |
| 4 | Registro y notificación de brechas de datos | 12–14 | Raúl Barrera (backend) y Celine Alcaíno (frontend) |

La guía asigna a Justo Cano la función de líder/analista en el levantamiento de requerimientos y la definición del backlog. La distribución consignada corresponde al **plan original**, no necesariamente a la autoría individual de cada commit.

## 3. Backlog por sprint

### Sprint 1 — Registro de actividades de tratamiento (RoPA)

**Objetivo planificado:** permitir el registro y seguimiento de actividades de tratamiento de datos personales en la plataforma.

| ID documental | Historia o tarea derivada del plan | Criterio de aceptación propuesto | Estado sustentado |
|---|---|---|---|
| S1-01 | Como responsable de cumplimiento, necesito registrar actividades de tratamiento para mantener un inventario consultable. | Se puede crear y consultar un registro asociado a la organización correspondiente. | Por validar en la versión actual. |
| S1-02 | Como responsable de cumplimiento, necesito actualizar o eliminar registros cuando corresponda. | Los cambios se persisten y no se duplican registros. | Hay evidencia histórica de correcciones; validar funcionamiento actual. |
| S1-03 | Integrar el modelo de datos, API y vistas del módulo con la plataforma existente. | Frontend y backend intercambian datos reales y respetan el contexto de organización. | Por validar. |

**Evidencia histórica de Git:**

- `6cfcb7c` (09-10-2026): se eliminan tratamientos de demostración falsos para mostrar datos reales.
- `2a2d255` (09-10-2026): correcciones de puntuación y eliminación de tratamientos en evaluación/RoPA.
- `e4482d1` (28-10-2026): extracción de tratamientos RoPA en paralelo con preguntas durante evaluación IA.
- `390b324` (30-10-2026): reorganización de preguntas ISO y Ley 21.719, con retiro de módulos considerados sin valor.

**Observación de vigencia:** en la actualización de `main` se eliminó `app/routes/treatments.py` y `TreatmentsScreen.jsx`. Esto **no demuestra que todo manejo de RoPA haya desaparecido** (hay evidencia de integración con evaluaciones), pero impide declarar vigente el módulo independiente sin revisar el código y la aplicación.

**Resultado del sprint:** **Por validar**; existe evidencia de trabajo histórico, no aceptación final documentada.

### Sprint 2 — Gestión de consentimientos

**Objetivo planificado:** permitir gestionar consentimientos relacionados con el tratamiento de datos personales.

| ID documental | Historia o tarea derivada del plan | Criterio de aceptación propuesto | Estado sustentado |
|---|---|---|---|
| S2-01 | Como responsable de cumplimiento, necesito registrar y consultar consentimientos para dar seguimiento a su estado. | Se pueden consultar registros persistidos y su estado. | Evidencia histórica; funcionalidad vigente por validar. |
| S2-02 | Como titular, necesito disponer de un mecanismo asociado al consentimiento y a los canales de contacto. | El flujo funciona y entrega una respuesta verificable. | Evidencia histórica; funcionalidad vigente por validar. |
| S2-03 | Validar integración de rutas, modelo de datos y comunicación. | Las operaciones se ejecutan sin errores de ruta y mantienen integridad de datos. | Evidencia histórica; validar funcionamiento actual. |

**Evidencia histórica de Git:**

- `3551b90` (09-10-2026): incorporación de enlace al canal de solicitudes en correo del titular.
- `43db093` (09-10-2026): corrección de barra final en rutas de consentimientos para evitar redirección 307/CORS.
- `7e8e3f7` (11-10-2026): correcciones de migración del estado `PENDIENTE` y fecha de otorgamiento.

**Observación de vigencia:** en la actualización de `main` se eliminaron `app/routes/consents.py`, `ConsentsScreen.jsx` y `PublicConsentScreen.jsx`. Por tanto, **no se declara activo el módulo independiente** de consentimientos.

**Resultado del sprint:** **Por validar / alcance modificado**. Se requiere confirmar con el equipo o cliente la decisión de retiro y la cobertura actual del requisito.

### Sprint 3 — Derechos de los titulares

**Objetivo planificado:** gestionar solicitudes de acceso, rectificación y supresión de datos personales.

| ID documental | Historia o tarea derivada del plan | Criterio de aceptación propuesto | Estado sustentado |
|---|---|---|---|
| S3-01 | Como titular de datos, necesito presentar una solicitud de ejercicio de derechos. | La solicitud se registra con los datos necesarios y una referencia de seguimiento. | Por validar. |
| S3-02 | Como responsable de cumplimiento, necesito consultar y dar seguimiento a solicitudes. | Se puede revisar el estado y registrar una respuesta según los permisos aplicables. | Por validar. |
| S3-03 | Validar el flujo entre interfaz, API y persistencia. | El flujo completo se comprueba con casos de prueba documentados. | Por validar. |

**Evidencia disponible:** el historial de 80 commits compartido no permite identificar con suficiente certeza un commit específico que demuestre la finalización de estas historias. La actualización de `main` eliminó `app/routes/data_requests.py`, `DataRequestsScreen.jsx` y `PublicDataRequestScreen.jsx`.

**Resultado del sprint:** **Por validar / alcance modificado**. No se presume que el flujo esté disponible en la versión actual.

### Sprint 4 — Registro y notificación de brechas de datos

**Objetivo planificado:** registrar incidentes de vulneración de datos y apoyar su gestión y notificación.

| ID documental | Historia o tarea derivada del plan | Criterio de aceptación propuesto | Estado sustentado |
|---|---|---|---|
| S4-01 | Como responsable de seguridad, necesito registrar una vulneración de datos para iniciar su seguimiento. | El registro se persiste y puede consultarse posteriormente. | Hay evidencia de implementación; pruebas y aceptación por validar. |
| S4-02 | Como responsable de seguridad, necesito revisar y actualizar el estado de la vulneración. | Las transiciones de estado y los datos asociados quedan registrados. | Hay evidencia de desarrollo; por validar. |
| S4-03 | Como responsable, necesito apoyar la evaluación y notificación de una vulneración. | El flujo de revisión humana y aviso se comprueba mediante pruebas. | Hay evidencia de desarrollo; por validar. |

**Evidencia histórica de Git:**

- `71841df` (10-10-2026): gestión de brechas de datos y chatbot.
- `ec31c77` (02-11-2026): vulneraciones de seguridad y mapa de calor en resultados ISO.
- `f31bdbc` (03-11-2026): corrección en pantalla de vulneraciones.
- `f259ef3` (05-11-2026): vulneraciones con análisis IA, revisión humana, aviso a responsables y cierre.

**Observación de vigencia:** la actualización de `main` incluye modificaciones a `app/routes/breaches.py`, al modelo `data_breach.py` y a `BreachesScreen.jsx`. Esto respalda que el área sigue siendo objeto de desarrollo, **pero no acredita por sí solo pruebas exitosas ni aceptación del cliente**.

**Resultado del sprint:** **Avance implementado con evidencia Git; validación final pendiente**.

## 4. Actividades transversales y evolución del alcance

Estas actividades aparecen en la planificación o en commits reales, pero **no se asignan artificialmente a un sprint específico** sin un tablero que confirme esa distribución.

| Área | Evidencia o referencia | Situación documental |
|---|---|---|
| Levantamiento de requerimientos | Entrega 1: semanas 1–2; líder/analista Justo Cano | Actividad planificada; acta y validación del cliente: `[completar]`. |
| Análisis de plataforma y definición de backlog | Entrega 1: semanas 2–3 | Actividades planificadas; tablero oficial y priorización: `[completar]`. |
| Diseño de datos e interfaces | Entrega 1: semanas 5–6 | Actividades planificadas; `c07d1cc` documenta modelo entidad-relación (06-11-2026). |
| Evaluación ISO y Ley 21.719 | `390b324`, `dc291d1`, `d9eb095`, `220f3a7` | Evolución del alcance hacia evaluación y análisis de brechas. |
| Evidencias y documentos | `b2fce95`, `ea86be5`, `b9fdcae`, `217a9ba` | Persistencia, eliminación, subida e indexación de evidencias: avances históricos. |
| Experiencia móvil | `82d5766`, `761b356`, `95066b0`, `3890d2e`, `12ac1ed` | Ajustes responsive registrados; no equivalen a validación completa en dispositivos. |
| Pruebas y QA | Entrega 1: semanas 14–15; `12eb528`, `ae8e442`, `09001cc`, `fd459a7`, `2c5a036` | Se registraron pruebas y dependencia `pytest`; resultados globales: `[completar]`. |
| Documentación técnica | `3c40f60`, `c07d1cc`, `f833c1d`, `3d39d10`, `12eb528` | Se añadieron manual, modelos, diagramas y plan de pruebas. |
| Despliegue e infraestructura | `1c7adf9`, `d023ff3`, `20ce476` | Dockerfiles e instrucciones de ejecución; despliegue exitoso por validar. |
| Product Vision | `d63b1fc` (06-11-2026) | Documento de visión agregado en un commit independiente. |

## 5. Seguimiento y pendientes de validación

| Elemento | Dato pendiente | Responsable de confirmar |
|---|---|---|
| Tablero Scrum real | Enlace a Trello/Jira/GitHub Projects y orden de prioridad: `[completar]` | Equipo / líder del proyecto |
| Fechas reales de los sprints | Inicio y cierre de cada iteración: `[completar]` | Equipo |
| Estimaciones | Puntos de historia, capacidad o esfuerzo: `[completar]` | Equipo |
| Aceptación | Evidencia de revisión y aceptación por sprint: `[completar]` | Equipo / cliente |
| Estado actual de módulos retirados | Decisión y cobertura de tratamientos, consentimientos y derechos de titulares: `[completar]` | Equipo / cliente |
| Pruebas | Casos ejecutados, resultados y defectos pendientes: `[completar]` | Equipo |
| Sprint Review y retrospectivas | Actas y acuerdos reales: `[completar]` | Equipo |

## 6. Fuentes y trazabilidad

1. **Documento base del proyecto:** `docs/entrega 1/1.5_GuiaEstudiante_Fase 1_Definicion Proyecto APT (Español).docx`, apartados **4. Objetivos**, **5. Metodología** y **7. Plan de Trabajo**, incluida la Carta Gantt.
2. **Historial Git:** salida de `git --no-pager log --all --date=short --pretty=format:"%h | %ad | %s" --no-merges -80`, compartida el 06-11-2026. Los identificadores abreviados se incluyen junto a cada avance.
3. **Cambios incorporados desde `main`:** actualización hasta `662e1d2` (06-11-2026), que registra la eliminación de rutas y pantallas independientes de tratamientos, consentimientos y solicitudes de titulares, además de cambios en vulneraciones.

> **Criterio de honestidad documental:** este backlog muestra la planificación original y la evidencia disponible. No atribuye la autoría de los commits a personas específicas, no transforma las fechas de commits en fechas de sprint y no declara «terminado» un requisito que carezca de validación o que haya sido retirado del alcance vigente.
