/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  Bell, Settings, LogOut, Globe, ChevronDown, 
  Menu, // IMPORTANTE: Icono de hamburguesa
} from 'lucide-react';
import PredictiveScreen from './pages/PredictiveScreen';

// IMPORTACIÓN DE CONTEXTOS Y COMPONENTES
import Sidebar from './components/Sidebar';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import NotificationCenter from './components/NotificationCenter';
import CommandPalette from './components/CommandPalette';

// IMPORTACIÓN DE PÁGINAS
import DashboardScreen from './pages/Dashboard';
import GapAnalysisScreen from './pages/GapAnalysisScreen';
import DocGeneratorScreen from './pages/DocGeneratorScreen';
import RiskMapScreen from './pages/RiskMapScreen';
import EvidenceCenterScreen from './pages/EvidenceCenterScreen';
import DocumentsScreen from './pages/DocumentsScreen';
import AuditRoomScreen from './pages/AuditRoomScreen';
import UserManagementScreen from './pages/UserManagementScreen';
import SettingsModal from './pages/SettingsModal';
import ChatDANI from './pages/ChatDANI';
import EmployeePortalScreen from './pages/EmployeePortal';
import TreatmentsScreen from './pages/TreatmentsScreen';
import ImpactScreen from './pages/ImpactScreen';
import OrganizationsScreen from './pages/OrganizationsScreen';

import VendorsScreen from './pages/VendorsScreen';
import ConsentsScreen from './pages/ConsentsScreen';
import DataRequestsScreen from './pages/DataRequestsScreen';
import BreachesScreen from './pages/BreachesScreen';
import AssessmentScreen from './pages/AssessmentScreen';

export default function DaniPlatform() {
  const { logout, user, impersonatedOrg } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const platformMode = isSuperadmin && !impersonatedOrg;
  
  const { 
    theme: t, language, setLanguage, darkMode, 
    translations
  } = useTheme();
  
  const l = translations[language];

  const initialScreen = platformMode
    ? 'organizations'
    : (user?.role === 'employee'
        ? 'employee-portal'
        : (sessionStorage.getItem('dani_active_screen') || 'dashboard'));
  const [activeScreen, setActiveScreen] = useState(initialScreen);

  useEffect(() => {
    if (isSuperadmin) {
      setActiveScreen(impersonatedOrg ? 'dashboard' : 'organizations');
    }
  }, [impersonatedOrg, isSuperadmin]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // NUEVO: ESTADOS PARA MÓVIL
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // Si la pantalla se hace grande, nos aseguramos de que el menú móvil desaparezca
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = (screen, params = null) => {
    setActiveScreen(screen);
    setNavParams(params);
    sessionStorage.setItem('dani_active_screen', screen);
    if (isMobile) setMobileMenuOpen(false); // Cierra el menú al navegar en celular
  };

  const [chatOpen, setChatOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [navParams, setNavParams] = useState(null);

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

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, display: 'flex', position: 'relative', overflowX: 'hidden' }}>
      
      {/* SIDEBAR ACTUALIZADO: Recibe props para móvil */}
      <Sidebar 
        activeScreen={activeScreen} 
        setActiveScreen={handleNavigate}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        setCommandPaletteOpen={setCommandPaletteOpen}
        isMobile={isMobile}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
        
        {/* CABECERA (HEADER) */}
        <header style={{ 
          padding: isMobile ? '12px 16px' : '16px 40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isMobile ? 'space-between' : 'flex-end', 
          gap: '8px', 
          borderBottom: `1px solid ${t.border}`, 
          zIndex: 10,
          background: t.bg
        }}>
          
          {/* BOTÓN HAMBURGUESA: Solo visible en móvil, se va a la izquierda */}
          {isMobile && (
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer' }}
            >
              <Menu size={20} />
            </button>
          )}

          {/* CONTENEDOR DE ICONOS DERECHOS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setLangDropdownOpen(!langDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '8px 10px' : '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer' }}>
                <Globe size={16} />
                <span>{languages.find(lang => lang.code === language)?.flag}</span>
                {!isMobile && <ChevronDown size={14} />}
              </button>
              {langDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '8px', minWidth: '160px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 100 }}>
                  {languages.map((lang) => (
                    <button key={lang.code} onClick={() => { setLanguage(lang.code); setLangDropdownOpen(false); }} style={{ width: '100%', display: 'flex', gap: '10px', padding: '10px', border: 'none', background: language === lang.code ? 'rgba(0, 74, 198, 0.1)' : 'transparent', color: t.text, cursor: 'pointer', borderRadius: '8px' }}>
                      <span>{lang.flag}</span> <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotificationsOpen(!notificationsOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer', position: 'relative' }}>
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <div style={{ position: 'absolute', top: '4px', right: '4px', width: '16px', height: '16px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white' }}>
                    {unreadNotifications}
                  </div>
                )}
              </button>
              <NotificationCenter isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} onCountChange={setUnreadNotifications} />
            </div>

            <button onClick={() => setSettingsOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer' }}>
              <Settings size={20} />
            </button>

            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: '#ef4444', cursor: 'pointer' }}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* CONTENEDOR PRINCIPAL */}
        <div style={{ 
          flex: '1 0 auto', 
          minWidth: 0, 
          padding: isMobile ? '0' : '32px 40px', 
          overflow: 'visible', 
          minHeight: 'calc(100vh - 78px)', 
          boxSizing: 'border-box' 
        }}>
          {activeScreen === 'dashboard' && <DashboardScreen onNavigate={handleNavigate} />}
          {activeScreen === 'gap-analysis' && <GapAnalysisScreen onNavigate={handleNavigate} />}
          {activeScreen === 'doc-generator' && <DocGeneratorScreen navParams={navParams} />}
          {activeScreen === 'risk-map' && <RiskMapScreen />}
          {activeScreen === 'evidence' && <EvidenceCenterScreen />}
          {activeScreen === 'documents' && <DocumentsScreen setActiveScreen={setActiveScreen} />}
          {activeScreen === 'audit-room' && <AuditRoomScreen />}
          {activeScreen === 'user-management' && <UserManagementScreen />}
          {activeScreen === 'vendors' && <VendorsScreen />}
          {activeScreen === 'consents' && <ConsentsScreen />}
          {activeScreen === 'data-requests' && <DataRequestsScreen />}
          {activeScreen === 'breaches' && <BreachesScreen />}
          {activeScreen === 'assessment' && <AssessmentScreen />}
          {activeScreen === 'employee-portal' && <EmployeePortalScreen />}
          {activeScreen === 'treatments' && <TreatmentsScreen onNavigate={handleNavigate} />}
          {activeScreen === 'impact' && <ImpactScreen navParams={navParams} onNavigate={handleNavigate} />}
          {activeScreen === 'organizations' && <OrganizationsScreen />}
          {activeScreen === 'predictive' && <PredictiveScreen />}
        </div>
      </main>

      <ChatDANI activeScreen={activeScreen} />
      
      {commandPaletteOpen && <CommandPalette isOpen={commandPaletteOpen} darkMode={darkMode} onClose={() => setCommandPaletteOpen(false)} onNavigate={handleNavigate} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

    </div>
  );
}