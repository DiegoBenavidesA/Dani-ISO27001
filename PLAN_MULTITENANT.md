# 🏢 Plan de Multi-Tenant (multi-empresa) — Plataforma GRC

> **Qué es esto:** el plan para convertir la plataforma (hoy de una sola empresa) en **multi-empresa (multi-tenant)**: que varias organizaciones usen la misma plataforma sin ver los datos de las otras.
>
> Complementa a [`CONTEXTO_PROYECTO.md`](./CONTEXTO_PROYECTO.md) y [`PLAN_INTEGRACION_LEY_21719.md`](./PLAN_INTEGRACION_LEY_21719.md).

## 🚦 Leyenda

- 🔵 **NÚCLEO (lo hace el responsable de la base, NO repartir)** — necesita contexto y coherencia total; un error aquí = fuga de datos entre empresas.
- 🟢 **TAREA (repartible)** — mecánico, se hace copiando el patrón que deja el núcleo. **Nadie empieza estas tareas hasta que el núcleo esté terminado y avisado.**

> ⚠️ **Regla de oro del multi-tenant:** el aislamiento de datos debe ser **imposible de olvidar**, no algo que cada quien "se acuerde" de filtrar. Por eso el núcleo entrega UN mecanismo central y UN módulo de ejemplo ya convertido; las tareas solo lo copian.

---

## 1. ¿Por qué esto es distinto a las fases anteriores?

Las tablas y CRUDs de la Ley 21.719 eran **piezas independientes**: se podían repartir sin riesgo. El multi-tenant es **transversal**: toca el login, el token, casi todas las tablas y **todas las consultas**. Si un solo endpoint olvida filtrar por empresa, una empresa ve los datos de otra. Ese es el riesgo central, y por eso el núcleo no se reparte.

Nota: las tablas nuevas de la Ley ya nacieron con un campo `organization_id` (nullable). Este plan lo **activa y lo hace obligatorio de verdad**, y lo agrega a las tablas antiguas que lo necesiten.

---

## 2. Qué es "por empresa" y qué es "compartido" (decisión del núcleo)

No todo se aísla. Definirlo bien es parte del núcleo.

### 🔒 Tablas POR EMPRESA (llevan `organization_id` y se filtran siempre)
`risks`, `evidence`, `evidence_chunks`, `risk_assessments`, `documents`, `capa`, `remediation`, `gap_analysis`, y las de la Ley: `data_treatments`, `consents`, `data_subject_requests`, `data_breaches`, `vendors`, `impact_assessments`. Además, cada `user` pertenece a una empresa.

### 🌍 Tablas COMPARTIDAS (catálogos globales, SIN `organization_id`)
`iso_controls` (el catálogo de los 93 controles), `assessment_questions` (las 315 preguntas), `normative_chunks` (texto normativo ISO), `prompts` (plantillas de IA). Son iguales para todas las empresas.

### ⚠️ Caso especial que HAY que resolver en el núcleo: `iso_controls`
Hoy `iso_controls` **mezcla** dos cosas en la misma tabla:
- El **catálogo** (global): `control_id`, `title`, `description`, `category`…
- El **estado por empresa**: `status`, `score`, `justification`, `document_id`.

En multi-tenant eso no puede seguir mezclado (el catálogo es compartido pero el estado es de cada empresa). Hay que **separar el estado por empresa a una tabla nueva** (ej. `control_status` con `control_id` + `organization_id` + status/score/justification). Lo mismo aplica a las respuestas de la evaluación de preguntas (por empresa), no al catálogo de preguntas.

> Esta separación es exactamente el tipo de decisión con contexto que justifica hacer el núcleo nosotros.

---

## 3. 🔵 EL NÚCLEO — hasta aquí llegamos nosotros (la "base")

> **✅ ESTADO: NÚCLEO COMPLETO.** N1, N3, N4, N5, N6 y N7 terminados y el aislamiento probado (una empresa no ve los datos de otra). El equipo YA puede empezar las tareas 🟢 de la sección 4. Cada compañero debe correr `python scripts/backfill_multitenant.py` en su base local antes de empezar.

