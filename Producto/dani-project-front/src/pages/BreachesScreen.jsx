/* eslint-disable */
import React, { useState, useEffect, useContext } from 'react';
import {
  ShieldAlert, Plus, Clock, AlertTriangle, CheckCircle, Send, X, Save, RefreshCw, Trash2, Edit
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { breachesAPI } from '../services/api';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentBreach, setCurrentBreach] = useState({ id: '', descripcion: '', datos_afectados: '', gravedad: 'media', estado: 'detectada', cantidad_afectados: '' });

  useEffect(() => { fetchBreaches(); }, []);

  const fetchBreaches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await breachesAPI.getAll();
      setBreaches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar brechas.', err);
      setError('No se pudo conectar con el servidor.');
      setBreaches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!currentBreach.descripcion.trim() || !currentBreach.datos_afectados.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        descripcion: currentBreach.descripcion,
        datos_afectados: currentBreach.datos_afectados,
        gravedad: currentBreach.gravedad,
      };
      
      if (currentBreach.id) {
         payload.estado = currentBreach.estado;
      }

      if (currentBreach.cantidad_afectados !== '' && currentBreach.cantidad_afectados !== null) {
        payload.cantidad_afectados = parseInt(currentBreach.cantidad_afectados, 10);
      } else {
        payload.cantidad_afectados = null; 
      }

      if (currentBreach.id) {
         await breachesAPI.update(currentBreach.id, payload);
      } else {
         await breachesAPI.create(payload);
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setCurrentBreach({ id: '', descripcion: '', datos_afectados: '', gravedad: 'media', estado: 'detectada', cantidad_afectados: '' });
      await fetchBreaches();
    } catch (err) {
      console.error('Error al registrar/actualizar la brecha.', err);
      alert('Error en la operación. Revisa la consola para más detalles.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (breach) => {
    setCurrentBreach({
      id: breach.id,
      descripcion: breach.descripcion,
      datos_afectados: breach.datos_afectados,
      gravedad: breach.gravedad,
      estado: breach.estado || 'detectada',
      cantidad_afectados: breach.cantidad_afectados !== null ? breach.cantidad_afectados : ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (breachId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta brecha de datos?')) return;
    try {
      if (breachesAPI.delete) {
        await breachesAPI.delete(breachId);
        await fetchBreaches();
      } else {
        alert("La función de eliminar no está configurada en api.js");
      }
    } catch (err) {
       console.error('Error al eliminar:', err);
       alert("No se pudo eliminar la brecha.");
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
      alert('Abre "Editar" para cambiar el estado manualmente si el atajo falla.');
    }
  };

  const horasRestantes = (fechaLimite) => {
    const ahora = new Date();
    const limite = parseServerDate(fechaLimite);
    if (isNaN(limite)) return 0;
    return Math.round((limite - ahora) / (1000 * 60 * 60));
  };

  const plazoBadge = (breach) => {
    if (breach.estado === 'notificada' || breach.estado === 'cerrada') {
      return { text: 'Notificada', color: '#2563eb', icon: CheckCircle, bg: 'rgba(37,99,235,0.1)' };
    }
    const horas = horasRestantes(breach.fecha_limite_notificacion);
    if (horas < 0 || breach.alerta_vencida) return { text: `Vencida hace ${Math.abs(horas)} h`, color: '#e11d48', icon: AlertTriangle, bg: 'rgba(225,29,72,0.1)' };
    if (horas <= 24) return { text: `${horas} h restantes`, color: '#d97706', icon: Clock, bg: 'rgba(217,119,6,0.1)' };
    return { text: `${horas} h restantes`, color: '#2563eb', icon: Clock, bg: 'rgba(37,99,235,0.1)' };
  };

  const gravedadLabel = (v) => (GRAVEDADES.find(x => x.value === v) || {}).label || v;

  const total = breaches.length;
  const activas = breaches.filter(b => b.estado !== 'notificada' && b.estado !== 'cerrada').length;
  const vencidas = breaches.filter(b => (b.estado !== 'notificada' && b.estado !== 'cerrada') && (b.alerta_vencida || horasRestantes(b.fecha_limite_notificacion) < 0)).length;
  const notificadas = breaches.filter(b => b.estado === 'notificada' || b.estado === 'cerrada').length;

  return (
    <div className="breaches-container" style={{ padding: '0 8px', color: t.text, minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* ENCABEZADO ADAPTADO */}
      <section className="breaches-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ padding: '6px', background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', borderRadius: '8px' }}>
              <ShieldAlert size={20} />
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: t.text }}>Gestión de Brechas de Datos</h1>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: t.textDim, paddingLeft: '4px' }}>
            <span style={{ fontWeight: 600, color: t.text }}>Obligación O4 · Ley 21.719:</span> toda brecha debe notificarse a la Agencia en un plazo máximo de <strong style={{ color: t.text, fontWeight: 700 }}>72 horas</strong>.
          </p>
        </div>
        
        <div className="breaches-actions" style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button className="btn-refresh" onClick={fetchBreaches} style={{ padding: '10px 12px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', flex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <RefreshCw size={14} color={t.textDim} /> Actualizar
          </button>
          <button className="btn-new" onClick={() => { setCurrentBreach({id: '', descripcion: '', datos_afectados: '', gravedad: 'media', estado: 'detectada', cantidad_afectados: ''}); setShowAddModal(true); }} style={{ padding: '10px 12px', background: '#2563eb', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', flex: 2, boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)' }}>
            <Plus size={16} strokeWidth={2.5} /> Registrar brecha
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
          <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim, lineHeight: 1.1 }}>Activas</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>{activas}</span>
        </div>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim, lineHeight: 1.1 }}>Plazo vencido</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#e11d48', marginTop: '4px' }}>{vencidas}</span>
        </div>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim, lineHeight: 1.1 }}>Notificadas</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>{notificadas}</span>
        </div>
      </section>

      {/* REGISTROS DE BRECHAS */}
      <section aria-label="Lista de brechas">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>Cargando brechas…</div>
        ) : breaches.length === 0 ? (
          <div style={{ padding: '40px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, marginBottom: '12px' }}>
              <ShieldAlert size={24} />
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: t.text }}>No hay brechas registradas.</p>
            <p style={{ margin: 0, fontSize: '12px', color: t.textDim, maxWidth: '280px' }}>Las alertas y el seguimiento legal de 72h se activarán al reportar una incidencia.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registros Activos</span>
              <span style={{ fontSize: '11px', color: t.textDim }}>{breaches.length} incidentes</span>
            </div>

            {/* VISTA ESCRITORIO (TABLA) */}
            <div className="desktop-table-wrapper" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: t.inputBg, borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Descripción</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Datos Afectados</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Gravedad</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Plazo (72h)</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Estado</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Acción</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {breaches.map((b) => {
                    const badge = plazoBadge(b);
                    const Icon = badge.icon;
                    const yaNotificada = b.estado === 'notificada' || b.estado === 'cerrada';
                    return (
                      <tr key={b.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px', fontSize: '12px', color: t.text, maxWidth: '240px', lineHeight: 1.5 }}>
                          {b.descripcion}
                          {b.cantidad_afectados != null && <div style={{ color: t.textDim, fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>{b.cantidad_afectados} afectados</div>}
                        </td>
                        <td style={{ padding: '16px', fontSize: '12px', color: t.text, maxWidth: '180px' }}>{b.datos_afectados}</td>
                        <td style={{ padding: '16px' }}><span style={gravedadPill(b.gravedad)}>{gravedadLabel(b.gravedad)}</span></td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: badge.color, fontWeight: 700, fontSize: '12px' }}>
                            <Icon size={14} /> {badge.text}
                          </span>
                          <div style={{ color: t.textDim, fontSize: '11px', marginTop: '4px' }}>
                            Límite: {parseServerDate(b.fecha_limite_notificacion).toLocaleString('es-CL')}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <select value={b.estado || 'detectada'} onChange={(e) => handleChangeEstado(b, e.target.value)} disabled={yaNotificada} style={{ padding: '6px 10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '11px', fontWeight: 600, cursor: yaNotificada ? 'default' : 'pointer', outline: 'none', opacity: yaNotificada ? 0.7 : 1 }}>
                            {ESTADOS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {yaNotificada ? (
                            <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                              <CheckCircle size={14} /> Hecho
                            </span>
                          ) : (
                            <button onClick={() => handleNotify(b)} style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Send size={12} /> Notificar
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleEditClick(b)} title="Editar" style={{ background: t.cardBg, border: `1px solid ${t.border}`, color: t.textMuted, cursor: 'pointer', padding: '6px', borderRadius: '8px' }}><Edit size={14} /></button>
                            <button onClick={() => handleDelete(b.id)} title="Eliminar" style={{ background: t.cardBg, border: `1px solid ${t.border}`, color: '#e11d48', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL (TARJETAS) */}
            <div className="mobile-cards-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {breaches.map((b) => {
                const badge = plazoBadge(b);
                const Icon = badge.icon;
                const yaNotificada = b.estado === 'notificada' || b.estado === 'cerrada';
                
                // Determinar borde de la tarjeta según vencimiento
                const isVencida = !yaNotificada && diasRestantes(b.fecha_limite_notificacion) < 0;
                const cardStyle = { background: isVencida ? 'linear-gradient(180deg, #ffffff 0%, rgba(225, 29, 72, 0.05) 100%)' : t.cardBg, border: `1px solid ${isVencida ? '#fda4af' : t.border}`, borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' };

                return (
                  <article key={b.id} style={cardStyle}>
                    
                    {/* Header: Estado & Actions */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={gravedadPill(b.gravedad)}>{gravedadLabel(b.gravedad)}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleEditClick(b)} style={{ padding: '6px', background: t.inputBg, border: 'none', color: t.textMuted, borderRadius: '8px' }}><Edit size={14} /></button>
                        <button onClick={() => handleDelete(b.id)} style={{ padding: '6px', background: t.inputBg, border: 'none', color: '#e11d48', borderRadius: '8px' }}><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* Descripción y Datos Afectados */}
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '13px', color: t.text, fontWeight: 500, lineHeight: 1.4, margin: '0 0 8px' }}>{b.descripcion}</p>
                      <div style={{ padding: '8px 12px', background: t.inputBg, borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '11px', color: t.textDim }}>
                        <strong style={{ color: t.text }}>Datos:</strong> {b.datos_afectados}
                        {b.cantidad_afectados != null && <div style={{ marginTop: '4px' }}><strong style={{ color: t.text }}>Afectados:</strong> {b.cantidad_afectados}</div>}
                      </div>
                    </div>

                    {/* Footer: SLA & Action Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${t.inputBg}`, paddingTop: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: badge.color }}>
                          <Icon size={14} /> <span>{badge.text}</span>
                        </div>
                        <p style={{ fontSize: '10px', color: t.textDim, margin: '2px 0 0' }}>Límite: {parseServerDate(b.fecha_limite_notificacion).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      {yaNotificada ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}>
                            <CheckCircle size={14} /> Resuelta
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          <select value={b.estado || 'detectada'} onChange={(e) => handleChangeEstado(b, e.target.value)} style={{ padding: '4px 8px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text, fontSize: '10px', fontWeight: 600, outline: 'none' }}>
                            {ESTADOS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                          </select>
                          <button onClick={() => handleNotify(b)} style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Send size={12} /> Notificar Agencia
                          </button>
                        </div>
                      )}
                    </div>

                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {(showAddModal || showEditModal) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999 }}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '480px', maxHeight: '95vh', overflowY: 'auto', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: t.text }}>{currentBreach.id ? 'Editar Brecha' : 'Registrar Brecha'}</h3>
              <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} style={{ border: 'none', background: t.inputBg, borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Descripción del incidente *</label>
                <textarea
                  value={currentBreach.descripcion}
                  onChange={(e) => setCurrentBreach({ ...currentBreach, descripcion: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px', minHeight: '80px', resize: 'vertical' }}
                  placeholder="¿Qué ocurrió? ¿Cómo se detectó?"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Datos afectados *</label>
                <input
                  value={currentBreach.datos_afectados}
                  onChange={(e) => setCurrentBreach({ ...currentBreach, datos_afectados: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }}
                  placeholder="Ej: Nombres, correos, datos bancarios"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Gravedad</label>
                  <select value={currentBreach.gravedad} onChange={(e) => setCurrentBreach({ ...currentBreach, gravedad: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }}>
                    {GRAVEDADES.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Nº afectados</label>
                  <input type="number" min="0" value={currentBreach.cantidad_afectados} onChange={(e) => setCurrentBreach({ ...currentBreach, cantidad_afectados: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }} placeholder="Opcional" />
                </div>
              </div>

              {currentBreach.id && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Estado de la brecha</label>
                  <select value={currentBreach.estado} onChange={(e) => setCurrentBreach({ ...currentBreach, estado: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }}>
                    {ESTADOS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                  </select>
                </div>
              )}

              <p style={{ color: t.textDim, fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
                El plazo límite (<strong style={{ color: t.text }}>72 horas</strong>) se calcula automáticamente según la Ley 21.719.
              </p>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button className="btn-cancel" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancelar</button>
                <button className="btn-save" onClick={handleCreateOrUpdate} disabled={isSubmitting} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, fontSize: '13px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} /> {isSubmitting ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ESTILOS INYECTADOS PARA RESPONSIVE GLOBAL */}
      <style dangerouslySetInnerHTML={{__html: `
        .mobile-cards-wrapper { display: none; }
        
        @media (max-width: 768px) {
          .breaches-container { padding: 16px !important; }
          .breaches-header { flex-direction: column; align-items: stretch !important; gap: 16px !important; }
          .breaches-actions { flex-direction: row; width: 100%; justify-content: space-between; gap: 8px; }
          .btn-refresh, .btn-new { flex: 1; justify-content: center; }
          
          .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          
          .desktop-table-wrapper { display: none; }
          .mobile-cards-wrapper { display: flex; }
          
          .modal-content { padding: 20px !important; width: 100% !important; margin: 12px; }
          .form-actions { flex-direction: column-reverse; }
          .btn-cancel, .btn-save { width: 100% !important; justify-content: center; }
        }

        /* Escritorio (> 768px) */
        @media (min-width: 768px) {
          .breaches-container { padding: 32px 16px !important; }
          .breaches-header { display: flex; justify-content: space-between; align-items: flex-end; }
          .breaches-actions { width: auto !important; }
          
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

const gravedadPill = (g) => {
  const map = { baja: { c: '#2563eb', b: '#dbeafe' }, media: { c: '#d97706', b: '#fef3c7' }, alta: { c: '#ea580c', b: '#ffedd5' }, critica: { c: '#e11d48', b: '#ffe4e6' } };
  const st = map[g] || { c: '#475569', b: '#f1f5f9' };
  return { padding: '4px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, color: st.c, background: st.b, whiteSpace: 'nowrap', textTransform: 'uppercase' };
};

export default BreachesScreen;