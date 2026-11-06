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
        return {
            "Authorization": f"Bearer {self.service_key}",
            "apikey": self.service_key,
            "Content-Type": content_type,
        }

    async def upload(self, path: str, content: bytes, content_type: str) -> str:
        """Sube un archivo al bucket de Supabase Storage y devuelve el 'path'
        interno (lo que guardaremos en Evidence.file_url)."""
        url = f"{self.base_url}/storage/v1/object/{self.bucket}/{path}"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                content=content,
                headers={**self._headers(content_type), "x-upsert": "true"},
            )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Error subiendo a Supabase Storage: {resp.status_code} {resp.text}")
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

    def public_url(self, path: str) -> str:
        """Solo válido si el bucket es público. Para buckets privados, usar
        signed URLs (create_signed_url) en vez de esto."""
        return f"{self.base_url}/storage/v1/object/public/{self.bucket}/{path}"


storage_service = StorageService()