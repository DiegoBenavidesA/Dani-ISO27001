# 🏗️ Plan de Integración — Ley N° 21.719 en la plataforma GRC

> **Qué es este documento:** el plan de trabajo, **subdividido en tareas pequeñas**, para agregar el cumplimiento de la **Ley N° 21.719 de Protección de Datos Personales (Chile)** a la plataforma GRC. Cada tabla, API y pantalla está **fundamentada** en una obligación real de la ley o en cómo lo hacen las plataformas del rubro. **Nada está inventado.**
>
> Complementa a [`CONTEXTO_PROYECTO.md`](./CONTEXTO_PROYECTO.md). Léelo junto con ese.

## 📌 Cómo usar este documento (importante)

- **NO hagas todo de golpe.** Cada tarea (1.1, 1.2, …) se hace **de a una, con calma**. Terminar y probar una antes de pasar a la siguiente evita errores en cadena.
- Cada tarea dice **qué archivo se toca** y **por qué existe** (su fundamento legal).
- Es una **primera versión**. Es normal que en unas semanas una tarea que hoy parece simple se subdivida en varias. Cuando eso pase, se edita aquí.
- Antes de programar una tarea, pásale a tu IA este documento + el `CONTEXTO_PROYECTO.md`, y pídele que te diga qué archivos necesita ver.

---

## 1. Fundamento: ¿qué exige la Ley 21.719? (el "porqué" de todo)

La Ley 21.719 (vigencia plena **1 de diciembre de 2026**) obliga a toda organización que trate datos personales a cumplir, como mínimo:

| # | Obligación de la ley | Qué significa | Se traduce en el módulo… |
|---|---|---|---|
| O1 | **Registro de actividades de tratamiento (RoPA)** | Inventario de qué datos personales maneja la empresa, para qué, con qué base legal, dónde viven y cuánto se conservan. | Registro de Tratamientos |
| O2 | **Base de licitud / consentimiento** | Poder demostrar el permiso (o base legal) para usar cada dato. | Consentimientos |
| O3 | **Derechos ARCO+P** (Acceso, Rectificación, Cancelación, Oposición, Portabilidad) | Canales y procedimientos para responder a las personas en **30 días hábiles**. | Solicitudes de Titulares |
| O4 | **Notificación de brechas** | Registrar y notificar a la Agencia una filtración en **72 horas**. | Gestión de Brechas |
| O5 | **Contratos con proveedores (encargados)** | Controlar a los terceros que acceden a los datos. | Proveedores |
| O6 | **Evaluación de impacto (DPIA)** | Analizar el riesgo antes de tratamientos de alto impacto. | Evaluación de Impacto |
| O7 | **Delegado de Protección de Datos (DPO)** | Designar un responsable (en ciertos casos). | Rol/campo de usuario |
| O8 | **Medidas de seguridad** (idealmente ISO 27001) | Proteger técnicamente los datos. | ✅ **Ya lo cubre la plataforma** (ISO 27001) |

> **Punto clave:** la obligación **O8 (medidas de seguridad) ya está resuelta** por lo que la plataforma hace hoy con la ISO 27001. La integración de la Ley 21.719 consiste en **agregar los módulos O1–O7**, que son la parte de "privacidad" que hoy no existe.

