from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.models.data_treatment import DataTreatment


router = APIRouter(
    prefix="/api/treatments",
    tags=["Treatments"]
)

# ============================================================================
# MÓDULO DE REFERENCIA MULTI-TENANT (N7 del PLAN_MULTITENANT).
# Este archivo es el EJEMPLO que las tareas T1/T2 deben copiar para aislar sus
# módulos por empresa. Puntos clave del patrón:
#   - La empresa se obtiene del token con get_current_org (nunca del cliente).
#   - Listar/leer -> se filtra por empresa (scope_to_org / get_scoped_or_404).
#   - Crear -> organization_id se asigna desde el token.
#   - Los schemas de entrada NO incluyen organization_id.
# ============================================================================


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
    # organization_id NO se acepta del cliente: se toma del token (multi-tenant).


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
# CREATE — la empresa se asigna desde el token
# =========================================================

@router.post("/", response_model=TreatmentResponse)
async def create_treatment(
    treatment_data: TreatmentCreate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    new_treatment = DataTreatment(
        **treatment_data.model_dump(exclude_unset=True),
        organization_id=org_id
    )

    db.add(new_treatment)
    await db.commit()
    await db.refresh(new_treatment)

    return new_treatment


# =========================================================
# READ — solo los tratamientos de mi empresa
# =========================================================

@router.get("/", response_model=List[TreatmentResponse])
async def get_treatments(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(select(DataTreatment), DataTreatment, org_id)
    stmt = stmt.order_by(DataTreatment.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


# =========================================================
# READ — un tratamiento por ID (solo si es de mi empresa)
# =========================================================

@router.get("/{treatment_id}", response_model=TreatmentResponse)
async def get_treatment_by_id(
    treatment_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    return await get_scoped_or_404(
        db, DataTreatment, treatment_id, org_id, detail="Tratamiento no encontrado"
    )


# =========================================================
# UPDATE — solo si es de mi empresa
# =========================================================

@router.put("/{treatment_id}", response_model=TreatmentResponse)
async def update_treatment(
    treatment_id: str,
    treatment_data: TreatmentUpdate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    treatment = await get_scoped_or_404(
        db, DataTreatment, treatment_id, org_id, detail="Tratamiento no encontrado"
    )

    update_data = treatment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(treatment, field, value)

    treatment.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(treatment)

    return treatment


# =========================================================
# DELETE — solo si es de mi empresa
# =========================================================

@router.delete("/{treatment_id}")
async def delete_treatment(
    treatment_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    treatment = await get_scoped_or_404(
        db, DataTreatment, treatment_id, org_id, detail="Tratamiento no encontrado"
    )

    await db.delete(treatment)
    await db.commit()

    return {"message": "Tratamiento eliminado exitosamente"}
