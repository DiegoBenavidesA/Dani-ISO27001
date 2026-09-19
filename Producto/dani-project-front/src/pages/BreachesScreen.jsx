/* eslint-disable */
import React, { useState, useEffect, useContext } from 'react';
import {
  ShieldAlert, Plus, Clock, AlertTriangle, CheckCircle, Send, X, Save, RefreshCw
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { breachesAPI } from '../services/api';

// ==========================================
// Pantalla 3.4 — Gestión de Brechas de Datos
// Obligación O4 de la Ley 21.719: notificar a la Agencia en 72 horas.
// El backend (routes/breaches.py) calcula fecha_limite_notificacion (+72h)
// y marca alerta_vencida. Aquí lo mostramos y permitimos "Notificar".
// ==========================================

const GRAVEDADES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

const ESTADOS = [
  { value: 'detectada', label: 'Detectada' },
  { value: 'en_investigacion', label: 'En investigación' },
  { value: 'notificada', label: 'Notificada' },
  { value: 'cerrada', label: 'Cerrada' },
];

const BreachesScreen = () => {
  const { theme: t } = useContext(ThemeContext);

  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBreach, setNewBreach] = useState({ descripcion: '', datos_afectados: '', gravedad: 'media', cantidad_afectados: '' });

  // Datos demo: solo si el backend no responde.
  const demoBreaches = [
    { id: 'demo-1', fecha_deteccion: new Date().toISOString(), descripcion: 'Acceso no autorizado a base de datos de clientes.', datos_afectados: 'Nombres, correos, teléfonos', cantidad_afectados: 1200, gravedad: 'critica', fecha_limite_notificacion: addHours(new Date(), 40).toISOString(), fecha_notificacion: null, estado: 'en_investigacion', medidas_tomadas: null, responsable: 'ciso@empresa.cl', alerta_vencida: false },
    { id: 'demo-2', fecha_deteccion: addHours(new Date(), -80).toISOString(), descripcion: 'Envío erróneo de correo con datos personales.', datos_afectados: 'Correos, RUT', cantidad_afectados: 35, gravedad: 'media', fecha_limite_notificacion: addHours(new Date(), -8).toISOString(), fecha_notificacion: null, estado: 'detectada', medidas_tomadas: null, responsable: null, alerta_vencida: true },
    { id: 'demo-3', fecha_deteccion: addHours(new Date(), -20).toISOString(), descripcion: 'Laptop extraviada con información sensible.', datos_afectados: 'Datos de salud', cantidad_afectados: 8, gravedad: 'alta', fecha_limite_notificacion: addHours(new Date(), 52).toISOString(), fecha_notificacion: addHours(new Date(), -2).toISOString(), estado: 'notificada', medidas_tomadas: 'Cifrado remoto activado.', responsable: 'dpo@empresa.cl', alerta_vencida: false },
  ];

  useEffect(() => { fetchBreaches(); }, []);

  const fetchBreaches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await breachesAPI.getAll();
      setBreaches(Array.isArray(data) && data.length > 0 ? data : demoBreaches);
    } catch (err) {
      console.error('Error al cargar brechas. Usando datos demo.', err);
      setError('No se pudo conectar con el servidor. Mostrando datos de ejemplo.');
      setBreaches(demoBreaches);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newBreach.descripcion.trim() || !newBreach.datos_afectados.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        descripcion: newBreach.descripcion,
        datos_afectados: newBreach.datos_afectados,
        gravedad: newBreach.gravedad,
      };
      if (newBreach.cantidad_afectados !== '') {
        payload.cantidad_afectados = parseInt(newBreach.cantidad_afectados, 10);
      }
      await breachesAPI.create(payload);
      setShowAddModal(false);
      setNewBreach({ descripcion: '', datos_afectados: '', gravedad: 'media', cantidad_afectados: '' });
      await fetchBreaches();
    } catch (err) {
      console.error('Error al registrar la brecha.', err);
      alert('No se pudo registrar la brecha. Revisa la conexión con el backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotify = async (breach) => {
    if (!window.confirm('¿Marcar esta brecha como notificada a la Agencia? Esto detiene el reloj de 72h.')) return;
    try {
      await breachesAPI.notify(breach.id);
      await fetchBreaches();
    } catch (err) {
      console.error('Error al notificar la brecha.', err);
      alert('No se pudo marcar como notificada.');
    }
  };

  const handleChangeEstado = async (breach, estado) => {
    try {
      await breachesAPI.update(breach.id, { estado });
      await fetchBreaches();
    } catch (err) {
      console.error('Error al actualizar el estado.', err);
      alert('No se pudo actualizar el estado.');
    }
  };

  // ==========================================
  // Reloj de 72 horas: horas restantes para el semáforo.
  // ==========================================
  const horasRestantes = (fechaLimite) => {
    const ahora = new Date();
    const limite = new Date(fechaLimite);
    return Math.round((limite - ahora) / (1000 * 60 * 60));
  };

  const plazoBadge = (breach) => {
    if (breach.estado === 'notificada' || breach.estado === 'cerrada') {
      return { text: 'Notificada', color: '#10b981', icon: CheckCircle };
    }
    const horas = horasRestantes(breach.fecha_limite_notificacion);
    if (horas < 0 || breach.alerta_vencida) return { text: `Vencida hace ${Math.abs(horas)} h`, color: '#ef4444', icon: AlertTriangle };
    if (horas <= 24) return { text: `${horas} h restantes`, color: '#f59e0b', icon: Clock };
    return { text: `${horas} h restantes`, color: '#10b981', icon: Clock };
  };

  const gravedadLabel = (v) => (GRAVEDADES.find(x => x.value === v) || {}).label || v;
  const estadoLabel = (v) => (ESTADOS.find(x => x.value === v) || {}).label || v;

  // Resumen
  const total = breaches.length;
  const activas = breaches.filter(b => b.estado !== 'notificada' && b.estado !== 'cerrada').length;
  const vencidas = breaches.filter(b => (b.estado !== 'notificada' && b.estado !== 'cerrada') && (b.alerta_vencida || horasRestantes(b.fecha_limite_notificacion) < 0)).length;
  const notificadas = breaches.filter(b => b.estado === 'notificada' || b.estado === 'cerrada').length;

  const cardStyle = { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px' };

  return (
    <div style={{ padding: '24px', color: t.text, minHeight: '100%' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={24} /> Gestión de Brechas de Datos
          </h1>
          <p style={{ color: t.textMuted, marginTop: '6px', fontSize: '13px', maxWidth: '640px' }}>
            Obligación O4 · Ley 21.719: toda brecha debe notificarse a la Agencia en
            un plazo máximo de <strong>72 horas</strong> desde su detección.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchBreaches} style={secondaryBtn(t)}>
            <RefreshCw size={16} /> Actualizar
          </button>
          <button onClick={() => setShowAddModal(true)} style={primaryBtn()}>
            <Plus size={16} /> Registrar brecha
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
        <SummaryCard t={t} label="Activas" value={activas} color="#6366f1" />
        <SummaryCard t={t} label="Plazo vencido" value={vencidas} color="#ef4444" />
        <SummaryCard t={t} label="Notificadas" value={notificadas} color="#10b981" />
      </div>

      {/* Tabla */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted }}>Cargando brechas…</div>
        ) : breaches.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted }}>No hay brechas registradas.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: t.hoverBg, textAlign: 'left' }}>
                  <th style={thStyle(t)}>Descripción</th>
                  <th style={thStyle(t)}>Datos afectados</th>
                  <th style={thStyle(t)}>Gravedad</th>
                  <th style={thStyle(t)}>Plazo (72 h)</th>
                  <th style={thStyle(t)}>Estado</th>
                  <th style={thStyle(t)}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {breaches.map((b) => {
                  const badge = plazoBadge(b);
                  const Icon = badge.icon;
                  const yaNotificada = b.estado === 'notificada' || b.estado === 'cerrada';
                  return (
                    <tr key={b.id} style={{ borderTop: `1px solid ${t.border}` }}>
                      <td style={{ ...tdStyle(t), maxWidth: '240px' }}>
                        {b.descripcion}
                        {b.cantidad_afectados != null && (
                          <div style={{ color: t.textDim, fontSize: '11px', marginTop: '2px' }}>
                            {b.cantidad_afectados} afectados
                          </div>
                        )}
                      </td>
                      <td style={{ ...tdStyle(t), maxWidth: '180px' }}>{b.datos_afectados}</td>
                      <td style={tdStyle(t)}><span style={gravedadPill(b.gravedad)}>{gravedadLabel(b.gravedad)}</span></td>
                      <td style={tdStyle(t)}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: badge.color, fontWeight: 600 }}>
                          <Icon size={14} /> {badge.text}
                        </span>
                        <div style={{ color: t.textDim, fontSize: '11px', marginTop: '2px' }}>
                          Límite: {new Date(b.fecha_limite_notificacion).toLocaleString()}
                        </div>
                      </td>
                      <td style={tdStyle(t)}>
                        <select value={b.estado} onChange={(e) => handleChangeEstado(b, e.target.value)} style={selectStyle(t)} disabled={yaNotificada}>
                          {ESTADOS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                        </select>
                      </td>
                      <td style={tdStyle(t)}>
                        {yaNotificada ? (
                          <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                            <CheckCircle size={14} /> Hecho
                          </span>
                        ) : (
                          <button onClick={() => handleNotify(b)} style={{ ...primaryBtn(), padding: '6px 10px', fontSize: '12px' }}>
                            <Send size={13} /> Notificar
                          </button>
                        )}
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
              <h3 style={{ margin: 0, fontSize: '17px' }}>Registrar nueva brecha</h3>
              <button onClick={() => setShowAddModal(false)} style={iconBtn(t)}><X size={18} /></button>
            </div>

            <label style={labelStyle(t)}>Descripción del incidente</label>
            <textarea
              value={newBreach.descripcion}
              onChange={(e) => setNewBreach({ ...newBreach, descripcion: e.target.value })}
              style={{ ...inputStyle(t), minHeight: '70px', resize: 'vertical' }}
              placeholder="¿Qué ocurrió?"
            />

            <label style={labelStyle(t)}>Datos afectados</label>
            <input
              value={newBreach.datos_afectados}
              onChange={(e) => setNewBreach({ ...newBreach, datos_afectados: e.target.value })}
              style={inputStyle(t)}
              placeholder="Ej: Nombres, correos, contraseñas"
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle(t)}>Gravedad</label>
                <select value={newBreach.gravedad} onChange={(e) => setNewBreach({ ...newBreach, gravedad: e.target.value })} style={inputStyle(t)}>
                  {GRAVEDADES.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle(t)}>N.º afectados (opcional)</label>
                <input
                  type="number"
                  min="0"
                  value={newBreach.cantidad_afectados}
                  onChange={(e) => setNewBreach({ ...newBreach, cantidad_afectados: e.target.value })}
                  style={inputStyle(t)}
                  placeholder="Ej: 1200"
                />
              </div>
            </div>

            <p style={{ color: t.textDim, fontSize: '11px', marginTop: '8px' }}>
              El plazo de notificación (72 horas desde ahora) se calcula automáticamente al guardar.
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
// Helper: suma horas (solo para datos demo del frontend)
// ==========================================
function addHours(date, hours) {
  const result = new Date(date);
  result.setTime(result.getTime() + hours * 60 * 60 * 1000);
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

const gravedadPill = (g) => {
  const map = { baja: '#10b981', media: '#f59e0b', alta: '#f97316', critica: '#ef4444' };
  const c = map[g] || '#64748b';
  return { padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, color: c, background: `${c}22`, whiteSpace: 'nowrap' };
};

const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' };
const modalBox = (t) => ({ background: t.cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${t.border}`, borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '480px', color: t.text });

export default BreachesScreen;
