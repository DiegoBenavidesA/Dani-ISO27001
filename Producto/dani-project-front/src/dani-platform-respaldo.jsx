/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  Bell, Settings, LogOut, Sun, Moon, Globe, ChevronDown, 
  Contrast, Bot, LayoutDashboard, Search, FilePlus2, 
  AlertTriangle, Database, FileText, FileCheck, Users 
} from 'lucide-react';

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
import VendorsScreen from './pages/VendorsScreen';
import ConsentsScreen from './pages/ConsentsScreen';
import DataRequestsScreen from './pages/DataRequestsScreen';
import BreachesScreen from './pages/BreachesScreen';
import AssessmentScreen from './pages/AssessmentScreen';

export default function DaniPlatform() {
  const { logout } = useAuth();
  
  // Extraemos todo del Contexto Global
  const { 
    theme: t, language, setLanguage, darkMode, setDarkMode, 
    translations, highContrast, setHighContrast 
  } = useTheme();
  
  const l = translations[language];

  // ESTADOS DE NAVEGACIÓN Y UI
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [navParams, setNavParams] = useState(null);

  // Keyboard shortcut para Command Palette (Cmd+K / Ctrl+K)
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

  const handleNavigate = (screen, params = null) => {
    setActiveScreen(screen);
    setNavParams(params);
  };

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, display: 'flex', position: 'relative', overflow: 'hidden' }}>
      
      {/* Sidebar - Se encarga de la navegación lateral */}
      <Sidebar 
        activeScreen={activeScreen} 
        setActiveScreen={handleNavigate}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        setCommandPaletteOpen={setCommandPaletteOpen}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header Global */}
        <header style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderBottom: `1px solid ${t.border}`, zIndex: 10 }}>
          
          {/* Selector de Idioma */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setLangDropdownOpen(!langDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer' }}>
              <Globe size={16} />
              <span>{languages.find(lang => lang.code === language)?.flag}</span>
              <ChevronDown size={14} />
            </button>
            {langDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '8px', minWidth: '160px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 100 }}>
                {languages.map((lang) => (
                  <button key={lang.code} onClick={() => { setLanguage(lang.code); setLangDropdownOpen(false); }} style={{ width: '100%', display: 'flex', gap: '10px', padding: '10px', border: 'none', background: language === lang.code ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: t.text, cursor: 'pointer', borderRadius: '8px' }}>
                    <span>{lang.flag}</span> <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* High Contrast Toggle */}
          <button onClick={() => setHighContrast(!highContrast)} title="Alto Contraste" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: highContrast ? '#ffffff' : t.inputBg, border: `1px solid ${highContrast ? '#000000' : t.border}`, borderRadius: '12px', color: highContrast ? '#000000' : t.text, cursor: 'pointer' }}>
            <Contrast size={20} />
          </button>

          {/* Toggle Modo Oscuro */}
          <button onClick={() => setDarkMode(!darkMode)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', transform: darkMode ? 'translateY(0)' : 'translateY(-40px)', opacity: darkMode ? 1 : 0 }}>
              <Sun size={20} color="#f59e0b" />
            </div>
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', transform: darkMode ? 'translateY(40px)' : 'translateY(0)', opacity: darkMode ? 0 : 1 }}>
              <Moon size={20} color="#6366f1" />
            </div>
          </button>

          {/* Notificaciones */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, cursor: 'pointer', position: 'relative' }}>
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <div style={{ position: 'absolute', top: '6px', right: '6px', width: '18px', height: '18px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white' }}>
                  {unreadNotifications}
                </div>
              )}
            </button>
            <NotificationCenter isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} onCountChange={setUnreadNotifications} />
          </div>

          {/* Settings */}
          <button onClick={() => setSettingsOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, cursor: 'pointer' }}>
            <Settings size={20} />
          </button>

          {/* Cerrar Sesión */}
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: '#ef4444', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </header>

        {/* Contenido Dinámico de Pantallas */}
        <div style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
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
            
        </div>
      </main>

      {/* Componentes Flotantes y Modales */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{ position: 'fixed', bottom: '32px', right: '32px', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)', zIndex: 100 }}
        >
          <Bot size={28} color="white" />
        </button>
      )}

      <ChatDANI isOpen={chatOpen} onClose={() => setChatOpen(false)} activeScreen={activeScreen} />
      
      {commandPaletteOpen && <CommandPalette isOpen={commandPaletteOpen} darkMode={darkMode} onClose={() => setCommandPaletteOpen(false)} onNavigate={handleNavigate} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

    </div>
  );
}