# Requisitos No Funcionales (RNF) - NormIA

Este documento describe atributos medibles del sistema según su implementación: frontend React desplegado en Vercel, backend FastAPI desplegado en Render, PostgreSQL con SQLAlchemy async, autenticación JWT, aislamiento multiempresa, Supabase Storage y servicios de IA Groq/OpenAI/DeepSeek.

Los valores son objetivos verificables; no representan un SLA contractual provisto automáticamente por Render, Vercel o Neon.

## 1. Rendimiento

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-01 | Respuesta de operaciones de lectura | El 95 % de las solicitudes `GET` a endpoints sin IA externa debe responder en menos de 2 segundos, medido sobre 100 solicitudes consecutivas representativas. |
| RNF-02 | Respuesta de operaciones IA | El 95 % de las solicitudes de chat o análisis con proveedor disponible debe responder o entregar un `job_id` en menos de 30 segundos. |
| RNF-03 | Carga de evidencias | Una evidencia de hasta 10 MB debe subir, almacenarse y retornar resultado sin error en menos de 30 segundos. Estado actual: `POST /api/evidence/upload` no valida el tamaño del archivo; agregar el rechazo de archivos mayores a 10 MB queda como mejora pendiente. |
| RNF-04 | Consulta paginada | Los listados deben limitar la cantidad retornada al tamaño de página del endpoint y no deben causar consultas N+1 en listas masivas. |

## 2. Seguridad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-05 | Autenticación JWT | Los endpoints protegidos deben retornar `401` sin bearer token, con token expirado o con firma inválida. La vigencia se configura mediante `ACCESS_TOKEN_EXPIRE_MINUTES`. |
| RNF-06 | Autorización por rol | Rutas protegidas por `RequireRole`, `require_admin` o `require_superadmin` deben retornar `403` ante roles no autorizados. |
| RNF-07 | Roles implementados | El sistema debe reconocer y aplicar `superadmin`, `owner`, `admin`, `manager`, `auditor`, `dpo` y `employee` según las dependencias declaradas en cada router. |
| RNF-08 | Aislamiento multiempresa | El usuario distinto de `superadmin` solo puede operar sobre el `organization_id` contenido en su JWT; una cabecera `X-Org-Id` ajena debe ser ignorada o rechazada. |
| RNF-09 | Selección del superadministrador | Los endpoints que usan `get_current_org` deben exigir una selección mediante `X-Org-Id` u `org_id` y responder `403` si falta; el superadministrador debe usar el selector explícito. |
| RNF-10 | Protección de secretos | El código, documentos y archivos `.env` de ejemplo deben excluir claves reales de JWT, IA, SMTP/Brevo, Supabase y PostgreSQL; solo deben contener marcadores o valores ficticios. |
| RNF-11 | Almacenamiento de contraseñas | Las contraseñas deben guardarse solo mediante el hash de `AuthService` y nunca retornarse en respuestas ni escribirse en texto plano. |
| RNF-12 | Configuración CORS | El backend solo debe permitir los orígenes locales definidos, el dominio Vercel configurado y el patrón HTTPS `*.vercel.app`; las cabeceras permitidas deben incluir `Authorization`, `Content-Type` y `X-Org-Id`. |

## 3. Disponibilidad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-13 | Health check | `GET /health` debe responder `200` con `{"status":"healthy"}`. |
| RNF-14 | Dependencia obligatoria de base de datos | El arranque debe fallar explícitamente si falta `DATABASE_URL` o registrar un error inicial identificable, sin iniciar como si estuviera disponible una conexión inexistente. |
| RNF-15 | Tolerancia a fallos externos | La caída de Groq, OpenAI/DeepSeek, Supabase Storage o correo debe producir error controlado en el módulo dependiente, sin exponer secretos ni bloquear módulos independientes. |
| RNF-16 | Despliegue declarativo | El backend debe publicar un endpoint `/health` utilizables por Render para comprobar reinicios y despliegues; el objetivo operativo de disponibilidad no debe exceder lo garantizado por los proveedores. |

