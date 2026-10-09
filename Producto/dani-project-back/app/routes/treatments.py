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

router = APIRouter(prefix="/api/treatments", tags=["Treatments"])

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
    class Config: from_attributes = True

@router.post("/", response_model=TreatmentResponse)
async def create_treatment(treatment_data: TreatmentCreate, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    new_treatment = DataTreatment(**treatment_data.model_dump(exclude_unset=True), organization_id=org_id)
    db.add(new_treatment)
    await db.commit()
    await db.refresh(new_treatment)
    return new_treatment

@router.post("/bulk", response_model=List[TreatmentResponse])
async def create_treatments_bulk(treatments_data: List[dict], org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    # Deduplicación: evita que la IA vuelva a insertar tratamientos ya existentes.
    # Se comparan por nombre (sin distinguir mayúsculas/espacios) contra los que
    # ya tiene la empresa y contra los del propio lote.
    existentes = (await db.execute(scope_to_org(select(DataTreatment), DataTreatment, org_id))).scalars().all()
    vistos = {(t.nombre or "").strip().lower() for t in existentes}

    created = []
    for t_dict in treatments_data:
        nombre = (t_dict.get("nombre") or "Tratamiento detectado por IA").strip()
        clave = nombre.lower()
        if clave in vistos:
            continue  # ya existe: no duplicar
        vistos.add(clave)
        new_t = DataTreatment(
            nombre=nombre,
            finalidad=t_dict.get("finalidad", "No especificada"),
            base_licitud=t_dict.get("base_licitud", "No especificada"),
            categorias_datos=t_dict.get("categorias_datos", "No especificadas"),
            plazo_conservacion=t_dict.get("plazo_conservacion", "No especificado"),
            organization_id=org_id
        )
        db.add(new_t)
        created.append(new_t)

    await db.commit()
    for c in created: await db.refresh(c)
    return created

@router.get("/", response_model=List[TreatmentResponse])
async def get_treatments(org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    stmt = scope_to_org(select(DataTreatment), DataTreatment, org_id).order_by(DataTreatment.created_at.desc())
    return (await db.execute(stmt)).scalars().all()

@router.get("/{treatment_id}", response_model=TreatmentResponse)
async def get_treatment_by_id(treatment_id: str, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    return await get_scoped_or_404(db, DataTreatment, treatment_id, org_id, detail="Tratamiento no encontrado")

@router.put("/{treatment_id}", response_model=TreatmentResponse)
async def update_treatment(treatment_id: str, treatment_data: TreatmentUpdate, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    treatment = await get_scoped_or_404(db, DataTreatment, treatment_id, org_id, detail="Tratamiento no encontrado")
    for field, value in treatment_data.model_dump(exclude_unset=True).items(): setattr(treatment, field, value)
    treatment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(treatment)
    return treatment

@router.delete("/{treatment_id}")
async def delete_treatment(treatment_id: str, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    treatment = await get_scoped_or_404(db, DataTreatment, treatment_id, org_id, detail="Tratamiento no encontrado")
    await db.delete(treatment)
    await db.commit()
    return {"message": "Tratamiento eliminado exitosamente"}

@router.delete("/{treatment_id}")
async def delete_treatment(treatment_id: str, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    treatment = await get_scoped_or_404(db, DataTreatment, treatment_id, org_id, detail="Tratamiento no encontrado")
    await db.delete(treatment)
    await db.commit()
    return {"message": "Tratamiento eliminado exitosamente"}