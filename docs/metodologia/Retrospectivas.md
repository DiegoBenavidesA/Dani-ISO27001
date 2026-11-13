
# Retrospectivas del proyecto — NormIA

**Proyecto:** NormIA — Plataforma de Gobierno, Riesgo y Cumplimiento (GRC).  
**Marco normativo:** ISO/IEC 27001:2022 y Ley N.º 21.719 de Chile.  
**Metodología:** Enfoque ágil basado en Scrum.  
**Etapa:** Cierre de fase 3 del proyecto académico.  
**Equipo:** Justo Cano, Raúl Barrera y Celine Alcaíno.  
**Repositorio:** `DiegoBenavidesA/Dani-ISO27001`.  
**Rama de referencia:** `main`.

---

## 1. Introducción

Las retrospectivas permiten analizar el trabajo desarrollado durante los sprints, identificar aspectos positivos, reconocer dificultades y establecer oportunidades de mejora para las siguientes iteraciones.

En el proyecto NormIA, el desarrollo se orientó inicialmente a integrar funcionalidades relacionadas con la Ley N.º 21.719 en una plataforma GRC basada en ISO/IEC 27001:2022.

Durante la implementación se realizaron ajustes de arquitectura, integración, persistencia, experiencia de usuario y alcance funcional.

Estos cambios se encuentran reflejados en el historial de Git y en la versión actual del código fuente.

El presente documento organiza los aprendizajes del desarrollo en torno a los cuatro sprints funcionales considerados en la planificación original.

### 1.1. Criterio de elaboración

Las observaciones se fundamentan en:

- La planificación académica inicial.
- El Sprint Backlog del proyecto.
- Los cambios registrados en el repositorio GitHub.
- La estructura y las funcionalidades presentes en la rama `main`.
- Los archivos de pruebas incorporados al proyecto.
- Los ajustes de alcance realizados durante el desarrollo.

Las fechas indicadas para los commits corresponden al registro de Git y no representan necesariamente las fechas de inicio o término de cada sprint.

Las oportunidades de mejora presentadas son conclusiones del análisis retrospectivo. No se atribuyen como acuerdos de reuniones formales ni como declaraciones personales de los integrantes del equipo.

---

## 2. Contexto de los sprints

La planificación original contempló cuatro sprints funcionales relacionados con la protección de datos personales.

| Sprint | Objetivo inicialmente planificado | Situación en la versión actual |
|---|---|---|
| Sprint 1 | Registro de actividades de tratamiento (RoPA) | Desarrollo histórico; módulo independiente retirado del alcance vigente |
| Sprint 2 | Gestión de consentimientos | Desarrollo histórico; módulo independiente retirado del alcance vigente |
| Sprint 3 | Derechos de los titulares | Alcance reformulado; módulo independiente retirado |
| Sprint 4 | Registro y gestión de vulneraciones | Funcionalidad integrada en la versión actual |

La reorganización del producto permitió concentrar el trabajo relacionado con la Ley N.º 21.719 en dos áreas principales:

1. Evaluación de requisitos legales mediante preguntas, evidencias y análisis de cumplimiento.
2. Gestión de vulneraciones de seguridad y datos personales mediante un flujo específico.

El sistema de evaluación mantiene soporte para ISO/IEC 27001:2022 y Ley N.º 21.719.

La versión actual incluye el catálogo de obligaciones legales definido en `app/data/catalogo_ley21719.json`, compuesto por ocho categorías y 24 preguntas.

---

## 3. Retrospectiva del Sprint 1 — Registro de actividades de tratamiento (RoPA)

### 3.1. Objetivo inicial

El primer sprint contempló incorporar funcionalidades para registrar y consultar actividades de tratamiento de datos personales.

El propósito era apoyar la identificación de tratamientos, finalidades, categorías de datos y otra información relevante para la gestión del cumplimiento.

### 3.2. Trabajo realizado y evidencias

