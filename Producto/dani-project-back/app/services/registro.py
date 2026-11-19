"""Registro de actividad con cadena de integridad.

`registrar(...)` se llama desde los endpoints después de una acción importante.
La IP de quien hace la petición la deja `IPMiddleware` en una variable de
contexto, así no hay que pasarla por cada endpoint.

Cada fila guarda el hash de la fila anterior de la misma empresa. Si alguien
cambia o borra una fila directamente en la base de datos, `verificar_cadena`
lo detecta al recalcular los hashes.
"""
import hashlib
from contextvars import ContextVar
from datetime import datetime

from sqlalchemy import select

from app.models.registro_actividad import RegistroActividad

ip_actual: ContextVar[str | None] = ContextVar("ip_actual", default=None)

NOMBRE_ACCION = {
    "creo": "Creó", "modifico": "Modificó", "elimino": "Eliminó", "aprobo": "Aprobó",
    "publico": "Publicó", "acepto": "Aceptó", "exporto": "Exportó", "descargo": "Descargó",
}


class IPMiddleware:
    """Guarda la IP del cliente. Detrás de Render la IP real viene en X-Forwarded-For."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            cabeceras = dict(scope.get("headers") or [])
            reenviada = cabeceras.get(b"x-forwarded-for", b"").decode("latin-1").split(",")[0].strip()
            cliente = scope.get("client")
            token = ip_actual.set(reenviada or (cliente[0] if cliente else None))
            try:
                await self.app(scope, receive, send)
            finally:
                ip_actual.reset(token)
        else:
            await self.app(scope, receive, send)


def calcular_hash(fila: RegistroActividad, hash_anterior: str | None) -> str:
    partes = [
        hash_anterior or "", fila.organization_id or "", fila.fecha.isoformat(),
        fila.usuario_email or "", fila.rol or "", fila.ip or "",
        fila.accion or "", fila.tipo_recurso or "", fila.recurso or "", fila.detalle or "",
    ]
    return hashlib.sha256("|".join(partes).encode("utf-8")).hexdigest()


async def registrar(db, org_id: str | None, usuario: dict | None, accion: str,
                    tipo_recurso: str, recurso: str, detalle: str = "") -> None:
    """Agrega una fila al registro y la guarda. Si algo falla, la acción del
    usuario ya quedó hecha: se informa en el log del servidor y se sigue."""
    if not org_id:
        return
    try:
        usuario = usuario or {}
        nombre = usuario.get("full_name")
        if not nombre and usuario.get("user_id"):
            from app.models.user import User
            nombre = (await db.execute(select(User.full_name).where(User.id == usuario["user_id"]))).scalar_one_or_none()
        anterior = (await db.execute(
            select(RegistroActividad.hash).where(RegistroActividad.organization_id == org_id)
            .order_by(RegistroActividad.fecha.desc(), RegistroActividad.id.desc()).limit(1)
        )).scalar_one_or_none()
        fila = RegistroActividad(
            organization_id=org_id, fecha=datetime.utcnow(),
            usuario_id=usuario.get("user_id"), usuario_email=usuario.get("sub"),
            usuario_nombre=nombre, rol=usuario.get("role"), ip=ip_actual.get(),
            accion=accion, tipo_recurso=tipo_recurso, recurso=(recurso or "")[:500], detalle=detalle or "",
        )
        fila.hash_anterior = anterior
        fila.hash = calcular_hash(fila, anterior)
        db.add(fila)
        await db.commit()
    except Exception as e:
        print(f"No se pudo guardar el registro de actividad ({accion} {tipo_recurso}): {e}")
        try:
            await db.rollback()
        except Exception:
            pass


def verificar_cadena(filas: list) -> dict:
    """filas en orden cronológico. Devuelve si la cadena está íntegra y, si no,
    la primera fila que no calza."""
    anterior = None
    for i, f in enumerate(filas):
        if f.hash_anterior != anterior or calcular_hash(f, anterior) != f.hash:
            return {"integra": False, "verificadas": i, "total": len(filas),
                    "primera_alterada": {"fecha": f.fecha.strftime("%d-%m-%Y %H:%M"), "recurso": f.recurso}}
        anterior = f.hash
    return {"integra": True, "verificadas": len(filas), "total": len(filas), "primera_alterada": None}
