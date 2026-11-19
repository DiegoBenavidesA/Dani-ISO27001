from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from datetime import datetime

from app.dependencies.auth import get_current_user, get_current_org
from app.services.registro import registrar
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.dependencies.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.document import Document, DocumentStatus, DocumentAcknowledgement
from app.models.user import User
from pydantic import BaseModel
from app.services.ai_service import AIService
from app.services.document_catalog import DOCUMENTOS, armar_contexto, armar_prompt, fuentes

router = APIRouter(prefix="/api/documents", tags=["Documents"])
ai_service = AIService()

class DocumentCreate(BaseModel):
    chapter_id: str
    title: str
    content: str

class DocumentStatusUpdate(BaseModel):
    status: str

@router.get("/")
async def get_all_documents(
    skip: int = 0,
    limit: int = 100,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(select(Document), Document, org_id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    docs = result.scalars().all()
    firmas = await _firmas_por_documento(db, docs, org_id)

    documents = []
    for d in docs:
        actualizado = d.updated_at or d.created_at
        documents.append({
            "id": d.id,
            "chapter_id": d.chapter_id,
            "name": d.title,
            "status": d.status.value if hasattr(d.status, 'value') else d.status,
            "version": d.version.replace('v', '') if d.version else '1.0',
            "updated": actualizado.strftime('%d-%m-%Y') if actualizado else '',
            "aprobado_por": d.aprobado_por,
            "aprobado_en": d.aprobado_en.strftime('%d-%m-%Y') if d.aprobado_en else None,
            "publicado_en": d.publicado_en.strftime('%d-%m-%Y') if d.publicado_en else None,
            "firmas": firmas.get(d.id),  # {"aceptaron": n, "total": m} solo si está publicado
        })

    return {"documents": documents, "total": len(documents)}


# Quién puede ver quién aceptó cada política: la dirección y el delegado de datos.
ROLES_VEN_FIRMAS = ["superadmin", "owner", "admin", "dpo"]


async def _usuarios_activos(db: AsyncSession, org_id: str):
    return (await db.execute(select(User).where(
        User.organization_id == org_id, User.is_active.is_(True)
    ).order_by(User.full_name))).scalars().all()


async def _firmas_por_documento(db: AsyncSession, docs, org_id: str) -> dict:
    """Cuántos trabajadores activos aceptaron la versión VIGENTE de cada documento publicado."""
    publicados = [d for d in docs if d.status == DocumentStatus.PUBLISHED]
    if not publicados:
        return {}
    usuarios = await _usuarios_activos(db, org_id)
    ids_usuarios = {u.id for u in usuarios}
    acks = (await db.execute(select(DocumentAcknowledgement).where(
        DocumentAcknowledgement.document_id.in_([d.id for d in publicados])
    ))).scalars().all()
    salida = {}
    for d in publicados:
        aceptaron = {a.user_id for a in acks if a.document_id == d.id and a.version == d.version and a.user_id in ids_usuarios}
        salida[d.id] = {"aceptaron": len(aceptaron), "total": len(ids_usuarios)}
    return salida

@router.get("/catalogo")
async def catalogo_documentos(current_user: dict = Depends(get_current_user)):
    """Documentos que se pueden generar, con su marco y cláusula."""
    return [
        {"id": k, "marco": v["marco"], "clausula": v["clausula"], "titulo": v["titulo"]}
        for k, v in DOCUMENTOS.items()
    ]


@router.post("/generate/{doc_type}")
async def generate_document(
    doc_type: str,
    prompt_data: dict = Body(default={}),
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Genera el borrador con la información real de la empresa: respuestas
    del Análisis de Brechas, evidencias subidas y, si corresponde, riesgos."""
    doc_id = doc_type[len("chapter_"):] if doc_type.startswith("chapter_") else doc_type
    if doc_id not in DOCUMENTOS:
        raise HTTPException(status_code=404, detail="Documento no reconocido.")
    ctx = await armar_contexto(db, org_id, doc_id)
    try:
        content = await ai_service.generate_document(armar_prompt(doc_id, ctx))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"La IA no pudo generar el borrador: {str(e)[:200]}")
    if not content or content.startswith("Error: API key"):
        raise HTTPException(status_code=503, detail="La IA no está configurada en el servidor.")
    return {"message": f"Documento {doc_id} generado", "content": content, "fuentes": fuentes(ctx)}


@router.post("/")
async def save_document(
    data: DocumentCreate,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        stmt = scope_to_org(select(Document), Document, org_id).filter(Document.chapter_id == data.chapter_id)
        result = await db.execute(stmt)
        document = result.scalar_one_or_none()

        nuevo = document is None
        cambio_contenido = bool(document) and document.content != data.content
        if document:
            if document.content != data.content and document.status in (DocumentStatus.APPROVED, DocumentStatus.PUBLISHED):
                document.status = DocumentStatus.DRAFT
            document.content = data.content
            document.title = data.title
        else:
            document = Document(
                chapter_id=data.chapter_id,
                title=data.title,
                content=data.content,
                status=DocumentStatus.DRAFT,
                version="v1.0",
                organization_id=org_id
            )
            db.add(document)

        await db.commit()
        await db.refresh(document)
        if nuevo or cambio_contenido:
            await registrar(db, org_id, current_user, "creo" if nuevo else "modifico", "documento", document.title,
                            f"{document.version} · queda en Borrador" if not nuevo else "Primera versión en Borrador")
        return {"message": "Document saved successfully", "id": document.id, "status": document.status.value}

    except Exception as e:
        await db.rollback() # Rollback obligatorio en caso de fallo DB
        raise HTTPException(status_code=500, detail=f"Error transaccional al guardar el documento: {str(e)}")


@router.get("/published/policies")
async def get_published_policies(
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(select(Document), Document, org_id).filter(Document.status == DocumentStatus.PUBLISHED)
    result = await db.execute(stmt)
    documents = result.scalars().all()

    user_id = current_user.get("user_id")
    aceptadas = set()  # (documento, versión) que este usuario aceptó
    if user_id:
        ack_result = await db.execute(select(DocumentAcknowledgement).filter(DocumentAcknowledgement.user_id == user_id))
        aceptadas = {(ack.document_id, ack.version) for ack in ack_result.scalars().all()}

    # Una política se considera aceptada solo si se aceptó su versión vigente.
    policies = [{"id": d.id, "chapter_id": d.chapter_id, "title": d.title, "content": d.content, "version": d.version,
                 "is_acknowledged": (d.id, d.version) in aceptadas} for d in documents]
    return {"policies": policies}

@router.post("/{document_id}/acknowledge")
async def acknowledge_policy(
    document_id: str,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """El empleado declara haber leído y aceptado una política publicada (evidencia ISO 27001 cl. 7.3)."""
    document = await get_scoped_or_404(db, Document, document_id, org_id, detail="Política no encontrada")
    if document.status != DocumentStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Solo se pueden aceptar políticas publicadas")

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado")

    # Se guarda una aceptación por versión: así queda el historial de qué
    # versión conoció cada trabajador y cuándo.
    existing = await db.execute(
        select(DocumentAcknowledgement).filter(
            DocumentAcknowledgement.user_id == user_id,
            DocumentAcknowledgement.document_id == document_id,
            DocumentAcknowledgement.version == document.version,
        )
    )
    ack = existing.scalars().first()
    if not ack:
        ack = DocumentAcknowledgement(user_id=user_id, document_id=document_id, version=document.version)
        db.add(ack)
        await db.commit()
        await db.refresh(ack)
        await registrar(db, org_id, current_user, "acepto", "documento", document.title,
                        f"Aceptó la {document.version} en el Portal de Empleados")

    return {"document_id": document_id, "acknowledged": True, "acknowledged_at": ack.acknowledged_at}

@router.get("/{chapter_id}/firmas")
async def firmas_del_documento(
    chapter_id: str,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Quién aceptó la versión vigente, cuándo, y quién falta (ISO 27001, 7.3).
    Es un dato de la relación laboral: solo lo ven la dirección y el delegado."""
    if current_user.get("role") not in ROLES_VEN_FIRMAS:
        raise HTTPException(status_code=403, detail="Solo la dirección y el delegado de datos ven quién aceptó cada política.")
    document = (await db.execute(
        scope_to_org(select(Document), Document, org_id).filter(Document.chapter_id == chapter_id)
    )).scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    usuarios = await _usuarios_activos(db, org_id)
    acks = (await db.execute(select(DocumentAcknowledgement).where(
        DocumentAcknowledgement.document_id == document.id
    ))).scalars().all()
    por_usuario = {}
    for a in acks:  # la aceptación más reciente de cada usuario
        if a.user_id not in por_usuario or (a.acknowledged_at and a.acknowledged_at > por_usuario[a.user_id].acknowledged_at):
            por_usuario[a.user_id] = a
    personas = []
    for u in usuarios:
        a = por_usuario.get(u.id)
        vigente = bool(a and a.version == document.version)
        personas.append({
            "nombre": u.full_name or u.email, "email": u.email,
            "rol": u.role.value if hasattr(u.role, "value") else u.role,
            "acepto_vigente": vigente,
            "version_aceptada": a.version if a else None,
            "fecha": a.acknowledged_at.strftime('%d-%m-%Y %H:%M') if a and a.acknowledged_at else None,
        })
    personas.sort(key=lambda p: (p["acepto_vigente"], p["nombre"].lower()))
    return {"titulo": document.title, "version": document.version,
            "aceptaron": sum(1 for p in personas if p["acepto_vigente"]), "total": len(personas), "personas": personas}


@router.get("/{chapter_id}")
async def get_document(
    chapter_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(select(Document), Document, org_id).filter(Document.chapter_id == chapter_id)
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"id": document.id, "chapter_id": document.chapter_id, "title": document.title, "content": document.content,
            "status": document.status.value, "version": document.version}



ROLES_APRUEBAN = ["superadmin", "owner", "admin"]

# Ciclo del documento (ISO 27001, 7.5): no se saltan pasos, pero siempre se
# puede volver a Borrador para corregir.
TRANSICIONES = {
    DocumentStatus.DRAFT: {DocumentStatus.REVIEW},
    DocumentStatus.REVIEW: {DocumentStatus.APPROVED, DocumentStatus.DRAFT},
    DocumentStatus.APPROVED: {DocumentStatus.PUBLISHED, DocumentStatus.REVIEW, DocumentStatus.DRAFT},
    DocumentStatus.PUBLISHED: {DocumentStatus.DRAFT},
}
NOMBRE_ESTADO = {DocumentStatus.DRAFT: "Borrador", DocumentStatus.REVIEW: "En revisión",
                 DocumentStatus.APPROVED: "Aprobado", DocumentStatus.PUBLISHED: "Publicado"}


@router.put("/{chapter_id}/status")
async def update_document_status(
    chapter_id: str,
    data: DocumentStatusUpdate,
    org_id: str = Depends(get_current_org),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(select(Document), Document, org_id).filter(Document.chapter_id == chapter_id)
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        new_status = DocumentStatus(data.status.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    # Aprobar y publicar es tarea de la alta dirección (ISO 27001, 5.1 y 5.2).
    # El auditor no aprueba lo que después audita (9.2) y el jefe de área propone,
    # pero no aprueba.
    if new_status in [DocumentStatus.APPROVED, DocumentStatus.PUBLISHED]:
        if current_user.get("role", "") not in ROLES_APRUEBAN:
            raise HTTPException(status_code=403, detail="Solo la dirección (dueño o administrador) puede aprobar o publicar documentos.")

    actual = document.status if isinstance(document.status, DocumentStatus) else DocumentStatus(document.status)
    if new_status != actual and new_status not in TRANSICIONES[actual]:
        raise HTTPException(status_code=400, detail=(
            f"No se puede pasar de {NOMBRE_ESTADO[actual]} a {NOMBRE_ESTADO[new_status]}. "
            "El orden es Borrador, En revisión, Aprobado y Publicado; siempre se puede volver a Borrador."))

    if new_status == DocumentStatus.APPROVED and actual != DocumentStatus.APPROVED:
        document.aprobado_por = current_user.get("sub")
        document.aprobado_en = datetime.utcnow()
    if new_status == DocumentStatus.PUBLISHED and actual != DocumentStatus.PUBLISHED:
        # La primera publicación es la v1.0; cada publicación siguiente sube la versión.
        ya_publicado = document.publicado_en is not None or (document.version or "v1.0") != "v1.0"
        parts = (document.version or "v1.0").strip("v").split(".")
        if ya_publicado and len(parts) == 2:
            document.version = f"v{int(parts[0])+1}.0"
        document.publicado_en = datetime.utcnow()
    document.status = new_status

    await db.commit()
    if new_status != actual:
        accion = {DocumentStatus.APPROVED: "aprobo", DocumentStatus.PUBLISHED: "publico"}.get(new_status, "modifico")
        await registrar(db, org_id, current_user, accion, "documento", getattr(document, "title", ""),
                        f"{NOMBRE_ESTADO[actual]} a {NOMBRE_ESTADO[new_status]} · {document.version}")
    return {"message": f"Status updated", "version": document.version}