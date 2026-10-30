
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

export default function DaniPlatform() {
  const { logout, user, impersonatedOrg } = useAuth();

  const isSuperadmin = user?.role === 'superadmin';
  const platformMode = isSuperadmin && !impersonatedOrg;

  const {
    theme: t, language, setLanguage, darkMode
  } = useTheme();

  // Pantalla inicial según el rol
  const initialScreen = platformMode
    ? 'organizations'
    : (user?.role === 'employee'
      ? 'employee-portal'
      : (sessionStorage.getItem('dani_active_screen') || 'dashboard'));

  const [activeScreen, setActiveScreen] = useState(initialScreen);

  useEffect(() => {
    if (isSuperadmin) {
      setActiveScreen(
        impersonatedOrg ? 'dashboard' : 'organizations'
      );
    }
  }, [impersonatedOrg, isSuperadmin]);

  // Estados de navegación
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [navParams, setNavParams] = useState(null);

  // Navegar y cerrar automáticamente el menú móvil
  const handleNavigate = (screen, params = null) => {
    setActiveScreen(screen);
    setNavParams(params);
    setMobileMenuOpen(false);
    sessionStorage.setItem('dani_active_screen', screen);
  };

  // Permitir cerrar el menú con Escape
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' }
  ];

  return (
    <div
      className={`normia-shell${mobileMenuOpen ? ' mobile-menu-open' : ''}`}
      style={{
        minHeight: '100vh',
        background: t.bg,
        color: t.text,
        display: 'flex',
        position: 'relative'
      }}
    >
      {/* Estilos responsive de la estructura general */}
      <style>{`
        .normia-mobile-menu-button,
        .normia-mobile-backdrop {
          display: none;
        }

        @media (max-width: 768px) {
          .normia-shell > aside {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: min(84vw, 320px) !important;
            height: 100dvh !important;
            box-sizing: border-box !important;
            overflow-y: auto !important;
            transform: translateX(-105%);
            transition: transform 0.25s ease !important;
            z-index: 1200 !important;
            box-shadow: 8px 0 28px rgba(0,0,0,0.16);
          }

          .normia-shell.mobile-menu-open > aside {
            transform: translateX(0);
          }

          .normia-mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            padding: 0;
            border: 0;
            background: rgba(0,0,0,0.48);
            z-index: 1190;
            cursor: pointer;
          }

          .normia-mobile-menu-button {
            display: inline-flex;
            flex: 0 0 44px;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 10px;
            cursor: pointer;
          }

          .normia-platform-main {
            width: 100%;
            min-width: 0;
          }

          .normia-platform-header {
            padding: 10px 12px !important;
            gap: 6px !important;
            justify-content: space-between !important;
          }

          .normia-platform-content {
            padding: 16px 12px !important;
            max-width: 100%;
            min-width: 0;
            overflow-x: auto !important;
          }

          .normia-shell > aside > button:last-child {
            display: none !important;
          }
        }
      `}</style>

      {/* Fondo oscuro al abrir el menú */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="normia-mobile-backdrop"
          aria-label="Cerrar menú de navegación"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar original, sin modificar sus funcionalidades */}
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={handleNavigate}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      <main
        className="normia-platform-main"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh'
        }}
      >
        {/* Encabezado global */}
        <header
          className="normia-platform-header"
          style={{
            padding: '16px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            borderBottom: `1px solid ${t.border}`,
            zIndex: 10
          }}
        >
          {/* Botón visible solo en celulares */}
          <button
            type="button"
            className="normia-mobile-menu-button"
            onClick={() => {
              setSidebarCollapsed(false);
              setMobileMenuOpen(true);
            }}
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
            style={{
              background: t.inputBg,
              border: `1px solid ${t.border}`,
              color: t.text
            }}
          >
            <Menu size={22} />
          </button>

          {/* Selector de idioma */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: t.inputBg,
                border: `1px solid ${t.border}`,
                borderRadius: '10px',
                color: t.text,
                cursor: 'pointer'
              }}
            >
              <Globe size={16} />
              <span>
                {languages.find(lang => lang.code === language)?.flag}
              </span>
              <ChevronDown size={14} />
            </button>

            {langDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: darkMode ? '#1e293b' : '#ffffff',
                  border: `1px solid ${t.border}`,
                  borderRadius: '12px',
                  padding: '8px',
                  minWidth: '160px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  zIndex: 100
                }}
              >
                {languages.map((lang) => (
                  <button
                    type="button"
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      gap: '10px',
                      padding: '10px',
                      border: 'none',
                      background: language === lang.code
                        ? 'rgba(0, 74, 198, 0.1)'
                        : 'transparent',
                      color: t.text,
                      cursor: 'pointer',
                      borderRadius: '8px'
                    }}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notificaciones */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                background: t.inputBg,
                border: `1px solid ${t.border}`,
                borderRadius: '12px',
                color: t.text,
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <Bell size={20} />

              {unreadNotifications > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '18px',
                    height: '18px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'white'
                  }}
                >
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

          {/* Configuración */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Configuración"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              background: t.inputBg,
              border: `1px solid ${t.border}`,
              borderRadius: '12px',
              color: t.text,
              cursor: 'pointer'
            }}
          >
            <Settings size={20} />
          </button>

          {/* Cerrar sesión */}
          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              background: t.inputBg,
              border: `1px solid ${t.border}`,
              borderRadius: '12px',
              color: '#ef4444',
              cursor: 'pointer'
            }}
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Contenido dinámico de las páginas */}
        <div
          className="normia-platform-content"
          style={{
            flex: '1 0 auto',
            minWidth: 0,
            padding: '32px 40px',
            overflow: 'visible',
            minHeight: 'calc(100vh - 78px)',
            boxSizing: 'border-box'
          }}
        >
          {activeScreen === 'dashboard' && (
            <DashboardScreen onNavigate={handleNavigate} />
          )}

          {activeScreen === 'gap-analysis' && (
            <GapAnalysisScreen onNavigate={handleNavigate} />
          )}

          {activeScreen === 'doc-generator' && (
            <DocGeneratorScreen navParams={navParams} />
          )}

          {activeScreen === 'risk-map' && <RiskMapScreen />}

          {activeScreen === 'evidence' && <EvidenceCenterScreen />}

          {activeScreen === 'documents' && (
            <DocumentsScreen setActiveScreen={setActiveScreen} />
          )}

          {activeScreen === 'audit-room' && <AuditRoomScreen />}

          {activeScreen === 'user-management' && (
            <UserManagementScreen />
          )}

          {activeScreen === 'vendors' && <VendorsScreen />}

          {activeScreen === 'consents' && <ConsentsScreen />}

          {activeScreen === 'data-requests' && <DataRequestsScreen />}

          {activeScreen === 'breaches' && <BreachesScreen />}

          {activeScreen === 'assessment' && <AssessmentScreen />}

          {activeScreen === 'employee-portal' && (
            <EmployeePortalScreen />
          )}

          {activeScreen === 'treatments' && (
            <TreatmentsScreen onNavigate={handleNavigate} />
          )}

          {activeScreen === 'impact' && (
            <ImpactScreen
              navParams={navParams}
              onNavigate={handleNavigate}
            />
          )}

          {activeScreen === 'organizations' && (
            <OrganizationsScreen />
          )}
        </div>
      </main>

      {/* Asistente DANI */}
      <ChatDANI activeScreen={activeScreen} />

      {/* Ventana de configuración */}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
