// src/pages/GapAnalysisScreen.jsx
import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  Building2, Target, Users, Lock, Sparkles, Eye,
  ChevronLeft, ChevronRight, Download, FolderUp, CheckCircle2,
  AlertCircle, Activity, Shield, Edit3, FileCheck, Globe, Wand2
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { complianceAPI, documentsAPI, API_URL, assessmentQuestionsAPI } from '../services/api';
import { getFullGapAnalysis, getComplianceScore, analyzeDocument } from '../services/gapAnalysisAPI';
import { getControlName } from '../translations/controls';

function GapAnalysisScreen({ onNavigate }) {
  const { theme: t, language, setLanguage } = useContext(ThemeContext);

  // ==========================================
  // TRADUCCIONES COMPLETAS
  // ==========================================
  const translations = {
    en: {
      gapAnalysis: 'Gap Analysis',
      completeAssessment: 'Complete the assessment to generate your SOA',
      evaluation: 'Assessment',
      previewSOA: 'SOA Preview',
      bulkUpload: 'Bulk Upload',
      saveProgress: 'Save Progress',
      generalProgress: 'General Progress',
      phases: 'PHASES',
      question: 'Question',
      critical: 'Critical',
      previous: 'Previous',
      continue: 'Continue',
      previewSOATitle: 'SOA Preview',
      viewSOA: 'View full SOA',
      saving: 'Saving...',
      soaTitle: 'Statement of Applicability (SOA)',
      soaApplicable: 'Applicable',
      soaImplemented: 'Implemented',
      control: 'Control',
      description: 'Description',
      applicable: 'Applicable',
      notApplicable: 'Not Applicable',
      justification: 'Justification',
      status: 'Status',
      implemented: 'Implemented',
      planned: 'Planned',
      notImplemented: 'Not Implemented',
      showAll: 'All',
      showApplicable: 'Applicable',
      showNotApplicable: 'Not Applicable',
      required: 'Required',
      autoSaved: 'Auto-saved',
      contextLeadership: 'Context & Leadership',
      planningRisk: 'Planning & Risk',
      supportOps: 'Support & Operations',
      annexA: 'Annex A Controls',
      clauses45: 'Clauses 4 & 5',
      clause6: 'Clause 6',
      clauses78: 'Clauses 7 & 8',
      annexAtext: 'Annex A',
      q1Title: 'Organization Context',
      q1Question: 'Have you determined external and internal issues relevant to your ISMS?',
      q2Title: 'Interested Parties',
      q2Question: 'Have you identified stakeholders relevant to information security?',
      q3Title: 'ISMS Scope',
      q3Question: 'Is the ISMS scope clearly defined and documented?',
      q4Title: 'Risk Methodology',
      q4Question: 'Do you have a documented risk assessment process?',
      q5Title: 'Risk Treatment',
      q5Question: 'Have you formulated a risk treatment plan?',
      q6Title: 'Training & Awareness',
      q6Question: 'Have employees received security awareness training?',
      q7Title: 'Organizational Controls',
      q7Question: 'Have organizational controls been implemented?',
      q8Title: 'Technological Controls',
      q8Question: 'Have technological controls been implemented?',
      yes: 'Yes',
      no: 'No',
      partially: 'Partially'
    },
    es: {
      gapAnalysis: 'Análisis de Brechas',
      completeAssessment: 'Completa la evaluación para generar tu Declaración de Aplicabilidad (SOA)',
      evaluation: 'Evaluación',
      previewSOA: 'Vista Previa SOA',
      bulkUpload: 'Carga Masiva',
      saveProgress: 'Guardar Progreso',
      generalProgress: 'Progreso General',
      phases: 'FASES',
      question: 'Pregunta',
      critical: 'Crítica',
      previous: 'Anterior',
      continue: 'Continuar',
      previewSOATitle: 'Vista previa de la SOA',
      viewSOA: 'Ver SOA completa',
      saving: 'Guardando...',
      soaTitle: 'Declaración de Aplicabilidad (SOA)',
      soaApplicable: 'Aplica',
      soaImplemented: 'Implementado',
      control: 'Control',
      description: 'Descripción',
      applicable: 'Aplica',
      notApplicable: 'No Aplica',
      justification: 'Justificación',
      status: 'Estado',
      implemented: 'Implementado',
      planned: 'Planificado',
      notImplemented: 'No Implementado',
      showAll: 'Todos',
      showApplicable: 'Aplica',
      showNotApplicable: 'No Aplica',
      required: 'Requerido',
      autoSaved: 'Auto-guardado',
      contextLeadership: 'Contexto y Liderazgo',
      planningRisk: 'Planificación y Riesgo',
      supportOps: 'Soporte y Operación',
      annexA: 'Controles del Anexo A',
      clauses45: 'Cláusulas 4 y 5',
      clause6: 'Cláusula 6',
      clauses78: 'Cláusulas 7 y 8',
      annexAtext: 'Anexo A',
      q1Title: 'Contexto de la Organización',
      q1Question: '¿Ha determinado las cuestiones externas e internas relevantes para su SGSI?',
      q2Title: 'Partes Interesadas',
      q2Question: '¿Ha identificado las partes interesadas relevantes para la seguridad de la información?',
      q3Title: 'Alcance del SGSI',
      q3Question: '¿El alcance del SGSI está claramente definido y documentado?',
      q4Title: 'Metodología de Riesgos',
      q4Question: '¿Existe una metodología documentada para la evaluación de riesgos?',
      q5Title: 'Tratamiento de Riesgos',
      q5Question: '¿Se ha formulado un plan de tratamiento de riesgos?',
      q6Title: 'Competencia y Concienciación',
      q6Question: '¿El personal ha recibido capacitación en seguridad de la información?',
      q7Title: 'Controles Organizacionales',
      q7Question: '¿Se han implementado los controles organizacionales?',
      q8Title: 'Controles Tecnológicos',
      q8Question: '¿Se han implementado los controles tecnológicos?',
      yes: 'Sí',
      no: 'No',
      partially: 'Parcialmente'
    },
    pt: {
      gapAnalysis: 'Análise de Lacunas',
      completeAssessment: 'Complete a avaliação para gerar sua Declaração de Aplicabilidade (SOA)',
      evaluation: 'Avaliação',
      previewSOA: 'Visualizar SOA',
      bulkUpload: 'Upload em Massa',
      saveProgress: 'Salvar Progresso',
      generalProgress: 'Progresso Geral',
      phases: 'FASES',
      question: 'Pergunta',
      critical: 'Crítica',
      previous: 'Anterior',
      continue: 'Continuar',
      previewSOATitle: 'Visualização da SOA',
      viewSOA: 'Ver SOA completa',
      saving: 'Salvando...',
      soaTitle: 'Declaração de Aplicabilidade (SOA)',
      soaApplicable: 'Aplicável',
      soaImplemented: 'Implementado',
      control: 'Controle',
      description: 'Descrição',
      applicable: 'Aplicável',
      notApplicable: 'Não Aplicável',
      justification: 'Justificativa',
      status: 'Status',
      implemented: 'Implementado',
      planned: 'Planejado',
      notImplemented: 'Não Implementado',
      showAll: 'Todos',
      showApplicable: 'Aplicável',
      showNotApplicable: 'Não Aplicável',
      required: 'Obrigatório',
      autoSaved: 'Auto-salvo',
      contextLeadership: 'Contexto e Liderança',
      planningRisk: 'Planejamento e Risco',
      supportOps: 'Suporte e Operação',
      annexA: 'Controles do Anexo A',
      clauses45: 'Cláusulas 4 e 5',
      clause6: 'Cláusula 6',
      clauses78: 'Cláusulas 7 e 8',
      annexAtext: 'Anexo A',
      q1Title: 'Contexto da Organização',
      q1Question: 'Você determinou as questões externas e internas relevantes para o seu SGSI?',
      q2Title: 'Partes Interessadas',
      q2Question: 'Você identificou as partes interessadas relevantes para a segurança da informação?',
      q3Title: 'Escopo do SGSI',
      q3Question: 'O escopo do SGSI está claramente definido e documentado?',
      q4Title: 'Metodologia de Riscos',
      q4Question: 'Existe uma metodologia documentada para avaliação de riscos?',
      q5Title: 'Tratamento de Riscos',
      q5Question: 'Você formulou um plano de tratamento de riscos?',
      q6Title: 'Competência e Conscientização',
      q6Question: 'Os funcionários receberam treinamento em segurança da informação?',
      q7Title: 'Controles Organizacionais',
      q7Question: 'Os controles organizacionais foram implementados?',
      q8Title: 'Controles Tecnológicos',
      q8Question: 'Os controles tecnológicos foram implementados?',
      yes: 'Sim',
      no: 'Não',
      partially: 'Parcialmente'
    }
  };

  const tText = translations[language] || translations.en;

  // ==========================================
  // ESTADOS
  // ==========================================
  const [activeMainTab, setActiveMainTab] = useState('assessment');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dani_gap_answers') || '{}'); } catch { return {}; }
  });
  const [controls, setControls] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // ✅ Agregar esto
  const [error, setError] = useState(null); // ✅ Agregar esto para errores
  const [isSaving, setIsSaving] = useState(false);
  const [filterApplicable, setFilterApplicable] = useState('all');
  const [showJustificationModal, setShowJustificationModal] = useState(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
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

  useEffect(() => {
    try { localStorage.setItem('dani_gap_answers', JSON.stringify(answers)); } catch {}
  }, [answers]);
  const [overallScore, setOverallScore] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Estado para análisis de documento con LLM
  const [docText, setDocText] = useState('');
  const [docName, setDocName] = useState('');
  const [docAnalysisResult, setDocAnalysisResult] = useState(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [docAnalysisError, setDocAnalysisError] = useState(null);

  // ==========================================
  // DATOS DE LAS FASES  (ahora vienen de la BASE DE DATOS: /api/assessment-questions)
  // El catálogo de preguntas se agrupa en fases por cláusula/categoría.
  // ==========================================
  const [dbQuestions, setDbQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState(null);

  // Evaluar con IA (subir documentos -> la IA responde cada pregunta)
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState(null);
  const [evalInfo, setEvalInfo] = useState(null);
  const [aiResults, setAiResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dani_gap_ai_results') || '{}'); } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem('dani_gap_ai_results', JSON.stringify(aiResults)); } catch {}
  }, [aiResults]);

  useEffect(() => {
    const loadQuestions = async () => {
      setQuestionsLoading(true);
      setQuestionsError(null);
      try {
        const data = await assessmentQuestionsAPI.getAll();
        setDbQuestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar las preguntas de evaluación desde la BD.', err);
        setQuestionsError('No se pudieron cargar las preguntas desde la base de datos.');
        setDbQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    };
    loadQuestions();
  }, []);

  // Definición de las fases: a qué grupo pertenece cada pregunta según su código/categoría.
  const clauseNum = (codigo) => (codigo || '').split('.')[0];
  const phaseDefs = [
    { id: 'context',  name: tText.contextLeadership || 'Contexto y Liderazgo', clause: 'Cláusulas 4 y 5', icon: Building2, color: '#3b82f6', match: (q) => q.categoria?.startsWith('Cláusula') && ['4', '5'].includes(clauseNum(q.codigo)) },
    { id: 'planning', name: tText.planningRisk || 'Planificación y Riesgo', clause: 'Cláusula 6', icon: Target, color: '#10b981', match: (q) => q.categoria?.startsWith('Cláusula') && clauseNum(q.codigo) === '6' },
    { id: 'support',  name: 'Soporte, Operación y Mejora', clause: 'Cláusulas 7 a 10', icon: Users, color: '#f59e0b', match: (q) => q.categoria?.startsWith('Cláusula') && ['7', '8', '9', '10'].includes(clauseNum(q.codigo)) },
    { id: 'org',      name: 'Anexo A — Organizacional', clause: 'Controles A.5', icon: Shield, color: '#a855f7', match: (q) => q.categoria === 'Organizacional' },
    { id: 'people',   name: 'Anexo A — Personas', clause: 'Controles A.6', icon: Users, color: '#ec4899', match: (q) => q.categoria === 'Personas' },
    { id: 'phys',     name: 'Anexo A — Físico', clause: 'Controles A.7', icon: Lock, color: '#06b6d4', match: (q) => q.categoria === 'Físico' },
    { id: 'tech',     name: 'Anexo A — Tecnológico', clause: 'Controles A.8', icon: Globe, color: '#8b5cf6', match: (q) => q.categoria === 'Tecnológico' },
  ];

  // Construir las fases a partir de las preguntas de la BD.
  const phases = useMemo(() => {
    return phaseDefs
      .map((def) => ({
        id: def.id, name: def.name, clause: def.clause, icon: def.icon, color: def.color,
        questions: dbQuestions
          .filter(def.match)
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((q) => ({
            id: q.id,
            title: `${q.codigo} — ${q.nombre}`,
            question: q.pregunta,
            options: [tText.yes, tText.partially, tText.no],
            critical: q.categoria?.startsWith('Cláusula'),
            evidencia: q.evidencia_esperada,
          })),
      }))
      .filter((p) => p.questions.length > 0);
  }, [dbQuestions, language]);

  // Mapear el veredicto de la IA a la opción de respuesta (Sí / Parcialmente / No)
  const veredictoToOption = (veredicto) => {
    if (veredicto === 'cumple') return tText.yes;
    if (veredicto === 'parcial') return tText.partially;
    return tText.no; // no_cumple o sin_evidencia
  };

  // Evaluar con IA (o revalidar). Si revalidate=true, solo reprocesa las que NO
  // están en "Sí" (cumple): las ya aprobadas se omiten.
  const handleEvaluateWithAI = async (revalidate = false) => {
    setEvalError(null);
    setEvalInfo(null);
    if (!uploadedFiles.length) {
      setEvalError('Sube al menos un documento antes de evaluar.');
      return;
    }
    let ids = [];
    if (revalidate) {
      phases.forEach((p) => p.questions.forEach((q) => {
        if (answers[q.id] !== tText.yes) ids.push(q.id);
      }));
      if (ids.length === 0) {
        setEvalInfo('No hay preguntas pendientes: todas están en "Sí".');
        return;
      }
    }
    setIsEvaluating(true);
    try {
      const resp = await assessmentQuestionsAPI.evaluate(uploadedFiles, ids);
      const newAnswers = { ...answers };
      const newAI = { ...aiResults };
      (resp.results || []).forEach((r) => {
        newAnswers[r.id] = veredictoToOption(r.veredicto);
        newAI[r.id] = { veredicto: r.veredicto, confianza: r.confianza, justificacion: r.justificacion };
      });
      setAnswers(newAnswers);
      setAiResults(newAI);
      setEvalInfo(`✅ IA evaluó ${resp.total} pregunta(s)${revalidate ? ' (revalidación)' : ''}.`);
    } catch (e) {
      setEvalError(e.message || 'Error al evaluar con IA.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Cargar controles ISO
  useEffect(() => {
    const loadISOControls = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        console.log('Token usado:', token);

        if (!token) {
          throw new Error('No hay token de autenticación');
        }

        const data = await complianceAPI.getControls(token);
        console.log('Datos recibidos:', data);

        if (data.controls && Array.isArray(data.controls)) {
          // ✅ Guardamos el ID original para poder traducir después
          const formattedControls = data.controls.map(c => ({
            id: c.id,              // ID del control (ej: "5.1")
            name: c.name,          // Nombre en español (de la BD)
            category: c.category || 'Organizational',
            applicable: c.applicable !== undefined ? c.applicable : true,
            status: c.status === 'implemented' ? 'implemented' : (c.status === 'planned' ? 'planned' : 'notImplemented'),
            justification: c.justification || ''
          }));
          setControls(formattedControls);
          console.log('✅ Controles cargados desde BD:', formattedControls.length);
        } else {
          throw new Error('No se recibieron controles del servidor');
        }
      } catch (error) {
        console.error("Error loading ISO controls:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadISOControls();
  }, []);

  // Cargar análisis de brechas completo desde el backend
  useEffect(() => {
    const loadAnalysis = async () => {
      setIsLoadingAnalysis(true);
      try {
        const [analysis, score] = await Promise.all([
          getFullGapAnalysis(),
          getComplianceScore()
        ]);
        setFullAnalysis(analysis);
        setOverallScore(score);
      } catch (error) {
        console.error('Error cargando análisis de brechas:', error);
      } finally {
        setIsLoadingAnalysis(false);
      }
    };
    loadAnalysis();
  }, []);

  // Cargar documentos publicados para el modal de auditoría IA
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await documentsAPI.getPublishedPolicies(token);
        if (data?.policies) setAvailableDocs(data.policies);
      } catch (error) {
        console.error("Error loading policies:", error);
      }
    };
    loadDocs();
  }, []);

  const handleAIAudit = async (documentId) => {
    if (!showAIAuditModal) return;
    setIsAuditing(true);
    try {
      const response = await complianceAPI.evaluateControl(showAIAuditModal.id, documentId);
      setControls(prev => prev.map(c => c.id === showAIAuditModal.id ? {
        ...c,
        status: response.status === 'implemented' ? 'implemented' : (response.status === 'planned' ? 'planned' : 'notImplemented'),
        justification: response.justification
      } : c));
      alert("✨ " + (language === 'es' ? 'Evaluación completada por DANI' : 'DANI AI Evaluation Complete'));
      setShowAIAuditModal(null);
    } catch (error) {
      console.error("Error en evaluación IA:", error);
      alert("❌ " + (language === 'es' ? 'Error al evaluar con IA' : 'Error evaluating with AI'));
    } finally {
      setIsAuditing(false);
    }
  };

  const handleBulkAudit = async () => {
    setIsBulkAuditing(true);
    try {
      const response = await complianceAPI.bulkAudit();

      if (response.results) {
        let updatedControls;
        setControls(prevControls => {
          const newControls = [...prevControls];
          response.results.forEach(res => {
            const idx = newControls.findIndex(c => c.id === res.id);
            if (idx !== -1) {
              newControls[idx] = {
                ...newControls[idx],
                status: res.status === 'Implementado' ? 'implemented' : (res.status === 'Planificado' ? 'planned' : 'notImplemented'),
                score: res.score,
                justification: res.justification
              };
            }
          });
          updatedControls = newControls;
          return newControls;
        });
        // Persistir resultados en BD inmediatamente
        try {
          await complianceAPI.fullAssessment({ controls: updatedControls, answers });
        } catch (_) {}
      }
      alert("✨ " + (language === 'es' ? 'Auditoría masiva completada y guardada' : 'Bulk audit complete and saved'));
    } catch (error) {
      console.error("Error en auditoría masiva:", error);
      alert("❌ " + (language === 'es' ? 'Error al ejecutar la auditoría masiva' : 'Error executing bulk audit'));
    } finally {
      setIsBulkAuditing(false);
    }
  };

  const handleBulkSelectionAudit = async (documentId) => {
    const ids = [...selectedControls];
    if (ids.length === 0) return;
    setBulkAuditProgress({ done: 0, total: ids.length });
    setIsBulkSelectionAuditing(true);
    let successCount = 0;
    try {
      for (const controlId of ids) {
        try {
          const response = await complianceAPI.evaluateControl(controlId, documentId);
          setControls(prev => prev.map(c => c.id === controlId ? {
            ...c,
            status: response.status === 'implemented' ? 'implemented' : (response.status === 'planned' ? 'planned' : 'notImplemented'),
            justification: response.justification
          } : c));
          successCount++;
        } catch (err) {
          console.error(`Error auditando ${controlId}:`, err);
        }
        setBulkAuditProgress(p => ({ ...p, done: p.done + 1 }));
      }
      alert(`✨ ${successCount}/${ids.length} ${language === 'es' ? 'controles auditados' : 'controls audited'}`);
    } finally {
      setIsBulkSelectionAuditing(false);
      setShowBulkDocModal(false);
      setSelectedControls(new Set());
    }
  };

  // Funciones del wizard
  const currentPhaseData = phases[currentPhase];
  const currentQuestionData = currentPhaseData?.questions[currentQuestion];
  const totalQuestions = phases.reduce((sum, p) => sum + p.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const globalProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const getPhaseProgress = (idx) => {
    const phase = phases[idx];
    if (phase.questions.length === 0) return 0;
    const answered = phase.questions.filter(q => answers[q.id]).length;
    return Math.round((answered / phase.questions.length) * 100);
  };

  const handleAnswer = (answer) => {
    setAnswers({ ...answers, [currentQuestionData.id]: answer });
    setTimeout(() => {
      if (currentQuestion < currentPhaseData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else if (currentPhase < phases.length - 1) {
        setCurrentPhase(currentPhase + 1);
        setCurrentQuestion(0);
      } else {
        setActiveMainTab('soa');
      }
    }, 300);
  };

  const goToNext = () => {
    if (currentQuestion < currentPhaseData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
      setCurrentQuestion(0);
    } else {
      setActiveMainTab('soa');
    }
  };

  const goToPrev = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
    else if (currentPhase > 0) { setCurrentPhase(currentPhase - 1); setCurrentQuestion(phases[currentPhase - 1].questions.length - 1); }
  };

  // Funciones SOA
  const toggleApplicable = (id) => {
    setControls(prev => prev.map(c => c.id === id ? { ...c, applicable: !c.applicable } : c));
  };

  const updateStatus = (id, status) => {
    setControls(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const updateJustification = (id, justification) => {
    setControls(prev => prev.map(c => c.id === id ? { ...c, justification } : c));
    setShowJustificationModal(null);
  };

  const handleSaveProgress = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await complianceAPI.fullAssessment({ controls, answers });
      alert("✨ " + (language === 'es' ? '¡Progreso guardado con éxito!' : language === 'pt' ? 'Progresso salvo com sucesso!' : 'Progress saved successfully!'));
    } catch (error) {
      console.error("Error saving progress:", error);
      alert("⚠️ " + (language === 'es' ? 'No se pudo sincronizar con el servidor.' : language === 'pt' ? 'Não foi possível sincronizar com o servidor.' : 'Could not sync with server.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowLanguageMenu(false);
  };

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


  // ✅ CAMBIO 4: Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #10b981',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Cargando controles ISO 27001...</p>
        </div>
      </div>
    );
  }

  // ✅ CAMBIO 5: Mostrar error si ocurrió un problema
  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginBottom: '16px' }}>⚠️ Error cargando los controles</div>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '8px 16px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </div>
    );
  }
  const chapterDescriptions = {
    es: {
      '4':  'Contexto de la organización — cuestiones internas/externas y partes interesadas.',
      '5':  'Liderazgo — política de seguridad, roles y responsabilidades de la dirección.',
      '6':  'Planificación — evaluación de riesgos, tratamiento y objetivos de seguridad.',
      '7':  'Soporte — recursos, competencia, concienciación y control de documentos.',
      '8':  'Operación — implementación y control de los procesos de seguridad.',
      '9':  'Evaluación del desempeño — auditorías internas y revisión por la dirección.',
      '10': 'Mejora continua — no conformidades, acciones correctivas y mejora del SGSI.',
      'a':  'Anexo A — controles técnicos, organizacionales, físicos y de personas.',
    },
    en: {
      '4':  'Context of the organization — internal/external issues and interested parties.',
      '5':  'Leadership — security policy, roles and management responsibilities.',
      '6':  'Planning — risk assessment, treatment and security objectives.',
      '7':  'Support — resources, competence, awareness and document control.',
      '8':  'Operation — implementation and control of security processes.',
      '9':  'Performance evaluation — internal audits and management review.',
      '10': 'Improvement — nonconformities, corrective actions and ISMS improvement.',
      'a':  'Annex A — technical, organizational, physical and people controls.',
    },
    pt: {
      '4':  'Contexto da organização — questões internas/externas e partes interessadas.',
      '5':  'Liderança — política de segurança, funções e responsabilidades da direção.',
      '6':  'Planejamento — avaliação de riscos, tratamento e objetivos de segurança.',
      '7':  'Suporte — recursos, competência, conscientização e controle de documentos.',
      '8':  'Operação — implementação e controle dos processos de segurança.',
      '9':  'Avaliação de desempenho — auditorias internas e análise crítica pela direção.',
      '10': 'Melhoria contínua — não conformidades, ações corretivas e melhoria do SGSI.',
      'a':  'Anexo A — controles técnicos, organizacionais, físicos e de pessoas.',
    },
  };

  const getChapterDesc = (chapterId) => {
    const key = String(chapterId).replace('chapter_', '').toLowerCase().replace('annex-', '');
    const map = chapterDescriptions[language] || chapterDescriptions.es;
    return map[key] || '';
  };

  const CustomCheckbox = ({ checked, onChange }) => (
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: '12px', height: '12px', borderRadius: '3px', flexShrink: 0,
        border: `1.5px solid ${checked ? '#8b5cf6' : t.textDim}`,
        background: checked ? '#8b5cf6' : 'transparent',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
    setCurrentPage(1);
  };

  // ==========================================
  // COMPONENTE INTERACTIVE SOA
  // ==========================================
  const InteractiveSOA = () => (
    <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden', marginTop: '24px' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{tText.soaTitle}</h3>
          <p style={{ fontSize: '12px', color: t.textDim }}>{appliesCount} {tText.soaApplicable} • {implementedCount} {tText.soaImplemented}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_URL}/api/compliance/soa/export`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (!res.ok) throw new Error('Error al generar SOA');
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'SOA_ISO27001_DANI.pdf';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            } catch (e) {
              alert('Error al exportar SOA: ' + e.message);
            }
          }} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Exportar SOA PDF
          </button>
          <button
            onClick={handleBulkAudit}
            disabled={isBulkAuditing}
            style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: isBulkAuditing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: isBulkAuditing ? 0.7 : 1 }}
          >
            <Sparkles size={14} /> {isBulkAuditing ? (language === 'es' ? 'Auditando...' : 'Auditing...') : (language === 'es' ? 'Auditar todos' : 'Audit all')}
          </button>
          {selectedControls.size > 0 && (
            <button
              onClick={() => setShowBulkDocModal(true)}
              style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={14} /> {language === 'es' ? `Auditar seleccionados (${selectedControls.size})` : `Audit selected (${selectedControls.size})`}
            </button>
          )}
          {[
            { id: 'all', label: tText.showAll },
            { id: 'applicable', label: tText.showApplicable },
            { id: 'notApplicable', label: tText.showNotApplicable }
          ].map((filter) => (
            <button key={filter.id} onClick={() => { setFilterApplicable(filter.id); setCurrentPage(1); }} style={{ padding: '6px 14px', background: filterApplicable === filter.id ? '#10b98120' : 'transparent', border: `1px solid ${filterApplicable === filter.id ? '#10b981' : t.border}`, borderRadius: '20px', color: filterApplicable === filter.id ? '#10b981' : t.textMuted, fontSize: '12px', cursor: 'pointer' }}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollbar temática */}
      <style>{`
        .soa-table-scroll { scrollbar-width: thin; scrollbar-color: rgba(139,92,246,0.28) transparent; }
        .soa-table-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .soa-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .soa-table-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.28); border-radius: 4px; }
        .soa-table-scroll::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.55); }
        .soa-table-scroll::-webkit-scrollbar-corner { background: transparent; }
      `}</style>

      {/* Barra de paginación superior */}
      <div style={{ padding: '10px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {/* Tamaño de página */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: t.textDim, whiteSpace: 'nowrap' }}>
            {language === 'es' ? 'Por página:' : 'Per page:'}
          </span>
          {[10, 30, 50].map(n => (
            <button key={n} onClick={() => { setPageSize(n); setCurrentPage(1); }}
              style={{ padding: '4px 13px', background: pageSize === n ? '#8b5cf6' : 'transparent', border: `1px solid ${pageSize === n ? '#8b5cf6' : t.border}`, borderRadius: '20px', color: pageSize === n ? 'white' : t.textDim, fontSize: '12px', cursor: 'pointer', fontWeight: pageSize === n ? 600 : 400, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {n}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '18px', background: t.border, flexShrink: 0 }} />

        {/* Tabs de páginas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ padding: '4px 9px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '6px', color: t.textDim, cursor: currentPage === 1 ? 'default' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1, fontSize: '13px', lineHeight: 1 }}>‹</button>
          {(() => {
            const pages = totalPages <= 7
              ? Array.from({ length: totalPages }, (_, i) => i + 1)
              : currentPage <= 4
                ? [1, 2, 3, 4, 5, '…', totalPages]
                : currentPage >= totalPages - 3
                  ? [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
                  : [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
            return pages.map((pg, i) => pg === '…'
              ? <span key={`e${i}`} style={{ padding: '0 4px', color: t.textDim, fontSize: '12px', userSelect: 'none' }}>…</span>
              : <button key={pg} onClick={() => setCurrentPage(pg)}
                  style={{ minWidth: '30px', padding: '4px 8px', background: currentPage === pg ? '#8b5cf6' : 'transparent', border: `1px solid ${currentPage === pg ? '#8b5cf6' : t.border}`, borderRadius: '6px', color: currentPage === pg ? 'white' : t.textDim, fontSize: '12px', cursor: 'pointer', fontWeight: currentPage === pg ? 600 : 400, transition: 'all 0.15s' }}>
                  {pg}
                </button>
            );
          })()}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            style={{ padding: '4px 9px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '6px', color: t.textDim, cursor: currentPage === totalPages ? 'default' : 'pointer', opacity: currentPage === totalPages ? 0.3 : 1, fontSize: '13px', lineHeight: 1 }}>›</button>
        </div>

        <div style={{ width: '1px', height: '18px', background: t.border, flexShrink: 0 }} />

        <span style={{ fontSize: '11px', color: t.textDim, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {sortedFilteredControls.length} {language === 'es' ? 'controles' : 'controls'}
        </span>
      </div>

      <div className="soa-table-scroll" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: t.inputBg }}>
              <th style={{ padding: '12px 12px', width: '36px', textAlign: 'center' }}>
                <CustomCheckbox
                  checked={pagedControls.length > 0 && pagedControls.every(c => selectedControls.has(c.id))}
                  onChange={() => {
                    const allChecked = pagedControls.length > 0 && pagedControls.every(c => selectedControls.has(c.id));
                    const newSel = new Set(selectedControls);
                    pagedControls.forEach(c => allChecked ? newSel.delete(c.id) : newSel.add(c.id));
                    setSelectedControls(newSel);
                  }}
                />
              </th>
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
                  <CustomCheckbox
                    checked={selectedControls.has(control.id)}
                    onChange={() => {
                      const newSel = new Set(selectedControls);
                      selectedControls.has(control.id) ? newSel.delete(control.id) : newSel.add(control.id);
                      setSelectedControls(newSel);
                    }}
                  />
                </td>
                <td style={{ padding: '11px 16px' }}><span style={{ fontSize: '13px', fontWeight: 700, color: '#8b5cf6' }}>{control.id}</span></td>
                <td style={{ padding: '11px 16px' }}><div style={{ fontSize: '13px', color: t.text, lineHeight: 1.35 }}>{getControlName(control.id, language)}</div><span style={{ fontSize: '11px', color: t.textDim }}>{control.category}</span></td>
                <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                    <button onClick={() => toggleApplicable(control.id)} style={{ padding: '5px 10px', background: control.applicable ? '#10b98120' : 'transparent', border: `1px solid ${control.applicable ? '#10b981' : t.border}`, borderRadius: '5px 0 0 5px', color: control.applicable ? '#10b981' : t.textDim, fontSize: '11px', cursor: 'pointer' }}>{tText.applicable}</button>
                    <button onClick={() => toggleApplicable(control.id)} style={{ padding: '5px 10px', background: !control.applicable ? '#ef444420' : 'transparent', border: `1px solid ${!control.applicable ? '#ef4444' : t.border}`, borderRadius: '0 5px 5px 0', color: !control.applicable ? '#ef4444' : t.textDim, fontSize: '11px', cursor: 'pointer' }}>{tText.notApplicable}</button>
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
                    <button onClick={() => setShowAIAuditModal(control)} title="Auditar" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#8b5cf6' }}><Sparkles size={13} /></button>
                    {onNavigate && control.status !== 'implemented' && (
                      <button 
                        onClick={() => {
                          const chapterNum = control.id.startsWith('A.') ? 'annex-a' : control.id.split('.')[0];
                          onNavigate('doc-generator', { targetChapterNumber: chapterNum, targetControlId: control.id, targetControlTitle: control.title });
                        }} 
                        title="Generar Documento con IA"
                        style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#10b981' }}
                      >
                        <Wand2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '10px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981' }}>
        <CheckCircle2 size={14} /><span>{tText.autoSaved}</span>
      </div>

      {showJustificationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: t.cardBg, borderRadius: '16px', padding: '24px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>{tText.justification}</h3>
            <textarea defaultValue={showJustificationModal.justification} rows={4} style={{ width: '100%', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '14px', marginBottom: '16px' }} id="justification-textarea" />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowJustificationModal(null)} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => { const textarea = document.getElementById('justification-textarea'); updateJustification(showJustificationModal.id, textarea.value); }} style={{ padding: '8px 16px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IA */}
      {showAIAuditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: t.cardBg, borderRadius: '16px', padding: '24px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: t.text }}><Sparkles size={20} color="#8b5cf6" /> Auditar</h3>
            <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '20px' }}>Selecciona el documento de evidencia que DANI debe evaluar contra el control <strong>{showAIAuditModal.id}</strong>.</p>

            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {availableDocs.length === 0 ? (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '13px' }}>
                  No hay documentos publicados disponibles para auditar. Ve al Generador de Documentos y aprueba uno primero.
                </div>
              ) : (
                availableDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleAIAudit(doc.id)}
                    disabled={isAuditing}
                    style={{ padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', textAlign: 'left', cursor: isAuditing ? 'wait' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>Capítulo {String(doc.chapter_id).replace('chapter_', '')}</div>
                      <div style={{ fontSize: '12px', color: t.textDim }}>{doc.title}</div>
                    </div>
                    {isAuditing && <div style={{ fontSize: '12px', color: '#8b5cf6' }}>Evaluando...</div>}
                  </button>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAIAuditModal(null)} disabled={isAuditing} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', cursor: 'pointer', color: t.text }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showBulkDocModal && (() => {
        const selectedIds = [...selectedControls];
        const visibleIds = selectedIds.slice(0, 24);
        const remaining = selectedIds.length - visibleIds.length;
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: t.cardBg, borderRadius: '16px', padding: '24px', width: '560px', maxWidth: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

              {/* Encabezado */}
              <h3 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: t.text, flexShrink: 0 }}>
                <Sparkles size={20} color="#f59e0b" />
                {language === 'es' ? `Auditar ${selectedIds.length} controles seleccionados` : `Audit ${selectedIds.length} selected controls`}
              </h3>
              <p style={{ fontSize: '12px', color: t.textDim, marginBottom: '14px', flexShrink: 0 }}>
                {language === 'es'
                  ? 'Elige el capítulo de evidencia. DANI evaluará cada control seleccionado contra ese documento.'
                  : 'Choose the evidence chapter. DANI will evaluate each selected control against that document.'}
              </p>

              {/* Chips de controles seleccionados */}
              <div style={{ marginBottom: '16px', padding: '10px 12px', background: t.inputBg, borderRadius: '10px', border: `1px solid ${t.border}`, flexShrink: 0 }}>
                <p style={{ fontSize: '11px', color: t.textDim, marginBottom: '8px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Controles a auditar' : 'Controls to audit'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {visibleIds.map(id => (
                    <span key={id} style={{ padding: '2px 8px', background: '#8b5cf618', border: '1px solid #8b5cf640', borderRadius: '20px', fontSize: '11px', color: '#8b5cf6', fontWeight: 600 }}>
                      {id}
                    </span>
                  ))}
                  {remaining > 0 && (
                    <span style={{ padding: '2px 8px', background: t.border, borderRadius: '20px', fontSize: '11px', color: t.textDim }}>
                      +{remaining} {language === 'es' ? 'más' : 'more'}
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de progreso */}
              {isBulkSelectionAuditing && (
                <div style={{ marginBottom: '14px', padding: '12px', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', fontSize: '13px', color: '#f59e0b', flexShrink: 0 }}>
                  {language === 'es' ? `Auditando ${bulkAuditProgress.done} / ${bulkAuditProgress.total} controles...` : `Auditing ${bulkAuditProgress.done} / ${bulkAuditProgress.total} controls...`}
                  <div style={{ marginTop: '8px', height: '4px', background: t.border, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#f59e0b', borderRadius: '2px', width: `${bulkAuditProgress.total > 0 ? (bulkAuditProgress.done / bulkAuditProgress.total) * 100 : 0}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {/* Lista de capítulos */}
              <p style={{ fontSize: '11px', color: t.textDim, marginBottom: '8px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
                {language === 'es' ? 'Capítulos disponibles' : 'Available chapters'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
                {availableDocs.length === 0 ? (
                  <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '13px' }}>
                    {language === 'es' ? 'No hay documentos publicados disponibles. Ve al Generador de Documentos y aprueba uno primero.' : 'No published documents available. Go to Document Generator and approve one first.'}
                  </div>
                ) : (
                  availableDocs.map(doc => {
                    const chNum = String(doc.chapter_id).replace('chapter_', '');
                    const desc = getChapterDesc(doc.chapter_id);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => handleBulkSelectionAudit(doc.id)}
                        disabled={isBulkSelectionAuditing}
                        style={{ padding: '12px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', textAlign: 'left', cursor: isBulkSelectionAuditing ? 'wait' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => { if (!isBulkSelectionAuditing) e.currentTarget.style.borderColor = '#f59e0b'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: desc ? '4px' : 0 }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 7px', borderRadius: '6px' }}>
                              {language === 'es' ? 'Cap.' : 'Ch.'} {chNum}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{doc.title}</span>
                          </div>
                          {desc && <p style={{ fontSize: '11px', color: t.textDim, margin: 0, lineHeight: 1.4 }}>{desc}</p>}
                        </div>
                        {isBulkSelectionAuditing
                          ? <span style={{ fontSize: '11px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }}>{language === 'es' ? 'Procesando...' : 'Processing...'}</span>
                          : <ChevronRight size={16} color={t.textDim} style={{ flexShrink: 0, marginTop: '2px' }} />
                        }
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', flexShrink: 0 }}>
                <button onClick={() => setShowBulkDocModal(false)} disabled={isBulkSelectionAuditing} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', cursor: 'pointer', color: t.text, fontSize: '13px' }}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // ==========================================
  // VISTA DE RESULTADOS (pestaña Resultados)
  // ==========================================
  const getScoreColor = (s) => s >= 85 ? '#10b981' : s >= 70 ? '#f59e0b' : '#ef4444';

  const ResultadosView = () => {
    if (isLoadingAnalysis) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px', color: t.textDim }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p>{language === 'es' ? 'Calculando análisis...' : 'Calculating analysis...'}</p>
          </div>
        </div>
      );
    }

    if (!overallScore && !fullAnalysis) {
      return (
        <div style={{ padding: '60px', textAlign: 'center', color: t.textDim }}>
          <p>{language === 'es' ? 'No se pudo cargar el análisis. Verifica la conexión con el backend.' : 'Could not load analysis. Check backend connection.'}</p>
        </div>
      );
    }

    const score = overallScore?.overall_score ?? 0;
    const gap = overallScore?.gap_to_certification ?? 0;
    const clauses = fullAnalysis?.clause_gaps ?? [];
    const sprints = fullAnalysis?.remediation_plan ?? {};
    const kpis = fullAnalysis?.kpi_dashboard ?? {};
    const allKpis = [...(kpis.strategic ?? []), ...(kpis.security ?? []), ...(kpis.operational ?? [])];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>

        {/* Tarjetas de score */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: t.cardBg, border: `2px solid ${getScoreColor(score)}40`, borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', fontWeight: 800, color: getScoreColor(score), lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: '13px', color: t.textDim, marginTop: '10px' }}>{language === 'es' ? 'Cumplimiento General' : 'Overall Compliance'}</div>
            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{language === 'es' ? `Faltan ${gap}% para certificación` : `${gap}% to certification`}</div>
          </div>
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>85%</div>
            <div style={{ fontSize: '13px', color: t.textDim, marginTop: '10px' }}>{language === 'es' ? 'Meta ISO 27001' : 'ISO 27001 Target'}</div>
            <div style={{ fontSize: '12px', color: t.textDim, marginTop: '6px' }}>{language === 'es' ? 'Requerido para certificación' : 'Required for certification'}</div>
          </div>
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', fontWeight: 800, color: overallScore?.trend === 'up' ? '#10b981' : '#ef4444', lineHeight: 1 }}>
              {overallScore?.trend === 'up' ? '↑' : '↓'}
            </div>
            <div style={{ fontSize: '13px', color: t.textDim, marginTop: '10px' }}>{language === 'es' ? 'Tendencia' : 'Trend'}</div>
            <div style={{ fontSize: '12px', color: t.textDim, marginTop: '6px' }}>{language === 'es' ? 'Progresión actual' : 'Current progress'}</div>
          </div>
        </div>

        {/* Brechas por cláusula */}
        {clauses.length > 0 && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '20px' }}>
              {language === 'es' ? 'Brechas por Cláusula ISO 27001' : 'Gaps by ISO 27001 Clause'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {clauses.map(c => (
                <div key={c.clause_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: t.text }}>
                      {language === 'es' ? 'Cláusula' : 'Clause'} {c.clause_id}: {c.clause_name}
                    </span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: t.textDim }}>{language === 'es' ? 'Brecha' : 'Gap'}: {Number(c.gap).toFixed(1)}%</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: getScoreColor(c.current_score) }}>{Number(c.current_score).toFixed(1)}%</span>
                      {c.gap > 0 && onNavigate && (
                        <button 
                          onClick={() => onNavigate('doc-generator', { targetChapterNumber: c.clause_id })}
                          style={{ padding: '4px 10px', background: '#8b5cf6', border: 'none', borderRadius: '6px', color: 'white', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}
                          title={language === 'es' ? 'Generar documento con IA para cerrar esta brecha' : 'Generate AI document to close this gap'}
                        >
                          <Sparkles size={12} />
                          {language === 'es' ? 'Remediar' : 'Remediate'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ height: '8px', background: t.inputBg, borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.current_score}%`, height: '100%', background: getScoreColor(c.current_score), borderRadius: '4px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan de remediación */}
        {sprints.sprint_1 && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>
              {language === 'es' ? 'Plan de Remediación' : 'Remediation Plan'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginBottom: '10px' }}>
                  SPRINT 1 — Crítico ({sprints.sprint_1.duration_days} días)
                </div>
                {sprints.sprint_1.controls.map(ctrl => (
                  <div key={ctrl.id} style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px' }}>
                    • <strong style={{ color: '#ef4444' }}>{ctrl.id}</strong>: {ctrl.title}
                  </div>
                ))}
                <div style={{ fontSize: '11px', color: t.textDim, marginTop: '10px', borderTop: `1px solid rgba(239,68,68,0.15)`, paddingTop: '8px' }}>
                  {sprints.sprint_1.total_hours}h estimadas
                </div>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '10px' }}>
                  SPRINT 2 — Alto ({sprints.sprint_2.duration_days} días)
                </div>
                {sprints.sprint_2.controls.map(ctrl => (
                  <div key={ctrl.id} style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px' }}>
                    • <strong style={{ color: '#f59e0b' }}>{ctrl.id}</strong>: {ctrl.title}
                  </div>
                ))}
                <div style={{ fontSize: '11px', color: t.textDim, marginTop: '10px', borderTop: `1px solid rgba(245,158,11,0.15)`, paddingTop: '8px' }}>
                  {sprints.sprint_2.total_hours}h estimadas
                </div>
              </div>
            </div>
            <div style={{ marginTop: '14px', fontSize: '13px', color: t.textDim }}>
              {sprints.total_hours}h {language === 'es' ? 'estimadas en total' : 'estimated total'}
            </div>
          </div>
        )}

        {/* KPIs */}
        {allKpis.length > 0 && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginBottom: '16px' }}>KPIs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {allKpis.map((kpi, i) => {
                const name = typeof kpi === 'object' ? (kpi.name ?? '') : '';
                const current = typeof kpi === 'object' ? (kpi.current_value ?? 0) : 0;
                const target = typeof kpi === 'object' ? (kpi.target_value ?? 100) : 100;
                const unit = typeof kpi === 'object' ? (kpi.unit ?? '') : '';
                const onTrack = target === 0 ? current === 0 : current >= target;
                return (
                  <div key={i} style={{ background: t.inputBg, borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '6px', lineHeight: '1.3' }}>{name}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: onTrack ? '#10b981' : '#ef4444' }}>{current}{unit}</div>
                    <div style={{ fontSize: '11px', color: t.textDim, marginTop: '2px' }}>{language === 'es' ? 'Meta' : 'Target'}: {target}{unit}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    );
  };

  // ==========================================
  // ANALIZAR DOCUMENTO CON LLM
  // ==========================================
  const handleAnalyzeDoc = async () => {
    if (!docText.trim() || docText.trim().length < 50) {
      setDocAnalysisError('El documento debe tener al menos 50 caracteres.');
      return;
    }
    setIsAnalyzingDoc(true);
    setDocAnalysisError(null);
    setDocAnalysisResult(null);
    try {
      const result = await analyzeDocument(docText, docName || 'Documento sin nombre');
      setDocAnalysisResult(result);
    } catch (e) {
      setDocAnalysisError(e.message);
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setDocText(ev.target.result);
    reader.readAsText(file);
  };

  const AnalizarDocView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>

      {/* Panel de entrada */}
      <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#8b5cf6" />
          {language === 'es' ? 'Evaluar documento contra ISO 27001' : 'Evaluate document against ISO 27001'}
        </h3>
        <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '20px' }}>
          {language === 'es'
            ? 'Pega el contenido de tu política o procedimiento. DANI lo evaluará contra los 15 controles ISO 27001 más críticos.'
            : 'Paste your policy or procedure content. DANI will evaluate it against the 15 most critical ISO 27001 controls.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder={language === 'es' ? 'Nombre del documento (opcional)' : 'Document name (optional)'}
            value={docName}
            onChange={e => setDocName(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '13px' }}
          />
          <label style={{ padding: '10px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FolderUp size={14} />
            {language === 'es' ? 'Cargar .txt' : 'Load .txt'}
            <input type="file" accept=".txt,.md" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <textarea
          value={docText}
          onChange={e => setDocText(e.target.value)}
          placeholder={language === 'es'
            ? 'Pega aquí el contenido del documento...\n\nEjemplo: "Política de Control de Acceso v2.0\n\n1. Objetivo: Esta política establece los criterios para otorgar y revocar accesos a los sistemas de la organización..."'
            : 'Paste document content here...'}
          rows={10}
          style={{ width: '100%', padding: '14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6', boxSizing: 'border-box' }}
        />

        {docAnalysisError && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
            ⚠️ {docAnalysisError}
          </div>
        )}

        <button
          onClick={handleAnalyzeDoc}
          disabled={isAnalyzingDoc}
          style={{ marginTop: '16px', padding: '12px 28px', background: isAnalyzingDoc ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, fontSize: '14px', cursor: isAnalyzingDoc ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Sparkles size={16} />
          {isAnalyzingDoc
            ? (language === 'es' ? 'Analizando con IA...' : 'Analyzing with AI...')
            : (language === 'es' ? 'Analizar con DANI' : 'Analyze with DANI')}
        </button>
      </div>

      {/* Resultados */}
      {docAnalysisResult && (
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px' }}>

          {/* Score global */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{docAnalysisResult.document_name}</h3>
              <p style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>{docAnalysisResult.summary}</p>
              {docAnalysisResult.mode === 'demo' && (
                <span style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '10px', marginTop: '6px', display: 'inline-block' }}>
                  MODO DEMO — API no disponible
                </span>
              )}
            </div>
            <div style={{ textAlign: 'center', background: t.inputBg, borderRadius: '12px', padding: '16px 24px' }}>
              <div style={{ fontSize: '40px', fontWeight: 800, color: docAnalysisResult.overall_score >= 70 ? '#10b981' : docAnalysisResult.overall_score >= 50 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>
                {docAnalysisResult.overall_score}%
              </div>
              <div style={{ fontSize: '12px', color: t.textDim, marginTop: '4px' }}>
                {docAnalysisResult.compliant_count}/{docAnalysisResult.total_evaluated} {language === 'es' ? 'controles OK' : 'controls OK'}
              </div>
            </div>
          </div>

          {/* Brechas detectadas */}
          {docAnalysisResult.gaps?.length > 0 && (
            <div style={{ marginBottom: '20px', padding: '14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>
                ⚠️ {language === 'es' ? 'Brechas detectadas' : 'Detected gaps'}
              </div>
              {docAnalysisResult.gaps.map((gap, i) => (
                <div key={i} style={{ fontSize: '12px', color: t.textDim, marginBottom: '3px' }}>• {gap}</div>
              ))}
            </div>
          )}

          {/* Lista de controles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {docAnalysisResult.controls?.map(ctrl => (
              <div key={ctrl.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: ctrl.compliant ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${ctrl.compliant ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '10px' }}>
                <div style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>{ctrl.compliant ? '✅' : '❌'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{ctrl.id} — {ctrl.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: ctrl.compliant ? '#10b981' : '#ef4444' }}>{ctrl.score}%</span>
                      {!ctrl.compliant && onNavigate && (
                        <button 
                          onClick={() => {
                            const chapterNum = ctrl.id.startsWith('A.') ? 'annex-a' : ctrl.id.split('.')[0];
                            onNavigate('doc-generator', { targetChapterNumber: chapterNum, targetControlId: ctrl.id, targetControlTitle: ctrl.title });
                          }}
                          style={{ padding: '4px 10px', background: '#8b5cf6', border: 'none', borderRadius: '6px', color: 'white', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Sparkles size={12} />
                          {language === 'es' ? 'Remediar' : 'Remediate'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: t.textDim }}>{ctrl.finding}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>

      {/* Header con título y botones alineados a la derecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '16px' }}>

        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {tText.gapAnalysis}
          </h1>
          <p style={{ color: t.textDim, fontSize: '14px', marginTop: '4px' }}>{tText.completeAssessment}</p>
        </div>

        {/* Botones a la derecha */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveMainTab('assessment')} style={{ padding: '8px 20px', borderRadius: '6px', background: activeMainTab === 'assessment' ? '#3b82f6' : 'transparent', border: activeMainTab === 'assessment' ? 'none' : `1px solid ${t.border}`, color: activeMainTab === 'assessment' ? 'white' : t.text, fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>
            {tText.evaluation}
          </button>
          <button onClick={() => setActiveMainTab('soa')} style={{ padding: '8px 20px', borderRadius: '6px', background: activeMainTab === 'soa' ? '#3b82f6' : 'transparent', border: activeMainTab === 'soa' ? 'none' : `1px solid ${t.border}`, color: activeMainTab === 'soa' ? 'white' : t.text, fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>
            {tText.previewSOA}
          </button>
          <button onClick={() => setActiveMainTab('resultados')} style={{ padding: '8px 20px', borderRadius: '6px', background: activeMainTab === 'resultados' ? '#8b5cf6' : 'transparent', border: activeMainTab === 'resultados' ? 'none' : `1px solid ${t.border}`, color: activeMainTab === 'resultados' ? 'white' : t.text, fontWeight: 500, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} /> {language === 'es' ? 'Resultados' : language === 'pt' ? 'Resultados' : 'Results'}
          </button>
          <button onClick={() => setActiveMainTab('analyze')} style={{ padding: '8px 20px', borderRadius: '6px', background: activeMainTab === 'analyze' ? '#8b5cf6' : 'transparent', border: activeMainTab === 'analyze' ? 'none' : `1px solid ${t.border}`, color: activeMainTab === 'analyze' ? 'white' : t.text, fontWeight: 500, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={14} /> {language === 'es' ? 'Analizar Doc' : 'Analyze Doc'}
          </button>
          <button onClick={handleBulkAudit} disabled={isBulkAuditing} style={{ padding: '8px 16px', borderRadius: '6px', background: isBulkAuditing ? 'rgba(139, 92, 246, 0.1)' : 'transparent', border: `1px solid ${isBulkAuditing ? '#8b5cf6' : t.border}`, color: isBulkAuditing ? '#8b5cf6' : t.text, fontWeight: 500, fontSize: '13px', cursor: isBulkAuditing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s ease' }}>
            <Sparkles size={14} color={isBulkAuditing ? '#8b5cf6' : t.text} /> {isBulkAuditing ? (language === 'es' ? 'Auditando...' : 'Auditing...') : (language === 'es' ? 'Auditoría Total (IA)' : 'Bulk Audit (AI)')}
          </button>
          <button onClick={handleSaveProgress} disabled={isSaving} style={{ padding: '8px 16px', borderRadius: '6px', background: '#10b981', border: 'none', color: 'white', fontWeight: 500, fontSize: '13px', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> {isSaving ? tText.saving : tText.saveProgress}
          </button>

        </div>
      </div>

      {/* Contenido según pestaña */}
      {activeMainTab === 'assessment' ? (
        <>
          {/* Barra de progreso general */}
          <div style={{ background: t.cardBg, borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', border: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: t.textDim }}>{tText.generalProgress}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{globalProgress}%</span>
            </div>
            <div style={{ height: '8px', background: t.inputBg, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${globalProgress}%`, height: '100%', background: '#10b981', borderRadius: '4px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Aviso de carga / vacío / error de las preguntas (que ahora vienen de la BD) */}
          {questionsLoading && (
            <div style={{ color: t.textDim, padding: '24px', textAlign: 'center' }}>Cargando preguntas desde la base de datos...</div>
          )}
          {!questionsLoading && questionsError && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>⚠️ {questionsError}</div>
          )}
          {!questionsLoading && !questionsError && phases.length === 0 && (
            <div style={{ color: t.textDim, padding: '24px', textAlign: 'center' }}>No hay preguntas cargadas en la base de datos todavía.</div>
          )}

          {/* Panel de Evaluación con IA: subir documentos y evaluar */}
          {phases.length > 0 && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <Wand2 size={18} color="#6366f1" />
              <strong style={{ color: t.text, fontSize: '14px' }}>Evaluación con IA</strong>
              <span style={{ color: t.textDim, fontSize: '12px' }}>Sube tus documentos y la IA responderá cada pregunta (Cumple / Parcial / No).</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, cursor: 'pointer', fontSize: '13px' }}>
                <FolderUp size={16} /> Agregar documentos
                <input type="file" multiple style={{ display: 'none' }} onChange={(e) => {
                  const nuevos = Array.from(e.target.files || []);
                  setUploadedFiles((prev) => {
                    const combinado = [...prev];
                    nuevos.forEach((nf) => {
                      if (!combinado.some((f) => f.name === nf.name && f.size === nf.size)) combinado.push(nf);
                    });
                    return combinado;
                  });
                  e.target.value = ''; // permite volver a elegir el mismo archivo o agregar más
                  setEvalError(null);
                  setEvalInfo(null);
                }} />
              </label>
              <button onClick={() => handleEvaluateWithAI(false)} disabled={isEvaluating} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: isEvaluating ? 'not-allowed' : 'pointer', opacity: isEvaluating ? 0.6 : 1 }}>
                <Wand2 size={16} /> {isEvaluating ? 'Evaluando...' : 'Evaluar con IA'}
              </button>
              <button onClick={() => handleEvaluateWithAI(true)} disabled={isEvaluating} title="Reprocesa solo las preguntas que no están en 'Sí'" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontSize: '13px', cursor: isEvaluating ? 'not-allowed' : 'pointer', opacity: isEvaluating ? 0.6 : 1 }}>
                <Activity size={16} /> Revalidar con IA
              </button>
            </div>
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: t.textMuted }}>📎 {uploadedFiles.length} documento(s) seleccionado(s)</span>
                  <button onClick={() => { setUploadedFiles([]); setEvalInfo(null); setEvalError(null); }} style={{ fontSize: '11px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>Quitar todos</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {uploadedFiles.map((f, idx) => (
                    <span key={`${f.name}-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: t.text, background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '4px 10px' }}>
                      {f.name}
                      <button onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))} title="Quitar" style={{ background: 'transparent', border: 'none', color: t.textDim, cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {isEvaluating && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#6366f1' }}>🤖 La IA está analizando los documentos... esto puede tardar un poco.</div>
            )}
            {evalError && (
              <div style={{ marginTop: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>⚠️ {evalError}</div>
            )}
            {evalInfo && (
              <div style={{ marginTop: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>{evalInfo}</div>
            )}
          </div>
          )}

          {/* Grid principal del wizard */}
          {phases.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: '24px' }}>

            {/* Columna izquierda - FASES */}
            <div>
              <h3 style={{ fontSize: '11px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', paddingLeft: '8px' }}>{tText.phases}</h3>
              {phases.map((phase, idx) => {
                const Icon = phase.icon;
                const isActive = currentPhase === idx;
                const phaseProgress = getPhaseProgress(idx);
                return (
                  <button key={phase.id} onClick={() => { setCurrentPhase(idx); setCurrentQuestion(0); }} style={{ width: '100%', padding: '16px', marginBottom: '8px', background: isActive ? 'rgba(16, 185, 129, 0.1)' : t.cardBg, border: isActive ? `1px solid rgba(16, 185, 129, 0.3)` : `1px solid ${t.border}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isActive ? '#10b981' : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color={isActive ? 'white' : t.textDim} /></div>
                      <div><div style={{ fontSize: '14px', fontWeight: 600, color: isActive ? '#10b981' : t.text }}>{phase.name}</div><div style={{ fontSize: '11px', color: t.textDim }}>{phase.clause}</div></div>
                    </div>
                    <div style={{ fontSize: '11px', color: t.textDim, marginTop: '4px' }}>{phase.questions.filter(q => answers[q.id]).length}/{phase.questions.length} {tText.question.toLowerCase()}</div>
                    {phaseProgress > 0 && <div style={{ marginTop: '8px', height: '4px', background: t.inputBg, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${phaseProgress}%`, height: '100%', background: '#10b981', borderRadius: '2px' }} /></div>}
                  </button>
                );
              })}
            </div>

            {/* Columna central - PREGUNTA */}
            {currentQuestionData && (
              <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', color: t.textDim }}>{tText.question} {currentQuestion + 1} de {currentPhaseData.questions.length}</span>
                  {currentQuestionData.critical && <span style={{ marginLeft: '12px', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '12px', fontSize: '10px' }}>{tText.critical}</span>}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: t.text }}>{currentQuestionData.title}</h3>
                <p style={{ fontSize: '16px', marginBottom: '32px', lineHeight: '1.5', color: t.text }}>{currentQuestionData.question}</p>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                  {currentQuestionData.options.map(option => (
                    <button key={option} onClick={() => handleAnswer(option)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: answers[currentQuestionData.id] === option ? '2px solid #10b981' : `1px solid ${t.border}`, background: answers[currentQuestionData.id] === option ? 'rgba(16, 185, 129, 0.1)' : t.cardBg, color: answers[currentQuestionData.id] === option ? '#10b981' : t.text, cursor: 'pointer', fontWeight: 500 }}>
                      {option}
                    </button>
                  ))}
                </div>
                {aiResults[currentQuestionData.id] && (
                  <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: t.inputBg, border: `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Wand2 size={14} color="#6366f1" />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: t.text }}>Respuesta de la IA:</span>
                      {(() => {
                        const v = aiResults[currentQuestionData.id].veredicto;
                        const map = { cumple: ['Cumple', '#10b981'], parcial: ['Parcial', '#f59e0b'], no_cumple: ['No cumple', '#ef4444'], sin_evidencia: ['Sin evidencia', '#6b7280'] };
                        const [label, color] = map[v] || ['—', t.textDim];
                        return <span style={{ fontSize: '11px', fontWeight: 700, color, background: `${color}22`, padding: '2px 8px', borderRadius: '10px' }}>{label}</span>;
                      })()}
                      {typeof aiResults[currentQuestionData.id].confianza === 'number' && (
                        <span style={{ fontSize: '11px', color: t.textDim }}>Confianza: {Math.round((aiResults[currentQuestionData.id].confianza || 0) * 100)}%</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: t.textMuted, lineHeight: '1.5' }}>{aiResults[currentQuestionData.id].justificacion}</div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  <button onClick={goToPrev} disabled={currentPhase === 0 && currentQuestion === 0} style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', cursor: (currentPhase === 0 && currentQuestion === 0) ? 'not-allowed' : 'pointer', opacity: (currentPhase === 0 && currentQuestion === 0) ? 0.5 : 1 }}>{tText.previous}</button>
                  <button onClick={goToNext} style={{ padding: '10px 20px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>{tText.continue}</button>
                </div>
              </div>
            )}

            {/* Columna derecha - Vista previa SOA */}
            <div style={{ background: t.cardBg, borderRadius: '16px', padding: '20px', border: `1px solid ${t.border}`, height: 'fit-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><Sparkles size={18} color="#10b981" /><h3 style={{ fontSize: '15px', fontWeight: 600 }}>{tText.previewSOATitle}</h3></div>
              {phases.map((phase, idx) => {
                const progress = getPhaseProgress(idx);
                return (
                  <div key={phase.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: t.textDim }}>{phase.clause}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: progress === 100 ? '#10b981' : t.textMuted }}>{progress}%</span>
                  </div>
                );
              })}
              <button onClick={() => setActiveMainTab('soa')} style={{ width: '100%', marginTop: '20px', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: `1px solid rgba(16, 185, 129, 0.3)`, borderRadius: '8px', color: '#10b981', cursor: 'pointer' }}>{tText.viewSOA}</button>
            </div>
          </div>
          )}
        </>
      ) : activeMainTab === 'soa' ? (
        <InteractiveSOA />
      ) : activeMainTab === 'analyze' ? (
        <AnalizarDocView />
      ) : (
        <ResultadosView />
      )}
    </div>
  );
}

export default GapAnalysisScreen;