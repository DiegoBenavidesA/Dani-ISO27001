# app/services/storage_service.py
# CAMBIO / ARCHIVO NUEVO:
# Reemplaza el guardado de archivos en disco local (uploads/evidence) que
# usaba app/routes/evidence.py. En Vercel el filesystem es de solo lectura
# salvo /tmp, y /tmp se borra entre invocaciones, así que los archivos no
# pueden vivir ahí permanentemente. Usamos la API REST de Supabase Storage
# directamente vía httpx (sin agregar el SDK completo de supabase-py, para
# no inflar el tamaño del bundle de la función serverless).

import httpx
from app.config import settings

class StorageError(RuntimeError):
    """Error del almacenamiento con un motivo que se puede mostrar al usuario."""


def motivo_rechazo(codigo: int, cuerpo: str) -> str:
    """Traduce la respuesta de Supabase Storage a un motivo entendible. Nunca
    incluye claves: solo el código y el mensaje que devuelve Supabase."""
    import json
    try:
        mensaje = str(json.loads(cuerpo).get("message") or "")
    except Exception:
        mensaje = (cuerpo or "")[:200]
    m = mensaje.lower()
    if "jws" in m or "jwt" in m or "invalid api key" in m or "signature" in m:
        explicacion = "La clave de Supabase no es válida. Revisa SUPABASE_SERVICE_KEY en Render."
    elif "row-level security" in m or "unauthorized" in m:
        explicacion = "La clave no tiene permiso para escribir en el bucket. Usa la clave service_role o secret, no la anon o publishable."
    elif "bucket not found" in m or (codigo == 404 and "bucket" in m):
        explicacion = "El bucket no existe. Revisa SUPABASE_STORAGE_BUCKET o créalo en Supabase."
    elif "mime" in m:
        explicacion = "El bucket no acepta este tipo de archivo. Revisa los tipos permitidos del bucket en Supabase."
    elif "size" in m or codigo == 413:
        explicacion = "El archivo supera el tamaño máximo que permite el bucket."
    else:
        explicacion = "Supabase rechazó el archivo."
    return f"{explicacion} (Supabase respondió {codigo}: {mensaje or 'sin mensaje'})"


class StorageService:
    def __init__(self):
        pass

    @property
    def base_url(self):
        return settings.SUPABASE_URL.rstrip("/")

    @property
    def service_key(self):
        return settings.SUPABASE_SERVICE_KEY

    @property
    def bucket(self):
        return settings.SUPABASE_STORAGE_BUCKET

    def _headers(self, content_type: str = "application/octet-stream") -> dict:
        cabeceras = {"apikey": self.service_key, "Content-Type": content_type}
        # La clave service_role antigua es un JWT ("eyJ...") y va también como
        # Bearer. Las claves nuevas ("sb_secret_...") no son JWT: si se mandan
        # como Bearer, Supabase las rechaza; basta con el encabezado apikey.
        if (self.service_key or "").startswith("eyJ"):
            cabeceras["Authorization"] = f"Bearer {self.service_key}"
        return cabeceras

    async def upload(self, path: str, content: bytes, content_type: str) -> str:
        """Sube un archivo al bucket de Supabase Storage y devuelve el 'path'
        interno (lo que guardaremos en Evidence.file_url)."""
        url = f"{self.base_url}/storage/v1/object/{self.bucket}/{path}"
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    url,
                    content=content,
                    headers={**self._headers(content_type), "x-upsert": "true"},
                )
        except httpx.HTTPError as e:
            raise StorageError(
                f"No se pudo conectar con Supabase ({type(e).__name__}). Revisa SUPABASE_URL y que el proyecto "
                "de Supabase no esté pausado.") from e
        if resp.status_code not in (200, 201):
            raise StorageError(motivo_rechazo(resp.status_code, resp.text))
        return path

    async def download(self, path: str) -> bytes:
        """Descarga el contenido de un archivo del bucket."""
        url = f"{self.base_url}/storage/v1/object/{self.bucket}/{path}"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=self._headers())
        if resp.status_code != 200:
            raise RuntimeError(f"Error descargando de Supabase Storage: {resp.status_code} {resp.text}")
        return resp.content

    async def delete(self, path: str) -> None:
        """Borra un archivo del bucket (si ya no existe, no es error)."""
        url = f"{self.base_url}/storage/v1/object/{self.bucket}/{path}"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.delete(url, headers=self._headers())
        if resp.status_code not in (200, 204, 404):
            raise RuntimeError(f"Error borrando de Supabase Storage: {resp.status_code} {resp.text}")

    async def exists(self, path: str) -> bool:
        url = f"{self.base_url}/storage/v1/object/info/{self.bucket}/{path}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=self._headers())
        return resp.status_code == 200

    async def check_bucket(self) -> int:
        """Código HTTP de la consulta del bucket (200 si existe y la clave sirve)."""
        url = f"{self.base_url}/storage/v1/bucket/{self.bucket}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=self._headers())
        return resp.status_code

    def public_url(self, path: str) -> str:
        """Solo válido si el bucket es público. Para buckets privados, usar
        signed URLs (create_signed_url) en vez de esto."""
        return f"{self.base_url}/storage/v1/object/public/{self.bucket}/{path}"


storage_service = StorageService()