# Diagrama de Clases UML - NormIA

Este diagrama representa la estructura orientada a objetos de los modelos de base de datos SQLAlchemy del backend de NormIA, incluyendo la separación multi-tenant y los módulos de la Ley 21.719 e ISO 27001.

```mermaid
classDiagram
    %% --- Modulo Base, Tenants y Usuarios ---

    class Organization {
        +String id
        +String nombre
        +String slug
        +String identificador
        +Boolean activo
        +String plan
        +String erp_url
        +String erp_api_key
        +DateTime created_at
        +DateTime updated_at
    }

    class User {
        +String id
        +String email
        +String full_name
        +String hashed_password
        +Enum role
        +Boolean is_active
        +DateTime created_at
        +DateTime updated_at
        +DateTime last_login
        +JSON preferences
        +String push_token
        +String organization_id
    }

    class AIPrompt {
        +String id
        +String name
        +String category
        +String description
        +Text system_prompt
        +Text user_prompt_template
        +DateTime created_at
        +DateTime updated_at
    }

    %% --- Módulo Evaluaciones, Riesgos y Controles ---

    class Risk {
        +String id
        +String organization_id
        +String title
        +Text description
        +Enum category
        +Integer likelihood
        +Integer impact
        +Enum risk_level
        +Enum status
        +JSON controls
        +Text mitigation_plan
        +String owner
        +DateTime due_date
        +DateTime closed_at
        +DateTime created_at
        +String created_by
    }

    class RiskAssessment {
        +String id
        +String risk_id
        +Text ai_analysis
        +JSON recommendations
        +Float confidence_score
        +JSON controls_mapped
        +Integer version
    }

    class AssessmentAnswer {
        +String id
        +String question_id
        +String organization_id
        +String veredicto
        +Float confianza
        +Text justificacion
        +DateTime created_at
        +DateTime updated_at
    }

    class AssessmentQuestion {
        +String id
        +String marco
        +String codigo
        +String categoria
        +String nombre
        +Text pregunta
        +Text evidencia_esperada
        +Integer orden
        +DateTime created_at
    }

    class ControlStatus {
        +String id
        +String control_id
        +String organization_id
        +Boolean applies
        +String status
        +Text justification
        +Integer score
        +String document_id
        +DateTime created_at
        +DateTime updated_at
    }

    class Document {
        +String id
        +String chapter_id
        +String title
        +Text content
        +Enum status
        +String version
        +String user_id
        +Boolean generated_by_ai
        +String organization_id
        +DateTime created_at
        +DateTime updated_at
    }

    class Evidence {
        +String id
        +String organization_id
        +String title
        +Text description
        +Enum evidence_type
        +String file_url
        +String file_name
        +Integer file_size
        +String mime_type
        +JSON evidence_metadata
        +Text extracted_text
        +String indexing_status
        +Boolean is_verified
        +String verified_by
        +DateTime verified_at
        +String risk_id
        +String uploaded_by
        +DateTime created_at
        +DateTime updated_at
    }

    class EvidenceChunk {
        +String id
        +String organization_id
        +String evidence_id
        +Text content
        +Vector embedding
        +Integer chunk_index
        +DateTime created_at
    }
    
    class NormativeChunk {
        +String id
        +String document_name
        +String clause
        +Integer page_number
        +Integer chunk_index
        +Text content
        +Text raw_text
        +Vector embedding
        +DateTime created_at
    }

    class CAPA {
        +String id
        +String nc_code
        +String title
        +Text root_cause
        +Text corrective_action
        +String assignee
        +String control
        +Enum priority
        +Enum status
        +Enum source
        +Integer progress
        +String organization_id
        +DateTime due_date
        +DateTime created_at
        +DateTime updated_at
    }

    class ISOCControl {
        +String id
        +String control_id
        +String title
        +Text description
        +String category
        +String domain
        +String annex
        +String clause_reference
        +Text implementation_guide
        +JSON related_controls
        +JSON attributes
        +Boolean applies
        +String status
        +Text justification
        +Integer score
        +String document_id
    }

    class GapAnalysis {
        +String id
        +String user_id
        +String control_id
        +String clause_id
        +String clause_name
        +Text requirement
        +String current_status
        +String target_status
        +Text gap_description
        +String priority
        +String status
        +String responsible
        +DateTime target_date
        +DateTime completed_date
        +Text notes
        +Float score
        +Text ai_response
        +Text evidence_text
    }

    %% --- Módulo Ley N° 21.719 ---

    class DataTreatment {
        +String id
        +String nombre
        +Text finalidad
        +String base_licitud
        +Text categorias_datos
        +String origen
        +Text destinatarios
        +Text transferencias_internacionales
        +String plazo_conservacion
        +String responsable
        +String organization_id
        +DateTime created_at
        +DateTime updated_at
    }

    class Vendor {
        +String id
        +String nombre
        +Text datos_compartidos
        +String pais
        +Enum estado_contrato
        +String treatment_id
        +String organization_id
        +DateTime created_at
        +DateTime updated_at
    }

    class Consent {
        +String id
        +String titular
        +String titular_email
        +String acceptance_token_hash
        +String notice_version
        +Text notice_text
        +Text finalidades_consentidas
        +String treatment_id
        +DateTime fecha_otorgado
        +DateTime fecha_expiracion
        +DateTime fecha_renovacion
        +String medio
        +Enum estado
        +DateTime fecha_revocado
        +String comprobante_url
        +String organization_id
    }

    class ConsentHistory {
        +String id
        +String consent_id
        +String organization_id
        +String action
        +String actor_type
        +String actor_identifier
        +DateTime created_at
    }

    class DataBreach {
        +String id
        +DateTime fecha_deteccion
        +Text descripcion
        +String reportado_por
        +Text datos_afectados
        +Integer cantidad_afectados
        +String afectados_estimacion
        +Enum gravedad
        +JSON analisis_ia
        +String analisis_estado
        +Boolean gravedad_confirmada
        +Boolean notificacion_requerida
        +String confirmada_por
        +DateTime fecha_confirmacion
        +DateTime fecha_limite_notificacion
        +DateTime fecha_notificacion
        +Enum estado
        +Text medidas_tomadas
        +String responsable
        +Text causa_raiz
        +Text resolucion
        +String resuelta_por
        +DateTime fecha_resolucion
        +String organization_id
        +DateTime created_at
        +DateTime updated_at
    }

    class DataSubjectRequest {
        +String id
        +String titular
        +String titular_email
        +String origen
        +Enum tipo
        +Text descripcion
        +DateTime fecha_solicitud
        +DateTime fecha_limite
        +Enum estado
        +String responsable
        +Text respuesta
        +String organization_id
        +DateTime created_at
        +DateTime updated_at
    }

    class ImpactAssessment {
        +String id
        +String treatment_id
        +Enum nivel_riesgo
        +Text descripcion_riesgo
        +Text medidas_mitigacion
        +Enum estado
        +String responsable
        +String organization_id
        +DateTime created_at
        +DateTime updated_at
    }

    class LawObligation {
        +String id
        +String codigo
        +String categoria
        +String nombre
        +String referencia_legal
        +Text descripcion
        +String modulo
        +Integer orden
        +DateTime created_at
    }

    %% --- Relaciones ---
    User --> Organization : "Pertenece a"
    Risk --> Organization : "Pertenece a"
    Risk --> User : "Creado por"
    Vendor --> DataTreatment : "Asociado a"
    Vendor --> Organization : "Contratado por"
    
    AssessmentAnswer --> AssessmentQuestion : "Responde a"
    AssessmentAnswer --> Organization : "Pertenece a"
    ControlStatus --> Organization : "Estado local de"
    
    Consent --> DataTreatment : "Autoriza"
    ConsentHistory --> Consent : "Registra cambios de"
    ConsentHistory --> Organization : "Registrado en"
    ImpactAssessment --> DataTreatment : "Evalúa impacto de"

    EvidenceChunk --> Evidence : "Pertenece a"
    Evidence --> Risk : "Soporta"
    Evidence --> User : "Subida por"
    
    Document --> User : "Creado por"
    Document --> Organization : "Pertenece a"
    
    GapAnalysis --> User : "Evaluado por"