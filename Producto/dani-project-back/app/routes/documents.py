from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from datetime import datetime

from app.dependencies.auth import get_current_user, get_current_org
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
    
    documents = []
    for d in docs:
        documents.append({
            "id": d.id,
            "chapter_id": d.chapter_id,
            "name": d.title,
            "status": d.status.value if hasattr(d.status, 'value') else d.status,
            "version": d.version.replace('v', '') if d.version else '1.0',
            "updated": d.updated_at.strftime('%b %d') if d.updated_at else 'N/A',
        })
        
    return {"documents": documents, "total": len(documents)}

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
    db: AsyncSession = Depends(get_db)
):
    try:
        stmt = scope_to_org(select(Document), Document, org_id).filter(Document.chapter_id == data.chapter_id)
        result = await db.execute(stmt)
        document = result.scalar_one_or_none()
        
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
    ack_doc_ids = set()
    if user_id:
        ack_result = await db.execute(select(DocumentAcknowledgement).filter(DocumentAcknowledgement.user_id == user_id))
        ack_doc_ids = {ack.document_id for ack in ack_result.scalars().all()}

    policies = [{"id": d.id, "chapter_id": d.chapter_id, "title": d.title, "content": d.content, "is_acknowledged": d.id in ack_doc_ids} for d in documents]
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

    existing = await db.execute(
        select(DocumentAcknowledgement).filter(
            DocumentAcknowledgement.user_id == user_id,
            DocumentAcknowledgement.document_id == document_id,
        )
    )
    ack = existing.scalar_one_or_none()
    if not ack:
        ack = DocumentAcknowledgement(user_id=user_id, document_id=document_id)
        db.add(ack)
        await db.commit()
        await db.refresh(ack)

    return {"document_id": document_id, "acknowledged": True, "acknowledged_at": ack.acknowledged_at}

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
    return {"id": document.id, "chapter_id": document.chapter_id, "content": document.content, "status": document.status.value}



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
        
    if new_status in [DocumentStatus.APPROVED, DocumentStatus.PUBLISHED]:
        if current_user.get("role", "") not in ["superadmin", "owner", "admin", "auditor", "manager"]:
            raise HTTPException(status_code=403, detail="Sin permisos")
            
    document.status = new_status
    if new_status == DocumentStatus.PUBLISHED:
        parts = document.version.strip("v").split(".")
        if len(parts) == 2:
            document.version = f"v{int(parts[0])+1}.0"
            
    await db.commit()
    return {"message": f"Status updated", "version": document.version}