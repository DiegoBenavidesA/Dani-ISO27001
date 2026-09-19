from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.vendor import Vendor


router = APIRouter(
    prefix="/api/vendors",
    tags=["Vendors"]
)


# =========================================================
# MODELOS DE ENTRADA Y SALIDA
# =========================================================

class VendorCreate(BaseModel):
    nombre: str
    datos_compartidos: Optional[str] = None
    pais: Optional[str] = None
    estado_contrato: Optional[str] = None
    treatment_id: Optional[str] = None
    organization_id: Optional[str] = None


class VendorUpdate(BaseModel):
    nombre: Optional[str] = None
    datos_compartidos: Optional[str] = None
    pais: Optional[str] = None
    estado_contrato: Optional[str] = None
    treatment_id: Optional[str] = None
    organization_id: Optional[str] = None


class VendorResponse(BaseModel):
    id: str
    nombre: str
    datos_compartidos: Optional[str] = None
    pais: Optional[str] = None
    estado_contrato: Optional[str] = None
    treatment_id: Optional[str] = None
    organization_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =========================================================
# CREATE — Registrar un proveedor
# =========================================================

@router.post("/", response_model=VendorResponse)
async def create_vendor(
    vendor_data: VendorCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_vendor = Vendor(
        **vendor_data.model_dump(exclude_unset=True)
    )

    db.add(new_vendor)
    await db.commit()
    await db.refresh(new_vendor)

    return new_vendor


# =========================================================
# READ — Todos los proveedores
# =========================================================

@router.get("/", response_model=List[VendorResponse])
async def get_vendors(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Vendor).order_by(Vendor.created_at.desc())
    )

    return result.scalars().all()


# =========================================================
# READ — Un proveedor por ID
# =========================================================

@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor_by_id(
    vendor_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id)
    )

    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Proveedor no encontrado"
        )

    return vendor


# =========================================================
# UPDATE — Actualizar un proveedor
# =========================================================

@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: str,
    vendor_data: VendorUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id)
    )

    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Proveedor no encontrado"
        )

    update_data = vendor_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(vendor, field, value)

    vendor.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(vendor)

    return vendor


# =========================================================
# DELETE — Eliminar un proveedor
# =========================================================

@router.delete("/{vendor_id}")
async def delete_vendor(
    vendor_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id)
    )

    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Proveedor no encontrado"
        )

    await db.delete(vendor)
    await db.commit()

    return {"message": "Proveedor eliminado exitosamente"}
