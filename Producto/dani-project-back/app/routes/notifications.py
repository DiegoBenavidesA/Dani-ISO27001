from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.evidence import Evidence
from app.models.document import Document, DocumentStatus
from app.models.capa import CAPA, CAPAStatus
from app.models.data_breach import DataBreach

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/")
async def get_notifications(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    notifications = []
    now = datetime.utcnow()

    # Solo avisos de la empresa activa (el superadmin la elige con X-Org-Id;
    # en el panel de plataforma no tiene empresa y no recibe avisos).
    role = current_user.get("role")
    org_id = request.headers.get("X-Org-Id") if role == "superadmin" else current_user.get("organization_id")
    if not org_id:
        return {"notifications": [], "unread_count": 0}

    # Vulneraciones abiertas: solo para quienes las gestionan
    if role in ("superadmin", "owner", "admin", "dpo"):
        br_result = await db.execute(select(DataBreach).where(
            DataBreach.organization_id == org_id,
            DataBreach.estado.notin_(["notificada", "cerrada"]),
        ))
        for b in br_result.scalars().all():
            if b.gravedad_confirmada and b.notificacion_requerida is False:
                continue
            resumen = b.descripcion if len(b.descripcion) <= 70 else b.descripcion[:70] + "…"
            horas = int((b.fecha_limite_notificacion - now).total_seconds() // 3600)
            if not b.gravedad_confirmada:
                titulo, tipo, detalle = "Vulneración por revisar", "error", f"{resumen} — confirma la gravedad"
            else:
                titulo, tipo, detalle = "Vulneración sin notificar a la Agencia", "warning", resumen
            if horas < 0:
                tipo = "error"
                detalle += f" · plazo de 72 h vencido hace {abs(horas)} h"
            else:
                detalle += f" · quedan {horas} h para notificar"
            notifications.append({
                "id": f"breach-{b.id}-{'notif' if b.gravedad_confirmada else 'rev'}",
                "type": tipo,
                "title": titulo,
                "message": detalle,
                "time": b.fecha_deteccion.strftime("%d/%m/%Y"),
                "read": False,
                "screen": "breaches",
            })

    # Evidencias expiradas o por vencer
    ev_result = await db.execute(select(Evidence).where(Evidence.organization_id == org_id))
    for ev in ev_result.scalars().all():
        validity = (ev.evidence_metadata or {}).get("validityDays", 30)
        if not ev.verified_at:
            continue
        expiry = ev.verified_at + timedelta(days=validity)
        days_left = (expiry - now).days
        if days_left < 0:
            notifications.append({
                "id": f"ev-exp-{ev.id}",
                "type": "error",
                "title": "Evidencia expirada",
                "message": f"{ev.title} — venció hace {abs(days_left)} día(s)",
                "time": ev.verified_at.strftime("%d/%m/%Y"),
                "read": False
            })
        elif days_left <= 7:
            notifications.append({
                "id": f"ev-warn-{ev.id}",
                "type": "warning",
                "title": "Evidencia por vencer",
                "message": f"{ev.title} — vence en {days_left} día(s)",
                "time": ev.verified_at.strftime("%d/%m/%Y"),
                "read": False
            })

    # Documentos pendientes de aprobación
    doc_result = await db.execute(
        select(Document).where(Document.status == DocumentStatus.DRAFT, Document.organization_id == org_id)
    )
    for doc in doc_result.scalars().all():
        notifications.append({
            "id": f"doc-{doc.id}",
            "type": "info",
            "title": "Documento pendiente de aprobación",
            "message": f"{doc.title} — en borrador",
            "time": doc.updated_at.strftime("%d/%m/%Y") if doc.updated_at else "—",
            "read": False
        })

    # NCs vencidas
    capa_result = await db.execute(
        select(CAPA).where(CAPA.status.in_([CAPAStatus.OPEN, CAPAStatus.IN_PROGRESS]), CAPA.organization_id == org_id)
    )
    for capa in capa_result.scalars().all():
        if capa.due_date and capa.due_date < now:
            days_overdue = (now - capa.due_date).days
            notifications.append({
                "id": f"capa-{capa.id}",
                "type": "error",
                "title": "No conformidad vencida",
                "message": f"{capa.nc_code}: {capa.title} — vencida hace {days_overdue} día(s)",
                "time": capa.due_date.strftime("%d/%m/%Y"),
                "read": False
            })

    # Ordenar: errores primero, luego warnings, luego info
    priority = {"error": 0, "warning": 1, "info": 2}
    notifications.sort(key=lambda n: priority.get(n["type"], 3))

    return {
        "notifications": notifications,
        "unread_count": sum(1 for n in notifications if not n["read"])
    }
