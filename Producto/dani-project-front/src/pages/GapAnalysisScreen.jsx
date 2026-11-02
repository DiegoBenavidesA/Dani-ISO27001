// src/pages/GapAnalysisScreen.jsx
import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import {
  Building2, Target, Users, Lock, Eye,
  ChevronLeft, ChevronRight, Download, FolderUp, CheckCircle2, AlertCircle,
  Activity, Shield, Edit3, FileCheck, Globe, Wand2, Settings, Plus, Trash2, FileText
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { complianceAPI, documentsAPI, API_URL, assessmentQuestionsAPI, evidenceAPI } from '../services/api';
import { getFullGapAnalysis, getComplianceScore } from '../services/gapAnalysisAPI';
import { getControlName } from '../translations/controls';

const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Los PDF suelen traer títulos en MAYÚSCULAS con palabras partidas
// ("INFORMACIÓ N", "DER ECHOS", "INTERESADO ."). Los dejamos legibles.
function limpiarTituloPdf(texto) {
  let s = String(texto || '').replace(/\s+/g, ' ').trim();
  if (s !== s.toUpperCase()) return s; // ya viene bien escrito (p. ej. catálogo propio)
  s = s
    .replace(/(\p{L}) ([NS])(?=[\s.,;:)»]|$)/gu, '$1$2') // "INFORMACIÓ N" → "INFORMACIÓN"
    .replace(/\bDER ECHOS\b/g, 'DERECHOS')
    .replace(/\bINTERESAD O\b/g, 'INTERESADO')
    .replace(/\s+DER$/, '') // resto del título siguiente que se coló al final
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/[.,;:\s]+$/, '');
  s = s.toLowerCase();
  return s.replace(/(^|[.!?]\s+|«)(\p{L})/gu, (m, sep, letra) => sep + letra.toUpperCase());
}

// Obligaciones de la Ley 21.719 en las que se agrupan los temas del cuestionario.
// El orden importa: gana el primer grupo cuya palabra clave aparece en el tema.
const LEY_GRUPOS = [
  { id: 'ley-seguridad', name: 'Seguridad y vulneraciones', icon: Lock, claves: ['brecha', 'vulneracion', 'seguridad'] },
  { id: 'ley-impacto', name: 'Evaluación de impacto', icon: Target, claves: ['evaluacion de impacto'] },
  { id: 'ley-registro', name: 'Registro de actividades de tratamiento', icon: FileText, claves: ['registro', 'tratamiento de datos personales'] },
  { id: 'ley-terceros', name: 'Encargados y transferencias', icon: Globe, claves: ['encargado', 'transferencia'] },
  { id: 'ley-gobernanza', name: 'Responsabilidad y gobernanza', icon: Building2, claves: ['responsabilidad', 'diseno', 'corresponsable', 'delegado', 'gobernanza'] },
  { id: 'ley-principios', name: 'Principios y licitud', icon: Shield, claves: ['principio', 'licitud', 'consentimiento', 'categorias especiales', 'condena', 'identificacion'] },
  { id: 'ley-derechos', name: 'Derechos de los titulares', icon: Users, claves: ['derecho', 'interesado', 'titular'] },
];

