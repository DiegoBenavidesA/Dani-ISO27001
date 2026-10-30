/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Building2, Plus, Search, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { vendorsAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const VendorsScreen = () => {
  const { theme: t } = useTheme();

  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    datos_compartidos: '',
    pais: '',
    estado_contrato: 'pendiente'
  });

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await vendorsAPI.getAll();
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVendors(); }, []);

  const resetForm = () => {
    setFormData({ nombre: '', datos_compartidos: '', pais: '', estado_contrato: 'pendiente' });
    setEditingVendor(null);
  };

  const handleNewVendor = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      nombre: vendor.nombre || '',
      datos_compartidos: vendor.datos_compartidos || '',
      pais: vendor.pais || '',
      estado_contrato: vendor.estado_contrato || 'pendiente'
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return alert('Debes ingresar el nombre del proveedor.');

    const payload = {
      nombre: formData.nombre.trim(),
      datos_compartidos: formData.datos_compartidos.trim() || null,
      pais: formData.pais.trim() || null,
      estado_contrato: formData.estado_contrato,
      treatment_id: null,
    };

    try {
      setSaving(true);
      if (editingVendor) await vendorsAPI.update(editingVendor.id, payload);
      else await vendorsAPI.create(payload);
      
      await loadVendors();
      handleCloseForm();
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo guardar el proveedor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVendor = async (vendor) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al proveedor "${vendor.nombre}"?`)) return;
    try {
      await vendorsAPI.delete(vendor.id);
      await loadVendors();
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo eliminar el proveedor.');
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const text = `${vendor.nombre || ''} ${vendor.pais || ''} ${vendor.datos_compartidos || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'vigente': return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'vencido': return { bg: '#fee2e2', text: '#ef4444', border: '#fecaca' };
      default:        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
    }
  };

  return (
    <div className="vendors-container" style={{ padding: '0 8px', color: t.text, minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER ADAPTADO MÓVIL-FIRST */}
      <section className="vendors-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ padding: '8px', background: 'rgba(6, 182, 212, 0.1)', color: '#0891b2', borderRadius: '8px', flexShrink: 0, marginTop: '2px' }}>
            <Building2 size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: t.text, tracking: 'tight', lineHeight: 1.2 }}>
              Gestión de Proveedores
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: t.textDim, lineHeight: 1.4 }}>
              Registro y control de terceros que procesan o reciben datos personales.
            </p>
          </div>
        </div>
      </section>

      {/* BOTÓN PRINCIPAL */}
      <button
        className="btn-new-vendor"
        onClick={handleNewVendor}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '10px 16px', border: 'none', borderRadius: '10px',
          background: '#2563eb', color: '#ffffff', fontWeight: 600, fontSize: '14px',
          cursor: 'pointer', marginBottom: '20px', boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
          transition: 'all 0.2s'
        }}
      >
        <Plus size={16} strokeWidth={2.5} /> Nuevo Proveedor
      </button>

      {/* KPI TOTAL */}
      <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: t.textDim, letterSpacing: '0.5px' }}>Total de proveedores registrados</span>
        <div style={{ fontSize: '32px', fontWeight: 800, color: t.text, marginTop: '4px', lineHeight: 1 }}>{vendors.length}</div>
      </div>

      {/* BUSCADOR */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <div style={{ position: 'absolute', insetY: 0, left: 0, paddingLeft: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <Search size={16} color={t.textDim} />
        </div>
        <input 
          type="search" 
          placeholder="Buscar proveedor..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 36px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.text, fontSize: '13px', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }} 
        />
        {search && (
          <div style={{ position: 'absolute', insetY: 0, right: 0, paddingRight: '12px', display: 'flex', alignItems: 'center' }}>
            <X size={16} onClick={() => setSearch('')} color={t.textDim} style={{ cursor: 'pointer' }} />
          </div>
        )}
      </div>

      {/* TABLA ESCRITORIO Y TARJETAS MÓVIL */}
      <section aria-label="Lista de proveedores">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', fontSize: '13px', color: t.textDim }}>Cargando proveedores...</div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', fontSize: '13px', color: '#ef4444' }}>{error}</div>
        ) : (
          <div className="vendors-list-container">
            
            {/* VISTA ESCRITORIO (TABLA) */}
            <div className="desktop-table-wrapper" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: t.inputBg, borderBottom: `1px solid ${t.border}` }}>
                    {['PROVEEDOR', 'DATOS COMPARTIDOS', 'PAÍS', 'ESTADO CONTRATO', 'ACCIONES'].map((title) => (
                      <th key={title} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: t.textDim }}>No hay proveedores registrados.</td></tr>
                  ) : (
                    filteredVendors.map((vendor) => {
                      const stStyle = getStatusStyle(vendor.estado_contrato);
                      return (
                        <tr key={vendor.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px', fontWeight: 700, fontSize: '13px', color: t.text }}>{vendor.nombre}</td>
                          <td style={{ padding: '16px', fontSize: '13px', color: t.textDim }}>{vendor.datos_compartidos || '—'}</td>
                          <td style={{ padding: '16px', fontSize: '13px', color: t.textDim }}>{vendor.pais || '—'}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ background: stStyle.bg, color: stStyle.text, border: `1px solid ${stStyle.border}`, padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' }}>
                              {vendor.estado_contrato || 'pendiente'}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button title="Editar" onClick={() => handleEditVendor(vendor)} style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: t.textMuted, borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={14} /></button>
                              <button title="Eliminar" onClick={() => handleDeleteVendor(vendor)} style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: '#ef4444', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL (TARJETAS) */}
            <div className="mobile-cards-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: t.inputBg, borderBottom: `1px solid ${t.border}`, fontSize: '10px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>Proveedor</span> <span>•</span> <span>Datos Compartidos</span> <span>•</span> <span>País</span> <span>•</span> <span>Estado</span>
              </div>

              {filteredVendors.length === 0 ? (
                <div style={{ padding: '30px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, marginBottom: '12px' }}>
                    <Building2 size={24} />
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: t.text }}>No hay proveedores registrados.</p>
                  <p style={{ margin: 0, fontSize: '12px', color: t.textDim, maxWidth: '240px' }}>Agrega los terceros o encargados del tratamiento de tu organización.</p>
                </div>
              ) : (
                filteredVendors.map((vendor) => {
                  const stStyle = getStatusStyle(vendor.estado_contrato);
                  return (
                    <article key={vendor.id} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      
                      {/* Fila superior: Nombre y Estado */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: t.text, margin: 0, lineHeight: 1.2 }}>{vendor.nombre}</h2>
                        <span style={{ background: stStyle.bg, color: stStyle.text, border: `1px solid ${stStyle.border}`, padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
                          {vendor.estado_contrato || 'pendiente'}
                        </span>
                      </div>

                      {/* Detalles */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>Datos Compartidos</span>
                          <p style={{ fontWeight: 500, color: t.text, margin: '2px 0 0', lineHeight: 1.4 }}>{vendor.datos_compartidos || '—'}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>País</span>
                          <p style={{ fontWeight: 500, color: t.text, margin: '2px 0 0' }}>{vendor.pais || '—'}</p>
                        </div>
                      </div>

                      {/* Botones Acción Inferior */}
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${t.inputBg}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => handleEditVendor(vendor)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: t.inputBg, border: 'none', color: t.textMuted, fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                          <Pencil size={12} /> Editar
                        </button>
                        <button onClick={() => handleDeleteVendor(vendor)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fee2e2', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                          <Trash2 size={12} /> Eliminar
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

      {/* TIP LEY 21.719 */}
      <div style={{ padding: '12px', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '11px', color: t.textDim, marginTop: '20px' }}>
        <AlertCircle size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ lineHeight: 1.4 }}>
          <strong style={{ color: t.text, fontWeight: 700 }}>Ley 21.719:</strong> Recuerda validar los acuerdos de procesamiento y transferencias internacionales con cada proveedor de datos.
        </span>
      </div>

      {/* FORMULARIO MODAL (ADAPTADO MÓVIL) */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', maxHeight: '95vh', overflowY: 'auto', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: t.text }}>{editingVendor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button type="button" onClick={handleCloseForm} style={{ border: 'none', background: t.inputBg, borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: t.textMuted }}>Nombre del proveedor *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Amazon Web Services" required style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: t.textMuted }}>Datos compartidos</label>
                <textarea name="datos_compartidos" value={formData.datos_compartidos} onChange={handleChange} placeholder="Ej: Nombre, correo electrónico y datos de cuenta" rows="3" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', resize: 'vertical', fontSize: '13px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: t.textMuted }}>País</label>
                  <input type="text" name="pais" value={formData.pais} onChange={handleChange} placeholder="Ej: EE.UU." style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: t.textMuted }}>Estado del contrato</label>
                  <select name="estado_contrato" value={formData.estado_contrato} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px', cursor: 'pointer' }}>
                    <option value="pendiente">Pendiente</option>
                    <option value="vigente">Vigente</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={handleCloseForm} disabled={saving} className="btn-cancel" style={{ padding: '12px 16px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-save" style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Guardando...' : editingVendor ? 'Guardar cambios' : 'Crear Proveedor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESTILOS INYECTADOS PARA RESPONSIVE GLOBAL */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Por defecto (Móvil) */
        .desktop-table-wrapper { display: none; }
        .mobile-cards-wrapper { display: flex; }
        .btn-new-vendor { width: 100%; justify-content: center; }
        
        .form-actions { flex-direction: column-reverse; }
        .btn-cancel, .btn-save { width: 100%; justify-content: center; }

        /* Escritorio (> 768px) */
        @media (min-width: 768px) {
          .vendors-container { padding: 32px 16px !important; }
          .vendors-header { display: flex; justify-content: space-between; align-items: flex-end; }
          .btn-new-vendor { width: auto; margin-bottom: 0 !important; }
          
          .desktop-table-wrapper { display: block; }
          .mobile-cards-wrapper { display: none; }

          .modal-content { padding: 32px !important; }
          .form-actions { flex-direction: row; }
          .btn-cancel, .btn-save { width: auto; }
        }
      `}} />
    </div>
  );
};

export default VendorsScreen;