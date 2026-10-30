// src/pages/EvidenceCenterScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  Database, Zap, Upload, Clock, Search, Eye, RefreshCw, 
  CheckCircle2, XCircle, X, Send, Plus, ExternalLink,
  Sparkles, FileText, Download, Copy, AlertTriangle
} from 'lucide-react';
import { ThemeContext, useTranslation } from '../contexts/ThemeContext';

const labels = {
  en: {
    title: 'Evidence Center', subtitle: 'Automated evidence collection and management',
    evidences: 'Evidences', upload: 'Bulk Upload', requests: 'Evidence Requests', connectors: 'Connectors',
    totalEvidences: 'Total Evidences', autoCollected: 'Auto-Collected', manualUpload: 'Manual Upload',
    pendingRequests: 'Pending Requests', addEvidence: 'Add Evidence',
    health: 'Health', fresh: 'Fresh', expiringSoon: 'Expiring Soon', expired: 'Expired',
    lastUpdated: 'Last Updated', daysAgo: 'days ago', validFor: 'Valid for', days: 'days',
    needsUpdate: 'Needs Update', updateNow: 'Update Now',
    control: 'Control', type: 'Type', source: 'Source', actions: 'Actions',
    view: 'View', download: 'Download', delete: 'Delete',
    all: 'All', automatic: 'Automatic', manual: 'Manual',
    filterBy: 'Filter by', searchEvidences: 'Search evidences...',
    connected: 'Connected', error: 'Error', pending: 'Pending', configure: 'Configure',
    reconnect: 'Reconnect', lastSync: 'Last sync',
    requestEvidence: 'Request Evidence', assignTo: 'Assign to', dueDate: 'Due Date',
    sendRequest: 'Send Request', magicLink: 'Magic Link', copyLink: 'Copy Link',
    resendReminder: 'Resend Reminder', viewSubmission: 'View Submission',
    sourceDetails: 'Source Details', technicalDetails: 'Technical Details',
    collectedFrom: 'Collected from', timestamp: 'Timestamp', endpoint: 'Endpoint',
    copyJson: 'Copy JSON',
  },
  es: {
    title: 'Centro de Evidencias', subtitle: 'Recolección y gestión automatizada de evidencias',
    evidences: 'Evidencias', upload: 'Carga Masiva', requests: 'Solicitudes', connectors: 'Conectores',
    totalEvidences: 'Total Evidencias', autoCollected: 'Auto-Recolectadas', manualUpload: 'Carga Manual',
    pendingRequests: 'Solicitudes Pendientes', addEvidence: 'Agregar Evidencia',
    health: 'Salud', fresh: 'Vigente', expiringSoon: 'Por Vencer', expired: 'Vencida',
    lastUpdated: 'Última Actualización', daysAgo: 'días atrás', validFor: 'Válida por', days: 'días',
    needsUpdate: 'Necesita Actualización', updateNow: 'Actualizar Ahora',
    control: 'Control', type: 'Tipo', source: 'Fuente', actions: 'Acciones',
    view: 'Ver', download: 'Descargar', delete: 'Eliminar',
    all: 'Todos', automatic: 'Automático', manual: 'Manual',
    filterBy: 'Filtrar por', searchEvidences: 'Buscar evidencias...',
    connected: 'Conectado', error: 'Error', pending: 'Pendiente', configure: 'Configurar',
    reconnect: 'Reconectar', lastSync: 'Última sincronización',
    requestEvidence: 'Solicitar Evidencia', assignTo: 'Asignar a', dueDate: 'Fecha Límite',
    sendRequest: 'Enviar Solicitud', magicLink: 'Enlace Mágico', copyLink: 'Copiar Enlace',
    resendReminder: 'Reenviar Recordatorio', viewSubmission: 'Ver Envío',
    sourceDetails: 'Detalles de Origen', technicalDetails: 'Detalles Técnicos',
    collectedFrom: 'Recolectado de', timestamp: 'Marca de tiempo', endpoint: 'Endpoint',
    copyJson: 'Copiar JSON',
  },
  pt: {
    title: 'Centro de Evidências', subtitle: 'Coleta e gestão automatizada de evidências',
    evidences: 'Evidências', upload: 'Upload em Massa', requests: 'Solicitações', connectors: 'Conectores',
    totalEvidences: 'Total de Evidências', autoCollected: 'Auto-Coletadas', manualUpload: 'Upload Manual',
    pendingRequests: 'Solicitações Pendentes', addEvidence: 'Adicionar Evidência',
    health: 'Saúde', fresh: 'Vigente', expiringSoon: 'Expirando', expired: 'Expirada',
    lastUpdated: 'Última Atualização', daysAgo: 'dias atrás', validFor: 'Válida por', days: 'dias',
    needsUpdate: 'Precisa Atualização', updateNow: 'Atualizar Agora',
    control: 'Controle', type: 'Tipo', source: 'Fonte', actions: 'Ações',
    view: 'Ver', download: 'Baixar', delete: 'Excluir',
    all: 'Todos', automatic: 'Automático', manual: 'Manual',
    filterBy: 'Filtrar por', searchEvidences: 'Buscar evidências...',
    connected: 'Conectado', error: 'Erro', pending: 'Pendente', configure: 'Configurar',
    reconnect: 'Reconectar', lastSync: 'Última sincronização',
    requestEvidence: 'Solicitar Evidência', assignTo: 'Atribuir a', dueDate: 'Data Limite',
    sendRequest: 'Enviar Solicitação', magicLink: 'Link Mágico', copyLink: 'Copiar Link',
    resendReminder: 'Reenviar Lembrete', viewSubmission: 'Ver Envio',
    sourceDetails: 'Detalhes da Origem', technicalDetails: 'Detalhes Técnicos',
    collectedFrom: 'Coletado de', timestamp: 'Timestamp', endpoint: 'Endpoint',
    copyJson: 'Copiar JSON',
  }
};

