from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel

from app.dependencies.database import get_db
from app.models.risk import Risk, RiskLevel, RiskStatus, RiskCategory
from app.dependencies.auth import get_current_user, get_current_org
from app.services.registro import registrar
from app.dependencies.tenant import scope_to_org, get_scoped_or_404

# Corregido a AIService
from app.services.ai_service import AIService, limpiar_controles_sugeridos

router = APIRouter(prefix="/api/risks", tags=["Risks"])
ai_processor = AIService()

_ANEXO_A = None

# Estados del ciclo de tratamiento (ISO 27001, 6.1.3 y 8.3):
# open = Abierto, in_review = En tratamiento, accepted = Aceptado (riesgo
# residual aceptado por una persona), closed = Cerrado (desapareció la actividad).
DIAS_REVISION = 365  # un riesgo aceptado se reevalúa al año (ISO 27001, 8.2)


def controles_anexo_a() -> dict:
    """Código -> nombre de los 93 controles del Anexo A (catálogo ISO 27001)."""
    global _ANEXO_A
    if _ANEXO_A is None:
        import json
        from pathlib import Path
        ruta = Path(__file__).resolve().parent.parent / "data" / "catalogo_iso27001.json"
        datos = json.loads(ruta.read_text(encoding="utf-8"))
        _ANEXO_A = {d["codigo"]: d["nombre"] for d in datos if str(d.get("codigo", "")).startswith("A.")}
    return _ANEXO_A


def nivel_por_puntaje(score: int) -> RiskLevel:
    return RiskLevel.CRITICAL if score >= 15 else (RiskLevel.HIGH if score >= 8 else (RiskLevel.MEDIUM if score >= 4 else RiskLevel.LOW))


def residual(likelihood: int, impact: int, controles: list):
    """Probabilidad e impacto después de aplicar los controles del plan."""
    prob, imp = likelihood, impact
    for c in controles or []:
        if c.get("reduce") == "impacto":
            imp -= int(c.get("puntos") or 0)
        else:
            prob -= int(c.get("puntos") or 0)
    return max(1, prob), max(1, imp)


class RiskCreate(BaseModel):
    title: str
    description: str
    category: RiskCategory = RiskCategory.SECURITY
    likelihood: int = 1
    impact: int = 1
    owner: Optional[str] = None   # correo del responsable; por defecto, quien lo registra
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
    controls: Optional[list] = None          # plan de tratamiento: controles elegidos
    mitigation_plan: Optional[str] = None
    revision_fecha: Optional[datetime] = None


class RiskResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    likelihood: int
    impact: int
    risk_level: str
    status: str
    owner: Optional[str] = None
    owner_nombre: Optional[str] = None
    due_date: Optional[datetime] = None
    controls: Optional[list] = None
    mitigation_plan: Optional[str] = None
    residual_likelihood: Optional[int] = None
    residual_impact: Optional[int] = None
    aceptado_por: Optional[str] = None
    aceptado_en: Optional[datetime] = None
    revision_fecha: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    tratamiento_vencido: bool = False
    revision_pendiente: bool = False
    incidentes: list = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


def _valor(x):
    return x.value if hasattr(x, "value") else x


async def _responder(db: AsyncSession, riesgos: list, org_id: str) -> list:
    """Agrega a cada riesgo el nombre del responsable, sus alertas y los
    incidentes asociados (los que se materializaron)."""
    from app.models.user import User
    from app.models.data_breach import DataBreach
    correos = {r.owner for r in riesgos if r.owner}
    nombres = {}
    if correos:
        nombres = {e: n for e, n in (await db.execute(
            select(User.email, User.full_name).where(User.email.in_(correos), User.organization_id == org_id)
        )).all()}
    ids = [r.id for r in riesgos]
    incidentes = {}
    if ids:
        filas = (await db.execute(select(DataBreach).where(
            DataBreach.organization_id == org_id, DataBreach.riesgo_id.in_(ids)
        ))).scalars().all()
        for b in filas:
            incidentes.setdefault(b.riesgo_id, []).append({
                "id": b.id, "descripcion": (b.descripcion or "")[:140], "estado": _valor(b.estado),
                "fecha_deteccion": b.fecha_deteccion.isoformat() if b.fecha_deteccion else None,
            })
    ahora = datetime.utcnow()
    salida = []
    for r in riesgos:
        estado = _valor(r.status)
        d = RiskResponse.model_validate(r).model_dump()
        d.update({
            "category": _valor(r.category) or "security",
            "risk_level": _valor(r.risk_level),
            "status": estado,
            "owner_nombre": nombres.get(r.owner),
            "tratamiento_vencido": bool(r.due_date and r.due_date < ahora and estado in ("open", "in_review")),
            "revision_pendiente": bool(r.revision_fecha and r.revision_fecha < ahora and estado == "accepted"),
            "incidentes": incidentes.get(r.id, []),
        })
        salida.append(d)
    return salida


