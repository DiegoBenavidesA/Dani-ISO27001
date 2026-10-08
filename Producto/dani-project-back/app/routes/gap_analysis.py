from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select
from app.dependencies.auth import get_current_user, get_current_org, RequireRole, ELEVATED_READ, ELEVATED_WRITE, ELEVATED_NO_DPO
from app.dependencies.database import get_db
from app.services.gap_analyzer import GapAnalyzer
from app.models.gap_analysis import GapAnalysis, RemediationAction, ControlImplementation, KPI

class DocumentAnalysisRequest(BaseModel):
    document_text: str
    document_name: Optional[str] = "Documento sin nombre"

router = APIRouter(prefix="/api/gap-analysis", tags=["Gap Analysis"])

@router.get("/full")
async def get_full_gap_analysis(current_user: dict = Depends(RequireRole(ELEVATED_NO_DPO)), org_id: str = Depends(get_current_org), db = Depends(get_db)) -> Dict[str, Any]:
    try:
        analyzer = GapAnalyzer(db, org_id)
        res = await analyzer.generate_complete_gap_analysis()
        if not res or "overall_score" not in res: raise ValueError()
        return res
    except Exception:
        controls = (await db.execute(select(ControlImplementation).where(ControlImplementation.organization_id == org_id))).scalars().all()
        applies = [c for c in controls if c.applicable]
        total = len(applies) or 1
        implemented = sum(1 for c in applies if c.status == 'implemented')
        score = int((implemented / total) * 100)
        return { "overall_score": score, "gap_to_certification": max(0, 85 - score), "clause_gaps": [{"clause_id": "Global", "clause_name": "Resumen", "gap": max(0, 100 - score), "current_score": score}], "remediation_plan": {}, "kpi_dashboard": {} }

@router.get("/controls")
async def get_control_gaps(priority: str = None, category: str = None, current_user: dict = Depends(RequireRole(ELEVATED_NO_DPO)), org_id: str = Depends(get_current_org), db = Depends(get_db)) -> Dict:
    try:
        analyzer = GapAnalyzer(db, org_id)
        result = await analyzer._analyze_controls()
        if priority: result["by_priority"]["filtered"] = result["by_priority"].get(priority, [])
        if category: result["by_category"]["filtered"] = result["by_category"].get(category, {})
        return result
    except: return {"by_priority": {}, "by_category": {}}

@router.get("/maturity")
async def get_maturity_matrix(current_user: dict = Depends(RequireRole(ELEVATED_NO_DPO)), org_id: str = Depends(get_current_org), db = Depends(get_db)) -> Dict:
    try: return await GapAnalyzer(db, org_id)._calculate_maturity()
    except: return {"maturity_level": "Inicial"}

@router.get("/remediation-plan")
async def get_remediation_plan(current_user: dict = Depends(RequireRole(ELEVATED_NO_DPO)), org_id: str = Depends(get_current_org), db = Depends(get_db)) -> Dict:
    try: return await GapAnalyzer(db, org_id)._create_remediation_plan()
    except: return {}

@router.get("/kpi-dashboard")
async def get_kpi_dashboard(current_user: dict = Depends(RequireRole(ELEVATED_NO_DPO)), org_id: str = Depends(get_current_org), db = Depends(get_db)) -> Dict:
    try: return await GapAnalyzer(db, org_id)._generate_kpi_dashboard()
    except: return {"strategic": [], "security": [], "operational": []}

@router.get("/score")
async def get_compliance_score(current_user: dict = Depends(RequireRole(ELEVATED_NO_DPO)), org_id: str = Depends(get_current_org), db = Depends(get_db)) -> Dict:
    controls = (await db.execute(select(ControlImplementation).where(ControlImplementation.organization_id == org_id))).scalars().all()
    applies = [c for c in controls if c.applicable]
    if not applies: return {"overall_score": 0, "gap_to_certification": 100, "trend": "down"}
    implemented = sum(1 for c in applies if c.status == 'implemented')
    score = int((implemented / len(applies)) * 100)
    return {"overall_score": score, "gap_to_certification": max(0, 85 - score), "trend": "up" if score > 50 else "down"}

@router.get("/domains")
async def get_domain_scores(current_user: dict = Depends(RequireRole(ELEVATED_NO_DPO)), org_id: str = Depends(get_current_org), db = Depends(get_db)) -> Dict:
    try:
        clauses = await GapAnalyzer(db, org_id)._analyze_clauses()
        c_map = {c["clause_id"]: c["current_score"] for c in clauses}
        return {
            "people": round((c_map.get("7", 0) + c_map.get("6", 0)) / 2, 1),
            "technology": round((c_map.get("8", 0) + c_map.get("9", 0)) / 2, 1),
            "physical": round(c_map.get("9", 0), 1),
            "processes": round((c_map.get("4", 0) + c_map.get("5", 0) + c_map.get("10", 0)) / 3, 1),
        }
    except: return {"people": 0, "technology": 0, "physical": 0, "processes": 0}

@router.post("/remediation-actions/{gap_id}")
async def create_remediation_action(gap_id: str, action_data: Dict[str, Any], current_user: dict = Depends(RequireRole(ELEVATED_WRITE)), db = Depends(get_db)):
    gap = (await db.execute(select(GapAnalysis).where(GapAnalysis.id == gap_id))).scalar_one_or_none()
    if not gap: raise HTTPException(status_code=404, detail="Gap no encontrado")
    action = RemediationAction(
        gap_id=gap_id, title=action_data.get("title"), description=action_data.get("description"),
        priority=action_data.get("priority", "medium"), estimated_hours=action_data.get("estimated_hours"),
        assigned_to=action_data.get("assigned_to"), due_date=datetime.fromisoformat(action_data["due_date"]) if action_data.get("due_date") else None
    )
    db.add(action)
    await db.commit()
    await db.refresh(action)
    return {"message": "Acción creada", "action": action}

@router.post("/analyze-document")
async def analyze_document(request: DocumentAnalysisRequest, current_user: dict = Depends(RequireRole(ELEVATED_WRITE)), org_id: str = Depends(get_current_org), db = Depends(get_db)) -> Dict[str, Any]:
    if not request.document_text or len(request.document_text.strip()) < 50: raise HTTPException(status_code=400, detail="El documento debe tener al menos 50 caracteres.")
    return await GapAnalyzer(db, org_id).analyze_document_with_llm(document_text=request.document_text, document_name=request.document_name)

@router.post("/kpi/update")
async def update_kpi(kpi_id: str, current_value: float, current_user: dict = Depends(RequireRole(ELEVATED_WRITE)), db = Depends(get_db)):
    kpi = (await db.execute(select(KPI).where(KPI.id == kpi_id))).scalar_one_or_none()
    if not kpi: raise HTTPException(status_code=404, detail="KPI no encontrado")
    kpi.current_value = current_value
    kpi.last_updated = datetime.utcnow()
    if current_value >= kpi.target_value: kpi.status = "on_track"
    elif current_value >= kpi.target_value * 0.7: kpi.status = "at_risk"
    else: kpi.status = "behind"
    await db.commit()
    return {"message": "KPI actualizado", "kpi": kpi}