// Sala de Auditoría: lo que la empresa le muestra al auditor externo (ISO 27001).
// Todo lo que se ve aquí lo calcula el servidor: carpetas, vista del auditor,
// registro de actividad y paquete. La pantalla no inventa números.
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Download, Folder, Eye, Lock, History, CheckCircle2, Clock,
  X, RefreshCw, ShieldCheck, ShieldAlert, FileText, Database, Package
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { salaAuditoriaAPI } from '../services/api';

const MORADO = '#7c3aed';
const ACCIONES = [
  ['', 'Todas las acciones'], ['creo', 'Creó'], ['modifico', 'Modificó'], ['elimino', 'Eliminó'],
  ['aprobo', 'Aprobó'], ['publico', 'Publicó'], ['acepto', 'Aceptó'], ['exporto', 'Exportó'], ['descargo', 'Descargó'],
];
const PERIODOS = [['1', 'Últimas 24 h'], ['7', 'Últimos 7 días'], ['30', 'Últimos 30 días'], ['', 'Todo']];
const COLOR_ACCION = {
  creo: '#2563eb', modifico: '#0891b2', elimino: '#dc2626', aprobo: '#7c3aed', publico: '#15803d',
  acepto: '#0d9488', exporto: '#b45309', descargo: '#64748b',
};
const ESTADO_CARPETA = {
  cumple: { texto: 'Cumple la meta', color: '#15803d', Icono: CheckCircle2 },
  bajo: { texto: 'Bajo la meta', color: '#b45309', Icono: Clock },
  sin_evaluar: { texto: 'Sin evaluar', color: '#64748b', Icono: Clock },
};
const ROLES = { superadmin: 'Superadmin', owner: 'Dueño', admin: 'Administrador', manager: 'Encargado', auditor: 'Auditor', dpo: 'Delegado', employee: 'Trabajador' };

