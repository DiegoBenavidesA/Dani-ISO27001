// src/pages/AuditRoomScreen.jsx
import React, { useState, useContext, useEffect } from 'react';
import {
  Search, Download, Folder, Eye, Lock, History, Sparkles,
  CheckCircle2, Clock, ExternalLink, FileText, X, Check,
  RefreshCw, Plus, Edit3, Trash2
} from 'lucide-react';
import { ThemeContext, useTranslation } from '../contexts/ThemeContext';
import { API_URL } from '../services/api';

const labels = {
  en: {
    title: 'Audit Room', subtitle: 'Organized evidence for ISO 27001 certification',
    readOnly: 'Auditor View', fullAccess: 'Full Access',
    semanticSearch: 'Search across all evidence and documentation...', aiSearch: 'AI Search',
    items: 'items', complete: 'Complete', partial: 'Partial',
    auditorsBinder: "Auditor's Binder",
    exportTitle: 'Export Audit Package', exportDescription: 'Generate a complete audit package organized by ISO 27001 clauses',
    exportFormat: 'Export Format', pdfFormat: 'PDF Document', zipFormat: 'ZIP Archive',
    pdfDesc: 'Single document with all annexes embedded', zipDesc: 'Folder structure matching ISO clauses',
    selectClauses: 'Select Clauses', selectAll: 'Select All', deselectAll: 'Deselect All',
    includeAnnexes: 'Include Evidence Annexes', includeTrail: 'Include Audit Trail Log',
    generatePackage: 'Generate Package', generating: 'Generating...',
    estimatedSize: 'Estimated Size', evidenceCount: 'Evidence Count',
    exportReady: 'Export Ready!', downloadNow: 'Download Now',
    auditTrail: 'Platform Audit Trail', integrityLog: 'Integrity Log',
    timestamp: 'Timestamp', user: 'User', action: 'Action', resource: 'Resource',
    ipAddress: 'IP Address', details: 'Details',
    allActions: 'All Actions', created: 'Created', modified: 'Modified', deleted: 'Deleted',
    approved: 'Approved', exported: 'Exported', viewed: 'Viewed',
    exportTrail: 'Export Trail', last24h: 'Last 24h', last7d: 'Last 7d', last30d: 'Last 30d', allTime: 'All time',
    auditorModeLabel: 'Auditor Mode', approvedOnly: 'Showing approved evidence only',
    switchToFull: 'Switch to Full Access', folders: 'Evidence Folders', auditLog: 'Audit Log', export: 'Export'
  },
  es: {
    title: 'Sala de Auditoría', subtitle: 'Evidencias organizadas para certificación ISO 27001',
    readOnly: 'Vista Auditor', fullAccess: 'Acceso Completo',
    semanticSearch: 'Buscar en todas las evidencias...', aiSearch: 'Buscar con IA',
    items: 'elementos', complete: 'Completo', partial: 'Parcial',
    auditorsBinder: 'Carpeta del Auditor',
    exportTitle: 'Exportar Paquete', exportDescription: 'Genera un paquete por cláusulas ISO 27001',
    exportFormat: 'Formato', pdfFormat: 'Documento PDF', zipFormat: 'Archivo ZIP',
    pdfDesc: 'Documento único con anexos', zipDesc: 'Carpetas según cláusulas ISO',
    selectClauses: 'Seleccionar Cláusulas', selectAll: 'Todo', deselectAll: 'Nada',
    includeAnnexes: 'Incluir Anexos', includeTrail: 'Incluir Log',
    generatePackage: 'Generar Paquete', generating: 'Generando...',
    estimatedSize: 'Tamaño Est.', evidenceCount: 'Evidencias',
    exportReady: '¡Listo!', downloadNow: 'Descargar',
    auditTrail: 'Auditoría', integrityLog: 'Log de Integridad',
    timestamp: 'Fecha', user: 'Usuario', action: 'Acción', resource: 'Recurso',
    ipAddress: 'IP', details: 'Detalles',
    allActions: 'Todas', created: 'Creado', modified: 'Modificado', deleted: 'Eliminado',
    approved: 'Aprobado', exported: 'Exportado', viewed: 'Visto',
    exportTrail: 'Exportar', last24h: '24h', last7d: '7d', last30d: '30d', allTime: 'Todo',
    auditorModeLabel: 'Modo Auditor', approvedOnly: 'Solo evidencias aprobadas',
    switchToFull: 'Acceso Completo', folders: 'Carpetas', auditLog: 'Log', export: 'Exportar'
  },
  pt: {
    title: 'Sala de Auditoria', subtitle: 'Evidências para certificação ISO 27001',
    readOnly: 'Vista Auditor', fullAccess: 'Acesso Completo',
    semanticSearch: 'Buscar evidências...', aiSearch: 'Busca IA',
    items: 'itens', complete: 'Completo', partial: 'Parcial',
    auditorsBinder: 'Pasta do Auditor',
    exportTitle: 'Exportar Pacote', exportDescription: 'Gera pacote por cláusulas ISO 27001',
    exportFormat: 'Formato', pdfFormat: 'Documento PDF', zipFormat: 'Arquivo ZIP',
    pdfDesc: 'Documento único com anexos', zipDesc: 'Pastas conforme cláusulas ISO',
    selectClauses: 'Selecionar', selectAll: 'Tudo', deselectAll: 'Nada',
    includeAnnexes: 'Incluir Anexos', includeTrail: 'Incluir Log',
    generatePackage: 'Gerar Pacote', generating: 'Gerando...',
    estimatedSize: 'Tamanho', evidenceCount: 'Evidências',
    exportReady: 'Pronto!', downloadNow: 'Baixar',
    auditTrail: 'Auditoria', integrityLog: 'Log de Integridade',
    timestamp: 'Data', user: 'Usuário', action: 'Ação', resource: 'Recurso',
    ipAddress: 'IP', details: 'Detalhes',
    allActions: 'Todas', created: 'Criado', modified: 'Modificado', deleted: 'Excluído',
    approved: 'Aprovado', exported: 'Exportado', viewed: 'Visto',
    exportTrail: 'Exportar', last24h: '24h', last7d: '7d', last30d: '30d', allTime: 'Tudo',
    auditorModeLabel: 'Modo Auditor', approvedOnly: 'Apenas aprovadas',
    switchToFull: 'Acesso Completo', folders: 'Pastas', auditLog: 'Log', export: 'Exportar'
  }
};

