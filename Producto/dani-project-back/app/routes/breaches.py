from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.data_breach import DataBreach, SeverityLevel, BreachState

router = APIRouter(prefix="/api/breaches", tags=["Data Breaches"])

# ==========================================
# ESQUEMAS (PYDANTIC)
# ==========================================
class BreachCreate(BaseModel):
    fecha_deteccion: Optional[datetime] = None
    descripcion: str
    datos_afectados: str
    cantidad_afectados: Optional[int] = None
    gravedad: SeverityLevel
    organization_id: Optional[str] = None

class BreachUpdate(BaseModel):
    estado: Optional[BreachState] = None
    medidas_tomadas: Optional[str] = None
    responsable: Optional[str] = None
    cantidad_afectados: Optional[int] = None
    gravedad: Optional[SeverityLevel] = None

class BreachResponse(BaseModel):
    id: str
    fecha_deteccion: datetime
    descripcion: str
    datos_afectados: str
    cantidad_afectados: Optional[int] = None
    gravedad: SeverityLevel
    fecha_limite_notificacion: datetime
    fecha_notificacion: Optional[datetime] = None
    estado: BreachState
    medidas_tomadas: Optional[str] = None
    responsable: Optional[str] = None
    organization_id: Optional[str] = None
    
    # Campo extra calculado al vuelo para saber si hay alerta
    alerta_vencida: bool = False

    class Config:
        from_attributes = True

# ==========================================
# ENDPOINTS
# ==========================================
@router.post("", response_model=BreachResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BreachResponse, status_code=status.HTTP_201_CREATED)
async def create_breach(
    breach_data: BreachCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Registrar una nueva brecha y calcular el plazo de 72 horas"""
    # Si no envían fecha, asumimos el momento actual
    deteccion = breach_data.fecha_deteccion or datetime.utcnow()
    
    # Obligación O4: 72 horas exactas de límite
    limite = deteccion + timedelta(hours=72)
    
    new_breach = DataBreach(
        fecha_deteccion=deteccion,
        descripcion=breach_data.descripcion,
        datos_afectados=breach_data.datos_afectados,
        cantidad_afectados=breach_data.cantidad_afectados,
        gravedad=breach_data.gravedad,
        fecha_limite_notificacion=limite,
        estado=BreachState.DETECTADA,
        organization_id=breach_data.organization_id
    )
    
    db.add(new_breach)
    await db.commit()
    await db.refresh(new_breach)
    
    # Evaluar alerta
    response_data = BreachResponse.model_validate(new_breach)
    response_data.alerta_vencida = datetime.utcnow() > limite
    return response_data

@router.get("", response_model=List[BreachResponse])
@router.get("/", response_model=List[BreachResponse])
async def get_all_breaches(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Listar todas las brechas y verificar alertas de tiempo"""
    query = select(DataBreach).order_by(DataBreach.fecha_limite_notificacion.asc())
    result = await db.execute(query)
    breaches = result.scalars().all()
    
    now = datetime.utcnow()
    response_list = []
    
    for b in breaches:
        resp = BreachResponse.model_validate(b)
        # Si no ha sido notificada y ya pasó la fecha límite
        if b.estado != BreachState.NOTIFICADA and b.estado != BreachState.CERRADA:
            resp.alerta_vencida = now > b.fecha_limite_notificacion
        response_list.append(resp)
        
    return response_list

@router.patch("/{breach_id}/notify", response_model=BreachResponse)
async def mark_breach_as_notified(
    breach_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Marcar la brecha como notificada a la Agencia y detener el reloj"""
    query = select(DataBreach).where(DataBreach.id == breach_id)
    result = await db.execute(query)
    breach = result.scalar_one_or_none()
    
    if not breach:
        raise HTTPException(status_code=404, detail="Brecha no encontrada")
        
    if breach.estado == BreachState.NOTIFICADA or breach.estado == BreachState.CERRADA:
        raise HTTPException(status_code=400, detail="La brecha ya fue notificada o cerrada")

    breach.estado = BreachState.NOTIFICADA
    breach.fecha_notificacion = datetime.utcnow()
        
    await db.commit()
    await db.refresh(breach)
    
    resp = BreachResponse.model_validate(breach)
    resp.alerta_vencida = breach.fecha_notificacion > breach.fecha_limite_notificacion
    return resp

@router.patch("/{breach_id}", response_model=BreachResponse)
async def update_breach(
    breach_id: str,
    update_data: BreachUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar detalles de la investigación de la brecha"""
    query = select(DataBreach).where(DataBreach.id == breach_id)
    result = await db.execute(query)
    breach = result.scalar_one_or_none()
    
    if not breach:
        raise HTTPException(status_code=404, detail="Brecha no encontrada")
        
    if update_data.estado is not None:
        breach.estado = update_data.estado
    if update_data.medidas_tomadas is not None:
        breach.medidas_tomadas = update_data.medidas_tomadas
    if update_data.responsable is not None:
        breach.responsable = update_data.responsable
    if update_data.cantidad_afectados is not None:
        breach.cantidad_afectados = update_data.cantidad_afectados
    if update_data.gravedad is not None:
        breach.gravedad = update_data.gravedad
        
    await db.commit()
    await db.refresh(breach)
    
    resp = BreachResponse.model_validate(breach)
    if breach.estado not in [BreachState.NOTIFICADA, BreachState.CERRADA]:
        resp.alerta_vencida = datetime.utcnow() > breach.fecha_limite_notificacion
        
    return resp