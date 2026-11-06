import React, { useState, useEffect, createContext, useContext } from 'react';
import { Shield, LayoutDashboard, Search, FileCheck, Database, Users, Settings, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle2, Clock, XCircle, Upload, Download, Eye, Sparkles, Bot, Send, ArrowRight, FileText, Lock, Zap, RefreshCw, Filter, MoreHorizontal, Plus, Folder, ExternalLink, Building2, Target, FolderUp, X, Check, CircleDot, FileUp, HelpCircle, AlertCircle, Sun, Moon, Globe, ChevronDown, MessageSquare, Key, Smartphone, Monitor, EyeOff, FilePlus2, GitMerge, Wand2, Edit3, RotateCcw, Copy, Trash2, Calendar, History, GitBranch, PenTool, UserCheck, Tag, Bookmark, Split, ArrowLeftRight, Bell, Command, UserCircle, Contrast } from 'lucide-react';

const ThemeContext = createContext();

const translations = {
  en: {
    dashboard: 'Dashboard', gapAnalysis: 'Gap Analysis', docGenerator: 'Doc Generator', riskMap: 'Risk Map', evidenceCenter: 'Evidence Center',
    documents: 'Documents', auditRoom: 'Audit Room', settings: 'Settings', commandCenter: 'Command Center',
    realtimeOverview: 'Real-time ISO 27001 compliance overview', synced: 'Synced', minAgo: 'min ago',
    exportReport: 'Export Report', healthScore: 'Health Score', ready: 'Ready', controlsImplemented: 'Controls Implemented',
    pendingActions: 'Pending Actions', highPriority: 'high priority', daysToAudit: 'Days to Audit',
    priorityActions: 'Priority Actions', viewAll: 'View all', due: 'Due', continueGapAnalysis: 'Continue Gap Analysis',
    completeAssessment: 'Complete your ISO 27001:2022 assessment', complete: 'complete', continue: 'Continue',
    integrationAlert: 'Integration Alert', reconnect: 'Reconnect', bulkUpload: 'Bulk Upload', saveProgress: 'Save Progress',
    overallProgress: 'Overall Progress', compliant: 'Compliant', partial: 'Partial', gaps: 'Gaps', phases: 'Phases',
    question: 'Question', of: 'of', critical: 'Critical', previous: 'Previous', uploadEvidence: 'Upload Evidence',
    required: 'Required', dragDrop: 'Drag & drop or', browse: 'browse', soaPreview: 'SOA Preview',
    clauseStatus: 'Clause Status', previewSoa: 'Preview SOA', needHelp: 'Need Help?', askDani: 'Ask Dani',
    matrix: 'Matrix', list: 'List', addRisk: 'Add Risk', riskScore: 'Risk Score', probability: 'Probability',
    impact: 'Impact', suggestedControls: 'Suggested Controls', clickRisk: 'Click a risk to view details',
    addIntegration: 'Add Integration', totalEvidences: 'Total Evidences', autoCollected: 'Auto-Collected',
    manualUpload: 'Manual Upload', activeConnectors: 'Active Connectors', evidences: 'evidences',
    connected: 'Connected', error: 'Error', pending: 'Pending', configure: 'Configure',
    documentManager: 'Document Manager', policiesProcedures: 'Policies and documentation',
    createDocument: 'Create Document', approved: 'Approved', pendingReview: 'Pending Review', drafts: 'Drafts',
    document: 'Document', status: 'Status', version: 'Version', updated: 'Updated', signatures: 'Signatures',
    readOnly: 'READ-ONLY', organizedEvidence: 'Organized evidence for auditors', downloadAuditPack: 'Download Audit Pack',
    semanticSearch: 'Semantic search...', aiSearch: 'AI Search', items: 'items',
    recentActivity: 'Recent Auditor Activity', externalAuditor: 'External Auditor',
    generateTemplate: 'Generate Template', skip: 'Skip', gapIdentified: 'Gap Identified', missingDocument: 'Missing Document',
    browseFiles: 'Browse Files', employeePortal: 'Employee Portal', highContrast: 'High Contrast', userManagement: 'User Management'
  },
  es: {
    dashboard: 'Panel', gapAnalysis: 'Análisis de Brechas', docGenerator: 'Generador de Docs', riskMap: 'Mapa de Riesgos', evidenceCenter: 'Centro de Evidencias',
    documents: 'Documentos', auditRoom: 'Sala de Auditoría', settings: 'Configuración', commandCenter: 'Centro de Mando',
    realtimeOverview: 'Visión general de cumplimiento ISO 27001', synced: 'Sincronizado hace', minAgo: 'min',
    exportReport: 'Exportar Informe', healthScore: 'Puntuación de Salud', ready: 'Listo', controlsImplemented: 'Controles Implementados',
    pendingActions: 'Acciones Pendientes', highPriority: 'alta prioridad', daysToAudit: 'Días para Auditoría',
    priorityActions: 'Acciones Prioritarias', viewAll: 'Ver todo', due: 'Vence', continueGapAnalysis: 'Continuar Análisis',
    completeAssessment: 'Completa tu evaluación ISO 27001:2022', complete: 'completado', continue: 'Continuar',
    integrationAlert: 'Alerta de Integración', reconnect: 'Reconectar', bulkUpload: 'Carga Masiva', saveProgress: 'Guardar',
    overallProgress: 'Progreso General', compliant: 'Cumple', partial: 'Parcial', gaps: 'Brechas', phases: 'Fases',
    question: 'Pregunta', of: 'de', critical: 'Crítico', previous: 'Anterior', uploadEvidence: 'Subir Evidencia',
    required: 'Requerido', dragDrop: 'Arrastra o', browse: 'buscar', soaPreview: 'Vista Previa SOA',
    clauseStatus: 'Estado de Cláusulas', previewSoa: 'Ver SOA', needHelp: '¿Necesitas Ayuda?', askDani: 'Preguntar a Dani',
    matrix: 'Matriz', list: 'Lista', addRisk: 'Agregar Riesgo', riskScore: 'Puntuación', probability: 'Probabilidad',
    impact: 'Impacto', suggestedControls: 'Controles Sugeridos', clickRisk: 'Haz clic en un riesgo',
    addIntegration: 'Agregar Integración', totalEvidences: 'Total Evidencias', autoCollected: 'Auto-Recolectadas',
    manualUpload: 'Carga Manual', activeConnectors: 'Conectores Activos', evidences: 'evidencias',
    connected: 'Conectado', error: 'Error', pending: 'Pendiente', configure: 'Configurar',
    documentManager: 'Gestor Documental', policiesProcedures: 'Políticas y documentación',
    createDocument: 'Crear Documento', approved: 'Aprobados', pendingReview: 'En Revisión', drafts: 'Borradores',
    document: 'Documento', status: 'Estado', version: 'Versión', updated: 'Actualizado', signatures: 'Firmas',
    readOnly: 'SOLO LECTURA', organizedEvidence: 'Evidencia para auditores', downloadAuditPack: 'Descargar Paquete',
    semanticSearch: 'Búsqueda semántica...', aiSearch: 'Búsqueda IA', items: 'elementos',
    recentActivity: 'Actividad del Auditor', externalAuditor: 'Auditor Externo',
    generateTemplate: 'Generar Plantilla', skip: 'Omitir', gapIdentified: 'Brecha Identificada', missingDocument: 'Documento Faltante',
    browseFiles: 'Buscar Archivos', employeePortal: 'Portal de Empleados', highContrast: 'Alto Contraste', userManagement: 'Gestión de Usuarios'
  },
  pt: {
    dashboard: 'Painel', gapAnalysis: 'Análise de Lacunas', docGenerator: 'Gerador de Docs', riskMap: 'Mapa de Riscos', evidenceCenter: 'Centro de Evidências',
    documents: 'Documentos', auditRoom: 'Sala de Auditoria', settings: 'Configurações', commandCenter: 'Centro de Comando',
    realtimeOverview: 'Visão geral ISO 27001 em tempo real', synced: 'Sincronizado há', minAgo: 'min',
    exportReport: 'Exportar Relatório', healthScore: 'Pontuação de Saúde', ready: 'Pronto', controlsImplemented: 'Controles Implementados',
    pendingActions: 'Ações Pendentes', highPriority: 'alta prioridade', daysToAudit: 'Dias para Auditoria',
    priorityActions: 'Ações Prioritárias', viewAll: 'Ver tudo', due: 'Vence', continueGapAnalysis: 'Continuar Análise',
    completeAssessment: 'Complete sua avaliação ISO 27001:2022', complete: 'completo', continue: 'Continuar',
    integrationAlert: 'Alerta de Integração', reconnect: 'Reconectar', bulkUpload: 'Upload em Massa', saveProgress: 'Salvar',
    overallProgress: 'Progresso Geral', compliant: 'Conforme', partial: 'Parcial', gaps: 'Lacunas', phases: 'Fases',
    question: 'Pergunta', of: 'de', critical: 'Crítico', previous: 'Anterior', uploadEvidence: 'Carregar Evidência',
    required: 'Obrigatório', dragDrop: 'Arraste ou', browse: 'procurar', soaPreview: 'Prévia do SOA',
    clauseStatus: 'Status das Cláusulas', previewSoa: 'Ver SOA', needHelp: 'Precisa de Ajuda?', askDani: 'Perguntar ao Dani',
    matrix: 'Matriz', list: 'Lista', addRisk: 'Adicionar Risco', riskScore: 'Pontuação', probability: 'Probabilidade',
    impact: 'Impacto', suggestedControls: 'Controles Sugeridos', clickRisk: 'Clique em um risco',
    addIntegration: 'Adicionar Integração', totalEvidences: 'Total de Evidências', autoCollected: 'Auto-Coletadas',
    manualUpload: 'Upload Manual', activeConnectors: 'Conectores Ativos', evidences: 'evidências',
    connected: 'Conectado', error: 'Erro', pending: 'Pendente', configure: 'Configurar',
    documentManager: 'Gerenciador de Documentos', policiesProcedures: 'Políticas e documentação',
    createDocument: 'Criar Documento', approved: 'Aprovados', pendingReview: 'Em Revisão', drafts: 'Rascunhos',
    document: 'Documento', status: 'Status', version: 'Versão', updated: 'Atualizado', signatures: 'Assinaturas',
    readOnly: 'SOMENTE LEITURA', organizedEvidence: 'Evidências para auditores', downloadAuditPack: 'Baixar Pacote',
    semanticSearch: 'Busca semântica...', aiSearch: 'Busca IA', items: 'itens',
    recentActivity: 'Atividade do Auditor', externalAuditor: 'Auditor Externo',
    generateTemplate: 'Gerar Modelo', skip: 'Pular', gapIdentified: 'Lacuna Identificada', missingDocument: 'Documento Faltando',
    browseFiles: 'Procurar Arquivos', employeePortal: 'Portal de Funcionários', highContrast: 'Alto Contraste', userManagement: 'Gestão de Usuários'
  }
};

const useTranslation = () => {
  const { language } = useContext(ThemeContext);
  return (key) => translations[language]?.[key] || translations.en[key] || key;
};

