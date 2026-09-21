from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
import zipfile
import io
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import uuid
import os

from app.dependencies.auth import get_current_user, get_current_org
from app.dependencies.tenant import scope_to_org, get_scoped_or_404
from app.dependencies.database import get_db, AsyncSessionLocal
from app.models.evidence import Evidence, EvidenceType
from app.services.embedding_service import EmbeddingService
from app.services.storage_service import storage_service

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])
embedding_service = EmbeddingService()

TMP_DIR = "/tmp"

async def _index_evidence_background(evidence_id: str, org_id: str, file_bytes: bytes, mime_type: str, tmp_path: str):
    async with AsyncSessionLocal() as db:
        try:
            evidence = await get_scoped_or_404(db, Evidence, evidence_id, org_id)
            evidence.indexing_status = "indexing"
            await db.commit()

            os.makedirs(TMP_DIR, exist_ok=True)
            with open(tmp_path, "wb") as f:
                f.write(file_bytes)

            extracted_text = embedding_service.extract_text_from_file(tmp_path, mime_type)
            if extracted_text:
                chunks = embedding_service.chunk_text(extracted_text)
                if chunks:
                    embeddings = embedding_service.generate_embeddings(chunks)
                    from app.models.evidence_chunk import EvidenceChunk
                    for idx, (chunk_content, chunk_emb) in enumerate(zip(chunks, embeddings)):
                        db.add(EvidenceChunk(
                            evidence_id=evidence_id,
                            organization_id=org_id,
                            content=chunk_content,
                            embedding=chunk_emb,
                            chunk_index=idx
                        ))

            evidence.indexing_status = "done"
            await db.commit()
        except Exception as e:
            try:
                ev = await get_scoped_or_404(db, Evidence, evidence_id, org_id)
                ev.indexing_status = "error"
                await db.commit()
            except Exception:
                pass
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

