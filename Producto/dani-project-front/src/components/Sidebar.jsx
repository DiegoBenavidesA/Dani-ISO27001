/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Search, FilePlus2, AlertTriangle, Database, FileText, FileCheck, Users, ChevronLeft, ChevronRight, Shield, UserCircle, Building2, ClipboardCheck } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getDomainScores, getComplianceScore } from '../services/api';

function SidebarProgressRings({ theme: t, language, collapsed }) {
  const [domains, setDomains] = useState(null);
  const [overallProgress, setOverallProgress] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [domainData, scoreData] = await Promise.all([getDomainScores(), getComplianceScore()]);
        if (domainData && !domainData.detail) setDomains(domainData);
        if (scoreData && !scoreData.detail) setOverallProgress(Math.round(scoreData.overall_score ?? 0));
      } catch (_) {}
    };
    load();
  }, []);

  const domainProgress = [
    { name: language === 'es' ? 'Personas' : 'People',     progress: domains?.people      ?? null, color: '#3b82f6' },
    { name: language === 'es' ? 'Tecnología' : 'Technology', progress: domains?.technology ?? null, color: '#8b5cf6' },
    { name: language === 'es' ? 'Físico' : 'Physical',     progress: domains?.physical     ?? null, color: '#10b981' },
    { name: language === 'es' ? 'Procesos' : 'Processes',  progress: domains?.processes    ?? null, color: '#f59e0b' }
  ];

  const displayOverall = overallProgress ?? Math.round(domainProgress.filter(d => d.progress !== null).reduce((s, d) => s + d.progress, 0) / (domainProgress.filter(d => d.progress !== null).length || 1));
  const darkMode = t.bg.includes('#000000') || t.bg.includes('#0a0f1c'); // Infer dark mode from theme bg

  if (collapsed) {
    return (
      <div style={{ padding: '12px 8px', borderTop: `1px solid ${t.border}`, marginTop: 'auto' }}>
        <div style={{ width: '48px', height: '48px', margin: '0 auto', position: 'relative' }}>
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <circle cx="24" cy="24" r="20" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(displayOverall ?? 0) * 1.26} 126`} transform="rotate(-90 24 24)" />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '11px', fontWeight: 700, color: '#10b981' }}>{displayOverall ?? '--'}%</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', borderTop: `1px solid ${t.border}`, marginTop: 'auto' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{language === 'es' ? 'Análisis de Brechas' : 'Gap Analysis'}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div style={{ width: '64px', height: '64px', position: 'relative' }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle cx="32" cy="32" r="26" fill="none" stroke="url(#overallGradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(displayOverall ?? 0) * 1.63} 163`} transform="rotate(-90 32 32)" />
            <defs><linearGradient id="overallGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '16px', fontWeight: 700, color: '#10b981' }}>{displayOverall ?? '--'}%</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{language === 'es' ? 'General' : 'Overall'}</div>
          <div style={{ fontSize: '11px', color: t.textDim }}>4 {language === 'es' ? 'dominios' : 'domains'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {domainProgress.map((domain, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: t.textMuted }}>{domain.name}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: domain.color }}>
                {domain.progress !== null ? `${domain.progress}%` : '...'}
              </span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${domain.progress ?? 0}%`, height: '100%', background: domain.color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ activeScreen, setActiveScreen, sidebarCollapsed, setSidebarCollapsed, setCommandPaletteOpen }) => {
  const { theme: t, language, translations } = useTheme();
  const { user } = useAuth();
  const l = translations[language];
  const isAdmin = user && ['admin', 'manager', 'auditor'].includes(user?.role);

  const navItems = [
    { id: 'dashboard', label: l.dashboard, icon: LayoutDashboard, adminOnly: false },
    { id: 'gap-analysis', label: l.gapAnalysis, icon: Search, adminOnly: true },
    { id: 'doc-generator', label: l.docGenerator, icon: FilePlus2, adminOnly: true },
    { id: 'risk-map', label: l.riskMap, icon: AlertTriangle, adminOnly: true },
    { id: 'evidence', label: l.evidenceCenter, icon: Database, adminOnly: true },
    { id: 'documents', label: l.documents, icon: FileText, adminOnly: true },
    { id: 'audit-room', label: l.auditRoom, icon: FileCheck, adminOnly: true },
    { id: 'user-management', label: l.userManagement, icon: Users, adminOnly: true },
    { id: 'consents', label: language === 'es' ? 'Consentimientos' : 'Consents', icon: ClipboardCheck, adminOnly: true },
    { id: 'vendors', label: language === 'es' ? 'Proveedores' : 'Vendors', icon: Building2, adminOnly: true },
    { id: 'employee-portal', label: language === 'es' ? 'Portal de Empleados' : 'Employee Portal', icon: UserCircle, adminOnly: false },
  ].filter(item => !item.adminOnly || isAdmin);

  return (
    <aside style={{ width: sidebarCollapsed ? '80px' : '260px', background: t.sidebarBg, backdropFilter: 'blur(20px)', borderRight: `1px solid ${t.border}`, padding: '24px 16px', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', position: 'relative', zIndex: 10 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={24} color="white" />
        </div>
        {!sidebarCollapsed && <div><div style={{ fontWeight: 700, fontSize: '20px' }}>Dani</div><div style={{ fontSize: '11px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '1px' }}>ISO 27001</div></div>}
      </div>

      {/* Command Palette Trigger */}
      {!sidebarCollapsed && setCommandPaletteOpen && (
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.textDim, fontSize: '13px', cursor: 'pointer', marginBottom: '20px', width: '100%', textAlign: 'left' }}
        >
          <Search size={16} />
          <span style={{ flex: 1 }}>{language === 'es' ? 'Buscar...' : 'Search...'}</span>
          <kbd style={{ padding: '2px 6px', background: t.hoverBg || 'rgba(0,0,0,0.05)', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>⌘K</kbd>
        </button>
      )}

      <nav style={{ flex: 1 }}>
        {navItems.filter(i => i.id !== 'employee-portal').map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button key={item.id} onClick={() => setActiveScreen(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: sidebarCollapsed ? '12px' : '12px 16px', marginBottom: '6px', background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent', border: 'none', borderRadius: '12px', color: isActive ? '#10b981' : t.textMuted, cursor: 'pointer', transition: 'all 0.2s ease', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
              <item.icon size={20} />
              {!sidebarCollapsed && <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
            </button>
          );
        })}

        {/* Employee Portal Link con estilo especial (dashed) */}
        {navItems.find(i => i.id === 'employee-portal') && (() => {
          const item = navItems.find(i => i.id === 'employee-portal');
          const isActive = activeScreen === item.id;
          return (
            <button onClick={() => setActiveScreen(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: sidebarCollapsed ? '12px' : '12px 16px', marginBottom: '6px', marginTop: '16px', background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent', border: `1px dashed ${t.border}`, borderRadius: '12px', color: isActive ? '#10b981' : t.textDim, cursor: 'pointer', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
              <item.icon size={20} />
              {!sidebarCollapsed && <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
            </button>
          );
        })()}
      </nav>

      <SidebarProgressRings theme={t} language={language} collapsed={sidebarCollapsed} />

      {/* Collapse Button */}
      <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ position: 'absolute', top: '50%', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: t.cardBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textDim }}>
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};

export default Sidebar;