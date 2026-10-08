from datetime import datetime
import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.dependencies.database import Base


class ConsentHistory(Base):
    __tablename__ = "consent_history"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    consent_id = Column(
        String(36),
        ForeignKey("consents.id", ondelete="CASCADE"),
        nullable=False
    )

    organization_id = Column(
        String(36),
        ForeignKey("organizations.id"),
        nullable=False
    )

    action = Column(
        String(50),
        nullable=False
    )

    actor_type = Column(
        String(50),
        nullable=False
    )

    actor_identifier = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    consent = relationship("Consent")
    organization = relationship("Organization")