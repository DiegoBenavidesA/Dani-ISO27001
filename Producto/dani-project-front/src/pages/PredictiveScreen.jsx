/* eslint-disable */
import React, { useState, useEffect, useContext } from 'react';
import { BrainCircuit, AlertTriangle, ShieldAlert, Zap, Loader2, Play, CheckCircle2 } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { riskAPI, capaAPI } from '../services/api';

const PredictiveScreen = () => {
  const { theme: t } = useContext(ThemeContext);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [remediatingIndex, setRemediatingIndex] = useState(null);
  const [remediated, setRemediated] = useState({});

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await riskAPI.predictVulnerabilities();
      setPredictions(res.predictions || []);
      setRemediated({});
    } catch (err) {
      setError(`Error detectado: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRemediate = async (index, pred) => {
    setRemediatingIndex(index);
    try {
      const result = await capaAPI.autoRemediate({
        vulnerability_title: pred.title,
        recommended_action: pred.recommended_action
      });
      alert(result.message);
      setRemediated(prev => ({ ...prev, [index]: true }));
    } catch (err) {
      alert("Error ejecutando script: " + err.message);
    } finally {
      setRemediatingIndex(null);
    }
  };

  const getImpactColor = (impact) => {
    const colors = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };
    return colors[impact] || colors.medium;
  };

  return (
    <div className="predictive-container" style={{ padding: '0 8px', color: t.text, minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* ENCABEZADO MÓVIL-FIRST */}
      <section className="predictive-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: '#8b5cf6', flexShrink: 0 }}>
              <BrainCircuit size={24} strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: t.text, tracking: 'tight', lineHeight: 1.2 }}>Análisis Predictivo IA</h1>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: t.textDim, lineHeight: 1.5, maxWidth: '640px' }}>
            Nuestro motor de IA analiza el historial de brechas, tratamientos de datos y riesgos actuales de la organización para predecir vulnerabilidades futuras antes de que ocurran incidentes críticos.
          </p>
        </div>

        <button 
          className="btn-predict"
          onClick={fetchPredictions} 
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
            padding: '12px 20px', borderRadius: '12px',
            background: loading ? 'rgba(139,92,246,0.6)' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', 
            color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, 
            cursor: loading ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            transition: 'all 0.2s', flexShrink: 0
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {loading ? 'Analizando Patrones...' : 'Ejecutar Predicción'}
        </button>
      </section>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {/* DASHBOARD GRID */}
      <section className="predictions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {!loading && predictions.length === 0 && !error && (
          <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: t.textDim, background: t.cardBg, border: `1px dashed ${t.border}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: t.text }}>No hay predicciones activas</h3>
            <p style={{ fontSize: '13px', margin: 0 }}>Ejecuta el motor predictivo para escanear la organización.</p>
          </div>
        )}

        {!loading && predictions.map((pred, index) => {
          const isRemediating = remediatingIndex === index;
          const isDone = remediated[index];
          const impColor = getImpactColor(pred.impact);
          
          return (
            <article key={index} style={{
              background: isDone ? 'rgba(16, 185, 129, 0.02)' : t.cardBg, 
              borderRadius: '16px', 
              border: `1px solid ${isDone ? '#10b981' : t.border}`, 
              padding: '20px',
              position: 'relative', overflow: 'hidden', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              display: 'flex', flexDirection: 'column'
            }}>
              
              {/* Barra de impacto superior */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isDone ? '#10b981' : impColor }} />
              
              {/* Header de la Tarjeta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, lineHeight: 1.3, color: t.text }}>
                  {pred.title}
                </h3>
                <span style={{
                  padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                  color: isDone ? '#10b981' : impColor, 
                  background: isDone ? 'rgba(16, 185, 129, 0.1)' : `${impColor}15`,
                  border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : `${impColor}30`}`,
                  flexShrink: 0
                }}>
                  {isDone ? 'Corregido' : pred.impact}
                </span>
              </div>

              {/* Descripción */}
              <p style={{ color: t.textDim, fontSize: '13px', lineHeight: 1.5, margin: '0 0 20px', flexGrow: 1 }}>
                {pred.description}
              </p>

              {/* Barra de Probabilidad (Oculta si ya se solucionó) */}
              {!isDone && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: t.textDim }}>Probabilidad de Ocurrencia</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: pred.probability > 70 ? '#ef4444' : t.text }}>{pred.probability}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: t.inputBg, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pred.probability}%`, height: '100%', borderRadius: '3px',
                      background: pred.probability > 70 ? '#ef4444' : pred.probability > 40 ? '#f59e0b' : '#10b981',
                      transition: 'width 1s ease-in-out'
                    }} />
                  </div>
                </div>
              )}

              {/* BOTÓN DE ACCIÓN RECOMENDADA */}
              <button 
                onClick={() => handleRemediate(index, pred)}
                disabled={isRemediating || isDone}
                style={{ 
                  width: '100%',
                  background: isDone ? '#effdf4' : (isRemediating ? t.hoverBg : 'rgba(139, 92, 246, 0.05)'), 
                  padding: '14px', 
                  borderRadius: '12px', 
                  border: `1px solid ${isDone ? '#10b981' : (isRemediating ? t.border : 'rgba(139, 92, 246, 0.2)')}`, 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center',
                  cursor: (isRemediating || isDone) ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isDone ? '#10b981' : (isRemediating ? 'transparent' : 'rgba(139,92,246,0.15)'), display: 'flex', alignItems: 'center', justifyItems: 'center', flexShrink: 0, justifyContent: 'center' }}>
                  {isDone ? (
                    <CheckCircle2 size={16} color="#ffffff" />
                  ) : isRemediating ? (
                    <Loader2 size={16} color="#8b5cf6" className="animate-spin" />
                  ) : (
                    <Play size={14} color="#8b5cf6" style={{ marginLeft: '2px' }} />
                  )}
                </div>
                
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '11px', color: isDone ? '#059669' : '#7c3aed', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {isDone ? 'Vulnerabilidad Mitigada' : 'Ejecutar Remediación Autónoma'}
                  </strong>
                  <span style={{ fontSize: '12px', color: isDone ? t.textDim : t.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    {pred.recommended_action}
                  </span>
                </div>
              </button>
            </article>
          );
        })}
      </section>

      {/* ESTILOS INYECTADOS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }

        .btn-predict { width: 100%; }

        @media (min-width: 768px) {
          .predictive-container { padding: 32px 16px !important; }
          .predictive-header { flex-direction: row; align-items: flex-end; }
          .btn-predict { width: auto !important; }
        }
      `}} />
    </div>
  );
};

export default PredictiveScreen;