from datetime import datetime, timedelta
from typing import List, Optional
import httpx
import asyncio
import logging

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.models.data_breach import DataBreach
from app.models.user import User, UserRole

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

# =========================================================
# MODELOS DE ENTRADA Y SALIDA
# =========================================================

class BreachCreate(BaseModel):
    fecha_deteccion: Optional[datetime] = None
    descripcion: str
    datos_afectados: str
    cantidad_afectados: Optional[int] = None
    gravedad: str
    estado: Optional[str] = None
    medidas_tomadas: Optional[str] = None
    responsable: Optional[str] = None

class BreachUpdate(BaseModel):
    descripcion: Optional[str] = None
    datos_afectados: Optional[str] = None
    cantidad_afectados: Optional[int] = None
    gravedad: Optional[str] = None
    estado: Optional[str] = None
    medidas_tomadas: Optional[str] = None
    responsable: Optional[str] = None

class BreachResponse(BaseModel):
    id: str
    fecha_deteccion: Optional[datetime] = None
    descripcion: str
    datos_afectados: str
    cantidad_afectados: Optional[int] = None
    gravedad: str
    fecha_limite_notificacion: Optional[datetime] = None
    fecha_notificacion: Optional[datetime] = None
    estado: Optional[str] = None
    medidas_tomadas: Optional[str] = None
    responsable: Optional[str] = None
    organization_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# =========================================================
# CREATE (Ahora incluye disparo de Notificación Push)
# =========================================================

@router.post("/", response_model=BreachResponse)
async def create_breach(
    breach_data: BreachCreate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    data = breach_data.model_dump(exclude_unset=True)

    fecha_deteccion = data.get("fecha_deteccion") or datetime.utcnow()
    data["fecha_deteccion"] = fecha_deteccion
    data["fecha_limite_notificacion"] = fecha_deteccion + timedelta(hours=72)
    data["estado"] = "detectada"

    new_breach = DataBreach(
        **data,
        organization_id=org_id
    )

    db.add(new_breach)
    await db.commit()
    await db.refresh(new_breach)

    # --- NOTIFICACIÓN PUSH A LA APP MÓVIL ---
    try:
        # Buscar a los administradores, owners y DPOs de la empresa que tengan la App instalada (tengan push_token)
        stmt = select(User.push_token).where(
            User.organization_id == org_id,
            User.role.in_([UserRole.OWNER, UserRole.ADMIN, UserRole.DPO]),
            User.push_token.is_not(None)
        )
        result = await db.execute(stmt)
        tokens = result.scalars().all()

        if tokens:
            title = "⚠️ Alerta de Brecha de Datos"
            body = f"[{new_breach.gravedad.upper()}] Se ha detectado una nueva brecha: {new_breach.descripcion[:50]}..."
            
            # Lanzamos el envío en un hilo separado para no bloquear la respuesta HTTP
            asyncio.create_task(send_push_notification(tokens, title, body, data={"breach_id": new_breach.id}))
    except Exception as e:
        logger.error(f"Error preparando notificaciones push: {e}")

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
# UPDATE
# =========================================================

@router.put("/{breach_id}", response_model=BreachResponse)
@router.patch("/{breach_id}", response_model=BreachResponse)
async def update_breach(
    breach_id: str,
    breach_data: BreachUpdate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    breach = await get_scoped_or_404(
        db,
        DataBreach,
        breach_id,
        org_id,
        detail="Brecha no encontrada"
    )

    update_data = breach_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(breach, field, value)

    breach.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(breach)
    return breach


# =========================================================
# NOTIFICAR
# =========================================================

@router.post("/{breach_id}/notify", response_model=BreachResponse)
@router.patch("/{breach_id}/notify", response_model=BreachResponse)
async def notify_breach(
    breach_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    breach = await get_scoped_or_404(
        db,
        DataBreach,
        breach_id,
        org_id,
        detail="Brecha no encontrada"
    )

    breach.estado = "notificada"
    breach.fecha_notificacion = datetime.utcnow()
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