El historial del repositorio contiene los siguientes cambios relacionados:

| Commit | Fecha | Cambio registrado |
|---|---|---|
| `6cfcb7c` | 09-10-2026 | Eliminación de tratamientos de demostración para mostrar información real |
| `2a2d255` | 09-10-2026 | Correcciones de resultados y tratamiento de registros duplicados |
| `5767312` | 15-10-2026 | Ajustes de migraciones relacionados con `organization_id` |
| `e4482d1` | 28-10-2026 | Optimización de extracción de tratamientos durante evaluaciones con IA |

Estos cambios demuestran trabajo técnico en la representación de información real, la persistencia y la integración de tratamientos con procesos de evaluación.

Posteriormente, el módulo independiente de RoPA fue retirado de las rutas activas del producto.

### 3.3. Aspectos positivos identificados

**Uso de información real**

La eliminación de registros de demostración permitió orientar la interfaz hacia información obtenida de las operaciones reales del sistema.

**Corrección de duplicaciones**

Los ajustes relacionados con registros duplicados contribuyeron a mejorar la coherencia de los datos generados o procesados.

**Integración con organizaciones**

Los cambios de `organization_id` reflejan la necesidad de asociar correctamente la información a cada organización.

**Optimización de procesos**

La extracción de tratamientos durante evaluaciones asistidas por IA muestra un esfuerzo por mejorar la integración entre funcionalidades.

### 3.4. Dificultades identificadas

- Se requirieron correcciones para diferenciar datos reales de registros de demostración.
- Fue necesario ajustar la persistencia y la asociación de registros a organizaciones.
- La duplicación de información representó un problema que debió corregirse.
- El alcance funcional original cambió durante el desarrollo.

### 3.5. Aprendizajes

El trabajo de este sprint permite reconocer la importancia de utilizar datos reales desde las primeras etapas de integración.

También evidencia que los modelos de datos deben considerar desde el inicio el contexto de organización y las relaciones entre registros.

Otro aprendizaje es que una funcionalidad puede tener avances técnicos relevantes y, aun así, dejar de formar parte del alcance final.

Por ello, el estado del producto debe determinarse a partir de su versión vigente y no únicamente del historial de commits.

### 3.6. Oportunidades de mejora

- Definir casos de prueba para detectar duplicaciones.
- Revisar las migraciones antes de incorporar cambios en el esquema.
- Comprobar el aislamiento de datos por organización.
- Mantener diferenciados los datos de demostración y los datos reales.
- Actualizar el backlog cuando una funcionalidad cambie de alcance.

### 3.7. Resultado retrospectivo

El sprint presenta evidencia de desarrollo y correcciones relacionadas con RoPA.

Sin embargo, el módulo independiente no forma parte del alcance activo de la versión revisada.

El aprendizaje principal se relaciona con la calidad de los datos, la integración y la necesidad de mantener la planificación alineada con las decisiones de producto.

---

## 4. Retrospectiva del Sprint 2 — Gestión de consentimientos

### 4.1. Objetivo inicial

El segundo sprint contempló implementar funcionalidades para registrar y gestionar consentimientos relacionados con el tratamiento de datos personales.

La planificación consideraba operaciones de registro, consulta y seguimiento de información.

### 4.2. Trabajo realizado y evidencias

El historial del repositorio registra los siguientes cambios:

| Commit | Fecha | Cambio registrado |
|---|---|---|
| `3551b90` | 09-10-2026 | Incorporación de un enlace al canal de solicitudes en un correo |
| `43db093` | 09-10-2026 | Corrección de rutas de consentimientos para evitar redirecciones que afectaban CORS |
| `7e8e3f7` | 11-10-2026 | Ajustes de migraciones relacionados con estado y fecha de consentimiento |
| `390b324` | 30-10-2026 | Reorganización de preguntas ISO y Ley N.º 21.719 y retiro de módulos |

El código histórico demuestra que se trabajó en la API, la estructura de datos y elementos relacionados con la comunicación.