const tamano = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const descargar = ({ url, nombre }) => {
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

function AuditRoomScreen() {
  const { theme: t } = useContext(ThemeContext);
  const { user } = useAuth();
  const esAuditor = user?.role === 'auditor';

  const [vistaAuditor, setVistaAuditor] = useState(true);
  const [pestana, setPestana] = useState('carpetas');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [abierta, setAbierta] = useState(null);   // carpeta abierta en el detalle

  const cargar = useCallback(async () => {
    setError(null);
    try { setDatos(await salaAuditoriaAPI.carpetas(esAuditor || vistaAuditor)); }
    catch (e) { setError(e.message); }
  }, [esAuditor, vistaAuditor]);

  useEffect(() => { cargar(); }, [cargar]);

  const card = { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px' };
  const enVistaAuditor = esAuditor || vistaAuditor;

  return (
    <div className="sala-auditoria" style={{ animation: 'fadeIn 0.4s ease', minWidth: 0, maxWidth: '100%' }}>
      <style>{`
        .sala-auditoria * { box-sizing: border-box; }
        .sala-auditoria .sa-tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
        .sala-auditoria .sa-tabla th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: ${t.textDim}; padding: 10px 12px; }
        .sala-auditoria .sa-tabla td { padding: 10px 12px; border-top: 1px solid ${t.border}; vertical-align: top; }
        .sala-auditoria .sa-scroll { overflow-x: auto; max-width: 100%; }
        @media (max-width: 640px) {
          .sala-auditoria .sa-cabecera { flex-direction: column; align-items: stretch !important; }
        }
      `}</style>

      {/* Cabecera */}
      <div className="sa-cabecera" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Sala de Auditoría</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              color: enVistaAuditor ? MORADO : '#2563eb', background: enVistaAuditor ? 'rgba(124,58,237,0.12)' : 'rgba(37,99,235,0.12)' }}>
              {enVistaAuditor ? <Eye size={14} /> : <Lock size={14} />}
              {enVistaAuditor ? 'Vista del auditor' : 'Vista completa'}
            </span>
          </div>
          <p style={{ color: t.textDim, fontSize: '14px', margin: 0 }}>
            Lo que la empresa le muestra al auditor externo para la certificación ISO 27001{datos?.empresa ? ` · ${datos.empresa}` : ''}.
          </p>
        </div>
        {!esAuditor && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', ...card, borderRadius: '12px', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Ver como auditor</span>
            <input type="checkbox" checked={vistaAuditor} onChange={(e) => setVistaAuditor(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: MORADO }} />
          </label>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', lineHeight: 1.5,
        background: enVistaAuditor ? 'rgba(124,58,237,0.08)' : 'rgba(37,99,235,0.08)', color: enVistaAuditor ? MORADO : '#1d4ed8' }}>
        {enVistaAuditor
          ? <>Solo se muestran los documentos <b>publicados</b> por la dirección. Las evidencias se muestran todas: son registros de la empresa y no pasan por aprobación.{esAuditor && ' Con tu rol esta es la única vista disponible.'}</>
          : <>Vista completa: incluye borradores y documentos en revisión. El auditor no los ve.</>}
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        {[['carpetas', 'Carpetas', Folder], ['registro', 'Registro de actividad', History], ['paquete', 'Paquete para el auditor', Package]].map(([id, nombre, Icono]) => (
          <button key={id} type="button" onClick={() => setPestana(id)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '14px',
              background: pestana === id ? 'rgba(124,58,237,0.12)' : 'transparent', border: `1px solid ${pestana === id ? MORADO : t.border}`, color: pestana === id ? MORADO : t.textMuted }}>
            <Icono size={16} /> {nombre}
          </button>
        ))}
      </div>

      {error && <div role="alert" style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

      {pestana === 'carpetas' && (
        !datos ? <Cargando t={t} texto="Cargando carpetas…" /> : (
          <>
            <p style={{ fontSize: '13px', color: t.textDim, margin: '0 0 12px' }}>
              El puntaje de cada cláusula sale del Análisis de Brechas (Sí vale 1, Parcial 0,5, No 0). La meta de la empresa es {datos.meta} %.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))', gap: '14px' }}>
              {datos.carpetas.map((c) => <TarjetaCarpeta key={c.id} c={c} t={t} card={card} onClick={() => setAbierta(c)} />)}
            </div>
          </>
        )
      )}

      {pestana === 'registro' && <RegistroActividad t={t} card={card} />}

      {pestana === 'paquete' && (datos ? <PaqueteAuditor t={t} card={card} datos={datos} /> : <Cargando t={t} texto="Cargando…" />)}

      {abierta && <DetalleCarpeta c={abierta} t={t} meta={datos?.meta} vistaAuditor={enVistaAuditor} onClose={() => setAbierta(null)} />}
    </div>
  );
}

function Cargando({ t, texto }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '48px', color: t.textDim, fontSize: '14px' }}>
      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> {texto}
    </div>
  );
}

function TarjetaCarpeta({ c, t, card, onClick }) {
  const esEvidencias = c.tipo === 'evidencias';
  const est = ESTADO_CARPETA[c.estado] || ESTADO_CARPETA.sin_evaluar;
  return (
    <button type="button" onClick={onClick}
      style={{ ...card, padding: '18px', textAlign: 'left', cursor: 'pointer', color: t.text, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {esEvidencias ? <Database size={20} color={MORADO} /> : <Folder size={20} color={MORADO} />}
        </span>
        {!esEvidencias && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: est.color, background: `${est.color}15`, padding: '3px 9px', borderRadius: '20px' }}>
            <est.Icono size={12} /> {est.texto}
          </span>
        )}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{c.nombre}</div>
      {esEvidencias ? (
        <div style={{ fontSize: '12px', color: t.textDim }}>{c.evidencias.length} evidencias · {tamano(c.evidencias.reduce((s, e) => s + (e.tamano || 0), 0))}</div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: t.textDim, lineHeight: 1.5 }}>
            {c.cumplen} de {c.total_preguntas} preguntas cumplen<br />
            {c.documentos.length} {c.documentos.length === 1 ? 'documento' : 'documentos'}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: est.color, whiteSpace: 'nowrap' }}>{c.puntaje == null ? '—' : `${c.puntaje} %`}</div>
        </div>
      )}
    </button>
  );
}

