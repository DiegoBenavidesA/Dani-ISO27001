from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.models.data_subject_request import DataSubjectRequest


router = APIRouter(
    prefix="/api/data-requests",
    tags=["Data Subject Requests"]
)


# =========================================================
# Cálculo del plazo: 30 días hábiles.
# Se saltan sábados y domingos.
# =========================================================

def add_business_days(start: datetime, days: int) -> datetime:
    fecha = start
    agregados = 0

    while agregados < days:
        fecha = fecha + timedelta(days=1)

        if fecha.weekday() < 5:
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


class RequestUpdate(BaseModel):
    titular: Optional[str] = None
    tipo: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[str] = None
    responsable: Optional[str] = None
    respuesta: Optional[str] = None


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
# CREATE — la empresa se asigna desde el token
# =========================================================

@router.post("/", response_model=RequestResponse)
async def create_request(
    request_data: RequestCreate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    data = request_data.model_dump(exclude_unset=True)

    fecha_solicitud = data.get("fecha_solicitud") or datetime.utcnow()
    data["fecha_solicitud"] = fecha_solicitud
    data["fecha_limite"] = add_business_days(fecha_solicitud, 30)

    new_request = DataSubjectRequest(
        **data,
        organization_id=org_id
    )

    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)

    return new_request


# =========================================================
# READ — solo solicitudes de mi empresa
# =========================================================

@router.get("/", response_model=List[RequestResponse])
async def get_requests(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(
        select(DataSubjectRequest),
        DataSubjectRequest,
        org_id
    )

    stmt = stmt.order_by(
        DataSubjectRequest.fecha_solicitud.desc()
    )

    result = await db.execute(stmt)

    return result.scalars().all()


# =========================================================
# READ — una solicitud solo si pertenece a mi empresa
# =========================================================

@router.get("/{request_id}", response_model=RequestResponse)
async def get_request_by_id(
    request_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    return await get_scoped_or_404(
        db,
        DataSubjectRequest,
        request_id,
        org_id,
        detail="Solicitud no encontrada"
    )


# =========================================================
# UPDATE — solo si pertenece a mi empresa
# =========================================================

@router.put("/{request_id}", response_model=RequestResponse)
async def update_request(
    request_id: str,
    request_data: RequestUpdate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    solicitud = await get_scoped_or_404(
        db,
        DataSubjectRequest,
        request_id,
        org_id,
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
# DELETE — solo si pertenece a mi empresa
# =========================================================

@router.delete("/{request_id}")
async def delete_request(
    request_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    solicitud = await get_scoped_or_404(
        db,
        DataSubjectRequest,
        request_id,
        org_id,
        detail="Solicitud no encontrada"
    )

    await db.delete(solicitud)
    await db.commit()

    return {"message": "Solicitud eliminada exitosamente"}