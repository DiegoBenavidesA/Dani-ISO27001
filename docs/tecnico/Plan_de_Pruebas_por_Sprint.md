# Plan de pruebas por sprint de NormIA

Este documento detalla qué se probó en cada sprint, cómo se probó, qué defectos aparecieron y cuál es el estado actual de esas pruebas. Complementa el [Plan de Pruebas](Plan_de_Pruebas.md), que define los tipos de prueba, los casos generales (PT-01 a PT-22) y cómo ejecutarlos. Los sprints y sus historias están en el [Sprint Backlog](../metodologia/Sprint_Backlog.md) y el [Product Backlog](../metodologia/Product_Backlog.md).

## Cómo leer este documento

- Cada caso de prueba se deriva del criterio de aceptación de una historia de usuario.
- En los sprints 1 a 4 las pruebas fueron funcionales y manuales, por módulo (así lo indica la guía 2.4 de la Fase 2). No se guardó un registro formal de cada ejecución; la evidencia son los defectos encontrados y los commits que los corrigieron.
- Desde el sprint de cierre las pruebas son automatizadas y se pueden repetir con `pytest`. Sus resultados están registrados con fecha.
- Los sprints 1 a 3 se retiraron del alcance el 30 de octubre de 2026 por indicación del docente (commit `390b324`). Sus casos ya no se pueden ejecutar porque el código se quitó; se documentan como historial.

## Resumen

| Sprint | Módulo | Semanas del plan | Tipo de prueba | Casos | Defectos corregidos | Estado actual |
|---|---|---|---|---|---|---|
| 1 | Registro de tratamientos (RoPA) | 6 a 8 | Manual | 5 | 4 | Retirado |
| 2 | Consentimientos | 8 a 10 | Manual | 6 | 5 | Retirado |
| 3 | Solicitudes de titulares | 10 a 12 | Manual | 4 | 2 | Retirado |
| 4 | Brechas, luego Vulneraciones de seguridad | 12 a 14 | Manual y automatizada | 9 | 2 | 17 pruebas automatizadas aprobadas |
| Cierre | Evaluación Ley 21.719, seguridad, rendimiento y despliegue | 14 a 16 | Automatizada | 32 en pytest, 21 de seguridad y 10 de rendimiento contra el sistema | 6 | Todas aprobadas |

## Sprint 1: Registro de actividades de tratamiento (RoPA)

Historia principal: PB-25. Desarrollo entre el 14 de septiembre y el 9 de octubre de 2026 (commits `d60d075`, `a401f7c`, `731e97f`).

| ID | Caso | Resultado esperado | Tipo |
|---|---|---|---|
| S1-T01 | Crear un tratamiento desde el botón "Nuevo tratamiento" | Se guarda y aparece en la lista de la empresa | Manual |
| S1-T02 | Extraer tratamientos de un documento con IA | Se registran los tratamientos encontrados en el documento | Manual |
| S1-T03 | Repetir la extracción sobre el mismo documento | No se duplican tratamientos ya registrados | Manual |
| S1-T04 | Eliminar un tratamiento | Desaparece de la lista y de la base de datos | Manual |
| S1-T05 | Entrar con un usuario de otra empresa | No ve los tratamientos de la primera | Manual |

Defectos encontrados y corregidos:

| Commit | Fecha | Defecto | Caso |
|---|---|---|---|
| `7ac7d77` | 21-09-2026 | El botón "Nuevo tratamiento" no hacía nada y la API no tenía el método de creación | S1-T01 |
| `2a2d255` | 09-10-2026 | La IA duplicaba tratamientos y no existía la opción de eliminar | S1-T03, S1-T04 |
| `6cfcb7c` | 09-10-2026 | Cuando la API devolvía la lista vacía, la pantalla mostraba 3 tratamientos inventados que no se podían borrar | S1-T04 |
| `527fd77` | 29-10-2026 | Había dos rutas DELETE para el mismo recurso | S1-T04 |

Estado actual: retirado. Las tablas `data_treatments` se conservan en la base de datos.

## Sprint 2: Gestión de consentimientos

Historias principales: PB-26 y PB-27. Desarrollo entre el 16 de septiembre y el 11 de octubre de 2026 (commits `2ec1e88`, `464ded7`, `e6221ba`).

