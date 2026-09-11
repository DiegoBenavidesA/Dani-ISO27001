# app/routes/compliance.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, Optional, List
from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import select
from app.dependencies.database import AsyncSessionLocal, get_db
from app.models.iso_controls import ISOCControl

from sqlalchemy.ext.asyncio import AsyncSession  # <--- Agrega esta línea

from app.services.iso_compliance_analyzer import ISOComplianceAnalyzer
from app.dependencies.auth import get_current_user

# Definimos el prefijo limpio alineado con api.js de React
router = APIRouter(prefix="/api/compliance", tags=["ISO 27001 Compliance"])
analyzer = ISOComplianceAnalyzer()

# ===================================================================
# 🛠️ ESQUEMA FLEXIBLE: Soporta tanto 'applicable' como 'applies'
# ===================================================================
class SingleControlSchema(BaseModel):
    id: str
    applicable: Optional[bool] = True  # Soporte para el mock de React
    status: str
    justification: Optional[str] = None

class FullAssessmentRequest(BaseModel):
    controls: List[SingleControlSchema]

@router.get("/controls")
async def get_all_controls(
    category: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)  # ✅ esta es la sesión
):
    """Retorna los controles."""
    if category:
        controls = analyzer.get_controls_by_category(category)
        return {"category": category, "total": len(controls), "controls": controls}
    
    # ✅ Usar la sesión inyectada, no crear una nueva
    stmt = select(ISOCControl)
    result = await db.execute(stmt)
    db_controls = result.scalars().all()
    
    if db_controls:
        def _map_status(s: str) -> str:
            s = (s or "").lower()
            if "implementado" in s and "no" not in s:
                return "implemented"
            if "planificado" in s or "planned" in s:
                return "planned"
            return "notImplemented"

        return {
            "controls": [
                {
                    "id": c.control_id,
                    "name": c.title,
                    "description": c.description,
                    "category": c.category,
                    "applicable": c.applies,
                    "status": _map_status(c.status),
                    "justification": c.justification
                } for c in db_controls
            ]
        }
    
    return analyzer.get_all_controls()

@router.get("/statistics")
async def get_statistics(current_user: dict = Depends(get_current_user)):
    data = analyzer.get_all_controls()
    return {
        "standard": data.get("standard"),
        "version": data.get("version"),
        "total_controls": data.get("total_controls", 0),
        "distribution": data.get("controls_by_category", {})
    }

