import React, { useContext, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';

// =====================================================================
// RESULTADO DEL ANÁLISIS DE BRECHAS (cumplimiento + mapa de calor)
//
// Metodología (reglas fijas, reproducibles a mano; no las decide la IA):
// - Unidad de riesgo = TEMA (subtema del cuestionario), no la pregunta: con
//   cientos de preguntas, un mapa por pregunta se satura en 2-3 celdas.
// - Cumplimiento: Sí = 1, Parcial = 0,5, No / Sin evidencia = 0. Las preguntas
//   "No aplica" y las aún sin responder no cuentan.
// - Impacto (1-5): fijo por tema, según el daño posible a los titulares y la
//   gravedad de la infracción (ver IMPACTO_POR_TEMA).
// - Probabilidad (1-5): según el % de cumplimiento del tema (ver probabilidad()).
// - Prioridad = impacto × probabilidad.
// =====================================================================

const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Gana la primera regla cuya palabra clave aparece en el tema.
export const IMPACTO_POR_TEMA = [
  { impacto: 5, claves: ['menor', 'nino', 'categorias especiales', 'sensible', 'condena', 'brecha', 'vulneracion', 'seguridad'] },
  { impacto: 4, claves: ['licitud', 'consentimiento', 'derecho', 'informacion', 'transparencia', 'transferencia', 'decisiones individuales', 'perfiles', 'oposicion'] },
  { impacto: 3, claves: ['encargado', 'corresponsable', 'evaluacion de impacto', 'diseno', 'principio', 'identificacion', 'responsabilidad'] },
  { impacto: 2, claves: ['registro', 'delegado', 'gobernanza'] },
];
const IMPACTO_POR_DEFECTO = 3;

export const impactoDeTema = (tema) => {
  const t = sinAcentos(tema);
  const regla = IMPACTO_POR_TEMA.find((r) => r.claves.some((k) => t.includes(k)));
  return regla ? regla.impacto : IMPACTO_POR_DEFECTO;
};

export const probabilidad = (pct) => (pct >= 90 ? 1 : pct >= 70 ? 2 : pct >= 50 ? 3 : pct >= 25 ? 4 : 5);

const nivel = (score) => (
  score >= 15 ? { nombre: 'Crítico', color: '#dc2626', fondo: '#fee2e2' }
  : score >= 8 ? { nombre: 'Alto', color: '#ea580c', fondo: '#ffedd5' }
  : score >= 4 ? { nombre: 'Medio', color: '#b45309', fondo: '#fef3c7' }
  : { nombre: 'Bajo', color: '#15803d', fondo: '#dcfce7' }
);

/**
 * Calcula el resultado a partir de las fases del cuestionario.
 * valorDe(respuesta) -> 1 | 0.5 | 0 | null (null = sin responder)
 */
export function calcularResultado(phases, answers, noAplica, valorDe, impactoDe = impactoDeTema) {
  const temas = new Map();
  const grupos = [];
  let suma = 0, respondidas = 0, aplicables = 0, totalNA = 0;

  phases.forEach((fase) => {
    let gSuma = 0, gResp = 0;
    fase.questions.forEach((q) => {
      if (q.id in noAplica) { totalNA += 1; return; }
      aplicables += 1;
      const nombreTema = q.subtema || fase.name;
      if (!temas.has(nombreTema)) temas.set(nombreTema, { nombre: nombreTema, grupo: fase.name, faseId: fase.id, suma: 0, respondidas: 0, aplicables: 0, fallas: [] });
      const tema = temas.get(nombreTema);
      tema.aplicables += 1;
      const v = valorDe(answers[q.id]);
      if (v === null) return;
      suma += v; respondidas += 1; gSuma += v; gResp += 1;
      tema.suma += v; tema.respondidas += 1;
      if (v < 1) tema.fallas.push({ ...q, valor: v });
    });
    if (gResp > 0) grupos.push({ id: fase.id, nombre: fase.name, pct: Math.round((gSuma / gResp) * 100), respondidas: gResp });
  });

  const evaluados = [...temas.values()].filter((t) => t.respondidas > 0).map((t) => {
    const pct = Math.round((t.suma / t.respondidas) * 100);
    const impacto = impactoDe(t.nombre, t.faseId);
    const prob = probabilidad(pct);
    return { ...t, pct, impacto, prob, score: impacto * prob };
  }).sort((a, b) => b.score - a.score || b.fallas.length - a.fallas.length);

  return {
    pct: respondidas ? Math.round((suma / respondidas) * 100) : null,
    respondidas, aplicables, totalNA,
    grupos, temas: evaluados,
    sinEvaluar: [...temas.values()].filter((t) => t.respondidas === 0).length,
  };
}

// ISO 27001: el tema es el control y el impacto depende del dominio. Los
// controles tecnológicos exponen directamente la información; los de contexto,
// soporte, personas y físicos tienen un efecto más indirecto.
export const IMPACTO_ISO_POR_FASE = { tech: 5, org: 4, planning: 4, context: 3, support: 3, people: 3, phys: 3 };
export const impactoISO = (_tema, faseId) => IMPACTO_ISO_POR_FASE[faseId] || IMPACTO_POR_DEFECTO;

function ResultadoBrechas({ phases, answers, noAplica, aiResults, valorDe, marcoLabel, onIrAPregunta, questionsById, impactoDe = impactoDeTema, textoImpacto, titulo }) {
  const { theme: t } = useContext(ThemeContext);
  const r = useMemo(() => calcularResultado(phases, answers, noAplica, valorDe, impactoDe), [phases, answers, noAplica, valorDe, impactoDe]);
  const [celda, setCelda] = useState(null); // {impacto, prob}
  const [abiertos, setAbiertos] = useState({});
  const [verMetodo, setVerMetodo] = useState(false);

  const card = { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };

  if (r.respondidas === 0) {
    return (
      <section style={{ ...card, textAlign: 'center', padding: '32px' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 6px', color: t.text }}>Todavía no hay resultado</h2>
        <p style={{ fontSize: '13px', color: t.textDim, margin: 0 }}>Responde el cuestionario o usa "Evaluar con IA" con tus documentos para ver tu nivel de cumplimiento de {marcoLabel} y el mapa de calor de brechas.</p>
      </section>
    );
  }

  const criticos = r.temas.filter((x) => x.score >= 15);
  const conBrecha = r.temas.filter((x) => x.pct < 100);
  const listaVisible = celda ? r.temas.filter((x) => x.impacto === celda.impacto && x.prob === celda.prob) : conBrecha;
  const colorPct = r.pct >= 90 ? '#15803d' : r.pct >= 70 ? '#2563eb' : r.pct >= 50 ? '#b45309' : '#dc2626';
  const noAplicaIds = Object.keys(noAplica);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {titulo && <h2 style={{ fontSize: '15px', margin: '8px 0 -4px', color: t.text }}>{titulo}</h2>}
      {/* RESUMEN */}
      <section style={{ ...card, display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', minWidth: '110px' }}>
          <div style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1, color: colorPct }}>{r.pct}%</div>
          <div style={{ fontSize: '11px', color: t.textDim, marginTop: '4px', fontWeight: 600 }}>de cumplimiento</div>
        </div>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 6px', color: t.text }}>
            Cumples el {r.pct}% de {marcoLabel}{conBrecha.length ? ` y tienes brechas en ${conBrecha.length} ${conBrecha.length === 1 ? 'tema' : 'temas'}` : ''}.
          </h2>
          <p style={{ fontSize: '13px', color: t.textMuted, margin: '0 0 6px', lineHeight: 1.5 }}>
            {criticos.length
              ? <>Empieza por {criticos.length === 1 ? 'el tema crítico' : `los ${criticos.length} temas críticos`}: <strong>{criticos.slice(0, 4).map((x) => x.nombre).join(' · ')}</strong>{criticos.length > 4 ? '…' : ''}</>
              : conBrecha.length ? <>No hay temas críticos. Prioriza <strong>{conBrecha[0].nombre}</strong>.</> : 'No se detectaron brechas en las preguntas respondidas.'}
          </p>
          <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>
            Basado en {r.respondidas} de {r.aplicables} preguntas que aplican{r.totalNA ? ` · ${r.totalNA} declaradas "No aplica"` : ''}{r.respondidas < r.aplicables ? ' · responde o evalúa el resto para un resultado completo' : ''}.
          </p>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* MAPA DE CALOR */}
        <section style={card} aria-label="Mapa de calor de brechas">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', margin: 0, color: t.text }}>Mapa de calor de brechas</h3>
            {celda && <button type="button" onClick={() => setCelda(null)} style={{ fontSize: '11px', border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, borderRadius: '8px', padding: '4px 8px', cursor: 'pointer' }}>Ver todos</button>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '22px repeat(5, 1fr)', gap: '4px', alignItems: 'stretch' }}>
            {[5, 4, 3, 2, 1].map((prob) => (
              <React.Fragment key={prob}>
                <div style={{ fontSize: '10px', color: t.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{prob}</div>
                {[1, 2, 3, 4, 5].map((impacto) => {
                  const n = r.temas.filter((x) => x.impacto === impacto && x.prob === prob).length;
                  const nv = nivel(impacto * prob);
                  const activa = celda && celda.impacto === impacto && celda.prob === prob;
                  return (
                    <button key={impacto} type="button" disabled={!n} onClick={() => setCelda(activa ? null : { impacto, prob })}
                      aria-label={`Impacto ${impacto}, probabilidad ${prob}: ${n} temas`}
                      style={{ aspectRatio: '1.4', minHeight: '36px', borderRadius: '6px', border: activa ? `2px solid ${t.text}` : '1px solid transparent', background: nv.fondo, color: nv.color, fontSize: '15px', fontWeight: 800, cursor: n ? 'pointer' : 'default', opacity: n ? 1 : 0.45 }}>
                      {n || ''}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
            <div />
            {[1, 2, 3, 4, 5].map((i) => <div key={i} style={{ fontSize: '10px', color: t.textDim, textAlign: 'center' }}>{i}</div>)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: t.textDim, marginTop: '6px' }}>
            <span>↑ Probabilidad (según % de cumplimiento del tema)</span><span>Impacto →</span>
          </div>
          <p style={{ fontSize: '11px', color: t.textDim, margin: '8px 0 0' }}>Cada número es la cantidad de <strong>temas</strong> en esa celda. Púlsala para ver cuáles.</p>
        </section>

        {/* CUMPLIMIENTO POR GRUPO */}
        <section style={card} aria-label="Cumplimiento por grupo">
          <h3 style={{ fontSize: '14px', margin: '0 0 12px', color: t.text }}>Cumplimiento por grupo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {r.grupos.map((g) => (
              <div key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: t.text }}>
                  <span>{g.nombre}</span><strong>{g.pct}%</strong>
                </div>
                <div style={{ height: '6px', background: t.inputBg, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${g.pct}%`, height: '100%', background: g.pct >= 90 ? '#15803d' : g.pct >= 70 ? '#2563eb' : g.pct >= 50 ? '#f59e0b' : '#dc2626' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* LISTA PRIORIZADA */}
      <section style={card} aria-label="Brechas priorizadas">
        <h3 style={{ fontSize: '14px', margin: '0 0 4px', color: t.text }}>
          {celda ? `Temas con impacto ${celda.impacto} y probabilidad ${celda.prob}` : 'Brechas priorizadas'}
        </h3>
        <p style={{ fontSize: '11px', color: t.textDim, margin: '0 0 12px' }}>Ordenadas por prioridad (impacto × probabilidad). Abre un tema para ver qué preguntas fallan.</p>
        {listaVisible.length === 0 && <p style={{ fontSize: '13px', color: t.textDim }}>Sin brechas en esta selección.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {listaVisible.map((tema) => {
            const nv = nivel(tema.score);
            const abierto = !!abiertos[tema.nombre];
            return (
              <div key={tema.nombre} style={{ border: `1px solid ${t.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                <button type="button" onClick={() => setAbiertos((p) => ({ ...p, [tema.nombre]: !abierto }))} aria-expanded={abierto}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: t.text }}>
                  {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: nv.fondo, color: nv.color, flexShrink: 0 }}>{nv.nombre} · {tema.score}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>{tema.nombre}</span>
                    <span style={{ display: 'block', fontSize: '11px', color: t.textDim }}>{tema.grupo} · impacto {tema.impacto} · probabilidad {tema.prob}</span>
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted, flexShrink: 0 }}>{tema.pct}% · {tema.fallas.length} {tema.fallas.length === 1 ? 'falla' : 'fallas'}</span>
                </button>
                {abierto && (
                  <ul style={{ listStyle: 'none', margin: 0, padding: '0 12px 12px 36px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tema.fallas.map((q) => {
                      const ia = aiResults[q.id];
                      return (
                        <li key={q.id} style={{ fontSize: '12px', color: t.text, borderTop: `1px solid ${t.border}`, paddingTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                            <span><strong>{q.codigo}</strong> · {q.question}</span>
                            <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: 700, color: q.valor === 0.5 ? '#b45309' : '#dc2626' }}>{q.valor === 0.5 ? 'Parcial' : (ia?.veredicto === 'sin_evidencia' ? 'Sin evidencia' : 'No cumple')}</span>
                          </div>
                          {ia?.justificacion && <p style={{ margin: '4px 0 0', color: t.textMuted }}><strong>IA:</strong> {ia.justificacion}</p>}
                          {q.evidencia && <p style={{ margin: '4px 0 0', color: t.textDim }}><strong>Para resolverla sube:</strong> {q.evidencia}</p>}
                          <button type="button" onClick={() => onIrAPregunta(q.id)} style={{ marginTop: '6px', fontSize: '11px', fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Ir a la pregunta →</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {noAplicaIds.length > 0 && (
        <section style={card} aria-label="Preguntas declaradas como no aplica">
          <h3 style={{ fontSize: '14px', margin: '0 0 4px', color: t.text }}>Declaradas como "No aplica" ({noAplicaIds.length})</h3>
          <p style={{ fontSize: '11px', color: t.textDim, margin: '0 0 10px' }}>No cuentan en el cumplimiento ni en el mapa. Quedan registradas con su justificación para el auditor.</p>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {noAplicaIds.map((id) => (
              <li key={id} style={{ fontSize: '12px', color: t.text }}>
                <strong>{questionsById[id]?.codigo || id}</strong> · {questionsById[id]?.question || ''} <span style={{ color: t.textDim }}>— {noAplica[id]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* METODOLOGÍA */}
      <section style={{ ...card, padding: '12px 16px' }}>
        <button type="button" onClick={() => setVerMetodo((v) => !v)} aria-expanded={verMetodo} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>
          <Info size={14} /> ¿Cómo se calcula?
        </button>
        {verMetodo && (
          <ul style={{ fontSize: '12px', color: t.textMuted, lineHeight: 1.6, margin: '8px 0 0', paddingLeft: '18px' }}>
            <li><strong>Cumplimiento:</strong> Sí = 1, Parcialmente = 0,5, No o sin evidencia = 0. Las preguntas "No aplica" y las sin responder no cuentan.</li>
            <li><strong>Unidad del mapa:</strong> cada punto es un tema del cuestionario, no una pregunta.</li>
            <li><strong>Impacto (1–5):</strong> {textoImpacto || 'fijo por tema según el daño a los titulares y la gravedad de la infracción. 5: datos sensibles, menores, seguridad y vulneraciones · 4: licitud, consentimiento, derechos, transferencias · 3: encargados, evaluación de impacto, diseño, responsabilidad · 2: registro y delegado.'}</li>
            <li><strong>Probabilidad (1–5):</strong> según el cumplimiento del tema. 1: 90% o más · 2: 70–89% · 3: 50–69% · 4: 25–49% · 5: menos de 25%.</li>
            <li><strong>Prioridad:</strong> impacto × probabilidad. Crítico 15–25 · Alto 8–14 · Medio 4–7 · Bajo 1–3.</li>
          </ul>
        )}
      </section>
    </div>
  );
}

export default ResultadoBrechas;
