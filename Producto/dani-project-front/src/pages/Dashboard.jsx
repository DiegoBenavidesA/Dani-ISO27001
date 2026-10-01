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

      // Llamar al endpoint que reúne datos reales + análisis IA
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
      const M = 18; // margen
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
        setFill(16, 185, 129);
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
      setFill(16, 185, 129);
      doc.rect(0, 0, W, 60, 'F');

      // Logo textual
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      setColor(255, 255, 255);
      doc.text('DANI', M, 28);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Plataforma de Gestión ISO 27001', M, 37);

      // Línea decorativa
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
      setColor(16, 185, 129);
      doc.text('Evaluación del Estado del SGSI', M, y); lb(12);

      hr([180, 220, 200], 0.5);

      // Metadatos portada
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

      // Score destacado en portada
      const score = d.overall_score?.overall_score ?? 0;
      const scoreColor = score >= 85 ? [16, 185, 129] : score >= 70 ? [245, 158, 11] : [239, 68, 68];
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

      // ════════════════════════════════════════════════════════════════════
      // PÁGINA 2 — RESUMEN EJECUTIVO (IA)
      // ════════════════════════════════════════════════════════════════════
      newPage();
      sectionHeader('1', 'Resumen Ejecutivo');
      addWrappedText(report.executive_summary, M, W - M * 2, 9.5, 'normal', [30, 30, 50]);

      // ════════════════════════════════════════════════════════════════════
      // PÁGINA 3 — ANÁLISIS POR CLÁUSULA
      // ════════════════════════════════════════════════════════════════════
      if (y > 180) newPage(); else lb(8);
      sectionHeader('2', 'Análisis de Cumplimiento por Cláusula ISO 27001:2022');

      // Encabezado tabla
      const colCl = [M, M + 18, M + 50, M + 80, M + 108, M + 134, M + 155];
      setFill(16, 185, 129);
      doc.rect(M, y - 4, W - M * 2, 8, 'F');
      const hdrs = ['Cláusula', 'Nombre', 'Score', 'Brecha', 'Peso', 'Prioridad'];
      hdrs.forEach((h, i) => {
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setColor(255, 255, 255);
        doc.text(h, colCl[i], y + 1);
      });
      lb(9);

      const clauseNames = { '4':'Contexto', '5':'Liderazgo', '6':'Planificación', '7':'Soporte', '8':'Operación', '9':'Evaluación', '10':'Mejora' };
      const prioColor = { critical: [239,68,68], high: [245,158,11], medium: [59,130,246], low: [16,185,129] };

      for (let i = 0; i < (d.clause_gaps || []).length; i++) {
        const c = d.clause_gaps[i];
        if (y > 265) newPage();
        if (i % 2 === 0) { setFill(248, 253, 250); doc.rect(M, y-3, W-M*2, 7, 'F'); }
        const sc = c.current_score ?? 0;
        const scCol = sc >= 75 ? [16,185,129] : sc >= 50 ? [245,158,11] : [239,68,68];
        txt(c.clause_id, colCl[0], 8.5, 'bold', [20,20,40]);
        txt(c.clause_name || clauseNames[c.clause_id] || '—', colCl[1], 8, 'normal');
        txt(`${sc.toFixed(0)}%`, colCl[2], 8.5, 'bold', scCol);
        txt(`${(c.gap ?? 0).toFixed(0)} pts`, colCl[3], 8, 'normal', [239,68,68]);
        txt(`${((c.weight ?? 0)*100).toFixed(0)}%`, colCl[4], 8, 'normal');
        txt(c.priority || '—', colCl[5], 8, 'bold', prioColor[c.priority] || [80,80,80]);
        lb(7);
      }

      // Barra de progreso por cláusula
      lb(5);
      txt('Visualización de scores por cláusula:', M, 9, 'bold', [50, 50, 80]);
      lb(7);
      for (const c of (d.clause_gaps || [])) {
        if (y > 265) newPage();
        const sc = c.current_score ?? 0;
        const barW = W - M * 2 - 45;
        const filled = (sc / 100) * barW;
        const bColor = sc >= 75 ? [16,185,129] : sc >= 50 ? [245,158,11] : [239,68,68];
        txt(`C${c.clause_id}`, M, 8, 'bold', [60,60,80]);
        setFill(220, 220, 220); doc.rect(M + 12, y - 4, barW, 5, 'F');
        setFill(...bColor); doc.rect(M + 12, y - 4, filled, 5, 'F');
        txt(`${sc.toFixed(0)}%`, M + 14 + barW, 7.5, 'normal', [80,80,80]);
        lb(7);
      }

      // ════════════════════════════════════════════════════════════════════
      // PÁGINA 4 — ANÁLISIS TÉCNICO (IA) + RIESGOS
      // ════════════════════════════════════════════════════════════════════
      newPage();
      sectionHeader('3', 'Análisis Técnico de Brechas');
      addWrappedText(report.technical_analysis, M, W - M * 2, 9.5, 'normal', [30, 30, 50]);

      lb(5);
      sectionHeader('4', 'Mapa de Riesgos');

      const rs = d.risk_summary || {};
      // Resumen numérico
      const riskCols = [
        { label: 'Total', val: rs.total ?? 0, color: [80,80,80] },
        { label: 'Abiertos', val: rs.open ?? 0, color: [245,158,11] },
        { label: 'Críticos', val: rs.critical ?? 0, color: [239,68,68] },
        { label: 'Altos', val: rs.high ?? 0, color: [249,115,22] },
        { label: 'Medios', val: rs.medium ?? 0, color: [59,130,246] },
        { label: 'Bajos', val: rs.low ?? 0, color: [16,185,129] },
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

      // Top riesgos
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

      // ════════════════════════════════════════════════════════════════════
      // PÁGINA 5 — NO CONFORMIDADES (CAPA)
      // ════════════════════════════════════════════════════════════════════
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
        txt(String(val), M + 55, 9.5, 'bold', [16, 185, 129]);
        lb(6);
      }
      lb(5);

      if ((cs.list || []).length > 0) {
        const colC = [M, M + 24, M + 88, M + 108, M + 128, M + 150];
        setFill(16, 185, 129);
        doc.rect(M, y - 4, W - M * 2, 8, 'F');
        ['Código', 'Título', 'Prioridad', 'Estado', 'Progreso', 'Asignado'].forEach((h, i) => {
          doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setColor(255, 255, 255);
          doc.text(h, colC[i], y + 1);
        });
        lb(9);

        const statusLbl = { open: 'Abierta', inProgress: 'En Prog.', resolved: 'Resuelta', closed: 'Cerrada' };
        const prioLbl   = { high: 'Alta', medium: 'Media', low: 'Baja' };
        const prioC2    = { high: [239,68,68], medium: [245,158,11], low: [16,185,129] };

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
          txt(`${c.progress ?? 0}%`,        colC[4], 8, 'bold', [16,185,129]);
          txt(assignee,                     colC[5], 7.5, 'normal', [80,80,80]);
          lb(7);
        }
      } else {
        addWrappedText('Sin no conformidades registradas en el sistema.', M, W - M * 2, 9, 'italic', [120, 120, 120]);
      }

      // ════════════════════════════════════════════════════════════════════
      // PÁGINA 6 — RECOMENDACIONES TÉCNICAS (IA) + PLAN DE REMEDIACIÓN
      // ════════════════════════════════════════════════════════════════════
      newPage();
      sectionHeader('6', 'Recomendaciones Técnicas Prioritarias');

      // Parsear recomendaciones estructuradas del texto IA
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
          setDraw(16, 185, 129);
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

      // Plan de remediación
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

      // ── Última línea de cierre ──────────────────────────────────────────
      if (y > 265) newPage();
      lb(8);
      hr([16, 185, 129], 0.5);
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
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* HEADER PROFESIONAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: t.text }}>{tr('commandCenter')}</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>{tr('realtimeOverview')}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', fontSize: '13px', color: '#10b981' }}>
            <RefreshCw size={14} />
            {lastSync ? `Actualizado ${lastSync.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando...'}
          </div>
          <button
            onClick={generatePDFReport}
            style={{ padding: '10px 20px', background: '#10b981', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
          >
            <Download size={16} /> {tr('exportReport')}
          </button>
        </div>
      </div>

      {/* GRID DE ESTADÍSTICAS CON DISEÑO ORIGINAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {/* Salud con Gradiente */}
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: t.textDim, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>{tr('healthScore')}</div>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="12" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#hg)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(healthScore ?? 0) * 3.27} 327`} transform="rotate(-90 60 60)" />
              <defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs>
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>
                {isLoading ? '...' : `${healthScore ?? '--'}%`}
              </div>
              <div style={{ fontSize: '11px', color: t.textDim }}>{tr('ready')}</div>
            </div>
          </div>
          {/* Triple Score */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {[
              { label: 'Documentado', value: tripleScore?.doc ?? 0, color: '#10b981' },
              { label: 'Implementado', value: tripleScore?.impl ?? 0, color: '#3b82f6' },
              { label: 'Probado', value: tripleScore?.tested ?? 0, color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', color: t.textDim }}>{label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color }}>{isLoading ? '...' : `${value}%`}</span>
                </div>
                <div style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${isLoading ? 0 : value}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controles Implementados */}
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={18} color="#3b82f6" /></div>
            <span style={{ fontSize: '13px', color: t.textMuted }}>{tr('controlsImplemented')}</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '8px' }}>
            {isLoading ? '...' : controlStats ? controlStats.implemented : '--'}
            <span style={{ fontSize: '20px', color: t.textDim }}>/{isLoading ? '' : controlStats ? controlStats.total : '114'}</span>
          </div>
          <div style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${controlStats ? (controlStats.implemented / controlStats.total * 100).toFixed(1) : 0}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '3px' }} />
          </div>
        </div>

        {/* Acciones Pendientes */}
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={18} color="#f59e0b" /></div>
            <span style={{ fontSize: '13px', color: t.textMuted }}>{tr('pendingActions')}</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
            {isLoading ? '...' : (riskStats?.open_risks ?? '--')}
          </div>
          <div style={{ fontSize: '13px', color: t.textDim }}>
            {isLoading ? '' : `${(riskStats?.by_level?.critical ?? 0) + (riskStats?.by_level?.high ?? 0)} alto/crítico`}
          </div>
        </div>

        {/* Días para Auditoría */}
        <div style={{ background: t.cardBg, backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileCheck size={18} color="#a855f7" /></div>
            <span style={{ fontSize: '13px', color: t.textMuted }}>{tr('daysToAudit')}</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#a855f7', marginBottom: '4px' }}>
            {isLoading ? '...' : controlStats?.daysTo ?? '--'}
          </div>
          <div style={{ fontSize: '13px', color: t.textDim }}>
            {isLoading ? '' : controlStats?.certDate ?? 'Calculando...'}
          </div>
        </div>
      </div>

      {/* BANNER DE ACCESO RÁPIDO — solo roles con acceso a Gap Analysis */}
      {canAccessGapAnalysis && (
        <div
          onClick={() => onNavigate('gap-analysis')}
          style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', marginBottom: '24px' }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Search size={28} color="#10b981" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{tr('continueGapAnalysis')}</div>
            <div style={{ fontSize: '14px', color: t.textDim }}>{tr('completeAssessment')} • {isLoading ? '...' : `${healthScore ?? '--'}%`} {tr('complete')}</div>
          </div>
          <div style={{ padding: '12px 24px', background: '#10b981', borderRadius: '10px', color: 'white', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {tr('continue')} <ArrowRight size={16} />
          </div>
        </div>
      )}

      {/* COMPLIANCE INTEGRITY ALERTS */}
      {canAccessGapAnalysis && <PriorityActionsPanel onNavigate={onNavigate} darkMode={darkMode} />}

      {canAccessGapAnalysis && <ComplianceIntegrityPanel onNavigate={onNavigate} />}

      {/* PRE-AUDIT SELF-ASSESSMENT */}
      {canAccessGapAnalysis && <PreAuditPanel onNavigate={onNavigate} darkMode={darkMode} />}

      {/* RASTREADOR CAPA MODULAR COMPLETO — solo roles con acceso */}
      {canAccessGapAnalysis && <CAPATracker />}
    </div>
  );
};

export default DashboardScreen;