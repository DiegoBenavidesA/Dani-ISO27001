# Manual Técnico - NormIA

## 1. Arquitectura

NormIA es una plataforma GRC web con frontend React, backend FastAPI y persistencia PostgreSQL.

```text
Navegador
  -> React/Vercel
  -> API HTTPS FastAPI/Render
  -> SQLAlchemy Async -> PostgreSQL/Neon
  -> Groq/OpenAI/DeepSeek para IA
  -> Supabase Storage para evidencias
  -> Brevo o SMTP para correo
```

El backend implementa JWT, roles, multiempresa y `organization_id`. El frontend guarda el token y, para `superadmin`, el identificador de organización seleccionado en `X-Org-Id`.

### Backend

- `app/main.py`: aplicación FastAPI, CORS, lifespan, registro de routers.
- `app/routes`: endpoints HTTP.
- `app/services`: lógica de negocio e integraciones IA, correo y almacenamiento.
- `app/models`: modelos SQLAlchemy.
- `app/dependencies`: sesiones de BD, autenticación y alcance por organización.
- `app/repositories`: consulta especializada; actualmente incluye el repositorio de riesgos.
- `app/utils`: utilidades de almacenamiento, pub/sub y slug.

### Frontend

- `src/pages`: pantallas de módulos.
- `src/components`: componentes reutilizables.
- `src/contexts`: sesión y tema.
- `src/services`: cliente REST.
- `src/App.js`: composición de rutas.

## 2. Estructura relevante

```text
Dani-ISO27001/
├── Producto/
│   ├── dani-project-back/
│   │   ├── app/
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── .env.example
│   └── dani-project-front/
│       ├── src/
│       ├── package.json
│       ├── Dockerfile
│       ├── nginx.conf
│       └── .env.example
├── docs/tecnico/
├── vercel.json
└── README.md
```

## 3. Instalación local

### Backend

Requisitos: Python 3.11 recomendado, PostgreSQL compatible y acceso a un archivo de entorno.

```powershell
cd Producto/dani-project-back
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

La API queda en `http://localhost:8000`; documentación Swagger en `/docs` y ReDoc en `/redoc`. `/health` debe responder sin autenticación.

### Frontend

Requisitos: Node.js 18 o superior para Create React App.

```powershell
cd Producto/dani-project-front
npm install
Copy-Item .env.example .env
npm start
```

Abrir `http://localhost:3000`. `REACT_APP_API_URL` debe apuntar al backend local.

### Docker

Consultar la sección Docker del README. Los archivos requieren completar secretos reales fuera del repositorio.

## 4. Variables de entorno

### Backend