// ============================================
// COMMAND PALETTE COMPONENT (Cmd+K)
// ============================================
function CommandPalette({ isOpen, onClose, onNavigate, darkMode, theme: t, language }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const labels = {
    en: { placeholder: 'Search commands, controls, evidence...', noResults: 'No results found', navigation: 'Navigation', actions: 'Quick Actions', controls: 'Controls' },
    es: { placeholder: 'Buscar comandos, controles, evidencias...', noResults: 'Sin resultados', navigation: 'Navegación', actions: 'Acciones Rápidas', controls: 'Controles' },
    pt: { placeholder: 'Buscar comandos, controles, evidências...', noResults: 'Sem resultados', navigation: 'Navegação', actions: 'Ações Rápidas', controls: 'Controles' }
  };
  const l = labels[language] || labels.en;

  const commands = [
    { id: 'dashboard', type: 'nav', name: { en: 'Dashboard', es: 'Panel', pt: 'Painel' }, icon: LayoutDashboard, shortcut: 'G D' },
    { id: 'gap-analysis', type: 'nav', name: { en: 'Gap Analysis', es: 'Análisis de Brechas', pt: 'Análise de Lacunas' }, icon: Search, shortcut: 'G G' },
    { id: 'doc-generator', type: 'nav', name: { en: 'Document Generator', es: 'Generador de Docs', pt: 'Gerador de Docs' }, icon: FilePlus2, shortcut: 'G O' },
    { id: 'risk-map', type: 'nav', name: { en: 'Risk Map', es: 'Mapa de Riesgos', pt: 'Mapa de Riscos' }, icon: AlertTriangle, shortcut: 'G R' },
    { id: 'predictive', icon: <BrainCircuit size={20} />, label: 'Predicción IA'},
    { id: 'evidence', type: 'nav', name: { en: 'Evidence Center', es: 'Centro de Evidencias', pt: 'Centro de Evidências' }, icon: Database, shortcut: 'G E' },
    { id: 'audit-room', type: 'nav', name: { en: 'Audit Room', es: 'Sala de Auditoría', pt: 'Sala de Auditoria' }, icon: Eye, shortcut: 'G A' },
    { id: 'employee-portal', type: 'nav', name: { en: 'Employee Portal', es: 'Portal de Empleados', pt: 'Portal de Funcionários' }, icon: UserCircle, shortcut: 'G P' },
    { id: 'upload-evidence', type: 'action', name: { en: 'Upload Evidence', es: 'Subir Evidencia', pt: 'Upload de Evidência' }, icon: Upload, shortcut: 'U' },
    { id: 'new-risk', type: 'action', name: { en: 'Add New Risk', es: 'Agregar Riesgo', pt: 'Adicionar Risco' }, icon: Plus, shortcut: 'N R' },
    { id: 'export-report', type: 'action', name: { en: 'Export Audit Report', es: 'Exportar Informe', pt: 'Exportar Relatório' }, icon: Download, shortcut: 'E' },
    { id: 'a5.1', type: 'control', name: { en: 'A.5.1 - Information Security Policies', es: 'A.5.1 - Políticas de Seguridad', pt: 'A.5.1 - Políticas de Segurança' }, icon: FileText },
    { id: 'a5.15', type: 'control', name: { en: 'A.5.15 - Access Control', es: 'A.5.15 - Control de Acceso', pt: 'A.5.15 - Controle de Acesso' }, icon: Lock },
    { id: 'a8.24', type: 'control', name: { en: 'A.8.24 - Cryptography', es: 'A.8.24 - Criptografía', pt: 'A.8.24 - Criptografia' }, icon: Key },
    { id: 'a5.24', type: 'control', name: { en: 'A.5.24 - Incident Management', es: 'A.5.24 - Gestión de Incidentes', pt: 'A.5.24 - Gestão de Incidentes' }, icon: AlertCircle },
  ];

  const filteredCommands = query 
    ? commands.filter(cmd => 
        (cmd.name[language] || cmd.name.en).toLowerCase().includes(query.toLowerCase()) ||
        cmd.id.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const groupedCommands = {
    nav: filteredCommands.filter(c => c.type === 'nav'),
    action: filteredCommands.filter(c => c.type === 'action'),
    control: filteredCommands.filter(c => c.type === 'control')
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        const cmd = filteredCommands[selectedIndex];
        if (cmd.type === 'nav') {
          onNavigate(cmd.id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onNavigate, onClose]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', zIndex: 1000 }} onClick={onClose}>
      <div style={{ width: '580px', maxHeight: '70vh', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', overflow: 'hidden', border: `1px solid ${t.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Search size={20} color={t.textDim} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={l.placeholder} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontSize: '16px' }} />
          <kbd style={{ padding: '4px 8px', background: t.inputBg, borderRadius: '6px', fontSize: '11px', color: t.textDim, fontFamily: 'monospace' }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: '50vh', overflowY: 'auto', padding: '8px' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: t.textDim }}>{l.noResults}</div>
          ) : (
            <>
              {groupedCommands.nav.length > 0 && (
                <div>
                  <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.navigation}</div>
                  {groupedCommands.nav.map((cmd) => {
                    const Icon = cmd.icon;
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <div key={cmd.id} onClick={() => { onNavigate(cmd.id); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isSelected ? '#10b98120' : 'transparent', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isSelected ? '#10b98130' : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} color={isSelected ? '#10b981' : t.textDim} />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: isSelected ? '#10b981' : t.text }}>{cmd.name[language] || cmd.name.en}</span>
                        {cmd.shortcut && <kbd style={{ padding: '3px 8px', background: t.inputBg, borderRadius: '4px', fontSize: '10px', color: t.textDim, fontFamily: 'monospace' }}>{cmd.shortcut}</kbd>}
                      </div>
                    );
                  })}
                </div>
              )}
              {groupedCommands.action.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.actions}</div>
                  {groupedCommands.action.map((cmd) => {
                    const Icon = cmd.icon;
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <div key={cmd.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isSelected ? '#3b82f620' : 'transparent', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isSelected ? '#3b82f630' : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} color={isSelected ? '#3b82f6' : t.textDim} />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: isSelected ? '#3b82f6' : t.text }}>{cmd.name[language] || cmd.name.en}</span>
                        {cmd.shortcut && <kbd style={{ padding: '3px 8px', background: t.inputBg, borderRadius: '4px', fontSize: '10px', color: t.textDim, fontFamily: 'monospace' }}>{cmd.shortcut}</kbd>}
                      </div>
                    );
                  })}
                </div>
              )}
              {groupedCommands.control.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.controls}</div>
                  {groupedCommands.control.map((cmd) => {
                    const Icon = cmd.icon;
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <div key={cmd.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isSelected ? '#8b5cf620' : 'transparent', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isSelected ? '#8b5cf630' : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} color={isSelected ? '#8b5cf6' : t.textDim} />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: isSelected ? '#8b5cf6' : t.text }}>{cmd.name[language] || cmd.name.en}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: t.textDim }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><kbd style={{ padding: '2px 6px', background: t.inputBg, borderRadius: '4px' }}>↑↓</kbd> navigate</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><kbd style={{ padding: '2px 6px', background: t.inputBg, borderRadius: '4px' }}>↵</kbd> select</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><kbd style={{ padding: '2px 6px', background: t.inputBg, borderRadius: '4px' }}>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// NOTIFICATION CENTER COMPONENT
// ============================================
function NotificationCenter({ isOpen, onClose, darkMode, theme: t, language }) {
  const labels = {
    en: { title: 'Notifications', markAllRead: 'Mark all read', noNotifications: 'No new notifications', evidenceExpired: 'Evidence expired', controlFailed: 'Control check failed', newApproval: 'New approval required', slackDigest: 'Slack Digest', viewAll: 'View All' },
    es: { title: 'Notificaciones', markAllRead: 'Marcar todo leído', noNotifications: 'Sin notificaciones nuevas', evidenceExpired: 'Evidencia expirada', controlFailed: 'Verificación fallida', newApproval: 'Aprobación requerida', slackDigest: 'Resumen Slack', viewAll: 'Ver Todo' },
    pt: { title: 'Notificações', markAllRead: 'Marcar tudo lido', noNotifications: 'Sem notificações novas', evidenceExpired: 'Evidência expirada', controlFailed: 'Verificação falhou', newApproval: 'Aprovação necessária', slackDigest: 'Resumo Slack', viewAll: 'Ver Tudo' }
  };
  const l = labels[language] || labels.en;

  const notifications = [
    { id: 1, type: 'warning', title: l.evidenceExpired, message: 'Backup Verification Log - expired 5 days ago', time: '10 min ago', read: false, icon: AlertTriangle, color: '#ef4444' },
    { id: 2, type: 'error', title: l.controlFailed, message: 'MFA disabled for admin@company.com in Google Workspace', time: '1 hour ago', read: false, icon: XCircle, color: '#ef4444' },
    { id: 3, type: 'info', title: l.newApproval, message: 'Access Control Policy v1.4 awaiting your review', time: '2 hours ago', read: false, icon: Clock, color: '#f59e0b' },
    { id: 4, type: 'slack', title: l.slackDigest, message: '3 new comments on your evidence uploads', time: '5 hours ago', read: true, icon: MessageSquare, color: '#8b5cf6' },
    { id: 5, type: 'success', title: 'Evidence auto-collected', message: 'AWS S3 Encryption Config synced', time: 'Yesterday', read: true, icon: CheckCircle2, color: '#10b981' }
  ];

  if (!isOpen) return null;

  return (
    <div style={{ position: 'absolute', top: '50px', right: '0', width: '380px', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: `1px solid ${t.border}`, overflow: 'hidden', zIndex: 100 }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{l.title}</h3>
        <button style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>{l.markAllRead}</button>
      </div>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {notifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <div key={notif.id} style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', gap: '12px', background: notif.read ? 'transparent' : (darkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)'), cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${notif.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={notif.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{notif.title}</span>
                  {!notif.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />}
                </div>
                <p style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.message}</p>
                <span style={{ fontSize: '11px', color: t.textMuted }}>{notif.time}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${t.border}`, textAlign: 'center' }}>
        <button style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{l.viewAll}</button>
      </div>
    </div>
  );
}

// ============================================
// SIDEBAR PROGRESS RINGS (Gamification)
// ============================================
function SidebarProgressRings({ darkMode, theme: t, language, collapsed }) {
  const labels = {
    en: { gapProgress: 'Gap Analysis', domains: 'By Domain', people: 'People', technology: 'Technology', physical: 'Physical', processes: 'Processes', overall: 'Overall' },
    es: { gapProgress: 'Análisis de Brechas', domains: 'Por Dominio', people: 'Personas', technology: 'Tecnología', physical: 'Físico', processes: 'Procesos', overall: 'General' },
    pt: { gapProgress: 'Análise de Lacunas', domains: 'Por Domínio', people: 'Pessoas', technology: 'Tecnologia', physical: 'Físico', processes: 'Processos', overall: 'Geral' }
  };
  const l = labels[language] || labels.en;

  const domainProgress = [
    { id: 'people', name: l.people, progress: 82, color: '#3b82f6' },
    { id: 'technology', name: l.technology, progress: 68, color: '#8b5cf6' },
    { id: 'physical', name: l.physical, progress: 91, color: '#10b981' },
    { id: 'processes', name: l.processes, progress: 55, color: '#f59e0b' }
  ];

  const overallProgress = Math.round(domainProgress.reduce((sum, d) => sum + d.progress, 0) / domainProgress.length);

  if (collapsed) {
    return (
      <div style={{ padding: '12px 8px', borderTop: `1px solid ${t.border}`, marginTop: 'auto' }}>
        <div style={{ width: '48px', height: '48px', margin: '0 auto', position: 'relative' }}>
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="4" />
            <circle cx="24" cy="24" r="20" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${overallProgress * 1.26} 126`} transform="rotate(-90 24 24)" />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '11px', fontWeight: 700, color: '#10b981' }}>{overallProgress}%</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', borderTop: `1px solid ${t.border}`, marginTop: 'auto' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{l.gapProgress}</div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div style={{ width: '64px', height: '64px', position: 'relative' }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="6" />
            <circle cx="32" cy="32" r="26" fill="none" stroke="url(#overallGradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${overallProgress * 1.63} 163`} transform="rotate(-90 32 32)" />
            <defs><linearGradient id="overallGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '16px', fontWeight: 700, color: '#10b981' }}>{overallProgress}%</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{l.overall}</div>
          <div style={{ fontSize: '11px', color: t.textDim }}>4 {l.domains.toLowerCase()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {domainProgress.map((domain) => (
          <div key={domain.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: t.textMuted }}>{domain.name}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: domain.color }}>{domain.progress}%</span>
            </div>
            <div style={{ height: '6px', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${domain.progress}%`, height: '100%', background: domain.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EMPLOYEE AWARENESS PORTAL
// ============================================
function EmployeePortal({ darkMode, theme: t, language, onClose }) {
  const [acknowledgedPolicies, setAcknowledgedPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const labels = {
    en: { title: 'Employee Awareness Portal', subtitle: 'Review and acknowledge company policies', pendingAcknowledgments: 'Pending', completed: 'Completed', policies: 'Policies', readAndAccept: 'I have read and accept this policy', acknowledged: 'Acknowledged', acknowledge: 'Acknowledge', viewPolicy: 'View Policy', lastUpdated: 'Last updated', mandatory: 'Mandatory', complianceNote: 'This acknowledgment serves as evidence for ISO 27001 clause 7.3 (Awareness)', exit: 'Exit Portal' },
    es: { title: 'Portal de Concientización', subtitle: 'Revisa y acepta las políticas de la empresa', pendingAcknowledgments: 'Pendientes', completed: 'Completados', policies: 'Políticas', readAndAccept: 'He leído y acepto esta política', acknowledged: 'Aceptado', acknowledge: 'Aceptar', viewPolicy: 'Ver Política', lastUpdated: 'Última actualización', mandatory: 'Obligatorio', complianceNote: 'Esta aceptación sirve como evidencia para la cláusula 7.3 de ISO 27001', exit: 'Salir del Portal' },
    pt: { title: 'Portal de Conscientização', subtitle: 'Revise e aceite as políticas da empresa', pendingAcknowledgments: 'Pendentes', completed: 'Concluídos', policies: 'Políticas', readAndAccept: 'Li e aceito esta política', acknowledged: 'Aceito', acknowledge: 'Aceitar', viewPolicy: 'Ver Política', lastUpdated: 'Última atualização', mandatory: 'Obrigatório', complianceNote: 'Esta aceitação serve como evidência para a cláusula 7.3 da ISO 27001', exit: 'Sair do Portal' }
  };
  const l = labels[language] || labels.en;

  const policies = [
    { id: 1, title: 'Information Security Policy', version: 'v2.1', mandatory: true, lastUpdated: '2024-12-01', summary: 'Defines the overall approach to information security within the organization.' },
    { id: 2, title: 'Acceptable Use Policy', version: 'v1.5', mandatory: true, lastUpdated: '2024-11-15', summary: 'Guidelines for appropriate use of company IT resources and data.' },
    { id: 3, title: 'Password Policy', version: 'v1.3', mandatory: true, lastUpdated: '2024-10-20', summary: 'Requirements for creating and managing secure passwords.' },
    { id: 4, title: 'Remote Work Security Policy', version: 'v1.2', mandatory: true, lastUpdated: '2024-11-01', summary: 'Security requirements when working outside the office.' },
    { id: 5, title: 'Data Classification Policy', version: 'v1.0', mandatory: false, lastUpdated: '2024-09-15', summary: 'How to classify and handle different types of data.' },
    { id: 6, title: 'Incident Reporting Procedure', version: 'v1.4', mandatory: true, lastUpdated: '2024-12-05', summary: 'Steps to follow when you suspect a security incident.' }
  ];

  const pendingCount = policies.filter(p => p.mandatory && !acknowledgedPolicies.includes(p.id)).length;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: darkMode ? '#0f172a' : '#f8fafc', zIndex: 1000, overflow: 'auto' }}>
      <div style={{ background: t.cardBg, borderBottom: `1px solid ${t.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>{l.title}</h1>
            <p style={{ fontSize: '13px', color: t.textDim }}>{l.subtitle}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>{l.exit}</button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: pendingCount > 0 ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)' : t.cardBg, border: `1px solid ${pendingCount > 0 ? 'rgba(245, 158, 11, 0.3)' : t.border}`, borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: pendingCount > 0 ? 'rgba(245, 158, 11, 0.2)' : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={28} color={pendingCount > 0 ? '#f59e0b' : t.textDim} />
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: pendingCount > 0 ? '#f59e0b' : t.text }}>{pendingCount}</div>
              <div style={{ fontSize: '14px', color: t.textDim }}>{l.pendingAcknowledgments}</div>
            </div>
          </div>
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={28} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>{acknowledgedPolicies.length}</div>
              <div style={{ fontSize: '14px', color: t.textDim }}>{l.completed}</div>
            </div>
          </div>
        </div>

        <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}` }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: t.text }}>{l.policies}</h2>
          </div>
          <div>
            {policies.map((policy) => {
              const isAcknowledged = acknowledgedPolicies.includes(policy.id);
              return (
                <div key={policy.id} style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: isAcknowledged ? 'rgba(16, 185, 129, 0.15)' : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isAcknowledged ? <CheckCircle2 size={22} color="#10b981" /> : <FileText size={22} color={t.textDim} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: t.text }}>{policy.title}</span>
                      <span style={{ fontSize: '11px', color: t.textDim, background: t.inputBg, padding: '2px 8px', borderRadius: '4px' }}>{policy.version}</span>
                      {policy.mandatory && <span style={{ fontSize: '10px', fontWeight: 600, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{l.mandatory}</span>}
                    </div>
                    <p style={{ fontSize: '13px', color: t.textDim }}>{policy.summary}</p>
                  </div>
                  {isAcknowledged ? (
                    <span style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>{l.acknowledged}</span>
                  ) : (
                    <button onClick={() => setSelectedPolicy(policy)} style={{ padding: '10px 20px', background: '#10b981', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{l.viewPolicy}</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: '24px', padding: '16px 20px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={20} color="#8b5cf6" />
          <p style={{ fontSize: '13px', color: '#8b5cf6' }}>{l.complianceNote}</p>
        </div>
      </div>

      {selectedPolicy && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ width: '600px', maxHeight: '80vh', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: t.text }}>{selectedPolicy.title}</h3>
                <span style={{ fontSize: '12px', color: t.textDim }}>{selectedPolicy.version} • {l.lastUpdated}: {selectedPolicy.lastUpdated}</span>
              </div>
              <button onClick={() => setSelectedPolicy(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: t.inputBg, border: 'none', cursor: 'pointer', color: t.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              <p style={{ fontSize: '14px', color: t.textMuted, lineHeight: '1.8' }}>{selectedPolicy.summary}<br /><br />Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.<br /><br />Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: '#10b981' }} />
                <span style={{ fontSize: '13px', color: t.text }}>{l.readAndAccept}</span>
              </label>
              <button onClick={() => { setAcknowledgedPolicies(prev => [...prev, selectedPolicy.id]); setSelectedPolicy(null); }} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{l.acknowledge}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// CAPA TRACKER COMPONENT
// ============================================
function CAPATracker({ darkMode, theme: t, language }) {
  const [expandedCapa, setExpandedCapa] = useState(null);
  
  const labels = {
    en: { title: 'CAPA Tracker', subtitle: 'Non-conformities & Corrective Actions (Clause 10)', addNonConformity: 'Add NC', open: 'Open', inProgress: 'In Progress', resolved: 'Resolved', closed: 'Closed', rootCause: 'Root Cause', correctiveAction: 'Corrective Action', assignee: 'Assignee', source: 'Source', viewDetails: 'View Details', overdue: 'Overdue', daysLeft: 'days left', high: 'High', medium: 'Medium', low: 'Low', internalAudit: 'Internal Audit', preAudit: 'Pre-Audit' },
    es: { title: 'Rastreador CAPA', subtitle: 'No Conformidades y Acciones Correctivas (Cláusula 10)', addNonConformity: 'Agregar NC', open: 'Abierto', inProgress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado', rootCause: 'Causa Raíz', correctiveAction: 'Acción Correctiva', assignee: 'Responsable', source: 'Fuente', viewDetails: 'Ver Detalles', overdue: 'Vencido', daysLeft: 'días restantes', high: 'Alto', medium: 'Medio', low: 'Bajo', internalAudit: 'Auditoría Interna', preAudit: 'Pre-Auditoría' },
    pt: { title: 'Rastreador CAPA', subtitle: 'Não Conformidades e Ações Corretivas (Cláusula 10)', addNonConformity: 'Adicionar NC', open: 'Aberto', inProgress: 'Em Progresso', resolved: 'Resolvido', closed: 'Fechado', rootCause: 'Causa Raiz', correctiveAction: 'Ação Corretiva', assignee: 'Responsável', source: 'Fonte', viewDetails: 'Ver Detalhes', overdue: 'Atrasado', daysLeft: 'dias restantes', high: 'Alto', medium: 'Médio', low: 'Baixo', internalAudit: 'Auditoria Interna', preAudit: 'Pré-Auditoria' }
  };
  const l = labels[language] || labels.en;

  const capas = [
    { id: 'NC-2024-015', title: 'Missing access review documentation', source: 'preAudit', status: 'inProgress', priority: 'high', dueDate: '2024-12-20', assignee: 'Carlos López', control: 'A.5.18', rootCause: 'No documented procedure for quarterly access reviews', correctiveAction: 'Implement automated access review process', progress: 60 },
    { id: 'NC-2024-014', title: 'Incomplete security awareness training', source: 'internalAudit', status: 'open', priority: 'medium', dueDate: '2024-12-25', assignee: 'Ana Martínez', control: 'A.6.3', rootCause: 'Manual tracking system with no enforcement', correctiveAction: 'Deploy LMS with mandatory completion tracking', progress: 20 },
    { id: 'NC-2024-013', title: 'Backup verification not performed monthly', source: 'internalAudit', status: 'resolved', priority: 'high', dueDate: '2024-12-10', assignee: 'Pedro Sánchez', control: 'A.8.13', rootCause: 'No automated backup verification schedule', correctiveAction: 'Implemented automated backup testing with AWS', progress: 100 }
  ];

  const getStatusColor = (status) => ({ open: '#ef4444', inProgress: '#f59e0b', resolved: '#10b981', closed: '#6b7280' }[status] || '#6b7280');
  const getPriorityColor = (priority) => ({ high: '#ef4444', medium: '#f59e0b', low: '#10b981' }[priority] || '#6b7280');

  return (
    <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '24px', border: `1px solid ${t.border}`, marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{l.title}</h3>
            <p style={{ fontSize: '12px', color: t.textDim }}>{l.subtitle}</p>
          </div>
        </div>
        <button style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} />{l.addNonConformity}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[{ label: l.open, count: capas.filter(c => c.status === 'open').length, color: '#ef4444' }, { label: l.inProgress, count: capas.filter(c => c.status === 'inProgress').length, color: '#f59e0b' }, { label: l.resolved, count: capas.filter(c => c.status === 'resolved').length, color: '#10b981' }, { label: l.closed, count: capas.filter(c => c.status === 'closed').length, color: '#6b7280' }].map((stat) => (
          <div key={stat.label} style={{ padding: '12px', background: t.inputBg, borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.count}</div>
            <div style={{ fontSize: '11px', color: t.textDim }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {capas.map((capa) => {
          const isExpanded = expandedCapa === capa.id;
          const daysLeft = Math.ceil((new Date(capa.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysLeft < 0 && capa.status !== 'resolved';

          return (
            <div key={capa.id} style={{ background: t.inputBg, borderRadius: '12px', border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.3)' : t.border}`, overflow: 'hidden' }}>
              <div onClick={() => setExpandedCapa(isExpanded ? null : capa.id)} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor(capa.status), boxShadow: `0 0 8px ${getStatusColor(capa.status)}60` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: t.textDim, fontFamily: 'monospace' }}>{capa.id}</span>
                    <span style={{ padding: '2px 8px', background: `${getPriorityColor(capa.priority)}20`, borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: getPriorityColor(capa.priority) }}>{l[capa.priority]}</span>
                    <span style={{ padding: '2px 8px', background: '#8b5cf620', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: '#8b5cf6' }}>{capa.control}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: t.text }}>{capa.title}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: isOverdue ? '#ef4444' : t.textDim }}>{isOverdue ? l.overdue : `${Math.abs(daysLeft)} ${l.daysLeft}`}</div>
                  <div style={{ fontSize: '11px', color: t.textMuted }}>{capa.dueDate}</div>
                </div>
                <div style={{ width: '80px' }}>
                  <div style={{ height: '6px', background: t.hoverBg, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${capa.progress}%`, height: '100%', background: getStatusColor(capa.status), borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: t.textDim, textAlign: 'right', marginTop: '4px' }}>{capa.progress}%</div>
                </div>
                <ChevronDown size={18} color={t.textDim} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
              </div>
              {isExpanded && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${t.border}`, marginTop: '-1px' }}>
                  <div style={{ paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', marginBottom: '6px' }}>{l.rootCause}</div>
                      <p style={{ fontSize: '13px', color: t.text, lineHeight: '1.5' }}>{capa.rootCause}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', marginBottom: '6px' }}>{l.correctiveAction}</div>
                      <p style={{ fontSize: '13px', color: t.text, lineHeight: '1.5' }}>{capa.correctiveAction}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '12px', color: t.textDim }}>{l.assignee}: <strong style={{ color: t.text }}>{capa.assignee}</strong></span>
                      <span style={{ fontSize: '12px', color: t.textDim }}>{l.source}: <strong style={{ color: t.text }}>{l[capa.source]}</strong></span>
                    </div>
                    <button style={{ padding: '8px 14px', background: '#10b98120', border: '1px solid #10b98140', borderRadius: '8px', color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{l.viewDetails}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// INTERACTIVE SOA COMPONENT
// ============================================
function InteractiveSOA({ darkMode, theme: t, language }) {
  const [filterApplicable, setFilterApplicable] = useState('all');
  const [showJustificationModal, setShowJustificationModal] = useState(null);

  const labels = {
    en: { title: 'Statement of Applicability (SOA)', control: 'Control', description: 'Description', applicable: 'Applicable', notApplicable: 'Not Applicable', justification: 'Justification', status: 'Status', implemented: 'Implemented', planned: 'Planned', notImplemented: 'Not Implemented', showAll: 'All', showApplicable: 'Applicable', showNotApplicable: 'Not Applicable', required: 'Required', autoSaved: 'Auto-saved' },
    es: { title: 'Declaración de Aplicabilidad (SOA)', control: 'Control', description: 'Descripción', applicable: 'Aplica', notApplicable: 'No Aplica', justification: 'Justificación', status: 'Estado', implemented: 'Implementado', planned: 'Planificado', notImplemented: 'No Implementado', showAll: 'Todos', showApplicable: 'Aplica', showNotApplicable: 'No Aplica', required: 'Requerido', autoSaved: 'Auto-guardado' },
    pt: { title: 'Declaração de Aplicabilidade (SOA)', control: 'Controle', description: 'Descrição', applicable: 'Aplicável', notApplicable: 'Não Aplicável', justification: 'Justificativa', status: 'Status', implemented: 'Implementado', planned: 'Planejado', notImplemented: 'Não Implementado', showAll: 'Todos', showApplicable: 'Aplicável', showNotApplicable: 'Não Aplicável', required: 'Obrigatório', autoSaved: 'Auto-salvo' }
  };
  const l = labels[language] || labels.en;

  const [controls, setControls] = useState([
    { id: 'A.5.1', name: 'Policies for information security', category: 'Organizational', applicable: true, status: 'implemented', justification: 'Required for ISMS framework establishment' },
    { id: 'A.5.2', name: 'Information security roles', category: 'Organizational', applicable: true, status: 'implemented', justification: 'Mandatory for security governance' },
    { id: 'A.5.15', name: 'Access control', category: 'Organizational', applicable: true, status: 'implemented', justification: 'Critical for data protection' },
    { id: 'A.5.16', name: 'Identity management', category: 'Organizational', applicable: true, status: 'planned', justification: 'Scheduled for Q1 2025' },
    { id: 'A.7.4', name: 'Physical security monitoring', category: 'Physical', applicable: false, status: 'notImplemented', justification: 'No physical data center - cloud only' },
    { id: 'A.8.1', name: 'User endpoint devices', category: 'Technological', applicable: true, status: 'implemented', justification: 'All employees use company devices' },
    { id: 'A.8.24', name: 'Use of cryptography', category: 'Technological', applicable: true, status: 'implemented', justification: 'TLS 1.3 and AES-256 in use' }
  ]);

  const toggleApplicable = (id) => {
    setControls(prev => prev.map(c => c.id === id ? { ...c, applicable: !c.applicable } : c));
  };

  const updateStatus = (id, status) => {
    setControls(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const filteredControls = controls.filter(c => {
    if (filterApplicable === 'all') return true;
    if (filterApplicable === 'applicable') return c.applicable;
    if (filterApplicable === 'notApplicable') return !c.applicable;
    return true;
  });

  return (
    <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden', marginTop: '24px' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck size={22} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{l.title}</h3>
            <p style={{ fontSize: '12px', color: t.textDim }}>{controls.filter(c => c.applicable).length} {l.applicable} • {controls.filter(c => c.applicable && c.status === 'implemented').length} {l.implemented}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[{ id: 'all', label: l.showAll }, { id: 'applicable', label: l.showApplicable }, { id: 'notApplicable', label: l.showNotApplicable }].map((filter) => (
            <button key={filter.id} onClick={() => setFilterApplicable(filter.id)} style={{ padding: '8px 14px', background: filterApplicable === filter.id ? '#8b5cf620' : 'transparent', border: `1px solid ${filterApplicable === filter.id ? '#8b5cf6' : t.border}`, borderRadius: '8px', color: filterApplicable === filter.id ? '#8b5cf6' : t.textMuted, fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>{filter.label}</button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', width: '100px' }}>{l.control}</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.description}</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', width: '140px' }}>{l.applicable}?</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', width: '150px' }}>{l.status}</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.justification}</th>
            </tr>
          </thead>
          <tbody>
            {filteredControls.map((control) => (
              <tr key={control.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: '16px 20px' }}><span style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', fontFamily: 'monospace' }}>{control.id}</span></td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '13px', color: t.text }}>{control.name}</div>
                  <span style={{ fontSize: '11px', color: t.textDim }}>{control.category}</span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button onClick={() => toggleApplicable(control.id)} style={{ padding: '6px 12px', background: control.applicable ? '#10b98120' : 'transparent', border: `1px solid ${control.applicable ? '#10b981' : t.border}`, borderRadius: '6px 0 0 6px', color: control.applicable ? '#10b981' : t.textDim, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{l.applicable}</button>
                    <button onClick={() => toggleApplicable(control.id)} style={{ padding: '6px 12px', background: !control.applicable ? '#ef444420' : 'transparent', border: `1px solid ${!control.applicable ? '#ef4444' : t.border}`, borderRadius: '0 6px 6px 0', color: !control.applicable ? '#ef4444' : t.textDim, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{l.notApplicable}</button>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {control.applicable && (
                    <select value={control.status} onChange={(e) => updateStatus(control.id, e.target.value)} style={{ padding: '6px 10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text, fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
                      <option value="implemented">{l.implemented}</option>
                      <option value="planned">{l.planned}</option>
                      <option value="notImplemented">{l.notImplemented}</option>
                    </select>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: control.justification ? t.textMuted : '#ef4444', fontStyle: control.justification ? 'normal' : 'italic' }}>{control.justification || l.required}</span>
                    <button onClick={() => setShowJustificationModal(control)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: t.textDim }}><Edit3 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981' }}>
        <CheckCircle2 size={14} /><span>{l.autoSaved}</span>
      </div>
    </div>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function DaniPlatform() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState('en');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showEmployeePortal, setShowEmployeePortal] = useState(false);

  // Command Palette keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' }
  ];

  const theme = {
    dark: { bg: 'linear-gradient(135deg, #0a0f1c 0%, #111827 50%, #0d1321 100%)', cardBg: 'rgba(15, 23, 42, 0.6)', sidebarBg: 'rgba(15, 23, 42, 0.8)', text: '#e2e8f0', textMuted: '#94a3b8', textDim: '#64748b', border: 'rgba(255,255,255,0.06)', inputBg: 'rgba(255,255,255,0.05)', hoverBg: 'rgba(255,255,255,0.03)' },
    light: { bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)', cardBg: 'rgba(255, 255, 255, 0.8)', sidebarBg: 'rgba(255, 255, 255, 0.9)', text: '#1e293b', textMuted: '#475569', textDim: '#64748b', border: 'rgba(0,0,0,0.08)', inputBg: 'rgba(0,0,0,0.03)', hoverBg: 'rgba(0,0,0,0.02)' },
    highContrast: { bg: '#000000', cardBg: '#000000', sidebarBg: '#000000', text: '#ffffff', textMuted: '#ffffff', textDim: '#cccccc', border: '#ffffff', inputBg: '#1a1a1a', hoverBg: '#333333' }
  };

  const t = highContrast ? theme.highContrast : theme[darkMode ? 'dark' : 'light'];
  const navLabels = translations[language];

  const navItems = [
    { id: 'dashboard', label: navLabels.dashboard, icon: LayoutDashboard },
    { id: 'gap-analysis', label: navLabels.gapAnalysis, icon: Search },
    { id: 'doc-generator', label: navLabels.docGenerator, icon: FilePlus2 },
    { id: 'risk-map', label: navLabels.riskMap, icon: AlertTriangle },
    { id: 'evidence', label: navLabels.evidenceCenter, icon: Database },
    { id: 'documents', label: navLabels.documents, icon: FileText },
    { id: 'audit-room', label: navLabels.auditRoom, icon: FileCheck },
    { id: 'user-management', label: navLabels.userManagement, icon: Users },
  ];

  const handleNavigate = (screen) => {
    if (screen === 'employee-portal') {
      setShowEmployeePortal(true);
    } else {
      setActiveScreen(screen);
    }
  };

  const unreadNotifications = 3;

  return (
    <ThemeContext.Provider value={{ darkMode, highContrast, theme: t, language }}>
      <div style={{ minHeight: '100vh', background: t.bg, fontFamily: "'DM Sans', -apple-system, sans-serif", color: t.text, display: 'flex', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' }}>
        
        {/* Ambient Background */}
        {!highContrast && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', background: `radial-gradient(circle, rgba(16, 185, 129, ${darkMode ? '0.08' : '0.12'}) 0%, transparent 70%)`, borderRadius: '50%', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', bottom: '-10%', left: '20%', width: '400px', height: '400px', background: `radial-gradient(circle, rgba(59, 130, 246, ${darkMode ? '0.06' : '0.1'}) 0%, transparent 70%)`, borderRadius: '50%', filter: 'blur(40px)' }} />
          </div>
        )}

        {/* Sidebar */}
        <aside style={{ width: sidebarCollapsed ? '80px' : '260px', background: t.sidebarBg, backdropFilter: 'blur(20px)', borderRight: `1px solid ${t.border}`, padding: '24px 16px', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', position: 'relative', zIndex: 10 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} color="white" />
            </div>
            {!sidebarCollapsed && <div><div style={{ fontWeight: 700, fontSize: '20px' }}>Dani</div><div style={{ fontSize: '11px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px' }}>ISO 27001</div></div>}
          </div>

          {/* Command Palette Trigger */}
          {!sidebarCollapsed && (
            <button 
              onClick={() => setCommandPaletteOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.textDim, fontSize: '13px', cursor: 'pointer', marginBottom: '20px', width: '100%', textAlign: 'left' }}
            >
              <Search size={16} />
              <span style={{ flex: 1 }}>Search...</span>
              <kbd style={{ padding: '2px 6px', background: t.hoverBg, borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>⌘K</kbd>
            </button>
          )}

          {/* Navigation */}
          <nav style={{ flex: 1 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button key={item.id} onClick={() => setActiveScreen(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: sidebarCollapsed ? '12px' : '12px 16px', marginBottom: '6px', background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent', border: 'none', borderRadius: '12px', color: isActive ? '#10b981' : t.textMuted, cursor: 'pointer', transition: 'all 0.2s ease', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
                  <Icon size={20} />
                  {!sidebarCollapsed && <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
                </button>
              );
            })}
            
            {/* Employee Portal Link */}
            <button onClick={() => setShowEmployeePortal(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: sidebarCollapsed ? '12px' : '12px 16px', marginBottom: '6px', marginTop: '16px', background: 'transparent', border: `1px dashed ${t.border}`, borderRadius: '12px', color: t.textDim, cursor: 'pointer', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
              <UserCircle size={20} />
              {!sidebarCollapsed && <span style={{ fontSize: '14px', fontWeight: 500 }}>{navLabels.employeePortal}</span>}
            </button>
          </nav>

          {/* Progress Rings (Gamification) */}
          <SidebarProgressRings darkMode={darkMode} theme={t} language={language} collapsed={sidebarCollapsed} />

          {/* Collapse Button */}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ position: 'absolute', top: '50%', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: t.cardBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textDim }}>
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <header style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderBottom: `1px solid ${t.border}` }}>
            
            {/* Language Dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setLangDropdownOpen(!langDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '13px' }}>
                <Globe size={16} />
                <span>{languages.find(l => l.code === language)?.flag}</span>
                <ChevronDown size={14} />
              </button>
              {langDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '8px', minWidth: '160px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 100 }}>
                  {languages.map((lang) => (
                    <button key={lang.code} onClick={() => { setLanguage(lang.code); setLangDropdownOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: language === lang.code ? 'rgba(16, 185, 129, 0.15)' : 'transparent', border: 'none', borderRadius: '8px', color: language === lang.code ? '#10b981' : t.text, cursor: 'pointer', fontSize: '13px', fontWeight: language === lang.code ? 600 : 400 }}>
                      <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                      <span>{lang.name}</span>
                      {language === lang.code && <Check size={14} style={{ marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* High Contrast Toggle */}
            <button onClick={() => setHighContrast(!highContrast)} title={navLabels.highContrast} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: highContrast ? '#ffffff' : t.inputBg, border: `1px solid ${highContrast ? '#000000' : t.border}`, borderRadius: '12px', color: highContrast ? '#000000' : t.text, cursor: 'pointer' }}>
              <Contrast size={20} />
            </button>

            {/* Theme Toggle */}
            <button onClick={() => setDarkMode(!darkMode)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', transform: darkMode ? 'translateY(0)' : 'translateY(-40px)', opacity: darkMode ? 1 : 0 }}>
                <Sun size={20} color="#f59e0b" />
              </div>
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', transform: darkMode ? 'translateY(40px)' : 'translateY(0)', opacity: darkMode ? 0 : 1 }}>
                <Moon size={20} color="#6366f1" />
              </div>
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotificationsOpen(!notificationsOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, cursor: 'pointer', position: 'relative' }}>
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', width: '18px', height: '18px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white' }}>
                    {unreadNotifications}
                  </div>
                )}
              </button>
              <NotificationCenter isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} darkMode={darkMode} theme={t} language={language} />
            </div>

            {/* Settings */}
            <button onClick={() => setSettingsOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, cursor: 'pointer' }}>
              <Settings size={20} />
            </button>
          </header>

          {/* Screen Content */}
          <div style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
            {activeScreen === 'dashboard' && <DashboardScreen onNavigate={handleNavigate} darkMode={darkMode} theme={t} language={language} />}
            {activeScreen === 'gap-analysis' && <GapAnalysisScreen darkMode={darkMode} theme={t} language={language} />}
            {activeScreen === 'doc-generator' && <DocGeneratorScreen />}
            {activeScreen === 'risk-map' && <RiskMapScreen />}
            {activeScreen === 'evidence' && <EvidenceCenterScreen />}
            {activeScreen === 'documents' && <DocumentsScreen setActiveScreen={setActiveScreen} />}
            {activeScreen === 'audit-room' && <AuditRoomScreen />}
            {activeScreen === 'user-management' && <UserManagementScreen />}
          </div>
        </main>

        {/* AI Assistant Button */}
        <button onClick={() => setChatOpen(!chatOpen)} style={{ position: 'fixed', bottom: '32px', right: '32px', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)', zIndex: 100 }}>
          <Bot size={28} color="white" />
        </button>

        {/* AI Chat Panel */}
        {chatOpen && (
          <div style={{ position: 'fixed', bottom: '110px', right: '32px', width: '380px', height: '500px', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', boxShadow: '0 10px 50px rgba(0,0,0,0.3)', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={18} color="white" /></div>
              <div><div style={{ fontWeight: 600, fontSize: '14px' }}>Dani AI</div><div style={{ fontSize: '11px', color: '#10b981' }}>● Online</div></div>
            </div>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              <div style={{ background: t.inputBg, padding: '14px 16px', borderRadius: '12px 12px 12px 4px', marginBottom: '12px', maxWidth: '85%' }}>
                <p style={{ fontSize: '13px', lineHeight: '1.5', color: t.text }}>👋 Hello! I'm Dani, your ISO 27001 compliance assistant. How can I help you today?</p>
              </div>
            </div>
            <div style={{ padding: '16px', borderTop: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Ask anything about ISO 27001..." style={{ flex: 1, padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, fontSize: '13px', outline: 'none' }} />
                <button style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={18} color="white" /></button>
              </div>
            </div>
          </div>
        )}

        {/* Command Palette */}
        <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onNavigate={handleNavigate} darkMode={darkMode} theme={t} language={language} />

        {/* Employee Portal */}
        {showEmployeePortal && <EmployeePortal darkMode={darkMode} theme={t} language={language} onClose={() => setShowEmployeePortal(false)} />}

        {/* Settings Modal */}
        {settingsOpen && <SettingsModal darkMode={darkMode} setDarkMode={setDarkMode} language={language} setLanguage={setLanguage} languages={languages} theme={t} onClose={() => setSettingsOpen(false)} />}

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </ThemeContext.Provider>
  );
}

// ============================================
// DASHBOARD SCREEN WITH CAPA TRACKER
// ============================================

// ============================================
// DASHBOARD SCREEN WITH CAPA TRACKER
// ============================================
function DashboardScreen({ onNavigate }) {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const tr = useTranslation();
  const [healthScore] = useState(78);
  const [expandedCapa, setExpandedCapa] = useState(null);
  
  // CAPA Tracker labels
  const capaLabels = {
    en: { title: 'CAPA Tracker', subtitle: 'Non-conformities & Corrective Actions (Clause 10)', addNonConformity: 'Add NC', open: 'Open', inProgress: 'In Progress', resolved: 'Resolved', closed: 'Closed', rootCause: 'Root Cause', correctiveAction: 'Corrective Action', assignee: 'Assignee', source: 'Source', viewDetails: 'View Details', overdue: 'Overdue', daysLeft: 'days left', high: 'High', medium: 'Medium', low: 'Low', internalAudit: 'Internal Audit', preAudit: 'Pre-Audit' },
    es: { title: 'Rastreador CAPA', subtitle: 'No Conformidades y Acciones Correctivas (Cláusula 10)', addNonConformity: 'Agregar NC', open: 'Abierto', inProgress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado', rootCause: 'Causa Raíz', correctiveAction: 'Acción Correctiva', assignee: 'Responsable', source: 'Fuente', viewDetails: 'Ver Detalles', overdue: 'Vencido', daysLeft: 'días restantes', high: 'Alto', medium: 'Medio', low: 'Bajo', internalAudit: 'Auditoría Interna', preAudit: 'Pre-Auditoría' },
    pt: { title: 'Rastreador CAPA', subtitle: 'Não Conformidades e Ações Corretivas (Cláusula 10)', addNonConformity: 'Adicionar NC', open: 'Aberto', inProgress: 'Em Progresso', resolved: 'Resolvido', closed: 'Fechado', rootCause: 'Causa Raiz', correctiveAction: 'Ação Corretiva', assignee: 'Responsável', source: 'Fonte', viewDetails: 'Ver Detalhes', overdue: 'Atrasado', daysLeft: 'dias restantes', high: 'Alto', medium: 'Médio', low: 'Baixo', internalAudit: 'Auditoria Interna', preAudit: 'Pré-Auditoria' }
  };
  const cl = capaLabels[language] || capaLabels.en;

  const capas = [
    { id: 'NC-2024-015', title: 'Missing access review documentation', source: 'preAudit', status: 'inProgress', priority: 'high', dueDate: '2024-12-20', assignee: 'Carlos López', control: 'A.5.18', rootCause: 'No documented procedure for quarterly access reviews', correctiveAction: 'Implement automated access review process', progress: 60 },
    { id: 'NC-2024-014', title: 'Incomplete security awareness training', source: 'internalAudit', status: 'open', priority: 'medium', dueDate: '2024-12-25', assignee: 'Ana Martínez', control: 'A.6.3', rootCause: 'Manual tracking system with no enforcement', correctiveAction: 'Deploy LMS with mandatory completion tracking', progress: 20 },
    { id: 'NC-2024-013', title: 'Backup verification not performed monthly', source: 'internalAudit', status: 'resolved', priority: 'high', dueDate: '2024-12-10', assignee: 'Pedro Sánchez', control: 'A.8.13', rootCause: 'No automated backup verification schedule', correctiveAction: 'Implemented automated backup testing with AWS', progress: 100 }
  ];

  const getStatusColor = (status) => ({ open: '#ef4444', inProgress: '#f59e0b', resolved: '#10b981', closed: '#6b7280' }[status] || '#6b7280');
  const getPriorityColor = (priority) => ({ high: '#ef4444', medium: '#f59e0b', low: '#10b981' }[priority] || '#6b7280');
  
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{tr('commandCenter')}</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>{tr('realtimeOverview')}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', fontSize: '13px', color: '#10b981' }}>
            <RefreshCw size={14} />
            {tr('synced')} 2 {tr('minAgo')}
          </div>
          <button style={{ padding: '10px 20px', background: '#10b981', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Download size={16} />
            {tr('exportReport')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: t.textDim, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>{tr('healthScore')}</div>
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="12" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#hg)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${healthScore * 3.27} 327`} transform="rotate(-90 60 60)" />
              <defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs>
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>{healthScore}%</div>
              <div style={{ fontSize: '11px', color: t.textDim }}>{tr('ready')}</div>
            </div>
          </div>
        </div>

        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={18} color="#3b82f6" /></div>
            <span style={{ fontSize: '13px', color: t.textMuted }}>{tr('controlsImplemented')}</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '8px' }}>92<span style={{ fontSize: '20px', color: t.textDim }}>/114</span></div>
          <div style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: '80.7%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '3px' }} /></div>
        </div>

        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={18} color="#f59e0b" /></div>
            <span style={{ fontSize: '13px', color: t.textMuted }}>{tr('pendingActions')}</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>12</div>
          <div style={{ fontSize: '13px', color: t.textDim }}>3 {tr('highPriority')}</div>
        </div>

        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileCheck size={18} color="#a855f7" /></div>
            <span style={{ fontSize: '13px', color: t.textMuted }}>{tr('daysToAudit')}</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#a855f7', marginBottom: '4px' }}>47</div>
          <div style={{ fontSize: '13px', color: t.textDim }}>Aug 15, 2025</div>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', marginBottom: '24px' }} onClick={() => onNavigate('gap-analysis')}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Search size={28} color="#10b981" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{tr('continueGapAnalysis')}</div>
          <div style={{ fontSize: '14px', color: t.textDim }}>{tr('completeAssessment')} • 65% {tr('complete')}</div>
        </div>
        <div style={{ padding: '12px 24px', background: '#10b981', borderRadius: '10px', color: 'white', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tr('continue')} <ArrowRight size={16} />
        </div>
      </div>

      {/* CAPA Tracker */}
      <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '24px', border: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{cl.title}</h3>
              <p style={{ fontSize: '12px', color: t.textDim }}>{cl.subtitle}</p>
            </div>
          </div>
          <button style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />{cl.addNonConformity}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[{ label: cl.open, count: capas.filter(c => c.status === 'open').length, color: '#ef4444' }, { label: cl.inProgress, count: capas.filter(c => c.status === 'inProgress').length, color: '#f59e0b' }, { label: cl.resolved, count: capas.filter(c => c.status === 'resolved').length, color: '#10b981' }, { label: cl.closed, count: capas.filter(c => c.status === 'closed').length, color: '#6b7280' }].map((stat) => (
            <div key={stat.label} style={{ padding: '12px', background: t.inputBg, borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.count}</div>
              <div style={{ fontSize: '11px', color: t.textDim }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {capas.map((capa) => {
            const isExpanded = expandedCapa === capa.id;
            const daysLeft = Math.ceil((new Date(capa.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysLeft < 0 && capa.status !== 'resolved';

            return (
              <div key={capa.id} style={{ background: t.inputBg, borderRadius: '12px', border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.3)' : t.border}`, overflow: 'hidden' }}>
                <div onClick={() => setExpandedCapa(isExpanded ? null : capa.id)} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor(capa.status), boxShadow: `0 0 8px ${getStatusColor(capa.status)}60` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: t.textDim, fontFamily: 'monospace' }}>{capa.id}</span>
                      <span style={{ padding: '2px 8px', background: `${getPriorityColor(capa.priority)}20`, borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: getPriorityColor(capa.priority) }}>{cl[capa.priority]}</span>
                      <span style={{ padding: '2px 8px', background: '#8b5cf620', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: '#8b5cf6' }}>{capa.control}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: t.text }}>{capa.title}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: isOverdue ? '#ef4444' : t.textDim }}>{isOverdue ? cl.overdue : `${Math.abs(daysLeft)} ${cl.daysLeft}`}</div>
                    <div style={{ fontSize: '11px', color: t.textMuted }}>{capa.dueDate}</div>
                  </div>
                  <div style={{ width: '80px' }}>
                    <div style={{ height: '6px', background: t.hoverBg, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${capa.progress}%`, height: '100%', background: getStatusColor(capa.status), borderRadius: '3px' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: t.textDim, textAlign: 'right', marginTop: '4px' }}>{capa.progress}%</div>
                  </div>
                  <ChevronDown size={18} color={t.textDim} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                </div>
                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${t.border}`, marginTop: '-1px' }}>
                    <div style={{ paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', marginBottom: '6px' }}>{cl.rootCause}</div>
                        <p style={{ fontSize: '13px', color: t.text, lineHeight: '1.5' }}>{capa.rootCause}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', marginBottom: '6px' }}>{cl.correctiveAction}</div>
                        <p style={{ fontSize: '13px', color: t.text, lineHeight: '1.5' }}>{capa.correctiveAction}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${t.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '12px', color: t.textDim }}>{cl.assignee}: <strong style={{ color: t.text }}>{capa.assignee}</strong></span>
                        <span style={{ fontSize: '12px', color: t.textDim }}>{cl.source}: <strong style={{ color: t.text }}>{cl[capa.source]}</strong></span>
                      </div>
                      <button style={{ padding: '8px 14px', background: '#10b98120', border: '1px solid #10b98140', borderRadius: '8px', color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{cl.viewDetails}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Gap Analysis Screen with Interactive SOA
function GapAnalysisScreen() {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const tr = useTranslation();
  const [activeTab, setActiveTab] = useState('assessment');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [filterApplicable, setFilterApplicable] = useState('all');

  // SOA Labels
  const soaLabels = {
    en: { title: 'Statement of Applicability (SOA)', control: 'Control', description: 'Description', applicable: 'Applicable', notApplicable: 'Not Applicable', justification: 'Justification', status: 'Status', implemented: 'Implemented', planned: 'Planned', notImplemented: 'Not Implemented', showAll: 'All', showApplicable: 'Applicable', showNotApplicable: 'Not Applicable', required: 'Required', autoSaved: 'Auto-saved', assessment: 'Assessment', soa: 'SOA' },
    es: { title: 'Declaración de Aplicabilidad (SOA)', control: 'Control', description: 'Descripción', applicable: 'Aplica', notApplicable: 'No Aplica', justification: 'Justificación', status: 'Estado', implemented: 'Implementado', planned: 'Planificado', notImplemented: 'No Implementado', showAll: 'Todos', showApplicable: 'Aplica', showNotApplicable: 'No Aplica', required: 'Requerido', autoSaved: 'Auto-guardado', assessment: 'Evaluación', soa: 'SOA' },
    pt: { title: 'Declaração de Aplicabilidade (SOA)', control: 'Controle', description: 'Descrição', applicable: 'Aplicável', notApplicable: 'Não Aplicável', justification: 'Justificativa', status: 'Status', implemented: 'Implementado', planned: 'Planejado', notImplemented: 'Não Implementado', showAll: 'Todos', showApplicable: 'Aplicável', showNotApplicable: 'Não Aplicável', required: 'Obrigatório', autoSaved: 'Auto-salvo', assessment: 'Avaliação', soa: 'SOA' }
  };
  const sl = soaLabels[language] || soaLabels.en;

  // SOA Controls State
  const [controls, setControls] = useState([
    { id: 'A.5.1', name: 'Policies for information security', category: 'Organizational', applicable: true, status: 'implemented', justification: 'Required for ISMS framework establishment' },
    { id: 'A.5.2', name: 'Information security roles', category: 'Organizational', applicable: true, status: 'implemented', justification: 'Mandatory for security governance' },
    { id: 'A.5.15', name: 'Access control', category: 'Organizational', applicable: true, status: 'implemented', justification: 'Critical for data protection' },
    { id: 'A.5.16', name: 'Identity management', category: 'Organizational', applicable: true, status: 'planned', justification: 'Scheduled for Q1 2025' },
    { id: 'A.5.23', name: 'Cloud services security', category: 'Organizational', applicable: true, status: 'implemented', justification: 'Organization uses AWS and Azure' },
    { id: 'A.6.1', name: 'Screening', category: 'People', applicable: true, status: 'implemented', justification: 'HR policy requires background checks' },
    { id: 'A.6.3', name: 'Awareness training', category: 'People', applicable: true, status: 'planned', justification: 'Training program being developed' },
    { id: 'A.7.4', name: 'Physical security monitoring', category: 'Physical', applicable: false, status: 'notImplemented', justification: 'No physical data center - cloud only' },
    { id: 'A.8.1', name: 'User endpoint devices', category: 'Technological', applicable: true, status: 'implemented', justification: 'All employees use company devices' },
    { id: 'A.8.13', name: 'Information backup', category: 'Technological', applicable: true, status: 'implemented', justification: 'Automated daily backups configured' },
    { id: 'A.8.24', name: 'Use of cryptography', category: 'Technological', applicable: true, status: 'implemented', justification: 'TLS 1.3 and AES-256 in use' }
  ]);

  const toggleApplicable = (id) => {
    setControls(prev => prev.map(c => c.id === id ? { ...c, applicable: !c.applicable } : c));
  };

  const updateStatus = (id, status) => {
    setControls(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const filteredControls = controls.filter(c => {
    if (filterApplicable === 'all') return true;
    if (filterApplicable === 'applicable') return c.applicable;
    if (filterApplicable === 'notApplicable') return !c.applicable;
    return true;
  });

  // Assessment phases
  const phases = [
    { id: 'context', name: 'Context & Leadership', clause: 'Clauses 4 & 5', icon: Building2, color: '#3b82f6', questions: [
      { id: 'q1', title: 'Organization Context', question: 'Have you determined external and internal issues relevant to your ISMS?', options: ['Yes', 'No'], evidenceType: 'PESTLE Analysis', critical: true },
      { id: 'q2', title: 'Interested Parties', question: 'Have you identified stakeholders relevant to information security?', options: ['Yes', 'No'], evidenceType: 'Stakeholder List', critical: true },
      { id: 'q3', title: 'ISMS Scope', question: 'Is the ISMS scope clearly defined and documented?', options: ['Yes', 'No'], evidenceType: 'Scope Statement', critical: true },
    ]},
    { id: 'planning', name: 'Planning & Risk', clause: 'Clause 6', icon: Target, color: '#10b981', questions: [
      { id: 'q5', title: 'Risk Methodology', question: 'Do you have a documented risk assessment process?', options: ['Yes', 'No'], evidenceType: 'Risk Methodology', critical: true },
      { id: 'q6', title: 'Risk Treatment', question: 'Have you formulated a risk treatment plan?', options: ['Yes', 'Partially', 'No'], evidenceType: 'Risk Register', critical: true },
    ]},
    { id: 'support', name: 'Support & Ops', clause: 'Clauses 7 & 8', icon: Users, color: '#f59e0b', questions: [
      { id: 'q8', title: 'Training & Awareness', question: 'Have employees received security awareness training?', options: ['Yes', 'Partially', 'No'], evidenceType: 'Training Logs', critical: false },
    ]},
    { id: 'annex', name: 'Annex A Controls', clause: 'Annex A', icon: Lock, color: '#a855f7', questions: [
      { id: 'q10', title: 'Access Control', subtitle: 'A.8', question: 'Is there a formal user registration process?', options: ['Yes', 'No'], evidenceType: 'Access Policy', critical: true },
      { id: 'q11', title: 'Backups', subtitle: 'A.8', question: 'Are backups taken and tested regularly?', options: ['Yes', 'Partially', 'No'], evidenceType: 'Backup Logs', critical: true },
    ]}
  ];

  const currentPhaseData = phases[currentPhase];
  const currentQuestionData = currentPhaseData.questions[currentQuestion];
  const totalQuestions = phases.reduce((sum, p) => sum + p.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const globalProgress = (answeredQuestions / totalQuestions) * 100;

  const getPhaseProgress = (idx) => {
    const phase = phases[idx];
    return (phase.questions.filter(q => answers[q.id]).length / phase.questions.length) * 100;
  };

  const currentAnswer = answers[currentQuestionData?.id];
  const showEvidenceUpload = currentAnswer === 'Yes' || currentAnswer === 'Partially';

  const handleAnswer = (answer) => setAnswers({ ...answers, [currentQuestionData.id]: answer });
  const goToNext = () => { if (currentQuestion < currentPhaseData.questions.length - 1) setCurrentQuestion(currentQuestion + 1); else if (currentPhase < phases.length - 1) { setCurrentPhase(currentPhase + 1); setCurrentQuestion(0); } };
  const goToPrev = () => { if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1); else if (currentPhase > 0) { setCurrentPhase(currentPhase - 1); setCurrentQuestion(phases[currentPhase - 1].questions.length - 1); } };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{tr('gapAnalysis')}</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>Complete assessment to generate your SOA</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('assessment')} style={{ padding: '10px 20px', background: activeTab === 'assessment' ? '#10b98120' : t.inputBg, border: `1px solid ${activeTab === 'assessment' ? '#10b981' : t.border}`, borderRadius: '10px', color: activeTab === 'assessment' ? '#10b981' : t.textMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{sl.assessment}</button>
          <button onClick={() => setActiveTab('soa')} style={{ padding: '10px 20px', background: activeTab === 'soa' ? '#8b5cf620' : t.inputBg, border: `1px solid ${activeTab === 'soa' ? '#8b5cf6' : t.border}`, borderRadius: '10px', color: activeTab === 'soa' ? '#8b5cf6' : t.textMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{sl.soa}</button>
          <button style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}><FolderUp size={16} /> {tr('bulkUpload')}</button>
          <button style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> {tr('saveProgress')}</button>
        </div>
      </div>

      {/* Assessment Tab */}
      {activeTab === 'assessment' && (
        <>
          <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '20px 24px', border: `1px solid ${t.border}`, marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: t.textMuted }}>{tr('overallProgress')}: <span style={{ fontWeight: 600, color: '#10b981' }}>{Math.round(globalProgress)}%</span></span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {phases.map((phase, idx) => (
                <div key={phase.id} style={{ flex: phase.questions.length, height: '8px', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: idx === 0 ? '4px 0 0 4px' : idx === phases.length - 1 ? '0 4px 4px 0' : '0', overflow: 'hidden' }}>
                  <div style={{ width: `${getPhaseProgress(idx)}%`, height: '100%', background: phase.color }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: '24px' }}>
            <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '20px', border: `1px solid ${t.border}`, height: 'fit-content' }}>
              <h3 style={{ fontSize: '12px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{tr('phases')}</h3>
              {phases.map((phase, idx) => {
                const Icon = phase.icon; const isActive = currentPhase === idx;
                return (
                  <button key={phase.id} onClick={() => { setCurrentPhase(idx); setCurrentQuestion(0); }} style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', marginBottom: '6px', background: isActive ? `${phase.color}15` : 'transparent', border: isActive ? `1px solid ${phase.color}40` : '1px solid transparent', borderRadius: '10px', color: isActive ? phase.color : t.textMuted, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isActive ? `${phase.color}25` : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={14} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: isActive ? t.text : t.textMuted }}>{phase.name}</div>
                      <div style={{ fontSize: '10px', color: t.textDim }}>{phase.clause}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '28px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${currentPhaseData.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.createElement(currentPhaseData.icon, { size: 20, color: currentPhaseData.color })}
                </div>
                <div><div style={{ fontSize: '16px', fontWeight: 600 }}>{currentPhaseData.name}</div></div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '10px 14px', background: t.inputBg, borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: t.textDim }}>{tr('question')}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: currentPhaseData.color }}>{currentQuestion + 1}</span>
                <span style={{ fontSize: '12px', color: t.textDim }}>{tr('of')} {currentPhaseData.questions.length}</span>
                <div style={{ flex: 1 }} />
                {currentQuestionData.critical && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: '#ef4444' }}><AlertCircle size={10} /> {tr('critical')}</div>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{currentQuestionData.title}</h2>
                <p style={{ fontSize: '16px', lineHeight: '1.6', fontWeight: 500 }}>{currentQuestionData.question}</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {currentQuestionData.options.map((option) => {
                  const isSelected = currentAnswer === option;
                  let bgColor = t.inputBg, borderColor = t.border, textColor = t.text;
                  if (isSelected) { if (option === 'Yes') { bgColor = 'rgba(16, 185, 129, 0.15)'; borderColor = '#10b981'; textColor = '#10b981'; } else if (option === 'Partially') { bgColor = 'rgba(245, 158, 11, 0.15)'; borderColor = '#f59e0b'; textColor = '#f59e0b'; } else { bgColor = 'rgba(239, 68, 68, 0.15)'; borderColor = '#ef4444'; textColor = '#ef4444'; } }
                  return <button key={option} onClick={() => handleAnswer(option)} style={{ flex: 1, padding: '14px 20px', background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '10px', color: textColor, cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>{isSelected && <Check size={16} />} {option}</button>;
                })}
              </div>

              {showEvidenceUpload && (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><FileUp size={16} color="#10b981" /><span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{tr('uploadEvidence')}</span></div>
                  <p style={{ fontSize: '12px', color: t.textDim, marginBottom: '12px' }}>{tr('required')}: <span style={{ color: t.text }}>{currentQuestionData.evidenceType}</span></p>
                  <div style={{ border: '2px dashed rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                    <Upload size={20} color="#10b981" style={{ marginBottom: '6px' }} />
                    <p style={{ fontSize: '13px', color: t.textMuted }}>{tr('dragDrop')} <span style={{ color: '#10b981', textDecoration: 'underline' }}>{tr('browse')}</span></p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={goToPrev} disabled={currentPhase === 0 && currentQuestion === 0} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', color: currentPhase === 0 && currentQuestion === 0 ? t.textDim : t.text, cursor: currentPhase === 0 && currentQuestion === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><ChevronLeft size={16} /> {tr('previous')}</button>
                <button onClick={goToNext} disabled={!currentAnswer} style={{ padding: '10px 28px', background: currentAnswer ? `linear-gradient(135deg, ${currentPhaseData.color} 0%, ${currentPhaseData.color}dd 100%)` : t.inputBg, border: 'none', borderRadius: '8px', color: currentAnswer ? 'white' : t.textDim, cursor: currentAnswer ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {tr('continue')} <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '18px', border: `1px solid ${t.border}`, height: 'fit-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}><Sparkles size={16} color="#10b981" /><h3 style={{ fontSize: '13px', fontWeight: 600 }}>{tr('soaPreview')}</h3></div>
              {phases.map((phase, idx) => (
                <div key={phase.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: idx < phases.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircleDot size={10} color={t.textDim} /></div>
                  <div style={{ flex: 1, fontSize: '11px', fontWeight: 500 }}>{phase.clause}</div>
                  <span style={{ fontSize: '10px', color: t.textDim }}>{Math.round(getPhaseProgress(idx))}%</span>
                </div>
              ))}
              <button onClick={() => setActiveTab('soa')} style={{ width: '100%', marginTop: '14px', padding: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Eye size={12} /> {tr('previewSoa')}</button>
            </div>
          </div>
        </>
      )}

      {/* Interactive SOA Tab */}
      {activeTab === 'soa' && (
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileCheck size={22} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{sl.title}</h3>
                <p style={{ fontSize: '12px', color: t.textDim }}>{controls.filter(c => c.applicable).length} {sl.applicable} • {controls.filter(c => c.applicable && c.status === 'implemented').length} {sl.implemented}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[{ id: 'all', label: sl.showAll }, { id: 'applicable', label: sl.showApplicable }, { id: 'notApplicable', label: sl.showNotApplicable }].map((filter) => (
                <button key={filter.id} onClick={() => setFilterApplicable(filter.id)} style={{ padding: '8px 14px', background: filterApplicable === filter.id ? '#8b5cf620' : 'transparent', border: `1px solid ${filterApplicable === filter.id ? '#8b5cf6' : t.border}`, borderRadius: '8px', color: filterApplicable === filter.id ? '#8b5cf6' : t.textMuted, fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>{filter.label}</button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', width: '100px' }}>{sl.control}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{sl.description}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', width: '140px' }}>{sl.applicable}?</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', width: '150px' }}>{sl.status}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{sl.justification}</th>
                </tr>
              </thead>
              <tbody>
                {filteredControls.map((control) => (
                  <tr key={control.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: '16px 20px' }}><span style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', fontFamily: 'monospace' }}>{control.id}</span></td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '13px', color: t.text }}>{control.name}</div>
                      <span style={{ fontSize: '11px', color: t.textDim }}>{control.category}</span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => toggleApplicable(control.id)} style={{ padding: '6px 12px', background: control.applicable ? '#10b98120' : 'transparent', border: `1px solid ${control.applicable ? '#10b981' : t.border}`, borderRadius: '6px 0 0 6px', color: control.applicable ? '#10b981' : t.textDim, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{sl.applicable}</button>
                        <button onClick={() => toggleApplicable(control.id)} style={{ padding: '6px 12px', background: !control.applicable ? '#ef444420' : 'transparent', border: `1px solid ${!control.applicable ? '#ef4444' : t.border}`, borderRadius: '0 6px 6px 0', color: !control.applicable ? '#ef4444' : t.textDim, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{sl.notApplicable}</button>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {control.applicable && (
                        <select value={control.status} onChange={(e) => updateStatus(control.id, e.target.value)} style={{ padding: '6px 10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text, fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
                          <option value="implemented">{sl.implemented}</option>
                          <option value="planned">{sl.planned}</option>
                          <option value="notImplemented">{sl.notImplemented}</option>
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: control.justification ? t.textMuted : '#ef4444', fontStyle: control.justification ? 'normal' : 'italic' }}>{control.justification || sl.required}</span>
                        <button style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: t.textDim }}><Edit3 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981' }}>
            <CheckCircle2 size={14} /><span>{sl.autoSaved}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DocGeneratorScreen() {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [generatedContent, setGeneratedContent] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [improvementPrompt, setImprovementPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chapterDocuments, setChapterDocuments] = useState({});
  const [dragOver, setDragOver] = useState(false);
  
  // New states for enhanced features
  const [viewMode, setViewMode] = useState('split'); // 'split', 'preview', 'edit'
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedTags, setSelectedTags] = useState({});
  const [documentStatus, setDocumentStatus] = useState({}); // draft, review, approved, published
  const [versionHistory, setVersionHistory] = useState({});
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [approvers, setApprovers] = useState({});

  const labels = {
    en: {
      title: 'ISO 27001 Document Generator',
      subtitle: 'Generate compliant documentation with AI assistance',
      chapters: 'Chapters',
      selectChapter: 'Select a chapter to begin',
      generate: 'Generate Draft',
      regenerate: 'Regenerate',
      generating: 'Generating...',
      generated: 'Generated',
      notGenerated: 'Not Generated',
      editContent: 'Edit Content',
      saveChanges: 'Save Changes',
      cancelEdit: 'Cancel',
      mergeDocument: 'Merge with Existing',
      exportDraft: 'Export Draft',
      exportAll: 'Export All Chapters',
      improveContent: 'Improve Content',
      improvePlaceholder: 'Describe how you want to improve this section...',
      applyImprovement: 'Apply',
      addContent: 'Add Content',
      addContentPlaceholder: 'Add new text or requirements to include...',
      preview: 'Preview',
      aiAssistant: 'AI Assistant',
      askForHelp: 'Ask Dani for help with this chapter...',
      chapterProgress: 'Chapter Progress',
      totalProgress: 'Total Progress',
      mergeTitle: 'Merge with Existing Document',
      mergeDescription: 'Select a document to merge with the generated content',
      availableDocs: 'Available Documents',
      mergeStrategy: 'Merge Strategy',
      appendContent: 'Append to existing',
      replaceContent: 'Replace sections',
      smartMerge: 'Smart merge (AI-assisted)',
      confirmMerge: 'Confirm Merge',
      contentGenerated: 'Content generated successfully',
      readyToEdit: 'Ready to edit and customize',
      uploadDocuments: 'Reference Documents',
      uploadDescription: 'Upload documents related to this chapter',
      dragDropFiles: 'Drag & drop files here or',
      browseFiles: 'browse',
      supportedFormats: 'PDF, DOCX, TXT, MD (max 10MB)',
      uploadedFiles: 'Uploaded Files',
      noFilesUploaded: 'No files uploaded yet',
      removeFile: 'Remove',
      useForGeneration: 'Use these documents as reference when generating content',
      analyzing: 'Analyzing...',
      analyzed: 'Analyzed',
      // New labels for enhanced features
      splitView: 'Split View',
      previewMode: 'Preview',
      editMode: 'Edit',
      aiDraft: 'AI Draft',
      yourDocument: 'Your Document',
      controlTagging: 'Control Tagging',
      annexAControls: 'Annex A Controls',
      tagSection: 'Tag this section',
      selectedControls: 'Tagged Controls',
      noTagsYet: 'No controls tagged yet',
      addTag: 'Add Tag',
      removeTag: 'Remove',
      approvalWorkflow: 'Approval Workflow',
      draft: 'Draft',
      review: 'Review',
      approved: 'Approved',
      published: 'Published',
      submitForReview: 'Submit for Review',
      approve: 'Approve',
      publish: 'Publish',
      requestChanges: 'Request Changes',
      versionHistory: 'Version History',
      currentVersion: 'Current',
      viewDiff: 'View Changes',
      restoreVersion: 'Restore',
      noVersions: 'No previous versions',
      changes: 'changes',
      addedLines: 'added',
      removedLines: 'removed',
      approvedBy: 'Approved by',
      pendingApproval: 'Pending approval',
      selectApprover: 'Select approver',
      digitalSignature: 'Digital Signature',
      signDocument: 'Sign Document',
      signed: 'Signed',
      complianceNote: 'This section complies with',
      traceability: 'Traceability Report'
    },
    es: {
      title: 'Generador de Documentos ISO 27001',
      subtitle: 'Genera documentación compatible con asistencia de IA',
      chapters: 'Capítulos',
      selectChapter: 'Selecciona un capítulo para comenzar',
      generate: 'Generar Borrador',
      regenerate: 'Regenerar',
      generating: 'Generando...',
      generated: 'Generado',
      notGenerated: 'No Generado',
      editContent: 'Editar Contenido',
      saveChanges: 'Guardar Cambios',
      cancelEdit: 'Cancelar',
      mergeDocument: 'Fusionar con Existente',
      exportDraft: 'Exportar Borrador',
      exportAll: 'Exportar Todos',
      improveContent: 'Mejorar Contenido',
      improvePlaceholder: 'Describe cómo quieres mejorar esta sección...',
      applyImprovement: 'Aplicar',
      addContent: 'Agregar Contenido',
      addContentPlaceholder: 'Agrega nuevo texto o requisitos...',
      preview: 'Vista Previa',
      aiAssistant: 'Asistente IA',
      askForHelp: 'Pide ayuda a Dani con este capítulo...',
      chapterProgress: 'Progreso del Capítulo',
      totalProgress: 'Progreso Total',
      mergeTitle: 'Fusionar con Documento Existente',
      mergeDescription: 'Selecciona un documento para fusionar',
      availableDocs: 'Documentos Disponibles',
      mergeStrategy: 'Estrategia de Fusión',
      appendContent: 'Añadir al existente',
      replaceContent: 'Reemplazar secciones',
      smartMerge: 'Fusión inteligente (IA)',
      confirmMerge: 'Confirmar Fusión',
      contentGenerated: 'Contenido generado exitosamente',
      readyToEdit: 'Listo para editar y personalizar',
      uploadDocuments: 'Documentos de Referencia',
      uploadDescription: 'Sube documentos relacionados con este capítulo',
      dragDropFiles: 'Arrastra archivos aquí o',
      browseFiles: 'buscar',
      supportedFormats: 'PDF, DOCX, TXT, MD (máx 10MB)',
      uploadedFiles: 'Archivos Subidos',
      noFilesUploaded: 'Sin archivos subidos',
      removeFile: 'Eliminar',
      useForGeneration: 'Usar estos documentos como referencia al generar',
      analyzing: 'Analizando...',
      analyzed: 'Analizado',
      // New labels
      splitView: 'Vista Dividida',
      previewMode: 'Vista Previa',
      editMode: 'Editar',
      aiDraft: 'Borrador IA',
      yourDocument: 'Tu Documento',
      controlTagging: 'Etiquetado de Controles',
      annexAControls: 'Controles Anexo A',
      tagSection: 'Etiquetar esta sección',
      selectedControls: 'Controles Etiquetados',
      noTagsYet: 'Sin controles etiquetados',
      addTag: 'Añadir Etiqueta',
      removeTag: 'Eliminar',
      approvalWorkflow: 'Flujo de Aprobación',
      draft: 'Borrador',
      review: 'Revisión',
      approved: 'Aprobado',
      published: 'Publicado',
      submitForReview: 'Enviar a Revisión',
      approve: 'Aprobar',
      publish: 'Publicar',
      requestChanges: 'Solicitar Cambios',
      versionHistory: 'Historial de Versiones',
      currentVersion: 'Actual',
      viewDiff: 'Ver Cambios',
      restoreVersion: 'Restaurar',
      noVersions: 'Sin versiones anteriores',
      changes: 'cambios',
      addedLines: 'añadidas',
      removedLines: 'eliminadas',
      approvedBy: 'Aprobado por',
      pendingApproval: 'Pendiente de aprobación',
      selectApprover: 'Seleccionar aprobador',
      digitalSignature: 'Firma Digital',
      signDocument: 'Firmar Documento',
      signed: 'Firmado',
      complianceNote: 'Esta sección cumple con',
      traceability: 'Informe de Trazabilidad'
    },
    pt: {
      title: 'Gerador de Documentos ISO 27001',
      subtitle: 'Gere documentação compatível com assistência de IA',
      chapters: 'Capítulos',
      selectChapter: 'Selecione um capítulo para começar',
      generate: 'Gerar Rascunho',
      regenerate: 'Regenerar',
      generating: 'Gerando...',
      generated: 'Gerado',
      notGenerated: 'Não Gerado',
      editContent: 'Editar Conteúdo',
      saveChanges: 'Salvar Alterações',
      cancelEdit: 'Cancelar',
      mergeDocument: 'Mesclar com Existente',
      exportDraft: 'Exportar Rascunho',
      exportAll: 'Exportar Todos',
      improveContent: 'Melhorar Conteúdo',
      improvePlaceholder: 'Descreva como você quer melhorar esta seção...',
      applyImprovement: 'Aplicar',
      addContent: 'Adicionar Conteúdo',
      addContentPlaceholder: 'Adicione novo texto ou requisitos...',
      preview: 'Visualizar',
      aiAssistant: 'Assistente IA',
      askForHelp: 'Peça ajuda ao Dani com este capítulo...',
      chapterProgress: 'Progresso do Capítulo',
      totalProgress: 'Progresso Total',
      mergeTitle: 'Mesclar com Documento Existente',
      mergeDescription: 'Selecione um documento para mesclar',
      availableDocs: 'Documentos Disponíveis',
      mergeStrategy: 'Estratégia de Mesclagem',
      appendContent: 'Anexar ao existente',
      replaceContent: 'Substituir seções',
      smartMerge: 'Mesclagem inteligente (IA)',
      confirmMerge: 'Confirmar Mesclagem',
      contentGenerated: 'Conteúdo gerado com sucesso',
      readyToEdit: 'Pronto para editar e personalizar',
      uploadDocuments: 'Documentos de Referência',
      uploadDescription: 'Carregue documentos relacionados a este capítulo',
      dragDropFiles: 'Arraste arquivos aqui ou',
      browseFiles: 'procurar',
      supportedFormats: 'PDF, DOCX, TXT, MD (máx 10MB)',
      uploadedFiles: 'Arquivos Enviados',
      noFilesUploaded: 'Nenhum arquivo enviado',
      removeFile: 'Remover',
      useForGeneration: 'Usar estes documentos como referência ao gerar',
      analyzing: 'Analisando...',
      analyzed: 'Analisado',
      // New labels
      splitView: 'Vista Dividida',
      previewMode: 'Visualização',
      editMode: 'Editar',
      aiDraft: 'Rascunho IA',
      yourDocument: 'Seu Documento',
      controlTagging: 'Etiquetagem de Controles',
      annexAControls: 'Controles Anexo A',
      tagSection: 'Etiquetar esta seção',
      selectedControls: 'Controles Etiquetados',
      noTagsYet: 'Sem controles etiquetados',
      addTag: 'Adicionar Etiqueta',
      removeTag: 'Remover',
      approvalWorkflow: 'Fluxo de Aprovação',
      draft: 'Rascunho',
      review: 'Revisão',
      approved: 'Aprovado',
      published: 'Publicado',
      submitForReview: 'Enviar para Revisão',
      approve: 'Aprovar',
      publish: 'Publicar',
      requestChanges: 'Solicitar Alterações',
      versionHistory: 'Histórico de Versões',
      currentVersion: 'Atual',
      viewDiff: 'Ver Alterações',
      restoreVersion: 'Restaurar',
      noVersions: 'Sem versões anteriores',
      changes: 'alterações',
      addedLines: 'adicionadas',
      removedLines: 'removidas',
      approvedBy: 'Aprovado por',
      pendingApproval: 'Pendente de aprovação',
      selectApprover: 'Selecionar aprovador',
      digitalSignature: 'Assinatura Digital',
      signDocument: 'Assinar Documento',
      signed: 'Assinado',
      complianceNote: 'Esta seção cumpre com',
      traceability: 'Relatório de Rastreabilidade'
    }
  };

  const l = labels[language] || labels.en;

  // Annex A Controls for tagging
  const annexAControls = [
    { id: 'A.5.1', name: { en: 'Policies for information security', es: 'Políticas de seguridad', pt: 'Políticas de segurança' } },
    { id: 'A.5.2', name: { en: 'Information security roles', es: 'Roles de seguridad', pt: 'Papéis de segurança' } },
    { id: 'A.5.15', name: { en: 'Access control', es: 'Control de acceso', pt: 'Controle de acesso' } },
    { id: 'A.5.16', name: { en: 'Identity management', es: 'Gestión de identidad', pt: 'Gestão de identidade' } },
    { id: 'A.5.17', name: { en: 'Authentication information', es: 'Información de autenticación', pt: 'Informação de autenticação' } },
    { id: 'A.5.23', name: { en: 'Information security for cloud', es: 'Seguridad en la nube', pt: 'Segurança na nuvem' } },
    { id: 'A.5.24', name: { en: 'Incident management planning', es: 'Planificación de incidentes', pt: 'Planejamento de incidentes' } },
    { id: 'A.5.29', name: { en: 'Business continuity', es: 'Continuidad del negocio', pt: 'Continuidade do negócio' } },
    { id: 'A.5.31', name: { en: 'Legal requirements', es: 'Requisitos legales', pt: 'Requisitos legais' } },
    { id: 'A.8.1', name: { en: 'User endpoint devices', es: 'Dispositivos de usuario', pt: 'Dispositivos de usuário' } },
    { id: 'A.8.7', name: { en: 'Protection against malware', es: 'Protección contra malware', pt: 'Proteção contra malware' } },
    { id: 'A.8.9', name: { en: 'Configuration management', es: 'Gestión de configuración', pt: 'Gestão de configuração' } },
    { id: 'A.8.12', name: { en: 'Data leakage prevention', es: 'Prevención de fugas', pt: 'Prevenção de vazamentos' } },
    { id: 'A.8.24', name: { en: 'Use of cryptography', es: 'Uso de criptografía', pt: 'Uso de criptografia' } }
  ];

  // Team members for approval workflow
  const teamMembers = [
    { id: 1, name: 'María García', role: 'CISO', avatar: 'MG' },
    { id: 2, name: 'Carlos López', role: 'Security Manager', avatar: 'CL' },
    { id: 3, name: 'Ana Martínez', role: 'Compliance Officer', avatar: 'AM' },
    { id: 4, name: 'Pedro Sánchez', role: 'IT Director', avatar: 'PS' }
  ];

  const chapters = [
    { id: 'ch4', number: '4', title: { en: 'Context of the Organization', es: 'Contexto de la Organización', pt: 'Contexto da Organização' }, 
      sections: [
        { id: '4.1', title: { en: 'Understanding the organization', es: 'Comprensión de la organización', pt: 'Entendendo a organização' } },
        { id: '4.2', title: { en: 'Needs and expectations of interested parties', es: 'Necesidades de las partes interesadas', pt: 'Necessidades das partes interessadas' } },
        { id: '4.3', title: { en: 'Scope of the ISMS', es: 'Alcance del SGSI', pt: 'Escopo do SGSI' } },
        { id: '4.4', title: { en: 'Information security management system', es: 'Sistema de gestión de seguridad', pt: 'Sistema de gestão de segurança' } }
      ], color: '#3b82f6', icon: Building2 },
    { id: 'ch5', number: '5', title: { en: 'Leadership', es: 'Liderazgo', pt: 'Liderança' },
      sections: [
        { id: '5.1', title: { en: 'Leadership and commitment', es: 'Liderazgo y compromiso', pt: 'Liderança e compromisso' } },
        { id: '5.2', title: { en: 'Policy', es: 'Política', pt: 'Política' } },
        { id: '5.3', title: { en: 'Organizational roles and responsibilities', es: 'Roles y responsabilidades', pt: 'Papéis e responsabilidades' } }
      ], color: '#10b981', icon: Users },
    { id: 'ch6', number: '6', title: { en: 'Planning', es: 'Planificación', pt: 'Planejamento' },
      sections: [
        { id: '6.1', title: { en: 'Actions to address risks and opportunities', es: 'Acciones para abordar riesgos', pt: 'Ações para riscos e oportunidades' } },
        { id: '6.2', title: { en: 'Information security objectives', es: 'Objetivos de seguridad', pt: 'Objetivos de segurança' } },
        { id: '6.3', title: { en: 'Planning of changes', es: 'Planificación de cambios', pt: 'Planejamento de mudanças' } }
      ], color: '#f59e0b', icon: Target },
    { id: 'ch7', number: '7', title: { en: 'Support', es: 'Apoyo', pt: 'Apoio' },
      sections: [
        { id: '7.1', title: { en: 'Resources', es: 'Recursos', pt: 'Recursos' } },
        { id: '7.2', title: { en: 'Competence', es: 'Competencia', pt: 'Competência' } },
        { id: '7.3', title: { en: 'Awareness', es: 'Concienciación', pt: 'Conscientização' } },
        { id: '7.4', title: { en: 'Communication', es: 'Comunicación', pt: 'Comunicação' } },
        { id: '7.5', title: { en: 'Documented information', es: 'Información documentada', pt: 'Informação documentada' } }
      ], color: '#8b5cf6', icon: HelpCircle },
    { id: 'ch8', number: '8', title: { en: 'Operation', es: 'Operación', pt: 'Operação' },
      sections: [
        { id: '8.1', title: { en: 'Operational planning and control', es: 'Planificación y control operacional', pt: 'Planejamento e controle operacional' } },
        { id: '8.2', title: { en: 'Information security risk assessment', es: 'Evaluación de riesgos', pt: 'Avaliação de riscos' } },
        { id: '8.3', title: { en: 'Information security risk treatment', es: 'Tratamiento de riesgos', pt: 'Tratamento de riscos' } }
      ], color: '#ef4444', icon: Zap },
    { id: 'ch9', number: '9', title: { en: 'Performance Evaluation', es: 'Evaluación del Desempeño', pt: 'Avaliação de Desempenho' },
      sections: [
        { id: '9.1', title: { en: 'Monitoring, measurement, analysis and evaluation', es: 'Monitoreo y medición', pt: 'Monitoramento e medição' } },
        { id: '9.2', title: { en: 'Internal audit', es: 'Auditoría interna', pt: 'Auditoria interna' } },
        { id: '9.3', title: { en: 'Management review', es: 'Revisión por la dirección', pt: 'Revisão pela direção' } }
      ], color: '#06b6d4', icon: Search },
    { id: 'ch10', number: '10', title: { en: 'Improvement', es: 'Mejora', pt: 'Melhoria' },
      sections: [
        { id: '10.1', title: { en: 'Continual improvement', es: 'Mejora continua', pt: 'Melhoria contínua' } },
        { id: '10.2', title: { en: 'Nonconformity and corrective action', es: 'No conformidad y acción correctiva', pt: 'Não conformidade e ação corretiva' } }
      ], color: '#ec4899', icon: RefreshCw }
  ];

  const existingDocuments = [
    { id: 1, name: 'Information Security Policy v2.1', type: 'Policy' },
    { id: 2, name: 'Access Control Policy v1.3', type: 'Policy' },
    { id: 3, name: 'Risk Assessment Methodology', type: 'Procedure' },
    { id: 4, name: 'Incident Response Procedure v1.8', type: 'Procedure' },
    { id: 5, name: 'Business Continuity Plan v0.5', type: 'Plan' }
  ];

  const getChapterTitle = (chapter) => chapter.title[language] || chapter.title.en;
  const getSectionTitle = (section) => section.title[language] || section.title.en;
  const getControlName = (control) => control.name[language] || control.name.en;

  // Workflow status helpers
  const workflowSteps = ['draft', 'review', 'approved', 'published'];
  const getStatusIndex = (chapterId) => workflowSteps.indexOf(documentStatus[chapterId] || 'draft');
  
  const advanceWorkflow = (chapterId) => {
    const currentIndex = getStatusIndex(chapterId);
    if (currentIndex < workflowSteps.length - 1) {
      const newStatus = workflowSteps[currentIndex + 1];
      setDocumentStatus(prev => ({ ...prev, [chapterId]: newStatus }));
      
      // Save version when status changes
      if (generatedContent[chapterId]) {
        const now = new Date();
        setVersionHistory(prev => ({
          ...prev,
          [chapterId]: [
            ...(prev[chapterId] || []),
            {
              id: Date.now(),
              version: `v${(prev[chapterId]?.length || 0) + 1}.0`,
              content: generatedContent[chapterId],
              status: newStatus,
              date: now.toISOString(),
              author: teamMembers[0].name,
              changes: { added: Math.floor(Math.random() * 20) + 5, removed: Math.floor(Math.random() * 10) }
            }
          ]
        }));
      }
    }
  };

  const handleFileUpload = (files, chapterId) => {
    const newFiles = Array.from(files).map((file, idx) => ({
      id: `${chapterId}-${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'analyzing',
      uploadedAt: new Date()
    }));

    setChapterDocuments(prev => ({
      ...prev,
      [chapterId]: [...(prev[chapterId] || []), ...newFiles]
    }));

    newFiles.forEach(file => {
      setTimeout(() => {
        setChapterDocuments(prev => ({
          ...prev,
          [chapterId]: prev[chapterId].map(f => 
            f.id === file.id ? { ...f, status: 'analyzed' } : f
          )
        }));
      }, 1500 + Math.random() * 1000);
    });
  };

  const removeFile = (chapterId, fileId) => {
    setChapterDocuments(prev => ({
      ...prev,
      [chapterId]: prev[chapterId].filter(f => f.id !== fileId)
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const toggleControlTag = (chapterId, controlId) => {
    setSelectedTags(prev => {
      const chapterTags = prev[chapterId] || [];
      if (chapterTags.includes(controlId)) {
        return { ...prev, [chapterId]: chapterTags.filter(id => id !== controlId) };
      } else {
        return { ...prev, [chapterId]: [...chapterTags, controlId] };
      }
    });
  };

  const generateContent = (chapter) => {
    setIsGenerating(true);
    setSelectedChapter(chapter);
    
    const uploadedDocs = chapterDocuments[chapter.id] || [];
    const hasReferenceDocs = uploadedDocs.length > 0;
    
    setTimeout(() => {
      const sampleContent = {
        en: `# ${chapter.number}. ${getChapterTitle(chapter)}

## Purpose
This chapter establishes the requirements for ${getChapterTitle(chapter).toLowerCase()} within the Information Security Management System (ISMS).${hasReferenceDocs ? ' Content has been tailored based on your uploaded reference documents.' : ''}

## Scope
This documentation applies to all personnel, processes, and systems within the scope of the ISMS.

## Requirements

### ${chapter.sections[0]?.id} ${getSectionTitle(chapter.sections[0])}
The organization shall determine external and internal issues that are relevant to its purpose and that affect its ability to achieve the intended outcome(s) of its information security management system.

Key considerations include:
- Business environment and market conditions
- Regulatory and legal requirements
- Technological changes and trends
- Organizational culture and values

### Implementation Guidelines
1. Conduct regular environmental scanning
2. Document identified issues and their potential impact
3. Review and update the context analysis at planned intervals
4. Ensure alignment with strategic objectives

## Responsibilities
- Top Management: Overall accountability
- Information Security Manager: Implementation and maintenance
- Department Heads: Compliance within their areas

## Related Documents
- Risk Assessment Methodology
- Information Security Policy
- Statement of Applicability`,
        es: `# ${chapter.number}. ${getChapterTitle(chapter)}

## Propósito
Este capítulo establece los requisitos para ${getChapterTitle(chapter).toLowerCase()} dentro del Sistema de Gestión de Seguridad de la Información (SGSI).${hasReferenceDocs ? ' El contenido ha sido adaptado basándose en tus documentos de referencia.' : ''}

## Alcance
Esta documentación aplica a todo el personal, procesos y sistemas dentro del alcance del SGSI.

## Requisitos

### ${chapter.sections[0]?.id} ${getSectionTitle(chapter.sections[0])}
La organización debe determinar las cuestiones externas e internas que son relevantes para su propósito y que afectan su capacidad para lograr los resultados previstos de su sistema de gestión de seguridad de la información.

Las consideraciones clave incluyen:
- Entorno empresarial y condiciones del mercado
- Requisitos regulatorios y legales
- Cambios y tendencias tecnológicas
- Cultura y valores organizacionales

### Directrices de Implementación
1. Realizar análisis ambiental regular
2. Documentar los problemas identificados y su impacto potencial
3. Revisar y actualizar el análisis de contexto en intervalos planificados
4. Asegurar la alineación con los objetivos estratégicos

## Responsabilidades
- Alta Dirección: Responsabilidad general
- Gerente de Seguridad de la Información: Implementación y mantenimiento
- Jefes de Departamento: Cumplimiento dentro de sus áreas

## Documentos Relacionados
- Metodología de Evaluación de Riesgos
- Política de Seguridad de la Información
- Declaración de Aplicabilidad`,
        pt: `# ${chapter.number}. ${getChapterTitle(chapter)}

## Propósito
Este capítulo estabelece os requisitos para ${getChapterTitle(chapter).toLowerCase()} dentro do Sistema de Gestão de Segurança da Informação (SGSI).${hasReferenceDocs ? ' O conteúdo foi adaptado com base nos seus documentos de referência.' : ''}

## Escopo
Esta documentação aplica-se a todo o pessoal, processos e sistemas dentro do escopo do SGSI.

## Requisitos

### ${chapter.sections[0]?.id} ${getSectionTitle(chapter.sections[0])}
A organização deve determinar questões externas e internas que são relevantes para seu propósito e que afetam sua capacidade de alcançar os resultados pretendidos de seu sistema de gestão de segurança da informação.

As considerações principais incluem:
- Ambiente de negócios e condições de mercado
- Requisitos regulatórios e legais
- Mudanças e tendências tecnológicas
- Cultura e valores organizacionais

### Diretrizes de Implementação
1. Realizar análise ambiental regular
2. Documentar questões identificadas e seu impacto potencial
3. Revisar e atualizar a análise de contexto em intervalos planejados
4. Garantir alinhamento com objetivos estratégicos

## Responsabilidades
- Alta Direção: Responsabilidade geral
- Gerente de Segurança da Informação: Implementação e manutenção
- Chefes de Departamento: Conformidade em suas áreas

## Documentos Relacionados
- Metodologia de Avaliação de Riscos
- Política de Segurança da Informação
- Declaração de Aplicabilidade`
      };

      const content = sampleContent[language] || sampleContent.en;
      setGeneratedContent(prev => ({ ...prev, [chapter.id]: content }));
      setEditedContent(content);
      setDocumentStatus(prev => ({ ...prev, [chapter.id]: 'draft' }));
      setIsGenerating(false);
    }, 2000);
  };

  const totalGenerated = Object.keys(generatedContent).length;
  const totalChapters = chapters.length;
  const progressPercent = Math.round((totalGenerated / totalChapters) * 100);

  // Render markdown content
  const renderContent = (content, isEditable = false) => {
    if (!content) return null;
    
    return content.split('\n').map((line, idx) => {
      if (line.startsWith('# ')) return <h1 key={idx} style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', marginTop: idx > 0 ? '24px' : 0, color: selectedChapter?.color || t.text }}>{line.substring(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={idx} style={{ fontSize: '17px', fontWeight: 600, marginBottom: '12px', marginTop: '20px', color: t.text }}>{line.substring(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={idx} style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px', marginTop: '16px', color: t.textMuted }}>{line.substring(4)}</h3>;
      if (line.startsWith('- ')) return <li key={idx} style={{ marginLeft: '20px', marginBottom: '6px', color: t.textMuted }}>{line.substring(2)}</li>;
      if (line.match(/^\d+\. /)) return <li key={idx} style={{ marginLeft: '20px', marginBottom: '6px', color: t.textMuted, listStyleType: 'decimal' }}>{line.replace(/^\d+\. /, '')}</li>;
      if (line.trim() === '') return <br key={idx} />;
      return <p key={idx} style={{ marginBottom: '10px', color: t.textMuted }}>{line}</p>;
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{l.title}</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>{l.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} />
            {l.exportAll}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '20px 24px', border: `1px solid ${t.border}`, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', color: t.textMuted }}>{l.totalProgress}</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>{totalGenerated}/{totalChapters} {l.chapters}</span>
        </div>
        <div style={{ height: '8px', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #3b82f6)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        
        {/* Chapter List */}
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '20px', border: `1px solid ${t.border}`, height: 'fit-content' }}>
          <h3 style={{ fontSize: '13px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{l.chapters}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chapters.map((chapter) => {
              const Icon = chapter.icon;
              const isSelected = selectedChapter?.id === chapter.id;
              const isGenerated = generatedContent[chapter.id];
              const status = documentStatus[chapter.id] || 'draft';
              const uploadedCount = chapterDocuments[chapter.id]?.length || 0;
              const tagCount = selectedTags[chapter.id]?.length || 0;
              
              return (
                <button
                  key={chapter.id}
                  onClick={() => { setSelectedChapter(chapter); if (generatedContent[chapter.id]) setEditedContent(generatedContent[chapter.id]); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    background: isSelected ? `${chapter.color}15` : 'transparent',
                    border: isSelected ? `1px solid ${chapter.color}40` : '1px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: isSelected ? `${chapter.color}25` : t.inputBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={18} color={isSelected ? chapter.color : t.textDim} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? chapter.color : t.text, marginBottom: '2px' }}>
                      {chapter.number}. {getChapterTitle(chapter)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {isGenerated && (
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          background: status === 'published' ? '#10b98120' : status === 'approved' ? '#3b82f620' : status === 'review' ? '#f59e0b20' : '#6b728020',
                          color: status === 'published' ? '#10b981' : status === 'approved' ? '#3b82f6' : status === 'review' ? '#f59e0b' : t.textDim
                        }}>
                          {l[status]}
                        </span>
                      )}
                      {tagCount > 0 && (
                        <span style={{ fontSize: '10px', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Tag size={9} /> {tagCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {selectedChapter ? (
            <>
              {/* Approval Workflow Stepper */}
              {generatedContent[selectedChapter.id] && (
                <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '16px 20px', border: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GitBranch size={16} color={t.textDim} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{l.approvalWorkflow}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                      {workflowSteps.map((step, idx) => {
                        const currentIdx = getStatusIndex(selectedChapter.id);
                        const isActive = idx === currentIdx;
                        const isCompleted = idx < currentIdx;
                        const stepColors = {
                          draft: '#6b7280',
                          review: '#f59e0b',
                          approved: '#3b82f6',
                          published: '#10b981'
                        };
                        return (
                          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {idx > 0 && (
                              <div style={{ 
                                width: '40px', 
                                height: '2px', 
                                background: isCompleted || isActive ? stepColors[step] : t.border,
                                marginRight: '8px'
                              }} />
                            )}
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: isCompleted || isActive ? stepColors[step] : t.inputBg,
                                border: `2px solid ${isCompleted || isActive ? stepColors[step] : t.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isCompleted || isActive ? 'white' : t.textDim
                              }}>
                                {isCompleted ? <Check size={14} /> : 
                                 step === 'draft' ? <Edit3 size={12} /> :
                                 step === 'review' ? <Eye size={12} /> :
                                 step === 'approved' ? <UserCheck size={12} /> :
                                 <CheckCircle2 size={12} />}
                              </div>
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: isActive ? 600 : 500,
                                color: isCompleted || isActive ? stepColors[step] : t.textDim
                              }}>
                                {l[step]}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {getStatusIndex(selectedChapter.id) < 3 && (
                        <button
                          onClick={() => advanceWorkflow(selectedChapter.id)}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {getStatusIndex(selectedChapter.id) === 0 ? <><Send size={12} /> {l.submitForReview}</> :
                           getStatusIndex(selectedChapter.id) === 1 ? <><UserCheck size={12} /> {l.approve}</> :
                           <><CheckCircle2 size={12} /> {l.publish}</>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Document Editor Area */}
              <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', minHeight: '600px', overflow: 'hidden' }}>
                
                {/* Chapter Header with View Controls */}
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: `${selectedChapter.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {React.createElement(selectedChapter.icon, { size: 22, color: selectedChapter.color })}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 600, color: t.text }}>
                        {selectedChapter.number}. {getChapterTitle(selectedChapter)}
                      </h2>
                      <div style={{ fontSize: '12px', color: t.textDim }}>
                        {selectedChapter.sections.length} sections
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* View Mode Toggle */}
                    {generatedContent[selectedChapter.id] && (
                      <>
                        <div style={{ display: 'flex', background: t.inputBg, borderRadius: '8px', padding: '3px' }}>
                          {[
                            { id: 'split', icon: ArrowLeftRight, label: l.splitView },
                            { id: 'preview', icon: Eye, label: l.previewMode },
                            { id: 'edit', icon: Edit3, label: l.editMode }
                          ].map((mode) => (
                            <button
                              key={mode.id}
                              onClick={() => setViewMode(mode.id)}
                              style={{
                                padding: '6px 12px',
                                background: viewMode === mode.id ? (darkMode ? '#374151' : '#ffffff') : 'transparent',
                                border: 'none',
                                borderRadius: '6px',
                                color: viewMode === mode.id ? t.text : t.textDim,
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: viewMode === mode.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                              }}
                              title={mode.label}
                            >
                              <mode.icon size={14} />
                            </button>
                          ))}
                        </div>
                        
                        {/* Control Tagging Toggle */}
                        <button
                          onClick={() => setShowControlPanel(!showControlPanel)}
                          style={{
                            padding: '8px 12px',
                            background: showControlPanel ? '#8b5cf620' : t.inputBg,
                            border: `1px solid ${showControlPanel ? '#8b5cf6' : t.border}`,
                            borderRadius: '8px',
                            color: showControlPanel ? '#8b5cf6' : t.textDim,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}
                        >
                          <Tag size={14} />
                          {l.controlTagging}
                        </button>
                        
                        {/* Version History Toggle */}
                        <button
                          onClick={() => setShowVersionHistory(!showVersionHistory)}
                          style={{
                            padding: '8px 12px',
                            background: showVersionHistory ? '#06b6d420' : t.inputBg,
                            border: `1px solid ${showVersionHistory ? '#06b6d4' : t.border}`,
                            borderRadius: '8px',
                            color: showVersionHistory ? '#06b6d4' : t.textDim,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}
                        >
                          <History size={14} />
                          {l.versionHistory}
                        </button>
                      </>
                    )}
                    
                    {/* Generate Button */}
                    <button
                      onClick={() => generateContent(selectedChapter)}
                      disabled={isGenerating}
                      style={{
                        padding: '8px 20px',
                        background: isGenerating ? t.inputBg : `linear-gradient(135deg, ${selectedChapter.color} 0%, ${selectedChapter.color}dd 100%)`,
                        border: 'none',
                        borderRadius: '8px',
                        color: isGenerating ? t.textDim : 'white',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isGenerating ? (
                        <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> {l.generating}</>
                      ) : generatedContent[selectedChapter.id] ? (
                        <><RotateCcw size={14} /> {l.regenerate}</>
                      ) : (
                        <><Wand2 size={14} /> {l.generate}</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Editor Area */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  {generatedContent[selectedChapter.id] ? (
                    <>
                      {/* Split View / Edit / Preview Content */}
                      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        
                        {/* Left Panel - AI Draft (Split view only) */}
                        {viewMode === 'split' && (
                          <div style={{ flex: 1, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}`, background: darkMode ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Sparkles size={14} color="#8b5cf6" />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>{l.aiDraft}</span>
                            </div>
                            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', fontSize: '14px', lineHeight: '1.8' }}>
                              {renderContent(generatedContent[selectedChapter.id])}
                            </div>
                          </div>
                        )}
                        
                        {/* Right Panel - User Document (Split view) or Main Content */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          {viewMode === 'split' && (
                            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}`, background: darkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <PenTool size={14} color="#10b981" />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>{l.yourDocument}</span>
                            </div>
                          )}
                          
                          {viewMode === 'preview' ? (
                            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', fontSize: '14px', lineHeight: '1.8' }}>
                              {renderContent(editedContent || generatedContent[selectedChapter.id])}
                            </div>
                          ) : (
                            <textarea
                              value={editedContent || generatedContent[selectedChapter.id]}
                              onChange={(e) => setEditedContent(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '20px',
                                background: 'transparent',
                                border: 'none',
                                color: t.text,
                                fontSize: '14px',
                                lineHeight: '1.8',
                                resize: 'none',
                                outline: 'none',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                              }}
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* Control Tagging Panel */}
                      {showControlPanel && (
                        <div style={{ width: '280px', borderLeft: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}`, background: darkMode ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <Tag size={14} color="#8b5cf6" />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>{l.annexAControls}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: t.textDim }}>{l.tagSection}</p>
                          </div>
                          
                          {/* Tagged Controls */}
                          {(selectedTags[selectedChapter.id]?.length > 0) && (
                            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}` }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l.selectedControls}</span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                {selectedTags[selectedChapter.id].map(controlId => {
                                  const control = annexAControls.find(c => c.id === controlId);
                                  return (
                                    <span
                                      key={controlId}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 8px',
                                        background: '#8b5cf620',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: '#8b5cf6'
                                      }}
                                    >
                                      {controlId}
                                      <button
                                        onClick={() => toggleControlTag(selectedChapter.id, controlId)}
                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#8b5cf6' }}
                                      >
                                        <X size={12} />
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Available Controls */}
                          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {annexAControls.map((control) => {
                                const isSelected = selectedTags[selectedChapter.id]?.includes(control.id);
                                return (
                                  <button
                                    key={control.id}
                                    onClick={() => toggleControlTag(selectedChapter.id, control.id)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '10px',
                                      padding: '10px 12px',
                                      background: isSelected ? '#8b5cf615' : t.inputBg,
                                      border: `1px solid ${isSelected ? '#8b5cf640' : t.border}`,
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <div style={{
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '4px',
                                      border: `2px solid ${isSelected ? '#8b5cf6' : t.border}`,
                                      background: isSelected ? '#8b5cf6' : 'transparent',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      marginTop: '1px'
                                    }}>
                                      {isSelected && <Check size={10} color="white" />}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#8b5cf6' : t.text }}>{control.id}</div>
                                      <div style={{ fontSize: '11px', color: t.textDim, marginTop: '2px' }}>{getControlName(control)}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Version History Panel */}
                      {showVersionHistory && (
                        <div style={{ width: '300px', borderLeft: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}`, background: darkMode ? 'rgba(6, 182, 212, 0.08)' : 'rgba(6, 182, 212, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <History size={14} color="#06b6d4" />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#06b6d4' }}>{l.versionHistory}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: t.textDim, marginTop: '4px' }}>ISO 27001 - 7.5.3</p>
                          </div>
                          
                          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            {(versionHistory[selectedChapter.id]?.length > 0) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Current version */}
                                <div style={{
                                  padding: '12px',
                                  background: '#10b98115',
                                  border: '1px solid #10b98140',
                                  borderRadius: '10px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{l.currentVersion}</span>
                                    <span style={{ fontSize: '10px', color: '#10b981', padding: '2px 6px', background: '#10b98120', borderRadius: '4px' }}>
                                      {l[documentStatus[selectedChapter.id] || 'draft']}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '11px', color: t.textDim }}>{new Date().toLocaleDateString()}</p>
                                </div>
                                
                                {/* Previous versions */}
                                {[...versionHistory[selectedChapter.id]].reverse().map((version, idx) => (
                                  <div
                                    key={version.id}
                                    style={{
                                      padding: '12px',
                                      background: t.inputBg,
                                      border: `1px solid ${t.border}`,
                                      borderRadius: '10px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{version.version}</span>
                                      <span style={{ fontSize: '10px', color: t.textDim, padding: '2px 6px', background: t.hoverBg, borderRadius: '4px' }}>
                                        {l[version.status]}
                                      </span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: t.textDim, marginBottom: '8px' }}>
                                      {new Date(version.date).toLocaleDateString()} • {version.author}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                      <span style={{ fontSize: '11px', color: '#10b981' }}>+{version.changes?.added || 0} {l.addedLines}</span>
                                      <span style={{ fontSize: '11px', color: '#ef4444' }}>-{version.changes?.removed || 0} {l.removedLines}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        onClick={() => setSelectedVersion(version)}
                                        style={{
                                          flex: 1,
                                          padding: '6px',
                                          background: 'transparent',
                                          border: `1px solid ${t.border}`,
                                          borderRadius: '6px',
                                          fontSize: '11px',
                                          color: t.textMuted,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Eye size={12} /> {l.viewDiff}
                                      </button>
                                      <button
                                        style={{
                                          flex: 1,
                                          padding: '6px',
                                          background: 'transparent',
                                          border: `1px solid ${t.border}`,
                                          borderRadius: '6px',
                                          fontSize: '11px',
                                          color: t.textMuted,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <RotateCcw size={12} /> {l.restoreVersion}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: '40px 20px', color: t.textDim }}>
                                <History size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: '13px' }}>{l.noVersions}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Empty State */
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: `${selectedChapter.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px'
                      }}>
                        <Wand2 size={36} color={selectedChapter.color} />
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: t.text }}>
                        {l.generate} {selectedChapter.number}
                      </h3>
                      <p style={{ fontSize: '14px', color: t.textDim, textAlign: 'center', maxWidth: '400px', marginBottom: '24px' }}>
                        {language === 'es' ? 'La IA generará un borrador en el panel izquierdo que podrás editar en el derecho.' :
                         language === 'pt' ? 'A IA gerará um rascunho no painel esquerdo que você poderá editar no direito.' :
                         'AI will generate a draft in the left panel that you can edit on the right.'}
                      </p>
                      <button
                        onClick={() => generateContent(selectedChapter)}
                        style={{
                          padding: '12px 32px',
                          background: `linear-gradient(135deg, ${selectedChapter.color} 0%, ${selectedChapter.color}dd 100%)`,
                          border: 'none',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '15px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Wand2 size={18} />
                        {l.generate}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Footer Actions */}
                {generatedContent[selectedChapter.id] && (
                  <div style={{ padding: '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* Tagged Controls Summary */}
                      {selectedTags[selectedChapter.id]?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8b5cf6' }}>
                          <Tag size={14} />
                          <span>{selectedTags[selectedChapter.id].length} {l.controlTagging}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setShowMergeModal(true)}
                        style={{ padding: '8px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <GitMerge size={14} />
                        {l.mergeDocument}
                      </button>
                      <button
                        onClick={() => {
                          setGeneratedContent(prev => ({ ...prev, [selectedChapter.id]: editedContent }));
                        }}
                        style={{ padding: '8px 20px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Check size={14} />
                        {l.saveChanges}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* No Chapter Selected */
            <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <FilePlus2 size={48} color={t.textDim} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: t.text, marginBottom: '8px' }}>{l.selectChapter}</h3>
                <p style={{ fontSize: '14px', color: t.textDim }}>
                  {language === 'es' ? 'Elige un capítulo del panel izquierdo para comenzar' :
                   language === 'pt' ? 'Escolha um capítulo do painel esquerdo para começar' :
                   'Choose a chapter from the left panel to begin'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Merge Modal */}
      {showMergeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ width: '500px', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GitMerge size={20} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{l.mergeTitle}</h2>
                  <p style={{ fontSize: '12px', color: t.textDim }}>{l.mergeDescription}</p>
                </div>
              </div>
              <button onClick={() => setShowMergeModal(false)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: t.inputBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim }}>
                <X size={16} />
              </button>
            </div>
            
            <div style={{ padding: '20px 24px' }}>
              <h4 style={{ fontSize: '12px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{l.availableDocs}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {existingDocuments.map((doc) => (
                  <label key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: t.inputBg, borderRadius: '10px', cursor: 'pointer' }}>
                    <input type="radio" name="mergeDoc" style={{ accentColor: '#10b981' }} />
                    <FileText size={16} color={t.textDim} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: t.text }}>{doc.name}</div>
                      <div style={{ fontSize: '11px', color: t.textDim }}>{doc.type}</div>
                    </div>
                  </label>
                ))}
              </div>

              <h4 style={{ fontSize: '12px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{l.mergeStrategy}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'append', label: l.appendContent, icon: Plus },
                  { id: 'replace', label: l.replaceContent, icon: RefreshCw },
                  { id: 'smart', label: l.smartMerge, icon: Sparkles }
                ].map((strategy) => (
                  <label key={strategy.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: t.inputBg, borderRadius: '10px', cursor: 'pointer' }}>
                    <input type="radio" name="strategy" defaultChecked={strategy.id === 'smart'} style={{ accentColor: '#10b981' }} />
                    <strategy.icon size={16} color={t.textDim} />
                    <span style={{ fontSize: '13px', color: t.text }}>{strategy.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowMergeModal(false)} style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                {l.cancelEdit}
              </button>
              <button style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitMerge size={14} />
                {l.confirmMerge}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Risk Map Screen
function RiskMapScreen() {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [mitigationLevel, setMitigationLevel] = useState(0);
  const [showAssetDiscovery, setShowAssetDiscovery] = useState(true);
  const [activeAssetSource, setActiveAssetSource] = useState('all');

  const labels = {
    en: {
      title: 'Risk Map',
      subtitle: 'Interactive risk assessment and treatment simulation',
      addRisk: 'Add Risk',
      probability: 'Probability',
      impact: 'Impact',
      riskScore: 'Risk Score',
      clickRisk: 'Click on a risk to view details and simulate treatment',
      // Asset Discovery
      assetDiscovery: 'Asset Auto-Discovery',
      discoveredAssets: 'Discovered Assets',
      syncedFrom: 'Synced from',
      lastSync: 'Last sync',
      viewAll: 'View All',
      assets: 'assets',
      servers: 'Servers',
      databases: 'Databases',
      applications: 'Applications',
      endpoints: 'Endpoints',
      cloudResources: 'Cloud Resources',
      networkDevices: 'Network',
      allSources: 'All Sources',
      // Risk Treatment Simulation
      treatmentSimulation: 'Treatment Simulation',
      currentRisk: 'Current Risk',
      projectedRisk: 'Projected Risk',
      mitigationControls: 'Mitigation Controls',
      applyControl: 'Apply',
      controlsApplied: 'Controls Applied',
      riskReduction: 'Risk Reduction',
      costEstimate: 'Est. Cost',
      timeToImplement: 'Time to Implement',
      budgetJustification: 'Budget Justification',
      generateReport: 'Generate Report',
      simulationMode: 'Simulation Mode',
      resetSimulation: 'Reset',
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      weeks: 'weeks',
      beforeMitigation: 'Before',
      afterMitigation: 'After',
      selectControlsToSimulate: 'Select controls to simulate risk reduction',
      treatmentPlan: 'Treatment Plan',
      exportPlan: 'Export Plan'
    },
    es: {
      title: 'Mapa de Riesgos',
      subtitle: 'Evaluación interactiva y simulación de tratamiento de riesgos',
      addRisk: 'Agregar Riesgo',
      probability: 'Probabilidad',
      impact: 'Impacto',
      riskScore: 'Puntuación de Riesgo',
      clickRisk: 'Haz clic en un riesgo para ver detalles y simular tratamiento',
      // Asset Discovery
      assetDiscovery: 'Descubrimiento Automático de Activos',
      discoveredAssets: 'Activos Descubiertos',
      syncedFrom: 'Sincronizado de',
      lastSync: 'Última sincronización',
      viewAll: 'Ver Todos',
      assets: 'activos',
      servers: 'Servidores',
      databases: 'Bases de Datos',
      applications: 'Aplicaciones',
      endpoints: 'Endpoints',
      cloudResources: 'Recursos Cloud',
      networkDevices: 'Red',
      allSources: 'Todas las Fuentes',
      // Risk Treatment Simulation
      treatmentSimulation: 'Simulación de Tratamiento',
      currentRisk: 'Riesgo Actual',
      projectedRisk: 'Riesgo Proyectado',
      mitigationControls: 'Controles de Mitigación',
      applyControl: 'Aplicar',
      controlsApplied: 'Controles Aplicados',
      riskReduction: 'Reducción de Riesgo',
      costEstimate: 'Costo Est.',
      timeToImplement: 'Tiempo de Implementación',
      budgetJustification: 'Justificación de Presupuesto',
      generateReport: 'Generar Informe',
      simulationMode: 'Modo Simulación',
      resetSimulation: 'Reiniciar',
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo',
      weeks: 'semanas',
      beforeMitigation: 'Antes',
      afterMitigation: 'Después',
      selectControlsToSimulate: 'Selecciona controles para simular reducción de riesgo',
      treatmentPlan: 'Plan de Tratamiento',
      exportPlan: 'Exportar Plan'
    },
    pt: {
      title: 'Mapa de Riscos',
      subtitle: 'Avaliação interativa e simulação de tratamento de riscos',
      addRisk: 'Adicionar Risco',
      probability: 'Probabilidade',
      impact: 'Impacto',
      riskScore: 'Pontuação de Risco',
      clickRisk: 'Clique em um risco para ver detalhes e simular tratamento',
      // Asset Discovery
      assetDiscovery: 'Descoberta Automática de Ativos',
      discoveredAssets: 'Ativos Descobertos',
      syncedFrom: 'Sincronizado de',
      lastSync: 'Última sincronização',
      viewAll: 'Ver Todos',
      assets: 'ativos',
      servers: 'Servidores',
      databases: 'Bancos de Dados',
      applications: 'Aplicações',
      endpoints: 'Endpoints',
      cloudResources: 'Recursos Cloud',
      networkDevices: 'Rede',
      allSources: 'Todas as Fontes',
      // Risk Treatment Simulation
      treatmentSimulation: 'Simulação de Tratamento',
      currentRisk: 'Risco Atual',
      projectedRisk: 'Risco Projetado',
      mitigationControls: 'Controles de Mitigação',
      applyControl: 'Aplicar',
      controlsApplied: 'Controles Aplicados',
      riskReduction: 'Redução de Risco',
      costEstimate: 'Custo Est.',
      timeToImplement: 'Tempo de Implementação',
      budgetJustification: 'Justificativa de Orçamento',
      generateReport: 'Gerar Relatório',
      simulationMode: 'Modo Simulação',
      resetSimulation: 'Reiniciar',
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Médio',
      low: 'Baixo',
      weeks: 'semanas',
      beforeMitigation: 'Antes',
      afterMitigation: 'Depois',
      selectControlsToSimulate: 'Selecione controles para simular redução de risco',
      treatmentPlan: 'Plano de Tratamento',
      exportPlan: 'Exportar Plano'
    }
  };

  const l = labels[language] || labels.en;

  // Enhanced risks with mitigation controls
  const risks = [
    { 
      id: 1, 
      name: 'Unauthorized Access', 
      prob: 4, 
      impact: 5, 
      category: 'Access',
      description: 'Risk of unauthorized users gaining access to critical systems',
      assets: ['Production Database', 'Admin Portal', 'API Gateway'],
      controls: [
        { id: 'c1', name: 'Multi-Factor Authentication', reduction: 8, cost: 15000, time: 2, applied: false },
        { id: 'c2', name: 'Privileged Access Management', reduction: 6, cost: 45000, time: 6, applied: false },
        { id: 'c3', name: 'Network Segmentation', reduction: 4, cost: 30000, time: 4, applied: false }
      ]
    },
    { 
      id: 2, 
      name: 'Data Breach', 
      prob: 3, 
      impact: 5, 
      category: 'Data',
      description: 'Risk of sensitive data being exposed or stolen',
      assets: ['Customer Database', 'PII Storage', 'Backup Systems'],
      controls: [
        { id: 'c4', name: 'Data Encryption at Rest', reduction: 6, cost: 25000, time: 3, applied: false },
        { id: 'c5', name: 'DLP Solution', reduction: 5, cost: 60000, time: 8, applied: false },
        { id: 'c6', name: 'Data Classification', reduction: 3, cost: 20000, time: 4, applied: false }
      ]
    },
    { 
      id: 3, 
      name: 'System Downtime', 
      prob: 3, 
      impact: 4, 
      category: 'Infrastructure',
      description: 'Risk of critical systems becoming unavailable',
      assets: ['Web Servers', 'Load Balancers', 'CDN'],
      controls: [
        { id: 'c7', name: 'High Availability Setup', reduction: 5, cost: 50000, time: 6, applied: false },
        { id: 'c8', name: 'Disaster Recovery Plan', reduction: 4, cost: 35000, time: 4, applied: false },
        { id: 'c9', name: 'Automated Failover', reduction: 4, cost: 40000, time: 5, applied: false }
      ]
    },
    { 
      id: 4, 
      name: 'Phishing Attack', 
      prob: 4, 
      impact: 3, 
      category: 'Human',
      description: 'Risk of employees falling victim to phishing campaigns',
      assets: ['Email System', 'User Workstations', 'VPN Access'],
      controls: [
        { id: 'c10', name: 'Security Awareness Training', reduction: 5, cost: 10000, time: 2, applied: false },
        { id: 'c11', name: 'Email Security Gateway', reduction: 4, cost: 25000, time: 3, applied: false },
        { id: 'c12', name: 'Phishing Simulation', reduction: 3, cost: 8000, time: 1, applied: false }
      ]
    },
    { 
      id: 5, 
      name: 'Third-Party Breach', 
      prob: 3, 
      impact: 4, 
      category: 'Vendor',
      description: 'Risk from compromised vendor or supplier systems',
      assets: ['API Integrations', 'Vendor Portal', 'Supply Chain Systems'],
      controls: [
        { id: 'c13', name: 'Vendor Risk Assessment', reduction: 4, cost: 20000, time: 4, applied: false },
        { id: 'c14', name: 'Contract Security Clauses', reduction: 2, cost: 5000, time: 2, applied: false },
        { id: 'c15', name: 'Third-Party Monitoring', reduction: 3, cost: 30000, time: 3, applied: false }
      ]
    },
    { 
      id: 6, 
      name: 'Ransomware', 
      prob: 2, 
      impact: 5, 
      category: 'Malware',
      description: 'Risk of ransomware encrypting critical data',
      assets: ['File Servers', 'Workstations', 'Backup Systems'],
      controls: [
        { id: 'c16', name: 'EDR Solution', reduction: 6, cost: 40000, time: 3, applied: false },
        { id: 'c17', name: 'Immutable Backups', reduction: 5, cost: 25000, time: 4, applied: false },
        { id: 'c18', name: 'Network Detection', reduction: 4, cost: 35000, time: 4, applied: false }
      ]
    }
  ];

  // Auto-discovered assets from various sources
  const assetSources = [
    { 
      id: 'aws', 
      name: 'AWS', 
      icon: '☁️', 
      color: '#FF9900',
      lastSync: '5 min ago',
      assets: [
        { name: 'prod-db-cluster', type: 'Database', criticality: 'Critical' },
        { name: 'api-gateway-main', type: 'Application', criticality: 'High' },
        { name: 'ec2-web-server-1', type: 'Server', criticality: 'High' },
        { name: 's3-customer-data', type: 'Storage', criticality: 'Critical' }
      ]
    },
    { 
      id: 'azure', 
      name: 'Azure AD', 
      icon: '🔷', 
      color: '#0078D4',
      lastSync: '3 min ago',
      assets: [
        { name: 'admin-portal', type: 'Application', criticality: 'Critical' },
        { name: 'user-directory', type: 'Database', criticality: 'High' }
      ]
    },
    { 
      id: 'jira', 
      name: 'Jira', 
      icon: '📋', 
      color: '#0052CC',
      lastSync: '10 min ago',
      assets: [
        { name: 'project-management', type: 'Application', criticality: 'Medium' },
        { name: 'issue-tracker', type: 'Application', criticality: 'Low' }
      ]
    },
    { 
      id: 'network', 
      name: 'Network Scan', 
      icon: '🌐', 
      color: '#10b981',
      lastSync: '1 hour ago',
      assets: [
        { name: 'firewall-main', type: 'Network', criticality: 'Critical' },
        { name: 'switch-core-01', type: 'Network', criticality: 'High' },
        { name: 'router-edge-01', type: 'Network', criticality: 'High' },
        { name: 'vpn-gateway', type: 'Network', criticality: 'Critical' }
      ]
    }
  ];

  const [appliedControls, setAppliedControls] = useState([]);

  const getRiskColor = (prob, impact) => { 
    const score = prob * impact; 
    if (score >= 15) return '#ef4444'; 
    if (score >= 8) return '#f59e0b'; 
    return '#10b981'; 
  };

  const getRiskLevel = (score) => {
    if (score >= 15) return { text: l.critical, color: '#ef4444' };
    if (score >= 10) return { text: l.high, color: '#f97316' };
    if (score >= 5) return { text: l.medium, color: '#f59e0b' };
    return { text: l.low, color: '#10b981' };
  };

  const calculateMitigatedScore = (risk) => {
    if (!risk) return 0;
    const baseScore = risk.prob * risk.impact;
    const totalReduction = appliedControls.reduce((sum, controlId) => {
      const control = risk.controls.find(c => c.id === controlId);
      return sum + (control ? control.reduction : 0);
    }, 0);
    return Math.max(1, baseScore - totalReduction);
  };

  const getTotalCost = (risk) => {
    if (!risk) return 0;
    return appliedControls.reduce((sum, controlId) => {
      const control = risk.controls.find(c => c.id === controlId);
      return sum + (control ? control.cost : 0);
    }, 0);
  };

  const getTotalTime = (risk) => {
    if (!risk) return 0;
    return Math.max(...appliedControls.map(controlId => {
      const control = risk.controls.find(c => c.id === controlId);
      return control ? control.time : 0;
    }), 0);
  };

  const toggleControl = (controlId) => {
    setAppliedControls(prev => 
      prev.includes(controlId) 
        ? prev.filter(id => id !== controlId)
        : [...prev, controlId]
    );
  };

  const resetSimulation = () => {
    setAppliedControls([]);
  };

  const filteredAssets = activeAssetSource === 'all' 
    ? assetSources.flatMap(s => s.assets.map(a => ({ ...a, source: s.name, icon: s.icon })))
    : assetSources.find(s => s.id === activeAssetSource)?.assets.map(a => ({ ...a, source: assetSources.find(s => s.id === activeAssetSource).name, icon: assetSources.find(s => s.id === activeAssetSource).icon })) || [];

  const totalAssets = assetSources.reduce((sum, s) => sum + s.assets.length, 0);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{l.title}</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>{l.subtitle}</p>
        </div>
        <button style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} />
          {l.addRisk}
        </button>
      </div>

      {/* Asset Auto-Discovery Dashboard */}
      <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, marginBottom: '24px', overflow: 'hidden' }}>
        <div 
          style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          onClick={() => setShowAssetDiscovery(!showAssetDiscovery)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: t.text }}>{l.assetDiscovery}</h3>
              <p style={{ fontSize: '12px', color: t.textDim }}>{totalAssets} {l.assets} • {assetSources.length} {l.syncedFrom.toLowerCase()}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {assetSources.map(source => (
              <div key={source.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>{source.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: t.text }}>{source.assets.length}</span>
              </div>
            ))}
            <ChevronDown size={20} color={t.textDim} style={{ transform: showAssetDiscovery ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
          </div>
        </div>

        {showAssetDiscovery && (
          <div style={{ padding: '20px' }}>
            {/* Source Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveAssetSource('all')}
                style={{
                  padding: '8px 16px',
                  background: activeAssetSource === 'all' ? '#3b82f620' : t.inputBg,
                  border: `1px solid ${activeAssetSource === 'all' ? '#3b82f6' : t.border}`,
                  borderRadius: '8px',
                  color: activeAssetSource === 'all' ? '#3b82f6' : t.textMuted,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {l.allSources} ({totalAssets})
              </button>
              {assetSources.map(source => (
                <button
                  key={source.id}
                  onClick={() => setActiveAssetSource(source.id)}
                  style={{
                    padding: '8px 16px',
                    background: activeAssetSource === source.id ? `${source.color}20` : t.inputBg,
                    border: `1px solid ${activeAssetSource === source.id ? source.color : t.border}`,
                    borderRadius: '8px',
                    color: activeAssetSource === source.id ? source.color : t.textMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{source.icon}</span>
                  {source.name} ({source.assets.length})
                </button>
              ))}
            </div>

            {/* Assets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {filteredAssets.slice(0, 8).map((asset, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    background: t.inputBg,
                    borderRadius: '10px',
                    border: `1px solid ${t.border}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{asset.icon}</span>
                    <span style={{
                      padding: '2px 6px',
                      background: asset.criticality === 'Critical' ? '#ef444420' : asset.criticality === 'High' ? '#f59e0b20' : '#10b98120',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 600,
                      color: asset.criticality === 'Critical' ? '#ef4444' : asset.criticality === 'High' ? '#f59e0b' : '#10b981'
                    }}>
                      {asset.criticality}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: t.text, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {asset.name}
                  </div>
                  <div style={{ fontSize: '11px', color: t.textDim }}>{asset.type}</div>
                </div>
              ))}
            </div>
            
            {filteredAssets.length > 8 && (
              <button style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: 'transparent',
                border: `1px solid ${t.border}`,
                borderRadius: '8px',
                color: t.textMuted,
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}>
                {l.viewAll} ({filteredAssets.length} {l.assets})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        
        {/* Risk Heatmap */}
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '28px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
            <div style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', fontSize: '11px', color: t.textDim, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '40px' }}>{l.probability}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                {[5, 4, 3, 2, 1].map((prob) => (
                  [1, 2, 3, 4, 5].map((impact) => {
                    const cellRisks = risks.filter(r => r.prob === prob && r.impact === impact);
                    const score = prob * impact;
                    let bgColor = 'rgba(16, 185, 129, 0.15)'; 
                    if (score >= 15) bgColor = 'rgba(239, 68, 68, 0.25)'; 
                    else if (score >= 8) bgColor = 'rgba(245, 158, 11, 0.2)';
                    return (
                      <div key={`${prob}-${impact}`} style={{ 
                        aspectRatio: '1', 
                        background: bgColor, 
                        borderRadius: '8px', 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '4px', 
                        padding: '8px', 
                        minHeight: '70px' 
                      }}>
                        {cellRisks.map((risk) => {
                          const isSelected = selectedRisk?.id === risk.id;
                          return (
                            <div 
                              key={risk.id} 
                              onClick={() => { setSelectedRisk(risk); setAppliedControls([]); }}
                              style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '8px', 
                                background: getRiskColor(risk.prob, risk.impact), 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '11px', 
                                fontWeight: 700, 
                                color: 'white', 
                                cursor: 'pointer', 
                                boxShadow: isSelected ? `0 0 0 3px ${getRiskColor(risk.prob, risk.impact)}60, 0 4px 12px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.3)',
                                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {risk.id}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px', color: t.textDim, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '16px' }}>{l.impact}</div>
            </div>
          </div>
          
          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${t.border}` }}>
            {[
              { label: l.critical, color: '#ef4444' },
              { label: l.high, color: '#f97316' },
              { label: l.medium, color: '#f59e0b' },
              { label: l.low, color: '#10b981' }
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
                <span style={{ fontSize: '12px', color: t.textMuted }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Treatment Simulation Panel */}
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '24px', border: `1px solid ${t.border}` }}>
          {selectedRisk ? (
            <div>
              {/* Risk Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: getRiskColor(selectedRisk.prob, selectedRisk.impact), 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <AlertTriangle size={24} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{selectedRisk.name}</h3>
                    <span style={{ 
                      display: 'inline-block', 
                      padding: '3px 8px', 
                      background: t.inputBg, 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      color: t.textDim,
                      marginTop: '4px'
                    }}>
                      {selectedRisk.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Score Comparison */}
              <div style={{ 
                padding: '16px', 
                background: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)', 
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Sparkles size={14} color="#8b5cf6" />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase' }}>{l.simulationMode}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Before */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '6px' }}>{l.beforeMitigation}</div>
                    <div style={{ 
                      fontSize: '32px', 
                      fontWeight: 700, 
                      color: getRiskColor(selectedRisk.prob, selectedRisk.impact)
                    }}>
                      {selectedRisk.prob * selectedRisk.impact}
                    </div>
                    <div style={{ 
                      fontSize: '10px', 
                      fontWeight: 600,
                      color: getRiskLevel(selectedRisk.prob * selectedRisk.impact).color
                    }}>
                      {getRiskLevel(selectedRisk.prob * selectedRisk.impact).text}
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <ArrowRight size={24} color={appliedControls.length > 0 ? '#10b981' : t.textDim} />
                    {appliedControls.length > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#10b981' }}>
                        -{(selectedRisk.prob * selectedRisk.impact) - calculateMitigatedScore(selectedRisk)}
                      </span>
                    )}
                  </div>
                  
                  {/* After */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '6px' }}>{l.afterMitigation}</div>
                    <div style={{ 
                      fontSize: '32px', 
                      fontWeight: 700, 
                      color: appliedControls.length > 0 
                        ? getRiskLevel(calculateMitigatedScore(selectedRisk)).color 
                        : t.textDim
                    }}>
                      {appliedControls.length > 0 ? calculateMitigatedScore(selectedRisk) : '—'}
                    </div>
                    {appliedControls.length > 0 && (
                      <div style={{ 
                        fontSize: '10px', 
                        fontWeight: 600,
                        color: getRiskLevel(calculateMitigatedScore(selectedRisk)).color
                      }}>
                        {getRiskLevel(calculateMitigatedScore(selectedRisk)).text}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mitigation Controls */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase' }}>{l.mitigationControls}</span>
                  {appliedControls.length > 0 && (
                    <button 
                      onClick={resetSimulation}
                      style={{
                        padding: '4px 10px',
                        background: 'transparent',
                        border: `1px solid ${t.border}`,
                        borderRadius: '6px',
                        color: t.textDim,
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {l.resetSimulation}
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedRisk.controls.map((control) => {
                    const isApplied = appliedControls.includes(control.id);
                    return (
                      <div
                        key={control.id}
                        onClick={() => toggleControl(control.id)}
                        style={{
                          padding: '12px 14px',
                          background: isApplied ? '#10b98115' : t.inputBg,
                          borderRadius: '10px',
                          border: `1px solid ${isApplied ? '#10b98150' : t.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '6px',
                              border: `2px solid ${isApplied ? '#10b981' : t.border}`,
                              background: isApplied ? '#10b981' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isApplied && <Check size={12} color="white" />}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: isApplied ? '#10b981' : t.text }}>
                              {control.name}
                            </span>
                          </div>
                          <span style={{ 
                            padding: '2px 8px', 
                            background: '#10b98120', 
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#10b981'
                          }}>
                            -{control.reduction}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', paddingLeft: '30px' }}>
                          <span style={{ fontSize: '11px', color: t.textDim }}>
                            ${control.cost.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '11px', color: t.textDim }}>
                            {control.time} {l.weeks}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cost/Time Summary */}
              {appliedControls.length > 0 && (
                <div style={{ 
                  padding: '16px', 
                  background: t.inputBg, 
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>
                    {l.budgetJustification}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: t.textDim }}>{l.costEstimate}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                        ${getTotalCost(selectedRisk).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: t.textDim }}>{l.timeToImplement}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                        {getTotalTime(selectedRisk)} {l.weeks}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: t.textDim }}>{l.riskReduction}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                        {Math.round(((selectedRisk.prob * selectedRisk.impact - calculateMitigatedScore(selectedRisk)) / (selectedRisk.prob * selectedRisk.impact)) * 100)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: t.textDim }}>{l.controlsApplied}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>
                        {appliedControls.length}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Button */}
              {appliedControls.length > 0 && (
                <button style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <Download size={16} />
                  {l.exportPlan}
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: t.textDim }}>
              <AlertTriangle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '8px' }}>{l.treatmentSimulation}</h4>
              <p style={{ fontSize: '13px' }}>{l.clickRisk}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Evidence Center Screen
function EvidenceCenterScreen() {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('evidences'); // evidences, upload, requests, connectors
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const labels = {
    en: {
      title: 'Evidence Center',
      subtitle: 'Automated evidence collection and management',
      evidences: 'Evidences',
      upload: 'Bulk Upload',
      requests: 'Evidence Requests',
      connectors: 'Connectors',
      totalEvidences: 'Total Evidences',
      autoCollected: 'Auto-Collected',
      manualUpload: 'Manual Upload',
      pendingRequests: 'Pending Requests',
      addEvidence: 'Add Evidence',
      // Freshness Indicator
      health: 'Health',
      fresh: 'Fresh',
      expiringSoon: 'Expiring Soon',
      expired: 'Expired',
      lastUpdated: 'Last Updated',
      daysAgo: 'days ago',
      validFor: 'Valid for',
      days: 'days',
      needsUpdate: 'Needs Update',
      updateNow: 'Update Now',
      // Bulk Upload
      bulkUploadTitle: 'Bulk Upload with AI Classification',
      bulkUploadDesc: 'Drop multiple files and let AI classify and link them to controls',
      dragDropFiles: 'Drag & drop files here',
      orClickToBrowse: 'or click to browse',
      supportedFormats: 'PDF, DOCX, PNG, JPG, JSON, CSV (max 50MB per file)',
      analyzing: 'Analyzing',
      analyzed: 'Analyzed',
      aiSuggestion: 'AI Suggestion',
      suggestedControl: 'Suggested Control',
      confidence: 'Confidence',
      acceptSuggestion: 'Accept',
      rejectSuggestion: 'Change',
      uploadAll: 'Upload All',
      clearAll: 'Clear All',
      filesReady: 'files ready to upload',
      // API Deep-Linking
      sourceDetails: 'Source Details',
      apiResponse: 'API Response',
      collectedFrom: 'Collected from',
      timestamp: 'Timestamp',
      endpoint: 'Endpoint',
      viewRawData: 'View Raw Data',
      copyJson: 'Copy JSON',
      technicalDetails: 'Technical Details',
      // Placeholder Management
      evidenceRequests: 'Evidence Requests',
      requestEvidence: 'Request Evidence',
      assignTo: 'Assign to',
      department: 'Department',
      dueDate: 'Due Date',
      controlLink: 'Linked Control',
      status: 'Status',
      pending: 'Pending',
      submitted: 'Submitted',
      overdue: 'Overdue',
      sendRequest: 'Send Request',
      magicLink: 'Magic Link',
      copyLink: 'Copy Link',
      linkCopied: 'Link copied!',
      requestSent: 'Request sent successfully',
      resendReminder: 'Resend Reminder',
      viewSubmission: 'View Submission',
      // General
      control: 'Control',
      type: 'Type',
      source: 'Source',
      actions: 'Actions',
      view: 'View',
      download: 'Download',
      delete: 'Delete',
      all: 'All',
      automatic: 'Automatic',
      manual: 'Manual',
      filterBy: 'Filter by',
      searchEvidences: 'Search evidences...',
      noEvidencesFound: 'No evidences found',
      connected: 'Connected',
      error: 'Error',
      configure: 'Configure',
      reconnect: 'Reconnect',
      lastSync: 'Last sync'
    },
    es: {
      title: 'Centro de Evidencias',
      subtitle: 'Recolección y gestión automatizada de evidencias',
      evidences: 'Evidencias',
      upload: 'Carga Masiva',
      requests: 'Solicitudes',
      connectors: 'Conectores',
      totalEvidences: 'Total Evidencias',
      autoCollected: 'Auto-Recolectadas',
      manualUpload: 'Carga Manual',
      pendingRequests: 'Solicitudes Pendientes',
      addEvidence: 'Agregar Evidencia',
      // Freshness Indicator
      health: 'Salud',
      fresh: 'Vigente',
      expiringSoon: 'Por Vencer',
      expired: 'Vencida',
      lastUpdated: 'Última Actualización',
      daysAgo: 'días atrás',
      validFor: 'Válida por',
      days: 'días',
      needsUpdate: 'Necesita Actualización',
      updateNow: 'Actualizar Ahora',
      // Bulk Upload
      bulkUploadTitle: 'Carga Masiva con Clasificación IA',
      bulkUploadDesc: 'Suelta múltiples archivos y deja que la IA los clasifique y vincule a controles',
      dragDropFiles: 'Arrastra archivos aquí',
      orClickToBrowse: 'o haz clic para buscar',
      supportedFormats: 'PDF, DOCX, PNG, JPG, JSON, CSV (máx 50MB por archivo)',
      analyzing: 'Analizando',
      analyzed: 'Analizado',
      aiSuggestion: 'Sugerencia IA',
      suggestedControl: 'Control Sugerido',
      confidence: 'Confianza',
      acceptSuggestion: 'Aceptar',
      rejectSuggestion: 'Cambiar',
      uploadAll: 'Subir Todo',
      clearAll: 'Limpiar Todo',
      filesReady: 'archivos listos para subir',
      // API Deep-Linking
      sourceDetails: 'Detalles de Origen',
      apiResponse: 'Respuesta API',
      collectedFrom: 'Recolectado de',
      timestamp: 'Marca de tiempo',
      endpoint: 'Endpoint',
      viewRawData: 'Ver Datos Crudos',
      copyJson: 'Copiar JSON',
      technicalDetails: 'Detalles Técnicos',
      // Placeholder Management
      evidenceRequests: 'Solicitudes de Evidencia',
      requestEvidence: 'Solicitar Evidencia',
      assignTo: 'Asignar a',
      department: 'Departamento',
      dueDate: 'Fecha Límite',
      controlLink: 'Control Vinculado',
      status: 'Estado',
      pending: 'Pendiente',
      submitted: 'Enviado',
      overdue: 'Vencido',
      sendRequest: 'Enviar Solicitud',
      magicLink: 'Enlace Mágico',
      copyLink: 'Copiar Enlace',
      linkCopied: '¡Enlace copiado!',
      requestSent: 'Solicitud enviada exitosamente',
      resendReminder: 'Reenviar Recordatorio',
      viewSubmission: 'Ver Envío',
      // General
      control: 'Control',
      type: 'Tipo',
      source: 'Fuente',
      actions: 'Acciones',
      view: 'Ver',
      download: 'Descargar',
      delete: 'Eliminar',
      all: 'Todos',
      automatic: 'Automático',
      manual: 'Manual',
      filterBy: 'Filtrar por',
      searchEvidences: 'Buscar evidencias...',
      noEvidencesFound: 'No se encontraron evidencias',
      connected: 'Conectado',
      error: 'Error',
      configure: 'Configurar',
      reconnect: 'Reconectar',
      lastSync: 'Última sincronización'
    },
    pt: {
      title: 'Centro de Evidências',
      subtitle: 'Coleta e gestão automatizada de evidências',
      evidences: 'Evidências',
      upload: 'Upload em Massa',
      requests: 'Solicitações',
      connectors: 'Conectores',
      totalEvidences: 'Total de Evidências',
      autoCollected: 'Auto-Coletadas',
      manualUpload: 'Upload Manual',
      pendingRequests: 'Solicitações Pendentes',
      addEvidence: 'Adicionar Evidência',
      // Freshness Indicator
      health: 'Saúde',
      fresh: 'Vigente',
      expiringSoon: 'Expirando',
      expired: 'Expirada',
      lastUpdated: 'Última Atualização',
      daysAgo: 'dias atrás',
      validFor: 'Válida por',
      days: 'dias',
      needsUpdate: 'Precisa Atualização',
      updateNow: 'Atualizar Agora',
      // Bulk Upload
      bulkUploadTitle: 'Upload em Massa com Classificação IA',
      bulkUploadDesc: 'Solte múltiplos arquivos e deixe a IA classificá-los e vinculá-los aos controles',
      dragDropFiles: 'Arraste arquivos aqui',
      orClickToBrowse: 'ou clique para procurar',
      supportedFormats: 'PDF, DOCX, PNG, JPG, JSON, CSV (máx 50MB por arquivo)',
      analyzing: 'Analisando',
      analyzed: 'Analisado',
      aiSuggestion: 'Sugestão IA',
      suggestedControl: 'Controle Sugerido',
      confidence: 'Confiança',
      acceptSuggestion: 'Aceitar',
      rejectSuggestion: 'Alterar',
      uploadAll: 'Enviar Tudo',
      clearAll: 'Limpar Tudo',
      filesReady: 'arquivos prontos para enviar',
      // API Deep-Linking
      sourceDetails: 'Detalhes da Origem',
      apiResponse: 'Resposta da API',
      collectedFrom: 'Coletado de',
      timestamp: 'Timestamp',
      endpoint: 'Endpoint',
      viewRawData: 'Ver Dados Brutos',
      copyJson: 'Copiar JSON',
      technicalDetails: 'Detalhes Técnicos',
      // Placeholder Management
      evidenceRequests: 'Solicitações de Evidência',
      requestEvidence: 'Solicitar Evidência',
      assignTo: 'Atribuir a',
      department: 'Departamento',
      dueDate: 'Data Limite',
      controlLink: 'Controle Vinculado',
      status: 'Status',
      pending: 'Pendente',
      submitted: 'Enviado',
      overdue: 'Atrasado',
      sendRequest: 'Enviar Solicitação',
      magicLink: 'Link Mágico',
      copyLink: 'Copiar Link',
      linkCopied: 'Link copiado!',
      requestSent: 'Solicitação enviada com sucesso',
      resendReminder: 'Reenviar Lembrete',
      viewSubmission: 'Ver Envio',
      // General
      control: 'Controle',
      type: 'Tipo',
      source: 'Fonte',
      actions: 'Ações',
      view: 'Ver',
      download: 'Baixar',
      delete: 'Excluir',
      all: 'Todos',
      automatic: 'Automático',
      manual: 'Manual',
      filterBy: 'Filtrar por',
      searchEvidences: 'Buscar evidências...',
      noEvidencesFound: 'Nenhuma evidência encontrada',
      connected: 'Conectado',
      error: 'Erro',
      configure: 'Configurar',
      reconnect: 'Reconectar',
      lastSync: 'Última sincronização'
    }
  };

  const l = labels[language] || labels.en;

  // Sample evidence data with freshness info
  const evidences = [
    { 
      id: 1, 
      name: 'AWS S3 Encryption Config', 
      control: 'A.8.24', 
      type: 'automatic', 
      source: 'AWS',
      sourceIcon: '☁️',
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      validityDays: 30,
      status: 'fresh',
      apiData: {
        endpoint: 'GET /s3/bucket-encryption',
        timestamp: '2024-12-13T14:32:00Z',
        response: {
          "ServerSideEncryptionConfiguration": {
            "Rules": [{
              "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": "arn:aws:kms:us-east-1:123456789:key/mrk-xxx"
              },
              "BucketKeyEnabled": true
            }]
          }
        }
      }
    },
    { 
      id: 2, 
      name: 'Azure AD MFA Status Report', 
      control: 'A.5.17', 
      type: 'automatic', 
      source: 'Azure',
      sourceIcon: '🔷',
      lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      validityDays: 7,
      status: 'fresh',
      apiData: {
        endpoint: 'GET /reports/authenticationMethods/userRegistrationDetails',
        timestamp: '2024-12-10T09:15:00Z',
        response: {
          "value": [{
            "userPrincipalName": "admin@company.com",
            "isMfaRegistered": true,
            "isMfaCapable": true,
            "methodsRegistered": ["microsoftAuthenticatorPush", "phoneAuthentication"]
          }],
          "totalMfaEnabled": 245,
          "totalUsers": 250,
          "complianceRate": "98%"
        }
      }
    },
    { 
      id: 3, 
      name: 'Backup Verification Log', 
      control: 'A.8.13', 
      type: 'manual', 
      source: 'Manual',
      sourceIcon: '📄',
      lastUpdated: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      validityDays: 30,
      status: 'expired'
    },
    { 
      id: 4, 
      name: 'Jira Security Training Tickets', 
      control: 'A.6.3', 
      type: 'automatic', 
      source: 'Jira',
      sourceIcon: '📋',
      lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      validityDays: 90,
      status: 'fresh',
      apiData: {
        endpoint: 'GET /rest/api/3/search?jql=project=SEC',
        timestamp: '2024-12-14T11:00:00Z',
        response: {
          "total": 45,
          "issues": [{
            "key": "SEC-234",
            "fields": {
              "summary": "Q4 Security Awareness Training",
              "status": { "name": "Done" },
              "completedUsers": 248,
              "totalUsers": 250
            }
          }]
        }
      }
    },
    { 
      id: 5, 
      name: 'Okta Access Review Export', 
      control: 'A.5.18', 
      type: 'automatic', 
      source: 'Okta',
      sourceIcon: '🔐',
      lastUpdated: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      validityDays: 30,
      status: 'expiring',
      apiData: {
        endpoint: 'GET /api/v1/users?filter=status eq "ACTIVE"',
        timestamp: '2024-11-20T16:45:00Z',
        response: {
          "totalActiveUsers": 250,
          "lastAccessReviewDate": "2024-11-15",
          "reviewedAccounts": 250,
          "deactivatedAccounts": 12,
          "complianceStatus": "COMPLIANT"
        }
      }
    },
    { 
      id: 6, 
      name: 'Penetration Test Report Q4', 
      control: 'A.8.8', 
      type: 'manual', 
      source: 'Manual',
      sourceIcon: '📄',
      lastUpdated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      validityDays: 365,
      status: 'fresh'
    },
    { 
      id: 7, 
      name: 'GitHub Branch Protection Rules', 
      control: 'A.8.9', 
      type: 'automatic', 
      source: 'GitHub',
      sourceIcon: '🐙',
      lastUpdated: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      validityDays: 30,
      status: 'expired',
      apiData: {
        endpoint: 'GET /repos/{owner}/{repo}/branches/{branch}/protection',
        timestamp: '2024-10-15T08:30:00Z',
        response: {
          "required_pull_request_reviews": {
            "required_approving_review_count": 2,
            "dismiss_stale_reviews": true
          },
          "required_status_checks": {
            "strict": true,
            "contexts": ["ci/tests", "security/scan"]
          }
        }
      }
    }
  ];

  // Evidence requests data
  const evidenceRequests = [
    { id: 1, title: 'HR Policy Acknowledgment Records', control: 'A.6.2', assignee: 'María López', department: 'HR', email: 'maria.lopez@company.com', dueDate: '2024-12-20', status: 'pending', magicLink: 'https://dani.app/upload/abc123' },
    { id: 2, title: 'Physical Access Logs - Data Center', control: 'A.7.2', assignee: 'Carlos Ruiz', department: 'Facilities', email: 'carlos.ruiz@company.com', dueDate: '2024-12-18', status: 'overdue', magicLink: 'https://dani.app/upload/def456' },
    { id: 3, title: 'Vendor Security Assessments', control: 'A.5.19', assignee: 'Ana García', department: 'Procurement', email: 'ana.garcia@company.com', dueDate: '2024-12-25', status: 'pending', magicLink: 'https://dani.app/upload/ghi789' },
    { id: 4, title: 'Employee Background Check Records', control: 'A.6.1', assignee: 'Pedro Sánchez', department: 'HR', email: 'pedro.sanchez@company.com', dueDate: '2024-12-15', status: 'submitted', magicLink: 'https://dani.app/upload/jkl012' }
  ];

  // Connectors data
  const connectors = [
    { id: 'aws', name: 'AWS', icon: '☁️', status: 'connected', lastSync: '5 min ago', evidences: 12, color: '#FF9900' },
    { id: 'azure', name: 'Azure', icon: '🔷', status: 'connected', lastSync: '2 min ago', evidences: 28, color: '#0078D4' },
    { id: 'jira', name: 'Jira', icon: '📋', status: 'connected', lastSync: '1 min ago', evidences: 45, color: '#0052CC' },
    { id: 'okta', name: 'Okta', icon: '🔐', status: 'connected', lastSync: '3 min ago', evidences: 18, color: '#007DC1' },
    { id: 'github', name: 'GitHub', icon: '🐙', status: 'error', lastSync: 'Failed 2h ago', evidences: 8, color: '#333' },
    { id: 'slack', name: 'Slack', icon: '💬', status: 'pending', lastSync: 'Not configured', evidences: 0, color: '#4A154B' }
  ];

  // AI classification suggestions for uploaded files
  const aiSuggestions = {
    'backup': { control: 'A.8.13', name: 'Information backup', confidence: 92 },
    'pentest': { control: 'A.8.8', name: 'Management of technical vulnerabilities', confidence: 95 },
    'access': { control: 'A.5.15', name: 'Access control', confidence: 88 },
    'training': { control: 'A.6.3', name: 'Information security awareness', confidence: 90 },
    'encryption': { control: 'A.8.24', name: 'Use of cryptography', confidence: 94 },
    'policy': { control: 'A.5.1', name: 'Policies for information security', confidence: 89 },
    'incident': { control: 'A.5.24', name: 'Incident management planning', confidence: 91 },
    'vendor': { control: 'A.5.19', name: 'Supplier relationships', confidence: 87 }
  };

  const getDaysAgo = (date) => Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  const getFreshnessStatus = (evidence) => {
    const daysAgo = getDaysAgo(evidence.lastUpdated);
    const daysRemaining = evidence.validityDays - daysAgo;
    if (daysRemaining <= 0) return 'expired';
    if (daysRemaining <= 7) return 'expiring';
    return 'fresh';
  };

  const getFreshnessColor = (status) => {
    switch (status) {
      case 'fresh': return '#10b981';
      case 'expiring': return '#f59e0b';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer?.files || e.target.files || []);
    processFiles(files);
  };

  const processFiles = (files) => {
    const newFiles = files.map((file, idx) => {
      // Simulate AI classification based on filename
      const fileName = file.name.toLowerCase();
      let suggestion = null;
      for (const [keyword, data] of Object.entries(aiSuggestions)) {
        if (fileName.includes(keyword)) {
          suggestion = data;
          break;
        }
      }
      // Default suggestion if no match
      if (!suggestion) {
        suggestion = { control: 'A.5.1', name: 'Policies for information security', confidence: 75 };
      }

      return {
        id: Date.now() + idx,
        file,
        name: file.name,
        size: file.size,
        status: 'analyzing',
        suggestion: null,
        accepted: false
      };
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsAnalyzing(true);

    // Simulate AI analysis
    newFiles.forEach((fileData, idx) => {
      setTimeout(() => {
        const fileName = fileData.name.toLowerCase();
        let suggestion = { control: 'A.5.1', name: 'Policies for information security', confidence: 75 + Math.floor(Math.random() * 20) };
        for (const [keyword, data] of Object.entries(aiSuggestions)) {
          if (fileName.includes(keyword)) {
            suggestion = { ...data, confidence: data.confidence + Math.floor(Math.random() * 5) - 2 };
            break;
          }
        }

        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'analyzed', suggestion } : f
        ));

        if (idx === newFiles.length - 1) setIsAnalyzing(false);
      }, 1500 + idx * 800);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredEvidences = evidences.filter(e => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'automatic') return e.type === 'automatic';
    if (filterStatus === 'manual') return e.type === 'manual';
    if (filterStatus === 'expired') return getFreshnessStatus(e) === 'expired';
    if (filterStatus === 'expiring') return getFreshnessStatus(e) === 'expiring';
    return true;
  });

  const stats = [
    { label: l.totalEvidences, value: evidences.length.toString(), color: '#10b981', icon: Database },
    { label: l.autoCollected, value: evidences.filter(e => e.type === 'automatic').length.toString(), color: '#3b82f6', icon: Zap },
    { label: l.manualUpload, value: evidences.filter(e => e.type === 'manual').length.toString(), color: '#f59e0b', icon: Upload },
    { label: l.pendingRequests, value: evidenceRequests.filter(r => r.status === 'pending' || r.status === 'overdue').length.toString(), color: '#ef4444', icon: Clock }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{l.title}</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>{l.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowRequestModal(true)}
            style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Send size={16} />
            {l.requestEvidence}
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Upload size={16} />
            {l.addEvidence}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '18px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={stat.color} />
                </div>
                <span style={{ fontSize: '12px', color: t.textDim }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'evidences', label: l.evidences, icon: Database },
          { id: 'upload', label: l.upload, icon: Upload },
          { id: 'requests', label: l.requests, icon: Send },
          { id: 'connectors', label: l.connectors, icon: Zap }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                background: isActive ? '#10b98120' : 'transparent',
                border: `1px solid ${isActive ? '#10b981' : t.border}`,
                borderRadius: '10px',
                color: isActive ? '#10b981' : t.textMuted,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={16} />
              {tab.label}
              {tab.id === 'requests' && evidenceRequests.filter(r => r.status === 'pending' || r.status === 'overdue').length > 0 && (
                <span style={{ 
                  background: '#ef4444', 
                  color: 'white', 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  padding: '2px 6px', 
                  borderRadius: '10px' 
                }}>
                  {evidenceRequests.filter(r => r.status === 'pending' || r.status === 'overdue').length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'evidences' && (
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          {/* Filter Bar */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: t.textDim }}>{l.filterBy}:</span>
              {[
                { id: 'all', label: l.all },
                { id: 'automatic', label: l.automatic },
                { id: 'manual', label: l.manual },
                { id: 'expired', label: l.expired },
                { id: 'expiring', label: l.expiringSoon }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  style={{
                    padding: '6px 12px',
                    background: filterStatus === filter.id ? '#10b98120' : t.inputBg,
                    border: `1px solid ${filterStatus === filter.id ? '#10b981' : t.border}`,
                    borderRadius: '6px',
                    color: filterStatus === filter.id ? '#10b981' : t.textMuted,
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.textDim }} />
              <input
                placeholder={l.searchEvidences}
                style={{
                  padding: '8px 12px 8px 36px',
                  background: t.inputBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: '8px',
                  color: t.text,
                  fontSize: '13px',
                  width: '250px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Evidence Table with Freshness Indicator */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l.health}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evidence</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l.control}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l.source}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l.lastUpdated}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvidences.map((evidence) => {
                  const freshnessStatus = getFreshnessStatus(evidence);
                  const freshnessColor = getFreshnessColor(freshnessStatus);
                  const daysAgo = getDaysAgo(evidence.lastUpdated);
                  const daysRemaining = evidence.validityDays - daysAgo;

                  return (
                    <tr 
                      key={evidence.id} 
                      style={{ 
                        borderBottom: `1px solid ${t.border}`,
                        background: freshnessStatus === 'expired' ? (darkMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.03)') : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onClick={() => setSelectedEvidence(evidence)}
                    >
                      {/* Freshness Indicator (Traffic Light) */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: freshnessColor,
                            boxShadow: `0 0 8px ${freshnessColor}60`
                          }} />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: freshnessColor }}>
                              {freshnessStatus === 'fresh' ? l.fresh : freshnessStatus === 'expiring' ? l.expiringSoon : l.expired}
                            </div>
                            <div style={{ fontSize: '10px', color: t.textDim }}>
                              {daysRemaining > 0 ? `${l.validFor} ${daysRemaining} ${l.days}` : l.needsUpdate}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Evidence Name */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: evidence.type === 'automatic' ? '#3b82f620' : '#f59e0b20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                          }}>
                            {evidence.sourceIcon}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{evidence.name}</div>
                            <div style={{ fontSize: '11px', color: t.textDim }}>
                              {evidence.type === 'automatic' ? l.automatic : l.manual}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Control */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 10px',
                          background: '#8b5cf620',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#8b5cf6'
                        }}>
                          {evidence.control}
                        </span>
                      </td>
                      
                      {/* Source */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '13px', color: t.text }}>{evidence.source}</span>
                      </td>
                      
                      {/* Last Updated */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '13px', color: t.textMuted }}>{daysAgo} {l.daysAgo}</span>
                      </td>
                      
                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {freshnessStatus === 'expired' && (
                            <button style={{
                              padding: '6px 12px',
                              background: '#ef444420',
                              border: '1px solid #ef444440',
                              borderRadius: '6px',
                              color: '#ef4444',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <RefreshCw size={12} />
                              {l.updateNow}
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedEvidence(evidence); }}
                            style={{
                              padding: '6px 12px',
                              background: t.inputBg,
                              border: `1px solid ${t.border}`,
                              borderRadius: '6px',
                              color: t.textMuted,
                              fontSize: '11px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={12} />
                            {l.view}
                          </button>
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

      {/* Bulk Upload Tab with AI Classification */}
      {activeTab === 'upload' && (
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Sparkles size={20} color="#8b5cf6" />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: t.text }}>{l.bulkUploadTitle}</h3>
            </div>
            <p style={{ fontSize: '14px', color: t.textDim, marginBottom: '24px' }}>{l.bulkUploadDesc}</p>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('fileInput').click()}
              style={{
                border: `2px dashed ${dragOver ? '#10b981' : t.border}`,
                borderRadius: '16px',
                padding: '60px 40px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? (darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)') : 'transparent',
                transition: 'all 0.3s ease',
                marginBottom: '24px'
              }}
            >
              <input
                id="fileInput"
                type="file"
                multiple
                onChange={handleFileDrop}
                style={{ display: 'none' }}
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.json,.csv,.xlsx"
              />
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: dragOver ? '#10b98120' : t.inputBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <Upload size={32} color={dragOver ? '#10b981' : t.textDim} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: t.text, marginBottom: '8px' }}>{l.dragDropFiles}</h4>
              <p style={{ fontSize: '14px', color: t.textDim, marginBottom: '8px' }}>{l.orClickToBrowse}</p>
              <p style={{ fontSize: '12px', color: t.textMuted }}>{l.supportedFormats}</p>
            </div>

            {/* Uploaded Files with AI Suggestions */}
            {uploadedFiles.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>
                    {uploadedFiles.length} {l.filesReady}
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setUploadedFiles([])}
                      style={{
                        padding: '8px 16px',
                        background: t.inputBg,
                        border: `1px solid ${t.border}`,
                        borderRadius: '8px',
                        color: t.textMuted,
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      {l.clearAll}
                    </button>
                    <button
                      style={{
                        padding: '8px 20px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Upload size={14} />
                      {l.uploadAll}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uploadedFiles.map((fileData) => (
                    <div
                      key={fileData.id}
                      style={{
                        padding: '16px',
                        background: t.inputBg,
                        borderRadius: '12px',
                        border: `1px solid ${t.border}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FileText size={22} color={t.textDim} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, marginBottom: '4px' }}>{fileData.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '12px', color: t.textDim }}>{formatFileSize(fileData.size)}</span>
                              {fileData.status === 'analyzing' && (
                                <span style={{ fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                  {l.analyzing}...
                                </span>
                              )}
                              {fileData.status === 'analyzed' && (
                                <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} />
                                  {l.analyzed}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* AI Suggestion Box */}
                        {fileData.suggestion && (
                          <div style={{
                            padding: '12px 16px',
                            background: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                            borderRadius: '10px',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            marginLeft: '16px',
                            minWidth: '280px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <Sparkles size={14} color="#8b5cf6" />
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase' }}>{l.aiSuggestion}</span>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{fileData.suggestion.control}</div>
                              <div style={{ fontSize: '12px', color: t.textDim }}>{fileData.suggestion.name}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ 
                                  width: '40px', 
                                  height: '4px', 
                                  background: t.border, 
                                  borderRadius: '2px', 
                                  overflow: 'hidden' 
                                }}>
                                  <div style={{ 
                                    width: `${fileData.suggestion.confidence}%`, 
                                    height: '100%', 
                                    background: '#8b5cf6',
                                    borderRadius: '2px'
                                  }} />
                                </div>
                                <span style={{ fontSize: '11px', color: '#8b5cf6' }}>{fileData.suggestion.confidence}%</span>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button style={{
                                  padding: '5px 10px',
                                  background: '#10b981',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}>
                                  {l.acceptSuggestion}
                                </button>
                                <button style={{
                                  padding: '5px 10px',
                                  background: 'transparent',
                                  border: `1px solid ${t.border}`,
                                  borderRadius: '6px',
                                  color: t.textMuted,
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  cursor: 'pointer'
                                }}>
                                  {l.rejectSuggestion}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== fileData.id))}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px',
                            cursor: 'pointer',
                            color: t.textDim,
                            marginLeft: '8px'
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evidence Requests Tab (Placeholder Management) */}
      {activeTab === 'requests' && (
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text, marginBottom: '4px' }}>{l.evidenceRequests}</h3>
              <p style={{ fontSize: '13px', color: t.textDim }}>
                {language === 'es' ? 'Asigna tareas de carga a responsables de área' : 
                 language === 'pt' ? 'Atribua tarefas de upload a responsáveis de área' :
                 'Assign upload tasks to area managers'}
              </p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              {l.requestEvidence}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Evidence</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.controlLink}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.assignTo}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.dueDate}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.status}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.magicLink}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.actions}</th>
                </tr>
              </thead>
              <tbody>
                {evidenceRequests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{request.title}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: '#8b5cf620',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#8b5cf6'
                      }}>
                        {request.control}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: t.text }}>{request.assignee}</div>
                        <div style={{ fontSize: '11px', color: t.textDim }}>{request.department}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        fontSize: '13px', 
                        color: request.status === 'overdue' ? '#ef4444' : t.textMuted 
                      }}>
                        {request.dueDate}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: request.status === 'submitted' ? '#10b98120' : request.status === 'overdue' ? '#ef444420' : '#f59e0b20',
                        color: request.status === 'submitted' ? '#10b981' : request.status === 'overdue' ? '#ef4444' : '#f59e0b'
                      }}>
                        {l[request.status]}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{
                          padding: '6px 10px',
                          background: t.inputBg,
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: t.textMuted,
                          fontFamily: 'monospace',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {request.magicLink}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(request.magicLink)}
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: `1px solid ${t.border}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: t.textDim
                          }}
                          title={l.copyLink}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {request.status === 'submitted' ? (
                        <button style={{
                          padding: '6px 12px',
                          background: '#10b98120',
                          border: '1px solid #10b98140',
                          borderRadius: '6px',
                          color: '#10b981',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Eye size={12} />
                          {l.viewSubmission}
                        </button>
                      ) : (
                        <button style={{
                          padding: '6px 12px',
                          background: request.status === 'overdue' ? '#ef444420' : t.inputBg,
                          border: `1px solid ${request.status === 'overdue' ? '#ef444440' : t.border}`,
                          borderRadius: '6px',
                          color: request.status === 'overdue' ? '#ef4444' : t.textMuted,
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Send size={12} />
                          {l.resendReminder}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Connectors Tab */}
      {activeTab === 'connectors' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {connectors.map((connector) => (
            <div key={connector.id} style={{ 
              background: t.cardBg, 
              backdropFilter: 'blur(10px)', 
              borderRadius: '16px', 
              padding: '20px', 
              border: connector.status === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : `1px solid ${t.border}` 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: t.inputBg, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '24px' 
                }}>
                  {connector.icon}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  background: connector.status === 'connected' ? 'rgba(16, 185, 129, 0.15)' : connector.status === 'error' ? 'rgba(239, 68, 68, 0.15)' : t.inputBg, 
                  color: connector.status === 'connected' ? '#10b981' : connector.status === 'error' ? '#ef4444' : t.textDim 
                }}>
                  {connector.status === 'connected' && <CheckCircle2 size={12} />}
                  {connector.status === 'error' && <XCircle size={12} />}
                  {connector.status === 'connected' ? l.connected : connector.status === 'error' ? l.error : l.pending}
                </div>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: t.text }}>{connector.name}</h4>
              <div style={{ fontSize: '12px', color: connector.status === 'error' ? '#ef4444' : t.textDim, marginBottom: '16px' }}>
                {l.lastSync}: {connector.lastSync}
              </div>
              {connector.status === 'connected' && (
                <div style={{ 
                  padding: '10px 14px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}>
                  <span style={{ fontSize: '13px', color: t.text }}>{connector.evidences} {l.evidences}</span>
                  <Eye size={14} color="#10b981" />
                </div>
              )}
              {connector.status === 'error' && (
                <button style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: 'rgba(239, 68, 68, 0.15)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: '8px', 
                  color: '#ef4444', 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  fontWeight: 600 
                }}>
                  {l.reconnect}
                </button>
              )}
              {connector.status === 'pending' && (
                <button style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: t.inputBg, 
                  border: `1px solid ${t.border}`, 
                  borderRadius: '8px', 
                  color: t.text, 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  fontWeight: 500 
                }}>
                  {l.configure}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Evidence Detail Modal with API Deep-Linking */}
      {selectedEvidence && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(8px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 200 
        }}>
          <div style={{ 
            width: '700px', 
            maxHeight: '85vh', 
            background: darkMode ? '#1e293b' : '#ffffff', 
            borderRadius: '20px', 
            border: `1px solid ${t.border}`, 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: selectedEvidence.type === 'automatic' ? '#3b82f620' : '#f59e0b20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {selectedEvidence.sourceIcon}
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: t.text }}>{selectedEvidence.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <span style={{
                      padding: '3px 8px',
                      background: '#8b5cf620',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#8b5cf6'
                    }}>
                      {selectedEvidence.control}
                    </span>
                    <span style={{
                      padding: '3px 8px',
                      background: getFreshnessColor(getFreshnessStatus(selectedEvidence)) + '20',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: getFreshnessColor(getFreshnessStatus(selectedEvidence))
                    }}>
                      {getFreshnessStatus(selectedEvidence) === 'fresh' ? l.fresh : getFreshnessStatus(selectedEvidence) === 'expiring' ? l.expiringSoon : l.expired}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEvidence(null)} 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px', 
                  background: t.inputBg, 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: t.textDim 
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Source Info */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{l.sourceDetails}</h4>
                <div style={{ 
                  padding: '16px', 
                  background: t.inputBg, 
                  borderRadius: '12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '4px' }}>{l.collectedFrom}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{selectedEvidence.source}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '4px' }}>{l.type}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>
                      {selectedEvidence.type === 'automatic' ? l.automatic : l.manual}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '4px' }}>{l.lastUpdated}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>
                      {selectedEvidence.lastUpdated.toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '4px' }}>{l.validFor}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>
                      {selectedEvidence.validityDays} {l.days}
                    </div>
                  </div>
                </div>
              </div>

              {/* API Response (Deep-Linking) - Only for automatic evidences */}
              {selectedEvidence.type === 'automatic' && selectedEvidence.apiData && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px' }}>{l.technicalDetails}</h4>
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedEvidence.apiData.response, null, 2))}
                      style={{
                        padding: '6px 12px',
                        background: t.inputBg,
                        border: `1px solid ${t.border}`,
                        borderRadius: '6px',
                        color: t.textMuted,
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Copy size={12} />
                      {l.copyJson}
                    </button>
                  </div>
                  
                  {/* Endpoint Info */}
                  <div style={{ 
                    padding: '12px 16px', 
                    background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)', 
                    borderRadius: '8px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <ExternalLink size={16} color="#3b82f6" />
                    <div>
                      <div style={{ fontSize: '11px', color: t.textDim }}>{l.endpoint}</div>
                      <code style={{ fontSize: '13px', color: '#3b82f6', fontFamily: 'monospace' }}>
                        {selectedEvidence.apiData.endpoint}
                      </code>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div style={{ 
                    padding: '10px 16px', 
                    background: t.inputBg, 
                    borderRadius: '8px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <Clock size={14} color={t.textDim} />
                    <span style={{ fontSize: '12px', color: t.textMuted }}>
                      {l.timestamp}: {selectedEvidence.apiData.timestamp}
                    </span>
                  </div>

                  {/* JSON Response */}
                  <div style={{ 
                    background: darkMode ? '#0f172a' : '#1e293b', 
                    borderRadius: '12px',
                    padding: '16px',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    <pre style={{ 
                      margin: 0, 
                      fontSize: '12px', 
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      color: '#e2e8f0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {JSON.stringify(selectedEvidence.apiData.response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedEvidence(null)}
                style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
              >
                {language === 'es' ? 'Cerrar' : language === 'pt' ? 'Fechar' : 'Close'}
              </button>
              <button style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} />
                {l.download}
              </button>
              {getFreshnessStatus(selectedEvidence) === 'expired' && (
                <button style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={14} />
                  {l.updateNow}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Evidence Modal */}
      {showRequestModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(8px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 200 
        }}>
          <div style={{ 
            width: '500px', 
            background: darkMode ? '#1e293b' : '#ffffff', 
            borderRadius: '20px', 
            border: `1px solid ${t.border}`, 
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Send size={20} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{l.requestEvidence}</h2>
                  <p style={{ fontSize: '12px', color: t.textDim }}>
                    {language === 'es' ? 'Crear solicitud con enlace mágico' : 
                     language === 'pt' ? 'Criar solicitação com link mágico' :
                     'Create request with magic link'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowRequestModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', background: t.inputBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '8px' }}>
                  {language === 'es' ? 'Título de la Evidencia' : language === 'pt' ? 'Título da Evidência' : 'Evidence Title'}
                </label>
                <input
                  placeholder={language === 'es' ? 'Ej: Registros de capacitación Q4' : 'E.g.: Q4 Training Records'}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: t.inputBg,
                    border: `1px solid ${t.border}`,
                    borderRadius: '10px',
                    color: t.text,
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '8px' }}>{l.controlLink}</label>
                <select style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: t.inputBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: '10px',
                  color: t.text,
                  fontSize: '14px',
                  outline: 'none'
                }}>
                  <option>A.5.1 - Policies for information security</option>
                  <option>A.6.1 - Screening</option>
                  <option>A.6.2 - Terms and conditions</option>
                  <option>A.6.3 - Awareness training</option>
                  <option>A.7.2 - Physical entry</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '8px' }}>{l.assignTo}</label>
                  <input
                    placeholder="email@company.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: t.inputBg,
                      border: `1px solid ${t.border}`,
                      borderRadius: '10px',
                      color: t.text,
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '8px' }}>{l.dueDate}</label>
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: t.inputBg,
                      border: `1px solid ${t.border}`,
                      borderRadius: '10px',
                      color: t.text,
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ 
                padding: '14px 16px', 
                background: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)', 
                borderRadius: '10px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Sparkles size={14} color="#8b5cf6" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>{l.magicLink}</span>
                </div>
                <p style={{ fontSize: '12px', color: t.textDim }}>
                  {language === 'es' ? 'Se generará un enlace único que el destinatario puede usar para subir la evidencia sin necesidad de cuenta.' :
                   language === 'pt' ? 'Será gerado um link único que o destinatário pode usar para enviar a evidência sem precisar de conta.' :
                   'A unique link will be generated that the recipient can use to upload evidence without needing an account.'}
                </p>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowRequestModal(false)}
                style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
              >
                {language === 'es' ? 'Cancelar' : language === 'pt' ? 'Cancelar' : 'Cancel'}
              </button>
              <button style={{ 
                padding: '10px 24px', 
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', 
                border: 'none', 
                borderRadius: '10px', 
                color: 'white', 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Send size={14} />
                {l.sendRequest}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Documents Screen
function DocumentsScreen() {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const tr = useTranslation();
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'faq'

  const documents = [
    { id: 1, name: 'Information Security Policy', status: 'approved', version: '2.1', updated: 'Jan 15', signatures: '45/45' },
    { id: 2, name: 'Access Control Policy', status: 'review', version: '1.3', updated: 'Feb 02', signatures: '12/45' },
    { id: 3, name: 'Incident Response Procedure', status: 'approved', version: '1.8', updated: 'Dec 20', signatures: '45/45' },
    { id: 4, name: 'Business Continuity Plan', status: 'draft', version: '0.5', updated: 'Feb 28', signatures: '0/45' }
  ];

  const suggestedQuestions = {
    en: [
      "What are the password requirements in our security policy?",
      "Who needs to approve access control changes?",
      "What's the incident response escalation process?",
      "When was the BCP last updated?"
    ],
    es: [
      "¿Cuáles son los requisitos de contraseña en nuestra política?",
      "¿Quién debe aprobar los cambios de control de acceso?",
      "¿Cuál es el proceso de escalación de incidentes?",
      "¿Cuándo se actualizó el BCP por última vez?"
    ],
    pt: [
      "Quais são os requisitos de senha na nossa política?",
      "Quem precisa aprovar mudanças de controle de acesso?",
      "Qual é o processo de escalação de incidentes?",
      "Quando o BCP foi atualizado pela última vez?"
    ]
  };

  const faqData = {
    en: [
      { 
        id: 1, 
        question: "What are the minimum password requirements?",
        answer: "According to the Information Security Policy (v2.1), passwords must be at least 12 characters long, contain uppercase and lowercase letters, numbers, and special characters. Passwords must be changed every 90 days and cannot repeat the last 12 passwords used.",
        source: "Information Security Policy",
        section: "Section 4.2.1"
      },
      { 
        id: 2, 
        question: "How do I request access to a new system?",
        answer: "Access requests must be submitted through the IT Service Portal. Your manager must approve the request, followed by the system owner. For privileged access, additional approval from the Security team is required. Standard processing time is 3-5 business days.",
        source: "Access Control Policy",
        section: "Section 3.1"
      },
      { 
        id: 3, 
        question: "What should I do if I suspect a security incident?",
        answer: "Immediately report the incident to the Security Operations Center (SOC) via email at security@company.com or by calling the 24/7 hotline. Do not attempt to investigate on your own. Preserve any evidence and document what you observed, including timestamps.",
        source: "Incident Response Procedure",
        section: "Section 2.1"
      },
      { 
        id: 4, 
        question: "Who is responsible for document approvals?",
        answer: "Document approvals follow a tiered structure: Draft → Review by Department Head → Legal/Compliance Review (if applicable) → Final Approval by CISO or designated authority. All policies require annual review and re-approval.",
        source: "Document Control Policy",
        section: "Section 5.3"
      },
      { 
        id: 5, 
        question: "What is the data classification scheme?",
        answer: "Data is classified into four levels: Public (no restrictions), Internal (business use only), Confidential (need-to-know basis), and Restricted (highest sensitivity, requires encryption at rest and in transit). Classification labels must be applied to all documents.",
        source: "Information Security Policy",
        section: "Section 6.1"
      },
      { 
        id: 6, 
        question: "How often are backups performed?",
        answer: "Critical systems are backed up daily with 30-day retention. Full backups occur weekly, with incremental backups daily. Backup restoration tests are performed quarterly. Off-site copies are maintained in a geographically separate location.",
        source: "Business Continuity Plan",
        section: "Section 4.5"
      }
    ],
    es: [
      { 
        id: 1, 
        question: "¿Cuáles son los requisitos mínimos de contraseña?",
        answer: "Según la Política de Seguridad de la Información (v2.1), las contraseñas deben tener al menos 12 caracteres, contener letras mayúsculas y minúsculas, números y caracteres especiales. Las contraseñas deben cambiarse cada 90 días y no pueden repetir las últimas 12 contraseñas utilizadas.",
        source: "Política de Seguridad de la Información",
        section: "Sección 4.2.1"
      },
      { 
        id: 2, 
        question: "¿Cómo solicito acceso a un nuevo sistema?",
        answer: "Las solicitudes de acceso deben enviarse a través del Portal de Servicios de TI. Su gerente debe aprobar la solicitud, seguido por el propietario del sistema. Para acceso privilegiado, se requiere aprobación adicional del equipo de Seguridad. El tiempo de procesamiento estándar es de 3-5 días hábiles.",
        source: "Política de Control de Acceso",
        section: "Sección 3.1"
      },
      { 
        id: 3, 
        question: "¿Qué debo hacer si sospecho un incidente de seguridad?",
        answer: "Informe inmediatamente el incidente al Centro de Operaciones de Seguridad (SOC) por correo electrónico a security@company.com o llamando a la línea directa 24/7. No intente investigar por su cuenta. Preserve cualquier evidencia y documente lo que observó, incluyendo marcas de tiempo.",
        source: "Procedimiento de Respuesta a Incidentes",
        section: "Sección 2.1"
      },
      { 
        id: 4, 
        question: "¿Quién es responsable de las aprobaciones de documentos?",
        answer: "Las aprobaciones de documentos siguen una estructura escalonada: Borrador → Revisión por Jefe de Departamento → Revisión Legal/Cumplimiento (si aplica) → Aprobación Final por CISO o autoridad designada. Todas las políticas requieren revisión y re-aprobación anual.",
        source: "Política de Control de Documentos",
        section: "Sección 5.3"
      },
      { 
        id: 5, 
        question: "¿Cuál es el esquema de clasificación de datos?",
        answer: "Los datos se clasifican en cuatro niveles: Público (sin restricciones), Interno (solo uso comercial), Confidencial (base de necesidad de conocer) y Restringido (máxima sensibilidad, requiere cifrado en reposo y en tránsito). Las etiquetas de clasificación deben aplicarse a todos los documentos.",
        source: "Política de Seguridad de la Información",
        section: "Sección 6.1"
      },
      { 
        id: 6, 
        question: "¿Con qué frecuencia se realizan las copias de seguridad?",
        answer: "Los sistemas críticos se respaldan diariamente con retención de 30 días. Las copias de seguridad completas ocurren semanalmente, con copias incrementales diarias. Las pruebas de restauración se realizan trimestralmente. Las copias externas se mantienen en una ubicación geográficamente separada.",
        source: "Plan de Continuidad del Negocio",
        section: "Sección 4.5"
      }
    ],
    pt: [
      { 
        id: 1, 
        question: "Quais são os requisitos mínimos de senha?",
        answer: "De acordo com a Política de Segurança da Informação (v2.1), as senhas devem ter pelo menos 12 caracteres, conter letras maiúsculas e minúsculas, números e caracteres especiais. As senhas devem ser alteradas a cada 90 dias e não podem repetir as últimas 12 senhas utilizadas.",
        source: "Política de Segurança da Informação",
        section: "Seção 4.2.1"
      },
      { 
        id: 2, 
        question: "Como solicito acesso a um novo sistema?",
        answer: "As solicitações de acesso devem ser enviadas através do Portal de Serviços de TI. Seu gerente deve aprovar a solicitação, seguido pelo proprietário do sistema. Para acesso privilegiado, é necessária aprovação adicional da equipe de Segurança. O tempo de processamento padrão é de 3-5 dias úteis.",
        source: "Política de Controle de Acesso",
        section: "Seção 3.1"
      },
      { 
        id: 3, 
        question: "O que devo fazer se suspeitar de um incidente de segurança?",
        answer: "Relate imediatamente o incidente ao Centro de Operações de Segurança (SOC) por e-mail para security@company.com ou ligando para a linha direta 24/7. Não tente investigar por conta própria. Preserve qualquer evidência e documente o que observou, incluindo timestamps.",
        source: "Procedimento de Resposta a Incidentes",
        section: "Seção 2.1"
      },
      { 
        id: 4, 
        question: "Quem é responsável pelas aprovações de documentos?",
        answer: "As aprovações de documentos seguem uma estrutura em camadas: Rascunho → Revisão pelo Chefe de Departamento → Revisão Jurídica/Conformidade (se aplicável) → Aprovação Final pelo CISO ou autoridade designada. Todas as políticas requerem revisão e re-aprovação anual.",
        source: "Política de Controle de Documentos",
        section: "Seção 5.3"
      },
      { 
        id: 5, 
        question: "Qual é o esquema de classificação de dados?",
        answer: "Os dados são classificados em quatro níveis: Público (sem restrições), Interno (apenas uso comercial), Confidencial (base de necessidade de conhecer) e Restrito (máxima sensibilidade, requer criptografia em repouso e em trânsito). Rótulos de classificação devem ser aplicados a todos os documentos.",
        source: "Política de Segurança da Informação",
        section: "Seção 6.1"
      },
      { 
        id: 6, 
        question: "Com que frequência os backups são realizados?",
        answer: "Sistemas críticos são copiados diariamente com retenção de 30 dias. Backups completos ocorrem semanalmente, com backups incrementais diários. Testes de restauração são realizados trimestralmente. Cópias externas são mantidas em local geograficamente separado.",
        source: "Plano de Continuidade de Negócios",
        section: "Seção 4.5"
      }
    ]
  };

  const chatLabels = {
    en: { title: 'Chat with Documents', subtitle: 'Ask questions about your compliance documents', placeholder: 'Ask about your documents...', searching: 'Searching documents...', sources: 'Sources', askAnything: 'Ask anything about your documents', faqTitle: 'Frequently Asked Questions', faqSubtitle: 'Quick answers from your documents', chat: 'Chat', faq: 'FAQ' },
    es: { title: 'Chat con Documentos', subtitle: 'Haz preguntas sobre tus documentos de cumplimiento', placeholder: 'Pregunta sobre tus documentos...', searching: 'Buscando en documentos...', sources: 'Fuentes', askAnything: 'Pregunta sobre tus documentos', faqTitle: 'Preguntas Frecuentes', faqSubtitle: 'Respuestas rápidas de tus documentos', chat: 'Chat', faq: 'FAQ' },
    pt: { title: 'Chat com Documentos', subtitle: 'Faça perguntas sobre seus documentos de conformidade', placeholder: 'Pergunte sobre seus documentos...', searching: 'Pesquisando documentos...', sources: 'Fontes', askAnything: 'Pergunte sobre seus documentos', faqTitle: 'Perguntas Frequentes', faqSubtitle: 'Respostas rápidas dos seus documentos', chat: 'Chat', faq: 'FAQ' }
  };

  const labels = chatLabels[language] || chatLabels.en;
  const questions = suggestedQuestions[language] || suggestedQuestions.en;
  const faqs = faqData[language] || faqData.en;

  const handleSendMessage = (message) => {
    if (!message.trim()) return;
    
    const userMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setChatQuery('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: language === 'es' 
          ? `Basándome en tu Política de Seguridad de la Información (v2.1), encontré información relevante sobre tu consulta. El documento especifica los requisitos y procedimientos relacionados con "${message.substring(0, 50)}..."`
          : language === 'pt'
          ? `Com base na sua Política de Segurança da Informação (v2.1), encontrei informações relevantes sobre sua consulta. O documento especifica os requisitos e procedimentos relacionados a "${message.substring(0, 50)}..."`
          : `Based on your Information Security Policy (v2.1), I found relevant information about your query. The document specifies the requirements and procedures related to "${message.substring(0, 50)}..."`,
        sources: ['Information Security Policy', 'Access Control Policy']
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getStatusColor = (s) => s === 'approved' ? '#10b981' : s === 'review' ? '#f59e0b' : '#64748b';

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div><h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{tr('documentManager')}</h1><p style={{ color: t.textDim, fontSize: '15px' }}>{tr('policiesProcedures')}</p></div>
        <button style={{ padding: '10px 20px', background: '#10b981', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><Plus size={16} />{tr('createDocument')}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Documents List */}
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 0.8fr 1fr 1fr', padding: '14px 24px', background: t.hoverBg, borderBottom: `1px solid ${t.border}`, fontSize: '11px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>{tr('document')}</span><span>{tr('status')}</span><span>{tr('version')}</span><span>{tr('updated')}</span><span>{tr('signatures')}</span>
          </div>
          {documents.map((doc) => (
            <div key={doc.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 0.8fr 1fr 1fr', padding: '16px 24px', borderBottom: `1px solid ${t.border}`, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} color="#3b82f6" /></div>
                <span style={{ fontWeight: 500, fontSize: '14px' }}>{doc.name}</span>
              </div>
              <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: `${getStatusColor(doc.status)}22`, color: getStatusColor(doc.status), textTransform: 'capitalize', width: 'fit-content' }}>{doc.status}</span>
              <span style={{ color: t.textMuted, fontSize: '13px' }}>v{doc.version}</span>
              <span style={{ color: t.textDim, fontSize: '13px' }}>{doc.updated}</span>
              <span style={{ fontSize: '13px' }}>{doc.signatures}</span>
            </div>
          ))}
        </div>

        {/* Document Chat & FAQ Panel */}
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', height: '580px', overflow: 'hidden' }}>
          
          {/* Tab Header */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '16px',
                background: activeTab === 'chat' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'chat' ? '2px solid #8b5cf6' : '2px solid transparent',
                color: activeTab === 'chat' ? '#8b5cf6' : t.textDim,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              <MessageSquare size={16} />
              {labels.chat}
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              style={{
                flex: 1,
                padding: '16px',
                background: activeTab === 'faq' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'faq' ? '2px solid #10b981' : '2px solid transparent',
                color: activeTab === 'faq' ? '#10b981' : t.textDim,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              <HelpCircle size={16} />
              {labels.faq}
            </button>
          </div>

          {activeTab === 'chat' ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}>
                    <MessageSquare size={20} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>{labels.title}</h3>
                    <p style={{ fontSize: '11px', color: t.textDim }}>{labels.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '16px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                      <Search size={24} color="#8b5cf6" />
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: t.text }}>{labels.askAnything}</h4>
                    <p style={{ fontSize: '11px', color: t.textDim, marginBottom: '16px', lineHeight: '1.5' }}>
                      {language === 'es' ? 'Usa lenguaje natural para buscar' : language === 'pt' ? 'Use linguagem natural para pesquisar' : 'Use natural language to search'}
                    </p>
                    
                    {/* Suggested Questions */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {questions.slice(0, 3).map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(question)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: t.inputBg,
                            border: `1px solid ${t.border}`,
                            borderRadius: '8px',
                            color: t.text,
                            fontSize: '11px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Sparkles size={12} color="#8b5cf6" />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{question}</span>
                          <ChevronRight size={12} color={t.textDim} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '85%',
                          padding: '10px 14px',
                          borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          background: msg.role === 'user' 
                            ? 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' 
                            : t.inputBg,
                          color: msg.role === 'user' ? 'white' : t.text,
                          fontSize: '12px',
                          lineHeight: '1.5'
                        }}>
                          {msg.content}
                        </div>
                        {msg.sources && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '9px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{labels.sources}:</span>
                            {msg.sources.map((source, sIdx) => (
                              <span key={sIdx} style={{
                                fontSize: '9px',
                                padding: '2px 6px',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#3b82f6',
                                borderRadius: '4px',
                                fontWeight: 500
                              }}>{source}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: t.inputBg, borderRadius: '12px 12px 12px 4px', maxWidth: '85%' }}>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1s infinite' }} />
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1s infinite 0.2s' }} />
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1s infinite 0.4s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: t.textDim }}>{labels.searching}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Chat Input */}
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', gap: '8px', background: t.inputBg, borderRadius: '10px', padding: '6px 10px', border: `1px solid ${t.border}` }}>
                  <input
                    type="text"
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(chatQuery)}
                    placeholder={labels.placeholder}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontSize: '13px' }}
                  />
                  <button 
                    onClick={() => handleSendMessage(chatQuery)}
                    disabled={!chatQuery.trim()}
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: chatQuery.trim() ? 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' : t.hoverBg, 
                      border: 'none', 
                      cursor: chatQuery.trim() ? 'pointer' : 'not-allowed', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Send size={14} color={chatQuery.trim() ? 'white' : t.textDim} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* FAQ Header */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                    <HelpCircle size={20} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>{labels.faqTitle}</h3>
                    <p style={{ fontSize: '11px', color: t.textDim }}>{labels.faqSubtitle}</p>
                  </div>
                </div>
              </div>

              {/* FAQ List */}
              <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    style={{
                      background: expandedFaq === faq.id ? (darkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)') : t.inputBg,
                      border: `1px solid ${expandedFaq === faq.id ? 'rgba(16, 185, 129, 0.3)' : t.border}`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: expandedFaq === faq.id ? 'rgba(16, 185, 129, 0.2)' : t.hoverBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}>
                        <ChevronDown 
                          size={14} 
                          color={expandedFaq === faq.id ? '#10b981' : t.textDim}
                          style={{ 
                            transform: expandedFaq === faq.id ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s ease'
                          }}
                        />
                      </div>
                      <span style={{ 
                        flex: 1, 
                        fontSize: '13px', 
                        fontWeight: 500, 
                        color: expandedFaq === faq.id ? '#10b981' : t.text,
                        lineHeight: '1.4'
                      }}>
                        {faq.question}
                      </span>
                    </button>
                    
                    {expandedFaq === faq.id && (
                      <div style={{ 
                        padding: '0 16px 16px 52px',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        <p style={{ 
                          fontSize: '12px', 
                          color: t.textMuted, 
                          lineHeight: '1.6',
                          marginBottom: '12px'
                        }}>
                          {faq.answer}
                        </p>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            fontSize: '10px',
                            padding: '4px 8px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                            borderRadius: '4px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <FileText size={10} />
                            {faq.source}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            padding: '4px 8px',
                            background: t.hoverBg,
                            color: t.textDim,
                            borderRadius: '4px'
                          }}>
                            {faq.section}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* FAQ Footer */}
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: t.textDim }}>
                  {language === 'es' ? '¿No encuentras lo que buscas?' : language === 'pt' ? 'Não encontrou o que procura?' : "Can't find what you're looking for?"}
                </span>
                <button
                  onClick={() => setActiveTab('chat')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#8b5cf6',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {language === 'es' ? 'Pregunta a Dani' : language === 'pt' ? 'Pergunte ao Dani' : 'Ask Dani'}
                  <ArrowRight size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

// Audit Room Screen
function AuditRoomScreen() {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditorMode, setAuditorMode] = useState(true);
  const [activeTab, setActiveTab] = useState('folders'); // folders, trail, export
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const labels = {
    en: {
      title: 'Audit Room',
      subtitle: 'Organized evidence for ISO 27001 certification',
      readOnly: 'Auditor View',
      fullAccess: 'Full Access',
      downloadAuditPack: 'Download Audit Pack',
      semanticSearch: 'Search across all evidence and documentation...',
      aiSearch: 'AI Search',
      items: 'items',
      complete: 'Complete',
      partial: 'Partial',
      // Auditor's Binder
      auditorsBinder: "Auditor's Binder",
      exportTitle: 'Export Audit Package',
      exportDescription: 'Generate a complete audit package organized by ISO 27001 clauses',
      exportFormat: 'Export Format',
      pdfFormat: 'PDF Document',
      pdfDesc: 'Single document with all annexes embedded',
      zipFormat: 'ZIP Archive',
      zipDesc: 'Folder structure matching ISO clauses',
      selectClauses: 'Select Clauses to Include',
      allClauses: 'All Clauses',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      includeAnnexes: 'Include Evidence Annexes',
      includeTrail: 'Include Audit Trail Log',
      generatePackage: 'Generate Package',
      generating: 'Generating...',
      estimatedSize: 'Estimated Size',
      evidenceCount: 'Evidence Count',
      exportReady: 'Export Ready!',
      downloadNow: 'Download Now',
      // Audit Trail
      auditTrail: 'Platform Audit Trail',
      auditTrailDesc: 'Complete log of all platform modifications',
      integrityLog: 'Integrity Log',
      timestamp: 'Timestamp',
      user: 'User',
      action: 'Action',
      resource: 'Resource',
      ipAddress: 'IP Address',
      details: 'Details',
      filterByAction: 'Filter by action',
      allActions: 'All Actions',
      created: 'Created',
      modified: 'Modified',
      deleted: 'Deleted',
      approved: 'Approved',
      exported: 'Exported',
      viewed: 'Viewed',
      exportTrail: 'Export Trail',
      last24h: 'Last 24 hours',
      last7d: 'Last 7 days',
      last30d: 'Last 30 days',
      allTime: 'All time',
      // Auditor Mode
      auditorModeLabel: 'Auditor Mode',
      auditorModeOn: 'Read-only view showing only approved evidence',
      auditorModeOff: 'Full access to management features',
      switchToAuditor: 'Switch to Auditor View',
      switchToFull: 'Switch to Full Access',
      approvedOnly: 'Showing approved evidence only',
      folders: 'Evidence Folders',
      auditLog: 'Audit Log',
      export: 'Export'
    },
    es: {
      title: 'Sala de Auditoría',
      subtitle: 'Evidencias organizadas para certificación ISO 27001',
      readOnly: 'Vista Auditor',
      fullAccess: 'Acceso Completo',
      downloadAuditPack: 'Descargar Paquete',
      semanticSearch: 'Buscar en todas las evidencias y documentación...',
      aiSearch: 'Buscar con IA',
      items: 'elementos',
      complete: 'Completo',
      partial: 'Parcial',
      // Auditor's Binder
      auditorsBinder: 'Carpeta del Auditor',
      exportTitle: 'Exportar Paquete de Auditoría',
      exportDescription: 'Genera un paquete completo organizado por cláusulas ISO 27001',
      exportFormat: 'Formato de Exportación',
      pdfFormat: 'Documento PDF',
      pdfDesc: 'Documento único con todos los anexos embebidos',
      zipFormat: 'Archivo ZIP',
      zipDesc: 'Estructura de carpetas según cláusulas ISO',
      selectClauses: 'Seleccionar Cláusulas a Incluir',
      allClauses: 'Todas las Cláusulas',
      selectAll: 'Seleccionar Todo',
      deselectAll: 'Deseleccionar Todo',
      includeAnnexes: 'Incluir Anexos de Evidencia',
      includeTrail: 'Incluir Log de Auditoría',
      generatePackage: 'Generar Paquete',
      generating: 'Generando...',
      estimatedSize: 'Tamaño Estimado',
      evidenceCount: 'Cantidad de Evidencias',
      exportReady: '¡Exportación Lista!',
      downloadNow: 'Descargar Ahora',
      // Audit Trail
      auditTrail: 'Trail de Auditoría de Plataforma',
      auditTrailDesc: 'Log completo de todas las modificaciones de la plataforma',
      integrityLog: 'Log de Integridad',
      timestamp: 'Fecha/Hora',
      user: 'Usuario',
      action: 'Acción',
      resource: 'Recurso',
      ipAddress: 'Dirección IP',
      details: 'Detalles',
      filterByAction: 'Filtrar por acción',
      allActions: 'Todas las Acciones',
      created: 'Creado',
      modified: 'Modificado',
      deleted: 'Eliminado',
      approved: 'Aprobado',
      exported: 'Exportado',
      viewed: 'Visualizado',
      exportTrail: 'Exportar Trail',
      last24h: 'Últimas 24 horas',
      last7d: 'Últimos 7 días',
      last30d: 'Últimos 30 días',
      allTime: 'Todo el tiempo',
      // Auditor Mode
      auditorModeLabel: 'Modo Auditor',
      auditorModeOn: 'Vista de solo lectura mostrando solo evidencia aprobada',
      auditorModeOff: 'Acceso completo a funciones de gestión',
      switchToAuditor: 'Cambiar a Vista Auditor',
      switchToFull: 'Cambiar a Acceso Completo',
      approvedOnly: 'Mostrando solo evidencia aprobada',
      folders: 'Carpetas de Evidencia',
      auditLog: 'Log de Auditoría',
      export: 'Exportar'
    },
    pt: {
      title: 'Sala de Auditoria',
      subtitle: 'Evidências organizadas para certificação ISO 27001',
      readOnly: 'Vista Auditor',
      fullAccess: 'Acesso Completo',
      downloadAuditPack: 'Baixar Pacote',
      semanticSearch: 'Buscar em todas as evidências e documentação...',
      aiSearch: 'Busca IA',
      items: 'itens',
      complete: 'Completo',
      partial: 'Parcial',
      // Auditor's Binder
      auditorsBinder: 'Pasta do Auditor',
      exportTitle: 'Exportar Pacote de Auditoria',
      exportDescription: 'Gera um pacote completo organizado por cláusulas ISO 27001',
      exportFormat: 'Formato de Exportação',
      pdfFormat: 'Documento PDF',
      pdfDesc: 'Documento único com todos os anexos embutidos',
      zipFormat: 'Arquivo ZIP',
      zipDesc: 'Estrutura de pastas conforme cláusulas ISO',
      selectClauses: 'Selecionar Cláusulas a Incluir',
      allClauses: 'Todas as Cláusulas',
      selectAll: 'Selecionar Tudo',
      deselectAll: 'Desmarcar Tudo',
      includeAnnexes: 'Incluir Anexos de Evidência',
      includeTrail: 'Incluir Log de Auditoria',
      generatePackage: 'Gerar Pacote',
      generating: 'Gerando...',
      estimatedSize: 'Tamanho Estimado',
      evidenceCount: 'Quantidade de Evidências',
      exportReady: 'Exportação Pronta!',
      downloadNow: 'Baixar Agora',
      // Audit Trail
      auditTrail: 'Trail de Auditoria da Plataforma',
      auditTrailDesc: 'Log completo de todas as modificações da plataforma',
      integrityLog: 'Log de Integridade',
      timestamp: 'Data/Hora',
      user: 'Usuário',
      action: 'Ação',
      resource: 'Recurso',
      ipAddress: 'Endereço IP',
      details: 'Detalhes',
      filterByAction: 'Filtrar por ação',
      allActions: 'Todas as Ações',
      created: 'Criado',
      modified: 'Modificado',
      deleted: 'Excluído',
      approved: 'Aprovado',
      exported: 'Exportado',
      viewed: 'Visualizado',
      exportTrail: 'Exportar Trail',
      last24h: 'Últimas 24 horas',
      last7d: 'Últimos 7 dias',
      last30d: 'Últimos 30 dias',
      allTime: 'Todo o tempo',
      // Auditor Mode
      auditorModeLabel: 'Modo Auditor',
      auditorModeOn: 'Visualização somente leitura mostrando apenas evidências aprovadas',
      auditorModeOff: 'Acesso completo a recursos de gestão',
      switchToAuditor: 'Mudar para Vista Auditor',
      switchToFull: 'Mudar para Acesso Completo',
      approvedOnly: 'Mostrando apenas evidências aprovadas',
      folders: 'Pastas de Evidência',
      auditLog: 'Log de Auditoria',
      export: 'Exportar'
    }
  };

  const l = labels[language] || labels.en;

  const folders = [
    { id: 1, name: '4. Context of the Organization', items: 8, status: 'complete', evidences: ['ISMS Scope Document', 'Stakeholder Analysis', 'Context Analysis Report'] },
    { id: 2, name: '5. Leadership', items: 12, status: 'complete', evidences: ['Information Security Policy', 'Management Commitment Letter', 'Roles & Responsibilities Matrix'] },
    { id: 3, name: '6. Planning', items: 15, status: 'complete', evidences: ['Risk Assessment Methodology', 'Risk Treatment Plan', 'Security Objectives'] },
    { id: 4, name: '7. Support', items: 18, status: 'partial', evidences: ['Competence Records', 'Training Plan', 'Communication Procedure'] },
    { id: 5, name: '8. Operation', items: 22, status: 'complete', evidences: ['Operational Procedures', 'Change Management Records', 'Risk Assessment Results'] },
    { id: 6, name: '9. Performance Evaluation', items: 14, status: 'complete', evidences: ['Internal Audit Reports', 'Management Review Minutes', 'KPI Dashboard'] },
    { id: 7, name: '10. Improvement', items: 9, status: 'partial', evidences: ['Nonconformity Register', 'Corrective Action Records', 'Improvement Log'] },
    { id: 8, name: 'Annex A Controls', items: 93, status: 'partial', evidences: ['Statement of Applicability', 'Control Implementation Evidence', 'Technical Configurations'] }
  ];

  // Audit trail log entries
  const auditTrailEntries = [
    { id: 1, timestamp: '2024-12-15 14:32:15', user: 'María García', role: 'CISO', action: 'approved', resource: 'Information Security Policy v2.1', ip: '192.168.1.45', details: 'Approved for publication' },
    { id: 2, timestamp: '2024-12-15 14:28:03', user: 'Carlos López', role: 'Security Manager', action: 'modified', resource: 'Risk Assessment - Q4 2024', ip: '192.168.1.102', details: 'Updated risk scores for 3 items' },
    { id: 3, timestamp: '2024-12-15 13:45:22', user: 'Ana Martínez', role: 'Compliance Officer', action: 'created', resource: 'Vendor Security Assessment - CloudCorp', ip: '192.168.1.78', details: 'New vendor assessment uploaded' },
    { id: 4, timestamp: '2024-12-15 12:15:00', user: 'Pedro Sánchez', role: 'IT Director', action: 'exported', resource: 'Audit Pack - Phase 2', ip: '192.168.1.33', details: 'Full audit package exported as ZIP' },
    { id: 5, timestamp: '2024-12-15 11:30:45', user: 'María García', role: 'CISO', action: 'viewed', resource: 'AWS Security Configuration', ip: '192.168.1.45', details: 'Viewed evidence details' },
    { id: 6, timestamp: '2024-12-15 10:20:18', user: 'Carlos López', role: 'Security Manager', action: 'approved', resource: 'Incident Response Procedure v1.8', ip: '192.168.1.102', details: 'Final approval for audit' },
    { id: 7, timestamp: '2024-12-14 16:45:30', user: 'Ana Martínez', role: 'Compliance Officer', action: 'modified', resource: 'Statement of Applicability', ip: '192.168.1.78', details: 'Updated control A.8.24 justification' },
    { id: 8, timestamp: '2024-12-14 15:10:05', user: 'System', role: 'Automated', action: 'created', resource: 'Azure AD MFA Report', ip: '10.0.0.1', details: 'Auto-collected from Azure API' },
    { id: 9, timestamp: '2024-12-14 14:30:22', user: 'Pedro Sánchez', role: 'IT Director', action: 'deleted', resource: 'Draft - BCP v0.3', ip: '192.168.1.33', details: 'Removed outdated draft version' },
    { id: 10, timestamp: '2024-12-14 11:00:00', user: 'María García', role: 'CISO', action: 'approved', resource: 'Access Control Policy v1.3', ip: '192.168.1.45', details: 'Approved with minor comments' }
  ];

  const [selectedExportFormat, setSelectedExportFormat] = useState('zip');
  const [selectedClauses, setSelectedClauses] = useState(folders.map(f => f.id));
  const [includeAnnexes, setIncludeAnnexes] = useState(true);
  const [includeTrail, setIncludeTrail] = useState(true);
  const [trailFilter, setTrailFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('7d');

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return '#10b981';
      case 'modified': return '#3b82f6';
      case 'deleted': return '#ef4444';
      case 'approved': return '#8b5cf6';
      case 'exported': return '#f59e0b';
      case 'viewed': return '#6b7280';
      default: return t.textDim;
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return Plus;
      case 'modified': return Edit3;
      case 'deleted': return Trash2;
      case 'approved': return CheckCircle2;
      case 'exported': return Download;
      case 'viewed': return Eye;
      default: return FileText;
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    setTimeout(() => {
      setIsExporting(false);
      setExportProgress(100);
    }, 3000);
  };

  const filteredTrail = auditTrailEntries.filter(entry => {
    if (trailFilter === 'all') return true;
    return entry.action === trailFilter;
  });

  const totalEvidences = folders.reduce((sum, f) => sum + f.items, 0);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700 }}>{l.title}</h1>
            {/* Auditor Mode Badge */}
            <div style={{ 
              padding: '6px 14px', 
              background: auditorMode ? 'rgba(168, 85, 247, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
              border: `1px solid ${auditorMode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`, 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: 600, 
              color: auditorMode ? '#a855f7' : '#10b981', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              {auditorMode ? <Eye size={14} /> : <Lock size={14} />}
              {auditorMode ? l.readOnly : l.fullAccess}
            </div>
          </div>
          <p style={{ color: t.textDim, fontSize: '15px' }}>{l.subtitle}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Auditor Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            padding: '8px 14px', 
            background: t.inputBg, 
            borderRadius: '10px',
            border: `1px solid ${t.border}`
          }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: t.textMuted }}>{l.auditorModeLabel}</span>
            <button
              onClick={() => setAuditorMode(!auditorMode)}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: auditorMode ? '#a855f7' : t.hoverBg,
                border: `1px solid ${auditorMode ? '#a855f7' : t.border}`,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '2px',
                left: auditorMode ? '22px' : '2px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
          
          {/* Auditor's Binder Button */}
          <button 
            onClick={() => setShowExportModal(true)}
            style={{ 
              padding: '12px 24px', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              border: 'none', 
              borderRadius: '10px', 
              color: 'white', 
              fontWeight: 600, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '14px', 
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)' 
            }}
          >
            <Download size={18} />
            {l.auditorsBinder}
          </button>
        </div>
      </div>

      {/* Auditor Mode Banner */}
      {auditorMode && (
        <div style={{ 
          padding: '12px 20px', 
          background: 'rgba(168, 85, 247, 0.1)', 
          border: '1px solid rgba(168, 85, 247, 0.2)', 
          borderRadius: '12px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Eye size={18} color="#a855f7" />
            <span style={{ fontSize: '13px', color: '#a855f7', fontWeight: 500 }}>{l.approvedOnly}</span>
          </div>
          <button 
            onClick={() => setAuditorMode(false)}
            style={{
              padding: '6px 12px',
              background: 'rgba(168, 85, 247, 0.2)',
              border: 'none',
              borderRadius: '6px',
              color: '#a855f7',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {l.switchToFull}
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '18px 22px', border: `1px solid ${t.border}`, marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: t.inputBg, borderRadius: '10px', padding: '10px 14px', border: `1px solid ${t.border}` }}>
            <Search size={18} color={t.textDim} />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder={l.semanticSearch} 
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontSize: '14px' }} 
            />
          </div>
          <button style={{ padding: '10px 20px', background: '#10b981', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={14} />
            {l.aiSearch}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'folders', label: l.folders, icon: Folder },
          { id: 'trail', label: l.auditLog, icon: History },
          { id: 'export', label: l.export, icon: Download }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                background: isActive ? '#a855f720' : 'transparent',
                border: `1px solid ${isActive ? '#a855f7' : t.border}`,
                borderRadius: '10px',
                color: isActive ? '#a855f7' : t.textMuted,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Folders Tab */}
      {activeTab === 'folders' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {folders.map((folder) => (
            <div 
              key={folder.id} 
              onClick={() => setSelectedFolder(folder)}
              style={{ 
                background: t.cardBg, 
                backdropFilter: 'blur(10px)', 
                borderRadius: '16px', 
                padding: '20px', 
                border: `1px solid ${t.border}`, 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'rgba(168, 85, 247, 0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Folder size={24} color="#a855f7" />
                </div>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: folder.status === 'complete' ? '#10b98115' : '#f59e0b15',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: folder.status === 'complete' ? '#10b981' : '#f59e0b'
                }}>
                  {folder.status === 'complete' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {folder.status === 'complete' ? l.complete : l.partial}
                </div>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', lineHeight: '1.4', color: t.text }}>{folder.name}</h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: t.textDim }}>{folder.items} {l.items}</span>
                <ExternalLink size={14} color={t.textDim} />
              </div>
              
              {/* Preview of evidences */}
              {!auditorMode && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${t.border}` }}>
                  {folder.evidences.slice(0, 2).map((ev, idx) => (
                    <div key={idx} style={{ fontSize: '11px', color: t.textDim, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={10} />
                      {ev}
                    </div>
                  ))}
                  {folder.evidences.length > 2 && (
                    <span style={{ fontSize: '10px', color: '#a855f7' }}>+{folder.evidences.length - 2} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'trail' && (
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          {/* Trail Header */}
          <div style={{ padding: '20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <History size={20} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{l.integrityLog}</h3>
                <p style={{ fontSize: '12px', color: t.textDim }}>{l.auditTrailDesc}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Time Filter */}
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: t.inputBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: '8px',
                  color: t.text,
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                <option value="24h">{l.last24h}</option>
                <option value="7d">{l.last7d}</option>
                <option value="30d">{l.last30d}</option>
                <option value="all">{l.allTime}</option>
              </select>
              
              {/* Action Filter */}
              <select 
                value={trailFilter}
                onChange={(e) => setTrailFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: t.inputBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: '8px',
                  color: t.text,
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                <option value="all">{l.allActions}</option>
                <option value="created">{l.created}</option>
                <option value="modified">{l.modified}</option>
                <option value="approved">{l.approved}</option>
                <option value="deleted">{l.deleted}</option>
                <option value="exported">{l.exported}</option>
              </select>
              
              <button style={{
                padding: '8px 16px',
                background: t.inputBg,
                border: `1px solid ${t.border}`,
                borderRadius: '8px',
                color: t.text,
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Download size={14} />
                {l.exportTrail}
              </button>
            </div>
          </div>

          {/* Trail Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.timestamp}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.user}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.action}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.resource}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.ipAddress}</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.details}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrail.map((entry) => {
                  const ActionIcon = getActionIcon(entry.action);
                  const actionColor = getActionColor(entry.action);
                  return (
                    <tr key={entry.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '12px', color: t.textMuted, fontFamily: 'monospace' }}>{entry.timestamp}</span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: t.text }}>{entry.user}</div>
                          <div style={{ fontSize: '11px', color: t.textDim }}>{entry.role}</div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          background: `${actionColor}15`,
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: actionColor
                        }}>
                          <ActionIcon size={12} />
                          {l[entry.action] || entry.action}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '13px', color: t.text }}>{entry.resource}</span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <code style={{ fontSize: '11px', color: t.textDim, fontFamily: 'monospace', background: t.inputBg, padding: '2px 6px', borderRadius: '4px' }}>
                          {entry.ip}
                        </code>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '12px', color: t.textDim }}>{entry.details}</span>
                      </td>
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
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={24} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: t.text }}>{l.exportTitle}</h3>
              <p style={{ fontSize: '13px', color: t.textDim }}>{l.exportDescription}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left Column - Format & Options */}
            <div>
              {/* Format Selection */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>{l.exportFormat}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { id: 'pdf', label: l.pdfFormat, desc: l.pdfDesc, icon: FileText },
                    { id: 'zip', label: l.zipFormat, desc: l.zipDesc, icon: FolderUp }
                  ].map((format) => {
                    const Icon = format.icon;
                    const isSelected = selectedExportFormat === format.id;
                    return (
                      <button
                        key={format.id}
                        onClick={() => setSelectedExportFormat(format.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '16px',
                          background: isSelected ? '#10b98115' : t.inputBg,
                          border: `2px solid ${isSelected ? '#10b981' : t.border}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: isSelected ? '#10b98120' : t.hoverBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={20} color={isSelected ? '#10b981' : t.textDim} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#10b981' : t.text }}>{format.label}</div>
                          <div style={{ fontSize: '12px', color: t.textDim }}>{format.desc}</div>
                        </div>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? '#10b981' : t.border}`,
                          background: isSelected ? '#10b981' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <Check size={12} color="white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>Options</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: t.inputBg, borderRadius: '10px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={includeAnnexes} 
                      onChange={(e) => setIncludeAnnexes(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                    />
                    <span style={{ fontSize: '13px', color: t.text }}>{l.includeAnnexes}</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: t.inputBg, borderRadius: '10px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={includeTrail} 
                      onChange={(e) => setIncludeTrail(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                    />
                    <span style={{ fontSize: '13px', color: t.text }}>{l.includeTrail}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Clause Selection */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase' }}>{l.selectClauses}</h4>
                <button 
                  onClick={() => setSelectedClauses(selectedClauses.length === folders.length ? [] : folders.map(f => f.id))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {selectedClauses.length === folders.length ? l.deselectAll : l.selectAll}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {folders.map((folder) => {
                  const isSelected = selectedClauses.includes(folder.id);
                  return (
                    <label 
                      key={folder.id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '12px', 
                        background: isSelected ? '#10b98110' : t.inputBg, 
                        borderRadius: '10px', 
                        cursor: 'pointer',
                        border: `1px solid ${isSelected ? '#10b98140' : 'transparent'}`
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClauses([...selectedClauses, folder.id]);
                          } else {
                            setSelectedClauses(selectedClauses.filter(id => id !== folder.id));
                          }
                        }}
                        style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: t.text }}>{folder.name}</div>
                        <div style={{ fontSize: '11px', color: t.textDim }}>{folder.items} {l.items}</div>
                      </div>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: folder.status === 'complete' ? '#10b981' : '#f59e0b' 
                      }} />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Export Summary & Button */}
          <div style={{ 
            marginTop: '24px', 
            padding: '16px 20px', 
            background: t.inputBg, 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '32px' }}>
              <div>
                <div style={{ fontSize: '11px', color: t.textDim }}>{l.evidenceCount}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>
                  {folders.filter(f => selectedClauses.includes(f.id)).reduce((sum, f) => sum + f.items, 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: t.textDim }}>{l.estimatedSize}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>~48 MB</div>
              </div>
            </div>
            <button 
              onClick={handleExport}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Download size={20} />
              {l.generatePackage}
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(8px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 200 
        }}>
          <div style={{ 
            width: '480px', 
            background: darkMode ? '#1e293b' : '#ffffff', 
            borderRadius: '20px', 
            border: `1px solid ${t.border}`, 
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
          }}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              {exportProgress < 100 ? (
                <>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <RefreshCw size={36} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: t.text, marginBottom: '8px' }}>{l.generating}</h3>
                  <p style={{ fontSize: '14px', color: t.textDim, marginBottom: '20px' }}>{l.exportDescription}</p>
                  
                  {/* Progress Bar */}
                  <div style={{ 
                    height: '8px', 
                    background: t.inputBg, 
                    borderRadius: '4px', 
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <div style={{ 
                      width: `${Math.min(exportProgress, 100)}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '13px', color: t.textMuted }}>{Math.round(Math.min(exportProgress, 100))}%</span>
                </>
              ) : (
                <>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <CheckCircle2 size={40} color="white" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#10b981', marginBottom: '8px' }}>{l.exportReady}</h3>
                  <p style={{ fontSize: '14px', color: t.textDim, marginBottom: '24px' }}>
                    ISO27001_Audit_Package_2024.{selectedExportFormat}
                  </p>
                  <button
                    onClick={() => { setShowExportModal(false); setExportProgress(0); }}
                    style={{
                      padding: '14px 32px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      margin: '0 auto'
                    }}
                  >
                    <Download size={20} />
                    {l.downloadNow}
                  </button>
                </>
              )}
            </div>
            
            {exportProgress < 100 && (
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => { setShowExportModal(false); setExportProgress(0); setIsExporting(false); }}
                  style={{
                    padding: '10px 20px',
                    background: t.inputBg,
                    border: `1px solid ${t.border}`,
                    borderRadius: '8px',
                    color: t.textMuted,
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// USER MANAGEMENT SCREEN
// ============================================
function UserManagementScreen() {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const [users, setUsers] = useState([
    { id: 1, name: 'Carlos López', email: 'carlos.lopez@company.com', role: 'admin', department: 'IT Security', status: 'active', lastLogin: '2024-12-14 09:30', avatar: 'CL' },
    { id: 2, name: 'Ana Martínez', email: 'ana.martinez@company.com', role: 'ciso', department: 'Executive', status: 'active', lastLogin: '2024-12-14 08:15', avatar: 'AM' },
    { id: 3, name: 'Pedro Sánchez', email: 'pedro.sanchez@company.com', role: 'security_manager', department: 'IT Security', status: 'active', lastLogin: '2024-12-13 17:45', avatar: 'PS' },
    { id: 4, name: 'María García', email: 'maria.garcia@company.com', role: 'compliance_officer', department: 'Compliance', status: 'active', lastLogin: '2024-12-14 10:00', avatar: 'MG' },
    { id: 5, name: 'Juan Rodríguez', email: 'juan.rodriguez@company.com', role: 'auditor', department: 'External', status: 'active', lastLogin: '2024-12-12 14:30', avatar: 'JR' },
    { id: 6, name: 'Laura Fernández', email: 'laura.fernandez@company.com', role: 'employee', department: 'Engineering', status: 'inactive', lastLogin: '2024-11-28 11:20', avatar: 'LF' },
    { id: 7, name: 'Roberto Díaz', email: 'roberto.diaz@company.com', role: 'employee', department: 'HR', status: 'active', lastLogin: '2024-12-14 07:50', avatar: 'RD' },
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // New user form state
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee', department: '', password: '' });

  const labels = {
    en: {
      title: 'User Management',
      subtitle: 'Manage users and assign roles for ISO 27001 compliance',
      addUser: 'Add User',
      searchPlaceholder: 'Search users...',
      allRoles: 'All Roles',
      allStatus: 'All Status',
      active: 'Active',
      inactive: 'Inactive',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      department: 'Department',
      status: 'Status',
      lastLogin: 'Last Login',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      deactivate: 'Deactivate',
      activate: 'Activate',
      // Roles
      admin: 'Administrator',
      ciso: 'CISO',
      security_manager: 'Security Manager',
      compliance_officer: 'Compliance Officer',
      auditor: 'Auditor',
      employee: 'Employee',
      // Modal
      addNewUser: 'Add New User',
      editUser: 'Edit User',
      fullName: 'Full Name',
      selectRole: 'Select Role',
      selectDepartment: 'Select Department',
      password: 'Temporary Password',
      cancel: 'Cancel',
      save: 'Save User',
      update: 'Update User',
      userCreated: 'User created successfully',
      userUpdated: 'User updated successfully',
      confirmDelete: 'Are you sure you want to delete this user?',
      // Permissions info
      permissionsTitle: 'Role Permissions',
      adminPerms: 'Full system access, user management, all modules',
      cisoPerms: 'Dashboard, reports, risk oversight, audit access',
      securityManagerPerms: 'Risk map, evidence center, gap analysis',
      compliancePerms: 'Document generator, audit room, evidence',
      auditorPerms: 'Read-only audit room, evidence viewing',
      employeePerms: 'Employee portal only (policy acknowledgment)',
      totalUsers: 'Total Users',
      activeUsers: 'Active',
      pendingInvites: 'Pending Invites',
      roleDistribution: 'Role Distribution'
    },
    es: {
      title: 'Gestión de Usuarios',
      subtitle: 'Administra usuarios y asigna roles para cumplimiento ISO 27001',
      addUser: 'Agregar Usuario',
      searchPlaceholder: 'Buscar usuarios...',
      allRoles: 'Todos los Roles',
      allStatus: 'Todos los Estados',
      active: 'Activo',
      inactive: 'Inactivo',
      name: 'Nombre',
      email: 'Email',
      role: 'Rol',
      department: 'Departamento',
      status: 'Estado',
      lastLogin: 'Último Acceso',
      actions: 'Acciones',
      edit: 'Editar',
      delete: 'Eliminar',
      deactivate: 'Desactivar',
      activate: 'Activar',
      admin: 'Administrador',
      ciso: 'CISO',
      security_manager: 'Gerente de Seguridad',
      compliance_officer: 'Oficial de Cumplimiento',
      auditor: 'Auditor',
      employee: 'Empleado',
      addNewUser: 'Agregar Nuevo Usuario',
      editUser: 'Editar Usuario',
      fullName: 'Nombre Completo',
      selectRole: 'Seleccionar Rol',
      selectDepartment: 'Seleccionar Departamento',
      password: 'Contraseña Temporal',
      cancel: 'Cancelar',
      save: 'Guardar Usuario',
      update: 'Actualizar Usuario',
      userCreated: 'Usuario creado exitosamente',
      userUpdated: 'Usuario actualizado exitosamente',
      confirmDelete: '¿Estás seguro de eliminar este usuario?',
      permissionsTitle: 'Permisos del Rol',
      adminPerms: 'Acceso total, gestión de usuarios, todos los módulos',
      cisoPerms: 'Dashboard, reportes, supervisión de riesgos, auditoría',
      securityManagerPerms: 'Mapa de riesgos, centro de evidencias, análisis',
      compliancePerms: 'Generador de docs, sala de auditoría, evidencias',
      auditorPerms: 'Sala de auditoría solo lectura, ver evidencias',
      employeePerms: 'Solo portal de empleados (aceptación de políticas)',
      totalUsers: 'Total Usuarios',
      activeUsers: 'Activos',
      pendingInvites: 'Invitaciones Pendientes',
      roleDistribution: 'Distribución de Roles'
    },
    pt: {
      title: 'Gestão de Usuários',
      subtitle: 'Gerencie usuários e atribua funções para conformidade ISO 27001',
      addUser: 'Adicionar Usuário',
      searchPlaceholder: 'Buscar usuários...',
      allRoles: 'Todas as Funções',
      allStatus: 'Todos os Status',
      active: 'Ativo',
      inactive: 'Inativo',
      name: 'Nome',
      email: 'Email',
      role: 'Função',
      department: 'Departamento',
      status: 'Status',
      lastLogin: 'Último Acesso',
      actions: 'Ações',
      edit: 'Editar',
      delete: 'Excluir',
      deactivate: 'Desativar',
      activate: 'Ativar',
      admin: 'Administrador',
      ciso: 'CISO',
      security_manager: 'Gerente de Segurança',
      compliance_officer: 'Oficial de Conformidade',
      auditor: 'Auditor',
      employee: 'Funcionário',
      addNewUser: 'Adicionar Novo Usuário',
      editUser: 'Editar Usuário',
      fullName: 'Nome Completo',
      selectRole: 'Selecionar Função',
      selectDepartment: 'Selecionar Departamento',
      password: 'Senha Temporária',
      cancel: 'Cancelar',
      save: 'Salvar Usuário',
      update: 'Atualizar Usuário',
      userCreated: 'Usuário criado com sucesso',
      userUpdated: 'Usuário atualizado com sucesso',
      confirmDelete: 'Tem certeza que deseja excluir este usuário?',
      permissionsTitle: 'Permissões da Função',
      adminPerms: 'Acesso total, gestão de usuários, todos os módulos',
      cisoPerms: 'Dashboard, relatórios, supervisão de riscos, auditoria',
      securityManagerPerms: 'Mapa de riscos, centro de evidências, análise',
      compliancePerms: 'Gerador de docs, sala de auditoria, evidências',
      auditorPerms: 'Sala de auditoria somente leitura, ver evidências',
      employeePerms: 'Apenas portal de funcionários (aceitação de políticas)',
      totalUsers: 'Total de Usuários',
      activeUsers: 'Ativos',
      pendingInvites: 'Convites Pendentes',
      roleDistribution: 'Distribuição de Funções'
    }
  };
  const l = labels[language] || labels.en;

  const roles = [
    { id: 'admin', color: '#ef4444', icon: Shield },
    { id: 'ciso', color: '#8b5cf6', icon: Shield },
    { id: 'security_manager', color: '#3b82f6', icon: Lock },
    { id: 'compliance_officer', color: '#10b981', icon: FileCheck },
    { id: 'auditor', color: '#f59e0b', icon: Eye },
    { id: 'employee', color: '#6b7280', icon: UserCircle }
  ];

  const departments = ['IT Security', 'Executive', 'Compliance', 'Engineering', 'HR', 'Finance', 'Operations', 'External'];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (roleId) => roles.find(r => r.id === roleId)?.color || '#6b7280';

  const handleAddUser = () => {
    const newId = Math.max(...users.map(u => u.id)) + 1;
    const avatar = newUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    setUsers([...users, { ...newUser, id: newId, avatar, status: 'active', lastLogin: 'Never' }]);
    setNewUser({ name: '', email: '', role: 'employee', department: '', password: '' });
    setShowAddModal(false);
  };

  const handleUpdateUser = (userId, updates) => {
    setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
    setShowEditModal(null);
  };

  const handleDeleteUser = (userId) => {
    if (confirm(l.confirmDelete)) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const toggleUserStatus = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  };

  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{l.title}</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>{l.subtitle}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Plus size={18} />
          {l.addUser}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} color="#3b82f6" /></div>
            <span style={{ fontSize: '13px', color: t.textMuted }}>{l.totalUsers}</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{users.length}</div>
        </div>
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={18} color="#10b981" /></div>
            <span style={{ fontSize: '13px', color: t.textMuted }}>{l.activeUsers}</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>{activeCount}</div>
        </div>
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={18} color="#f59e0b" /></div>
            <span style={{ fontSize: '13px', color: t.textMuted }}>{l.pendingInvites}</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>2</div>
        </div>
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: '13px', color: t.textMuted, marginBottom: '12px' }}>{l.roleDistribution}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {roles.map(role => {
              const count = users.filter(u => u.role === role.id).length;
              if (count === 0) return null;
              return (
                <div key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: `${role.color}15`, borderRadius: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: role.color }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: role.color }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '20px', border: `1px solid ${t.border}`, marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color={t.textDim} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={l.searchPlaceholder}
            style={{ width: '100%', padding: '12px 14px 12px 44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }}
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
          <option value="all">{l.allRoles}</option>
          {roles.map(role => <option key={role.id} value={role.id}>{l[role.id]}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
          <option value="all">{l.allStatus}</option>
          <option value="active">{l.active}</option>
          <option value="inactive">{l.inactive}</option>
        </select>
      </div>

      {/* Users Table */}
      <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.name}</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.role}</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.department}</th>
              <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.status}</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.lastLogin}</th>
              <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={{ borderTop: `1px solid ${t.border}` }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${getRoleColor(user.role)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: getRoleColor(user.role) }}>
                      {user.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: t.textDim }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ padding: '6px 12px', background: `${getRoleColor(user.role)}15`, borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: getRoleColor(user.role) }}>
                    {l[user.role]}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', fontSize: '14px', color: t.textMuted }}>{user.department}</td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <span style={{ padding: '6px 12px', background: user.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: user.status === 'active' ? '#10b981' : '#ef4444' }}>
                    {user.status === 'active' ? l.active : l.inactive}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', fontSize: '13px', color: t.textDim, fontFamily: 'monospace' }}>{user.lastLogin}</td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowEditModal(user)} style={{ padding: '8px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Edit3 size={14} /> {l.edit}
                    </button>
                    <button onClick={() => toggleUserStatus(user.id)} style={{ padding: '8px 12px', background: user.status === 'active' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', border: 'none', borderRadius: '8px', color: user.status === 'active' ? '#f59e0b' : '#10b981', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                      {user.status === 'active' ? l.deactivate : l.activate}
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.15)', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '600px', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${t.border}` }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: t.text }}>{l.addNewUser}</h3>
              <button onClick={() => setShowAddModal(false)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: t.inputBg, border: 'none', cursor: 'pointer', color: t.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: t.textMuted, marginBottom: '8px' }}>{l.fullName}</label>
                <input value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: t.textMuted, marginBottom: '8px' }}>{l.email}</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: t.textMuted, marginBottom: '8px' }}>{l.role}</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                    {roles.map(role => <option key={role.id} value={role.id}>{l[role.id]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: t.textMuted, marginBottom: '8px' }}>{l.department}</label>
                  <select value={newUser.department} onChange={(e) => setNewUser({...newUser, department: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                    <option value="">{l.selectDepartment}</option>
                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: t.textMuted, marginBottom: '8px' }}>{l.password}</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }} />
              </div>
              
              {/* Role Permissions Info */}
              <div style={{ background: `${getRoleColor(newUser.role)}10`, border: `1px solid ${getRoleColor(newUser.role)}30`, borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Shield size={16} color={getRoleColor(newUser.role)} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: getRoleColor(newUser.role) }}>{l.permissionsTitle}: {l[newUser.role]}</span>
                </div>
                <p style={{ fontSize: '12px', color: t.textMuted, lineHeight: '1.5' }}>
                  {newUser.role === 'admin' && l.adminPerms}
                  {newUser.role === 'ciso' && l.cisoPerms}
                  {newUser.role === 'security_manager' && l.securityManagerPerms}
                  {newUser.role === 'compliance_officer' && l.compliancePerms}
                  {newUser.role === 'auditor' && l.auditorPerms}
                  {newUser.role === 'employee' && l.employeePerms}
                </p>
              </div>
            </div>
            <div style={{ padding: '20px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '12px 24px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>{l.cancel}</button>
              <button onClick={handleAddUser} disabled={!newUser.name || !newUser.email} style={{ padding: '12px 24px', background: newUser.name && newUser.email ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : t.inputBg, border: 'none', borderRadius: '10px', color: newUser.name && newUser.email ? 'white' : t.textDim, fontSize: '14px', fontWeight: 600, cursor: newUser.name && newUser.email ? 'pointer' : 'not-allowed' }}>{l.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '600px', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${t.border}` }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: t.text }}>{l.editUser}</h3>
              <button onClick={() => setShowEditModal(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: t.inputBg, border: 'none', cursor: 'pointer', color: t.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `${getRoleColor(showEditModal.role)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, color: getRoleColor(showEditModal.role) }}>
                  {showEditModal.avatar}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: t.text }}>{showEditModal.name}</div>
                  <div style={{ fontSize: '13px', color: t.textDim }}>{showEditModal.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: t.textMuted, marginBottom: '8px' }}>{l.role}</label>
                  <select value={showEditModal.role} onChange={(e) => setShowEditModal({...showEditModal, role: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                    {roles.map(role => <option key={role.id} value={role.id}>{l[role.id]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: t.textMuted, marginBottom: '8px' }}>{l.department}</label>
                  <select value={showEditModal.department} onChange={(e) => setShowEditModal({...showEditModal, department: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
              </div>
              
              {/* Role Permissions Info */}
              <div style={{ background: `${getRoleColor(showEditModal.role)}10`, border: `1px solid ${getRoleColor(showEditModal.role)}30`, borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Shield size={16} color={getRoleColor(showEditModal.role)} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: getRoleColor(showEditModal.role) }}>{l.permissionsTitle}: {l[showEditModal.role]}</span>
                </div>
                <p style={{ fontSize: '12px', color: t.textMuted, lineHeight: '1.5' }}>
                  {showEditModal.role === 'admin' && l.adminPerms}
                  {showEditModal.role === 'ciso' && l.cisoPerms}
                  {showEditModal.role === 'security_manager' && l.securityManagerPerms}
                  {showEditModal.role === 'compliance_officer' && l.compliancePerms}
                  {showEditModal.role === 'auditor' && l.auditorPerms}
                  {showEditModal.role === 'employee' && l.employeePerms}
                </p>
              </div>
            </div>
            <div style={{ padding: '20px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowEditModal(null)} style={{ padding: '12px 24px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>{l.cancel}</button>
              <button onClick={() => handleUpdateUser(showEditModal.id, { role: showEditModal.role, department: showEditModal.department })} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{l.update}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Modal
function SettingsModal({ darkMode, setDarkMode, language, setLanguage, languages, theme: t, onClose }) {
  const [activeSection, setActiveSection] = useState('password');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [twoFAMethod, setTwoFAMethod] = useState('app');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [auditCycleDay, setAuditCycleDay] = useState(1);

  const labels = {
    en: {
      settings: 'Settings',
      password: 'Password',
      twoFA: 'Two-Factor Auth',
      language: 'Language',
      appearance: 'Appearance',
      auditCycle: 'Audit Cycle',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      passwordRequirements: 'Password must be at least 12 characters with uppercase, lowercase, numbers and symbols',
      updatePassword: 'Update Password',
      twoFactorAuth: 'Two-Factor Authentication',
      twoFADescription: 'Add an extra layer of security to your account',
      enabled: 'Enabled',
      disabled: 'Disabled',
      authMethod: 'Authentication Method',
      authApp: 'Authenticator App',
      smsCode: 'SMS Code',
      emailCode: 'Email Code',
      defaultLanguage: 'Default Language',
      languageDescription: 'Choose your preferred language for the interface',
      screenMode: 'Screen Mode',
      appearanceDescription: 'Customize how Dani looks on your device',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      darkModeDesc: 'Easier on the eyes in low light',
      lightModeDesc: 'Better visibility in bright environments',
      auditCycleTitle: 'Audit Cycle Day',
      auditCycleDescription: 'Set the day of the month when your internal audit cycle begins. This helps schedule reviews, reminders, and compliance deadlines.',
      auditCycleDay: 'Cycle Start Day',
      auditCycleDayHelp: 'Monthly audit cycle will start on this day',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      saved: 'Changes saved successfully!'
    },
    es: {
      settings: 'Configuración',
      password: 'Contraseña',
      twoFA: 'Autenticación 2FA',
      language: 'Idioma',
      appearance: 'Apariencia',
      auditCycle: 'Ciclo de Auditoría',
      changePassword: 'Cambiar Contraseña',
      currentPassword: 'Contraseña Actual',
      newPassword: 'Nueva Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      passwordRequirements: 'La contraseña debe tener al menos 12 caracteres con mayúsculas, minúsculas, números y símbolos',
      updatePassword: 'Actualizar Contraseña',
      twoFactorAuth: 'Autenticación de Dos Factores',
      twoFADescription: 'Añade una capa extra de seguridad a tu cuenta',
      enabled: 'Activado',
      disabled: 'Desactivado',
      authMethod: 'Método de Autenticación',
      authApp: 'App de Autenticación',
      smsCode: 'Código SMS',
      emailCode: 'Código Email',
      defaultLanguage: 'Idioma Predeterminado',
      languageDescription: 'Elige tu idioma preferido para la interfaz',
      screenMode: 'Modo de Pantalla',
      appearanceDescription: 'Personaliza cómo se ve Dani en tu dispositivo',
      darkMode: 'Modo Oscuro',
      lightMode: 'Modo Claro',
      darkModeDesc: 'Más cómodo en ambientes oscuros',
      lightModeDesc: 'Mejor visibilidad en ambientes claros',
      auditCycleTitle: 'Día del Ciclo de Auditoría',
      auditCycleDescription: 'Establece el día del mes en que comienza tu ciclo de auditoría interna. Esto ayuda a programar revisiones, recordatorios y plazos de cumplimiento.',
      auditCycleDay: 'Día de Inicio del Ciclo',
      auditCycleDayHelp: 'El ciclo de auditoría mensual comenzará en este día',
      saveChanges: 'Guardar Cambios',
      cancel: 'Cancelar',
      saved: '¡Cambios guardados exitosamente!'
    },
    pt: {
      settings: 'Configurações',
      password: 'Senha',
      twoFA: 'Autenticação 2FA',
      language: 'Idioma',
      appearance: 'Aparência',
      auditCycle: 'Ciclo de Auditoria',
      changePassword: 'Alterar Senha',
      currentPassword: 'Senha Atual',
      newPassword: 'Nova Senha',
      confirmPassword: 'Confirmar Senha',
      passwordRequirements: 'A senha deve ter pelo menos 12 caracteres com maiúsculas, minúsculas, números e símbolos',
      updatePassword: 'Atualizar Senha',
      twoFactorAuth: 'Autenticação de Dois Fatores',
      twoFADescription: 'Adicione uma camada extra de segurança à sua conta',
      enabled: 'Ativado',
      disabled: 'Desativado',
      authMethod: 'Método de Autenticação',
      authApp: 'App Autenticador',
      smsCode: 'Código SMS',
      emailCode: 'Código Email',
      defaultLanguage: 'Idioma Padrão',
      languageDescription: 'Escolha seu idioma preferido para a interface',
      screenMode: 'Modo de Tela',
      appearanceDescription: 'Personalize como o Dani aparece no seu dispositivo',
      darkMode: 'Modo Escuro',
      lightMode: 'Modo Claro',
      darkModeDesc: 'Mais confortável em ambientes escuros',
      lightModeDesc: 'Melhor visibilidade em ambientes claros',
      auditCycleTitle: 'Dia do Ciclo de Auditoria',
      auditCycleDescription: 'Defina o dia do mês em que seu ciclo de auditoria interna começa. Isso ajuda a programar revisões, lembretes e prazos de conformidade.',
      auditCycleDay: 'Dia de Início do Ciclo',
      auditCycleDayHelp: 'O ciclo de auditoria mensal começará neste dia',
      saveChanges: 'Salvar Alterações',
      cancel: 'Cancelar',
      saved: 'Alterações salvas com sucesso!'
    }
  };

  const l = labels[language] || labels.en;

  const sections = [
    { id: 'password', label: l.password, icon: Key },
    { id: '2fa', label: l.twoFA, icon: Smartphone },
    { id: 'auditCycle', label: l.auditCycle, icon: Calendar },
    { id: 'language', label: l.language, icon: Globe },
    { id: 'appearance', label: l.appearance, icon: Monitor }
  ];

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, animation: 'fadeIn 0.2s ease' }}>
      <div style={{ width: '720px', maxHeight: '85vh', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} color="white" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: t.text }}>{l.settings}</h2>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '8px', background: t.inputBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Sidebar Navigation */}
          <div style={{ width: '200px', borderRight: `1px solid ${t.border}`, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: isActive ? '#10b981' : t.textMuted,
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Icon size={18} />
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            
            {/* Password Section */}
            {activeSection === 'password' && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: t.text }}>{l.changePassword}</h3>
                <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>{l.passwordRequirements}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '8px' }}>{l.currentPassword}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        style={{ width: '100%', padding: '12px 44px 12px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }}
                      />
                      <button onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textDim }}>
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '8px' }}>{l.newPassword}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ width: '100%', padding: '12px 44px 12px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }}
                      />
                      <button onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textDim }}>
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '8px' }}>{l.confirmPassword}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ width: '100%', padding: '12px 44px 12px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none' }}
                      />
                      <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textDim }}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <button style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', alignSelf: 'flex-start' }}>
                    {l.updatePassword}
                  </button>
                </div>
              </div>
            )}

            {/* 2FA Section */}
            {activeSection === '2fa' && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: t.text }}>{l.twoFactorAuth}</h3>
                <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>{l.twoFADescription}</p>
                
                {/* Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: t.inputBg, borderRadius: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: twoFAEnabled ? 'rgba(16, 185, 129, 0.15)' : t.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={20} color={twoFAEnabled ? '#10b981' : t.textDim} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{l.twoFactorAuth}</div>
                      <div style={{ fontSize: '12px', color: twoFAEnabled ? '#10b981' : t.textDim }}>{twoFAEnabled ? l.enabled : l.disabled}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                    style={{
                      width: '52px',
                      height: '28px',
                      borderRadius: '14px',
                      background: twoFAEnabled ? '#10b981' : t.hoverBg,
                      border: `1px solid ${twoFAEnabled ? '#10b981' : t.border}`,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: twoFAEnabled ? '27px' : '2px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>

                {/* Auth Method */}
                {twoFAEnabled && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '12px' }}>{l.authMethod}</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { id: 'app', label: l.authApp, icon: Smartphone },
                        { id: 'sms', label: l.smsCode, icon: MessageSquare },
                        { id: 'email', label: l.emailCode, icon: FileText }
                      ].map((method) => {
                        const Icon = method.icon;
                        const isSelected = twoFAMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setTwoFAMethod(method.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '14px 16px',
                              background: isSelected ? 'rgba(16, 185, 129, 0.1)' : t.inputBg,
                              border: `2px solid ${isSelected ? '#10b981' : t.border}`,
                              borderRadius: '10px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Icon size={18} color={isSelected ? '#10b981' : t.textDim} />
                            <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: isSelected ? '#10b981' : t.text }}>{method.label}</span>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? '#10b981' : t.border}`,
                              background: isSelected ? '#10b981' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isSelected && <Check size={12} color="white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audit Cycle Section */}
            {activeSection === 'auditCycle' && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: t.text }}>{l.auditCycleTitle}</h3>
                <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>{l.auditCycleDescription}</p>
                
                {/* Audit Cycle Day Selector */}
                <div style={{ padding: '20px', background: t.inputBg, borderRadius: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={20} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{l.auditCycleDay}</div>
                      <div style={{ fontSize: '12px', color: t.textDim }}>{l.auditCycleDayHelp}</div>
                    </div>
                  </div>
                  
                  {/* Day Selection Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
                      const isSelected = auditCycleDay === day;
                      return (
                        <button
                          key={day}
                          onClick={() => setAuditCycleDay(day)}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            background: isSelected ? '#10b981' : 'transparent',
                            border: `1px solid ${isSelected ? '#10b981' : t.border}`,
                            color: isSelected ? 'white' : t.text,
                            fontSize: '13px',
                            fontWeight: isSelected ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Current Selection Display */}
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span style={{ fontSize: '13px', color: t.text }}>
                      {language === 'es' ? `Ciclo mensual comienza el día ${auditCycleDay}` : 
                       language === 'pt' ? `Ciclo mensal começa no dia ${auditCycleDay}` : 
                       `Monthly cycle starts on day ${auditCycleDay}`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Language Section */}
            {activeSection === 'language' && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: t.text }}>{l.defaultLanguage}</h3>
                <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>{l.languageDescription}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {languages.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '16px 18px',
                          background: isSelected ? 'rgba(16, 185, 129, 0.1)' : t.inputBg,
                          border: `2px solid ${isSelected ? '#10b981' : t.border}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: '28px' }}>{lang.flag}</span>
                        <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: isSelected ? '#10b981' : t.text }}>{lang.name}</span>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? '#10b981' : t.border}`,
                          background: isSelected ? '#10b981' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <Check size={14} color="white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: t.text }}>{l.screenMode}</h3>
                <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>{l.appearanceDescription}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Dark Mode Card */}
                  <button
                    onClick={() => setDarkMode(true)}
                    style={{
                      padding: '20px',
                      background: darkMode ? 'rgba(16, 185, 129, 0.1)' : t.inputBg,
                      border: `2px solid ${darkMode ? '#10b981' : t.border}`,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '80px',
                      background: 'linear-gradient(135deg, #0a0f1c 0%, #1e293b 100%)',
                      borderRadius: '10px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <Moon size={28} color="#6366f1" />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: darkMode ? '#10b981' : t.text, marginBottom: '4px' }}>{l.darkMode}</div>
                    <div style={{ fontSize: '11px', color: t.textDim }}>{l.darkModeDesc}</div>
                    {darkMode && (
                      <div style={{ marginTop: '12px', width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px auto 0' }}>
                        <Check size={14} color="white" />
                      </div>
                    )}
                  </button>

                  {/* Light Mode Card */}
                  <button
                    onClick={() => setDarkMode(false)}
                    style={{
                      padding: '20px',
                      background: !darkMode ? 'rgba(16, 185, 129, 0.1)' : t.inputBg,
                      border: `2px solid ${!darkMode ? '#10b981' : t.border}`,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '80px',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      borderRadius: '10px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                      <Sun size={28} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: !darkMode ? '#10b981' : t.text, marginBottom: '4px' }}>{l.lightMode}</div>
                    <div style={{ fontSize: '11px', color: t.textDim }}>{l.lightModeDesc}</div>
                    {!darkMode && (
                      <div style={{ marginTop: '12px', width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px auto 0' }}>
                        <Check size={14} color="white" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {saveSuccess ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px', fontWeight: 500 }}>
              <CheckCircle2 size={16} />
              {l.saved}
            </div>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              {l.cancel}
            </button>
            <button onClick={handleSave} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              {l.saveChanges}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
