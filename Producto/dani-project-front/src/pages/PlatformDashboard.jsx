import React, { useContext, useEffect, useState } from 'react';
import { Building2, Users, ShieldCheck, Scale } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { organizationsAPI } from '../services/api';
import UsoIA from '../components/UsoIA';

// Panel de la plataforma: lo ve solo el equipo de NormIA (superadmin fuera de
// una empresa). Pocos datos y los importantes: empresas, avance por marco y
// consumo de la IA.
const colorPct = (p) => (p >= 90 ? '#15803d' : p >= 70 ? '#2563eb' : p >= 50 ? '#b45309' : '#dc2626');

export default function PlatformDashboard() {
  const { theme: t } = useContext(ThemeContext);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    organizationsAPI.resumen().then(setDatos).catch((e) => setError(e.message));
  }, []);

  const card = { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '18px' };

  const kpi = (Icono, color, valor, etiqueta, detalle) => (
    <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icono size={20} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: t.text, lineHeight: 1.1 }}>{valor}</div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: t.textMuted }}>{etiqueta}</div>
        {detalle && <div style={{ fontSize: '11px', color: t.textDim, marginTop: '2px' }}>{detalle}</div>}
      </div>
    </div>
  );

  const ranking = (titulo, m) => (
    <section style={card} aria-label={titulo}>
      <h3 style={{ fontSize: '14px', margin: '0 0 4px', color: t.text }}>{titulo}</h3>
      <p style={{ fontSize: '11px', color: t.textDim, margin: '0 0 12px' }}>Las 5 empresas con mayor avance según su Análisis de Brechas.</p>
      {!m || m.top.length === 0 ? (
        <p style={{ fontSize: '13px', color: t.textDim, margin: 0 }}>Ninguna empresa ha evaluado este marco todavía.</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {m.top.map((e, i) => (
            <li key={e.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: t.text, marginBottom: '4px' }}>
                <span><strong>{i + 1}.</strong> {e.nombre}</span>
                <strong style={{ color: colorPct(e.pct) }}>{e.pct}%</strong>
              </div>
              <div style={{ height: '6px', background: t.inputBg, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${e.pct}%`, height: '100%', background: colorPct(e.pct) }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );

  const umbral = datos?.umbral_cumple ?? 90;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', color: t.text }}>
      <header>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Panel de la plataforma</h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: t.textDim }}>Resumen de todas las empresas. Solo lo ve el equipo de NormIA.</p>
      </header>

      {error && <div style={{ ...card, color: '#dc2626', fontSize: '13px' }}>No se pudo cargar el resumen: {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        {kpi(Building2, '#2563eb', datos ? datos.empresas_activas : '—', 'Empresas activas', datos ? `de ${datos.total_empresas} registradas` : null)}
        {kpi(Users, '#7c3aed', datos ? datos.usuarios_activos : '—', 'Usuarios activos')}
        {kpi(ShieldCheck, '#15803d', datos ? datos.iso27001.cumplen : '—', `Cumplen ISO 27001 (${umbral}% o más)`, datos ? `de ${datos.iso27001.evaluadas} que la evaluaron` : null)}
        {kpi(Scale, '#0d9488', datos ? datos.ley21719.cumplen : '—', `Cumplen la Ley 21.719 (${umbral}% o más)`, datos ? `de ${datos.ley21719.evaluadas} que la evaluaron` : null)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {ranking('Mayor avance en ISO 27001', datos?.iso27001)}
        {ranking('Mayor avance en la Ley 21.719', datos?.ley21719)}
      </div>

      <UsoIA panel />
    </div>
  );
}
