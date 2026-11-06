<div align="center">
  <img width="200" height="200" alt="dani logo" src="https://github.com/user-attachments/assets/7722c9bc-319d-47e5-be7a-07f332b0db00" />
</div>

# DANI — Governance, Risk & Compliance (GRC) Platform

> **Plataforma SaaS inteligente de cumplimiento ISO 27001:2022** que automatiza el proceso de certificación mediante IA generativa, análisis de brechas en tiempo real y gestión documental asistida.

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [El Problema que Resuelve](#el-problema-que-resuelve)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Módulos Implementados](#módulos-implementados)
- [Instalación Local](#instalación-local)
- [Variables de Entorno](#variables-de-entorno)
- [Scripts de Inicialización](#scripts-de-inicialización)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Despliegue en Producción](#despliegue-en-producción)
- [Credenciales por Defecto](#credenciales-por-defecto)
- [Pruebas](#pruebas)
- [Equipo](#equipo)

---

## Descripción General

**DANI** es una plataforma de cumplimiento normativo que centraliza, automatiza y visualiza el estado de cumplimiento ISO 27001 en tiempo real. Integra un motor de IA (DeepSeek) con arquitectura RAG (Retrieval-Augmented Generation) sobre documentación ISO 27001:2022 e ISO 27002:2022 para asistir a los equipos de seguridad en la redacción de políticas, evaluación de controles y gestión de evidencias.

> **Objetivo:** Reducir el tiempo de implementación ISO 27001 transformando un proceso burocrático en un flujo de trabajo inteligente, colaborativo y auditable.

---

## El Problema que Resuelve

- Carpetas infinitas de documentos desconectados entre sí
- Hojas de cálculo manuales propensas a errores
- Falta de visibilidad en tiempo real del estado de cumplimiento
- Auditorías de último minuto llenas de estrés
- Dificultad para mapear controles técnicos a la normativa

---

## Stack Tecnológico

### Frontend

| Componente | Tecnología |
|---|---|
| Framework | React 19 + Create React App |
| Routing | React Router v7 |
| Iconografía | Lucide React |
| Estilos | CSS-in-JS (inline styles con variables de tema) |
| Estado | Context API (AuthContext, ThemeContext) |
| i18n | Sistema de traducciones propio (ES / EN / PT) |
| PDF Export | html2pdf.js |

### Backend

| Componente | Tecnología |
|---|---|
| Framework | FastAPI 0.109 + Uvicorn |
| Base de Datos | PostgreSQL (Neon.tech) + pgvector 0.2.5 |
| ORM | SQLAlchemy 2.0 async + asyncpg |
| Autenticación | JWT (HS256) + bcrypt |
| IA / LLM | DeepSeek (`deepseek-chat`) vía SDK de OpenAI |
| Embeddings | FastEmbed (384 dimensiones) |
| RAG | pgvector (cosine distance) sobre evidencias + normativa |
| PDF Parsing | PyMuPDF + pypdf |

### Infraestructura

| Componente | Tecnología |
|---|---|
| Frontend | Vercel |
| Backend | Render.com |
| Base de Datos | Neon.tech (PostgreSQL serverless) |
| API Keys | DeepSeek API |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                       │
│  Dashboard · Gap Analysis · Doc Generator · Risk Map     │
│  Evidence Center · Documents · Audit Room · Employee     │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / JWT
┌───────────────────────▼─────────────────────────────────┐
│                 BACKEND (FastAPI)                         │
│  /api/auth · /api/users · /api/risks · /api/evidence    │
│  /api/compliance · /api/gap-analysis · /api/chat        │
│  /api/documents                                          │
└────────┬───────────────────┬────────────────────────────┘
         │                   │
┌────────▼───────┐  ┌────────▼──────────────────────────┐
│  Neon.tech DB  │  │  DeepSeek API (deepseek-chat)      │
│  PostgreSQL +  │  │  · Análisis de riesgos             │
│  pgvector      │  │  · Generación de documentos SGSI   │
│  · Controles   │  │  · Evaluación de controles (SOA)   │
│  · Evidencias  │  │  · Chat RAG con contexto ISO       │
│  · Normativa   │  └───────────────────────────────────┘
└────────────────┘
```

### RBAC (Control de Acceso por Roles)

| Rol | Dashboard | Gap Analysis | Doc Generator | Risk Map | Usuarios |
|---|---|---|---|---|---|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ✅ | ✅ | ❌ |
| auditor | ✅ | ✅ | ✅ | ✅ | ❌ |
| employee | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Módulos Implementados

### Dashboard
- Health Score visual conectado a `GET /api/gap-analysis/score`
- Estadísticas de riesgos en tiempo real (`GET /api/risks/statistics`)
- Banner de Gap Analysis con control de acceso por rol
- Exportación de reporte vía `window.print()`

### Gap Analysis
- Wizard de evaluación en 4 fases (cláusulas 4-10 ISO 27001)
- SOA (Statement of Applicability) interactiva con 93 controles del Anexo A
- Exportación de SOA en PDF (`GET /api/compliance/soa/export`) con tabla completa de controles, badges de estado y portada con métricas
- Scores por cláusula calculados desde el estado real de controles en BD
- Auditoría individual de controles: DeepSeek evalúa un documento contra un control
- Auditoría masiva RAG: embeddings + cosine similarity + DeepSeek (límite 10 controles por sesión para respetar timeouts de Render.com)
- Vista de Resultados: score general, brechas por cláusula, plan de remediación, KPIs

### Doc Generator
- Genera capítulos completos del Manual SGSI (capítulos 4-10 ISO 27001)
- Prompt de auditor ISO Lead Implementer con 800+ palabras por capítulo (`max_tokens=3000`)
- Guardado en BD con control de versiones automático al publicar
- Flujo de aprobación con RBAC (solo admin/manager/auditor pueden publicar)
- Exportación a PDF con html2pdf.js

### Risk Map
- Matriz de riesgos interactiva (probabilidad × impacto)
- Análisis de riesgos con DeepSeek + prompts dinámicos desde BD
- Simulador de controles con reducción de riesgo calculada
- Fallback inteligente si la API de IA no responde

### Evidence Center
- Carga de evidencias con metadatos
- Generación de embeddings automática al subir documentos
- Exportación de evidencias en ZIP con PDFs profesionales por cláusula ISO, registro de riesgos y resumen ejecutivo (generados con PyMuPDF)

### Sala de Auditoría
- Carpetas seleccionables por cláusula ISO con indicador visual (borde + checkmark)
- Contador de carpetas seleccionadas y opción de seleccionar/deseleccionar todo
- Exportación de paquete ZIP con PDFs organizados por cláusula listos para el auditor

### Gestión de Usuarios
- CRUD completo (crear, editar, desactivar, eliminar)
- Modal de edición con campos: nombre, email, rol, estado activo
- Protegido por RBAC (solo admin)

### Employee Portal
- Vista de políticas publicadas con acuse de recibo digital
- Filtrado por estado de lectura

### Chat DANI AI
- RAG bidireccional: evidencias internas + normativa ISO oficial (pgvector)
- Fallback con respuesta simulada si la API no responde
- Autenticación JWT requerida

### Sidebar
- Anillos de progreso por dominio ISO (Personas / Tecnología / Físico / Procesos)
- Scores calculados desde `GET /api/gap-analysis/domains`

---

## Instalación Local

### Prerrequisitos

- Python 3.9+
- Node.js 18+
- Git

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Dani-ISO27001
```

### 2. Backend

```bash
cd Producto/dani-project-back

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno (ver sección siguiente)
cp .env.example .env   # o crear .env manualmente

# Iniciar el servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

El backend queda disponible en `http://localhost:8000`.
Documentación interactiva: `http://localhost:8000/docs`

### 3. Frontend

```bash
cd Producto/dani-project-front

# Instalar dependencias
npm install

# Iniciar en desarrollo
npm start
```

El frontend queda disponible en `http://localhost:3000`.

---

## Ejecución con Docker

Primero cree cada archivo local de variables desde el ejemplo, sin copiar valores reales ni claves:

```bash
cp Producto/dani-project-back/.env.example Producto/dani-project-back/.env
cp Producto/dani-project-front/.env.example Producto/dani-project-front/.env
```

Complete `Producto/dani-project-back/.env` con una `DATABASE_URL` real de su entorno local o de Neon y configure las claves que vaya a probar. El backend exige `SECRET_KEY` y `DATABASE_URL`.

### Construir y ejecutar el backend

Desde la raíz del repositorio:

```bash
docker build -t normia-back Producto/dani-project-back
docker run --name normia-back --env-file Producto/dani-project-back/.env -p 8000:8000 normia-back
```

Comprobación: `http://localhost:8000/health`.

### Construir y ejecutar el frontend

`REACT_APP_API_URL` se incorpora al JavaScript durante la construcción:

```bash
docker build \
  --build-arg REACT_APP_API_URL=http://localhost:8000 \
  -t normia-front Producto/dani-project-front
docker run --name normia-front -p 3000:80 normia-front
```

Abrir: `http://localhost:3000`.

Los contenedores pueden ejecutarse por separado; para sustituciones manuales o despliegues cloud, cambie `REACT_APP_API_URL` por la URL HTTPS pública del backend antes de construir el frontend. Nunca coloque claves reales dentro del Dockerfile o `.env.example`.

---

## Variables de Entorno

Crear el archivo `.env` en `Producto/dani-project-back/`:

```env
# Base de Datos (PostgreSQL con pgvector)
DATABASE_URL=postgresql+asyncpg://usuario:password@host/dbname?ssl=require

# Seguridad JWT
SECRET_KEY=tu_secreto_de_al_menos_32_caracteres

# IA — DeepSeek (https://platform.deepseek.com)
DEEPSEEK_API_KEY=sk-...

# Alternativa: Groq (fallback automático si DEEPSEEK_API_KEY no está)
# GROQ_API_KEY=gsk_...

# Google Cloud (solo si se usa Cloud Storage — puede dejarse como dummy)
GOOGLE_CLOUD_PROJECT=dummy-project
GOOGLE_APPLICATION_CREDENTIALS=dummy.json
CLOUD_STORAGE_BUCKET=dummy-bucket

# Vector Store (no requerido si se usa pgvector)
VECTOR_STORE_API_KEY=dummy-vector-key
```

> **Nota:** La aplicación funciona sin Redis. El `REDIS_URL` no es requerido para la demo.

---

## Scripts de Inicialización

Ejecutar en orden desde `Producto/dani-project-back/` con el venv activo:

```bash
# 1. Crear todas las tablas en la BD (incluyendo extensión pgvector)
python scripts/create_tables.py

# 2. Cargar los 93 controles del Anexo A de ISO 27001:2022
python scripts/load_iso_controls.py

# 3. Cargar los prompts de IA en la BD
python scripts/load_prompts.py

# 4. Inicializar datos base del Gap Analysis (KPIs, análisis inicial)
python scripts/init_gap_analysis.py

# 5. (Opcional) Ingerir PDFs normativos ISO 27001/27002 para el RAG del chat
#    Requiere los PDFs en la carpeta /Documentación
python scripts/ingest_normativa.py
```

### Verificar conectividad antes de la demo

```bash
# Verificar conexión a la BD
python tests/check_db.py

# Verificar que DeepSeek responde
python tests/test_deepseek.py
```

---

## Estructura del Proyecto

```
Dani-ISO27001/
├── Producto/
│   ├── dani-project-back/          # Backend FastAPI
│   │   ├── app/
│   │   │   ├── main.py             # Entrypoint, CORS, lifespan
│   │   │   ├── config.py           # Settings (Pydantic BaseSettings)
│   │   │   ├── dependencies/
│   │   │   │   ├── auth.py         # get_current_user, require_admin
│   │   │   │   └── database.py     # AsyncSession, engine
│   │   │   ├── models/             # Modelos SQLAlchemy
│   │   │   │   ├── user.py
│   │   │   │   ├── risk.py
│   │   │   │   ├── iso_controls.py
│   │   │   │   ├── gap_analysis.py
│   │   │   │   ├── document.py
│   │   │   │   ├── evidence.py
│   │   │   │   ├── evidence_chunk.py
│   │   │   │   └── normative_chunk.py
│   │   │   ├── routes/             # Endpoints REST
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── risk.py
│   │   │   │   ├── compliance.py
│   │   │   │   ├── gap_analysis.py
│   │   │   │   ├── documents.py
│   │   │   │   ├── evidence.py
│   │   │   │   └── chat.py
│   │   │   └── services/           # Lógica de negocio
│   │   │       ├── ai_service.py       # DeepSeek: chat, generate, evaluate
│   │   │       ├── deepseek_service.py # DeepSeek: análisis de riesgos
│   │   │       ├── gap_analyzer.py     # Scores reales desde BD
│   │   │       ├── embedding_service.py
│   │   │       └── auth_service.py
│   │   ├── scripts/                # Inicialización de datos
│   │   │   ├── create_tables.py
│   │   │   ├── load_iso_controls.py
│   │   │   ├── load_prompts.py
│   │   │   ├── init_gap_analysis.py
│   │   │   └── ingest_normativa.py
│   │   ├── tests/
│   │   │   ├── check_db.py
│   │   │   └── test_deepseek.py
│   │   └── requirements.txt
│   │
│   └── dani-project-front/         # Frontend React
│       └── src/
│           ├── pages/              # Pantallas principales
│           │   ├── Dashboard.jsx
│           │   ├── GapAnalysisScreen.jsx
│           │   ├── DocGeneratorScreen.jsx
│           │   ├── RiskMapScreen.jsx
│           │   ├── EvidenceCenterScreen.jsx
│           │   ├── DocumentsScreen.jsx
│           │   ├── AuditRoomScreen.jsx
│           │   ├── UserManagementScreen.jsx
│           │   ├── EmployeePortal.jsx
│           │   └── Login.jsx
│           ├── components/         # Componentes reutilizables
│           │   ├── Sidebar.jsx
│           │   └── CAPATracker.jsx
│           ├── contexts/
│           │   ├── AuthContext.jsx
│           │   └── ThemeContext.jsx
│           ├── services/
│           │   ├── api.js          # Todos los clientes REST
│           │   └── gapAnalysisAPI.js
│           └── translations/
│               └── controls.js     # Nombres de controles ISO en ES/EN/PT
└── README.md
```

---

## Despliegue en Producción

| Componente | Plataforma | URL |
|---|---|---|
| Frontend | Vercel | `https://*.vercel.app` |
| Backend | Render.com | `https://dani-iso27001-backend.onrender.com` |
| Base de Datos | Neon.tech | PostgreSQL serverless |

> **Importante — Cold Start:** Render.com (plan gratuito) duerme el servidor tras 15 minutos de inactividad. El primer request puede tardar 40-60 segundos. Abrir el backend manualmente antes de la demo haciendo login o llamando a `GET /health`.

El frontend detecta el entorno automáticamente:
```js
// api.js — selección automática de URL
export const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://dani-iso27001-backend.onrender.com';
```

---

## Credenciales por Defecto

El servidor crea automáticamente un usuario administrador al iniciar:

| Campo | Valor |
|---|---|
| Email | `admin@dani27001.com` |
| Contraseña | `admin123` |
| Rol | `admin` |

---

## Pruebas

El proyecto incluye un plan de pruebas funcionales automatizadas con `pytest` que validan los flujos principales de la API.

### Instalación

```bash
cd Producto/dani-project-back
venv\Scripts\activate
pip install pytest
```

### Ejecución

> El backend debe estar corriendo en `http://localhost:8000` antes de ejecutar los tests.

```bash
pytest tests/test_api.py -v
```

### Casos de prueba

| # | Caso | Resultado esperado |
|---|------|--------------------|
| 1 | Login con credenciales válidas | 200 + token JWT |
| 2 | Login con contraseña incorrecta | 401 |
| 3 | Login con usuario inexistente | 401 |
| 4 | Acceso a endpoint protegido sin token | 401 / 403 |
| 5 | Listar riesgos autenticado | 200 + lista |
| 6 | Crear riesgo | 200 + datos correctos |
| 7 | Estadísticas de riesgos | 200 |
| 8 | Listar controles ISO 27001 | 200 + lista no vacía |
| 9 | Estadísticas de cumplimiento | 200 |
| 10 | Exportar SOA en PDF | 200 + content-type PDF |
| 11 | Health check del servidor | 200 |

---

## Equipo

| Rol | Nombre | Responsabilidades |
|---|---|---|
| Líder de Proyecto / Backend | Jordy Mondaca | Arquitectura, Auth, Integración IA, Despliegue |
| Backend | Elías Vicencio | APIs, Modelos BD, Scripts de ingesta |
| Frontend | Génesis Valdebeito | Pantallas, Componentes, i18n |

Proyecto desarrollado para **Alloxentric IA** como parte del programa de formación técnica DUOC UC.

---

<div align="center">

**DANI Platform** · Desarrollado por Alloxentric IA  
*Humanizando la ciberseguridad, un control a la vez.*

</div>
