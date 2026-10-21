import React, { useState, useEffect, useContext } from 'react';
import { BrainCircuit, AlertTriangle, ShieldAlert, Zap, Loader2, Play, CheckCircle2 } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { riskAPI, capaAPI } from '../services/api';

const PredictiveScreen = () => {
  const { theme: t } = useContext(ThemeContext);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados independientes para la remediación de cada tarjeta
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
      // AHORA MOSTRARÁ EL ERROR REAL DEL SERVIDOR O DE RED
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
      
      alert(result.message); // Muestra confirmación nativa o podrías usar un Toast
      
      // Marcar esta tarjeta como remediada
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
    <div style={{ padding: '32px', color: t.text, minHeight: '100%' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BrainCircuit size={32} color="#8b5cf6" />
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: t.text }}>Análisis Predictivo IA</h1>
          </div>
          <p style={{ color: t.textMuted, marginTop: '8px', fontSize: '14px', maxWidth: '700px' }}>
            Nuestro motor de IA analiza el historial de brechas, tratamientos de datos y riesgos actuales de la organización para predecir vulnerabilidades futuras antes de que ocurran incidentes críticos.
          </p>
        </div>
        <button 
          onClick={fetchPredictions} 
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: '#fff', border: 'none',
            fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
          {loading ? 'Analizando Patrones...' : 'Ejecutar Predicción'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {/* DASHBOARD GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {!loading && predictions.length === 0 && !error && (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: t.textDim, background: t.cardBg, border: `1px dashed ${t.border}`, borderRadius: '16px' }}>
            <ShieldAlert size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3>No hay predicciones activas</h3>
            <p>Ejecuta el motor predictivo para escanear la organización.</p>
          </div>
        )}

        {!loading && predictions.map((pred, index) => {
          const isRemediating = remediatingIndex === index;
          const isDone = remediated[index];
          
          return (
          <div key={index} style={{
            background: isDone ? 'rgba(16, 185, 129, 0.05)' : t.cardBg, 
            borderRadius: '16px', 
            border: `1px solid ${isDone ? '#10b981' : t.border}`, 
            padding: '24px',
            position: 'relative', overflow: 'hidden', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            opacity: isDone ? 0.7 : 1
          }}>
            {/* Barra de impacto superior */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isDone ? '#10b981' : getImpactColor(pred.impact) }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, paddingRight: '12px' }}>
                {pred.title}
              </h3>
              <span style={{
                padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
                color: isDone ? '#10b981' : getImpactColor(pred.impact), 
                background: isDone ? 'rgba(16, 185, 129, 0.15)' : `${getImpactColor(pred.impact)}15`
              }}>
                {isDone ? 'Corregido' : pred.impact}
              </span>
            </div>

            <p style={{ color: t.textDim, fontSize: '14px', lineHeight: 1.5, marginBottom: '24px', minHeight: '60px' }}>
              {pred.description}
            </p>

            {/* Barra de Probabilidad (Oculta si ya se solucionó) */}
            {!isDone && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: t.textMuted }}>
                  <span>Probabilidad de Ocurrencia</span>
                  <span style={{ color: pred.probability > 70 ? '#ef4444' : t.text }}>{pred.probability}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: t.inputBg, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pred.probability}%`, height: '100%', borderRadius: '4px',
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
                background: isDone ? 'transparent' : (isRemediating ? t.hoverBg : 'rgba(139, 92, 246, 0.1)'), 
                padding: '16px', 
                borderRadius: '12px', 
                border: `1px solid ${isDone ? '#10b981' : (isRemediating ? t.border : 'rgba(139, 92, 246, 0.3)')}`, 
                display: 'flex', 
                gap: '12px', 
                alignItems: 'center',
                cursor: (isRemediating || isDone) ? 'default' : 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              {isDone ? (
                <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0 }} />
              ) : isRemediating ? (
                <Loader2 size={24} color="#8b5cf6" className="animate-spin" style={{ flexShrink: 0 }} />
              ) : (
                <Play size={24} color="#8b5cf6" style={{ flexShrink: 0 }} />
              )}
              
              <div>
                <strong style={{ display: 'block', fontSize: '12px', color: isDone ? '#10b981' : '#8b5cf6', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {isDone ? 'Vulnerabilidad Mitigada' : 'Ejecutar Remediación Autónoma'}
                </strong>
                <span style={{ fontSize: '13px', color: isDone ? t.textDim : t.text }}>{pred.recommended_action}</span>
              </div>
            </button>
          </div>
        )})}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}} />
    </div>
  );
};

export default PredictiveScreen;