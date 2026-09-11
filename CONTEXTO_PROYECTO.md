# 🧭 Contexto del Proyecto GRC — Guía para trabajar con IA

> **Para qué sirve este documento:** darle a una IA (ChatGPT, Gemini, Claude, etc.) el contexto completo del proyecto **sin que tenga acceso al código**. Con esto, la IA sabe **cómo está estructurado el proyecto y en qué archivo se edita cada cosa**, para poder pedirte los archivos correctos y proponer cambios sin romper el resto.

## 📌 Cómo usar este documento (léelo primero)

1. **Pega este documento completo** al inicio de tu conversación con la IA.
2. Explícale la tarea que quieres hacer (ej: *"quiero cambiar las preguntas de la evaluación de brechas"*).
3. La IA, usando este contexto, te dirá **qué archivos necesita ver**. Te pedirá algo como:
   > *"Pásame el contenido de estos archivos: `GapAnalysisScreen.jsx`, `compliance.py`..."*
4. Tú **copias y pegas el contenido de esos archivos** desde tu editor.
5. La IA propone los cambios **solo sobre esos archivos**, sin inventar rutas ni tocar cosas que no debe.

> ⚠️ **Regla de oro:** la IA **NO debe adivinar** el contenido de un archivo. Si lo necesita, que te lo pida y tú se lo pegas. Así evitamos errores.

---

## 1. ¿Qué es el proyecto?

**GRC** (Gestión de Riesgo y Cumplimiento) es una **plataforma web que ayuda a las empresas a cumplir la norma de seguridad ISO 27001**, usando inteligencia artificial para acelerar el proceso (redactar documentos, evaluar controles, gestionar evidencias y riesgos).

- **La plataforma YA EXISTE y funciona.** No se construye desde cero.
- **El trabajo actual del equipo** es **integrarle el cumplimiento de la Ley N° 21.719 de Chile** (protección de datos personales): agregar módulos para registro de tratamientos, consentimientos, derechos de los titulares y notificación de brechas.

> 📋 **El plan de tareas detallado** para esa integración (tablas, APIs y pantallas, fundamentadas en la ley) está en [`PLAN_INTEGRACION_LEY_21719.md`](./PLAN_INTEGRACION_LEY_21719.md). Léelo junto con este documento cuando trabajes en la Ley 21.719.

---

## 2. Stack tecnológico (qué tecnologías usa)

| Capa | Tecnología |
|---|---|
| **Frontend** | React 19 (Create React App). Estilos con CSS-in-JS (estilos inline). Estado con Context API. Sin Redux. |
| **Backend** | Python + FastAPI (async). SQLAlchemy 2.0. Pydantic. |
| **Base de datos** | PostgreSQL + extensión `pgvector` (para búsqueda por vectores/RAG). |
| **IA (LLM)** | ⚠️ Aunque hay archivos llamados "deepseek", **realmente usa Groq con el modelo `llama-3.3-70b-versatile`** (configurable). Se consume vía el SDK de OpenAI. |
| **Embeddings / RAG** | `fastembed` (vectores de 384 dimensiones) + pgvector. |
| **Almacenamiento de archivos** | Supabase Storage. |
| **Autenticación** | JWT (HS256) + bcrypt. |
| **Despliegue** | Frontend en Vercel · Backend en Render · Base de datos en Neon/Supabase. |

---

## 3. Estructura general de carpetas

```
Dani-ISO27001/
├── Producto/
│   ├── dani-project-front/     ← FRONTEND (React)
│   │   └── src/
│   │       ├── pages/          ← Las pantallas principales
│   │       ├── components/     ← Componentes reutilizables
│   │       ├── contexts/       ← Estado global (auth, tema)
│   │       ├── services/       ← Conexión con el backend (fetch)
│   │       └── translations/   ← Textos traducidos
│   │
│   └── dani-project-back/      ← BACKEND (FastAPI)
│       ├── app/
│       │   ├── routes/         ← Los endpoints de la API
│       │   ├── services/       ← Lógica de negocio
│       │   ├── models/         ← Las tablas de la base de datos
│       │   ├── data/           ← Datos semilla (JSON)
│       │   └── dependencies/   ← Conexión a BD, auth
│       └── scripts/            ← Scripts para cargar datos a la BD
│
├── docs/                       ← Documentación de la asignatura
└── CONTEXTO_PROYECTO.md        ← ESTE archivo
```

