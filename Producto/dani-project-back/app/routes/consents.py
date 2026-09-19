from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.consent import Consent


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
    organization_id: Optional[str] = None


class ConsentUpdate(BaseModel):
    titular: Optional[str] = None
    treatment_id: Optional[str] = None
    medio: Optional[str] = None
    estado: Optional[str] = None
    comprobante_url: Optional[str] = None
    organization_id: Optional[str] = None


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
# CREATE — Registrar un consentimiento
# =========================================================

@router.post("/", response_model=ConsentResponse)
async def create_consent(
    consent_data: ConsentCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_consent = Consent(
        **consent_data.model_dump(exclude_unset=True)
    )

    db.add(new_consent)
    await db.commit()
    await db.refresh(new_consent)

    return new_consent


# =========================================================
# READ — Todos los consentimientos
# =========================================================

@router.get("/", response_model=List[ConsentResponse])
async def get_consents(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Consent).order_by(
            Consent.fecha_otorgado.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# READ — Un consentimiento por ID
# =========================================================

@router.get("/{consent_id}", response_model=ConsentResponse)
async def get_consent_by_id(
    consent_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Consent).where(Consent.id == consent_id)
    )

    consent = result.scalar_one_or_none()

    if not consent:
        raise HTTPException(
            status_code=404,
            detail="Consentimiento no encontrado"
        )

    return consent


# =========================================================
# UPDATE — Actualizar un consentimiento
# =========================================================

@router.put("/{consent_id}", response_model=ConsentResponse)
async def update_consent(
    consent_id: str,
    consent_data: ConsentUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Consent).where(Consent.id == consent_id)
    )

    consent = result.scalar_one_or_none()

    if not consent:
        raise HTTPException(
            status_code=404,
            detail="Consentimiento no encontrado"
        )

    update_data = consent_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(consent, field, value)

    await db.commit()
    await db.refresh(consent)

    return consent


# =========================================================
# REVOCAR — Marcar un consentimiento como revocado (O2)
# La ley exige poder retirar el consentimiento en cualquier momento.
# =========================================================

@router.post("/{consent_id}/revoke", response_model=ConsentResponse)
async def revoke_consent(
    consent_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Consent).where(Consent.id == consent_id)
    )

    consent = result.scalar_one_or_none()

    if not consent:
        raise HTTPException(
            status_code=404,
            detail="Consentimiento no encontrado"
        )

    consent.estado = "revocado"
    consent.fecha_revocado = datetime.utcnow()

    await db.commit()
    await db.refresh(consent)

    return consent


# =========================================================
# DELETE — Eliminar un consentimiento
# =========================================================

@router.delete("/{consent_id}")
async def delete_consent(
    consent_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Consent).where(Consent.id == consent_id)
    )

    consent = result.scalar_one_or_none()

    if not consent:
        raise HTTPException(
            status_code=404,
            detail="Consentimiento no encontrado"
        )

    await db.delete(consent)
    await db.commit()

    return {"message": "Consentimiento eliminado exitosamente"}
