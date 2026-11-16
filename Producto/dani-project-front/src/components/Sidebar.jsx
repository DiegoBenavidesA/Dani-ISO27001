/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Search, FilePlus2, AlertTriangle, Database, FileText, FileCheck, Users, ChevronLeft, ChevronRight, ChevronDown, Shield, UserCircle, Building2, ClipboardCheck, Inbox, ShieldAlert, ClipboardList, BrainCircuit, ListChecks, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getDomainScores, getComplianceScore } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ activeScreen, setActiveScreen, sidebarCollapsed, setSidebarCollapsed, isMobile, mobileMenuOpen, setMobileMenuOpen }) => {
  const { theme: t, language, translations } = useTheme();
  const { user, impersonatedOrg, exitOrg } = useAuth();
  const l = translations[language];
  // El menú se ordena por etapa del trabajo (evaluar, documentar, auditar y
  // responder) y no por norma: casi todas las páginas sirven para ISO 27001 y
  // para la Ley 21.719. Las que son de un solo marco llevan una etiqueta.
  const GRUPOS = [
    { id: 'evaluar', label: language === 'es' ? 'Evaluar' : 'Assess' },
    { id: 'documentar', label: language === 'es' ? 'Documentar' : 'Document' },
    { id: 'auditar', label: language === 'es' ? 'Auditar y responder' : 'Audit and respond' },
  ];
  const [gruposAbiertos, setGruposAbiertos] = useState({ evaluar: true, documentar: true, auditar: true });

  useEffect(() => {

    const grupoActivo = { 'gap-analysis': 'evaluar', 'risk-map': 'evaluar', 'doc-generator': 'documentar', documents: 'documentar', evidence: 'documentar', 'audit-room': 'auditar', breaches: 'auditar' }[activeScreen];
    if (grupoActivo) setGruposAbiertos(p => (p[grupoActivo] ? p : { ...p, [grupoActivo]: true }));

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
    { id: 'gap-analysis', label: l.gapAnalysis, icon: Search, roles: ISO_VIEW, group: 'evaluar' },
    { id: 'risk-map', label: l.riskMap, icon: AlertTriangle, roles: ISO_MANAGE, group: 'evaluar' },
    { id: 'doc-generator', label: l.docGenerator, icon: FilePlus2, roles: ISO_MANAGE, group: 'documentar' },
    { id: 'documents', label: l.documents, icon: FileText, roles: DASH, group: 'documentar' },
    { id: 'evidence', label: l.evidenceCenter, icon: Database, roles: ISO_VIEW, group: 'documentar' },
    { id: 'audit-room', label: l.auditRoom, icon: FileCheck, roles: ISO_VIEW, group: 'auditar', marco: 'ISO 27001' },
    { id: 'breaches', label: language === 'es' ? 'Vulneraciones' : 'Breaches', icon: ShieldAlert, roles: LEY, group: 'auditar', marco: 'Ley 21.719' },
    { id: 'user-management', label: l.userManagement, icon: Users, roles: MANAGE_USERS, group: 'general' },
    { id: 'organizations', label: language === 'es' ? 'Gestión de Empresas' : 'Organizations', icon: Building2, roles: PLATFORM, group: 'general' },
    { id: 'questions', label: language === 'es' ? 'Preguntas' : 'Questions', icon: ListChecks, roles: PLATFORM, group: 'general' },
    { id: 'employee-portal', label: language === 'es' ? 'Portal de Empleados' : 'Employee Portal', icon: UserCircle, roles: null, group: 'general' },

  ].filter(item => {
    if (superadminPlataforma) return ['organizations', 'questions', 'user-management'].includes(item.id);
    // El catálogo de preguntas es global: se administra fuera de las empresas.
    if (superadminEnOrg) return !['organizations', 'questions'].includes(item.id);
    return !item.roles || item.roles.includes(role);

  });

  // Estilos base de la barra lateral (varía si es móvil o escritorio)

  const sidebarStyles = {

    width: isMobile ? '280px' : (sidebarCollapsed ? '80px' : '260px'),

    background: t.sidebarBg,

    backdropFilter: 'blur(20px)',

    borderRight: `1px solid ${t.border}`,

    padding: '18px 14px',

    display: 'flex',

    flexDirection: 'column',

    transition: 'all 0.3s ease',

    position: isMobile ? 'fixed' : 'sticky',

    alignSelf: 'flex-start',

    boxSizing: 'border-box',

    flexShrink: 0,

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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', padding: '0 8px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            <img src="/LogoNormia.png" alt="NormIA" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />

            {(!sidebarCollapsed || isMobile) && (

              <div>

                <div style={{ fontWeight: 700, fontSize: '18px' }}>NormIA</div>

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

        {/* Botón Volver (Superadmin) */}

        {superadminEnOrg && (

          <div style={{ marginBottom: '10px' }}>

            {(!sidebarCollapsed || isMobile) && (

              <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '6px', padding: '0 4px' }}>

                Viendo empresa: <strong style={{ color: t.text }}>{impersonatedOrg.nombre}</strong>

              </div>

            )}

            <button

              onClick={() => exitOrg()}

              title="Volver al panel de plataforma"

              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: (sidebarCollapsed && !isMobile) ? '10px' : '8px 12px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: '13px', justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start' }}

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

                <button key={item.id} onClick={() => setActiveScreen(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: (sidebarCollapsed && !isMobile) ? '10px' : '8px 12px', marginBottom: '2px', background: isActive ? 'rgba(0, 74, 198, 0.15)' : 'transparent', border: 'none', borderRadius: '10px', color: isActive ? '#004ac6' : t.textMuted, cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', ...extraStyle }}>

                  <item.icon size={18} style={{ flexShrink: 0 }} />

                  {(!sidebarCollapsed || isMobile) && <span style={{ flex: 1, minWidth: 0, fontSize: '13px', lineHeight: 1.3, fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}

                  {(!sidebarCollapsed || isMobile) && item.marco && (
                    <span style={{ flexShrink: 0, fontSize: '9px', fontWeight: 700, letterSpacing: '0.3px', padding: '2px 6px', borderRadius: '6px', background: t.inputBg, border: `1px solid ${t.border}`, color: t.textDim, whiteSpace: 'nowrap' }}>{item.marco}</span>
                  )}

                </button>

              );

            };

            const renderGroupHeader = (label, isOpen, toggle) => (

              <button

                onClick={toggle}

                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', marginBottom: '2px', marginTop: '8px', background: 'transparent', border: 'none', color: t.textDim, cursor: 'pointer', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s ease' }}

              >

                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }} />

                <span>{label}</span>
              </button>

            );

            const dashboard = navItems.find(i => i.id === 'dashboard');

            const generalBottom = navItems.filter(i => i.group === 'general' && !['dashboard', 'employee-portal'].includes(i.id));

            const employeePortal = navItems.find(i => i.id === 'employee-portal');

            const expandido = !sidebarCollapsed || isMobile;

            return (

              <>

                {dashboard && renderNavButton(dashboard)}

                {GRUPOS.map(grupo => {
                  const items = navItems.filter(i => i.group === grupo.id);
                  // Un grupo sin páginas para este rol no muestra su título.
                  if (items.length === 0) return null;
                  const abierto = !expandido || gruposAbiertos[grupo.id];
                  return (
                    <React.Fragment key={grupo.id}>
                      {expandido && renderGroupHeader(grupo.label, gruposAbiertos[grupo.id], () => setGruposAbiertos(p => ({ ...p, [grupo.id]: !p[grupo.id] })))}
                      <div style={{ maxHeight: abierto ? `${items.length * 52}px` : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                        {items.map(item => renderNavButton(item, expandido ? { paddingLeft: '22px' } : {}))}
                      </div>
                    </React.Fragment>
                  );
                })}

                {generalBottom.length > 0 && <div style={{ height: '8px' }} />}

                {generalBottom.map(item => renderNavButton(item))}

                {employeePortal && (() => {

                  const isActive = activeScreen === employeePortal.id;

                  return (

                    <button onClick={() => setActiveScreen(employeePortal.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: (sidebarCollapsed && !isMobile) ? '10px' : '8px 12px', marginBottom: '6px', marginTop: '12px', background: isActive ? 'rgba(0, 74, 198, 0.15)' : 'transparent', border: `1px dashed ${t.border}`, borderRadius: '12px', color: isActive ? '#004ac6' : t.textDim, cursor: 'pointer', justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start' }}>

                      <employeePortal.icon size={18} style={{ flexShrink: 0 }} />

                      {(!sidebarCollapsed || isMobile) && <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500 }}>{employeePortal.label}</span>}

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
