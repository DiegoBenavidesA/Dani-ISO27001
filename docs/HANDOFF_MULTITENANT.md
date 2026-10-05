# Handoff — Multi-tenant, roles, invitaciones y panel de plataforma

> Documento de contexto para continuar el trabajo. Resume lo implementado,
> decisiones de diseño, credenciales, despliegue y pendientes. Léelo completo
> antes de tocar estas áreas.

## 1. Qué es el proyecto
Plataforma **GRC (Gestión de Riesgo y Cumplimiento)** — nombre interno en GitHub: "DANI".
- **Frontend:** React (Create React App). Carpeta `Producto/dani-project-front`.
- **Backend:** FastAPI + SQLAlchemy async + asyncpg, PostgreSQL (+ pgvector). Carpeta `Producto/dani-project-back`.
- **IA:** Groq / Llama (vía `AIService`).
- Cubre **ISO 27001** (gap analysis, SOA, evidencias, CAPA, evaluación) y **Ley 21.719** (protección de datos de Chile: RoPA, consentimientos, solicitudes, brechas, proveedores, impacto).
- Enfoque que pidió el profesor: presentarlo como **gestión de cumplimiento** (ciclo diagnosticar → cerrar brechas → evidenciar → medir → mejorar), no como un simple registro de datos.

## 2. Modelo de roles (jerarquía multi-tenant)
Enum `UserRole` en `app/models/user.py`:
- **superadmin** — operador de la PLATAFORMA. No pertenece a ninguna empresa. Administra todas las empresas y usuarios.
- **owner** — dueño de una empresa (quien la registra). Control total dentro de su organización.
- **admin** — administrador dentro de una empresa.
- **employee** — usuario normal (solo Portal de Empleados).
- Roles funcionales ISO (asignables por owner/admin): **manager**, **auditor**, **dpo**.

En `RequireRole` (`app/dependencies/auth.py`), **owner y superadmin pasan siempre** cualquier chequeo de rol elevado (jerarquía).

### Matriz de permisos (menú + API)
owner/admin ven TODO dentro de su empresa. Los demás:
- **manager:** Dashboard, Gap Analysis, Generador Docs, Mapa Riesgos, Evidencias, Documentos, Sala Auditoría, Evaluación ISO. (No Ley, no usuarios.)
- **auditor:** igual que manager pero **solo lectura** (no escribe en evidencias, CAPA, gap, assessment) y sin Generador/Riesgos.
- **dpo:** módulos de **Ley 21.719** + Dashboard + Documentos. (No ISO, no riesgos.)
- **employee:** solo Portal de Empleados.

Grupos en backend (`app/dependencies/auth.py`): `ELEVATED_READ`, `ELEVATED_WRITE`, `ELEVATED_NO_DPO`, `LEY_ROLES`. Candados por router en `app/main.py` y por endpoint en `gap_analysis.py`, `capa.py`, `evidence.py`, `assessment_questions.py`.

## 3. URLs por empresa (slug)
- `Organization` tiene campo **`slug`** (único). Genera slug desde el nombre (`app/utils/slug.py`), con palabras reservadas (`admin`, `plataforma`, `login`, `activar`, `api`, `static`).
- Rutas frontend (`App.js`): `/:orgSlug` (panel de la empresa), `/:orgSlug/gap-analysis`, `/activar/:token` (público), `/login`.
- El **superadmin** usa el prefijo neutro **`/admin`** (no pertenece a empresa). En `AuthContext`, `orgSlug` = 'admin' si superadmin, si no el slug de su empresa.
- `ProtectedRoute` valida que el slug de la URL coincida con la empresa del usuario (si no, lo rebota a la suya).

## 4. Panel del superadmin (plataforma)
- El superadmin **solo ve** "Gestión de Empresas" y "Gestión de Usuarios" (sin módulos ISO/Ley). Aterriza en Empresas.
- **Gestión de Empresas** (`OrganizationsScreen.jsx`): crear empresa (solo nombre), invitar usuario y suspender/activar (menú de 3 puntos por fila), columna URL (slug). **Clic en una fila = entrar al panel de esa empresa.**
- **Entrar a una empresa (impersonación):** `AuthContext` guarda `impersonatedOrg` y el interceptor de `fetch` inyecta la cabecera **`X-Org-Id`** en todas las llamadas `/api/`. El backend `get_current_org` acepta esa cabecera **solo para superadmin** (cross-tenant). Botón "Volver a plataforma" en el Sidebar.
- **Gestión de Usuarios global** (`UserManagementScreen.jsx`): lista todos los usuarios con columna **Empresa**, rol editable inline, suspender/editar/eliminar (menú 3 puntos), filtros por rol/estado/empresa, y un **drawer lateral** con permisos del rol. Dentro de una empresa (impersonando) solo muestra usuarios de esa empresa (via `X-Org-Id`).

## 5. Invitaciones por correo (SMTP / Gmail — gratis)
- No se crea usuario con contraseña a mano: se **invita por correo**. El usuario se crea **inactivo, sin contraseña usable**, y define su contraseña al **activar** desde el enlace del correo.
- Backend:
  - `app/services/email_service.py` — envío SMTP (stdlib `smtplib`) + plantilla. Acepta `from_name` (remitente dinámico = nombre de la empresa).
  - `app/services/auth_service.py` — `create_activation_token` / `verify_activation_token` (JWT, 7 días).
  - `POST /api/organizations/{org_id}/invite` (superadmin) y `POST /api/users/invite` (owner/admin a su empresa; superadmin via X-Org-Id). Guarda anti-escalada de roles.
  - `GET /api/auth/activate/{token}` y `POST /api/auth/activate` — datos de invitación y definir contraseña.
- Frontend: `pages/ActivateScreen.jsx` (`/activar/:token`), `authAPI.getActivationInfo/activate`, `userAPI.invite`, modal "Invitar usuario" en Gestión de Usuarios del tenant.

## 6. Catálogo de preguntas de Evaluación (feature de Raúl)
- Backend CRUD en `assessment_questions.py`: `create/update/delete` de preguntas (requieren rol **admin**; owner/superadmin pasan). `POST /evaluate` evalúa con IA y **persiste respuestas por empresa** (requiere escritura, auditor no).
- UI en **`GapAnalysisScreen.jsx`** (NO en AssessmentScreen): pestaña **"Conf. Preguntas"** (visible a superadmin/owner/admin vía `isAdmin`) con crear/editar/eliminar.
- Secciones de evaluación agrupan por `categoria`. Se agregó la sección **"Ley 21.719 — Privacidad"** (match `categoria === 'Privacidad'` o que empiece con "ley"). El formulario ya ofrece la categoría "Ley 21.719 - Privacidad".

## 7. Cuentas semilla (se crean/corrigen al arrancar — `app/main.py` lifespan)
- **Superadmin de plataforma:** `superadmin@dani27001.com` / `superadmin123` (configurable por env `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`). No pertenece a ninguna empresa.
- `admin@dani27001.com` queda como **OWNER** (ya no es superadmin).
- ⚠️ Bug conocido: un **owner/admin SIN empresa** (org_id NULL) queda atascado en la pantalla de login (el frontend necesita `organizationSlug`). En BDs locales sin "Empresa Demo", usar la cuenta **superadmin**. Pendiente: endurecer el frontend para ese caso.

## 8. Migración de base de datos
El `lifespan` de `main.py` aplica automáticamente al arrancar (en entornos que ejecutan el startup, p. ej. **Render** con uvicorn; NO en Vercel que usa `lifespan` off):
- `CREATE EXTENSION vector`, `create_all`
- `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug` + índice único
- `ALTER TYPE userrole ADD VALUE 'SUPERADMIN' / 'OWNER'` (en conexión AUTOCOMMIT)
- Backfill de slugs, seed de superadmin, admin→owner

SQL manual (fallback, correr una por una; ADD VALUE fuera de transacción):
```sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug VARCHAR(120);
CREATE UNIQUE INDEX IF NOT EXISTS ix_organizations_slug ON organizations (slug);
ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'SUPERADMIN';
ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OWNER';
```
(Superadmin y slugs los crea el arranque, no por SQL.)

## 9. Despliegue
- **Backend:** Render (`https://dani-iso27001.onrender.com`). Corre el `lifespan` → auto-migra Neon al redeployar.
- **Frontend:** Vercel (`https://dani-iso-27001-ebon.vercel.app`).
- **BD:** Neon (Postgres).
- **Variables de entorno a configurar en Render:**
  - `SMTP_USER`, `SMTP_PASSWORD` (Gmail + App Password de 16 caracteres) — para invitaciones.
  - `FRONTEND_BASE_URL=https://dani-iso-27001-ebon.vercel.app` — para los enlaces de activación.
  - `SUPERADMIN_PASSWORD` (fuerte), `SUPERADMIN_EMAIL` (opcional).
  - `SMTP_FROM_NAME=GRC` (fallback; las invitaciones usan el nombre de la empresa).
  - No tocar las existentes: `DATABASE_URL` (Neon), `SECRET_KEY`, `GROQ_API_KEY`.

## 10. Correr en local (Windows)
- Backend: Python **3.11** (venv), Docker/Postgres corriendo. `uvicorn app.main:app --host 0.0.0.0 --port 8000`. Si falla asyncpg por el event loop de Windows, usar un `run_local.py` con `WindowsSelectorEventLoopPolicy` (archivo local, ignorado por git).
- Frontend: `npm start` (puerto 3000). El fallback de API quedó en `http://127.0.0.1:8000` (en `services/api.js`). Si el backend corre en otro puerto, crear `Producto/dani-project-front/.env.local` con `REACT_APP_API_URL=http://127.0.0.1:<puerto>`.
- Archivos locales ignorados por git: `run_local.py`, `.env.local`, `venv311/`.

## 11. Ramas y estado
- Rama principal de este trabajo: **`feature/fix`** (ya mergeada con `main`). También existe `raul_barrera`.
- Commits clave: multi-tenant+roles+invitaciones, merge de main (CRUD preguntas), fix puerto API 8001→8000, `isAdmin` para Conf. Preguntas (owner/superadmin), sección Ley en evaluación.

## 12. Pendientes / ideas
- Endurecer frontend para "owner/admin sin empresa" (no dejarlo atascado en login).
- Separación fina lectura/escritura ya aplicada en evidencias, CAPA, assessment; revisar si falta en otros módulos.
- Posible feature: sistema de invitaciones con más categorías de la Ley; planes (campo `plan` existe pero no se usa aún).
- Reforzar el enfoque "gestión de cumplimiento" en textos/dashboard.
