// src/pages/DocumentsScreen.jsx
import React, { useState, useContext } from 'react';
import { FileText, Plus } from 'lucide-react';
import { ThemeContext, useTranslation } from '../contexts/ThemeContext';

function DocumentsScreen({ setActiveScreen }) {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const tr = useTranslation();
  
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


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
      await documentsAPI.updateStatus(docId, newStatus);
      setDocuments(prev => prev.map(d => d.chapter_id === docId ? { ...d, status: newStatus } : d));
    } catch (err) {
      alert("Error actualizando estado. Recuerda que necesitas ser Administrador.");
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
            <span>Documento</span><span>Estado</span><span>Versión</span><span>Actualizado</span><span>Firmas</span>
          </div>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: t.textDim }}>Cargando documentos...</div>
          ) : documents.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: t.textDim }}>No hay documentos. Usa el botón superior para generar uno.</div>
          ) : documents.map((doc) => (
            <div key={doc.id || doc.chapter_id} style={{ display: 'grid', gridTemplateColumns: 'minmax(210px, 2.5fr) minmax(100px, 1fr) minmax(70px, 0.8fr) minmax(95px, 1fr) minmax(75px, 1fr)', minWidth: '680px', padding: '16px 24px', borderBottom: `1px solid ${t.border}`, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} color="#3b82f6" /></div>
                <span style={{ fontWeight: 500, fontSize: '14px', overflowWrap: 'anywhere' }}>{doc.name}</span>
              </div>
              <select 
                value={doc.status} 
                onChange={(e) => handleUpdateStatus(doc.chapter_id, e.target.value)}
                style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: `${getStatusColor(doc.status)}22`, color: getStatusColor(doc.status), textTransform: 'capitalize', width: 'fit-content', border: 'none', cursor: 'pointer', outline: 'none' }}
              >
                <option value="draft">Borrador</option>
                <option value="review">Revisión</option>
                <option value="approved">Aprobado</option>
                <option value="published">Publicado</option>
              </select>
              <span style={{ color: t.textMuted, fontSize: '13px' }}>v{doc.version}</span>
              <span style={{ color: t.textDim, fontSize: '13px' }}>{doc.updated}</span>
              <span style={{ fontSize: '13px' }}>{doc.signatures}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default DocumentsScreen;