Posteriormente, el módulo independiente de consentimientos fue retirado de las rutas activas del sistema.

### 4.3. Aspectos positivos identificados

**Integración entre componentes**

Los cambios muestran trabajo para conectar las operaciones de consentimiento con la API y la persistencia.

**Corrección de problemas de comunicación**

El ajuste de rutas permitió abordar un problema concreto relacionado con redirecciones HTTP y CORS.

**Evolución del modelo de datos**

Las correcciones de estado y fecha de otorgamiento reflejan la necesidad de representar correctamente la información de consentimiento.

**Revisión del valor funcional**

La reorganización posterior permitió revisar qué funcionalidades debían mantenerse dentro del producto final.

### 4.4. Dificultades identificadas

- Se presentaron problemas de integración relacionados con rutas de API.
- Fue necesario corregir aspectos del esquema de datos.
- Los cambios de alcance afectaron la continuidad del módulo independiente.
- El desarrollo histórico no constituye evidencia suficiente de aceptación final de la funcionalidad.

### 4.5. Aprendizajes

Este sprint evidencia la importancia de definir contratos claros entre frontend y backend.

Una diferencia aparentemente menor en una ruta puede provocar redirecciones que afectan la comunicación entre componentes.

También se reconoce la necesidad de evaluar el valor de cada funcionalidad respecto del objetivo general del proyecto.

La reorganización del alcance permitió diferenciar entre funcionalidades desarrolladas durante la exploración y capacidades que finalmente se mantienen en la plataforma.

### 4.6. Oportunidades de mejora

- Estandarizar las rutas de API utilizadas por frontend y backend.
- Incorporar pruebas de integración para las operaciones principales.
- Revisar los cambios de esquema antes de integrar nuevas funcionalidades.
- Actualizar las historias de usuario cuando se modifique el alcance.
- Evitar presentar funcionalidades retiradas como módulos activos del producto.

### 4.7. Resultado retrospectivo

El historial demuestra trabajo técnico en la gestión de consentimientos.

No obstante, el módulo independiente fue retirado del alcance vigente.

El aprendizaje principal se relaciona con la integración entre componentes y la importancia de ajustar la planificación a las prioridades reales del producto.

---

## 5. Retrospectiva del Sprint 3 — Derechos de los titulares

### 5.1. Objetivo inicial

El tercer sprint contempló incorporar funcionalidades para gestionar solicitudes relacionadas con los derechos de los titulares de datos personales.

Entre los objetivos previstos se encontraban la recepción, consulta y seguimiento de solicitudes.

### 5.2. Trabajo realizado y evidencias

Las evidencias documentadas incluyen:

| Commit | Fecha | Cambio registrado |
|---|---|---|
| `3551b90` | 09-10-2026 | Referencia a un canal de solicitudes en una comunicación |
| `390b324` | 30-10-2026 | Reorganización del alcance funcional relacionado con la Ley N.º 21.719 |

La versión actual del repositorio no mantiene activo el módulo independiente de solicitudes de titulares.

El historial revisado tampoco permite acreditar la finalización y aceptación de un flujo integral de gestión de derechos.

La incorporación de un enlace a un canal de solicitudes no demuestra por sí sola la existencia de un sistema completo de recepción, seguimiento y respuesta.

### 5.3. Aspectos positivos identificados

**Consideración de la comunicación con titulares**

La planificación y los cambios históricos reflejan que se contempló un mecanismo de contacto relacionado con solicitudes.

**Revisión de prioridades**

La reorganización del alcance permitió concentrar el desarrollo en funcionalidades que permanecieron integradas en el producto.

**Separación de responsabilidades funcionales**

La evaluación de requisitos legales quedó diferenciada de los módulos operativos de gestión de datos personales.

### 5.4. Dificultades identificadas

