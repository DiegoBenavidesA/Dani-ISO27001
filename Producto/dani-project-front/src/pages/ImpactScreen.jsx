import React, { useState, useContext } from 'react';
import { Target, Sparkles, Shield, AlertTriangle, Check } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';

export default function ImpactScreen({ navParams, onNavigate }) {
  const { theme: t, darkMode, highContrast } = useContext(ThemeContext);
  
  // Recibe los datos desde la pantalla de tratamientos (si se hizo clic en el botón)
  const treatment = navParams || null;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [controls, setControls] = useState([]);

  const getSimulationPanelStyle = () => {
    if (highContrast) return { background: '#000000', borderRadius: '16px', border: '2px solid #ffffff', padding: '24px' };
    if (!darkMode) return { background: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '24px', boxShadow: '0 2px 12px rgba(99, 102, 241, 0.08)' };
    return { background: '#1e1b4b', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '24px' };
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulando llamada a la IA de Groq
    setTimeout(() => {
      setControls([
        { id: 'c1', name: 'Aplicar cifrado robusto a datos biométricos', status: 'Sugerido por IA' },
        { id: 'c2', name: 'Realizar evaluación de interés legítimo (LIA)', status: 'Sugerido por IA' },
        { id: 'c3', name: 'Establecer política de retención de 30 días', status: 'Sugerido por IA' }
      ]);
      setIsAnalyzing(false);
    }, 1500);
  };

  if (!treatment) {
    return (
      <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '48px 24px', textAlign: 'center', color: t.textDim }}>
        <Target size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
        <p style={{ fontSize: '14px', marginBottom: '8px' }}>No hay tratamiento seleccionado</p>
        <button onClick={() => onNavigate('treatments')} style={{ padding: '8px 16px', background: t.inputBg, border: `1px solid ${t.border}`, color: t.text, borderRadius: '8px', cursor: 'pointer' }}>Volver al Registro</button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: treatment.risk === 'Alto' ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: t.text }}>Evaluación de Impacto (DPIA)</h1>
          <p style={{ color: t.textDim, fontSize: '14px' }}>Tratamiento: <strong>{treatment.name}</strong></p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Panel de Simulación / IA */}
        <div style={getSimulationPanelStyle()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color={darkMode ? '#8b5cf6' : '#4c1d95'} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#8b5cf6' : '#4c1d95', textTransform: 'uppercase' }}>Análisis de Riesgo Ley 21.719</span>
            </div>
            <button onClick={handleAnalyze} disabled={isAnalyzing} style={{ padding: '6px 12px', background: '#8b5cf6', border: 'none', borderRadius: '8px', color: 'white', fontSize: '11px', fontWeight: 700, cursor: isAnalyzing ? 'not-allowed' : 'pointer' }}>
              {isAnalyzing ? 'Evaluando...' : 'Evaluar con IA'}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
             <AlertTriangle size={24} color="#ef4444" />
             <div>
               <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '14px' }}>Nivel de Riesgo Inherente: {treatment.risk}</div>
               <div style={{ color: t.textDim, fontSize: '12px' }}>Requiere medidas de mitigación adicionales.</div>
             </div>
          </div>
        </div>

        {/* Panel de Resultados / Controles */}
        <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase', marginBottom: '16px' }}>Medidas Sugeridas (DPIA)</h3>
          {controls.length === 0 ? (
            <p style={{ fontSize: '13px', color: t.textDim, textAlign: 'center' }}>Ejecuta el análisis de IA para obtener recomendaciones.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {controls.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} color="white" /></div>
                  <span style={{ fontSize: '13px', color: t.text, fontWeight: 500 }}>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}