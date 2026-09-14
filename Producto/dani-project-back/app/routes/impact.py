from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.impact_assessment import ImpactAssessment


router = APIRouter(
    prefix="/api/impact",
    tags=["Impact Assessments"]
)


# =========================================================
# MODELOS DE ENTRADA Y SALIDA
# =========================================================

class ImpactCreate(BaseModel):
    treatment_id: Optional[str] = None
    nivel_riesgo: Optional[str] = None
    descripcion_riesgo: Optional[str] = None
    medidas_mitigacion: Optional[str] = None
    estado: Optional[str] = None
    responsable: Optional[str] = None
    organization_id: Optional[str] = None


class ImpactUpdate(BaseModel):
    treatment_id: Optional[str] = None
    nivel_riesgo: Optional[str] = None
    descripcion_riesgo: Optional[str] = None
    medidas_mitigacion: Optional[str] = None
    estado: Optional[str] = None
    responsable: Optional[str] = None
    organization_id: Optional[str] = None


class ImpactResponse(BaseModel):
    id: str
    treatment_id: Optional[str] = None
    nivel_riesgo: Optional[str] = None
    descripcion_riesgo: Optional[str] = None
    medidas_mitigacion: Optional[str] = None
    estado: Optional[str] = None
    responsable: Optional[str] = None
    organization_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =========================================================
# CREATE
# Crear una nueva evaluación de impacto (DPIA)
# =========================================================

@router.post("/", response_model=ImpactResponse)
async def create_impact(
    impact_data: ImpactCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_impact = ImpactAssessment(
        **impact_data.model_dump(exclude_unset=True)
    )

    db.add(new_impact)
    await db.commit()
    await db.refresh(new_impact)

    return new_impact


# =========================================================
# READ
# Obtener todas las evaluaciones de impacto
# =========================================================

@router.get("/", response_model=List[ImpactResponse])
async def get_impacts(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ImpactAssessment).order_by(
            ImpactAssessment.created_at.desc()
        )
    )

    impacts = result.scalars().all()

    return impacts


# =========================================================
# READ
# Obtener una evaluación de impacto por ID
# =========================================================

@router.get("/{impact_id}", response_model=ImpactResponse)
async def get_impact_by_id(
    impact_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ImpactAssessment).where(
            ImpactAssessment.id == impact_id
        )
    )

    impact = result.scalar_one_or_none()

    if not impact:
        raise HTTPException(
            status_code=404,
            detail="Evaluación de impacto no encontrada"
        )

    return impact


# =========================================================
# UPDATE
# Actualizar una evaluación de impacto
# =========================================================

@router.put("/{impact_id}", response_model=ImpactResponse)
async def update_impact(
    impact_id: str,
    impact_data: ImpactUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ImpactAssessment).where(
            ImpactAssessment.id == impact_id
        )
    )

    impact = result.scalar_one_or_none()

    if not impact:
        raise HTTPException(
            status_code=404,
            detail="Evaluación de impacto no encontrada"
        )

    update_data = impact_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(impact, field, value)

    impact.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(impact)

    return impact


# =========================================================
# DELETE
# Eliminar una evaluación de impacto
# =========================================================

@router.delete("/{impact_id}")
async def delete_impact(
    impact_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ImpactAssessment).where(
            ImpactAssessment.id == impact_id
        )
    )

    impact = result.scalar_one_or_none()

    if not impact:
        raise HTTPException(
            status_code=404,
            detail="Evaluación de impacto no encontrada"
        )

    await db.delete(impact)
    await db.commit()

    return {
        "message": "Evaluación de impacto eliminada exitosamente"
    }