- No se dispone de evidencia suficiente para declarar completado el módulo independiente.
- El alcance original fue modificado.
- No corresponde atribuir aceptación funcional a historias que no permanecen implementadas en la versión vigente.
- La relación entre obligaciones legales y funcionalidades específicas necesitó reorganizarse.

### 5.5. Aprendizajes

El principal aprendizaje es que los cambios de alcance deben reflejarse tanto en el código como en la documentación del proyecto.

Mantener historias originales sin distinguir su estado puede producir inconsistencias entre el backlog, la visión del producto y la aplicación entregada.

También se reconoce la importancia de diferenciar una funcionalidad completa de un mecanismo parcial de comunicación.

### 5.6. Oportunidades de mejora

- Mantener actualizada la relación entre requisitos y funcionalidades vigentes.
- Registrar los cambios de alcance en los documentos del proyecto.
- Evitar clasificar como terminadas las historias retiradas.
- Definir criterios de aceptación específicos para los flujos que se incorporen en futuras versiones.
- Mantener trazabilidad entre la planificación y las decisiones de implementación.

### 5.7. Resultado retrospectivo

El sprint corresponde a un objetivo inicialmente planificado cuyo alcance fue reformulado.

El módulo independiente de derechos de titulares no se presenta como funcionalidad activa del producto final.

El aprendizaje principal es la necesidad de mantener coherencia entre planificación, implementación y documentación.

---

## 6. Retrospectiva del Sprint 4 — Gestión de vulneraciones de seguridad

### 6.1. Objetivo inicial

El cuarto sprint contempló implementar funcionalidades para registrar y gestionar vulneraciones de datos personales.

El objetivo era apoyar el seguimiento de incidentes y las actividades relacionadas con su evaluación y notificación.

### 6.2. Trabajo realizado y evidencias

El historial del repositorio registra una evolución de esta funcionalidad:

| Commit | Fecha | Cambio registrado |
|---|---|---|
| `71841df` | 10-10-2026 | Incorporación de gestión de brechas de datos y chatbot |
| `ec31c77` | 02-11-2026 | Desarrollo relacionado con vulneraciones y resultados de evaluación |
| `f31bdbc` | 03-11-2026 | Correcciones en Vulneraciones y Generador de Documentos |
| `f259ef3` | 05-11-2026 | Análisis con IA, revisión humana, avisos a responsables y cierre |

A diferencia de los módulos independientes anteriores, la gestión de vulneraciones permanece integrada en la rama `main`.

La implementación actual incluye:

- Registro de una vulneración con descripción y fecha de detección.
- Asociación del registro a una organización.
- Análisis asistido por inteligencia artificial.
- Propuesta de gravedad y recomendaciones.
- Revisión y confirmación humana de la gravedad.
- Registro de información sobre datos y personas afectadas.
- Gestión de estados del incidente.
- Avisos a responsables mediante los servicios configurados.
- Registro de la confirmación de notificación.
- Resolución y cierre con causa raíz y descripción de la solución.
- Restricciones de acceso para las operaciones de gestión.

### 6.3. Aspectos positivos identificados

**Evolución incremental**

El módulo avanzó desde el registro de incidentes hacia un flujo que incorpora análisis, revisión, notificación registrada y cierre.

**Integración de inteligencia artificial**

La IA se utiliza como apoyo para evaluar preliminarmente la gravedad y sugerir acciones.

**Participación humana en decisiones relevantes**

La implementación requiere que un responsable autorizado confirme la gravedad antes de determinadas operaciones.

**Control de acceso**

El backend utiliza autenticación, contexto de organización y restricciones de roles para proteger las operaciones.

**Trazabilidad de la gestión**

El modelo contempla información sobre detección, confirmación, notificación y resolución.

### 6.4. Dificultades identificadas

- El historial registra correcciones posteriores a la incorporación de funcionalidades.
- El flujo combina frontend, backend, base de datos y servicios externos, aumentando las necesidades de integración.
- La generación de resultados con IA requiere tratamiento de errores y validación humana.
- La gestión de notificaciones exige distinguir entre avisos internos y notificaciones a una autoridad.
- La existencia de archivos de pruebas no acredita automáticamente que todos los casos hayan sido ejecutados satisfactoriamente.

