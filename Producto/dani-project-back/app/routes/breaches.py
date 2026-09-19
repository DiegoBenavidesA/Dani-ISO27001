from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.data_breach import DataBreach


router = APIRouter(
    prefix="/api/breaches",
    tags=["Data Breaches"]
)


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
    organization_id: Optional[str] = None


class BreachUpdate(BaseModel):
    descripcion: Optional[str] = None
    datos_afectados: Optional[str] = None
    cantidad_afectados: Optional[int] = None
    gravedad: Optional[str] = None
    estado: Optional[str] = None
    medidas_tomadas: Optional[str] = None
    responsable: Optional[str] = None
    organization_id: Optional[str] = None


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
# CREATE — Registrar una brecha (calcula el plazo de 72h, O4)
# La Ley 21.719 obliga a notificar a la Agencia en máximo 72 horas
# desde la detección.
# =========================================================

@router.post("/", response_model=BreachResponse)
async def create_breach(
    breach_data: BreachCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    data = breach_data.model_dump(exclude_unset=True)

    fecha_deteccion = data.get("fecha_deteccion") or datetime.utcnow()
    data["fecha_deteccion"] = fecha_deteccion
    data["fecha_limite_notificacion"] = fecha_deteccion + timedelta(hours=72)

    new_breach = DataBreach(**data)

    db.add(new_breach)
    await db.commit()
    await db.refresh(new_breach)

    return new_breach


# =========================================================
# READ — Todas las brechas
# =========================================================

@router.get("/", response_model=List[BreachResponse])
async def get_breaches(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataBreach).order_by(
            DataBreach.fecha_deteccion.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# READ — Una brecha por ID
# =========================================================

@router.get("/{breach_id}", response_model=BreachResponse)
async def get_breach_by_id(
    breach_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataBreach).where(DataBreach.id == breach_id)
    )

    breach = result.scalar_one_or_none()

    if not breach:
        raise HTTPException(
            status_code=404,
            detail="Brecha no encontrada"
        )

    return breach


# =========================================================
# UPDATE — Actualizar una brecha
# =========================================================

@router.put("/{breach_id}", response_model=BreachResponse)
async def update_breach(
    breach_id: str,
    breach_data: BreachUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataBreach).where(DataBreach.id == breach_id)
    )

    breach = result.scalar_one_or_none()

    if not breach:
        raise HTTPException(
            status_code=404,
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
# NOTIFICAR — Marcar la brecha como notificada a la Agencia (O4)
# =========================================================

@router.post("/{breach_id}/notify", response_model=BreachResponse)
async def notify_breach(
    breach_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataBreach).where(DataBreach.id == breach_id)
    )

    breach = result.scalar_one_or_none()

    if not breach:
        raise HTTPException(
            status_code=404,
            detail="Brecha no encontrada"
        )

    breach.estado = "notificada"
    breach.fecha_notificacion = datetime.utcnow()
    breach.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(breach)

    return breach


# =========================================================
# DELETE — Eliminar una brecha
# =========================================================

@router.delete("/{breach_id}")
async def delete_breach(
    breach_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataBreach).where(DataBreach.id == breach_id)
    )

    breach = result.scalar_one_or_none()

    if not breach:
        raise HTTPException(
            status_code=404,
            detail="Brecha no encontrada"
        )

    await db.delete(breach)
    await db.commit()

    return {"message": "Brecha eliminada exitosamente"}