function GapAnalysisScreen({ onNavigate }) {
  const { theme: t, language } = useContext(ThemeContext);
  const { user } = useAuth();
  const isAdmin = user && ['superadmin', 'owner', 'admin'].includes(user?.role);

  const tText = {
    en: { gapAnalysis: 'Gap Analysis', completeAssessment: 'Complete the assessment to generate your SOA', question: 'Question', previous: 'Previous', continue: 'Continue', yes: 'Yes', no: 'No', partially: 'Partially', soaTitle: 'Statement of Applicability (SOA)', soaApplicable: 'Applicable', soaImplemented: 'Implemented', showAll: 'All', showApplicable: 'Applicable', showNotApplicable: 'Not Applicable', control: 'Control', description: 'Description', applicable: 'Applicable', status: 'Status', justification: 'Justification', implemented: 'Implemented', planned: 'Planned', notImplemented: 'Not Implemented', required: 'Required', autoSaved: 'Auto-saved' },
    es: { gapAnalysis: 'Análisis de Brechas', completeAssessment: 'Completa la evaluación para generar tu Declaración de Aplicabilidad (SOA)', question: 'Pregunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sí', no: 'No', partially: 'Parcialmente', soaTitle: 'Declaración de Aplicabilidad (SOA)', soaApplicable: 'Aplica', soaImplemented: 'Implementado', showAll: 'Todos', showApplicable: 'Aplica', showNotApplicable: 'No Aplica', control: 'Control', description: 'Descripción', applicable: 'Aplica', status: 'Estado', justification: 'Justificación', implemented: 'Implementado', planned: 'Planificado', notImplemented: 'No Implementado', required: 'Requerido', autoSaved: 'Auto-guardado' },
    pt: { gapAnalysis: 'Análise de Lacunas', completeAssessment: 'Complete a avaliação para gerar sua Declaração de Aplicabilidade (SOA)', question: 'Pergunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sim', no: 'Não', partially: 'Parcialmente', soaTitle: 'Declaração de Aplicabilidade (SOA)', soaApplicable: 'Aplicável', soaImplemented: 'Implementado', showAll: 'Todos', showApplicable: 'Aplicável', showNotApplicable: 'Não Aplicável', control: 'Controle', description: 'Descrição', applicable: 'Aplicável', status: 'Status', justification: 'Justificativa', implemented: 'Implementado', planned: 'Planejado', notImplemented: 'Não Implementado', required: 'Obrigatório', autoSaved: 'Auto-salvo' }
  }[language] || { gapAnalysis: 'Análisis de Brechas', completeAssessment: 'Completa la evaluación para generar tu Declaración de Aplicabilidad (SOA)', question: 'Pregunta', previous: 'Anterior', continue: 'Continuar', yes: 'Sí', no: 'No', partially: 'Parcialmente', soaTitle: 'Declaración de Aplicabilidad (SOA)', soaApplicable: 'Aplica', soaImplemented: 'Implementado', showAll: 'Todos', showApplicable: 'Aplica', showNotApplicable: 'No Aplica', control: 'Control', description: 'Descripción', applicable: 'Aplica', status: 'Estado', justification: 'Justificación', implemented: 'Implementado', planned: 'Planificado', notImplemented: 'No Implementado', required: 'Requerido', autoSaved: 'Auto-guardado' };

  const [activeMainTab, setActiveMainTab] = useState('assessment');
  // Marco normativo con el que se trabaja: la evaluación usa uno a la vez.
  const [marco, setMarco] = useState(() => { try { return localStorage.getItem('dani_gap_marco') === 'ley21719' ? 'ley21719' : 'iso27001'; } catch { return 'iso27001'; } });
  const esISO = marco === 'iso27001';
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
  const [selectedControls, setSelectedControls] = useState(new Set());
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [overallScore, setOverallScore] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  
  const [dbQuestions, setDbQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState(null);
  
  const [savedDocs, setSavedDocs] = useState([]);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState(null); // { done, total, stage } del job en el servidor
  const [evalError, setEvalError] = useState(null);
  const [evalInfo, setEvalInfo] = useState(null);
  const [aiResults, setAiResults] = useState(() => { try { return JSON.parse(localStorage.getItem('dani_gap_ai_results') || '{}'); } catch { return {}; } });

  useEffect(() => { try { localStorage.setItem('dani_gap_answers', JSON.stringify(answers)); } catch {} }, [answers]);
  useEffect(() => {
    try { localStorage.setItem('dani_gap_marco', marco); } catch {}
    setCurrentPhase(0); setCurrentQuestion(0);
    setEvalError(null); setEvalInfo(null);
    // La Ley 21.719 no tiene SOA ni la vista de Resultados ISO.
    if (!esISO && (activeMainTab === 'soa' || activeMainTab === 'resultados')) setActiveMainTab('assessment');
  }, [marco]);
  useEffect(() => { try { localStorage.setItem('dani_gap_ai_results', JSON.stringify(aiResults)); } catch {} }, [aiResults]);

  // Reintenta varias veces antes de rendirse: en el plan gratuito de Render el
  // servidor puede estar despertando y responder con error unos segundos.
  const loadQuestions = async () => {
    setQuestionsLoading(true); setQuestionsError(null);
    const esperas = [0, 3000, 8000, 15000];
    for (let i = 0; i < esperas.length; i++) {
      if (esperas[i]) await new Promise((r) => setTimeout(r, esperas[i]));
      try {
        const data = await assessmentQuestionsAPI.getAll();
        setDbQuestions(Array.isArray(data) ? data : []);
        setQuestionsLoading(false);
        return;
      } catch (err) {
        console.error(`Error al cargar preguntas (intento ${i + 1})`, err);
      }
    }
    setQuestionsError('No se pudieron cargar las preguntas. Revisa tu conexión e inténtalo de nuevo.');
    setDbQuestions([]);
    setQuestionsLoading(false);
  };
  useEffect(() => { loadQuestions(); }, []);

  // "No aplica": la empresa no borra preguntas del catálogo, declara que no le
  // aplican y por qué. Se guarda en el servidor y la IA ya no las evalúa.
  const NO_APLICA = language === 'en' ? 'Not applicable' : language === 'pt' ? 'Não se aplica' : 'No aplica';
  const [noAplica, setNoAplica] = useState({}); // { questionId: justificación }
  const [naDraft, setNaDraft] = useState(null);  // texto mientras se escribe la justificación
  const [naSaving, setNaSaving] = useState(false);
  const [naError, setNaError] = useState(null);
  useEffect(() => {
    assessmentQuestionsAPI.getAnswers().then((lista) => {
      const na = {};
      (lista || []).forEach((r) => { if (r.veredicto === 'no_aplica') na[r.question_id] = r.justificacion || ''; });
      setNoAplica(na);
      setAnswers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => { if (next[id] === NO_APLICA && !(id in na)) delete next[id]; });
        Object.keys(na).forEach((id) => { next[id] = NO_APLICA; });
        return next;
      });
    }).catch(() => {});
  }, []);

  const clauseNum = (codigo) => (codigo || '').split('.')[0];
  const categoryOf = (q) => String(q.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const isISOCategory = (q, fragment) => categoryOf(q).includes(fragment);
  const isClause = (q) => categoryOf(q).startsWith('clausula');
  const marcoQuestions = useMemo(() => dbQuestions.filter((q) => (q.marco || 'iso27001') === marco), [dbQuestions, marco]);

  const phaseDefs = [
    { id: 'context',  name: 'Contexto y Liderazgo', clause: 'Cláusulas 4 y 5', icon: Building2, color: '#3b82f6', match: (q) => isClause(q) && ['4', '5'].includes(clauseNum(q.codigo)) },
    { id: 'planning', name: 'Planificación y Riesgo', clause: 'Cláusula 6', icon: Target, color: '#004ac6', match: (q) => isClause(q) && clauseNum(q.codigo) === '6' },
    { id: 'support',  name: 'Soporte, Operación y Mejora', clause: 'Cláusulas 7 a 10', icon: Users, color: '#f59e0b', match: (q) => isClause(q) && ['7', '8', '9', '10'].includes(clauseNum(q.codigo)) },
    { id: 'org',      name: 'Anexo A — Organizacional', clause: 'Controles A.5', icon: Shield, color: '#a855f7', match: (q) => isISOCategory(q, 'organizacional') },
    { id: 'people',   name: 'Anexo A — Personas', clause: 'Controles A.6', icon: Users, color: '#ec4899', match: (q) => isISOCategory(q, 'persona') },
    { id: 'phys',     name: 'Anexo A — Físico', clause: 'Controles A.7', icon: Lock, color: '#06b6d4', match: (q) => isISOCategory(q, 'fisic') },
    { id: 'tech',     name: 'Anexo A — Tecnológico', clause: 'Controles A.8', icon: Globe, color: '#8b5cf6', match: (q) => isISOCategory(q, 'tecnologic') },
  ];

  const phases = useMemo(() => {
    const matchedIds = new Set();
    // ISO: fases por cláusula y dominio del Anexo A. Ley: una fase por categoría (obligación).
    const result = (esISO ? phaseDefs : []).map((def) => {
      const matched = marcoQuestions.filter((q) => !matchedIds.has(q.id) && def.match(q)).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      matched.forEach((q) => matchedIds.add(q.id));
      return {
        id: def.id, name: def.name, clause: def.clause, icon: def.icon, color: def.color,
        questions: matched.map((q) => ({
          id: q.id, title: `${q.codigo} — ${q.nombre}`, question: q.pregunta,
          codigo: q.codigo, options: [tText.yes, tText.partially, tText.no],
          critical: isClause(q), evidencia: q.evidencia_esperada,
        })),
      };
    }).filter((p) => p.questions.length > 0);

    // Ley: los títulos del PDF (muchos y muy finos) se agrupan en las obligaciones
    // de la ley; el título original queda como subtema dentro del grupo.
    if (!esISO) {
      const grupos = LEY_GRUPOS.map((g) => ({ ...g, qs: [] }));
      const otros = { id: 'ley-otros', name: 'Otros temas', icon: FileCheck, qs: [] };
      marcoQuestions.forEach((q) => {
        const subtema = limpiarTituloPdf(q.categoria) || 'General';
        const clave = sinAcentos(subtema);
        (grupos.find((g) => g.claves.some((k) => clave.includes(k))) || otros).qs.push({ q, subtema });
      });
      return [...grupos, otros].filter((g) => g.qs.length > 0).map((g) => {
        g.qs.sort((a, b) => (a.q.orden ?? 0) - (b.q.orden ?? 0));
        const subtemas = Array.from(new Set(g.qs.map((x) => x.subtema)));
        return {
          id: g.id, name: g.name, icon: g.icon, color: '#14b8a6',
          clause: `${subtemas.length} ${subtemas.length === 1 ? 'tema' : 'temas'} · ${g.qs.length} preguntas`,
          questions: g.qs.map(({ q, subtema }) => {
            // Los ítems del PDF repiten la pregunta en "nombre"; en ese caso el título es el subtema.
            const nombreRepetido = !q.nombre || String(q.pregunta || '').startsWith(String(q.nombre).replace(/…$/, ''));
            return {
              id: q.id, title: `${q.codigo} — ${nombreRepetido ? subtema : q.nombre}`, question: q.pregunta,
              codigo: q.codigo, subtema, options: [tText.yes, tText.partially, tText.no], critical: false, evidencia: q.evidencia_esperada,
            };
          }),
        };
      });
    }

    const unmatchedQuestions = marcoQuestions.filter((q) => !matchedIds.has(q.id));
    const byCat = {};
    unmatchedQuestions.forEach((q) => {
      const cat = q.categoria || 'General';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(q);
    });
    Object.entries(byCat).forEach(([cat, qs]) => {
      qs.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      result.push({
        id: `extra-${cat.toLowerCase().replace(/\s+/g, '-')}`, name: cat, clause: `${qs.length} preguntas`, icon: esISO ? FileCheck : Eye, color: esISO ? '#6366f1' : '#14b8a6',
        questions: qs.map((q) => ({
          id: q.id, title: `${q.codigo} — ${q.nombre}`, question: q.pregunta, codigo: q.codigo, options: [tText.yes, tText.partially, tText.no], critical: false, evidencia: q.evidencia_esperada,
        })),
      });
    });
    return result;
  }, [marcoQuestions, esISO, language]);

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
      setOverallScore(score);
    } catch (error) { console.error(error); } finally { setIsLoadingAnalysis(false); }
  };
  useEffect(() => { loadAnalysis(); }, []);

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
  useEffect(() => { setNaDraft(null); setNaError(null); }, [currentQuestionData?.id]);

  const guardarNoAplica = async () => {
    const id = currentQuestionData.id;
    setNaSaving(true); setNaError(null);
    try {
      const r = await assessmentQuestionsAPI.setNoAplica(id, naDraft || '');
      setNoAplica((prev) => ({ ...prev, [id]: r.justificacion }));
      setAnswers((prev) => ({ ...prev, [id]: NO_APLICA }));
      setNaDraft(null);
    } catch (err) { setNaError(err.message); } finally { setNaSaving(false); }
  };

  const handleAnswer = async (answer) => {
    const id = currentQuestionData.id;
    if (id in noAplica) {
      // Vuelve a aplicar: se quita la marca en el servidor antes de responder.
      try { await assessmentQuestionsAPI.clearNoAplica(id); } catch (err) { setNaError(err.message); return; }
      setNoAplica((prev) => { const next = { ...prev }; delete next[id]; return next; });
    }
    setNaDraft(null); setNaError(null);
    markDirty();
    setAnswers({ ...answers, [currentQuestionData.id]: answer });
    setTimeout(() => goToNext(), 300);
  };
  const goToNext = () => {
    if (currentQuestion < currentPhaseData.questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    else if (currentPhase < phases.length - 1) { setCurrentPhase(currentPhase + 1); setCurrentQuestion(0); }
    else if (esISO) setActiveMainTab('soa');
  };
  const goToPrev = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
    else if (currentPhase > 0) { setCurrentPhase(currentPhase - 1); setCurrentQuestion(phases[currentPhase - 1].questions.length - 1); }
  };
  
  // ==========================================
  // AUTOGUARDADO
  // Las respuestas del cuestionario y los cambios manuales en la SOA se
  // guardan solos, 1,5 s después del último cambio, en vez de depender de un
  // botón "Guardar" que el usuario puede olvidar. Solo se dispara con cambios
  // del usuario (markDirty), no con la carga inicial desde el servidor.
  // ==========================================
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | pending | saving | saved | error
  const dirtyRef = useRef(false);
  const markDirty = () => { dirtyRef.current = true; setSaveStatus('pending'); };

  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = setTimeout(async () => {
      dirtyRef.current = false;
      setIsSaving(true); setSaveStatus('saving');
      try {
        await complianceAPI.fullAssessment({ controls, answers });
        setSaveStatus(dirtyRef.current ? 'pending' : 'saved');
        loadAnalysis();
      } catch (e) {
        console.warn('No se pudo autoguardar', e);
        dirtyRef.current = true; // se reintenta con el próximo cambio
        setSaveStatus('error');
      } finally { setIsSaving(false); }
    }, 1500);
    return () => clearTimeout(timer);
  }, [controls, answers]);

  // Aviso si se intenta cerrar la pestaña con cambios aún sin guardar.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const veredictoToOption = (veredicto) => {
    if (veredicto === 'cumple') return tText.yes;
    if (veredicto === 'parcial') return tText.partially;
    return tText.no;
  };

  const loadSavedDocs = async () => {
    try {
      const data = await evidenceAPI.getAll();
      setSavedDocs(Array.isArray(data) ? data : []);
    } catch (e) { console.warn('No se pudieron cargar los documentos guardados', e); }
  };
  useEffect(() => { loadSavedDocs(); }, []);

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
      setEvalInfo(`${nuevos.length} documento(s) guardado(s) en el Centro de Evidencias.`);
    } catch (e) {
      setEvalError('Error al guardar el documento: ' + (e.message || e));
    } finally {
      setUploadingDocs(false);
    }
  };

  const toggleEvidence = (id) => setSelectedEvidenceIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleEvaluateWithAI = async (revalidate = false) => {
    setEvalError(null); setEvalInfo(null);
    if (!selectedEvidenceIds.length) { setEvalError('Selecciona al menos un documento guardado antes de evaluar.'); return; }
    let ids = [];
    if (revalidate) {
      phases.forEach((p) => p.questions.forEach((q) => { if (answers[q.id] !== tText.yes && !(q.id in noAplica)) ids.push(q.id); }));
      if (ids.length === 0) { setEvalInfo('No hay preguntas pendientes.'); return; }
    }

    setIsEvaluating(true); setEvalProgress(null);
    try {
      const resp = await assessmentQuestionsAPI.evaluate(marco, [], ids, selectedEvidenceIds, null, setEvalProgress);
      
      // 1. Mapeo de respuestas a la vista de preguntas
      const newAnswers = { ...answers };
      const newAI = { ...aiResults };
      (resp.results || []).forEach((r) => {
        newAnswers[r.id] = veredictoToOption(r.veredicto);
        newAI[r.id] = { veredicto: r.veredicto, confianza: r.confianza, justificacion: r.justificacion };
      });
      setAnswers(newAnswers); setAiResults(newAI);
      const marcoLabel = esISO ? 'ISO 27001' : 'Ley 21.719';

      if (esISO) {

      const questionMap = {};
      phases.forEach(p => p.questions.forEach(q => { questionMap[q.id] = q.codigo; }));
      const updatedControls = [...controls];
      (resp.results || []).forEach(r => {
        const ctrlCode = questionMap[r.id];
        if (!ctrlCode) return;
        const normCode = ctrlCode.replace(/[^0-9]/g, ''); 
        const cIdx = updatedControls.findIndex(c => {
            const normCId = c.id.replace(/[^0-9]/g, '');
            const isAnnexQuestion = ctrlCode.toLowerCase().includes('a');
            const isAnnexControl = c.id.toLowerCase().includes('a');
            if (isAnnexQuestion !== isAnnexControl) return false;
            return normCId === normCode;
        });
        if (cIdx !== -1) {
            let newStatus = 'notImplemented';
            if (r.veredicto === 'cumple') newStatus = 'implemented';
            else if (r.veredicto === 'parcial') newStatus = 'planned';
            updatedControls[cIdx] = { ...updatedControls[cIdx], applicable: true, status: newStatus, justification: r.justificacion || updatedControls[cIdx].justificacion };
        }
      });
      setControls(updatedControls);
      try { await complianceAPI.fullAssessment({ controls: updatedControls, answers: newAnswers }); await loadAnalysis(); } catch(e) {}
      }

      // 5. Informe final visual
      let finalMsg = esISO
        ? `✅ Se revisaron ${resp.total} preguntas de ${marcoLabel} y se actualizaron los controles de la SOA.\n`
        : `✅ Se revisaron ${resp.total} preguntas de ${marcoLabel}.\n`;
      if (typeof resp.evaluated_with_ai === 'number' && resp.evaluated_with_ai < resp.total) {
        finalMsg += `La IA analizó en detalle ${resp.evaluated_with_ai} preguntas relacionadas con tus documentos; las otras ${resp.total - resp.evaluated_with_ai} quedaron como "sin evidencia".\n`;
      }
      finalMsg += '\n';
      alert(finalMsg); setEvalInfo(finalMsg);
    } catch (e) {
      setEvalError(e.message || 'Error al evaluar con IA.');
    } finally {
      setIsEvaluating(false);
      setEvalProgress(null);
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
  const pagedControls = sortedFilteredControls.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const appliesCount = Array.isArray(controls) ? controls.filter(c => c.applicable).length : 0;
  const implementedCount = Array.isArray(controls) ? controls.filter(c => c.applicable && c.status === 'implemented').length : 0;

  const CustomCheckbox = ({ checked, onChange }) => (
    <div role="checkbox" aria-checked={checked} onClick={onChange} style={{ width: '14px', height: '14px', borderRadius: '4px', flexShrink: 0, border: `2px solid ${checked ? '#2563eb' : t.textDim}`, background: checked ? '#2563eb' : 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1.5 4L3.5 6L8.5 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
  );

  const InteractiveSOA = () => (
    <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, overflow: 'hidden', marginTop: '16px' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text }}>{tText.soaTitle}</h3>
          <p style={{ fontSize: '12px', color: t.textDim }}>{appliesCount} {tText.soaApplicable} • {implementedCount} {tText.soaImplemented}</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'all', label: tText.showAll },
            { id: 'applicable', label: tText.showApplicable },
            { id: 'notApplicable', label: tText.showNotApplicable }
          ].map((filter) => (
            <button key={filter.id} onClick={() => { setFilterApplicable(filter.id); setCurrentPage(1); }} style={{ padding: '6px 12px', background: filterApplicable === filter.id ? '#2563eb20' : 'transparent', border: `1px solid ${filterApplicable === filter.id ? '#2563eb' : t.border}`, borderRadius: '20px', color: filterApplicable === filter.id ? '#2563eb' : t.textMuted, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="soa-table-scroll" style={{ overflowX: 'auto', maxHeight: '520px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: t.inputBg }}>
              <th style={{ padding: '10px', width: '36px', textAlign: 'center' }}></th>
              <th onClick={() => handleSort('id')} style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {tText.control} <span style={{ opacity: sortBy === 'id' ? 1 : 0.3 }}>{sortBy === 'id' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
              </th>
              <th onClick={() => handleSort('name')} style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {tText.description} <span style={{ opacity: sortBy === 'name' ? 1 : 0.3 }}>{sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
              </th>
              <th onClick={() => handleSort('applicable')} style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {tText.applicable}? <span style={{ opacity: sortBy === 'applicable' ? 1 : 0.3 }}>{sortBy === 'applicable' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
              </th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase' }}>{tText.status}</th>
              <th onClick={() => handleSort('audited')} style={{ padding: '10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {tText.justification} <span style={{ opacity: sortBy === 'audited' ? 1 : 0.3 }}>{sortBy === 'audited' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedControls.map((control) => (
              <tr key={control.id} style={{ borderBottom: `1px solid ${t.border}`, background: selectedControls.has(control.id) ? `${t.inputBg}` : 'transparent' }}>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <CustomCheckbox checked={selectedControls.has(control.id)} onChange={() => { const newSel = new Set(selectedControls); selectedControls.has(control.id) ? newSel.delete(control.id) : newSel.add(control.id); setSelectedControls(newSel); }} />
                </td>
                <td style={{ padding: '10px' }}><span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>{control.id}</span></td>
                <td style={{ padding: '10px' }}><div style={{ fontSize: '12px', color: t.text, lineHeight: 1.35, fontWeight: 500 }}>{getControlName(control.id, language)}</div><span style={{ fontSize: '10px', color: t.textDim }}>{control.category}</span></td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                    <button onClick={() => toggleApplicable(control.id)} style={{ padding: '4px 8px', background: control.applicable ? '#2563eb20' : 'transparent', border: `1px solid ${control.applicable ? '#2563eb' : t.border}`, borderRadius: '5px 0 0 5px', color: control.applicable ? '#2563eb' : t.textDim, fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>{tText.applicable}</button>
                    <button onClick={() => toggleApplicable(control.id)} style={{ padding: '4px 8px', background: !control.applicable ? '#dc262620' : 'transparent', border: `1px solid ${!control.applicable ? '#dc2626' : t.border}`, borderRadius: '0 5px 5px 0', color: !control.applicable ? '#dc2626' : t.textDim, fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>No</button>
                  </div>
                </td>
                <td style={{ padding: '10px' }}>
                  {control.applicable && (
                    <select value={control.status} onChange={(e) => updateStatus(control.id, e.target.value)} style={{ padding: '6px 8px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text, fontSize: '11px', cursor: 'pointer', width: '100%', outline: 'none' }}>
                      <option value="implemented">{tText.implemented}</option>
                      <option value="planned">{tText.planned}</option>
                      <option value="notImplemented">{tText.notImplemented}</option>
                    </select>
                  )}
                </td>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: control.justification ? t.textMuted : '#dc2626', fontStyle: control.justification ? 'normal' : 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{control.justification || tText.required}</span>
                    <button onClick={() => setShowJustificationModal(control)} title="Editar" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: t.textDim }}><Edit3 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#2563eb', fontWeight: 600, background: '#eff6ff' }}>
        <CheckCircle2 size={14} /><span>{tText.autoSaved}</span>
      </div>

      {showJustificationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: t.cardBg, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 700 }}>{tText.justification}</h3>
            <textarea defaultValue={showJustificationModal.justification} rows={4} style={{ width: '100%', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '13px', marginBottom: '16px', outline: 'none', resize: 'vertical' }} id="justification-textarea" />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowJustificationModal(null)} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: t.text }}>Cancelar</button>
              <button onClick={() => { const textarea = document.getElementById('justification-textarea'); updateJustification(showJustificationModal.id, textarea.value); }} style={{ padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ResultadosView = () => {
    const getScoreColor = (s) => s >= 85 ? '#2563eb' : s >= 70 ? '#f59e0b' : '#dc2626';
    if (isLoadingAnalysis) return <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>Calculando análisis...</div>;

    const score = overallScore?.overall_score ?? 0;
    const gap = overallScore?.gap_to_certification ?? 100;
    
    return (
      <div className="resultados-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
        <div style={{ background: t.cardBg, border: `2px solid ${getScoreColor(score)}40`, borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '48px', fontWeight: 800, color: getScoreColor(score), lineHeight: 1 }}>{score}%</div>
          <div style={{ fontSize: '12px', color: t.textDim, marginTop: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Cumplimiento General</div>
        </div>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '48px', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>85%</div>
          <div style={{ fontSize: '12px', color: t.textDim, marginTop: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Meta ISO 27001</div>
        </div>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '48px', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>{gap}%</div>
          <div style={{ fontSize: '12px', color: t.textDim, marginTop: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Brecha restante</div>
        </div>
      </div>
    );
  };

  return (
    <div className="normia-gap" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', color: t.text }}>
      
      {/* HEADER MÓVIL-FIRST */}
      <section className="gap-header" style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#2563eb', textTransform: 'uppercase', marginBottom: '2px' }}>Cumplimiento Normativo</p>
        <h1 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.1, margin: 0, color: t.text, letterSpacing: '-0.5px' }}>{tText.gapAnalysis}</h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.4, color: t.textDim }}>{esISO ? tText.completeAssessment : 'Evalúa tus documentos contra las obligaciones de la Ley 21.719 de Protección de Datos Personales'}</p>
      </section>

      {/* MARCO NORMATIVO: la IA evalúa uno a la vez */}
      <section aria-label="Marco normativo" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: t.textDim }}>Evaluar contra:</span>
        <div role="radiogroup" style={{ display: 'inline-flex', gap: '4px', background: t.inputBg, padding: '4px', borderRadius: '12px', border: `1px solid ${t.border}` }}>
          {[{ id: 'iso27001', label: 'ISO 27001:2022', Icon: Shield }, { id: 'ley21719', label: 'Ley 21.719', Icon: Eye }].map(({ id, label, Icon }) => {
            const activo = marco === id;
            const n = dbQuestions.filter((q) => (q.marco || 'iso27001') === id).length;
            return (
              <button key={id} type="button" role="radio" aria-checked={activo} disabled={isEvaluating} onClick={() => setMarco(id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9px', border: 'none', background: activo ? '#004ac6' : 'transparent', color: activo ? '#fff' : t.textMuted, fontSize: '12px', fontWeight: 700, cursor: isEvaluating ? 'not-allowed' : 'pointer' }}>
                <Icon size={14} />{label}<span style={{ fontWeight: 500, opacity: .8 }}>({n})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* PESTAÑAS NAVEGABLES (SCROLL HORIZONTAL MÓVIL) */}
      <div className="gap-tabs-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
        <div className="gap-tabs no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', background: t.inputBg, padding: '4px', borderRadius: '12px', border: `1px solid ${t.border}`, flexShrink: 1 }}>
          {[
            { id: 'assessment', label: 'Evaluación' },
            ...(esISO ? [{ id: 'soa', label: 'SOA' }, { id: 'resultados', label: 'Resultados', Icon: Activity }] : []),
          ].map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => setActiveMainTab(id)} aria-current={activeMainTab === id ? 'page' : undefined}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: activeMainTab === id ? '#2563eb' : 'transparent', color: activeMainTab === id ? '#fff' : t.textMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', transition: 'all 0.2s' }}>
              {Icon && <Icon size={14} />}{label}
            </button>
          ))}
        </div>
        {saveStatus !== 'idle' && (
          <span
            title={saveStatus === 'error' ? 'Se reintentará con tu próximo cambio' : undefined}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, flexShrink: 0, color: saveStatus === 'error' ? '#dc2626' : t.textDim }}
          >
            {saveStatus === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} color={saveStatus === 'saved' ? '#004ac6' : undefined} />}
            {saveStatus === 'saved' ? 'Cambios guardados' : saveStatus === 'error' ? 'No se pudo guardar' : 'Guardando...'}
          </span>
        )}
      </div>

      {activeMainTab === 'assessment' ? (
        <>
          {/* BARRA DE PROGRESO */}
          <section style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: t.text }}>Avance del cuestionario</div>
                <div style={{ color: t.textDim, fontSize: '11px', marginTop: '2px' }}>{answeredCount} de {totalQuestions} preguntas respondidas</div>
              </div>
              <strong style={{ color: '#2563eb', fontSize: '20px', fontWeight: 800, whiteSpace: 'nowrap' }}>{globalProgress}%</strong>
            </div>
            <div role="progressbar" aria-valuenow={globalProgress} aria-valuemin={0} aria-valuemax={100} style={{ height: '8px', background: t.inputBg, borderRadius: '4px', overflow: 'hidden', marginTop: '12px' }}>
              <div style={{ width: `${globalProgress}%`, height: '100%', background: '#2563eb', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
          </section>

          {questionsLoading && <div style={{ padding: '28px', color: t.textDim, textAlign: 'center' }}>Cargando preguntas desde la base de datos...</div>}
          {!questionsLoading && questionsError && <div role="alert" style={{ padding: '14px', color: '#dc2626', background: 'rgba(239,68,68,.07)', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>{questionsError}<button type="button" onClick={loadQuestions} style={{ padding: '7px 14px', borderRadius: '8px', background: '#004ac6', border: 'none', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Reintentar</button></div>}
          {!questionsLoading && phases.length === 0 && !questionsError && <div style={{ padding: '28px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.cardBg }}>Todavía no hay preguntas configuradas.</div>}

          {!questionsLoading && phases.length > 0 && (
            <>
              {/* SELECTOR DE FASE */}
              <section style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {currentPhaseData?.icon && <currentPhaseData.icon size={16} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Fase: {currentPhaseData?.name}</span>
                      <ChevronRight size={14} color={t.textDim} style={{ flexShrink: 0 }} />
                    </div>
                    <p style={{ fontSize: '10px', color: '#059669', fontWeight: 600, margin: 0 }}>{currentPhaseData?.questions.length ? `${getPhaseProgress(currentPhase)}% respondida` : ''}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowAllPhases((v) => !v)} style={{ fontSize: '11px', fontWeight: 600, color: '#334155', background: '#f8fafc', border: `1px solid ${t.border}`, padding: '6px 10px', borderRadius: '8px', flexShrink: 0, cursor: 'pointer' }}>
                  Ver fases
                </button>
              </section>

              {showAllPhases && (
                <div className="phase-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                  {phases.map((phase, idx) => {
                    const Icon = phase.icon;
                    const progress = getPhaseProgress(idx);
                    return (
                      <button type="button" key={phase.id} onClick={() => { setCurrentPhase(idx); setCurrentQuestion(0); setShowAllPhases(false); }}
                        style={{ background: idx === currentPhase ? '#eff6ff' : t.cardBg, border: `1px solid ${idx === currentPhase ? '#2563eb' : t.border}`, padding: '12px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Icon size={16} color={idx === currentPhase ? '#2563eb' : t.textDim} />
                          <span style={{ flex: 1, fontSize: '11px', fontWeight: 700, color: t.text, lineHeight: 1.2 }}>{phase.name}</span>
                        </div>
                        {!esISO && <span style={{ fontSize: '10px', color: t.textDim }}>{phase.clause}</span>}
                        <div style={{ height: '4px', background: idx === currentPhase ? '#dbeafe' : t.inputBg, borderRadius: '2px', overflow: 'hidden', width: '100%' }}>
                          <div style={{ width: `${progress}%`, height: '100%', background: '#2563eb' }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TEMAS DEL GRUPO (Ley): saltar a un tema y ver su avance */}
              {!esISO && currentPhaseData && (() => {
                const temas = [];
                currentPhaseData.questions.forEach((q, i) => {
                  let tema = temas.find((x) => x.nombre === q.subtema);
                  if (!tema) { tema = { nombre: q.subtema, inicio: i, total: 0, respondidas: 0 }; temas.push(tema); }
                  tema.total += 1;
                  if (answers[q.id]) tema.respondidas += 1;
                });
                if (temas.length < 2) return null;
                const temaActual = currentQuestionData?.subtema;
                return (
                  <nav aria-label="Temas del grupo" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {temas.map((tema) => {
                      const activo = tema.nombre === temaActual;
                      const completo = tema.respondidas === tema.total;
                      return (
                        <button key={tema.nombre} type="button" onClick={() => setCurrentQuestion(tema.inicio)} aria-current={activo ? 'true' : undefined}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '999px', border: `1px solid ${activo ? '#2563eb' : t.border}`, background: activo ? '#eff6ff' : t.cardBg, color: activo ? '#1d4ed8' : t.textMuted, fontSize: '11px', fontWeight: activo ? 700 : 500, cursor: 'pointer', textAlign: 'left', maxWidth: '100%' }}>
                          <span>{tema.nombre}</span>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: completo ? '#059669' : t.textDim, flexShrink: 0 }}>{tema.respondidas}/{tema.total}</span>
                        </button>
                      );
                    })}
                  </nav>
                );
              })()}

              <div className="gap-workspace" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* ÁREA DE PREGUNTA PRINCIPAL */}
                <main className="gap-main-card">
                  {currentQuestionData && (
                    <section style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '11px' }}>Cuestionario de cumplimiento</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '4px 8px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.textMuted }}>Pregunta {currentQuestion + 1} de {currentPhaseData.questions.length}</span>
                      </div>
                      
                      <h2 style={{ fontSize: '15px', lineHeight: 1.3, fontWeight: 800, margin: '0 0 8px', color: t.text }}>{currentQuestionData.title}</h2>
                      <p style={{ fontSize: '13px', lineHeight: 1.5, margin: '0 0 16px', color: t.textMuted }}>{currentQuestionData.question}</p>
                      
                      {/* BOTONES DE RESPUESTA */}
                      <div className="gap-choices" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                        {currentQuestionData.options.map((option) => {
                          const selected = answers[currentQuestionData.id] === option;
                          return (
                            <button key={option} type="button" onClick={() => handleAnswer(option)} aria-pressed={selected}
                              style={{ padding: '10px 8px', borderRadius: '12px', border: `2px solid ${selected ? '#2563eb' : t.border}`, background: selected ? '#eff6ff' : t.cardBg, color: selected ? '#1d4ed8' : t.text, fontWeight: selected ? 700 : 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                              {option}
                            </button>
                          );
                        })}
                      </div>

                      {/* NO APLICA: se declara con justificación, no se borra la pregunta */}
                      {currentQuestionData.id in noAplica ? (
                        <div style={{ background: t.inputBg, border: `1px dashed ${t.border}`, borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '12px', color: t.text }}>Marcada como "No aplica" para tu empresa</strong>
                            <span style={{ fontSize: '11px', color: t.textDim }}>Responde Sí, Parcialmente o No para volver a incluirla</span>
                          </div>
                          <p style={{ fontSize: '12px', lineHeight: 1.5, margin: 0, color: t.textMuted }}>{noAplica[currentQuestionData.id]}</p>
                        </div>
                      ) : naDraft !== null ? (
                        <div style={{ border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                          <label htmlFor="na-justificacion" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.text, marginBottom: '6px' }}>¿Por qué esta pregunta no aplica a tu empresa?</label>
                          <textarea id="na-justificacion" autoFocus rows={2} value={naDraft} onChange={(e) => setNaDraft(e.target.value)} placeholder="Ej.: No tratamos datos de menores de edad."
                            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '12px', resize: 'vertical' }} />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                            <button type="button" onClick={() => { setNaDraft(null); setNaError(null); }} style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
                            <button type="button" onClick={guardarNoAplica} disabled={naSaving || naDraft.trim().length < 10}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: naSaving ? 'wait' : 'pointer', opacity: naDraft.trim().length < 10 ? .5 : 1 }}>
                              {naSaving ? 'Guardando…' : 'Marcar como No aplica'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => { setNaDraft(''); setNaError(null); }}
                          style={{ display: 'block', margin: '-8px 0 16px', padding: 0, border: 'none', background: 'none', color: t.textDim, fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}>
                          Esta pregunta no aplica a mi empresa
                        </button>
                      )}
                      {naError && <p role="alert" style={{ fontSize: '12px', color: '#dc2626', margin: '-8px 0 12px' }}>{naError}</p>}

                      {/* RESULTADO IA */}
                      {aiResults[currentQuestionData.id] && (
                        <div style={{ background: '#eff6ff', border: `1px solid #bfdbfe`, borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wand2 size={12} /></div>
                              <strong style={{ fontSize: '11px', color: t.text }}>Análisis IA</strong>
                              {(() => {
                                const v = aiResults[currentQuestionData.id].veredicto;
                                const map = { cumple: ['Cumple', '#1d4ed8', '#dbeafe'], parcial: ['Parcial', '#b45309', '#fef3c7'], no_cumple: ['No cumple', '#dc2626', '#fee2e2'], sin_evidencia: ['Sin evidencia', '#475569', '#f1f5f9'] };
                                const [label, color, bg] = map[v] || ['Sin clasificar', t.textDim, 'transparent'];
                                return <span style={{ fontSize: '10px', color, background: bg, fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>{label}</span>;
                              })()}
                            </div>
                            {typeof aiResults[currentQuestionData.id].confianza === 'number' && <span style={{ fontSize: '10px', color: t.textDim, fontWeight: 600 }}>Confianza: <span style={{ color: '#2563eb' }}>{Math.round(aiResults[currentQuestionData.id].confianza * 100)}%</span></span>}
                          </div>
                          <p style={{ color: t.textMuted, fontSize: '11px', lineHeight: 1.5, margin: 0 }}>{aiResults[currentQuestionData.id].justificacion}</p>
                        </div>
                      )}
                      
                      {/* NAVEGACIÓN DE PREGUNTAS */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: `1px solid ${t.border}` }}>
                        <button type="button" onClick={goToPrev} disabled={currentPhase === 0 && currentQuestion === 0} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '10px', border: 'none', background: t.inputBg, color: t.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: 600, opacity: currentPhase === 0 && currentQuestion === 0 ? .4 : 1 }}>
                          <ChevronLeft size={16} /> Anterior
                        </button>
                        <button type="button" onClick={goToNext} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
                          Continuar <ChevronRight size={16} />
                        </button>
                      </div>
                    </section>
                  )}
                </main>

                {/* COLUMNA LATERAL DE EVIDENCIAS */}
                <aside className="gap-side-card" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <FileCheck size={18} color="#2563eb" />
                    <h2 style={{ fontSize: '14px', fontWeight: 800, color: t.text, margin: 0 }}>Evidencias</h2>
                  </div>
                  <p style={{ fontSize: '11px', color: t.textDim, margin: '0 0 12px' }}>{savedDocs.length} documentos disponibles para IA.</p>
                  
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '10px', border: `1px dashed #93c5fd`, borderRadius: '10px', background: '#eff6ff', color: '#2563eb', fontSize: '11px', fontWeight: 700, cursor: uploadingDocs ? 'wait' : 'pointer', marginBottom: '12px', transition: 'all 0.2s' }}>
                    <FolderUp size={14} />{uploadingDocs ? 'Guardando...' : 'Agregar documentos'}
                    <input type="file" multiple accept=".pdf,.txt,.docx" disabled={uploadingDocs} style={{ display: 'none' }} onChange={(e) => { handleUploadDocs(e.target.files); e.target.value = ''; }} />
                  </label>

                  {savedDocs.length === 0 ? (
                    <div style={{ padding: '12px', fontSize: '11px', color: t.textDim, borderRadius: '8px', background: t.inputBg, textAlign: 'center' }}>Sube evidencias para evaluarlas.</div>
                  ) : (
                    <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {savedDocs.map((d) => {
                        const checked = selectedEvidenceIds.includes(d.id);
                        return (
                          <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: checked ? 'white' : t.inputBg, border: `1px solid ${checked ? '#2563eb' : t.border}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                            <input type="checkbox" checked={checked} onChange={() => toggleEvidence(d.id)} style={{ accentColor: '#2563eb', width: '14px', height: '14px', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: t.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name || d.title || 'Documento'}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button type="button" onClick={() => handleEvaluateWithAI(false)} disabled={isEvaluating || selectedEvidenceIds.length === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, fontSize: '12px', cursor: 'pointer', opacity: isEvaluating || !selectedEvidenceIds.length ? .5 : 1, boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
                      <Wand2 size={14} />{isEvaluating ? 'Evaluando...' : 'Evaluar con IA'}
                    </button>
                    <button type="button" onClick={() => handleEvaluateWithAI(true)} disabled={isEvaluating || selectedEvidenceIds.length === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.text, fontWeight: 600, fontSize: '11px', cursor: 'pointer', opacity: isEvaluating || !selectedEvidenceIds.length ? .5 : 1 }}>
                      <Activity size={14} /> Revalidar pendientes
                    </button>
                  </div>
                  {isEvaluating && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#004ac6' }}>
                        {evalProgress ? `${evalProgress.stage || 'Evaluando'} · ${evalProgress.done} de ${evalProgress.total} preguntas` : 'La IA está analizando los documentos...'}
                      </p>
                      {evalProgress && evalProgress.total > 0 && (
                        <div role="progressbar" aria-valuenow={evalProgress.done} aria-valuemin={0} aria-valuemax={evalProgress.total} style={{ marginTop: '6px', height: '6px', background: t.inputBg, borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((evalProgress.done / evalProgress.total) * 100)}%`, height: '100%', background: '#004ac6', transition: 'width .3s' }} />
                        </div>
                      )}
                    </div>
                  )}
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
      ) : null}

      {/* ESTILOS INYECTADOS PARA RESPONSIVE GLOBAL */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* En escritorio mantenemos columnas */
        @media (min-width: 1024px) {
          .gap-workspace { flex-direction: row !important; align-items: flex-start; }
          .gap-main-card { flex: 1; min-width: 0; }
          .gap-side-card { width: 320px; flex-shrink: 0; position: sticky; top: 24px; }
        }
      `}} />
    </div>
  );
}

export default GapAnalysisScreen;