function EvidenceCenterScreen() {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const tr = useTranslation();
  const [activeTab, setActiveTab] = useState('evidences');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const l = labels[language] || labels.en;

  const [evidences, setEvidences] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [indexingIds, setIndexingIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoadingEvidences, setIsLoadingEvidences] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Cargar las evidencias reales de la empresa (incluye los documentos subidos
  // desde Análisis de Brechas). Antes, si la empresa no tenía evidencias o la
  // carga fallaba, se mostraban 4 evidencias de ejemplo inventadas; ahora se
  // muestra la lista vacía o el error, para no confundir con datos falsos.
  const loadEvidences = async () => {
    setIsLoadingEvidences(true); setLoadError(null);
    try {
      const { evidenceAPI } = await import('../services/api');
      const data = await evidenceAPI.getAll();
      const mapped = (Array.isArray(data) ? data : []).map(e => ({ ...e, lastUpdated: e.lastUpdated ? new Date(e.lastUpdated) : new Date() }));
      setEvidences(mapped);
    } catch (error) {
      console.error("Error loading evidences", error);
      setEvidences([]);
      setLoadError('No se pudieron cargar las evidencias. Inténtalo de nuevo.');
    } finally {
      setIsLoadingEvidences(false);
    }
  };

  React.useEffect(() => {
    loadEvidences();
  }, []);

  const handleFileUpload = async (event) => {
    event.preventDefault();
    const files = event.target.files || event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      const { evidenceAPI } = await import('../services/api');
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("control", "ISO-GEN");
      formData.append("source", "Portal");
      formData.append("validityDays", 90);
      
      const result = await evidenceAPI.upload(formData);
      await loadEvidences();
      setActiveTab('evidences');

      // Polling del estado de indexación RAG
      if (result?.id) {
        setIndexingIds(prev => new Set(prev).add(result.id));
        const poll = setInterval(async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${(await import('../services/api')).API_URL}/api/evidence/${result.id}/status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const { indexing_status } = await res.json();
            if (indexing_status === 'done' || indexing_status === 'error') {
              clearInterval(poll);
              setIndexingIds(prev => { const s = new Set(prev); s.delete(result.id); return s; });
            }
          } catch { clearInterval(poll); }
        }, 3000);
      }
    } catch (error) {
      alert("Error subiendo evidencia: " + error.message);
    } finally {
      setIsUploading(false);
      setDragOver(false);
    }
  };

  const handleViewEvidence = async (evidence, e) => {
    e.stopPropagation();
    try {
      // Si el id es muy corto (ej: 1, 2, 3), es un mock hardcodeado
      if (evidence.id.toString().length < 5) {
        alert("Esta evidencia es un ejemplo de diseño. Para probar el visualizador, sube tu propia evidencia real usando la pestaña Carga Masiva.");
        return;
      }
      const { evidenceAPI } = await import('../services/api');
      const fileUrl = await evidenceAPI.download(evidence.id);
      window.open(fileUrl, '_blank');
    } catch (error) {
      alert("No se pudo abrir el archivo: " + error.message);
    }
  };

  const [requests, setRequests] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dani_evidence_requests') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('dani_evidence_requests', JSON.stringify(requests)); } catch {}
  }, [requests]);

  const connectors = [
    { id: 'aws', name: 'AWS', icon: '☁️', status: 'pending', lastSync: 'Not configured', evidences: 0, color: '#FF9900' },
    { id: 'azure', name: 'Azure', icon: '🔷', status: 'pending', lastSync: 'Not configured', evidences: 0, color: '#0078D4' },
    { id: 'jira', name: 'Jira', icon: '📋', status: 'pending', lastSync: 'Not configured', evidences: 0, color: '#0052CC' },
    { id: 'okta', name: 'Okta', icon: '🔐', status: 'pending', lastSync: 'Not configured', evidences: 0, color: '#007DC1' },
    { id: 'github', name: 'GitHub', icon: '🐙', status: 'pending', lastSync: 'Not configured', evidences: 0, color: '#333' },
    { id: 'slack', name: 'Slack', icon: '💬', status: 'pending', lastSync: 'Not configured', evidences: 0, color: '#4A154B' }
  ];

  const getDaysAgo = (date) => Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  const getFreshnessStatus = (evidence) => {
    const daysAgo = getDaysAgo(evidence.lastUpdated);
    const daysRemaining = evidence.validityDays - daysAgo;
    if (daysRemaining <= 0) return 'expired';
    if (daysRemaining <= 7) return 'expiring';
    return 'fresh';
  };
  const getFreshnessColor = (status) => {
    switch (status) { case 'fresh': return '#004ac6'; case 'expiring': return '#f59e0b'; case 'expired': return '#ef4444'; default: return '#6b7280'; }
  };

  const filteredEvidences = evidences.filter(e => {
    // Filtrado por status
    if (filterStatus !== 'all') {
      if (filterStatus === 'automatic' && e.type !== 'automatic') return false;
      if (filterStatus === 'manual' && e.type !== 'manual') return false;
      if (filterStatus === 'expired' && getFreshnessStatus(e) !== 'expired') return false;
      if (filterStatus === 'expiring' && getFreshnessStatus(e) !== 'expiring') return false;
    }
    
    // Filtrado por busqueda
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = e.name && e.name.toLowerCase().includes(q);
      const matchControl = e.control && e.control.toLowerCase().includes(q);
      const matchSource = e.source && e.source.toLowerCase().includes(q);
      if (!matchName && !matchControl && !matchSource) return false;
    }
    
    return true;
  });

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{l.title}</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>{l.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowRequestModal(true)} style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={16} /> {l.requestEvidence}
          </button>
          <button onClick={() => setActiveTab('upload')} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} /> {l.addEvidence}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[{ label: l.totalEvidences, value: evidences.length, color: '#004ac6', icon: Database }, { label: l.autoCollected, value: evidences.filter(e => e.type === 'automatic').length, color: '#3b82f6', icon: Zap }, { label: l.manualUpload, value: evidences.filter(e => e.type === 'manual').length, color: '#f59e0b', icon: Upload }, { label: l.pendingRequests, value: requests.filter(r => r.status === 'pending' || r.status === 'overdue').length, color: '#ef4444', icon: Clock }].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} style={{ background: t.cardBg, borderRadius: '14px', padding: '18px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={stat.color} /></div>
                <span style={{ fontSize: '12px', color: t.textDim }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[{ id: 'evidences', label: l.evidences, icon: Database }, { id: 'upload', label: l.upload, icon: Upload }, { id: 'requests', label: l.requests, icon: Send }, { id: 'connectors', label: l.connectors, icon: Zap }].map((tab) => {
          const Icon = tab.icon; const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 20px', background: isActive ? '#004ac620' : 'transparent', border: `1px solid ${isActive ? '#004ac6' : t.border}`, borderRadius: '10px', color: isActive ? '#004ac6' : t.textMuted, cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon size={16} /> {tab.label}
              {tab.id === 'requests' && requests.filter(r => r.status === 'pending' || r.status === 'overdue').length > 0 && (
                <span style={{ background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>{requests.filter(r => r.status === 'pending' || r.status === 'overdue').length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Evidences Tab */}
      {activeTab === 'evidences' && (
        <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: t.textDim }}>{l.filterBy}:</span>
              {[{ id: 'all', label: l.all }, { id: 'automatic', label: l.automatic }, { id: 'manual', label: l.manual }, { id: 'expired', label: l.expired }, { id: 'expiring', label: l.expiringSoon }].map((filter) => (
                <button key={filter.id} onClick={() => setFilterStatus(filter.id)} style={{ padding: '6px 12px', background: filterStatus === filter.id ? '#004ac620' : t.inputBg, border: `1px solid ${filterStatus === filter.id ? '#004ac6' : t.border}`, borderRadius: '6px', color: filterStatus === filter.id ? '#004ac6' : t.textMuted, fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>{filter.label}</button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.textDim }} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={l.searchEvidences} style={{ padding: '8px 12px 8px 36px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '13px', width: '250px', outline: 'none' }} />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.health}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{language === 'en' ? 'Evidence' : language === 'pt' ? 'Evidência' : 'Evidencia'}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.control}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.source}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.lastUpdated}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvidences.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: loadError ? '#dc2626' : t.textDim, fontSize: '14px' }}>
                      {isLoadingEvidences
                        ? 'Cargando evidencias...'
                        : loadError
                          ? <>{loadError} <button onClick={loadEvidences} style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '8px', background: '#004ac6', border: 'none', color: 'white', cursor: 'pointer' }}>Reintentar</button></>
                          : evidences.length === 0
                            ? 'Aún no hay evidencias. Los documentos que subas aquí o en Análisis de Brechas aparecerán en esta lista.'
                            : 'Ninguna evidencia coincide con el filtro o la búsqueda.'}
                    </td>
                  </tr>
                )}
                {filteredEvidences.map((evidence) => {
                  const freshnessStatus = getFreshnessStatus(evidence);
                  const freshnessColor = getFreshnessColor(freshnessStatus);
                  const daysAgo = getDaysAgo(evidence.lastUpdated);
                  const daysRemaining = evidence.validityDays - daysAgo;
                  return (
                    <tr key={evidence.id} style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer' }} onClick={() => setSelectedEvidence(evidence)}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: freshnessColor, boxShadow: `0 0 8px ${freshnessColor}60` }} />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: freshnessColor }}>{freshnessStatus === 'fresh' ? l.fresh : freshnessStatus === 'expiring' ? l.expiringSoon : l.expired}</div>
                            <div style={{ fontSize: '10px', color: t.textDim }}>{daysRemaining > 0 ? `${l.validFor} ${daysRemaining} ${l.days}` : l.needsUpdate}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: evidence.type === 'automatic' ? '#3b82f620' : '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{evidence.sourceIcon}</div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{evidence.name}</div>
                            {indexingIds.has(evidence.id)
                              ? <div style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #f59e0b', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                                  Indexando para IA...
                                </div>
                              : <div style={{ fontSize: '11px', color: t.textDim }}>{evidence.type === 'automatic' ? l.automatic : l.manual}</div>
                            }
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}><span style={{ padding: '4px 10px', background: '#8b5cf620', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>{evidence.control}</span></td>
                      <td style={{ padding: '16px 20px' }}><span style={{ fontSize: '13px', color: t.text }}>{evidence.source}</span></td>
                      <td style={{ padding: '16px 20px' }}><span style={{ fontSize: '13px', color: t.textMuted }}>{daysAgo} {l.daysAgo}</span></td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {freshnessStatus === 'expired' && <button onClick={(e) => { e.stopPropagation(); loadEvidences(); }} style={{ padding: '6px 12px', background: '#ef444420', border: '1px solid #ef444440', borderRadius: '6px', color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={12} /> {l.updateNow}</button>}
                          <button onClick={(e) => handleViewEvidence(evidence, e)} style={{ padding: '6px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.textMuted, fontSize: '11px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> {l.view}</button>
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

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <label style={{ padding: '60px 40px', textAlign: 'center', cursor: 'pointer', display: 'block' }}
            onDrop={handleFileUpload}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{ border: `2px dashed ${dragOver ? '#004ac6' : t.border}`, borderRadius: '16px', margin: '24px', background: dragOver ? 'rgba(0, 74, 198, 0.05)' : 'transparent', display: 'block', cursor: isUploading ? 'not-allowed' : 'pointer' }}>
            <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isUploading} />
            <Upload size={48} color={dragOver ? '#004ac6' : t.textDim} style={{ marginBottom: '16px', opacity: isUploading ? 0.5 : 1 }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: t.text, marginBottom: '8px' }}>
              {isUploading ? 'Subiendo evidencia segura...' : 'Arrastra y suelta tu evidencia aquí'}
            </h3>
            <p style={{ fontSize: '14px', color: t.textDim }}>o haz clic para explorar tus archivos</p>
            <p style={{ fontSize: '12px', color: t.textMuted, marginTop: '8px' }}>Se registrará automáticamente con metadatos en PostgreSQL</p>
          </label>
        </div>
      )}

      {/* Connectors Tab */}
      {activeTab === 'connectors' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {connectors.map((connector) => (
            <div key={connector.id} style={{ background: t.cardBg, borderRadius: '16px', padding: '20px', border: connector.status === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{connector.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: connector.status === 'connected' ? 'rgba(0, 74, 198, 0.15)' : connector.status === 'error' ? 'rgba(239, 68, 68, 0.15)' : t.inputBg, color: connector.status === 'connected' ? '#004ac6' : connector.status === 'error' ? '#ef4444' : t.textDim }}>
                  {connector.status === 'connected' && <CheckCircle2 size={12} />}
                  {connector.status === 'error' && <XCircle size={12} />}
                  {connector.status === 'connected' ? l.connected : connector.status === 'error' ? l.error : l.pending}
                </div>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: t.text }}>{connector.name}</h4>
              <div style={{ fontSize: '12px', color: connector.status === 'error' ? '#ef4444' : t.textDim, marginBottom: '16px' }}>{l.lastSync}: {connector.lastSync}</div>
              {connector.status === 'connected' && <div style={{ padding: '10px 14px', background: 'rgba(0, 74, 198, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: t.text }}>{connector.evidences} {l.evidences}</span><Eye size={14} color="#004ac6" /></div>}
              {connector.status === 'error' && <button style={{ width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>{l.reconnect}</button>}
              {connector.status === 'pending' && <button style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>{l.configure}</button>}
            </div>
          ))}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{l.requests}</h3>
            <button onClick={() => setShowRequestModal(true)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={16} /> {l.requestEvidence}</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{language === 'en' ? 'Evidence' : language === 'pt' ? 'Evidência' : 'Evidencia'}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.control}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.assignTo}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.dueDate}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.actions}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: '16px 20px' }}><div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{request.title}</div></td>
                    <td style={{ padding: '16px 20px' }}><span style={{ padding: '4px 10px', background: '#8b5cf620', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>{request.control}</span></td>
                    <td style={{ padding: '16px 20px' }}><div style={{ fontSize: '13px', fontWeight: 500, color: t.text }}>{request.assignee}</div><div style={{ fontSize: '11px', color: t.textDim }}>{request.department}</div></td>
                    <td style={{ padding: '16px 20px' }}><span style={{ fontSize: '13px', color: request.status === 'overdue' ? '#ef4444' : t.textMuted }}>{request.dueDate}</span></td>
                    <td style={{ padding: '16px 20px' }}><span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: request.status === 'submitted' ? '#004ac620' : request.status === 'overdue' ? '#ef444420' : '#f59e0b20', color: request.status === 'submitted' ? '#004ac6' : request.status === 'overdue' ? '#ef4444' : '#f59e0b' }}>{request.status}</span></td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {request.status === 'submitted' ? (
                        <button style={{ padding: '6px 12px', background: '#004ac620', border: '1px solid #004ac640', borderRadius: '6px', color: '#004ac6', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> {l.viewSubmission}</button>
                      ) : (
                        <button style={{ padding: '6px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.textMuted, fontSize: '11px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Send size={12} /> {l.resendReminder}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Evidence Modal */}
      {showRequestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ width: '500px', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${t.border}`, paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6' }}>
                <Send size={20} />
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{l.requestEvidence}</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const title = e.target.title.value;
              const control = e.target.control.value;
              const assignee = e.target.assignee.value;
              const department = e.target.department.value;
              const dueDate = e.target.dueDate.value;
              
              if (!title || !assignee || !dueDate) {
                alert(language === 'es' ? 'Por favor completa todos los campos' : 'Please fill all fields');
                return;
              }
              
              const magicId = Math.random().toString(36).substring(7);
              const newRequest = {
                id: Date.now(),
                title,
                control,
                assignee,
                department,
                dueDate,
                status: 'pending',
                magicLink: `https://dani.app/upload/${magicId}`
              };
              
              setRequests(prev => [newRequest, ...prev]);
              setShowRequestModal(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: t.textDim, marginBottom: '6px', fontWeight: 500 }}>
                  {language === 'es' ? 'Nombre del Documento / Evidencia' : 'Document / Evidence Name'}
                </label>
                <input name="title" placeholder="e.g. NDA Signed Logs" style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: t.textDim, marginBottom: '6px', fontWeight: 500 }}>
                    {language === 'es' ? 'Control ISO' : 'ISO Control'}
                  </label>
                  <select name="control" style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }}>
                    <optgroup label="Cláusulas SGSI">
                      <option value="5.1">5.1 — Políticas de seguridad</option>
                      <option value="6.1">6.1 — Evaluación de riesgos</option>
                      <option value="7.2">7.2 — Competencia y formación</option>
                      <option value="8.2">8.2 — Evaluación de riesgos SI</option>
                      <option value="9.1">9.1 — Seguimiento y medición</option>
                      <option value="9.3">9.3 — Revisión por la dirección</option>
                      <option value="10.1">10.1 — No conformidades y acciones correctivas</option>
                    </optgroup>
                    <optgroup label="Anexo A — Controles Organizacionales">
                      <option value="A.5.1">A.5.1 — Políticas de seguridad</option>
                      <option value="A.5.9">A.5.9 — Inventario de activos</option>
                      <option value="A.5.15">A.5.15 — Control de acceso</option>
                      <option value="A.5.16">A.5.16 — Gestión de identidades</option>
                      <option value="A.5.23">A.5.23 — Seguridad en servicios cloud</option>
                      <option value="A.5.29">A.5.29 — Seguridad en incidentes</option>
                      <option value="A.5.30">A.5.30 — Continuidad de negocio</option>
                    </optgroup>
                    <optgroup label="Anexo A — Controles de Personas">
                      <option value="A.6.1">A.6.1 — Selección de personal</option>
                      <option value="A.6.2">A.6.2 — Términos y condiciones</option>
                      <option value="A.6.3">A.6.3 — Concienciación y formación</option>
                      <option value="A.6.4">A.6.4 — Proceso disciplinario</option>
                      <option value="A.6.5">A.6.5 — Cese o cambio de empleo</option>
                    </optgroup>
                    <optgroup label="Anexo A — Controles Físicos">
                      <option value="A.7.1">A.7.1 — Perímetros de seguridad física</option>
                      <option value="A.7.2">A.7.2 — Entrada física</option>
                      <option value="A.7.4">A.7.4 — Monitorización física</option>
                      <option value="A.7.8">A.7.8 — Ubicación de equipos</option>
                    </optgroup>
                    <optgroup label="Anexo A — Controles Tecnológicos">
                      <option value="A.8.2">A.8.2 — Derechos de acceso privilegiado</option>
                      <option value="A.8.5">A.8.5 — Autenticación segura</option>
                      <option value="A.8.7">A.8.7 — Protección contra malware</option>
                      <option value="A.8.8">A.8.8 — Gestión de vulnerabilidades</option>
                      <option value="A.8.10">A.8.10 — Borrado de información</option>
                      <option value="A.8.13">A.8.13 — Copias de seguridad</option>
                      <option value="A.8.15">A.8.15 — Registros de actividad (logs)</option>
                      <option value="A.8.16">A.8.16 — Monitorización de actividades</option>
                      <option value="A.8.20">A.8.20 — Seguridad en redes</option>
                      <option value="A.8.24">A.8.24 — Uso de criptografía</option>
                      <option value="A.8.28">A.8.28 — Codificación segura</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: t.textDim, marginBottom: '6px', fontWeight: 500 }}>
                    {l.dueDate}
                  </label>
                  <input type="date" name="dueDate" style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }} required />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: t.textDim, marginBottom: '6px', fontWeight: 500 }}>
                    {language === 'es' ? 'Responsable (Asignar a)' : 'Assignee'}
                  </label>
                  <input name="assignee" placeholder="e.g. María López" style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: t.textDim, marginBottom: '6px', fontWeight: 500 }}>
                    {language === 'es' ? 'Departamento' : 'Department'}
                  </label>
                  <input name="department" placeholder="e.g. HR" style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }} required />
                </div>
              </div>
              
              <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowRequestModal(false)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '10px', color: t.textMuted, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button type="submit" style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={14} /> {l.sendRequest}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvidenceCenterScreen;