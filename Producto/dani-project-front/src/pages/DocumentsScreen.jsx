// src/pages/DocumentsScreen.jsx
import React, { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Plus, X } from 'lucide-react';
import { ThemeContext, useTranslation } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { documentsAPI } from '../services/api';

// Ciclo del documento (ISO 27001, 7.5): no se saltan pasos; siempre se puede volver a Borrador.
const ESTADOS = { draft: 'Borrador', review: 'En revisión', approved: 'Aprobado', published: 'Publicado' };
const SIGUIENTES = { draft: ['review'], review: ['approved', 'draft'], approved: ['published', 'review', 'draft'], published: ['draft'] };
const ROLES_APRUEBAN = ['superadmin', 'owner', 'admin'];
const ROLES_VEN_FIRMAS = ['superadmin', 'owner', 'admin', 'dpo'];

function DocumentsScreen({ setActiveScreen }) {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const tr = useTranslation();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const rol = user?.role;
  const [lectura, setLectura] = useState(null);   // documento abierto para leer
  const [firmas, setFirmas] = useState(null);     // detalle de quién aceptó
  const [errorEstado, setErrorEstado] = useState(null);

  const recargar = async () => {
    const res = await documentsAPI.getAll();
    if (res.documents) setDocuments(res.documents);
  };

  const abrir = async (doc) => {
    setLectura({ name: doc.name, version: doc.version, cargando: true });
    const d = await documentsAPI.getDocument(doc.chapter_id);
    setLectura({ name: doc.name, version: doc.version, content: d?.content || 'Este documento no tiene contenido.' });
  };

  const verFirmas = async (doc) => {
    setFirmas({ cargando: true, titulo: doc.name });
    try { setFirmas(await documentsAPI.firmas(doc.chapter_id)); }
    catch (e) { setFirmas({ error: e.message, titulo: doc.name }); }
  };


  // Cargar documentos desde backend
  React.useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { documentsAPI } = await import('../services/api');
        const res = await documentsAPI.getAll();
        if (res.documents) setDocuments(res.documents);
      } catch (err) {
        console.error("Error cargando documentos", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleUpdateStatus = async (docId, newStatus) => {
    try {
      const { documentsAPI } = await import('../services/api');
      setErrorEstado(null);
      await documentsAPI.updateStatus(docId, newStatus);
      await recargar();  // trae la versión, quién aprobó y las firmas actualizadas
    } catch (err) {
      setErrorEstado(err.message);
    }
  };

  const getStatusColor = (s) => (s === 'approved' || s === 'published') ? '#004ac6' : s === 'review' ? '#f59e0b' : '#64748b';

  return (
    <div className="normia-documents-screen" style={{ animation: 'fadeIn 0.4s ease', width: '100%', minWidth: 0 }}>
      {/* Estilos de presentación responsive; no afectan la lógica del módulo. */}
      <style>{`
        .normia-documents-screen,
        .normia-documents-screen * { box-sizing: border-box; }
        .normia-documents-screen .documents-layout > * { min-width: 0; }
        .normia-documents-screen .documents-list { scrollbar-width: thin; }
        .normia-documents-screen .documents-mobile-hint { display: none; }
        @media (max-width: 640px) {
          .normia-documents-screen .documents-header {
            flex-direction: column;
            align-items: stretch !important;
            gap: 16px;
            margin-bottom: 22px !important;
          }
          .normia-documents-screen .documents-heading { font-size: 25px !important; }
          .normia-documents-screen .documents-create-button {
            width: 100%;
            justify-content: center;
            min-height: 44px;
          }
          .normia-documents-screen .documents-layout { gap: 18px !important; }
          .normia-documents-screen .documents-mobile-hint {
            display: block;
            padding: 10px 14px;
            font-size: 12px;
            opacity: .8;
          }
        }
      `}</style>
      <div className="documents-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '16px' }}>
        <div>
          <h1 className="documents-heading" style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Gestor Documental</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>Políticas y Documentación del SGSI</p>
        </div>
        <button
          className="documents-create-button"
          onClick={() => setActiveScreen && setActiveScreen('doc-generator')}
          style={{ padding: '10px 20px', background: '#004ac6', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          <Plus size={16} />Crear Documento
        </button>
      </div>

      <div className="documents-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px', minWidth: 0 }}>
        {/* Documents List */}
        <div className="documents-list" style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflowX: 'auto', overflowY: 'hidden', minWidth: 0, maxWidth: '100%' }}>
          <div className="documents-mobile-hint" style={{ color: t.textDim }}>Desliza la tabla hacia los lados para ver todas las columnas.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(210px, 2.5fr) minmax(100px, 1fr) minmax(70px, 0.8fr) minmax(95px, 1fr) minmax(75px, 1fr)', minWidth: '680px', padding: '14px 24px', background: t.hoverBg, borderBottom: `1px solid ${t.border}`, fontSize: '11px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Documento</span><span>Estado</span><span>Versión</span><span>Actualizado</span><span>Aceptación</span>
          </div>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: t.textDim }}>Cargando documentos...</div>
          ) : documents.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: t.textDim }}>No hay documentos. Usa el botón superior para generar uno.</div>
          ) : documents.map((doc) => (
            <div key={doc.id || doc.chapter_id} style={{ display: 'grid', gridTemplateColumns: 'minmax(210px, 2.5fr) minmax(100px, 1fr) minmax(70px, 0.8fr) minmax(95px, 1fr) minmax(75px, 1fr)', minWidth: '680px', padding: '16px 24px', borderBottom: `1px solid ${t.border}`, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} color="#3b82f6" /></div>
                <span style={{ minWidth: 0 }}>
                  <button type="button" onClick={() => abrir(doc)} title="Leer el documento"
                    style={{ fontWeight: 600, fontSize: '14px', overflowWrap: 'anywhere', background: 'none', border: 'none', padding: 0, color: '#2563eb', cursor: 'pointer', textAlign: 'left' }}>
                    {doc.name}
                  </button>
                  {doc.aprobado_por && <span style={{ display: 'block', fontSize: '11px', color: t.textDim }}>Aprobado por {doc.aprobado_por} el {doc.aprobado_en}</span>}
                </span>
              </div>
              <select
                value={doc.status}
                aria-label={`Estado de ${doc.name}`}
                onChange={(e) => handleUpdateStatus(doc.chapter_id, e.target.value)}
                style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: `${getStatusColor(doc.status)}22`, color: getStatusColor(doc.status), textTransform: 'capitalize', width: 'fit-content', border: 'none', cursor: 'pointer', outline: 'none' }}
              >
                <option value={doc.status}>{ESTADOS[doc.status] || doc.status}</option>
                {(SIGUIENTES[doc.status] || []).map((s) => (
                  <option key={s} value={s} disabled={['approved', 'published'].includes(s) && !ROLES_APRUEBAN.includes(rol)}>
                    {s === 'draft' ? 'Volver a Borrador' : `Pasar a ${ESTADOS[s]}`}
                  </option>
                ))}
              </select>
              <span style={{ color: t.textMuted, fontSize: '13px' }}>v{doc.version}</span>
              <span style={{ color: t.textDim, fontSize: '13px' }}>{doc.updated}</span>
              <span style={{ fontSize: '13px' }}>
                {!doc.firmas ? <span style={{ color: t.textDim }} title="Solo los documentos publicados se aceptan en el Portal de Empleados">—</span>
                  : ROLES_VEN_FIRMAS.includes(rol)
                    ? <button type="button" onClick={() => verFirmas(doc)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>{doc.firmas.aceptaron} de {doc.firmas.total}</button>
                    : `${doc.firmas.aceptaron} de ${doc.firmas.total}`}
              </span>
            </div>
          ))}
        </div>
        {errorEstado && <div role="alert" style={{ color: '#dc2626', fontSize: '13px' }}>{errorEstado}</div>}

      </div>

      {lectura && <Modal t={t} titulo={lectura.name} subtitulo={lectura.version ? `Versión ${lectura.version}` : ''} onClose={() => setLectura(null)}>
        {lectura.cargando ? <p style={{ color: t.textDim }}>Cargando…</p>
          : <div className="documento-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{lectura.content}</ReactMarkdown></div>}
      </Modal>}

      {firmas && <Modal t={t} titulo={`Aceptación: ${firmas.titulo}`} subtitulo={firmas.version ? `Versión vigente ${firmas.version} · ${firmas.aceptaron} de ${firmas.total} personas` : ''} onClose={() => setFirmas(null)}>
        {firmas.cargando ? <p style={{ color: t.textDim }}>Cargando…</p>
          : firmas.error ? <p style={{ color: '#dc2626' }}>{firmas.error}</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr style={{ textAlign: 'left', color: t.textDim }}><th style={{ padding: '6px' }}>Persona</th><th style={{ padding: '6px' }}>Estado</th><th style={{ padding: '6px' }}>Fecha</th></tr></thead>
              <tbody>
                {firmas.personas.map((p) => (
                  <tr key={p.email} style={{ borderTop: `1px solid ${t.border}` }}>
                    <td style={{ padding: '6px' }}>{p.nombre}<span style={{ display: 'block', fontSize: '11px', color: t.textDim }}>{p.email}</span></td>
                    <td style={{ padding: '6px', fontWeight: 600, color: p.acepto_vigente ? '#15803d' : p.version_aceptada ? '#b45309' : '#dc2626' }}>
                      {p.acepto_vigente ? 'Aceptó' : p.version_aceptada ? `Falta: aceptó la ${p.version_aceptada}` : 'Falta'}
                    </td>
                    <td style={{ padding: '6px', color: t.textDim }}>{p.fecha || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        <p style={{ fontSize: '11px', color: t.textDim, marginTop: '12px' }}>Evidencia de concientización (ISO 27001, 7.3). Solo la ven la dirección y el delegado de datos.</p>
      </Modal>}

      <style>{`
        .documento-markdown h1 { font-size: 20px; margin: 0 0 12px; }
        .documento-markdown h2 { font-size: 16px; margin: 18px 0 8px; }
        .documento-markdown table { border-collapse: collapse; width: 100%; margin: 8px 0 14px; font-size: 13px; }
        .documento-markdown th, .documento-markdown td { border: 1px solid rgba(100,116,139,0.35); padding: 6px 8px; text-align: left; vertical-align: top; }
      `}</style>
    </div>
  );
}

function Modal({ t, titulo, subtitulo, onClose, children }) {
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10050, padding: '16px' }}>
      <div role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(820px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: t.text }}>{titulo}</div>
            {subtitulo && <div style={{ fontSize: '12px', color: t.textDim }}>{subtitulo}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: t.textDim, cursor: 'pointer', display: 'flex' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', color: t.text, lineHeight: 1.6, fontSize: '14px' }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default DocumentsScreen;