/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Search, FilePlus2, AlertTriangle, Database, FileText, FileCheck, Users, ChevronLeft, ChevronRight, ChevronDown, Shield, UserCircle, Building2, ClipboardCheck, Inbox, ShieldAlert, ClipboardList, BrainCircuit, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getDomainScores, getComplianceScore } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ activeScreen, setActiveScreen, sidebarCollapsed, setSidebarCollapsed, setCommandPaletteOpen, isMobile, mobileMenuOpen, setMobileMenuOpen }) => {
  const { theme: t, language, translations } = useTheme();
  const { user, impersonatedOrg, exitOrg } = useAuth();
  const l = translations[language];
  const [comunOpen, setComunOpen] = useState(true);
  const [isoOpen, setIsoOpen] = useState(true);
  const [leyOpen, setLeyOpen] = useState(true);

  const ISO_IDS = ['audit-room', 'assessment'];
  const LEY_IDS = ['treatments', 'consents', 'data-requests', 'breaches', 'vendors', 'impact'];

  useEffect(() => {
    if (ISO_IDS.includes(activeScreen)) setIsoOpen(true);
    if (LEY_IDS.includes(activeScreen)) setLeyOpen(true);
    // Si estamos en móvil y cambiamos de pantalla, cerramos el menú
    if (isMobile && setMobileMenuOpen) setMobileMenuOpen(false);
  }, [activeScreen, isMobile]);
  
  const role = user?.role;
  const superadminEnOrg = role === 'superadmin' && !!impersonatedOrg;
  const superadminPlataforma = role === 'superadmin' && !impersonatedOrg;
  
  const DASH      = ['superadmin', 'owner', 'admin', 'manager', 'auditor', 'dpo'];
  const ISO_MANAGE = ['superadmin', 'owner', 'admin', 'manager'];
  const ISO_VIEW   = ['superadmin', 'owner', 'admin', 'manager', 'auditor'];
  const LEY        = ['superadmin', 'owner', 'admin', 'dpo'];
  const MANAGE_USERS = ['superadmin', 'owner', 'admin'];
  const PLATFORM = ['superadmin'];

  const navItems = [
    { id: 'dashboard', label: l.dashboard, icon: LayoutDashboard, roles: DASH, group: 'general' },
    { id: 'gap-analysis', label: l.gapAnalysis, icon: Search, roles: ISO_VIEW, group: 'general' },
    { id: 'doc-generator', label: l.docGenerator, icon: FilePlus2, roles: ISO_MANAGE, group: 'comun' },
    { id: 'risk-map', label: l.riskMap, icon: AlertTriangle, roles: ISO_MANAGE, group: 'comun' },
    { id: 'predictive', label: language === 'es' ? 'Análisis Predictivo IA' : 'AI Predictive Analysis', icon: BrainCircuit, roles: ISO_MANAGE, group: 'comun' },
    { id: 'evidence', label: l.evidenceCenter, icon: Database, roles: ISO_VIEW, group: 'comun' },
    { id: 'documents', label: l.documents, icon: FileText, roles: DASH, group: 'comun' },
    { id: 'audit-room', label: l.auditRoom, icon: FileCheck, roles: ISO_VIEW, group: 'iso' },
    { id: 'assessment', label: language === 'es' ? 'Evaluación ISO' : 'ISO Assessment', icon: ClipboardList, roles: ISO_VIEW, group: 'iso' },
    { id: 'treatments', label: language === 'es' ? 'Tratamientos (RoPA)' : 'Treatments (RoPA)', icon: ClipboardList, roles: LEY, group: 'ley' },
    { id: 'consents', label: language === 'es' ? 'Consentimientos' : 'Consents', icon: ClipboardCheck, roles: LEY, group: 'ley' },
    { id: 'data-requests', label: language === 'es' ? 'Solicitudes de Titulares' : 'Data Requests', icon: Inbox, roles: LEY, group: 'ley' },
    { id: 'breaches', label: language === 'es' ? 'Gestión de Brechas' : 'Data Breaches', icon: ShieldAlert, roles: LEY, group: 'ley' },
    { id: 'vendors', label: language === 'es' ? 'Proveedores' : 'Vendors', icon: Building2, roles: LEY, group: 'ley' },
    { id: 'impact', label: language === 'es' ? 'Evaluación de Impacto' : 'Impact Assessment', icon: Shield, roles: LEY, group: 'ley' },
    { id: 'user-management', label: l.userManagement, icon: Users, roles: MANAGE_USERS, group: 'general' },
    { id: 'organizations', label: language === 'es' ? 'Gestión de Empresas' : 'Organizations', icon: Building2, roles: PLATFORM, group: 'general' },
    { id: 'employee-portal', label: language === 'es' ? 'Portal de Empleados' : 'Employee Portal', icon: UserCircle, roles: null, group: 'general' },
  ].filter(item => {
    if (superadminPlataforma) return ['organizations', 'user-management'].includes(item.id);
    if (superadminEnOrg) return item.id !== 'organizations';
    return !item.roles || item.roles.includes(role);
  });

  // Estilos base de la barra lateral (varía si es móvil o escritorio)
  const sidebarStyles = {
    width: isMobile ? '280px' : (sidebarCollapsed ? '80px' : '260px'),
    background: t.sidebarBg,
    backdropFilter: 'blur(20px)',
    borderRight: `1px solid ${t.border}`,
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
    position: isMobile ? 'fixed' : 'relative',
    top: 0,
    bottom: 0,
    left: isMobile && !mobileMenuOpen ? '-100%' : '0',
    zIndex: 9999,
    height: '100vh',
    boxShadow: isMobile && mobileMenuOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none'
  };

  return (
    <>
      {/* Overlay oscuro para cerrar el menú en móvil al hacer clic afuera */}
      {isMobile && mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
        />
      )}

      <aside style={sidebarStyles}>
        {/* Logo y Botón Cerrar (en móvil) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/LogoNormia.png" alt="NormIA" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
            {(!sidebarCollapsed || isMobile) && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '20px' }}>NormIA</div>
                <div style={{ fontSize: '11px', color: t.textDim, textTransform: 'lowercase', letterSpacing: '1px' }}>Plataforma</div>
              </div>
            )}
          </div>
          {isMobile && (
            <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: t.textDim, cursor: 'pointer' }}>
              <X size={24} />
            </button>
          )}
        </div>

        {/* Buscador (Cmd+K) */}
        {(!sidebarCollapsed || isMobile) && setCommandPaletteOpen && (
          <button 
            onClick={() => { setCommandPaletteOpen(true); if(isMobile) setMobileMenuOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.textDim, fontSize: '13px', cursor: 'pointer', marginBottom: '20px', width: '100%', textAlign: 'left' }}
          >
            <Search size={16} />
            <span style={{ flex: 1 }}>{language === 'es' ? 'Buscar...' : 'Search...'}</span>
            {!isMobile && <kbd style={{ padding: '2px 6px', background: t.hoverBg || 'rgba(0,0,0,0.05)', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>⌘K</kbd>}
          </button>
        )}

        {/* Botón Volver (Superadmin) */}
        {superadminEnOrg && (
          <div style={{ marginBottom: '16px' }}>
            {(!sidebarCollapsed || isMobile) && (
              <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '8px', padding: '0 4px' }}>
                Viendo empresa: <strong style={{ color: t.text }}>{impersonatedOrg.nombre}</strong>
              </div>
            )}
            <button
              onClick={() => exitOrg()}
              title="Volver al panel de plataforma"
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: (sidebarCollapsed && !isMobile) ? '12px' : '10px 14px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: '13px', justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start' }}
            >
              <ChevronLeft size={18} />
              {(!sidebarCollapsed || isMobile) && <span>Volver a plataforma</span>}
            </button>
          </div>
        )}

        {/* Navegación (Enlaces) */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {(() => {
            const renderNavButton = (item, extraStyle = {}) => {
              const isActive = activeScreen === item.id;
              return (
                <button key={item.id} onClick={() => setActiveScreen(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: (sidebarCollapsed && !isMobile) ? '12px' : '12px 16px', marginBottom: '4px', background: isActive ? 'rgba(0, 74, 198, 0.15)' : 'transparent', border: 'none', borderRadius: '12px', color: isActive ? '#004ac6' : t.textMuted, cursor: 'pointer', transition: 'all 0.2s ease', justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', ...extraStyle }}>
                  <item.icon size={20} />
                  {(!sidebarCollapsed || isMobile) && <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
                </button>
              );
            };

            const renderGroupHeader = (label, isOpen, toggle) => (
              <button
                onClick={toggle}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', marginBottom: '4px', marginTop: '12px', background: 'transparent', border: 'none', color: t.textDim, cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s ease' }}
              >
                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }} />
                <span>{label}</span>
              </button>
            );

            const generalTop = navItems.filter(i => i.group === 'general' && ['dashboard', 'gap-analysis'].includes(i.id));
            const comunItems = navItems.filter(i => i.group === 'comun');
            const isoItems   = navItems.filter(i => i.group === 'iso');
            const leyItems   = navItems.filter(i => i.group === 'ley');
            const generalBottom = navItems.filter(i => i.group === 'general' && !['dashboard', 'gap-analysis', 'employee-portal'].includes(i.id));
            const employeePortal = navItems.find(i => i.id === 'employee-portal');

            return (
              <>
                {generalTop.map(item => renderNavButton(item))}

                {comunItems.length > 0 && (
                  <>
                    {(!sidebarCollapsed || isMobile) && renderGroupHeader('General', comunOpen, () => setComunOpen(!comunOpen))}
                    <div style={{ maxHeight: (sidebarCollapsed && !isMobile) || comunOpen ? `${comunItems.length * 52}px` : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                      {comunItems.map(item => renderNavButton(item, (!sidebarCollapsed || isMobile) ? { paddingLeft: '28px' } : {}))}
                    </div>
                  </>
                )}

                {isoItems.length > 0 && (
                  <>
                    {(!sidebarCollapsed || isMobile) && renderGroupHeader('ISO 27001', isoOpen, () => setIsoOpen(!isoOpen))}
                    <div style={{ maxHeight: (sidebarCollapsed && !isMobile) || isoOpen ? `${isoItems.length * 52}px` : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                      {isoItems.map(item => renderNavButton(item, (!sidebarCollapsed || isMobile) ? { paddingLeft: '28px' } : {}))}
                    </div>
                  </>
                )}

                {leyItems.length > 0 && (
                  <>
                    {(!sidebarCollapsed || isMobile) && renderGroupHeader('Ley 21.719', leyOpen, () => setLeyOpen(!leyOpen))}
                    <div style={{ maxHeight: (sidebarCollapsed && !isMobile) || leyOpen ? `${leyItems.length * 52}px` : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                      {leyItems.map(item => renderNavButton(item, (!sidebarCollapsed || isMobile) ? { paddingLeft: '28px' } : {}))}
                    </div>
                  </>
                )}

                {generalBottom.map(item => renderNavButton(item))}

                {employeePortal && (() => {
                  const isActive = activeScreen === employeePortal.id;
                  return (
                    <button onClick={() => setActiveScreen(employeePortal.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: (sidebarCollapsed && !isMobile) ? '12px' : '12px 16px', marginBottom: '6px', marginTop: '16px', background: isActive ? 'rgba(0, 74, 198, 0.15)' : 'transparent', border: `1px dashed ${t.border}`, borderRadius: '12px', color: isActive ? '#004ac6' : t.textDim, cursor: 'pointer', justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start' }}>
                      <employeePortal.icon size={20} />
                      {(!sidebarCollapsed || isMobile) && <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}>{employeePortal.label}</span>}
                    </button>
                  );
                })()}
              </>
            );
          })()}
        </nav>

        {/* Botón contraer/expandir SOLO visible en escritorio */}
        {!isMobile && (
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ position: 'absolute', top: '50%', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: t.cardBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textDim }}>
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </aside>
    </>
  );
};

export default Sidebar;