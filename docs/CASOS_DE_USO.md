# Casos de uso — Plataforma GRC (ISO 27001 + Ley 21.719)

> Catálogo de casos de uso del sistema: lo que **se puede hacer hoy** y lo que
> **debería poder hacerse** (pendiente). Sirve como referencia funcional del
> proyecto.
>
> **Estado:** ✅ implementado · 🟡 parcial / mejorable · ⬜ pendiente

---

## Actores

| Actor | Descripción | Tiene cuenta |
|---|---|---|
| **Superadmin** | Operador de la plataforma. Administra todas las empresas. No pertenece a ninguna. | Sí |
| **Owner** | Dueño de una empresa (quien la registra o es designado). Control total dentro de su empresa. | Sí |
| **Admin** | Administrador dentro de una empresa. | Sí |
| **Manager** | Rol funcional ISO: gestiona cumplimiento/riesgos. | Sí |
| **Auditor** | Rol funcional ISO: solo lectura (consulta/auditoría). | Sí |
| **DPO** | Delegado de Protección de Datos: módulos Ley 21.719. | Sí |
| **Empleado** | Usuario básico de la empresa. Solo Portal de Empleados. | Sí |
| **Titular de datos** | Persona externa cuyos datos trata la empresa (cliente/empleado). | No (canal público) |

---

## 1. Autenticación y cuentas

| # | Caso de uso | Actor | Estado |
|---|---|---|---|
| 1.1 | Registrar una empresa nueva (el primer usuario queda como Owner) | Owner (auto-registro) | ✅ |
| 1.2 | Iniciar sesión | Todos con cuenta | ✅ |
| 1.3 | Recibir invitación por correo y **activar la cuenta** definiendo contraseña propia | Invitado | ✅ |
| 1.4 | Cerrar sesión | Todos | ✅ |
| 1.5 | Cambiar contraseña estando logueado | Todos | ✅ |
| 1.6 | Recuperar contraseña olvidada (reset por correo) | Todos | ⬜ |
| 1.7 | Iniciar sesión con Google (OAuth) | Todos | ⬜ (descartado por ahora) |

---

## 2. Plataforma (Superadmin)

| # | Caso de uso | Estado |
|---|---|---|
| 2.1 | Ver el listado de todas las empresas | ✅ |
| 2.2 | Crear una empresa nueva (nombre → genera slug/URL) | ✅ |
| 2.3 | Invitar un usuario a una empresa (correo + rol), con correo de activación | ✅ |
| 2.4 | Suspender / reactivar una empresa | ✅ |
| 2.5 | Entrar a una empresa (impersonar) y ver su panel completo (ISO/Ley) | ✅ |
| 2.6 | Volver al panel de plataforma desde una empresa | ✅ |
| 2.7 | Ver TODOS los usuarios de todas las empresas (con columna Empresa) | ✅ |
| 2.8 | Filtrar usuarios por rol / estado / empresa | ✅ |
| 2.9 | Cambiar el rol de un usuario (en línea) | ✅ |
| 2.10 | Suspender / reactivar / eliminar un usuario | ✅ |
| 2.11 | Editar los datos de una empresa (nombre, etc.) | 🟡 (endpoint existe; UI mínima) |
| 2.12 | Ver métricas globales de la plataforma (nº empresas, usuarios, uso) | ⬜ |

> El superadmin **no** ve módulos ISO/Ley en su panel; solo Empresas y Usuarios.

---

## 3. Gestión de usuarios (dentro de una empresa)

| # | Caso de uso | Actor | Estado |
|---|---|---|---|
| 3.1 | Invitar un usuario a mi empresa (correo + rol) con correo de activación | Owner, Admin | ✅ |
| 3.2 | Cambiar el rol de un usuario de mi empresa | Owner, Admin | ✅ |
| 3.3 | Suspender / reactivar un usuario | Owner, Admin | ✅ |
| 3.4 | Eliminar un usuario | Owner, Admin | ✅ |
| 3.5 | Anti-escalada: un admin no puede crear/asignar owner ni superadmin | Sistema | ✅ |
| 3.6 | Asignar roles funcionales (manager/auditor/dpo) | Owner, Admin | ✅ |

