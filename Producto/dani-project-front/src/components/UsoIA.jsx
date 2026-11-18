import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Gauge } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { usoIAAPI } from '../services/api';

// Consumo de la IA (Groq) frente a sus límites por minuto y por día.
// El servidor entrega los valores de Groq; entre consultas, la pantalla los
// avanza segundo a segundo con el mismo ritmo con que Groq repone los tokens.
const CONSULTA_CADA_MS = 15000;

const formato = (n) => (n == null ? '—' : Math.round(n).toLocaleString('es-CL'));

function tiempo(s) {
  if (s == null) return '—';
  if (s <= 0) return 'ya';
  if (s < 60) return `${Math.ceil(s)} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${Math.round(s % 60)} s`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

const color = (pct) => (pct >= 90 ? '#dc2626' : pct >= 70 ? '#f59e0b' : '#16a34a');

// Avanza el bloque al segundo actual, igual que el servidor (reposición pareja).
function avanzar(bloque, pasado, tipo) {
  if (!bloque) return null;
  if (tipo === 'dia') {
    const usados = Math.max(0, bloque.usados - (bloque.se_recupera_por_minuto / 60) * pasado);
    return { ...bloque, usados, restantes: bloque.limite - usados, se_recupera_en_s: Math.max(0, bloque.se_recupera_en_s - pasado) };
  }
  const falta = Math.max(0, bloque.se_recupera_en_s - pasado);
  const restantes = bloque.se_recupera_en_s > 0
    ? bloque.restantes + (bloque.limite - bloque.restantes) * Math.min(1, pasado / bloque.se_recupera_en_s)
    : bloque.limite;
  return { ...bloque, restantes, usados: bloque.limite - restantes, se_recupera_en_s: falta };
}

function Barra({ etiqueta, bloque, t, ancho = 54 }) {
  const pct = bloque ? Math.min(100, (bloque.usados / bloque.limite) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '11px', color: t.textMuted, width: '34px' }}>{etiqueta}</span>
      <div style={{ width: `${ancho}px`, height: '6px', background: t.border, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color(pct), transition: 'width 0.8s linear' }} />
      </div>
      <span style={{ fontSize: '11px', color: t.text, width: '32px', textAlign: 'right' }}>{bloque ? `${Math.round(pct)}%` : '—'}</span>
    </div>
  );
}

function Detalle({ titulo, bloque, unidad, nota, t }) {
  const pct = bloque ? Math.min(100, (bloque.usados / bloque.limite) * 100) : 0;
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: t.text, marginBottom: '6px' }}>
        <span>{titulo}</span>
        <span>{bloque ? `${formato(bloque.usados)} / ${formato(bloque.limite)} ${unidad}` : 'Sin datos aún'}</span>
      </div>
      <div style={{ height: '8px', background: t.border, borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color(pct), transition: 'width 0.8s linear' }} />
      </div>
      {bloque && (
        <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '5px', lineHeight: 1.5 }}>
          Quedan {formato(bloque.restantes)} {unidad}. Se recupera por completo en {tiempo(bloque.se_recupera_en_s)}.
          {nota && <><br />{nota}</>}
        </div>
      )}
    </div>
  );
}

export default function UsoIA() {
  const { theme: t, darkMode } = useContext(ThemeContext);
  const [datos, setDatos] = useState(null);      // última respuesta del servidor
  const [recibido, setRecibido] = useState(0);   // cuándo llegó (reloj del navegador)
  const [, setTic] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState(null);
  const caja = useRef(null);

  const consultar = useCallback(async () => {
    try {
      const r = await usoIAAPI.get();
      setDatos(r); setRecibido(Date.now()); setError(null);
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    consultar();
    const cada = setInterval(() => { if (!document.hidden) consultar(); }, CONSULTA_CADA_MS);
    const reloj = setInterval(() => setTic((x) => x + 1), 1000);
    return () => { clearInterval(cada); clearInterval(reloj); };
  }, [consultar]);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrar = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const pasado = datos ? (Date.now() - recibido) / 1000 : 0;
  const minuto = avanzar(datos?.minuto, pasado, 'minuto');
  const dia = avanzar(datos?.dia, pasado, 'dia');
  const solicitudes = avanzar(datos?.solicitudes_dia, pasado, 'minuto');
  const sincronizado = datos?.dia?.sincronizado_con_groq;

  return (
    <div ref={caja} className="normia-uso-ia" style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Consumo de la IA"
        aria-expanded={abierto}
        title="Consumo de la IA (Groq)"
        style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '44px', padding: '0 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, cursor: 'pointer' }}
      >
        <Gauge size={18} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <Barra etiqueta="Minuto" bloque={minuto} t={t} />
          <Barra etiqueta="Día" bloque={dia} t={t} />
        </div>
      </button>

      {abierto && (
        <div role="dialog" aria-label="Consumo de la IA" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '340px', background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 100 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: t.text, marginBottom: '12px' }}>Consumo de la IA (Groq)</div>
          {error && <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '10px' }}>{error}</div>}
          <Detalle titulo="Tokens por minuto" unidad="tokens" bloque={minuto} t={t}
            nota={minuto ? 'Valor informado por Groq en la última llamada.' : null} />
          <Detalle titulo="Tokens por día" unidad="tokens" bloque={dia} t={t}
            nota={`Groq repone ${formato(datos?.dia?.se_recupera_por_minuto)} tokens por minuto. ${sincronizado
              ? `Sincronizado con Groq el ${new Date(sincronizado * 1000).toLocaleString('es-CL')}.`
              : 'Estimado con las llamadas de la plataforma; se sincroniza con Groq si se alcanza el límite.'}`} />
          <Detalle titulo="Solicitudes por día" unidad="solicitudes" bloque={solicitudes} t={t} />
          {!minuto && <div style={{ fontSize: '12px', color: t.textMuted }}>Los valores por minuto aparecen después de la primera llamada a la IA.</div>}
        </div>
      )}
      <style>{`@media (max-width: 768px) { .normia-uso-ia { display: none; } }`}</style>
    </div>
  );
}
