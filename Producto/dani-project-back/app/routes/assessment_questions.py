import asyncio
import io
import os
import tempfile
import json
import re
import unicodedata
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, get_current_org, RequireRole, ELEVATED_WRITE, require_superadmin
from app.models.assessment_question import AssessmentQuestion
from app.models.assessment_answer import AssessmentAnswer
from app.models.control_status import ControlStatus


def _codigo_a_control_id(codigo: str) -> str:
    """Convierte el código de una pregunta al control_id ISO.

    Las preguntas usan "A.5.1" (Anexo A) y los controles ISO usan "5.1".
    """
    c = (codigo or "").strip().upper()
    if c.startswith("A."):
        c = c[2:]
    elif c.startswith("A") and len(c) > 1 and c[1].isdigit():
        c = c[1:]
    return c.strip(". ")
from app.services.ai_service import AIService

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

router = APIRouter(prefix="/api/assessment-questions", tags=["Assessment Questions"])

# Marcos normativos. Cada pregunta pertenece a uno solo y la IA evalúa uno a la vez.
MARCOS = {"iso27001": "ISO 27001:2022", "ley21719": "Ley 21.719"}


def _validar_marco(marco: Optional[str], obligatorio: bool = True) -> Optional[str]:
    m = (marco or "").strip().lower()
    if not m:
        if obligatorio:
            raise HTTPException(status_code=400, detail="Debes indicar el marco: 'iso27001' o 'ley21719'.")
        return None
    if m not in MARCOS:
        raise HTTPException(status_code=400, detail=f"Marco '{marco}' no válido. Usa 'iso27001' o 'ley21719'.")
    return m
ai_service = AIService()

class QuestionResponse(BaseModel):
    id: str
    marco: str = "iso27001"
    codigo: str
    categoria: str
    nombre: str
    pregunta: str
    evidencia_esperada: Optional[str] = None
    orden: int
    class Config: from_attributes = True

class QuestionCreate(BaseModel):
    marco: str = "iso27001"
    codigo: str
    categoria: str
    nombre: str
    pregunta: str
    evidencia_esperada: Optional[str] = None
    orden: int = 0

class QuestionUpdate(BaseModel):
    marco: Optional[str] = None
    codigo: Optional[str] = None
    categoria: Optional[str] = None
    nombre: Optional[str] = None
    pregunta: Optional[str] = None
    evidencia_esperada: Optional[str] = None
    orden: Optional[int] = None

class AnswerResponse(BaseModel):
    id: str
    question_id: str
    organization_id: str
    veredicto: str
    confianza: Optional[float] = None
    justificacion: Optional[str] = None
    class Config: from_attributes = True

@router.get("/", response_model=List[QuestionResponse])
async def get_questions(categoria: Optional[str] = None, marco: Optional[str] = None, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(AssessmentQuestion)
    marco = _validar_marco(marco, obligatorio=False)
    if marco: stmt = stmt.where(AssessmentQuestion.marco == marco)
    if categoria: stmt = stmt.where(AssessmentQuestion.categoria == categoria)
    stmt = stmt.order_by(AssessmentQuestion.orden)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=QuestionResponse)
