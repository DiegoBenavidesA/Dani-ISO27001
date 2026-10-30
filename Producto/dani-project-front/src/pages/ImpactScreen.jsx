/* eslint-disable */
import React, { useState, useEffect, useContext } from 'react';
import { Target, Sparkles, Shield, AlertTriangle, Check, ChevronRight } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { impactAPI, treatmentsAPI } from '../services/api';

export default function ImpactScreen({ navParams, onNavigate }) {
  const { theme: t, darkMode, highContrast } = useContext(ThemeContext);
  
  const treatmentParams = navParams || null;
  const [treatment, setTreatment] = useState(treatmentParams);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [treatments, setTreatments] = useState([]);

  useEffect(() => {
    if (!treatmentParams) {
      loadAllData();
    }
  }, [treatmentParams]);

  const loadAllData = async () => {
    try {
      const [evalData, treatData] = await Promise.all([
        impactAPI.getAll(),
        treatmentsAPI.getAll()
      ]);
      if (evalData) setEvaluations(evalData);
      if (treatData) setTreatments(treatData);
    } catch (e) {
      console.error("Error cargando datos de impacto: ", e);
    }
  };

  const getSimulationPanelStyle = () => {
    if (highContrast) return { background: '#000000', borderRadius: '16px', border: '2px solid #ffffff', padding: '24px' };
    if (!darkMode) return { background: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '24px', boxShadow: '0 2px 12px rgba(139, 92, 246, 0.08)' };
    return { background: '#1e1b4b', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '24px' };
  };

  const handleAnalyzeAll = async () => {
    setIsAnalyzingAll(true);
    try {
      const res = await impactAPI.analyzeAll();
      alert(res.message || "Análisis completado.");
      await loadAllData();
    } catch (e) {
      console.error(e);
      alert("Error analizando los tratamientos.");
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  // ════════════════════════════════════════════
  // VISTA GENERAL (LISTA DE TRATAMIENTOS DPIA)
  // ════════════════════════════════════════════
  if (!treatment) {
    return (
      <div className="impact-container" style={{ animation: 'fadeIn 0.4s ease', padding: '0 8px', color: t.text, minHeight: '100%', boxSizing: 'border-box' }}>
        
        {/* HEADER ADAPTADO */}
        <section className="impact-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ padding: '8px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', borderRadius: '12px', border: '1px solid rgba(37, 99, 235, 0.2)', flexShrink: 0 }}>
                <Shield size={22} strokeWidth={2} />
              </div>
              <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: t.text, tracking: 'tight', lineHeight: 1.2 }}>
                Evaluaciones de Impacto (DPIA)
              </h1>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: t.textDim, lineHeight: 1.4, paddingLeft: '4px' }}>
              Analiza los riesgos de privacidad de tus tratamientos de datos.
            </p>
          </div>
          
          <button 
            className="btn-analyze-all"
            onClick={handleAnalyzeAll} 
            disabled={isAnalyzingAll} 
            style={{ 
              padding: '12px 20px', background: isAnalyzingAll ? 'rgba(139,92,246,0.5)' : 'linear-gradient(to right, #7c3aed, #4f46e5)', 
              border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: 600, 
              cursor: isAnalyzingAll ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.2)', transition: 'all 0.2s', width: '100%'
            }}
          >
            <Sparkles size={16} className={isAnalyzingAll ? "animate-pulse" : ""} />
            {isAnalyzingAll ? 'Analizando...' : 'Analizar tratamientos con IA'}
          </button>
        </section>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tratamientos Evaluados ({treatments.length})</span>
          <span style={{ fontSize: '11px', color: t.textDim }}>Ley 21.719</span>
        </div>

        {/* TABLA ESCRITORIO Y TARJETAS MÓVIL */}
        <section aria-label="Lista de DPIA">
          <div className="dpia-list-container">
            
            {/* VISTA ESCRITORIO (TABLA) */}
            <div className="desktop-table-wrapper" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: t.inputBg, borderBottom: `1px solid ${t.border}` }}>
                    {['Tratamiento', 'Riesgo Sugerido', 'Estado', 'Acciones'].map((title, i) => (
                      <th key={title} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', textAlign: i === 3 ? 'right' : 'left' }}>{title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {treatments.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: t.textDim }}>No hay tratamientos registrados.</td></tr>
                  ) : (
                    treatments.map(trt => {
                      const eval_impacto = evaluations.find(e => e.treatment_id === trt.id);
                      const isEvaluated = !!eval_impacto;
                      const riesgo = isEvaluated ? eval_impacto.nivel_riesgo : 'No evaluado';
                      const estado = isEvaluated ? eval_impacto.estado : 'Sin iniciar';
                      
                      return (
                        <tr key={trt.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px', fontWeight: 700, fontSize: '13px', color: t.text }}>{trt.nombre}</td>
                          <td style={{ padding: '16px' }}>
                            {riesgo === 'alto' && <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '12px', background: '#fee2e2', padding: '4px 10px', borderRadius: '20px' }}>Alto</span>}
                            {riesgo === 'medio' && <span style={{ color: '#d97706', fontWeight: 700, fontSize: '12px', background: '#fef3c7', padding: '4px 10px', borderRadius: '20px' }}>Medio</span>}
                            {riesgo === 'bajo' && <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '12px', background: '#dbeafe', padding: '4px 10px', borderRadius: '20px' }}>Bajo</span>}
                            {riesgo === 'No evaluado' && <span style={{ color: t.textMuted, fontSize: '12px', background: t.inputBg, padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>No evaluado</span>}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                              background: estado === 'pendiente' ? '#fef3c7' : estado === 'completado' ? '#dbeafe' : t.inputBg,
                              color: estado === 'pendiente' ? '#d97706' : estado === 'completado' ? '#2563eb' : t.textMuted,
                              border: `1px solid ${estado === 'pendiente' ? '#fde68a' : estado === 'completado' ? '#bfdbfe' : t.border}`
                            }}>
                              {estado}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button 
                              onClick={() => setTreatment({ id: trt.id, name: trt.nombre, eval: eval_impacto })} 
                              style={{ padding: '8px 16px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              Ver Detalles <ChevronRight size={14} color={t.textDim} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL (TARJETAS) */}
            <div className="mobile-cards-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {treatments.length === 0 ? (
                <div style={{ padding: '30px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', textAlign: 'center', fontSize: '13px', color: t.textDim }}>
                  No hay tratamientos registrados para evaluar.
                </div>
              ) : (
                treatments.map(trt => {
                  const eval_impacto = evaluations.find(e => e.treatment_id === trt.id);
                  const isEvaluated = !!eval_impacto;
                  const riesgo = isEvaluated ? eval_impacto.nivel_riesgo : 'No evaluado';
                  const estado = isEvaluated ? eval_impacto.estado : 'Sin iniciar';

                  const getRiesgoStyle = (r) => {
                    if (r === 'alto') return { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' };
                    if (r === 'medio') return { bg: '#fffbeb', text: '#92400e', dot: '#f59e0b' };
                    if (r === 'bajo') return { bg: '#eff6ff', text: '#1e40af', dot: '#2563eb' };
                    return { bg: t.inputBg, text: t.textMuted, dot: t.textDim };
                  };
                  const rs = getRiesgoStyle(riesgo);

                  return (
                    <article key={trt.id} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: t.text, margin: '0 0 12px', lineHeight: 1.3 }}>{trt.nombre}</h3>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Riesgo Badge */}
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: rs.bg, border: `1px solid ${rs.bg}`, fontSize: '11px', fontWeight: 600, color: rs.text }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: rs.dot }}></span>
                            <span>Riesgo sugerido: <strong style={{ fontWeight: 800 }}>{riesgo.charAt(0).toUpperCase() + riesgo.slice(1)}</strong></span>
                          </div>
                          
                          {/* Estado Badge */}
                          <span style={{ 
                            display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                            background: estado === 'pendiente' ? '#fffbeb' : estado === 'completado' ? '#eff6ff' : t.inputBg,
                            color: estado === 'pendiente' ? '#b45309' : estado === 'completado' ? '#1d4ed8' : t.textMuted,
                            border: `1px solid ${estado === 'pendiente' ? '#fde68a' : estado === 'completado' ? '#bfdbfe' : t.border}`
                          }}>
                            {estado}
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${t.inputBg}`, display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setTreatment({ id: trt.id, name: trt.nombre, eval: eval_impacto })} 
                          style={{ width: '100%', padding: '8px 16px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                        >
                          Ver Detalles <ChevronRight size={14} color={t.textDim} />
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* TIP LEY 21.719 */}
        <div style={{ padding: '14px', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '11px', color: '#1e3a8a', marginTop: '24px' }}>
          <AlertTriangle size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            <strong style={{ fontWeight: 700 }}>Ley 21.719:</strong> Las evaluaciones de impacto son obligatorias para tratamientos que impliquen un alto riesgo para los derechos de los titulares.
          </p>
        </div>

        {/* ESTILOS INYECTADOS */}
        <style dangerouslySetInnerHTML={{__html: `
          .desktop-table-wrapper { display: none; }
          .mobile-cards-wrapper { display: flex; }
          .btn-analyze-all { width: 100%; margin-top: 12px; }

          @media (min-width: 768px) {
            .impact-container { padding: 32px 16px !important; }
            .impact-header { display: flex; justify-content: space-between; align-items: flex-end; }
            .btn-analyze-all { width: auto !important; margin-top: 0 !important; }
            
            .desktop-table-wrapper { display: block; }
            .mobile-cards-wrapper { display: none; }
          }
        `}} />
      </div>
    );
  }

  // ════════════════════════════════════════════
  // VISTA DE DETALLE DE UN TRATAMIENTO (DPIA)
  // ════════════════════════════════════════════
  return (
    <div className="dpia-detail-container" style={{ animation: 'fadeIn 0.4s ease', padding: '0 8px', color: t.text, minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER DETALLE */}
      <div className="dpia-detail-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: treatment.eval?.nivel_riesgo === 'alto' ? '#ef4444' : treatment.eval?.nivel_riesgo === 'medio' ? '#f59e0b' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={20} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: t.text, margin: '0 0 4px', lineHeight: 1.2 }}>Detalle de Evaluación</h1>
            <p style={{ color: t.textDim, fontSize: '12px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Tratamiento: <strong style={{ color: t.text }}>{treatment.name}</strong></p>
          </div>
        </div>
        <button className="btn-back" onClick={() => setTreatment(null)} style={{ padding: '10px 16px', background: t.cardBg, border: `1px solid ${t.border}`, color: t.text, borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          Volver a la Lista
        </button>
      </div>

      <div className="dpia-panels-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* PANEL DE SIMULACIÓN / IA */}
        <div style={getSimulationPanelStyle()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color={darkMode ? '#8b5cf6' : '#6d28d9'} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#8b5cf6' : '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Análisis de Riesgo Ley 21.719</span>
            </div>
            {!treatment.eval && (
               <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, padding: '4px 8px', background: '#fee2e2', borderRadius: '6px', textTransform: 'uppercase' }}>Requiere Evaluación IA</span>
            )}
          </div>
          
          {treatment.eval ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: treatment.eval.nivel_riesgo === 'alto' ? '#fef2f2' : '#fffbeb', borderRadius: '12px', border: `1px solid ${treatment.eval.nivel_riesgo === 'alto' ? '#fecaca' : '#fde68a'}` }}>
                <AlertTriangle size={20} color={treatment.eval.nivel_riesgo === 'alto' ? '#dc2626' : '#d97706'} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ color: treatment.eval.nivel_riesgo === 'alto' ? '#991b1b' : '#92400e', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
                    Nivel de Riesgo Inherente: {treatment.eval.nivel_riesgo.toUpperCase()}
                  </div>
                  <div style={{ color: treatment.eval.nivel_riesgo === 'alto' ? '#b91c1c' : '#b45309', fontSize: '11px', fontWeight: 500 }}>
                    Estado actual: {treatment.eval.estado.toUpperCase()} (Pendiente DPO)
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', background: t.cardBg, borderRadius: '12px', border: `1px solid ${t.border}`, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <h4 style={{ fontSize: '11px', color: t.textDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Descripción del Riesgo</h4>
                <p style={{ fontSize: '13px', color: t.text, lineHeight: 1.5, margin: 0 }}>
                  {treatment.eval.descripcion_riesgo || "Sin descripción proporcionada."}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: t.textDim, background: t.cardBg, borderRadius: '16px', border: `1px dashed ${t.border}` }}>
              <p style={{ fontSize: '13px', margin: 0, fontWeight: 500 }}>Aún no se ha generado una evaluación de impacto para este tratamiento.</p>
            </div>
          )}
        </div>

        {/* PANEL DE RESULTADOS / CONTROLES */}
        <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} /> Medidas Sugeridas (DPIA)
          </h3>
          
          {!treatment.eval || !treatment.eval.medidas_mitigacion ? (
            <p style={{ fontSize: '13px', color: t.textDim, textAlign: 'center', padding: '20px 0', margin: 0 }}>No hay medidas sugeridas aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {treatment.eval.medidas_mitigacion.split('\n').filter(m => m.trim().length > 0).map((medida, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Check size={10} color="white" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '12px', color: t.text, fontWeight: 500, lineHeight: 1.5 }}>
                    {medida.replace(/^[-*•\d.]+\s*/, '')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ESTILOS INYECTADOS */}
      <style dangerouslySetInnerHTML={{__html: `
        .btn-back { width: 100%; justify-content: center; margin-top: 12px; }

        @media (min-width: 1024px) {
          .dpia-detail-container { padding: 32px 16px !important; }
          .dpia-detail-header { align-items: center !important; }
          .btn-back { width: auto !important; margin-top: 0 !important; }
          
          .dpia-panels-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}} />
    </div>
  );
}