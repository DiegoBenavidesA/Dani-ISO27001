# Retrospectivas del proyecto NormIA / DANI

> **Tipo de documento:** reconstrucción documental para revisión del equipo.
> **Estado:** borrador pendiente de validación.
> **Importante:** este archivo **no constituye un acta de reuniones realizadas**. Las observaciones se basan en la planificación de la fase de definición y en mensajes de commits del repositorio. No se atribuyen opiniones, acuerdos ni responsabilidades a integrantes sin evidencia.

## 1. Propósito y criterio de elaboración

El proyecto propone integrar requisitos de la Ley N.º 21.719 a una plataforma de gestión de cumplimiento ISO 27001 existente. En la definición inicial se contemplaron cuatro sprints funcionales: registro de actividades de tratamiento, consentimientos, derechos de titulares y vulneraciones de datos.

Este documento contrasta esa planificación con cambios observables en Git. Los commits demuestran que hubo trabajo en determinadas áreas, **pero por sí solos no prueban** que se completó una historia, se aprobó una entrega, se realizó una reunión o se cumplió un sprint dentro de fechas específicas.

**Datos pendientes para convertir estas reconstrucciones en retrospectivas validadas:** fechas reales de inicio y término de cada sprint, participantes, objetivos comprometidos, resultados de demostraciones, decisiones del equipo y responsables/plazos de acciones de mejora. Completar con evidencias reales, sin estimaciones presentadas como hechos.

---

## 2. Sprint 1 — Registro de actividades de tratamiento (RoPA)

**Objetivo inicialmente planificado:** trabajar el módulo de registro de actividades de tratamiento y su integración con la plataforma.

**Periodo real del sprint:** [completar].

### Evidencias del repositorio

- `6cfcb7c` (2026-10-09): corrección para retirar tratamientos de demostración y mostrar datos reales.
- `2a2d255` (2026-10-09): ajustes de resultados y eliminación de tratamientos para evitar duplicados generados por IA.
- `5767312` (2026-10-15): migraciones faltantes de `organization_id` en tratamientos e impacto.
- `e4482d1` (2026-10-28): optimización de extracción de tratamientos RoPA durante la evaluación con IA.

### Aspectos positivos observables

Se registraron mejoras para utilizar información real, corregir duplicados, asociar registros a organizaciones y optimizar procesos relacionados con RoPA.

### Dificultades observables

Los mensajes de commits reflejan ajustes de migraciones, datos de demostración y duplicación. No es posible determinar sus causas completas ni su impacto sin revisar incidencias y pruebas.

### Aprendizajes y acciones propuestas (no acuerdos confirmados)

- Verificar migraciones y aislamiento por organización antes de desplegar cambios de datos.
- Incorporar pruebas para evitar duplicados y para distinguir datos reales de datos de demostración.
- Documentar los criterios de aceptación del módulo y contrastarlos con su estado actual.

**Resultado y aceptación del sprint:** [completar con evidencia del equipo].

---

## 3. Sprint 2 — Gestión de consentimientos

**Objetivo inicialmente planificado:** incorporar funcionalidades de gestión de consentimientos en el contexto de protección de datos.

**Periodo real del sprint:** [completar].

### Evidencias del repositorio

- `3551b90` (2026-10-09): enlace al canal de solicitudes en un correo al titular.
- `43db093` (2026-10-09): corrección de rutas de API de consentimientos para evitar una redirección que afectaba CORS.
- `7e8e3f7` (2026-10-11): correcciones de migraciones relacionadas con estado y fecha de otorgamiento de consentimientos.
- `390b324` (2026-10-30): separación de preguntas ISO y Ley N.º 21.719 y retiro de módulos descritos en el commit como «sin valor».

### Aspectos positivos observables

El historial evidencia trabajo en API, persistencia y comunicación vinculada a consentimientos.

### Dificultades observables

Se necesitaron correcciones de rutas y de estructura de datos. Además, el alcance del producto cambió posteriormente. El mensaje del commit del 30 de octubre **no basta por sí solo** para determinar qué funcionalidades concretas quedaron activas o fueron retiradas.

### Aprendizajes y acciones propuestas (no acuerdos confirmados)

- Definir contratos de API y comprobar rutas, CORS y migraciones en pruebas integradas.
- Revisar con el equipo el estado actual del módulo y registrar formalmente cualquier cambio de alcance.
- Actualizar historias y criterios de aceptación cuando se retire o reemplace una funcionalidad.

**Resultado y aceptación del sprint:** [completar con evidencia del equipo].

---

## 4. Sprint 3 — Derechos de los titulares

**Objetivo inicialmente planificado:** desarrollar funcionalidades para gestionar solicitudes y derechos de los titulares de datos personales.

**Periodo real del sprint:** [completar].

### Evidencias del repositorio

- `3551b90` (2026-10-09): referencia a un canal de solicitudes en un correo al titular.
- `390b324` (2026-10-30): cambio de alcance que separa preguntas ISO y Ley N.º 21.719 y retira módulos.

