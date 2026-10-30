/* eslint-disable */
import React, { useState, useEffect, useContext } from 'react';
import { Shield, Search, Download, RefreshCw, Clock, ArrowRight, FileCheck, AlertTriangle, Plus } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import CAPATracker from '../components/CAPATracker';
import ComplianceIntegrityPanel from '../components/ComplianceIntegrityPanel';
import PreAuditPanel from '../components/PreAuditPanel';
import PriorityActionsPanel from '../components/PriorityActionsPanel';
import { getComplianceScore, riskAPI, capaAPI } from '../services/api';

const DashboardScreen = ({ onNavigate }) => {
  const { theme: t, language, translations, darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const tr = (key) => translations[language]?.[key] || translations.en[key] || key;
  const canAccessGapAnalysis = ['superadmin', 'owner', 'admin', 'manager', 'auditor', 'dpo'].includes(user?.role);

  const [healthScore, setHealthScore] = useState(null);
  const [tripleScore, setTripleScore] = useState(null);
  const [riskStats, setRiskStats] = useState(null);
  const [controlStats, setControlStats] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [scoreData, statsData] = await Promise.all([
          getComplianceScore(),
          riskAPI.getStatistics()
        ]);
        if (scoreData && !scoreData.detail) {
          setHealthScore(Math.round(scoreData.overall_score ?? scoreData.score ?? 0));
          if (scoreData.implemented_controls != null) {
            setControlStats({
              implemented: scoreData.implemented_controls,
              total: scoreData.total_controls,
              daysTo: scoreData.days_to_certification,
              certDate: scoreData.estimated_certification_date,
            });
          }
          setTripleScore({
            doc: scoreData.doc_score ?? 0,
            impl: scoreData.impl_score ?? 0,
            tested: scoreData.tested_score ?? 0,
          });
        }
        if (statsData && !statsData.detail) setRiskStats(statsData);
        setLastSync(new Date());
      } catch (_) {}
      finally { setIsLoading(false); }
    };
    loadDashboardData();
  }, []);

  const generatePDFReport = async () => {
    try {
      const { jsPDF } = await import('jspdf');

      const token = localStorage.getItem('token');
      const { API_URL } = await import('../services/api');
      const res = await fetch(`${API_URL}/api/reports/executive`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al obtener datos del informe');
      const report = await res.json();
      const d = report.data;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const M = 18; 
      let y = 0;
      let pageNum = 1;

      // ── Helpers ──────────────────────────────────────────────────────────
      const setColor = (...rgb) => { doc.setTextColor(...rgb); };
      const setFill  = (...rgb) => { doc.setFillColor(...rgb); };
      const setDraw  = (...rgb) => { doc.setDrawColor(...rgb); };

      const txt = (text, x, fontSize = 10, style = 'normal', color = [30, 30, 30]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', style);
        setColor(...color);
        doc.text(String(text ?? ''), x, y);
      };

      const lb = (h = 6) => { y += h; };

      const hr = (colorRGB = [200, 200, 200], thick = 0.3) => {
        setDraw(...colorRGB);
        doc.setLineWidth(thick);
        doc.line(M, y, W - M, y);
        lb(5);
      };

      const sectionHeader = (num, title) => {
        if (y > 255) newPage();
        lb(4);
        setFill(0, 74, 198);
        doc.rect(M, y - 4, W - M * 2, 9, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        setColor(255, 255, 255);
        doc.text(`${num}. ${title}`, M + 3, y + 2);
        lb(10);
      };

      const addWrappedText = (text, x, maxWidth, fontSize = 9, style = 'normal', color = [50, 50, 50]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', style);
        setColor(...color);
        const lines = doc.splitTextToSize(String(text ?? ''), maxWidth);
        for (const line of lines) {
          if (y > 270) newPage();
          doc.text(line, x, y);
          lb(fontSize * 0.45);
        }
        lb(2);
      };

      const footer = () => {
        setFill(240, 253, 250);
        doc.rect(0, 284, W, 13, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        setColor(100, 100, 100);
        doc.text('DANI ISO 27001 — Informe de Auditoría Interna · Confidencial', M, 290);
        doc.text(`Pág. ${pageNum}`, W - M - 10, 290);
        doc.text(`Generado: ${new Date().toLocaleString('es')}`, W / 2 - 18, 290);
      };

      const newPage = () => {
        footer();
        doc.addPage();
        pageNum++;
        y = M;
      };

      // ════════════════════════════════════════════════════════════════════
      // PÁGINA 1 — PORTADA
      // ════════════════════════════════════════════════════════════════════
      setFill(0, 74, 198);
      doc.rect(0, 0, W, 60, 'F');

      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      setColor(255, 255, 255);
      doc.text('DANI', M, 28);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Plataforma de Gestión ISO 27001', M, 37);

      setDraw(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(M, 42, W - M, 42);

      doc.setFontSize(9);
      doc.text(`ISO/IEC 27001:2022  ·  Sistema de Gestión de Seguridad de la Información`, M, 50);

      y = 80;
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      setColor(20, 20, 40);
      doc.text('INFORME DE AUDITORÍA INTERNA', M, y); lb(12);
      doc.setFontSize(15);
      setColor(0, 74, 198);
      doc.text('Evaluación del Estado del SGSI', M, y); lb(12);

      hr([180, 220, 200], 0.5);

      const meta = [
        ['Fecha de generación', new Date().toLocaleDateString('es', { year:'numeric', month:'long', day:'numeric' })],
        ['Preparado por',       report.generated_by || '—'],
        ['Modelo IA utilizado', report.ai_model || 'deepseek-chat'],
        ['Clasificación',       'Confidencial — Uso interno'],
        ['Versión',             '1.0'],
        ['Norma de referencia', 'ISO/IEC 27001:2022'],
      ];
      for (const [label, val] of meta) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        setColor(80, 80, 80);
        doc.text(label + ':', M, y);
        doc.setFont('helvetica', 'normal');
        setColor(20, 20, 40);
        doc.text(String(val), M + 55, y);
        lb(7);
      }
      lb(10);

      const score = d.overall_score?.overall_score ?? 0;
      const scoreColor = score >= 85 ? [0, 74, 198] : score >= 70 ? [245, 158, 11] : [239, 68, 68];
      setFill(...scoreColor);
      doc.roundedRect(M, y, 80, 28, 3, 3, 'F');
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      setColor(255, 255, 255);
      doc.text(`${score.toFixed(1)}%`, M + 8, y + 17);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Índice de Salud ISO 27001', M + 8, y + 24);

      setFill(245, 245, 245);
      doc.roundedRect(M + 85, y, 85, 28, 3, 3, 'F');
      const readiness = score >= 85 ? 'LISTO PARA CERTIFICACIÓN' : score >= 70 ? 'CASI LISTO' : score >= 50 ? 'EN PROGRESO' : 'ETAPA INICIAL';
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      setColor(...scoreColor);
      doc.text(readiness, M + 88, y + 10);
      doc.setFont('helvetica', 'normal');
      setColor(80, 80, 80);
      doc.text(`Controles: ${d.control_gaps?.implemented_controls ?? 0}/${d.control_gaps?.total_controls ?? 114}`, M + 88, y + 17);
      doc.text(`Umbral certificación: 85%`, M + 88, y + 23);

      footer();

      // PÁGINA 2 — RESUMEN EJECUTIVO (IA)
      newPage();
      sectionHeader('1', 'Resumen Ejecutivo');
      addWrappedText(report.executive_summary, M, W - M * 2, 9.5, 'normal', [30, 30, 50]);

      // PÁGINA 3 — ANÁLISIS POR CLÁUSULA
      if (y > 180) newPage(); else lb(8);
      sectionHeader('2', 'Análisis de Cumplimiento por Cláusula ISO 27001:2022');

      const colCl = [M, M + 18, M + 50, M + 80, M + 108, M + 134, M + 155];
      setFill(0, 74, 198);
      doc.rect(M, y - 4, W - M * 2, 8, 'F');
      const hdrs = ['Cláusula', 'Nombre', 'Score', 'Brecha', 'Peso', 'Prioridad'];
      hdrs.forEach((h, i) => {
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setColor(255, 255, 255);
        doc.text(h, colCl[i], y + 1);
      });
      lb(9);

      const clauseNames = { '4':'Contexto', '5':'Liderazgo', '6':'Planificación', '7':'Soporte', '8':'Operación', '9':'Evaluación', '10':'Mejora' };
      const prioColor = { critical: [239,68,68], high: [245,158,11], medium: [59,130,246], low: [0, 74, 198] };

      for (let i = 0; i < (d.clause_gaps || []).length; i++) {
        const c = d.clause_gaps[i];
        if (y > 265) newPage();
        if (i % 2 === 0) { setFill(248, 253, 250); doc.rect(M, y-3, W-M*2, 7, 'F'); }
        const sc = c.current_score ?? 0;
        const scCol = sc >= 75 ? [0, 74, 198] : sc >= 50 ? [245,158,11] : [239,68,68];
        txt(c.clause_id, colCl[0], 8.5, 'bold', [20,20,40]);
        txt(c.clause_name || clauseNames[c.clause_id] || '—', colCl[1], 8, 'normal');
        txt(`${sc.toFixed(0)}%`, colCl[2], 8.5, 'bold', scCol);
        txt(`${(c.gap ?? 0).toFixed(0)} pts`, colCl[3], 8, 'normal', [239,68,68]);
        txt(`${((c.weight ?? 0)*100).toFixed(0)}%`, colCl[4], 8, 'normal');
        txt(c.priority || '—', colCl[5], 8, 'bold', prioColor[c.priority] || [80,80,80]);
        lb(7);
      }

      // PÁGINA 4 — ANÁLISIS TÉCNICO (IA) + RIESGOS
      newPage();
      sectionHeader('3', 'Análisis Técnico de Brechas');
      addWrappedText(report.technical_analysis, M, W - M * 2, 9.5, 'normal', [30, 30, 50]);

      lb(5);
      sectionHeader('4', 'Mapa de Riesgos');

      const rs = d.risk_summary || {};
      const riskCols = [
        { label: 'Total', val: rs.total ?? 0, color: [80,80,80] },
        { label: 'Abiertos', val: rs.open ?? 0, color: [245,158,11] },
        { label: 'Críticos', val: rs.critical ?? 0, color: [239,68,68] },
        { label: 'Altos', val: rs.high ?? 0, color: [249,115,22] },
        { label: 'Medios', val: rs.medium ?? 0, color: [59,130,246] },
        { label: 'Bajos', val: rs.low ?? 0, color: [0, 74, 198] },
      ];
      const blockW = (W - M * 2) / riskCols.length;
      riskCols.forEach((rc, i) => {
        if (y > 265) newPage();
        const bx = M + i * blockW;
        setFill(...rc.color.map(v => Math.min(v + 180, 255)));
        doc.roundedRect(bx, y - 5, blockW - 2, 16, 2, 2, 'F');
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); setColor(...rc.color);
        doc.text(String(rc.val), bx + 3, y + 5);
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setColor(80, 80, 80);
        doc.text(rc.label, bx + 3, y + 10);
      });
      lb(22);

      if ((rs.top_risks || []).length > 0) {
        txt('Riesgos críticos y altos prioritarios:', M, 9, 'bold', [50, 50, 80]);
        lb(7);
        for (const r of rs.top_risks) {
          if (y > 265) newPage();
          const lvlColor = r.level?.includes('critical') || r.level?.includes('crítico') ? [239,68,68] : [249,115,22];
          setFill(...lvlColor);
          doc.rect(M, y - 4, 2, 6, 'F');
          txt(`[${(r.level || '').toUpperCase()}]`, M + 4, 8, 'bold', lvlColor);
          txt(r.title || '', M + 22, 8, 'bold', [20, 20, 40]);
          lb(5);
          if (r.description) addWrappedText(r.description, M + 4, W - M * 2 - 4, 8, 'normal', [80, 80, 80]);
          lb(2);
        }
      }

      // PÁGINA 5 — NO CONFORMIDADES (CAPA)
      newPage();
      sectionHeader('5', 'No Conformidades y Acciones Correctivas (CAPA)');

      const cs = d.capa_summary || {};
      const capaStats = [
        ['Total registradas', cs.total ?? 0],
        ['Abiertas', cs.open ?? 0],
        ['En progreso', cs.in_progress ?? 0],
        ['Resueltas', cs.resolved ?? 0],
        ['Cerradas', cs.closed ?? 0],
      ];
      for (const [lbl, val] of capaStats) {
        txt(lbl + ':', M, 9.5, 'normal');
        txt(String(val), M + 55, 9.5, 'bold', [0, 74, 198]);
        lb(6);
      }
      lb(5);

      if ((cs.list || []).length > 0) {
        const colC = [M, M + 24, M + 88, M + 108, M + 128, M + 150];
        setFill(0, 74, 198);
        doc.rect(M, y - 4, W - M * 2, 8, 'F');
        ['Código', 'Título', 'Prioridad', 'Estado', 'Progreso', 'Asignado'].forEach((h, i) => {
          doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setColor(255, 255, 255);
          doc.text(h, colC[i], y + 1);
        });
        lb(9);

        const statusLbl = { open: 'Abierta', inProgress: 'En Prog.', resolved: 'Resuelta', closed: 'Cerrada' };
        const prioLbl   = { high: 'Alta', medium: 'Media', low: 'Baja' };
        const prioC2    = { high: [239,68,68], medium: [245,158,11], low: [0, 74, 198] };

        for (let i = 0; i < cs.list.length; i++) {
          const c = cs.list[i];
          if (y > 265) newPage();
          if (i % 2 === 0) { setFill(248,253,250); doc.rect(M, y-3, W-M*2, 7, 'F'); }
          const title = (c.title || '').length > 32 ? c.title.slice(0, 29) + '…' : c.title;
          const assignee = (c.assignee || 'Sin asignar').length > 16 ? c.assignee.slice(0,13) + '…' : (c.assignee || 'Sin asignar');
          txt(c.nc_code || '—',            colC[0], 8, 'bold', [20,20,40]);
          txt(title,                        colC[1], 7.5, 'normal');
          txt(prioLbl[c.priority] || c.priority || '—', colC[2], 8, 'bold', prioC2[c.priority] || [80,80,80]);
          txt(statusLbl[c.status] || c.status || '—',   colC[3], 7.5, 'normal');
          txt(`${c.progress ?? 0}%`,        colC[4], 8, 'bold', [0, 74, 198]);
          txt(assignee,                     colC[5], 7.5, 'normal', [80,80,80]);
          lb(7);
        }
      } else {
        addWrappedText('Sin no conformidades registradas en el sistema.', M, W - M * 2, 9, 'italic', [120, 120, 120]);
      }

      // PÁGINA 6 — RECOMENDACIONES TÉCNICAS (IA)
      newPage();
      sectionHeader('6', 'Recomendaciones Técnicas Prioritarias');

      const rawRecs = report.recommendations_raw || '';
      const recBlocks = rawRecs.split(/RECOMENDACION_\d+:/i).filter(b => b.trim());
      if (recBlocks.length > 0) {
        for (let i = 0; i < recBlocks.length; i++) {
          if (y > 240) newPage();
          const block = recBlocks[i].trim();
          const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
          const titleLine = lines[0] || `Recomendación ${i + 1}`;
          const rest      = lines.slice(1);

          setFill(240, 253, 250);
          doc.roundedRect(M, y - 3, W - M * 2, 9 + rest.length * 5.5, 3, 3, 'F');
          setDraw(0, 74, 198);
          doc.setLineWidth(0.4);
          doc.roundedRect(M, y - 3, W - M * 2, 9 + rest.length * 5.5, 3, 3, 'S');

          txt(`${i + 1}. ${titleLine}`, M + 4, 10, 'bold', [16, 120, 100]);
          lb(7);
          for (const ln of rest) {
            const colon = ln.indexOf(':');
            if (colon > 0) {
              const key = ln.slice(0, colon).trim();
              const val = ln.slice(colon + 1).trim();
              txt(`${key}:`, M + 4, 8.5, 'bold', [80, 80, 80]);
              addWrappedText(val, M + 4 + doc.getStringUnitWidth(key + ': ') * 8.5 * 0.352 + 2, W - M * 2 - 10, 8.5, 'normal', [40, 40, 60]);
            } else {
              addWrappedText(ln, M + 4, W - M * 2 - 8, 8, 'normal', [60, 60, 80]);
            }
          }
          lb(6);
        }
      } else {
        addWrappedText(rawRecs, M, W - M * 2, 9, 'normal', [40, 40, 60]);
      }

      if (d.remediation_plan?.sprint_1) {
        if (y > 220) newPage();
        lb(5);
        sectionHeader('7', 'Plan de Remediación Estimado');
        const s1 = d.remediation_plan.sprint_1;
        const s2 = d.remediation_plan.sprint_2;
        txt('Sprint 1 (P0 – Controles Críticos)', M, 10, 'bold', [239, 68, 68]);
        lb(6);
        txt(`Duración: ${s1.duration_days} días | Horas estimadas: ${s1.total_hours}h`, M, 9, 'normal');
        lb(6);
        for (const ctrl of (s1.controls || [])) {
          txt(`• [${ctrl.id}] ${ctrl.title} — ${ctrl.hours}h (${ctrl.responsible})`, M + 3, 8.5, 'normal');
          lb(5.5);
        }
        lb(4);
        if (s2) {
          txt('Sprint 2 (P1 – Controles de Alta Prioridad)', M, 10, 'bold', [245, 158, 11]);
          lb(6);
          txt(`Duración: ${s2.duration_days} días | Horas estimadas: ${s2.total_hours}h`, M, 9, 'normal');
          lb(6);
          for (const ctrl of (s2.controls || [])) {
            txt(`• [${ctrl.id}] ${ctrl.title} — ${ctrl.hours}h (${ctrl.responsible})`, M + 3, 8.5, 'normal');
            lb(5.5);
          }
        }
        lb(4);
        txt(`Costo total estimado: USD ${(d.remediation_plan.estimated_cost_usd || 0).toLocaleString()}`, M, 9, 'bold', [80, 80, 80]);
        lb(6);
        txt(`Fecha estimada de completitud: ${new Date(d.remediation_plan.estimated_completion || Date.now()).toLocaleDateString('es')}`, M, 9, 'normal');
        lb(6);
      }

      if (y > 265) newPage();
      lb(8);
      hr([0, 74, 198], 0.5);
      addWrappedText(
        'Este informe ha sido generado automáticamente por el sistema DANI (Plataforma de Gestión ISO 27001) '
        + `combinando datos reales del SGSI con análisis narrativo del modelo ${report.ai_model}. `
        + 'El contenido refleja el estado del sistema a la fecha de generación y debe ser validado por el '
        + 'responsable del SGSI antes de su uso en procesos formales de auditoría.',
        M, W - M * 2, 8, 'italic', [100, 100, 100]
      );

      footer();
      doc.save(`DANI_Informe_ISO27001_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('No se pudo generar el informe: ' + err.message);
    }
  };

  return (
    <div className="dashboard-wrapper" style={{ animation: 'fadeIn 0.4s ease', padding: '0 8px', boxSizing: 'border-box' }}>
      
      {/* HEADER ADAPTADO */}
      <section className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px', color: t.text }}>{tr('commandCenter')}</h1>
          <p style={{ color: t.textDim, fontSize: '13px' }}>{tr('realtimeOverview')}</p>
        </div>
        
        <div className="dashboard-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(0, 74, 198, 0.1)', borderRadius: '8px', fontSize: '12px', color: '#004ac6' }}>
            <RefreshCw size={12} />
            {lastSync ? `Actualizado ${lastSync.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando...'}
          </div>
          <button
            onClick={generatePDFReport}
            className="btn-export"
            style={{ padding: '8px 16px', background: '#004ac6', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          >
            <Download size={14} /> {tr('exportReport')}
          </button>
        </div>
      </section>

      {/* KPI GRID ADAPTADO PARA MÓVIL Y DESKTOP */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Puntuación de Salud (Círculo Principal) */}
        <div style={{ background: t.cardBg, borderRadius: '16px', padding: '20px', border: `1px solid ${t.border}`, textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ fontSize: '11px', color: t.textDim, marginBottom: '16px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>{tr('healthScore')}</div>
          
          <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto' }}>
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="42" fill="none" stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="10" />
              <circle cx="48" cy="48" r="42" fill="none" stroke="url(#hg)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(healthScore ?? 0) * 2.64} 264`} transform="rotate(-90 48 48)" />
              <defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#004ac6" /><stop offset="100%" stopColor="#003ea8" /></linearGradient></defs>
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#004ac6', lineHeight: 1 }}>
                {isLoading ? '...' : `${healthScore ?? '--'}%`}
              </div>
              <div style={{ fontSize: '10px', color: t.textDim, marginTop: '2px', fontWeight: 600 }}>{tr('ready')}</div>
            </div>
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '0 16px' }}>
            {[
              { label: 'Documentado', value: tripleScore?.doc ?? 0, color: '#004ac6' },
              { label: 'Implementado', value: tripleScore?.impl ?? 0, color: '#3b82f6' },
              { label: 'Probado', value: tripleScore?.tested ?? 0, color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '11px', color: t.textDim, fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color }}>{isLoading ? '...' : `${value}%`}</span>
                </div>
                <div style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${isLoading ? 0 : value}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloque compacto (3 tarjetas secundarias) */}
        <div className="secondary-kpi-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ background: t.cardBg, borderRadius: '12px', padding: '16px', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div>
              <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 500, marginBottom: '2px' }}>{tr('controlsImplemented')}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>
                {isLoading ? '...' : controlStats ? controlStats.implemented : '--'}
                <span style={{ fontSize: '14px', color: t.textDim, fontWeight: 400 }}>/{isLoading ? '' : controlStats ? controlStats.total : '114'}</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="#3b82f6" />
            </div>
          </div>

          <div style={{ background: t.cardBg, borderRadius: '12px', padding: '16px', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div>
              <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 500, marginBottom: '2px' }}>{tr('pendingActions')}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b', lineHeight: 1 }}>
                {isLoading ? '...' : (riskStats?.open_risks ?? '--')}
              </div>
              <div style={{ fontSize: '10px', color: t.textDim, marginTop: '2px' }}>
                {isLoading ? '' : `${(riskStats?.by_level?.critical ?? 0) + (riskStats?.by_level?.high ?? 0)} alto/crítico`}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#f59e0b" />
            </div>
          </div>

          <div style={{ background: t.cardBg, borderRadius: '12px', padding: '16px', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div>
              <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 500, marginBottom: '2px' }}>{tr('daysToAudit')}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#a855f7', lineHeight: 1 }}>
                {isLoading ? '...' : controlStats?.daysTo ?? '--'}
              </div>
              <div style={{ fontSize: '10px', color: t.textDim, marginTop: '2px' }}>
                {isLoading ? '' : controlStats?.certDate ?? 'Calculando...'}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={20} color="#a855f7" />
            </div>
          </div>

        </div>
      </div>

      {/* BANNER DE ACCESO RÁPIDO ADAPTADO */}
      {canAccessGapAnalysis && (
        <div
          className="gap-banner"
          onClick={() => onNavigate('gap-analysis')}
          style={{ 
            background: 'linear-gradient(135deg, rgba(0, 74, 198, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)', 
            border: '1px solid rgba(0, 74, 198, 0.2)', 
            borderRadius: '16px', 
            padding: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            cursor: 'pointer', 
            marginBottom: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div className="banner-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 74, 198, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Search size={24} color="#004ac6" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px', color: t.text }}>{tr('continueGapAnalysis')}</div>
            <div style={{ fontSize: '12px', color: t.textDim }}>ISO 27001:2022 • {isLoading ? '...' : `${healthScore ?? '--'}%`} completado</div>
          </div>
          <div className="btn-continue" style={{ padding: '8px 16px', background: '#004ac6', borderRadius: '8px', color: 'white', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{tr('continue')}</span> <ArrowRight size={14} />
          </div>
        </div>
      )}

      {/* MÓDULOS DE ANÁLISIS */}
      <div className="modules-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {canAccessGapAnalysis && <PriorityActionsPanel onNavigate={onNavigate} darkMode={darkMode} />}
        {canAccessGapAnalysis && <ComplianceIntegrityPanel onNavigate={onNavigate} />}
        {canAccessGapAnalysis && <PreAuditPanel onNavigate={onNavigate} darkMode={darkMode} />}
        {canAccessGapAnalysis && <CAPATracker />}
      </div>

      {/* ESTILOS INYECTADOS PARA RESPONSIVE */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .dashboard-wrapper { padding: 8px !important; }
          .dashboard-header { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .dashboard-actions { justify-content: space-between; width: 100%; }
          .dashboard-actions > div { flex: 1; justify-content: center; }
          .btn-export { flex: 1; justify-content: center; }
          
          .kpi-grid { grid-template-columns: 1fr !important; }
          
          .gap-banner { flex-direction: column; text-align: center; padding: 16px !important; gap: 12px !important; }
          .gap-banner > div { align-items: center; }
          .banner-icon { margin: 0 auto; }
          .btn-continue { width: 100%; justify-content: center; }
          
          .modules-stack { gap: 16px !important; }
        }
      `}} />
    </div>
  );
};

export default DashboardScreen;