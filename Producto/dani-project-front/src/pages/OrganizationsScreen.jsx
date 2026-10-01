import React, { useState, useEffect, useContext } from 'react';
import { Building2, Search, Activity, PauseCircle, Plus, X, UserPlus, MoreVertical } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { organizationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function OrganizationsScreen() {
  const { theme: t, darkMode } = useContext(ThemeContext);
  const { enterOrg } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null); // empresa con el menú abierto

  // Modal: crear empresa
  const [createOpen, setCreateOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Modal: invitar usuario
  const [inviteOrg, setInviteOrg] = useState(null); // la empresa a la que se invita
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
  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
  const modalCard = { background: darkMode ? '#111827' : '#ffffff', borderRadius: '20px', border: `1px solid ${t.border}`, width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.45)' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: t.text, marginBottom: '8px' }}>Gestión de Empresas</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>Administración del sistema Multi-Tenant</p>
        </div>
        <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 18px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
          <Plus size={16} /> Nueva Empresa
        </button>
      </div>

      <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.textDim }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresa..." style={{ padding: '8px 12px 8px 36px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, outline: 'none' }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>Empresa</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>URL</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(org => (
              <tr key={org.id} onClick={() => enterOrg(org)} title="Entrar al panel de esta empresa" style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer' }}>
                <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', background: '#3b82f620', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={16} color="#3b82f6" /></div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{org.nombre}</span>
                </td>
                <td style={{ padding: '16px 20px', fontSize: '13px', color: t.textMuted, fontFamily: 'monospace' }}>/{org.slug || '—'}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ padding: '4px 10px', background: org.activo ? '#10b98120' : '#ef444420', color: org.activo ? '#10b981' : '#ef4444', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>{org.activo ? 'Activa' : 'Suspendida'}</span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === org.id ? null : org.id)}
                      title="Acciones"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.textDim, padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {menuOpenId === org.id && (
                      <>
                        <div onClick={() => setMenuOpenId(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', minWidth: '190px', background: darkMode ? '#111827' : '#ffffff', border: `1px solid ${t.border}`, borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.35)', zIndex: 50, overflow: 'hidden', textAlign: 'left' }}>
                          <button
                            onClick={() => { openInvite(org); setMenuOpenId(null); }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#10b981', fontSize: '13px', fontWeight: 500 }}
                          >
                            <UserPlus size={16} /> Invitar usuario
                          </button>
                          <button
                            onClick={() => { toggleStatus(org); setMenuOpenId(null); }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: org.activo ? '#f59e0b' : '#10b981', fontSize: '13px', fontWeight: 500, borderTop: `1px solid ${t.border}` }}
                          >
                            {org.activo ? <PauseCircle size={16} /> : <Activity size={16} />} {org.activo ? 'Suspender' : 'Activar'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: t.textDim, fontSize: '14px' }}>No hay empresas registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: crear empresa (solo nombre) */}
      {createOpen && (
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>Nueva Empresa</h2>
              <button onClick={() => setCreateOpen(false)} style={{ background: 'transparent', border: 'none', color: t.textDim, cursor: 'pointer' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre de la empresa</label>
                <input required autoFocus value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} placeholder="Acme Corp" />
              </div>
              <p style={{ fontSize: '12px', color: t.textDim, margin: 0 }}>
                Después de crearla podrás invitar usuarios desde el botón "Invitar usuario" de la empresa.
              </p>
              {createError && <div style={{ padding: '10px 14px', background: '#ef444420', color: '#ef4444', borderRadius: '10px', fontSize: '13px' }}>{createError}</div>}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setCreateOpen(false)} style={{ flex: 1, padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
                <button type="submit" disabled={creating} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.7 : 1 }}>{creating ? 'Creando...' : 'Crear empresa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: invitar usuario a una empresa */}
      {inviteOrg && (
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>Invitar usuario</h2>
              <button onClick={() => setInviteOrg(null)} style={{ background: 'transparent', border: 'none', color: t.textDim, cursor: 'pointer' }}><X size={22} /></button>
            </div>
            <p style={{ fontSize: '13px', color: t.textDim, marginBottom: '18px' }}>Empresa: <strong style={{ color: t.text }}>{inviteOrg.nombre}</strong></p>
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre del usuario</label>
                <input required autoFocus value={inviteName} onChange={e => setInviteName(e.target.value)} style={inputStyle} placeholder="Ana Pérez" />
              </div>
              <div>
                <label style={labelStyle}>Correo del usuario</label>
                <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={inputStyle} placeholder="ana@acme.com" />
              </div>
              <div>
                <label style={labelStyle}>Rol</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={inputStyle}>
                  <option value="owner">Owner (Dueño)</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Manager</option>
                  <option value="auditor">Auditor</option>
                  <option value="dpo">DPO (Protección de Datos)</option>
                  <option value="employee">Empleado</option>
                </select>
              </div>
              <p style={{ fontSize: '12px', color: t.textDim, margin: 0 }}>
                Se enviará una invitación por correo. El usuario definirá su propia contraseña al activar la cuenta.
              </p>
              {inviteError && <div style={{ padding: '10px 14px', background: '#ef444420', color: '#ef4444', borderRadius: '10px', fontSize: '13px' }}>{inviteError}</div>}
              {inviteSuccess && <div style={{ padding: '10px 14px', background: '#10b98120', color: '#10b981', borderRadius: '10px', fontSize: '13px' }}>{inviteSuccess}</div>}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setInviteOrg(null)} style={{ flex: 1, padding: '12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
                <button type="submit" disabled={inviting} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: inviting ? 'default' : 'pointer', opacity: inviting ? 0.7 : 1 }}>{inviting ? 'Enviando...' : 'Enviar invitación'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
