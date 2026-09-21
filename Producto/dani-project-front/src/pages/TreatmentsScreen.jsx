import React, { useState, useEffect, useContext } from 'react';
import { Database, Plus, Search, Eye, ShieldAlert, ArrowRight, X } from 'lucide-react';
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

  // Fallback demo para la UI si el backend aún no tiene datos
  const demoTreatments = [
    { id: 't1', nombre: 'Gestión de Nómina', finalidad: 'Pago de remuneraciones y cotizaciones', base_licitud: 'Contrato', categorias_datos: 'Datos identificativos, financieros', nivel_riesgo: 'Medio' },
    { id: 't2', nombre: 'Marketing y Newsletters', finalidad: 'Envío de promociones', base_licitud: 'Consentimiento', categorias_datos: 'Correo, nombre', nivel_riesgo: 'Bajo' },
    { id: 't3', nombre: 'Biometría Control Acceso', finalidad: 'Seguridad física', base_licitud: 'Interés Legítimo', categorias_datos: 'Huella dactilar, rostro (Sensibles)', nivel_riesgo: 'Alto' }
  ];

  const loadData = async () => {
    const data = await treatmentsAPI.getAll();
    setTreatments(Array.isArray(data) && data.length > 0 ? data : demoTreatments);
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
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: t.text }}>Registro de Tratamientos (RoPA)</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>Inventario de actividades de tratamiento de datos personales - Ley N° 21.719</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', background: '#10b981', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Plus size={16} /> Nuevo Tratamiento
        </button>
      </div>

      <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: t.textDim, fontWeight: 600 }}>
            <Database size={18} /> Total registrados: {treatments.length}
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.textDim }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar tratamientos..." style={{ padding: '8px 12px 8px 36px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, outline: 'none' }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                  <button onClick={() => onNavigate('impact', { treatmentId: tr.id, name: tr.nombre, risk: tr.nivel_riesgo })} style={{ padding: '6px 12px', background: tr.nivel_riesgo === 'Alto' ? '#ef444420' : t.inputBg, border: `1px solid ${tr.nivel_riesgo === 'Alto' ? '#ef444440' : t.border}`, borderRadius: '6px', color: tr.nivel_riesgo === 'Alto' ? '#ef4444' : t.textMuted, fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {tr.nivel_riesgo === 'Alto' ? <ShieldAlert size={12} /> : <Eye size={12} />} Evaluar Impacto <ArrowRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NUEVO TRATAMIENTO */}
      {showForm && (
        <div onClick={() => !saving && setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '24px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowForm(false)} disabled={saving} style={{ padding: '10px 16px', borderRadius: '9px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 18px', borderRadius: '9px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Guardando...' : 'Crear Tratamiento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}