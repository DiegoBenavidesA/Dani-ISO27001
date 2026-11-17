// src/pages/EvidenceCenterScreen.jsx
// Centro de Evidencias: documentos de la empresa y solicitudes de evidencia.
// Las solicitudes se guardan en el servidor (antes vivían solo en el navegador
// de quien las creaba). Los conectores (AWS, Jira, etc.) se retiraron porque
// eran solo una maqueta sin integración real.
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Database, Upload, Clock, Search, Eye, X, Send, Plus, FileText, Download,
  AlertTriangle, Trash2, MoreVertical, Image as ImageIcon, CheckCircle2,
  Undo2, Bell, Sparkles, FileSpreadsheet,
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { evidenceAPI, evidenceRequestsAPI } from '../services/api';

// El servidor guarda las fechas en UTC sin zona ("2026-11-02T13:05:00"); sin la
// "Z" el navegador las lee como hora local y quedan en el futuro.
const parseServerDate = (s) => {
  if (!s) return new Date();
  const tieneZona = /[zZ]$|[+-]\d\d:?\d\d$/.test(s);
  return new Date(tieneZona ? s : s + 'Z');
};

const fechaCorta = (iso) => {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};

const haceCuanto = (fecha) => {
  const dias = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 86400000));
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  return `Hace ${dias} días`;
};

const extension = (nombre) => (nombre || '').toLowerCase().split('.').pop();
const esImagen = (nombre) => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension(nombre));
const esPdf = (nombre) => extension(nombre) === 'pdf';

const ACEPTADOS = '.pdf,.docx,.xlsx,.xlsm,.txt,.md,.csv,.png,.jpg,.jpeg,.webp';

const CONTROLES = [
  ['General', 'General (sin control específico)'],
  ['4.1', '4.1 Contexto de la organización'], ['5.2', '5.2 Política de seguridad'],
  ['6.1', '6.1 Evaluación de riesgos'], ['7.2', '7.2 Competencia'], ['7.5', '7.5 Información documentada'],
  ['9.2', '9.2 Auditoría interna'], ['9.3', '9.3 Revisión por la dirección'], ['10.2', '10.2 No conformidades'],
  ['A.5.1', 'A.5.1 Políticas de seguridad'], ['A.5.9', 'A.5.9 Inventario de activos'],
  ['A.5.15', 'A.5.15 Control de acceso'], ['A.5.19', 'A.5.19 Seguridad con proveedores'],
  ['A.5.24', 'A.5.24 Gestión de incidentes'], ['A.5.30', 'A.5.30 Continuidad TIC'],
  ['A.5.34', 'A.5.34 Privacidad y datos personales'], ['A.6.3', 'A.6.3 Concientización y capacitación'],
  ['A.6.6', 'A.6.6 Acuerdos de confidencialidad'], ['A.7.2', 'A.7.2 Control de acceso físico'],
  ['A.8.5', 'A.8.5 Autenticación segura'], ['A.8.7', 'A.8.7 Protección contra malware'],
  ['A.8.8', 'A.8.8 Gestión de vulnerabilidades'], ['A.8.13', 'A.8.13 Respaldos'],
  ['A.8.15', 'A.8.15 Registros (logs)'], ['A.8.20', 'A.8.20 Seguridad de redes'],
  ['A.8.24', 'A.8.24 Criptografía'], ['A.8.28', 'A.8.28 Desarrollo seguro'],
];

const ESTADOS_SOLICITUD = {
  pendiente: { texto: 'Pendiente', color: '#f59e0b' },
  vencida: { texto: 'Vencida', color: '#ef4444' },
  subida: { texto: 'Por revisar', color: '#8b5cf6' },
  recibida: { texto: 'Recibida', color: '#16a34a' },
};

