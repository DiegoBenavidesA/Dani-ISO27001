from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.models.impact_assessment import ImpactAssessment
from app.models.data_treatment import DataTreatment

# Importación del servicio de IA
from app.services.ai_service import AIService

router = APIRouter(
    prefix="/api/impact",
    tags=["Impact Assessments"]
)

# Instancia del servicio de IA
ai_service = AIService()

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


class ImpactUpdate(BaseModel):
    treatment_id: Optional[str] = None
    nivel_riesgo: Optional[str] = None
    descripcion_riesgo: Optional[str] = None
    medidas_mitigacion: Optional[str] = None
    estado: Optional[str] = None
    responsable: Optional[str] = None


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
# Crear una nueva evaluación de impacto
# La empresa se obtiene desde el usuario autenticado.
# =========================================================

@router.post("/", response_model=ImpactResponse)
async def create_impact(
    impact_data: ImpactCreate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    data = impact_data.model_dump(exclude_unset=True)

    # Si se asocia un tratamiento, debe pertenecer
    # a la misma organización.
    treatment_id = data.get("treatment_id")

    if treatment_id:
        await get_scoped_or_404(
            db,
            DataTreatment,
            treatment_id,
            org_id,
            detail="Tratamiento no encontrado"
        )

    new_impact = ImpactAssessment(
        **data,
        organization_id=org_id
    )

    db.add(new_impact)
    await db.commit()
    await db.refresh(new_impact)

    return new_impact


# =========================================================
# READ
# Obtener solo las evaluaciones de impacto de mi empresa.
# =========================================================

@router.get("/", response_model=List[ImpactResponse])
async def get_impacts(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(
        select(ImpactAssessment),
        ImpactAssessment,
        org_id
    )

    stmt = stmt.order_by(
        ImpactAssessment.created_at.desc()
    )

    result = await db.execute(stmt)

    return result.scalars().all()


# =========================================================
# READ
# Obtener una evaluación solo si pertenece a mi empresa.
# =========================================================

@router.get("/{impact_id}", response_model=ImpactResponse)
async def get_impact_by_id(
    impact_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    return await get_scoped_or_404(
        db,
        ImpactAssessment,
        impact_id,
        org_id,
        detail="Evaluación de impacto no encontrada"
    )


# =========================================================
# UPDATE
# Actualizar solo si pertenece a mi empresa.
# =========================================================

@router.put("/{impact_id}", response_model=ImpactResponse)
async def update_impact(
    impact_id: str,
    impact_data: ImpactUpdate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    impact = await get_scoped_or_404(
        db,
        ImpactAssessment,
        impact_id,
        org_id,
        detail="Evaluación de impacto no encontrada"
    )

    update_data = impact_data.model_dump(
        exclude_unset=True
    )

    # Si se cambia el tratamiento, comprobamos
    # que también pertenezca a la organización.
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
        setattr(impact, field, value)

    impact.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(impact)

    return impact


# =========================================================
# DELETE
# Eliminar solo si pertenece a mi empresa.
# =========================================================

@router.delete("/{impact_id}")
async def delete_impact(
    impact_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    impact = await get_scoped_or_404(
        db,
        ImpactAssessment,
        impact_id,
        org_id,
        detail="Evaluación de impacto no encontrada"
    )

    await db.delete(impact)
    await db.commit()

    return {
        "message": "Evaluación de impacto eliminada exitosamente"
    }

# =========================================================
# NUEVO: ANALIZAR TODOS LOS TRATAMIENTOS CON IA
# Recorre el RoPA, evalúa el riesgo y guarda el impacto (pendiente)
# =========================================================

@router.post("/analyze-all")
async def analyze_all_treatments(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    # 1. Obtener todos los tratamientos de la empresa
    stmt_treatments = scope_to_org(select(DataTreatment), DataTreatment, org_id)
    result_treatments = await db.execute(stmt_treatments)
    treatments = result_treatments.scalars().all()

    if not treatments:
        return {"message": "No hay tratamientos registrados para evaluar.", "evaluations": []}

    # 2. Obtener las evaluaciones de impacto existentes para actualizar en vez de duplicar
    stmt_impacts = scope_to_org(select(ImpactAssessment), ImpactAssessment, org_id)
    result_impacts = await db.execute(stmt_impacts)
    existing_impacts = {imp.treatment_id: imp for imp in result_impacts.scalars().all() if imp.treatment_id}

    evaluations = []

    # 3. Recorrer cada tratamiento y evaluar con IA
    for treatment in treatments:
        # Armar la descripción del tratamiento
        descripcion_tratamiento = f"Nombre: {treatment.nombre}. Finalidad: {treatment.finalidad}. Categorías de datos: {treatment.categorias_datos or 'No especificadas'}. Destinatarios: {treatment.destinatarios or 'No especificados'}."

        try:
            # Llamar a la IA
            riesgo = await ai_service.assess_treatment_risk(descripcion_tratamiento)

            # Verificar si ya existe una evaluación para este tratamiento
            impact = existing_impacts.get(treatment.id)

            if impact:
                # Actualizar (upsert)
                impact.nivel_riesgo = riesgo.get("nivel_riesgo", "medio").lower()
                impact.descripcion_riesgo = riesgo.get("descripcion_riesgo", "")
                impact.medidas_mitigacion = riesgo.get("medidas_mitigacion", "")
                impact.estado = "pendiente" # SIEMPRE PENDIENTE para revisión humana
                impact.updated_at = datetime.utcnow()
            else:
                # Crear nueva evaluación
                impact = ImpactAssessment(
                    treatment_id=treatment.id,
                    nivel_riesgo=riesgo.get("nivel_riesgo", "medio").lower(),
                    descripcion_riesgo=riesgo.get("descripcion_riesgo", ""),
                    medidas_mitigacion=riesgo.get("medidas_mitigacion", ""),
                    estado="pendiente", # SIEMPRE PENDIENTE para revisión humana
                    organization_id=org_id
                )
                db.add(impact)

            evaluations.append({
                "treatment_id": treatment.id,
                "treatment_name": treatment.nombre,
                "nivel_riesgo": impact.nivel_riesgo
            })

        except Exception as e:
            print(f"Error evaluando el tratamiento {treatment.id}: {e}")

    # 4. Guardar cambios en la base de datos
    await db.commit()

    return {
        "message": f"Se analizaron {len(evaluations)} tratamientos exitosamente.",
        "evaluations": evaluations
    }