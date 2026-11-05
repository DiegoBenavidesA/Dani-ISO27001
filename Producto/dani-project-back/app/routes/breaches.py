from datetime import datetime, timedelta, timezone
from html import escape as html_escape
from typing import List, Optional
import httpx
import asyncio
import json
import logging
import re

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db, AsyncSessionLocal
from app.dependencies.auth import get_current_org, get_current_user, RequireRole
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.models.data_breach import DataBreach
from app.models.user import User, UserRole
from app.config import settings
from app.services.ai_service import AIService
from app.services.email_service import send_email_async

router = APIRouter(
    prefix="/api/breaches",
    tags=["Data Breaches"]
)

# =========================================================
# HELPER: Enviar Notificaciones Push (App Móvil Nativa)
# =========================================================
async def send_push_notification(tokens: List[str], title: str, body: str, data: dict = None):
    """
    Envía notificaciones push a los dispositivos móviles registrados usando Expo.
    """
    if not tokens:
        return
        
    messages = []
    for token in tokens:
        if token and token.startswith("ExponentPushToken"):
            messages.append({
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": data or {}
            })
            
    if not messages:
        return

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                }
            )
            if response.status_code != 200:
                logger.error(f"Fallo al enviar Push Notification: {response.text}")
    except Exception as e:
        logger.error(f"Error asíncrono enviando Push: {e}")

ai_service = AIService()

# Revisan, notifican y cierran: owner/admin (y superadmin), más el DPO, que es
# el responsable natural de protección de datos. Reportar puede cualquiera.
GESTIONA = RequireRole(["admin", "dpo"])
GRAVEDADES = ("baja", "media", "alta", "critica")


# =========================================================
# MODELOS DE ENTRADA Y SALIDA
# =========================================================

class BreachCreate(BaseModel):
    descripcion: str = Field(..., min_length=10)
    # Cuándo se tomó conocimiento; por defecto, ahora. De aquí corren las 72 h.
    fecha_deteccion: Optional[datetime] = None

class BreachReview(BaseModel):
    gravedad: str
    datos_afectados: Optional[str] = None
    cantidad_afectados: Optional[int] = None
    afectados_estimacion: Optional[str] = None  # exacto | aproximado | desconocido
    medidas_tomadas: Optional[str] = None
    notificacion_requerida: bool = True

class BreachResolve(BaseModel):
    causa_raiz: str = Field(..., min_length=10)
    resolucion: str = Field(..., min_length=10)

class BreachResponse(BaseModel):
    id: str
    fecha_deteccion: Optional[datetime] = None
    descripcion: str
    reportado_por: Optional[str] = None
    datos_afectados: Optional[str] = None
    cantidad_afectados: Optional[int] = None
    afectados_estimacion: Optional[str] = None
    gravedad: Optional[str] = None
    analisis_ia: Optional[dict] = None
    analisis_estado: Optional[str] = None
    gravedad_confirmada: bool = False
    notificacion_requerida: Optional[bool] = None
    confirmada_por: Optional[str] = None
    fecha_confirmacion: Optional[datetime] = None
    fecha_limite_notificacion: Optional[datetime] = None
    fecha_notificacion: Optional[datetime] = None
    estado: Optional[str] = None
    medidas_tomadas: Optional[str] = None
    responsable: Optional[str] = None
    causa_raiz: Optional[str] = None
    resolucion: Optional[str] = None
    resuelta_por: Optional[str] = None
    fecha_resolucion: Optional[datetime] = None
    organization_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


def _utc_naive(dt: datetime) -> datetime:
    """La BD guarda UTC sin zona; el navegador manda la hora con su zona."""
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


async def _nombre_usuario(db: AsyncSession, current_user: dict) -> str:
    email = current_user.get("email") or ""
    user_id = current_user.get("user_id")
    if user_id:
        u = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
        if u and u.full_name:
            return f"{u.full_name} ({u.email})"
    return email


# =========================================================
# ANÁLISIS CON IA
# =========================================================

