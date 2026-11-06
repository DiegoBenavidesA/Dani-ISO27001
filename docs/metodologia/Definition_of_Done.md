# Definition of Done (DoD) — NormIA / DANI

> **Proyecto:** Plataforma GRC para la gestión del cumplimiento de ISO/IEC 27001:2022 y requisitos asociados a la Ley chilena N.º 21.719.  
> **Equipo:** desarrollo frontend, backend y coordinación/análisis.  
> **Naturaleza del documento:** acuerdo de calidad **propuesto para revisión y adopción por el equipo**. No constituye evidencia de que todos los cambios históricos hayan cumplido estos criterios.  
> **Fecha de aprobación del equipo:** [completar]  
> **Responsables de aprobación:** [completar]

## 1. Propósito

La *Definition of Done* (DoD) establece los criterios mínimos, verificables y compartidos para declarar **terminada** una historia de usuario, corrección o mejora de NormIA. Busca evitar que una tarea se dé por finalizada solo porque el código fue escrito, sin verificar su integración, funcionamiento, seguridad y documentación.

Se aplica a los incrementos de producto pertinentes al alcance actual: evaluaciones y preguntas de ISO 27001 y Ley N.º 21.719, análisis de brechas, evidencias, riesgos, gestión de organizaciones, vulneraciones de seguridad, asistente y otras funcionalidades que permanezcan vigentes en el repositorio. **No supone que los módulos retirados sigan activos.**

## 2. Criterios generales de terminado

Una tarea puede marcarse como **Done** únicamente cuando se cumplen los criterios aplicables y se dispone de evidencia de verificación:

- [ ] **Alcance claro:** la historia o incidencia describe el problema, el resultado esperado y sus criterios de aceptación; se confirma que la solución corresponde al alcance vigente.
- [ ] **Implementación completa:** el comportamiento solicitado funciona de principio a fin, sin datos de demostración presentados como reales ni funcionalidades simuladas como terminadas.
- [ ] **Integración:** los cambios de frontend, backend, base de datos y servicios externos involucrados son compatibles entre sí; no quedan errores conocidos que bloqueen el flujo principal.
- [ ] **Revisión de código:** el código es comprensible, evita duplicaciones innecesarias y se revisó por otro integrante cuando el proceso del equipo lo permite. Revisor: [completar].
- [ ] **Pruebas:** se ejecutaron las pruebas pertinentes (automáticas o manuales), se registraron sus resultados y se corrigieron los defectos bloqueantes.
- [ ] **Regresión:** se comprobó que las funciones relacionadas continúan operativas después del cambio.
- [ ] **Seguridad y privacidad:** no se exponen secretos, tokens ni información sensible en código, registros o capturas; se respetan permisos y aislamiento entre organizaciones cuando corresponda.
- [ ] **Experiencia de usuario:** se verifican estados de carga, éxito, error y vacío; los mensajes son comprensibles y los formularios validan sus datos.
- [ ] **Diseño adaptable:** si hay cambios visuales, la pantalla se comprueba en tamaños de escritorio y móvil, sin desbordes ni controles inaccesibles.
- [ ] **Documentación:** se actualizan instrucciones, requisitos, manuales o notas técnicas si el cambio modifica instalación, configuración, API, procesos o uso.
- [ ] **Control de versiones:** el trabajo queda registrado en Git con un commit identificable y sin archivos temporales, credenciales ni cambios ajenos a la tarea.
- [ ] **Validación final:** se demuestra el resultado frente a los criterios de aceptación y la persona responsable confirma su cierre. Responsable y fecha: [completar].

## 3. Comprobaciones específicas según el tipo de tarea

### 3.1 Frontend (React)

- [ ] La pantalla o componente permite completar el flujo previsto con datos reales o de prueba controlados.
- [ ] Se verifican navegación, permisos visibles, validaciones y manejo de respuestas fallidas del backend.
- [ ] La interfaz funciona en móvil y escritorio; no se pierde información relevante al reducir el ancho.
- [ ] Se mantiene consistencia visual y se comprueban etiquetas, mensajes y controles utilizables mediante teclado cuando corresponda.

### 3.2 Backend y API (FastAPI)

- [ ] Los endpoints validan entradas y devuelven respuestas y códigos HTTP coherentes.
- [ ] Se comprueba autenticación y autorización para rutas protegidas, incluyendo los roles aplicables.
- [ ] Cuando el recurso pertenece a una organización, se verifica que una cuenta no pueda consultar ni modificar datos de otra organización sin autorización.
- [ ] Los errores se manejan sin revelar información interna o secretos.
- [ ] Se agregan o actualizan pruebas para la lógica modificada, cuando es viable.

