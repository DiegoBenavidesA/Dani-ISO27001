# Sprint de cierre

Último sprint del proyecto, previo a la Entrega 3. La Entrega 3 revisa la plataforma completa en funcionamiento y la documentación, por lo que el sprint prioriza que todo funcione en producción y que los documentos coincidan con el sistema.

- Inicio: 14-11-2026.
- Seguimiento: tablero de GitHub Projects del repositorio, que se crea al iniciar el sprint, con las columnas Por hacer, En curso y Hecho.
- Reuniones: por Google Meet, registradas en [actas](actas/README.md).
- Cierre: retrospectiva con su acta.

Cada tarea de esta lista se crea como un *issue* en el tablero. Al terminarla se enlaza el commit que la resuelve escribiendo `Closes #número` en el mensaje del commit. Los responsables son una propuesta según los roles de la Entrega 1 (Raúl en backend, Celine en frontend y Justo como líder y analista) y el equipo puede cambiarlos en el tablero.

## Tareas

| ID | Tarea | Criterio de aceptación | Prioridad | Responsable propuesto | Relacionada con |
|---|---|---|---|---|---|
| SC-01 | Mantener el backend de producción activo | UptimeRobot consulta `/health` cada 5 minutos y la plataforma responde sin la espera de reactivación de Render | Alta | Justo | RNF-13, RNF-16 |
| SC-02 | Revisar la plataforma completa en producción | Lista de comprobación con cada módulo probado con cada rol (superadmin, owner, admin, DPO, manager, auditor y empleado); cada falla encontrada se registra como un issue nuevo | Alta | Los tres | Entrega 3 |
| SC-03 | Limitar a 10 MB el tamaño de las evidencias | El backend rechaza archivos de más de 10 MB con un mensaje claro y la pantalla lo valida antes de subir; prueba automatizada de PT-20 | Alta | Raúl (backend) y Celine (pantalla) | RNF-03, PT-20 |
| SC-04 | Permitir que cualquier trabajador reporte una vulneración | Un empleado puede registrar un incidente desde el Portal de Empleados y owner, admin y DPO reciben el aviso; revisar, notificar y cerrar siguen restringidos; pruebas de permisos actualizadas | Alta | Raúl (backend) y Celine (pantalla) | PB-31, caso 5.11 |
| SC-05 | Recuperar la contraseña por correo | "¿Olvidaste tu contraseña?" envía un enlace de un solo uso que vence en una hora; el enlace no sirve como sesión; pruebas automatizadas | Media | Raúl (backend) y Celine (pantalla) | Caso 1.6 |
| SC-06 | Agregar los intereses profesionales individuales a la guía 2.6 | Cada integrante escribe los suyos en primera persona y se reemplaza el texto en plural | Alta | Los tres | Rúbrica final, criterio 3 |
| SC-07 | Actualizar la documentación tras los cambios del sprint | Product Backlog, casos de uso, requisitos no funcionales, plan de pruebas y README reflejan SC-03, SC-04 y SC-05 | Media | Justo | Entrega 3 |
| SC-08 | Registrar la comunicación a los titulares afectados por una vulneración | La vulneración permite registrar fecha, medio y texto de la comunicación a los titulares | Baja | Raúl (backend) y Celine (pantalla) | PB-08, caso 5.10 |
| SC-09 | Completar los pendientes de la Entrega 2 | Presentación `NormIA_Avance_Fase_2.pptx` subida con su contenido real y autoevaluaciones 2.2 completadas por cada integrante | Media | Los tres | Rúbrica de avance, criterio 6 |
| SC-10 | Programar las reuniones del sprint | Evento recurrente en Google Calendar con el enlace de Meet y horario anotado en la primera acta | Alta | Justo | Metodología |
| SC-11 | Retrospectiva del sprint de cierre | Reunión realizada, acta con la plantilla de retrospectiva y resumen agregado a Retrospectivas.md | Alta | Los tres | Metodología |

## Orden sugerido

1. SC-10 y SC-01, que son rápidas y ordenan el trabajo.
2. SC-02, porque la revisión puede encontrar fallas más urgentes que el resto de la lista.
3. SC-03, SC-04, SC-06 y SC-05.
4. SC-07 y SC-09.
5. SC-08 si queda tiempo.
6. SC-11 al final del sprint.
