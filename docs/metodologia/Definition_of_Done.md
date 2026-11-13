
# Definition of Done (DoD) — NormIA

**Proyecto:** Plataforma GRC para ISO/IEC 27001:2022 y requisitos asociados a la Ley chilena N.º 21.719.  
**Producto:** NormIA / DANI.  
**Metodología:** Enfoque ágil basado en Scrum.  
**Etapa:** Cierre de fase 3 del proyecto académico.  
**Referencia técnica:** Repositorio `DiegoBenavidesA/Dani-ISO27001`, rama `main`.  
**Naturaleza:** Criterios de calidad y finalización de tareas del proyecto.

## 1. Propósito

La Definition of Done (DoD) establece las condiciones que debe cumplir una historia de usuario, corrección o mejora de NormIA para considerarse terminada.

Su objetivo es asegurar que el desarrollo no se limite a escribir código, sino que contemple el cumplimiento de los criterios de aceptación, la integración, la seguridad, las pruebas, la documentación y la trazabilidad.

La DoD complementa los criterios de aceptación de cada historia de usuario. Mientras estos indican qué comportamiento debe entregar una funcionalidad, la DoD establece las condiciones generales de calidad necesarias para declarar terminado ese trabajo.

La existencia de una implementación o un commit no demuestra por sí sola que todas las comprobaciones se hayan realizado satisfactoriamente.

## 2. Alcance funcional vigente

La DoD se aplica a las funcionalidades presentes en la versión revisada de NormIA:

- Evaluaciones de ISO/IEC 27001:2022.
- Evaluación de requisitos asociados a la Ley N.º 21.719.
- Análisis de brechas y resultados de cumplimiento.
- Gestión de riesgos y controles.
- Gestión documental y evidencias.
- Administración de usuarios y organizaciones.
- Autenticación y autorización mediante roles.
- Gestión de vulneraciones de seguridad y datos personales.
- Funcionalidades de inteligencia artificial.
- Mejoras de interfaz y adaptación a dispositivos móviles.

### 2.1. Ajustes de alcance relacionados con la Ley N.º 21.719

La planificación original contempló módulos independientes de tratamientos, consentimientos, solicitudes de titulares, proveedores y evaluación de impacto.

Durante el desarrollo, estos módulos fueron retirados de las rutas activas de la API.

La evaluación de aspectos de la Ley N.º 21.719 se incorporó al sistema de preguntas y análisis de cumplimiento. El archivo `app/data/catalogo_ley21719.json` contiene ocho categorías de obligaciones y 24 preguntas asociadas.

El módulo de vulneraciones permanece integrado mediante `/api/breaches`.

Por lo tanto, la DoD se aplica al alcance vigente del producto y no considera terminados los módulos independientes retirados.

## 3. Criterios generales de terminado

Una historia de usuario, corrección o mejora puede clasificarse como **Done (Terminada)** cuando cumple sus criterios de aceptación y las condiciones de calidad aplicables.

- [ ] **Requisitos y aceptación:** el resultado corresponde a una necesidad identificada y cumple los criterios de aceptación definidos.
- [ ] **Alcance vigente:** la funcionalidad forma parte de la versión actual del producto.
- [ ] **Implementación completa:** el comportamiento solicitado está desarrollado y no depende de funcionalidades simuladas presentadas como definitivas.
- [ ] **Integración:** los componentes involucrados se comunican correctamente.
- [ ] **Persistencia:** las operaciones que requieren almacenamiento utilizan los modelos y servicios correspondientes.
- [ ] **Validación de datos:** las entradas incorrectas reciben un tratamiento adecuado.
- [ ] **Autenticación y autorización:** se aplican los controles de acceso correspondientes.
- [ ] **Aislamiento por organización:** los recursos asociados a una empresa mantienen las restricciones de acceso necesarias.
- [ ] **Pruebas:** se realizan las comprobaciones pertinentes y se registran sus resultados.
- [ ] **Regresión:** se revisa que los cambios no afecten negativamente las funcionalidades relacionadas.
- [ ] **Experiencia de usuario:** los formularios, mensajes y estados de la interfaz permiten utilizar la funcionalidad correctamente.
- [ ] **Diseño adaptable:** los cambios visuales se comprueban en los dispositivos correspondientes.
- [ ] **Documentación:** los cambios relevantes se reflejan en los documentos técnicos y funcionales.
- [ ] **Control de versiones:** las modificaciones quedan registradas mediante commits identificables.
- [ ] **Verificación final:** el resultado se contrasta con los criterios de aceptación antes de clasificar la tarea como terminada.

