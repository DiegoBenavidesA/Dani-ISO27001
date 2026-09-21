from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
import logging

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, RequireRole
from app.models.organization import Organization

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])
logger = logging.getLogger(__name__)

class OrganizationCreate(BaseModel):
    nombre: str
    identificador: Optional[str] = None
    plan: Optional[str] = "basico"

class OrganizationUpdate(BaseModel):
    nombre: Optional[str] = None
    identificador: Optional[str] = None
    activo: Optional[bool] = None
    plan: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    nombre: str
    identificador: Optional[str] = None
    activo: bool
    plan: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[OrganizationResponse])
async def get_all_organizations(
    current_user: dict = Depends(RequireRole(["admin"])), # T5: Solo super-admin
    db: AsyncSession = Depends(get_db)
):
    """Obtener todas las organizaciones registradas"""
    result = await db.execute(select(Organization).order_by(Organization.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    current_user: dict = Depends(RequireRole(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """Crear una nueva empresa manualmente (T5)"""
    new_org = Organization(**org_data.dict(exclude_unset=True))
    db.add(new_org)
    await db.commit()
    await db.refresh(new_org)
    return new_org

@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    update_data: OrganizationUpdate,
    current_user: dict = Depends(RequireRole(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar datos de una empresa (desactivar, etc)"""
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")

    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(org, key, value)

    await db.commit()
    await db.refresh(org)
    return org