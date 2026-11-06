# Product Vision — NormIA

**Proyecto académico:** Gestión de Riesgos y Cumplimiento (GRC) — plataforma de gestión del cumplimiento ISO 27001 y Ley N.º 21.719  
**Producto:** NormIA (la plataforma base también figura como DANI en el README del repositorio)  
**Equipo:** Celine Alcaíno, Raúl Barrera y Justo Cano  
**Metodología de trabajo definida:** Scrum  
**Estado:** Visión del producto basada en la definición del proyecto APT; pendiente de aprobación formal  
**Aprobación y fecha:** [completar]

## 1. Resumen ejecutivo

NormIA es la evolución de una plataforma de Gobierno, Riesgo y Cumplimiento (GRC) existente, orientada a la gestión de seguridad de la información y a la preparación para ISO/IEC 27001. La necesidad que origina este proyecto académico, planteada por el cliente según el documento de definición, es **incorporar los requerimientos de la Ley N.º 21.719 de protección de datos personales de Chile**, aprovechando la arquitectura y las funcionalidades ya disponibles.

La visión es que las organizaciones puedan gestionar, consultar y respaldar en un entorno integrado las obligaciones de seguridad de la información y los nuevos procesos de protección de datos personales, mediante interfaces comprensibles, registros trazables y apoyo de inteligencia artificial cuando corresponda.

**Distinción esencial:** esta visión describe el resultado al que aspira el proyecto. No afirma que todos los módulos planificados estén terminados ni disponibles en la versión actual.

## 2. Problema y oportunidad

### 2.1 Situación inicial

La plataforma GRC existente permite abordar aspectos de ISO 27001, tales como controles, riesgos, evidencias y documentación, con apoyo de inteligencia artificial. Sin embargo, el alcance inicial no cubre necesariamente los procesos y registros requeridos para gestionar la protección de datos personales conforme a la Ley N.º 21.719.

El equipo identificó, a partir de la necesidad planteada por el cliente, la oportunidad de extender esa base tecnológica en vez de desarrollar un sistema independiente.

### 2.2 Problema central

**Las organizaciones que tratan datos personales necesitan incorporar y dar seguimiento a nuevas obligaciones de privacidad sin fragmentar la gestión de seguridad, riesgos, evidencias y cumplimiento que ya realizan.**

Entre las dificultades que el proyecto busca abordar están:

- Registrar y consultar de manera organizada los antecedentes relacionados con tratamientos de datos personales.
- Dar seguimiento a consentimientos y solicitudes de ejercicio de derechos, según el alcance acordado con el cliente.
- Registrar y gestionar incidentes o brechas de datos personales.
- Relacionar requisitos normativos con documentación, controles, riesgos y evidencias.
- Presentar información normativa compleja mediante flujos e interfaces comprensibles.

Estas necesidades se desprenden del documento de definición del proyecto. Su frecuencia, impacto económico y magnitud en organizaciones reales **no están cuantificados**: [completar si el equipo dispone de un levantamiento].

## 3. Usuarios objetivo y partes interesadas

| Perfil | Necesidad principal | Valor esperado |
|---|---|---|
| Responsables de cumplimiento y protección de datos | Gestionar requisitos de la Ley N.º 21.719 y su seguimiento | Registros y consultas organizados en la plataforma GRC |
| Responsables de seguridad de la información y gestión de riesgos | Relacionar seguridad, riesgos y privacidad | Visión integrada de controles, riesgos y evidencias |
| Personal que administra tratamientos de datos personales | Registrar información y mantener antecedentes actualizados | Flujos claros para ingresar y consultar información |
| Responsables de atender solicitudes de titulares | Gestionar solicitudes y su estado | Seguimiento estructurado de las solicitudes, si el módulo forma parte del alcance vigente |
| Responsables de revisar incidentes y brechas | Documentar eventos y su tratamiento | Registro y seguimiento de brechas |
| Administradores y revisores de la plataforma | Controlar el acceso y consultar antecedentes | Gestión de acceso y respaldo para revisiones, según permisos implementados |

**Beneficiarios indirectos:** las personas cuyos datos personales son tratados por las organizaciones usuarias.

**Segmento prioritario, tamaño de organización y perfiles validados con usuarios reales:** [completar]. La tabla representa perfiles previstos, no usuarios entrevistados ni permisos técnicos verificados.

## 4. Declaración de visión del producto

> **Para** organizaciones chilenas que gestionan seguridad de la información y tratan datos personales, **que necesitan** adaptar sus procesos a los requerimientos de la Ley N.º 21.719 sin perder la continuidad de su gestión ISO 27001, **NormIA será** una plataforma GRC integrada que permitirá organizar requisitos, registros, evidencias y seguimiento de privacidad junto con los procesos de seguridad existentes, ofreciendo una experiencia comprensible y asistencia tecnológica para apoyar decisiones informadas.