Este es el alcance exacto de lo que hace el responsable de la base **antes** de repartir tareas. Cuando estos 7 puntos estén ✅, la base está lista.

### ✅ N1 — Modelo `Organization`
- Tabla `organizations`: `id`, `nombre`, `rut`/identificador, `created_at`, (opcional: `plan`, `activo`).
- Archivo: `app/models/organization.py` + registrar en `models/__init__.py` y `main.py`.

### N2 — Definir el mapa por-empresa / compartido
- Dejar por escrito (en este documento, sección 2) qué tabla es qué. **Hecho arriba**, pero el núcleo lo valida contra el código real.

### ✅ N3 — Usuario ↔ Organización
- Agregar `organization_id` (FK → organizations) al modelo `User`.
- Relación `User.organization`.
- Archivo: `app/models/user.py`.

### ✅ N4 — El token lleva la empresa
- En el **login**, incluir `organization_id` en el payload del JWT (hoy el token lleva `sub`, `user_id`, `role`; ver `app/services/auth_service.py`).
- Exponerlo en `get_current_user` (`app/dependencies/auth.py`) y crear una dependencia **`get_current_org`** que devuelva el `organization_id` del usuario autenticado.
- Archivos: `app/routes/auth.py`, `app/services/auth_service.py`, `app/dependencies/auth.py`.

### ✅ N5 — El mecanismo central de aislamiento (lo más importante)
- **Enfoque elegido:** la empresa se **inyecta como dependencia** (`get_current_org`) y cada endpoint por-empresa usa helpers para filtrar/asignar. Entregado en `app/dependencies/tenant.py`.
- Helpers: `scope_to_org(stmt, model, org_id)` (filtra un SELECT por empresa) y `get_scoped_or_404(db, model, id, org_id)` (trae un registro solo si es de la empresa; si no, 404).
- **Receta para el equipo:** ver sección "📎 Receta N5" al final de este documento. Regla: en un módulo por-empresa NUNCA se consulta el modelo sin pasar por estos helpers.

### ✅ N6 — Separar el estado por-empresa de los catálogos
- Resolver el caso `iso_controls` (sección 2.⚠️): mover `status`/`score`/`justification`/`document_id` a una tabla de estado por empresa.
- Definir dónde se guardan las **respuestas de la evaluación de preguntas** por empresa (tabla `assessment_answers`: `question_id` + `organization_id` + veredicto/confianza/justificación) — el catálogo `assessment_questions` queda global.

### ✅ N7 — Migración de los datos actuales + 1 módulo de ejemplo convertido
- Crear una **empresa por defecto** y asignar TODOS los registros existentes a ella (script de backfill), para que nada se rompa.
- Convertir **UN módulo completo de punta a punta** (recomendado: `risks` o `treatments`) usando el mecanismo N5: backend filtra por empresa, el create asigna la empresa, y el frontend sigue funcionando. Ese módulo es **el ejemplo de referencia** que copiarán las tareas.

### ✅ La base está TERMINADA cuando:
1. Existe `Organization` y cada usuario tiene su empresa.
2. Al iniciar sesión, el token incluye la empresa y `get_current_org` funciona.
3. Todos los datos actuales pertenecen a una empresa por defecto (backfill hecho).
4. Existe el mecanismo central de aislamiento (N5) **y está probado en un módulo real** (N7).
5. Los catálogos globales (`iso_controls`, `assessment_questions`, etc.) quedaron **explícitamente fuera** del filtrado.
6. Está escrita la **receta** "cómo aislar tu módulo por empresa" para el equipo.

> Hasta que estos 6 puntos no estén ✅, **el equipo no empieza las tareas 🟢**.

---

## 4. 🟢 TAREAS repartibles (después del núcleo)

Cada una copia el patrón de referencia (N5 + módulo de ejemplo N7). Se reparten por dueño de módulo.