function AuditRoomScreen() {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditorMode, setAuditorMode] = useState(true);
  const [activeTab, setActiveTab] = useState('folders');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('zip');
  const [selectedClauses, setSelectedClauses] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [includeAnnexes, setIncludeAnnexes] = useState(true);
  const [includeTrail, setIncludeTrail] = useState(true);
  const [trailFilter, setTrailFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('7d');

  const l = labels[language] || labels.en;

  const CLAUSE_NAMES = {
    '4': '4. Context of the Organization',
    '5': '5. Leadership',
    '6': '6. Planning',
    '7': '7. Support',
    '8': '8. Operation',
    '9': '9. Performance Evaluation',
    '10': '10. Improvement'
  };

  const DEFAULT_FOLDERS = [
    { id: 1, name: '4. Context of the Organization', items: 0, status: 'partial' },
    { id: 2, name: '5. Leadership', items: 0, status: 'partial' },
    { id: 3, name: '6. Planning', items: 0, status: 'partial' },
    { id: 4, name: '7. Support', items: 0, status: 'partial' },
    { id: 5, name: '8. Operation', items: 0, status: 'partial' },
    { id: 6, name: '9. Performance Evaluation', items: 0, status: 'partial' },
    { id: 7, name: '10. Improvement', items: 0, status: 'partial' },
    { id: 8, name: 'Annex A Controls', items: 93, status: 'partial' }
  ];

  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [auditTrailEntries, setAuditTrailEntries] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/api/gap-analysis/full`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/api/evidence`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/documents`, { headers }).then(r => r.json()).catch(() => ({ documents: [] }))
    ]).then(([gapData, evidences, docsData]) => {
      const evArray = Array.isArray(evidences) ? evidences : [];
      const docArray = docsData?.documents || [];

      // Contar evidencias por cláusula (control "8.1" → cláusula "8"; "A.5.x" → Annex A)
      const evByClause = {};
      evArray.forEach(ev => {
        const ctrl = ev.control || '';
        const match = ctrl.match(/^(\d+)\./);
        const key = match ? match[1] : null;
        if (key) evByClause[key] = (evByClause[key] || 0) + 1;
      });
      const annexACount = evArray.filter(ev => (ev.control || '').startsWith('A.')).length;

      // Construir carpetas desde scores reales del gap analysis
      if (gapData?.clause_gaps) {
        const newFolders = gapData.clause_gaps.map((c, i) => {
          const docCount = docArray.filter(d => (d.chapter_id || '').startsWith(c.clause_id)).length;
          const evCount = evByClause[c.clause_id] || 0;
          return {
            id: i + 1,
            name: CLAUSE_NAMES[c.clause_id] || `${c.clause_id}. ${c.clause_name}`,
            items: evCount + docCount,
            status: c.current_score >= 75 ? 'complete' : 'partial',
            score: Math.round(c.current_score)
          };
        });
        newFolders.push({
          id: 8,
          name: 'Annex A Controls',
          items: annexACount || 93,
          status: 'partial',
          score: null
        });
        setFolders(newFolders);
      }

      // Construir audit trail desde documentos y evidencias reales
      const trail = [];
      let trailId = 1;

      docArray.forEach(doc => {
        const action = doc.status === 'published' ? 'approved'
          : doc.status === 'archived' ? 'deleted'
          : doc.status === 'draft' ? 'created'
          : 'modified';
        trail.push({
          id: trailId++,
          timestamp: doc.updated || 'Reciente',
          rawDate: doc.updated || new Date().toISOString(),
          user: 'Equipo SGSI',
          role: 'Manager',
          action,
          resource: doc.name,
          ip: '—',
          details: `Documento ${doc.status} · v${doc.version || '1.0'}`
        });
      });

      evArray.slice(0, 15).forEach(ev => {
        const ts = ev.lastUpdated
          ? new Date(ev.lastUpdated).toLocaleDateString('es-CL')
          : 'Reciente';
        trail.push({
          id: trailId++,
          timestamp: ts,
          rawDate: ev.lastUpdated || new Date().toISOString(),
          user: 'Centro Evidencias',
          role: 'Sistema',
          action: 'created',
          resource: ev.name,
          ip: '—',
          details: `Evidencia subida · Control ${ev.control || 'General'}`
        });
      });

      if (trail.length > 0) setAuditTrailEntries(trail);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, []);

  const getActionColor = (action) => {
    switch (action) { case 'created': return '#004ac6'; case 'modified': return '#3b82f6'; case 'deleted': return '#ef4444'; case 'approved': return '#8b5cf6'; case 'exported': return '#f59e0b'; case 'viewed': return '#6b7280'; default: return t.textDim; }
  };

  const getActionIcon = (action) => {
    switch (action) { case 'created': return Plus; case 'modified': return Edit3; case 'deleted': return Trash2; case 'approved': return CheckCircle2; case 'exported': return Download; case 'viewed': return Eye; default: return FileText; }
  };

  const handleExport = () => {
    setShowExportModal(true);
    setExportProgress(0);
    setDownloadUrl(null);
    
    let intervalId;

    // Simulador de barra de progreso mientras esperamos al backend
    intervalId = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) { 
          clearInterval(intervalId); 
          return 90; // Se queda en 90% esperando la respuesta de la API
        }
        return prev + Math.random() * 20;
      });
    }, 250);

    // Iniciar llamada real a la API
    import('../services/api').then(({ evidenceAPI }) => {
      evidenceAPI.exportZip().then(url => {
        clearInterval(intervalId); // Matamos el intervalo inmediatamente
        setDownloadUrl(url);
        setExportProgress(100);
      }).catch(err => {
        clearInterval(intervalId);
        alert("Error generando ZIP: " + err.message);
        setShowExportModal(false);
      });
    });
  };

  const filteredTrail = auditTrailEntries.filter(entry => {
    if (trailFilter !== 'all' && entry.action !== trailFilter) return false;
    if (timeFilter !== 'all') {
      const cutoff = new Date();
      if (timeFilter === '24h') cutoff.setHours(cutoff.getHours() - 24);
      else if (timeFilter === '7d') cutoff.setDate(cutoff.getDate() - 7);
      else if (timeFilter === '30d') cutoff.setDate(cutoff.getDate() - 30);
      const entryDate = new Date(entry.rawDate);
      if (isNaN(entryDate.getTime()) || entryDate < cutoff) return false;
    }
    return true;
  });

  const handleAISearch = () => {
    if (!searchQuery.trim()) {
      alert(language === 'es' ? 'Por favor ingresa un término de búsqueda.' : 'Please enter a search query.');
      return;
    }
    setIsAiSearching(true);
    setAiResponse(null);
    
    import('../services/api').then(({ chatAPI }) => {
      chatAPI.sendMessage(searchQuery).then(res => {
        setIsAiSearching(false);
        if (res.error) {
          setAiResponse({ error: true, message: res.error });
        } else {
          setAiResponse({ error: false, text: res.reply || res.message });
        }
      }).catch(err => {
        setIsAiSearching(false);
        setAiResponse({ error: true, message: err.message });
      });
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700 }}>{l.title}</h1>
            <div style={{ padding: '6px 14px', background: auditorMode ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0, 74, 198, 0.15)', border: `1px solid ${auditorMode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(0, 74, 198, 0.3)'}`, borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: auditorMode ? '#a855f7' : '#004ac6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {auditorMode ? <Eye size={14} /> : <Lock size={14} />}
              {auditorMode ? l.readOnly : l.fullAccess}
            </div>
          </div>
          <p style={{ color: t.textDim, fontSize: '15px' }}>{l.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: t.inputBg, borderRadius: '10px', border: `1px solid ${t.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: t.textMuted }}>{l.auditorModeLabel}</span>
            <button onClick={() => setAuditorMode(!auditorMode)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: auditorMode ? '#a855f7' : t.hoverBg, border: `1px solid ${auditorMode ? '#a855f7' : t.border}`, cursor: 'pointer', position: 'relative' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: auditorMode ? '22px' : '2px', transition: 'all 0.2s ease' }} />
            </button>
          </div>
          <button onClick={handleExport} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Download size={18} /> {l.auditorsBinder}
          </button>
        </div>
      </div>

      {/* Auditor Mode Banner */}
      {auditorMode && (
        <div style={{ padding: '12px 20px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Eye size={18} color="#a855f7" /><span style={{ fontSize: '13px', color: '#a855f7', fontWeight: 500 }}>{l.approvedOnly}</span></div>
          <button onClick={() => setAuditorMode(false)} style={{ padding: '6px 12px', background: 'rgba(168, 85, 247, 0.2)', border: 'none', borderRadius: '6px', color: '#a855f7', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{l.switchToFull}</button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ background: t.cardBg, borderRadius: '16px', padding: '18px 22px', border: `1px solid ${t.border}`, marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: t.inputBg, borderRadius: '10px', padding: '10px 14px', border: `1px solid ${t.border}` }}>
            <Search size={18} color={t.textDim} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={l.semanticSearch} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontSize: '14px' }} />
          </div>
          <button onClick={handleAISearch} style={{ padding: '10px 20px', background: '#004ac6', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><Sparkles size={14} /> {l.aiSearch}</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[{ id: 'folders', label: l.folders, icon: Folder }, { id: 'trail', label: l.auditLog, icon: History }, { id: 'export', label: l.export, icon: Download }].map((tab) => {
          const Icon = tab.icon; const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 20px', background: isActive ? '#a855f720' : 'transparent', border: `1px solid ${isActive ? '#a855f7' : t.border}`, borderRadius: '10px', color: isActive ? '#a855f7' : t.textMuted, cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Folders Tab */}
      {activeTab === 'folders' && (
        loadingData ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: t.textDim, gap: '12px' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px' }}>{language === 'es' ? 'Cargando datos reales...' : 'Loading real data...'}</span>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: t.textDim }}>{selectedClauses.length} / {folders.length} {language === 'es' ? 'carpetas seleccionadas' : 'folders selected'}</span>
              <button onClick={() => setSelectedClauses(selectedClauses.length === folders.length ? [] : folders.map(f => f.id))} style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                {selectedClauses.length === folders.length ? l.deselectAll : l.selectAll}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {folders.map((folder) => {
                const isSelected = selectedClauses.includes(folder.id);
                return (
                  <div key={folder.id} onClick={() => setSelectedClauses(prev => prev.includes(folder.id) ? prev.filter(id => id !== folder.id) : [...prev, folder.id])}
                    style={{ background: t.cardBg, borderRadius: '16px', padding: '20px', border: `2px solid ${isSelected ? '#a855f7' : t.border}`, cursor: 'pointer', transition: 'border-color 0.15s', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '12px', right: '12px', width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${isSelected ? '#a855f7' : t.border}`, background: isSelected ? '#a855f7' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      {isSelected && <Check size={12} color="white" />}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: isSelected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Folder size={24} color="#a855f7" /></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: folder.status === 'complete' ? '#004ac615' : '#f59e0b15', fontSize: '11px', fontWeight: 600, color: folder.status === 'complete' ? '#004ac6' : '#f59e0b', marginRight: '28px' }}>
                        {folder.status === 'complete' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {folder.status === 'complete' ? l.complete : l.partial}
                      </div>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', lineHeight: '1.4', color: t.text }}>{folder.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: t.textDim }}>{folder.items} {l.items}</span>
                      {folder.score != null && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: folder.score >= 75 ? '#004ac6' : '#f59e0b' }}>{folder.score}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'trail' && (
        <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><History size={20} color="white" /></div>
              <div><h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{l.integrityLog}</h3></div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={{ padding: '8px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '12px', outline: 'none' }}>
                <option value="24h">{l.last24h}</option><option value="7d">{l.last7d}</option><option value="30d">{l.last30d}</option><option value="all">{l.allTime}</option>
              </select>
              <select value={trailFilter} onChange={(e) => setTrailFilter(e.target.value)} style={{ padding: '8px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '12px', outline: 'none' }}>
                <option value="all">{l.allActions}</option><option value="created">{l.created}</option><option value="modified">{l.modified}</option><option value="approved">{l.approved}</option><option value="deleted">{l.deleted}</option><option value="exported">{l.exported}</option>
              </select>
              <button style={{ padding: '8px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={14} /> {l.exportTrail}</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.timestamp}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.user}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.action}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.resource}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.details}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrail.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>
                    {language === 'es' ? 'Sin actividad registrada en este período.' : 'No activity recorded in this period.'}
                  </td></tr>
                )}
                {filteredTrail.map((entry) => {
                  const ActionIcon = getActionIcon(entry.action);
                  const actionColor = getActionColor(entry.action);
                  return (
                    <tr key={entry.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: '14px 20px' }}><span style={{ fontSize: '12px', color: t.textMuted, fontFamily: 'monospace' }}>{entry.timestamp}</span></td>
                      <td style={{ padding: '14px 20px' }}><div style={{ fontSize: '13px', fontWeight: 500, color: t.text }}>{entry.user}</div><div style={{ fontSize: '11px', color: t.textDim }}>{entry.role}</div></td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: `${actionColor}15`, borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: actionColor }}>
                          <ActionIcon size={12} /> {l[entry.action] || entry.action}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}><span style={{ fontSize: '13px', color: t.text }}>{entry.resource}</span></td>
                      <td style={{ padding: '14px 20px' }}><span style={{ fontSize: '12px', color: t.textDim }}>{entry.details}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Download size={24} color="white" /></div>
            <div><h3 style={{ fontSize: '18px', fontWeight: 600, color: t.text }}>{l.exportTitle}</h3></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>{l.exportFormat}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[{ id: 'pdf', label: l.pdfFormat, desc: l.pdfDesc, icon: FileText }, { id: 'zip', label: l.zipFormat, desc: l.zipDesc, icon: Folder }].map((format) => {
                  const Icon = format.icon; const isSelected = selectedExportFormat === format.id;
                  return (
                    <button key={format.id} onClick={() => setSelectedExportFormat(format.id)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: isSelected ? '#004ac615' : t.inputBg, border: `2px solid ${isSelected ? '#004ac6' : t.border}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isSelected ? '#004ac620' : t.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={isSelected ? '#004ac6' : t.textDim} /></div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#004ac6' : t.text }}>{format.label}</div><div style={{ fontSize: '12px', color: t.textDim }}>{format.desc}</div></div>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${isSelected ? '#004ac6' : t.border}`, background: isSelected ? '#004ac6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isSelected && <Check size={12} color="white" />}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: t.inputBg, borderRadius: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeAnnexes} onChange={(e) => setIncludeAnnexes(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#004ac6' }} />
                  <span style={{ fontSize: '13px', color: t.text }}>{l.includeAnnexes}</span>
                </label>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase' }}>{l.selectClauses}</h4>
                <button onClick={() => setSelectedClauses(selectedClauses.length === folders.length ? [] : folders.map(f => f.id))} style={{ background: 'none', border: 'none', color: '#004ac6', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>{selectedClauses.length === folders.length ? l.deselectAll : l.selectAll}</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {folders.map((folder) => (
                  <label key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: selectedClauses.includes(folder.id) ? '#004ac610' : t.inputBg, borderRadius: '10px', cursor: 'pointer', border: `1px solid ${selectedClauses.includes(folder.id) ? '#004ac640' : 'transparent'}` }}>
                    <input type="checkbox" checked={selectedClauses.includes(folder.id)} onChange={() => setSelectedClauses(prev => prev.includes(folder.id) ? prev.filter(id => id !== folder.id) : [...prev, folder.id])} style={{ width: '16px', height: '16px', accentColor: '#004ac6' }} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 500, color: t.text }}>{folder.name}</div><div style={{ fontSize: '11px', color: t.textDim }}>{folder.items} {l.items}</div></div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: folder.status === 'complete' ? '#004ac6' : '#f59e0b' }} />
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '24px', padding: '16px 20px', background: t.inputBg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '32px' }}>
              <div><div style={{ fontSize: '11px', color: t.textDim }}>{l.evidenceCount}</div><div style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>{folders.filter(f => selectedClauses.includes(f.id)).reduce((sum, f) => sum + f.items, 0)}</div></div>
              <div><div style={{ fontSize: '11px', color: t.textDim }}>{l.estimatedSize}</div><div style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>{`~${selectedClauses.length * 12} MB`}</div></div>
            </div>
            <button onClick={handleExport} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><Download size={20} /> {l.generatePackage}</button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ width: '480px', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: '24px', textAlign: 'center' }}>
            {exportProgress < 100 ? (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <RefreshCw size={36} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: t.text, marginBottom: '8px' }}>{l.generating}</h3>
                <div style={{ height: '8px', background: t.inputBg, borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ width: `${Math.min(exportProgress, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #004ac6, #3b82f6)', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '13px', color: t.textMuted }}>{Math.round(exportProgress)}%</span>
                <div style={{ marginTop: '16px' }}>
                  <button onClick={() => { setShowExportModal(false); setExportProgress(0); }} style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.textMuted, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle2 size={40} color="white" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#004ac6', marginBottom: '8px' }}>{l.exportReady}</h3>
                <p style={{ fontSize: '14px', color: t.textDim, marginBottom: '24px' }}>ISO27001_Audit_Package_2024.{selectedExportFormat}</p>
                <button onClick={() => { 
                  if (downloadUrl) {
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = `ISO27001_Audit_Package.${selectedExportFormat}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                  setShowExportModal(false); 
                  setExportProgress(0); 
                }} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '0 auto' }}>
                  <Download size={20} /> {l.downloadNow}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* AI Search Modal */}
      {(isAiSearching || aiResponse) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ width: '600px', maxHeight: '80vh', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${t.border}`, paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#004ac6' }}>
                <Sparkles size={20} />
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{language === 'es' ? 'Asistente de Auditoría IA' : 'AI Audit Assistant'}</h3>
              </div>
              <button onClick={() => { setIsAiSearching(false); setAiResponse(null); }} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', textAlign: 'left' }}>
              {isAiSearching ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '16px' }}>
                  <RefreshCw size={36} color="#004ac6" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '14px', color: t.textDim, fontWeight: 500 }}>
                    {language === 'es' ? 'Consultando RAG de evidencias y base de conocimiento...' : 'Consulting evidence RAG and knowledge base...'}
                  </p>
                </div>
              ) : aiResponse.error ? (
                <div style={{ color: '#ef4444', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', fontSize: '14px' }}>
                  <strong>Error:</strong> {aiResponse.message}
                </div>
              ) : (
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: t.text, whiteSpace: 'pre-line' }}>
                  <p style={{ fontWeight: 600, color: '#004ac6', marginBottom: '12px', fontSize: '15px' }}>
                    {language === 'es' ? `Respuesta para: "${searchQuery}"` : `Answer for: "${searchQuery}"`}
                  </p>
                  <div style={{ padding: '16px', background: t.inputBg, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    {aiResponse.text}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setIsAiSearching(false); setAiResponse(null); }} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                {language === 'es' ? 'Entendido' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditRoomScreen;