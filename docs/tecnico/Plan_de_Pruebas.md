# Plan de Pruebas - NormIA

## 1. Alcance

El plan cubre backend FastAPI, autenticación JWT, autorización por roles, aislamiento multiempresa, rutas ISO 27001 y Ley 21.719, PostgreSQL/Neon, integración con Groq u otros proveedores compatibles, Supabase Storage, correo, frontend React y despliegues en Render/Vercel.

Quedan fuera hasta contar con infraestructura dedicada y datos controlados: pruebas de carga sostenida productiva, pruebas de proveedor de IA reales con facturación, penetración externa autorizada y certificación de cumplimiento de proveedores cloud.

## 2. Situación actual de las pruebas

`Producto/dani-project-back/tests/` contiene actualmente:

- `test_api.py`: pruebas funcionales con `httpx` que esperan un backend activo en `http://localhost:8000`. Incluye login, riesgos, compliance y health check.
- `test_deepseek.py`: script manual de conexión con OpenAI SDK contra DeepSeek; imprime el resultado en consola y no usa el cliente de pruebas de FastAPI ni fixtures de pytest.
- `check_db.py`: script para comprobar/diagnosticar la conexión PostgreSQL. No es una suite automatizada reproducible sin revisión de credenciales y entorno.

El repositorio no demuestra una fixture global de base de datos de prueba ni una suite FastAPI `TestClient/AsyncClient` equivalente en todo el backend. Las nuevas pruebas deben aislar configuración y BD.

## 3. Tipos de prueba

| Tipo | Objetivo | Herramientas y criterio |
|---|---|---|
| Unitarias | Validar funciones y servicios sin servidor externo | pytest; mocks de proveedor, BD y almacenamiento. |
| Integración API | Validar rutas, serialización, CORS, JWT y dependencias | `fastapi.testclient.TestClient` o `httpx.AsyncClient` con `ASGITransport`. |
| Seguridad | Validar 401/403, roles y aislamiento de organizaciones | JWT firmado localmente y usuarios por organización; ningún secreto real. |
| Rendimiento | Medir latencia p95 y concurrencia | Script `tests/performance/prueba_rendimiento.py` (httpx asíncrono) contra el sistema levantado con Docker Compose; registra p50, p95 y máximo. |
| Acceso/end-to-end | Validar navegación React y llamadas reales | Actualmente se realizan de forma manual en el navegador. Herramienta propuesta para automatizarlas: Playwright. |

## 4. Casos propuestos

| ID | Tipo | Precondición | Procedimiento | Resultado esperado |
|---|---|---|---|---|
| PT-01 | Integración | Backend levantado o app ASGI disponible | `GET /health` | `200` y `{"status":"healthy"}`. |
| PT-02 | Seguridad | Sin Authorization header | `GET /api/risks/` | `401`, o `403` si FastAPI Security responde así al esquema; documentar el comportamiento real. |
| PT-03 | Seguridad | Token válido con rol `employee` | `GET/POST` sobre una ruta protegida por `ELEVATED_WRITE` o `ELEVATED_READ` | `403` si no está permitido por la matriz. |
| PT-04 | Seguridad | Token válido sin `organization_id` | Acceso a ruta que dependa de `get_current_org` | `403` con mensaje de organización no asignada. |
| PT-05 | Seguridad | Usuario regular con JWT de organización A y `X-Org-Id: B` | Listar o consultar datos de organización A | Solo datos de A; nunca datos de B. |
| PT-06 | Seguridad | JWT con rol `superadmin` y sin selector | Ruta que exige `get_current_org` | `403` indicando seleccionar empresa. |
| PT-07 | Integración | Login y usuario válido en BD de prueba | `POST /api/auth/login` con credenciales válidas | `200`, `access_token` y `token_type=bearer`. |
| PT-08 | Negativo | Email inexistente o contraseña errónea | `POST /api/auth/login` | `401`. |
| PT-09 | Integración | Organización A, token válido y datos de prueba | Crear y listar riesgo por `POST /api/risks/` y `GET /api/risks/` | Persistencia del riesgo y devolución de datos solo dentro de A. |
| PT-10 | Integración | Pregunta y organización creadas | Responder una pregunta por `/api/assessment-questions/answers/{question_id}` | Respuesta persistida y recuperable para la misma organización. |
| PT-11 | Integración | Evidencia de prueba en Supabase o mock | Subir evidencia mediante `/api/evidence/upload` | `200`/estado definido, metadatos persistidos y archivo descargable o URL controlada. |
| PT-12 | Integración | Documento y usuario autenticado | Consultar y reconocer documento en rutas existentes | Estado persistente y sin acceso cruzado entre empresas. |
| PT-13 | Integración | Datos de GAP/acciones | Consultar `/api/gap-analysis/full` y acciones | Lista y relaciones consistentes; sin consultas cruzadas. |
| PT-14 | Integración | Router de brechas activo y usuario con rol DPO/Admin | Consultar `/api/breaches/` | `200`; usuario no autorizado debe recibir `403`. |
| PT-15 | Integración | Configuración SMTP/Brevo válida o mocks | Invitar usuario o enviar consentimiento | Operación exitosa o fallo controlado sin imprimir secretos. |
| PT-16 | Unitarias | Mock del cliente Groq/OpenAI | Llamar el servicio IA | Proveedor seleccionado conforme a la clave disponible, modelo esperado y manejo de excepción. |
| PT-17 | Unitarias | Mock de Supabase | Subir, descargar, eliminar evidencia | Calls HTTP esperados y `RuntimeError` controlado ante estado distinto de éxito. |
| PT-18 | Rendimiento | Entorno local o staging con datos representativos | 20 solicitudes `GET /api/risks/` concurrentes | p95 menor o igual a 5 segundos en la prueba acordada. |
| PT-19 | Rendimiento | 100 solicitudes `GET /health` consecutivas | Medir latencia | p95 menor o igual al objetivo RNF definido para operaciones básicas. |
| PT-20 | Rendimiento | 10 MB de evidencia en almacenamiento de prueba | Medir subida | Completar en menos de 30 segundos o rechazar con límite documentado. |
| PT-21 | CORS | Origen local y dominio Vercel | Preflight desde navegador | Solo orígenes permitidos reciben respuesta habilitada. |
| PT-22 | Frontend | Aplicación React levantada | Navegar login y módulos protegidos sin token/token válido | Sin token, `ProtectedRoute` redirige a `/login`; con token válido se muestra el menú lateral y el módulo solicitado; un usuario de otra empresa que entra a una URL ajena es redirigido a la de su empresa. |