def _prompt_analisis(descripcion: str) -> str:
    return f"""Eres especialista en protección de datos personales (Ley 21.719 de Chile) y gestión de incidentes de seguridad.
Un trabajador reportó este incidente con sus propias palabras:

<<<
{descripcion}
>>>

Evalúa el riesgo para las personas cuyos datos podrían estar involucrados. No inventes hechos que el relato no menciona: si falta información, inclúyela en "preguntas".
La ley aplicable es la Ley 21.719 y la autoridad es la Agencia de Protección de Datos Personales; no cites otros números de ley ni artículos.
Criterio de gravedad:
- baja: improbable que afecte derechos de las personas (ej. datos cifrados, recuperados de inmediato).
- media: posible afectación limitada (datos de contacto, pocas personas).
- alta: probable daño (datos de identificación, financieros o de muchas personas, sin cifrar).
- critica: datos sensibles (salud, biométricos, menores, etc.), credenciales o exposición masiva.

Responde SOLO con un objeto JSON:
{{"gravedad": "baja|media|alta|critica",
  "justificacion": "2 a 4 oraciones",
  "datos_posibles": ["categorías de datos personales que podrían estar afectados"],
  "notificar_agencia": true,
  "notificar_titulares": false,
  "motivo_notificacion": "1 oración",
  "acciones_inmediatas": ["medidas de contención concretas"],
  "preguntas": ["qué hay que averiguar para confirmar el alcance"]}}"""


def _parsear_objeto(respuesta: str) -> dict:
    texto = (respuesta or "").replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(texto)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", texto, re.DOTALL)
        if not m:
            raise ValueError("La IA no devolvió JSON")
        data = json.loads(m.group(0))
    if not isinstance(data, dict):
        raise ValueError("La IA no devolvió un objeto")
    lista = lambda v: [str(x) for x in v][:8] if isinstance(v, list) else []
    gravedad = str(data.get("gravedad", "")).lower().replace("í", "i")
    return {
        "gravedad": gravedad if gravedad in GRAVEDADES else "media",
        "justificacion": str(data.get("justificacion") or "")[:1500],
        "datos_posibles": lista(data.get("datos_posibles")),
        "notificar_agencia": bool(data.get("notificar_agencia", True)),
        "notificar_titulares": bool(data.get("notificar_titulares", False)),
        "motivo_notificacion": str(data.get("motivo_notificacion") or "")[:500],
        "acciones_inmediatas": lista(data.get("acciones_inmediatas")),
        "preguntas": lista(data.get("preguntas")),
    }


async def _analizar_y_avisar(breach_id: str, org_id: str, avisar: bool):
    """En segundo plano: la IA propone la gravedad y se avisa a owner/admin/DPO."""
    async with AsyncSessionLocal() as db:
        breach = await get_scoped_or_404(db, DataBreach, breach_id, org_id)
        try:
            breach.analisis_ia = _parsear_objeto(await ai_service.generate_document(_prompt_analisis(breach.descripcion)))
            breach.analisis_estado = "listo"
            if not breach.gravedad_confirmada:
                breach.gravedad = breach.analisis_ia["gravedad"]
        except Exception as e:
            logger.error(f"Análisis IA de la vulneración {breach_id} falló: {e}")
            breach.analisis_estado = "error"
        await db.commit()
        await db.refresh(breach)
        if avisar:
            await _avisar_responsables(db, breach, org_id)


