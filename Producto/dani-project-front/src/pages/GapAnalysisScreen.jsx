// src/pages/GapAnalysisScreen.jsx
import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  Building2, Target, Users, Lock, Sparkles, Eye,
  ChevronLeft, ChevronRight, Download, FolderUp, CheckCircle2,
  AlertCircle, Activity, Shield, Edit3, FileCheck, Globe, Wand2, Settings, Plus, Trash2
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

  const loadQuestions = async () => {
    setQuestionsLoading(true); setQuestionsError(null);
    try {
      const data = await assessmentQuestionsAPI.getAll();
      setDbQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar preguntas', err);
      setQuestionsError('No se pudieron cargar las preguntas desde la base de datos.');
      setDbQuestions([]);
    } finally { setQuestionsLoading(false); }
  };
  useEffect(() => { loadQuestions(); }, []);

  const clauseNum = (codigo) => (codigo || '').split('.')[0];
  // Categorías equivalentes utilizadas en distintas cargas de preguntas.
  const isPrivacyQuestion = (q) => {
    const category = String(q.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return category.includes('privacidad') || category.includes('proteccion de datos') ||
      category.includes('datos personales') || /\bley\s*21[.\s]*719\b/.test(category) ||
      /\bley\s*21719\b/.test(category);
  };
  const phaseDefs = [
    { id: 'context',  name: 'Contexto y Liderazgo', clause: 'Cláusulas 4 y 5', icon: Building2, color: '#3b82f6', match: (q) => q.categoria?.startsWith('Cláusula') && ['4', '5'].includes(clauseNum(q.codigo)) },
    { id: 'planning', name: 'Planificación y Riesgo', clause: 'Cláusula 6', icon: Target, color: '#004ac6', match: (q) => q.categoria?.startsWith('Cláusula') && clauseNum(q.codigo) === '6' },
    { id: 'support',  name: 'Soporte, Operación y Mejora', clause: 'Cláusulas 7 a 10', icon: Users, color: '#f59e0b', match: (q) => q.categoria?.startsWith('Cláusula') && ['7', '8', '9', '10'].includes(clauseNum(q.codigo)) },
    { id: 'org',      name: 'Anexo A — Organizacional', clause: 'Controles A.5', icon: Shield, color: '#a855f7', match: (q) => q.categoria === 'Organizacional' },
    { id: 'people',   name: 'Anexo A — Personas', clause: 'Controles A.6', icon: Users, color: '#ec4899', match: (q) => q.categoria === 'Personas' },
    { id: 'phys',     name: 'Anexo A — Físico', clause: 'Controles A.7', icon: Lock, color: '#06b6d4', match: (q) => q.categoria === 'Físico' },
    { id: 'tech',     name: 'Anexo A — Tecnológico', clause: 'Controles A.8', icon: Globe, color: '#8b5cf6', match: (q) => q.categoria === 'Tecnológico' },
    { id: 'ley',      name: 'Ley 21.719 — Privacidad', clause: 'Protección de Datos', icon: Eye, color: '#14b8a6', match: isPrivacyQuestion },
  ];

  const phases = useMemo(() => {
    return phaseDefs.map((def) => ({
      id: def.id, name: def.name, clause: def.clause, icon: def.icon, color: def.color,
      questions: dbQuestions.filter(def.match).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map((q) => ({
        id: q.id, title: `${q.codigo} — ${q.nombre}`, question: q.pregunta, codigo: q.codigo, options: [tText.yes, tText.partially, tText.no], critical: q.categoria?.startsWith('Cláusula'), evidencia: q.evidencia_esperada,
      })),
    })).filter((p) => p.id === 'ley' || p.questions.length > 0);
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

  const handleAnswer = (answer) => {
    setAnswers({ ...answers, [currentQuestionData.id]: answer });
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
    setIsSaving(true);
    try { await complianceAPI.fullAssessment({ controls, answers }); alert("¡Progreso guardado con éxito!"); loadAnalysis(); } catch (e) { alert("Error al guardar"); } finally { setIsSaving(false); }
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

      // 3. Forzamos el guardado de la SOA y recalcular Resultados inmediatamente
      try { await complianceAPI.fullAssessment({ controls: updatedControls, answers: newAnswers }); await loadAnalysis(); } catch(e) { console.warn("No se pudo autoguardar", e); }

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
      
      alert(finalMsg);
      setEvalInfo(finalMsg);
      
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

  const toggleApplicable = (id) => setControls(prev => prev.map(c => c.id === id ? { ...c, applicable: !c.applicable } : c));
  const updateStatus = (id, status) => setControls(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  const updateJustification = (id, justification) => { setControls(prev => prev.map(c => c.id === id ? { ...c, justification } : c)); setShowJustificationModal(null); };

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
      
      <div className="soa-table-scroll" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px' }}>
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
      <div style={{ padding: '10px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#004ac6' }}>
        <CheckCircle2 size={14} /><span>{tText.autoSaved}</span>
      </div>

      {showJustificationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: t.cardBg, borderRadius: '16px', padding: '24px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>{tText.justification}</h3>
            <textarea defaultValue={showJustificationModal.justification} rows={4} style={{ width: '100%', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '14px', marginBottom: '16px' }} id="justification-textarea" />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>Configuración del Cuestionario</h2>
            <p style={{ fontSize: '13px', color: t.textDim }}>Agrega, edita o elimina preguntas de la base de evaluación ISO 27001 y Ley 21.719.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleDownloadTemplate} title="Descargar plantilla Excel" style={{ padding: '10px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Download size={16} /> Plantilla
          </button>
          <label title="Importar preguntas desde Excel (.xlsx)" style={{ padding: '10px 16px', background: 'transparent', border: `1px solid #004ac6`, borderRadius: '8px', color: '#004ac6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: importing ? 'wait' : 'pointer' }}>
            <FolderUp size={16} /> {importing ? 'Importando…' : 'Importar Excel'}
            <input type="file" accept=".xlsx,.xlsm" onChange={handleImportExcel} disabled={importing} style={{ display: 'none' }} />
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
                <span><strong style={{ color: '#004ac6' }}>✓ {importResult.creadas}</strong> preguntas creadas · <strong>{importResult.omitidas}</strong> omitidas (de {importResult.total_filas_datos} filas con datos).</span>
                {importResult.columnas_detectadas && (
                  <span style={{ color: t.textDim, fontSize: '12px' }}>
                    Columnas detectadas: {Object.entries(importResult.columnas_detectadas).map(([k, v]) => `${k} ← "${v}"`).join('  ·  ')}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
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

        {/* Modal Formulario */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: t.cardBg, borderRadius: '16px', padding: '24px', width: '600px', maxWidth: '90%' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', color: t.text }}>{editingQ ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
              <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
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
        .normia-gap, .normia-gap * { box-sizing: border-box; }
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
          {!questionsLoading && questionsError && <div role="alert" style={{ padding: '14px', color: '#dc2626', background: 'rgba(239,68,68,.07)', borderRadius: '10px', marginBottom: '16px' }}>{questionsError}</div>}
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
