from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import Optional
import uuid

# Importamos los helpers del núcleo multi-tenant
from app.dependencies.auth import get_current_user, RequireRole, get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.dependencies.database import get_db
from app.models.capa import CAPA, CAPAStatus, CAPAPriority, CAPASource
from pydantic import BaseModel

router = APIRouter(prefix="/api/capas", tags=["CAPA"])

class CAPACreate(BaseModel):
    title: str
    assignee: str
    due_date: str
    priority: str = "medium"
    source: str = "internalAudit"
    control: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None

class CAPAStatusUpdate(BaseModel):
    status: str
    progress: Optional[int] = None

def _serialize(capa: CAPA) -> dict:
    return {
        "id": capa.nc_code,
        "db_id": capa.id,
        "title": capa.title,
        "source": capa.source.value,
        "status": capa.status.value,
        "priority": capa.priority.value,
        "dueDate": capa.due_date.strftime("%Y-%m-%d") if capa.due_date else None,
        "assignee": capa.assignee,
        "control": capa.control,
        "rootCause": capa.root_cause,
        "correctiveAction": capa.corrective_action,
        "progress": capa.progress,
        "createdAt": capa.created_at.isoformat() if capa.created_at else None,
    }

async def _next_nc_code(db: AsyncSession, org_id: str) -> str:
    # Aislamiento: El conteo de NC es independiente por empresa
    stmt = select(func.count()).select_from(CAPA).where(CAPA.organization_id == org_id)
    result = await db.execute(stmt)
    count = result.scalar() or 0
    year = datetime.utcnow().year
    return f"NC-{year}-{str(count + 1).zfill(3)}"

@router.get("/")
async def get_all_capas(
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(select(CAPA), CAPA, org_id).order_by(CAPA.created_at.desc())
    result = await db.execute(stmt)
    capas = result.scalars().all()
    return [_serialize(c) for c in capas]

@router.post("/")
async def create_capa(
    data: CAPACreate,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    db: AsyncSession = Depends(get_db)
):
    nc_code = await _next_nc_code(db, org_id)
    try:
        due = datetime.strptime(data.due_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=422, detail="due_date debe tener formato YYYY-MM-DD")

    capa = CAPA(
        id=str(uuid.uuid4()),
        nc_code=nc_code,
        title=data.title,
        assignee=data.assignee,
        due_date=due,
        priority=CAPAPriority(data.priority),
        source=CAPASource(data.source),
        control=data.control,
        root_cause=data.root_cause,
        corrective_action=data.corrective_action,
        status=CAPAStatus.OPEN,
        progress=0,
        organization_id=org_id # Asignación estricta de empresa
    )
    db.add(capa)
    await db.commit()
    await db.refresh(capa)
    return _serialize(capa)

@router.patch("/{db_id}/status")
async def update_capa_status(
    db_id: str,
    data: CAPAStatusUpdate,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    db: AsyncSession = Depends(get_db)
):
    capa = await get_scoped_or_404(db, CAPA, db_id, org_id)

    try:
        capa.status = CAPAStatus(data.status)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Estado inválido: {data.status}")

    if data.progress is not None:
        capa.progress = data.progress
    elif data.status == "resolved":
        capa.progress = 100
    elif data.status == "closed":
        capa.progress = 100

    capa.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(capa)
    return _serialize(capa)

@router.delete("/{db_id}")
async def delete_capa(
    db_id: str,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(RequireRole(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    capa = await get_scoped_or_404(db, CAPA, db_id, org_id)
    await db.delete(capa)
    await db.commit()
    return {"message": "CAPA eliminada"}