@router.get("/")
async def get_all_evidence(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    stmt = scope_to_org(select(Evidence), Evidence, org_id)
    result = await db.execute(stmt)
    evidences = result.scalars().all()

    return [
        {
            "id": ev.id,
            "name": ev.title,
            "control": ev.evidence_metadata.get("control", "N/A") if ev.evidence_metadata else "N/A",
            "type": ev.evidence_metadata.get("type", "manual") if ev.evidence_metadata else "manual",
            "source": ev.evidence_metadata.get("source", "Manual") if ev.evidence_metadata else "Manual",
            "sourceIcon": ev.evidence_metadata.get("sourceIcon", "📄") if ev.evidence_metadata else "📄",
            "lastUpdated": ev.verified_at.isoformat() if ev.verified_at else datetime.utcnow().isoformat(),
            "validityDays": ev.evidence_metadata.get("validityDays", 30) if ev.evidence_metadata else 30,
            "file_url": ev.file_url,
            "file_size": ev.file_size
        }
        for ev in evidences
    ]

@router.post("/upload")
async def upload_evidence(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    control: str = Form("General"),
    source: str = Form("Manual"),
    validityDays: int = Form(30),
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    try:
        file_bytes = await file.read()
        file_size = len(file_bytes)
        import unicodedata
        safe_filename = unicodedata.normalize('NFKD', file.filename).encode('ascii', 'ignore').decode('ascii')
        safe_filename = "".join(c for c in safe_filename if c.isalnum() or c in "._-") or "file"
        storage_path = f"{org_id}/{uuid.uuid4()}_{safe_filename}" # Aislamiento físico en storage

        try:
            from app.config import settings
            if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
                await storage_service.upload(
                    path=storage_path,
                    content=file_bytes,
                    content_type=file.content_type or "application/octet-stream",
                )
            else:
                storage_path = f"local:{file.filename}"
        except Exception as se:
            storage_path = f"local:{file.filename}"

        now = datetime.utcnow()
        new_evidence = Evidence(
            title=file.filename,
            file_url=storage_path,
            file_name=file.filename,
            file_size=file_size,
            mime_type=file.content_type or "application/octet-stream",
            evidence_type=EvidenceType.DOCUMENT,
            verified_at=now,
            indexing_status="pending",
            organization_id=org_id,
            evidence_metadata={
                "control": control,
                "type": "manual",
                "source": source,
                "sourceIcon": "📄",
                "validityDays": validityDays
            }
        )

        db.add(new_evidence)
        await db.commit()
        await db.refresh(new_evidence)

        evidence_id = new_evidence.id
        tmp_path = os.path.join(TMP_DIR, f"{evidence_id}_{safe_filename[:60]}")
        mime = file.content_type or ""

        background_tasks.add_task(
            _index_evidence_background, evidence_id, org_id, file_bytes, mime, tmp_path
        )

        return {
            "message": "Evidencia subida correctamente. Indexando en segundo plano...",
            "id": evidence_id,
            "filename": file.filename,
            "indexing_status": "pending"
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al subir archivo: {str(e)}")

@router.get("/{evidence_id}/status")
async def get_evidence_status(
    evidence_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    ev = await get_scoped_or_404(db, Evidence, evidence_id, org_id)
    return {"id": evidence_id, "indexing_status": ev.indexing_status or "done"}

@router.get("/{evidence_id}/download")
async def download_evidence(
    evidence_id: str,
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    evidence = await get_scoped_or_404(db, Evidence, evidence_id, org_id)
    try:
        content = await storage_service.download(evidence.file_url)
    except Exception:
        raise HTTPException(status_code=404, detail="El archivo físico no se encuentra en Supabase Storage")

    return StreamingResponse(
        io.BytesIO(content),
        media_type=evidence.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{evidence.file_name}"'}
    )

def _make_pdf(title: str, subtitle: str, sections: list) -> bytes:
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    
    y = 50
    page.insert_text((50, y), title, fontsize=16, fontname="hebo")
    y += 20
    page.insert_text((50, y), subtitle, fontsize=12, fontname="helv", color=(0.5, 0.5, 0.5))
    y += 30
    
    for heading, fields in sections:
        if y > 750:  
            page = doc.new_page()
            y = 50
        page.insert_text((50, y), heading, fontsize=12, fontname="hebo")
        y += 20
        for label, value in fields:
            if y > 780:
                page = doc.new_page()
                y = 50
            val_str = str(value).replace("\n", " ")
            val_str = val_str[:90] + ("..." if len(val_str) > 90 else "")
            page.insert_text((70, y), f"{label}: {val_str}", fontsize=10, fontname="helv")
            y += 15
        y += 15
    return doc.tobytes()

@router.get("/export/zip")
async def export_evidences_zip(
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    from app.models.risk import Risk
    
    # Exportación estrictamente multi-tenant
    ev_stmt = scope_to_org(select(Evidence), Evidence, org_id)
    ev_result = await db.execute(ev_stmt)
    evidences = ev_result.scalars().all()

    risk_stmt = scope_to_org(select(Risk), Risk, org_id)
    risk_result = await db.execute(risk_stmt)
    risks = risk_result.scalars().all()

    clause_folders = {
        "4":  "Clausula_4_Contexto",
        "5":  "Clausula_5_Liderazgo",
        "6":  "Clausula_6_Planificacion",
        "7":  "Clausula_7_Soporte",
        "8":  "Clausula_8_Operacion",
        "9":  "Clausula_9_Evaluacion",
        "10": "Clausula_10_Mejora",
    }
    clause_names = {
        "4": "Contexto de la Organizacion",
        "5": "Liderazgo",
        "6": "Planificacion",
        "7": "Soporte",
        "8": "Operacion",
        "9": "Evaluacion del Desempeno",
        "10": "Mejora Continua",
    }

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED, False) as zf:

        ev_by_clause: dict = {k: [] for k in clause_folders}
        for ev in evidences:
            ctrl = (ev.evidence_metadata or {}).get("control", "") if ev.evidence_metadata else ""
            prefix = ctrl.split(".")[0] if ctrl else ""
            if prefix in ev_by_clause:
                ev_by_clause[prefix].append(ev)

        for prefix, folder in clause_folders.items():
            evs = ev_by_clause[prefix]
            clause_name = clause_names[prefix]
            sections = []
            if evs:
                for ev in evs:
                    ctrl = (ev.evidence_metadata or {}).get("control", "N/A") if ev.evidence_metadata else "N/A"
                    sections.append((f"Evidencia: {ev.title[:60]}", [
                        ("Control ISO 27001", ctrl),
                        ("Tipo", (ev.evidence_metadata or {}).get("type", "manual")),
                        ("Fuente", (ev.evidence_metadata or {}).get("source", "Manual")),
                        ("Fecha verificacion", ev.verified_at.strftime("%d/%m/%Y") if ev.verified_at else "Sin fecha"),
                        ("Descripcion", ev.description or "Sin descripcion"),
                    ]))
            else:
                sections.append(("Sin evidencias registradas", [("Estado", "Pendiente de documentacion")]))

            pdf_bytes = _make_pdf(f"Clausula {prefix} - {clause_name}", f"Evidencias ISO | {len(evs)} documento(s)", sections)
            zf.writestr(f"{folder}/Evidencias_Clausula_{prefix}.pdf", pdf_bytes)

            for ev in evs:
                if not ev.file_url:
                    continue
                try:
                    file_bytes = await storage_service.download(ev.file_url)
                    safe = "".join(c for c in (ev.file_name or ev.title) if c.isalnum() or c in " ._-")[:50]
                    zf.writestr(f"{folder}/{safe}", file_bytes)
                except Exception:
                    continue 

        risk_sections = []
        for r in risks:
            risk_sections.append((r.title[:70], [
                ("Nivel", r.risk_level.value if r.risk_level else "N/A"),
                ("Estado", r.status.value if r.status else "N/A"),
                ("Responsable", r.owner)
            ]))
        if not risk_sections:
            risk_sections = [("Sin riesgos registrados", [("Estado", "No hay riesgos")])]

        zf.writestr("Riesgos/Registro_de_Riesgos.pdf", _make_pdf("Registro de Riesgos", "ISO 27001", risk_sections))
        zf.writestr("Resumen/Resumen_Ejecutivo.pdf", _make_pdf("Resumen Ejecutivo", "Paquete de Auditoria", [("Resumen", [("Evidencias", str(len(evidences))), ("Riesgos", str(len(risks)))])]))

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=ISO27001_Audit_Package.zip"}
    )