Cuando un criterio no corresponde al tipo de tarea, puede registrarse como **No aplica**, indicando brevemente el motivo.

Las casillas representan comprobaciones por tarea. No constituyen un registro de pruebas ya ejecutadas ni de aceptación automática de todas las funcionalidades.

## 4. Comprobaciones específicas según el tipo de tarea

### 4.1. Frontend — React

Para las funcionalidades relacionadas con interfaces de usuario se consideran los siguientes criterios:

- [ ] La pantalla o componente está integrado en la navegación correspondiente.
- [ ] El usuario puede completar el flujo previsto.
- [ ] Las solicitudes utilizan los servicios de API definidos.
- [ ] Los formularios validan la información ingresada.
- [ ] Se presentan mensajes ante errores y operaciones completadas.
- [ ] Los controles visibles respetan los permisos del usuario.
- [ ] La interfaz mantiene consistencia con el diseño general de NormIA.
- [ ] Se comprueba la visualización en escritorio y dispositivos móviles.
- [ ] No existen desbordamientos o elementos inaccesibles que impidan utilizar el flujo principal.

**Referencia de implementación:**

El repositorio contiene interfaces relacionadas con evaluaciones, análisis de brechas, riesgos, documentos, evidencias, usuarios, organizaciones y vulneraciones.

También incorpora rutas protegidas y adaptaciones visuales para diferentes tamaños de pantalla.

La existencia de estas implementaciones no sustituye su comprobación funcional y visual.

### 4.2. Backend y API — FastAPI

Para las funcionalidades del backend se consideran los siguientes criterios:

- [ ] Los endpoints implementan las operaciones correspondientes.
- [ ] Las entradas se validan mediante los esquemas definidos.
- [ ] Las respuestas y códigos HTTP son coherentes con el resultado de la operación.
- [ ] Las rutas protegidas exigen autenticación.
- [ ] Los permisos se comprueban en el backend.
- [ ] Los recursos asociados a organizaciones utilizan el contexto correspondiente.
- [ ] Los errores se manejan sin exponer información interna innecesaria.
- [ ] Se comprueban las operaciones mediante pruebas pertinentes.
- [ ] Los cambios no interrumpen las funcionalidades relacionadas.

**Referencia de implementación:**

El archivo `app/main.py` integra las rutas principales de la plataforma.

El proyecto contiene dependencias de autenticación y autorización en `app/dependencies/auth.py` y mecanismos de filtrado por organización en `app/dependencies/tenant.py`.

Estos componentes respaldan la existencia de controles implementados. Su funcionamiento completo debe comprobarse mediante pruebas.

### 4.3. Base de datos y persistencia — PostgreSQL

Para las tareas relacionadas con almacenamiento de información se consideran los siguientes criterios:

- [ ] Los modelos representan correctamente los datos requeridos.
- [ ] Las relaciones entre entidades mantienen coherencia.
- [ ] Las operaciones de creación, consulta y actualización funcionan según lo definido.
- [ ] Los cambios de esquema cuentan con un procedimiento de aplicación.
- [ ] Se considera la conservación de los datos existentes.
- [ ] No se eliminan registros sin una decisión explícita.
- [ ] Los datos asociados a organizaciones utilizan los identificadores correspondientes.
- [ ] La integración entre backend y base de datos permite ejecutar las operaciones previstas.

**Referencia de implementación:**

El backend contiene modelos SQLAlchemy relacionados con usuarios, organizaciones, riesgos, evaluaciones, evidencias y vulneraciones.

