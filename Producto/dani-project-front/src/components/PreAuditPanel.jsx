import { useState, useEffect } from 'react';
import { API_URL } from '../services/api';

const SEVERITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#004ac6' };
const SEVERITY_LABEL = { high: 'Alto', medium: 'Medio', low: 'Bajo' };

export default function PreAuditPanel({ onNavigate, darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/compliance/pre-audit`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (!d.detail) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const t = {
    card: darkMode ? '#1a1d28' : '#ffffff',
    border: darkMode ? '#2a2e3d' : '#e2e5eb',
    text: darkMode ? '#e4e7ee' : '#1a1d26',
    textDim: darkMode ? '#9aa3b4' : '#5f6b7a',
    bg: darkMode ? '#111318' : '#f7f8fa',
    rowHover: darkMode ? '#1e2130' : '#fafbfc',
  };

  if (loading) return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px', marginBottom: '24px', color: t.textDim, fontSize: '13px' }}>
      Calculando readiness para auditoría...
    </div>
  );
  if (!data) return null;

  const readiness = data.readiness ?? 0;
  const target = data.target ?? 85;
  const gap = target - readiness;
  const readinessColor = readiness >= 80 ? '#004ac6' : readiness >= 60 ? '#f59e0b' : '#ef4444';
  const readinessLabel = readiness >= 85 ? 'Listo para auditoría' : readiness >= 70 ? 'Casi listo' : readiness >= 50 ? 'En progreso' : 'Requiere trabajo';

  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', marginBottom: '24px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏛</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: t.text }}>Pre-Audit Self-Assessment</div>
            <div style={{ fontSize: '11px', color: t.textDim }}>Predicción de hallazgos basada en datos actuales del SGSI</div>
          </div>
        </div>
        <button
          onClick={() => onNavigate?.('audit-room')}
          style={{ fontSize: '12px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
        >
          Sala de Auditoría →
        </button>
      </div>

      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Score circular */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 12px' }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="14" />
              <circle cx="70" cy="70" r="60" fill="none" stroke={readinessColor} strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${readiness * 3.77} 377`}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
              {/* Target marker at 85% */}
              <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3"
                strokeDasharray={`2 375`}
                strokeDashoffset={`-${target * 3.77 - 2}`}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '30px', fontWeight: 700, color: readinessColor, lineHeight: 1 }}>{readiness}%</div>
              <div style={{ fontSize: '10px', color: t.textDim, marginTop: '2px' }}>de {target}% meta</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: readinessColor, marginBottom: '4px' }}>{readinessLabel}</div>
          <div style={{ fontSize: '11px', color: t.textDim }}>
            {gap > 0 ? `Faltan ${gap}pp para certificación` : '✓ Por encima del umbral'}
          </div>

          {/* Mini stats */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Implementación', val: data.impl_pct, color: '#3b82f6' },
              { label: 'Evidencia', val: data.evidence_pct, color: '#004ac6' },
              { label: 'Documentación', val: data.doc_pct, color: '#a855f7' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: t.textDim, marginBottom: '2px' }}>
                  <span>{label}</span><span style={{ fontWeight: 600, color }}>{val ?? 0}%</span>
                </div>
                <div style={{ height: '3px', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${val ?? 0}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
            {data.overdue_capas > 0 && (
              <div style={{ marginTop: '6px', padding: '6px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', fontSize: '10px', color: '#ef4444', fontWeight: 500 }}>
                ⚠ {data.overdue_capas} CAPA{data.overdue_capas > 1 ? 's' : ''} vencida{data.overdue_capas > 1 ? 's' : ''} (-penalización)
              </div>
            )}
          </div>
        </div>

        {/* Hallazgos predichos */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Hallazgos probables en auditoría
          </div>
          {(data.findings ?? []).length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#004ac6', fontSize: '13px' }}>
              ✓ No se detectan hallazgos de riesgo alto. ¡Buen trabajo!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(data.findings ?? []).map((f, i) => (
                <div
                  key={i}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{
                    border: `1px solid ${expanded === i ? SEVERITY_COLOR[f.severity] : t.border}`,
                    borderLeft: `3px solid ${SEVERITY_COLOR[f.severity]}`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    background: expanded === i ? (darkMode ? 'rgba(255,255,255,0.03)' : '#fafbfc') : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: SEVERITY_COLOR[f.severity], flexShrink: 0 }} />
                    <span style={{ fontSize: '12.5px', fontWeight: 500, color: t.text, flex: 1 }}>{f.title}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                      background: SEVERITY_COLOR[f.severity] + '20', color: SEVERITY_COLOR[f.severity]
                    }}>
                      {SEVERITY_LABEL[f.severity]}
                    </span>
                    <span style={{ color: t.textDim, fontSize: '12px', transition: 'transform 0.2s', transform: expanded === i ? 'rotate(180deg)' : 'none' }}>▾</span>
                  </div>

                  {expanded === i && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${t.border}` }}>
                      <p style={{ fontSize: '12px', color: t.textDim, marginBottom: '8px', lineHeight: 1.5 }}>{f.detail}</p>
                      {(f.controls ?? []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                          {f.controls.map((c, j) => (
                            <span key={j} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: darkMode ? 'rgba(255,255,255,0.08)' : '#f0f1f3', color: t.textDim, fontWeight: 500 }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); onNavigate?.('gap-analysis'); }}
                          style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '6px', border: 'none', background: '#a855f7', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
                        >
                          Ver en Gap Analysis
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); onNavigate?.('evidence'); }}
                          style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '6px', border: `1px solid ${t.border}`, background: 'transparent', color: t.textDim, cursor: 'pointer' }}
                        >
                          Subir evidencia
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => onNavigate?.('gap-analysis')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#a855f7', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              Remediar hallazgos
            </button>
            <button
              onClick={() => onNavigate?.('evidence')}
              style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'transparent', color: t.textDim, fontSize: '13px', cursor: 'pointer' }}
            >
              Subir evidencias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
