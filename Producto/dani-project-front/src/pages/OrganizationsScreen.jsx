import React, { useState, useEffect, useContext } from 'react';
import { Building2, Search, Activity, PauseCircle, Plus, X, UserPlus, MoreVertical, ShieldAlert, ChevronRight } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { organizationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function OrganizationsScreen() {
  const { theme: t, darkMode } = useContext(ThemeContext);
  const { enterOrg } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null); 

  // Modal: crear empresa
  const [createOpen, setCreateOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Modal: invitar usuario
  const [inviteOrg, setInviteOrg] = useState(null); 
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('owner');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);

  useEffect(() => { loadOrgs(); }, []);

  const loadOrgs = async () => {
    try {
      const data = await organizationsAPI.getAll();
      setOrgs(data);
    } catch (e) { console.error(e); }
  };

  const toggleStatus = async (org) => {
    try {
      await organizationsAPI.update(org.id, { activo: !org.activo });
      loadOrgs();
    } catch (e) { alert("Error al actualizar la empresa"); }
  };

  // --- Crear empresa ---
  const openCreate = () => { setNombre(''); setCreateError(null); setCreateOpen(true); };
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await organizationsAPI.create({ nombre });
      setCreateOpen(false);
      await loadOrgs();
    } catch (err) {
      setCreateError(err.message || 'Error al crear la empresa');
    } finally { setCreating(false); }
  };

  // --- Invitar usuario ---
  const openInvite = (org) => {
    setInviteOrg(org);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('owner');
    setInviteError(null);
    setInviteSuccess(null);
  };
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInviting(true);
    try {
      const res = await organizationsAPI.inviteUser(inviteOrg.id, { name: inviteName, email: inviteEmail, role: inviteRole });
      setInviteSuccess(
        res?.email_sent
          ? `Invitación enviada a ${res.email}. Definirá su contraseña al activar la cuenta.`
          : `⚠️ Usuario creado, pero el correo NO se pudo enviar (revisa la configuración SMTP).`
      );
      setInviteEmail('');
    } catch (err) {
      setInviteError(err.message || 'Error al invitar usuario');
    } finally { setInviting(false); }
  };

  const filtered = orgs.filter(o => o.nombre.toLowerCase().includes(search.toLowerCase()));

  const inputStyle = { width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '12px', color: t.textDim, marginBottom: '6px', fontWeight: 600 };
  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' };
  const modalCard = { background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };

  return (
    <div className="orgs-container" style={{ animation: 'fadeIn 0.4s ease', boxSizing: 'border-box', color: t.text, padding: '0 8px' }}>
      
      {/* ENCABEZADO ADAPTADO MÓVIL-FIRST */}
      <section className="orgs-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: t.text, tracking: 'tight', lineHeight: 1.2 }}>Gestión de Empresas</h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: t.textDim, lineHeight: 1.4 }}>Administración del sistema Multi-Tenant</p>
        </div>
        <button 
          className="btn-new-org"
          onClick={openCreate} 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 18px', background: '#2563eb', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)', transition: 'all 0.2s' }}
        >
          <Plus size={16} strokeWidth={2.5} /> Nueva Empresa
        </button>
      </section>

      {/* MÉTRICAS (GRID ADAPTABLE) */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={20} color="#2563eb" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: t.text, lineHeight: 1 }}>{orgs.length}</div>
            <div style={{ fontSize: '11px', color: t.textDim, fontWeight: 600, marginTop: '4px', textTransform: 'uppercase' }}>Total Empresas</div>
          </div>
        </div>

        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={20} color="#10b981" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: t.text, lineHeight: 1 }}>{orgs.filter(o => o.activo).length}</div>
            <div style={{ fontSize: '11px', color: t.textDim, fontWeight: 600, marginTop: '4px', textTransform: 'uppercase' }}>Activas</div>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} color={t.textDim} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input 
          type="search" 
          placeholder="Buscar empresa..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 40px', borderRadius: '12px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.text, fontSize: '13px', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }} 
        />
      </div>

      {/* LISTA DE EMPRESAS */}
      <section aria-label="Lista de Empresas">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Empresas Registradas ({filtered.length})</span>
          <span style={{ fontSize: '10px', color: t.textDim }}>Multi-Tenant</span>
        </div>

        {/* VISTA ESCRITORIO (TABLA) */}
        <div className="desktop-table-wrapper" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: t.inputBg, borderBottom: `1px solid ${t.border}` }}>
                {['Empresa', 'URL', 'Estado', 'Acciones'].map((title, i) => (
                  <th key={title} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', textAlign: i === 3 ? 'right' : 'left' }}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: t.textDim }}>No hay empresas registradas.</td></tr>
              ) : (
                filtered.map((org) => (
                  <tr key={org.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={16} color="#2563eb" />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: t.text }}>{org.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '12px', color: t.textMuted, fontFamily: 'monospace', background: t.inputBg, padding: '4px 8px', borderRadius: '6px', border: `1px solid ${t.border}` }}>/{org.slug || '—'}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: org.activo ? '#eff6ff' : '#fee2e2', color: org.activo ? '#2563eb' : '#dc2626', border: `1px solid ${org.activo ? '#bfdbfe' : '#fecaca'}`, padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: org.activo ? '#2563eb' : '#dc2626', animation: org.activo ? 'pulse 2s infinite' : 'none' }}></span>
                        {org.activo ? 'Activa' : 'Suspendida'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button onClick={() => enterOrg(org)} style={{ padding: '8px 12px', background: t.inputBg, color: '#2563eb', border: `1px solid ${t.border}`, borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Search size={12} /> Gestionar
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button onClick={() => setMenuOpenId(menuOpenId === org.id ? null : org.id)} style={{ background: 'transparent', border: 'none', color: t.textDim, cursor: 'pointer', padding: '6px' }}>
                            <MoreVertical size={16} />
                          </button>
                          {menuOpenId === org.id && (
                            <>
                              <div onClick={() => setMenuOpenId(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                              <div style={{ position: 'absolute', top: '100%', right: 0, minWidth: '160px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', textAlign: 'left', marginTop: '4px' }}>
                                <button onClick={() => { openInvite(org); setMenuOpenId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                  <UserPlus size={14} /> Invitar usuario
                                </button>
                                <button onClick={() => { toggleStatus(org); setMenuOpenId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'transparent', border: 'none', color: org.activo ? '#d97706' : '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderTop: `1px solid ${t.border}` }}>
                                  {org.activo ? <PauseCircle size={14} /> : <Activity size={14} />} {org.activo ? 'Suspender' : 'Activar'}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL (TARJETAS) */}
        <div className="mobile-cards-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', fontSize: '13px', color: t.textDim, background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><ShieldAlert size={24} color={t.textDim} /></div>
              No hay empresas registradas.
            </div>
          ) : (
            filtered.map((org) => (
              <article key={org.id} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={20} color="#2563eb" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ fontSize: '15px', fontWeight: 800, color: t.text, margin: '0 0 2px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{org.nombre}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: t.textDim }}>URL:</span>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: t.textMuted, background: t.inputBg, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${t.border}` }}>/{org.slug || '—'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === org.id ? null : org.id); }} style={{ background: 'transparent', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '4px', margin: '-4px' }}><MoreVertical size={18} /></button>
                    {menuOpenId === org.id && (
                      <>
                        <div onClick={() => setMenuOpenId(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                        <div style={{ position: 'absolute', top: '100%', right: 0, minWidth: '160px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', marginTop: '4px' }}>
                          <button onClick={() => { openInvite(org); setMenuOpenId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 600 }}><UserPlus size={14} /> Invitar usuario</button>
                          <button onClick={() => { toggleStatus(org); setMenuOpenId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'transparent', border: 'none', color: org.activo ? '#d97706' : '#10b981', fontSize: '12px', fontWeight: 600, borderTop: `1px solid ${t.border}` }}>
                            {org.activo ? <PauseCircle size={14} /> : <Activity size={14} />} {org.activo ? 'Suspender' : 'Activar'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ margin: '12px 0', borderTop: `1px solid ${t.inputBg}` }}></div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', color: t.textDim, textTransform: 'uppercase', fontWeight: 700 }}>Estado:</span>
                    <span style={{ background: org.activo ? '#eff6ff' : '#fee2e2', color: org.activo ? '#2563eb' : '#dc2626', border: `1px solid ${org.activo ? '#bfdbfe' : '#fecaca'}`, padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: org.activo ? '#2563eb' : '#dc2626' }}></span>
                      {org.activo ? 'Activa' : 'Suspendida'}
                    </span>
                  </div>
                  
                  <button onClick={() => enterOrg(org)} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontSize: '12px', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    Gestionar <ChevronRight size={14} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* MODAL CREAR EMPRESA */}
      {createOpen && (
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: t.text }}>Nueva Empresa</h2>
              <button onClick={() => setCreateOpen(false)} style={{ background: t.inputBg, border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre de la empresa *</label>
                <input required autoFocus value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} placeholder="Ej: Acme Corp" />
              </div>
              <p style={{ fontSize: '12px', color: t.textDim, margin: 0, lineHeight: 1.4 }}>
                Después de crearla, podrás invitar usuarios desde el menú de opciones (<MoreVertical size={12} style={{display:'inline'}}/>) de la empresa.
              </p>
              {createError && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>{createError}</div>}
              
              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setCreateOpen(false)} className="btn-cancel" style={{ padding: '12px 16px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={creating} className="btn-save" style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, fontSize: '13px', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}>{creating ? 'Creando...' : 'Crear empresa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INVITAR USUARIO */}
      {inviteOrg && (
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: t.text }}>Invitar Usuario</h2>
              <button onClick={() => setInviteOrg(null)} style={{ background: t.inputBg, border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', padding: '8px 12px', background: t.inputBg, borderRadius: '8px', border: `1px solid ${t.border}` }}>
              <Building2 size={14} color={t.textDim} />
              <span style={{ fontSize: '12px', color: t.textDim }}>Empresa destino: <strong style={{ color: t.text }}>{inviteOrg.nombre}</strong></span>
            </div>

            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre del usuario *</label>
                <input required autoFocus value={inviteName} onChange={e => setInviteName(e.target.value)} style={inputStyle} placeholder="Ej: Ana Pérez" />
              </div>
              <div>
                <label style={labelStyle}>Correo electrónico *</label>
                <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={inputStyle} placeholder="ana@acme.com" />
              </div>
              <div>
                <label style={labelStyle}>Rol de acceso *</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{...inputStyle, cursor: 'pointer'}}>
                  <option value="owner">Dueño</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Manager</option>
                  <option value="auditor">Auditor</option>
                  <option value="dpo">DPO (Protección de Datos)</option>
                  <option value="employee">Empleado</option>
                </select>
              </div>
              
              <p style={{ fontSize: '11px', color: t.textDim, margin: 0, lineHeight: 1.4 }}>
                Se enviará una invitación por correo. El usuario definirá su propia contraseña al activar la cuenta.
              </p>
              
              {inviteError && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>{inviteError}</div>}
              {inviteSuccess && <div style={{ padding: '10px 14px', background: '#dbeafe', color: '#2563eb', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>{inviteSuccess}</div>}
              
              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setInviteOrg(null)} className="btn-cancel" style={{ padding: '12px 16px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cerrar</button>
                <button type="submit" disabled={inviting} className="btn-save" style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, fontSize: '13px', cursor: inviting ? 'not-allowed' : 'pointer', opacity: inviting ? 0.7 : 1 }}>{inviting ? 'Enviando...' : 'Enviar invitación'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESTILOS INYECTADOS GLOBALES */}
      <style dangerouslySetInnerHTML={{__html: `
        .desktop-table-wrapper { display: none; }
        .mobile-cards-wrapper { display: flex; }
        
        .btn-new-org { width: 100%; justify-content: center; }
        .form-actions { flex-direction: column-reverse; }
        .btn-cancel, .btn-save { width: 100%; justify-content: center; }

        @media (min-width: 768px) {
          .orgs-container { padding: 32px 16px !important; }
          .orgs-header { align-items: flex-end !important; }
          .btn-new-org { width: auto !important; }
          
          .metrics-grid { grid-template-columns: repeat(2, 280px) !important; }

          .desktop-table-wrapper { display: block; }
          .mobile-cards-wrapper { display: none; }

          .form-actions { flex-direction: row; }
          .btn-cancel, .btn-save { width: auto !important; }
        }
      `}} />
    </div>
  );
}