| ID | Caso | Resultado esperado | Tipo |
|---|---|---|---|
| S2-T01 | Crear un consentimiento asociado a un tratamiento | Se guarda con estado pendiente | Manual |
| S2-T02 | Crear un consentimiento con un tratamiento inexistente | Error 400 con un mensaje claro | Manual |
| S2-T03 | Enviar el consentimiento al titular por correo | El titular recibe el enlace; si el correo falla, el consentimiento igual se guarda | Manual |
| S2-T04 | El titular acepta desde el enlace público | El estado cambia a otorgado y queda en el historial | Manual |
| S2-T05 | El titular revoca desde el enlace público | El estado cambia a revocado y queda en el historial | Manual |
| S2-T06 | Crear un consentimiento desde el frontend en producción | La solicitud llega al backend sin errores de CORS | Manual |

Defectos encontrados y corregidos:

| Commit | Fecha | Defecto | Caso |
|---|---|---|---|
| `7ac7d77` | 21-09-2026 | Un tratamiento inexistente provocaba error 500 por llave foránea; el ID del tratamiento se escribía a mano | S2-T01, S2-T02 |
| `798ff0b` | 09-10-2026 | El enlace público apuntaba a `localhost`, un fallo de correo devolvía 500 y la revocación usaba un estado mal escrito | S2-T03, S2-T05 |
| `43db093` | 09-10-2026 | La ruta sin barra final provocaba una redirección 307 que el navegador bloqueaba por CORS | S2-T06 |
| `7e8e3f7` | 11-10-2026 | En la base de datos existente faltaba el estado `PENDIENTE` y la fecha de otorgamiento era obligatoria, lo que impedía crear consentimientos | S2-T01 |
| `3551b90` | 09-10-2026 | El correo al titular no incluía el enlace al canal de solicitudes | S2-T03 |

Estado actual: retirado. Las tablas `consents` y `consent_history` se conservan.

## Sprint 3: Solicitudes de derechos de los titulares

Historia principal: PB-28. Desarrollo entre el 16 de septiembre y el 9 de octubre de 2026 (commits `2ec1e88`, `a208730`, `19ca5c8`).

| ID | Caso | Resultado esperado | Tipo |
|---|---|---|---|
| S3-T01 | El titular envía una solicitud desde el canal público | Llega a la bandeja de la empresa | Manual |
| S3-T02 | Calcular el plazo legal de respuesta | Muestra los días restantes según la fecha de la solicitud | Manual |
| S3-T03 | Cambiar el estado de una solicitud | El cambio se guarda | Manual |
| S3-T04 | Revisar la bandeja con un usuario de otra empresa | No ve las solicitudes de la primera | Manual |

Defectos encontrados y corregidos:

| Commit | Fecha | Defecto | Caso |
|---|---|---|---|
| `7ac7d77` | 21-09-2026 | Las fechas llegaban en UTC sin zona horaria y el contador del plazo se desfasaba según la hora de Chile | S3-T02 |
| `4e17eae` | 09-10-2026 | El frontend enviaba PATCH y el backend solo aceptaba PUT, por lo que no se podía actualizar una solicitud | S3-T03 |

Estado actual: retirado. La tabla `data_subject_requests` se conserva.

## Sprint 4: Brechas de datos, rediseñado como Vulneraciones de seguridad

Historias principales: PB-01 a PB-07. La primera versión se desarrolló entre el 16 de septiembre y el 20 de octubre de 2026 (commits `2ec1e88`, `71841df`, `a7546ca`). El 5 de noviembre se rediseñó con análisis de IA, revisión humana, aviso a responsables y cierre (commit `f259ef3`).

| ID | Caso | Resultado esperado | Tipo | Archivo de prueba |
|---|---|---|---|---|
| S4-T01 | Registrar una vulneración con una descripción de menos de 10 caracteres | Error 422 | Automatizada | `test_breaches_permisos.py` |
| S4-T02 | Acceder al módulo sin token, como empleado, manager o auditor | 401 o 403 | Automatizada | `test_breaches_permisos.py` |
| S4-T03 | Acceder como owner o superadmin con empresa seleccionada | 200 | Automatizada | `test_breaches_permisos.py` |
| S4-T04 | Interpretar la respuesta de la IA, incluso dentro de bloques de código o con una gravedad inválida | Devuelve todas las claves y normaliza la gravedad | Automatizada | `test_breaches_logica.py` |
| S4-T05 | Calcular el plazo de 72 horas desde la detección, considerando la zona horaria | Fecha límite exacta en UTC | Automatizada | `test_breaches_flujo.py`, `test_breaches_logica.py` |
| S4-T06 | Notificar a la Agencia sin revisión confirmada | Rechazado | Automatizada | `test_breaches_flujo.py` |
| S4-T07 | Cerrar una vulneración que requiere notificación y no fue notificada | Rechazado | Automatizada | `test_breaches_flujo.py` |
| S4-T08 | Cerrar una vulneración que no requiere notificación | Estado cerrada con causa raíz y resolución | Automatizada | `test_breaches_flujo.py` |
| S4-T09 | Ver el contador de plazo en la pantalla de vulneraciones | Muestra las horas restantes o el plazo vencido | Manual | |

