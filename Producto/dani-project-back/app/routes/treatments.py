from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.data_treatment import DataTreatment


router = APIRouter(
    prefix="/api/treatments",
    tags=["Treatments"]
)


# =========================================================
# MODELOS DE ENTRADA Y SALIDA
# =========================================================

class TreatmentCreate(BaseModel):
    nombre: str
    finalidad: str
    base_licitud: str
    categorias_datos: Optional[str] = None
    origen: Optional[str] = None
    destinatarios: Optional[str] = None
    transferencias_internacionales: Optional[str] = None
    plazo_conservacion: Optional[str] = None
    responsable: Optional[str] = None
    organization_id: Optional[str] = None


class TreatmentUpdate(BaseModel):
    nombre: Optional[str] = None
    finalidad: Optional[str] = None
    base_licitud: Optional[str] = None
    categorias_datos: Optional[str] = None
    origen: Optional[str] = None
    destinatarios: Optional[str] = None
    transferencias_internacionales: Optional[str] = None
    plazo_conservacion: Optional[str] = None
    responsable: Optional[str] = None
    organization_id: Optional[str] = None


class TreatmentResponse(BaseModel):
    id: str
    nombre: str
    finalidad: str
    base_licitud: str
    categorias_datos: Optional[str] = None
    origen: Optional[str] = None
    destinatarios: Optional[str] = None
    transferencias_internacionales: Optional[str] = None
    plazo_conservacion: Optional[str] = None
    responsable: Optional[str] = None
    organization_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =========================================================
# CREATE
# Crear un nuevo tratamiento
# =========================================================

@router.post("/", response_model=TreatmentResponse)
async def create_treatment(
    treatment_data: TreatmentCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_treatment = DataTreatment(
        **treatment_data.model_dump()
    )

    db.add(new_treatment)
    await db.commit()
    await db.refresh(new_treatment)

    return new_treatment


# =========================================================
# READ
# Obtener todos los tratamientos
# =========================================================

@router.get("/", response_model=List[TreatmentResponse])
async def get_treatments(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataTreatment).order_by(
            DataTreatment.created_at.desc()
        )
    )

    treatments = result.scalars().all()

    return treatments


# =========================================================
# READ
# Obtener un tratamiento por ID
# =========================================================

@router.get("/{treatment_id}", response_model=TreatmentResponse)
async def get_treatment_by_id(
    treatment_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataTreatment).where(
            DataTreatment.id == treatment_id
        )
    )

    treatment = result.scalar_one_or_none()

    if not treatment:
        raise HTTPException(
            status_code=404,
            detail="Tratamiento no encontrado"
        )

    return treatment


# =========================================================
# UPDATE
# Actualizar un tratamiento
# =========================================================

@router.put("/{treatment_id}", response_model=TreatmentResponse)
async def update_treatment(
    treatment_id: str,
    treatment_data: TreatmentUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataTreatment).where(
            DataTreatment.id == treatment_id
        )
    )

    treatment = result.scalar_one_or_none()

    if not treatment:
        raise HTTPException(
            status_code=404,
            detail="Tratamiento no encontrado"
        )

    update_data = treatment_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(treatment, field, value)

    treatment.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(treatment)

    return treatment


# =========================================================
# DELETE
# Eliminar un tratamiento
# =========================================================

@router.delete("/{treatment_id}")
async def delete_treatment(
    treatment_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DataTreatment).where(
            DataTreatment.id == treatment_id
        )
    )

    treatment = result.scalar_one_or_none()

    if not treatment:
        raise HTTPException(
            status_code=404,
            detail="Tratamiento no encontrado"
        )

    await db.delete(treatment)
    await db.commit()

    return {
        "message": "Tratamiento eliminado exitosamente"
    }