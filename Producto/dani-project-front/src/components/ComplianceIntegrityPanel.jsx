/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../services/api';

const ComplianceIntegrityPanel = ({ onNavigate }) => {
  const { theme: t, darkMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAlert, setExpandedAlert] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/compliance/integrity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(json);
    } catch (_) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const scoreColor = !data ? '#9ca3af'
    : data.integrity_score >= 80 ? '#004ac6'
    : data.integrity_score >= 50 ? '#f59e0b'
    : '#ef4444';

  const cardBg = darkMode ? '#1a1d2e' : '#ffffff';
  const border = darkMode ? '#2a2d3e' : '#e5e7eb';
  const alertBg = darkMode ? '#1e2030' : '#fafafa';
  const redBg = darkMode ? 'rgba(239,68,68,0.12)' : '#fef2f2';
  const yellowBg = darkMode ? 'rgba(245,158,11,0.12)' : '#fffbeb';

  if (loading) return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '20px', marginBottom: '24px', color: t?.textDim || '#9ca3af', fontSize: '13px' }}>
      Analizando integridad de cumplimiento...
    </div>
  );

  if (!data || data.total_implemented === 0) return null;

  const alerts = data.alerts ?? [];

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderLeft: '3px solid #ef4444', borderRadius: '12px', marginBottom: '24px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: redBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={18} color="#ef4444" />
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#ef4444' }}>Compliance Integrity</span>
          {alerts.length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
              {alerts.length} alerta{alerts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: scoreColor }}>{data.integrity_score}%</div>
            <div style={{ fontSize: '10px', color: t?.textDim || '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score Integridad</div>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#004ac6' }}>{data.with_evidence}</div>
              <div style={{ color: t?.textDim || '#9ca3af' }}>Con evidencia</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#ef4444' }}>{data.without_evidence}</div>
              <div style={{ color: t?.textDim || '#9ca3af' }}>Sin evidencia</div>
            </div>
          </div>
          <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t?.textDim || '#9ca3af', padding: '4px' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Barra de integridad */}
      <div style={{ height: '4px', background: border }}>
        <div style={{ height: '100%', width: `${data.integrity_score}%`, background: scoreColor, transition: 'width 0.6s ease' }} />
      </div>

      {/* Alerts */}
      {alerts.length === 0 ? (
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#004ac6' }}>
          <ShieldCheck size={16} /> Todos los controles implementados tienen evidencia asociada.
        </div>
      ) : (
        <div style={{ padding: '12px 16px' }}>
          {alerts.map((alert) => {
            const isExpanded = expandedAlert === alert.id;
            const bg = alert.severity === 'high' ? redBg : yellowBg;
            const color = alert.severity === 'high' ? '#ef4444' : '#f59e0b';
            return (
              <div key={alert.id} style={{ background: alertBg, border: `1px solid ${border}`, borderRadius: '8px', marginBottom: '8px', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}>
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0, marginTop: '5px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: t?.text || '#1a1d26' }}>{alert.title}</div>
                    <div style={{ fontSize: '11px', color: t?.textDim || '#9ca3af', marginTop: '3px' }}>{alert.description}</div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} color={t?.textDim || '#9ca3af'} /> : <ChevronDown size={16} color={t?.textDim || '#9ca3af'} />}
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${border}` }}>
                    <div style={{ paddingTop: '12px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: t?.textDim || '#9ca3af', marginBottom: '8px' }}>
                        Controles afectados ({alert.controls.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {alert.controls.slice(0, 12).map(c => (
                          <span key={c.control_id} style={{ background: bg, color, fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px' }}>
                            {c.control_id}
                          </span>
                        ))}
                        {alert.controls.length > 12 && (
                          <span style={{ fontSize: '11px', color: t?.textDim || '#9ca3af', padding: '3px 0' }}>+{alert.controls.length - 12} más</span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: t?.textDim || '#9ca3af', fontStyle: 'italic', marginBottom: '12px' }}>
                      💡 {alert.recommendation}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); onNavigate?.('evidence'); }}
                        style={{ padding: '6px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        Subir Evidencias
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onNavigate?.('gap-analysis'); }}
                        style={{ padding: '6px 14px', background: 'none', color: t?.text || '#1a1d26', border: `1px solid ${border}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        Ver SOA
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComplianceIntegrityPanel;