| Tarea | Qué hacer | Archivos |
|---|---|---|
| **T1** | Aislar por empresa los módulos de Riesgos/Evidencias/CAPA/Documentos (los que no sean el de ejemplo) | `routes/risk.py`, `evidence.py`, `capa.py`, `documents.py` |
| **T2** | Aislar por empresa los módulos de la Ley (`consents`, `data_requests`, `breaches`, `vendors`, `impact`, `treatments`) | `routes/*.py` respectivos |
| **T3** | Migrar `compliance.py` y `gap_analysis.py` para que lean/escriban el estado en la tabla **`control_status`** (por empresa) en vez de en `iso_controls`; y persistir el resultado de "Evaluar con IA" en **`assessment_answers`** (por empresa). Las tablas **ya existen** (N6) y ya están sembradas para la empresa por defecto. Al terminar, se pueden eliminar los campos de estado (`applies/status/score/justification/document_id`) de `iso_controls`. | `routes/compliance.py`, `gap_analysis.py`, `assessment_questions.py` |
| **T4** | Frontend: que cada pantalla trabaje dentro de la empresa del usuario (normalmente automático si el backend ya filtra; validar) | `src/pages/*.jsx`, `src/services/api.js` |
| **T5** | Pantalla de **Gestión de Empresas** (crear/editar organizaciones) — solo super-admin | `routes/organizations.py`, `src/pages/OrganizationsScreen.jsx` |
| **T6** | **Alta de empresa nueva** (onboarding): crear empresa + su primer usuario admin | `routes/organizations.py`, `routes/auth.py`, frontend de registro |

### Fuera de alcance de esta primera versión (tareas futuras)
Invitar usuarios a una empresa, roles por empresa, que un usuario pertenezca a varias empresas, cambio de empresa en caliente, facturación por plan.

---

## 5. Recomendación de alcance (deadline académico)

Si el tiempo es corto, la **primera versión** = **el NÚCLEO (sección 3)** funcionando con una o dos empresas de prueba. Con eso ya se demuestra el multi-tenant real (aislamiento probado). Las tareas 🟢 de la sección 4 se pueden presentar como "trabajo en curso / siguiente iteración".

---

## 6. Orden de trabajo sugerido

1. 🔵 Núcleo N1 → N7 (nosotros). Avisar al equipo cuando esté ✅.
2. 🟢 Repartir T1–T4 (aislar módulos, mecánico).
3. 🟢 T5–T6 (gestión y alta de empresas) — independientes, en paralelo.

---

## 📎 Receta N5 — Cómo aislar tu módulo por empresa (para las tareas 🟢)

> Solo se aplica a módulos **por-empresa** (sección 2). Los catálogos globales NO se tocan.

Importa los helpers:
```python
from fastapi import Depends
from sqlalchemy import select
from app.dependencies.auth import get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
```

**LISTAR** — solo lo de mi empresa:
```python
@router.get("/")
async def listar(org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    stmt = scope_to_org(select(MiModelo), MiModelo, org_id)
    return (await db.execute(stmt)).scalars().all()
```

**CREAR** — la empresa se asigna sola:
```python
@router.post("/")
async def crear(data: MiSchema, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    obj = MiModelo(**data.model_dump(exclude_unset=True), organization_id=org_id)
    db.add(obj); await db.commit(); await db.refresh(obj)
    return obj
```

**OBTENER / ACTUALIZAR / BORRAR por id** — solo si es de mi empresa:
```python
@router.get("/{obj_id}")
async def obtener(obj_id: str, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    return await get_scoped_or_404(db, MiModelo, obj_id, org_id)
```

**Reglas de oro:**
- En un módulo por-empresa, NUNCA consultes el modelo sin `scope_to_org` o `get_scoped_or_404`.
- En el schema de entrada del create, NO aceptes `organization_id` del cliente (se pone desde el token). Quítalo de los schemas si estaba.
- El frontend normalmente no cambia: al filtrar el backend, cada pantalla ya solo ve lo de su empresa.

**Ejemplo de referencia ya convertido:** ver el módulo que dejó el núcleo en N7 (`routes/____.py`) y cópialo.
