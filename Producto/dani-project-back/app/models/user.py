from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, JSON, ForeignKey
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime
from app.dependencies.database import Base

class UserRole(str, enum.Enum):
    # --- Niveles de acceso (jerarquía multi-tenant) ---
    SUPERADMIN = "superadmin"   # Plataforma: administra TODAS las empresas
    OWNER = "owner"             # Dueño de la empresa (quien la registró)
    ADMIN = "admin"             # Administrador dentro de la empresa
    EMPLOYEE = "employee"       # Usuario normal de la empresa
    # --- Roles funcionales ISO 27001 (asignables por owner/admin) ---
    MANAGER = "manager"
    AUDITOR = "auditor"
    DPO = "dpo"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    preferences = Column(JSON, default={})

    # --- Multi-tenant (N3) ---
    # Empresa a la que pertenece el usuario. Nullable por ahora para no romper
    # el login del admin existente; en N7 se hace el backfill (empresa por
    # defecto) y más adelante se puede volver obligatorio.
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True, index=True)
    organization = relationship("Organization")