### 6.5. Aprendizajes

**La IA debe apoyar, no reemplazar, la revisión humana.**

El módulo contempla que la gravedad sugerida por la IA sea revisada por un responsable.

**Los estados de un incidente deben tener reglas claras.**

La implementación incluye restricciones para impedir determinadas operaciones antes de completar pasos previos.

**Las integraciones externas requieren tratamiento de errores.**

Los servicios de IA y notificaciones pueden fallar, por lo que el sistema debe contemplar estas situaciones.

**La trazabilidad es importante para la gestión de incidentes.**

Registrar fechas, responsables y acciones permite mantener un historial de la atención de una vulneración.

**La documentación debe describir exactamente el comportamiento implementado.**

La operación de notificación a la Agencia registra la confirmación de que se notificó; no realiza un envío automático a la autoridad.

### 6.6. Oportunidades de mejora

- Ejecutar y documentar las pruebas del flujo completo.
- Comprobar permisos para diferentes roles.
- Verificar el aislamiento de incidentes entre organizaciones.
- Revisar los casos de error de los servicios externos.
- Comprobar las transiciones de estado y las validaciones de cierre.
- Mantener diferenciadas las recomendaciones de IA y las decisiones humanas.
- Revisar los mensajes de la interfaz para evitar interpretaciones incorrectas sobre las notificaciones.

### 6.7. Resultado retrospectivo

El módulo de vulneraciones presenta evidencia de implementación en frontend y backend.

La versión actual incorpora el flujo de registro, análisis asistido por IA, revisión humana, registro de notificación y cierre.

El repositorio contiene pruebas específicas relacionadas con permisos, lógica y flujo de vulneraciones.

La validación integral de su funcionamiento se realizará mediante la ejecución y documentación de las pruebas correspondientes.

El aprendizaje principal de este sprint se relaciona con la integración de múltiples componentes y la necesidad de mantener control humano, seguridad y trazabilidad en la gestión de incidentes.

---

## 7. Retrospectiva transversal del desarrollo

Además de los objetivos funcionales, el historial del proyecto permite identificar mejoras y dificultades que afectaron distintas áreas.

Estas actividades no se asignan a un sprint específico cuando no existe evidencia suficiente para establecer su correspondencia temporal.

### 7.1. Experiencia de usuario y adaptación móvil

**Evidencias:**

- `82d5766`
- `95066b0`
- `3890d2e`
- `12ac1ed`
- `7b29e9c`

El historial registra ajustes de diseño y adaptación de pantallas para dispositivos móviles.

**Aprendizaje:** la adaptación visual debe considerarse durante el desarrollo de cada pantalla y no solamente al finalizar la integración.

**Oportunidad de mejora:** comprobar las pantallas prioritarias en resoluciones representativas de escritorio y móvil.

### 7.2. Gestión de evidencias y rendimiento

**Evidencias:**

- `c7618f6`
- `b9fdcae`
- `217a9ba`

El historial contiene cambios relacionados con evidencias, optimización y comportamiento de la plataforma.

**Aprendizaje:** las funcionalidades que procesan documentos y resultados requieren atención a los tiempos de respuesta y al manejo de errores.

**Oportunidad de mejora:** realizar comprobaciones de rendimiento sobre las operaciones principales de carga, consulta y procesamiento.

### 7.3. Autenticación y control de acceso

**Evidencias:**

- `ae8e442`
- `737e338`
- `09001cc`
- `fd459a7`
- `2c5a036`

La versión actual contiene mecanismos de autenticación JWT, autorización por roles y asociación de usuarios a organizaciones.

También incorpora el archivo `tests/test_integration_auth.py`, con casos relacionados con rutas protegidas, restricciones de roles y selección de organización.