---

## 4. FRONTEND — Las pantallas (qué muestra cada una)

Ruta base: `Producto/dani-project-front/src/pages/`

| Archivo | Pantalla | Qué muestra / hace |
|---|---|---|
| `Login.jsx` | **Login** | Inicio de sesión y registro. Autentica y redirige según el rol. |
| `Dashboard.jsx` | **Panel principal** | Resumen del cumplimiento: health score, controles implementados, riesgos abiertos, días para la auditoría. Exporta un informe ejecutivo PDF. |
| `GapAnalysisScreen.jsx` | **Análisis de Brechas + SOA** | ⭐ Pantalla clave. Cuestionario de evaluación, tabla de los 93 controles ISO (SOA) y auditoría con IA de documentos contra los controles. |
| `DocGeneratorScreen.jsx` | **Generador de Documentos** | Genera con IA los capítulos del manual SGSI. Vista dividida borrador-IA / edición. Flujo de aprobación. |
| `RiskMapScreen.jsx` | **Mapa de Riesgos** | Matriz 5×5 (probabilidad × impacto). Crear riesgos, simulador de mitigación y análisis con IA. |
| `EvidenceCenterScreen.jsx` | **Centro de Evidencias** | Subir documentos (se indexan para RAG), control de vigencia, solicitudes de evidencia. |
| `DocumentsScreen.jsx` | **Gestor Documental / Chat con documentos** | Lista de documentos + chat que responde preguntas sobre ellos. |
| `AuditRoomScreen.jsx` | **Sala de Auditoría** | Organiza evidencias por cláusula ISO y exporta el paquete ZIP para el auditor. |
| `EmployeePortal.jsx` | **Portal del Empleado** | Los empleados leen y aceptan políticas (queda registro). |
| `UserManagementScreen.jsx` | **Gestión de Usuarios** | CRUD de usuarios y roles (solo admin). |
| `SettingsModal.jsx` | **Ajustes** | Cambiar contraseña, idioma, apariencia (es un modal, no una página completa). |
| `ChatDANI.jsx` | **Chat DANI** | Asistente IA flotante que responde usando evidencias + la norma (RAG). |

### Otros archivos importantes del frontend

| Archivo | Qué hace |
|---|---|
| `src/dani-platform-respaldo.jsx` | ⭐ **El orquestador principal.** Arma el layout (sidebar, header) y decide qué pantalla mostrar. **Aquí se agrega/quita una pantalla del menú.** |
| `src/dani-platform-v1.jsx` | Versión vieja, **NO se usa.** Ignóralo. |
| `src/App.js` | Rutas principales (`/login`, `/`) y providers. |
| `src/contexts/AuthContext.jsx` | Login, logout, usuario actual, token. |
| `src/contexts/ThemeContext.jsx` | Temas (claro/oscuro/alto contraste) y traducciones (ES/EN/PT). |
| `src/services/api.js` | ⭐ **Todas las llamadas al backend** (auth, usuarios, riesgos, evidencias, cumplimiento, documentos, chat). Aquí se agrega un nuevo endpoint del lado del front. |
| `src/services/gapAnalysisAPI.js` | Llamadas específicas del análisis de brechas. |
| `src/components/` | Componentes reutilizables: `Sidebar`, `CAPATracker`, `NotificationCenter`, `CommandPalette`, `ProtectedRoute`, paneles del dashboard, etc. |

> ⚠️ **Ojo:** la carpeta `src/components/GapAnalysis/` (ComplianceScore, ControlsProgress, KPIDashboard, RemediationPlan, GapAnalysisDashboard) contiene **archivos vacíos** — nunca se implementaron. La lógica del gap analysis está toda dentro de `pages/GapAnalysisScreen.jsx`.

---

## 5. BACKEND — Los endpoints (routes)

Ruta base: `Producto/dani-project-back/app/routes/`

