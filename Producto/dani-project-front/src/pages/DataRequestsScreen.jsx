/* eslint-disable */
import React, { useState, useEffect, useContext } from 'react';
import {
  Inbox, Plus, Clock, AlertTriangle, CheckCircle, User, X, Save, RefreshCw
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { dataRequestsAPI } from '../services/api';

// ==========================================
// Pantalla 3.3 — Solicitudes de Titulares (ARCO+P)
// Obligación O3 de la Ley 21.719: responder en 30 días hábiles.
// El backend (routes/data_requests.py) calcula la fecha límite; aquí
// la mostramos y alertamos según los días que falten.
// ==========================================

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
  const { theme: t, darkMode, highContrast } = useContext(ThemeContext);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRequest, setNewRequest] = useState({ titular: '', tipo: 'acceso', descripcion: '' });

  // Datos demo: se usan solo si el backend no responde, para no dejar la pantalla vacía.
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

  // ==========================================
  // Cálculo del plazo restante (días de calendario para el semáforo).
  // La fecha límite oficial (30 días hábiles) la calcula el backend.
  // ==========================================
  const diasRestantes = (fechaLimite) => {
    const ahora = new Date();
    const limite = parseServerDate(fechaLimite);
    return Math.ceil((limite - ahora) / (1000 * 60 * 60 * 24));
  };

  const plazoBadge = (req) => {
    if (req.estado === 'resuelta') {
      return { text: 'Resuelta', color: '#10b981', icon: CheckCircle };
    }
    const dias = diasRestantes(req.fecha_limite);
    if (dias < 0) return { text: `Vencida hace ${Math.abs(dias)} d`, color: '#ef4444', icon: AlertTriangle };
    if (dias <= 5) return { text: `${dias} d restantes`, color: '#f59e0b', icon: Clock };
    return { text: `${dias} d restantes`, color: '#10b981', icon: Clock };
  };

  const tipoLabel = (v) => (TIPOS.find(x => x.value === v) || {}).label || v;
  const estadoLabel = (v) => (ESTADOS.find(x => x.value === v) || {}).label || v;

  // Resumen para las tarjetas superiores
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
    <div style={{ padding: '24px', color: t.text, minHeight: '100%' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Inbox size={24} /> Solicitudes de Titulares (ARCO+P)
          </h1>
          <p style={{ color: t.textMuted, marginTop: '6px', fontSize: '13px', maxWidth: '640px' }}>
            Obligación O3 · Ley 21.719: toda solicitud de Acceso, Rectificación, Cancelación,
            Oposición o Portabilidad debe responderse en <strong>30 días hábiles</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchRequests} style={secondaryBtn(t)}>
            <RefreshCw size={16} /> Actualizar
          </button>
          <button onClick={() => setShowAddModal(true)} style={primaryBtn()}>
            <Plus size={16} /> Nueva solicitud
          </button>
        </div>
      </div>

      {error && (
        <div style={{ ...cardStyle, borderColor: '#f59e0b', color: '#f59e0b', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <SummaryCard t={t} label="Total" value={total} color={t.text} />
        <SummaryCard t={t} label="Vencidas" value={vencidas} color="#ef4444" />
        <SummaryCard t={t} label="Por vencer (≤5 d)" value={porVencer} color="#f59e0b" />
        <SummaryCard t={t} label="Resueltas" value={resueltas} color="#10b981" />
      </div>

      {/* Tabla / bandeja */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted }}>Cargando solicitudes…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted }}>No hay solicitudes registradas.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} /> {req.titular}
                        </div>
                      </td>
                      <td style={tdStyle(t)}>{tipoLabel(req.tipo)}</td>
                      <td style={{ ...tdStyle(t), maxWidth: '260px' }}>{req.descripcion}</td>
                      <td style={tdStyle(t)}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: badge.color, fontWeight: 600 }}>
                          <Icon size={14} /> {badge.text}
                        </span>
                        <div style={{ color: t.textDim, fontSize: '11px', marginTop: '2px' }}>
                          Límite: {parseServerDate(req.fecha_limite).toLocaleDateString()}
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
        )}
      </div>

      {/* Modal de creación */}
      {showAddModal && (
        <div style={modalOverlay}>
          <div style={modalBox(t)}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setShowAddModal(false)} style={secondaryBtn(t)}>Cancelar</button>
              <button onClick={handleCreate} disabled={isSubmitting} style={primaryBtn()}>
                <Save size={16} /> {isSubmitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// Helper: el backend devuelve fechas en UTC SIN zona horaria; hay que
// interpretarlas como UTC (si no, JS las toma como local y el plazo se desfasa
// por el offset del país).
// ==========================================
function parseServerDate(s) {
  if (!s) return new Date(NaN);
  const tieneZona = /[zZ]$|[+-]\d\d:?\d\d$/.test(s);
  return new Date(tieneZona ? s : s + 'Z');
}

// ==========================================
// Helper: suma días hábiles (solo para datos demo del frontend)
// ==========================================
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
const labelStyle = (t) => ({ display: 'block', fontSize: '12px', color: t.textMuted, margin: '10px 0 4px' });
const inputStyle = (t) => ({ width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '13px', outline: 'none' });
const selectStyle = (t) => ({ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '12px' });

const primaryBtn = () => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' });
const secondaryBtn = (t) => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontSize: '13px', cursor: 'pointer' });
const iconBtn = (t) => ({ background: 'transparent', border: 'none', color: t.textMuted, cursor: 'pointer' });

const estadoPill = (estado) => {
  const map = { pendiente: '#f59e0b', en_proceso: '#6366f1', resuelta: '#10b981' };
  const c = map[estado] || '#64748b';
  return { padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, color: c, background: `${c}22`, whiteSpace: 'nowrap' };
};

const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' };
const modalBox = (t) => ({ background: t.cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${t.border}`, borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '460px', color: t.text });

export default DataRequestsScreen;
