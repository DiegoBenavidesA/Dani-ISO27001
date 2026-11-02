import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Download, FolderUp, FileText, Plus, Edit3, Trash2, Shield, Eye, Wand2 } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { assessmentQuestionsAPI } from '../services/api';

// Catálogo de preguntas de evaluación (ISO 27001 y Ley 21.719).
// Es el mismo para todas las empresas: solo el superadmin de la plataforma lo
// carga y mantiene. Cada empresa responde estas preguntas en Análisis de
// Brechas y, si alguna no le aplica, la marca como "No aplica" con justificación.
function QuestionsScreen() {
  const { theme: t } = useContext(ThemeContext);
  const [marco, setMarco] = useState('ley21719');
  const esISO = marco === 'iso27001';
  const [dbQuestions, setDbQuestions] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const loadQuestions = async () => {
    setErrorCarga(null);
    try {
      const data = await assessmentQuestionsAPI.getAll();
      setDbQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorCarga('No se pudieron cargar las preguntas. Inténtalo de nuevo.');
    } finally { setCargando(false); }
  };
  useEffect(() => { loadQuestions(); }, []);

  const marcoQuestions = useMemo(() => dbQuestions.filter((q) => (q.marco || 'iso27001') === marco), [dbQuestions, marco]);

  const [showModal, setShowModal] = useState(false);
  const [editingQ, setEditingQ] = useState(null);
  const categoriaInicial = esISO ? 'Organizacional' : '';
  const [formData, setFormData] = useState({ codigo: '', categoria: categoriaInicial, nombre: '', pregunta: '', evidencia_esperada: '', orden: 0 });
  const [isSavingQ, setIsSavingQ] = useState(false);
  const marcoLabel = esISO ? 'ISO 27001:2022' : 'Ley 21.719';
  const categoriasLey = Array.from(new Set(marcoQuestions.map((q) => q.categoria).filter(Boolean)));
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleImportExcel = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await assessmentQuestionsAPI.bulkImport(file, marco);
      setImportResult(res);
      await loadQuestions();
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
    }
  };

  // Preguntas del marco sin evidencia esperada (típico de un PDF importado).
  const sinEvidencia = marcoQuestions.filter((q) => !(q.evidencia_esperada || '').trim()).length;
  const [mejorando, setMejorando] = useState(null); // {done, total, stage} mientras corre
  const [mejoraMsg, setMejoraMsg] = useState(null);

  const handleMejorar = async () => {
    setMejoraMsg(null); setMejorando({ done: 0, total: sinEvidencia, stage: 'Iniciando' });
    try {
      const r = await assessmentQuestionsAPI.mejorar(marco, setMejorando);
      await loadQuestions();
      const fallidas = (r.total || 0) - (r.con_ia || 0);
      setMejoraMsg({ ok: true, texto: `La IA completó ${r.con_ia || 0} de ${r.total || 0} preguntas.` + (fallidas > 0 ? ` ${fallidas} quedaron sin evidencia esperada (límite de la IA); vuelve a pulsar el botón para reintentarlas.` : '') });
    } catch (err) {
      setMejoraMsg({ ok: false, texto: err.message });
    } finally { setMejorando(null); }
  };

  const handleImportPdf = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await assessmentQuestionsAPI.bulkImportPdf(file, marco);
      setImportResult(res);
      await loadQuestions();
      // Los PDF no traen evidencia esperada ni vienen redactados como pregunta.
      if (res.creadas > 0) setTimeout(handleMejorar, 0);
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try { await assessmentQuestionsAPI.downloadTemplate(); }
    catch (err) { alert('No se pudo descargar la plantilla: ' + err.message); }
  };

  const handleOpenModal = (q = null) => {
    if (q) {
      setEditingQ(q.id);
      setFormData({ codigo: q.codigo, categoria: q.categoria, nombre: q.nombre, pregunta: q.pregunta, evidencia_esperada: q.evidencia_esperada || '', orden: q.orden });
    } else {
      setEditingQ(null);
      setFormData({ codigo: '', categoria: categoriaInicial, nombre: '', pregunta: '', evidencia_esperada: '', orden: 0 });
    }
    setShowModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setIsSavingQ(true);
    try {
      const datos = { ...formData, marco };
      if (editingQ) await assessmentQuestionsAPI.update(editingQ, datos);
      else await assessmentQuestionsAPI.create(datos);
      await loadQuestions();
      setShowModal(false);
    } catch (err) { alert("Error al guardar la pregunta: " + err.message); } finally { setIsSavingQ(false); }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta pregunta?")) return;
    try { await assessmentQuestionsAPI.delete(id); await loadQuestions(); } catch (err) { alert("Error al eliminar la pregunta"); }
  };

  return (
    <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', color: t.text }}>
      <section style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#2563eb', textTransform: 'uppercase', marginBottom: '2px' }}>Catálogo de la plataforma</p>
        <h1 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.1, margin: 0, color: t.text, letterSpacing: '-0.5px' }}>Preguntas</h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.4, color: t.textDim }}>Estas preguntas son las mismas para todas las empresas. Cada empresa las responde en Análisis de Brechas y puede marcar como "No aplica" las que no le correspondan.</p>
      </section>

      <div role="radiogroup" aria-label="Marco normativo" style={{ display: 'inline-flex', gap: '4px', background: t.inputBg, padding: '4px', borderRadius: '12px', border: `1px solid ${t.border}`, marginBottom: '20px' }}>
        {[{ id: 'iso27001', label: 'ISO 27001:2022', Icon: Shield }, { id: 'ley21719', label: 'Ley 21.719', Icon: Eye }].map(({ id, label, Icon }) => {
          const activo = marco === id;
          const n = dbQuestions.filter((q) => (q.marco || 'iso27001') === id).length;
          return (
            <button key={id} type="button" role="radio" aria-checked={activo} disabled={!!mejorando} onClick={() => { setMarco(id); setImportResult(null); setMejoraMsg(null); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9px', border: 'none', background: activo ? '#004ac6' : 'transparent', color: activo ? '#fff' : t.textMuted, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              <Icon size={14} />{label}<span style={{ fontWeight: 500, opacity: .8 }}>({n})</span>
            </button>
          );
        })}
      </div>

      {cargando && <div style={{ padding: '28px', color: t.textDim, textAlign: 'center' }}>Cargando preguntas...</div>}
      {errorCarga && <div role="alert" style={{ padding: '14px', color: '#dc2626', background: 'rgba(239,68,68,.07)', borderRadius: '10px', marginBottom: '16px' }}>{errorCarga}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>Preguntas de {marcoLabel}</h2>
          <p style={{ fontSize: '13px', color: t.textDim }}>Lo que importes o crees aquí queda en el banco de <strong>{marcoLabel}</strong>.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleDownloadTemplate} title="Descargar plantilla Excel" style={{ padding: '10px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <Download size={16} /> Plantilla
        </button>
        <label title="Importar preguntas desde Excel (.xlsx)" style={{ padding: '10px 16px', background: 'transparent', border: `1px solid #004ac6`, borderRadius: '8px', color: '#004ac6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: importing ? 'wait' : 'pointer' }}>
          <FolderUp size={16} /> {importing ? 'Importando…' : `Importar Excel a ${esISO ? 'ISO' : 'Ley'}`}
          <input type="file" accept=".xlsx,.xlsm" onChange={handleImportExcel} disabled={importing} style={{ display: 'none' }} />
        </label>
        <label title="Importar preguntas desde un PDF (checklist/listado)" style={{ padding: '10px 16px', background: 'transparent', border: `1px solid #004ac6`, borderRadius: '8px', color: '#004ac6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: importing ? 'wait' : 'pointer' }}>
          <FileText size={16} /> {importing ? 'Importando…' : `Importar PDF a ${esISO ? 'ISO' : 'Ley'}`}
          <input type="file" accept=".pdf" onChange={handleImportPdf} disabled={importing} style={{ display: 'none' }} />
        </label>
        <button onClick={() => handleOpenModal()} style={{ padding: '10px 16px', background: '#004ac6', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <Plus size={16} /> Nueva Pregunta
        </button>
        </div>
      </div>

      {importResult && (
        <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '12px', border: `1px solid ${importResult.error ? '#ef4444' : '#004ac6'}`, background: t.cardBg, color: t.text, fontSize: '13px' }}>
          {importResult.error ? (
            <span style={{ color: '#ef4444' }}>❌ {importResult.error}</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span><strong style={{ color: '#004ac6' }}>✓ {importResult.creadas}</strong> preguntas creadas en {marcoLabel} · <strong>{importResult.omitidas}</strong> omitidas (de {importResult.total_filas_datos ?? importResult.total_detectadas} detectadas).</span>
              {importResult.columnas_detectadas && (
                <span style={{ color: t.textDim, fontSize: '12px' }}>
                  Columnas detectadas: {Object.entries(importResult.columnas_detectadas).map(([k, v]) => `${k} ← "${v}"`).join('  ·  ')}
                </span>
              )}
              {importResult.categorias && (
                <span style={{ color: t.textDim, fontSize: '12px' }}>
                  Categorías detectadas: {Object.entries(importResult.categorias).map(([k, v]) => `${k} (${v})`).join('  ·  ')}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {(sinEvidencia > 0 || mejorando || mejoraMsg) && (
        <div role="status" style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '12px', border: `1px solid ${mejoraMsg && !mejoraMsg.ok ? '#ef4444' : '#f59e0b'}`, background: t.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: t.text }}>
          <span>
            {mejorando
              ? `${mejorando.stage || 'Trabajando'}… ${mejorando.done || 0} de ${mejorando.total || sinEvidencia}`
              : mejoraMsg
                ? mejoraMsg.texto
                : <><strong>{sinEvidencia}</strong> preguntas de {marcoLabel} no tienen evidencia esperada. Sin ella la IA evalúa con menos precisión.</>}
          </span>
          {sinEvidencia > 0 && !mejorando && (
            <button type="button" onClick={handleMejorar} style={{ padding: '8px 14px', background: '#004ac6', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wand2 size={14} /> Completar con IA
            </button>
          )}
        </div>
      )}

      <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: t.inputBg, fontSize: '12px', color: t.textDim, textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px' }}>Código</th>
              <th style={{ padding: '14px 20px' }}>Categoría</th>
              <th style={{ padding: '14px 20px' }}>Pregunta</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {marcoQuestions.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '24px 20px', textAlign: 'center', fontSize: '13px', color: t.textDim }}>Todavía no hay preguntas de {marcoLabel}. Impórtalas desde Excel o PDF, o crea una nueva.</td></tr>
            )}
            {marcoQuestions.map(q => (
              <tr key={q.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: '14px 20px', fontWeight: 600, color: '#8b5cf6', fontSize: '13px' }}>{q.codigo}</td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: t.textDim }}>{q.categoria}</td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: t.text }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{q.nombre}</div>
                  <div style={{ color: t.textDim }}>{q.pregunta}</div>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: q.evidencia_esperada ? t.textDim : '#b45309' }}>
                    <strong>Evidencia esperada:</strong> {q.evidencia_esperada || 'sin definir'}
                  </div>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleOpenModal(q)} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: t.textMuted, padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Edit3 size={14} /></button>
                    <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Formulario */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: t.cardBg, borderRadius: '16px', padding: '24px', width: '600px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', color: t.text }}>{editingQ ? 'Editar Pregunta' : 'Nueva Pregunta'} · {marcoLabel}</h3>
            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', display: 'block' }}>Código {esISO ? '(Ej. 4.1 o A.5.1)' : '(Ej. L21719-O3)'}</label>
                  <input required value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', display: 'block' }}>Categoría</label>
                  {esISO ? (
                  <select required value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box' }}>
                    <option value="Cláusula 4">Cláusula 4</option>
                    <option value="Cláusula 5">Cláusula 5</option>
                    <option value="Cláusula 6">Cláusula 6</option>
                    <option value="Cláusula 7">Cláusula 7</option>
                    <option value="Cláusula 8">Cláusula 8</option>
                    <option value="Cláusula 9">Cláusula 9</option>
                    <option value="Cláusula 10">Cláusula 10</option>
                    <option value="Organizacional">Anexo A - Organizacional</option>
                    <option value="Personas">Anexo A - Personas</option>
                    <option value="Físico">Anexo A - Físico</option>
                    <option value="Tecnológico">Anexo A - Tecnológico</option>
                  </select>
                  ) : (
                    <>
                      <input required list="categorias-ley" placeholder="Ej. Derechos de los titulares" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box' }} />
                      <datalist id="categorias-ley">{categoriasLey.map((c) => <option key={c} value={c} />)}</datalist>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', display: 'block' }}>Nombre Corto</label>
                <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', display: 'block' }}>Pregunta para el Evaluador</label>
                <textarea required value={formData.pregunta} onChange={e => setFormData({...formData, pregunta: e.target.value})} rows="3" style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', display: 'block' }}>Evidencia Esperada (Instrucción para la IA)</label>
                <textarea value={formData.evidencia_esperada} onChange={e => setFormData({...formData, evidencia_esperada: e.target.value})} rows="2" style={{ width: '100%', padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSavingQ} style={{ padding: '10px 16px', background: '#004ac6', border: 'none', borderRadius: '8px', color: 'white', cursor: isSavingQ ? 'wait' : 'pointer' }}>{isSavingQ ? 'Guardando...' : 'Guardar Pregunta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionsScreen;