Defectos encontrados y corregidos:

| Commit | Fecha | Defecto | Caso |
|---|---|---|---|
| `7ac7d77` | 21-09-2026 | El contador de 72 horas se desfasaba por la zona horaria | S4-T05 |
| `f31bdbc` | 03-11-2026 | La pantalla fallaba con "diasRestantes is not defined" al mostrar el plazo | S4-T09 |

Resultado de la ejecución automatizada (13-11-2026): 17 de 17 pruebas aprobadas (6 de permisos, 7 de lógica y 4 de flujo).

## Sprint de cierre: evaluación de la Ley 21.719, seguridad, rendimiento y despliegue

Después del retiro de módulos, la Ley 21.719 pasó a evaluarse con 24 preguntas y se reforzaron la seguridad, el rendimiento y el despliegue. En este sprint todas las pruebas se automatizaron.

| ID | Caso | Resultado esperado | Archivo de prueba |
|---|---|---|---|
| SC-T01 | `GET /health` | 200 y `{"status": "healthy"}` | `test_general.py` |
| SC-T02 | Preflight CORS desde un origen permitido y desde uno no permitido | Solo el permitido recibe la cabecera de acceso | `test_general.py` |
| SC-T03 | Login sin contraseña | 422 | `test_general.py` |
| SC-T04 | Rutas protegidas sin token, con rol sin permiso y superadmin sin empresa | 401 o 403 | `test_integration_auth.py` |
| SC-T05 | Tokens con otra firma, expirados, sin firma, alterados o de activación | 401 | `test_seguridad.py` |
| SC-T06 | Usuario normal envía `X-Org-Id` de otra empresa | Se ignora y usa su propia empresa | `test_seguridad.py` |
| SC-T07 | Asignación de roles (anti-escalada) | Ningún admin crea owner ni superadmin | `test_seguridad.py` |
| SC-T08 | Usuario suspendido o eliminado con un token vigente | 401 | `test_seguridad.py` |
| SC-T09 | Más de 5 intentos fallidos de inicio de sesión | 429 durante 15 minutos | `test_seguridad.py` |
| SC-T10 | Dos empresas reales: ver, modificar o borrar datos de la otra | 404 y los datos quedan intactos | `security/prueba_seguridad.py` |
| SC-T11 | Lecturas sin IA (100 solicitudes por endpoint) y 20 lecturas concurrentes | p95 bajo 2 s y bajo 5 s | `performance/prueba_rendimiento.py` |
| SC-T12 | Levantar el sistema completo con `docker compose up --build` | Backend responde `healthy`, frontend carga y el login funciona | Manual |

Defectos encontrados y corregidos:

| Commit | Defecto | Caso |
|---|---|---|
| `5a82ce1` | El enlace de activación de cuenta servía como token de sesión | SC-T05 |
| `794627d` | Un usuario suspendido seguía entrando con su token anterior | SC-T08 |
| `9b6003a` | El inicio de sesión aceptaba intentos ilimitados | SC-T09 |
| `4e2ac59` | El Dockerfile del frontend fallaba en `npm ci` porque el lock no estaba sincronizado | SC-T12 |
| `4f7f302` | El log de arranque mostraba el usuario y la contraseña de la base de datos | SC-T12 |
| `9538731` | El docker-compose anterior no levantaba el backend ni el frontend | SC-T12 |

Resultados (13-11-2026):

- `pytest tests --ignore=tests/test_api.py`: 49 de 49 pruebas aprobadas, de las cuales 32 corresponden a este sprint (25 de seguridad, 4 generales y 3 de autenticación).
- `security/prueba_seguridad.py` contra el sistema en Docker: 21 de 21 aprobadas.
- `performance/prueba_rendimiento.py` contra el sistema en Docker: 10 de 10 mediciones dentro de los límites. El detalle está en las secciones 5.1 y 5.2 del [Plan de Pruebas](Plan_de_Pruebas.md).

Pendiente en este sprint: la evaluación de la Ley 21.719 por preguntas no tiene pruebas automatizadas, porque depende de la respuesta de la IA. Se prueba manualmente desde el Análisis de Brechas.

## Lo que cambió en la forma de probar

En los sprints 1 a 3 las pruebas manuales no detectaron varios defectos hasta que el módulo llegó a producción: el error de CORS, los errores 500 al crear consentimientos y el enlace que apuntaba a `localhost`. Por eso, desde el sprint 4 las reglas de negocio de vulneraciones y los controles de acceso tienen pruebas automatizadas que se pueden repetir después de cada cambio.