---

## 4. ISO 27001

| # | Caso de uso | Actor | Estado |
|---|---|---|---|
| 4.1 | Responder el diagnóstico (gap analysis) manualmente | Owner, Admin, Manager, Auditor(lectura) | ✅ |
| 4.2 | Evaluar documentos con IA y obtener veredicto por pregunta | Owner, Admin, Manager | ✅ |
| 4.3 | Que la evaluación IA actualice el estado de los controles (SOA) | Sistema | ✅ |
| 4.4 | Ver la Declaración de Aplicabilidad (SOA) con estado por control | ISO_VIEW | ✅ |
| 4.5 | Marcar aplicabilidad y estado de cada control manualmente | Owner, Admin, Manager | ✅ |
| 4.6 | Ver Resultados (% cumplimiento, meta, brecha) | ISO_VIEW | ✅ |
| 4.7 | Administrar el banco de preguntas (crear/editar/eliminar) | Owner, Admin | ✅ |
| 4.8 | Importar preguntas masivamente desde Excel (+ plantilla) | Owner, Admin | ✅ |
| 4.9 | Subir evidencias (archivos) que persisten por empresa | Owner, Admin, Manager | ✅ |
| 4.10 | Gestionar documentos / generar documentación ISO + Ley | Owner, Admin, Manager | 🟡 (genera; faltan versiones/flujo de aprobación completo) |
| 4.11 | Mapa de riesgos (registro y tratamiento) | Owner, Admin, Manager | ✅ |
| 4.12 | CAPA (acciones correctivas): crear, actualizar, eliminar | Owner, Admin, Manager | ✅ |
| 4.13 | Sala de auditoría (auditoría interna, hallazgos) | ISO_VIEW | 🟡 |
| 4.14 | Exportar paquete para el auditor (ZIP con evidencias/SOA) | Owner, Admin | ✅ |
| 4.15 | Auditor en **solo lectura** (no escribe en evidencias/CAPA/gap/assessment) | Sistema | ✅ |
| 4.16 | Revisión por la dirección (acta) | Owner, Admin | ⬜ |
| 4.17 | Recordatorios / revisiones anuales / mantenimiento | Sistema | ⬜ |

---

## 5. Ley 21.719 (Protección de Datos)

| # | Caso de uso | Actor | Estado |
|---|---|---|---|
| 5.1 | Registrar tratamientos (RoPA) manualmente | Owner, Admin, DPO | ✅ |
| 5.2 | Extraer tratamientos automáticamente desde documentos (IA) | Owner, Admin, DPO | ✅ |
| 5.3 | Evitar que la IA duplique tratamientos ya existentes | Sistema | ✅ |
| 5.4 | Eliminar un tratamiento | Owner, Admin, DPO | ✅ |
| 5.5 | Evaluar el impacto (DPIA/EIPD) de un tratamiento | Owner, Admin, DPO | 🟡 (analiza; no enlaza auto a riesgo/tarea) |
| 5.6 | Crear un consentimiento y enviarlo al titular por correo | Owner, Admin, DPO | ✅ |
| 5.7 | Guardar la versión/texto del aviso consentido (trazabilidad) | Sistema | ✅ |
| 5.8 | Historial del consentimiento (otorgado → revocado, por quién/cuándo) | Sistema | ✅ |
| 5.9 | Vigencia/renovación del consentimiento | Owner, Admin, DPO | ✅ |
| 5.10 | Gestionar solicitudes de titulares (interno) con plazo legal | Owner, Admin, DPO | ✅ |
| 5.11 | Gestión de brechas/incidentes | Owner, Admin, DPO | ✅ |
| 5.12 | Proveedores (encargados) con alertas de contrato | Owner, Admin, DPO | 🟡 |
| 5.13 | Granularidad del consentimiento por finalidad (marketing sí / cesión no) | — | ⬜ |
| 5.14 | Widget de consentimiento embebible en la web de la empresa | — | ⬜ |
| 5.15 | Modelo de prevención de infracciones | — | ⬜ |

