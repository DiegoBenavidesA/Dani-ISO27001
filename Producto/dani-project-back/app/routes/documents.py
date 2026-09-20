# app/routes/documents.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.document import Document, DocumentStatus
from pydantic import BaseModel

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.get("/")
async def get_all_documents(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener todos los documentos"""
    result = await db.execute(select(Document).offset(skip).limit(limit))
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
            "signatures": "0/0"
        })
        
    return {
        "message": "Endpoint de documentos",
        "documents": documents,
        "total": len(documents)
    }

from app.services.ai_service import AIService
from fastapi import Body

ai_service = AIService()

@router.post("/generate/{doc_type}")
async def generate_document(
    doc_type: str,
    prompt_data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Generar un documento usando IA adaptativo (ISO o Ley 21.719)"""
    title = prompt_data.get("title", "")
    chapter_number = prompt_data.get("chapter_number", "")
    target_control = prompt_data.get("target_control", None)
    target_control_title = prompt_data.get("target_control_title", "")
    
    # 1. EVALUAR SI ES UN DOCUMENTO DE LA LEY 21.719
    if "Ley 21.719" in str(chapter_number):
        prompt = f"""Actúa como un Abogado Experto en Privacidad y Oficial de Protección de Datos (DPO) en Chile con profunda experiencia corporativa.
Se te ha asignado redactar un borrador extenso, exhaustivo y listo para producción del documento legal: '{title}' para dar estricto cumplimiento a la Ley N° 21.719 de Protección de Datos Personales.
Tu objetivo es generar un documento que sea TAN COMPLETO que el cliente solo tenga que rellenar los datos de su empresa. No hagas un resumen corto; redacta políticas, plazos legales, procedimientos y responsabilidades reales. Usa marcadores como [NOMBRE_EMPRESA] para los datos personalizables.

Estructura obligatoria (en Markdown):
# {title}

## 1. Propósito y Objetivo
(Redacta de manera formal el objetivo de este documento en el contexto de la protección de la privacidad y los derechos fundamentales de los titulares).

## 2. Alcance y Ámbito de Aplicación
(Detalla exhaustivamente a quiénes aplica esta política y sobre qué bases de datos o tratamientos).

## 3. Definiciones Legales
(Incluye las definiciones críticas de la ley aplicables a este documento, ej: Titular, Tratamiento, Brecha, Consentimiento).

## 4. Desarrollo Normativo y Procedimientos
(Desarrolla en profundidad los procesos. Si es la Política de Tratamiento, incluye las bases de licitud, el catálogo de derechos ARCO+P y plazos. Si es el Protocolo de Brechas, incluye la matriz de escalamiento, el formato de evaluación de riesgo y el plazo de 72 horas para notificar a la Agencia de Protección de Datos).

## 5. Roles y Responsabilidades
(Crea una matriz detallada del DPO, Comité de Crisis, TI y empleados generales).

## 6. Sanciones por Incumplimiento
(Redacta las posibles medidas disciplinarias internas).

IMPORTANTE: Escribe al menos 800 palabras. El tono debe ser altamente legal, directivo y riguroso."""

    # 2. SI NO ES LEY, UTILIZAR EL PROMPT ORIGINAL DE ISO 27001
    else:
        control_context = ""
        if target_control:
            control_context = f"\n\nATENCIÓN ESPECIAL: El usuario necesita explícitamente que este documento cierre la brecha del Control ISO 27001: '{target_control} - {target_control_title}'. Debes hacer un énfasis detallado y exhaustivo en dar cumplimiento total y absoluto a las directrices de este control específico dentro del capítulo, diseñando procedimientos y políticas precisas para solucionarlo."
            
        prompt = f"""Actúa como un Consultor Lead Implementer y Auditor Líder de ISO 27001 con 20 años de experiencia.
Se te ha asignado redactar un borrador extenso, exhaustivo y listo para producción del 'Capítulo {chapter_number}: {title}' para el Manual del Sistema de Gestión de Seguridad de la Información (SGSI).
{control_context}
Tu objetivo es generar un documento que sea TAN COMPLETO que el cliente solo tenga que rellenar los datos de su empresa. No hagas un resumen corto; redacta políticas, directrices, flujos y responsabilidades reales. Usa marcadores como [NOMBRE_EMPRESA] para los datos personalizables.

Estructura obligatoria (en Markdown):
# {chapter_number}. {title}

## Propósito y Objetivos
(Redacta de manera profesional y extensa el por qué este capítulo es crítico para el SGSI y qué se busca proteger o gestionar).

## Alcance y Aplicabilidad
(Detalla exhaustivamente a quiénes aplica esta política, en qué sistemas, y qué excepciones existen. Sé realista).

## Directrices y Políticas Normativas
(Desarrolla en profundidad los requisitos de la norma ISO 27001 para este capítulo. Inventa sub-cláusulas realistas, ejemplos de métricas, reglas de negocio y controles técnicos/administrativos que un auditor esperaría ver).

## Roles y Responsabilidades
(Crea una matriz o listado detallado de qué hace la Alta Dirección, el CISO, RRHH, TI y los empleados generales en el contexto de este capítulo).

## Registros y Evidencias
(Lista exacta de qué artefactos documentales se deben generar para demostrar cumplimiento).

IMPORTANTE: Escribe al menos 800 palabras. El tono debe ser altamente corporativo, directivo y riguroso."""
    
    try:
        content = await ai_service.generate_document(prompt)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error conectando con la IA: {str(e)}")
        
    return {
        "message": f"Documento {doc_type} generado",
        "content": content
    }

class DocumentCreate(BaseModel):
    chapter_id: str
    title: str
    content: str

class DocumentStatusUpdate(BaseModel):
    status: str

@router.get("/published/policies")
async def get_published_policies(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models.document import DocumentAcknowledgement

    result = await db.execute(select(Document).filter(Document.status == DocumentStatus.PUBLISHED))
    documents = result.scalars().all()

    user_id = current_user.get("user_id")
    if not user_id:
        from app.models.user import User
        email = current_user.get("email")
        if email:
            user_query = await db.execute(select(User).where(User.email == email))
            db_user = user_query.scalar_one_or_none()
            if db_user:
                user_id = str(db_user.id)

    ack_doc_ids = set()
    if user_id:
        ack_result = await db.execute(select(DocumentAcknowledgement).filter(DocumentAcknowledgement.user_id == user_id))
        acks = ack_result.scalars().all()
        ack_doc_ids = {ack.document_id for ack in acks}

    policies = []
    for doc in documents:
        policies.append({
            "id": doc.id,
            "chapter_id": doc.chapter_id,
            "title": doc.title,
            "version": doc.version,
            "content": doc.content,
            "is_acknowledged": doc.id in ack_doc_ids
        })

    return {"policies": policies}

@router.get("/{chapter_id}")
async def get_document(
    chapter_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(Document).filter(Document.chapter_id == chapter_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": document.id,
        "chapter_id": document.chapter_id,
        "title": document.title,
        "content": document.content,
        "status": document.status.value,
        "version": document.version,
        "created_at": document.created_at,
        "updated_at": document.updated_at
    }

@router.post("/")
async def save_document(
    data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(Document).filter(Document.chapter_id == data.chapter_id))
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
            version="v1.0"
        )
        db.add(document)
        
    await db.commit()
    await db.refresh(document)
    
    return {"message": "Document saved successfully", "id": document.id, "status": document.status.value}

@router.put("/{chapter_id}/status")
async def update_document_status(
    chapter_id: str,
    data: DocumentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(Document).filter(Document.chapter_id == chapter_id))
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        new_status = DocumentStatus(data.status.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    # RBAC: Solo admin, auditor o manager pueden aprobar o publicar
    if new_status in [DocumentStatus.APPROVED, DocumentStatus.PUBLISHED]:
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "auditor", "manager"]:
            raise HTTPException(
                status_code=403, 
                detail="Solo administradores, auditores o gerentes pueden aprobar o publicar documentos"
            )
            
    document.status = new_status
    
    # Bump version automatically when published
    if new_status == DocumentStatus.PUBLISHED:
        parts = document.version.strip("v").split(".")
        if len(parts) == 2:
            document.version = f"v{int(parts[0])+1}.0"
            
    await db.commit()
    await db.refresh(document)
    
    return {"message": f"Status updated to {document.status.value}", "version": document.version}

@router.post("/{document_id}/acknowledge")
async def acknowledge_policy(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models.document import DocumentAcknowledgement
    from app.models.user import User
    
    user_id = current_user.get("user_id")
    
    # Fallback para tokens antiguos que no traían el user_id
    if not user_id:
        email = current_user.get("email")
        if email:
            user_query = await db.execute(select(User).where(User.email == email))
            db_user = user_query.scalar_one_or_none()
            if db_user:
                user_id = str(db_user.id)
                
    if not user_id:
        raise HTTPException(status_code=401, detail="No se pudo identificar al usuario.")
    
    # Verificamos que el documento exista
    doc_result = await db.execute(select(Document).filter(Document.id == document_id))
    if not doc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Verificamos si ya firmó el acuse
    result = await db.execute(
        select(DocumentAcknowledgement)
        .filter(DocumentAcknowledgement.user_id == user_id)
        .filter(DocumentAcknowledgement.document_id == document_id)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        # Verificar si la evidencia de firma ya existe, si no crearla
        from app.models.evidence import Evidence
        ev_check = await db.execute(
            select(Evidence).filter(Evidence.title.like(f"%{document_id}%").or_(Evidence.description.like(f"%{document_id}%")))
        )
        if not ev_check.scalar_one_or_none():
            try:
                from app.models.evidence import EvidenceType
                doc_r = await db.execute(select(Document).filter(Document.id == document_id))
                doc_o = doc_r.scalar_one_or_none()
                doc_title = doc_o.title if doc_o else document_id
                user_email = current_user.get("email", user_id)
                evidence = Evidence(
                    title=f"Firma de lectura — {doc_title} — {user_email}",
                    description=f"El empleado {user_email} leyó y aceptó la política '{doc_title}'.",
                    evidence_type=EvidenceType.DOCUMENT,
                    file_url="", file_name="", file_size=0, mime_type="text/plain",
                    verified_at=datetime.utcnow(),
                    evidence_metadata={"control": "A.6.3", "type": "automatic", "source": "Portal Empleado", "sourceIcon": "✍️", "validityDays": 365}
                )
                db.add(evidence)
                await db.commit()
                print(f"✅ Evidencia de firma creada retroactivamente para {user_email}")
            except Exception as e:
                print(f"⚠️ Error creando evidencia retroactiva: {e}")
        return {"message": "Already acknowledged"}
        
    ack = DocumentAcknowledgement(
        user_id=user_id,
        document_id=document_id
    )
    db.add(ack)
    await db.commit()

    # Registrar firma como evidencia en el Centro de Evidencias
    try:
        from app.models.evidence import Evidence, EvidenceType
        doc_result2 = await db.execute(select(Document).filter(Document.id == document_id))
        doc_obj = doc_result2.scalar_one_or_none()
        doc_title = doc_obj.title if doc_obj else document_id
        user_email = current_user.get("email", user_id)

        evidence = Evidence(
            title=f"Firma de lectura — {doc_title} — {user_email}",
            description=f"El empleado {user_email} leyó y aceptó la política '{doc_title}' el {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} UTC.",
            evidence_type=EvidenceType.DOCUMENT,
            file_url="",
            file_name="",
            file_size=0,
            mime_type="text/plain",
            verified_at=datetime.utcnow(),
            evidence_metadata={
                "control": "A.6.3",
                "type": "automatic",
                "source": "Portal Empleado",
                "sourceIcon": "✍️",
                "validityDays": 365
            }
        )
        db.add(evidence)
        await db.commit()
    except Exception as e:
        print(f"⚠️ No se pudo registrar evidencia de firma: {e}")

    return {"message": "Acknowledged successfully"}