La plataforma busca facilitar una gestión **ordenada, verificable y demostrable**, sin reemplazar la revisión profesional ni garantizar por sí misma una certificación ISO 27001 o el cumplimiento legal.

## 5. Propuesta de valor

| Pilar | Propuesta de valor | Resultado esperado |
|---|---|---|
| Integración normativa | Incorporar la Ley N.º 21.719 a una plataforma GRC que ya aborda ISO 27001 | Evitar gestionar seguridad y privacidad en soluciones totalmente separadas |
| Centralización | Reunir requisitos, registros, documentación y evidencias relevantes | Facilitar la consulta y el seguimiento de información |
| Trazabilidad | Mantener antecedentes y estados asociados a los procesos incluidos en el alcance | Apoyar revisiones y demostración de actividades realizadas |
| Usabilidad | Presentar conceptos normativos mediante interfaces y flujos comprensibles | Reducir barreras de uso para personas sin experiencia técnica profunda |
| Apoyo con IA | Adaptar el asistente existente para ayudar a comprender la nueva normativa | Facilitar consultas orientativas, sujetas a revisión humana |
| Desarrollo incremental | Priorizar y validar capacidades en iteraciones cortas | Recibir retroalimentación y corregir problemas antes del cierre del proyecto |

Los beneficios anteriores son **hipótesis de valor a validar**, no mejoras de productividad ya medidas.

## 6. Objetivo general y objetivos específicos

### 6.1 Objetivo general

**Integrar los requerimientos de la Ley N.º 21.719 de protección de datos personales en la plataforma GRC existente, ampliando sus funcionalidades de gestión del cumplimiento de la seguridad de la información.**

Este objetivo mantiene el sentido del objetivo general formulado por el equipo en la definición del proyecto APT.

### 6.2 Objetivos específicos

1. Levantar y analizar con el cliente los requerimientos de la Ley N.º 21.719 que la plataforma debe soportar.
2. Revisar la arquitectura y los módulos existentes para identificar los puntos de integración.
3. Diseñar los cambios de modelo de datos, interfaces y flujos necesarios para gestionar procesos de protección de datos personales.
4. Desarrollar y/o adaptar capacidades de registro y seguimiento para los procesos priorizados: tratamientos, consentimientos, derechos de los titulares y brechas de datos.
5. Adaptar el asistente de inteligencia artificial existente para apoyar la comprensión de la normativa, dentro del alcance aprobado.
6. Ejecutar pruebas de validación para comprobar el comportamiento de las funcionalidades efectivamente entregadas frente a los requisitos acordados.

**Nota de alcance:** estos son objetivos del plan original. Su cumplimiento debe verificarse en el código vigente y en los resultados de pruebas; no se presume que los seis estén completados.

## 7. Objetivos medibles e indicadores de validación

Para que la visión pueda evaluarse, se proponen indicadores vinculados directamente con los objetivos anteriores. El equipo debe acordar las metas antes de utilizarlos como criterios de aceptación.

| Objetivo evaluable | Indicador / método de medición | Línea base | Meta acordada | Evidencia |
|---|---|---|---|---|
| Cubrir los requerimientos priorizados de la Ley N.º 21.719 | (Requisitos priorizados con implementación validada / total de requisitos priorizados) × 100 | [completar] | [completar] | Matriz de requisitos, pruebas y funcionalidades |
| Validar los procesos de privacidad incluidos en el alcance vigente | (Flujos priorizados que superan pruebas de aceptación / total de flujos priorizados) × 100 | [completar] | [completar] | Casos de prueba y resultados |
| Mantener trazabilidad de las entregas | (Historias terminadas con referencia a código y prueba / historias declaradas terminadas) × 100 | [completar] | [completar] | Sprint Backlog, commits y pruebas |
| Comprobar la comprensión de las interfaces | (Tareas de prueba completadas sin ayuda / tareas de prueba ejecutadas) × 100 | [completar] | [completar] | Registro de pruebas con usuarios o equipo |
| Evaluar la asistencia de IA para la nueva normativa | (Respuestas revisadas y aceptadas / respuestas evaluadas en casos definidos) × 100 | [completar] | [completar] | Casos de evaluación y revisión humana |

**Reglas de medición:** documentar el universo de requisitos, las pruebas aplicadas, quién valida cada resultado y la fecha de medición. No asignar porcentajes de avance o éxito sin evidencias. Responsable de seguimiento: [completar].

## 8. Alcance funcional: planificación frente a implementación

### 8.1 Base existente

Según la definición del proyecto, la plataforma GRC ya contaba con un enfoque de ISO 27001, controles, riesgos, evidencias, documentación y apoyo de IA. El repositorio describe una aplicación web con React, backend FastAPI/Python y PostgreSQL.

### 8.2 Capacidades previstas para la extensión a la Ley N.º 21.719

El plan académico contempla cuatro líneas de desarrollo:

1. **Registro de actividades de tratamiento** (Sprint 1 planificado).
2. **Gestión de consentimientos** (Sprint 2 planificado).
3. **Solicitudes de derechos de los titulares**, incluyendo acceso, rectificación y supresión (Sprint 3 planificado).
4. **Registro y notificación de brechas de datos** (Sprint 4 planificado).

También contempla adaptación del asistente de IA, diseño de interfaces y modelo de datos, pruebas y validación final.

### 8.3 Estado actual por contrastar

La actualización de `main` al commit `662e1d2` mostró, entre otros cambios, la eliminación de rutas de backend y pantallas de frontend relacionadas con **consentimientos** y **solicitudes de derechos de titulares**, y cambios importantes en el módulo de **brechas**. Por tanto:

- No se deben describir los cuatro módulos planificados como si todos estuvieran disponibles.
- El alcance **efectivamente entregado** y las decisiones de sustitución o retiro deben confirmarse mediante el código actual, las pruebas y el equipo: **[completar]**.
- La visión y el plan original se conservan como referencia; el Sprint Backlog documentará las diferencias entre planificación y ejecución real.

## 9. Enfoque de entrega y restricciones

El documento de definición del proyecto establece **18 semanas** de trabajo académico, organizadas en tres etapas:

- **Fase 1 — Definición:** levantamiento de requerimientos, análisis de la plataforma y planificación del Product Backlog.
- **Fase 2 — Desarrollo:** iteraciones Scrum de aproximadamente **2 a 3 semanas**, con incrementos y validación de funcionalidades.
- **Fase 3 — Presentación:** validación final, ajustes según retroalimentación del cliente/docente y presentación del proyecto.

El plan identifica como restricciones el tiempo disponible, los límites de los servicios gratuitos y el uso controlado de la inteligencia artificial. Se prevé trabajar localmente antes del despliegue y considerar respuestas de respaldo cuando sea necesario.

Estas son **condiciones del plan original**, no una afirmación de que el calendario o todas las medidas se hayan cumplido exactamente.

## 10. Principios y límites de la solución

- **Aprovechar la plataforma existente:** integrar capacidades nuevas sin perder continuidad con los procesos GRC ya presentes.
- **Priorizar requisitos acordados:** mantener el alcance alineado con el cliente y el tiempo del proyecto.
- **Proteger la información:** considerar seguridad y privacidad en los registros y accesos.
- **Facilitar el uso:** explicar y presentar información normativa compleja de manera clara.
- **Validar con evidencia:** no declarar una historia terminada sin revisión y pruebas pertinentes.
- **Mantener revisión humana:** la IA entrega apoyo, no dictámenes legales ni decisiones automáticas de cumplimiento.

**Fuera de las garantías del producto:** certificación ISO 27001 automática, asesoría jurídica vinculante y cumplimiento legal asegurado por el mero uso de la plataforma.

## 11. Decisiones pendientes de validación

| Tema | Pendiente |
|---|---|
| Aprobación de la visión | Responsable, acuerdo del equipo y fecha: [completar] |
| Alcance definitivo de la Ley N.º 21.719 | Requisitos priorizados y aprobados por el cliente: [completar] |
| Estado de cada módulo planificado | Confirmar qué se implementó, modificó, sustituyó o retiró: [completar] |
| Usuarios principales | Segmento objetivo y validación de necesidades: [completar] |
| Indicadores | Línea base, metas, responsables y resultados de prueba: [completar] |
| Nombre público del producto | Confirmar la denominación final NormIA/DANI en la documentación del repositorio: [completar] |

## 12. Fuentes y trazabilidad

1. **Documento de definición del proyecto APT**, `docs/entrega 1/1.5_GuiaEstudiante_Fase 1_Definicion Proyecto APT (Español).docx`:
   - Páginas 4 y 6: identificación del proyecto, necesidad del cliente y fundamento de incorporar la Ley N.º 21.719.
   - Página 10: objetivo general y objetivos específicos.
   - Página 11: metodología Scrum, etapas y sprints propuestos.
   - Páginas 13–15: plan de trabajo, responsables y secuencia de actividades.
   - Página 16: carta Gantt del proyecto.
2. **`README.md` del repositorio**, versión compartida en la conversación: descripción general de la plataforma GRC y de la base tecnológica; algunas menciones tecnológicas están pendientes de contrastar con el código.
3. **Historial de integración compartido por Git**, actualización de `main` hasta `662e1d2`: evidencia de cambios recientes, incluyendo eliminación o modificación de módulos. La existencia de un archivo o un commit no constituye por sí sola una prueba funcional.

---

**Mantenimiento:** revisar esta visión cuando el cliente o el equipo aprueben cambios de alcance. Registrar la ejecución y las desviaciones respecto del plan en `Sprint_Backlog.md`, y los criterios de aceptación en `Definition_of_Done.md`.
