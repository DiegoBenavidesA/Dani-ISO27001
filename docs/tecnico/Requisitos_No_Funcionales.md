
# Requisitos No Funcionales (RNF) - NormIA

Este documento describe atributos medibles del sistema según su implementación: frontend React desplegado en Vercel, backend FastAPI desplegado en Render, PostgreSQL con SQLAlchemy async, autenticación JWT, aislamiento multiempresa, Supabase Storage y servicios de IA Groq/OpenAI/DeepSeek.

Los valores son objetivos verificables; no representan un SLA contractual provisto automáticamente por Render, Vercel o Neon. Su inclusión en este documento no demuestra por sí sola que se hayan superado las pruebas correspondientes.

## 1. Rendimiento

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-01 | Respuesta de operaciones de lectura | El 95 % de las solicitudes `GET` a endpoints sin IA externa debe responder en menos de 2 segundos, medido sobre 100 solicitudes consecutivas representativas. |
| RNF-02 | Respuesta de operaciones IA | El 95 % de las solicitudes de chat o análisis con un proveedor de IA disponible debe completar la respuesta en menos de 30 segundos; cuando el endpoint implemente procesamiento asíncrono, se acepta la entrega de un `job_id` válido dentro de ese plazo. Se verificará con al menos 100 solicitudes representativas. |
| RNF-03 | Carga de evidencias | Una evidencia de hasta 10 MB debe poder cargarse, almacenarse y devolver un resultado correcto en menos de 30 segundos, en condiciones de prueba definidas. Los archivos que superen el límite establecido deben rechazarse con un error controlado. **Pendiente documentado:** `POST /api/evidence/upload` aún no valida el tamaño máximo; este criterio no debe marcarse como cumplido hasta implementar y probar esa validación. |
| RNF-04 | Consulta paginada | Los endpoints de listados deben respetar el límite de registros solicitado y devolver resultados paginados cuando corresponda. Se comprobará con conjuntos de datos superiores al tamaño de página, revisando que no se generen consultas N+1 al recuperar relaciones. |

## 2. Seguridad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-05 | Autenticación JWT | Los endpoints protegidos deben retornar `401` sin bearer token, con token expirado o con firma inválida. La vigencia se configura mediante `ACCESS_TOKEN_EXPIRE_MINUTES`. |
| RNF-06 | Autorización por rol | Rutas protegidas por `RequireRole`, `require_admin` o `require_superadmin` deben retornar `403` ante roles no autorizados. |
| RNF-07 | Roles implementados | Los permisos de acceso deben aplicarse de manera consistente para los roles configurados (`superadmin`, `owner`, `admin`, `manager`, `auditor`, `dpo` y `employee`). Las pruebas deben verificar que un rol sin permiso no pueda ejecutar operaciones reservadas a otro. |
| RNF-08 | Aislamiento multiempresa | El usuario distinto de `superadmin` solo puede operar sobre el `organization_id` contenido en su JWT; una cabecera `X-Org-Id` ajena debe ser ignorada o rechazada. |
| RNF-09 | Selección del superadministrador | Cuando un `superadmin` acceda a operaciones dependientes de una organización, el sistema debe exigir una organización explícita mediante `X-Org-Id` u `org_id` y rechazar con `403` las solicitudes que omitan esa selección en los endpoints que la requieren. Esto debe verificarse mediante pruebas de acceso. |
| RNF-10 | Protección de secretos | El código, documentos y archivos `.env` de ejemplo deben excluir claves reales de JWT, IA, SMTP/Brevo, Supabase y PostgreSQL; solo deben contener marcadores o valores ficticios. |
| RNF-11 | Almacenamiento de contraseñas | Las contraseñas deben guardarse solo mediante el hash de `AuthService` y nunca retornarse en respuestas ni escribirse en texto plano. |
| RNF-12 | Configuración CORS | El backend debe permitir solicitudes CORS únicamente desde los orígenes locales y dominios de despliegue expresamente autorizados. Las cabeceras necesarias deben incluir `Authorization`, `Content-Type` y `X-Org-Id`. Se verificará que un origen no autorizado no reciba autorización CORS. No se deben habilitar indiscriminadamente todos los subdominios `*.vercel.app`. |

## 3. Disponibilidad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-13 | Health check | `GET /health` debe responder `200` con `{"status":"healthy"}`. |
| RNF-14 | Dependencia obligatoria de base de datos | Si falta `DATABASE_URL` o la conexión a PostgreSQL no está disponible, el sistema debe informar un fallo identificable y evitar presentar como saludable una funcionalidad que depende de la base de datos. Se verificará iniciando el backend con configuración ausente y con una conexión inválida. |
| RNF-15 | Tolerancia a fallos externos | La caída de Groq, OpenAI/DeepSeek, Supabase Storage o correo debe producir error controlado en el módulo dependiente, sin exponer secretos ni bloquear módulos independientes. |
| RNF-16 | Despliegue declarativo | Tras un reinicio o nuevo despliegue, el backend debe recuperar la atención de solicitudes sin intervención manual sobre el código. Se verificará reiniciando el servicio y comprobando su disponibilidad mediante `GET /health` y una consulta representativa. No se establece un SLA superior al contratado con los proveedores. |

