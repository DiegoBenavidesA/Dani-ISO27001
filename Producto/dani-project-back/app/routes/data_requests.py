from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.data_subject_request import DataSubjectRequest, RequestType, RequestState

router = APIRouter(prefix="/api/data-requests", tags=["Data Subject Requests"])

# ==========================================
# FUNCIÓN AUXILIAR: Cálculo de días hábiles
# ==========================================
def calcular_dias_habiles(fecha_inicio: datetime, dias_a_sumar: int) -> datetime:
    """Suma una cantidad de días hábiles saltando sábados (5) y domingos (6)."""
    fecha_actual = fecha_inicio
    dias_agregados = 0
    
    while dias_agregados < dias_a_sumar:
        fecha_actual += timedelta(days=1)
        # weekday() devuelve 0 para Lunes y 6 para Domingo
        if fecha_actual.weekday() < 5: 
            dias_agregados += 1
            
    return fecha_actual

# ==========================================
# ESQUEMAS (PYDANTIC)
# ==========================================
class DataRequestCreate(BaseModel):
    titular: str
    tipo: RequestType
    descripcion: str
    organization_id: Optional[str] = None

class DataRequestUpdate(BaseModel):
    estado: Optional[RequestState] = None
    responsable: Optional[str] = None
    respuesta: Optional[str] = None

class DataRequestResponse(BaseModel):
    id: str
    titular: str
    tipo: RequestType
    descripcion: str
    fecha_solicitud: datetime
    fecha_limite: datetime
    estado: RequestState
    responsable: Optional[str] = None
    respuesta: Optional[str] = None
    organization_id: Optional[str] = None

    class Config:
        from_attributes = True

# ==========================================
# ENDPOINTS
# ==========================================
@router.post("", response_model=DataRequestResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=DataRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_data_request(
    request_data: DataRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Crear una nueva solicitud ARCO+P y calcular su fecha límite (30 días hábiles)"""
    fecha_actual = datetime.utcnow()
    
    # Obligación O3: La ley da 30 días hábiles para responder
    fecha_limite_calculada = calcular_dias_habiles(fecha_actual, 30)
    
    new_request = DataSubjectRequest(
        titular=request_data.titular,
        tipo=request_data.tipo,
        descripcion=request_data.descripcion,
        fecha_solicitud=fecha_actual,
        fecha_limite=fecha_limite_calculada,
        estado=RequestState.PENDIENTE,
        organization_id=request_data.organization_id
    )
    
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    
    return new_request

@router.get("", response_model=List[DataRequestResponse])
@router.get("/", response_model=List[DataRequestResponse])
async def get_all_data_requests(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Listar todas las solicitudes de los titulares"""
    query = select(DataSubjectRequest).order_by(DataSubjectRequest.fecha_limite.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{request_id}", response_model=DataRequestResponse)
async def get_data_request_by_id(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener el detalle de una solicitud específica"""
    query = select(DataSubjectRequest).where(DataSubjectRequest.id == request_id)
    result = await db.execute(query)
    request_item = result.scalar_one_or_none()
    
    if not request_item:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
    return request_item

@router.patch("/{request_id}", response_model=DataRequestResponse)
async def update_data_request(
    request_id: str,
    update_data: DataRequestUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar el estado, responsable o respuesta de la solicitud"""
    query = select(DataSubjectRequest).where(DataSubjectRequest.id == request_id)
    result = await db.execute(query)
    request_item = result.scalar_one_or_none()
    
    if not request_item:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
    if update_data.estado is not None:
        request_item.estado = update_data.estado
    if update_data.responsable is not None:
        request_item.responsable = update_data.responsable
    if update_data.respuesta is not None:
        request_item.respuesta = update_data.respuesta
        
    await db.commit()
    await db.refresh(request_item)
    
    return request_item