También incorpora lógica de inicialización y modificación del esquema de base de datos.

La revisión del código no equivale a una validación completa de las migraciones ni de la integridad de los datos desplegados.

### 4.4. Funcionalidades con inteligencia artificial

Para las funcionalidades asistidas por inteligencia artificial se consideran los siguientes criterios:

- [ ] La funcionalidad utiliza los servicios de IA configurados.
- [ ] Las respuestas se presentan como asistencia al análisis.
- [ ] Se manejan errores del proveedor, respuestas vacías y resultados inválidos.
- [ ] Se contempla revisión humana cuando el resultado influye en decisiones relevantes.
- [ ] No se presenta una respuesta de IA como certificación ISO o garantía de cumplimiento legal.
- [ ] Se considera la protección de información sensible.
- [ ] Se comprueba el comportamiento del sistema ante respuestas válidas y fallidas.

**Referencia de implementación:**

El backend incorpora servicios de inteligencia artificial para apoyar diferentes funciones de NormIA.

En el módulo de vulneraciones, la IA propone una gravedad, identifica posibles datos afectados y sugiere acciones.

El flujo contempla revisión humana antes de confirmar la gravedad y continuar con las etapas posteriores.

Estas funcionalidades no sustituyen la validación profesional de decisiones relacionadas con seguridad o cumplimiento normativo.

### 4.5. Vulneraciones de seguridad y datos personales

Para las tareas relacionadas con el módulo de vulneraciones se consideran los siguientes criterios:

- [ ] El usuario autorizado puede registrar una vulneración.
- [ ] El registro queda asociado a la organización correspondiente.
- [ ] Se conserva la descripción y fecha de detección.
- [ ] Se procesa el análisis de IA o se registra su error.
- [ ] Un responsable autorizado puede revisar y confirmar la gravedad.
- [ ] Se controlan las transiciones entre los estados definidos.
- [ ] Se registra la confirmación de notificación cuando corresponde.
- [ ] El cierre exige la información requerida por el flujo.
- [ ] Se aplican las restricciones de acceso.
- [ ] Se comprueban los casos válidos e inválidos.

**Referencia de implementación:**

El archivo `app/routes/breaches.py` contiene operaciones para registrar, consultar, analizar, revisar, marcar como notificada, resolver y eliminar vulneraciones.

El frontend incluye la pantalla `BreachesScreen.jsx`.

El repositorio también contiene pruebas específicas de lógica, permisos y flujo de vulneraciones.

**Alcance de la notificación:** la operación de notificación a la Agencia registra la confirmación de que esta se realizó. No constituye un envío automático a la autoridad.

La aplicación de plazos y obligaciones legales debe revisarse conforme a los requisitos del proyecto y no considerarse validada únicamente por la lógica implementada.

### 4.6. Documentación y entregables académicos

Para las tareas de documentación se consideran los siguientes criterios:

- [ ] El contenido corresponde al alcance vigente del proyecto.
- [ ] Se distinguen funcionalidades planificadas, implementadas y retiradas.
- [ ] Las afirmaciones sobre avances cuentan con respaldo documental o técnico.
- [ ] No se presentan resultados de pruebas o aprobaciones sin evidencia.
- [ ] Los nombres de archivos, rutas y enlaces se revisan antes de publicar.
- [ ] El documento mantiene coherencia con los demás entregables.
- [ ] La información se presenta de manera clara y organizada.

## 5. Evidencias para cerrar una tarea

Las evidencias permiten relacionar cada tarea con su implementación y comprobación.

| Evidencia | Información que respalda |
|---|---|
| Historia de usuario o incidencia | Identificación de la tarea y sus criterios de aceptación |
| Cambio realizado | Descripción de la funcionalidad o corrección |
| Código fuente | Implementación desarrollada |
| Commit de Git | Registro versionado del cambio |
| Pruebas automatizadas | Resultado de comprobaciones reproducibles |
| Pruebas manuales | Verificación de flujos y comportamientos |
| Capturas de pantalla | Comprobación visual, cuando corresponde |
| Documentación técnica | Información de configuración, integración o funcionamiento |
| Revisión funcional | Contraste con los criterios de aceptación |
| Observaciones | Limitaciones conocidas, riesgos residuales o mejoras posteriores |

