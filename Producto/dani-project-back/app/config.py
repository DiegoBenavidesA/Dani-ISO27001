from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):

    #DeepSeepk KEY
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "DANI27001"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 240

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/dani27001"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    DEBUG: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Google Cloud (for Storage & Pub/Sub)
    # CAMBIO: estos 3 campos eran obligatorios (sin default) en pydantic-settings,
    # lo que significa que SI no defines GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS
    # y CLOUD_STORAGE_BUCKET como variables de entorno en Vercel, el backend
    # directamente NO ARRANCA (Settings() lanza ValidationError). Como vamos a
    # usar Supabase Storage en vez de GCS, los volvemos opcionales para no
    # bloquear el arranque si no los usas.
    GOOGLE_CLOUD_PROJECT: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    CLOUD_STORAGE_BUCKET: Optional[str] = None

    # CAMBIO: nuevas variables para Supabase Storage (reemplaza el guardado
    # local en disco de app/routes/evidence.py, que no funciona en serverless
    # porque el filesystem de Vercel es efímero).
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    SUPABASE_STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "evidence")

    @property
    def AI_API_KEY(self):
        return self.GROQ_API_KEY or self.DEEPSEEK_API_KEY or self.OPENAI_API_KEY

    @property
    def AI_BASE_URL(self):
        return "https://api.groq.com/openai/v1" if self.GROQ_API_KEY else "https://api.deepseek.com"

    @property
    def AI_MODEL(self):
        if self.GROQ_API_KEY:
            return "llama-3.3-70b-versatile"
        elif self.DEEPSEEK_API_KEY:
            return "deepseek-chat"
        else:
            return "deepseek-chat"

    # CORS
    # CAMBIO: agregamos tu dominio real de Vercel del frontend. Reemplaza
    # "https://TU-FRONTEND.vercel.app" por la URL real una vez que la tengas.
    # Esta lista se usa solo si en algún lugar referencias settings.CORS_ORIGINS;
    # hoy main.py tiene los orígenes hardcodeados + un allow_origin_regex que
    # ya cubre cualquier *.vercel.app (ver cambios en main.py más abajo).
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://dani-iso-27001.vercel.app/",
    ]

    # Vector Store (Pinecone/Qdrant/Chroma)
    # CAMBIO: también la volvemos opcional. No la usas activamente (usas
    # pgvector dentro de Postgres/Supabase), así que exigirla bloqueaba el
    # arranque sin motivo si no la configurabas.
    VECTOR_STORE_API_KEY: Optional[str] = None
    VECTOR_STORE_ENVIRONMENT: str = "gcp-starter"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()