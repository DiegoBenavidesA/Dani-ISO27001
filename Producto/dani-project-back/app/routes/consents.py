from datetime import datetime
from typing import List, Optional
import hashlib
import secrets
import asyncio
import logging

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
from app.services.email_service import send_consent_email
from app.config import settings


router = APIRouter(
    prefix="/api/consents",
    tags=["Consents"]
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
# CREATE — la empresa se asigna desde el token
# =========================================================

@router.post("/", response_model=ConsentCreateResponse)
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

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    notice_version = "1.0"

    notice_text = (
        f"Tratamiento: {treatment.nombre}\n"
        f"Finalidad: {treatment.finalidad}\n"
        f"Base de licitud: {treatment.base_licitud}\n"
        f"Categorías de datos: {treatment.categorias_datos or 'No especificadas'}\n"
        f"Plazo de conservación: {treatment.plazo_conservacion or 'No especificado'}"
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

    consent_url = (
        f"{settings.FRONTEND_BASE_URL.rstrip('/')}/consent/{raw_token}"
    )

    # El correo NO debe tumbar la creación: el consentimiento ya quedó guardado.
    # Lo enviamos en un hilo aparte (SMTP es bloqueante) y atrapamos errores.
    email_sent = False
    try:
        await asyncio.to_thread(
            send_consent_email,
            new_consent.titular_email,
            new_consent.titular,
            consent_url,
        )
        email_sent = True
    except Exception as e:
        logger.warning(f"No se pudo enviar el correo de consentimiento a {new_consent.titular_email}: {e}")

    return {
        **ConsentResponse.model_validate(new_consent).model_dump(),
        "acceptance_token": raw_token,
        "email_sent": email_sent,
    }


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

    if update_data:
        history_entry = ConsentHistory(
            consent_id=consent.id,
            organization_id=org_id,
            action="actualizado",
            actor_type="administrador",
            actor_identifier=None
        )
        db.add(history_entry)

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

    if consent.estado != ConsentState.OTORGADO:
        raise HTTPException(
            status_code=409,
            detail="Solo se pueden revocar consentimientos otorgados"
        )

    consent.estado = ConsentState.REVOCADO
    consent.fecha_revocado = datetime.utcnow()

    history_entry = ConsentHistory(
        consent_id=consent.id,
        organization_id=org_id,
        action="revocado",
        actor_type="administrador",
        actor_identifier=None
    )

    db.add(history_entry)

    await db.commit()
    await db.refresh(consent)

    return consent

# =========================================================
# RENOVAR — solo si el consentimiento es de mi empresa
# =========================================================

@router.post("/{consent_id}/renew", response_model=ConsentResponse)
async def renew_consent(
    consent_id: str,
    datos: ConsentRenew,
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

    if consent.estado != ConsentState.OTORGADO:
        raise HTTPException(
            status_code=409,
            detail="Solo se pueden renovar consentimientos otorgados"
        )

    consent.fecha_renovacion = datetime.utcnow()
    consent.fecha_expiracion = datos.fecha_expiracion

    history_entry = ConsentHistory(
        consent_id=consent.id,
        organization_id=org_id,
        action="renovado",
        actor_type="administrador",
        actor_identifier=None
    )

    db.add(history_entry)

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


    # =========================================================
    # PUBLIC — consultar consentimiento mediante token
    # =========================================================

@router.get("/public/{token}", response_model=PublicConsentResponse)
async def get_public_consent(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    result = await db.execute(
        select(Consent).where(
            Consent.acceptance_token_hash == token_hash
        )
    )
    consent = result.scalar_one_or_none()

    if not consent:
        raise HTTPException(
            status_code=404,
            detail="Enlace de consentimiento inválido"
        )

    return consent


# =========================================================
# PUBLIC - aceptar consentimiento mediante token
# =========================================================

@router.post("/public/{token}/accept", response_model=PublicConsentResponse)
async def accept_public_consent(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    result = await db.execute(
        select(Consent).where(
            Consent.acceptance_token_hash == token_hash
        )
    )
    consent = result.scalar_one_or_none()

    if not consent:
        raise HTTPException(
            status_code=404,
            detail="Enlace de consentimiento inválido"
        )

    if consent.estado == ConsentState.REVOCADO:
        raise HTTPException(
            status_code=409,
            detail="El consentimiento ya fue revocado"
        )

    if consent.estado != ConsentState.OTORGADO:
        consent.estado = ConsentState.OTORGADO
        consent.fecha_otorgado = datetime.utcnow()
        consent.fecha_revocado = None

        history_entry = ConsentHistory(
            consent_id=consent.id,
            organization_id=consent.organization_id,
            action="otorgado",
            actor_type="titular",
            actor_identifier=consent.titular_email
        )

        db.add(history_entry)

    await db.commit()
    await db.refresh(consent)

    return consent

    # =========================================================
    # PUBLIC - revocar consentimiento mediante token
    # =========================================================

@router.post("/public/{token}/revoke", response_model=PublicConsentResponse)
async def revoke_public_consent(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    result = await db.execute(
        select(Consent).where(
            Consent.acceptance_token_hash == token_hash
        )
    )
    consent = result.scalar_one_or_none()

    if not consent:
        raise HTTPException(
            status_code=404,
            detail="Enlace de consentimiento inválido"
        )

    if consent.estado == ConsentState.PENDIENTE:
        raise HTTPException(
            status_code=409,
            detail="No se puede revocar un consentimiento que aún no ha sido otorgado"
        )

    if consent.estado != ConsentState.REVOCADO:
        consent.estado = ConsentState.REVOCADO
        consent.fecha_revocado = datetime.utcnow()

        history_entry = ConsentHistory(
            consent_id=consent.id,
            organization_id=consent.organization_id,
            action="revocado",
            actor_type="titular",
            actor_identifier=consent.titular_email
        )

        db.add(history_entry)

        await db.commit()
        await db.refresh(consent)

    return consent

    # =========================================================
# PUBLIC - comprobante del consentimiento
# =========================================================

@router.get("/public/{token}/receipt")
async def get_consent_receipt(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    result = await db.execute(
        select(Consent).where(
            Consent.acceptance_token_hash == token_hash
        )
    )
    consent = result.scalar_one_or_none()

    if not consent:
        raise HTTPException(
            status_code=404,
            detail="Enlace de consentimiento inválido"
        )

    if consent.estado != ConsentState.OTORGADO:
        raise HTTPException(
            status_code=409,
            detail="El comprobante solo está disponible para consentimientos otorgados"
        )

    receipt_text = (
        "COMPROBANTE DE CONSENTIMIENTO\n"
        "============================\n\n"
        f"ID de consentimiento: {consent.id}\n"
        f"Titular: {consent.titular}\n"
        f"Correo: {consent.titular_email or 'No informado'}\n"
        f"Estado: {consent.estado.value if hasattr(consent.estado, 'value') else consent.estado}\n"
        f"Fecha de otorgamiento: {consent.fecha_otorgado or 'No registrada'}\n"
        f"Fecha de expiración: {consent.fecha_expiracion or 'Sin expiración definida'}\n"
        f"Finalidades consentidas: {consent.finalidades_consentidas or 'No especificadas'}\n"
        f"Versión del aviso: {consent.notice_version or 'No especificada'}\n\n"
        "AVISO PRESENTADO AL TITULAR\n"
        "---------------------------\n"
        f"{consent.notice_text or 'No disponible'}\n"
    )

    return Response(
        content=receipt_text,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="consentimiento-{consent.id}.txt"'
        }
    )