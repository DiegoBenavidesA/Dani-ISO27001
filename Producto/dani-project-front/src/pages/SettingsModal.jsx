// src/pages/SettingsModal.jsx
import React, { useState, useContext, useEffect } from 'react';
import {
  Settings, X, Key, Smartphone, Calendar, Globe, Monitor,
  Shield, Check, Eye, EyeOff, CheckCircle2, Database, Link,
  Sun, Moon, RefreshCw, AlertCircle
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { API_URL } from '../services/api';

const labels = {
  en: {
    settings: 'Settings', password: 'Password', twoFA: 'Two-Factor Auth',
    language: 'Language', appearance: 'Appearance', auditCycle: 'Audit Cycle',
    integrations: 'API Integrations', erpUrl: 'ERP Base URL', erpApiKey: 'API Key / Token',
    testConnection: 'Test Connection', integrationDesc: 'Connect to external ERPs (e.g. SAP, Buk) to synchronize data automatically.',
    changePassword: 'Change Password', currentPassword: 'Current Password',
    newPassword: 'New Password', confirmPassword: 'Confirm Password',
    passwordRequirements: 'Min. 8 characters',
    updatePassword: 'Update Password', twoFactorAuth: 'Two-Factor Authentication',
    twoFADescription: 'Records your 2FA preference (informational — enforcement is managed server-side)',
    enabled: 'Enabled', disabled: 'Disabled',
    defaultLanguage: 'Default Language', languageDescription: 'Choose your preferred language',
    screenMode: 'Screen Mode', appearanceDescription: 'Customize how Dani looks',
    darkMode: 'Dark Mode', lightMode: 'Light Mode',
    darkModeDesc: 'Easier on the eyes in low light', lightModeDesc: 'Better visibility in bright environments',
    auditCycleTitle: 'Audit Cycle Day', auditCycleDescription: 'Day of month when internal audit cycle begins',
    auditCycleDay: 'Cycle Start Day', auditCycleDayHelp: 'Monthly audit cycle will start on this day',
    saveChanges: 'Save Changes', cancel: 'Cancel', saved: 'Changes saved!',
    passwordUpdated: 'Password updated!', passwordMismatch: 'Passwords do not match',
    saving: 'Saving...'
  },
  es: {
    settings: 'Configuración', password: 'Contraseña', twoFA: 'Autenticación 2FA',
    language: 'Idioma', appearance: 'Apariencia', auditCycle: 'Ciclo de Auditoría',
    integrations: 'Integraciones API', erpUrl: 'URL Base del ERP', erpApiKey: 'API Key / Token',
    testConnection: 'Probar Conexión', integrationDesc: 'Conecta con ERPs externos (ej. SAP, Buk) para sincronizar datos automáticamente.',
    changePassword: 'Cambiar Contraseña', currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña', confirmPassword: 'Confirmar Contraseña',
    passwordRequirements: 'Mínimo 8 caracteres',
    updatePassword: 'Actualizar Contraseña', twoFactorAuth: 'Autenticación de Dos Factores',
    twoFADescription: 'Registra tu preferencia de 2FA (informativo — la activación real se gestiona en el servidor)',
    enabled: 'Activado', disabled: 'Desactivado',
    defaultLanguage: 'Idioma Predeterminado', languageDescription: 'Elige tu idioma preferido',
    screenMode: 'Modo de Pantalla', appearanceDescription: 'Personaliza cómo se ve Dani',
    darkMode: 'Modo Oscuro', lightMode: 'Modo Claro',
    darkModeDesc: 'Más cómodo en ambientes oscuros', lightModeDesc: 'Mejor visibilidad en ambientes claros',
    auditCycleTitle: 'Día del Ciclo de Auditoría', auditCycleDescription: 'Establece el día del mes del ciclo de auditoría',
    auditCycleDay: 'Día de Inicio', auditCycleDayHelp: 'El ciclo mensual comenzará este día',
    saveChanges: 'Guardar Cambios', cancel: 'Cancelar', saved: '¡Cambios guardados!',
    passwordUpdated: '¡Contraseña actualizada!', passwordMismatch: 'Las contraseñas no coinciden',
    saving: 'Guardando...'
  },
  pt: {
    settings: 'Configurações', password: 'Senha', twoFA: 'Autenticação 2FA',
    language: 'Idioma', appearance: 'Aparência', auditCycle: 'Ciclo de Auditoria',
    integrations: 'Integrações API', erpUrl: 'URL Base do ERP', erpApiKey: 'API Key / Token',
    testConnection: 'Testar Conexão', integrationDesc: 'Conecte-se a ERPs externos para sincronizar dados.',
    changePassword: 'Alterar Senha', currentPassword: 'Senha Atual',
    newPassword: 'Nova Senha', confirmPassword: 'Confirmar Senha',
    passwordRequirements: 'Mínimo 8 caracteres',
    updatePassword: 'Atualizar Senha', twoFactorAuth: 'Autenticação de Dois Fatores',
    twoFADescription: 'Registra sua preferência de 2FA (informativo)',
    enabled: 'Ativado', disabled: 'Desativado',
    defaultLanguage: 'Idioma Padrão', languageDescription: 'Escolha seu idioma preferido',
    screenMode: 'Modo de Tela', appearanceDescription: 'Personalize como o Dani aparece',
    darkMode: 'Modo Escuro', lightMode: 'Modo Claro',
    darkModeDesc: 'Mais confortável em ambientes escuros', lightModeDesc: 'Melhor visibilidade em ambientes claros',
    auditCycleTitle: 'Dia do Ciclo de Auditoria', auditCycleDescription: 'Defina o dia do mês do ciclo de auditoria',
    auditCycleDay: 'Dia de Início', auditCycleDayHelp: 'O ciclo mensal começará neste dia',
    saveChanges: 'Salvar', cancel: 'Cancelar', saved: 'Alterações salvas!',
    passwordUpdated: 'Senha atualizada!', passwordMismatch: 'As senhas não coincidem',
    saving: 'Salvando...'
  }
};

function SettingsModal({ onClose }) {
  const { darkMode, theme: t, language, setDarkMode, setLanguage } = useContext(ThemeContext);
  const l = labels[language] || labels.en;

  const [activeSection, setActiveSection] = useState('password');

  // Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Preferences & Integrations state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [auditCycleDay, setAuditCycleDay] = useState(1);
  const [erpUrl, setErpUrl] = useState('');
  const [erpApiKey, setErpApiKey] = useState('');

  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState({ type: '', text: '' });

  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsError, setPrefsError] = useState('');

  const sections = [
    { id: 'password', label: l.password, icon: Key },
    { id: '2fa', label: l.twoFA, icon: Smartphone },
    { id: 'auditCycle', label: l.auditCycle, icon: Calendar },
    { id: 'integrations', label: l.integrations, icon: Database },
    { id: 'language', label: l.language, icon: Globe }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' }
  ];

  // Cargar preferencias al abrir
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // 1. Cargar Preferencias
    fetch(`${API_URL}/api/users/me/preferences`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(prefs => {
        if (prefs.audit_cycle_day) setAuditCycleDay(prefs.audit_cycle_day);
        if (prefs.twofa_enabled !== undefined) setTwoFAEnabled(prefs.twofa_enabled);
      })
      .catch(() => {});

    // 2. Cargar Integraciones
    fetch(`${API_URL}/api/integrations/config`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.erp_url) setErpUrl(data.erp_url);
        if (data.erp_api_key) setErpApiKey(data.erp_api_key);
      })
      .catch(() => {});
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (newPwd !== confirmPwd) { setPwdError(l.passwordMismatch); return; }
    if (newPwd.length < 8) { setPwdError(l.passwordRequirements); return; }
    setPwdLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd })
      });
      const data = await res.json();
      if (!res.ok) { setPwdError(data.detail || 'Error'); return; }
      setPwdSuccess(true);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch { setPwdError('Error de conexión'); }
    finally { setPwdLoading(false); }
  };

  const handleTestConnection = async () => {
    if (!erpUrl) {
      setTestMessage({ type: 'error', text: 'Ingresa una URL válida primero.' });
      return;
    }
    setTestLoading(true);
    setTestMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/integrations/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ erp_url: erpUrl, erp_api_key: erpApiKey })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Fallo de conexión');
      setTestMessage({ type: 'success', text: data.message || 'Conexión exitosa' });
    } catch (err) {
      setTestMessage({ type: 'error', text: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveActiveSection = async () => {
    setPrefsSaving(true);
    setPrefsSaved(false);
    setPrefsError('');
    const token = localStorage.getItem('token');

    try {
      if (activeSection === 'integrations') {
        const res = await fetch(`${API_URL}/api/integrations/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ erp_url: erpUrl, erp_api_key: erpApiKey })
        });
        if (!res.ok) throw new Error('Error guardando integraciones');
      } else {
        const res = await fetch(`${API_URL}/api/users/me/preferences`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ audit_cycle_day: auditCycleDay, twofa_enabled: twoFAEnabled })
        });
        if (!res.ok) throw new Error('Error guardando preferencias');
      }

      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch (err) { 
      setPrefsError(err.message); 
    } finally { 
      setPrefsSaving(false); 
    }
  };

  const isSaveableSection = ['2fa', 'auditCycle', 'integrations'].includes(activeSection);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ width: '720px', maxHeight: '85vh', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} color="white" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: t.text }}>{l.settings}</h2>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '8px', background: t.inputBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{ width: '200px', borderRight: `1px solid ${t.border}`, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button key={section.id} onClick={() => { setActiveSection(section.id); setPrefsSaved(false); setPrefsError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: isActive ? 'rgba(0, 74, 198,0.15)' : 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', color: isActive ? '#004ac6' : t.textMuted, fontSize: '14px', fontWeight: isActive ? 600 : 500, textAlign: 'left' }}>
                  <Icon size={18} /> {section.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

            {/* Contraseña */}
            {activeSection === 'password' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: t.text }}>{l.changePassword}</h3>
                <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>{l.passwordRequirements}</p>
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: l.currentPassword, value: currentPwd, setter: setCurrentPwd, show: showCurrent, setShow: setShowCurrent },
                    { label: l.newPassword, value: newPwd, setter: setNewPwd, show: showNew, setShow: setShowNew },
                    { label: l.confirmPassword, value: confirmPwd, setter: setConfirmPwd, show: showConfirm, setShow: setShowConfirm }
                  ].map((field, i) => (
                    <div key={i}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '8px' }}>{field.label}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          required
                          type={field.show ? 'text' : 'password'}
                          value={field.value}
                          onChange={e => field.setter(e.target.value)}
                          style={{ width: '100%', padding: '12px 44px 12px 14px', background: t.inputBg, border: `1px solid ${pwdError ? '#ef4444' : t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <button type="button" onClick={() => field.setShow(!field.show)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textDim }}>
                          {field.show ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  {pwdError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px' }}>
                      <AlertCircle size={14} /> {pwdError}
                    </div>
                  )}
                  {pwdSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#004ac6', fontSize: '13px' }}>
                      <CheckCircle2 size={14} /> {l.passwordUpdated}
                    </div>
                  )}
                  <button type="submit" disabled={pwdLoading} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: pwdLoading ? 'wait' : 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', opacity: pwdLoading ? 0.7 : 1 }}>
                    {pwdLoading && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                    {l.updatePassword}
                  </button>
                </form>
              </div>
            )}

            {/* 2FA */}
            {activeSection === '2fa' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: t.text }}>{l.twoFactorAuth}</h3>
                <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>{l.twoFADescription}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: t.inputBg, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: twoFAEnabled ? 'rgba(0, 74, 198,0.15)' : t.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={20} color={twoFAEnabled ? '#004ac6' : t.textDim} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{l.twoFactorAuth}</div>
                      <div style={{ fontSize: '12px', color: twoFAEnabled ? '#004ac6' : t.textDim }}>{twoFAEnabled ? l.enabled : l.disabled}</div>
                    </div>
                  </div>
                  <button onClick={() => setTwoFAEnabled(!twoFAEnabled)} style={{ width: '52px', height: '28px', borderRadius: '14px', background: twoFAEnabled ? '#004ac6' : t.hoverBg, border: `1px solid ${twoFAEnabled ? '#004ac6' : t.border}`, cursor: 'pointer', position: 'relative' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: twoFAEnabled ? '27px' : '2px', transition: 'all 0.2s ease' }} />
                  </button>
                </div>
              </div>
            )}

            {/* Ciclo de auditoría */}
            {activeSection === 'auditCycle' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: t.text }}>{l.auditCycleTitle}</h3>
                <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>{l.auditCycleDescription}</p>
                <div style={{ padding: '20px', background: t.inputBg, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 74, 198,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} color="#004ac6" /></div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{l.auditCycleDay}: {auditCycleDay}</div>
                      <div style={{ fontSize: '12px', color: t.textDim }}>{l.auditCycleDayHelp}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <button key={day} onClick={() => setAuditCycleDay(day)} style={{ aspectRatio: '1', borderRadius: '8px', background: auditCycleDay === day ? '#004ac6' : 'transparent', border: `1px solid ${auditCycleDay === day ? '#004ac6' : t.border}`, color: auditCycleDay === day ? 'white' : t.text, fontSize: '13px', fontWeight: auditCycleDay === day ? 600 : 500, cursor: 'pointer' }}>{day}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* NUEVO: Integraciones API */}
            {activeSection === 'integrations' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: t.text }}>{l.integrations}</h3>
                <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>{l.integrationDesc}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '8px' }}>{l.erpUrl}</label>
                    <div style={{ position: 'relative' }}>
                      <Link size={16} color={t.textDim} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="url"
                        placeholder="https://api.tuempresa.com/v1"
                        value={erpUrl}
                        onChange={e => setErpUrl(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px 12px 40px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: t.textMuted, marginBottom: '8px' }}>{l.erpApiKey}</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={16} color={t.textDim} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••"
                        value={erpApiKey}
                        onChange={e => setErpApiKey(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px 12px 40px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <button type="button" onClick={handleTestConnection} disabled={testLoading} style={{ padding: '10px 16px', background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '13px', fontWeight: 600, cursor: testLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {testLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={16} />} 
                      {l.testConnection}
                    </button>
                    
                    {testMessage.text && (
                      <span style={{ fontSize: '13px', color: testMessage.type === 'error' ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {testMessage.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                        {testMessage.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Idioma */}
            {activeSection === 'language' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: t.text }}>{l.defaultLanguage}</h3>
                <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '24px' }}>{l.languageDescription}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {languages.map((lang) => (
                    <button key={lang.code} onClick={() => setLanguage(lang.code)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: language === lang.code ? 'rgba(0, 74, 198,0.1)' : t.inputBg, border: `2px solid ${language === lang.code ? '#004ac6' : t.border}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontSize: '28px' }}>{lang.flag}</span>
                      <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: language === lang.code ? '#004ac6' : t.text }}>{lang.name}</span>
                      {language === lang.code && <Check size={14} color="#004ac6" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px' }}>
            {prefsSaved && <span style={{ color: '#004ac6', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} /> {l.saved}</span>}
            {prefsError && <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} /> {prefsError}</span>}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>{l.cancel}</button>
            {isSaveableSection && (
              <button onClick={handleSaveActiveSection} disabled={prefsSaving} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #004ac6 0%, #003ea8 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: prefsSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: prefsSaving ? 0.7 : 1 }}>
                {prefsSaving && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {prefsSaving ? l.saving : l.saveChanges}
              </button>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

export default SettingsModal;