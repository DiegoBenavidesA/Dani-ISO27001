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
  const { user } = useAuth(); // Importamos el usuario para validar roles
  const isAdmin = user && ['admin', 'manager'].includes(user?.role);

  // Traducciones básicas
  const tText = {
    en: { gapAnalysis: 'Gap Analysis', completeAssessment: 'Complete the assessment to generate your SOA', question: 'Question', previous: 'Previous', continue: 'Continue', yes: 'Yes', no: 'No', partially: 'Partially' },
    es: { gapAnalysis: 'Análisis de Brechas', completeAssessment: 'Completa la evaluación para generar tu Declaración de Aplicabilidad (SOA)', question: 'Pregunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sí', no: 'No', partially: 'Parcialmente' },
    pt: { gapAnalysis: 'Análise de Lacunas', completeAssessment: 'Complete a avaliação para gerar sua Declaração de Aplicabilidade (SOA)', question: 'Pergunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sim', no: 'Não', partially: 'Parcialmente' }
  }[language] || { gapAnalysis: 'Análisis de Brechas', completeAssessment: 'Completa la evaluación para generar tu Declaración de Aplicabilidad (SOA)', question: 'Pregunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sí', no: 'No', partially: 'Parcialmente' };

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
  ];

  const phases = useMemo(() => {
    return phaseDefs.map((def) => ({
      id: def.id, name: def.name, clause: def.clause, icon: def.icon, color: def.color,
      questions: dbQuestions.filter(def.match).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map((q) => ({
        id: q.id, title: `${q.codigo} — ${q.nombre}`, question: q.pregunta, options: [tText.yes, tText.partially, tText.no], critical: q.categoria?.startsWith('Cláusula'), evidencia: q.evidencia_esperada,
      })),
    })).filter((p) => p.questions.length > 0);
  }, [dbQuestions, language]);

  // Resto de hooks de carga...
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
        if (editingQ) {
          await assessmentQuestionsAPI.update(editingQ, formData);
        } else {
          await assessmentQuestionsAPI.create(formData);
        }
        await loadQuestions();
        setShowModal(false);
      } catch (err) {
        alert("Error al guardar la pregunta: " + err.message);
      } finally {
        setIsSavingQ(false);
      }
    };

    const handleDeleteQuestion = async (id) => {
      if (!window.confirm("¿Seguro que deseas eliminar esta pregunta?")) return;
      try {
        await assessmentQuestionsAPI.delete(id);
        await loadQuestions();
      } catch (err) {
        alert("Error al eliminar la pregunta");
      }
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                    <button onClick={goToPrev} disabled={currentPhase === 0 && currentQuestion === 0} style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', cursor: (currentPhase === 0 && currentQuestion === 0) ? 'not-allowed' : 'pointer', opacity: (currentPhase === 0 && currentQuestion === 0) ? 0.5 : 1 }}>Anterior</button>
                    <button onClick={goToNext} style={{ padding: '10px 20px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Continuar</button>
                  </div>
                </div>
              )}

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
      ) : activeMainTab === 'admin-questions' ? (
        <QuestionsAdminView />
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>Vista seleccionada no implementada en este resumen.</div>
      )}
    </div>
  );
}

export default GapAnalysisScreen;