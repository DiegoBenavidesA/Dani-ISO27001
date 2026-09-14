# app/models/__init__.py

# Importar en orden para evitar dependencias circulares SQLAlchemy
from app.models.user import User, UserRole
from app.models.risk import Risk, RiskLevel, RiskStatus, RiskCategory
from app.models.evidence import Evidence, EvidenceType
from app.models.evidence_chunk import EvidenceChunk
from app.models.assessment import RiskAssessment
from app.models.prompt import AIPrompt
from app.models.normative_chunk import NormativeChunk
from app.models.document import Document, DocumentStatus

# --- Modelos Ley N° 21.719 (protección de datos personales) ---
from app.models.data_treatment import DataTreatment                       # Tarea 1.1
from app.models.consent import Consent, ConsentState                     # Tarea 1.2
from app.models.data_subject_request import DataSubjectRequest, RequestType, RequestState  # Tarea 1.3
from app.models.data_breach import DataBreach, SeverityLevel, BreachState  # Tarea 1.4
from app.models.vendor import Vendor, ContractStatus                     # Tarea 1.5
from app.models.impact_assessment import ImpactAssessment, ImpactRiskLevel, ImpactStatus  # Tarea 1.6

__all__ = [
    "User", "UserRole",
    "Risk", "RiskLevel", "RiskStatus", "RiskCategory",
    "Evidence", "EvidenceType",
    "EvidenceChunk",
    "RiskAssessment",
    "NormativeChunk",
    "Document", "DocumentStatus",
    # Ley 21.719
    "DataTreatment",
    "Consent", "ConsentState",
    "DataSubjectRequest", "RequestType", "RequestState",
    "DataBreach", "SeverityLevel", "BreachState",
    "Vendor", "ContractStatus",
    "ImpactAssessment", "ImpactRiskLevel", "ImpactStatus",
]