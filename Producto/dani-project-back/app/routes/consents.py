from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.consent import Consent, ConsentState

router = APIRouter(prefix="/api/consents", tags=["Consents"])

# ==========================================
# ESQUEMAS (PYDANTIC)
# ==========================================
class ConsentCreate(BaseModel):
    titular: str
    treatment_id: str
    medio: str
    comprobante_url: Optional[str] = None
    organization_id: Optional[str] = None

class ConsentResponse(BaseModel):
    id: str
    titular: str
    treatment_id: str
    fecha_otorgado: datetime
    medio: str
    estado: str
    fecha_revocado: Optional[datetime] = None
    comprobante_url: Optional[str] = None
    organization_id: Optional[str] = None

    class Config:
        from_attributes = True

# ==========================================
# ENDPOINTS
# ==========================================
@router.post("", response_model=ConsentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ConsentResponse, status_code=status.HTTP_201_CREATED)
async def create_consent(
    consent_data: ConsentCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Registrar un nuevo consentimiento otorgado por un titular"""
    
    new_consent = Consent(
        titular=consent_data.titular,
        treatment_id=consent_data.treatment_id,
        medio=consent_data.medio,
        comprobante_url=consent_data.comprobante_url,
        organization_id=consent_data.organization_id,
        estado=ConsentState.OTORGADO,
        fecha_otorgado=datetime.utcnow()
    )
    
    db.add(new_consent)
    await db.commit()
    await db.refresh(new_consent)
    
    return new_consent

@router.get("", response_model=List[ConsentResponse])
@router.get("/", response_model=List[ConsentResponse])
async def get_all_consents(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Listar todos los consentimientos registrados"""
    query = select(Consent)
    result = await db.execute(query)
    consents = result.scalars().all()
    
    return consents

@router.get("/{consent_id}", response_model=ConsentResponse)
async def get_consent_by_id(
    consent_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener el detalle de un consentimiento específico"""
    query = select(Consent).where(Consent.id == consent_id)
    result = await db.execute(query)
    consent = result.scalar_one_or_none()
    
    if not consent:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")
        
    return consent

@router.patch("/{consent_id}/revoke")
async def revoke_consent(
    consent_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revocar un consentimiento existente (Obligación Ley 21.719)"""
    query = select(Consent).where(Consent.id == consent_id)
    result = await db.execute(query)
    consent = result.scalar_one_or_none()
    
    if not consent:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")
        
    if consent.estado == ConsentState.REVOCADO:
        raise HTTPException(status_code=400, detail="El consentimiento ya se encuentra revocado")

    consent.estado = ConsentState.REVOCADO
    consent.fecha_revocado = datetime.utcnow()
        
    await db.commit()
    await db.refresh(consent)
    
    return {
        "message": "Consentimiento revocado exitosamente", 
        "estado": consent.estado,
        "fecha_revocado": consent.fecha_revocado.isoformat()
    }

@router.delete("/{consent_id}")
async def delete_consent(
    consent_id: str,
    current_user: dict = Depends(get_current_user), # Podrías cambiarlo a require_admin si es crítico
    db: AsyncSession = Depends(get_db)
):
    """Eliminar un registro de consentimiento (Hard delete)"""
    query = select(Consent).where(Consent.id == consent_id)
    result = await db.execute(query)
    consent = result.scalar_one_or_none()
    
    if not consent:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")
        
    await db.delete(consent)
    await db.commit()
    
    return {"message": "Registro de consentimiento eliminado exitosamente"}