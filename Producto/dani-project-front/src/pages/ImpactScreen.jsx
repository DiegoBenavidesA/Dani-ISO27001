import React, { useState, useEffect, useContext } from 'react';
import { Target, Sparkles, Shield, AlertTriangle, Check } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { impactAPI, treatmentsAPI } from '../services/api';

export default function ImpactScreen({ navParams, onNavigate }) {
  const { theme: t, darkMode, highContrast } = useContext(ThemeContext);
  
  // Recibe los datos desde la pantalla de tratamientos (si se hizo clic en el botón individual)
  const treatmentParams = navParams || null;
  const [treatment, setTreatment] = useState(treatmentParams);

  // Estados visuales y de datos
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [treatments, setTreatments] = useState([]);

  // Si no hay un tratamiento seleccionado, cargamos todos los tratamientos y evaluaciones
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
    if (!darkMode) return { background: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '24px', boxShadow: '0 2px 12px rgba(99, 102, 241, 0.08)' };
    return { background: '#1e1b4b', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '24px' };
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

  // VISTA GENERAL: Cuando no hay un tratamiento específico seleccionado,
  // mostramos la lista de tratamientos y la opción de analizarlos todos.
  if (!treatment) {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: t.text }}>Evaluaciones de Impacto (DPIA)</h1>
            <p style={{ color: t.textDim, fontSize: '14px' }}>Analiza los riesgos de privacidad de tus tratamientos de datos.</p>
          </div>
          
          <button 
            onClick={handleAnalyzeAll} 
            disabled={isAnalyzingAll} 
            style={{ 
              padding: '10px 20px', background: isAnalyzingAll ? 'rgba(139,92,246,0.5)' : '#8b5cf6', 
              border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, 
              cursor: isAnalyzingAll ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
            }}
          >
            <Sparkles size={16} />
            {isAnalyzingAll ? 'Analizando...' : 'Analizar tratamientos con IA'}
          </button>
        </div>

        <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: t.inputBg, fontSize: '12px', color: t.textDim, textTransform: 'uppercase' }}>
                <th style={{ padding: '16px 24px' }}>Tratamiento</th>
                <th style={{ padding: '16px 24px' }}>Riesgo Sugerido</th>
                <th style={{ padding: '16px 24px' }}>Estado</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {treatments.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: t.textDim }}>No hay tratamientos registrados.</td>
                </tr>
              ) : (
                treatments.map(trt => {
                  const eval_impacto = evaluations.find(e => e.treatment_id === trt.id);
                  const isEvaluated = !!eval_impacto;
                  const riesgo = isEvaluated ? eval_impacto.nivel_riesgo : 'No evaluado';
                  const estado = isEvaluated ? eval_impacto.estado : 'Sin iniciar';
                  
                  return (
                    <tr key={trt.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: '16px 24px', color: t.text, fontWeight: 500, fontSize: '14px' }}>
                        {trt.nombre}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {riesgo === 'alto' && <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '13px' }}>Alto</span>}
                        {riesgo === 'medio' && <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '13px' }}>Medio</span>}
                        {riesgo === 'bajo' && <span style={{ color: '#10b981', fontWeight: 600, fontSize: '13px' }}>Bajo</span>}
                        {riesgo === 'No evaluado' && <span style={{ color: t.textMuted, fontSize: '13px' }}>No evaluado</span>}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                          background: estado === 'pendiente' ? 'rgba(245, 158, 11, 0.1)' : estado === 'completado' ? 'rgba(16, 185, 129, 0.1)' : t.inputBg,
                          color: estado === 'pendiente' ? '#f59e0b' : estado === 'completado' ? '#10b981' : t.textMuted
                        }}>
                          {estado.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button 
                          onClick={() => setTreatment({ id: trt.id, name: trt.nombre, eval: eval_impacto })} 
                          style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text, cursor: 'pointer', fontSize: '12px' }}
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // VISTA DE DETALLE DE UN TRATAMIENTO ESPECÍFICO
  return (
    <div style={{ animation: 'fadeIn 0.4s ease', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: treatment.eval?.nivel_riesgo === 'alto' ? '#ef4444' : treatment.eval?.nivel_riesgo === 'medio' ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: t.text }}>Detalle de Evaluación</h1>
            <p style={{ color: t.textDim, fontSize: '14px' }}>Tratamiento: <strong>{treatment.name}</strong></p>
          </div>
        </div>
        <button onClick={() => setTreatment(null)} style={{ padding: '8px 16px', background: t.inputBg, border: `1px solid ${t.border}`, color: t.text, borderRadius: '8px', cursor: 'pointer' }}>Volver a la Lista</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Panel de Simulación / IA */}
        <div style={getSimulationPanelStyle()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color={darkMode ? '#8b5cf6' : '#4c1d95'} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#8b5cf6' : '#4c1d95', textTransform: 'uppercase' }}>Análisis de Riesgo Ley 21.719</span>
            </div>
            {/* Si no hay evaluación, el botón de analizar todo la creará */}
            {!treatment.eval && (
               <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>Requiere Evaluación IA</span>
            )}
          </div>
          
          {treatment.eval ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: treatment.eval.nivel_riesgo === 'alto' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: `1px solid ${treatment.eval.nivel_riesgo === 'alto' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}` }}>
                <AlertTriangle size={24} color={treatment.eval.nivel_riesgo === 'alto' ? '#ef4444' : '#f59e0b'} />
                <div>
                  <div style={{ color: treatment.eval.nivel_riesgo === 'alto' ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: '14px' }}>
                    Nivel de Riesgo Inherente: {treatment.eval.nivel_riesgo.toUpperCase()}
                  </div>
                  <div style={{ color: t.textDim, fontSize: '12px' }}>Estado actual: {treatment.eval.estado.toUpperCase()} (Pendiente de revisión del DPO)</div>
                </div>
              </div>

              <div style={{ padding: '16px', background: t.cardBg, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                <h4 style={{ fontSize: '12px', color: t.textDim, fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Descripción del Riesgo</h4>
                <p style={{ fontSize: '14px', color: t.text, lineHeight: 1.5, margin: 0 }}>
                  {treatment.eval.descripcion_riesgo || "Sin descripción proporcionada."}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: t.textDim, background: t.cardBg, borderRadius: '12px', border: `1px dashed ${t.border}` }}>
              Aún no se ha generado una evaluación de impacto para este tratamiento.
            </div>
          )}
        </div>

        {/* Panel de Resultados / Controles */}
        <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase', marginBottom: '16px' }}>Medidas Sugeridas (DPIA)</h3>
          {!treatment.eval || !treatment.eval.medidas_mitigacion ? (
            <p style={{ fontSize: '13px', color: t.textDim, textAlign: 'center' }}>No hay medidas sugeridas aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Convertimos el string de medidas en un arreglo separando por saltos de línea o viñetas */}
              {treatment.eval.medidas_mitigacion.split('\n').filter(m => m.trim().length > 0).map((medida, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}><Check size={12} color="white" /></div>
                  <span style={{ fontSize: '13px', color: t.text, fontWeight: 500, lineHeight: 1.4 }}>{medida.replace(/^[-*•\d.]+\s*/, '')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}