La evidencia necesaria depende de la naturaleza de la tarea.

No todas las tareas requieren las mismas pruebas, pero cada una debe contar con información suficiente para justificar su estado.

Un commit demuestra que se realizaron cambios en el repositorio, pero no constituye por sí solo una prueba de funcionamiento.

## 6. Pruebas identificadas en el repositorio

La revisión de la rama `main` permitió identificar los siguientes archivos y recursos:

| Archivo o recurso | Finalidad |
|---|---|
| `tests/test_integration_auth.py` | Comprobaciones de autenticación y restricciones de roles |
| `tests/test_breaches_permisos.py` | Comprobaciones de permisos del módulo de vulneraciones |
| `tests/test_breaches_logica.py` | Pruebas de lógica, validaciones y procesamiento |
| `tests/test_breaches_flujo.py` | Comprobaciones del flujo de revisión, notificación y cierre |
| `tests/test_api.py` | Pruebas de operaciones generales de la API |
| `Producto/docker-compose.yml` | Configuración de servicios de frontend, backend y PostgreSQL |
| `Sprint_Backlog.md` | Seguimiento del trabajo y registro de avances |

El Sprint Backlog documenta tres pruebas automatizadas de autenticación y roles aprobadas y pruebas manuales relacionadas con vulneraciones.

La revisión del repositorio confirma la presencia de estos recursos, pero no representa una nueva ejecución de la batería de pruebas.

La validación técnica completa se realizará de manera separada y sus resultados deberán incorporarse a las evidencias correspondientes.

## 7. Condiciones que impiden declarar una tarea como Done

Una tarea no debe considerarse terminada cuando:

- No cumple sus criterios de aceptación.
- Presenta errores bloqueantes en el flujo principal.
- Existen errores de integración que impiden utilizar la funcionalidad.
- Permite accesos no autorizados.
- Expone información entre organizaciones.
- Contiene credenciales o secretos que comprometen la seguridad.
- Requiere pruebas esenciales que no se han realizado.
- Provoca fallas en funcionalidades relacionadas.
- Presenta una funcionalidad simulada como completamente operativa.
- Declara una integración externa que no está implementada.
- Presenta resultados de pruebas sin evidencia.

Las limitaciones conocidas deben documentarse y evaluarse según su impacto.

Cuando un criterio no corresponde a la tarea, puede registrarse como **No aplica**, indicando el motivo.

## 8. Aspectos técnicos que requieren comprobación

### 8.1. Gestión de credenciales

El código de inicialización contempla credenciales predeterminadas para una cuenta de administración.

Su existencia requiere comprobar que los entornos de despliegue utilicen configuraciones seguras y que las credenciales de desarrollo no permanezcan activas en producción.

### 8.2. Ejecución de pruebas

El proyecto dispone de pruebas automatizadas para autenticación, permisos y vulneraciones.

La ejecución de estas pruebas y el registro de sus resultados forman parte de la verificación técnica del producto.

### 8.3. Ejecución mediante Docker

El repositorio contiene Dockerfiles y una configuración de Docker Compose para frontend, backend y PostgreSQL.

La comprobación de portabilidad requiere construir y ejecutar los servicios y verificar su comunicación.

### 8.4. Registro de notificaciones de vulneraciones

El módulo contempla revisión humana, registro de notificación y cierre.

El registro de notificación representa una confirmación interna y no un envío automático a la Agencia de Protección de Datos Personales.

## 9. Relación con el trabajo por sprints

La Definition of Done complementa las actividades realizadas mediante el enfoque Scrum del proyecto.

### Planificación

Las historias de usuario y tareas se organizan según los requisitos, las necesidades del producto y sus criterios de aceptación.

La DoD establece las condiciones generales de calidad que deben considerarse.

### Desarrollo

Durante el sprint se implementan funcionalidades, correcciones o mejoras.

