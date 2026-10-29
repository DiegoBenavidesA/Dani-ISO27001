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
      return { text: 'Resuelta', color: '#004ac6', icon: CheckCircle };
    }
    const dias = diasRestantes(req.fecha_limite);
    if (dias < 0) return { text: `Vencida hace ${Math.abs(dias)} d`, color: '#ef4444', icon: AlertTriangle };
    if (dias <= 5) return { text: `${dias} d restantes`, color: '#f59e0b', icon: Clock };
    return { text: `${dias} d restantes`, color: '#004ac6', icon: Clock };
  };

  const tipoLabel = (v) => (TIPOS.find(x => x.value === v) || {}).label || v;
  const estadoLabel = (v) => (ESTADOS.find(x => x.value === v) || {}).label || v;

  const total = requests.length;
  const vencidas = requests.filter(r => r.estado !== 'resuelta' && diasRestantes(r.fecha_limite) < 0).length;
  const porVencer = requests.filter(r => r.estado !== 'resuelta' && diasRestantes(r.fecha_limite) >= 0 && diasRestantes(r.fecha_limite) <= 5).length;
  const resueltas = requests.filter(r => r.estado === 'resuelta').length;

  const cardStyle = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: '12px',
    padding: '16px',
  };

  return (
    <div className="requests-container" style={{ padding: '24px', color: t.text, minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* ENCABEZADO */}
      <div className="header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Inbox size={24} color="#004ac6" /> Solicitudes de Titulares (ARCO+P)
          </h1>
          <p style={{ color: t.textMuted, marginTop: '6px', fontSize: '13px', maxWidth: '640px' }}>
            Obligación O3 · Ley 21.719: toda solicitud debe responderse en <strong>30 días hábiles</strong>.
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-action" onClick={fetchRequests} style={secondaryBtn(t)}>
            <RefreshCw size={16} /> Actualizar
          </button>
          <button className="btn-action primary-btn-action" onClick={() => setShowAddModal(true)} style={primaryBtn()}>
            <Plus size={16} /> Nueva solicitud
          </button>
        </div>
      </div>

      {error && (
        <div style={{ ...cardStyle, borderColor: '#f59e0b', color: '#f59e0b', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* TARJETAS DE RESUMEN */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <SummaryCard t={t} label="Total" value={total} color={t.text} />
        <SummaryCard t={t} label="Vencidas" value={vencidas} color="#ef4444" />
        <SummaryCard t={t} label="Por vencer (≤5 d)" value={porVencer} color="#f59e0b" />
        <SummaryCard t={t} label="Resueltas" value={resueltas} color="#004ac6" />
      </div>

      {/* TABLA / BANDEJA */}
      <div className="table-container" style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted }}>Cargando solicitudes…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted }}>No hay solicitudes registradas.</div>
        ) : (
          <>
            {/* VISTA ESCRITORIO */}
            <div className="desktop-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: t.hoverBg, textAlign: 'left' }}>
                    <th style={thStyle(t)}>Titular</th>
                    <th style={thStyle(t)}>Tipo</th>
                    <th style={thStyle(t)}>Descripción</th>
                    <th style={thStyle(t)}>Plazo (30 días háb.)</th>
                    <th style={thStyle(t)}>Estado</th>
                    <th style={thStyle(t)}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const badge = plazoBadge(req);
                    const Icon = badge.icon;
                    return (
                      <tr key={req.id} style={{ borderTop: `1px solid ${t.border}` }}>
                        <td style={tdStyle(t)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <User size={14} color={t.textMuted} /> {req.titular}
                          </div>
                        </td>
                        <td style={tdStyle(t)}>{tipoLabel(req.tipo)}</td>
                        <td style={{ ...tdStyle(t), maxWidth: '260px' }}>{req.descripcion}</td>
                        <td style={tdStyle(t)}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: badge.color, fontWeight: 600 }}>
                            <Icon size={14} /> {badge.text}
                          </span>
                          <div style={{ color: t.textDim, fontSize: '11px', marginTop: '4px' }}>
                            Límite: {parseServerDate(req.fecha_limite).toLocaleDateString('es-CL')}
                          </div>
                        </td>
                        <td style={tdStyle(t)}>
                          <span style={estadoPill(req.estado)}>{estadoLabel(req.estado)}</span>
                        </td>
                        <td style={tdStyle(t)}>
                          <select
                            value={req.estado}
                            onChange={(e) => handleChangeEstado(req, e.target.value)}
                            style={selectStyle(t)}
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
            <div className="mobile-cards-view">
              {requests.map((req) => {
                const badge = plazoBadge(req);
                const Icon = badge.icon;
                return (
                  <div key={req.id} style={{ padding: '16px', borderBottom: `1px solid ${t.border}` }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '15px' }}>
                        <User size={16} color={t.textMuted} /> {req.titular}
                      </div>
                      <span style={estadoPill(req.estado)}>{estadoLabel(req.estado)}</span>
                    </div>

                    <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: t.textDim }}>Tipo: </span>
                      {tipoLabel(req.tipo)}
                    </div>
                    
                    <div style={{ fontSize: '13px', color: t.text, marginBottom: '12px', background: t.hoverBg, padding: '8px', borderRadius: '8px' }}>
                      {req.descripcion}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${t.border}`, paddingTop: '12px' }}>
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: badge.color, fontWeight: 600, fontSize: '13px' }}>
                          <Icon size={14} /> {badge.text}
                        </span>
                        <div style={{ color: t.textDim, fontSize: '11px', marginTop: '2px' }}>
                          Límite: {parseServerDate(req.fecha_limite).toLocaleDateString('es-CL')}
                        </div>
                      </div>
                      
                      <select
                        value={req.estado}
                        onChange={(e) => handleChangeEstado(req, e.target.value)}
                        style={{ ...selectStyle(t), width: '110px' }}
                      >
                        {ESTADOS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                      </select>
                    </div>

                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MODAL DE CREACIÓN */}
      {showAddModal && (
        <div style={modalOverlay}>
          <div className="modal-content" style={modalBox(t)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px' }}>Nueva solicitud ARCO+P</h3>
              <button onClick={() => setShowAddModal(false)} style={iconBtn(t)}><X size={18} /></button>
            </div>

            <label style={labelStyle(t)}>Titular (nombre o identificación)</label>
            <input
              value={newRequest.titular}
              onChange={(e) => setNewRequest({ ...newRequest, titular: e.target.value })}
              style={inputStyle(t)}
              placeholder="Ej: Juan Pérez / RUT 12.345.678-9"
            />

            <label style={labelStyle(t)}>Tipo de solicitud</label>
            <select
              value={newRequest.tipo}
              onChange={(e) => setNewRequest({ ...newRequest, tipo: e.target.value })}
              style={inputStyle(t)}
            >
              {TIPOS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
            </select>

            <label style={labelStyle(t)}>Descripción</label>
            <textarea
              value={newRequest.descripcion}
              onChange={(e) => setNewRequest({ ...newRequest, descripcion: e.target.value })}
              style={{ ...inputStyle(t), minHeight: '80px', resize: 'vertical' }}
              placeholder="Detalle de lo que solicita el titular…"
            />

            <p style={{ color: t.textDim, fontSize: '11px', marginTop: '8px' }}>
              El plazo límite (30 días hábiles) se calcula automáticamente al guardar.
            </p>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setShowAddModal(false)} style={secondaryBtn(t)}>Cancelar</button>
              <button className="primary-btn-action" onClick={handleCreate} disabled={isSubmitting} style={primaryBtn()}>
                <Save size={16} /> {isSubmitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTILOS INYECTADOS PARA RESPONSIVE */}
      <style dangerouslySetInnerHTML={{__html: `
        .mobile-cards-view { display: none; }
        
        @media (max-width: 768px) {
          .requests-container { padding: 16px !important; }
          .header-wrapper { flex-direction: column; align-items: stretch !important; gap: 16px !important; }
          .header-actions { flex-direction: row; width: 100%; justify-content: space-between; gap: 8px; }
          .btn-action { flex: 1; justify-content: center; }
          
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          
          .desktop-table { display: none; }
          .mobile-cards-view { display: block; }
          
          .modal-content { padding: 16px !important; width: 100% !important; margin: 12px; }
          .form-actions { flex-direction: column-reverse; }
          .form-actions button { width: 100% !important; justify-content: center; }
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

// ==========================================
// Subcomponentes y estilos
// ==========================================
const SummaryCard = ({ t, label, value, color }) => (
  <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '14px' }}>
    <div style={{ fontSize: '12px', color: t.textMuted }}>{label}</div>
    <div style={{ fontSize: '26px', fontWeight: 700, color }}>{value}</div>
  </div>
);

const thStyle = (t) => ({ padding: '10px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: t.textMuted, fontWeight: 600 });
const tdStyle = (t) => ({ padding: '12px 14px', color: t.text, verticalAlign: 'top' });
const labelStyle = (t) => ({ display: 'block', fontSize: '12px', color: t.textMuted, margin: '10px 0 4px', fontWeight: 600 });
const inputStyle = (t) => ({ width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '13px', outline: 'none' });
const selectStyle = (t) => ({ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '12px', outline: 'none' });

const primaryBtn = () => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', border: 'none', background: '#004ac6', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' });
const secondaryBtn = (t) => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontSize: '13px', cursor: 'pointer' });
const iconBtn = (t) => ({ background: 'transparent', border: 'none', color: t.textMuted, cursor: 'pointer' });

const estadoPill = (estado) => {
  const map = { pendiente: '#f59e0b', en_proceso: '#6366f1', resuelta: '#004ac6' };
  const c = map[estado] || '#64748b';
  return { padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, color: c, background: `${c}22`, whiteSpace: 'nowrap' };
};

const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' };
const modalBox = (t) => ({ background: t.cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${t.border}`, borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '460px', color: t.text, boxSizing: 'border-box' });

export default DataRequestsScreen;