**Límite de la evidencia:** en el extracto de 80 commits revisado no aparece una secuencia suficiente para acreditar la implementación y aceptación completa de un módulo de derechos de titulares. El enlace a un canal de solicitudes no equivale a demostrar un flujo integral de recepción, gestión y respuesta.

### Aspectos positivos observables

Se consideró un canal de contacto o solicitudes como parte de la experiencia de los titulares.

### Dificultades o preguntas pendientes

No está acreditado el alcance final, el estado actual ni la validación funcional de las historias previstas para este sprint.

### Aprendizajes y acciones propuestas (no acuerdos confirmados)

- Revisar código, tablero de tareas y decisiones del equipo para identificar qué historias se implementaron, cambiaron o descartaron.
- Documentar el flujo esperado, permisos, trazabilidad y criterios de aceptación solo si siguen dentro del alcance aprobado.
- Registrar expresamente las funcionalidades pospuestas o retiradas, sin presentarlas como terminadas.

**Resultado y aceptación del sprint:** [completar con evidencia del equipo].

---

## 5. Sprint 4 — Vulneraciones de datos y seguridad

**Objetivo inicialmente planificado:** implementar funcionalidades relacionadas con la gestión de vulneraciones de datos.

**Periodo real del sprint:** [completar].

### Evidencias del repositorio

- `71841df` (2026-10-10): gestión de brechas de datos y chatbot.
- `ec31c77` (2026-11-02): vulneraciones de seguridad y mapa de calor en resultados ISO.
- `f31bdbc` (2026-11-03): corrección en Vulneraciones y Generador de Documentos.
- `f259ef3` (2026-11-05): análisis con IA, revisión humana, aviso a responsables y cierre de vulneraciones.

### Aspectos positivos observables

El historial registra una evolución funcional desde la gestión de brechas hacia análisis asistido por IA y etapas de revisión y cierre. También aparecen ajustes en la presentación de resultados.

### Dificultades observables

Se documentó al menos una corrección posterior en la pantalla de Vulneraciones. La existencia de un commit funcional no demuestra por sí sola cobertura de pruebas ni aprobación del flujo completo.

### Aprendizajes y acciones propuestas (no acuerdos confirmados)

- Probar el flujo completo de registro, análisis, revisión humana, aviso y cierre con roles autorizados.
- Confirmar que las recomendaciones de IA estén sujetas a validación humana y sean trazables.
- Revisar criterios de privacidad, autorización y registro de acciones antes de considerar cerrada la historia.

**Resultado y aceptación del sprint:** [completar con evidencia del equipo].

---

## 6. Mejoras transversales identificadas después o entre los trabajos funcionales

Estas actividades **no se asignan a un sprint específico** porque no se dispone de un calendario validado:

| Área | Evidencia en Git | Oportunidad de mejora propuesta |
| --- | --- | --- |
| Experiencia móvil | `82d5766` (2026-10-29), `95066b0` (2026-10-30), `3890d2e` y `12ac1ed` (2026-11-05), `7b29e9c` (2026-11-06) | Definir y probar resoluciones mínimas para pantallas prioritarias. |
| Evidencias y rendimiento | `c7618f6` (2026-10-28), `b9fdcae` (2026-11-04), `217a9ba` (2026-11-05) | Medir tiempos de carga, recuperación ante errores y consumo de recursos. |
| Pruebas y control de acceso | `ae8e442`, `737e338`, `09001cc`, `fd459a7`, `2c5a036` (2026-11-06) | Mantener pruebas automatizadas para autenticación, roles y selección de organización. |
| Documentación y despliegue | `12eb528`, `3c40f60`, `20ce476`, `1c7adf9`, `d023ff3` (2026-11-06) | Verificar que manuales, README y configuración de despliegue reflejen el sistema actual. |
| Ajustes de alcance | `390b324` (2026-10-30) | Registrar decisiones de producto y actualizar el backlog para no mantener funcionalidades obsoletas como compromisos vigentes. |

## 7. Registro de validación pendiente

Antes de dar este documento por aprobado, el equipo debe confirmar:

- **Participantes de cada retrospectiva real (si existió):** [completar].
- **Fechas de los sprints y de las reuniones:** [completar].
- **Qué funcionó bien según el equipo:** [completar; no atribuir opiniones sin consulta].
- **Qué dificultades fueron efectivamente discutidas:** [completar].
- **Acuerdos adoptados, responsables y plazos:** [completar].
- **Estado final de los módulos tras los cambios de alcance:** [completar].
- **Aprobación o revisión del documento:** [completar].

## 8. Fuentes y alcance

1. Documento de definición inicial del proyecto, fase 1: objetivos, equipo, metodología Scrum y planificación funcional de cuatro sprints.
2. Historial del repositorio `DiegoBenavidesA/Dani-ISO27001`, extracto de los 80 commits sin merges compartido el **2026-11-06** mediante `git --no-pager log --all --date=short --pretty=format:"%h | %ad | %s" --no-merges -80`.

**Advertencia metodológica:** los mensajes de commit sirven como indicios verificables de trabajo técnico; no sustituyen actas, revisiones de sprint, pruebas de aceptación ni decisiones documentadas del equipo.
