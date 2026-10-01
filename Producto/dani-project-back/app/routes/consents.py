from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.models.consent import Consent
from app.models.data_treatment import DataTreatment


router = APIRouter(
    prefix="/api/consents",
    tags=["Consents"]
)


# =========================================================
# MODELOS DE ENTRADA Y SALIDA
# =========================================================

class ConsentCreate(BaseModel):
    titular: str
    treatment_id: str
    medio: str
    estado: Optional[str] = None
    fecha_otorgado: Optional[datetime] = None
    comprobante_url: Optional[str] = None


class ConsentUpdate(BaseModel):
    titular: Optional[str] = None
    treatment_id: Optional[str] = None
    medio: Optional[str] = None
    estado: Optional[str] = None
    comprobante_url: Optional[str] = None


class ConsentResponse(BaseModel):
    id: str
    titular: str
    treatment_id: str
    medio: str
    estado: Optional[str] = None
    fecha_otorgado: Optional[datetime] = None
    fecha_revocado: Optional[datetime] = None
    comprobante_url: Optional[str] = None
    organization_id: Optional[str] = None

    class Config:
        from_attributes = True


# =========================================================
# CREATE — la empresa se asigna desde el token
# =========================================================

@router.post("/", response_model=ConsentResponse)
async def create_consent(
    consent_data: ConsentCreate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    # El tratamiento debe existir Y pertenecer a la misma empresa.
    treatment = await get_scoped_or_404(
        db,
        DataTreatment,
        consent_data.treatment_id,
        org_id,
        detail="El tratamiento indicado no existe"
    )

    if not treatment:
        raise HTTPException(
            status_code=400,
            detail="El tratamiento indicado no existe"
        )

    new_consent = Consent(
        **consent_data.model_dump(exclude_unset=True),
        organization_id=org_id
    )

    db.add(new_consent)
    await db.commit()
    await db.refresh(new_consent)

    return new_consent


# =========================================================
# READ — solo consentimientos de mi empresa
# =========================================================

@router.get("/", response_model=List[ConsentResponse])
async def get_consents(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(select(Consent), Consent, org_id)
    stmt = stmt.order_by(Consent.fecha_otorgado.desc())

    result = await db.execute(stmt)

    return result.scalars().all()


# =========================================================
# READ — un consentimiento solo si es de mi empresa
# =========================================================

@router.get("/{consent_id}", response_model=ConsentResponse)
async def get_consent_by_id(
    consent_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    return await get_scoped_or_404(
        db,
        Consent,
        consent_id,
        org_id,
        detail="Consentimiento no encontrado"
    )


# =========================================================
# UPDATE — solo si es de mi empresa
# =========================================================

@router.put("/{consent_id}", response_model=ConsentResponse)
async def update_consent(
    consent_id: str,
    consent_data: ConsentUpdate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    consent = await get_scoped_or_404(
        db,
        Consent,
        consent_id,
        org_id,
        detail="Consentimiento no encontrado"
    )

    update_data = consent_data.model_dump(exclude_unset=True)

    # Si se cambia el tratamiento, debe pertenecer a la misma empresa.
    if "treatment_id" in update_data:
        await get_scoped_or_404(
            db,
            DataTreatment,
            update_data["treatment_id"],
            org_id,
            detail="El tratamiento indicado no existe"
        )

    for field, value in update_data.items():
        setattr(consent, field, value)

    await db.commit()
    await db.refresh(consent)

    return consent


# =========================================================
# REVOCAR — solo si el consentimiento es de mi empresa
# =========================================================

@router.post("/{consent_id}/revoke", response_model=ConsentResponse)
async def revoke_consent(
    consent_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    consent = await get_scoped_or_404(
        db,
        Consent,
        consent_id,
        org_id,
        detail="Consentimiento no encontrado"
    )

    consent.estado = "revocado"
    consent.fecha_revocado = datetime.utcnow()

    await db.commit()
    await db.refresh(consent)

    return consent


# =========================================================
# DELETE — solo si es de mi empresa
# =========================================================

@router.delete("/{consent_id}")
async def delete_consent(
    consent_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    consent = await get_scoped_or_404(
        db,
        Consent,
        consent_id,
        org_id,
        detail="Consentimiento no encontrado"
    )

    await db.delete(consent)
    await db.commit()

    return {"message": "Consentimiento eliminado exitosamente"}