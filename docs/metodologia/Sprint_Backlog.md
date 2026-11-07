# Sprint Backlog — NormIA (plataforma GRC)

> **Proyecto:** Integración de requerimientos de la Ley N.º 21.719 en una plataforma GRC orientada a ISO/IEC 27001.
> **Metodología:** Enfoque ágil basado en Scrum, definido en la Entrega 1.
> **Base del registro:** Planificación y avance del proyecto según la Entrega 1 y el historial de Git.
> **Evidencia revisada:** Commits del proyecto hasta el 06-11-2026 y actualización de `main` hasta `fcb1f4e`.

## 1. Propósito y criterios de lectura

Este Sprint Backlog relaciona la planificación académica del equipo con los avances trazables del repositorio:

- **Planificación:** Actividades, semanas y responsables indicados en la *Definición Proyecto APT* (Entrega 1).
- **Evidencia Git:** Commits asociados a implementación, correcciones y pruebas. Sus fechas no representan necesariamente el inicio o cierre de cada sprint.
- **Estado de las tareas:** Se distingue entre trabajo completado y funcionalidades que posteriormente fueron retiradas del alcance por indicación del docente.
- **Alcance vigente:** Las obligaciones de la Ley N.º 21.719 se evalúan actualmente en el Análisis de Brechas; el flujo de vulneraciones permanece vigente.

Los identificadores S1-01 a S4-03 organizan las historias y tareas derivadas de la planificación de Entrega 1. Los datos del tablero del equipo, las estimaciones y la aceptación formal se registran como pendientes de confirmación en la sección 5.

## 2. Contexto de la planificación original

**Objetivo general:** Integrar los requerimientos de la Ley N.º 21.719 de protección de datos personales en la plataforma GRC existente, ampliando sus funcionalidades de gestión del cumplimiento de la seguridad de la información.

La planificación académica considera **18 semanas**, con etapas de definición, desarrollo iterativo y presentación. La guía propone cuatro sprints de desarrollo, además de actividades transversales de diseño, pruebas y documentación.

| Sprint planificado | Tema | Semanas del plan | Responsables consignados en la guía |
|---|---|---|---|
| 1 | Registro de actividades de tratamiento | 6–8 | Raúl Barrera (backend) y Celine Alcaíno (frontend) |
| 2 | Gestión de consentimientos | 8–10 | Raúl Barrera (backend) y Celine Alcaíno (frontend) |
| 3 | Derechos de los titulares | 10–12 | Raúl Barrera (backend) y Celine Alcaíno (frontend) |
| 4 | Registro y notificación de brechas de datos | 12–14 | Raúl Barrera (backend) y Celine Alcaíno (frontend) |

La guía asigna a Justo Cano la función de líder/analista en el levantamiento de requerimientos y la definición del backlog. Esta distribución corresponde al **plan original**, no necesariamente a la autoría individual de cada commit.

## 3. Backlog por sprint

### Sprint 1 — Registro de actividades de tratamiento (RoPA)

**Objetivo planificado:** Permitir el registro y seguimiento de actividades de tratamiento de datos personales en la plataforma.

| ID documental | Historia o tarea derivada del plan | Criterio de aceptación propuesto | Estado |
|---|---|---|---|
| S1-01 | Como responsable de cumplimiento, necesito registrar actividades de tratamiento para mantener un inventario consultable. | Se puede crear y consultar un registro asociado a la organización correspondiente. | Completado (retirado del alcance el 30-10-2026 por indicación del docente, commit `390b324`). |
| S1-02 | Como responsable de cumplimiento, necesito actualizar o eliminar registros cuando corresponda. | Los cambios se persisten y no se duplican registros. | Completado (retirado del alcance el 30-10-2026 por indicación del docente, commit `390b324`). |
| S1-03 | Integrar el modelo de datos, API y vistas del módulo con la plataforma existente. | Frontend y backend intercambian datos reales y respetan el contexto de organización. | Completado (retirado del alcance el 30-10-2026 por indicación del docente, commit `390b324`). |