## 4. Escalabilidad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-17 | Concurrencia | El backend debe atender al menos 20 lecturas concurrentes manteniendo el percentil p95 por debajo de 5 segundos en el entorno de prueba acordado. |
| RNF-18 | Sesiones de base de datos | Las dependencias deben obtener y cerrar sesiones async por solicitud mediante `get_db`; las conexiones no deben conservar estado de usuario entre requests. |
| RNF-19 | PgBouncer | Cuando se utilice PgBouncer en modo de agrupación de transacciones (por ejemplo, mediante el puerto 6543), la conexión PostgreSQL debe configurarse para evitar conflictos de prepared statements entre sesiones compartidas. Se verificará ejecutando consultas consecutivas y concurrentes sin errores de colisión. **Aplicabilidad condicionada:** solo corresponde si el despliegue utiliza PgBouncer. |
| RNF-20 | Crecimiento multiempresa | Cada consulta a datos empresariales debe aplicar el filtro de organización, sin que el número de empresas haga que una organización acceda a datos de otra. |

## 5. Usabilidad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-21 | Compatibilidad del frontend | Las vistas principales deben permitir navegar entre módulos sin recargar manualmente la aplicación y funcionar en versiones actuales de Chrome, Firefox y Edge. Se verificará el acceso, navegación y ejecución de acciones principales en esos navegadores. |
| RNF-22 | Retroalimentación | Las operaciones fallidas visibles deben mostrar error o estado de fallo distinto de éxito, y conservar códigos HTTP legibles entre frontend y backend. |
| RNF-23 | Accesibilidad básica | Los campos principales de login y las acciones interactivas deben tener etiquetas o nombres accesibles y ser operables por teclado. |
| RNF-24 | Confirmación de acciones críticas | Las operaciones destructivas disponibles en la interfaz deben solicitar confirmación antes de ejecutarse, o proporcionar un mecanismo de reversión claramente informado. Se verificará al menos en las pantallas de Vulneraciones, Evidencias, Preguntas y Gestión de Usuarios. **Estado documentado:** esas pantallas incluyen confirmación; falta comprobarlo en la versión desplegada. |

## 6. Mantenibilidad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-25 | Separación backend | Modelos SQLAlchemy deben residir en `app/models`, rutas en `app/routes`, lógica reusable en `app/services` y sesiones en `app/dependencies`; nuevos routers deben registrarse en `app/main.py`. |
| RNF-26 | Configuración centralizada | Las variables de aplicación deben declararse o consumirse mediante `app/config.py` y nunca como credenciales literales dentro de rutas o servicios. |
| RNF-27 | API documentada | FastAPI debe publicar Swagger/OpenAPI en `/docs` y ReDoc en `/redoc` en entornos donde el middleware los habilite por defecto. |
| RNF-28 | Pruebas | Los cambios que afecten autenticación, autorización o aislamiento multiempresa deben acompañarse de pruebas automatizadas que verifiquen respuestas esperadas (`200`, `401`, `403` u otros códigos definidos). Se verificará que las pruebas estén disponibles y se ejecuten correctamente; su existencia no implica por sí sola cobertura completa. |
| RNF-29 | Diagnóstico seguro | Los logs deben permitir identificar módulo y excepción sin incluir bearer tokens, contraseñas ni claves API. |

## 7. Cumplimiento Legal y Normativo

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-30 | Alineación Ley 21.719 | Los datos de las funcionalidades vigentes relacionadas con la Ley N.º 21.719 deben respetar el aislamiento por organización y evitar accesos entre empresas. Se verificará en los endpoints activos, especialmente `/api/breaches`. **Alcance actual documentado:** los módulos independientes de tratamientos, consentimientos, solicitudes de titulares, proveedores y evaluación de impacto fueron retirados de la API; conservar sus tablas no significa que sus funcionalidades estén activas. |
| RNF-31 | Trazabilidad ISO 27001 | Riesgos, controles, evidencias, CAPA y evaluaciones deben conservar identificadores persistentes, relaciones y marcas `created_at`/`updated_at` cuando el modelo las declare. |
| RNF-32 | Auditoría de cambios | Las acciones críticas del módulo activo de vulneraciones deben conservar la identidad del responsable y las fechas de reporte, confirmación de gravedad y resolución (`reportado_por`, `confirmada_por`, `resuelta_por`). Se verificará que esos datos persistan tras cada operación. **Límite documentado:** no existe una auditoría completa de cambios en todos los modelos; `created_at` y `updated_at` no identifican al autor de cada modificación. |
| RNF-33 | Minimización de datos | Las respuestas API deben limitar los campos al caso de uso autorizado y nunca incluir datos de otra organización. |

## 8. Portabilidad

| ID | Requisito | Criterio medible |
|---|---|---|
| RNF-34 | Portabilidad mediante Docker | El sistema debe poder construirse y ejecutarse en un entorno compatible con Docker, utilizando Dockerfile(s), una configuración `docker-compose.yml` y variables de entorno documentadas, sin cambios en el código fuente al trasladarlo a otro equipo. Se verificará ejecutando `docker compose up --build` en un entorno de prueba configurado y comprobando que los servicios previstos inicien correctamente, que el backend responda en `GET /health` y que el frontend sea accesible. **Pendiente de verificación:** comprobar que los archivos Docker y Compose necesarios estén disponibles y funcionen en el repositorio actual. |
