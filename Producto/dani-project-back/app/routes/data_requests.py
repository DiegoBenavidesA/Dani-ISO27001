from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import HTTPException

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.models.data_subject_request import DataSubjectRequest, RequestType
from app.models.organization import Organization


router = APIRouter(
    prefix="/api/data-requests",
    tags=["Data Subject Requests"]
)

# Router SIN candado de rol, para el canal público del titular (sin login).
# Se incluye aparte en main.py (sin dependencias de autenticación).
public_router = APIRouter(
    prefix="/api/data-requests",
    tags=["Data Subject Requests (public)"]
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
    titular_email: Optional[str] = None
    origen: Optional[str] = None
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
@router.patch("/{request_id}", response_model=RequestResponse)
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


# =========================================================
# CANAL PÚBLICO — el titular envía su solicitud sin login.
# Se accede por el slug de la empresa: /solicitud/:orgSlug (frontend).
# =========================================================

class PublicRequestCreate(BaseModel):
    titular: str
    titular_email: Optional[str] = None
    tipo: str
    descripcion: str


@public_router.get("/public/{org_slug}/info")
async def get_public_org_info(org_slug: str, db: AsyncSession = Depends(get_db)):
    """Datos mínimos de la empresa para mostrar en el formulario público."""
    res = await db.execute(select(Organization).where(Organization.slug == org_slug))
    org = res.scalar_one_or_none()
    if not org or not org.activo:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")
    return {"nombre": org.nombre, "slug": org.slug}


@public_router.post("/public/{org_slug}")
async def create_public_request(
    org_slug: str,
    data: PublicRequestCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crea una solicitud de titular desde el canal público (sin login)."""
    res = await db.execute(select(Organization).where(Organization.slug == org_slug))
    org = res.scalar_one_or_none()
    if not org or not org.activo:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")

    # Validar el tipo contra el enum.
    try:
        tipo_enum = RequestType(data.tipo)
    except ValueError:
        raise HTTPException(status_code=400, detail="Tipo de solicitud no válido.")

    if not data.titular.strip() or not data.descripcion.strip():
        raise HTTPException(status_code=400, detail="Nombre y descripción son obligatorios.")

    ahora = datetime.utcnow()
    nueva = DataSubjectRequest(
        titular=data.titular.strip(),
        titular_email=(data.titular_email.strip() if data.titular_email else None),
        tipo=tipo_enum,
        descripcion=data.descripcion.strip(),
        fecha_solicitud=ahora,
        fecha_limite=add_business_days(ahora, 30),
        origen="publico",
        organization_id=org.id,
    )
    db.add(nueva)
    await db.commit()

    # Respuesta mínima (no exponemos datos internos al público).
    return {"message": "Tu solicitud fue registrada. La empresa la atenderá dentro del plazo legal."}