// ------------------------------------------------------------------ Menú de tres puntos
// Se posiciona con "fixed" para que la tabla con scroll horizontal no lo recorte.
function MenuAcciones({ opciones, t, darkMode, etiqueta }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const boton = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrar = (e) => {
      if (menu.current?.contains(e.target) || boton.current?.contains(e.target)) return;
      setAbierto(false);
    };
    const cerrarConScroll = () => setAbierto(false);
    document.addEventListener('mousedown', cerrar);
    window.addEventListener('scroll', cerrarConScroll, true);
    window.addEventListener('resize', cerrarConScroll);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      window.removeEventListener('scroll', cerrarConScroll, true);
      window.removeEventListener('resize', cerrarConScroll);
    };
  }, [abierto]);

  const alternar = (e) => {
    e.stopPropagation();
    const r = boton.current.getBoundingClientRect();
    const ancho = 210;
    const alto = opciones.length * 38 + 12;
    const top = r.bottom + alto + 8 > window.innerHeight ? r.top - alto - 4 : r.bottom + 4;
    setPos({ top, left: Math.max(8, r.right - ancho) });
    setAbierto((v) => !v);
  };

  const visibles = opciones.filter(Boolean);
  if (visibles.length === 0) return null;
  return (
    <>
      <button ref={boton} onClick={alternar} aria-label={etiqueta} aria-haspopup="menu" aria-expanded={abierto}
        style={{ padding: '6px', background: abierto ? t.inputBg : 'transparent', border: `1px solid ${abierto ? t.border : 'transparent'}`, borderRadius: '8px', color: t.textMuted, cursor: 'pointer', display: 'inline-flex' }}>
        <MoreVertical size={16} />
      </button>
      {abierto && createPortal(
        <div ref={menu} role="menu" style={{ position: 'fixed', top: pos.top, left: pos.left, width: '210px', zIndex: 10060, background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '10px', boxShadow: '0 12px 30px rgba(0,0,0,0.18)', padding: '6px' }}>
          {visibles.map((op) => {
            const Icono = op.icono;
            return (
              <button key={op.texto} role="menuitem" onClick={(e) => { e.stopPropagation(); setAbierto(false); op.accion(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', background: 'transparent', border: 'none', borderRadius: '6px', color: op.peligro ? '#ef4444' : t.text, fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.inputBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <Icono size={15} /> {op.texto}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}

// ------------------------------------------------------------------ Vista previa
function VistaPrevia({ evidencia, onCerrar, t, darkMode }) {
  const [archivoUrl, setArchivoUrl] = useState(null);
  const [texto, setTexto] = useState(null);
  const [sinArchivo, setSinArchivo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState('archivo');
  const nombre = evidencia.name || '';
  const mostrable = esPdf(nombre) || esImagen(nombre);

  useEffect(() => {
    let url = null;
    let vigente = true;
    (async () => {
      setCargando(true);
      const tareaTexto = evidenceAPI.getText(evidencia.id).catch(() => null);
      if (mostrable) {
        try {
          url = await evidenceAPI.download(evidencia.id, null, true);
          if (vigente) setArchivoUrl(url);
        } catch (e) {
          if (vigente) { setSinArchivo(true); setVista('texto'); }
        }
      } else if (vigente) {
        setVista('texto');
      }
      const datos = await tareaTexto;
      if (vigente) {
        setTexto(datos?.texto ?? '');
        if (!datos && !mostrable) setError('No se pudo leer el contenido de la evidencia.');
        setCargando(false);
      }
    })();
    const cerrarConEsc = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', cerrarConEsc);
    return () => { vigente = false; window.removeEventListener('keydown', cerrarConEsc); if (url) URL.revokeObjectURL(url); };
  }, [evidencia.id, mostrable, onCerrar]);

  const descargar = async () => {
    try {
      const url = await evidenceAPI.download(evidencia.id);
      const a = document.createElement('a');
      a.href = url; a.download = nombre; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setError(e.status === 404 ? 'El archivo original no está guardado; solo se conserva el texto que lee la IA.' : e.message);
    }
  };

  const pestana = (id, etiqueta) => (
    <button onClick={() => setVista(id)} style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${vista === id ? '#004ac6' : t.border}`, background: vista === id ? '#004ac615' : 'transparent', color: vista === id ? '#004ac6' : t.textMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{etiqueta}</button>
  );

  return createPortal(
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10050, padding: '16px' }}>
      <div role="dialog" aria-modal="true" aria-label={`Vista previa de ${nombre}`} onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(960px, 100%)', height: 'min(88vh, 900px)', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '16px', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderBottom: `1px solid ${t.border}`, flexWrap: 'wrap' }}>
          <FileText size={18} color="#004ac6" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</div>
            <div style={{ fontSize: '12px', color: t.textDim }}>{evidencia.control} · {evidencia.subido_por ? `Subida por ${evidencia.subido_por}` : 'Subida manual'}</div>
          </div>
          {mostrable && !sinArchivo && <div style={{ display: 'flex', gap: '6px' }}>{pestana('archivo', 'Documento')}{pestana('texto', 'Texto que lee la IA')}</div>}
          <button onClick={descargar} style={{ padding: '8px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={14} /> Descargar</button>
          <button onClick={onCerrar} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', display: 'flex' }}><X size={20} /></button>
        </div>
        {(sinArchivo || error) && (
          <div style={{ margin: '12px 18px 0', padding: '10px 12px', borderRadius: '8px', background: '#f59e0b18', color: '#b45309', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            {error || 'El archivo original no está guardado en el almacenamiento. Se muestra el texto que se extrajo al subirlo, que es lo que lee la IA.'}
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, padding: '12px 18px 18px' }}>
          {cargando ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, fontSize: '14px' }}>Cargando…</div>
          ) : vista === 'archivo' && archivoUrl ? (
            esImagen(nombre)
              ? <div style={{ height: '100%', overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}><img src={archivoUrl} alt={nombre} style={{ maxWidth: '100%' }} /></div>
              : <iframe src={archivoUrl} title={nombre} style={{ width: '100%', height: '100%', border: `1px solid ${t.border}`, borderRadius: '8px' }} />
          ) : texto ? (
            <pre style={{ height: '100%', overflow: 'auto', margin: 0, padding: '14px', background: t.inputBg, borderRadius: '8px', color: t.text, fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>{texto}</pre>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: t.textDim, fontSize: '14px', textAlign: 'center', padding: '0 20px' }}>
              <ImageIcon size={32} />
              {esImagen(nombre)
                ? 'Es una imagen: queda guardada como respaldo, pero la IA no puede leerla.'
                : 'Este archivo no tiene texto legible (por ejemplo, un PDF escaneado). La IA no puede usarlo en la evaluación.'}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ------------------------------------------------------------------ Pantalla
function EvidenceCenterScreen() {
  const { darkMode, theme: t } = useContext(ThemeContext);
  const { user } = useAuth();
  const rol = user?.role;
  const puedeEliminar = ['superadmin', 'owner', 'admin'].includes(rol);
  const puedeEscribir = ['superadmin', 'owner', 'admin', 'manager'].includes(rol);

  const [pestana, setPestana] = useState('evidences');
  const [evidencias, setEvidencias] = useState([]);
  const [cargandoEv, setCargandoEv] = useState(true);
  const [errorEv, setErrorEv] = useState(null);
  const [filtro, setFiltro] = useState('all');
  const [busqueda, setBusqueda] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [avisos, setAvisos] = useState([]);
  const [vistaPrevia, setVistaPrevia] = useState(null);

  const [solicitudes, setSolicitudes] = useState([]);
  const [errorSol, setErrorSol] = useState(null);
  const [modalSolicitud, setModalSolicitud] = useState(false);
  const [diagnostico, setDiagnostico] = useState(null);
  const [revisando, setRevisando] = useState(false);

  const revisarAlmacenamiento = async () => {
    setRevisando(true);
    try {
      setDiagnostico(await evidenceAPI.storageStatus());
    } catch (e) {
      setDiagnostico({ error: e.message });
    } finally {
      setRevisando(false);
    }
  };

  const inputArchivo = useRef(null);
  const solicitudDeSubida = useRef(null);

  const cargarEvidencias = useCallback(async () => {
    setErrorEv(null);
    try {
      const data = await evidenceAPI.getAll();
      setEvidencias(data.map((e) => ({ ...e, lastUpdated: parseServerDate(e.lastUpdated) })));
    } catch (e) {
      setErrorEv('No se pudieron cargar las evidencias. Inténtalo de nuevo.');
    } finally {
      setCargandoEv(false);
    }
  }, []);

  const cargarSolicitudes = useCallback(async () => {
    setErrorSol(null);
    try {
      setSolicitudes(await evidenceRequestsAPI.list());
    } catch (e) {
      setErrorSol('No se pudieron cargar las solicitudes.');
    }
  }, []);

  useEffect(() => { cargarEvidencias(); cargarSolicitudes(); }, [cargarEvidencias, cargarSolicitudes]);

  // Mientras alguna evidencia se esté indexando, se refresca la lista.
  const hayIndexando = evidencias.some((e) => e.indexing_status === 'pending' || e.indexing_status === 'indexing');
  useEffect(() => {
    if (!hayIndexando) return undefined;
    const id = setInterval(cargarEvidencias, 5000);
    return () => clearInterval(id);
  }, [hayIndexando, cargarEvidencias]);

  // Los avisos de éxito se cierran solos a los 2 segundos; los de advertencia
  // y error quedan hasta que el usuario los cierre, para que alcance a leerlos.
  const agregarAviso = (tipo, texto) => {
    const id = Date.now() + Math.random();
    setAvisos((prev) => [...prev, { id, tipo, texto }]);
    if (tipo === 'ok') setTimeout(() => setAvisos((prev) => prev.filter((x) => x.id !== id)), 2000);
  };

  const subirArchivos = async (archivos) => {
    const lista = Array.from(archivos || []);
    if (lista.length === 0) return;
    const solicitudId = solicitudDeSubida.current;
    solicitudDeSubida.current = null;
    setSubiendo(true);
    let avisoSolicitud = false;
    for (const archivo of lista) {
      try {
        const fd = new FormData();
        fd.append('file', archivo);
        fd.append('control', 'General');
        fd.append('source', 'Centro de Evidencias');
        if (solicitudId) fd.append('request_id', solicitudId);
        const r = await evidenceAPI.upload(fd, null, (n, total) => agregarAviso('info', `El servidor se está activando, reintentando (${n}/${total})…`));
        if (r.es_imagen) {
          agregarAviso('warning', `"${archivo.name}" es una imagen: queda guardada como respaldo, pero la IA no puede leerla. Para que cuente en la evaluación, sube el documento en PDF, Word o Excel.`);
        } else if (!r.texto_extraido) {
          agregarAviso('warning', `"${archivo.name}" no tiene texto legible (por ejemplo, un PDF escaneado). La IA no podrá usarlo.`);
        } else {
          agregarAviso('ok', `"${archivo.name}" se subió y la IA podrá leerlo.`);
        }
        if (r.archivo_guardado === false) {
          agregarAviso('warning', `"${archivo.name}": el archivo original no se pudo guardar. ${r.motivo_no_guardado || ''} La IA puede usar su texto, pero no podrás abrir ni descargar el original.`);
        }
        if (r.solicitudes_vinculadas > 0) avisoSolicitud = true;
      } catch (e) {
        agregarAviso('error', `No se pudo subir "${archivo.name}": ${e.message}`);
      }
    }
    if (avisoSolicitud) agregarAviso('ok', 'Se avisó a quien te pidió la evidencia para que la revise.');
    setSubiendo(false);
    setArrastrando(false);
    if (inputArchivo.current) inputArchivo.current.value = '';
    await Promise.all([cargarEvidencias(), cargarSolicitudes()]);
  };

  const abrirSelector = (solicitudId = null) => {
    solicitudDeSubida.current = solicitudId;
    inputArchivo.current?.click();
  };

  const descargar = async (ev) => {
    try {
      const url = await evidenceAPI.download(ev.id);
      const a = document.createElement('a');
      a.href = url; a.download = ev.name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      agregarAviso('error', e.status === 404 ? `El archivo original de "${ev.name}" no está guardado. Usa "Ver" para leer su texto.` : e.message);
    }
  };

  const eliminar = async (ev) => {
    if (!window.confirm(`¿Eliminar "${ev.name}"? Se borra el archivo y deja de usarse en las evaluaciones con IA. Esta acción no se puede deshacer.`)) return;
    try {
      await evidenceAPI.delete(ev.id);
      setEvidencias((prev) => prev.filter((x) => x.id !== ev.id));
    } catch (e) {
      agregarAviso('error', e.message || 'No se pudo eliminar la evidencia.');
    }
  };

  const accionSolicitud = async (fn, s, mensajeOk) => {
    try {
      const r = await fn(s.id);
      agregarAviso('ok', r?.message || mensajeOk);
      await cargarSolicitudes();
    } catch (e) {
      agregarAviso('error', e.message);
    }
  };

  const eliminarSolicitud = (s) => {
    if (!window.confirm(`¿Eliminar la solicitud "${s.titulo}"? El documento subido, si lo hay, se mantiene en Evidencias.`)) return;
    accionSolicitud(evidenceRequestsAPI.remove, s, 'Solicitud eliminada');
  };

  const verDocumentoDeSolicitud = (s) => {
    const ev = evidencias.find((e) => e.id === s.evidence_id);
    if (ev) setVistaPrevia(ev);
    else agregarAviso('error', 'El documento de esta solicitud ya no está en Evidencias.');
  };

  const estadoLectura = (ev) => {
    if (ev.indexing_status === 'pending' || ev.indexing_status === 'indexing') return { texto: 'Preparando para la IA…', color: '#f59e0b', icono: Clock };
    if (ev.tiene_texto) return { texto: 'La IA puede leerla', color: '#16a34a', icono: Sparkles };
    if (esImagen(ev.name)) return { texto: 'Imagen: la IA no la lee', color: '#64748b', icono: ImageIcon };
    return { texto: 'Sin texto legible', color: '#ef4444', icono: AlertTriangle };
  };

  const evidenciasFiltradas = evidencias.filter((e) => {
    if (filtro === 'legibles' && !e.tiene_texto) return false;
    if (filtro === 'sin_texto' && e.tiene_texto) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (![e.name, e.control, e.subido_por].some((v) => v && v.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const sinArchivo = evidencias.filter((e) => e.archivo_guardado === false).length;
  const estadoDe = (s) => (s.vencida ? 'vencida' : s.estado);
  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;
  const porRevisar = solicitudes.filter((s) => s.estado === 'subida' && s.puedo_gestionar).length;
  const misPendientes = solicitudes.filter((s) => s.estado === 'pendiente' && s.soy_asignado).length;

  const tarjetas = [
    { label: 'Total de evidencias', value: evidencias.length, color: '#004ac6', icon: Database },
    { label: 'Legibles por la IA', value: evidencias.filter((e) => e.tiene_texto).length, color: '#16a34a', icon: Sparkles },
    { label: 'Solicitudes pendientes', value: pendientes, color: '#f59e0b', icon: Clock },
    { label: 'Subidas por revisar', value: porRevisar, color: '#8b5cf6', icon: Bell },
  ];

  const th = { padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', whiteSpace: 'nowrap' };
  const td = { padding: '14px 20px', verticalAlign: 'middle' };
  const colorAviso = { ok: '#16a34a', warning: '#b45309', error: '#dc2626', info: '#004ac6' };

  return (
    <div className="evidence-center-responsive" style={{ animation: 'fadeIn 0.4s ease' }}>
      <style>{`
        .evidence-center-responsive { width: 100%; max-width: 100%; min-width: 0; }
        @media (max-width: 1100px) {
          .evidence-center-responsive .evidence-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 700px) {
          .evidence-center-responsive, .evidence-center-responsive * { box-sizing: border-box; }
          .evidence-center-responsive .evidence-header { flex-direction: column !important; gap: 18px; }
          .evidence-center-responsive .evidence-header h1 { font-size: 25px !important; }
          .evidence-center-responsive .evidence-header-actions { width: 100%; display: grid !important; grid-template-columns: 1fr; gap: 10px !important; }
          .evidence-center-responsive .evidence-header-actions button { width: 100%; justify-content: center; }
          .evidence-center-responsive .evidence-stats { gap: 10px !important; }
          .evidence-center-responsive .evidence-stat-card { padding: 14px !important; }
          .evidence-center-responsive .evidence-filter-toolbar { flex-direction: column !important; align-items: stretch !important; gap: 12px; padding: 14px !important; }
          .evidence-center-responsive .evidence-filter-list { overflow-x: auto; padding-bottom: 4px; }
          .evidence-center-responsive .evidence-filter-list > * { flex: 0 0 auto; white-space: nowrap; }
          .evidence-center-responsive .evidence-search-box input { width: 100% !important; }
          .evidence-center-responsive .evidence-table-scroll table { min-width: 680px; }
          .evidence-center-responsive .evidence-modal-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
        @media (max-width: 350px) {
          .evidence-center-responsive .evidence-stats { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>

      <input ref={inputArchivo} type="file" multiple accept={ACEPTADOS} style={{ display: 'none' }} onChange={(e) => subirArchivos(e.target.files)} />

      <div className="evidence-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Centro de Evidencias</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>Documentos de la empresa que la IA usa para evaluar el cumplimiento</p>
        </div>
        {puedeEscribir && (
          <div className="evidence-header-actions" style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setModalSolicitud(true)} style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} /> Solicitar evidencia
            </button>
            <button onClick={() => abrirSelector()} disabled={subiendo} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', border: 'none', borderRadius: '10px', color: 'white', cursor: subiendo ? 'wait' : 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', opacity: subiendo ? 0.7 : 1 }}>
              <Upload size={16} /> {subiendo ? 'Subiendo…' : 'Agregar evidencia'}
            </button>
          </div>
        )}
      </div>

      {misPendientes > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: '#f59e0b15', border: '1px solid #f59e0b40', color: t.text, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Bell size={16} color="#f59e0b" />
          Tienes {misPendientes} {misPendientes === 1 ? 'solicitud' : 'solicitudes'} de evidencia por subir.
          <button onClick={() => setPestana('requests')} style={{ background: 'none', border: 'none', color: '#004ac6', fontWeight: 600, cursor: 'pointer', fontSize: '14px', padding: 0 }}>Ver solicitudes</button>
        </div>
      )}

      {puedeEliminar && sinArchivo > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: t.cardBg, border: `1px solid ${t.border}`, fontSize: '13px', color: t.text }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <span style={{ flex: 1, minWidth: '220px' }}>{sinArchivo} {sinArchivo === 1 ? 'evidencia no tiene' : 'evidencias no tienen'} el archivo original guardado: la IA usa su texto, pero no se pueden abrir ni descargar.</span>
            <button onClick={revisarAlmacenamiento} disabled={revisando} style={{ padding: '7px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{revisando ? 'Revisando…' : 'Revisar almacenamiento'}</button>
          </div>
          {diagnostico && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${t.border}`, color: diagnostico.bucket_accesible ? '#16a34a' : '#dc2626', lineHeight: 1.5 }}>
              {diagnostico.error
                ? diagnostico.error
                : diagnostico.bucket_accesible
                  ? `El almacenamiento funciona (bucket "${diagnostico.bucket}"). Las evidencias sin archivo se subieron cuando fallaba: elimínalas y vuelve a subirlas.`
                  : `El almacenamiento no funciona. ${diagnostico.detalle || ''} URL definida: ${diagnostico.url_definida ? 'sí' : 'no'}; clave definida: ${diagnostico.clave_definida ? 'sí' : 'no'}; bucket: "${diagnostico.bucket}".`}
            </div>
          )}
        </div>
      )}

      {avisos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }} aria-live="polite">
          {avisos.map((a) => (
            <div key={a.id} style={{ padding: '10px 14px', borderRadius: '10px', background: `${colorAviso[a.tipo]}12`, border: `1px solid ${colorAviso[a.tipo]}35`, color: colorAviso[a.tipo], fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ flex: 1 }}>{a.texto}</span>
              <button onClick={() => setAvisos((prev) => prev.filter((x) => x.id !== a.id))} aria-label="Cerrar aviso" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="evidence-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {tarjetas.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="evidence-stat-card" style={{ background: t.cardBg, borderRadius: '14px', padding: '18px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={18} color={stat.color} /></div>
                <span style={{ fontSize: '12px', color: t.textDim }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[{ id: 'evidences', label: 'Evidencias', icon: Database, badge: 0 }, { id: 'requests', label: 'Solicitudes', icon: Send, badge: pendientes + porRevisar }].map((tab) => {
          const Icon = tab.icon; const activa = pestana === tab.id;
          return (
            <button key={tab.id} onClick={() => setPestana(tab.id)} style={{ padding: '10px 20px', background: activa ? '#004ac620' : 'transparent', border: `1px solid ${activa ? '#004ac6' : t.border}`, borderRadius: '10px', color: activa ? '#004ac6' : t.textMuted, cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon size={16} /> {tab.label}
              {tab.badge > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      {pestana === 'evidences' && (
        <div
          onDragOver={(e) => { if (puedeEscribir) { e.preventDefault(); setArrastrando(true); } }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setArrastrando(false); }}
          onDrop={(e) => { if (puedeEscribir) { e.preventDefault(); subirArchivos(e.dataTransfer.files); } }}
          style={{ background: t.cardBg, borderRadius: '20px', border: `${arrastrando ? '2px dashed #004ac6' : `1px solid ${t.border}`}`, overflow: 'hidden', position: 'relative' }}>
          {arrastrando && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,74,198,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, color: '#004ac6', fontWeight: 600, fontSize: '16px', pointerEvents: 'none' }}>
              <Upload size={22} style={{ marginRight: '10px' }} /> Suelta los archivos para subirlos
            </div>
          )}
          <div className="evidence-filter-toolbar" style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div className="evidence-filter-list" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: t.textDim }}>Mostrar:</span>
              {[{ id: 'all', label: 'Todas' }, { id: 'legibles', label: 'Legibles por la IA' }, { id: 'sin_texto', label: 'Sin texto legible' }].map((f) => (
                <button key={f.id} onClick={() => setFiltro(f.id)} style={{ padding: '6px 12px', background: filtro === f.id ? '#004ac620' : t.inputBg, border: `1px solid ${filtro === f.id ? '#004ac6' : t.border}`, borderRadius: '6px', color: filtro === f.id ? '#004ac6' : t.textMuted, fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>{f.label}</button>
              ))}
            </div>
            <div className="evidence-search-box" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.textDim }} />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, control o persona…" style={{ padding: '8px 12px 8px 36px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '13px', width: '270px', outline: 'none' }} />
            </div>
          </div>
          <div className="evidence-table-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <th style={th}>Evidencia</th>
                  <th style={th}>Control</th>
                  <th style={th}>Lectura de la IA</th>
                  <th style={th}>Subida</th>
                  <th style={{ ...th, textAlign: 'right' }}><span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {evidenciasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: errorEv ? '#dc2626' : t.textDim, fontSize: '14px' }}>
                      {cargandoEv ? 'Cargando evidencias…'
                        : errorEv ? <>{errorEv} <button onClick={cargarEvidencias} style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '8px', background: '#004ac6', border: 'none', color: 'white', cursor: 'pointer' }}>Reintentar</button></>
                        : evidencias.length === 0 ? 'Aún no hay evidencias. Usa "Agregar evidencia" o arrastra archivos aquí. Los documentos que subas en Análisis de Brechas también aparecen en esta lista.'
                        : 'Ninguna evidencia coincide con el filtro o la búsqueda.'}
                    </td>
                  </tr>
                )}
                {evidenciasFiltradas.map((ev) => {
                  const lectura = estadoLectura(ev);
                  const IconoLectura = lectura.icono;
                  const IconoArchivo = esImagen(ev.name) ? ImageIcon : ['xlsx', 'xlsm', 'csv'].includes(extension(ev.name)) ? FileSpreadsheet : FileText;
                  return (
                    <tr key={ev.id} style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer' }} onClick={() => setVistaPrevia(ev)}>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#004ac612', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconoArchivo size={17} color="#004ac6" /></div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, overflowWrap: 'anywhere' }}>{ev.name}</div>
                            <div style={{ fontSize: '11px', color: t.textDim }}>
                              {ev.subido_por ? `Subida por ${ev.subido_por}` : ev.source}
                              {ev.archivo_guardado === false && <span style={{ color: '#b45309' }}> · Solo texto, sin archivo original</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={td}><span style={{ padding: '4px 10px', background: '#8b5cf620', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#8b5cf6', whiteSpace: 'nowrap' }}>{ev.control}</span></td>
                      <td style={td}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: lectura.color, whiteSpace: 'nowrap' }}><IconoLectura size={14} /> {lectura.texto}</span></td>
                      <td style={td}><span style={{ fontSize: '13px', color: t.textMuted, whiteSpace: 'nowrap' }} title={ev.lastUpdated.toLocaleString()}>{haceCuanto(ev.lastUpdated)}</span></td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <MenuAcciones t={t} darkMode={darkMode} etiqueta={`Acciones de ${ev.name}`} opciones={[
                          { texto: 'Ver', icono: Eye, accion: () => setVistaPrevia(ev) },
                          { texto: 'Descargar', icono: Download, accion: () => descargar(ev) },
                          puedeEliminar && { texto: 'Eliminar', icono: Trash2, peligro: true, accion: () => eliminar(ev) },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestana === 'requests' && (
        <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, fontSize: '13px', color: t.textDim, lineHeight: 1.5 }}>
            Quien recibe una solicitud la ve aquí y le llega un correo. Cuando sube un documento, la solicitud pasa a "Por revisar" y quien la pidió recibe un aviso para revisarlo y marcarlo como recibido.
          </div>
          <div className="evidence-table-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <th style={th}>Evidencia solicitada</th>
                  <th style={th}>Control</th>
                  <th style={th}>Asignada a</th>
                  <th style={th}>Fecha límite</th>
                  <th style={th}>Estado</th>
                  <th style={{ ...th, textAlign: 'right' }}><span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: errorSol ? '#dc2626' : t.textDim, fontSize: '14px' }}>
                    {errorSol || 'No hay solicitudes de evidencia.'}
                  </td></tr>
                )}
                {solicitudes.map((s) => {
                  const estado = ESTADOS_SOLICITUD[estadoDe(s)] || ESTADOS_SOLICITUD.pendiente;
                  const pendiente = s.estado === 'pendiente';
                  return (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={td}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{s.titulo}</div>
                        <div style={{ fontSize: '11px', color: t.textDim }}>
                          Pedida por {s.solicitante_nombre}{s.evidencia_nombre ? ` · Subido: ${s.evidencia_nombre}` : ''}
                        </div>
                      </td>
                      <td style={td}>{s.control ? <span style={{ padding: '4px 10px', background: '#8b5cf620', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>{s.control}</span> : <span style={{ color: t.textDim }}>—</span>}</td>
                      <td style={td}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: t.text }}>{s.asignado_nombre}{s.soy_asignado ? ' (tú)' : ''}</div>
                        <div style={{ fontSize: '11px', color: t.textDim }}>{s.asignado_email}</div>
                      </td>
                      <td style={td}><span style={{ fontSize: '13px', color: s.vencida ? '#ef4444' : t.textMuted, whiteSpace: 'nowrap' }}>{fechaCorta(s.fecha_limite)}</span></td>
                      <td style={td}><span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: `${estado.color}20`, color: estado.color, whiteSpace: 'nowrap' }}>{estado.texto}</span></td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                          {pendiente && s.soy_asignado && puedeEscribir && (
                            <button onClick={() => abrirSelector(s.id)} disabled={subiendo} style={{ padding: '6px 12px', background: '#004ac6', border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}><Upload size={13} /> Subir</button>
                          )}
                          <MenuAcciones t={t} darkMode={darkMode} etiqueta={`Acciones de la solicitud ${s.titulo}`} opciones={[
                            s.evidence_id && { texto: 'Ver documento', icono: Eye, accion: () => verDocumentoDeSolicitud(s) },
                            s.estado === 'subida' && s.puedo_gestionar && { texto: 'Marcar como recibida', icono: CheckCircle2, accion: () => accionSolicitud(evidenceRequestsAPI.markReceived, s, 'Solicitud marcada como recibida') },
                            s.estado === 'subida' && s.puedo_gestionar && { texto: 'Devolver a pendiente', icono: Undo2, accion: () => accionSolicitud(evidenceRequestsAPI.sendBack, s, 'Solicitud devuelta') },
                            pendiente && s.puedo_gestionar && { texto: 'Reenviar recordatorio', icono: Send, accion: () => accionSolicitud(evidenceRequestsAPI.remind, s, 'Recordatorio enviado') },
                            s.puedo_gestionar && { texto: 'Eliminar', icono: Trash2, peligro: true, accion: () => eliminarSolicitud(s) },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalSolicitud && (
        <ModalSolicitud t={t} darkMode={darkMode} onCerrar={() => setModalSolicitud(false)}
          onCreada={(r) => {
            setModalSolicitud(false);
            agregarAviso(r.correo_enviado ? 'ok' : 'warning', r.correo_enviado
              ? `Solicitud creada. Se envió un correo a ${r.asignado_nombre}.`
              : `Solicitud creada, pero no se pudo enviar el correo a ${r.asignado_nombre}. La verá en su Centro de Evidencias y en la campana.`);
            setPestana('requests');
            cargarSolicitudes();
          }} />
      )}

      {vistaPrevia && <VistaPrevia evidencia={vistaPrevia} t={t} darkMode={darkMode} onCerrar={() => setVistaPrevia(null)} />}
    </div>
  );
}

// ------------------------------------------------------------------ Nueva solicitud
function ModalSolicitud({ t, darkMode, onCerrar, onCreada }) {
  const [usuarios, setUsuarios] = useState(null);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const hoy = new Date();
  const minimo = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    evidenceRequestsAPI.assignableUsers().then(setUsuarios).catch((e) => { setUsuarios([]); setError(e.message); });
  }, []);

  const enviar = async (e) => {
    e.preventDefault();
    const f = e.target;
    setEnviando(true); setError(null);
    try {
      const r = await evidenceRequestsAPI.create({
        titulo: f.titulo.value.trim(),
        control: f.control.value === 'General' ? null : f.control.value,
        asignado_a: f.asignado.value,
        fecha_limite: f.fecha.value,
      });
      onCreada(r);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  const campo = { width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const etiqueta = { display: 'block', fontSize: '12px', color: t.textDim, marginBottom: '6px', fontWeight: 500 };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10050, padding: '16px' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="titulo-solicitud" style={{ width: 'min(520px, 100%)', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', border: `1px solid ${t.border}`, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: '24px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${t.border}`, paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6' }}>
            <Send size={20} /><h3 id="titulo-solicitud" style={{ fontSize: '18px', fontWeight: 600 }}>Solicitar evidencia</h3>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', display: 'flex' }}><X size={20} /></button>
        </div>
        <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="sol-titulo" style={etiqueta}>Documento o evidencia que necesitas</label>
            <input id="sol-titulo" name="titulo" placeholder="Por ejemplo: registro de proveedores firmado" minLength={3} maxLength={300} required style={campo} />
          </div>
          <div className="evidence-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="sol-control" style={etiqueta}>Control relacionado</label>
              <select id="sol-control" name="control" defaultValue="General" style={campo}>
                {CONTROLES.map(([v, txt]) => <option key={v} value={v}>{txt}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sol-fecha" style={etiqueta}>Fecha límite</label>
              <input id="sol-fecha" type="date" name="fecha" min={minimo} required style={campo} />
            </div>
          </div>
          <div>
            <label htmlFor="sol-asignado" style={etiqueta}>Asignar a</label>
            <select id="sol-asignado" name="asignado" required defaultValue="" disabled={!usuarios} style={campo}>
              <option value="" disabled>{usuarios ? 'Elige un usuario de la empresa' : 'Cargando usuarios…'}</option>
              {(usuarios || []).map((u) => <option key={u.id} value={u.id}>{u.nombre} · {u.email}</option>)}
            </select>
            <p style={{ fontSize: '11px', color: t.textDim, marginTop: '6px' }}>Solo aparecen usuarios con permiso para subir evidencias (owner, administrador y gestor). Le llegará un correo con la solicitud.</p>
          </div>
          {error && <div role="alert" style={{ padding: '10px 12px', borderRadius: '8px', background: '#ef444415', color: '#dc2626', fontSize: '13px' }}>{error}</div>}
          <div style={{ marginTop: '4px', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" onClick={onCerrar} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '10px', color: t.textMuted, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={enviando} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: enviando ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: enviando ? 0.7 : 1 }}>
              <Send size={14} /> {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default EvidenceCenterScreen;
