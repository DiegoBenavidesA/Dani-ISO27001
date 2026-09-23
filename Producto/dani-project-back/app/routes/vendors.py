from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.models.vendor import Vendor
from app.models.data_treatment import DataTreatment


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


class VendorUpdate(BaseModel):
    nombre: Optional[str] = None
    datos_compartidos: Optional[str] = None
    pais: Optional[str] = None
    estado_contrato: Optional[str] = None
    treatment_id: Optional[str] = None


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
# CREATE — la empresa se asigna desde el token
# =========================================================

@router.post("/", response_model=VendorResponse)
async def create_vendor(
    vendor_data: VendorCreate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    data = vendor_data.model_dump(exclude_unset=True)

    # Si se asocia un tratamiento, debe pertenecer a la misma empresa.
    treatment_id = data.get("treatment_id")
    if treatment_id:
        await get_scoped_or_404(
            db,
            DataTreatment,
            treatment_id,
            org_id,
            detail="Tratamiento no encontrado"
        )

    new_vendor = Vendor(
        **data,
        organization_id=org_id
    )

    db.add(new_vendor)
    await db.commit()
    await db.refresh(new_vendor)

    return new_vendor


# =========================================================
# READ — solo proveedores de mi empresa
# =========================================================

@router.get("/", response_model=List[VendorResponse])
async def get_vendors(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(
        select(Vendor),
        Vendor,
        org_id
    )

    stmt = stmt.order_by(Vendor.created_at.desc())

    result = await db.execute(stmt)

    return result.scalars().all()


# =========================================================
# READ — solo si el proveedor pertenece a mi empresa
# =========================================================

@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor_by_id(
    vendor_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    return await get_scoped_or_404(
        db,
        Vendor,
        vendor_id,
        org_id,
        detail="Proveedor no encontrado"
    )


# =========================================================
# UPDATE — solo si pertenece a mi empresa
# =========================================================

@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: str,
    vendor_data: VendorUpdate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    vendor = await get_scoped_or_404(
        db,
        Vendor,
        vendor_id,
        org_id,
        detail="Proveedor no encontrado"
    )

    update_data = vendor_data.model_dump(exclude_unset=True)

    # Si se cambia el tratamiento, debe pertenecer a la misma empresa.
    treatment_id = update_data.get("treatment_id")
    if treatment_id:
        await get_scoped_or_404(
            db,
            DataTreatment,
            treatment_id,
            org_id,
            detail="Tratamiento no encontrado"
        )

    for field, value in update_data.items():
        setattr(vendor, field, value)

    vendor.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(vendor)

    return vendor


# =========================================================
# DELETE — solo si pertenece a mi empresa
# =========================================================

@router.delete("/{vendor_id}")
async def delete_vendor(
    vendor_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    vendor = await get_scoped_or_404(
        db,
        Vendor,
        vendor_id,
        org_id,
        detail="Proveedor no encontrado"
    )

    await db.delete(vendor)
    await db.commit()

    return {"message": "Proveedor eliminado exitosamente"}