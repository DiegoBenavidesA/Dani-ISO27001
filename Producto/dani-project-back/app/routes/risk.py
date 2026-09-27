from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel

from app.dependencies.database import get_db
from app.models.risk import Risk, RiskLevel, RiskStatus, RiskCategory
from app.dependencies.auth import get_current_user, get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.services.deepseek_service import DeepSeekService

router = APIRouter(prefix="/api/risks", tags=["Risks"])
ai_processor = DeepSeekService()

class RiskCreate(BaseModel):
    title: str
    description: str
    category: RiskCategory = RiskCategory.SECURITY
    likelihood: int = 1
    impact: int = 1
    owner: str
    due_date: Optional[datetime] = None

class RiskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[RiskCategory] = None
    likelihood: Optional[int] = None
    impact: Optional[int] = None
    owner: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[RiskStatus] = None

class RiskResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    likelihood: int
    impact: int
    risk_level: str
    status: str
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

@router.post("/", response_model=RiskResponse)
async def create_risk(
    risk_data: RiskCreate,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    risk_score = risk_data.likelihood * risk_data.impact
    risk_level = RiskLevel.CRITICAL if risk_score >= 15 else (RiskLevel.HIGH if risk_score >= 8 else (RiskLevel.MEDIUM if risk_score >= 4 else RiskLevel.LOW))
    
    risk = Risk(
        title=risk_data.title,
        description=risk_data.description,
        category=risk_data.category,
        likelihood=risk_data.likelihood,
        impact=risk_data.impact,
        owner=risk_data.owner,
        due_date=risk_data.due_date,
        risk_level=risk_level,
        status=RiskStatus.OPEN,
        created_by=current_user["user_id"],
        organization_id=org_id
    )
    db.add(risk)
    await db.commit()
    await db.refresh(risk)
    return risk

@router.get("/", response_model=List[RiskResponse])
async def get_risks(
    status: Optional[RiskStatus] = None,
    risk_level: Optional[RiskLevel] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Risk)
    if status:
        stmt = stmt.where(Risk.status == status)
    if risk_level:
        stmt = stmt.where(Risk.risk_level == risk_level)
        
    stmt = scope_to_org(stmt, Risk, org_id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/statistics")
async def get_risk_statistics(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(select(Risk), Risk, org_id)
    result = await db.execute(stmt)
    risks = result.scalars().all()
    
    return {
        "total": len(risks),
        "critical": sum(1 for r in risks if r.risk_level == RiskLevel.CRITICAL),
        "high": sum(1 for r in risks if r.risk_level == RiskLevel.HIGH),
        "medium": sum(1 for r in risks if r.risk_level == RiskLevel.MEDIUM),
        "low": sum(1 for r in risks if r.risk_level == RiskLevel.LOW)
    }

@router.put("/{risk_id}/status")
async def update_risk_status(
    risk_id: str,
    status: RiskStatus,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    risk = await get_scoped_or_404(db, Risk, risk_id, org_id)
    risk.status = status
    await db.commit()
    await db.refresh(risk)
    return {"message": "Risk status updated", "risk": risk}

@router.post("/{risk_id}/analyze")
async def analyze_risk_with_ai(
    risk_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    risk = await get_scoped_or_404(db, Risk, risk_id, org_id)
    risk_category = str(risk.category).lower() if risk.category else "security"
    
    analysis_result = await ai_processor.analyze_risk({
        "title": risk.title,
        "description": risk.description,
        "category": risk_category
    })
    
    controls = [
        {"id": "ai_c1", "name": "Implementar MFA estricto (FIDO2) - Sugerido por IA", "reduction": 5},
        {"id": "ai_c2", "name": "Rotación automática de credenciales de API y DB - Sugerido por IA", "reduction": 4}
    ]
    
    return {
        "message": "Analysis complete",
        "data": analysis_result,
        "controls": controls,
        "recommendations": [{"title": ctrl["name"], "reduction": ctrl["reduction"]} for ctrl in controls]
    }

@router.put("/{risk_id}", response_model=RiskResponse)
async def update_risk(
    risk_id: str,
    risk_data: RiskUpdate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    risk = await get_scoped_or_404(db, Risk, risk_id, org_id)
    update_dict = risk_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(risk, key, value)
        
    await db.commit()
    await db.refresh(risk)
    return risk

@router.delete("/{risk_id}")
async def delete_risk(
    risk_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    risk = await get_scoped_or_404(db, Risk, risk_id, org_id)
    await db.delete(risk)
    await db.commit()
    return {"message": "Risk deleted successfully"}