**Fuente de estas obligaciones:** ver sección [Fundamento legal](#-fundamento-legal-y-fuentes) al final.

---

## 2. Principio de diseño (para que todo tenga sentido)

1. **Reutilizar lo que ya existe.** La plataforma ya tiene: catálogo de controles (`iso_controls`), evidencias con RAG (`evidences` + `evidence_chunks`), motor de IA (`ai_service.py`), y un patrón para cargar datos semilla (`load_prompts.py`). Los módulos nuevos **imitan esos patrones**, no reinventan.
2. **Preparado para multi-empresa (multi-tenant).** Aunque hoy la plataforma es de una sola empresa, **todas las tablas nuevas llevan un campo `organization_id`** desde el inicio. Cuesta poco ahora y evita una migración enorme después. *(El multi-tenant completo es un proyecto aparte, pero dejamos el terreno listo.)*
3. **Auditable.** Todo registro lleva fechas y responsable, porque el objetivo es **demostrar cumplimiento** ante la Agencia.

---

## 3. FASE 1 — Base de datos (crear las tablas)

> **Por qué primero las tablas:** sin la estructura de datos, ni las APIs ni las pantallas tienen dónde guardar la información. Cada tabla = una obligación de la ley.
> Ruta: `Producto/dani-project-back/app/models/`

### Tarea 1.1 — Tabla `data_treatments` (Registro de tratamientos / RoPA)
- **Por qué:** es la obligación **O1**, el corazón de la ley. Sin este inventario no hay cumplimiento posible.
- **Campos:** `id`, `nombre`, `finalidad`, `base_licitud`, `categorias_datos`, `origen`, `destinatarios`, `transferencias_internacionales`, `plazo_conservacion`, `responsable`, `organization_id`, `created_at`, `updated_at`.
- **Archivo:** `models/data_treatment.py`

### Tarea 1.2 — Tabla `consents` (Consentimientos)
- **Por qué:** obligación **O2**. Hay que probar el permiso de cada persona.
- **Campos:** `id`, `titular` (identificación de la persona), `treatment_id` (FK → `data_treatments`), `fecha_otorgado`, `medio` (web, papel, etc.), `estado` (otorgado/revocado), `fecha_revocado`, `comprobante_url`, `organization_id`.
- **Archivo:** `models/consent.py`

### Tarea 1.3 — Tabla `data_subject_requests` (Solicitudes ARCO+P)
- **Por qué:** obligación **O3**. La ley da **30 días hábiles** para responder; hay que controlar ese plazo.
- **Campos:** `id`, `titular`, `tipo` (acceso/rectificación/cancelación/oposición/portabilidad), `descripcion`, `fecha_solicitud`, `fecha_limite` (calculada: +30 días hábiles), `estado` (pendiente/en_proceso/resuelta), `responsable`, `respuesta`, `organization_id`.
- **Archivo:** `models/data_subject_request.py`

### Tarea 1.4 — Tabla `data_breaches` (Brechas de datos)
- **Por qué:** obligación **O4**. Notificación en **72 horas**; hay que registrar el incidente y controlar el plazo.
- **Campos:** `id`, `fecha_deteccion`, `descripcion`, `datos_afectados`, `cantidad_afectados`, `gravedad`, `fecha_limite_notificacion` (+72h), `fecha_notificacion`, `estado`, `medidas_tomadas`, `responsable`, `organization_id`.
- **Archivo:** `models/data_breach.py`

### Tarea 1.5 — Tabla `vendors` (Proveedores / encargados)
- **Por qué:** obligación **O5**. Los terceros que acceden a datos deben estar controlados por contrato.
- **Campos:** `id`, `nombre`, `datos_compartidos`, `pais`, `estado_contrato` (vigente/pendiente/vencido), `treatment_id` (FK, qué tratamiento le corresponde), `organization_id`.
- **Archivo:** `models/vendor.py`

### Tarea 1.6 — Tabla `impact_assessments` (Evaluación de impacto / DPIA)
- **Por qué:** obligación **O6**. Para tratamientos de alto riesgo hay que evaluar antes.
- **Campos:** `id`, `treatment_id` (FK), `nivel_riesgo`, `descripcion_riesgo`, `medidas_mitigacion`, `estado`, `responsable`, `organization_id`.
- **Nota:** se puede reutilizar parte de la lógica del **Mapa de Riesgos** que ya existe (`models/risk.py`).
- **Archivo:** `models/impact_assessment.py`

### Tarea 1.7 — Campo/rol de DPO (Delegado)
- **Por qué:** obligación **O7**. En ciertos casos hay que designar un Delegado.
- **Cómo:** **no requiere tabla nueva.** Se agrega un rol/campo al modelo `user.py` existente (ej. marcar a un usuario como DPO).
- **Archivo:** `models/user.py`

### Tarea 1.8 — Registrar los modelos y crear las tablas
- **Por qué:** para que FastAPI/SQLAlchemy conozca las tablas nuevas y las cree en la BD.
- **Cómo:** importar los modelos nuevos en `app/main.py` (donde ya se importan los demás). Al arrancar, se crean solas.
- **Archivo:** `app/main.py`

---

## 4. FASE 2 — Backend / APIs (los endpoints)

> **Por qué:** las pantallas necesitan endpoints para leer y guardar datos. Un módulo = un archivo de rutas (siguiendo el patrón de `routes/risk.py`, etc.).
> Ruta: `Producto/dani-project-back/app/routes/`

| Tarea | API | Qué hace | Obligación | Archivo |
|---|---|---|---|---|
| **2.1** | Registro de tratamientos | CRUD de `data_treatments` | O1 | `routes/treatments.py` |
| **2.2** | Consentimientos | CRUD + registrar/revocar | O2 | `routes/consents.py` |
| **2.3** | Solicitudes ARCO+P | CRUD + cálculo de plazo (30 días) + alertas | O3 | `routes/data_requests.py` |
| **2.4** | Brechas | CRUD + flujo de notificación (72h) + alertas | O4 | `routes/breaches.py` |
| **2.5** | Proveedores | CRUD de `vendors` | O5 | `routes/vendors.py` |
| **2.6** | Evaluación de impacto | CRUD de `impact_assessments` | O6 | `routes/impact.py` |
| **2.7** | Registrar routers | Incluir los routers nuevos | — | `app/main.py` |

### Tarea 2.8 — Conectar la IA (reutilizar `ai_service.py`)
- **Por qué:** el valor diferenciador del proyecto es usar IA. La IA puede **asistir** en:
  - Sugerir la **base de licitud** de un tratamiento a partir de su descripción.
  - **Clasificar** qué datos son personales/sensibles en un documento subido.
  - Evaluar el **riesgo** de un tratamiento (DPIA).
- **Cómo:** agregar funciones a `services/ai_service.py` imitando `evaluate_compliance` (que ya existe).
- **Archivo:** `services/ai_service.py`

---

## 5. FASE 3 — Frontend (las pantallas)

> Ruta: `Producto/dani-project-front/src/pages/`

| Tarea | Pantalla | Qué muestra | Archivo |
|---|---|---|---|
| **3.1** | Registro de Tratamientos | Tabla del inventario de datos (RoPA) | `pages/TreatmentsScreen.jsx` |
| **3.2** | Consentimientos | Lista y estado de consentimientos | `pages/ConsentsScreen.jsx` |
| **3.3** | Solicitudes de Titulares | Bandeja de solicitudes ARCO+P con su plazo | `pages/DataRequestsScreen.jsx` |
| **3.4** | Gestión de Brechas | Registro de brechas y su notificación | `pages/BreachesScreen.jsx` |
| **3.5** | Proveedores | Lista de encargados y estado de contrato | `pages/VendorsScreen.jsx` |
| **3.6** | Evaluación de Impacto | DPIA por tratamiento | `pages/ImpactScreen.jsx` |
| **3.7** | Menú | Agregar las pantallas nuevas al menú | `dani-platform-respaldo.jsx` + `components/Sidebar.jsx` |
| **3.8** | Conexión API | Agregar las llamadas al backend | `services/api.js` |

---

## 6. FASE 4 — Contenido y plantillas

### Tarea 4.1 — Catálogo de obligaciones de la Ley 21.719
- **Por qué:** igual que los 93 controles ISO están en la BD, conviene tener las obligaciones de la ley como datos (para hacer un "gap analysis" también de la Ley 21.719).
- **Cómo:** crear `app/data/ley_21719.json` + un script `scripts/load_ley_21719.py` copiando `load_prompts.py`.

### Tarea 4.2 — Plantillas de documentos (reutilizar el Generador)
- **Por qué:** la ley pide documentos (política de tratamiento, protocolo de brechas). El **Generador de Documentos con IA ya existe** — solo hay que agregarle estas plantillas.
- **Archivo:** `pages/DocGeneratorScreen.jsx` + `routes/documents.py`

---

## 7. FASE 5 — Pruebas y validación

### Tarea 5.1 — Probar cada módulo de punta a punta
- Crear un tratamiento → registrar un consentimiento → simular una solicitud ARCO → registrar una brecha → verificar que los plazos y la IA funcionan.

### Tarea 5.2 — Validar con el cliente (docente)
- Confirmar que lo implementado cubre lo que pide la ley según el alcance acordado.

---

## 8. Resumen visual del plan

```
FASE 1 · Base de datos        →  6 tablas nuevas + rol DPO  (O1–O7)
FASE 2 · Backend/APIs         →  6 APIs + conexión IA
FASE 3 · Frontend             →  6 pantallas + menú + conexión
FASE 4 · Contenido            →  catálogo de la ley + plantillas
FASE 5 · Pruebas              →  validación de punta a punta
```

> **Orden recomendado para empezar:** hacer **una obligación completa de punta a punta** primero (ej. el Registro de Tratamientos: 1.1 → 2.1 → 3.1) para tener el flujo funcionando, y luego repetir el patrón con las demás. Es más seguro que hacer todas las tablas de golpe.

---

## ⚖️ Fundamento legal y fuentes

Las obligaciones (O1–O8) provienen del texto de la Ley 21.719 y de guías de cumplimiento de la industria. La estructura por módulos (RoPA, consentimiento, DSAR, brechas, proveedores, DPIA) es el estándar de las plataformas de privacidad (modelo tipo GDPR, del cual la Ley 21.719 es equivalente chileno).

- Texto oficial: **Ley 21.719 — Biblioteca del Congreso Nacional** (bcn.cl/leychile, idNorma 1209272).
- Obligaciones y multas: guías de cumplimiento (Prey, GRC360, Codevsys, Ciberlex).
- Proceso de implementación (diagnóstico → diseño → implementación, plan 30/60/90 días): guías de consultoras chilenas.
- Modelo de datos por capas (RoPA, consentimiento, DSAR, brechas, proveedores, DPIA): estándar de software de cumplimiento GDPR.

> ⚠️ **Antes de dar por cerrado el modelo de datos**, conviene revisar el **texto oficial de la Ley 21.719 y su reglamento** para confirmar campos exactos (ej. qué datos exige el registro de tratamiento). Este plan es una base sólida y fundamentada, pero el texto legal es la fuente final.

---

*Plan de integración Ley 21.719 · Proyecto GRC. Primera versión — se irá refinando a medida que las tareas se subdividan.*