## 5. Ejecución actual

Con el backend ejecutándose en `http://localhost:8000` y una base de datos de pruebas:

```bash
cd Producto/dani-project-back
pytest tests/test_api.py -v
```

Comprobaciones adicionales manuales:

```bash
python tests/check_db.py
python tests/test_deepseek.py
```

`test_deepseek.py` y cualquier prueba con claves externas deben ejecutarse solo con credenciales locales, sin credenciales reales en CI ni en archivos versionados.

Para una suite nueva basada en FastAPI, ejecutar preferentemente:

```bash
pytest tests -v
```

cuando existan fixtures de aplicación y base de datos de prueba.

Estado actual de cada archivo de `tests/`:

| Archivo | Necesita | Cómo se ejecuta |
|---|---|---|
| `test_integration_auth.py` | Nada: usa `TestClient` y no se conecta a la base de datos | `pytest tests/test_integration_auth.py -v` (3 pruebas: PT-02, PT-03 y PT-06) |
| `test_breaches_permisos.py` | Nada: usa `TestClient`, tokens JWT locales y override de la base de datos | `pytest tests/test_breaches_permisos.py -v` (PT-14 y validación HTTP del módulo Ley 21.719) |
| `test_breaches_logica.py` | Nada: valida funciones puras y modelos Pydantic con datos locales | `pytest tests/test_breaches_logica.py -v` (casos unitarios de análisis y normalización Ley 21.719) |
| `test_breaches_flujo.py` | Sesión falsa y mocks de acceso a datos; no ejecuta IA ni notificaciones reales | `pytest tests/test_breaches_flujo.py -v` (flujo de revisión, notificación, cierre y plazo de 72 horas) |
| `test_general.py` | Nada: usa `TestClient` sin depender de BD externa | `pytest tests/test_general.py -v` (PT-01 y PT-21; validación de login con `password` omitido) |
| `test_api.py` | Backend levantado en `http://localhost:8000` y base de datos con usuario de prueba | `pytest tests/test_api.py -v` |
| `performance/prueba_rendimiento.py` | Backend levantado (`docker compose up`) y un usuario de prueba en `PERF_EMAIL` y `PERF_PASSWORD` | `python tests/performance/prueba_rendimiento.py --url http://localhost:8000` (PT-18, PT-19, RNF-01, RNF-13 y RNF-17; ver sección 5.1) |
| `check_db.py` | `DATABASE_URL` válida | `python tests/check_db.py` (comprobación manual) |
| `test_deepseek.py` | Clave de IA real | `python tests/test_deepseek.py` (comprobación manual; no forma parte de la suite porque no tiene aserciones) |