El trabajo puede involucrar frontend, backend, base de datos, integración, pruebas y documentación.

### Revisión

El resultado se contrasta con los criterios de aceptación y las comprobaciones técnicas aplicables.

La revisión permite identificar defectos, limitaciones y correcciones necesarias.

### Retrospectiva

Las dificultades relacionadas con implementación, integración, pruebas y coordinación sirven como base para identificar oportunidades de mejora.

Los aprendizajes se documentan en `Retrospectivas.md`.

## 10. Responsabilidades del equipo

Las responsabilidades se relacionan con los roles desempeñados durante el desarrollo.

| Integrante | Rol | Área principal |
|---|---|---|
| Justo Cano | Líder de proyecto / Analista | Requisitos, alcance, criterios de aceptación y documentación |
| Raúl Barrera | Desarrollo backend | API, lógica de negocio, integración, persistencia y seguridad |
| Celine Alcaíno | Desarrollo frontend | Interfaces, navegación, formularios y adaptación visual |

La calidad del producto es una responsabilidad compartida.

La participación de cada integrante en la revisión depende de los componentes involucrados en la tarea.

## 11. Relación con los documentos del proyecto

| Documento | Relación con la DoD |
|---|---|
| `Product_Vision.md` | Describe el problema, los usuarios, la propuesta de valor y los objetivos del producto |
| `Sprint_Backlog.md` | Organiza las tareas y registra el avance del desarrollo |
| `Requisitos_No_Funcionales.md` | Define atributos de calidad esperados del sistema |
| `Retrospectivas.md` | Documenta dificultades, aprendizajes y oportunidades de mejora |
| `README.md` | Presenta la plataforma, su arquitectura y sus aspectos técnicos |

La DoD no reemplaza los requisitos funcionales ni los requisitos no funcionales.

Su función es establecer las condiciones generales necesarias para considerar terminado un trabajo.

## 12. Criterio de cierre de la fase 3

Para el cierre documental del proyecto se distinguen los siguientes estados:

| Estado | Significado |
|---|---|
| Planificado | Funcionalidad o tarea considerada en el alcance original |
| Implementado | Existe código o un entregable relacionado con el resultado esperado |
| Verificado | Se dispone de evidencia de pruebas o revisión funcional |
| Done | Se cumplen los criterios de aceptación y las condiciones aplicables de la DoD |
| Retirado del alcance | Funcionalidad que dejó de formar parte de la versión vigente |

Estos estados permiten describir el desarrollo sin confundir la existencia de código con la finalización validada de una tarea.

La DoD sirve como referencia para revisar el cumplimiento de las tareas del proyecto. La validación técnica final se documentará mediante los resultados de las pruebas y revisiones correspondientes.

## 13. Conclusión

La **Definition of Done de NormIA** establece criterios claros para determinar cuándo una historia de usuario, corrección o mejora reúne las condiciones necesarias para considerarse terminada.

Los criterios abarcan el cumplimiento de requisitos, la implementación funcional, la integración, las pruebas, la seguridad, la privacidad, la experiencia de usuario, la documentación y la trazabilidad.

La revisión del repositorio confirma la existencia de implementaciones relacionadas con evaluaciones, análisis de brechas, gestión de riesgos, documentos, evidencias, usuarios, organizaciones, inteligencia artificial y vulneraciones de seguridad.

También confirma la presencia de archivos de pruebas y configuración de infraestructura.

El cumplimiento de los criterios de aceptación y de la DoD para cada tarea debe respaldarse mediante las evidencias de verificación correspondientes.

Este documento constituye la referencia de calidad para el cierre de la fase 3, manteniendo coherencia con el alcance implementado y diferenciando las funcionalidades desarrolladas de las comprobaciones técnicas que deben acreditarse.

---

**Documento:** Definition of Done — NormIA.  
**Etapa:** Cierre de fase 3.  
**Referencia:** Rama `main` del repositorio del proyecto.  
**Uso:** Criterios de calidad, aceptación, verificación y trazabilidad de tareas.
