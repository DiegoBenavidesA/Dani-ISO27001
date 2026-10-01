# app/routes/compliance.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from types import SimpleNamespace

from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, get_current_org
from app.models.iso_controls import ISOCControl
from app.models.control_status import ControlStatus
from app.services.iso_compliance_analyzer import ISOComplianceAnalyzer

router = APIRouter(prefix="/api/compliance", tags=["ISO 27001 Compliance"])
analyzer = ISOComplianceAnalyzer()


class SingleControlSchema(BaseModel):
    id: str
    applicable: Optional[bool] = True
    status: str
    justification: Optional[str] = None


class FullAssessmentRequest(BaseModel):
    controls: List[SingleControlSchema]


class EvaluateRequest(BaseModel):
    document_id: str


def _db_status(status: Optional[str]) -> str:
    value = (status or "").strip().lower()
    if value in ("implemented", "implementado"):
        return "Implementado"
    if value in ("planned", "planificado"):
        return "Planificado"
    return "No Implementado"


def _ui_status(status: Optional[str]) -> str:
    value = (status or "").strip().lower()
    if value == "implementado" or value == "implemented":
        return "implemented"
    if value == "planificado" or value == "planned":
        return "planned"
    return "notImplemented"


async def _get_control_status(
    db: AsyncSession,
    control_id: str,
    org_id: str,
) -> Optional[ControlStatus]:
    result = await db.execute(
        select(ControlStatus).where(
            ControlStatus.control_id == control_id,
            ControlStatus.organization_id == org_id,
        )
    )
    return result.scalar_one_or_none()


async def _get_or_create_control_status(
    db: AsyncSession,
    control_id: str,
    org_id: str,
) -> ControlStatus:
    state = await _get_control_status(db, control_id, org_id)
    if state is None:
        state = ControlStatus(
            control_id=control_id,
            organization_id=org_id,
            applies=True,
            status="No Implementado",
            score=0,
        )
        db.add(state)
        await db.flush()
    return state


async def _catalog_with_status(db: AsyncSession, org_id: str):
    """Combina el catálogo ISO global con el estado privado de la organización."""
    result = await db.execute(
        select(ISOCControl, ControlStatus)
        .outerjoin(
            ControlStatus,
            and_(
                ControlStatus.control_id == ISOCControl.control_id,
                ControlStatus.organization_id == org_id,
            ),
        )
        .order_by(ISOCControl.control_id)
    )

    controls = []
    for catalog, state in result.all():
        controls.append(
            SimpleNamespace(
                id=catalog.id,
                control_id=catalog.control_id,
                title=catalog.title,
                description=catalog.description,
                category=catalog.category,
                applies=state.applies if state is not None else True,
                status=state.status if state is not None else "No Implementado",
                justification=state.justification if state is not None else None,
                score=state.score if state is not None else 0,
                document_id=state.document_id if state is not None else None,
            )
        )
    return controls


async def _organization_evidences(db: AsyncSession, org_id: str):
    """Obtiene únicamente las evidencias de la organización actual."""
    from app.models.evidence import Evidence

    result = await db.execute(
        select(Evidence).where(
            Evidence.organization_id == org_id
        )
    )
    return result.scalars().all()


@router.get("/controls")
async def get_all_controls(
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    org_id: str = Depends(get_current_org),
):
    controls = await _catalog_with_status(db, org_id)
    if category:
        controls = [c for c in controls if c.category == category]

    return {
        "controls": [
            {
                "id": c.control_id,
                "name": c.title,
                "description": c.description,
                "category": c.category,
                "applicable": c.applies,
                "status": _ui_status(c.status),
                "justification": c.justification,
            }
            for c in controls
        ],
        **({"category": category, "total": len(controls)} if category else {}),
    }


@router.get("/statistics")
async def get_statistics(current_user: dict = Depends(get_current_user)):
    data = analyzer.get_all_controls()
    return {
        "standard": data.get("standard"),
        "version": data.get("version"),
        "total_controls": data.get("total_controls", 0),
        "distribution": data.get("controls_by_category", {}),
    }