async def _avisar_responsables(db: AsyncSession, breach: DataBreach, org_id: str):
    try:
        result = await db.execute(select(User).where(
            User.organization_id == org_id,
            User.role.in_([UserRole.OWNER, UserRole.ADMIN, UserRole.DPO]),
            User.is_active.is_(True),
        ))
        responsables = result.scalars().all()
    except Exception as e:
        logger.error(f"No se pudo obtener a los responsables a avisar: {e}")
        return

    gravedad = (breach.gravedad.value if hasattr(breach.gravedad, "value") else breach.gravedad) or "sin evaluar"
    limite = breach.fecha_limite_notificacion.strftime("%d/%m/%Y %H:%M UTC")
    resumen = html_escape(breach.descripcion if len(breach.descripcion) <= 300 else breach.descripcion[:300] + "…")
    justificacion = html_escape((breach.analisis_ia or {}).get("justificacion", ""))

    tokens = [u.push_token for u in responsables if u.push_token]
    if tokens:
        asyncio.create_task(send_push_notification(
            tokens, "⚠️ Nueva vulneración de seguridad",
            f"[{gravedad.upper()}] {breach.descripcion[:60]}…", data={"breach_id": breach.id},
        ))

    url = f"{settings.FRONTEND_URL.rstrip('/')}/"
    html = f"""<div style="font-family:Arial,sans-serif;max-width:560px;color:#0f172a">
<h2 style="color:#e11d48;margin:0 0 12px">Nueva vulneración de seguridad reportada</h2>
<p><strong>Reportada por:</strong> {html_escape(breach.reportado_por or '—')}<br>
<strong>Gravedad sugerida por la IA:</strong> {gravedad.upper()} (pendiente de tu revisión)<br>
<strong>Plazo para notificar a la Agencia:</strong> {limite}</p>
<p style="background:#f1f5f9;padding:12px;border-radius:8px">{resumen}</p>
{f'<p style="color:#475569">{justificacion}</p>' if justificacion else ''}
<p>Revísala en NormIA → Vulneraciones de Seguridad para confirmar la gravedad y decidir si corresponde notificar.</p>
<p><a href="{url}" style="background:#2563eb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;display:inline-block">Abrir NormIA</a></p>
</div>"""
    for u in responsables:
        if u.email:
            try:
                await send_email_async(u.email, "⚠️ Nueva vulneración de seguridad por revisar", html)
            except Exception as e:
                logger.error(f"No se pudo enviar el aviso de vulneración a {u.email}: {e}")


# =========================================================
# CREATE: cualquier usuario reporta qué ocurrió
# =========================================================

@router.post("/", response_model=BreachResponse)
async def create_breach(
    breach_data: BreachCreate,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ahora = datetime.utcnow()
    fecha_deteccion = _utc_naive(breach_data.fecha_deteccion) if breach_data.fecha_deteccion else ahora
    if fecha_deteccion > ahora + timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="La fecha de detección no puede estar en el futuro.")

    new_breach = DataBreach(
        descripcion=breach_data.descripcion.strip(),
        fecha_deteccion=fecha_deteccion,
        fecha_limite_notificacion=fecha_deteccion + timedelta(hours=72),
        estado="detectada",
        reportado_por=await _nombre_usuario(db, current_user),
        analisis_estado="pendiente",
        gravedad_confirmada=False,
        organization_id=org_id,
    )
    db.add(new_breach)
    await db.commit()
    await db.refresh(new_breach)

    asyncio.create_task(_analizar_y_avisar(new_breach.id, org_id, avisar=True))
    return new_breach


# =========================================================
# READ
# =========================================================