## 4. Escalabilidad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-17 | Concurrencia | El backend debe atender al menos 20 lecturas concurrentes manteniendo el percentil p95 por debajo de 5 segundos en el entorno de prueba acordado. |
| RNF-18 | Sesiones de base de datos | Las dependencias deben obtener y cerrar sesiones async por solicitud mediante `get_db`; las conexiones no deben conservar estado de usuario entre requests. |
| RNF-19 | PgBouncer | Cuando la URL detecte puerto 6543, la configuración debe desactivar prepared statements en memoria y usar nombres únicos para evitar colisiones con conexiones compartidas. |
| RNF-20 | Crecimiento multiempresa | Cada consulta a datos empresariales debe aplicar el filtro de organización, sin que el número de empresas haga que una organización acceda a datos de otra. |

## 5. Usabilidad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-21 | Compatibilidad del frontend | Las vistas React deben cargar en navegadores modernos compatibles con React 19 sin reiniciar manualmente la aplicación para navegar entre módulos normales. |
| RNF-22 | Retroalimentación | Las operaciones fallidas visibles deben mostrar error o estado de fallo distinto de éxito, y conservar códigos HTTP legibles entre frontend y backend. |
| RNF-23 | Accesibilidad básica | Los campos principales de login y las acciones interactivas deben tener etiquetas o nombres accesibles y ser operables por teclado. |
| RNF-24 | Confirmación de acciones críticas | Acciones destructivas o cambios críticos deben requerir confirmación o mostrar una previsión reversible explícita. Estado actual: piden confirmación antes de eliminar las pantallas de Vulneraciones, Evidencias, Preguntas y Gestión de Usuarios. |

## 6. Mantenibilidad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-25 | Separación backend | Modelos SQLAlchemy deben residir en `app/models`, rutas en `app/routes`, lógica reusable en `app/services` y sesiones en `app/dependencies`; nuevos routers deben registrarse en `app/main.py`. |
| RNF-26 | Configuración centralizada | Las variables de aplicación deben declararse o consumirse mediante `app/config.py` y nunca como credenciales literales dentro de rutas o servicios. |
| RNF-27 | API documentada | FastAPI debe publicar Swagger/OpenAPI en `/docs` y ReDoc en `/redoc` en entornos donde el middleware los habilite por defecto. |
| RNF-28 | Pruebas | Cambios de autenticación, autorización o multiempresa deben incluir al menos una prueba automatizada que confirme la respuesta esperada `200`, `401`, `403` o otro estado definido. |
| RNF-29 | Diagnóstico seguro | Los logs deben permitir identificar módulo y excepción sin incluir bearer tokens, contraseñas ni claves API. |

## 7. Cumplimiento Legal y Normativo

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-30 | Alineación Ley 21.719 | Los registros de consentimientos, tratamientos, solicitudes de titulares, brechas y proveedores deben utilizar el ámbito de organización de la implementación vigente. Estado actual: de los módulos de la Ley solo está activo el de vulneraciones (`/api/breaches`); tratamientos, consentimientos, solicitudes de titulares, proveedores y evaluación de impacto se retiraron de la API, pero sus tablas se conservan para no perder datos. |
| RNF-31 | Trazabilidad ISO 27001 | Riesgos, controles, evidencias, CAPA y evaluaciones deben conservar identificadores persistentes, relaciones y marcas `created_at`/`updated_at` cuando el modelo las declare. |
| RNF-32 | Auditoría de cambios | Estado actual: las vulneraciones registran quién reportó, quién confirmó la gravedad y quién resolvió, con sus fechas (`reportado_por`, `confirmada_por`, `resuelta_por`); el historial de consentimientos registra actor y acción. El resto de los modelos solo guarda `created_at` y `updated_at`, sin el usuario que hizo el cambio. |
| RNF-33 | Minimización de datos | Las respuestas API deben limitar los campos al caso de uso autorizado y nunca incluir datos de otra organización. |