async def _validar_responsable(db: AsyncSession, correo: str, org_id: str):
    from app.models.user import User
    u = (await db.execute(select(User).where(
        User.email == correo, User.organization_id == org_id, User.is_active.is_(True)
    ))).scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=400, detail="El responsable debe ser un usuario activo de la empresa.")
    return u


async def _avisar_responsable(usuario, riesgo: Risk):
    """Correo al nuevo responsable del riesgo (si falla, no se interrumpe nada)."""
    try:
        from html import escape
        from app.services.email_service import send_email_async
        plazo = riesgo.due_date.strftime("%d/%m/%Y") if riesgo.due_date else "sin fecha definida"
        html = (f"<p>Hola {escape(usuario.full_name or '')},</p>"
                f"<p>Se te asignó como responsable del riesgo <strong>{escape(riesgo.title)}</strong>.</p>"
                f"<p>Plazo para aplicar su tratamiento: <strong>{plazo}</strong>.</p>"
                "<p>Revísalo en NormIA, en el Mapa de Riesgos.</p>")
        await send_email_async(usuario.email, "Se te asignó un riesgo", html)
    except Exception:
        pass


@router.get("/responsables")
async def responsables_posibles(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    """Usuarios activos de la empresa que pueden ser responsables de un riesgo."""
    from app.models.user import User
    filas = (await db.execute(select(User).where(
        User.organization_id == org_id, User.is_active.is_(True)
    ).order_by(User.full_name))).scalars().all()
    return [{"email": u.email, "nombre": u.full_name or u.email} for u in filas]


@router.post("/", response_model=RiskResponse)
async def create_risk(
    risk_data: RiskCreate,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not (1 <= risk_data.likelihood <= 5 and 1 <= risk_data.impact <= 5):
        raise HTTPException(status_code=400, detail="La probabilidad y el impacto van de 1 a 5.")
    owner = (risk_data.owner or current_user.get("sub") or "").strip()
    responsable = None
    if risk_data.owner:
        responsable = await _validar_responsable(db, owner, org_id)

    risk = Risk(
        title=risk_data.title,
        description=risk_data.description,
        category=risk_data.category,
        likelihood=risk_data.likelihood,
        impact=risk_data.impact,
        owner=owner,
        due_date=risk_data.due_date,
        risk_level=nivel_por_puntaje(risk_data.likelihood * risk_data.impact),
        status=RiskStatus.OPEN,
        controls=[],
        created_by=current_user["user_id"],
        organization_id=org_id
    )
    db.add(risk)
    await db.commit()
    await db.refresh(risk)
    await registrar(db, org_id, current_user, "creo", "riesgo", risk.title,
                    f"Probabilidad {risk.likelihood} × impacto {risk.impact} · responsable {risk.owner or 'sin asignar'}")
    if responsable and responsable.email != current_user.get("sub"):
        await _avisar_responsable(responsable, risk)
    return (await _responder(db, [risk], org_id))[0]


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
    return await _responder(db, result.scalars().all(), org_id)


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
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    risk = await get_scoped_or_404(db, Risk, risk_id, org_id)
    risk.status = status
    await db.commit()
    await registrar(db, org_id, current_user, "modifico", "riesgo", risk.title, f"Estado: {_valor(status)}")
    await db.refresh(risk)
    return {"message": "Risk status updated", "risk": risk}


@router.post("/{risk_id}/analyze")
async def analyze_risk_with_ai(
    risk_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    """La IA sugiere controles del Anexo A para ESTE riesgo, cada uno con lo
    que reduce (probabilidad o impacto) para simular el riesgo residual."""
    risk = await get_scoped_or_404(db, Risk, risk_id, org_id)
    categoria = risk.category.value if hasattr(risk.category, "value") else str(risk.category or "security")
    try:
        controles = await ai_processor.sugerir_controles_riesgo({
            "title": risk.title,
            "description": risk.description,
            "category": categoria,
            "likelihood": risk.likelihood,
            "impact": risk.impact,
        }, controles_anexo_a())
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    if not controles:
        raise HTTPException(status_code=502, detail="La IA no propuso controles válidos del Anexo A. Intenta de nuevo.")
    return {"controls": controles}


CAMPOS_RIESGO = {
    "title": "título", "description": "descripción", "category": "categoría", "likelihood": "probabilidad",
    "impact": "impacto", "owner": "responsable", "due_date": "plazo", "controls": "plan de controles",
    "mitigation_plan": "plan de tratamiento", "revision_fecha": "fecha de revisión", "status": "estado",
}


@router.put("/{risk_id}", response_model=RiskResponse)
async def update_risk(
    risk_id: str,
    risk_data: RiskUpdate,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Edita el riesgo y su tratamiento: probabilidad, impacto, estado,
    responsable, plazo, plan de controles y aceptación del riesgo residual."""
    risk = await get_scoped_or_404(db, Risk, risk_id, org_id)
    cambios = risk_data.model_dump(exclude_unset=True)

    for campo in ("likelihood", "impact"):
        if campo in cambios and not 1 <= int(cambios[campo]) <= 5:
            raise HTTPException(status_code=400, detail="La probabilidad y el impacto van de 1 a 5.")

    nuevo_responsable = None
    if "owner" in cambios and cambios["owner"] and cambios["owner"] != risk.owner:
        nuevo_responsable = await _validar_responsable(db, cambios["owner"], org_id)

    if "controls" in cambios:
        # Solo controles reales del Anexo A, con su efecto acotado (1 o 2 puntos).
        cambios["controls"] = limpiar_controles_sugeridos(cambios["controls"] or [], controles_anexo_a())

    estado_nuevo = cambios.get("status")
    for campo in ("title", "description", "category", "likelihood", "impact", "owner", "due_date",
                  "controls", "mitigation_plan", "revision_fecha"):
        if campo in cambios:
            setattr(risk, campo, cambios[campo])

    risk.risk_level = nivel_por_puntaje(risk.likelihood * risk.impact)
    risk.residual_likelihood, risk.residual_impact = residual(risk.likelihood, risk.impact, risk.controls)

    if estado_nuevo is not None and _valor(estado_nuevo) != _valor(risk.status):
        estado = _valor(estado_nuevo)
        if estado == "accepted":
            # Aceptar el riesgo residual queda registrado (ISO 27001, 6.1.3 f).
            risk.aceptado_por = current_user.get("sub")
            risk.aceptado_en = datetime.utcnow()
            if "revision_fecha" not in cambios:
                risk.revision_fecha = datetime.utcnow() + timedelta(days=DIAS_REVISION)
        if estado == "closed":
            risk.closed_at = datetime.utcnow()
        if estado in ("open", "in_review"):
            risk.closed_at = None
        risk.status = estado_nuevo

    await db.commit()
    await db.refresh(risk)
    if cambios:
        detalle = "Aceptó el riesgo residual" if _valor(risk.status) == "accepted" and "status" in cambios \
            else "Cambió: " + ", ".join(CAMPOS_RIESGO.get(c, c) for c in cambios)
        await registrar(db, org_id, current_user, "aprobo" if detalle.startswith("Aceptó") else "modifico",
                        "riesgo", risk.title, detalle)
    if nuevo_responsable and nuevo_responsable.email != current_user.get("sub"):
        await _avisar_responsable(nuevo_responsable, risk)
    return (await _responder(db, [risk], org_id))[0]


@router.delete("/{risk_id}")
async def delete_risk(
    risk_id: str,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    risk = await get_scoped_or_404(db, Risk, risk_id, org_id)
    titulo = risk.title
    await db.delete(risk)
    await db.commit()
    await registrar(db, org_id, current_user, "elimino", "riesgo", titulo)
    return {"message": "Risk deleted successfully"}