@router.post("/full-assessment")
async def full_assessment(
    payload: FullAssessmentRequest,
    db: AsyncSession = Depends(get_db),
    org_id: str = Depends(get_current_org),
):
    try:
        updated_count = 0
        for ctrl_data in payload.controls:
            catalog_result = await db.execute(
                select(ISOCControl).where(ISOCControl.control_id == ctrl_data.id)
            )
            if catalog_result.scalar_one_or_none() is None:
                continue

            state = await _get_or_create_control_status(db, ctrl_data.id, org_id)
            state.applies = bool(ctrl_data.applicable)
            state.status = _db_status(ctrl_data.status)
            if ctrl_data.justification is not None:
                state.justification = ctrl_data.justification
            updated_count += 1

        await db.commit()
        return {
            "status": "success",
            "message": f"Se actualizaron exitosamente {updated_count} controles.",
            "assessment_date": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error transaccional: {str(e)}")


@router.post("/{control_id}/evaluate")
async def evaluate_control(
    control_id: str,
    payload: EvaluateRequest,
    db: AsyncSession = Depends(get_db),
    org_id: str = Depends(get_current_org),
):
    from app.models.document import Document

    result = await db.execute(
        select(ISOCControl).where(ISOCControl.control_id == control_id)
    )
    db_control = result.scalar_one_or_none()
    if not db_control:
        raise HTTPException(status_code=404, detail="Control no encontrado")

    doc_result = await db.execute(
        select(Document).where(
            Document.id == payload.document_id,
            Document.organization_id == org_id,
        )
    )
    db_document = doc_result.scalar_one_or_none()
    if not db_document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if not db_document.content:
        raise HTTPException(status_code=400, detail="El documento está vacío")

    evaluation = await analyzer.ai_service.evaluate_compliance(
        document_text=db_document.content,
        control_title=db_control.title,
        control_desc=db_control.description,
    )

    state = await _get_or_create_control_status(db, control_id, org_id)
    state.score = evaluation.get("score", 0)
    state.document_id = payload.document_id
    state.justification = evaluation.get("justification", "")
    state.status = _db_status(evaluation.get("status", "notImplemented"))

    await db.commit()
    await db.refresh(state)

    return {
        "message": "Evaluación IA completada",
        "score": state.score,
        "status": _ui_status(state.status),
        "justification": state.justification,
    }


@router.post("/bulk-audit")
async def bulk_audit(
    db: AsyncSession = Depends(get_db),
    org_id: str = Depends(get_current_org),
):
    import asyncio
    from app.models.evidence import Evidence
    from app.models.evidence_chunk import EvidenceChunk
    from app.models.document import Document, DocumentStatus
    from app.services.embedding_service import EmbeddingService

    embedder = EmbeddingService()
    results = []
    controls = [c for c in await _catalog_with_status(db, org_id) if c.applies]

    doc_result = await db.execute(
        select(Document).where(
            Document.organization_id == org_id,
            Document.status == DocumentStatus.APPROVED,
        )
    )
    approved_docs = doc_result.scalars().all()
    doc_context_base = "\n\n".join(
        f"[{d.title}]: {(d.content or '')[:600]}" for d in approved_docs if d.content
    )

    chunk_scope = (
        select(EvidenceChunk)
        .join(Evidence, EvidenceChunk.evidence_id == Evidence.id)
        .where(Evidence.organization_id == org_id)
    )
    chunk_count_result = await db.execute(chunk_scope.limit(1))
    has_chunks = chunk_count_result.scalars().first() is not None

    for control in controls:
        context_parts = []
        try:
            if has_chunks:
                query_vector = embedder.generate_single_embedding(
                    f"{control.title}. {control.description}"
                )
                chunk_stmt = (
                    select(EvidenceChunk)
                    .join(Evidence, EvidenceChunk.evidence_id == Evidence.id)
                    .where(Evidence.organization_id == org_id)
                    .order_by(EvidenceChunk.embedding.cosine_distance(query_vector))
                    .limit(4)
                )
                chunk_res = await db.execute(chunk_stmt)
                top_chunks = chunk_res.scalars().all()
                if top_chunks:
                    context_parts.append(
                        "EVIDENCIAS:\n" + "\n".join(f"- {c.content}" for c in top_chunks)
                    )

            if doc_context_base:
                context_parts.append("DOCUMENTOS APROBADOS:\n" + doc_context_base[:1200])

            evaluation = await asyncio.wait_for(
                analyzer.ai_service.mass_evaluate_control(
                    control_title=control.title,
                    control_desc=control.description,
                    context_chunks="\n\n".join(context_parts),
                ),
                timeout=15.0,
            )
        except Exception:
            evaluation = {
                "score": 0,
                "status": "notImplemented",
                "justification": "Tiempo de evaluación agotado. Reintenta o evalúa este control individualmente.",
            }

        state = await _get_or_create_control_status(db, control.control_id, org_id)
        state.score = evaluation.get("score", 0)
        state.justification = evaluation.get("justification", "")
        state.status = _db_status(evaluation.get("status", "notImplemented"))

        results.append(
            {
                "id": control.control_id,
                "status": state.status,
                "score": state.score,
                "justification": state.justification,
            }
        )

    await db.commit()
    return {
        "message": f"Auditoría Masiva completada. {len(results)} controles evaluados.",
        "results": results,
    }


@router.get("/integrity")
async def get_compliance_integrity(
    db: AsyncSession = Depends(get_db),
    org_id: str = Depends(get_current_org),
):
    controls = await _catalog_with_status(db, org_id)
    implemented = [c for c in controls if c.applies and c.status == "Implementado"]
    evidences = await _organization_evidences(db, org_id)

    controls_with_evidence = {
        (ev.evidence_metadata or {}).get("control", "").strip().upper()
        for ev in evidences
        if (ev.evidence_metadata or {}).get("control")
    }

    controls_no_evidence = []
    for ctrl in implemented:
        cid = (ctrl.control_id or "").strip().upper()
        if cid not in controls_with_evidence:
            controls_no_evidence.append(
                {"control_id": ctrl.control_id, "title": ctrl.title, "category": ctrl.category}
            )

    alerts = []
    if controls_no_evidence:
        alerts.append(
            {
                "id": "no-evidence",
                "severity": "high" if len(controls_no_evidence) > 5 else "medium",
                "title": f"{len(controls_no_evidence)} controles implementados sin evidencia",
                "description": "Estos controles están marcados como 'Implementado' pero no tienen ninguna evidencia asociada en el Centro de Evidencias.",
                "controls": controls_no_evidence,
                "recommendation": "Sube evidencias para cada control o ajusta su estado a 'Planificado'.",
            }
        )

    total_implemented = len(implemented)
    with_evidence = total_implemented - len(controls_no_evidence)
    integrity_score = round(
        (with_evidence / total_implemented * 100) if total_implemented > 0 else 100
    )
    return {
        "integrity_score": integrity_score,
        "total_implemented": total_implemented,
        "with_evidence": with_evidence,
        "without_evidence": len(controls_no_evidence),
        "alerts": alerts,
    }


@router.get("/pre-audit")
async def get_pre_audit_assessment(
    db: AsyncSession = Depends(get_db),
    org_id: str = Depends(get_current_org),
):
    from app.models.capa import CAPA, CAPAStatus
    from app.models.document import Document, DocumentStatus

    all_controls = [c for c in await _catalog_with_status(db, org_id) if c.applies]
    total = len(all_controls) or 1
    implemented = [c for c in all_controls if c.status == "Implementado"]
    planned = [c for c in all_controls if c.status == "Planificado"]
    not_impl = [c for c in all_controls if c.status not in ("Implementado", "Planificado")]

    evidences = await _organization_evidences(db, org_id)
    controls_with_evidence = {
        (ev.evidence_metadata or {}).get("control", "").strip().upper()
        for ev in evidences
        if (ev.evidence_metadata or {}).get("control")
    }

    capa_result = await db.execute(select(CAPA).where(CAPA.organization_id == org_id))
    capas = capa_result.scalars().all()
    open_capas = [c for c in capas if c.status == CAPAStatus.OPEN]
    overdue_capas = [c for c in open_capas if c.due_date and c.due_date < datetime.utcnow()]

    doc_result = await db.execute(select(Document).where(Document.organization_id == org_id))
    documents = doc_result.scalars().all()
    approved_docs = [d for d in documents if d.status == DocumentStatus.APPROVED]
    draft_docs = [d for d in documents if d.status == DocumentStatus.DRAFT]

    impl_pct = len(implemented) / total * 100
    evidence_pct = len(controls_with_evidence) / total * 100
    capa_penalty = min(len(overdue_capas) * 5, 25)
    doc_pct = (len(approved_docs) / (len(documents) or 1)) * 100
    readiness = round((impl_pct * 0.40) + (evidence_pct * 0.35) + (doc_pct * 0.25) - capa_penalty)
    readiness = max(0, min(100, readiness))

    findings = []
    impl_ids = {c.control_id.strip().upper() for c in implemented if c.control_id}
    without_evidence = impl_ids - controls_with_evidence
    if without_evidence:
        findings.append({"severity": "high" if len(without_evidence) > 5 else "medium", "title": f"{len(without_evidence)} controles sin evidencia de efectividad", "detail": "Controles marcados como Implementado pero sin evidencia en el Centro de Evidencias.", "controls": sorted(without_evidence)[:5]})
    if overdue_capas:
        findings.append({"severity": "high", "title": f"{len(overdue_capas)} CAPA(s) vencidas sin resolver", "detail": "Acciones correctivas abiertas y fuera de plazo.", "controls": [c.control or "N/A" for c in overdue_capas[:5]]})
    if not_impl:
        findings.append({"severity": "high" if len(not_impl) > 10 else "medium", "title": f"{len(not_impl)} controles sin implementar", "detail": "Controles aplicables que aún no han sido implementados ni planificados.", "controls": [c.control_id for c in not_impl[:5]]})
    if draft_docs:
        findings.append({"severity": "medium", "title": f"{len(draft_docs)} documento(s) en estado borrador", "detail": "Políticas y procedimientos pendientes de aprobación.", "controls": [d.title[:40] for d in draft_docs[:4]]})
    if planned:
        findings.append({"severity": "low", "title": f"{len(planned)} controles en estado Planificado", "detail": "Controles con plan definido pero aún no ejecutados.", "controls": [c.control_id for c in planned[:5]]})

    findings.sort(key=lambda f: {"high": 0, "medium": 1, "low": 2}[f["severity"]])
    return {"readiness": readiness, "target": 85, "impl_pct": round(impl_pct), "evidence_pct": round(evidence_pct), "doc_pct": round(doc_pct), "open_capas": len(open_capas), "overdue_capas": len(overdue_capas), "total_controls": total, "implemented": len(implemented), "findings": findings}


@router.get("/priority-actions")
async def get_priority_actions(
    db: AsyncSession = Depends(get_db),
    org_id: str = Depends(get_current_org),
):
    from app.models.capa import CAPA, CAPAStatus, CAPAPriority
    from app.models.document import Document, DocumentStatus

    all_controls = [c for c in await _catalog_with_status(db, org_id) if c.applies]
    evidences = await _organization_evidences(db, org_id)
    controls_with_evidence = {
        (ev.evidence_metadata or {}).get("control", "").strip().upper()
        for ev in evidences
        if (ev.evidence_metadata or {}).get("control")
    }

    capa_result = await db.execute(select(CAPA).where(CAPA.organization_id == org_id))
    capas = capa_result.scalars().all()
    open_capas = [c for c in capas if c.status == CAPAStatus.OPEN]
    overdue_capas = [c for c in open_capas if c.due_date and c.due_date < datetime.utcnow()]
    high_capas = [c for c in open_capas if c.priority == CAPAPriority.HIGH]

    doc_result = await db.execute(select(Document).where(Document.organization_id == org_id))
    documents = doc_result.scalars().all()
    draft_docs = [d for d in documents if d.status == DocumentStatus.DRAFT]

    implemented = [c for c in all_controls if c.status == "Implementado"]
    impl_ids = {c.control_id.strip().upper() for c in implemented if c.control_id}
    without_evidence = impl_ids - controls_with_evidence
    not_impl = [c for c in all_controls if c.status == "No Implementado"]
    actions = []

    if overdue_capas:
        days_overdue = max((datetime.utcnow() - c.due_date).days for c in overdue_capas if c.due_date)
        actions.append({"id": "overdue-capas", "priority": "high", "title": f"Resolver {len(overdue_capas)} CAPA{'s' if len(overdue_capas) > 1 else ''} vencida{'s' if len(overdue_capas) > 1 else ''}", "detail": f"Llevan hasta {days_overdue} días sin resolverse.", "navigate": "findings", "action_label": "Ver CAPAs", "decision_level": "human"})
    if without_evidence:
        actions.append({"id": "no-evidence", "priority": "high" if len(without_evidence) > 5 else "medium", "title": f"Subir evidencia para {len(without_evidence)} controles implementados", "detail": f"Sin evidencia no hay prueba de efectividad. Afectados: {', '.join(sorted(without_evidence)[:4])}{'...' if len(without_evidence) > 4 else ''}.", "navigate": "evidence", "action_label": "Centro de Evidencias", "decision_level": "human"})
    if draft_docs:
        actions.append({"id": "draft-docs", "priority": "medium", "title": f"Aprobar {len(draft_docs)} documento{'s' if len(draft_docs) > 1 else ''} en borrador", "detail": f"Documentos pendientes de aprobación: {', '.join(d.title[:30] for d in draft_docs[:3])}.", "navigate": "documents", "action_label": "Ir a Documentos", "decision_level": "review"})
    pending_high = [c for c in high_capas if c not in overdue_capas]
    if pending_high:
        actions.append({"id": "high-capas", "priority": "medium", "title": f"{len(pending_high)} CAPA{'s' if len(pending_high) > 1 else ''} de alta prioridad en progreso", "detail": "Acciones correctivas críticas que requieren seguimiento activo.", "navigate": "findings", "action_label": "Ver CAPAs", "decision_level": "review"})
    if not_impl:
        actions.append({"id": "not-implemented", "priority": "medium" if len(not_impl) < 20 else "high", "title": f"Implementar {len(not_impl)} controles pendientes", "detail": "Controles aplicables sin implementar. Impactan directamente el score de cumplimiento.", "navigate": "gap-analysis", "action_label": "Ver Gap Analysis", "decision_level": "human"})
    if not evidences:
        actions.append({"id": "no-evidence-at-all", "priority": "high", "title": "No hay evidencias registradas en el sistema", "detail": "El Centro de Evidencias está vacío. Comienza subiendo documentos que respalden tus controles.", "navigate": "evidence", "action_label": "Subir primera evidencia", "decision_level": "human"})

    actions.sort(key=lambda a: {"high": 0, "medium": 1, "low": 2}.get(a["priority"], 2))
    return {"actions": actions[:6], "total": len(actions)}


@router.get("/soa/export")
async def export_soa_pdf(
    db: AsyncSession = Depends(get_db),
    org_id: str = Depends(get_current_org)
):
    """Genera y descarga la Declaración de Aplicabilidad (SOA) como PDF"""
    import io
    import fitz
    from fastapi.responses import StreamingResponse

    controls = await _catalog_with_status(db, org_id)

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