| Archivo | Prefijo API | Qué hace |
|---|---|---|
| `auth.py` | `/api/auth` | Login, registro, cambiar contraseña, datos del usuario. |
| `users.py` | `/api/users` | CRUD de usuarios, preferencias. |
| `risk.py` | `/api/risks` | Crear/listar riesgos, estadísticas, análisis con IA. |
| `evidence.py` | `/api/evidence` | Subir/listar/descargar evidencias, indexación RAG, exportar ZIP. |
| `documents.py` | `/api/documents` | Generar documentos SGSI con IA, estados, políticas, acuse de recibo. |
| `compliance.py` | `/api/compliance` | ⭐ Controles ISO, SOA, **evaluación de documentos con IA contra controles** (`/{control_id}/evaluate`, `/bulk-audit`). |
| `chat.py` | `/api/chat` | Chat RAG (evidencias + norma). |
| `gap_analysis.py` | `/api/gap-analysis` | Análisis de brechas, scores, KPIs, plan de remediación. |
| `capa.py` | `/api/capas` | No conformidades y acciones correctivas. |
| `notifications.py` | `/api/notifications` | Notificaciones dinámicas. |
| `report.py` | `/api/reports` | Informe ejecutivo con narrativa IA. |
| `ai_routes.py` | `/api/ai` | Chat simple con IA (sin RAG). |
| `dashboard.py`, `remediation.py` | — | Rutas auxiliares. |

---

## 6. BACKEND — La lógica (services)

Ruta base: `Producto/dani-project-back/app/services/`

| Archivo | Qué hace |
|---|---|
| `ai_service.py` | ⭐ **Cliente principal de IA.** Funciones: `chat`, `analyze_risk`, `generate_document`, `evaluate_compliance` (evalúa 1 documento vs 1 control), `mass_evaluate_control` (evalúa vs fragmentos RAG). |
| `deepseek_service.py` | Segundo cliente IA (carga prompts desde la tabla `ai_prompts`). Nombre engañoso: también apunta a Groq. |
| `gap_analyzer.py` | Motor del análisis de brechas: calcula scores por cláusula, madurez, plan de remediación, KPIs, y `analyze_document_with_llm`. |
| `iso_compliance_analyzer.py` | Carga los controles desde `data/iso_controls.json` y evaluación básica por reglas. |
| `iso_parser.py` | Catálogo estático de los 93 controles ISO 27001:2022. |
| `embedding_service.py` | ⭐ **Núcleo del RAG.** Extrae texto de PDF/DOCX, hace chunking y genera embeddings (384 dim) con fastembed. |
| `storage_service.py` | Sube/descarga archivos de Supabase Storage. |
| `auth_service.py` | Hash de contraseñas (bcrypt) y tokens JWT. |
| `db_service.py` | CRUD genérico sobre SQLAlchemy. |
| `risk_service.py` | Servicio de riesgos (con caché Redis). |
| `evidence_service.py`, `remediation_planner.py`, `kpi_service.py`, `doc_generator.py` | ⚠️ **Archivos vacíos.** Su lógica está en las rutas o en `gap_analyzer.py`. No los uses. |

---

## 7. BACKEND — Las tablas de la base de datos (models)

Ruta base: `Producto/dani-project-back/app/models/`

| Archivo | Tabla | Qué guarda |
|---|---|---|
| `user.py` | `users` | Usuarios (email, contraseña hasheada, rol, preferencias). |
| `risk.py` | `risks` | Riesgos (título, probabilidad, impacto, nivel, estado). |
| `evidence.py` | `evidences` | Documentos subidos (archivo, metadatos, estado de indexación). |
| `evidence_chunk.py` | `evidence_chunks` | Fragmentos de las evidencias + su vector (para RAG). |
| `normative_chunk.py` | `normative_chunks` | Fragmentos de la norma ISO oficial + su vector. |
| `document.py` | `documents` | Documentos del SGSI generados (capítulos, estado, versión). |
| `iso_controls.py` | `iso_controls` | ⭐ Los 93 controles ISO + el veredicto de cada uno (aplica, estado, score, justificación). |
| `gap_analysis.py` | `gap_analysis`, `remediation_actions`, `control_implementation`, `kpi` | Brechas por cláusula, acciones de remediación, KPIs. |
| `capa.py` | `capas` | No conformidades y acciones correctivas. |
| `prompt.py` | `ai_prompts` | Prompts de IA cargados desde JSON. |
| `assessment.py` | `risk_assessments` | Análisis de riesgo por IA (NO son preguntas de cuestionario). |
| `compliance.py`, `remediation.py` | — | Modelos auxiliares. |

---

## 8. BACKEND — Datos semilla y scripts