function DetalleCarpeta({ c, t, meta, vistaAuditor, onClose }) {
  const esEvidencias = c.tipo === 'evidencias';
  return (
    <Modal t={t} titulo={c.nombre} onClose={onClose}
      subtitulo={esEvidencias ? `${c.evidencias.length} evidencias` : (c.puntaje == null ? 'Sin evaluar en el Análisis de Brechas' : `${c.puntaje} % · meta ${meta} % · ${c.cumplen} de ${c.total_preguntas} preguntas cumplen (las parciales valen media)`)}>
      {esEvidencias ? (
        c.evidencias.length === 0 ? <p style={{ color: t.textDim }}>La empresa aún no sube evidencias.</p> : (
          <div className="sa-scroll">
            <table className="sa-tabla">
              <thead><tr><th>Evidencia</th><th>Subida</th><th>Por</th><th>Tamaño</th></tr></thead>
              <tbody>{c.evidencias.map((e) => (
                <tr key={e.id}>
                  <td style={{ overflowWrap: 'anywhere' }}>{e.nombre}{!e.archivo_guardado && <span style={{ display: 'block', fontSize: '11px', color: '#b45309' }}>Solo texto: el archivo original no quedó guardado</span>}</td>
                  <td>{e.fecha}</td><td>{e.subido_por || '—'}</td><td>{tamano(e.tamano)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )
      ) : (
        <>
          <h3 style={{ fontSize: '14px', margin: '0 0 8px' }}>Documentos de esta cláusula</h3>
          {c.documentos.length === 0 ? (
            <p style={{ color: t.textDim, fontSize: '13px', margin: 0 }}>
              {c.id === 'A' ? 'Los controles del Anexo A se demuestran con evidencias, no con documentos del Generador.'
                : vistaAuditor ? 'No hay documentos publicados de esta cláusula. Los borradores no se muestran al auditor.'
                : 'No hay documentos de esta cláusula. Se crean en el Generador de Documentos.'}
            </p>
          ) : (
            <div className="sa-scroll">
              <table className="sa-tabla">
                <thead><tr><th>Documento</th><th>Versión</th><th>Estado</th><th>Aprobado por</th></tr></thead>
                <tbody>{c.documentos.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.titulo}</td><td>{d.version}</td>
                    <td>{d.estado_nombre}{d.publicado_en && <span style={{ display: 'block', fontSize: '11px', color: t.textDim }}>Publicado el {d.publicado_en}</span>}</td>
                    <td>{d.aprobado_por ? <>{d.aprobado_por}<span style={{ display: 'block', fontSize: '11px', color: t.textDim }}>{d.aprobado_en}</span></> : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {c.id === '6' && <p style={{ fontSize: '12px', color: t.textDim, marginTop: '12px' }}>El paquete para el auditor agrega el registro de riesgos en esta carpeta.</p>}
          {c.id === '7' && <p style={{ fontSize: '12px', color: t.textDim, marginTop: '12px' }}>El paquete para el auditor agrega cuántos trabajadores aceptaron cada política (concientización, 7.3).</p>}
        </>
      )}
    </Modal>
  );
}

function RegistroActividad({ t, card }) {
  const [accion, setAccion] = useState('');
  const [dias, setDias] = useState('30');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [bajando, setBajando] = useState(false);

  useEffect(() => {
    let vigente = true;
    setDatos(null); setError(null);
    salaAuditoriaAPI.registro({ accion, dias }).then((d) => vigente && setDatos(d)).catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [accion, dias]);

  const bajarCsv = async () => {
    setBajando(true);
    try { descargar(await salaAuditoriaAPI.registroCsv()); } catch (e) { setError(e.message); }
    setBajando(false);
  };

  const sel = { padding: '8px 10px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '13px' };
  const integ = datos?.integridad;

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          {integ && (integ.total === 0 ? null : integ.integra ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: 600, fontSize: '14px' }}><ShieldCheck size={18} /> Registro íntegro: {integ.verificadas} acciones verificadas</div>
          ) : (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 600, fontSize: '14px' }}><ShieldAlert size={18} /> El registro fue alterado: la cadena no calza desde la acción del {integ.primera_alterada?.fecha}</div>
          ))}
          <div style={{ fontSize: '12px', color: t.textDim, marginTop: '4px' }}>
            {datos?.desde ? `Registro activo desde el ${datos.desde}. Cada acción guarda un sello de la anterior: si alguien modifica una fila, la verificación lo detecta.` : 'Aún no hay acciones registradas.'}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <select value={accion} onChange={(e) => setAccion(e.target.value)} aria-label="Filtrar por acción" style={sel}>
            {ACCIONES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
          <select value={dias} onChange={(e) => setDias(e.target.value)} aria-label="Filtrar por período" style={sel}>
            {PERIODOS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
          <button type="button" onClick={bajarCsv} disabled={bajando || !datos?.desde}
            style={{ ...sel, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
            <Download size={14} /> Descargar CSV
          </button>
        </div>
      </div>
      {error && <div role="alert" style={{ color: '#dc2626', fontSize: '13px', padding: '12px 18px' }}>{error}</div>}
      {!datos && !error ? <Cargando t={t} texto="Cargando registro…" /> : datos && (
        datos.filas.length === 0 ? <p style={{ padding: '32px 18px', textAlign: 'center', color: t.textDim, fontSize: '14px', margin: 0 }}>No hay acciones con estos filtros.</p> : (
          <div className="sa-scroll">
            <table className="sa-tabla" style={{ minWidth: '760px' }}>
              <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Recurso</th><th>Detalle</th><th>IP</th></tr></thead>
              <tbody>{datos.filas.map((f) => (
                <tr key={f.id}>
                  <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '12px' }}>{f.fecha}</td>
                  <td>{f.usuario}<span style={{ display: 'block', fontSize: '11px', color: t.textDim }}>{ROLES[f.rol] || f.rol}{f.email && f.email !== f.usuario ? ` · ${f.email}` : ''}</span></td>
                  <td><span style={{ fontSize: '12px', fontWeight: 600, color: COLOR_ACCION[f.accion] || t.text, background: `${COLOR_ACCION[f.accion] || '#64748b'}15`, padding: '3px 9px', borderRadius: '6px', whiteSpace: 'nowrap' }}>{f.accion_nombre}</span></td>
                  <td style={{ overflowWrap: 'anywhere' }}><span style={{ display: 'block', fontSize: '11px', color: t.textDim, textTransform: 'capitalize' }}>{f.tipo_recurso}</span>{f.recurso}</td>
                  <td style={{ color: t.textDim, overflowWrap: 'anywhere' }}>{f.detalle || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>{f.ip || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function PaqueteAuditor({ t, card, datos }) {
  const todas = datos.carpetas.map((c) => c.id);
  const [elegidas, setElegidas] = useState(todas);
  const [conRegistro, setConRegistro] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);
  const [listo, setListo] = useState(null);

  // El paquete siempre lleva solo documentos publicados, aunque la pantalla esté en vista completa.
  const publicados = (c) => (c.documentos || []).filter((d) => d.estado === 'published').length;
  const cambiar = (id) => setElegidas((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const elegidasObj = datos.carpetas.filter((c) => elegidas.includes(c.id));
  const nDocs = elegidasObj.reduce((s, c) => s + publicados(c), 0);
  const evid = elegidasObj.find((c) => c.tipo === 'evidencias');
  const peso = evid ? evid.evidencias.filter((e) => e.archivo_guardado).reduce((s, e) => s + (e.tamano || 0), 0) : 0;

  const generar = async () => {
    setGenerando(true); setError(null); setListo(null);
    try {
      const archivo = await salaAuditoriaAPI.paquete(elegidas, conRegistro);
      descargar(archivo);
      setListo(archivo.nombre);
    } catch (e) { setError(e.message); }
    setGenerando(false);
  };

  const detalle = (c) => {
    if (c.tipo === 'evidencias') return `${c.evidencias.length} evidencias con su índice`;
    const extra = c.id === '6' ? ' + registro de riesgos' : c.id === '7' ? ' + aceptación de políticas' : '';
    return `${publicados(c)} ${publicados(c) === 1 ? 'documento publicado' : 'documentos publicados'}${extra}`;
  };

  return (
    <div style={{ ...card, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <Package size={22} color={MORADO} />
        <h2 style={{ fontSize: '18px', margin: 0 }}>Paquete para el auditor (ZIP)</h2>
      </div>
      <p style={{ fontSize: '13px', color: t.textDim, margin: '0 0 16px' }}>
        Una carpeta por cláusula con los documentos <b>publicados</b> en PDF, las evidencias y un resumen con el puntaje de cada cláusula. Los borradores nunca se incluyen.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Carpetas</span>
        <button type="button" onClick={() => setElegidas(elegidas.length === todas.length ? [] : todas)}
          style={{ background: 'none', border: 'none', color: MORADO, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          {elegidas.length === todas.length ? 'Quitar todas' : 'Elegir todas'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '8px', marginBottom: '14px' }}>
        {datos.carpetas.map((c) => (
          <label key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
            background: elegidas.includes(c.id) ? 'rgba(124,58,237,0.08)' : t.inputBg, border: `1px solid ${elegidas.includes(c.id) ? MORADO : t.border}` }}>
            <input type="checkbox" checked={elegidas.includes(c.id)} onChange={() => cambiar(c.id)} style={{ marginTop: '2px', accentColor: MORADO }} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>{c.nombre}</span>
              <span style={{ fontSize: '12px', color: t.textDim }}>{detalle(c)}</span>
            </span>
          </label>
        ))}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '18px', cursor: 'pointer' }}>
        <input type="checkbox" checked={conRegistro} onChange={(e) => setConRegistro(e.target.checked)} style={{ accentColor: MORADO }} />
        Incluir el registro de actividad (CSV) y el resultado de su verificación
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px 16px', borderRadius: '12px', background: t.inputBg }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Dato t={t} etiqueta="Documentos publicados" valor={nDocs} />
          <Dato t={t} etiqueta="Evidencias" valor={evid ? evid.evidencias.length : 0} />
          <Dato t={t} etiqueta="Peso aproximado" valor={tamano(peso + nDocs * 60 * 1024)} />
        </div>
        <button type="button" onClick={generar} disabled={generando || elegidas.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '14px', color: 'white',
            background: elegidas.length === 0 ? '#94a3b8' : MORADO, cursor: generando ? 'wait' : elegidas.length === 0 ? 'not-allowed' : 'pointer' }}>
          {generando ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
          {generando ? 'Generando…' : 'Descargar paquete'}
        </button>
      </div>
      {listo && <p style={{ fontSize: '13px', color: '#15803d', margin: '12px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Se descargó {listo}. La descarga quedó en el registro de actividad.</p>}
      {error && <p role="alert" style={{ fontSize: '13px', color: '#dc2626', margin: '12px 0 0' }}>{error}</p>}
    </div>
  );
}

function Dato({ t, etiqueta, valor }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: t.textDim }}>{etiqueta}</div>
      <div style={{ fontSize: '20px', fontWeight: 700 }}>{valor}</div>
    </div>
  );
}

function Modal({ t, titulo, subtitulo, onClose, children }) {
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10050, padding: '16px' }}>
      <div role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}
        className="sala-auditoria"
        style={{ width: 'min(820px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: t.text }}>{titulo}</div>
            {subtitulo && <div style={{ fontSize: '12px', color: t.textDim }}>{subtitulo}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: t.textDim, cursor: 'pointer', display: 'flex' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', color: t.text, fontSize: '14px' }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default AuditRoomScreen;
