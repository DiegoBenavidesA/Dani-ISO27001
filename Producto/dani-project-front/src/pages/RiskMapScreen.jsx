/* eslint-disable */
import React, { useState, useEffect, useContext } from 'react';
import { 
  AlertTriangle, Database, Plus, ChevronDown, ChevronUp, ArrowRight, 
  Sparkles, Check, Download, Search, Shield, Target,
  Layers, Cloud, Globe, FileText
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { riskAPI } from '../services/api';
import { NIVELES_RIESGO, UMBRALES_RIESGO, nivelRiesgo } from '../utils/nivelRiesgo';

const RiskMapScreen = ({ navParams } = {}) => {
  const { theme: t, language, darkMode, highContrast } = useContext(ThemeContext);
  const { user } = useAuth();
  const [responsables, setResponsables] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);
  useEffect(() => { riskAPI.responsables().then((l) => setResponsables(Array.isArray(l) ? l : [])).catch(() => {}); }, []);

  // Al elegir un riesgo se cargan los controles de su plan guardado como aplicados.
  const seleccionar = (r) => {
    setSelectedRisk({ ...r, name: r.title, prob: Math.max(1, r.likelihood || r.prob || 1) });
    setAppliedControls((r.controls || []).map((c) => c.id));
    setAnalisisError(null); setErrorGuardar(null);
  };

  // Guarda cambios del riesgo o de su tratamiento y actualiza la matriz.
  const guardarRiesgo = async (cambios) => {
    if (!selectedRisk) return;
    setGuardando(true); setErrorGuardar(null);
    try {
      const r = await riskAPI.update(selectedRisk.id, cambios);
      setRisks((prev) => prev.map((x) => (x.id === r.id ? r : x)));
      const sugerencias = (selectedRisk.controls || []).filter((c) => !(r.controls || []).some((g) => g.codigo === c.codigo));
      setSelectedRisk({ ...r, name: r.title, prob: Math.max(1, r.likelihood || 1), controls: [...(r.controls || []), ...sugerencias] });
      setAppliedControls((r.controls || []).map((c) => c.id));
    } catch (err) {
      setErrorGuardar(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const guardarPlan = () => {
    const elegidos = (selectedRisk.controls || []).filter((c) => appliedControls.includes(c.id));
    const estado = selectedRisk.status === 'open' && elegidos.length ? { status: 'in_review' } : {};
    guardarRiesgo({ controls: elegidos, ...estado });
  };
  
  // ==========================================
  // 1. ESTADOS LOCALES Y DE LA API
  // ==========================================
  const [risks, setRisks] = useState([]);
  
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [appliedControls, setAppliedControls] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analisisError, setAnalisisError] = useState(null);
  // Al cambiar de riesgo se limpia el error del análisis anterior.
  useEffect(() => { setAnalisisError(null); }, [selectedRisk?.id]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRisk, setNewRisk] = useState({ title: '', description: '', likelihood: 3, impact: 3, category: 'security', owner: '', due_date: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [avisoBrecha, setAvisoBrecha] = useState(null);
  const [risksLoaded, setRisksLoaded] = useState(false);

  // ==========================================
  // 2. CONEXIÓN REAL CON EL BACKEND
  // ==========================================
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const data = await riskAPI.getAll();
        const lista = Array.isArray(data) ? data : [];
        setRisks(lista);
        setLoadError(null);
        if (lista.length > 0) seleccionar(lista[0]);
      } catch (error) {
        console.error("Error conectando con la API de Riesgos.", error);
        setLoadError('No se pudieron cargar los riesgos. Revisa tu conexión y recarga la página.');
      } finally {
        setRisksLoaded(true);
      }
    };
    fetchRisks();
  }, []);

  // Viene desde una brecha del Análisis de Brechas: si ya existe un riesgo con
  // ese título se muestra ese; si no, se abre el formulario precargado.
  useEffect(() => {
    const pre = navParams?.nuevoRiesgo;
    if (!pre || !risksLoaded) return;
    const existente = risks.find(r => (r.title || '').trim().toLowerCase() === pre.title.trim().toLowerCase());
    if (existente) {
      seleccionar(existente);
      setAvisoBrecha(`Esta brecha ya está registrada como riesgo ("${existente.title}"). Se muestra en el simulador.`);
      return;
    }
    setNewRisk(prev => ({ ...prev, ...pre }));
    setAvisoBrecha('Formulario precargado desde el Análisis de Brechas. Revisa la descripción y la probabilidad antes de guardar: la del Análisis mide cuánto falta para cumplir, no qué tan probable es el evento.');
    setShowAddModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navParams, risksLoaded]);

  // ==========================================
  // 4. FUNCIONES DE CÁLCULO Y COLOR
  // ==========================================

  // CAMBIO 1: Colores adaptativos según el tema activo
  const getMatrixCellColor = (prob, impact) => {
    const score = prob * impact;

    if (highContrast) {
      // Alto contraste: colores puros y brillantes sobre negro
      if (score >= 15) return '#7f0000';  // Rojo profundo con suficiente contraste
      if (score >= UMBRALES_RIESGO.alto) return '#7f3b00';  // Naranja oscuro puro
      if (score >= UMBRALES_RIESGO.medio)  return '#5c4a00';  // Amarillo oscuro puro
      return '#003d1f';                   // Verde oscuro puro
    }

    if (!darkMode) {
      // Modo claro: colores sólidos con opacidad suficiente para que se distingan bien
      if (score >= 15) return 'rgba(185, 28, 28, 0.25)';   // Rojo
      if (score >= UMBRALES_RIESGO.alto) return 'rgba(194, 65, 12, 0.25)';   // Naranja
      if (score >= UMBRALES_RIESGO.medio)  return 'rgba(161, 98, 7, 0.25)';    // Amarillo/ámbar
      return 'rgba(4, 120, 87, 0.18)';                     // Verde
    }

    // Modo oscuro (original)
    if (score >= 15) return 'rgba(153, 27, 27, 0.4)';
    if (score >= UMBRALES_RIESGO.alto) return 'rgba(154, 52, 18, 0.4)';
    if (score >= UMBRALES_RIESGO.medio)  return 'rgba(133, 77, 14, 0.4)';
    return 'rgba(6, 78, 59, 0.4)';
  };

  // CAMBIO 2: Borde de celda adaptativo
  const getMatrixCellBorder = (prob, impact) => {
    const score = prob * impact;
    if (highContrast) {
      // Alto contraste: bordes brillantes que demarcan cada zona
      if (score >= 15) return '2px solid #ff4444';
      if (score >= UMBRALES_RIESGO.alto) return '2px solid #ff8800';
      if (score >= UMBRALES_RIESGO.medio)  return '2px solid #ffdd00';
      return '2px solid #00cc66';
    }
    if (!darkMode) return '1px solid rgba(0,0,0,0.08)';
    return '1px solid rgba(255,255,255,0.06)';
  };

  // CAMBIO 3: Color de borde para la burbuja de riesgo (para que resalte sobre el cuadrante)
  const getRiskBubbleBorder = () => {
    if (highContrast) return '2px solid #ffffff';
    if (!darkMode) return '2px solid #1e293b';
    return '2px solid rgba(255,255,255,0.9)';
  };

  const getRiskBadgeColor = (score) => {
    if (score >= 15) return '#ef4444';
    if (score >= 8) return '#f59e0b';
    return '#004ac6';
  };

  // Riesgo residual: cada control baja la probabilidad o el impacto (escala
  // 1-5) y el resultado se vuelve a multiplicar, igual que el riesgo inicial.
  const calculateMitigatedScore = (risk) => {
    if (!risk) return 0;
    let prob = risk.prob, impacto = risk.impact;
    appliedControls.forEach(controlId => {
      const c = risk.controls?.find(ctrl => ctrl.id === controlId);
      if (!c) return;
      if (c.reduce === 'impacto') impacto -= c.puntos; else prob -= c.puntos;
    });
    return Math.max(1, prob) * Math.max(1, impacto);
  };

  const toggleControl = (controlId) => {
    setAppliedControls(prev => prev.includes(controlId) 
      ? prev.filter(id => id !== controlId) 
      : [...prev, controlId]);
  };

  const handleAnalyzeWithAI = async () => {
    if (!selectedRisk || !selectedRisk.id) return;
    setIsAnalyzing(true);
    try {
      setAnalisisError(null);
      const response = await riskAPI.analyzeWithAI(selectedRisk.id);
      // El plan guardado se mantiene; las sugerencias nuevas se agregan sin repetir controles.
      const plan = (risks.find((x) => x.id === selectedRisk.id)?.controls) || [];
      const nuevas = (response.controls || []).filter((c) => !plan.some((g) => g.codigo === c.codigo));
      setSelectedRisk(prev => ({ ...prev, controls: [...plan, ...nuevas] }));
      setAppliedControls(plan.map((c) => c.id));
    } catch (error) {
      // Sin respuesta de la IA no se muestran controles inventados.
      setAnalisisError(error.message || 'No se pudo consultar a la IA.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddRisk = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const createdRisk = await riskAPI.create({ ...newRisk, owner: newRisk.owner || user?.email || undefined, due_date: newRisk.due_date ? `${newRisk.due_date}T23:59:00` : null });
      setRisks(prev => [...prev, createdRisk]);
      seleccionar(createdRisk);
      setShowAddModal(false);
      setAvisoBrecha(null);
      setNewRisk({ title: '', description: '', likelihood: 3, impact: 3, category: 'security', owner: '', due_date: '' });
    } catch (err) {
      alert("Error al crear el riesgo: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // CAMBIO 4: Estilos del panel de simulación adaptativos al tema
  // ==========================================
  const getSimulationPanelStyle = () => {
    if (highContrast) {
      return {
        background: '#000000',
        borderRadius: '16px',
        border: '2px solid #ffffff',
        padding: '24px',
      };
    }
    if (!darkMode) {
      // Modo claro: fondo blanco con borde morado sutil
      return {
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '24px',
        boxShadow: '0 2px 12px rgba(99, 102, 241, 0.08)',
      };
    }
    // Modo oscuro: original
    return {
      background: '#1e1b4b',
      borderRadius: '16px',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      padding: '24px',
    };
  };

  const getSimulationTextColor = () => {
    if (highContrast) return '#ffffff';
    if (!darkMode) return '#4c1d95'; // Morado oscuro visible sobre blanco
    return '#8b5cf6';
  };

  const getSimulationSubtextColor = () => {
    if (highContrast) return '#cccccc';
    if (!darkMode) return '#6b7280';
    return 'rgba(255,255,255,0.5)';
  };

  // ==========================================
  // 5. DISEÑO VISUAL (JSX)
  // ==========================================
  return (
    <div className="normia-riskmap" style={{ animation: 'fadeIn 0.4s ease', color: t.text, display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minWidth: 0 }}>
      {/* Estilos exclusivos de esta pantalla: no alteran la lógica ni otros módulos. */}
      <style>{`
        .normia-riskmap, .normia-riskmap * { box-sizing: border-box; }
        .normia-riskmap .riskmap-asset-header { gap: 16px; }
        .normia-riskmap .riskmap-header-title,
        .normia-riskmap .riskmap-header-actions,
        .normia-riskmap .riskmap-matrix,
        .normia-riskmap .riskmap-simulator { min-width: 0; }
        .normia-riskmap .riskmap-header-title h2,
        .normia-riskmap .riskmap-risk-title { overflow-wrap: anywhere; }
        .normia-riskmap .riskmap-asset-filters {
          overflow-x: auto;
          max-width: 100%;
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch;
        }
        .normia-riskmap .riskmap-asset-filters > button { flex: 0 0 auto; white-space: nowrap; }
        .normia-riskmap .riskmap-asset-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .normia-riskmap .riskmap-asset-card { min-width: 0; overflow-wrap: anywhere; }
        .normia-riskmap .riskmap-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
          gap: 24px;
          min-width: 0;
        }
        .normia-riskmap .riskmap-matrix-grid { min-width: 0; }
        .normia-riskmap .riskmap-control-row { gap: 12px; }
        .normia-riskmap .riskmap-control-name { min-width: 0; overflow-wrap: anywhere; }
        .normia-riskmap .riskmap-control-score { flex-shrink: 0; }
        .normia-riskmap .riskmap-modal-backdrop {
          padding: 16px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .normia-riskmap .riskmap-modal-dialog {
          width: 100%;
          max-width: 480px;
          max-height: calc(100dvh - 32px);
          overflow-y: auto;
          margin: auto;
        }
        .normia-riskmap .riskmap-modal-dialog input,
        .normia-riskmap .riskmap-modal-dialog textarea { min-width: 0; max-width: 100%; }
        @media (max-width: 1180px) {
          .normia-riskmap .riskmap-main-grid { grid-template-columns: minmax(0, 1fr); }
          .normia-riskmap .riskmap-asset-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .normia-riskmap { gap: 16px !important; }
          .normia-riskmap .riskmap-asset-header { flex-direction: column; align-items: stretch !important; padding: 16px !important; }
          .normia-riskmap .riskmap-header-title { gap: 12px !important; }
          .normia-riskmap .riskmap-header-title > div:first-child { width: 42px !important; height: 42px !important; flex-shrink: 0; }
          .normia-riskmap .riskmap-header-actions { justify-content: space-between; flex-wrap: wrap; gap: 12px !important; }
          .normia-riskmap .riskmap-add-button { width: 100%; justify-content: center; min-height: 40px; }
          .normia-riskmap .riskmap-asset-content { padding: 16px !important; }
          .normia-riskmap .riskmap-asset-cards { gap: 10px; }
          .normia-riskmap .riskmap-asset-card { padding: 12px !important; }
          .normia-riskmap .riskmap-main-grid { gap: 18px; }
          .normia-riskmap .riskmap-matrix-legend { padding-left: 0 !important; }
          .normia-riskmap .riskmap-matrix-legend > div { gap: 8px 12px !important; justify-content: center; }
          .normia-riskmap .riskmap-matrix-grid { gap: 4px !important; }
          .normia-riskmap .riskmap-risk-header { padding: 16px !important; }
          .normia-riskmap .riskmap-simulation-panel,
          .normia-riskmap .riskmap-controls-panel { padding: 16px !important; }
          .normia-riskmap .riskmap-simulation-header { flex-wrap: wrap; gap: 12px; }
          .normia-riskmap .riskmap-control-row { padding: 12px !important; }
          .normia-riskmap .riskmap-modal-dialog { padding: 20px !important; border-radius: 16px !important; }
          .normia-riskmap .riskmap-modal-actions { flex-wrap: wrap; }
        }
        @media (max-width: 350px) {
          .normia-riskmap .riskmap-asset-cards { grid-template-columns: minmax(0, 1fr); }
          .normia-riskmap .riskmap-modal-number-fields { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
      
      {/* 1. CABECERA */}
      <div className="riskmap-asset-header" style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="riskmap-header-title" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: t.text }}>Mapa de Riesgos</h2>
            <p style={{ fontSize: '13px', color: t.textDim }}>{risks.length} {risks.length === 1 ? 'riesgo registrado' : 'riesgos registrados'}</p>
          </div>
        </div>
        <button className="riskmap-add-button"
          onClick={() => setShowAddModal(true)}
          style={{ padding: '8px 16px', background: '#004ac6', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Plus size={16} /> Nuevo Riesgo
        </button>
      </div>

      {avisoBrecha && (
        <div role="status" style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)', color: t.text, fontSize: '13px', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
          <span>{avisoBrecha}</span>
          <button type="button" onClick={() => setAvisoBrecha(null)} style={{ background: 'none', border: 'none', color: t.textDim, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Cerrar</button>
        </div>
      )}

      {loadError && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> {loadError}
        </div>
      )}

      {/* 2. SECCIÓN: MATRIZ Y SIMULADOR */}
      <div className="riskmap-main-grid">
        
        {/* MATRIZ 5x5 CON EJES EXPLÍCITOS Y LEYENDA ARRIBA */}
        <div className="riskmap-matrix" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* FILA 1: Leyenda de colores — encima del mapa, alineada a la derecha */}
          <div className="riskmap-matrix-legend" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '56px', paddingBottom: '2px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Bajo',    color: '#004ac6', range: NIVELES_RIESGO[0].rango },
                { label: 'Medio',   color: '#eab308', range: NIVELES_RIESGO[1].rango },
                { label: 'Alto',    color: '#f59e0b', range: NIVELES_RIESGO[2].rango },
                { label: 'Crítico', color: '#ef4444', range: NIVELES_RIESGO[3].rango },
              ].map(({ label, color, range }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '3px',
                    background: color, flexShrink: 0,
                    border: highContrast ? '1px solid #fff' : 'none',
                  }} />
                  <span style={{ fontSize: '11px', color: t.textDim, fontWeight: 700 }}>{label}</span>
                  <span style={{ fontSize: '10px', color: t.textDim, opacity: 0.55 }}>({range})</span>
                </div>
              ))}
            </div>
          </div>

          {/* FILA 2: Etiqueta "Impacto" centrada sobre las columnas con líneas decorativas */}
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '56px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '1px', background: t.border }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>
                Impacto
              </span>
              <div style={{ flex: 1, height: '1px', background: t.border }} />
            </div>
          </div>

          {/* FILA 3: Números del eje X — gap 8px igual que la grid */}
          <div style={{ display: 'flex', paddingLeft: '56px', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: 700, color: t.textDim, paddingBottom: '2px' }}>
                {n}
              </div>
            ))}
          </div>

          {/* Fila: etiqueta Y + números Y + celdas */}
          <div style={{ display: 'flex', gap: '8px' }}>

            {/* Etiqueta del eje Y (Probabilidad) — rotada verticalmente */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '28px', flexShrink: 0 }}>
              <span style={{
                fontSize: '12px', fontWeight: 700, color: t.textMuted,
                textTransform: 'uppercase', letterSpacing: '1.5px',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                whiteSpace: 'nowrap',
              }}>
                ← Probabilidad
              </span>
            </div>

            {/* Números del eje Y + celdas */}
            <div style={{ display: 'flex', flex: 1, gap: '8px' }}>

              {/* Números del eje Y (5 a 1, de arriba a abajo) — gap idéntico al de la grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[5, 4, 3, 2, 1].map(n => (
                  <div key={n} style={{
                    // altura calculada igual que las celdas: aspect-ratio 1 + el gap interno
                    // usamos minHeight para que sea proporcional al contenedor
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '20px',
                    // flex: 1 hace que cada número ocupe exactamente 1/5 del alto total
                    flex: 1,
                    fontSize: '11px', fontWeight: 700, color: t.textDim
                  }}>
                    {n}
                  </div>
                ))}
              </div>

              {/* La cuadrícula — gap 8px: respira sin fragmentarse ni solaparse en hover */}
              <div className="riskmap-matrix-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', 
                gridTemplateRows: 'repeat(5, 1fr)', 
                gap: '8px',
                flex: 1,
                // isolation: isolate es clave para que el z-index del hover funcione
                // sin afectar elementos fuera del grid
                isolation: 'isolate',
                background: 'transparent'
              }}>
                {[5, 4, 3, 2, 1].map((prob) => (
                  [1, 2, 3, 4, 5].map((impact) => {
                    
                    let riskCount = null;
                    let cellRisks = [];
                    
                    if (risks.length > 0) {
                      cellRisks = risks.filter(r => Math.max(1, r.likelihood || r.prob || 1) === prob && Math.max(1, r.impact || 1) === impact);
                      if (cellRisks.length > 0) riskCount = cellRisks.length;
                    }

                    const score = prob * impact;
                    const levelLabel = nivelRiesgo(score).nombre;

                    return (
                      <div
                        key={`${prob}-${impact}`}
                        title={`Probabilidad ${prob} · Impacto ${impact} · ${levelLabel}${riskCount ? ` · ${riskCount} riesgo(s)` : ' · Click para agregar'}`}
                        onClick={() => {
                          if (cellRisks.length > 0) {
                            seleccionar(cellRisks[0]);
                          } else {
                            setNewRisk(prev => ({ ...prev, likelihood: prob, impact }));
                            setShowAddModal(true);
                          }
                        }}
                        style={{
                          aspectRatio: '1',
                          background: getMatrixCellColor(prob, impact),
                          borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: getMatrixCellBorder(prob, impact),
                          cursor: 'pointer',
                          // transition suave; z-index se actualiza instantáneo via onMouseEnter
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
                          position: 'relative',
                          zIndex: 1,
                        }}
                        onMouseEnter={e => {
                          // scale(1.04): hover visible pero sin invadir celdas vecinas
                          // z-index 10 sube la celda sobre sus vecinas dentro del isolation context
                          e.currentTarget.style.transform = 'scale(1.04)';
                          e.currentTarget.style.filter = 'brightness(1.2)';
                          e.currentTarget.style.zIndex = '10';
                          e.currentTarget.style.boxShadow = highContrast
                            ? '0 0 0 2px #ffffff, 0 8px 24px rgba(0,0,0,0.6)'
                            : '0 8px 24px rgba(0,0,0,0.3)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.filter = 'brightness(1)';
                          e.currentTarget.style.zIndex = '1';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {riskCount ? (
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            background: getRiskBadgeColor(score),
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', fontWeight: 800,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            border: getRiskBubbleBorder(),
                          }}>
                            {riskCount}
                          </div>
                        ) : (
                          <div style={{ opacity: 0, fontSize: '18px', color: 'white', fontWeight: 700, transition: 'opacity 0.15s' }}
                            className="cell-plus">+</div>
                        )}
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* PANEL DE SIMULACIÓN */}
        <div className="riskmap-simulator" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {!selectedRisk && (
            <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '48px 24px', textAlign: 'center', color: t.textDim }}>
              <Target size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>Haz clic en cualquier celda de la matriz</p>
              <p style={{ fontSize: '12px', opacity: 0.6 }}>Celdas con riesgos → simulador · Celdas vacías → agregar riesgo</p>
            </div>
          )}

          {selectedRisk && <>
          {/* Header del Riesgo */}
          <div className="riskmap-risk-header" style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '24px', display: 'flex', gap: '16px', alignItems: 'center', minWidth: 0 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={24} color="white" />
            </div>
            <div>
              <h2 className="riskmap-risk-title" style={{ fontSize: '18px', fontWeight: 700, color: t.text, marginBottom: '6px' }}>{selectedRisk.name}</h2>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', padding: '4px 10px', background: t.inputBg, borderRadius: '6px', color: t.textDim }}>{ESTADOS_RIESGO[selectedRisk.status] || 'Abierto'}</span>
                {selectedRisk.tratamiento_vencido && <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', background: 'rgba(220,38,38,0.1)', borderRadius: '6px', color: '#dc2626' }}>Tratamiento vencido</span>}
                {selectedRisk.revision_pendiente && <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', background: 'rgba(217,119,6,0.12)', borderRadius: '6px', color: '#b45309' }}>Por reevaluar</span>}
                {risks.length > 1 && (
                  <select aria-label="Elegir otro riesgo" value={selectedRisk.id} onChange={(e) => seleccionar(risks.find((x) => x.id === e.target.value))}
                    style={{ fontSize: '11px', padding: '4px 8px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text, maxWidth: '220px' }}>
                    {risks.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* CAMBIO 4: Caja de Simulación adaptativa al tema */}
          <div className="riskmap-simulation-panel" style={getSimulationPanelStyle()}>
            <div className="riskmap-simulation-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color={getSimulationTextColor()} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: getSimulationTextColor(), textTransform: 'uppercase', letterSpacing: '1px' }}>Modo Simulación</span>
              </div>
              <button 
                onClick={handleAnalyzeWithAI}
                disabled={isAnalyzing}
                style={{ 
                  padding: '6px 12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', 
                  border: 'none', borderRadius: '8px', color: 'white', fontSize: '11px', fontWeight: 700, 
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: isAnalyzing ? 0.7 : 1
                }}
              >
                <Sparkles size={12} color="white" />
                {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', color: getSimulationSubtextColor(), marginBottom: '4px' }}>Antes</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: getRiskBadgeColor(selectedRisk.prob * selectedRisk.impact), lineHeight: '1' }}>
                  {selectedRisk.prob * selectedRisk.impact}
                </div>
                <div style={{ fontSize: '11px', color: getRiskBadgeColor(selectedRisk.prob * selectedRisk.impact), marginTop: '4px' }}>
                  {nivelRiesgo(selectedRisk.prob * selectedRisk.impact).nombre}
                </div>
              </div>
              
              <ArrowRight size={24} color={getSimulationSubtextColor()} />
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: getSimulationSubtextColor(), marginBottom: '4px' }}>Después</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: appliedControls.length > 0 ? '#004ac6' : getSimulationSubtextColor(), lineHeight: '1', transition: 'color 0.3s' }}>
                  {appliedControls.length > 0 ? calculateMitigatedScore(selectedRisk) : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Controles de Mitigación */}
          <div className="riskmap-controls-panel" style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '24px', flex: 1 }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Controles de Mitigación Sugeridos</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isAnalyzing && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8b5cf6', fontSize: '13px', fontWeight: 600 }}>
                  Consultando a DANI...
                </div>
              )}
              {!isAnalyzing && analisisError && (
                <div role="alert" style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', fontSize: '12px' }}>{analisisError}</div>
              )}
              {!isAnalyzing && !analisisError && (!selectedRisk.controls || selectedRisk.controls.length === 0) && (
                <div style={{ textAlign: 'center', padding: '20px', color: t.textDim, fontSize: '13px' }}>
                  Haz clic en "Analizar con IA" para obtener recomendaciones.
                </div>
              )}
              {!isAnalyzing && selectedRisk.controls && selectedRisk.controls.map(control => {
                const isApplied = appliedControls.includes(control.id);
                return (
                  <div className="riskmap-control-row"
                    key={control.id} 
                    onClick={() => toggleControl(control.id)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '16px', background: isApplied ? 'rgba(0, 74, 198, 0.05)' : t.inputBg, 
                      border: `1px solid ${isApplied ? 'rgba(0, 74, 198, 0.3)' : t.border}`, 
                      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${isApplied ? '#004ac6' : t.textDim}`, background: isApplied ? '#004ac6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isApplied && <Check size={14} color="white" />}
                      </div>
                      <span className="riskmap-control-name" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{control.codigo} {control.nombre}</span>
                        {control.accion && <span style={{ fontSize: '11px', color: t.textDim, lineHeight: 1.4 }}>{control.accion}</span>}
                      </span>
                    </div>
                    <span className="riskmap-control-score" title={control.reduce === 'impacto' ? 'Reduce el impacto' : 'Reduce la probabilidad'} style={{ fontSize: '11px', fontWeight: 700, color: '#004ac6', background: 'rgba(0, 74, 198, 0.1)', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                      -{control.puntos} {control.reduce === 'impacto' ? 'impacto' : 'prob.'}
                    </span>
                  </div>
                );
              })}
            </div>
            {selectedRisk.controls && selectedRisk.controls.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: t.textDim }}>Los controles marcados forman el plan de tratamiento y se guardan con el riesgo.</span>
                <button type="button" onClick={guardarPlan} disabled={guardando}
                  style={{ padding: '8px 14px', background: '#004ac6', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Guardando…' : `Guardar plan (${appliedControls.length} ${appliedControls.length === 1 ? 'control' : 'controles'})`}
                </button>
              </div>
            )}
          </div>

          <TratamientoRiesgo t={t} riesgo={selectedRisk} responsables={responsables} guardando={guardando} error={errorGuardar} onGuardar={guardarRiesgo} />
          </>}

        </div>
      </div>

      {/* MODAL NUEVO RIESGO */}
      {showAddModal && (
        <div className="riskmap-modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="riskmap-modal-dialog" style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, padding: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={24} color="#f59e0b" /> Identificar Nuevo Riesgo
            </h2>
            
            <form onSubmit={handleAddRisk} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: t.textDim, marginBottom: '6px', display: 'block' }}>Título del Riesgo</label>
                <input required type="text" value={newRisk.title} onChange={e => setNewRisk({...newRisk, title: e.target.value})} placeholder="Ej. Robo de equipo portátil" style={{ width: '100%', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: t.textDim, marginBottom: '6px', display: 'block' }}>Descripción del Evento</label>
                <textarea required value={newRisk.description} onChange={e => setNewRisk({...newRisk, description: e.target.value})} placeholder="Detalle qué podría pasar..." rows={3} style={{ width: '100%', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, outline: 'none', resize: 'none' }} />
              </div>

              <div className="riskmap-modal-number-fields" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: t.textDim, marginBottom: '6px', display: 'block' }}>Probabilidad (1-5)</label>
                  <input type="number" min="1" max="5" required value={newRisk.likelihood} onChange={e => setNewRisk({...newRisk, likelihood: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: t.textDim, marginBottom: '6px', display: 'block' }}>Impacto (1-5)</label>
                  <input type="number" min="1" max="5" required value={newRisk.impact} onChange={e => setNewRisk({...newRisk, impact: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, outline: 'none' }} />
                </div>
              </div>

              <div className="riskmap-modal-number-fields" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: t.textDim, marginBottom: '6px', display: 'block' }}>Responsable (dueño del riesgo)</label>
                  <select value={newRisk.owner || user?.email || ''} onChange={e => setNewRisk({ ...newRisk, owner: e.target.value })} style={{ width: '100%', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, outline: 'none' }}>
                    {!responsables.some(r => r.email === (newRisk.owner || user?.email)) && <option value={newRisk.owner || user?.email || ''}>{newRisk.owner || user?.email || 'Yo'}</option>}
                    {responsables.map(r => <option key={r.email} value={r.email}>{r.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: t.textDim, marginBottom: '6px', display: 'block' }}>Plazo para tratarlo</label>
                  <input type="date" value={newRisk.due_date} onChange={e => setNewRisk({ ...newRisk, due_date: e.target.value })} style={{ width: '100%', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, outline: 'none' }} />
                </div>
              </div>

              <div className="riskmap-modal-actions" style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '12px 20px', background: 'transparent', border: 'none', color: t.textDim, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Guardando...' : 'Añadir Riesgo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskMapScreen; 


// Estados del ciclo de tratamiento (ISO 27001, 6.1.3 y 8.3).
const ESTADOS_RIESGO = { open: 'Abierto', in_review: 'En tratamiento', mitigated: 'En tratamiento', accepted: 'Aceptado', closed: 'Cerrado' };

const fechaCorta = (s) => (s ? new Date(s.endsWith('Z') ? s : `${s}Z`).toLocaleDateString('es-CL') : '—');
const soloFecha = (s) => (s ? String(s).slice(0, 10) : '');

// Gestión del tratamiento: estado, probabilidad e impacto, responsable, plazo,
// aceptación del riesgo residual e incidentes en que se materializó.
function TratamientoRiesgo({ t, riesgo, responsables, guardando, error, onGuardar }) {
  const [form, setForm] = useState(null);
  useEffect(() => {
    setForm({ likelihood: riesgo.likelihood, impact: riesgo.impact, owner: riesgo.owner || '', due_date: soloFecha(riesgo.due_date) });
  }, [riesgo.id, riesgo.likelihood, riesgo.impact, riesgo.owner, riesgo.due_date]);
  if (!form) return null;

  const campo = { width: '100%', padding: '9px 10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
  const etiqueta = { fontSize: '11px', fontWeight: 700, color: t.textDim, marginBottom: '4px', display: 'block' };
  const cambio = form.likelihood !== riesgo.likelihood || form.impact !== riesgo.impact || form.owner !== (riesgo.owner || '') || form.due_date !== soloFecha(riesgo.due_date);
  const residualScore = riesgo.residual_likelihood && riesgo.residual_impact ? riesgo.residual_likelihood * riesgo.residual_impact : null;
  const estado = riesgo.status || 'open';
  const boton = (texto, onClick, primario) => (
    <button type="button" onClick={onClick} disabled={guardando}
      style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: guardando ? 'not-allowed' : 'pointer', border: primario ? 'none' : `1px solid ${t.border}`, background: primario ? '#004ac6' : 'transparent', color: primario ? 'white' : t.text }}>
      {texto}
    </button>
  );

  return (
    <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h3 style={{ fontSize: '11px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Tratamiento del riesgo</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        <div>
          <label style={etiqueta}>Probabilidad</label>
          <select value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: Number(e.target.value) })} style={campo}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label style={etiqueta}>Impacto</label>
          <select value={form.impact} onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })} style={campo}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label style={etiqueta}>Responsable</label>
          <select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} style={campo}>
            {!responsables.some((r) => r.email === form.owner) && <option value={form.owner}>{riesgo.owner_nombre || form.owner || 'Sin responsable'}</option>}
            {responsables.map((r) => <option key={r.email} value={r.email}>{r.nombre}</option>)}
          </select>
        </div>
        <div>
          <label style={etiqueta}>Plazo para tratarlo</label>
          <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} style={campo} />
        </div>
      </div>
      {cambio && (
        <div>{boton(guardando ? 'Guardando…' : 'Guardar cambios', () => onGuardar({
          likelihood: form.likelihood, impact: form.impact, owner: form.owner || undefined,
          due_date: form.due_date ? `${form.due_date}T23:59:00` : null,
        }), true)}</div>
      )}

      <div style={{ padding: '12px', borderRadius: '10px', background: t.inputBg, fontSize: '12px', color: t.text, lineHeight: 1.6 }}>
        <div><strong>Estado:</strong> {ESTADOS_RIESGO[estado] || estado}{riesgo.tratamiento_vencido ? ' · el plazo de tratamiento venció' : ''}</div>
        <div><strong>Riesgo residual del plan:</strong> {residualScore ? `${residualScore} (${nivelRiesgo(residualScore).nombre})` : 'sin plan guardado'}</div>
        {estado === 'accepted' && (
          <div>Aceptado por {riesgo.aceptado_por || '—'} el {fechaCorta(riesgo.aceptado_en)} · próxima revisión: {fechaCorta(riesgo.revision_fecha)}</div>
        )}
        {estado === 'closed' && <div>Cerrado el {fechaCorta(riesgo.closed_at)}</div>}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {estado === 'open' && boton('Iniciar tratamiento', () => onGuardar({ status: 'in_review' }))}
        {(estado === 'open' || estado === 'in_review' || estado === 'mitigated') && boton('Aceptar riesgo residual', () => {
          if (window.confirm(`¿Aceptas formalmente el riesgo residual${residualScore ? ` (${residualScore})` : ''}? Quedará registrado con tu nombre y la fecha, y se fijará su revisión en un año.`)) onGuardar({ status: 'accepted' });
        }, true)}
        {estado === 'accepted' && boton('Reevaluar', () => onGuardar({ status: 'in_review' }))}
        {estado !== 'closed' && boton('Cerrar (ya no existe la actividad)', () => {
          if (window.confirm('Cerrar el riesgo es solo para cuando desaparece la actividad que lo causa. ¿Confirmas?')) onGuardar({ status: 'closed' });
        })}
        {estado === 'closed' && boton('Reabrir', () => onGuardar({ status: 'open' }))}
      </div>
      {error && <div role="alert" style={{ fontSize: '12px', color: '#dc2626' }}>{error}</div>}

      <div>
        <div style={etiqueta}>Incidentes en que se materializó</div>
        {(riesgo.incidentes || []).length === 0 ? (
          <div style={{ fontSize: '12px', color: t.textDim }}>Ninguno. Se asocian desde Incidentes de seguridad.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: t.text, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {riesgo.incidentes.map((i) => <li key={i.id}>{fechaCorta(i.fecha_deteccion)} · {i.descripcion} <span style={{ color: t.textDim }}>({i.estado})</span></li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