### 3.3 Base de datos y persistencia (PostgreSQL / Neon)

- [ ] Los cambios de esquema incluyen la migración necesaria y una forma documentada de aplicarla.
- [ ] Se verifica la integridad de relaciones y datos existentes; no se eliminan datos sin una decisión explícita y documentada.
- [ ] Se comprueba el guardado, consulta y actualización de datos y, cuando corresponde, su separación por organización.

### 3.4 Funciones con inteligencia artificial

- [ ] Se comprueba que la salida de IA sea identificable como asistencia o análisis, no como una decisión automáticamente validada.
- [ ] Se contempla la revisión humana cuando el resultado pueda influir en cumplimiento, riesgos o gestión de vulneraciones.
- [ ] Se manejan respuestas vacías, fallos del proveedor y tiempos de espera sin bloquear innecesariamente la aplicación.
- [ ] No se afirma que la IA garantice conformidad legal o certificación ISO 27001.

### 3.5 Vulneraciones de seguridad y datos personales

- [ ] Se verifican estados, responsables, permisos, registro de actuaciones y cierre según el flujo implementado.
- [ ] Las notificaciones, si forman parte de la tarea, se prueban sin divulgar datos a destinatarios incorrectos.
- [ ] Los plazos y obligaciones legales se contrastan con los requisitos aprobados del proyecto; no se asumen automáticamente a partir de una respuesta de IA.

### 3.6 Documentación y entregables académicos

- [ ] El contenido coincide con el alcance actual y distingue entre funcionalidades planificadas, implementadas y retiradas.
- [ ] Las afirmaciones de avance tienen respaldo en el repositorio, pruebas, actas o entregables disponibles.
- [ ] No se inventan métricas, aprobaciones, fechas ni resultados; los datos pendientes se señalan como **[completar]**.
- [ ] Los enlaces, nombres de archivos y rutas mencionados se verifican antes de entregar.

## 4. Evidencias mínimas para cerrar una tarea

Registrar, según corresponda:

| Evidencia | Qué se registra |
|---|---|
| Referencia de la tarea | ID o enlace a historia/incidencia: [completar] |
| Cambio realizado | Descripción breve y archivos o módulos afectados |
| Commit o solicitud de integración | Hash/enlace verificable: [completar] |
| Pruebas ejecutadas | Comando o pasos manuales, fecha y resultado |
| Comprobación visual | Captura o descripción de la revisión móvil/escritorio, si aplica |
| Revisión y aceptación | Nombre/rol de quien revisa y confirma: [completar] |
| Observaciones | Riesgos residuales, limitaciones o tareas posteriores |

## 5. Condiciones que impiden declarar «Done»

Una tarea **no** está terminada si presenta un defecto bloqueante; no cumple un criterio de aceptación; permite accesos no autorizados; mezcla información entre organizaciones; depende de una configuración secreta no documentada; rompe un flujo existente; o requiere pruebas esenciales que todavía no se han ejecutado.

Cuando algún criterio no aplique, debe indicarse **«No aplica»** con una razón breve. Si queda una limitación aceptada, debe documentarse y contar con la conformidad de la persona responsable; no se debe ocultar como tarea finalizada sin observaciones.

## 6. Relación con el trabajo por sprints

Al finalizar cada historia del `Sprint_Backlog.md`, el equipo revisa esta lista y adjunta las evidencias disponibles. En la revisión del sprint se demuestra el incremento; en la retrospectiva se registran los problemas del proceso y las mejoras propuestas. La DoD puede actualizarse mediante acuerdo del equipo, manteniendo historial de cambios.

## 7. Registro de adopción y mantenimiento

| Campo | Registro |
|---|---|
| Versión inicial del documento | 1.0 — propuesta |
| Fecha de revisión por el equipo | [completar] |
| Acuerdo de adopción | [completar] |
| Responsable de mantenerla | [completar] |
| Próxima revisión | [completar] |

**Nota de trazabilidad:** los commits del proyecto permiten observar trabajo de implementación, pruebas y documentación, pero por sí solos **no prueban** que existiera una DoD formal ni que todas las historias históricas cumplieran cada criterio. Esta definición debe ser revisada y acordada por el equipo antes de presentarla como política ya aplicada.
