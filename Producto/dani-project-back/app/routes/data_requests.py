from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.data_subject_request import DataSubjectRequest


router = APIRouter(
    prefix="/api/data-requests",
    tags=["Data Subject Requests"]
)


# =========================================================
# Cálculo del plazo legal: 30 días HÁBILES (O3).
# La Ley 21.719 da 30 días hábiles para responder una solicitud ARCO+P.
# Se saltan sábados y domingos (los feriados se pueden refinar después).
# =========================================================

def add_business_days(start: datetime, days: int) -> datetime:
    fecha = start
    agregados = 0
    while agregados < days:
        fecha = fecha + timedelta(days=1)
        if fecha.weekday() < 5:  # 0=lunes ... 4=viernes
            agregados += 1
    return fecha


# =========================================================
# MODELOS DE ENTRADA Y SALIDA
# =========================================================

class RequestCreate(BaseModel):
    titular: str
    tipo: str
    descripcion: str
    fecha_solicitud: Optional[datetime] = None
    estado: Optional[str] = None
    responsable: Optional[str] = None
    respuesta: Optional[str] = None
    organization_id: Optional[str] = None


class RequestUpdate(BaseModel):
    titular: Optional[str] = None
    tipo: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[str] = None
    responsable: Optional[str] = None
    respuesta: Optional[str] = None
    organization_id: Optional[str] = None


class RequestResponse(BaseModel):
    id: str
    titular: str
    tipo: str
    descripcion: str
    fecha_solicitud: Optional[datetime] = None
    fecha_limite: Optional[datetime] = None
    estado: Optional[str] = None
    responsable: Optional[str] = None
    respuesta: Optional[str] = None
    organization_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =========================================================
# CREATE — Registrar una solicitud (calcula fecha_limite +30 días hábiles)
# =========================================================

@router.post("/", response_model=RequestResponse)
async def create_request(
    request_data: RequestCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    data = request_data.model_dump(exclude_unset=True)

    # Punto de partida del plazo: la fecha de solicitud o ahora.
    fecha_solicitud = data.get("fecha_solicitud") or datetime.utcnow()
    data["fecha_solicitud"] = fecha_solicitud
    data["fecha_limite"] = add_business_days(fecha_solicitud, 30)

    new_request = DataSubjectRequest(**data)

    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)

    return new_request


# =========================================================
# READ — Todas las solicitudes
# =========================================================

@router.get("/", response_model=List[RequestResponse])
async def get_requests(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataSubjectRequest).order_by(
            DataSubjectRequest.fecha_solicitud.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# READ — Una solicitud por ID
# =========================================================

@router.get("/{request_id}", response_model=RequestResponse)
async def get_request_by_id(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataSubjectRequest).where(
            DataSubjectRequest.id == request_id
        )
    )

    solicitud = result.scalar_one_or_none()

    if not solicitud:
        raise HTTPException(
            status_code=404,
            detail="Solicitud no encontrada"
        )

    return solicitud


# =========================================================
# UPDATE — Actualizar una solicitud
# =========================================================

@router.put("/{request_id}", response_model=RequestResponse)
async def update_request(
    request_id: str,
    request_data: RequestUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataSubjectRequest).where(
            DataSubjectRequest.id == request_id
        )
    )

    solicitud = result.scalar_one_or_none()

    if not solicitud:
        raise HTTPException(
            status_code=404,
            detail="Solicitud no encontrada"
        )

    update_data = request_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(solicitud, field, value)

    solicitud.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(solicitud)

    return solicitud


# =========================================================
# DELETE — Eliminar una solicitud
# =========================================================

@router.delete("/{request_id}")
async def delete_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataSubjectRequest).where(
            DataSubjectRequest.id == request_id
        )
    )

    solicitud = result.scalar_one_or_none()

    if not solicitud:
        raise HTTPException(
            status_code=404,
            detail="Solicitud no encontrada"
        )

    await db.delete(solicitud)
    await db.commit()

    return {"message": "Solicitud eliminada exitosamente"}
