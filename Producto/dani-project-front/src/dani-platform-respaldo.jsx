/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  Bell, Settings, LogOut, Globe, ChevronDown, Menu
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import NotificationCenter from './components/NotificationCenter';

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
import PredictiveScreen from './pages/PredictiveScreen';

export default function DaniPlatform() {
  const { logout, user, impersonatedOrg } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const platformMode = isSuperadmin && !impersonatedOrg;

  const {
    theme: t, language, setLanguage, darkMode
  } = useTheme();

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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [navParams, setNavParams] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = (screen, params = null) => {
    setActiveScreen(screen);
    setNavParams(params);
    setMobileMenuOpen(false);
    sessionStorage.setItem('dani_active_screen', screen);
  };

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' }
  ];

  return (
    <div
      className="normia-shell"
      style={{ minHeight: '100vh', background: t.bg, color: t.text, display: 'flex', position: 'relative' }}
    >
      {/* Sidebar gestiona el panel y el fondo oscuro en dispositivos móviles. */}
      <style>{`
        .normia-mobile-menu-button { display: none !important; }
        @media (max-width: 768px) {
          .normia-mobile-menu-button {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            flex: 0 0 44px;
            width: 44px;
            height: 44px;
            border-radius: 10px;
            cursor: pointer;
          }
          .normia-platform-header {
            padding: 10px 12px !important;
            gap: 6px !important;
            justify-content: space-between !important;
          }
          .normia-platform-content {
            padding: 16px 12px !important;
            min-width: 0;
            max-width: 100%;
            overflow-x: auto;
          }
        }
      `}</style>

      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={handleNavigate}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isMobile={isMobile}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main
        className="normia-platform-main"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}
      >
        <header
          className="normia-platform-header"
          style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderBottom: `1px solid ${t.border}`, zIndex: 10 }}
        >
          <button
            type="button"
            className="normia-mobile-menu-button"
            onClick={() => {
              setSidebarCollapsed(false);
              setMobileMenuOpen(true);
            }}
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
            style={{ background: t.inputBg, border: `1px solid ${t.border}`, color: t.text }}
          >
            <Menu size={22} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, cursor: 'pointer' }}
            >
              <Globe size={16} />
              <span>{languages.find(lang => lang.code === language)?.flag}</span>
              <ChevronDown size={14} />
            </button>
            {langDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '8px', minWidth: '160px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 100 }}>
                {languages.map((lang) => (
                  <button
                    type="button"
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setLangDropdownOpen(false); }}
                    style={{ width: '100%', display: 'flex', gap: '10px', padding: '10px', border: 'none', background: language === lang.code ? 'rgba(0, 74, 198, 0.1)' : 'transparent', color: t.text, cursor: 'pointer', borderRadius: '8px' }}
                  >
                    <span>{lang.flag}</span> <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, cursor: 'pointer', position: 'relative' }}
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <div style={{ position: 'absolute', top: '6px', right: '6px', width: '18px', height: '18px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white' }}>
                  {unreadNotifications}
                </div>
              )}
            </button>
            <NotificationCenter
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              onCountChange={setUnreadNotifications}
            />
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Configuración"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, cursor: 'pointer' }}
          >
            <Settings size={20} />
          </button>

          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: '#ef4444', cursor: 'pointer' }}
          >
            <LogOut size={20} />
          </button>
        </header>

        <div
          className="normia-platform-content"
          style={{ flex: '1 0 auto', minWidth: 0, padding: '32px 40px', overflow: 'visible', minHeight: 'calc(100vh - 78px)', boxSizing: 'border-box' }}
        >
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
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