@router.post("/full-assessment")
async def full_assessment(
    payload: FullAssessmentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Procesa y guarda de forma persistente la matriz en Neon.tech"""
    async with AsyncSessionLocal() as session:
        try:
            updated_count = 0
            for ctrl_data in payload.controls:
                # Buscamos por el código identificador (ej: "A.5.1")
                stmt = select(ISOCControl).where(ISOCControl.control_id == ctrl_data.id)
                result = await session.execute(stmt)
                db_control = result.scalar_one_or_none()
                
                if db_control:
                    db_control.applies = ctrl_data.applicable
                    
                    # Normalizamos los estados de la interfaz hacia el estándar de base de datos
                    status_clean = ctrl_data.status.lower()
                    if status_clean in ("implemented", "implementado"):
                        db_control.status = "Implementado"
                    elif status_clean in ("planned", "planificado"):
                        db_control.status = "Planificado"
                    else:
                        db_control.status = "No Implementado"
                        
                    if ctrl_data.justification:
                        db_control.justification = ctrl_data.justification
                    updated_count += 1
            
            await session.commit()
            return {
                "status": "success",
                "message": f"Se actualizaron exitosamente {updated_count} controles.",
                "assessment_date": datetime.utcnow().isoformat()
            }
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=500, detail=f"Error transaccional: {str(e)}")

from pydantic import BaseModel
class EvaluateRequest(BaseModel):
    document_id: str

@router.post("/{control_id}/evaluate")
async def evaluate_control(
    control_id: str,
    payload: EvaluateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Evalúa un control contra un documento específico usando IA"""
    from app.models.document import Document
    
    async with AsyncSessionLocal() as session:
        # Obtener el control por código ISO (ej: "5.1"), no por UUID
        stmt = select(ISOCControl).where(ISOCControl.control_id == control_id)
        result = await session.execute(stmt)
        db_control = result.scalar_one_or_none()
        
        if not db_control:
            raise HTTPException(status_code=404, detail="Control no encontrado")
            
        # Obtener el documento (asumiremos document_id es chapter_id o uuid)
        doc_stmt = select(Document).where(Document.id == payload.document_id)
        doc_result = await session.execute(doc_stmt)
        db_document = doc_result.scalar_one_or_none()
        
        if not db_document:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
            
        if not db_document.content:
            raise HTTPException(status_code=400, detail="El documento está vacío")
            
        # Llamar a la IA
        evaluation = await analyzer.ai_service.evaluate_compliance(
            document_text=db_document.content,
            control_title=db_control.title,
            control_desc=db_control.description
        )
        
        # Actualizar la base de datos con el veredicto
        db_control.score = evaluation.get("score", 0)
        db_control.document_id = payload.document_id
        db_control.justification = evaluation.get("justification", "")
        
        # Traducir status de la IA al formato de BD que definió Elías
        ai_status = evaluation.get("status", "notImplemented").lower()
        if ai_status in ("implemented", "implementado"):
            db_control.status = "Implementado"
        elif ai_status in ("planned", "planificado"):
            db_control.status = "Planificado"
        else:
            db_control.status = "No Implementado"
            
        await session.commit()
        await session.refresh(db_control)
        
        return {
            "message": "Evaluación IA completada",
            "score": db_control.score,
            "status": ai_status,
            "justification": db_control.justification
        }

@router.post("/bulk-audit")
async def bulk_audit(
    current_user: dict = Depends(get_current_user)
):
    """Audita todos los controles aplicables usando evidencias indexadas + documentos aprobados."""
    import asyncio
    from app.models.evidence_chunk import EvidenceChunk
    from app.models.document import Document, DocumentStatus
    from app.services.embedding_service import EmbeddingService

    embedder = EmbeddingService()
    results = []

    async with AsyncSessionLocal() as session:
        # Cargar todos los controles aplicables (sin límite)
        ctrl_stmt = select(ISOCControl).where(ISOCControl.applies == True)
        ctrl_result = await session.execute(ctrl_stmt)
        controls = ctrl_result.scalars().all()

        # Cargar documentos aprobados como contexto base
        doc_stmt = select(Document).where(Document.status == DocumentStatus.APPROVED)
        doc_result = await session.execute(doc_stmt)
        approved_docs = doc_result.scalars().all()
        doc_context_base = "\n\n".join(
            f"[{d.title}]: {(d.content or '')[:600]}"
            for d in approved_docs if d.content
        )

        # Verificar si hay chunks de evidencia disponibles
        chunk_count_result = await session.execute(select(EvidenceChunk))
        has_chunks = bool(chunk_count_result.scalars().first())

        for control in controls:
            context_parts = []
            try:
                # 1. Buscar chunks de evidencia relevantes (RAG)
                if has_chunks:
                    query_vector = embedder.generate_single_embedding(
                        f"{control.title}. {control.description}"
                    )
                    chunk_stmt = (
                        select(EvidenceChunk)
                        .order_by(EvidenceChunk.embedding.cosine_distance(query_vector))
                        .limit(4)
                    )
                    chunk_res = await session.execute(chunk_stmt)
                    top_chunks = chunk_res.scalars().all()
                    if top_chunks:
                        context_parts.append("EVIDENCIAS:\n" + "\n".join(f"- {c.content}" for c in top_chunks))

                # 2. Agregar documentos aprobados como contexto adicional
                if doc_context_base:
                    context_parts.append("DOCUMENTOS APROBADOS:\n" + doc_context_base[:1200])

                context = "\n\n".join(context_parts)

                evaluation = await asyncio.wait_for(
                    analyzer.ai_service.mass_evaluate_control(
                        control_title=control.title,
                        control_desc=control.description,
                        context_chunks=context
                    ),
                    timeout=15.0
                )
            except (asyncio.TimeoutError, Exception):
                evaluation = {
                    "score": 0,
                    "status": "notImplemented",
                    "justification": "Tiempo de evaluación agotado. Reintenta o evalúa este control individualmente."
                }

            control.score = evaluation.get("score", 0)
            control.justification = evaluation.get("justification", "")
            ai_status = evaluation.get("status", "notImplemented").lower()
            if ai_status in ("implemented", "implementado"):
                control.status = "Implementado"
            elif ai_status in ("planned", "planificado"):
                control.status = "Planificado"
            else:
                control.status = "No Implementado"

            results.append({
                "id": control.control_id,
                "status": control.status,
                "score": control.score,
                "justification": control.justification
            })

        await session.commit()

    return {
        "message": f"Auditoría Masiva completada. {len(results)} controles evaluados.",
        "results": results
    }

@router.get("/integrity")
async def get_compliance_integrity(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Detecta señales de compliance washing cruzando controles con evidencias."""
    from app.models.evidence import Evidence
    from sqlalchemy import func

    # Controles marcados como Implementado
    ctrl_result = await db.execute(
        select(ISOCControl).where(ISOCControl.status == "Implementado", ISOCControl.applies == True)
    )
    implemented = ctrl_result.scalars().all()

    # Todas las evidencias con su metadata
    ev_result = await db.execute(select(Evidence))
    evidences = ev_result.scalars().all()

    # Construir set de controles con evidencia
    controls_with_evidence = set()
    for ev in evidences:
        ctrl = (ev.evidence_metadata or {}).get("control", "")
        if ctrl:
            controls_with_evidence.add(ctrl.strip().upper())

    alerts = []
    controls_no_evidence = []

    for ctrl in implemented:
        cid = (ctrl.control_id or "").strip().upper()
        if cid not in controls_with_evidence:
            controls_no_evidence.append({
                "control_id": ctrl.control_id,
                "title": ctrl.title,
                "category": ctrl.category,
            })

    if controls_no_evidence:
        alerts.append({
            "id": "no-evidence",
            "severity": "high" if len(controls_no_evidence) > 5 else "medium",
            "title": f"{len(controls_no_evidence)} controles implementados sin evidencia",
            "description": f"Estos controles están marcados como 'Implementado' pero no tienen ninguna evidencia asociada en el Centro de Evidencias.",
            "controls": controls_no_evidence,
            "recommendation": "Sube evidencias para cada control o ajusta su estado a 'Planificado'."
        })

    # Score de integridad
    total_implemented = len(implemented)
    with_evidence = total_implemented - len(controls_no_evidence)
    integrity_score = round((with_evidence / total_implemented * 100) if total_implemented > 0 else 100)

    return {
        "integrity_score": integrity_score,
        "total_implemented": total_implemented,
        "with_evidence": with_evidence,
        "without_evidence": len(controls_no_evidence),
        "alerts": alerts
    }


@router.get("/pre-audit")
async def get_pre_audit_assessment(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Calcula el readiness para auditoría y predice los hallazgos más probables."""
    from app.models.evidence import Evidence
    from app.models.capa import CAPA, CAPAStatus, CAPAPriority
    from app.models.document import Document, DocumentStatus
    from datetime import datetime, timedelta

    # --- Datos base ---
    ctrl_result = await db.execute(select(ISOCControl).where(ISOCControl.applies == True))
    all_controls = ctrl_result.scalars().all()
    total = len(all_controls) or 1

    implemented = [c for c in all_controls if c.status == "Implementado"]
    planned     = [c for c in all_controls if c.status == "Planificado"]
    not_impl    = [c for c in all_controls if c.status not in ("Implementado", "Planificado")]

    ev_result = await db.execute(select(Evidence))
    evidences = ev_result.scalars().all()
    controls_with_evidence = set()
    for ev in evidences:
        ctrl = (ev.evidence_metadata or {}).get("control", "")
        if ctrl:
            controls_with_evidence.add(ctrl.strip().upper())

    capa_result = await db.execute(select(CAPA))
    capas = capa_result.scalars().all()
    open_capas   = [c for c in capas if c.status == CAPAStatus.OPEN]
    overdue_capas = [
        c for c in open_capas
        if c.due_date and c.due_date < datetime.utcnow()
    ]

    doc_result = await db.execute(select(Document))
    documents = doc_result.scalars().all()
    approved_docs = [d for d in documents if d.status == DocumentStatus.APPROVED]
    draft_docs    = [d for d in documents if d.status == DocumentStatus.DRAFT]

    # --- Cálculo de readiness (ponderado) ---
    impl_pct     = len(implemented) / total * 100
    evidence_pct = len(controls_with_evidence) / total * 100
    capa_penalty = min(len(overdue_capas) * 5, 25)
    doc_pct      = (len(approved_docs) / (len(documents) or 1)) * 100

    readiness = round(
        (impl_pct * 0.40) +
        (evidence_pct * 0.35) +
        (doc_pct * 0.25) -
        capa_penalty
    )
    readiness = max(0, min(100, readiness))

    # --- Hallazgos predichos ---
    findings = []

    # Controles implementados sin evidencia
    impl_ids = {c.control_id.strip().upper() for c in implemented if c.control_id}
    without_evidence = impl_ids - controls_with_evidence
    if without_evidence:
        findings.append({
            "severity": "high" if len(without_evidence) > 5 else "medium",
            "title": f"{len(without_evidence)} controles sin evidencia de efectividad",
            "detail": "Controles marcados como Implementado pero sin evidencia en el Centro de Evidencias.",
            "controls": sorted(without_evidence)[:5],
        })

    # CAPAs vencidas
    if overdue_capas:
        findings.append({
            "severity": "high",
            "title": f"{len(overdue_capas)} CAPA(s) vencidas sin resolver",
            "detail": f"Acciones correctivas abiertas y fuera de plazo. Un auditor las marcará como no conformidad.",
            "controls": [c.control or "N/A" for c in overdue_capas[:5]],
        })

    # Controles no implementados
    if not_impl:
        findings.append({
            "severity": "high" if len(not_impl) > 10 else "medium",
            "title": f"{len(not_impl)} controles sin implementar",
            "detail": "Controles aplicables que aún no han sido implementados ni planificados.",
            "controls": [c.control_id for c in not_impl[:5]],
        })

    # Documentos en borrador
    if draft_docs:
        findings.append({
            "severity": "medium",
            "title": f"{len(draft_docs)} documento(s) en estado borrador",
            "detail": "Políticas y procedimientos no aprobados que un auditor no considerará válidos.",
            "controls": [d.title[:40] for d in draft_docs[:4]],
        })

    # Controles planificados (no ejecutados)
    if planned:
        findings.append({
            "severity": "low",
            "title": f"{len(planned)} controles en estado Planificado",
            "detail": "Controles con plan definido pero aún no ejecutados. Riesgo bajo si tienen fecha comprometida.",
            "controls": [c.control_id for c in planned[:5]],
        })

    findings.sort(key=lambda f: {"high": 0, "medium": 1, "low": 2}[f["severity"]])

    return {
        "readiness": readiness,
        "target": 85,
        "impl_pct": round(impl_pct),
        "evidence_pct": round(evidence_pct),
        "doc_pct": round(doc_pct),
        "open_capas": len(open_capas),
        "overdue_capas": len(overdue_capas),
        "total_controls": total,
        "implemented": len(implemented),
        "findings": findings,
    }


@router.get("/priority-actions")
async def get_priority_actions(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Genera lista priorizada de acciones basada en datos reales del SGSI."""
    from app.models.evidence import Evidence
    from app.models.capa import CAPA, CAPAStatus, CAPAPriority
    from app.models.document import Document, DocumentStatus
    from datetime import datetime

    ctrl_result = await db.execute(select(ISOCControl).where(ISOCControl.applies == True))
    all_controls = ctrl_result.scalars().all()

    ev_result = await db.execute(select(Evidence))
    evidences = ev_result.scalars().all()
    controls_with_evidence = set()
    for ev in evidences:
        ctrl = (ev.evidence_metadata or {}).get("control", "")
        if ctrl:
            controls_with_evidence.add(ctrl.strip().upper())

    capa_result = await db.execute(select(CAPA))
    capas = capa_result.scalars().all()
    open_capas = [c for c in capas if c.status == CAPAStatus.OPEN]
    overdue_capas = [c for c in open_capas if c.due_date and c.due_date < datetime.utcnow()]
    high_capas = [c for c in open_capas if c.priority == CAPAPriority.HIGH]

    doc_result = await db.execute(select(Document))
    documents = doc_result.scalars().all()
    draft_docs = [d for d in documents if d.status == DocumentStatus.DRAFT]

    implemented = [c for c in all_controls if c.status == "Implementado"]
    impl_ids = {c.control_id.strip().upper() for c in implemented if c.control_id}
    without_evidence = impl_ids - controls_with_evidence
    not_impl = [c for c in all_controls if c.status == "No Implementado"]

    actions = []

    if overdue_capas:
        days_overdue = max(
            (datetime.utcnow() - c.due_date).days for c in overdue_capas if c.due_date
        )
        actions.append({
            "id": "overdue-capas",
            "priority": "high",
            "title": f"Resolver {len(overdue_capas)} CAPA{'s' if len(overdue_capas) > 1 else ''} vencida{'s' if len(overdue_capas) > 1 else ''}",
            "detail": f"Llevan hasta {days_overdue} días sin resolverse. Un auditor las marcará como no conformidad mayor.",
            "navigate": "findings",
            "action_label": "Ver CAPAs",
            "decision_level": "human",
        })

    if without_evidence:
        actions.append({
            "id": "no-evidence",
            "priority": "high" if len(without_evidence) > 5 else "medium",
            "title": f"Subir evidencia para {len(without_evidence)} controles implementados",
            "detail": f"Sin evidencia no hay prueba de efectividad. Afectados: {', '.join(sorted(without_evidence)[:4])}{'...' if len(without_evidence) > 4 else ''}.",
            "navigate": "evidence",
            "action_label": "Centro de Evidencias",
            "decision_level": "human",
        })

    if draft_docs:
        actions.append({
            "id": "draft-docs",
            "priority": "medium",
            "title": f"Aprobar {len(draft_docs)} documento{'s' if len(draft_docs) > 1 else ''} en borrador",
            "detail": f"Políticas sin aprobar no son válidas en auditoría: {', '.join(d.title[:30] for d in draft_docs[:3])}.",
            "navigate": "documents",
            "action_label": "Ir a Documentos",
            "decision_level": "review",
        })

    pending_high = [c for c in high_capas if c not in overdue_capas]
    if pending_high:
        actions.append({
            "id": "high-capas",
            "priority": "medium",
            "title": f"{len(pending_high)} CAPA{'s' if len(pending_high) > 1 else ''} de alta prioridad en progreso",
            "detail": "Acciones correctivas críticas que requieren seguimiento activo.",
            "navigate": "findings",
            "action_label": "Ver CAPAs",
            "decision_level": "review",
        })

    if not_impl:
        actions.append({
            "id": "not-implemented",
            "priority": "medium" if len(not_impl) < 20 else "high",
            "title": f"Implementar {len(not_impl)} controles pendientes",
            "detail": "Controles aplicables sin implementar. Impactan directamente el score de cumplimiento.",
            "navigate": "gap-analysis",
            "action_label": "Ver Gap Analysis",
            "decision_level": "human",
        })

    if not evidences:
        actions.append({
            "id": "no-evidence-at-all",
            "priority": "high",
            "title": "No hay evidencias registradas en el sistema",
            "detail": "El Centro de Evidencias está vacío. Comienza subiendo documentos que respalden tus controles.",
            "navigate": "evidence",
            "action_label": "Subir primera evidencia",
            "decision_level": "human",
        })

    order = {"high": 0, "medium": 1, "low": 2}
    actions.sort(key=lambda a: order.get(a["priority"], 2))

    return {"actions": actions[:6], "total": len(actions)}


@router.get("/soa/export")
async def export_soa_pdf(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Genera y descarga la Declaración de Aplicabilidad (SOA) como PDF"""
    import io
    import fitz
    from fastapi.responses import StreamingResponse

    result = await db.execute(select(ISOCControl).order_by(ISOCControl.control_id))
    controls = result.scalars().all()

    C_GREEN  = (0.063, 0.725, 0.506)
    C_DARK   = (0.086, 0.118, 0.157)
    C_GRAY   = (0.42, 0.45, 0.50)
    C_WHITE  = (1, 1, 1)
    C_LINE   = (0.88, 0.90, 0.92)
    C_AMBER  = (0.96, 0.62, 0.04)
    C_RED    = (0.93, 0.27, 0.27)
    C_PURPLE = (0.55, 0.36, 0.96)
    W, H = 842, 595  # A4 landscape

    doc = fitz.open()

    def new_page():
        p = doc.new_page(width=W, height=H)
        p.draw_rect(fitz.Rect(0, 0, W, 56), color=None, fill=C_DARK)
        p.insert_text((24, 22), "DANI ISO 27001", fontsize=12, color=C_WHITE, fontname="helv")
        p.insert_text((24, 40), "Declaracion de Aplicabilidad (SOA) - ISO/IEC 27001:2022 Anexo A", fontsize=8, color=(0.6, 0.7, 0.6), fontname="helv")
        fecha = datetime.utcnow().strftime("%d/%m/%Y")
        p.insert_text((W - 80, 36), fecha, fontsize=8, color=C_GRAY, fontname="helv")
        p.draw_rect(fitz.Rect(0, H - 22, W, H), color=None, fill=C_DARK)
        p.insert_text((24, H - 7), "Documento Confidencial - Generado automaticamente por DANI GRC Platform", fontsize=7, color=(0.5, 0.5, 0.5), fontname="helv")
        p.insert_text((W - 60, H - 7), f"Pag. {doc.page_count}", fontsize=7, color=(0.5, 0.5, 0.5), fontname="helv")
        return p

    # --- PORTADA ---
    page = new_page()
    applicable   = [c for c in controls if c.applies]
    implemented  = [c for c in applicable if c.status == "Implementado"]
    planned      = [c for c in applicable if c.status == "Planificado"]
    not_impl     = [c for c in applicable if c.status not in ("Implementado", "Planificado")]
    not_applicable = [c for c in controls if not c.applies]

    page.draw_rect(fitz.Rect(24, 80, W - 24, 82), color=None, fill=C_GREEN)
    page.insert_text((24, 110), "Declaracion de Aplicabilidad", fontsize=22, color=C_DARK, fontname="helv")
    page.insert_text((24, 138), "Statement of Applicability (SOA) | ISO/IEC 27001:2022", fontsize=11, color=C_GRAY, fontname="helv")
    page.draw_rect(fitz.Rect(24, 158), color=None, fill=C_LINE) if False else None

    stats = [
        ("Total controles Anexo A", str(len(controls)), C_DARK),
        ("Aplicables",              str(len(applicable)), C_GREEN),
        ("Implementados",           str(len(implemented)), C_GREEN),
        ("Planificados",            str(len(planned)), C_AMBER),
        ("No implementados",        str(len(not_impl)), C_RED),
        ("No aplicables",           str(len(not_applicable)), C_GRAY),
    ]
    x = 24
    for label, val, color in stats:
        page.draw_rect(fitz.Rect(x, 180, x + 120, 240), color=None, fill=(0.95, 0.97, 0.96))
        page.insert_text((x + 8, 212), val, fontsize=24, color=color, fontname="helv")
        page.insert_text((x + 8, 230), label, fontsize=7, color=C_GRAY, fontname="helv")
        x += 132

    page.insert_text((24, 275), f"Generado: {datetime.utcnow().strftime('%d de %B de %Y')}   |   Clasificacion: CONFIDENCIAL   |   Version: 1.0", fontsize=8, color=C_GRAY, fontname="helv")

    # --- TABLA DE CONTROLES (landscape, 6 columnas) ---
    COL = {"id": 24, "title": 85, "cat": 310, "applies": 420, "status": 490, "just": 560}
    HDR_H = 28
    ROW_H = 22
    TOP   = 68
    BOT   = H - 30

    page = new_page()
    y = TOP

    def draw_header(p, y):
        p.draw_rect(fitz.Rect(24, y, W - 24, y + HDR_H), color=None, fill=C_DARK)
        p.insert_text((COL["id"] + 4,    y + 18), "Control",       fontsize=8, color=C_WHITE, fontname="helv")
        p.insert_text((COL["title"] + 4, y + 18), "Titulo",         fontsize=8, color=C_WHITE, fontname="helv")
        p.insert_text((COL["cat"] + 4,   y + 18), "Categoria",      fontsize=8, color=C_WHITE, fontname="helv")
        p.insert_text((COL["applies"] + 4,y + 18),"Aplica",         fontsize=8, color=C_WHITE, fontname="helv")
        p.insert_text((COL["status"] + 4, y + 18), "Estado",        fontsize=8, color=C_WHITE, fontname="helv")
        p.insert_text((COL["just"] + 4,   y + 18), "Justificacion", fontsize=8, color=C_WHITE, fontname="helv")
        return y + HDR_H

    y = draw_header(page, y)

    for i, ctrl in enumerate(controls):
        if y + ROW_H > BOT:
            page = new_page()
            y = TOP
            y = draw_header(page, y)

        row_bg = (0.97, 0.99, 0.98) if i % 2 == 0 else C_WHITE
        page.draw_rect(fitz.Rect(24, y, W - 24, y + ROW_H), color=None, fill=row_bg)

        # Control ID en morado
        page.insert_text((COL["id"] + 4, y + 14), ctrl.control_id or "", fontsize=7, color=C_PURPLE, fontname="helv")

        # Título (truncar)
        title_txt = (ctrl.title or "")[:42]
        page.insert_text((COL["title"] + 4, y + 14), title_txt, fontsize=7, color=C_DARK, fontname="helv")

        # Categoría
        cat_txt = (ctrl.category or "")[:18]
        page.insert_text((COL["cat"] + 4, y + 14), cat_txt, fontsize=7, color=C_GRAY, fontname="helv")

        # Aplica (badge)
        if ctrl.applies:
            page.draw_rect(fitz.Rect(COL["applies"] + 4, y + 4, COL["applies"] + 54, y + ROW_H - 4), color=None, fill=C_GREEN)
            page.insert_text((COL["applies"] + 8, y + 14), "SI", fontsize=7, color=C_WHITE, fontname="helv")
        else:
            page.draw_rect(fitz.Rect(COL["applies"] + 4, y + 4, COL["applies"] + 54, y + ROW_H - 4), color=None, fill=C_GRAY)
            page.insert_text((COL["applies"] + 8, y + 14), "NO", fontsize=7, color=C_WHITE, fontname="helv")

        # Estado (badge de color)
        if ctrl.applies:
            s = ctrl.status or "No Implementado"
            sc = C_GREEN if s == "Implementado" else (C_AMBER if s == "Planificado" else C_RED)
            st = s[:14]
            page.draw_rect(fitz.Rect(COL["status"] + 4, y + 4, COL["status"] + 80, y + ROW_H - 4), color=None, fill=sc)
            page.insert_text((COL["status"] + 8, y + 14), st, fontsize=6, color=C_WHITE, fontname="helv")

        # Justificación
        just = (ctrl.justification or ("Incluido en alcance SGSI" if ctrl.applies else "Fuera de alcance"))[:28]
        page.insert_text((COL["just"] + 4, y + 14), just, fontsize=6, color=C_GRAY, fontname="helv")

        # Línea separadora
        page.draw_rect(fitz.Rect(24, y + ROW_H, W - 24, y + ROW_H + 0.5), color=None, fill=C_LINE)
        y += ROW_H

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=SOA_ISO27001_DANI.pdf"}
    )
