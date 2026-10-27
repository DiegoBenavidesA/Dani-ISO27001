# app/routes/integrations.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

try:
    import httpx
except ImportError:
    httpx = None

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_org
from app.models.organization import Organization

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])
logger = logging.getLogger(__name__)

class IntegrationConfig(BaseModel):
    erp_url: Optional[str] = None
    erp_api_key: Optional[str] = None

@router.get("/config", response_model=IntegrationConfig)
async def get_config(
    org_id: str = Depends(get_current_org), 
    db: AsyncSession = Depends(get_db)
):
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    
    return IntegrationConfig(erp_url=org.erp_url, erp_api_key=org.erp_api_key)

@router.put("/config")
async def update_config(
    config: IntegrationConfig, 
    org_id: str = Depends(get_current_org), 
    db: AsyncSession = Depends(get_db)
):
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    
    org.erp_url = config.erp_url
    org.erp_api_key = config.erp_api_key
    
    await db.commit()
    return {"message": "Configuración de integración guardada exitosamente"}

@router.post("/test")
async def test_connection(config: IntegrationConfig):
    if not config.erp_url:
        raise HTTPException(status_code=400, detail="Debe proveer una URL para probar la conexión.")
    
    if httpx is None:
        raise HTTPException(status_code=500, detail="La librería 'httpx' no está instalada en el servidor. Ejecuta: pip install httpx")
        
    url = config.erp_url if config.erp_url.startswith("http") else f"https://{config.erp_url}"
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            headers = {"Authorization": f"Bearer {config.erp_api_key}"} if config.erp_api_key else {}
            response = await client.get(url, headers=headers)
            
            if response.status_code < 500:
                return {"status": "success", "message": f"Conexión de red exitosa. Código del ERP: {response.status_code}"}
            else:
                return {"status": "error", "message": f"El ERP respondió con un error del servidor: {response.status_code}"}
                
    except httpx.ConnectTimeout:
        raise HTTPException(status_code=408, detail="Tiempo de espera agotado. El ERP no respondió.")
    except Exception as e:
        logger.error(f"Error testeando integración ERP: {e}")
        raise HTTPException(status_code=400, detail=f"Fallo al conectar: Asegúrate de que la URL sea válida y accesible.")