from datetime import datetime
from typing import List, Optional
import hashlib
import secrets
import asyncio
import logging
import traceback

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.models.consent import Consent, ConsentState
from app.models.consent_history import ConsentHistory
from app.models.data_treatment import DataTreatment
from app.models.organization import Organization
from app.services.email_service import send_consent_email
from app.config import settings


router = APIRouter(
    prefix="/api/consents",
    tags=["Consents"]
)

public_router = APIRouter(
    prefix="/api/consents",
    tags=["Consents (public)"]
)

# =========================================================
# MODELOS DE ENTRADA Y SALIDA
# =========================================================

class ConsentCreate(BaseModel):
    titular: str
    titular_email: str
    finalidades_consentidas: Optional[str] = None
    treatment_id: str
    medio: str
    comprobante_url: Optional[str] = None
    fecha_expiracion: Optional[datetime] = None

class ConsentUpdate(BaseModel):
    titular: Optional[str] = None
    titular_email: Optional[str] = None
    treatment_id: Optional[str] = None
    medio: Optional[str] = None
    estado: Optional[str] = None
    comprobante_url: Optional[str] = None
    fecha_expiracion: Optional[datetime] = None

class ConsentResponse(BaseModel):
    id: str
    titular: str
    titular_email: Optional[str] = None
    treatment_id: str
    medio: str
    estado: Optional[str] = None
    fecha_expiracion: Optional[datetime] = None
    fecha_renovacion: Optional[datetime] = None
    fecha_otorgado: Optional[datetime] = None
    fecha_revocado: Optional[datetime] = None
    comprobante_url: Optional[str] = None
    finalidades_consentidas: Optional[str] = None
    organization_id: Optional[str] = None

    class Config:
        from_attributes = True

class PublicConsentResponse(BaseModel):
    titular: str
    treatment_id: str
    estado: Optional[str] = None
    notice_version: Optional[str] = None
    notice_text: Optional[str] = None
    finalidades_consentidas: Optional[str] = None
    fecha_otorgado: Optional[datetime] = None
    fecha_expiracion: Optional[datetime] = None
    fecha_renovacion: Optional[datetime] = None
    fecha_revocado: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConsentCreateResponse(ConsentResponse):
    acceptance_token: str
    email_sent: bool = False

class ConsentRenew(BaseModel):
    fecha_expiracion: datetime

