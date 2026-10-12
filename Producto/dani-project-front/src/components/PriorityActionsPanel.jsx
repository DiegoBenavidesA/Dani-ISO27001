import { useState, useEffect } from 'react';
import { API_URL } from '../services/api';

const PRIORITY = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Alta' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Media' },
  low:    { color: '#004ac6', bg: 'rgba(0, 74, 198,0.12)',  label: 'Baja' },
};

const DECISION = {
  human:  { label: '👤 Humano',   bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  review: { label: '👁 Revisar',  bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
  auto:   { label: '🤖 Auto',     bg: 'rgba(0, 74, 198,0.1)',  color: '#004ac6' },
};

export default function PriorityActionsPanel({ onNavigate, darkMode }) {
  const [actions, setActions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/compliance/priority-actions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.actions) { setActions(d.actions); setTotal(d.total); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const t = {
    card:    darkMode ? '#1a1d28' : '#ffffff',
    border:  darkMode ? '#2a2e3d' : '#e2e5eb',
    text:    darkMode ? '#e4e7ee' : '#1a1d26',
    textDim: darkMode ? '#9aa3b4' : '#5f6b7a',
    rowBg:   darkMode ? 'rgba(255,255,255,0.02)' : '#fafbfc',
  };

  if (loading) return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px', marginBottom: '24px', color: t.textDim, fontSize: '13px' }}>
      Cargando acciones prioritarias...
    </div>
  );

  if (!actions.length) return null;

  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', marginBottom: '24px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📌</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: t.text }}>Acciones Prioritarias</div>
            <div style={{ fontSize: '11px', color: t.textDim }}>{total} acción{total !== 1 ? 'es' : ''} detectada{total !== 1 ? 's' : ''} en tu SGSI</div>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: t.textDim, display: 'flex', gap: '12px' }}>
          {Object.entries(DECISION).map(([k, v]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: v.bg, color: v.color, fontWeight: 600 }}>{v.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Lista de acciones */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {actions.map((action, i) => {
          const p = PRIORITY[action.priority] || PRIORITY.medium;
          const d = DECISION[action.decision_level] || DECISION.human;
          return (
            <div
              key={action.id || i}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '10px',
                background: t.rowBg, border: `1px solid ${t.border}`,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
            >
              {/* Barra de prioridad */}
              <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: p.color, flexShrink: 0 }} />

              {/* Texto */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: t.text, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {action.title}
                </div>
                <div style={{ fontSize: '11.5px', color: t.textDim, lineHeight: 1.4 }}>
                  {action.detail}
                </div>
              </div>

              {/* Decision level badge */}
              <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '5px', background: d.bg, color: d.color, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {d.label}
              </span>

              {/* Botón acción */}
              <button
                onClick={() => onNavigate?.(action.navigate)}
                style={{
                  fontSize: '11px', padding: '6px 12px', borderRadius: '7px',
                  border: `1px solid ${p.color}`, background: 'transparent',
                  color: p.color, cursor: 'pointer', fontWeight: 500,
                  whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = p.color; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = p.color; }}
              >
                {action.action_label} →
              </button>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div style={{ padding: '10px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: '20px', alignItems: 'center', fontSize: '11px', color: t.textDim }}>
        <span style={{ fontWeight: 600, color: t.text, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prioridad:</span>
        {Object.entries(PRIORITY).map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: v.color, display: 'inline-block' }} />
            {v.label}
          </span>
        ))}
      </div>
    </div>
  );
}
