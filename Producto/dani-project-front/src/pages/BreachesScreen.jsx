/* eslint-disable */
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  ShieldAlert, Plus, Clock, AlertTriangle, CheckCircle, Send, X, RefreshCw, Trash2, Sparkles, Loader2, ChevronRight, ClipboardCheck, Lock
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { breachesAPI } from '../services/api';

const GRAVEDADES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

const ESTADOS = {
  detectada: { label: 'Por revisar', color: '#e11d48', bg: 'rgba(225,29,72,0.1)' },
  en_investigacion: { label: 'En investigación', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  notificada: { label: 'Notificada a la Agencia', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  cerrada: { label: 'Cerrada', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
};

// Revisan, notifican y cierran; reportar puede cualquiera.
const ROLES_GESTION = ['superadmin', 'owner', 'admin', 'dpo'];

const ahoraLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const BreachesScreen = () => {
  const { theme: t } = useContext(ThemeContext);
  const { user } = useAuth();
  const gestiona = ROLES_GESTION.includes(user?.role);
  const puedeEliminar = ['superadmin', 'owner', 'admin'].includes(user?.role);

  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showReport, setShowReport] = useState(false);
  const [reporte, setReporte] = useState({ descripcion: '', fecha: ahoraLocal() });
  const [reportError, setReportError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportOk, setReportOk] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const selected = breaches.find(b => b.id === selectedId) || null;

  useEffect(() => { fetchBreaches(); }, []);

  // Mientras la IA analiza alguna, se refresca cada pocos segundos (máx. 2 min).
  const pollRef = useRef(0);
  const hayPendientes = breaches.some(b => b.analisis_estado === 'pendiente');
  useEffect(() => {
    if (!hayPendientes) { pollRef.current = 0; return; }
    if (pollRef.current >= 30) return;
    const id = setTimeout(() => { pollRef.current += 1; fetchBreaches(true); }, 4000);
    return () => clearTimeout(id);
  }, [breaches, hayPendientes]);

  const fetchBreaches = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError(null);
    try {
      setBreaches(await breachesAPI.getAll());
    } catch (err) {
      console.error('Error al cargar vulneraciones.', err);
      setError('No se pudieron cargar las vulneraciones: ' + err.message);
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  const handleReport = async () => {
    if (reporte.descripcion.trim().length < 10) { setReportError('Describe lo ocurrido con al menos 10 caracteres.'); return; }
    setIsSubmitting(true); setReportError(null);
    try {
      const fecha = reporte.fecha ? new Date(reporte.fecha) : null;
      await breachesAPI.create({ descripcion: reporte.descripcion.trim(), ...(fecha && !isNaN(fecha) && { fecha_deteccion: fecha.toISOString() }) });
      setShowReport(false);
      setReportOk(gestiona
        ? 'Vulneración reportada. La IA la está analizando; luego confirma la gravedad en el detalle.'
        : 'Vulneración reportada. La IA la está analizando y se avisó a los responsables de la empresa.');
      await fetchBreaches(true);
    } catch (err) {
      setReportError('No se pudo reportar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reemplazar = (b) => setBreaches(prev => prev.map(x => x.id === b.id ? b : x));

  const horasRestantes = (b) => {
    const limite = parseServerDate(b.fecha_limite_notificacion);
    if (isNaN(limite)) return 0;
    return Math.floor((limite - new Date()) / 3600000);
  };

  const plazoBadge = (b) => {
    if (b.estado === 'notificada' || (b.estado === 'cerrada' && b.fecha_notificacion)) {
      const aTiempo = parseServerDate(b.fecha_notificacion) <= parseServerDate(b.fecha_limite_notificacion);
      return { text: aTiempo ? 'Notificada a tiempo' : 'Notificada fuera de plazo', color: aTiempo ? '#2563eb' : '#e11d48', icon: CheckCircle };
    }
    if (b.estado === 'cerrada' || b.notificacion_requerida === false) return { text: 'No requiere notificación', color: t.textDim, icon: CheckCircle };
    const horas = horasRestantes(b);
    if (horas < 0) return { text: `Plazo vencido hace ${Math.abs(horas)} h`, color: '#e11d48', icon: AlertTriangle };
    return { text: `${horas} h para notificar`, color: horas <= 24 ? '#d97706' : '#2563eb', icon: Clock };
  };

  const abiertas = breaches.filter(b => b.estado !== 'cerrada');
  const porRevisar = breaches.filter(b => !b.gravedad_confirmada && b.estado !== 'cerrada').length;
  const vencidas = abiertas.filter(b => b.estado !== 'notificada' && b.notificacion_requerida !== false && horasRestantes(b) < 0).length;
  const cerradas = breaches.length - abiertas.length;

  const metric = (label, value, color) => (
    <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim }}>{label}</span>
      <span style={{ fontSize: '24px', fontWeight: 900, color, marginTop: '4px' }}>{value}</span>
    </div>
  );

  return (
    <div className="breaches-container" style={{ padding: '0 8px', color: t.text, minHeight: '100%', boxSizing: 'border-box' }}>

      <section className="breaches-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ padding: '6px', background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', borderRadius: '8px' }}>
              <ShieldAlert size={20} />
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: t.text }}>Vulneraciones de Seguridad</h1>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: t.textDim, paddingLeft: '4px' }}>
            <span style={{ fontWeight: 600, color: t.text }}>Obligación O4 · Ley 21.719:</span> toda vulneración de seguridad que afecte datos personales debe notificarse a la Agencia en un plazo máximo de <strong style={{ color: t.text, fontWeight: 700 }}>72 horas</strong> desde que se detecta.
          </p>
        </div>

        <div className="breaches-actions" style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button className="btn-refresh" onClick={() => fetchBreaches()} style={{ padding: '10px 12px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', flex: 1 }}>
            <RefreshCw size={14} color={t.textDim} /> Actualizar
          </button>
          <button className="btn-new" onClick={() => { setReporte({ descripcion: '', fecha: ahoraLocal() }); setReportError(null); setShowReport(true); }} style={{ padding: '10px 12px', background: '#2563eb', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', flex: 2, boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)' }}>
            <Plus size={16} strokeWidth={2.5} /> Reportar vulneración
          </button>
        </div>
      </section>

      {error && (
        <div style={{ padding: '12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', color: '#b45309', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {reportOk && (
        <div style={{ padding: '12px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.3)', borderRadius: '12px', color: '#047857', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>
          <CheckCircle size={16} /> <span style={{ flex: 1 }}>{reportOk}</span>
          <button onClick={() => setReportOk(null)} aria-label="Cerrar aviso" style={{ border: 'none', background: 'transparent', color: '#047857', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
        </div>
      )}

      <section className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {metric('Por revisar', porRevisar, '#e11d48')}
        {metric('Abiertas', abiertas.length, '#2563eb')}
        {metric('Plazo vencido', vencidas, '#e11d48')}
        {metric('Cerradas', cerradas, '#059669')}
      </section>

      <section aria-label="Lista de vulneraciones">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>Cargando vulneraciones…</div>
        ) : breaches.length === 0 ? (
          <div style={{ padding: '40px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, marginBottom: '12px' }}>
              <ShieldAlert size={24} />
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: t.text }}>No hay vulneraciones registradas.</p>
            <p style={{ margin: 0, fontSize: '12px', color: t.textDim, maxWidth: '320px' }}>Si ocurre un incidente, repórtalo con tus palabras: la IA estimará su gravedad y se avisará a los responsables.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {breaches.map((b) => {
              const badge = plazoBadge(b);
              const Icon = badge.icon;
              const est = ESTADOS[b.estado] || ESTADOS.detectada;
              return (
                <button key={b.id} onClick={() => setSelectedId(b.id)} className="breach-row" style={{ textAlign: 'left', width: '100%', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', color: t.text, font: 'inherit' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, color: est.color, background: est.bg, textTransform: 'uppercase' }}>{est.label}</span>
                      <GravedadPill b={b} />
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.descripcion}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: t.textDim }}>
                      Detectada el {formatFecha(b.fecha_deteccion)}{b.reportado_por ? ` · ${b.reportado_por}` : ''}
                    </p>
                  </div>
                  <div className="breach-row-side" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 'none' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: badge.color, fontWeight: 700, fontSize: '12px' }}>
                      <Icon size={14} /> {badge.text}
                    </span>
                    <ChevronRight size={16} color={t.textDim} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {showReport && (
        <Modal t={t} titulo="Reportar vulneración" onClose={() => setShowReport(false)} maxWidth="520px">
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: t.textDim, lineHeight: 1.5 }}>
            Cuenta con tus palabras qué ocurrió. No necesitas saber qué tan grave es: la IA lo evaluará y se avisará a los responsables de la empresa para que lo revisen.
          </p>
          <label style={labelStyle(t)}>¿Qué ocurrió? *</label>
          <textarea
            value={reporte.descripcion}
            onChange={(e) => setReporte({ ...reporte, descripcion: e.target.value })}
            style={{ ...inputStyle(t), minHeight: '120px', resize: 'vertical' }}
            placeholder="Ej: Hoy en la mañana nos robaron 3 computadoras de la oficina. Las usaba el equipo de ventas."
            autoFocus
          />
          <label style={{ ...labelStyle(t), marginTop: '14px' }}>¿Cuándo se detectó?</label>
          <input type="datetime-local" value={reporte.fecha} max={ahoraLocal()} onChange={(e) => setReporte({ ...reporte, fecha: e.target.value })} style={inputStyle(t)} />
          <p style={{ color: t.textDim, fontSize: '11px', margin: '6px 0 0', lineHeight: 1.4 }}>
            El plazo de <strong style={{ color: t.text }}>72 horas</strong> para notificar a la Agencia corre desde este momento. Corrígelo si te enteraste antes.
          </p>
          {reportError && <p style={{ color: '#e11d48', fontSize: '12px', margin: '12px 0 0' }}>{reportError}</p>}
          <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <button className="btn-cancel" onClick={() => setShowReport(false)} style={secondaryBtn(t)}>Cancelar</button>
            <button className="btn-save" onClick={handleReport} disabled={isSubmitting} style={{ ...primaryBtn, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? <Loader2 size={16} className="spin" /> : <Send size={16} />} {isSubmitting ? 'Enviando…' : 'Reportar'}
            </button>
          </div>
        </Modal>
      )}

      {selected && (
        <BreachDetail
          key={selected.id}
          t={t}
          b={selected}
          gestiona={gestiona}
          puedeEliminar={puedeEliminar}
          plazo={plazoBadge(selected)}
          onClose={() => setSelectedId(null)}
          onChange={reemplazar}
          onDeleted={() => { setSelectedId(null); fetchBreaches(true); }}
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .breach-row:hover { border-color: #93c5fd !important; }
        .spin { animation: br-spin 1s linear infinite; }
        @keyframes br-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .breaches-container { padding: 16px !important; }
          .breaches-header { flex-direction: column; align-items: stretch !important; }
          .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .breach-row { flex-direction: column; align-items: stretch !important; gap: 10px !important; }
          .breach-row-side { justify-content: space-between; }
          .form-actions { flex-direction: column-reverse; }
          .btn-cancel, .btn-save { width: 100% !important; justify-content: center; }
          .detail-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) {
          .breaches-container { padding: 32px 16px !important; }
          .breaches-header { align-items: flex-end !important; }
          .breaches-actions { width: auto !important; }
        }
      `}} />
    </div>
  );
};

// ==========================================
// Detalle: análisis IA → revisión → notificación → cierre
// ==========================================
const BreachDetail = ({ t, b, gestiona, puedeEliminar, plazo, onClose, onChange, onDeleted }) => {
  const ia = b.analisis_ia || null;
  const cerrada = b.estado === 'cerrada';
  const notificada = b.estado === 'notificada' || !!b.fecha_notificacion;

  const [rev, setRev] = useState(() => ({
    gravedad: b.gravedad || ia?.gravedad || 'media',
    datos_afectados: b.datos_afectados ?? (ia?.datos_posibles || []).join(', '),
    afectados_estimacion: b.afectados_estimacion || 'desconocido',
    cantidad_afectados: b.cantidad_afectados ?? '',
    medidas_tomadas: b.medidas_tomadas || '',
    notificacion_requerida: b.notificacion_requerida ?? (ia ? ia.notificar_agencia !== false : true),
  }));
  const [cierre, setCierre] = useState({ causa_raiz: '', resolucion: '' });
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  // Si el análisis llega mientras el detalle está abierto y aún no se revisó, usar lo que propone.
  useEffect(() => {
    if (!ia || b.gravedad_confirmada) return;
    setRev(r => ({
      ...r,
      gravedad: ia.gravedad || r.gravedad,
      datos_afectados: r.datos_afectados || (ia.datos_posibles || []).join(', '),
      notificacion_requerida: ia.notificar_agencia !== false,
    }));
  }, [b.analisis_estado]);

  const accion = async (nombre, fn) => {
    setBusy(nombre); setMsg(null);
    try {
      const actualizado = await fn();
      if (actualizado) onChange(actualizado);
      return true;
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const guardarRevision = () => {
    if (rev.afectados_estimacion !== 'desconocido' && (rev.cantidad_afectados === '' || Number(rev.cantidad_afectados) < 0)) {
      setMsg({ tipo: 'error', texto: 'Indica el número de afectados o marca "Desconocido".' });
      return;
    }
    accion('revision', async () => {
      const r = await breachesAPI.revisar(b.id, {
        ...rev,
        cantidad_afectados: rev.afectados_estimacion === 'desconocido' ? null : parseInt(rev.cantidad_afectados, 10),
      });
      setMsg({ tipo: 'ok', texto: b.gravedad_confirmada ? 'Cambios guardados.' : 'Revisión confirmada.' });
      return r;
    });
  };

  const notificar = () => {
    if (!window.confirm('¿Confirmas que esta vulneración ya fue notificada a la Agencia de Protección de Datos Personales? Quedará registrada la fecha y hora de hoy.')) return;
    accion('notify', () => breachesAPI.notify(b.id));
  };

  const cerrar = () => {
    if (cierre.causa_raiz.trim().length < 10 || cierre.resolucion.trim().length < 10) {
      setMsg({ tipo: 'error', texto: 'Explica la causa raíz y cómo se resolvió (al menos 10 caracteres cada uno).' });
      return;
    }
    accion('resolver', () => breachesAPI.resolver(b.id, cierre));
  };

  const eliminar = async () => {
    if (!window.confirm('¿Eliminar permanentemente esta vulneración? Se pierde también su historial.')) return;
    if (await accion('delete', () => breachesAPI.delete(b.id).then(() => null))) onDeleted();
  };

  const est = ESTADOS[b.estado] || ESTADOS.detectada;
  const PlazoIcon = plazo.icon;
  const puedeNotificar = gestiona && b.gravedad_confirmada && !notificada && !cerrada && b.notificacion_requerida !== false;
  const puedeCerrar = gestiona && b.gravedad_confirmada && !cerrada && (notificada || b.notificacion_requerida === false);

  return (
    <Modal t={t} titulo="Detalle de la vulneración" onClose={onClose} maxWidth="760px">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, color: est.color, background: est.bg, textTransform: 'uppercase' }}>{est.label}</span>
        <GravedadPill b={b} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: plazo.color, fontWeight: 700, fontSize: '12px', marginLeft: 'auto' }}>
          <PlazoIcon size={14} /> {plazo.text}
        </span>
      </div>

      {/* 1. Lo reportado */}
      <Seccion t={t} paso="1" titulo="Lo reportado">
        <p style={{ margin: '0 0 8px', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{b.descripcion}</p>
        <p style={{ margin: 0, fontSize: '11px', color: t.textDim }}>
          Detectada el {formatFecha(b.fecha_deteccion)}{b.reportado_por ? ` · Reportada por ${b.reportado_por}` : ''} · Límite para notificar: {formatFecha(b.fecha_limite_notificacion)}
        </p>
      </Seccion>

      {/* 2. Análisis IA */}
      <Seccion t={t} paso="2" titulo="Análisis de la IA" icono={<Sparkles size={14} color="#7c3aed" />}>
        {b.analisis_estado === 'pendiente' ? (
          <p style={{ margin: 0, fontSize: '12px', color: t.textDim, display: 'flex', alignItems: 'center', gap: '8px' }}><Loader2 size={14} className="spin" /> La IA está analizando lo reportado…</p>
        ) : !ia ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '12px', color: t.textDim, flex: 1 }}>{b.analisis_estado === 'error' ? 'El análisis no se pudo completar.' : 'Esta vulneración no tiene análisis de IA.'}</p>
            {gestiona && !cerrada && (
              <button onClick={() => accion('analizar', () => breachesAPI.analizar(b.id))} disabled={!!busy} style={secondaryBtn(t)}>
                {busy === 'analizar' ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} Analizar con IA
              </button>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 10px' }}><strong>Gravedad sugerida: {gravedadLabel(ia.gravedad)}.</strong> {ia.justificacion}</p>
            <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Lista t={t} titulo="Datos que podrían estar afectados" items={ia.datos_posibles} />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '11px', color: t.textMuted, textTransform: 'uppercase' }}>Notificación</p>
                <p style={{ margin: 0 }}>Agencia: <strong>{ia.notificar_agencia ? 'sí corresponde' : 'no parece necesaria'}</strong><br />Titulares: <strong>{ia.notificar_titulares ? 'sí corresponde' : 'no parece necesaria'}</strong></p>
                {ia.motivo_notificacion && <p style={{ margin: '4px 0 0', color: t.textDim }}>{ia.motivo_notificacion}</p>}
              </div>
              <Lista t={t} titulo="Acciones inmediatas sugeridas" items={ia.acciones_inmediatas} />
              <Lista t={t} titulo="Qué falta averiguar" items={ia.preguntas} />
            </div>
            <p style={{ margin: '10px 0 0', fontSize: '11px', color: t.textDim }}>Es una sugerencia: la gravedad final la confirma una persona responsable.</p>
          </div>
        )}
      </Seccion>

      {/* 3. Revisión */}
      <Seccion t={t} paso="3" titulo={b.gravedad_confirmada ? 'Revisión confirmada' : 'Revisión del responsable'} icono={<ClipboardCheck size={14} color="#0d9488" />}>
        {!gestiona ? (
          <p style={{ margin: 0, fontSize: '12px', color: t.textDim, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={13} /> {b.gravedad_confirmada ? `Revisada por ${b.confirmada_por || 'un responsable'}.` : 'Pendiente: la revisará el owner, un admin o el DPO de la empresa.'}
          </p>
        ) : (
          <>
            {b.gravedad_confirmada && <p style={{ margin: '0 0 12px', fontSize: '11px', color: t.textDim }}>Confirmada por {b.confirmada_por || '—'} el {formatFecha(b.fecha_confirmacion)}.</p>}
            <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle(t)}>Gravedad</label>
                <select value={rev.gravedad} disabled={cerrada} onChange={(e) => setRev({ ...rev, gravedad: e.target.value })} style={inputStyle(t)}>
                  {GRAVEDADES.map(op => <option key={op.value} value={op.value}>{op.label}{ia?.gravedad === op.value ? ' (sugerida por la IA)' : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle(t)}>Personas afectadas</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={rev.afectados_estimacion} disabled={cerrada} onChange={(e) => setRev({ ...rev, afectados_estimacion: e.target.value })} style={{ ...inputStyle(t), flex: 1 }}>
                    <option value="desconocido">Desconocido</option>
                    <option value="aproximado">Aproximado</option>
                    <option value="exacto">Exacto</option>
                  </select>
                  {rev.afectados_estimacion !== 'desconocido' && (
                    <input type="number" min="0" disabled={cerrada} value={rev.cantidad_afectados} onChange={(e) => setRev({ ...rev, cantidad_afectados: e.target.value })} placeholder="N.º" style={{ ...inputStyle(t), width: '100px' }} />
                  )}
                </div>
              </div>
            </div>
            <label style={{ ...labelStyle(t), marginTop: '12px' }}>Datos personales afectados</label>
            <input value={rev.datos_afectados} disabled={cerrada} onChange={(e) => setRev({ ...rev, datos_afectados: e.target.value })} placeholder="Ej: nombres, RUT, correos" style={inputStyle(t)} />
            <label style={{ ...labelStyle(t), marginTop: '12px' }}>Medidas de contención tomadas</label>
            <textarea value={rev.medidas_tomadas} disabled={cerrada} onChange={(e) => setRev({ ...rev, medidas_tomadas: e.target.value })} placeholder="Ej: se bloquearon las cuentas de los equipos robados y se cambiaron contraseñas" style={{ ...inputStyle(t), minHeight: '64px', resize: 'vertical' }} />
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px', fontSize: '12px', cursor: cerrada || notificada ? 'default' : 'pointer' }}>
              <input type="checkbox" checked={rev.notificacion_requerida} disabled={cerrada || notificada} onChange={(e) => setRev({ ...rev, notificacion_requerida: e.target.checked })} style={{ marginTop: '2px' }} />
              <span>Requiere notificarse a la Agencia <span style={{ color: t.textDim }}>(desmárcalo solo si es improbable que afecte los derechos de las personas; queda registrado quién lo decidió)</span></span>
            </label>
            {!cerrada && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button onClick={guardarRevision} disabled={!!busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
                  {busy === 'revision' ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />} {b.gravedad_confirmada ? 'Guardar cambios' : 'Confirmar revisión'}
                </button>
              </div>
            )}
          </>
        )}
      </Seccion>

      {/* 4. Notificación a la Agencia */}
      <Seccion t={t} paso="4" titulo="Notificación a la Agencia" icono={<Send size={14} color="#2563eb" />} apagada={!b.gravedad_confirmada}>
        {notificada ? (
          <p style={{ margin: 0, fontSize: '12px' }}>Notificada el {formatFecha(b.fecha_notificacion)} · <strong style={{ color: plazo.color }}>{plazo.text}</strong></p>
        ) : b.notificacion_requerida === false ? (
          <p style={{ margin: 0, fontSize: '12px', color: t.textDim }}>El responsable determinó que no requiere notificación.</p>
        ) : !b.gravedad_confirmada ? (
          <p style={{ margin: 0, fontSize: '12px', color: t.textDim }}>Disponible después de confirmar la revisión.</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '12px', color: t.textDim, flex: 1, minWidth: '220px' }}>Notifica a la Agencia por su canal oficial y luego registra aquí que se hizo.</p>
            {puedeNotificar && (
              <button onClick={notificar} disabled={!!busy} style={primaryBtn}>
                {busy === 'notify' ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Marcar como notificada
              </button>
            )}
          </div>
        )}
      </Seccion>

      {/* 5. Cierre */}
      <Seccion t={t} paso="5" titulo={cerrada ? 'Resuelta' : 'Resolver y cerrar'} icono={<CheckCircle size={14} color="#059669" />} apagada={!puedeCerrar && !cerrada}>
        {cerrada ? (
          <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 6px' }}><strong>Causa raíz:</strong> {b.causa_raiz}</p>
            <p style={{ margin: '0 0 6px' }}><strong>Cómo se resolvió:</strong> {b.resolucion}</p>
            <p style={{ margin: 0, fontSize: '11px', color: t.textDim }}>Cerrada por {b.resuelta_por || '—'} el {formatFecha(b.fecha_resolucion)}.</p>
          </div>
        ) : puedeCerrar ? (
          <>
            <label style={labelStyle(t)}>Causa raíz</label>
            <textarea value={cierre.causa_raiz} onChange={(e) => setCierre({ ...cierre, causa_raiz: e.target.value })} placeholder="¿Por qué ocurrió? Ej: los equipos no tenían cifrado de disco" style={{ ...inputStyle(t), minHeight: '60px', resize: 'vertical' }} />
            <label style={{ ...labelStyle(t), marginTop: '12px' }}>¿Cómo se resolvió?</label>
            <textarea value={cierre.resolucion} onChange={(e) => setCierre({ ...cierre, resolucion: e.target.value })} placeholder="Ej: se activó el cifrado en todos los equipos y se reforzó el control de acceso a la oficina" style={{ ...inputStyle(t), minHeight: '60px', resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button onClick={cerrar} disabled={!!busy} style={{ ...primaryBtn, background: '#059669' }}>
                {busy === 'resolver' ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />} Cerrar vulneración
              </button>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '12px', color: t.textDim }}>
            {!gestiona ? 'La cerrará un responsable cuando esté resuelta.' : !b.gravedad_confirmada ? 'Disponible después de confirmar la revisión.' : 'Disponible después de notificar a la Agencia.'}
          </p>
        )}
      </Seccion>

      {msg && <p style={{ margin: '12px 0 0', fontSize: '12px', fontWeight: 600, color: msg.tipo === 'error' ? '#e11d48' : '#059669' }}>{msg.texto}</p>}

      {puedeEliminar && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${t.border}` }}>
          <button onClick={eliminar} disabled={!!busy} style={{ ...secondaryBtn(t), color: '#e11d48' }}><Trash2 size={14} /> Eliminar</button>
        </div>
      )}
    </Modal>
  );
};

// ==========================================
// Piezas y helpers
// ==========================================
const Modal = ({ t, titulo, onClose, maxWidth, children }) => (
  <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999 }}>
    <div role="dialog" aria-modal="true" aria-label={titulo} style={{ width: '100%', maxWidth, maxHeight: '92vh', overflowY: 'auto', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '24px', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', color: t.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: t.text }}>{titulo}</h3>
        <button type="button" onClick={onClose} aria-label="Cerrar" style={{ border: 'none', background: t.inputBg, borderRadius: '50%', width: '32px', height: '32px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Seccion = ({ t, paso, titulo, icono, apagada, children }) => (
  <section style={{ border: `1px solid ${t.border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', opacity: apagada ? 0.6 : 1 }}>
    <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: t.inputBg, fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}>{paso}</span>
      {titulo} {icono}
    </h4>
    {children}
  </section>
);

const Lista = ({ t, titulo, items }) => (
  <div>
    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '11px', color: t.textMuted, textTransform: 'uppercase' }}>{titulo}</p>
    {items && items.length ? (
      <ul style={{ margin: 0, paddingLeft: '18px' }}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    ) : <p style={{ margin: 0, color: t.textDim }}>—</p>}
  </div>
);

const GravedadPill = ({ b }) => {
  if (!b.gravedad) {
    return <span style={pillStyle(null)}>{b.analisis_estado === 'pendiente' ? 'Evaluando…' : 'Sin gravedad'}</span>;
  }
  return (
    <span style={pillStyle(b.gravedad)} title={b.gravedad_confirmada ? 'Gravedad confirmada' : 'Sugerida por la IA, sin confirmar'}>
      {gravedadLabel(b.gravedad)}{b.gravedad_confirmada ? '' : ' · IA'}
    </span>
  );
};

function parseServerDate(s) {
  if (!s) return new Date(NaN);
  const tieneZona = /[zZ]$|[+-]\d\d:?\d\d$/.test(s);
  return new Date(tieneZona ? s : s + 'Z');
}

const formatFecha = (s) => {
  const d = parseServerDate(s);
  return isNaN(d) ? '—' : d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const gravedadLabel = (v) => (GRAVEDADES.find(x => x.value === v) || {}).label || v;

const pillStyle = (g) => {
  const map = { baja: { c: '#2563eb', b: '#dbeafe' }, media: { c: '#d97706', b: '#fef3c7' }, alta: { c: '#ea580c', b: '#ffedd5' }, critica: { c: '#e11d48', b: '#ffe4e6' } };
  const st = map[g] || { c: '#475569', b: '#f1f5f9' };
  return { padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, color: st.c, background: st.b, whiteSpace: 'nowrap', textTransform: 'uppercase' };
};

const labelStyle = (t) => ({ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted });
const inputStyle = (t) => ({ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px', fontFamily: 'inherit' });
const primaryBtn = { padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' };
const secondaryBtn = (t) => ({ padding: '9px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' });

export default BreachesScreen;
