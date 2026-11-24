// Auditoría externa: lo que la empresa le entrega al auditor externo (ISO 27001).
// Todo lo calcula el servidor: qué documentos ve cada rol, el registro de
// actividad y el paquete. El auditor solo recibe documentos publicados.
import React, { useContext, useEffect, useState } from 'react';
import {
  Download, Eye, Lock, History, RefreshCw, ShieldCheck, ShieldAlert, FileText, Database, Package
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { salaAuditoriaAPI } from '../services/api';

// Verde del logo de NormIA: es el color de todo lo que ve o recibe el auditor.
const VERDE = '#0f766e';
const VERDE_FONDO = 'rgba(20,184,166,0.12)';
const ACCIONES = [
  ['', 'Todas las acciones'], ['creo', 'Creó'], ['modifico', 'Modificó'], ['elimino', 'Eliminó'],
  ['aprobo', 'Aprobó'], ['publico', 'Publicó'], ['acepto', 'Aceptó'], ['exporto', 'Exportó'], ['descargo', 'Descargó'],
];
const PERIODOS = [['1', 'Últimas 24 h'], ['7', 'Últimos 7 días'], ['30', 'Últimos 30 días'], ['', 'Todo']];
const COLOR_ACCION = {
  creo: '#2563eb', modifico: '#0891b2', elimino: '#dc2626', aprobo: '#7c3aed', publico: '#15803d',
  acepto: '#0d9488', exporto: '#b45309', descargo: '#64748b',
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

  const [pestana, setPestana] = useState('documentos');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  // La empresa ve todos sus documentos (los no publicados van marcados);
  // al auditor el servidor le entrega solo los publicados.
  useEffect(() => {
    salaAuditoriaAPI.contenido().then(setDatos).catch((e) => setError(e.message));
  }, []);

  const card = { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px' };
  const pestanas = [
    ['documentos', 'Documentos', FileText], ['evidencias', 'Evidencias', Database],
    ['registro', 'Registro de actividad', History], ['paquete', 'Paquete para el auditor', Package],
  ];

  return (
    <div className="sala-auditoria" style={{ animation: 'fadeIn 0.4s ease', minWidth: 0, maxWidth: '100%' }}>
      <style>{`
        .sala-auditoria * { box-sizing: border-box; }
        .sala-auditoria .sa-tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
        .sala-auditoria .sa-tabla th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: ${t.textDim}; padding: 10px 12px; }
        .sala-auditoria .sa-tabla td { padding: 10px 12px; border-top: 1px solid ${t.border}; vertical-align: top; }
        .sala-auditoria .sa-scroll { overflow-x: auto; max-width: 100%; }
      `}</style>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Auditoría externa</h1>
          {esAuditor && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: VERDE, background: VERDE_FONDO }}>
              <Eye size={14} /> Vista del auditor
            </span>
          )}
        </div>
        <p style={{ color: t.textDim, fontSize: '14px', margin: 0 }}>
          Lo que la empresa le entrega al auditor externo para la certificación ISO 27001{datos?.empresa ? ` · ${datos.empresa}` : ''}.
        </p>
      </div>

      <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', lineHeight: 1.5, background: VERDE_FONDO, color: VERDE }}>
        {esAuditor
          ? <>Ves los documentos <b>publicados</b> por la dirección y todas las evidencias de la empresa.</>
          : <>El auditor solo ve los documentos <b>publicados</b>. Los que siguen en borrador, revisión o aprobados sin publicar aparecen con un candado y no van en el paquete. Las evidencias las ve todas.</>}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        {pestanas.map(([id, nombre, Icono]) => (
          <button key={id} type="button" onClick={() => setPestana(id)} aria-pressed={pestana === id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '14px',
              background: pestana === id ? VERDE_FONDO : 'transparent', border: `1px solid ${pestana === id ? VERDE : t.border}`, color: pestana === id ? VERDE : t.textMuted }}>
            <Icono size={16} /> {nombre}
          </button>
        ))}
      </div>

      {error && <div role="alert" style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

      {pestana === 'documentos' && (datos ? <Documentos t={t} card={card} datos={datos} /> : !error && <Cargando t={t} texto="Cargando documentos…" />)}
      {pestana === 'evidencias' && (datos ? <Evidencias t={t} card={card} datos={datos} /> : !error && <Cargando t={t} texto="Cargando evidencias…" />)}
      {pestana === 'registro' && <RegistroActividad t={t} card={card} />}
      {pestana === 'paquete' && (datos ? <PaqueteAuditor t={t} card={card} datos={datos} /> : !error && <Cargando t={t} texto="Cargando…" />)}
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

function Documentos({ t, card, datos }) {
  const docs = datos.documentos;
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      {docs.length === 0 ? (
        <p style={{ padding: '32px 18px', textAlign: 'center', color: t.textDim, fontSize: '14px', margin: 0 }}>
          Aún no hay documentos. Se crean en el Generador de Documentos y la dirección los publica.
        </p>
      ) : (
        <div className="sa-scroll">
          <table className="sa-tabla" style={{ minWidth: '680px' }}>
            <thead><tr><th>Documento</th><th>Versión</th><th>Estado</th><th>Aprobado por</th></tr></thead>
            <tbody>{docs.map((d) => (
              <tr key={d.id}>
                <td>
                  <span style={{ fontWeight: 600 }}>{d.titulo}</span>
                  {d.referencia && <span style={{ display: 'block', fontSize: '11px', color: t.textDim }}>{d.referencia}</span>}
                </td>
                <td>{d.version}</td>
                <td>{d.estado_nombre}{d.estado === 'published'
                  ? d.publicado_en && <span style={{ display: 'block', fontSize: '11px', color: t.textDim }}>Publicado el {d.publicado_en}</span>
                  : <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#b45309' }}><Lock size={11} /> El auditor no lo ve</span>}</td>
                <td>{d.aprobado_por
                  ? <>{d.aprobado_por}<span style={{ display: 'block', fontSize: '11px', color: t.textDim }}>{d.aprobado_en}</span></>
                  : d.estado === 'published' ? <span style={{ color: t.textDim }} title="Se publicó antes de que la plataforma guardara quién aprueba">Sin registro</span> : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p style={{ fontSize: '12px', color: t.textDim, margin: 0, padding: '12px 18px', borderTop: `1px solid ${t.border}` }}>
        El paquete para el auditor agrega además el registro de riesgos (ISO 27001, 6.1.2 y 8.2) y cuántos trabajadores aceptaron cada documento (7.3).
      </p>
    </div>
  );
}

function Evidencias({ t, card, datos }) {
  const evs = datos.evidencias;
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      {evs.length === 0 ? (
        <p style={{ padding: '32px 18px', textAlign: 'center', color: t.textDim, fontSize: '14px', margin: 0 }}>La empresa aún no sube evidencias.</p>
      ) : (
        <div className="sa-scroll">
          <table className="sa-tabla" style={{ minWidth: '600px' }}>
            <thead><tr><th>Evidencia</th><th>Subida</th><th>Por</th><th>Tamaño</th></tr></thead>
            <tbody>{evs.map((e) => (
              <tr key={e.id}>
                <td style={{ overflowWrap: 'anywhere' }}>{e.nombre}{!e.archivo_guardado && <span style={{ display: 'block', fontSize: '11px', color: '#b45309' }}>Solo texto: el archivo original no quedó guardado</span>}</td>
                <td>{e.fecha}</td><td>{e.subido_por || '—'}</td><td>{tamano(e.tamano)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: 600, fontSize: '14px' }}><ShieldCheck size={18} /> Registro íntegro: ninguna acción fue modificada ni borrada</div>
          ) : (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 600, fontSize: '14px' }}><ShieldAlert size={18} /> El registro fue alterado: la cadena no calza desde la acción del {integ.primera_alterada?.fecha}</div>
          ))}
          <div style={{ fontSize: '12px', color: t.textDim, marginTop: '4px' }}>
            {datos?.desde ? `Registro activo desde el ${datos.desde}. Cada acción guarda un sello de la anterior: si alguien modifica una fila, la verificación lo detecta.` : 'Aún no hay acciones registradas.'}
            {datos?.incluye_soporte ? ' Como superadmin también ves las acciones de soporte; la empresa y el auditor no las ven ni van en el CSV.' : ''}
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
  // El paquete siempre lleva solo documentos publicados.
  const publicados = datos.documentos.filter((d) => d.estado === 'published');
  const conArchivo = datos.evidencias.filter((e) => e.archivo_guardado);
  const partes = [
    { id: 'documentos', nombre: 'Documentos publicados', detalle: `${publicados.length} en PDF, en la carpeta Documentos` },
    { id: 'riesgos', nombre: 'Registro de riesgos', detalle: 'PDF con todos los riesgos del mapa (ISO 27001, 6.1.2 y 8.2)' },
    { id: 'aceptacion', nombre: 'Aceptación de políticas', detalle: 'PDF con cuántos trabajadores aceptaron cada documento (7.3)' },
    { id: 'evidencias', nombre: 'Evidencias', detalle: `${datos.evidencias.length} con su índice, en la carpeta Evidencias` },
    { id: 'registro', nombre: 'Registro de actividad', detalle: 'CSV con quién creó, aprobó, publicó o descargó cada cosa, y si alguien lo alteró' },
  ];
  const [elegidas, setElegidas] = useState(partes.map((p) => p.id));
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);
  const [listo, setListo] = useState(null);

  const cambiar = (id) => setElegidas((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const nDocs = elegidas.includes('documentos') ? publicados.length : 0;
  const nEvid = elegidas.includes('evidencias') ? datos.evidencias.length : 0;
  const peso = (elegidas.includes('evidencias') ? conArchivo.reduce((s, e) => s + (e.tamano || 0), 0) : 0) + nDocs * 60 * 1024;

  const generar = async () => {
    setGenerando(true); setError(null); setListo(null);
    try {
      const archivo = await salaAuditoriaAPI.paquete(elegidas);
      descargar(archivo);
      setListo(archivo.nombre);
    } catch (e) { setError(e.message); }
    setGenerando(false);
  };

  return (
    <div style={{ ...card, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <Package size={22} color={VERDE} />
        <h2 style={{ fontSize: '18px', margin: 0 }}>Paquete para el auditor (ZIP)</h2>
      </div>
      <p style={{ fontSize: '13px', color: t.textDim, margin: '0 0 16px' }}>
        Un archivo con dos carpetas, <b>Documentos</b> y <b>Evidencias</b>, y un índice de lo que contiene. Los borradores nunca se incluyen.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '8px', marginBottom: '18px' }}>
        {partes.map((p) => {
          const marcada = elegidas.includes(p.id);
          return (
            <label key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
              background: marcada ? VERDE_FONDO : t.inputBg, border: `1px solid ${marcada ? VERDE : t.border}` }}>
              <input type="checkbox" checked={marcada} onChange={() => cambiar(p.id)} style={{ marginTop: '2px', accentColor: VERDE }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>{p.nombre}</span>
                <span style={{ fontSize: '12px', color: t.textDim }}>{p.detalle}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px 16px', borderRadius: '12px', background: t.inputBg }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Dato t={t} etiqueta="Documentos publicados" valor={nDocs} />
          <Dato t={t} etiqueta="Evidencias" valor={nEvid} />
          <Dato t={t} etiqueta="Peso aproximado" valor={tamano(peso)} />
        </div>
        <button type="button" onClick={generar} disabled={generando || elegidas.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '14px', color: 'white',
            background: elegidas.length === 0 ? '#94a3b8' : VERDE, cursor: generando ? 'wait' : elegidas.length === 0 ? 'not-allowed' : 'pointer' }}>
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

export default AuditRoomScreen;