---

## 6. Canal público del titular (sin login)

| # | Caso de uso | Actor | Estado |
|---|---|---|---|
| 6.1 | Abrir el enlace de consentimiento recibido por correo | Titular | ✅ |
| 6.2 | Ver qué se le pide y **aceptar** el consentimiento | Titular | ✅ |
| 6.3 | **Revocar** su consentimiento desde el enlace | Titular | ✅ |
| 6.4 | Descargar el **recibo** de su consentimiento | Titular | ✅ |
| 6.5 | Enviar una **solicitud de derechos** (acceso/rectificación/etc.) vía `/solicitud/:empresa` | Titular | ✅ |
| 6.6 | Recibir en el correo de consentimiento el enlace al canal de solicitudes | Titular | ✅ |
| 6.7 | Verificación de identidad del titular antes de atender | — | ⬜ |

---

## 7. Transversal

| # | Caso de uso | Actor | Estado |
|---|---|---|---|
| 7.1 | Dashboard / Panel con indicadores | Equipo (no empleado) | ✅ |
| 7.2 | Documentos y Evidencias **compartidos** entre ISO y Ley (repositorio único) | Equipo | ✅ |
| 7.3 | Evaluar con IA usando documentos **ya guardados** (no re-subir) | Owner, Admin, Manager | ✅ |
| 7.4 | Portal de Empleados (leer/aceptar políticas) | Empleado | 🟡 |
| 7.5 | Chat / asistente IA | Equipo | 🟡 |
| 7.6 | Notificaciones | Usuario | 🟡 |
| 7.7 | Multiidioma (ES/EN/PT) | Todos | ✅ |
| 7.8 | Aislamiento multi-tenant (cada empresa solo ve lo suyo) | Sistema | ✅ |
| 7.9 | Registro de auditoría de la plataforma (quién hizo qué y cuándo) | Sistema | ⬜ |

---

## 8. Flujos completos (end-to-end)

### 8.1 Alta de una empresa (✅)
Superadmin crea empresa → invita al owner por correo → el owner activa su cuenta → entra a `/su-empresa`.

### 8.2 Ciclo de cumplimiento ISO (✅ núcleo)
Subir documentos → evaluar con IA → se actualiza el SOA y Resultados → ver brechas → (crear tareas/CAPA 🟡) → exportar paquete al auditor.

### 8.3 Ciclo de un tratamiento + consentimiento (✅)
Registrar/extraer tratamiento (RoPA) → crear consentimiento → el titular lo recibe por correo → acepta/revoca desde el enlace → queda el historial y el recibo.

### 8.4 Derechos del titular (✅)
El titular entra al canal público → envía su solicitud → cae en la bandeja de la empresa con plazo legal → la empresa la gestiona y responde.

### 8.5 DPIA (🟡)
Evaluar impacto de un tratamiento → (debería) generar automáticamente un riesgo y una tarea de mitigación → guardar como evidencia → re-evaluar. *El enlace automático entre DPIA → riesgo/tarea está pendiente.*

---

## 9. Pendientes destacados (lo que "debería poder hacerse")

- Recuperación de contraseña por correo (1.6).
- Métricas globales de plataforma para el superadmin (2.12).
- DPIA que genere automáticamente riesgo + tarea de mitigación (5.5 / 8.5).
- Consentimiento granular por finalidad y widget embebible (5.13, 5.14).
- Verificación de identidad del titular en el canal público (6.7).
- Revisión por la dirección y recordatorios/mantenimiento ISO (4.16, 4.17).
- Registro de auditoría de acciones en la plataforma (7.9).
- Separar lectura/escritura fina en todos los módulos (hoy aplicado en evidencias, CAPA y assessment).
