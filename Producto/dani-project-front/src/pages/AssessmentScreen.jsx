/* eslint-disable */
import React, { useState, useEffect, useContext } from 'react';
import { ClipboardList, Upload, RefreshCw, FileText, HelpCircle } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { assessmentQuestionsAPI } from '../services/api';

// ==========================================
// Pantalla — Evaluación ISO 27001 (cuestionario)
// Muestra el catálogo de preguntas. El flujo pedido por el docente:
// el usuario sube documentos y la IA responde cada pregunta
// (Cumple / Parcial / No cumple) usando la "evidencia esperada".
// Por ahora la columna "Respuesta IA" queda como "Pendiente":
// es el siguiente paso (conectar la IA sobre los documentos subidos).
// ==========================================

const AssessmentScreen = () => {
  const { theme: t } = useContext(ThemeContext);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos demo por si el backend no responde (para no dejar la pantalla vacía).
  const demo = [
    { id: 'd1', codigo: '4.1', categoria: 'Cláusula (obligatoria)', nombre: 'Comprender la organización y su contexto', pregunta: "¿Existe documentación formal y aprobada que cubra 'comprender la organización y su contexto'?", evidencia_esperada: 'Análisis de contexto interno/externo, PESTEL, análisis FODA', orden: 0 },
    { id: 'd2', codigo: '4.1', categoria: 'Cláusula (obligatoria)', nombre: 'Comprender la organización y su contexto', pregunta: "¿Hay evidencia de que se ejecuta/actualiza de forma periódica (no solo en papel)?", evidencia_esperada: 'Registro de fechas de revisión/actualización', orden: 1 },
    { id: 'd3', codigo: '4.2', categoria: 'Cláusula (obligatoria)', nombre: 'Necesidades y expectativas de las partes interesadas', pregunta: "¿Existe documentación formal y aprobada que cubra este punto?", evidencia_esperada: 'Matriz de partes interesadas, registro de requisitos legales', orden: 2 },
  ];

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentQuestionsAPI.getAll();
      setQuestions(Array.isArray(data) && data.length > 0 ? data : demo);
    } catch (err) {
      console.error('Error al cargar las preguntas. Usando datos demo.', err);
      setError('No se pudo conectar con el servidor. Mostrando datos de ejemplo.');
      setQuestions(demo);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar preguntas por control (código + nombre) para mostrarlas ordenadas
  const grupos = [];
  const indexPorCodigo = {};
  for (const q of questions) {
    if (indexPorCodigo[q.codigo] === undefined) {
      indexPorCodigo[q.codigo] = grupos.length;
      grupos.push({ codigo: q.codigo, categoria: q.categoria, nombre: q.nombre, preguntas: [] });
    }
    grupos[indexPorCodigo[q.codigo]].preguntas.push(q);
  }

  return (
    <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <ClipboardList size={26} color="#10b981" />
        <h1 style={{ margin: 0, color: t.text, fontSize: '24px' }}>Evaluación ISO 27001</h1>
      </div>
      <p style={{ color: t.textMuted, marginTop: 0, marginBottom: '20px', fontSize: '14px' }}>
        Sube tus documentos y la IA responderá cada pregunta (Cumple / Parcial / No cumple)
        buscando la <strong>evidencia esperada</strong>. {questions.length} preguntas cargadas.
      </p>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          disabled
          title="Próximo paso: conectar la IA sobre los documentos subidos"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '13px', fontWeight: 600, opacity: 0.55, cursor: 'not-allowed' }}>
          <Upload size={16} /> Subir documentos y evaluar (próximamente)
        </button>
        <button
          onClick={fetchQuestions}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontSize: '13px', cursor: 'pointer' }}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: t.textMuted, padding: '40px', textAlign: 'center' }}>Cargando preguntas...</div>
      ) : (
        grupos.map((g) => (
          <div key={g.codigo} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
            {/* Cabecera del control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ background: '#10b981', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>{g.codigo}</span>
              <span style={{ color: t.text, fontWeight: 600, fontSize: '15px' }}>{g.nombre}</span>
              <span style={{ marginLeft: 'auto', color: t.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{g.categoria}</span>
            </div>

            {/* Preguntas del control */}
            {g.preguntas.map((q) => (
              <div key={q.id} style={{ display: 'flex', gap: '14px', padding: '12px 0', borderTop: `1px solid ${t.border}` }}>
                <HelpCircle size={18} color={t.textMuted} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: t.text, fontSize: '14px', marginBottom: '6px' }}>{q.pregunta}</div>
                  <div style={{ color: t.textMuted, fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <FileText size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span><strong>Evidencia esperada:</strong> {q.evidencia_esperada || '—'}</span>
                  </div>
                </div>
                {/* Respuesta IA (placeholder hasta conectar la IA) */}
                <div style={{ flexShrink: 0, alignSelf: 'center' }}>
                  <span style={{ background: t.inputBg, border: `1px dashed ${t.border}`, color: t.textMuted, padding: '5px 10px', borderRadius: '6px', fontSize: '12px' }}>
                    Respuesta IA: Pendiente
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default AssessmentScreen;