**Evidencia histórica de Git:**

- `d60d075` (14-09-2026): implementación del CRUD de tratamientos.
- `6cfcb7c` (09-10-2026): eliminación de tratamientos de demostración para mostrar datos reales.
- `2a2d255` (09-10-2026): correcciones de puntuación y eliminación de tratamientos en evaluación/RoPA.
- `e4482d1` (28-10-2026): extracción de tratamientos RoPA en paralelo con preguntas durante evaluación IA.
- `390b324` (30-10-2026): retiro del módulo independiente como parte del cambio de alcance indicado por el docente.

**Vigencia:** El módulo independiente de tratamientos fue retirado. Los requisitos de la Ley N.º 21.719 se evalúan en el Análisis de Brechas, y las tablas del módulo se conservan en la base de datos.

**Resultado del sprint:** **Completado; posteriormente retirado del alcance**.

### Sprint 2 — Gestión de consentimientos

**Objetivo planificado:** Permitir gestionar consentimientos relacionados con el tratamiento de datos personales.

| ID documental | Historia o tarea derivada del plan | Criterio de aceptación propuesto | Estado |
|---|---|---|---|
| S2-01 | Como responsable de cumplimiento, necesito registrar y consultar consentimientos para dar seguimiento a su estado. | Se pueden consultar registros persistidos y su estado. | Completado (retirado del alcance el 30-10-2026 por indicación del docente, commit `390b324`). |
| S2-02 | Como titular, necesito disponer de un mecanismo asociado al consentimiento y a los canales de contacto. | El flujo funciona y entrega una respuesta verificable. | Completado (retirado del alcance el 30-10-2026 por indicación del docente, commit `390b324`). |
| S2-03 | Validar integración de rutas, modelo de datos y comunicación. | Las operaciones se ejecutan sin errores de ruta y mantienen integridad de datos. | Completado (retirado del alcance el 30-10-2026 por indicación del docente, commit `390b324`). |

**Evidencia histórica de Git:**

- `2ec1e88` (16-09-2026): creación de `consents.py`, `data_requests.py` y `breaches.py`.
- `3551b90` (09-10-2026): incorporación de enlace al canal de solicitudes en correo del titular.
- `43db093` (09-10-2026): corrección de rutas de consentimientos para evitar redirección 307/CORS.
- `7e8e3f7` (11-10-2026): correcciones de migración del estado `PENDIENTE` y fecha de otorgamiento.
- `390b324` (30-10-2026): retiro del módulo independiente como parte del cambio de alcance indicado por el docente.

**Vigencia:** El módulo independiente de consentimientos fue retirado. Sus requisitos legales se cubren mediante las preguntas del Análisis de Brechas; las tablas se conservan en la base de datos.

**Resultado del sprint:** **Completado; posteriormente retirado del alcance**.

### Sprint 3 — Derechos de los titulares

**Objetivo planificado:** Gestionar solicitudes de acceso, rectificación y supresión de datos personales.

| ID documental | Historia o tarea derivada del plan | Criterio de aceptación propuesto | Estado |
|---|---|---|---|
| S3-01 | Como titular de datos, necesito presentar una solicitud de ejercicio de derechos. | La solicitud se registra con los datos necesarios y una referencia de seguimiento. | Completado (retirado del alcance el 30-10-2026 por indicación del docente, commit `390b324`). |
| S3-02 | Como responsable de cumplimiento, necesito consultar y dar seguimiento a solicitudes. | Se puede revisar el estado y registrar una respuesta según los permisos aplicables. | Completado (retirado del alcance el 30-10-2026 por indicación del docente, commit `390b324`). |
| S3-03 | Validar el flujo entre interfaz, API y persistencia. | El flujo completo se comprueba con casos de prueba documentados. | Completado (retirado del alcance el 30-10-2026 por indicación del docente, commit `390b324`). |