- **`app/data/`**: `iso_controls.json` (93 controles), `ai_prompts.json` (prompts), `risk_matrix.json`.
- **`scripts/`**: scripts para cargar esos JSON a la base de datos. El más importante como **patrón a copiar** es `load_prompts.py` (borra la tabla y re-inserta desde el JSON). Otros: `create_tables.py`, `load_iso_controls.py`, `ingest_normativa.py`.

> 💡 **Patrón útil:** para agregar datos nuevos a la BD (por ejemplo, preguntas de evaluación), se crea un modelo + un `.json` en `data/` + un script en `scripts/` copiando `load_prompts.py`.

---

## 9. Cómo se conecta el Frontend con el Backend

```
Pantalla (pages/*.jsx)
      ↓ llama a
services/api.js  (o gapAnalysisAPI.js)   ← aquí está el fetch con la URL y el token
      ↓ HTTP (con JWT)
routes/*.py  (el endpoint FastAPI)
      ↓ usa
services/*.py  (la lógica)  →  models/*.py  (la base de datos)  /  ai_service.py (la IA)
```

**Regla:** si agregas una función nueva, normalmente tocas **4 archivos**: el `model` (tabla), el `service` (lógica), el `route` (endpoint) y el `api.js` (para que el front lo llame), más la pantalla `.jsx` que lo muestra.

---

## 10. 🔧 Recetas: dónde editar para tareas comunes

| Quiero... | Edito principalmente... |
|---|---|
| Cambiar cómo se ve una pantalla | `pages/<LaPantalla>.jsx` |
| Agregar/quitar una pantalla del menú | `dani-platform-respaldo.jsx` + `components/Sidebar.jsx` |
| Cambiar las preguntas del análisis de brechas | Hoy: `pages/GapAnalysisScreen.jsx` (están hardcodeadas). *(Se planea moverlas a la BD.)* |
| Agregar una llamada nueva al backend (front) | `services/api.js` |
| Crear un endpoint nuevo (back) | `routes/<dominio>.py` + registrarlo en `main.py` |
| Cambiar la lógica de la IA | `services/ai_service.py` |
| Agregar una tabla nueva a la BD | Nuevo archivo en `models/` + importarlo en `main.py` |
| Cargar datos semilla a la BD | `.json` en `app/data/` + script en `scripts/` (copiar `load_prompts.py`) |
| Cambiar textos traducidos | `contexts/ThemeContext.jsx` (UI global) o el objeto `translations` dentro de cada pantalla |

---

## 11. ⚠️ Cosas importantes que la IA debe saber

1. **El nombre real del proyecto es "GRC"** (Gestión de Riesgo y Cumplimiento). En el código viejo aparece como "DANI" o "CGR" — es lo mismo, pero al escribir texto nuevo usar **"GRC"**.
2. **La IA del proyecto es Groq (Llama 3.3), NO DeepSeek**, aunque haya archivos con ese nombre.
3. **Hay funciones que parecen reales pero son demo/simuladas** (algunos conectores, el 2FA, ciertas animaciones). No asumir que todo lo que se ve funciona de verdad.
4. **Hay archivos vacíos** (varios `services/*.py` y toda la carpeta `components/GapAnalysis/`). No apoyarse en ellos.
5. **El proyecto es mono-empresa (un solo tenant) por ahora.** Los datos no están separados por organización todavía.
6. **La norma ISO 27001:2022 tiene 93 controles** (no 114 — ese número viejo aparece en algún lado y es un error).
7. **No inventar rutas de archivos ni el contenido de un archivo.** Si se necesita ver un archivo, **pedírselo al usuario** y que lo pegue.
8. **Objetivo actual del equipo:** integrar la **Ley 21.719** (protección de datos) sobre la plataforma existente. Todo cambio nuevo debería alinearse a eso.

---

## 12. Prompt sugerido para empezar con la IA

Copia esto después de pegar este documento:

> *"Este es el contexto de mi proyecto. Voy a pedirte ayuda con una tarea. Antes de proponer cambios, dime exactamente qué archivos necesitas ver y yo te pego su contenido. No inventes el contenido de ningún archivo ni rutas que no estén en este documento. Cuando propongas cambios, indícame en qué archivo va cada uno. La tarea es: [DESCRIBE AQUÍ TU TAREA]."*

---

*Documento de contexto del proyecto GRC · ISO 27001 + Ley 21.719. Mantener actualizado cuando cambie la estructura del proyecto.*
