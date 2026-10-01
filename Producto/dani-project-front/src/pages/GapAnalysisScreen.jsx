// src/pages/GapAnalysisScreen.jsx
import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  Building2, Target, Users, Lock, Sparkles, Eye,
  ChevronLeft, ChevronRight, Download, FolderUp, CheckCircle2,
  AlertCircle, Activity, Shield, Edit3, FileCheck, Globe, Wand2, Settings, Plus, Trash2
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { complianceAPI, documentsAPI, API_URL, assessmentQuestionsAPI } from '../services/api';
import { getFullGapAnalysis, getComplianceScore, analyzeDocument } from '../services/gapAnalysisAPI';
import { getControlName } from '../translations/controls';

function GapAnalysisScreen({ onNavigate }) {
  const { theme: t, language, setLanguage } = useContext(ThemeContext);
  const { user } = useAuth();
  // Administrar el catálogo de preguntas: owner/admin (y superadmin). Debe
  // coincidir con el backend (create/update/delete exigen rol admin; owner y
  // superadmin pasan por jerarquía). El manager NO administra el catálogo.
  const isAdmin = user && ['superadmin', 'owner', 'admin'].includes(user?.role);

  // Traducciones básicas
  const tText = {
    en: { gapAnalysis: 'Gap Analysis', completeAssessment: 'Complete the assessment to generate your SOA', question: 'Question', previous: 'Previous', continue: 'Continue', yes: 'Yes', no: 'No', partially: 'Partially', soaTitle: 'Statement of Applicability (SOA)', soaApplicable: 'Applicable', soaImplemented: 'Implemented', showAll: 'All', showApplicable: 'Applicable', showNotApplicable: 'Not Applicable', control: 'Control', description: 'Description', applicable: 'Applicable', status: 'Status', justification: 'Justification', implemented: 'Implemented', planned: 'Planned', notImplemented: 'Not Implemented', required: 'Required', autoSaved: 'Auto-saved' },
    es: { gapAnalysis: 'Análisis de Brechas', completeAssessment: 'Completa la evaluación para generar tu Declaración de Aplicabilidad (SOA)', question: 'Pregunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sí', no: 'No', partially: 'Parcialmente', soaTitle: 'Declaración de Aplicabilidad (SOA)', soaApplicable: 'Aplica', soaImplemented: 'Implementado', showAll: 'Todos', showApplicable: 'Aplica', showNotApplicable: 'No Aplica', control: 'Control', description: 'Descripción', applicable: 'Aplica', status: 'Estado', justification: 'Justificación', implemented: 'Implementado', planned: 'Planificado', notImplemented: 'No Implementado', required: 'Requerido', autoSaved: 'Auto-guardado' },
    pt: { gapAnalysis: 'Análise de Lacunas', completeAssessment: 'Complete a avaliação para gerar sua Declaração de Aplicabilidade (SOA)', question: 'Pergunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sim', no: 'Não', partially: 'Parcialmente', soaTitle: 'Declaração de Aplicabilidade (SOA)', soaApplicable: 'Aplicável', soaImplemented: 'Implementado', showAll: 'Todos', showApplicable: 'Aplicável', showNotApplicable: 'Não Aplicável', control: 'Controle', description: 'Descrição', applicable: 'Aplicável', status: 'Status', justification: 'Justificativa', implemented: 'Implementado', planned: 'Planejado', notImplemented: 'Não Implementado', required: 'Obrigatório', autoSaved: 'Auto-salvo' }
  }[language] || { gapAnalysis: 'Análisis de Brechas', completeAssessment: 'Completa la evaluación para generar tu Declaración de Aplicabilidad (SOA)', question: 'Pregunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sí', no: 'No', partially: 'Parcialmente', soaTitle: 'Declaración de Aplicabilidad (SOA)', soaApplicable: 'Aplica', soaImplemented: 'Implementado', showAll: 'Todos', showApplicable: 'Aplica', showNotApplicable: 'No Aplica', control: 'Control', description: 'Descripción', applicable: 'Aplica', status: 'Estado', justification: 'Justificación', implemented: 'Implementado', planned: 'Planificado', notImplemented: 'No Implementado', required: 'Requerido', autoSaved: 'Auto-guardado' };

  // Estados principales
  const [activeMainTab, setActiveMainTab] = useState('assessment');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
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
  
  // Estado para LLM local
  const [docText, setDocText] = useState('');
  const [docName, setDocName] = useState('');
  const [docAnalysisResult, setDocAnalysisResult] = useState(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [docAnalysisError, setDocAnalysisError] = useState(null);

  // Estados para BD de Preguntas
  const [dbQuestions, setDbQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState(null);
  
  // Estado para Evaluación IA
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState(null);
  const [evalInfo, setEvalInfo] = useState(null);
  const [aiResults, setAiResults] = useState(() => { try { return JSON.parse(localStorage.getItem('dani_gap_ai_results') || '{}'); } catch { return {}; } });

  useEffect(() => { try { localStorage.setItem('dani_gap_answers', JSON.stringify(answers)); } catch {} }, [answers]);
  useEffect(() => { try { localStorage.setItem('dani_gap_ai_results', JSON.stringify(aiResults)); } catch {} }, [aiResults]);

  // Carga centralizada de preguntas
  const loadQuestions = async () => {
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const data = await assessmentQuestionsAPI.getAll();
      setDbQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar las preguntas de evaluación', err);
      setQuestionsError('No se pudieron cargar las preguntas desde la base de datos.');
      setDbQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => { loadQuestions(); }, []);

  // Inicialización de Fases
  const clauseNum = (codigo) => (codigo || '').split('.')[0];
  const phaseDefs = [
    { id: 'context',  name: 'Contexto y Liderazgo', clause: 'Cláusulas 4 y 5', icon: Building2, color: '#3b82f6', match: (q) => q.categoria?.startsWith('Cláusula') && ['4', '5'].includes(clauseNum(q.codigo)) },
    { id: 'planning', name: 'Planificación y Riesgo', clause: 'Cláusula 6', icon: Target, color: '#10b981', match: (q) => q.categoria?.startsWith('Cláusula') && clauseNum(q.codigo) === '6' },
    { id: 'support',  name: 'Soporte, Operación y Mejora', clause: 'Cláusulas 7 a 10', icon: Users, color: '#f59e0b', match: (q) => q.categoria?.startsWith('Cláusula') && ['7', '8', '9', '10'].includes(clauseNum(q.codigo)) },
    { id: 'org',      name: 'Anexo A — Organizacional', clause: 'Controles A.5', icon: Shield, color: '#a855f7', match: (q) => q.categoria === 'Organizacional' },
    { id: 'people',   name: 'Anexo A — Personas', clause: 'Controles A.6', icon: Users, color: '#ec4899', match: (q) => q.categoria === 'Personas' },
    { id: 'phys',     name: 'Anexo A — Físico', clause: 'Controles A.7', icon: Lock, color: '#06b6d4', match: (q) => q.categoria === 'Físico' },
    { id: 'tech',     name: 'Anexo A — Tecnológico', clause: 'Controles A.8', icon: Globe, color: '#8b5cf6', match: (q) => q.categoria === 'Tecnológico' },
    // Sección de la Ley 21.719 (protección de datos). Las preguntas creadas con
    // categoría "Privacidad" (o cualquier "Ley ...") caen aquí.
    { id: 'ley',      name: 'Ley 21.719 — Privacidad', clause: 'Protección de Datos', icon: Eye, color: '#14b8a6', match: (q) => q.categoria === 'Privacidad' || (q.categoria || '').toLowerCase().startsWith('ley') },
  ];

  const phases = useMemo(() => {
    return phaseDefs.map((def) => ({
      id: def.id, name: def.name, clause: def.clause, icon: def.icon, color: def.color,
      questions: dbQuestions.filter(def.match).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map((q) => ({
        id: q.id, title: `${q.codigo} — ${q.nombre}`, question: q.pregunta, options: [tText.yes, tText.partially, tText.no], critical: q.categoria?.startsWith('Cláusula'), evidencia: q.evidencia_esperada,
      })),
    })).filter((p) => p.questions.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuestions, language]);

  // Carga Controles ISO
  useEffect(() => {
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
    loadISOControls();
  }, []);

  // Carga Análisis Brechas
  useEffect(() => {
    const loadAnalysis = async () => {
      setIsLoadingAnalysis(true);
      try {
        const [analysis, score] = await Promise.all([getFullGapAnalysis(), getComplianceScore()]);
        setFullAnalysis(analysis); setOverallScore(score);
      } catch (error) { console.error(error); } finally { setIsLoadingAnalysis(false); }
    };
    loadAnalysis();
  }, []);

  // Carga Docs IA
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const data = await documentsAPI.getPublishedPolicies(localStorage.getItem('token'));
        if (data?.policies) setAvailableDocs(data.policies);
      } catch (error) { console.error(error); }
    };
    loadDocs();
  }, []);

  // Lógica de UI general...
  const getPhaseProgress = (idx) => {
    const phase = phases[idx];
    if (!phase || phase.questions.length === 0) return 0;
    const answered = phase.questions.filter(q => answers[q.id]).length;
    return Math.round((answered / phase.questions.length) * 100);
  };
  const totalQuestions = phases.reduce((sum, p) => sum + p.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const globalProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
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
    try { await complianceAPI.fullAssessment({ controls, answers }); alert("¡Progreso guardado con éxito!"); } catch (e) { alert("Error al guardar"); } finally { setIsSaving(false); }
  };

  // ==========================================
  // FUNCIONES DE EVALUACIÓN CON IA
  // ==========================================

  const veredictoToOption = (veredicto) => {
    if (veredicto === 'cumple') return tText.yes;
    if (veredicto === 'parcial') return tText.partially;
    return tText.no; // no_cumple o sin_evidencia
  };

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

  // ==========================================
  // DEFINICIONES SOA Y RESULTADOS
  // ==========================================
  
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
            <button key={filter.id} onClick={() => { setFilterApplicable(filter.id); setCurrentPage(1); }} style={{ padding: '6px 14px', background: filterApplicable === filter.id ? '#10b98120' : 'transparent', border: `1px solid ${filterApplicable === filter.id ? '#10b981' : t.border}`, borderRadius: '20px', color: filterApplicable === filter.id ? '#10b981' : t.textMuted, fontSize: '12px', cursor: 'pointer' }}>
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
                    <button onClick={() => toggleApplicable(control.id)} style={{ padding: '5px 10px', background: control.applicable ? '#10b98120' : 'transparent', border: `1px solid ${control.applicable ? '#10b981' : t.border}`, borderRadius: '5px 0 0 5px', color: control.applicable ? '#10b981' : t.textDim, fontSize: '11px', cursor: 'pointer' }}>{tText.applicable}</button>
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
    </div>
  );

  const ResultadosView = () => {
    const getScoreColor = (s) => s >= 85 ? '#10b981' : s >= 70 ? '#f59e0b' : '#ef4444';
    if (isLoadingAnalysis) return <div style={{ padding: '80px', textAlign: 'center', color: t.textDim }}>Calculando análisis...</div>;
    if (!overallScore && !fullAnalysis) return <div style={{ padding: '60px', textAlign: 'center', color: t.textDim }}>No se pudo cargar el análisis.</div>;

    const score = overallScore?.overall_score ?? 0;
    const gap = overallScore?.gap_to_certification ?? 0;
    const clauses = fullAnalysis?.clause_gaps ?? [];
    
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

  // ==========================================
  // PANEL ADMINISTRATIVO DE PREGUNTAS (CRUD)
  // ==========================================
  const QuestionsAdminView = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingQ, setEditingQ] = useState(null);
    const [formData, setFormData] = useState({ codigo: '', categoria: 'Organizacional', nombre: '', pregunta: '', evidencia_esperada: '', orden: 0 });
    const [isSavingQ, setIsSavingQ] = useState(false);

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
          <button onClick={() => handleOpenModal()} style={{ padding: '10px 16px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Plus size={16} /> Nueva Pregunta
          </button>
        </div>

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
                      <button onClick={() => handleOpenModal(q)} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: t.textMuted, padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Edit3 size={14}/></button>
                      <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14}/></button>
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
                  <button type="submit" disabled={isSavingQ} style={{ padding: '10px 16px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: isSavingQ ? 'wait' : 'pointer' }}>{isSavingQ ? 'Guardando...' : 'Guardar Pregunta'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      {/* Header con título y botones alineados a la derecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {tText.gapAnalysis}
          </h1>
          <p style={{ color: t.textDim, fontSize: '14px', marginTop: '4px' }}>{tText.completeAssessment}</p>
        </div>

        {/* Botones de navegación superior */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveMainTab('assessment')} style={{ padding: '8px 16px', borderRadius: '8px', background: activeMainTab === 'assessment' ? '#3b82f6' : 'transparent', border: activeMainTab === 'assessment' ? 'none' : `1px solid ${t.border}`, color: activeMainTab === 'assessment' ? 'white' : t.text, fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>Evaluación</button>
          <button onClick={() => setActiveMainTab('soa')} style={{ padding: '8px 16px', borderRadius: '8px', background: activeMainTab === 'soa' ? '#3b82f6' : 'transparent', border: activeMainTab === 'soa' ? 'none' : `1px solid ${t.border}`, color: activeMainTab === 'soa' ? 'white' : t.text, fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>SOA</button>
          <button onClick={() => setActiveMainTab('resultados')} style={{ padding: '8px 16px', borderRadius: '8px', background: activeMainTab === 'resultados' ? '#8b5cf6' : 'transparent', border: activeMainTab === 'resultados' ? 'none' : `1px solid ${t.border}`, color: activeMainTab === 'resultados' ? 'white' : t.text, fontWeight: 500, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14} /> Resultados</button>
          
          {/* NUEVO BOTON DE ADMIN PREGUNTAS */}
          {isAdmin && (
            <button onClick={() => setActiveMainTab('admin-questions')} style={{ padding: '8px 16px', borderRadius: '8px', background: activeMainTab === 'admin-questions' ? '#f59e0b' : 'transparent', border: activeMainTab === 'admin-questions' ? 'none' : `1px solid ${t.border}`, color: activeMainTab === 'admin-questions' ? 'white' : t.text, fontWeight: 500, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={14} /> Conf. Preguntas
            </button>
          )}
          
          <button onClick={handleSaveProgress} disabled={isSaving} style={{ padding: '8px 16px', borderRadius: '8px', background: '#10b981', border: 'none', color: 'white', fontWeight: 500, fontSize: '13px', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
            <Download size={14} /> {isSaving ? tText.saving : tText.saveProgress}
          </button>
        </div>
      </div>

      {/* Contenido según pestaña */}
      {activeMainTab === 'assessment' ? (
        <>
          <div style={{ background: t.cardBg, borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', border: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: t.textDim }}>Progreso General</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{globalProgress}%</span>
            </div>
            <div style={{ height: '8px', background: t.inputBg, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${globalProgress}%`, height: '100%', background: '#10b981', borderRadius: '4px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {questionsLoading && <div style={{ color: t.textDim, padding: '24px', textAlign: 'center' }}>Cargando preguntas desde la base de datos...</div>}
          {!questionsLoading && phases.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '11px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', paddingLeft: '8px' }}>Fases</h3>
                {phases.map((phase, idx) => {
                  const Icon = phase.icon;
                  const isActive = currentPhase === idx;
                  const phaseProgress = getPhaseProgress(idx);
                  return (
                    <button key={phase.id} onClick={() => { setCurrentPhase(idx); setCurrentQuestion(0); }} style={{ width: '100%', padding: '16px', marginBottom: '8px', background: isActive ? 'rgba(16, 185, 129, 0.1)' : t.cardBg, border: isActive ? `1px solid rgba(16, 185, 129, 0.3)` : `1px solid ${t.border}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isActive ? '#10b981' : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color={isActive ? 'white' : t.textDim} /></div>
                        <div><div style={{ fontSize: '14px', fontWeight: 600, color: isActive ? '#10b981' : t.text }}>{phase.name}</div></div>
                      </div>
                      {phaseProgress > 0 && <div style={{ marginTop: '8px', height: '4px', background: t.inputBg, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${phaseProgress}%`, height: '100%', background: '#10b981', borderRadius: '2px' }} /></div>}
                    </button>
                  );
                })}
              </div>

              <div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
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
                  <div style={{ marginBottom: '16px' }}>
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
                  <div style={{ marginBottom: '16px', fontSize: '12px', color: '#6366f1' }}>🤖 La IA está analizando los documentos... esto puede tardar un poco.</div>
                )}
                {evalError && (
                  <div style={{ marginBottom: '16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>⚠️ {evalError}</div>
                )}
                {evalInfo && (
                  <div style={{ marginBottom: '16px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>{evalInfo}</div>
                )}

                {currentQuestionData && (
                  <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '24px' }}>
                    <div style={{ marginBottom: '16px' }}><span style={{ fontSize: '12px', color: t.textDim }}>Pregunta {currentQuestion + 1} de {currentPhaseData.questions.length}</span></div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: t.text }}>{currentQuestionData.title}</h3>
                    <p style={{ fontSize: '16px', marginBottom: '32px', lineHeight: '1.5', color: t.text }}>{currentQuestionData.question}</p>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                      {currentQuestionData.options.map(option => (
                        <button key={option} onClick={() => handleAnswer(option)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: answers[currentQuestionData.id] === option ? '2px solid #10b981' : `1px solid ${t.border}`, background: answers[currentQuestionData.id] === option ? 'rgba(16, 185, 129, 0.1)' : t.cardBg, color: answers[currentQuestionData.id] === option ? '#10b981' : t.text, cursor: 'pointer', fontWeight: 500 }}>{option}</button>
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
                      <button onClick={goToPrev} disabled={currentPhase === 0 && currentQuestion === 0} style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', cursor: (currentPhase === 0 && currentQuestion === 0) ? 'not-allowed' : 'pointer', opacity: (currentPhase === 0 && currentQuestion === 0) ? 0.5 : 1 }}>Anterior</button>
                      <button onClick={goToNext} style={{ padding: '10px 20px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Continuar</button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: t.cardBg, borderRadius: '16px', padding: '20px', border: `1px solid ${t.border}`, height: 'fit-content' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><Sparkles size={18} color="#10b981" /><h3 style={{ fontSize: '15px', fontWeight: 600 }}>Vista Previa</h3></div>
                {phases.map((phase, idx) => (
                  <div key={phase.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: t.textDim }}>{phase.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: getPhaseProgress(idx) === 100 ? '#10b981' : t.textMuted }}>{getPhaseProgress(idx)}%</span>
                  </div>
                ))}
              </div>
            </div>
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
        <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>Vista seleccionada no implementada en este resumen.</div>
      )}
    </div>
  );
}

export default GapAnalysisScreen;