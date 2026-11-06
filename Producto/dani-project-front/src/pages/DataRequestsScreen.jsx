/* eslint-disable */
import React, { useState, useEffect, useContext } from 'react';
import {
  Inbox, Plus, Clock, AlertTriangle, CheckCircle, User, X, Save, RefreshCw
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { dataRequestsAPI } from '../services/api';

const TIPOS = [
  { value: 'acceso', label: 'Acceso' },
  { value: 'rectificacion', label: 'Rectificación' },
  { value: 'cancelacion', label: 'Cancelación' },
  { value: 'oposicion', label: 'Oposición' },
  { value: 'portabilidad', label: 'Portabilidad' },
];

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelta', label: 'Resuelta' },
];

const DataRequestsScreen = () => {
  const { theme: t } = useContext(ThemeContext);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRequest, setNewRequest] = useState({ titular: '', tipo: 'acceso', descripcion: '' });

  const demoRequests = [
    { id: 'demo-1', titular: 'Juan Pérez', tipo: 'acceso', descripcion: 'Solicita copia de todos sus datos personales.', fecha_solicitud: new Date().toISOString(), fecha_limite: addBusinessDays(new Date(), 28).toISOString(), estado: 'pendiente', responsable: null, respuesta: null },
    { id: 'demo-2', titular: 'María González', tipo: 'cancelacion', descripcion: 'Pide eliminar su cuenta y sus datos asociados.', fecha_solicitud: new Date().toISOString(), fecha_limite: addBusinessDays(new Date(), 2).toISOString(), estado: 'en_proceso', responsable: 'dpo@empresa.cl', respuesta: null },
    { id: 'demo-3', titular: 'Pedro Soto', tipo: 'rectificacion', descripcion: 'Corregir dirección registrada.', fecha_solicitud: new Date().toISOString(), fecha_limite: addBusinessDays(new Date(), -1).toISOString(), estado: 'pendiente', responsable: null, respuesta: null },
  ];

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataRequestsAPI.getAll();
      setRequests(Array.isArray(data) && data.length > 0 ? data : demoRequests);
    } catch (err) {
      console.error('Error al cargar solicitudes ARCO+P. Usando datos demo.', err);
      setError('No se pudo conectar con el servidor. Mostrando datos de ejemplo.');
      setRequests(demoRequests);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newRequest.titular.trim() || !newRequest.descripcion.trim()) return;
    setIsSubmitting(true);
    try {
      await dataRequestsAPI.create(newRequest);
      setShowAddModal(false);
      setNewRequest({ titular: '', tipo: 'acceso', descripcion: '' });
      await fetchRequests();
    } catch (err) {
      console.error('Error al crear la solicitud.', err);
      alert('No se pudo crear la solicitud. Revisa la conexión con el backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeEstado = async (req, estado) => {
    try {
      await dataRequestsAPI.update(req.id, { estado });
      await fetchRequests();
    } catch (err) {
      console.error('Error al actualizar el estado.', err);
      alert('No se pudo actualizar el estado.');
    }
  };

  const diasRestantes = (fechaLimite) => {
    const ahora = new Date();
    const limite = parseServerDate(fechaLimite);
    return Math.ceil((limite - ahora) / (1000 * 60 * 60 * 24));
  };

  const plazoBadge = (req) => {
    if (req.estado === 'resuelta') {
      return { text: 'Resuelta', color: '#2563eb', icon: CheckCircle };
    }
    const dias = diasRestantes(req.fecha_limite);
    if (dias < 0) return { text: `Vencida hace ${Math.abs(dias)} d`, color: '#e11d48', icon: AlertTriangle };
    if (dias <= 5) return { text: `${dias} d restantes`, color: '#d97706', icon: Clock };
    return { text: `${dias} d restantes`, color: '#2563eb', icon: Clock };
  };

  const tipoLabel = (v) => (TIPOS.find(x => x.value === v) || {}).label || v;

  const total = requests.length;
  const vencidas = requests.filter(r => r.estado !== 'resuelta' && diasRestantes(r.fecha_limite) < 0).length;
  const porVencer = requests.filter(r => r.estado !== 'resuelta' && diasRestantes(r.fecha_limite) >= 0 && diasRestantes(r.fecha_limite) <= 5).length;
  const resueltas = requests.filter(r => r.estado === 'resuelta').length;

  return (
    <div className="requests-container" style={{ padding: '0 8px', color: t.text, minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* ENCABEZADO ADAPTADO */}
      <section className="req-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ padding: '6px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', borderRadius: '8px' }}>
              <Inbox size={20} />
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: t.text }}>Solicitudes de Titulares (ARCO+P)</h1>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: t.textDim, paddingLeft: '4px' }}>
            <span style={{ fontWeight: 600, color: t.text }}>Obligación O3 · Ley 21.719:</span> toda solicitud debe responderse en <span style={{ fontWeight: 700, color: t.text }}>30 días hábiles</span>.
          </p>
        </div>

        <div className="req-actions" style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button className="btn-refresh" onClick={fetchRequests} style={{ padding: '10px 12px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', flex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <RefreshCw size={14} color={t.textDim} /> Actualizar
          </button>
          <button className="btn-new" onClick={() => setShowAddModal(true)} style={{ padding: '10px 12px', background: '#2563eb', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', flex: 2, boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)' }}>
            <Plus size={16} strokeWidth={2.5} /> Nueva solicitud
          </button>
        </div>
      </section>

      {error && (
        <div style={{ padding: '12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', color: '#b45309', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* MÉTRICAS */}
      <section className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim, lineHeight: 1.1 }}>Total</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: t.text, marginTop: '4px' }}>{total}</span>
        </div>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim, lineHeight: 1.1 }}>Vencidas</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#e11d48', marginTop: '4px' }}>{vencidas}</span>
        </div>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim, lineHeight: 1.1 }}>Por vencer (≤5 d)</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>{porVencer}</span>
        </div>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim, lineHeight: 1.1 }}>Resueltas</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>{resueltas}</span>
        </div>
      </section>

      {/* REGISTROS */}
      <section aria-label="Lista de solicitudes">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registros</span>
          <span style={{ fontSize: '11px', color: t.textDim, fontWeight: 500 }}>{requests.length} solicitudes</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>Cargando solicitudes…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>No hay solicitudes registradas.</div>
        ) : (
          <>
            {/* VISTA ESCRITORIO */}
            <div className="desktop-table-wrapper" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: t.inputBg, borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Titular</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Tipo</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Descripción</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Plazo (30 d hábiles)</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const badge = plazoBadge(req);
                    const Icon = badge.icon;
                    return (
                      <tr key={req.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}>
                              <User size={16} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: t.text }}>{req.titular}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', fontWeight: 500, color: t.textDim }}>{tipoLabel(req.tipo)}</td>
                        <td style={{ padding: '16px', fontSize: '12px', color: t.text, maxWidth: '280px', lineHeight: 1.5 }}>{req.descripcion}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: badge.color, fontWeight: 700, fontSize: '12px' }}>
                            <Icon size={14} /> {badge.text}
                          </div>
                          <div style={{ color: t.textDim, fontSize: '11px', marginTop: '4px' }}>
                            Límite: {parseServerDate(req.fecha_limite).toLocaleDateString('es-CL')}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <select
                            value={req.estado}
                            onChange={(e) => handleChangeEstado(req, e.target.value)}
                            style={{ padding: '6px 10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                          >
                            {ESTADOS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL (TARJETAS) */}
            <div className="mobile-cards-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.map((req) => {
                const badge = plazoBadge(req);
                const Icon = badge.icon;
                
                // Determinar el estilo de la tarjeta según el estado
                let cardBorder = t.border;
                let bgGradient = t.cardBg;
                if (req.estado !== 'resuelta' && diasRestantes(req.fecha_limite) < 0) {
                  cardBorder = '#fda4af';
                  bgGradient = 'linear-gradient(180deg, #ffffff 0%, rgba(225, 29, 72, 0.05) 100%)';
                }

                return (
                  <article key={req.id} style={{ background: bgGradient, border: `1px solid ${cardBorder}`, borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    
                    {/* Top Row: Titular & Type */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, flexShrink: 0 }}>
                        <User size={16} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: t.text, margin: 0, lineHeight: 1.2 }}>{req.titular}</h3>
                        <p style={{ fontSize: '11px', color: t.textDim, margin: '2px 0 0' }}>Tipo: <strong style={{ color: t.text }}>{tipoLabel(req.tipo)}</strong></p>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ background: t.inputBg, borderRadius: '12px', padding: '10px', border: `1px solid ${t.border}`, fontSize: '12px', color: t.text, lineHeight: 1.5, marginBottom: '12px' }}>
                      {req.descripcion}
                    </div>

                    {/* Footer: SLA & Action */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${t.inputBg}`, paddingTop: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: badge.color }}>
                          <Icon size={14} /> <span>{badge.text}</span>
                        </div>
                        <p style={{ fontSize: '10px', color: t.textDim, margin: '2px 0 0' }}>Límite: {parseServerDate(req.fecha_limite).toLocaleDateString('es-CL')}</p>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <select
                          value={req.estado}
                          onChange={(e) => handleChangeEstado(req, e.target.value)}
                          style={{ appearance: 'none', padding: '6px 28px 6px 10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                        >
                          {ESTADOS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                        </select>
                        <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: t.textDim }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </div>
                    </div>

                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* FORMULARIO MODAL (ADAPTADO MÓVIL) */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999 }}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '460px', maxHeight: '95vh', overflowY: 'auto', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: t.text }}>Nueva solicitud ARCO+P</h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ border: 'none', background: t.inputBg, borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Titular (nombre o identificación)</label>
                <input
                  value={newRequest.titular}
                  onChange={(e) => setNewRequest({ ...newRequest, titular: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }}
                  placeholder="Ej: Juan Pérez / RUT 12.345.678-9"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Tipo de solicitud</label>
                <select
                  value={newRequest.tipo}
                  onChange={(e) => setNewRequest({ ...newRequest, tipo: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }}
                >
                  {TIPOS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Descripción</label>
                <textarea
                  value={newRequest.descripcion}
                  onChange={(e) => setNewRequest({ ...newRequest, descripcion: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Detalle de lo que solicita el titular…"
                />
              </div>

              <p style={{ color: t.textDim, fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
                El plazo límite (<strong style={{ color: t.text }}>30 días hábiles</strong>) se calcula automáticamente al guardar según la Ley 21.719.
              </p>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button className="btn-cancel" onClick={() => setShowAddModal(false)} style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancelar</button>
                <button className="btn-save" onClick={handleCreate} disabled={isSubmitting} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, fontSize: '13px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} /> {isSubmitting ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ESTILOS INYECTADOS PARA RESPONSIVE GLOBAL */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Por defecto (Móvil) */
        .desktop-table-wrapper { display: none; }
        .mobile-cards-wrapper { display: flex; }
        
        .req-actions { flex-direction: row; }
        .btn-refresh, .btn-new { width: 100%; justify-content: center; }
        
        .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
        
        .form-actions { flex-direction: column-reverse; }
        .btn-cancel, .btn-save { width: 100%; justify-content: center; }

        /* Escritorio (> 768px) */
        @media (min-width: 768px) {
          .requests-container { padding: 32px 16px !important; }
          .req-header { display: flex; justify-content: space-between; align-items: flex-end; }
          .req-actions { width: auto !important; }
          
          .metrics-grid { grid-template-columns: repeat(4, 1fr) !important; }

          .desktop-table-wrapper { display: block; }
          .mobile-cards-wrapper { display: none; }

          .modal-content { padding: 32px !important; }
          .form-actions { flex-direction: row; }
          .btn-cancel, .btn-save { width: auto !important; }
        }
      `}} />
    </div>
  );
};

// ==========================================
// Helpers
// ==========================================
function parseServerDate(s) {
  if (!s) return new Date(NaN);
  const tieneZona = /[zZ]$|[+-]\d\d:?\d\d$/.test(s);
  return new Date(tieneZona ? s : s + 'Z');
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  const step = days >= 0 ? 1 : -1;
  let remaining = Math.abs(days);
  while (remaining > 0) {
    result.setDate(result.getDate() + step);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) remaining--;
  }
  return result;
}

export default DataRequestsScreen;