**Evidencia histórica de Git:**

- `2ec1e88` (16-09-2026): creación de `consents.py`, `data_requests.py` y `breaches.py`, incluidas las rutas iniciales para solicitudes de titulares.
- `3551b90` (09-10-2026): incorporación del canal de solicitudes en el correo dirigido al titular.
- `390b324` (30-10-2026): retiro del módulo independiente como parte del cambio de alcance indicado por el docente.

**Vigencia:** El módulo independiente de solicitudes de titulares fue retirado. Las obligaciones aplicables de la Ley N.º 21.719 se evalúan en el Análisis de Brechas; las tablas se conservan en la base de datos.

**Resultado del sprint:** **Completado; posteriormente retirado del alcance**.

### Sprint 4 — Registro y notificación de brechas de datos

**Objetivo planificado:** Registrar incidentes de vulneración de datos y apoyar su gestión y notificación.

| ID documental | Historia o tarea derivada del plan | Criterio de aceptación propuesto | Estado |
|---|---|---|---|
| S4-01 | Como responsable de seguridad, necesito registrar una vulneración de datos para iniciar su seguimiento. | El registro se persiste y puede consultarse posteriormente. | Completado y vigente. |
| S4-02 | Como responsable de seguridad, necesito revisar y actualizar el estado de la vulneración. | Las transiciones de estado y los datos asociados quedan registrados. | Completado y vigente. |
| S4-03 | Como responsable, necesito apoyar la evaluación y notificación de una vulneración. | El flujo de revisión humana y aviso se comprueba mediante pruebas. | Completado y vigente. |

**Evidencia histórica de Git:**

- `2ec1e88` (16-09-2026): creación inicial de `breaches.py`, junto con rutas de consentimientos y solicitudes.
- `71841df` (10-10-2026): gestión de brechas de datos y chatbot.
- `ec31c77` (02-11-2026): vulneraciones de seguridad y mapa de calor en resultados ISO.
- `f31bdbc` (03-11-2026): corrección en pantalla de vulneraciones.
- `f259ef3` (05-11-2026): análisis con IA, revisión humana, aviso a responsables, notificación a la Agencia y cierre del flujo de vulneraciones.

**Vigencia:** El módulo de vulneraciones continúa en el alcance actual. El flujo se probó manualmente; los detalles de pruebas automatizadas se registran en las secciones 4 y 5.

**Resultado del sprint:** **Completado**.

## 4. Actividades transversales y evolución del alcance

Estas actividades forman parte de la planificación general o están respaldadas por commits, sin atribuirlas a un sprint específico cuando no consta esa distribución.

| Área | Evidencia o referencia | Situación documental |
|---|---|---|
| Levantamiento de requerimientos | Entrega 1: semanas 1–2; líder/analista Justo Cano | Actividad planificada; actas y aceptación pendientes de confirmación con el equipo (sección 5). |
| Análisis de plataforma y definición de backlog | Entrega 1: semanas 2–3 | Actividades planificadas; tablero y priorización pendientes de confirmación con el equipo (sección 5). |
| Diseño de datos e interfaces | Entrega 1: semanas 5–6 | Actividades planificadas; `c07d1cc` documenta el modelo entidad-relación (06-11-2026). |
| Evaluación ISO y Ley 21.719 | `390b324`, `dc291d1`, `d9eb095`, `220f3a7` | Las obligaciones legales se evalúan en Análisis de Brechas mediante 24 preguntas basadas en las 8 obligaciones de la ley. |
| Evidencias y documentos | `b2fce95`, `ea86be5`, `b9fdcae`, `217a9ba` | Persistencia, eliminación, subida e indexación de evidencias. |
| Experiencia móvil | `82d5766`, `761b356`, `95066b0`, `3890d2e`, `12ac1ed` | Ajustes responsive registrados en Git. |
| Pruebas y QA | Entrega 1: semanas 14–15; `12eb528`, `ae8e442`, `09001cc`, `fd459a7`, `2c5a036` | 3 pruebas automatizadas de autenticación y roles pasan (`tests/test_integration_auth.py`); `test_api.py` requiere el servidor levantado; el flujo de vulneraciones se probó manualmente. |
| Documentación técnica | `3c40f60`, `c07d1cc`, `f833c1d`, `3d39d10`, `12eb528` | Se añadieron manual, modelos, diagramas y plan de pruebas. |
| Despliegue e infraestructura | `1c7adf9`, `d023ff3`, `20ce476` | Dockerfiles e instrucciones de ejecución; infraestructura de despliegue documentada. |
| Product Vision | `d63b1fc` (06-11-2026) | Documento de visión agregado en un commit independiente. |

