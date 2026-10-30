/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Plus, Search, Trash2, X, Ban, Info } from 'lucide-react';
import { consentsAPI, treatmentsAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const ConsentsScreen = () => {
  const { theme: t } = useTheme();

  const [consents, setConsents] = useState([]);
  const [treatments, setTreatments] = useState([]); 
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titular: '', titular_email: "", treatment_id: '', finalidades_consentidas: '', fecha_expiracion: '', medio: '', comprobante_url: ''
  });

  const loadConsents = async () => {
    try {
      setLoading(true); setError('');
      const data = await consentsAPI.getAll();
      setConsents(Array.isArray(data) ? data : []);
    } catch (err) { setError('No se pudieron cargar los consentimientos.'); } 
    finally { setLoading(false); }
  };

  const loadTreatments = async () => {
    try {
      const data = await treatmentsAPI.getAll();
      setTreatments(Array.isArray(data) ? data : []);
    } catch (err) { setTreatments([]); }
  };

  useEffect(() => { loadConsents(); loadTreatments(); }, []);

  const treatmentName = (id) => {
    const found = treatments.find((tr) => tr.id === id);
    return found ? found.nombre : id;
  };

  const resetForm = () => {
    setFormData({ titular: '', titular_email: '', treatment_id: '', finalidades_consentidas: '', fecha_expiracion: '', medio: '', comprobante_url: '' });
  };

  const handleNewConsent = () => { resetForm(); setShowForm(true); };
  const handleCloseForm = () => { if (saving) return; setShowForm(false); resetForm(); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titular.trim()) return alert('Debes ingresar el titular.');
    if (!formData.titular_email.trim()) return alert('Debes ingresar el email del titular.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.titular_email.trim())) return alert('Debes ingresar un email válido.');
    if (!formData.treatment_id.trim()) return alert('Debes seleccionar un tratamiento.');
    if (!formData.medio.trim()) return alert('Debes ingresar el medio del consentimiento.');

    let urlLimpia = formData.comprobante_url.trim();
    if (urlLimpia) urlLimpia = urlLimpia.replace(/\\/g, '/');

    const payload = {
      titular: formData.titular.trim(),
      titular_email: formData.titular_email.trim(),
      treatment_id: formData.treatment_id,
      medio: formData.medio.trim(),
      comprobante_url: formData.comprobante_url.trim() || null
  };

    try {
      setSaving(true);
      await consentsAPI.create(payload);
      await loadConsents();
      handleCloseForm();
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo registrar el consentimiento.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeConsent = async (consent) => {
    if (String(consent.estado || '').toLowerCase() !== 'otorgado') return window.alert('Solo se pueden revocar consentimientos otorgados.');
    if (!window.confirm(`¿Seguro que deseas revocar el consentimiento de "${consent.titular}"?`)) return;
    try { await consentsAPI.revoke(consent.id); await loadConsents(); } 
    catch (err) { alert(err.message || 'No se pudo revocar.'); }
  };

  const handleDeleteConsent = async (consent) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el consentimiento de "${consent.titular}"?`)) return;
    try { await consentsAPI.delete(consent.id); await loadConsents(); } 
    catch (err) { alert(err.message || 'No se pudo eliminar.'); }
  };

  const filteredConsents = consents.filter((consent) => {
    const text = `${consent.titular || ''} ${consent.medio || ''} ${consent.estado || ''} ${consent.treatment_id || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const grantedCount = consents.filter((consent) => String(consent.estado || '').toLowerCase() === 'otorgado').length;
  const revokedCount = consents.filter((consent) => String(consent.estado || '').toLowerCase() === 'revocado').length;

  const getStatusStyle = (status) => {
    const st = String(status || '').toLowerCase();
    if (st === 'revocado') return { bg: '#fee2e2', text: '#ef4444', border: '#fecaca' };
    if (st === 'pendiente') return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
    return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' }; // Otorgado
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="consents-wrapper" style={{ padding: '0 8px', boxSizing: 'border-box', color: t.text }}>
      
      {/* HEADER ADAPTADO MÓVIL-FIRST */}
      <section className="consents-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ color: '#2563eb' }}><ClipboardCheck size={24} /></div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: t.text, tracking: 'tight' }}>
            Gestión de Consentimientos
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: t.textDim, paddingLeft: '4px' }}>
          Registro y administración de consentimientos de titulares.
        </p>
      </section>

      {/* BOTÓN PRINCIPAL */}
      <button
        className="btn-new-consent"
        onClick={handleNewConsent}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '12px 16px', border: 'none', borderRadius: '12px',
          background: '#2563eb', color: '#ffffff', fontWeight: 600, fontSize: '14px',
          cursor: 'pointer', marginBottom: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s'
        }}
      >
        <Plus size={16} strokeWidth={2.5} /> Nuevo Consentimiento
      </button>

      {/* GRID DE MÉTRICAS */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim, lineHeight: 1.1 }}>Total</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: t.text, marginTop: '4px' }}>{consents.length}</span>
        </div>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim, lineHeight: 1.1 }}>Otorgados</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>{grantedCount}</span>
        </div>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: t.textDim, lineHeight: 1.1 }}>Revocados</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>{revokedCount}</span>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <div style={{ position: 'absolute', insetY: 0, left: 0, paddingLeft: '14px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <Search size={16} color={t.textDim} />
        </div>
        <input 
          type="search" 
          placeholder="Buscar consentimiento..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 40px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.text, fontSize: '12px', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} 
        />
        {search && (
          <div style={{ position: 'absolute', insetY: 0, right: 0, paddingRight: '14px', display: 'flex', alignItems: 'center' }}>
            <X size={16} onClick={() => setSearch('')} color={t.textDim} style={{ cursor: 'pointer' }} />
          </div>
        )}
      </div>

      {/* TABLA ESCRITORIO Y TARJETAS MÓVIL */}
      <section aria-label="Lista de consentimientos">
        
        {/* Cabecera sección registros */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registros ({filteredConsents.length})</span>
          <span style={{ fontSize: '11px', color: t.textDim }}>Ley 21.719</span>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', fontSize: '13px', color: t.textDim }}>Cargando consentimientos...</div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', fontSize: '13px', color: '#ef4444' }}>{error}</div>
        ) : (
          <div className="consents-list-container">
            
            {/* VISTA ESCRITORIO (TABLA) */}
            <div className="desktop-table-wrapper" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: t.inputBg, borderBottom: `1px solid ${t.border}` }}>
                    {['TITULAR', 'TRATAMIENTO', 'MEDIO', 'ESTADO', 'ACCIONES'].map((title) => (
                      <th key={title} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredConsents.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: t.textDim }}>No hay consentimientos registrados.</td></tr>
                  ) : (
                    filteredConsents.map((consent) => {
                      const stStyle = getStatusStyle(consent.estado);
                      return (
                        <tr key={consent.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: t.textMuted }}>
                                {consent.titular.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '13px', color: t.text }}>{consent.titular}</div>
                                <div style={{ fontSize: '11px', color: t.textDim, marginTop: '2px' }}>{consent.titular_email || 'Sin correo'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px' }}>
                            <span title={consent.treatment_id} style={{ display: 'inline-block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {treatmentName(consent.treatment_id)}
                            </span>
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px' }}>{consent.medio || '—'}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ background: stStyle.bg, color: stStyle.text, border: `1px solid ${stStyle.border}`, padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
                              {consent.estado || 'otorgado'}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {String(consent.estado || '').toLowerCase() === 'otorgado' && (
                                <button title="Revocar" onClick={() => handleRevokeConsent(consent)} style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: '#d97706', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ban size={14} /></button>
                              )}
                              <button title="Eliminar" onClick={() => handleDeleteConsent(consent)} style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: '#ef4444', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
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
              {filteredConsents.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', fontSize: '13px', color: t.textDim }}>No hay consentimientos registrados.</div>
              ) : (
                filteredConsents.map((consent) => {
                  const stStyle = getStatusStyle(consent.estado);
                  return (
                    <article key={consent.id} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      
                      {/* Fila superior: Avatar, Nombre y Borrar */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: t.textMuted, flexShrink: 0 }}>
                            {consent.titular.charAt(0)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h2 style={{ fontSize: '14px', fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{consent.titular}</h2>
                            <p style={{ fontSize: '12px', color: t.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{consent.titular_email || 'Sin correo'}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteConsent(consent)} style={{ padding: '8px', margin: '-4px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '8px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={{ margin: '12px 0', borderTop: `1px solid ${t.inputBg}` }}></div>

                      {/* Detalles en Grid 2 columnas */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                        <div>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 600, color: t.textDim }}>Tratamiento</span>
                          <p style={{ fontWeight: 500, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '2px 0 0' }} title={treatmentName(consent.treatment_id)}>
                            {treatmentName(consent.treatment_id)}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 600, color: t.textDim }}>Medio</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0 0' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.textDim }}></span>
                            <p style={{ fontWeight: 500, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                              {consent.medio || '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Estado y Revocar (Botón row inferior) */}
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${t.inputBg}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: t.textDim, fontWeight: 500 }}>Estado:</span>
                          <span style={{ background: stStyle.bg, color: stStyle.text, border: `1px solid ${stStyle.border}`, padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
                            {consent.estado || 'otorgado'}
                          </span>
                        </div>
                        {String(consent.estado || '').toLowerCase() === 'otorgado' && (
                          <button onClick={() => handleRevokeConsent(consent)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#d97706', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            <Ban size={12} /> Revocar
                          </button>
                        )}
                      </div>

                    </article>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* Info Box */}
        <div style={{ padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#1d4ed8', marginTop: '16px' }}>
          <Info size={16} color="#2563eb" style={{ flexShrink: 0 }} />
          <span style={{ lineHeight: 1.3 }}>Todos los consentimientos quedan vinculados a los Registros de Actividades de Tratamiento (RoPA).</span>
        </div>

      </section>

      {/* FORMULARIO MODAL (ADAPTADO MÓVIL) */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', maxHeight: '95vh', overflowY: 'auto', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Nuevo Consentimiento</h2>
              <button type="button" onClick={handleCloseForm} style={{ border: 'none', background: t.inputBg, borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Titular *</label>
                <input type="text" name="titular" value={formData.titular} onChange={handleChange} placeholder="Ej: Juan Pérez" required style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Email del titular *</label>
                <input type="email" name="titular_email" value={formData.titular_email} onChange={handleChange} placeholder="Ej: juan@correo.cl" required style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Tratamiento *</label>
                <select name="treatment_id" value={formData.treatment_id} onChange={handleChange} required style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }}>
                  <option value="">{treatments.length === 0 ? '— No hay tratamientos —' : 'Selecciona un tratamiento...'}</option>
                  {treatments.map((tr) => <option key={tr.id} value={tr.id}>{tr.nombre}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Finalidad consentida *</label>
                <textarea name="finalidades_consentidas" value={formData.finalidades_consentidas} onChange={handleChange} placeholder="Ej: Envío de comunicaciones" required rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', resize: 'vertical', fontSize: '13px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Vencimiento</label>
                  <input type="date" name="fecha_expiracion" value={formData.fecha_expiracion} onChange={handleChange} min={new Date().toLocaleDateString('en-CA')} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>Medio *</label>
                  <input type="text" name="medio" value={formData.medio} onChange={handleChange} placeholder="Ej: Web" required style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: t.textMuted }}>URL del comprobante</label>
                <input type="url" name="comprobante_url" value={formData.comprobante_url} onChange={handleChange} placeholder="https://..." style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, outline: 'none', fontSize: '13px' }} />
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button type="button" onClick={handleCloseForm} disabled={saving} className="btn-cancel" style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-save" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Guardando...' : 'Crear Consentimiento'}</button>
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
        .btn-new-consent { width: 100%; justify-content: center; }
        
        .form-actions { flex-direction: column-reverse; }
        .btn-cancel, .btn-save { width: 100%; justify-content: center; }

        /* Escritorio (> 768px) */
        @media (min-width: 768px) {
          .consents-wrapper { padding: 32px 16px !important; }
          .consents-header { display: flex; justify-content: space-between; align-items: flex-end; }
          .btn-new-consent { width: auto; margin-bottom: 0 !important; }
          
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

export default ConsentsScreen;