**Aprendizaje:** los permisos deben verificarse en el backend, además de controlar la navegación y las acciones visibles en el frontend.

**Oportunidad de mejora:** mantener pruebas de acceso no autorizado, restricciones por rol y aislamiento por organización.

### 7.4. Documentación y despliegue

**Evidencias:**

- `12eb528`
- `3c40f60`
- `20ce476`
- `1c7adf9`
- `d023ff3`

El proyecto contiene documentación técnica, instrucciones de ejecución y archivos de configuración de infraestructura.

**Aprendizaje:** los cambios técnicos deben reflejarse en la documentación para evitar diferencias entre las instrucciones y el funcionamiento actual.

**Oportunidad de mejora:** comprobar las instrucciones de instalación, configuración y ejecución en un entorno reproducible.

### 7.5. Ajustes de alcance y priorización

**Evidencia principal:** `390b324` del 30-10-2026.

Este cambio reorganizó las preguntas de evaluación de ISO y Ley N.º 21.719 y retiró módulos del alcance activo.

El mensaje del commit también hace referencia a retroalimentación docente sobre el flujo del producto.

**Aprendizaje:** la retroalimentación durante el desarrollo puede requerir cambios significativos en la estructura y las prioridades de una solución.

**Oportunidad de mejora:** actualizar de forma coordinada la visión del producto, los requisitos, el backlog y los documentos de cierre cuando se modifique el alcance.

---

## 8. Síntesis de aprendizajes

El análisis retrospectivo del desarrollo permite identificar cinco aprendizajes principales.

### 8.1. Mantener coherencia entre alcance e implementación

El proyecto evolucionó desde una planificación con varios módulos independientes hacia una versión centrada en evaluación de cumplimiento y gestión de vulneraciones.

La documentación debe reflejar esa evolución.

### 8.2. Fortalecer la integración entre frontend y backend

Las correcciones de rutas, persistencia y comunicación muestran la importancia de definir interfaces claras entre componentes.

### 8.3. Incorporar seguridad desde el desarrollo

La autenticación, las restricciones por rol y el aislamiento entre organizaciones deben formar parte de la implementación y de sus criterios de aceptación.

### 8.4. Mantener supervisión humana en las funciones de IA

Las recomendaciones generadas por inteligencia artificial requieren revisión cuando intervienen en decisiones relacionadas con seguridad o cumplimiento.

### 8.5. Relacionar la finalización de tareas con evidencias

La implementación de una funcionalidad no equivale automáticamente a su aceptación.

La Definition of Done permite establecer condiciones de calidad y la ejecución de pruebas permite respaldar su cumplimiento.

---

## 9. Acciones de mejora identificadas

A partir de los problemas y cambios observados, se identifican las siguientes acciones para fortalecer la calidad del producto y su documentación.

| Área | Acción de mejora | Evidencia que permitiría comprobarla |
|---|---|---|
| Integración | Revisar los contratos entre frontend y backend | Pruebas de operaciones y respuestas de API |
| Seguridad | Comprobar autenticación, roles y aislamiento por organización | Resultados de pruebas de acceso |
| Vulneraciones | Validar el flujo de registro, revisión, notificación registrada y cierre | Pruebas funcionales del módulo |
| Inteligencia artificial | Comprobar errores, respuestas inválidas y revisión humana | Pruebas de lógica y casos de error |
| Base de datos | Revisar migraciones y persistencia | Resultados de pruebas de integración |
| Experiencia móvil | Comprobar las pantallas prioritarias | Registro de revisión visual |
| Infraestructura | Verificar la ejecución de los servicios configurados | Resultados de ejecución y conectividad |
| Documentación | Mantener los documentos alineados con `main` | Revisión cruzada de archivos y funcionalidades |

Estas acciones representan oportunidades de mejora derivadas del análisis técnico.

No se presentan como acuerdos formales de reuniones ni se asignan responsables o fechas que no estén documentados.