**Decisión de alcance del 30-10-2026 (`390b324`):** Por indicación del docente se retiraron los módulos independientes de **Tratamientos, Consentimientos, Solicitudes de titulares, Proveedores y Evaluación de impacto**. Los requisitos de la Ley N.º 21.719 se evalúan ahora en el **Análisis de Brechas**, mediante **24 preguntas basadas en las 8 obligaciones de la ley**. **Las tablas de los módulos retirados se conservan en la base de datos.**

## 5. Seguimiento y datos por confirmar con el equipo

| Elemento | Dato pendiente o estado | Responsable de confirmar |
|---|---|---|
| Tablero Scrum real | Enlace a Trello/Jira/GitHub Projects y orden de prioridad: `[completar]` | Equipo / líder del proyecto |
| Fechas reales de los sprints | Inicio y cierre de cada iteración: `[completar]` | Equipo |
| Estimaciones | Puntos de historia, capacidad o esfuerzo: `[completar]` | Equipo |
| Aceptación | Evidencia de revisión y aceptación formal por sprint: `[completar]` | Equipo / cliente |
| Estado actual de módulos retirados | Por indicación del docente, se retiraron Tratamientos, Consentimientos, Solicitudes de titulares, Proveedores y Evaluación de impacto (`390b324`, 30-10-2026). Sus requisitos de la Ley 21.719 se evalúan en Análisis de Brechas mediante 24 preguntas basadas en las 8 obligaciones; las tablas se conservan en la base de datos. | Decisión de alcance informada por el equipo |
| Pruebas | 3 pruebas automatizadas de autenticación y roles pasan (`tests/test_integration_auth.py`); `test_api.py` requiere el servidor levantado; el flujo de vulneraciones se probó manualmente. | Equipo de desarrollo |
| Sprint Review y retrospectivas | Actas y acuerdos reales: `[completar]` | Equipo |

## 6. Fuentes y trazabilidad

1. **Documento base del proyecto:** `docs/entrega 1/1.5_GuiaEstudiante_Fase 1_Definicion Proyecto APT (Español).docx`, apartados **4. Objetivos**, **5. Metodología** y **7. Plan de Trabajo**, incluida la Carta Gantt.
2. **Historial Git:** Commits identificados junto a cada avance, entre ellos `d60d075`, `2ec1e88`, `390b324` y `f259ef3`.
3. **Cambios incorporados desde `main`:** Actualización hasta `fcb1f4e` (06-11-2026), incluyendo archivos adicionales de pruebas. La retirada de módulos independientes se relaciona con el cambio de alcance del commit `390b324`.
4. **Confirmaciones del equipo:** Decisión del docente sobre los módulos retirados, cobertura actual de la Ley N.º 21.719 y resultados de pruebas indicados en las secciones 4 y 5.

Las fechas de los commits se utilizan como evidencia de cambios en el repositorio, no como sustituto de las fechas reales de cada sprint. El tablero, las estimaciones, la aceptación formal y las actas se completarán con información confirmada por el equipo.