Las variables declaradas o consumidas por `app/config.py` y `app/dependencies/database.py` son:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL obligatoria. |
| `SECRET_KEY` | Firma y validación JWT. Obligatoria. |
| `ALGORITHM` | Algoritmo JWT, por defecto `HS256`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Vigencia JWT, por defecto 240. |
| `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `OPENAI_API_KEY` | Credenciales alternativas del proveedor compatible con OpenAI SDK. |
| `API_V1_STR`, `PROJECT_NAME`, `DEBUG` | Identidad/depuración de configuración. |
| `DB_POOL_SIZE`, `DB_MAX_OVERFLOW` | Valores declarados de pool; la implementación real usa `NullPool` y configuración específica para PgBouncer. |
| `REDIS_URL` | Declarada en `config.py`, pero no se usa: `RiskService` (que cachea en Redis) no está conectado a ninguna ruta. No es necesario configurarla. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_NAME`, `EMAIL_FROM` | Correo por SMTP. |
| `BREVO_API_KEY` | Correo por API HTTPS; tiene prioridad sobre SMTP si existe. |
| `FRONTEND_URL`, `FRONTEND_BASE_URL` | URLs utilizadas en enlaces de invitación y consentimiento. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_STORAGE_BUCKET` | Evidencias en Supabase Storage. |
| `GOOGLE_CLOUD_PROJECT`, `GOOGLE_APPLICATION_CREDENTIALS`, `CLOUD_STORAGE_BUCKET` | Variables Google presentes; su uso activo debe verificarse y está marcado como opcional. |
| `VECTOR_STORE_API_KEY`, `VECTOR_STORE_ENVIRONMENT` | Vector store declarado pero no activo actualmente. |
| `CORS_ORIGINS` | Lista declarada en settings; el middleware principal usa una lista propia en `main.py`. |
| `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` | Usuario inicial de plataforma creado solo al iniciar fuera de Vercel. |
| `VERCEL` | Detectado desde entorno por el lifespan para omitir inicialización de base. |

### Frontend

| Variable | Uso |
|---|---|
| `REACT_APP_API_URL` | URL base del backend consumida por `src/services/api.js`. |

Nunca se deben copiar claves reales en `.env.example`, Dockerfiles, documentos o logs.

## 5. Base de datos

`DATABASE_URL` se lee en `app/dependencies/database.py`. Si utiliza una URL PostgreSQL sin `+asyncpg`, el código la convierte. Neon soporta el flujo normal; URLs con puerto 6543 se tratan como PgBouncer y desactivan prepared statements con nombres únicos.

Durante el lifespan fuera de Vercel, el backend:

1. Crea la extensión `vector` si PostgreSQL la admite.
2. Ejecuta `create_all`.
3. Aplica alteraciones específicas de compatibilidad.
4. Verifica enum user roles y estado consentimientos.
5. Corrige slugs de organizaciones.
6. Crea o corrige el usuario superadministrador.

Catalogos globales, como controles ISO, preguntas, prompts y chunks normativos, no pertenecen a una empresa. Datos empresariales deben usar `get_current_org` y los helpers de `app/dependencies/tenant.py`.

## 6. Roles y permisos

| Rol | Alcance |
|---|---|
| `superadmin` | Operador de plataforma; requiere seleccionar una organización para leer o modificar datos empresariales. |
| `owner` | Propietario de organización; pasa comprobaciones elevadas por jerarquía. |
| `admin` | Administración dentro de la organización. |
| `manager` | Acceso funcional elevado en módulos definidos. |
| `auditor` | Lectura elevada en cumplimiento/gap; escritura limitada según matriz. |
| `dpo` | Lectura elevada de cumplimiento y gestión definida para brechas Ley 21.719. |
| `employee` | Usuario normal de empresa; según endpoints, acceso básico o denegado. |

Los grupos definidos en `app/dependencies/auth.py` son `PRIVILEGED_ROLES`, `ELEVATED_READ`, `ELEVATED_WRITE`, `ELEVATED_NO_DPO` y `LEY_ROLES`.

## 7. Despliegue

### Backend en Render

1. Crear un Web Service con **Root Directory** `Producto/dani-project-back` y entorno Python 3.11.
2. Configurar **Build Command** `pip install -r requirements.txt` y **Start Command** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Configurar `DATABASE_URL`, `SECRET_KEY` y proveedores externos como variables secretas.
4. Configurar la URL pública de frontend en `FRONTEND_URL` y `FRONTEND_BASE_URL`.
5. Usar `/health` como health check.
6. Verificar el bloqueo de CORS del dominio Vercel.

El repositorio contiene `Producto/dani-project-back/vercel.json`, pero no un `render.yaml`: la configuración de Render se hace en su panel con los valores anteriores. En el plan gratuito el servicio se suspende tras unos minutos sin uso y tarda cerca de un minuto en reactivarse; el frontend reintenta automáticamente la subida de evidencias mientras tanto.

### Frontend en Vercel

El archivo raíz `vercel.json` ejecuta:

- build desde `Producto/dani-project-front`
- `npm install`
- `CI=false npm run build`
- salida `Producto/dani-project-front/build`

Configurar `REACT_APP_API_URL` como variable de construcción y desplegarla con la URL pública HTTPS de Render. El cliente actual usa `process.env.REACT_APP_API_URL` o `http://127.0.0.1:8000`.

### Docker

Backend:

```bash
docker build -t normia-back Producto/dani-project-back
docker run --env-file Producto/dani-project-back/.env -p 8000:8000 normia-back
```

Frontend:

```bash
docker build --build-arg REACT_APP_API_URL=http://localhost:8000 -t normia-front Producto/dani-project-front
docker run -p 3000:80 normia-front
```

## 8. Cómo agregar un módulo nuevo

1. Crear el modelo en `app/models`.
2. Registrar todas sus relaciones y `organization_id` si los datos son empresariales.
3. Crear schemas o DTO en el router o en un módulo Pydantic definido; el proyecto no tiene actualmente una carpeta común de schemas.
4. Crear el router en `app/routes` con prefijo `/api/<modulo>`.
5. Usar `Depends(get_current_org)` y `scope_to_org`/`get_scoped_or_404` para datos multiempresa.
6. Aplicar `RequireRole` o `require_admin/require_superadmin` según la matriz.
7. Crear servicios en `app/services` solo si la lógica reutiliza integración o procesamiento.
8. Importar y registrar el router en `app/main.py`.
9. Agregar la página React en `src/pages`, enlace de navegación y llamada REST.
10. Agregar pruebas para 200/401/403 y aislamiento entre organizaciones.
11. Documentar rutas, variables nuevas y riesgos residuales.

No crear una tabla o router sin confirmar su persistencia, modelo y relación con la organización.
