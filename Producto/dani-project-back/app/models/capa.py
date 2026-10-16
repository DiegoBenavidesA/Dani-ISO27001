from sqlalchemy import Column, String, Text, Integer, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.dependencies.database import Base


class CAPAPriority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class CAPAStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "inProgress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class CAPASource(str, enum.Enum):
    INTERNAL_AUDIT = "internalAudit"
    PRE_AUDIT = "preAudit"


class CAPA(Base):
    __tablename__ = "capas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    nc_code = Column(String(20), unique=True, nullable=False)
    title = Column(String(500), nullable=False)
    root_cause = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    assignee = Column(String(200), nullable=False)
    control = Column(String(20), nullable=True)
    priority = Column(Enum(CAPAPriority), default=CAPAPriority.MEDIUM, nullable=False)
    status = Column(Enum(CAPAStatus), default=CAPAStatus.OPEN, nullable=False)
    source = Column(Enum(CAPASource), default=CAPASource.INTERNAL_AUDIT, nullable=False)
    progress = Column(Integer, default=0)
    organization_id = Column(String(36), index=True, nullable=True)  # Multi-tenant
    due_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