La comprobación técnica detallada se realizará en una etapa de validación separada.

---

## 10. Relación con Scrum y la Definition of Done

Las retrospectivas complementan el seguimiento del proyecto y la aplicación de la Definition of Done.

| Elemento | Función dentro del proyecto |
|---|---|
| Product Vision | Define el propósito, los usuarios y el valor del producto |
| Sprint Backlog | Organiza las tareas y los objetivos del desarrollo |
| Criterios de aceptación | Describen el comportamiento esperado de cada historia |
| Definition of Done | Establece las condiciones de calidad para declarar terminada una tarea |
| Retrospectivas | Identifican dificultades, aprendizajes y oportunidades de mejora |

El análisis retrospectivo ayuda a reconocer qué aspectos del proceso de desarrollo pueden fortalecerse.

La DoD, por su parte, establece cómo determinar si una tarea reúne las condiciones necesarias para considerarse terminada.

Ambos documentos se complementan, pero no reemplazan los resultados de pruebas ni los registros formales de aceptación.

---

## 11. Conclusión general

El desarrollo de NormIA evidencia un proceso de evolución funcional y técnica en el que se realizaron implementaciones, correcciones, integraciones y ajustes de alcance.

Los primeros sprints contemplaron módulos independientes relacionados con actividades de tratamiento, consentimientos y derechos de titulares.

Durante el proyecto, estas funcionalidades fueron reformuladas o retiradas del alcance activo.

La evaluación de requisitos asociados a la Ley N.º 21.719 se integró al sistema de preguntas y análisis de cumplimiento, mientras que la gestión de vulneraciones permaneció como módulo independiente.

El historial de Git permite identificar avances y dificultades relacionados con persistencia, integración, experiencia móvil, seguridad, inteligencia artificial y documentación.

Los principales aprendizajes se concentran en mantener coherencia entre la planificación y la implementación, fortalecer la integración entre componentes, incorporar controles de seguridad y respaldar la finalización de tareas mediante evidencias.

Estas retrospectivas constituyen una síntesis documentada del proceso de desarrollo para el cierre de la fase 3.

Su contenido no sustituye las actas de reuniones Scrum ni atribuye al equipo decisiones o acuerdos que no estén respaldados por registros.

La validación técnica final del producto se documentará por separado, mediante las pruebas y comprobaciones correspondientes.

---

## 12. Referencias

### Documentación del proyecto

- `docs/metodologia/Product_Vision.md`
- `docs/metodologia/Sprint_Backlog.md`
- `docs/metodologia/Definition_of_Done.md`
- `README.md`

### Implementación técnica

- `Producto/dani-project-back/app/main.py`
- `Producto/dani-project-back/app/routes/assessment_questions.py`
- `Producto/dani-project-back/app/routes/breaches.py`
- `Producto/dani-project-back/app/dependencies/auth.py`
- `Producto/dani-project-back/app/dependencies/tenant.py`
- `Producto/dani-project-back/app/data/catalogo_ley21719.json`
- `Producto/dani-project-front/src/pages/BreachesScreen.jsx`

### Pruebas existentes

- `Producto/dani-project-back/tests/test_integration_auth.py`
- `Producto/dani-project-back/tests/test_breaches_flujo.py`
- `Producto/dani-project-back/tests/test_breaches_logica.py`
- `Producto/dani-project-back/tests/test_breaches_permisos.py`

### Historial de desarrollo

- Repositorio: https://github.com/DiegoBenavidesA/Dani-ISO27001
- Rama revisada: `main`
- Cambios de alcance: commit `390b324`
- Evolución del módulo de vulneraciones: commit `f259ef3`

---

**Documento:** Retrospectivas — NormIA.  
**Etapa:** Cierre de fase 3.  
**Base documental:** Planificación académica, Sprint Backlog, historial Git y código fuente.  
**Tipo de registro:** Análisis retrospectivo documentado del desarrollo.