### 5.1 Resultados de las pruebas de rendimiento

El script `tests/performance/prueba_rendimiento.py` se ejecutó contra el sistema completo levantado con `docker compose up` (PostgreSQL con pgvector y backend en contenedores, en un equipo de desarrollo con Windows 11). Como el usuario es superadmin, el script creó una empresa de prueba con 50 riesgos para que los listados tuvieran datos.

Cada endpoint de lectura recibió 100 solicitudes seguidas (RNF-01). Para la concurrencia (RNF-17) se enviaron 5 rondas de 20 solicitudes simultáneas repartidas entre los mismos endpoints.

Fecha de ejecución: 2026-11-13 18:16  
Servidor: http://localhost:8000  
Empresa de prueba: Prueba rendimiento 20261113-181537 (50 riesgos de ejemplo)

| Requisito | Prueba | Solicitudes | p50 (ms) | p95 (ms) | Máx (ms) | Errores | Criterio | Resultado |
|---|---|---|---|---|---|---|---|---|
| RNF-13 | GET /health | 100 | 3 | 5 | 28 | 0 | 200 y healthy | Aprobado |
| Referencia | POST /api/auth/login | 10 | 352 | 433 | 433 | 0 | sin límite definido | Aprobado |
| RNF-01 | GET /api/risks/ | 100 | 59 | 91 | 105 | 0 | p95 < 2 s | Aprobado |
| RNF-01 | GET /api/breaches/ | 100 | 59 | 77 | 95 | 0 | p95 < 2 s | Aprobado |
| RNF-01 | GET /api/assessment-questions/ | 100 | 44 | 59 | 68 | 0 | p95 < 2 s | Aprobado |
| RNF-01 | GET /api/notifications/ | 100 | 73 | 95 | 107 | 0 | p95 < 2 s | Aprobado |
| RNF-01 | GET /api/capas/ | 100 | 44 | 57 | 79 | 0 | p95 < 2 s | Aprobado |
| RNF-01 | GET /api/evidence/ | 100 | 49 | 77 | 104 | 0 | p95 < 2 s | Aprobado |
| RNF-01 | GET /api/gap-analysis/score | 100 | 42 | 54 | 59 | 0 | p95 < 2 s | Aprobado |
| RNF-17 | 20 lecturas concurrentes x 5 rondas | 100 | 776 | 916 | 942 | 0 | p95 < 5 s | Aprobado |

Resultado general: APROBADO

Observaciones:

- Todas las lecturas quedan muy por debajo del límite de 2 segundos: el p95 más alto es 95 ms (`/api/notifications/`).
- Con 20 solicitudes simultáneas, la mediana sube a 776 ms. El backend corre con un solo proceso de uvicorn y abre una conexión nueva a la base de datos por solicitud (`NullPool`), por lo que las solicitudes concurrentes esperan su turno. Aun así, el p95 (916 ms) cumple el límite de 5 segundos.
- El inicio de sesión tarda unos 350 ms porque verifica la contraseña con bcrypt, que es lento a propósito para dificultar ataques de fuerza bruta.
- Estos tiempos son de un entorno local. En producción (Render gratuito y Neon) se suman la latencia de red y, si el servidor estaba inactivo, cerca de un minuto de reactivación en la primera solicitud.
- PT-20 (subida de una evidencia de 10 MB) queda pendiente: requiere Supabase Storage configurado y hoy no existe un límite de tamaño (ver RNF-03).

## 6. Datos y entorno

- Crear una organización de prueba y al menos dos organizaciones adicionales para aislamiento.
- Crear usuarios por rol: `superadmin`, `owner`, `admin`, `manager`, `auditor`, `dpo` y `employee`.
- Usar PostgreSQL vacío o schema de prueba; no ejecutar destrucción automática sobre Neon productivo.
- Sustituir Groq/OpenAI/DeepSeek, Brevo, Supabase y correo por mocks salvo pruebas explícitamente manuales.
- No usar las credenciales por defecto de arranque como datos reales de pruebas.

## 7. Trazabilidad y criterios de salida

- Ninguna prueba crítica PT-02 a PT-07 puede fallar por seguridad.
- Las pruebas del flujo principal deben pasar en un backend iniciado contra la base de prueba.
- Los errores externos no deben imprimir claves ni tokens.
- Los resultados de rendimiento deben adjuntar fecha, entorno, versión, tamaño de datos y percentiles.