async def create_question(data: QuestionCreate, current_user: dict = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    data.marco = _validar_marco(data.marco)
    new_q = AssessmentQuestion(**data.model_dump(exclude_unset=True))
    db.add(new_q)
    await db.commit()
    await db.refresh(new_q)
    return new_q

@router.put("/{q_id}", response_model=QuestionResponse)
async def update_question(q_id: str, data: QuestionUpdate, current_user: dict = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    q = (await db.execute(select(AssessmentQuestion).where(AssessmentQuestion.id == q_id))).scalar_one_or_none()
    if not q: raise HTTPException(status_code=404, detail="Pregunta no encontrada")
    cambios = data.model_dump(exclude_unset=True)
    if "marco" in cambios: cambios["marco"] = _validar_marco(cambios["marco"])
    for key, value in cambios.items(): setattr(q, key, value)
    await db.commit()
    await db.refresh(q)
    return q

@router.delete("/{q_id}")
async def delete_question(q_id: str, current_user: dict = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    q = (await db.execute(select(AssessmentQuestion).where(AssessmentQuestion.id == q_id))).scalar_one_or_none()
    if not q: raise HTTPException(status_code=404, detail="Pregunta no encontrada")
    # Primero las respuestas de las empresas a esta pregunta (FK); si no, el borrado falla.
    await db.execute(sa_delete(AssessmentAnswer).where(AssessmentAnswer.question_id == q_id))
    await db.delete(q)
    await db.commit()
    return {"message": "Eliminada"}


# =========================================================
# CARGA MASIVA DE PREGUNTAS DESDE EXCEL (.xlsx)
# Mapea columnas de forma flexible: acepta otros nombres y columnas de más.
# Solo 'pregunta' es obligatoria; el resto usa valores por defecto.
# =========================================================
_COLUMN_SYNONYMS = {
    "pregunta": ["pregunta", "question", "cuestion", "enunciado", "consulta", "textopregunta", "detalle", "item"],
    "categoria": ["categoria", "category", "dominio", "domain", "seccion", "section", "grupo", "area", "marco", "norma", "anexo", "tipo"],
    "codigo": ["codigo", "code", "controlid", "idcontrol", "codigocontrol", "clausula", "referencia", "ref", "numerocontrol", "numero", "nro", "id", "control"],
    "nombre": ["nombre", "name", "titulo", "title", "nombrecontrol", "nombredelcontrol", "nombrecorto", "descripcioncorta"],
    "evidencia_esperada": ["evidenciaesperada", "evidencia", "evidence", "evidenciarequerida", "expectedevidence", "pruebaesperada"],
    "orden": ["orden", "order", "posicion", "position", "secuencia", "indice", "nroorden"],
}


def _normalizar(texto) -> str:
    if texto is None:
        return ""
    s = str(texto).strip().lower()
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)


def _mapear_columnas(headers: list) -> dict:
    norm = [_normalizar(h) for h in headers]
    usados = set()
    mapeo = {}
    for campo, sinonimos in _COLUMN_SYNONYMS.items():
        for syn in sinonimos:
            for i, h in enumerate(norm):
                if i in usados or not h:
                    continue
                if h == syn:
                    mapeo[campo] = i
                    usados.add(i)
                    break
            if campo in mapeo:
                break
    for campo, sinonimos in _COLUMN_SYNONYMS.items():
        if campo in mapeo:
            continue
        for syn in sinonimos:
            for i, h in enumerate(norm):
                if i in usados or not h:
                    continue
                if syn in h:
                    mapeo[campo] = i
                    usados.add(i)
                    break
            if campo in mapeo:
                break
    return mapeo


@router.post("/bulk-import")
async def bulk_import_questions(
    file: UploadFile = File(...),
    marco: str = Form(...),
    current_user: dict = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Carga masiva de preguntas desde un Excel (.xlsx) a un marco (ISO o Ley). Tolerante a nombres de columna distintos."""
    marco = _validar_marco(marco)
    nombre_archivo = (file.filename or "").lower()
    if not nombre_archivo.endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx).")

    try:
        import openpyxl
    except ImportError:
        raise HTTPException(status_code=500, detail="Falta la dependencia 'openpyxl' en el servidor.")

    contenido = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(contenido), read_only=True, data_only=True)
    except Exception:
        raise HTTPException(status_code=400, detail="No se pudo leer el Excel. ¿Está dañado o no es un .xlsx válido?")

    ws = wb.active
    filas = ws.iter_rows(values_only=True)

    headers = None
    for fila in filas:
        if fila and any(c is not None and str(c).strip() != "" for c in fila):
            headers = list(fila)
            break
    if not headers:
        raise HTTPException(status_code=400, detail="El Excel está vacío.")

    mapeo = _mapear_columnas(headers)
    if "pregunta" not in mapeo:
        raise HTTPException(
            status_code=400,
            detail="No se encontró la columna de preguntas. Agrega una columna llamada 'pregunta' (o similar).",
        )

    def val(fila, campo):
        idx = mapeo.get(campo)
        if idx is None or idx >= len(fila):
            return None
        v = fila[idx]
        if v is None:
            return None
        v = str(v).strip()
        return v or None

    existentes = set()
    res_prev = await db.execute(select(AssessmentQuestion.codigo, AssessmentQuestion.pregunta).where(AssessmentQuestion.marco == marco))
    for cod, preg in res_prev.all():
        existentes.add((_normalizar(cod), _normalizar(preg)))

    creadas = 0
    omitidas = 0
    detalles_omitidas = []
    nuevas_en_lote = set()
    numero_fila = 1

    for fila in filas:
        numero_fila += 1
        if not fila or all(c is None or str(c).strip() == "" for c in fila):
            continue
        pregunta = val(fila, "pregunta")
        if not pregunta:
            omitidas += 1
            detalles_omitidas.append({"fila": numero_fila, "motivo": "sin pregunta"})
            continue
        codigo = (val(fila, "codigo") or "S/C")[:50]
        categoria = (val(fila, "categoria") or "General")[:100]
        nombre = (val(fila, "nombre") or pregunta[:60])[:255]
        evidencia = val(fila, "evidencia_esperada")
        orden_raw = val(fila, "orden")
        try:
            orden = int(float(orden_raw)) if orden_raw else 0
        except (ValueError, TypeError):
            orden = 0

        clave = (_normalizar(codigo), _normalizar(pregunta))
        if clave in existentes or clave in nuevas_en_lote:
            omitidas += 1
            detalles_omitidas.append({"fila": numero_fila, "motivo": "duplicada"})
            continue

        db.add(AssessmentQuestion(
            marco=marco, codigo=codigo, categoria=categoria, nombre=nombre,
            pregunta=pregunta, evidencia_esperada=evidencia, orden=orden,
        ))
        nuevas_en_lote.add(clave)
        creadas += 1

    if creadas:
        await db.commit()

    columnas_detectadas = {campo: headers[idx] for campo, idx in mapeo.items() if idx < len(headers)}
    return {
        "marco": marco,
        "creadas": creadas,
        "omitidas": omitidas,
        "total_filas_datos": creadas + omitidas,
        "columnas_detectadas": columnas_detectadas,
        "detalles_omitidas": detalles_omitidas[:50],
    }


# =========================================================
# CARGA MASIVA DE PREGUNTAS DESDE PDF (.pdf)
# Lee un listado/checklist en PDF: detecta las categorías (encabezados en
# MAYÚSCULAS) y convierte cada ítem en una pregunta. Reutiliza pypdf.
# =========================================================
# Valores ya normalizados (sin espacios/acentos) — _normalizar() produce este formato.
_RUIDO_PDF = {
    "listadodecumplimientonormativo",
    "listadodecumplimientodelrgpd",
    "cumple", "sino", "introduccion", "sino", "pagina",
}


def _parece_categoria(linea: str) -> bool:
    s = linea.strip()
    letras = [c for c in s if c.isalpha()]
    if len(letras) < 4:
        return False
    mayus = sum(1 for c in letras if c.isupper())
    return (mayus / len(letras)) > 0.85 and len(s) > 6


def _parsear_preguntas_pdf(texto: str):
    """Devuelve una lista de (categoria, texto_pregunta) a partir del texto del PDF."""
    PREP_FINAL = (" DE", " DEL", " A", " EN", " LA", " LOS", " LAS", " Y", " CON", " O")
    categoria = None
    capturando = False
    actual = ""
    items = []

    def cerrar():
        nonlocal actual
        t = re.sub(r"\s+", " ", actual).strip(" .;:-")
        if t and len(t) >= 15 and categoria:
            items.append((categoria, t))
        actual = ""

    for raw in texto.splitlines():
        linea = raw.strip()
        if not linea:
            continue
        if _normalizar(linea) in _RUIDO_PDF:
            cerrar()
            continue
        if _parece_categoria(linea):
            cerrar()
            if categoria and categoria.rstrip().endswith(PREP_FINAL):
                # Categoría partida en dos líneas (p. ej. "... DATOS SE OBTIENEN DEL / INTERESADO")
                categoria = (categoria.rstrip() + " " + linea).strip()
            else:
                categoria = linea
            capturando = True
            continue
        if not capturando:
            continue  # saltamos la introducción previa a la primera categoría
        # Ítem nuevo (empieza en mayúscula) o continuación (empieza en minúscula)
        if actual and linea[:1].islower():
            actual += " " + linea
        else:
            cerrar()
            actual = linea
    cerrar()
    return items


@router.post("/bulk-import-pdf")
async def bulk_import_questions_pdf(
    file: UploadFile = File(...),
    marco: str = Form(...),
    categoria_forzada: Optional[str] = Form(None),
    current_user: dict = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Carga masiva de preguntas desde un PDF (checklist/listado) a un marco (ISO o Ley). Detecta categorías e ítems."""
    marco = _validar_marco(marco)
    if PdfReader is None:
        raise HTTPException(status_code=500, detail="Falta la dependencia 'pypdf' en el servidor.")

    nombre_archivo = (file.filename or "").lower()
    if not nombre_archivo.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF (.pdf).")

    contenido = await file.read()
    try:
        reader = PdfReader(io.BytesIO(contenido))
        texto = "\n".join((p.extract_text() or "") for p in reader.pages)
    except Exception:
        raise HTTPException(status_code=400, detail="No se pudo leer el PDF. ¿Está dañado o protegido?")

    if not texto.strip():
        raise HTTPException(
            status_code=400,
            detail="El PDF no contiene texto extraíble (parece escaneado). Requiere OCR o súbelo como Excel.",
        )

    items = _parsear_preguntas_pdf(texto)
    if not items:
        raise HTTPException(
            status_code=400,
            detail="No se detectaron preguntas en el PDF. Verifica que tenga encabezados de categoría e ítems.",
        )

    prefijo = re.sub(r"[^A-Za-z0-9]", "", os.path.splitext(os.path.basename(nombre_archivo))[0])[:8].upper() or "PDF"

    preguntas_existentes = set()
    res_prev = await db.execute(select(AssessmentQuestion.pregunta).where(AssessmentQuestion.marco == marco))
    for (preg,) in res_prev.all():
        preguntas_existentes.add(_normalizar(preg))

    creadas = 0
    omitidas = 0
    nuevas = set()
    por_categoria: dict = {}
    indice = 0

    for categoria, texto_item in items:
        indice += 1
        cat = limpiar_texto_pdf(categoria_forzada or categoria or "General")[:100]
        codigo = f"{prefijo}-{indice:03d}"[:50]
        # El PDF trae afirmaciones con texto partido: se limpian y se pasan a pregunta.
        # La evidencia esperada la completa luego la IA (POST /mejorar).
        pregunta_txt = a_pregunta(texto_item)
        clave = _normalizar(pregunta_txt)
        if clave in preguntas_existentes or clave in nuevas:
            omitidas += 1
            continue
        db.add(AssessmentQuestion(
            marco=marco,
            codigo=codigo,
            categoria=cat,
            nombre=nombre_corto(texto_item),
            pregunta=pregunta_txt[:1000],
            evidencia_esperada=None,
            orden=indice,
        ))
        nuevas.add(clave)
        por_categoria[cat] = por_categoria.get(cat, 0) + 1
        creadas += 1

    if creadas:
        await db.commit()

    return {
        "marco": marco,
        "creadas": creadas,
        "omitidas": omitidas,
        "total_detectadas": len(items),
        "categorias": por_categoria,
    }


@router.get("/bulk-template")
async def bulk_template(current_user: dict = Depends(require_superadmin)):
    """Descarga una plantilla .xlsx con las columnas esperadas y 2 ejemplos."""
    try:
        import openpyxl
    except ImportError:
        raise HTTPException(status_code=500, detail="Falta la dependencia 'openpyxl' en el servidor.")
    from fastapi.responses import StreamingResponse

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Preguntas"
    ws.append(["codigo", "categoria", "nombre", "pregunta", "evidencia_esperada", "orden"])
    ws.append([
        "A.5.1", "Organizacional", "Políticas de seguridad",
        "¿La organización tiene políticas de seguridad aprobadas?",
        "Documento de política firmado por la dirección", 1,
    ])
    ws.append([
        "A.5.2", "Organizacional", "Roles y responsabilidades",
        "¿Están definidos y asignados los roles de seguridad de la información?",
        "Matriz de responsabilidades o RACI aprobada", 2,
    ])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=plantilla_preguntas.xlsx"},
    )

@router.get("/answers", response_model=List[AnswerResponse])
async def get_answers(org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    stmt = select(AssessmentAnswer).where(AssessmentAnswer.organization_id == org_id).order_by(AssessmentAnswer.created_at)
    return (await db.execute(stmt)).scalars().all()

@router.get("/answers/{question_id}", response_model=AnswerResponse)
async def get_answer_by_question(question_id: str, org_id: str = Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    answer = (await db.execute(select(AssessmentAnswer).where(AssessmentAnswer.question_id == question_id, AssessmentAnswer.organization_id == org_id))).scalar_one_or_none()
    if not answer: raise HTTPException(status_code=404, detail="No encontrada")
    return answer

class RespuestaManualRequest(BaseModel):
    veredicto: str


@router.put("/answers/{question_id}", response_model=AnswerResponse)
async def guardar_respuesta_manual(
    question_id: str,
    data: RespuestaManualRequest,
    current_user: dict = Depends(RequireRole(ELEVATED_WRITE)),
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Respuesta dada a mano en el cuestionario (Sí / Parcial / No). Se guarda
    por empresa, igual que las de la IA, para que el resultado no dependa del
    navegador. Si cambia el veredicto, se descarta la justificación de la IA."""
    veredicto = (data.veredicto or "").strip().lower()
    if veredicto not in ("cumple", "parcial", "no_cumple"):
        raise HTTPException(status_code=400, detail="Veredicto inválido (cumple, parcial o no_cumple).")
    if not (await db.execute(select(AssessmentQuestion.id).where(AssessmentQuestion.id == question_id))).first():
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")
    answer = (await db.execute(select(AssessmentAnswer).where(AssessmentAnswer.question_id == question_id, AssessmentAnswer.organization_id == org_id))).scalar_one_or_none()
    if not answer:
        answer = AssessmentAnswer(question_id=question_id, organization_id=org_id)
        db.add(answer)
    if answer.veredicto != veredicto:
        answer.confianza = None
        answer.justificacion = None
    answer.veredicto = veredicto
    await db.commit()
    await db.refresh(answer)
    return answer


class NoAplicaRequest(BaseModel):
    justificacion: str


@router.put("/answers/{question_id}/no-aplica", response_model=AnswerResponse)
async def marcar_no_aplica(
    question_id: str,
    data: NoAplicaRequest,
    current_user: dict = Depends(RequireRole(ELEVATED_WRITE)),
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """La empresa declara que una pregunta del catálogo no le aplica, con su
    justificación (igual que en la SOA). La pregunta no se borra: queda fuera
    de la evaluación con IA y del cálculo de brechas de esa empresa."""
    justificacion = (data.justificacion or "").strip()
    if len(justificacion) < 10:
        raise HTTPException(status_code=400, detail="Explica en al menos 10 caracteres por qué la pregunta no aplica.")
    if not (await db.execute(select(AssessmentQuestion.id).where(AssessmentQuestion.id == question_id))).first():
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")
    answer = (await db.execute(select(AssessmentAnswer).where(AssessmentAnswer.question_id == question_id, AssessmentAnswer.organization_id == org_id))).scalar_one_or_none()
    if not answer:
        answer = AssessmentAnswer(question_id=question_id, organization_id=org_id)
        db.add(answer)
    answer.veredicto = "no_aplica"
    answer.confianza = None
    answer.justificacion = justificacion[:2000]
    await db.commit()
    await db.refresh(answer)
    return answer


@router.delete("/answers/{question_id}/no-aplica")
async def quitar_no_aplica(
    question_id: str,
    current_user: dict = Depends(RequireRole(ELEVATED_WRITE)),
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Vuelve a incluir la pregunta en la evaluación de la empresa."""
    await db.execute(sa_delete(AssessmentAnswer).where(
        AssessmentAnswer.question_id == question_id,
        AssessmentAnswer.organization_id == org_id,
        AssessmentAnswer.veredicto == "no_aplica",
    ))
    await db.commit()
    return {"message": "La pregunta vuelve a aplicar"}


# Función para extraer JSON de una cadena de texto (incluso si la IA agrega markdown o comentarios)
def extract_json_from_text(text: str):
    try:
        # Intenta parsear directamente
        return json.loads(text)
    except json.JSONDecodeError:
        # Si falla, busca un bloque JSON dentro del texto
        try:
            match = re.search(r'\[\s*\{.*?\}\s*\]', text, re.DOTALL | re.MULTILINE)
            if match:
                return json.loads(match.group(0))
            
            # Intenta buscar un objeto JSON simple si no es un arreglo
            match_obj = re.search(r'\{\s*".*?:.*?\}', text, re.DOTALL | re.MULTILINE)
            if match_obj:
                 return [json.loads(match_obj.group(0))]

            return []
        except:
            print(f"No se pudo extraer JSON de la respuesta de la IA: {text}")
            return []

# EVALUACIÓN CON IA POR MARCO NORMATIVO (en segundo plano)
# =====================================================================
# POST /evaluate        -> inicia un job para UN marco (iso27001 o ley21719)
#                          y devuelve {job_id, total}
# GET  /evaluate/{id}   -> estado: done/total, etapa y, al terminar,
#                          {marco, total, results, evaluated_with_ai}
# Ver app/services/question_evaluator.py (filtro por relevancia + contexto
# por fragmentos + reintentos ante el límite de Groq).
# =====================================================================
from app.services import question_evaluator as qe
from app.services.question_enricher import limpiar_texto_pdf, a_pregunta, nombre_corto
from app.services import question_enricher
from app.dependencies.database import AsyncSessionLocal

_jobs_en_curso = set()  # referencias para que asyncio no recolecte las tareas


def _texto_de_bytes(data: bytes, filename: str) -> str:
    filename = (filename or "").lower()
    texto = ""
    if filename.endswith(".pdf") and PdfReader:
        try:
            pdf = PdfReader(io.BytesIO(data))
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    texto += t + "\n"
        except Exception as e:
            print(f"Error leyendo PDF: {e}")
    else:
        try:
            texto = data.decode("utf-8")
        except Exception:
            texto = data.decode("latin-1", errors="ignore")
    return texto


async def _documentos_guardados(db: AsyncSession, ev_ids: List[str], org_id: str):
    """Texto de las evidencias seleccionadas del Centro de Evidencias."""
    from app.models.evidence import Evidence
    from app.models.evidence_chunk import EvidenceChunk
    from app.services.storage_service import storage_service

    documentos = []
    ev_rows = (await db.execute(
        select(Evidence).where(Evidence.id.in_(ev_ids), Evidence.organization_id == org_id)
    )).scalars().all()
    for ev in ev_rows:
        # 0) Lo más confiable: el texto ya guardado en la BD al subir.
        texto_ev = (ev.extracted_text or "").strip()
        # 1) Si no hay, descargar el archivo guardado y extraer el texto ahora.
        if not texto_ev:
            try:
                data = await storage_service.download(ev.file_url)
                texto_ev = _texto_de_bytes(data, ev.file_name or ev.title or "")
            except Exception as e:
                print(f"No se pudo descargar la evidencia {ev.id}, uso el índice: {e}")
        # 2) Fallback: texto ya indexado (EvidenceChunk).
        if not texto_ev.strip():
            chunks = (await db.execute(
                select(EvidenceChunk).where(
                    EvidenceChunk.evidence_id == ev.id,
                    EvidenceChunk.organization_id == org_id,
                ).order_by(EvidenceChunk.chunk_index)
            )).scalars().all()
            texto_ev = "\n".join(c.content for c in chunks if c.content)
        if texto_ev.strip():
            documentos.append((ev.title or "Documento", texto_ev))
    return documentos


async def _guardar_resultados(db: AsyncSession, org_id: str, preguntas, resultados, actualizar_soa: bool = True):
    """Guarda las respuestas y, si es ISO, refleja los veredictos en el SOA (ControlStatus)."""
    q_ids_res = [str(item.get("id")) for item in resultados if item.get("id")]
    respuestas_existentes = {}
    if q_ids_res:
        exist_stmt = select(AssessmentAnswer).where(AssessmentAnswer.organization_id == org_id, AssessmentAnswer.question_id.in_(q_ids_res))
        respuestas_existentes = {a.question_id: a for a in (await db.execute(exist_stmt)).scalars().all()}

    for item in resultados:
        qid = str(item.get("id") or "").strip()
        if not qid:
            continue
        veredicto = item.get("veredicto", "sin_evidencia")
        if veredicto not in {"cumple", "parcial", "no_cumple", "sin_evidencia"}:
            veredicto = "sin_evidencia"
        try:
            confianza = float(item.get("confianza", 0.0))
        except Exception:
            confianza = 0.0
        existing = respuestas_existentes.get(qid)
        if existing:
            existing.veredicto = veredicto
            existing.confianza = confianza
            existing.justificacion = item.get("justificacion")
        else:
            db.add(AssessmentAnswer(question_id=qid, organization_id=org_id, veredicto=veredicto, confianza=confianza, justificacion=item.get("justificacion")))
    await db.commit()
    if not actualizar_soa:
        return  # la Ley 21.719 no tiene SOA

    # --- Puente hacia el SOA: actualizar el estado de los controles ISO ---
    # Mapeo por código: pregunta "A.5.1" -> control "5.1".
    q_by_id = {q.id: q for q in preguntas}
    estado_por_veredicto = {
        "cumple": ("Implementado", 100),
        "parcial": ("Planificado", 50),
        "no_cumple": ("No Implementado", 0),
        "sin_evidencia": ("No Implementado", 0),
    }
    statuses = {cs.control_id: cs for cs in (await db.execute(
        select(ControlStatus).where(ControlStatus.organization_id == org_id)
    )).scalars().all()}
    for item in resultados:
        q = q_by_id.get(str(item.get("id") or "").strip())
        if not q:
            continue
        cs = statuses.get(_codigo_a_control_id(q.codigo))
        if not cs:
            continue  # solo tocamos controles que existan para esta empresa
        veredicto = item.get("veredicto", "sin_evidencia")
        # No degradamos un control ya Implementado por un "sin_evidencia".
        if veredicto in ("sin_evidencia", "no_cumple") and cs.status == "Implementado":
            continue
        nuevo_estado, score = estado_por_veredicto.get(veredicto, ("No Implementado", 0))
        cs.applies = True
        cs.status = nuevo_estado
        cs.score = score
        if item.get("justificacion"):
            cs.justification = item.get("justificacion")
    await db.commit()


async def _ejecutar_job(job_id: str, org_id: str, marco: str, preguntas, documentos):
    job = qe.JOBS[job_id]

    def progreso(avance: int, etapa):
        job["done"] = min(job["total"], job["done"] + avance)
        if etapa:
            job["stage"] = etapa

    try:
        from app.routes.evidence import embedding_service
        job["stage"] = "Buscando qué preguntas se relacionan con los documentos"
        resultados, enviadas = await qe.evaluar_preguntas(
            ai_service, embedding_service, preguntas, documentos, extract_json_from_text, progreso
        )
        job["stage"] = "Guardando resultados y actualizando la SOA" if marco == "iso27001" else "Guardando resultados"
        async with AsyncSessionLocal() as db:
            await _guardar_resultados(db, org_id, preguntas, resultados, actualizar_soa=(marco == "iso27001"))

        job["result"] = {
            "marco": marco, "total": len(resultados), "results": resultados,
            "evaluated_with_ai": enviadas,
        }
        job["done"] = job["total"]
        job["status"] = "done"
        job["stage"] = "Listo"
    except Exception as e:
        print(f"Error en el job de evaluación {job_id}: {e}")
        job["status"] = "error"
        job["error"] = "La evaluación falló en el servidor. Intenta de nuevo."


@router.post("/evaluate")
async def evaluate_with_ai(
    files: List[UploadFile] = File(default=None),
    marco: str = Form(...),        # "iso27001" o "ley21719": la IA evalúa un solo marco
    question_ids: str = Form(""),
    evidence_ids: str = Form(""),  # documentos ya guardados en el Centro de Evidencias
    current_user: dict = Depends(RequireRole(ELEVATED_WRITE)),
    org_id: str = Depends(get_current_org),
    db: AsyncSession = Depends(get_db)
):
    marco = _validar_marco(marco)
    documentos = []
    ev_ids = [x.strip() for x in evidence_ids.split(",") if x.strip()]
    if ev_ids:
        documentos += await _documentos_guardados(db, ev_ids, org_id)
    for f in (files or []):
        texto = _texto_de_bytes(await f.read(), f.filename)
        if texto.strip():
            documentos.append((f.filename or "Documento", texto))

    if not documentos:
        raise HTTPException(status_code=400, detail="No se pudo extraer texto. Asegúrate de que los PDFs no sean solo imágenes.")

    stmt = select(AssessmentQuestion).where(AssessmentQuestion.marco == marco)
    ids = [x.strip() for x in question_ids.split(",") if x.strip()]
    if ids:
        stmt = stmt.where(AssessmentQuestion.id.in_(ids))
    # Las preguntas que la empresa marcó como "no aplica" no se evalúan.
    no_aplica = select(AssessmentAnswer.question_id).where(
        AssessmentAnswer.organization_id == org_id, AssessmentAnswer.veredicto == "no_aplica"
    )
    stmt = stmt.where(AssessmentQuestion.id.not_in(no_aplica))
    preguntas = (await db.execute(stmt.order_by(AssessmentQuestion.orden))).scalars().all()
    if not preguntas:
        raise HTTPException(status_code=400, detail=f"No hay preguntas de {MARCOS[marco]} para evaluar (o todas están marcadas como \"no aplica\").")

    job_id = qe.crear_job(org_id, len(preguntas))
    tarea = asyncio.create_task(_ejecutar_job(job_id, org_id, marco, list(preguntas), documentos))
    _jobs_en_curso.add(tarea)
    tarea.add_done_callback(_jobs_en_curso.discard)
    return {"job_id": job_id, "total": len(preguntas)}


@router.get("/evaluate/{job_id}")
async def evaluate_status(job_id: str, org_id: str = Depends(get_current_org)):
    job = qe.obtener_job(job_id, org_id)
    if not job:
        raise HTTPException(status_code=404, detail="La evaluación no existe o expiró (el servidor pudo haberse reiniciado).")
    return job


# =====================================================================
# MEJORAR PREGUNTAS CON IA (solo superadmin)
# POST /mejorar       -> redacta como pregunta, título corto y evidencia
#                        esperada las preguntas del marco que no la tienen
# GET  /mejorar/{id}  -> avance del trabajo
# =====================================================================
_JOB_PLATAFORMA = "plataforma"  # los jobs del catálogo no son de una empresa


@router.post("/mejorar")
async def mejorar_preguntas(
    marco: str = Form(...),
    current_user: dict = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    marco = _validar_marco(marco)
    preguntas = (await db.execute(
        select(AssessmentQuestion)
        .where(AssessmentQuestion.marco == marco)
        .where((AssessmentQuestion.evidencia_esperada.is_(None)) | (AssessmentQuestion.evidencia_esperada == ""))
        .order_by(AssessmentQuestion.orden)
    )).scalars().all()
    if not preguntas:
        return {"job_id": None, "total": 0}
    datos = [{"id": q.id, "categoria": q.categoria, "texto": q.pregunta} for q in preguntas]
    job_id = qe.crear_job(_JOB_PLATAFORMA, len(datos))
    tarea = asyncio.create_task(_ejecutar_mejora(job_id, marco, datos))
    _jobs_en_curso.add(tarea)
    tarea.add_done_callback(_jobs_en_curso.discard)
    return {"job_id": job_id, "total": len(datos)}


@router.get("/mejorar/{job_id}")
async def mejorar_estado(job_id: str, current_user: dict = Depends(require_superadmin)):
    job = qe.obtener_job(job_id, _JOB_PLATAFORMA)
    if not job:
        raise HTTPException(status_code=404, detail="El trabajo no existe o expiró (el servidor pudo haberse reiniciado).")
    return job


async def _ejecutar_mejora(job_id: str, marco: str, datos: list):
    job = qe.JOBS[job_id]
    job["stage"] = "Redactando preguntas y evidencia esperada"

    def progreso(hechas: int):
        job["done"] = hechas

    try:
        mejoradas = await question_enricher.enriquecer(ai_service, marco, datos, progreso)
        con_ia = 0
        async with AsyncSessionLocal() as db:
            for d, m in zip(datos, mejoradas):
                q = (await db.execute(select(AssessmentQuestion).where(AssessmentQuestion.id == d["id"]))).scalar_one_or_none()
                if not q:
                    continue
                q.pregunta = m["pregunta"] or q.pregunta
                q.nombre = (m["nombre"] or q.nombre)[:255]
                q.categoria = limpiar_texto_pdf(q.categoria)[:100]
                if m["evidencia_esperada"]:
                    q.evidencia_esperada = m["evidencia_esperada"]
                con_ia += 1 if m["con_ia"] else 0
            await db.commit()
        job["result"] = {"marco": marco, "total": len(datos), "con_ia": con_ia}
        job["done"] = job["total"]
        job["status"] = "done"
        job["stage"] = "Listo"
    except Exception as e:
        print(f"Error al mejorar preguntas {job_id}: {e}")
        job["status"] = "error"
        job["error"] = "No se pudieron mejorar las preguntas. Intenta de nuevo."
