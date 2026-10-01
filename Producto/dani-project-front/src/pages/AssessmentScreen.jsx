// src/pages/AssessmentScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ClipboardList, Upload, RefreshCw, FileText, HelpCircle, Shield } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { assessmentQuestionsAPI } from '../services/api';

// ==========================================
// Pantalla — Evaluación ISO 27001 y Ley 21.719
// ==========================================

const AssessmentScreen = () => {
  const { theme: t } = useContext(ThemeContext);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos demo por si el backend no responde.
  const demo = [
    { id: 'd1', codigo: '4.1', categoria: 'Cláusula 4', nombre: 'Comprender la organización y su contexto', pregunta: "¿Existe documentación formal y aprobada que cubra 'comprender la organización y su contexto'?", evidencia_esperada: 'Análisis de contexto interno/externo, PESTEL, análisis FODA', orden: 0 },
    { id: 'd2', codigo: '4.1', categoria: 'Cláusula 4', nombre: 'Comprender la organización y su contexto', pregunta: "¿Hay evidencia de que se ejecuta/actualiza de forma periódica (no solo en papel)?", evidencia_esperada: 'Registro de fechas de revisión/actualización', orden: 1 },
    { id: 'd3', codigo: '4.2', categoria: 'Cláusula 4', nombre: 'Necesidades y expectativas de las partes interesadas', pregunta: "¿Existe documentación formal y aprobada que cubra este punto?", evidencia_esperada: 'Matriz de partes interesadas, registro de requisitos legales', orden: 2 },
    { id: 'ley1', codigo: 'Art. 4', categoria: 'Ley 21.719 - Privacidad', nombre: 'Principio de Licitud', pregunta: '¿Se han definido las bases de licitud para el tratamiento de datos personales?', evidencia_esperada: 'Política de Privacidad, Registro de Consentimientos', orden: 100 }
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

  // Función para agrupar preguntas
  const groupQuestions = (questionsArray) => {
    const groups = [];
    const indexByCode = {};
    for (const q of questionsArray) {
      if (indexByCode[q.codigo] === undefined) {
        indexByCode[q.codigo] = groups.length;
        groups.push({ codigo: q.codigo, categoria: q.categoria, nombre: q.nombre, preguntas: [] });
      }
      groups[indexByCode[q.codigo]].preguntas.push(q);
    }
    return groups;
  };

  // Separar preguntas ISO de las de Privacidad/Ley 21.719
  const isoQuestions = questions.filter(q => !q.categoria.includes('Privacidad') && !q.categoria.includes('Ley 21.719'));
  const privacyQuestions = questions.filter(q => q.categoria.includes('Privacidad') || q.categoria.includes('Ley 21.719'));

  const isoGroups = groupQuestions(isoQuestions);
  const privacyGroups = groupQuestions(privacyQuestions);

  return (
    <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <ClipboardList size={26} color="#10b981" />
        <h1 style={{ margin: 0, color: t.text, fontSize: '24px' }}>Catálogo de Evaluación</h1>
      </div>
      <p style={{ color: t.textMuted, marginTop: 0, marginBottom: '20px', fontSize: '14px' }}>
        Sube tus documentos en la vista de Análisis de Brechas y la IA responderá cada pregunta 
        (Cumple / Parcial / No cumple) buscando la <strong>evidencia esperada</strong>. {questions.length} preguntas cargadas en total.
      </p>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={fetchQuestions}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.text, fontSize: '13px', cursor: 'pointer' }}>
          <RefreshCw size={16} /> Actualizar Catálogo
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
        <>
          {/* SECCIÓN ISO 27001 */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', color: t.text, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={20} color="#3b82f6" />
              Norma ISO 27001
            </h2>
            
            {isoGroups.length === 0 ? (
               <div style={{ color: t.textMuted, fontSize: '14px' }}>No hay preguntas de la norma ISO configuradas.</div>
            ) : (
              isoGroups.map((g) => (
                <div key={g.codigo} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ background: '#3b82f6', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>{g.codigo}</span>
                    <span style={{ color: t.text, fontWeight: 600, fontSize: '15px' }}>{g.nombre}</span>
                    <span style={{ marginLeft: 'auto', color: t.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{g.categoria}</span>
                  </div>

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
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* SECCIÓN LEY 21.719 */}
          <div>
            <h2 style={{ fontSize: '18px', color: t.text, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={20} color="#8b5cf6" />
              Ley N° 21.719 (Privacidad)
            </h2>

            {privacyGroups.length === 0 ? (
               <div style={{ color: t.textMuted, fontSize: '14px', padding: '20px', background: t.cardBg, borderRadius: '12px', border: `1px dashed ${t.border}` }}>
                 Aún no se han configurado preguntas de evaluación para el cumplimiento de la Ley 21.719.
               </div>
            ) : (
              privacyGroups.map((g) => (
                <div key={g.codigo} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '18px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#8b5cf6' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ background: '#8b5cf6', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>{g.codigo}</span>
                    <span style={{ color: t.text, fontWeight: 600, fontSize: '15px' }}>{g.nombre}</span>
                    <span style={{ marginLeft: 'auto', color: '#8b5cf6', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{g.categoria}</span>
                  </div>

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
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AssessmentScreen;