# =========================================================
# CREATE - Totalmente blindado contra errores 500
# =========================================================
@router.post("", response_model=ConsentCreateResponse)
@router.post("/", response_model=ConsentCreateResponse, include_in_schema=False)
async def create_consent(
    consent_data: ConsentCreate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    try:
        treatment = await get_scoped_or_404(db, DataTreatment, consent_data.treatment_id, org_id, detail="El tratamiento indicado no existe")

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        notice_version = "1.0"

        # Uso de getattr seguro para evitar errores si un campo del tratamiento viene nulo
        notice_text = (
            f"Tratamiento: {getattr(treatment, 'nombre', 'N/A')}\n"
            f"Finalidad: {getattr(treatment, 'finalidad', 'N/A')}\n"
            f"Base de licitud: {getattr(treatment, 'base_licitud', 'N/A')}\n"
            f"Categorías de datos: {getattr(treatment, 'categorias_datos', 'No especificadas')}\n"
            f"Plazo de conservación: {getattr(treatment, 'plazo_conservacion', 'No especificado')}"
        )

        new_consent = Consent(
            **consent_data.model_dump(exclude_unset=True),
            organization_id=org_id,
            acceptance_token_hash=token_hash,
            notice_version=notice_version,
            notice_text=notice_text
        )

        db.add(new_consent)
        await db.flush()

        history_entry = ConsentHistory(
            consent_id=new_consent.id, 
            organization_id=org_id, 
            action="creado", 
            actor_type="administrador", 
            actor_identifier=None
        )
        db.add(history_entry)

        await db.commit()
        await db.refresh(new_consent)

        # Respaldo de seguridad en caso de que settings.FRONTEND_BASE_URL no exista en el .env
        base_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")
        base = str(base_url).rstrip("/") if base_url else "http://localhost:3000"
        consent_url = f"{base}/consent/{raw_token}"

        # Respaldo de seguridad si el modelo Organization no tiene 'slug'
        org_res = await db.execute(select(Organization).where(Organization.id == org_id))
        org = org_res.scalar_one_or_none()
        slug = getattr(org, "slug", None)
        requests_url = f"{base}/solicitud/{slug}" if slug else None

        email_sent = False
        try:
            if new_consent.titular_email:
                await asyncio.to_thread(send_consent_email, new_consent.titular_email, new_consent.titular, consent_url, requests_url)
                email_sent = True
        except Exception as e:
            logger.warning(f"No se pudo enviar correo a {new_consent.titular_email}: {e}")

        return {
            **ConsentResponse.model_validate(new_consent).model_dump(),
            "acceptance_token": raw_token,
            "email_sent": email_sent,
        }
    
    except HTTPException:
        # Re-lanzar errores 404 (ej. Tratamiento no existe)
        raise
    except Exception as e:
        # Revertir cualquier cambio roto en la BD
        await db.rollback()
        # Imprimir el rastro exacto en la terminal del backend
        traceback.print_exc()
        # Enviar un código 400 (Bad Request) con el error explícito a la pantalla de React
        raise HTTPException(status_code=400, detail=f"Error interno al guardar: {str(e)}")


@router.get("", response_model=List[ConsentResponse])
@router.get("/", response_model=List[ConsentResponse], include_in_schema=False)
async def get_consents(org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    stmt = scope_to_org(select(Consent), Consent, org_id).order_by(Consent.fecha_otorgado.desc())
    return (await db.execute(stmt)).scalars().all()

@router.get("/{consent_id}", response_model=ConsentResponse)
async def get_consent_by_id(consent_id: str, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    return await get_scoped_or_404(db, Consent, consent_id, org_id, detail="Consentimiento no encontrado")

@router.put("/{consent_id}", response_model=ConsentResponse)
async def update_consent(consent_id: str, consent_data: ConsentUpdate, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    consent = await get_scoped_or_404(db, Consent, consent_id, org_id, detail="Consentimiento no encontrado")
    update_data = consent_data.model_dump(exclude_unset=True)
    if "treatment_id" in update_data: await get_scoped_or_404(db, DataTreatment, update_data["treatment_id"], org_id, detail="El tratamiento no existe")
    for field, value in update_data.items(): setattr(consent, field, value)
    
    if update_data:
        db.add(ConsentHistory(consent_id=consent.id, organization_id=org_id, action="actualizado", actor_type="administrador"))
    await db.commit()
    await db.refresh(consent)
    return consent

@router.post("/{consent_id}/revoke", response_model=ConsentResponse)
async def revoke_consent(consent_id: str, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    consent = await get_scoped_or_404(db, Consent, consent_id, org_id, detail="Consentimiento no encontrado")
    if consent.estado != ConsentState.OTORGADO: raise HTTPException(status_code=409, detail="Solo se pueden revocar consentimientos otorgados")
    consent.estado = ConsentState.REVOCADO
    consent.fecha_revocado = datetime.utcnow()
    db.add(ConsentHistory(consent_id=consent.id, organization_id=org_id, action="revocado", actor_type="administrador"))
    await db.commit()
    await db.refresh(consent)
    return consent

@router.post("/{consent_id}/renew", response_model=ConsentResponse)
async def renew_consent(consent_id: str, datos: ConsentRenew, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    consent = await get_scoped_or_404(db, Consent, consent_id, org_id, detail="Consentimiento no encontrado")
    if consent.estado != ConsentState.OTORGADO: raise HTTPException(status_code=409, detail="Solo se pueden renovar consentimientos otorgados")
    consent.fecha_renovacion = datetime.utcnow()
    consent.fecha_expiracion = datos.fecha_expiracion
    db.add(ConsentHistory(consent_id=consent.id, organization_id=org_id, action="renovado", actor_type="administrador"))
    await db.commit()
    await db.refresh(consent)
    return consent

@router.delete("/{consent_id}")
async def delete_consent(consent_id: str, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    consent = await get_scoped_or_404(db, Consent, consent_id, org_id, detail="Consentimiento no encontrado")
    await db.delete(consent)
    await db.commit()
    return {"message": "Consentimiento eliminado"}

# RUTAS PÚBLICAS
@public_router.get("/public/{token}", response_model=PublicConsentResponse)
async def get_public_consent(token: str, db: AsyncSession = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    consent = (await db.execute(select(Consent).where(Consent.acceptance_token_hash == token_hash))).scalar_one_or_none()
    if not consent: raise HTTPException(status_code=404, detail="Enlace inválido")
    return consent

@public_router.post("/public/{token}/accept", response_model=PublicConsentResponse)
async def accept_public_consent(token: str, db: AsyncSession = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    consent = (await db.execute(select(Consent).where(Consent.acceptance_token_hash == token_hash))).scalar_one_or_none()
    if not consent: raise HTTPException(status_code=404, detail="Enlace inválido")
    if consent.estado == ConsentState.REVOCADO: raise HTTPException(status_code=409, detail="Consentimiento ya revocado")
    if consent.estado != ConsentState.OTORGADO:
        consent.estado = ConsentState.OTORGADO
        consent.fecha_otorgado = datetime.utcnow()
        consent.fecha_revocado = None
        db.add(ConsentHistory(consent_id=consent.id, organization_id=consent.organization_id, action="otorgado", actor_type="titular", actor_identifier=consent.titular_email))
    await db.commit()
    await db.refresh(consent)
    return consent

@public_router.post("/public/{token}/revoke", response_model=PublicConsentResponse)
async def revoke_public_consent(token: str, db: AsyncSession = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    consent = (await db.execute(select(Consent).where(Consent.acceptance_token_hash == token_hash))).scalar_one_or_none()
    if not consent: raise HTTPException(status_code=404, detail="Enlace inválido")
    if consent.estado == ConsentState.PENDIENTE: raise HTTPException(status_code=409, detail="Aún no ha sido otorgado")
    if consent.estado != ConsentState.REVOCADO:
        consent.estado = ConsentState.REVOCADO
        consent.fecha_revocado = datetime.utcnow()
        db.add(ConsentHistory(consent_id=consent.id, organization_id=consent.organization_id, action="revocado", actor_type="titular", actor_identifier=consent.titular_email))
        await db.commit()
        await db.refresh(consent)
    return consent

@public_router.get("/public/{token}/receipt")
async def get_consent_receipt(token: str, db: AsyncSession = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    consent = (await db.execute(select(Consent).where(Consent.acceptance_token_hash == token_hash))).scalar_one_or_none()
    if not consent: raise HTTPException(status_code=404, detail="Enlace inválido")
    if consent.estado != ConsentState.OTORGADO: raise HTTPException(status_code=409, detail="Solo disponible para otorgados")
    receipt_text = (
        "COMPROBANTE DE CONSENTIMIENTO\n============================\n\n"
        f"ID: {consent.id}\nTitular: {consent.titular}\nCorreo: {consent.titular_email or 'No informado'}\n"
        f"Estado: {consent.estado.value if hasattr(consent.estado, 'value') else consent.estado}\n"
        f"Fecha otorgamiento: {consent.fecha_otorgado}\nFecha expiración: {consent.fecha_expiracion}\n"
        f"Finalidades: {consent.finalidades_consentidas}\nVersión aviso: {consent.notice_version}\n\n"
        f"AVISO PRESENTADO AL TITULAR\n---------------------------\n{consent.notice_text}\n"
    )
    return Response(content=receipt_text, media_type="text/plain; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="consentimiento-{consent.id}.txt"'})