@router.get("/", response_model=List[BreachResponse])
async def get_breaches(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(
        select(DataBreach),
        DataBreach,
        org_id
    )
    stmt = stmt.order_by(DataBreach.fecha_deteccion.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{breach_id}", response_model=BreachResponse)
async def get_breach_by_id(
    breach_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    return await get_scoped_or_404(
        db,
        DataBreach,
        breach_id,
        org_id,
        detail="Brecha no encontrada"
    )


# =========================================================
# ANALIZAR DE NUEVO (si la IA falló o el servidor se reinició)
# =========================================================

@router.post("/{breach_id}/analizar", response_model=BreachResponse)
async def reanalyze_breach(
    breach_id: str,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(GESTIONA),
    db: AsyncSession = Depends(get_db)
):
    breach = await get_scoped_or_404(db, DataBreach, breach_id, org_id, detail="Brecha no encontrada")
    breach.analisis_estado = "pendiente"
    await db.commit()
    await db.refresh(breach)
    asyncio.create_task(_analizar_y_avisar(breach.id, org_id, avisar=False))
    return breach


# =========================================================
# REVISIÓN: owner/admin confirma la gravedad y completa el alcance
# =========================================================

@router.put("/{breach_id}/revision", response_model=BreachResponse)
async def review_breach(
    breach_id: str,
    data: BreachReview,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(GESTIONA),
    db: AsyncSession = Depends(get_db)
):
    breach = await get_scoped_or_404(db, DataBreach, breach_id, org_id, detail="Brecha no encontrada")
    if breach.estado == "cerrada":
        raise HTTPException(status_code=400, detail="La vulneración ya está cerrada.")
    if data.gravedad not in GRAVEDADES:
        raise HTTPException(status_code=400, detail="Gravedad no válida.")
    if data.afectados_estimacion and data.afectados_estimacion not in ("exacto", "aproximado", "desconocido"):
        raise HTTPException(status_code=400, detail="Estimación de afectados no válida.")
    if breach.estado == "notificada" and not data.notificacion_requerida:
        raise HTTPException(status_code=400, detail="Ya fue notificada a la Agencia.")

    breach.gravedad = data.gravedad
    breach.datos_afectados = (data.datos_afectados or "").strip() or None
    breach.afectados_estimacion = data.afectados_estimacion
    breach.cantidad_afectados = None if data.afectados_estimacion == "desconocido" else data.cantidad_afectados
    breach.medidas_tomadas = (data.medidas_tomadas or "").strip() or None
    breach.notificacion_requerida = data.notificacion_requerida
    if not breach.gravedad_confirmada:
        breach.gravedad_confirmada = True
        breach.confirmada_por = await _nombre_usuario(db, current_user)
        breach.fecha_confirmacion = datetime.utcnow()
    if breach.estado == "detectada":
        breach.estado = "en_investigacion"
    breach.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(breach)
    return breach


# =========================================================
# NOTIFICAR A LA AGENCIA
# =========================================================

@router.post("/{breach_id}/notify", response_model=BreachResponse)
@router.patch("/{breach_id}/notify", response_model=BreachResponse)
async def notify_breach(
    breach_id: str,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(GESTIONA),
    db: AsyncSession = Depends(get_db)
):
    breach = await get_scoped_or_404(db, DataBreach, breach_id, org_id, detail="Brecha no encontrada")
    if not breach.gravedad_confirmada:
        raise HTTPException(status_code=400, detail="Primero revisa y confirma la gravedad de la vulneración.")
    if breach.estado in ("notificada", "cerrada"):
        raise HTTPException(status_code=400, detail="La vulneración ya fue notificada o cerrada.")

    breach.estado = "notificada"
    breach.notificacion_requerida = True
    breach.fecha_notificacion = datetime.utcnow()
    breach.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(breach)
    return breach


# =========================================================
# RESOLVER Y CERRAR
# =========================================================

@router.post("/{breach_id}/resolver", response_model=BreachResponse)
async def resolve_breach(
    breach_id: str,
    data: BreachResolve,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(GESTIONA),
    db: AsyncSession = Depends(get_db)
):
    breach = await get_scoped_or_404(db, DataBreach, breach_id, org_id, detail="Brecha no encontrada")
    if not breach.gravedad_confirmada:
        raise HTTPException(status_code=400, detail="Primero revisa y confirma la gravedad de la vulneración.")
    if breach.estado == "cerrada":
        raise HTTPException(status_code=400, detail="La vulneración ya está cerrada.")
    if breach.notificacion_requerida and breach.estado != "notificada":
        raise HTTPException(status_code=400, detail="Esta vulneración requiere notificarse a la Agencia antes de cerrarla.")

    breach.causa_raiz = data.causa_raiz.strip()
    breach.resolucion = data.resolucion.strip()
    breach.resuelta_por = await _nombre_usuario(db, current_user)
    breach.fecha_resolucion = datetime.utcnow()
    breach.estado = "cerrada"
    breach.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(breach)
    return breach


# =========================================================
# DELETE
# =========================================================

@router.delete("/{breach_id}")
async def delete_breach(
    breach_id: str,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(RequireRole(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    breach = await get_scoped_or_404(
        db,
        DataBreach,
        breach_id,
        org_id,
        detail="Brecha no encontrada"
    )

    await db.delete(breach)
    await db.commit()

    return {"message": "Brecha eliminada exitosamente"}
