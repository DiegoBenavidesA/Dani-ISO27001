# app/routes/gap_analysis.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

from sqlalchemy import select
from app.dependencies.auth import get_current_user, get_current_org, RequireRole
from app.dependencies.database import get_db
from app.services.gap_analyzer import GapAnalyzer
from app.models.gap_analysis import GapAnalysis, RemediationAction, ControlImplementation, KPI


class DocumentAnalysisRequest(BaseModel):
    document_text: str
    document_name: Optional[str] = "Documento sin nombre"

router = APIRouter(prefix="/api/gap-analysis", tags=["Gap Analysis"])

@router.get("/full")
async def get_full_gap_analysis(
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    org_id: str = Depends(get_current_org),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Obtener análisis de brecha completo"""
    analyzer = GapAnalyzer(db, org_id)
    result = await analyzer.generate_complete_gap_analysis()
    return result

@router.get("/controls")
async def get_control_gaps(
    priority: str = None,
    category: str = None,
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    org_id: str = Depends(get_current_org),
    db = Depends(get_db)
) -> Dict:
    """Obtener brechas de controles ISO"""
    analyzer = GapAnalyzer(db, org_id)
    result = await analyzer._analyze_controls()

    if priority:
        result["by_priority"]["filtered"] = result["by_priority"].get(priority, [])

    if category:
        result["by_category"]["filtered"] = result["by_category"].get(category, {})

    return result

@router.get("/maturity")
async def get_maturity_matrix(
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    org_id: str = Depends(get_current_org),
    db = Depends(get_db)
) -> Dict:
    """Obtener matriz de madurez"""
    analyzer = GapAnalyzer(db, org_id)
    result = await analyzer._calculate_maturity()
    return result

@router.get("/remediation-plan")
async def get_remediation_plan(
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    org_id: str = Depends(get_current_org),
    db = Depends(get_db)
) -> Dict:
    """Obtener plan de remediación"""
    analyzer = GapAnalyzer(db, org_id)
    result = await analyzer._create_remediation_plan()
    return result

@router.get("/kpi-dashboard")
async def get_kpi_dashboard(
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    org_id: str = Depends(get_current_org),
    db = Depends(get_db)
) -> Dict:
    """Obtener dashboard de KPIs"""
    analyzer = GapAnalyzer(db, org_id)
    result = await analyzer._generate_kpi_dashboard()
    return result

@router.get("/score")
async def get_compliance_score(
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    org_id: str = Depends(get_current_org),
    db = Depends(get_db)
) -> Dict:
    """Obtener score de cumplimiento"""
    analyzer = GapAnalyzer(db, org_id)
    result = await analyzer._calculate_overall_score()
    return result

@router.get("/domains")
async def get_domain_scores(
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    org_id: str = Depends(get_current_org),
    db = Depends(get_db)
) -> Dict:
    """Scores de cumplimiento por dominio ISO 27001 para el sidebar"""
    analyzer = GapAnalyzer(db, org_id)
    clauses = await analyzer._analyze_clauses()
    clause_map = {c["clause_id"]: c["current_score"] for c in clauses}

    return {
        "people": round(
            (clause_map.get("7", 75) + clause_map.get("6", 60)) / 2, 1
        ),
        "technology": round(
            (clause_map.get("8", 65) + clause_map.get("9", 50)) / 2, 1
        ),
        "physical": round(
            clause_map.get("9", 50), 1
        ),
        "processes": round(
            (
                clause_map.get("4", 80)
                + clause_map.get("5", 70)
                + clause_map.get("10", 45)
            ) / 3,
            1
        ),
    }

@router.post("/remediation-actions/{gap_id}")
async def create_remediation_action(
    gap_id: str,
    action_data: Dict[str, Any],
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    db = Depends(get_db)
):
    """Crear acción de remediación para una brecha"""
    # Buscar el gap
    result = await db.execute(select(GapAnalysis).where(GapAnalysis.id == gap_id))
    gap = result.scalar_one_or_none()
    
    if not gap:
        raise HTTPException(status_code=404, detail="Gap no encontrado")
    
    # Crear acción
    action = RemediationAction(
        gap_id=gap_id,
        title=action_data.get("title"),
        description=action_data.get("description"),
        priority=action_data.get("priority", "medium"),
        estimated_hours=action_data.get("estimated_hours"),
        assigned_to=action_data.get("assigned_to"),
        due_date=datetime.fromisoformat(action_data["due_date"]) if action_data.get("due_date") else None
    )
    
    db.add(action)
    await db.commit()
    await db.refresh(action)
    
    return {"message": "Acción creada", "action": action}

@router.post("/analyze-document")
@router.post("/analyze-document")
async def analyze_document(
    request: DocumentAnalysisRequest,
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    org_id: str = Depends(get_current_org),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """
    Evalúa un documento del cliente contra los controles ISO 27001:2022 usando LLM.
    Recibe el texto del documento y devuelve qué controles cumple, cuáles no, y el score global.
    """
    if not request.document_text or len(request.document_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="El documento debe tener al menos 50 caracteres de contenido."
        )

    analyzer = GapAnalyzer(db, org_id)
    result = await analyzer.analyze_document_with_llm(
        document_text=request.document_text,
        document_name=request.document_name
    )
    return result


@router.post("/kpi/update")
async def update_kpi(
    kpi_id: str,
    current_value: float,
    current_user: dict = Depends(RequireRole(["admin", "manager", "auditor"])),
    db = Depends(get_db)
):
    """Actualizar valor de un KPI"""
    result = await db.execute(select(KPI).where(KPI.id == kpi_id))
    kpi = result.scalar_one_or_none()
    
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI no encontrado")
    
    kpi.current_value = current_value
    kpi.last_updated = datetime.utcnow()
    
    # Calcular status
    if current_value >= kpi.target_value:
        kpi.status = "on_track"
    elif current_value >= kpi.target_value * 0.7:
        kpi.status = "at_risk"
    else:
        kpi.status = "behind"
    
    await db.commit()
    
    return {"message": "KPI actualizado", "kpi": kpi}