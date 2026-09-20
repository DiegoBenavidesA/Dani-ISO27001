"""
Multi-tenant (N5) — Mecanismo central de aislamiento por empresa.

Enfoque elegido: **la empresa se inyecta como dependencia** (`get_current_org`,
definida en dependencies/auth.py) y cada endpoint por-empresa usa estos helpers
para no repetir código y no olvidarse de filtrar.

Patrón para un endpoint por-empresa (RECETA):

    from app.dependencies.auth import get_current_org
    from app.dependencies.tenant import scope_to_org, get_scoped_or_404

    # LISTAR -> solo lo de mi empresa
    @router.get("/")
    async def listar(org_id: str = Depends(get_current_org), db=Depends(get_db)):
        stmt = scope_to_org(select(MiModelo), MiModelo, org_id)
        return (await db.execute(stmt)).scalars().all()

    # CREAR -> se asigna la empresa automáticamente
    @router.post("/")
    async def crear(data: MiSchema, org_id: str = Depends(get_current_org), db=Depends(get_db)):
        obj = MiModelo(**data.model_dump(), organization_id=org_id)
        db.add(obj); await db.commit(); await db.refresh(obj)
        return obj

    # OBTENER / ACTUALIZAR / BORRAR por id -> solo si es de mi empresa
    @router.get("/{obj_id}")
    async def obtener(obj_id: str, org_id: str = Depends(get_current_org), db=Depends(get_db)):
        return await get_scoped_or_404(db, MiModelo, obj_id, org_id)

Regla: en un módulo por-empresa NUNCA se consulta el modelo sin pasar por
`scope_to_org` o `get_scoped_or_404`. Así el aislamiento no depende de acordarse
de escribir el .where a mano cada vez.
"""
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Se reexporta para que los endpoints importen todo desde un solo lugar.
from app.dependencies.auth import get_current_org  # noqa: F401


def scope_to_org(stmt, model, org_id: str):
    """Agrega el filtro por empresa (organization_id) a un SELECT."""
    return stmt.where(model.organization_id == org_id)


async def get_scoped_or_404(
    db: AsyncSession,
    model,
    obj_id: str,
    org_id: str,
    detail: str = "Recurso no encontrado",
):
    """
    Trae un registro por id PERO solo si pertenece a la empresa indicada.

    Si el id no existe o es de otra empresa, responde 404 (no 403), para no
    revelar siquiera que el recurso existe en otro inquilino.
    """
    result = await db.execute(
        select(model).where(model.id == obj_id, model.organization_id == org_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    return obj
