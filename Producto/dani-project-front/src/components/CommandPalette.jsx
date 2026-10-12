// src/components/CommandPalette.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, LayoutDashboard, FilePlus2, AlertTriangle, 
  Database, Eye, UserCircle, Upload, Plus, Download, 
  FileText, Lock, Key, AlertCircle 
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const labels = {
  en: { 
    placeholder: 'Search commands, controls, evidence...', 
    noResults: 'No results found', 
    navigation: 'Navigation', 
    actions: 'Quick Actions', 
    controls: 'Controls' 
  },
  es: { 
    placeholder: 'Buscar comandos, controles, evidencias...', 
    noResults: 'Sin resultados', 
    navigation: 'Navegación', 
    actions: 'Acciones Rápidas', 
    controls: 'Controles' 
  },
  pt: { 
    placeholder: 'Buscar comandos, controles, evidências...', 
    noResults: 'Sem resultados', 
    navigation: 'Navegação', 
    actions: 'Ações Rápidas', 
    controls: 'Controles' 
  }
};

const commands = [
  { id: 'dashboard', type: 'nav', name: { en: 'Dashboard', es: 'Panel', pt: 'Painel' }, icon: LayoutDashboard, shortcut: 'G D' },
  { id: 'gap-analysis', type: 'nav', name: { en: 'Gap Analysis', es: 'Análisis de Brechas', pt: 'Análise de Lacunas' }, icon: Search, shortcut: 'G G' },
  { id: 'doc-generator', type: 'nav', name: { en: 'Document Generator', es: 'Generador de Docs', pt: 'Gerador de Docs' }, icon: FilePlus2, shortcut: 'G O' },
  { id: 'risk-map', type: 'nav', name: { en: 'Risk Map', es: 'Mapa de Riesgos', pt: 'Mapa de Riscos' }, icon: AlertTriangle, shortcut: 'G R' },
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

function CommandPalette({ isOpen, onClose, onNavigate, darkMode }) {
  const { theme: t, language } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const l = labels[language] || labels.en;

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
                      <div key={cmd.id} onClick={() => { onNavigate(cmd.id); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isSelected ? '#004ac620' : 'transparent', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isSelected ? '#004ac630' : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} color={isSelected ? '#004ac6' : t.textDim} />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: isSelected ? '#004ac6' : t.text }}>{cmd.name[language] || cmd.name.en}</span>
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
          <span><kbd style={{ padding: '2px 6px', background: t.inputBg, borderRadius: '4px' }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ padding: '2px 6px', background: t.inputBg, borderRadius: '4px' }}>↵</kbd> select</span>
          <span><kbd style={{ padding: '2px 6px', background: t.inputBg, borderRadius: '4px' }}>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;