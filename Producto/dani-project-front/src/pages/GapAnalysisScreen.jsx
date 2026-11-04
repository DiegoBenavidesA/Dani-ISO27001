// src/pages/GapAnalysisScreen.jsx
import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import {
  Building2, Target, Users, Lock, Eye,
  ChevronLeft, ChevronRight, Download, FolderUp, CheckCircle2, AlertCircle,
  Activity, Shield, Edit3, FileCheck, Globe, Wand2, Settings, Plus, Trash2, FileText,
  ClipboardList, Search, Check, Minus, X, Ban, Zap, RefreshCw, Loader2
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { complianceAPI, documentsAPI, API_URL, assessmentQuestionsAPI, evidenceAPI } from '../services/api';
import { getFullGapAnalysis, getComplianceScore } from '../services/gapAnalysisAPI';
import { getControlName } from '../translations/controls';
import ResultadoBrechas, { impactoISO } from '../components/ResultadoBrechas';

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
    if (esISO && activeMainTab === 'resultado') setActiveMainTab('assessment');
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
    // Las respuestas guardadas en el servidor (manuales, de la IA y "no aplica")
    // mandan sobre las del navegador.
    assessmentQuestionsAPI.getAnswers().then((lista) => {
      const na = {};
      const delServidor = {};
      const ia = {};
      (lista || []).forEach((r) => {
        if (r.veredicto === 'no_aplica') { na[r.question_id] = r.justificacion || ''; return; }
        delServidor[r.question_id] = r.veredicto === 'cumple' ? tText.yes : r.veredicto === 'parcial' ? tText.partially : tText.no;
        if (r.confianza !== null && r.confianza !== undefined) ia[r.question_id] = { veredicto: r.veredicto, confianza: r.confianza, justificacion: r.justificacion };
      });
      setNoAplica(na);
      setAiResults((prev) => ({ ...prev, ...ia }));
      setAnswers((prev) => {
        const next = { ...prev, ...delServidor };
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
          codigo: q.codigo, subtema: `${q.codigo} ${q.nombre}`, options: [tText.yes, tText.partially, tText.no],
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
            const soloLetras = (x) => sinAcentos(x).replace(/[^a-z0-9]/g, '');
            const nombreRepetido = !q.nombre || soloLetras(q.pregunta).startsWith(soloLetras(String(q.nombre).replace(/…$/, '')));
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

  // Para el Resultado: valor de cada respuesta (null = sin responder o "No aplica").
  const valorRespuesta = React.useCallback((r) => (
    r === tText.yes ? 1 : r === tText.partially ? 0.5 : r === tText.no ? 0 : null
  ), [tText.yes, tText.partially, tText.no]);
  const questionsById = useMemo(() => {
    const m = {};
    phases.forEach((p) => p.questions.forEach((q) => { m[q.id] = q; }));
    return m;
  }, [phases]);
  const irAPregunta = (id) => {
    const fi = phases.findIndex((p) => p.questions.some((q) => q.id === id));
    if (fi < 0) return;
    setCurrentPhase(fi);
    setCurrentQuestion(phases[fi].questions.findIndex((q) => q.id === id));
    setActiveMainTab('assessment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
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
    const veredicto = answer === tText.yes ? 'cumple' : answer === tText.partially ? 'parcial' : 'no_cumple';
    assessmentQuestionsAPI.setAnswer(id, veredicto).catch((err) => setNaError(err.message));
    if (aiResults[id] && aiResults[id].veredicto !== veredicto) {
      setAiResults((prev) => { const next = { ...prev }; delete next[id]; return next; });
    }
    markDirty();
    setAnswers({ ...answers, [currentQuestionData.id]: answer });
    setTimeout(() => goToNext(), 300);
  };
  const goToNext = () => {
    if (currentQuestion < currentPhaseData.questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    else if (currentPhase < phases.length - 1) { setCurrentPhase(currentPhase + 1); setCurrentQuestion(0); }
    else setActiveMainTab(esISO ? 'soa' : 'resultado');
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
        await evidenceAPI.upload(fd, null, (n, total) => setEvalInfo(`El servidor se está activando, reintentando (${n}/${total})…`));
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
      setEvalInfo(finalMsg.trim());
      // En vez de un aviso suelto, se abre el resultado: % de cumplimiento,
      // mapa de calor y brechas priorizadas (ISO sigue en su vista Resultados).
      setActiveMainTab(esISO ? 'resultados' : 'resultado');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <div style={{ fontSize: '12px', color: t.textDim, marginTop: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Cumplimiento según la SOA</div>
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

  // Temas de la fase activa (columna izquierda) con su avance y filtro.
  const [temaFiltro, setTemaFiltro] = useState('');
  const temasFase = useMemo(() => {
    const lista = [];
    (currentPhaseData?.questions || []).forEach((q, i) => {
      const nombre = q.subtema || currentPhaseData.name;
      let tema = lista.find((x) => x.nombre === nombre);
      if (!tema) { tema = { nombre, inicio: i, total: 0, respondidas: 0 }; lista.push(tema); }
      tema.total += 1;
      if (answers[q.id]) tema.respondidas += 1;
    });
    return lista;
  }, [currentPhaseData, answers]);
  const temasVisibles = temaFiltro.trim()
    ? temasFase.filter((x) => sinAcentos(x.nombre).includes(sinAcentos(temaFiltro.trim())))
    : temasFase;

  return (
    <div className="normia-gap" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', color: t.text }}>
      
      {/* CABECERA: marco, pestañas y avance global */}
      <header className="gap-top" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '14px 20px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}>Cumplimiento normativo</span>
              <span style={{ color: t.textDim, fontSize: '12px' }}>/</span>
              <span style={{ fontSize: '12px', color: t.textDim, fontWeight: 500 }}>{esISO ? 'ISO/IEC 27001:2022' : 'Ley 21.719 de Protección de Datos Personales'}</span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px', margin: 0, color: t.text }}>{tText.gapAnalysis}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Marco normativo: la IA evalúa uno a la vez */}
            <div role="radiogroup" aria-label="Marco normativo" style={{ display: 'inline-flex', gap: '2px', background: t.inputBg, padding: '4px', borderRadius: '10px', border: `1px solid ${t.border}` }}>
              {[{ id: 'iso27001', label: 'ISO 27001:2022', Icon: Shield }, { id: 'ley21719', label: 'Ley 21.719', Icon: Eye }].map(({ id, label, Icon }) => {
                const activo = marco === id;
                const n = dbQuestions.filter((q) => (q.marco || 'iso27001') === id).length;
                return (
                  <button key={id} type="button" role="radio" aria-checked={activo} disabled={isEvaluating} onClick={() => setMarco(id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '7px', border: 'none', background: activo ? '#2563eb' : 'transparent', color: activo ? '#fff' : t.textMuted, fontSize: '12px', fontWeight: activo ? 600 : 500, cursor: isEvaluating ? 'not-allowed' : 'pointer', boxShadow: activo ? '0 1px 2px rgba(0,0,0,.1)' : 'none' }}>
                    <Icon size={14} />{label}
                    <span style={{ fontSize: '10px', padding: '0 6px', borderRadius: '4px', background: activo ? 'rgba(29,78,216,.6)' : 'transparent', color: activo ? '#fff' : t.textDim }}>{n}</span>
                  </button>
                );
              })}
            </div>
            <span className="gap-divider" style={{ width: '1px', height: '24px', background: t.border }} />
            {/* Pestañas */}
            <nav aria-label="Vistas" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { id: 'assessment', label: 'Evaluación', Icon: ClipboardList },
                ...(esISO ? [{ id: 'soa', label: 'SOA', Icon: FileCheck }, { id: 'resultados', label: 'Resultados', Icon: Activity }] : [{ id: 'resultado', label: 'Resultado', Icon: Activity }]),
              ].map(({ id, label, Icon }) => {
                const activo = activeMainTab === id;
                return (
                  <button key={id} type="button" onClick={() => setActiveMainTab(id)} aria-current={activo ? 'page' : undefined}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${activo ? '#bfdbfe' : 'transparent'}`, background: activo ? '#eff6ff' : 'transparent', color: activo ? '#1d4ed8' : t.textMuted, fontSize: '12px', fontWeight: activo ? 600 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <Icon size={15} color={activo ? '#2563eb' : undefined} />{label}
                  </button>
                );
              })}
            </nav>
            {activeMainTab !== 'assessment' && saveStatus !== 'idle' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: saveStatus === 'error' ? '#dc2626' : t.textDim }}>
                {saveStatus === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} color={saveStatus === 'saved' ? '#2563eb' : undefined} />}
                {saveStatus === 'saved' ? 'Cambios guardados' : saveStatus === 'error' ? 'No se pudo guardar' : 'Guardando...'}
              </span>
            )}
          </div>
        </div>

        {activeMainTab === 'assessment' && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: t.text }}>Avance global del cuestionario</span>
              <span style={{ fontSize: '12px', color: t.textDim, fontWeight: 500 }}>{answeredCount} de {totalQuestions} preguntas respondidas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '260px', maxWidth: '100%' }}>
              <div role="progressbar" aria-valuenow={globalProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Avance global" style={{ flex: 1, height: '8px', background: t.inputBg, borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${globalProgress}%`, height: '100%', background: '#2563eb', borderRadius: '999px', transition: 'width .3s' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: t.text, fontVariantNumeric: 'tabular-nums' }}>{globalProgress}%</span>
            </div>
          </div>
        )}
      </header>

      {activeMainTab === 'assessment' ? (
        <>
          {questionsLoading && <div style={{ padding: '28px', color: t.textDim, textAlign: 'center' }}>Cargando preguntas desde la base de datos...</div>}
          {!questionsLoading && questionsError && <div role="alert" style={{ padding: '14px', color: '#dc2626', background: 'rgba(239,68,68,.07)', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>{questionsError}<button type="button" onClick={loadQuestions} style={{ padding: '7px 14px', borderRadius: '8px', background: '#004ac6', border: 'none', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Reintentar</button></div>}
          {!questionsLoading && phases.length === 0 && !questionsError && <div style={{ padding: '28px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.cardBg }}>Todavía no hay preguntas configuradas.</div>}

          {!questionsLoading && phases.length > 0 && (
            <div className="gap-3col" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

              {/* IZQUIERDA: fase activa y sus temas */}
              <aside className="gap-left" aria-label="Fases y temas" style={{ width: '260px', flex: 'none', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: `1px solid ${t.border}`, background: t.inputBg }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: '#2563eb' }}>Fase activa</span>
                    <button type="button" onClick={() => setShowAllPhases((v) => !v)} aria-expanded={showAllPhases}
                      style={{ fontSize: '12px', fontWeight: 600, color: '#1d4ed8', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      {showAllPhases ? 'Cerrar' : 'Cambiar fase →'}
                    </button>
                  </div>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: t.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#dbeafe', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flex: 'none' }}>{currentPhase + 1}</span>
                    {currentPhaseData?.name}
                  </h2>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: t.textDim }}>
                    <span>Progreso de fase</span>
                    <span style={{ fontWeight: 600, color: t.textMuted }}>{getPhaseProgress(currentPhase)}% completado</span>
                  </div>
                </div>

                {showAllPhases ? (
                  <div className="gap-scroll" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                    {phases.map((phase, idx) => {
                      const activo = idx === currentPhase;
                      const Icon = phase.icon;
                      return (
                        <button key={phase.id} type="button" onClick={() => { setCurrentPhase(idx); setCurrentQuestion(0); setShowAllPhases(false); setTemaFiltro(''); }}
                          style={{ width: '100%', textAlign: 'left', padding: '10px', borderRadius: '8px', border: `1px solid ${activo ? '#bfdbfe' : 'transparent'}`, background: activo ? '#eff6ff' : 'transparent', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <Icon size={16} color={activo ? '#2563eb' : t.textDim} style={{ flex: 'none' }} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: activo ? '#1e3a8a' : t.text }}>{idx + 1}. {phase.name}</span>
                            <span style={{ display: 'block', fontSize: '11px', color: t.textDim }}>{phase.clause}</span>
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, flex: 'none' }}>{getPhaseProgress(idx)}%</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '12px', borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={15} color={t.textDim} style={{ position: 'absolute', left: '10px', top: '9px', pointerEvents: 'none' }} />
                        <input type="search" value={temaFiltro} onChange={(e) => setTemaFiltro(e.target.value)} placeholder="Filtrar temas de esta fase..." aria-label="Filtrar temas"
                          style={{ width: '100%', boxSizing: 'border-box', fontSize: '12px', padding: '7px 10px 7px 32px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none' }} />
                      </div>
                    </div>
                    <div className="gap-scroll" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                      {temasVisibles.length === 0 && <p style={{ fontSize: '12px', color: t.textDim, padding: '8px', margin: 0 }}>Ningún tema coincide.</p>}
                      {temasVisibles.map((tema) => {
                        const activo = tema.nombre === currentQuestionData?.subtema;
                        const completo = tema.respondidas === tema.total;
                        return (
                          <button key={tema.nombre} type="button" onClick={() => setCurrentQuestion(tema.inicio)} aria-current={activo ? 'true' : undefined}
                            style={{ width: '100%', textAlign: 'left', padding: '10px', borderRadius: '8px', border: `1px solid ${activo ? '#bfdbfe' : 'transparent'}`, background: activo ? '#eff6ff' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', minWidth: 0 }}>
                              {activo && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', flex: 'none', marginTop: '6px' }} />}
                              <span style={{ fontSize: '12px', fontWeight: activo ? 600 : 500, color: activo ? '#1e3a8a' : t.text, lineHeight: 1.35 }}>{tema.nombre}</span>
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', flex: 'none', background: activo ? t.cardBg : t.inputBg, color: completo ? '#059669' : (activo ? '#1d4ed8' : t.textDim), border: `1px solid ${activo ? '#bfdbfe' : 'transparent'}` }}>
                              {tema.respondidas}/{tema.total}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                <div style={{ padding: '10px', borderTop: `1px solid ${t.border}`, background: t.inputBg, textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>
                    {showAllPhases ? `${phases.length} fases en ${esISO ? 'ISO 27001' : 'la Ley 21.719'}` : `${temasFase.length} ${temasFase.length === 1 ? 'tema' : 'temas'} en esta fase`}
                  </p>
                </div>
              </aside>

              {/* CENTRO: la pregunta */}
              <section className="gap-center" aria-label="Pregunta" style={{ flex: 1, minWidth: 0, background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                {currentQuestionData && (() => {
                  const q = currentQuestionData;
                  const sub = (q.title || '').split(' — ').slice(1).join(' — ');
                  const etiqueta = sub && sub !== q.subtema ? sub : '';
                  const meta = [
                    { Icon: Check, sub: 'Implementado totalmente', on: '#10b981' },
                    { Icon: Minus, sub: 'En proceso o incompleto', on: '#f59e0b' },
                    { Icon: X, sub: 'No implementado', on: '#f43f5e' },
                  ];
                  return (
                    <>
                      <div style={{ padding: '12px 24px', borderBottom: `1px solid ${t.border}`, background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: t.textDim, minWidth: 0, flexWrap: 'wrap' }}>
                          <span style={{ color: '#1d4ed8', fontWeight: 600 }}>{currentPhaseData.name}</span>
                          {q.subtema && q.subtema !== currentPhaseData.name && <><span>›</span><span style={{ fontWeight: 500, color: t.textMuted }}>{q.subtema}</span></>}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', background: t.cardBg, color: t.textMuted, border: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>
                          Pregunta {currentQuestion + 1} de {currentPhaseData.questions.length}
                        </span>
                      </div>

                      <div className="gap-qbody" style={{ padding: '32px 40px', maxWidth: '860px', margin: '0 auto', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: t.inputBg, color: t.textMuted, border: `1px solid ${t.border}`, flex: 'none' }}>{q.codigo}</span>
                          {etiqueta && <><span style={{ color: t.textDim, fontSize: '12px' }}>|</span><span style={{ fontSize: '12px', color: t.textDim, fontWeight: 500, minWidth: 0, lineHeight: 1.4 }}>{etiqueta}</span></>}
                        </div>

                        <h3 className="gap-qtitle" style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.35, color: t.text, margin: 0 }}>{q.question}</h3>
                        {q.evidencia && (
                          <p style={{ fontSize: '14px', color: t.textDim, lineHeight: 1.6, margin: '8px 0 0' }}>
                            <strong style={{ color: t.textMuted, fontWeight: 600 }}>Evidencia esperada:</strong> {q.evidencia}
                          </p>
                        )}

                        <div style={{ marginTop: '28px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: t.textDim, margin: '0 0 12px' }}>Seleccione el grado de implementación:</p>
                          <div className="gap-options" role="radiogroup" aria-label="Grado de implementación" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                            {q.options.map((option, i) => {
                              const m = meta[i] || meta[2];
                              const sel = answers[q.id] === option;
                              return (
                                <button key={option} type="button" role="radio" aria-checked={sel} onClick={() => handleAnswer(option)}
                                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', borderRadius: '12px', border: `2px solid ${sel ? '#2563eb' : t.border}`, background: sel ? 'rgba(37,99,235,.06)' : t.cardBg, boxShadow: sel ? '0 0 0 3px rgba(59,130,246,.15)' : 'none', cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                                  <span style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', background: sel ? m.on : t.inputBg, color: sel ? '#fff' : t.textDim }}>
                                    <m.Icon size={16} strokeWidth={2.5} />
                                  </span>
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: sel ? '#1d4ed8' : t.text }}>{option}</span>
                                  <span style={{ fontSize: '11px', color: t.textDim, marginTop: '2px' }}>{m.sub}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* NO APLICA: se declara con justificación, no se borra la pregunta */}
                        <div style={{ marginTop: '16px' }}>
                          {q.id in noAplica ? (
                            <div style={{ background: t.inputBg, border: `1px dashed ${t.border}`, borderRadius: '12px', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '12px', color: t.text }}>Marcada como "No aplica" para tu empresa</strong>
                                <span style={{ fontSize: '11px', color: t.textDim }}>Responde Sí, Parcialmente o No para volver a incluirla</span>
                              </div>
                              <p style={{ fontSize: '12px', lineHeight: 1.5, margin: 0, color: t.textMuted }}>{noAplica[q.id]}</p>
                            </div>
                          ) : naDraft !== null ? (
                            <div style={{ border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px' }}>
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
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0, border: 'none', background: 'none', color: t.textDim, fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                              <Ban size={14} /> Esta pregunta no aplica a mi empresa
                            </button>
                          )}
                          {naError && <p role="alert" style={{ fontSize: '12px', color: '#dc2626', margin: '8px 0 0' }}>{naError}</p>}
                        </div>

                        {/* RESULTADO IA */}
                        {aiResults[q.id] && (
                          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px', marginTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wand2 size={12} /></div>
                                <strong style={{ fontSize: '11px', color: '#1e3a8a' }}>Análisis IA</strong>
                                {(() => {
                                  const v = aiResults[q.id].veredicto;
                                  const map = { cumple: ['Cumple', '#1d4ed8', '#dbeafe'], parcial: ['Parcial', '#b45309', '#fef3c7'], no_cumple: ['No cumple', '#dc2626', '#fee2e2'], sin_evidencia: ['Sin evidencia', '#475569', '#f1f5f9'] };
                                  const [label, color, bg] = map[v] || ['Sin clasificar', '#475569', 'transparent'];
                                  return <span style={{ fontSize: '10px', color, background: bg, fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>{label}</span>;
                                })()}
                              </div>
                              {typeof aiResults[q.id].confianza === 'number' && <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>Confianza: <span style={{ color: '#2563eb' }}>{Math.round(aiResults[q.id].confianza * 100)}%</span></span>}
                            </div>
                            <p style={{ color: '#334155', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>{aiResults[q.id].justificacion}</p>
                          </div>
                        )}

                        {/* NAVEGACIÓN */}
                        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <button type="button" onClick={goToPrev} disabled={currentPhase === 0 && currentQuestion === 0}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.textMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.04)', opacity: currentPhase === 0 && currentQuestion === 0 ? .4 : 1 }}>
                            <ChevronLeft size={16} /> Anterior
                          </button>
                          <button type="button" onClick={goToNext}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(37,99,235,.3)' }}>
                            Continuar <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </section>

              {/* DERECHA: evidencias y evaluación con IA */}
              <aside className="gap-right" aria-label="Evidencias" style={{ width: '270px', flex: 'none', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: `1px solid ${t.border}`, background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eef2ff', border: '1px solid #e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} /></span>
                    <div>
                      <h2 style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: 0 }}>Evidencias</h2>
                      <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>{selectedEvidenceIds.length} de {savedDocs.length} documentos para IA</p>
                    </div>
                  </div>
                  {saveStatus === 'error'
                    ? <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>Sin guardar</span>
                    : <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>Sincronizado</span>}
                </div>

                {(saveStatus === 'pending' || saveStatus === 'saving' || isEvaluating) && (
                  <div role="status" style={{ padding: '10px 16px', background: 'rgba(239,246,255,.7)', borderBottom: '1px solid #dbeafe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 500, color: '#1d4ed8' }}>
                      <Loader2 size={14} className="gap-spin" />
                      {isEvaluating
                        ? (evalProgress ? `${evalProgress.stage || 'Evaluando'} · ${evalProgress.done} de ${evalProgress.total}` : 'La IA está analizando los documentos...')
                        : 'Guardando respuestas...'}
                    </div>
                    {isEvaluating && evalProgress && evalProgress.total > 0 && (
                      <div role="progressbar" aria-valuenow={evalProgress.done} aria-valuemin={0} aria-valuemax={evalProgress.total} style={{ marginTop: '6px', height: '4px', background: '#dbeafe', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round((evalProgress.done / evalProgress.total) * 100)}%`, height: '100%', background: '#2563eb', transition: 'width .3s' }} />
                      </div>
                    )}
                  </div>
                )}

                <div className="gap-scroll" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.6px', textTransform: 'uppercase', color: t.textDim, margin: 0 }}>Documentos vinculados</p>
                  {savedDocs.length === 0 && <div style={{ padding: '12px', fontSize: '11px', color: t.textDim, borderRadius: '8px', background: t.inputBg, textAlign: 'center' }}>Sube evidencias para evaluarlas.</div>}
                  {savedDocs.map((d) => {
                    const checked = selectedEvidenceIds.includes(d.id);
                    const nombre = d.name || d.title || 'Documento';
                    return (
                      <label key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', borderRadius: '8px', border: `1px solid ${checked ? '#bfdbfe' : t.border}`, background: checked ? 'rgba(239,246,255,.5)' : 'transparent', cursor: 'pointer' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleEvidence(d.id)} style={{ accentColor: '#2563eb', width: '14px', height: '14px', marginTop: '2px', flex: 'none' }} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={14} color="#f43f5e" style={{ flex: 'none' }} />
                            <span title={nombre} style={{ fontSize: '12px', fontWeight: 500, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</span>
                          </span>
                          <span style={{ display: 'block', fontSize: '10px', color: t.textDim, paddingLeft: '20px', marginTop: '2px' }}>{checked ? 'Se usará en la evaluación' : 'No seleccionado'}</span>
                        </span>
                      </label>
                    );
                  })}
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', border: '1px dashed #93c5fd', borderRadius: '8px', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: uploadingDocs ? 'wait' : 'pointer' }}>
                    <FolderUp size={14} />{uploadingDocs ? 'Guardando...' : 'Agregar documentos'}
                    <input type="file" multiple accept=".pdf,.txt,.docx" disabled={uploadingDocs} style={{ display: 'none' }} onChange={(e) => { handleUploadDocs(e.target.files); e.target.value = ''; }} />
                  </label>
                  {evalError && <div role="alert" style={{ padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,.08)', color: '#dc2626', fontSize: '12px', overflowWrap: 'anywhere' }}>{evalError}</div>}
                  {evalInfo && <div role="status" style={{ padding: '10px', borderRadius: '8px', background: t.inputBg, color: t.text, fontSize: '12px', whiteSpace: 'pre-line' }}>{evalInfo}</div>}
                </div>

                <div style={{ padding: '16px', background: t.inputBg, borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button type="button" onClick={() => handleEvaluateWithAI(false)} disabled={isEvaluating || selectedEvidenceIds.length === 0}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #2563eb, #4f46e5)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: isEvaluating || !selectedEvidenceIds.length ? 'not-allowed' : 'pointer', opacity: isEvaluating || !selectedEvidenceIds.length ? .5 : 1, boxShadow: '0 1px 2px rgba(0,0,0,.08)' }}>
                    <Zap size={15} color="#bfdbfe" />{isEvaluating ? 'Evaluando...' : 'Evaluar con IA'}
                  </button>
                  <button type="button" onClick={() => handleEvaluateWithAI(true)} disabled={isEvaluating || selectedEvidenceIds.length === 0}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.textMuted, fontSize: '12px', fontWeight: 500, cursor: isEvaluating || !selectedEvidenceIds.length ? 'not-allowed' : 'pointer', opacity: isEvaluating || !selectedEvidenceIds.length ? .5 : 1 }}>
                    <RefreshCw size={14} /> Revalidar pendientes
                  </button>
                </div>
              </aside>
            </div>
          )}
        </>
      ) : activeMainTab === 'soa' ? (
        <InteractiveSOA />
      ) : activeMainTab === 'resultados' ? (
        <>
        {evalInfo && <div role="status" style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '10px', background: t.inputBg, border: `1px solid ${t.border}`, color: t.text, fontSize: '12px', whiteSpace: 'pre-line' }}>{evalInfo}</div>}
        <ResultadosView />
        <div style={{ marginTop: '20px' }}>
          <ResultadoBrechas phases={phases} answers={answers} noAplica={noAplica} aiResults={aiResults} valorDe={valorRespuesta}
            marcoLabel="ISO 27001" questionsById={questionsById} onIrAPregunta={irAPregunta} impactoDe={impactoISO}
            titulo="Brechas del cuestionario"
            textoImpacto="según el dominio del control. 5: Anexo A tecnológico · 4: Anexo A organizacional y planificación del riesgo (cláusula 6) · 3: contexto, liderazgo, soporte y mejora, personas y físico." />
        </div>
        </>
      ) : activeMainTab === 'resultado' ? (
        <>
        {evalInfo && <div role="status" style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: t.inputBg, border: `1px solid ${t.border}`, color: t.text, fontSize: '12px', whiteSpace: 'pre-line' }}>{evalInfo}</div>}
        <ResultadoBrechas phases={phases} answers={answers} noAplica={noAplica} aiResults={aiResults} valorDe={valorRespuesta}
          marcoLabel={esISO ? 'ISO 27001' : 'la Ley 21.719'} questionsById={questionsById} onIrAPregunta={irAPregunta} />
        </>
      ) : null}

      {/* ESTILOS INYECTADOS PARA RESPONSIVE GLOBAL */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes gap-spin { to { transform: rotate(360deg); } }
        .gap-spin { animation: gap-spin 1s linear infinite; }

        /* Escritorio ancho: tres columnas, laterales fijas al hacer scroll */
        .gap-left, .gap-right { position: sticky; top: 16px; max-height: calc(100vh - 32px); }
        .gap-scroll { flex: 1; min-height: 0; }

        /* Hasta 1279px: las evidencias bajan bajo la pregunta */
        @media (max-width: 1279px) {
          .gap-3col { flex-wrap: wrap; }
          .gap-center { flex: 1 1 calc(100% - 320px) !important; }
          .gap-right { width: 100% !important; position: static; max-height: none; }
        }

        /* Móvil y tablet: una sola columna */
        @media (max-width: 767px) {
          .gap-3col { flex-direction: column; align-items: stretch !important; }
          .gap-left { width: 100% !important; position: static; max-height: none; }
          .gap-left .gap-scroll { max-height: 220px; }
          .gap-center { flex: 1 1 auto !important; }
          .gap-qbody { padding: 20px 16px !important; }
          .gap-qtitle { font-size: 18px !important; }
          .gap-options { grid-template-columns: 1fr !important; }
          .gap-divider { display: none; }
          .gap-top { padding: 12px 14px !important; }
        }
      `}} />
    </div>
  );
}

export default GapAnalysisScreen;