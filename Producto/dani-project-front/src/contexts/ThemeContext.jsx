/* eslint-disable */
import React, { createContext, useContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const themes = {
  dark: { 
    bg: 'linear-gradient(135deg, #0a0f1c 0%, #111827 50%, #0d1321 100%)', 
    cardBg: 'rgba(15, 23, 42, 0.6)', 
    sidebarBg: 'rgba(15, 23, 42, 0.8)', 
    text: '#e2e8f0', 
    textMuted: '#94a3b8', 
    textDim: '#64748b', 
    border: 'rgba(255,255,255,0.06)', 
    inputBg: 'rgba(255,255,255,0.05)', 
    hoverBg: 'rgba(255,255,255,0.03)' 
  },
  // Paleta única "Material 3" (claro) — diseño oficial de DANI GRC.
  // Tokens derivados del design system: primary #004ac6, tertiary #006243,
  // surface #f8f9ff, on-surface #0b1c30, etc.
  light: {
    bg: '#f8f9ff',                 // surface
    cardBg: '#ffffff',             // surface-container-lowest
    sidebarBg: '#ffffff',          // surface-container-lowest
    text: '#0b1c30',               // on-surface
    textMuted: '#434655',          // on-surface-variant
    textDim: '#565e74',            // secondary
    border: 'rgba(11,28,48,0.10)', // outline-variant suave
    inputBg: '#eff4ff',            // surface-container-low
    hoverBg: 'rgba(0,74,198,0.05)' // primary muy tenue
  },
  highContrast: { 
    bg: '#000000', cardBg: '#000000', sidebarBg: '#000000', text: '#ffffff', 
    textMuted: '#ffffff', textDim: '#cccccc', border: '#ffffff', inputBg: '#1a1a1a', hoverBg: '#333333' 
  }
};

export const translations = {
  en: {
    dashboard: 'Dashboard', gapAnalysis: 'Gap Analysis', docGenerator: 'Doc Generator', 
    riskMap: 'Risk Map', evidenceCenter: 'Evidence Center', documents: 'Documents', 
    auditRoom: 'Audit Room', settings: 'Settings', userManagement: 'User Management',
    commandCenter: 'Command Center', realtimeOverview: 'Real-time ISO 27001 compliance overview',
    synced: 'Synced', minAgo: 'min ago', exportReport: 'Export Report', healthScore: 'Health Score',
    ready: 'Ready', controlsImplemented: 'Controls Implemented', pendingActions: 'Pending Actions',
    highPriority: 'high priority', daysToAudit: 'Days to Audit', continueGapAnalysis: 'Continue Gap Analysis',
    completeAssessment: 'Complete your ISO 27001:2022 assessment', complete: 'complete', 
    continue: 'Continue', saveProgress: 'Save Progress', overallProgress: 'Overall Progress',
    phases: 'Phases', question: 'Question', of: 'of', critical: 'Critical', previous: 'Previous',
    soaPreview: 'SOA Preview', previewSoa: 'Preview SOA', highContrast: 'High Contrast'
    // ... añade aquí todas las que veas en el Gist que falten
  },
  es: {
    dashboard: 'Panel', gapAnalysis: 'Análisis de Brechas', docGenerator: 'Generador de Docs', 
    riskMap: 'Mapa de Riesgos', evidenceCenter: 'Centro de Evidencias', documents: 'Documentos', 
    auditRoom: 'Sala de Auditoría', settings: 'Configuración', userManagement: 'Gestión de Usuarios',
    commandCenter: 'Centro de Mando', realtimeOverview: 'Visión general de cumplimiento ISO 27001',
    synced: 'Sincronizado hace', minAgo: 'min', exportReport: 'Exportar Informe', healthScore: 'Puntuación de Salud',
    ready: 'Listo', controlsImplemented: 'Controles Implementados', pendingActions: 'Acciones Pendientes',
    highPriority: 'alta prioridad', daysToAudit: 'Días para Auditoría', continueGapAnalysis: 'Continuar Análisis',
    completeAssessment: 'Completa tu evaluación ISO 27001:2022', complete: 'completado', 
    continue: 'Continuar', saveProgress: 'Guardar', overallProgress: 'Progreso General',
    phases: 'Fases', question: 'Pregunta', of: 'de', critical: 'Crítico', previous: 'Anterior',
    soaPreview: 'Vista Previa SOA', previewSoa: 'Ver SOA', highContrast: 'Alto Contraste'
  },
  pt: {
    dashboard: 'Painel', gapAnalysis: 'Análise de Lacunas', docGenerator: 'Gerador de Docs', 
    riskMap: 'Mapa de Riscos', evidenceCenter: 'Centro de Evidências', documents: 'Documentos', 
    auditRoom: 'Sala de Auditoria', settings: 'Configurações', userManagement: 'Gestão de Usuários',
    commandCenter: 'Centro de Comando', realtimeOverview: 'Visão geral ISO 27001 em tempo real',
    synced: 'Sincronizado há', minAgo: 'min', exportReport: 'Exportar Relatório', healthScore: 'Pontuação de Saúde',
    ready: 'Pronto', controlsImplemented: 'Controles Implementados', pendingActions: 'Ações Pendentes',
    highPriority: 'alta prioridade', daysToAudit: 'Dias para Auditoria', continueGapAnalysis: 'Continuar Análise',
    completeAssessment: 'Complete sua avaliação ISO 27001:2022', complete: 'completo', 
    continue: 'Continuar', saveProgress: 'Salvar', overallProgress: 'Progresso Geral',
    phases: 'Fases', question: 'Pergunta', of: 'de', critical: 'Crítico', previous: 'Anterior',
    soaPreview: 'Prévia do SOA', previewSoa: 'Ver SOA', highContrast: 'Alto Contraste'
  }
};

export const ThemeProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('dani-language') || 'es');

  // Tema fijo: DANI GRC usa un único tema claro (Material 3). Se eliminaron
  // los modos oscuro/alto-contraste. Mantenemos las variables y setters como
  // no-op para no romper componentes que aún los referencian.
  const darkMode = false;
  const highContrast = false;
  const setDarkMode = () => {};
  const setHighContrast = () => {};
  const t = themes.light;

  const persistedSetLanguage = (val) => { localStorage.setItem('dani-language', val); setLanguage(val); };

  // Inyecta estilos globales para <select> según el tema activo.
  // Los <option> no admiten rgba, así que necesitan fondos opacos explícitos.
  useEffect(() => {
    let styleEl = document.getElementById('dani-theme-vars');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dani-theme-vars';
      document.head.appendChild(styleEl);
    }

    // Fondos sólidos para el popup de opciones (los rgba no funcionan en <option>)
    const optBg   = highContrast ? '#000000' : darkMode ? '#0f172a' : '#f8fafc';
    const optText  = highContrast ? '#ffffff' : darkMode ? '#e2e8f0' : '#1e293b';
    const optBgHov = highContrast ? '#1a1a1a' : darkMode ? '#1e293b' : '#e2e8f0';

    // Flecha SVG codificada en URL, coloreada según el tema
    const arrowHex = highContrast ? 'ffffff' : darkMode ? '94a3b8' : '64748b';
    const arrowSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23${arrowHex}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`;

    styleEl.textContent = `
      /* ── Selects globales DANI – se regeneran con cada cambio de tema ── */
      select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        border-color: transparent !important;
        outline: none !important;
        background-image: ${arrowSvg} !important;
        background-repeat: no-repeat !important;
        background-position: right 10px center !important;
        padding-right: 28px !important;
      }
      select:focus {
        outline: none !important;
        box-shadow: 0 0 0 1.5px rgba(0,74,198,0.45) !important;
      }
      select option {
        background-color: ${optBg};
        color: ${optText};
      }
      select option:hover,
      select option:focus,
      select option:checked {
        background-color: ${optBgHov};
        color: ${optText};
      }
    `;
  }, [darkMode, highContrast]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, language, setLanguage: persistedSetLanguage, highContrast, setHighContrast, theme: t, translations }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export const useTranslation = () => {
  const { language } = useTheme();
  return (key) => translations[language]?.[key] || translations.en[key] || key;
};