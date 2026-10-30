// src/pages/GapAnalysisScreen.jsx
import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import {
  Building2, Target, Users, Lock, Sparkles, Eye,
  ChevronLeft, ChevronRight, Download, FolderUp, CheckCircle2,
  AlertCircle, Activity, Shield, Edit3, FileCheck, Globe, Wand2, Settings, Plus, Trash2, FileText
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { complianceAPI, documentsAPI, API_URL, assessmentQuestionsAPI, evidenceAPI } from '../services/api';
import { getFullGapAnalysis, getComplianceScore, analyzeDocument } from '../services/gapAnalysisAPI';
import { getControlName } from '../translations/controls';

function GapAnalysisScreen({ onNavigate }) {
  const { theme: t, language, setLanguage } = useContext(ThemeContext);
  const { user } = useAuth();
  const isAdmin = user && ['superadmin', 'owner', 'admin'].includes(user?.role);

  const tText = {
    en: { gapAnalysis: 'Gap Analysis', completeAssessment: 'Complete the assessment to generate your SOA', question: 'Question', previous: 'Previous', continue: 'Continue', yes: 'Yes', no: 'No', partially: 'Partially', soaTitle: 'Statement of Applicability (SOA)', soaApplicable: 'Applicable', soaImplemented: 'Implemented', showAll: 'All', showApplicable: 'Applicable', showNotApplicable: 'Not Applicable', control: 'Control', description: 'Description', applicable: 'Applicable', status: 'Status', justification: 'Justification', implemented: 'Implemented', planned: 'Planned', notImplemented: 'Not Implemented', required: 'Required', autoSaved: 'Auto-saved' },
    es: { gapAnalysis: 'Análisis de Brechas', completeAssessment: 'Completa la evaluación para generar tu Declaración de Aplicabilidad (SOA)', question: 'Pregunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sí', no: 'No', partially: 'Parcialmente', soaTitle: 'Declaración de Aplicabilidad (SOA)', soaApplicable: 'Aplica', soaImplemented: 'Implementado', showAll: 'Todos', showApplicable: 'Aplica', showNotApplicable: 'No Aplica', control: 'Control', description: 'Descripción', applicable: 'Aplica', status: 'Estado', justification: 'Justificación', implemented: 'Implementado', planned: 'Planificado', notImplemented: 'No Implementado', required: 'Requerido', autoSaved: 'Auto-guardado' },
    pt: { gapAnalysis: 'Análise de Lacunas', completeAssessment: 'Complete a avaliação para gerar sua Declaração de Aplicabilidade (SOA)', question: 'Pergunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sim', no: 'Não', partially: 'Parcialmente', soaTitle: 'Declaração de Aplicabilidade (SOA)', soaApplicable: 'Aplicável', soaImplemented: 'Implementado', showAll: 'Todos', showApplicable: 'Aplicável', showNotApplicable: 'Não Aplicável', control: 'Controle', description: 'Descrição', applicable: 'Aplicável', status: 'Status', justification: 'Justificativa', implemented: 'Implementado', planned: 'Planejado', notImplemented: 'Não Implementado', required: 'Obrigatório', autoSaved: 'Auto-salvo' }
  }[language] || { gapAnalysis: 'Análisis de Brechas', completeAssessment: 'Completa la evaluación para generar tu Declaración de Aplicabilidad (SOA)', question: 'Pregunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sí', no: 'No', partially: 'Parcialmente', soaTitle: 'Declaración de Aplicabilidad (SOA)', soaApplicable: 'Aplica', soaImplemented: 'Implementado', showAll: 'Todos', showApplicable: 'Aplica', showNotApplicable: 'No Aplica', control: 'Control', description: 'Descripción', applicable: 'Aplica', status: 'Estado', justification: 'Justificación', implemented: 'Implementado', planned: 'Planificado', notImplemented: 'No Implementado', required: 'Requerido', autoSaved: 'Auto-guardado' };

  const [activeMainTab, setActiveMainTab] = useState('assessment');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showAllPhases, setShowAllPhases] = useState(false);
  const [answers, setAnswers] = useState(() => { try { return JSON.parse(localStorage.getItem('dani_gap_answers') || '{}'); } catch { return {}; } });
  const [controls, setControls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterApplicable, setFilterApplicable] = useState('all');
  const [showJustificationModal, setShowJustificationModal] = useState(null);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [showAIAuditModal, setShowAIAuditModal] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isBulkAuditing, setIsBulkAuditing] = useState(false);
  const [selectedControls, setSelectedControls] = useState(new Set());
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showBulkDocModal, setShowBulkDocModal] = useState(false);
  const [bulkAuditProgress, setBulkAuditProgress] = useState({ done: 0, total: 0 });
  const [isBulkSelectionAuditing, setIsBulkSelectionAuditing] = useState(false);
  const [fullAnalysis, setFullAnalysis] = useState(null);
  const [overallScore, setOverallScore] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  
  const [docText, setDocText] = useState('');
  const [docName, setDocName] = useState('');
  const [docAnalysisResult, setDocAnalysisResult] = useState(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [docAnalysisError, setDocAnalysisError] = useState(null);

  const [dbQuestions, setDbQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState(null);
  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // Documentos GUARDADOS en el Centro de Evidencias (persisten por empresa) y
  // selección de cuáles usar para la evaluación con IA.
  const [savedDocs, setSavedDocs] = useState([]);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState(null);
  const [evalInfo, setEvalInfo] = useState(null);
  const [aiResults, setAiResults] = useState(() => { try { return JSON.parse(localStorage.getItem('dani_gap_ai_results') || '{}'); } catch { return {}; } });

  useEffect(() => { try { localStorage.setItem('dani_gap_answers', JSON.stringify(answers)); } catch {} }, [answers]);
  useEffect(() => { try { localStorage.setItem('dani_gap_ai_results', JSON.stringify(aiResults)); } catch {} }, [aiResults]);

  // Si Render está despertando, reintentar sin borrar las preguntas ya cargadas.
  const loadQuestions = async () => {
    setQuestionsLoading(true);
    setQuestionsError(null);
    const esperas = [0, 3000, 8000, 15000];
    for (let i = 0; i < esperas.length; i++) {
      if (esperas[i]) await new Promise((resolve) => setTimeout(resolve, esperas[i]));
      try {
        const data = await assessmentQuestionsAPI.getAll();
        setDbQuestions(Array.isArray(data) ? data : []);
        setQuestionsLoading(false);
        return;
      } catch (err) {
        console.warn(`Error al cargar preguntas (intento ${i + 1})`, err);
      }
    }
    setQuestionsError('No se pudieron cargar las preguntas. Revisa tu conexión e inténtalo de nuevo.');
    setQuestionsLoading(false);
  };
  useEffect(() => { loadQuestions(); }, []);

  const clauseNum = (codigo) => (codigo || '').split('.')[0];
  const categoryOf = (q) => String(q.categoria || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Los apartados originales provienen de una guía RGPD (AEPD). La agrupación
  // es organizativa: NO certifica equivalencia jurídica con la Ley 21.719.
  const privacyAreaNames = ['Principios del tratamiento', 'Licitud y consentimiento', 'Datos especiales e identificación', 'Derechos de los titulares', 'Responsabilidad y gestión', 'Seguridad y brechas', 'Evaluaciones de impacto', 'Transferencias internacionales', 'Otros temas de privacidad'];
  const privacySections = [
    { guiFrom: 1, guiTo: 17, excelFrom: 1, excelTo: 17, area: 0, section: 'Principios relativos al tratamiento' },
    { guiFrom: 18, guiTo: 23, excelFrom: 18, excelTo: 23, area: 1, section: 'Licitud del tratamiento' },
    { guiFrom: 24, guiTo: 34, excelFrom: 24, excelTo: 34, area: 1, section: 'Condiciones para el consentimiento' },
    { guiFrom: 35, guiTo: 36, excelFrom: 35, excelTo: 36, area: 1, section: 'Consentimiento de niños y adolescentes' },
    { guiFrom: 37, guiTo: 50, excelFrom: 37, excelTo: 49, area: 2, section: 'Datos personales sensibles y especiales' },
    { guiFrom: 51, guiTo: 53, excelFrom: 50, excelTo: 52, area: 2, section: 'Datos sobre condenas e infracciones penales' },
    { guiFrom: 54, guiTo: 58, excelFrom: 53, excelTo: 57, area: 2, section: 'Tratamientos que no requieren identificación' },
    { guiFrom: 59, guiTo: 74, excelFrom: 58, excelTo: 73, area: 3, section: 'Transparencia de la información' },
    { guiFrom: 75, guiTo: 87, excelFrom: 74, excelTo: 86, area: 3, section: 'Información al obtener datos del titular' },
    { guiFrom: 88, guiTo: 115, excelFrom: 87, excelTo: 114, area: 3, section: 'Información cuando los datos provienen de terceros' },
    { guiFrom: 116, guiTo: 127, excelFrom: 115, excelTo: 126, area: 3, section: 'Derecho de acceso' },
    { guiFrom: 128, guiTo: 129, excelFrom: 127, excelTo: 128, area: 3, section: 'Derecho de rectificación' },
    { guiFrom: 130, guiTo: 135, excelFrom: 129, excelTo: 134, area: 3, section: 'Derecho de supresión' },
    { guiFrom: 136, guiTo: 140, excelFrom: 135, excelTo: 139, area: 3, section: 'Limitación del tratamiento' },
    { guiFrom: 141, guiTo: 141, excelFrom: 140, excelTo: 140, area: 3, section: 'Información ante rectificación, supresión o limitación' },
    { guiFrom: 142, guiTo: 145, excelFrom: 141, excelTo: 144, area: 3, section: 'Portabilidad de los datos' },
    { guiFrom: 146, guiTo: 148, excelFrom: 145, excelTo: 147, area: 3, section: 'Derecho de oposición' },
    { guiFrom: 149, guiTo: 159, excelFrom: 148, excelTo: 158, area: 3, section: 'Decisiones automatizadas y elaboración de perfiles' },
    { guiFrom: 160, guiTo: 165, excelFrom: 159, excelTo: 164, area: 4, section: 'Responsabilidad del responsable' },
    { guiFrom: 166, guiTo: 172, excelFrom: 165, excelTo: 171, area: 4, section: 'Protección de datos desde el diseño y por defecto' },
    { guiFrom: 173, guiTo: 176, excelFrom: 172, excelTo: 175, area: 4, section: 'Corresponsables del tratamiento' },
    { guiFrom: 177, guiTo: 190, excelFrom: 176, excelTo: 189, area: 4, section: 'Encargados del tratamiento' },
    { guiFrom: 191, guiTo: 198, excelFrom: 190, excelTo: 197, area: 4, section: 'Registro de actividades de tratamiento (RoPA)' },
    { guiFrom: 199, guiTo: 205, excelFrom: 198, excelTo: 204, area: 5, section: 'Seguridad del tratamiento' },
    { guiFrom: 206, guiTo: 213, excelFrom: 205, excelTo: 212, area: 5, section: 'Notificación de brechas a la autoridad' },
    { guiFrom: 214, guiTo: 215, excelFrom: 213, excelTo: 214, area: 5, section: 'Comunicación de brechas a los titulares' },
    { guiFrom: 216, guiTo: 233, excelFrom: 215, excelTo: 232, area: 6, section: 'Evaluación de impacto de protección de datos' },
    { guiFrom: 234, guiTo: 248, excelFrom: 233, excelTo: 247, area: 4, section: 'Delegado de protección de datos' },
    { guiFrom: 249, guiTo: 268, excelFrom: 248, excelTo: 267, area: 7, section: 'Transferencias internacionales' },
  ];
  const pdfExcelTitles = {1: 'Finalidades determinadas', 2: 'Finalidades explícitas', 3: 'Finalidades legítimas', 4: 'Compatibilidad de finalidades', 5: 'Exactitud de los datos', 6: 'Actualización de datos', 7: 'Rectificación de datos inexactos', 8: 'Supresión de datos inexactos', 9: 'Conservación limitada', 10: 'Archivo de interés público', 11: 'Investigación científica', 12: 'Investigación histórica', 13: 'Tratamiento estadístico', 14: 'Integridad y confidencialidad', 15: 'Prevención de accesos ilícitos', 16: 'Prevención de pérdida o daño', 17: 'Trazabilidad de finalidades', 18: 'Consentimiento por finalidad', 19: 'Ejecución contractual', 20: 'Obligación legal', 21: 'Protección de intereses vitales', 22: 'Interés público', 23: 'Intereses legítimos', 24: 'Prueba del consentimiento', 25: 'Prueba de obligación legal', 26: 'Consentimiento separado', 27: 'Consentimiento comprensible', 28: 'Lenguaje claro', 29: 'Información previa', 30: 'Facilidad para retirar consentimiento', 31: 'Retiro en cualquier momento', 32: 'Consentimiento libre', 33: 'Datos mínimos para servicios', 34: 'Datos mínimos para contratos', 35: 'Consentimiento de menores', 36: 'Verificación de autorización parental', 37: 'Excepciones para datos sensibles', 38: 'Consentimiento explícito', 39: 'Obligaciones laborales', 40: 'Convenios colectivos', 41: 'Protección de intereses vitales', 42: 'Actividades legítimas de entidades', 43: 'Comunicación a terceros', 44: 'Datos publicados por el titular', 45: 'Defensa de reclamaciones', 46: 'Tratamientos sanitarios y sociales', 47: 'Interés público en salud', 48: 'Archivo e investigación', 49: 'Datos genéticos, biométricos y salud', 50: 'Datos penales bajo supervisión', 51: 'Habilitación para datos penales', 52: 'Registro de condenas penales', 53: 'Minimización de datos identificativos', 54: 'Evitar identificación innecesaria', 55: 'Verificación de anonimización', 56: 'Información ante reidentificación', 57: 'Supresión tras identificación', 58: 'Facilitar información al titular', 59: 'Transparencia y claridad', 60: 'Lenguaje comprensible', 61: 'Medios de información', 62: 'Información verbal e identidad', 63: 'Facilitar ejercicio de derechos', 64: 'Solicitudes sin identificación previa', 65: 'Respuesta a solicitudes', 66: 'Prórroga por complejidad', 67: 'Comunicación de prórroga', 68: 'Ejercicio electrónico de derechos', 69: 'Respuesta por medios electrónicos', 70: 'Motivos de rechazo y reclamación', 71: 'Gratuidad del ejercicio', 72: 'Verificación de identidad', 73: 'Iconos y lectura automática', 74: 'Identidad del responsable', 75: 'Contacto del delegado', 76: 'Finalidad y base jurídica', 77: 'Información sobre interés legítimo', 78: 'Destinatarios de datos', 79: 'Plazos de conservación', 80: 'Información sobre derechos', 81: 'Retiro del consentimiento', 82: 'Derecho a reclamar', 83: 'Cesiones por requisito legal', 84: 'Cesiones para contratos', 85: 'Decisiones automatizadas', 86: 'Cambios de finalidad', 87: 'Responsable y representante', 88: 'Contacto del delegado', 89: 'Finalidades del tratamiento', 90: 'Base jurídica del tratamiento', 91: 'Categorías de datos', 92: 'Destinatarios y categorías', 93: 'Plazo de conservación', 94: 'Criterios de conservación', 95: 'Intereses legítimos', 96: 'Derecho de acceso', 97: 'Derecho de rectificación', 98: 'Derecho de supresión', 99: 'Derecho de limitación', 100: 'Derecho de oposición', 101: 'Derecho de portabilidad', 102: 'Retiro del consentimiento', 103: 'Derecho a reclamar', 104: 'Origen de los datos', 105: 'Fuentes públicas', 106: 'Plazo para informar', 107: 'Información al contactar', 108: 'Información antes de comunicar', 109: 'Información por nueva finalidad', 110: 'Excepción por información conocida', 111: 'Excepción por imposibilidad', 112: 'Excepción por perjuicio a fines', 113: 'Excepción por habilitación legal', 114: 'Excepción por secreto profesional', 115: 'Acceso a finalidades', 116: 'Acceso a categorías de datos', 117: 'Acceso a destinatarios', 118: 'Acceso a plazos de conservación', 119: 'Acceso a criterios de conservación', 120: 'Acceso a rectificación y supresión', 121: 'Acceso a limitación', 122: 'Acceso a oposición', 123: 'Acceso a reclamación', 124: 'Acceso al origen de datos', 125: 'Entrega de copia de datos', 126: 'Formato electrónico de respuesta', 127: 'Rectificación sin demora', 128: 'Completar datos incompletos', 129: 'Supresión por fin cumplido', 130: 'Supresión tras retirar consentimiento', 131: 'Supresión por oposición', 132: 'Supresión por ilicitud', 133: 'Supresión por obligación legal', 134: 'Supresión de datos de servicios digitales', 135: 'Limitación por exactitud discutida', 136: 'Limitación por tratamiento ilícito', 137: 'Limitación para reclamaciones', 138: 'Limitación por oposición', 139: 'Aviso de levantamiento de limitación', 140: 'Comunicación de rectificación y supresión', 141: 'Portabilidad en formato estructurado', 142: 'Portabilidad por contrato o consentimiento', 143: 'Portabilidad de tratamientos automatizados', 144: 'Transmisión directa de datos', 145: 'Atención al derecho de oposición', 146: 'Excepciones al derecho de oposición', 147: 'Oposición por medios automatizados', 148: 'Límites a decisiones automatizadas', 149: 'Decisiones necesarias para contrato', 150: 'Decisiones con habilitación legal', 151: 'Decisiones con consentimiento explícito', 152: 'Salvaguardas ante automatización', 153: 'Intervención humana y revisión', 154: 'Impugnación de decisiones', 155: 'Perfiles con datos sensibles y consentimiento', 156: 'Perfiles con datos sensibles y habilitación', 157: 'Información sobre decisiones automatizadas', 158: 'Protección en perfiles con datos sensibles', 159: 'Responsabilidad demostrable', 160: 'Evaluación de riesgos de privacidad', 161: 'Medidas técnicas y organizativas', 162: 'Revisión de medidas', 163: 'Políticas de protección de datos', 164: 'Aplicación de políticas', 165: 'Medidas antes del diseño', 166: 'Privacidad desde el diseño', 167: 'Aplicación de medidas', 168: 'Eficacia de las medidas', 169: 'Minimización por defecto', 170: 'Alcance y conservación por defecto', 171: 'Acceso restringido por defecto', 172: 'Acuerdo entre corresponsables', 173: 'Obligaciones de información compartidas', 174: 'Funciones entre corresponsables', 175: 'Disponibilidad del acuerdo', 176: 'Selección de encargados', 177: 'Autorización de subencargados', 178: 'Contrato con el encargado', 179: 'Contenido del contrato', 180: 'Instrucciones documentadas', 181: 'Confidencialidad del personal', 182: 'Medidas de seguridad contractuales', 183: 'Condiciones para subencargados', 184: 'Asistencia en derechos de titulares', 185: 'Devolución o supresión de datos', 186: 'Cooperación en auditorías', 187: 'Obligaciones de subencargados', 188: 'Contrato por escrito', 189: 'Acceso bajo instrucciones', 190: 'Registro de tratamientos', 191: 'Identificación de responsables', 192: 'Finalidades registradas', 193: 'Categorías de titulares y datos', 194: 'Categorías de destinatarios', 195: 'Transferencias internacionales', 196: 'Plazos de supresión', 197: 'Medidas de seguridad registradas', 198: 'Evaluación del riesgo y la tecnología', 199: 'Seguridad proporcional al riesgo', 200: 'Confidencialidad, integridad y disponibilidad', 201: 'Restauración ante incidentes', 202: 'Evaluación periódica de controles', 203: 'Riesgos de destrucción y acceso', 204: 'Instrucciones para personal autorizado', 205: 'Gestión de brechas de seguridad', 206: 'Aviso del encargado al responsable', 207: 'Notificación a autoridad en 72 horas', 208: 'Justificación de retrasos', 209: 'Notificación por etapas', 210: 'Registro de brechas', 211: 'Documentación de efectos y medidas', 212: 'Prueba del procedimiento de aviso', 213: 'Comunicación de brechas de alto riesgo', 214: 'Claridad en aviso de brechas', 215: 'Asesoramiento del delegado', 216: 'Evaluación previa de impacto', 217: 'Impacto en datos sensibles a gran escala', 218: 'Impacto por observación sistemática', 219: 'Impacto en tratamientos señalados', 220: 'Descripción de tratamientos y fines', 221: 'Necesidad y proporcionalidad', 222: 'Riesgos para derechos y libertades', 223: 'Medidas de conformidad', 224: 'Salvaguardas y mitigación', 225: 'Revisión de evaluaciones', 226: 'Consulta previa a autoridad', 227: 'Responsabilidades en la consulta', 228: 'Fines y medios en la consulta', 229: 'Garantías comunicadas a autoridad', 230: 'Contacto del delegado', 231: 'Entrega de evaluación de impacto', 232: 'Información adicional a autoridad', 233: 'Designación legal del delegado', 234: 'Idoneidad del delegado', 235: 'Publicación de contacto del delegado', 236: 'Participación del delegado', 237: 'Respaldo institucional', 238: 'Recursos y acceso del delegado', 239: 'Actualización de conocimientos', 240: 'Independencia del delegado', 241: 'Protección frente a sanciones', 242: 'Reporte a alta dirección', 243: 'Atención a titulares', 244: 'Confidencialidad del delegado', 245: 'Prevención de conflictos de interés', 246: 'Asesoría y formación', 247: 'Cooperación con autoridad', 248: 'Transferencias a países adecuados', 249: 'Vigencia de decisiones de adecuación', 250: 'Garantías exigibles de transferencia', 251: 'Acuerdos vinculantes entre autoridades', 252: 'Normas corporativas vinculantes', 253: 'Cláusulas tipo de la Comisión', 254: 'Cláusulas aprobadas por autoridad', 255: 'Códigos de conducta para transferencias', 256: 'Certificación de garantías', 257: 'Cláusulas con autorización previa', 258: 'Acuerdos administrativos', 259: 'Transferencias sin adecuación', 260: 'Consentimiento informado de transferencia', 261: 'Transferencia por necesidad contractual', 262: 'Transferencia para reclamaciones', 263: 'Transferencia por intereses vitales', 264: 'Intereses legítimos imperiosos', 265: 'Transferencias no repetitivas', 266: 'Evaluación de circunstancias y garantías', 267: 'Información a autoridad de control'};

  const isPrivacyQuestion = (q) => {
    const code = String(q.codigo || '').toUpperCase();
    const category = categoryOf(q);
    return /^(GUIALIST|PRIV|RGPD|GDPR)-\d+$/i.test(code) ||
      category.includes('privacidad') || category.includes('proteccion de datos') ||
      category.includes('proteccio n de datos') || category.includes('datos personales') ||
      category.includes('rgpd') || category.includes('gdpr') ||
      category.includes('tratamiento') || category.includes('consentimiento') ||
      category.includes('derechos del interesado') || category.includes('der echos del interesado') ||
      category.includes('transferencias a paises') ||
      /\bley\s*21[.\s]*719\b/.test(category) || /\bley\s*21719\b/.test(category);
  };

  const privacyLocation = (q) => {
    const code = String(q.codigo || '').toUpperCase().trim();
    const m = code.match(/^(GUIALIST|PRIV|RGPD|GDPR)-(\d+)$/);
    if (m) {
      const number = Number(m[2]);
      // Los códigos GUIALIST saltan números; PRIV y RGPD son secuenciales.
      const isImportedExcel = m[1] !== 'PRIV' || pdfExcelTitles[number] === String(q.nombre || '').trim();
      if (!isImportedExcel) return { area: privacyAreaNames[8], section: 'Otras preguntas PRIV (revisar origen)', sectionOrder: 35 };
      const rangeStart = m[1] === 'GUIALIST' ? 'guiFrom' : 'excelFrom';
      const rangeEnd = m[1] === 'GUIALIST' ? 'guiTo' : 'excelTo';
      const index = privacySections.findIndex((s) => number >= s[rangeStart] && number <= s[rangeEnd]);
      if (index !== -1) return { area: privacyAreaNames[privacySections[index].area], section: privacySections[index].section, sectionOrder: index };
    }
    // Preguntas de privacidad que no provienen de las 267/265 del PDF.
    const cat = categoryOf(q);
    if (code === 'O1' || cat.includes('registro de actividades') || cat.includes('ropa'))
      return { area: privacyAreaNames[4], section: 'Registro de actividades de tratamiento (RoPA)', sectionOrder: 22 };
    if (cat.includes('consentimiento') || cat.includes('licitud'))
      return { area: privacyAreaNames[1], section: 'Otras preguntas de consentimiento y licitud', sectionOrder: 30 };
    if (cat.includes('derecho') || cat.includes('transparencia'))
      return { area: privacyAreaNames[3], section: 'Otros derechos de los titulares', sectionOrder: 31 };
    if (cat.includes('seguridad') || cat.includes('brecha'))
      return { area: privacyAreaNames[5], section: 'Otras preguntas de seguridad', sectionOrder: 32 };
    if (cat.includes('transferencia'))
      return { area: privacyAreaNames[7], section: 'Otras transferencias', sectionOrder: 33 };
    return { area: privacyAreaNames[8], section: 'Preguntas adicionales de privacidad', sectionOrder: 34 };
  };

  const isISOCategory = (q, fragment) => !isPrivacyQuestion(q) && categoryOf(q).includes(fragment);
  const isClause = (q) => !isPrivacyQuestion(q) && categoryOf(q).startsWith('clausula');

  const phaseDefs = [
    { id: 'context',  name: 'Contexto y Liderazgo', clause: 'Cláusulas 4 y 5', icon: Building2, color: '#3b82f6', match: (q) => isClause(q) && ['4', '5'].includes(clauseNum(q.codigo)) },
    { id: 'planning', name: 'Planificación y Riesgo', clause: 'Cláusula 6', icon: Target, color: '#004ac6', match: (q) => isClause(q) && clauseNum(q.codigo) === '6' },
    { id: 'support',  name: 'Soporte, Operación y Mejora', clause: 'Cláusulas 7 a 10', icon: Users, color: '#f59e0b', match: (q) => isClause(q) && ['7', '8', '9', '10'].includes(clauseNum(q.codigo)) },
    { id: 'org',      name: 'Anexo A — Organizacional', clause: 'Controles A.5', icon: Shield, color: '#a855f7', match: (q) => isISOCategory(q, 'organizacional') },
    { id: 'people',   name: 'Anexo A — Personas', clause: 'Controles A.6', icon: Users, color: '#ec4899', match: (q) => isISOCategory(q, 'persona') },
    { id: 'phys',     name: 'Anexo A — Físico', clause: 'Controles A.7', icon: Lock, color: '#06b6d4', match: (q) => isISOCategory(q, 'fisic') },
    { id: 'tech',     name: 'Anexo A — Tecnológico', clause: 'Controles A.8', icon: Globe, color: '#8b5cf6', match: (q) => isISOCategory(q, 'tecnologic') },
    { id: 'ley',      name: 'Ley 21.719 — Privacidad', clause: 'Protección de Datos', icon: Eye, color: '#14b8a6', match: isPrivacyQuestion },
  ];

  const phases = useMemo(() => {
    const matchedIds = new Set();
    const result = phaseDefs.map((def) => {
      const matched = dbQuestions.filter((q) => !matchedIds.has(q.id) && def.match(q));
      matched.forEach((q) => matchedIds.add(q.id));
      if (def.id === 'ley') {
        matched.sort((a, b) => {
          const x = privacyLocation(a), y = privacyLocation(b);
          const ai = privacyAreaNames.indexOf(x.area), bi = privacyAreaNames.indexOf(y.area);
          if (ai !== bi) return ai - bi;
          if (x.sectionOrder !== y.sectionOrder) return x.sectionOrder - y.sectionOrder;
          return (a.orden ?? 0) - (b.orden ?? 0) || String(a.codigo).localeCompare(String(b.codigo), undefined, { numeric: true });
        });
      } else matched.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      return {
        id: def.id, name: def.name, clause: def.clause, icon: def.icon, color: def.color,
        questions: matched.map((q) => ({
          id: q.id, title: `${q.codigo} — ${q.nombre}`, question: q.pregunta,
          codigo: q.codigo, options: [tText.yes, tText.partially, tText.no],
          critical: isClause(q), evidencia: q.evidencia_esperada,
          ...(def.id === 'ley' ? privacyLocation(q) : {}),
        })),
      };
    }).filter((p) => p.id === 'ley' || p.questions.length > 0);

    // Funcionalidad incorporada desde main: las categorías realmente desconocidas
    // siguen teniendo una fase propia. Las GUIALIST y PRIV no caen aquí.
    const byCat = {};
    dbQuestions.filter((q) => !matchedIds.has(q.id)).forEach((q) => {
      const cat = q.categoria || 'General';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(q);
    });
    Object.entries(byCat).forEach(([cat, qs]) => {
      qs.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      result.push({
        id: `extra-${cat.toLowerCase().replace(/\s+/g, '-')}`,
        name: cat, clause: `${qs.length} preguntas`, icon: FileCheck, color: '#6366f1',
        questions: qs.map((q) => ({
          id: q.id, title: `${q.codigo} — ${q.nombre}`, question: q.pregunta,
          codigo: q.codigo, options: [tText.yes, tText.partially, tText.no],
          critical: false, evidencia: q.evidencia_esperada,
        })),
      });
    });
    return result;
  }, [dbQuestions, language]);

  const loadISOControls = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await complianceAPI.getControls(token);
      if (data.controls) {
        setControls(data.controls.map(c => ({
          id: c.id, name: c.name, category: c.category || 'Organizational', applicable: c.applicable !== undefined ? c.applicable : true,
          status: c.status === 'implemented' ? 'implemented' : (c.status === 'planned' ? 'planned' : 'notImplemented'), justification: c.justification || ''
        })));
      }
    } catch (error) { setError(error.message); } finally { setIsLoading(false); }
  };
  
  useEffect(() => { loadISOControls(); }, []);

  const loadAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      const [analysis, score] = await Promise.all([getFullGapAnalysis(), getComplianceScore()]);
      setFullAnalysis(analysis); setOverallScore(score);
    } catch (error) { console.error(error); } finally { setIsLoadingAnalysis(false); }
  };
  useEffect(() => { loadAnalysis(); }, []);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const data = await documentsAPI.getPublishedPolicies(localStorage.getItem('token'));
        if (data?.policies) setAvailableDocs(data.policies);
      } catch (error) { console.error(error); }
    };
    loadDocs();
  }, []);

  const totalQuestions = phases.reduce((sum, p) => sum + p.questions.length, 0);
  const answeredCount = phases.reduce((count, p) => count + p.questions.filter(q => answers[q.id]).length, 0);
  const globalProgress = totalQuestions > 0 ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;
  
  const getPhaseProgress = (idx) => {
    const phase = phases[idx];
    if (!phase || phase.questions.length === 0) return 0;
    const answered = phase.questions.filter(q => answers[q.id]).length;
    return Math.round((answered / phase.questions.length) * 100);
  };
  
  const currentPhaseData = phases[currentPhase];
  const currentQuestionData = currentPhaseData?.questions[currentQuestion];

  const privacyAreaOptions = useMemo(() => {
    const ley = phases.find((p) => p.id === 'ley');
    if (!ley) return [];
    return privacyAreaNames.map((area) => ({ area, count: ley.questions.filter((q) => q.area === area).length }))
      .filter((entry) => entry.count > 0);
  }, [phases]);
  const activePrivacyArea = currentPhaseData?.id === 'ley' ? currentQuestionData?.area : null;
  const activePrivacySection = currentPhaseData?.id === 'ley' ? currentQuestionData?.section : null;
  const privacySectionOptions = useMemo(() => {
    if (currentPhaseData?.id !== 'ley' || !activePrivacyArea) return [];
    const counts = new Map();
    currentPhaseData.questions.filter((q) => q.area === activePrivacyArea).forEach((q) => {
      counts.set(q.section, (counts.get(q.section) || 0) + 1);
    });
    return [...counts].map(([section, count]) => ({ section, count }));
  }, [currentPhaseData, activePrivacyArea]);

  const jumpToPrivacy = (area, section = null) => {
    const idx = currentPhaseData?.questions.findIndex((q) => q.area === area && (!section || q.section === section));
    if (idx >= 0) setCurrentQuestion(idx);
  };

  // Evita índices obsoletos si las preguntas se cargan o cambian de agrupación.
  useEffect(() => {
    if (currentPhase >= phases.length && phases.length > 0) {
      setCurrentPhase(0);
      setCurrentQuestion(0);
    } else if (currentPhaseData && currentQuestion >= currentPhaseData.questions.length) {
      setCurrentQuestion(0);
    }
  }, [phases, currentPhase, currentQuestion, currentPhaseData]);


  // Autoguardado de Justo + protección frente a cambios durante una petición.
  // Se conservan los IDs de preguntas y controles; no se modifican datos en BD al cargar.
  const [saveStatus, setSaveStatus] = useState('idle');
  const dirtyVersionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const savingPromiseRef = useRef(null);
  const latestSnapshotRef = useRef({ controls, answers });
  latestSnapshotRef.current = { controls, answers };

  const markDirty = () => {
    dirtyVersionRef.current += 1;
    setSaveStatus('pending');
  };

  const saveLatestProgress = async () => {
    if (savingPromiseRef.current) return savingPromiseRef.current;
    const operation = (async () => {
      setIsSaving(true);
      setSaveStatus('saving');
      try {
        // Si se responde otra pregunta mientras se guarda, persiste también
        // el estado más reciente antes de mostrar «Cambios guardados».
        while (savedVersionRef.current < dirtyVersionRef.current) {
          const version = dirtyVersionRef.current;
          const snapshot = latestSnapshotRef.current;
          await complianceAPI.fullAssessment({ controls: snapshot.controls, answers: snapshot.answers });
          savedVersionRef.current = version;
        }
        setSaveStatus('saved');
        await loadAnalysis();
        return true;
      } catch (err) {
        console.warn('No se pudo guardar el progreso', err);
        setSaveStatus('error');
        return false;
      } finally {
        setIsSaving(false);
      }
    })();
    savingPromiseRef.current = operation;
    try { return await operation; }
    finally { savingPromiseRef.current = null; }
  };

  // Esperar 1,5 segundos después de cada edición manual antes de guardar.
  useEffect(() => {
    if (dirtyVersionRef.current <= savedVersionRef.current) return;
    const timer = setTimeout(() => { void saveLatestProgress(); }, 1500);
    return () => clearTimeout(timer);
  }, [controls, answers]);

  useEffect(() => {
    const warnIfPending = (event) => {
      if (dirtyVersionRef.current > savedVersionRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warnIfPending);
    return () => window.removeEventListener('beforeunload', warnIfPending);
  }, []);

  const handleAnswer = (answer) => {
    if (!currentQuestionData) return;
    markDirty();
    setAnswers((prev) => ({ ...prev, [currentQuestionData.id]: answer }));
    setTimeout(() => goToNext(), 300);
  };
  const goToNext = () => {
    if (currentQuestion < currentPhaseData.questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    else if (currentPhase < phases.length - 1) { setCurrentPhase(currentPhase + 1); setCurrentQuestion(0); }
    else setActiveMainTab('soa');
  };
  const goToPrev = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
    else if (currentPhase > 0) { setCurrentPhase(currentPhase - 1); setCurrentQuestion(phases[currentPhase - 1].questions.length - 1); }
  };

  const handleSaveProgress = async () => {
    markDirty();
    const ok = await saveLatestProgress();
    if (!ok) alert('No se pudo guardar el progreso. Revisa la conexión y vuelve a intentarlo.');
  };

  const veredictoToOption = (veredicto) => {
    if (veredicto === 'cumple') return tText.yes;
    if (veredicto === 'parcial') return tText.partially;
    return tText.no;
  };

  // Documentos guardados (Centro de Evidencias) para evaluar desde ahí.
  const loadSavedDocs = async () => {
    try {
      const data = await evidenceAPI.getAll();
      setSavedDocs(Array.isArray(data) ? data : []);
    } catch (e) { console.warn('No se pudieron cargar los documentos guardados', e); }
  };
  useEffect(() => { loadSavedDocs(); }, []);

  // Subir documentos: se GUARDAN en el Centro de Evidencias (persisten por
  // empresa, los ve todo el equipo y la IA los indexa). Luego quedan listos
  // para seleccionarlos y evaluar.
  const handleUploadDocs = async (fileList) => {
    const nuevos = Array.from(fileList || []);
    if (!nuevos.length) return;
    setUploadingDocs(true); setEvalError(null); setEvalInfo(null);
    try {
      for (const file of nuevos) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('source', 'Evaluación IA');
        await evidenceAPI.upload(fd);
      }
      await loadSavedDocs();
      setEvalInfo(`${nuevos.length} documento(s) guardado(s) en el Centro de Evidencias. Ya puedes seleccionarlos y evaluar.`);
    } catch (e) {
      setEvalError('Error al guardar el documento: ' + (e.message || e));
    } finally {
      setUploadingDocs(false);
    }
  };

  const toggleEvidence = (id) => {
    setSelectedEvidenceIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ==========================================
  // SUPER-EVALUADOR DE IA (ACTUALIZA SOA Y ROPA)
  // ==========================================
  const handleEvaluateWithAI = async (revalidate = false) => {
    setEvalError(null); setEvalInfo(null);
    if (!selectedEvidenceIds.length) { setEvalError('Selecciona al menos un documento guardado antes de evaluar.'); return; }

    let ids = [];
    if (revalidate) {
      phases.forEach((p) => p.questions.forEach((q) => { if (answers[q.id] !== tText.yes) ids.push(q.id); }));
      if (ids.length === 0) { setEvalInfo('No hay preguntas pendientes.'); return; }
    }

    setIsEvaluating(true);
    try {
      const resp = await assessmentQuestionsAPI.evaluate([], ids, selectedEvidenceIds);
      
      // 1. Mapeo de respuestas a la vista de preguntas
      const newAnswers = { ...answers };
      const newAI = { ...aiResults };
      (resp.results || []).forEach((r) => {
        newAnswers[r.id] = veredictoToOption(r.veredicto);
        newAI[r.id] = { veredicto: r.veredicto, confianza: r.confianza, justificacion: r.justificacion };
      });
      setAnswers(newAnswers);
      setAiResults(newAI);

      // 2. Mapeo ultra-preciso hacia la SOA
      const questionMap = {};
      phases.forEach(p => p.questions.forEach(q => { questionMap[q.id] = q.codigo; }));
      
      const updatedControls = [...controls];
      (resp.results || []).forEach(r => {
        const ctrlCode = questionMap[r.id];
        if (!ctrlCode) return;
        
        // Match exacto ignorando letras (ej. "A.5.1" -> "51", "5.1" -> "51")
        const normCode = ctrlCode.replace(/[^0-9]/g, ''); 
        
        const cIdx = updatedControls.findIndex(c => {
            const normCId = c.id.replace(/[^0-9]/g, '');
            // Para evitar cruces, validamos si la pregunta trae una 'A' al principio (Anexo A)
            const isAnnexQuestion = ctrlCode.toLowerCase().includes('a');
            const isAnnexControl = c.id.toLowerCase().includes('a');
            if (isAnnexQuestion !== isAnnexControl) return false;
            
            return normCId === normCode;
        });

        if (cIdx !== -1) {
            let newStatus = 'notImplemented';
            if (r.veredicto === 'cumple') newStatus = 'implemented';
            else if (r.veredicto === 'parcial') newStatus = 'planned';
            updatedControls[cIdx] = {
                ...updatedControls[cIdx], 
                applicable: true, 
                status: newStatus, 
                justification: r.justificacion || updatedControls[cIdx].justificacion
            };
        }
      });
      
      // Activar cambios visuales en React
      setControls(updatedControls);

      // 3. Guardar la evaluación de IA y los controles SOA con el mismo mecanismo.
      latestSnapshotRef.current = { controls: updatedControls, answers: newAnswers };
      markDirty();
      const aiSaved = await saveLatestProgress();
      if (!aiSaved) setEvalError('La evaluación terminó, pero no se pudo guardar. Usa «Guardar progreso» para reintentar.');

      // 4. Envío masivo automático al Registro RoPA
      let tratamientosAgregados = 0;
      if (resp.extracted_treatments && resp.extracted_treatments.length > 0) {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/api/treatments/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(resp.extracted_treatments)
            });
            tratamientosAgregados = resp.extracted_treatments.length;
        } catch(e) { console.error("Error guardando RoPA", e); }
      }

      // 5. Informe final visual
      let finalMsg = `✅ IA evaluó ${resp.total} preguntas y actualizó los controles de la SOA.\n\n`;
      if (tratamientosAgregados > 0) finalMsg += `🎯 Extrajo ${tratamientosAgregados} tratamientos nuevos y los inyectó en tu registro RoPA!\n`;
      
      if (aiSaved) {
        alert(finalMsg);
        setEvalInfo(finalMsg);
      } else {
        setEvalInfo('La IA terminó de evaluar, pero hay cambios pendientes de guardar.');
      }
      
    } catch (e) {
      setEvalError(e.message || 'Error al evaluar con IA.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const toggleApplicable = (id) => { markDirty(); setControls(prev => prev.map(c => c.id === id ? { ...c, applicable: !c.applicable } : c)); };
  const updateStatus = (id, status) => { markDirty(); setControls(prev => prev.map(c => c.id === id ? { ...c, status } : c)); };
  const updateJustification = (id, justification) => { markDirty(); setControls(prev => prev.map(c => c.id === id ? { ...c, justification } : c)); setShowJustificationModal(null); };

  const filteredControls = Array.isArray(controls) ? controls.filter(c => {
    if (filterApplicable === 'applicable') return c.applicable;
    if (filterApplicable === 'notApplicable') return !c.applicable;
    return true;
  }) : [];

  const sortedFilteredControls = [...filteredControls].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'id') cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
    else if (sortBy === 'name') cmp = getControlName(a.id, language).localeCompare(getControlName(b.id, language));
    else if (sortBy === 'applicable') cmp = (a.applicable === b.applicable) ? 0 : a.applicable ? -1 : 1;
    else if (sortBy === 'audited') cmp = (!!a.justification === !!b.justification) ? 0 : a.justification ? -1 : 1;
    return sortDir === 'asc' ? cmp : -cmp;
  });
  
  const totalPages = Math.ceil(sortedFilteredControls.length / pageSize) || 1;
  const pagedControls = sortedFilteredControls.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const appliesCount = Array.isArray(controls) ? controls.filter(c => c.applicable).length : 0;
  const implementedCount = Array.isArray(controls) ? controls.filter(c => c.applicable && c.status === 'implemented').length : 0;

  const CustomCheckbox = ({ checked, onChange }) => (
    <div role="checkbox" aria-checked={checked} onClick={onChange} style={{ width: '12px', height: '12px', borderRadius: '3px', flexShrink: 0, border: `1.5px solid ${checked ? '#8b5cf6' : t.textDim}`, background: checked ? '#8b5cf6' : 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s, background 0.15s' }}>
      {checked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
  );

  const InteractiveSOA = () => (
    <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden', marginTop: '24px' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{tText.soaTitle}</h3>
          <p style={{ fontSize: '12px', color: t.textDim }}>{appliesCount} {tText.soaApplicable} • {implementedCount} {tText.soaImplemented}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'all', label: tText.showAll },
            { id: 'applicable', label: tText.showApplicable },
            { id: 'notApplicable', label: tText.showNotApplicable }
          ].map((filter) => (
            <button key={filter.id} onClick={() => { setFilterApplicable(filter.id); setCurrentPage(1); }} style={{ padding: '6px 14px', background: filterApplicable === filter.id ? '#004ac620' : 'transparent', border: `1px solid ${filterApplicable === filter.id ? '#004ac6' : t.border}`, borderRadius: '20px', color: filterApplicable === filter.id ? '#004ac6' : t.textMuted, fontSize: '12px', cursor: 'pointer' }}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tabla de escritorio; en móvil los controles se presentan como tarjetas. */}
      <div className="soa-table-scroll normia-soa-desktop" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: t.inputBg }}>
              <th style={{ padding: '12px 12px', width: '36px', textAlign: 'center' }}></th>
              <th onClick={() => handleSort('id')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: t.textDim, width: '62px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                {tText.control} <span style={{ opacity: sortBy === 'id' ? 1 : 0.3 }}>{sortBy === 'id' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
              </th>
              <th onClick={() => handleSort('name')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: t.textDim, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                {tText.description} <span style={{ opacity: sortBy === 'name' ? 1 : 0.3 }}>{sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
              </th>
              <th onClick={() => handleSort('applicable')} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: t.textDim, width: '130px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                {tText.applicable}? <span style={{ opacity: sortBy === 'applicable' ? 1 : 0.3 }}>{sortBy === 'applicable' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: t.textDim, width: '135px' }}>{tText.status}</th>
              <th onClick={() => handleSort('audited')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: t.textDim, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                {tText.justification} <span style={{ opacity: sortBy === 'audited' ? 1 : 0.3 }}>{sortBy === 'audited' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedControls.map((control) => (
              <tr key={control.id} style={{ borderBottom: `1px solid ${t.border}`, background: selectedControls.has(control.id) ? `${t.inputBg}` : 'transparent' }}>
                <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                  <CustomCheckbox checked={selectedControls.has(control.id)} onChange={() => { const newSel = new Set(selectedControls); selectedControls.has(control.id) ? newSel.delete(control.id) : newSel.add(control.id); setSelectedControls(newSel); }} />
                </td>
                <td style={{ padding: '11px 16px' }}><span style={{ fontSize: '13px', fontWeight: 700, color: '#8b5cf6' }}>{control.id}</span></td>
                <td style={{ padding: '11px 16px' }}><div style={{ fontSize: '13px', color: t.text, lineHeight: 1.35 }}>{getControlName(control.id, language)}</div><span style={{ fontSize: '11px', color: t.textDim }}>{control.category}</span></td>
                <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                    <button onClick={() => toggleApplicable(control.id)} style={{ padding: '5px 10px', background: control.applicable ? '#004ac620' : 'transparent', border: `1px solid ${control.applicable ? '#004ac6' : t.border}`, borderRadius: '5px 0 0 5px', color: control.applicable ? '#004ac6' : t.textDim, fontSize: '11px', cursor: 'pointer' }}>{tText.applicable}</button>
                    <button onClick={() => toggleApplicable(control.id)} style={{ padding: '5px 10px', background: !control.applicable ? '#ef444420' : 'transparent', border: `1px solid ${!control.applicable ? '#ef4444' : t.border}`, borderRadius: '0 5px 5px 0', color: !control.applicable ? '#ef4444' : t.textDim, fontSize: '11px', cursor: 'pointer' }}>No</button>
                  </div>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  {control.applicable && (
                    <select value={control.status} onChange={(e) => updateStatus(control.id, e.target.value)} style={{ padding: '5px 10px', background: 'transparent', borderRadius: '6px', color: t.text, fontSize: '12px', cursor: 'pointer', width: '100%' }}>
                      <option value="implemented">{tText.implemented}</option>
                      <option value="planned">{tText.planned}</option>
                      <option value="notImplemented">{tText.notImplemented}</option>
                    </select>
                  )}
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: control.justification ? t.textMuted : '#ef4444', fontStyle: control.justification ? 'normal' : 'italic' }}>{control.justification || tText.required}</span>
                    <button onClick={() => setShowJustificationModal(control)} title="Editar manualmente" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: t.textDim }}><Edit3 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="normia-soa-mobile" aria-label="Controles SOA en formato móvil">
        {pagedControls.length === 0 && (
          <p style={{ padding: '18px', fontSize: '13px', color: t.textDim }}>No hay controles para este filtro.</p>
        )}
        {pagedControls.map((control) => (
          <article key={control.id} style={{ padding: '16px', borderBottom: `1px solid ${t.border}`, background: selectedControls.has(control.id) ? t.inputBg : 'transparent', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0, paddingTop: '2px', cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedControls.has(control.id)} onChange={() => {
                  setSelectedControls((prev) => {
                    const next = new Set(prev);
                    if (next.has(control.id)) next.delete(control.id);
                    else next.add(control.id);
                    return next;
                  });
                }} aria-label={`Seleccionar control ${control.id}`} style={{ accentColor: '#004ac6', width: '17px', height: '17px' }} />
              </label>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#8b5cf6', marginBottom: '5px' }}>{control.id}</div>
                <h4 style={{ fontSize: '14px', fontWeight: 750, lineHeight: 1.4, color: t.text, margin: '0 0 4px', overflowWrap: 'anywhere' }}>{getControlName(control.id, language)}</h4>
                <span style={{ fontSize: '11px', color: t.textDim }}>{control.category}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted, marginBottom: '7px' }}>{tText.applicable}?</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                  <button type="button" aria-pressed={control.applicable} onClick={() => { if (!control.applicable) toggleApplicable(control.id); }} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${control.applicable ? '#004ac6' : t.border}`, background: control.applicable ? '#004ac620' : t.cardBg, color: control.applicable ? '#004ac6' : t.text, fontWeight: 650, cursor: 'pointer' }}>{tText.applicable}</button>
                  <button type="button" aria-pressed={!control.applicable} onClick={() => { if (control.applicable) toggleApplicable(control.id); }} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${!control.applicable ? '#ef4444' : t.border}`, background: !control.applicable ? '#ef444420' : t.cardBg, color: !control.applicable ? '#dc2626' : t.text, fontWeight: 650, cursor: 'pointer' }}>No aplica</button>
                </div>
              </div>

              {control.applicable && (
                <div>
                  <label htmlFor={`normia-soa-status-${control.id}`} style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.textMuted, marginBottom: '7px' }}>{tText.status}</label>
                  <select id={`normia-soa-status-${control.id}`} value={control.status} onChange={(e) => updateStatus(control.id, e.target.value)} style={{ width: '100%', minWidth: 0, padding: '11px', border: `1px solid ${t.border}`, borderRadius: '8px', background: t.inputBg, color: t.text, fontSize: '13px' }}>
                    <option value="implemented">{tText.implemented}</option>
                    <option value="planned">{tText.planned}</option>
                    <option value="notImplemented">{tText.notImplemented}</option>
                  </select>
                </div>
              )}

              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted, marginBottom: '7px' }}>{tText.justification}</div>
                <p style={{ margin: '0 0 8px', fontSize: '12px', lineHeight: 1.5, color: control.justification ? t.text : '#dc2626', overflowWrap: 'anywhere' }}>{control.justification || tText.required}</p>
                <button type="button" onClick={() => setShowJustificationModal(control)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.text, fontSize: '12px', fontWeight: 650, cursor: 'pointer' }}><Edit3 size={14} /> Editar justificación</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* La paginación funciona en ambas vistas y permite llegar a los 93 controles. */}
      <div className="normia-soa-pagination" style={{ padding: '14px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: t.textDim }}>
          {sortedFilteredControls.length === 0 ? '0 controles' : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, sortedFilteredControls.length)} de ${sortedFilteredControls.length} controles`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <label htmlFor="normia-soa-page-size" style={{ fontSize: '12px', color: t.textDim }}>Por página</label>
          <select id="normia-soa-page-size" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '7px', border: `1px solid ${t.border}`, borderRadius: '7px', background: t.inputBg, color: t.text }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} style={{ padding: '8px 10px', border: `1px solid ${t.border}`, borderRadius: '7px', background: t.cardBg, color: t.text, opacity: currentPage <= 1 ? 0.4 : 1, cursor: 'pointer' }} aria-label="Página anterior"><ChevronLeft size={15} /></button>
          <span style={{ fontSize: '12px', color: t.text, whiteSpace: 'nowrap' }}>{currentPage} / {totalPages}</span>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} style={{ padding: '8px 10px', border: `1px solid ${t.border}`, borderRadius: '7px', background: t.cardBg, color: t.text, opacity: currentPage >= totalPages ? 0.4 : 1, cursor: 'pointer' }} aria-label="Página siguiente"><ChevronRight size={15} /></button>
        </div>
      </div>

      <div style={{ padding: '10px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#004ac6' }}>
        <CheckCircle2 size={14} /><span>{tText.autoSaved}</span>
      </div>

      {showJustificationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ background: t.cardBg, borderRadius: '16px', padding: 'clamp(14px, 4vw, 24px)', width: '500px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', minWidth: 0 }}>
            <h3 style={{ marginBottom: '16px' }}>{tText.justification}</h3>
            <textarea defaultValue={showJustificationModal.justification} rows={4} style={{ width: '100%', minWidth: 0, padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '14px', marginBottom: '16px' }} id="justification-textarea" />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowJustificationModal(null)} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => { const textarea = document.getElementById('justification-textarea'); updateJustification(showJustificationModal.id, textarea.value); }} style={{ padding: '8px 16px', background: '#004ac6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ResultadosView = () => {
    const getScoreColor = (s) => s >= 85 ? '#004ac6' : s >= 70 ? '#f59e0b' : '#ef4444';
    if (isLoadingAnalysis) return <div style={{ padding: '80px', textAlign: 'center', color: t.textDim }}>Calculando análisis...</div>;

    const score = overallScore?.overall_score ?? 0;
    const gap = overallScore?.gap_to_certification ?? 100;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
        <div className="normia-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', minWidth: 0 }}>
          <div style={{ background: t.cardBg, border: `2px solid ${getScoreColor(score)}40`, borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', fontWeight: 800, color: getScoreColor(score), lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: '13px', color: t.textDim, marginTop: '10px' }}>Cumplimiento General</div>
          </div>
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>85%</div>
            <div style={{ fontSize: '13px', color: t.textDim, marginTop: '10px' }}>Meta ISO 27001</div>
          </div>
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{gap}%</div>
            <div style={{ fontSize: '13px', color: t.textDim, marginTop: '10px' }}>Brecha restante</div>
          </div>
        </div>
      </div>
    );
  };

  const AnalizarDocView = () => (
    <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>
      Vista de análisis de documentos.
    </div>
  );

  const QuestionsAdminView = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingQ, setEditingQ] = useState(null);
    const [formData, setFormData] = useState({ codigo: '', categoria: 'Organizacional', nombre: '', pregunta: '', evidencia_esperada: '', orden: 0 });
    const [isSavingQ, setIsSavingQ] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [visibleMobileQuestions, setVisibleMobileQuestions] = useState(25);

    const handleImportExcel = async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      setImporting(true);
      setImportResult(null);
      try {
        const res = await assessmentQuestionsAPI.bulkImport(file);
        setImportResult(res);
        await loadQuestions();
      } catch (err) {
        setImportResult({ error: err.message });
      } finally {
        setImporting(false);
      }
    };

    const handleImportPdf = async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      setImporting(true);
      setImportResult(null);
      try {
        const res = await assessmentQuestionsAPI.bulkImportPdf(file);
        setImportResult(res);
        await loadQuestions();
      } catch (err) {
        setImportResult({ error: err.message });
      } finally {
        setImporting(false);
      }
    };

    const handleDownloadTemplate = async () => {
      try { await assessmentQuestionsAPI.downloadTemplate(); }
      catch (err) { alert('No se pudo descargar la plantilla: ' + err.message); }
    };

    const handleOpenModal = (q = null) => {
      if (q) {
        setEditingQ(q.id);
        setFormData({ codigo: q.codigo, categoria: q.categoria, nombre: q.nombre, pregunta: q.pregunta, evidencia_esperada: q.evidencia_esperada || '', orden: q.orden });
      } else {
        setEditingQ(null);
        setFormData({ codigo: '', categoria: 'Organizacional', nombre: '', pregunta: '', evidencia_esperada: '', orden: 0 });
      }
      setShowModal(true);
    };

    const handleSaveQuestion = async (e) => {
      e.preventDefault();
      setIsSavingQ(true);
      try {
        if (editingQ) await assessmentQuestionsAPI.update(editingQ, formData);
        else await assessmentQuestionsAPI.create(formData);
        await loadQuestions();
        setShowModal(false);
      } catch (err) { alert("Error al guardar la pregunta: " + err.message); } finally { setIsSavingQ(false); }
    };

    const handleDeleteQuestion = async (id) => {
      if (!window.confirm("¿Seguro que deseas eliminar esta pregunta?")) return;
      try { await assessmentQuestionsAPI.delete(id); await loadQuestions(); } catch (err) { alert("Error al eliminar la pregunta"); }
    };

    return (
      <div style={{ marginTop: '24px' }}>
        <div className="normia-admin-header" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', alignItems: 'flex-start', minWidth: 0 }}>
          <div style={{ minWidth: 0, flex: '1 1 240px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text, overflowWrap: 'anywhere' }}>Configuración del Cuestionario</h2>
            <p style={{ fontSize: '13px', color: t.textDim }}>Agrega, edita o elimina preguntas de la base de evaluación ISO 27001 y Ley 21.719.</p>
          </div>
          <div className="normia-admin-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 0 }}>
          <button onClick={handleDownloadTemplate} title="Descargar plantilla Excel" style={{ padding: '10px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Download size={16} /> Plantilla
          </button>
          <label title="Importar preguntas desde Excel (.xlsx)" style={{ padding: '10px 16px', background: 'transparent', border: `1px solid #004ac6`, borderRadius: '8px', color: '#004ac6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: importing ? 'wait' : 'pointer' }}>
            <FolderUp size={16} /> {importing ? 'Importando…' : 'Importar Excel'}
            <input type="file" accept=".xlsx,.xlsm" onChange={handleImportExcel} disabled={importing} style={{ display: 'none' }} />
          </label>
          <label title="Importar preguntas desde un PDF (checklist/listado)" style={{ padding: '10px 16px', background: 'transparent', border: `1px solid #004ac6`, borderRadius: '8px', color: '#004ac6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: importing ? 'wait' : 'pointer' }}>
            <FileText size={16} /> {importing ? 'Importando…' : 'Importar PDF'}
            <input type="file" accept=".pdf" onChange={handleImportPdf} disabled={importing} style={{ display: 'none' }} />
          </label>
          <button onClick={() => handleOpenModal()} style={{ padding: '10px 16px', background: '#004ac6', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Plus size={16} /> Nueva Pregunta
          </button>
          </div>
        </div>

        {importResult && (
          <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '12px', border: `1px solid ${importResult.error ? '#ef4444' : '#004ac6'}`, background: t.cardBg, color: t.text, fontSize: '13px' }}>
            {importResult.error ? (
              <span style={{ color: '#ef4444' }}>❌ {importResult.error}</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span><strong style={{ color: '#004ac6' }}>✓ {importResult.creadas}</strong> preguntas creadas · <strong>{importResult.omitidas}</strong> omitidas (de {importResult.total_filas_datos ?? importResult.total_detectadas} detectadas).</span>
                {importResult.columnas_detectadas && (
                  <span style={{ color: t.textDim, fontSize: '12px' }}>
                    Columnas detectadas: {Object.entries(importResult.columnas_detectadas).map(([k, v]) => `${k} ← "${v}"`).join('  ·  ')}
                  </span>
                )}
                {importResult.categorias && (
                  <span style={{ color: t.textDim, fontSize: '12px' }}>
                    Categorías detectadas: {Object.entries(importResult.categorias).map(([k, v]) => `${k} (${v})`).join('  ·  ')}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="normia-admin-desktop" style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: t.inputBg, fontSize: '12px', color: t.textDim, textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px' }}>Código</th>
                <th style={{ padding: '14px 20px' }}>Categoría</th>
                <th style={{ padding: '14px 20px' }}>Pregunta</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dbQuestions.map(q => (
                <tr key={q.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#8b5cf6', fontSize: '13px' }}>{q.codigo}</td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: t.textDim }}>{q.categoria}</td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: t.text }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{q.nombre}</div>
                    <div style={{ color: t.textDim }}>{q.pregunta}</div>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenModal(q)} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: t.textMuted, padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Edit3 size={14} /></button>
                      <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* En teléfonos se reemplaza la tabla de cuatro columnas por tarjetas completas. */}
        <div className="normia-admin-mobile" style={{ display: 'none' }}>
          <p style={{ fontSize: '12px', color: t.textDim, margin: '0 0 12px' }}>
            {dbQuestions.length} preguntas registradas · mostrando {Math.min(visibleMobileQuestions, dbQuestions.length)}
          </p>
          <div style={{ display: 'grid', gap: '12px' }}>
            {dbQuestions.slice(0, visibleMobileQuestions).map((q) => (
              <article key={q.id} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '16px', minWidth: 0, overflowWrap: 'anywhere' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 750, color: '#8b5cf6' }}>{q.codigo}</span>
                  <span style={{ fontSize: '11px', color: t.textMuted, background: t.inputBg, borderRadius: '7px', padding: '5px 8px', maxWidth: '100%', overflowWrap: 'anywhere' }}>{q.categoria}</span>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.45, color: t.text, margin: '0 0 8px', overflowWrap: 'anywhere' }}>{q.nombre}</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.55, color: t.textDim, margin: '0 0 14px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{q.pregunta}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                  <button type="button" onClick={() => handleOpenModal(q)} style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '7px', padding: '10px', border: `1px solid ${t.border}`, borderRadius: '8px', background: t.inputBg, color: t.text, fontSize: '12px', fontWeight: 650, cursor: 'pointer', minWidth: 0 }}><Edit3 size={15} /> Editar</button>
                  <button type="button" onClick={() => handleDeleteQuestion(q.id)} style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '7px', padding: '10px', border: '1px solid #ef444455', borderRadius: '8px', background: 'transparent', color: '#dc2626', fontSize: '12px', fontWeight: 650, cursor: 'pointer', minWidth: 0 }}><Trash2 size={15} /> Eliminar</button>
                </div>
              </article>
            ))}
          </div>
          {visibleMobileQuestions < dbQuestions.length && (
            <button type="button" onClick={() => setVisibleMobileQuestions((n) => n + 25)} style={{ display: 'block', width: '100%', marginTop: '14px', padding: '12px', borderRadius: '9px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.text, fontSize: '13px', fontWeight: 650, cursor: 'pointer' }}>
              Mostrar 25 preguntas más
            </button>
          )}
        </div>

        {/* Modal Formulario */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' }}>
            <div style={{ background: t.cardBg, borderRadius: '16px', padding: 'clamp(14px, 4vw, 24px)', width: '600px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', minWidth: 0 }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', color: t.text }}>{editingQ ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
              <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="normia-admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', display: 'block' }}>Código (Ej. 4.1 o A.5.1)</label>
                    <input required value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', display: 'block' }}>Categoría</label>
                    <select required value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box' }}>
                      <option value="Cláusula 4">Cláusula 4</option>
                      <option value="Cláusula 5">Cláusula 5</option>
                      <option value="Cláusula 6">Cláusula 6</option>
                      <option value="Cláusula 7">Cláusula 7</option>
                      <option value="Cláusula 8">Cláusula 8</option>
                      <option value="Cláusula 9">Cláusula 9</option>
                      <option value="Cláusula 10">Cláusula 10</option>
                      <option value="Organizacional">Anexo A - Organizacional</option>
                      <option value="Personas">Anexo A - Personas</option>
                      <option value="Físico">Anexo A - Físico</option>
                      <option value="Tecnológico">Anexo A - Tecnológico</option>
                      <option value="Privacidad">Ley 21.719 - Privacidad</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', display: 'block' }}>Nombre Corto</label>
                  <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', display: 'block' }}>Pregunta para el Evaluador</label>
                  <textarea required value={formData.pregunta} onChange={e => setFormData({...formData, pregunta: e.target.value})} rows="3" style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', display: 'block' }}>Evidencia Esperada (Instrucción para la IA)</label>
                  <textarea value={formData.evidencia_esperada} onChange={e => setFormData({...formData, evidencia_esperada: e.target.value})} rows="2" style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                <div className="normia-admin-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" disabled={isSavingQ} style={{ padding: '10px 16px', background: '#004ac6', border: 'none', borderRadius: '8px', color: 'white', cursor: isSavingQ ? 'wait' : 'pointer' }}>{isSavingQ ? 'Guardando...' : 'Guardar Pregunta'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="normia-gap" style={{ maxWidth: '1360px', margin: '-32px auto 0', padding: '10px 28px 48px', width: '100%', minWidth: 0, boxSizing: 'border-box', color: t.text }}>
      <style>{`
        .normia-admin-header > *, .normia-admin-toolbar > * { min-width: 0; }
        .normia-admin-mobile { display: none !important; }
        .normia-admin-desktop { display: block; }
        @media (max-width: 700px) {
          .normia-admin-header { flex-direction: column; align-items: stretch !important; }
          .normia-admin-header > div:first-child { flex: auto !important; }
          .normia-admin-toolbar { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; justify-content: stretch !important; align-items: stretch !important; }
          .normia-admin-toolbar > button, .normia-admin-toolbar > label { width: 100%; min-width: 0; padding: 11px 8px !important; font-size: 12px; justify-content: center; text-align: center; overflow-wrap: anywhere; }
          .normia-admin-desktop { display: none !important; }
          .normia-admin-mobile { display: block !important; min-width: 0; }
          .normia-admin-form-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .normia-admin-form-actions > button { flex: 1 1 120px; }
        }
        .normia-gap, .normia-gap * { box-sizing: border-box; }
        .normia-gap { max-width: 100%; min-width: 0; }
        .normia-gap > * { min-width: 0; }
        .normia-soa-mobile { display: none; }
        .normia-results-grid > * { min-width: 0; }
        @media (max-width: 800px) {
          .normia-results-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .normia-results-grid > * { padding: 22px !important; }
        }
        @media (max-width: 640px) {
          .normia-soa-desktop { display: none !important; }
          .normia-soa-mobile { display: block; min-width: 0; }
          .normia-soa-pagination { padding: 12px !important; }
          .normia-gap { overflow-x: clip; }
          .normia-gap-nav { min-width: 0; }
        }
        .normia-gap-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
        .normia-gap-nav { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
        .normia-gap-nav button { white-space: nowrap; }
        .normia-gap-workspace { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 320px); align-items: start; gap: 18px; }
        .normia-gap-workspace > * { min-width: 0; }
        .normia-gap-phase-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; }
        .normia-gap-phase-grid button { min-width: 0; }
        .normia-gap-choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .normia-gap-doc-name { min-width: 0; overflow-wrap: anywhere; line-height: 1.4; }
        .normia-gap-doc-list { scrollbar-width: thin; }
        .normia-gap-card { min-width: 0; }
        @media (max-width: 1200px) {
          .normia-gap { padding: 20px !important; }
          .normia-gap-workspace { grid-template-columns: minmax(0, 1fr) minmax(255px, 290px); gap: 14px; }
        }
        @media (max-width: 1040px) {
          .normia-gap-workspace { grid-template-columns: minmax(0, 1fr); }
          .normia-gap-phase-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .normia-gap { padding: 16px !important; }
          .normia-gap-header { flex-direction: column; }
          .normia-gap-choices { grid-template-columns: minmax(0, 1fr); }
          .normia-gap-phase-grid { grid-template-columns: minmax(0, 1fr); }
          .normia-gap-question-card { padding: 18px !important; }
        }
      `}</style>

      {/* Título y navegación en líneas separadas: no compiten por el mismo espacio */}
      <header className="normia-gap-header" style={{ marginBottom: '18px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 750, letterSpacing: '1.2px', color: '#004ac6', textTransform: 'uppercase', marginBottom: '6px' }}>Cumplimiento normativo</div>
          <h1 style={{ fontSize: 'clamp(23px, 2.4vw, 29px)', fontWeight: 750, lineHeight: 1.2, margin: 0, color: t.text }}>{tText.gapAnalysis}</h1>
          <p style={{ margin: '7px 0 0', fontSize: '13px', lineHeight: 1.5, color: t.textDim }}>{tText.completeAssessment}</p>
        </div>
      </header>

      <nav className="normia-gap-nav" aria-label="Pestañas de Análisis de Brechas" style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: '12px', marginBottom: '18px' }}>
        {[
          { id: 'assessment', label: 'Evaluación' },
          { id: 'soa', label: 'SOA' },
          { id: 'resultados', label: 'Resultados', Icon: Activity },
          ...(isAdmin ? [{ id: 'admin-questions', label: 'Preguntas', Icon: Settings }] : []),
        ].map(({ id, label, Icon }) => (
          <button key={id} type="button" onClick={() => setActiveMainTab(id)} aria-current={activeMainTab === id ? 'page' : undefined}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '9px 15px', borderRadius: '9px', background: activeMainTab === id ? '#004ac6' : 'transparent', border: `1px solid ${activeMainTab === id ? '#004ac6' : t.border}`, color: activeMainTab === id ? '#fff' : t.text, fontSize: '12px', fontWeight: 650, cursor: 'pointer' }}>
            {Icon && <Icon size={15} />}{label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button type="button" onClick={handleSaveProgress} disabled={isSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', background: t.cardBg, color: t.text, border: `1px solid ${t.border}`, borderRadius: '9px', cursor: isSaving ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 650, opacity: isSaving ? .6 : 1 }}>
          <FileCheck size={15} />{isSaving ? 'Guardando...' : 'Guardar progreso'}
        </button>
        {saveStatus !== 'idle' && (
          <span role="status" style={{ fontSize: '12px', fontWeight: 650, color: saveStatus === 'error' ? '#dc2626' : t.textDim }}>
            {saveStatus === 'saved' ? '✓ Cambios guardados' : saveStatus === 'error' ? 'No se pudo guardar · Reintentar con el botón' : saveStatus === 'saving' ? 'Guardando...' : 'Cambios pendientes...'}
          </span>
        )}
      </nav>

      {activeMainTab === 'assessment' ? (
        <>
          {/* Progreso de respuestas, NO puntuación de cumplimiento */}
          <section style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '13px', padding: '14px 18px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '9px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: t.text }}>Avance del cuestionario</div>
                <div style={{ color: t.textDim, fontSize: '12px', marginTop: '3px' }}>{answeredCount} de {totalQuestions} preguntas respondidas · No representa el nivel de cumplimiento</div>
              </div>
              <strong style={{ color: '#004ac6', fontSize: '21px', whiteSpace: 'nowrap' }}>{globalProgress}%</strong>
            </div>
            <div role="progressbar" aria-valuenow={globalProgress} aria-valuemin={0} aria-valuemax={100} style={{ height: '7px', background: t.inputBg, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${globalProgress}%`, height: '100%', background: '#004ac6', borderRadius: '10px', transition: 'width .25s' }} />
            </div>
          </section>

          {questionsLoading && <div style={{ padding: '28px', color: t.textDim, textAlign: 'center' }}>Cargando preguntas desde la base de datos...</div>}
          {!questionsLoading && questionsError && (
            <div role="alert" style={{ padding: '14px', color: '#dc2626', background: 'rgba(239,68,68,.07)', borderRadius: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <span>{questionsError}</span>
              <button type="button" onClick={loadQuestions} style={{ padding: '8px 14px', border: '1px solid #dc2626', borderRadius: '8px', background: t.cardBg, color: '#dc2626', cursor: 'pointer' }}>Reintentar</button>
            </div>
          )}
          {!questionsLoading && phases.length === 0 && !questionsError && <div style={{ padding: '28px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.cardBg }}>Todavía no hay preguntas configuradas.</div>}

          {!questionsLoading && phases.length > 0 && (
            <>
              {/* Selector compacto: sustituye el panel largo y el resumen repetido */}
              <section style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '13px', padding: '13px 16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', minWidth: 0 }}>
                    <Shield size={16} color="#004ac6" />
                    <label htmlFor="normia-gap-phase-select" style={{ fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', color: t.text }}>Fase</label>
                    <select id="normia-gap-phase-select" value={currentPhase} onChange={(e) => { setCurrentPhase(Number(e.target.value)); setCurrentQuestion(0); }} style={{ flex: 1, minWidth: 0, maxWidth: '400px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '9px 10px', color: t.text, fontSize: '12px', cursor: 'pointer' }}>
                      {phases.map((phase, idx) => <option key={phase.id} value={idx}>{phase.name}</option>)}
                    </select>
                  </div>
                  <span style={{ color: t.textDim, fontSize: '12px' }}>{currentPhaseData?.questions.length ? `${getPhaseProgress(currentPhase)}% de la fase respondida` : 'Sin preguntas cargadas'}</span>
                  <button type="button" onClick={() => setShowAllPhases((v) => !v)} aria-expanded={showAllPhases} style={{ border: `1px solid ${t.border}`, borderRadius: '8px', padding: '9px 11px', color: t.text, background: t.cardBg, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                    {showAllPhases ? 'Ocultar fases' : 'Ver todas las fases'}
                  </button>
                </div>
                {showAllPhases && (
                  <div className="normia-gap-phase-grid" style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${t.border}` }}>
                    {phases.map((phase, idx) => {
                      const Icon = phase.icon;
                      const progress = getPhaseProgress(idx);
                      return (
                        <button type="button" key={phase.id} onClick={() => { setCurrentPhase(idx); setCurrentQuestion(0); setShowAllPhases(false); }}
                          style={{ background: idx === currentPhase ? 'rgba(0,74,198,.07)' : t.inputBg, border: `1px solid ${idx === currentPhase ? '#004ac6' : t.border}`, padding: '11px', borderRadius: '9px', textAlign: 'left', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                            <Icon size={14} color={idx === currentPhase ? '#004ac6' : t.textDim} />
                            <span style={{ flex: 1, fontSize: '11px', fontWeight: 650, color: t.text, lineHeight: 1.3 }}>{phase.name}</span>
                            <span style={{ color: '#004ac6', fontSize: '11px', fontWeight: 700 }}>{phase.questions.length ? `${progress}%` : 'Sin preguntas'}</span>
                          </div>
                          <div style={{ height: '3px', marginTop: '10px', background: t.cardBg, borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${progress}%`, height: '100%', background: '#004ac6' }} /></div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {currentPhaseData?.id === 'ley' && currentPhaseData.questions.length > 0 && (
                <section style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '13px', padding: '15px 16px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 750, fontSize: '13px', color: t.text, marginBottom: '5px' }}>Áreas y apartados de privacidad</div>
                  <p style={{ fontSize: '11px', lineHeight: 1.5, color: t.textDim, margin: '0 0 12px' }}>
                    Los apartados GUIALIST y PRIV provienen de una guía del RGPD europeo; su clasificación aquí no implica equivalencia jurídica con la Ley chilena 21.719.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <label htmlFor="normia-privacy-area" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.text, marginBottom: '5px' }}>Área</label>
                      <select id="normia-privacy-area" value={activePrivacyArea || ''} onChange={(e) => jumpToPrivacy(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '12px', cursor: 'pointer' }}>
                        {privacyAreaOptions.map(({ area, count }) => <option key={area} value={area}>{area} ({count})</option>)}
                      </select>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <label htmlFor="normia-privacy-section" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.text, marginBottom: '5px' }}>Apartado</label>
                      <select id="normia-privacy-section" value={activePrivacySection || ''} onChange={(e) => jumpToPrivacy(activePrivacyArea, e.target.value)}
                        style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '12px', cursor: 'pointer' }}>
                        {privacySectionOptions.map(({ section, count }) => <option key={section} value={section}>{section} ({count})</option>)}
                      </select>
                    </div>
                  </div>
                  {activePrivacySection && <div style={{ marginTop: '10px', fontSize: '12px', color: t.textMuted }}>
                    Apartado actual: <strong>{activePrivacySection}</strong>
                  </div>}
                </section>
              )}

              <div className="normia-gap-workspace">
                {/* Columna principal: pregunta primero y con espacio suficiente */}
                <main className="normia-gap-card">
                  {!currentQuestionData && currentPhaseData?.id === 'ley' && (
                    <section style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '25px' }}>
                      <h2 style={{ fontSize: '18px', color: t.text, margin: '0 0 12px' }}>Ley 21.719 — Privacidad</h2>
                      <p style={{ fontSize: '14px', lineHeight: 1.7, color: t.textMuted, margin: '0 0 12px' }}>
                        Este grupo todavía no tiene preguntas asociadas en los datos cargados. No es un problema del menú: las preguntas deben existir en la base de datos y tener una categoría reconocible.
                      </p>
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: t.textDim, margin: 0 }}>
                        Revisa la sección «Preguntas» (si tienes permisos de administración) y comprueba que las preguntas de la ley estén registradas con la categoría «Privacidad» o «Ley 21.719».
                      </p>
                    </section>
                  )}
                  {currentQuestionData && (
                    <section className="normia-gap-question-card" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '25px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                        <div style={{ color: '#004ac6', fontWeight: 750, fontSize: '12px' }}>Cuestionario de cumplimiento</div>
                        <span style={{ fontSize: '11px', padding: '5px 10px', border: `1px solid ${t.border}`, background: t.inputBg, borderRadius: '20px', color: t.textMuted }}>Pregunta {currentQuestion + 1} de {currentPhaseData.questions.length}</span>
                      </div>
                      {currentPhaseData.id === 'ley' && <div style={{ fontSize: '12px', color: t.textDim, marginBottom: '8px' }}>{currentQuestionData.area} / {currentQuestionData.section}</div>}
                      <h2 style={{ fontSize: '19px', lineHeight: 1.4, fontWeight: 750, margin: '0 0 12px', color: t.text }}>{currentQuestionData.title}</h2>
                      <p style={{ fontSize: '15px', lineHeight: 1.7, margin: '0 0 22px', color: t.text }}>{currentQuestionData.question}</p>
                      <div className="normia-gap-choices" style={{ marginBottom: '18px' }}>
                        {currentQuestionData.options.map((option) => {
                          const selected = answers[currentQuestionData.id] === option;
                          return <button key={option} type="button" onClick={() => handleAnswer(option)} aria-pressed={selected}
                            style={{ padding: '13px 10px', borderRadius: '9px', border: `1.5px solid ${selected ? '#004ac6' : t.border}`, background: selected ? 'rgba(0,74,198,.09)' : t.cardBg, color: selected ? '#004ac6' : t.text, fontWeight: selected ? 750 : 550, fontSize: '13px', cursor: 'pointer' }}>{option}</button>;
                        })}
                      </div>
                      {aiResults[currentQuestionData.id] && (
                        <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '13px 15px', marginBottom: '18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                            <Wand2 size={15} color="#004ac6" />
                            <strong style={{ fontSize: '12px', color: t.text }}>Análisis de IA</strong>
                            {(() => {
                              const v = aiResults[currentQuestionData.id].veredicto;
                              const map = { cumple: ['Cumple', '#004ac6'], parcial: ['Parcial', '#b45309'], no_cumple: ['No cumple', '#dc2626'], sin_evidencia: ['Sin evidencia', '#64748b'] };
                              const [label, color] = map[v] || ['Sin clasificar', t.textDim];
                              return <span style={{ fontSize: '11px', color, fontWeight: 700, padding: '3px 8px', borderRadius: '20px', border: `1px solid ${color}44` }}>{label}</span>;
                            })()}
                            {typeof aiResults[currentQuestionData.id].confianza === 'number' && <span style={{ fontSize: '11px', color: t.textDim }}>Confianza: {Math.round(aiResults[currentQuestionData.id].confianza * 100)}%</span>}
                          </div>
                          <div style={{ color: t.textMuted, fontSize: '12px', lineHeight: 1.6, overflowWrap: 'anywhere' }}>{aiResults[currentQuestionData.id].justificacion}</div>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', paddingTop: '16px', borderTop: `1px solid ${t.border}` }}>
                        <button type="button" onClick={goToPrev} disabled={currentPhase === 0 && currentQuestion === 0} style={{ padding: '10px 17px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.text, cursor: 'pointer', opacity: currentPhase === 0 && currentQuestion === 0 ? .45 : 1 }}><ChevronLeft size={14} style={{ verticalAlign: 'middle' }} /> Anterior</button>
                        <button type="button" onClick={goToNext} style={{ padding: '10px 17px', borderRadius: '8px', border: 'none', background: '#004ac6', color: '#fff', fontWeight: 650, cursor: 'pointer' }}>Continuar <ChevronRight size={14} style={{ verticalAlign: 'middle' }} /></button>
                      </div>
                    </section>
                  )}
                </main>

                {/* Columna secundaria: evidencias y acciones IA, sin empujar la pregunta hacia abajo */}
                <aside className="normia-gap-card" aria-label="Documentos de evidencia" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '5px' }}>
                    <FolderUp size={17} color="#004ac6" />
                    <h2 style={{ fontSize: '15px', fontWeight: 750, color: t.text, margin: 0 }}>Evidencias</h2>
                  </div>
                  <p style={{ fontSize: '12px', lineHeight: 1.5, color: t.textDim, margin: '0 0 13px' }}>{savedDocs.length} documentos disponibles. Selecciona los que revisará la IA.</p>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '10px', border: `1px dashed ${t.border}`, borderRadius: '9px', cursor: uploadingDocs ? 'wait' : 'pointer', color: t.text, background: t.inputBg, fontSize: '12px', fontWeight: 650, opacity: uploadingDocs ? .6 : 1, marginBottom: '12px' }}>
                    <FolderUp size={15} />{uploadingDocs ? 'Guardando...' : 'Agregar documentos'}
                    <input type="file" multiple accept=".pdf,.txt,.docx" disabled={uploadingDocs} style={{ display: 'none' }} onChange={(e) => { handleUploadDocs(e.target.files); e.target.value = ''; }} />
                  </label>
                  {savedDocs.length === 0 ? (
                    <div style={{ padding: '14px', fontSize: '12px', color: t.textDim, borderRadius: '9px', background: t.inputBg }}>Todavía no hay documentos. Agrega evidencias para poder evaluarlas con IA.</div>
                  ) : (
                    <div className="normia-gap-doc-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '235px', overflowY: 'auto', paddingRight: '3px' }}>
                      {savedDocs.map((d) => {
                        const checked = selectedEvidenceIds.includes(d.id);
                        return <label key={d.id} title={d.name || d.title || 'Documento'} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '9px', borderRadius: '8px', background: checked ? 'rgba(0,74,198,.07)' : t.inputBg, border: `1px solid ${checked ? '#004ac6' : t.border}`, cursor: 'pointer', minWidth: 0 }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleEvidence(d.id)} style={{ accentColor: '#004ac6', marginTop: '2px', flexShrink: 0 }} />
                          <span className="normia-gap-doc-name" style={{ fontSize: '11px', color: t.text }}>{d.name || d.title || 'Documento'}</span>
                        </label>;
                      })}
                    </div>
                  )}
                  {selectedEvidenceIds.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', marginTop: '11px', fontSize: '11px', color: t.textDim }}><span>{selectedEvidenceIds.length} seleccionados</span><button type="button" onClick={() => setSelectedEvidenceIds([])} style={{ border: 'none', background: 'transparent', color: '#004ac6', cursor: 'pointer', fontSize: '11px' }}>Limpiar</button></div>}
                  <div style={{ borderTop: `1px solid ${t.border}`, marginTop: '14px', paddingTop: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button type="button" onClick={() => handleEvaluateWithAI(false)} disabled={isEvaluating || selectedEvidenceIds.length === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '11px', borderRadius: '9px', border: 'none', background: '#004ac6', color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', opacity: isEvaluating || !selectedEvidenceIds.length ? .55 : 1 }}><Wand2 size={15} />{isEvaluating ? 'Evaluando...' : 'Evaluar con IA'}</button>
                    <button type="button" onClick={() => handleEvaluateWithAI(true)} disabled={isEvaluating || selectedEvidenceIds.length === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '10px', borderRadius: '9px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.text, fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: isEvaluating || !selectedEvidenceIds.length ? .55 : 1 }}><Activity size={15} />Revalidar pendientes</button>
                  </div>
                  {isEvaluating && <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#004ac6' }}>La IA está analizando los documentos...</p>}
                  {evalError && <div role="alert" style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,.08)', color: '#dc2626', fontSize: '12px', overflowWrap: 'anywhere' }}>{evalError}</div>}
                  {evalInfo && <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: t.inputBg, color: t.text, fontSize: '12px', whiteSpace: 'pre-line' }}>{evalInfo}</div>}
                </aside>
              </div>
            </>
          )}
        </>
      ) : activeMainTab === 'soa' ? (
        <InteractiveSOA />
      ) : activeMainTab === 'resultados' ? (
        <ResultadosView />
      ) : activeMainTab === 'analyze' ? (
        <AnalizarDocView />
      ) : activeMainTab === 'admin-questions' ? (
        <QuestionsAdminView />
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>Vista no disponible.</div>
      )}
    </div>
  );
}

export default GapAnalysisScreen;
