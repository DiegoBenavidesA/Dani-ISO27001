import React, { useState, useEffect, useContext } from 'react';
import { Database, Plus, Search, Eye, ShieldAlert, ArrowRight, X, Trash2 } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { treatmentsAPI } from '../services/api';

const BASES_LICITUD = [
  { value: 'consentimiento', label: 'Consentimiento' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'obligacion_legal', label: 'Obligación legal' },
  { value: 'interes_legitimo', label: 'Interés legítimo' },
  { value: 'datos_publicos', label: 'Datos públicos' },
  { value: 'otro', label: 'Otro' },
];

export default function TreatmentsScreen({ onNavigate }) {
  const { theme: t, darkMode } = useContext(ThemeContext);
  const [treatments, setTreatments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', finalidad: '', base_licitud: 'consentimiento',
    categorias_datos: '', responsable: '', plazo_conservacion: ''
  });

  const loadData = async () => {
    // Mostramos SIEMPRE los datos reales de la empresa (aunque esté vacío).
    // Antes había un "fallback demo" que inventaba 3 tratamientos cuando la API
    // devolvía vacío: confundía (no se podían borrar -> 404, ni aparecían en
    // DPIA/Consentimientos, que sí leen los reales).
    const data = await treatmentsAPI.getAll();
    setTreatments(Array.isArray(data) ? data : []);
  };

  const handleDelete = async (tr) => {
    if (!window.confirm(`¿Eliminar el tratamiento "${tr.nombre}"?`)) return;
    try {
      await treatmentsAPI.delete(tr.id);
      await loadData();
    } catch (e) {
      alert('Error al eliminar el tratamiento: ' + (e.message || e));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.finalidad.trim()) {
      alert('El nombre y la finalidad son obligatorios.');
      return;
    }
    try {
      setSaving(true);
      await treatmentsAPI.create({
        nombre: formData.nombre.trim(),
        finalidad: formData.finalidad.trim(),
        base_licitud: formData.base_licitud,
        categorias_datos: formData.categorias_datos.trim() || null,
        responsable: formData.responsable.trim() || null,
        plazo_conservacion: formData.plazo_conservacion.trim() || null,
      });
      await loadData();
      setShowForm(false);
      setFormData({ nombre: '', finalidad: '', base_licitud: 'consentimiento', categorias_datos: '', responsable: '', plazo_conservacion: '' });
    } catch (err) {
      alert(err.message || 'No se pudo crear el tratamiento.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = treatments.filter(tr => 
    tr.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tr.finalidad.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="normia-treatments" style={{ animation: 'fadeIn 0.4s ease', width: '100%', minWidth: 0 }}>
      <style>{`
        .normia-treatments { box-sizing: border-box; }
        .normia-treatments *, .normia-treatments *::before, .normia-treatments *::after { box-sizing: border-box; }
        .normia-treatments .tr-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; margin-bottom: 28px; }
        .normia-treatments .tr-heading { flex: 1 1 auto; min-width: 0; }
        .normia-treatments .tr-new-btn { flex: 0 0 auto; justify-content: center; white-space: nowrap; }
        .normia-treatments .tr-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 20px; }
        .normia-treatments .tr-search { position: relative; flex: 0 1 290px; min-width: 0; }
        .normia-treatments .tr-search-input { display: block; width: 100%; min-width: 0; }
        .normia-treatments .tr-table-scroll { width: 100%; max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; }
        .normia-treatments .tr-table { width: 100%; min-width: 780px; }
        .normia-treatments .tr-table-hint { display: none; }
        .normia-treatments .tr-modal-backdrop { box-sizing: border-box; }
        .normia-treatments .tr-modal { box-sizing: border-box; width: 100%; min-width: 0; max-width: 560px; max-height: 90vh; max-height: 90dvh; overflow-y: auto; }
        .normia-treatments .tr-form-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; }
        @media (max-width: 900px) {
          .normia-treatments .tr-header { flex-wrap: wrap; }
        }
        @media (max-width: 640px) {
          .normia-treatments .tr-header { flex-direction: column; align-items: stretch; gap: 16px; margin-bottom: 20px; }
          .normia-treatments .tr-heading h1 { font-size: 23px !important; line-height: 1.25; }
          .normia-treatments .tr-heading p { font-size: 14px !important; line-height: 1.5; }
          .normia-treatments .tr-new-btn { width: 100%; min-height: 44px; }
          .normia-treatments .tr-toolbar { flex-direction: column; align-items: stretch; padding: 14px; gap: 14px; }
          .normia-treatments .tr-search { flex: none; width: 100%; }
          .normia-treatments .tr-table-hint { display: block; font-size: 12px; padding: 10px 14px 0; }
          .normia-treatments .tr-modal-backdrop { padding: 12px !important; align-items: center; }
          .normia-treatments .tr-modal { padding: 18px !important; border-radius: 12px !important; max-height: calc(100vh - 24px); max-height: calc(100dvh - 24px); }
          .normia-treatments .tr-form-actions { flex-direction: column-reverse; }
          .normia-treatments .tr-form-actions button { width: 100%; min-height: 42px; justify-content: center; }
        }
      `}</style>
      <div className="tr-header">
        <div className="tr-heading">
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: t.text }}>Registro de Tratamientos (RoPA)</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>Inventario de actividades de tratamiento de datos personales - Ley N° 21.719</p>
        </div>
        <button className="tr-new-btn" onClick={() => setShowForm(true)} style={{ padding: '10px 20px', background: '#004ac6', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Plus size={16} /> Nuevo Tratamiento
        </button>
      </div>

      <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        <div className="tr-toolbar" style={{ borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: t.textDim, fontWeight: 600 }}>
            <Database size={18} /> Total registrados: {treatments.length}
          </div>
          <div className="tr-search">
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.textDim }} />
            <input className="tr-search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar tratamientos..." style={{ padding: '8px 12px 8px 36px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, outline: 'none' }} />
          </div>
        </div>

        <div className="tr-table-hint" style={{ color: t.textDim }}>Desliza la tabla hacia los lados para ver todas las columnas.</div>
        <div className="tr-table-scroll" role="region" aria-label="Tabla de tratamientos, desplazable horizontalmente" tabIndex={0}>
        <table className="tr-table" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>Nombre y Finalidad</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>Base Legal</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>Categorías de Datos</th>
              <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>Acciones (DPIA)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tr => (
              <tr key={tr.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{tr.nombre}</div>
                  <div style={{ fontSize: '12px', color: t.textDim }}>{tr.finalidad}</div>
                </td>
                <td style={{ padding: '16px 20px' }}><span style={{ padding: '4px 10px', background: '#3b82f620', color: '#3b82f6', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>{tr.base_licitud}</span></td>
                <td style={{ padding: '16px 20px' }}><div style={{ fontSize: '13px', color: t.text }}>{tr.categorias_datos}</div></td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  {/* Este botón enlaza la Tarea 3.1 con la 3.6 pasándole el ID del tratamiento */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => onNavigate('impact', { treatmentId: tr.id, name: tr.nombre, risk: tr.nivel_riesgo })} style={{ padding: '6px 12px', background: tr.nivel_riesgo === 'Alto' ? '#ef444420' : t.inputBg, border: `1px solid ${tr.nivel_riesgo === 'Alto' ? '#ef444440' : t.border}`, borderRadius: '6px', color: tr.nivel_riesgo === 'Alto' ? '#ef4444' : t.textMuted, fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {tr.nivel_riesgo === 'Alto' ? <ShieldAlert size={12} /> : <Eye size={12} />} Evaluar Impacto <ArrowRight size={12} />
                    </button>
                    <button onClick={() => handleDelete(tr)} title="Eliminar tratamiento" style={{ padding: '6px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* MODAL NUEVO TRATAMIENTO */}
      {showForm && (
        <div className="tr-modal-backdrop" onClick={() => !saving && setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 9999 }}>
          <div className="tr-modal" onClick={(e) => e.stopPropagation()} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: t.text }}>Nuevo Tratamiento</h2>
              <button type="button" onClick={() => setShowForm(false)} style={{ border: 'none', background: 'transparent', color: t.textDim, cursor: 'pointer' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              {[
                { name: 'nombre', label: 'Nombre *', ph: 'Ej: Gestión de clientes' },
                { name: 'finalidad', label: 'Finalidad *', ph: 'Ej: Administrar la relación con el cliente' },
              ].map((f) => (
                <div key={f.name} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: t.text }}>{f.label}</label>
                  <input name={f.name} value={formData[f.name]} onChange={handleChange} placeholder={f.ph} required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: '9px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none' }} />
                </div>
              ))}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: t.text }}>Base de licitud *</label>
                <select name="base_licitud" value={formData.base_licitud} onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: '9px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none' }}>
                  {BASES_LICITUD.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              {[
                { name: 'categorias_datos', label: 'Categorías de datos', ph: 'Ej: Nombre, correo, RUT' },
                { name: 'responsable', label: 'Responsable', ph: 'Ej: Área de TI' },
                { name: 'plazo_conservacion', label: 'Plazo de conservación', ph: 'Ej: 5 años' },
              ].map((f) => (
                <div key={f.name} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: t.text }}>{f.label}</label>
                  <input name={f.name} value={formData[f.name]} onChange={handleChange} placeholder={f.ph}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: '9px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none' }} />
                </div>
              ))}
              <div className="tr-form-actions" style={{ marginTop: '20px' }}>
                <button type="button" onClick={() => setShowForm(false)} disabled={saving} style={{ padding: '10px 16px', borderRadius: '9px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 18px', borderRadius: '9px', border: 'none', background: '#004ac6', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Guardando...' : 'Crear Tratamiento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}