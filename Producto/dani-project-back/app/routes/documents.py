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

@router.post("/generate/{doc_type}")
async def generate_document(
    doc_type: str,
    prompt_data: dict = Body(...),
    org_id: str = Depends(get_current_org)
):
    title = prompt_data.get("title", "")
    chapter_number = prompt_data.get("chapter_number", "")
    target_control = prompt_data.get("target_control", None)
    target_control_title = prompt_data.get("target_control_title", "")
    
    if "Ley 21.719" in str(chapter_number):
        prompt = f"""Actúa como un Abogado Experto en Privacidad y Oficial de Protección de Datos (DPO) en Chile.
Redacta un borrador extenso del documento legal: '{title}' para dar estricto cumplimiento a la Ley N° 21.719 de Protección de Datos Personales.
# {title}\n## 1. Propósito y Objetivo\n## 2. Alcance\n## 3. Definiciones\n## 4. Desarrollo Normativo\n## 5. Roles\n## 6. Sanciones\nEscribe al menos 800 palabras."""
    else:
        control_context = f"Enfasis en Control: {target_control}" if target_control else ""
        prompt = f"""Actúa como Consultor ISO 27001. Redacta un borrador del 'Capítulo {chapter_number}: {title}'.
{control_context}
# {chapter_number}. {title}\n## Propósito\n## Alcance\n## Políticas\n## Responsabilidades\nEscribe al menos 800 palabras."""
    
    try:
        content = await ai_service.generate_document(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error IA: {str(e)}")
        
    return {"message": f"Documento {doc_type} generado", "content": content}

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

@router.post("/")
async def save_document(
    data: DocumentCreate,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    stmt = scope_to_org(select(Document), Document, org_id).filter(Document.chapter_id == data.chapter_id)
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if document:
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
        if current_user.get("role", "") not in ["admin", "auditor", "manager"]:
            raise HTTPException(status_code=403, detail="Sin permisos")
            
    document.status = new_status
    if new_status == DocumentStatus.PUBLISHED:
        parts = document.version.strip("v").split(".")
        if len(parts) == 2:
            document.version = f"v{int(parts[0])+1}.0"
            
    await db.commit()
    return {"message": f"Status updated", "version": document.version}