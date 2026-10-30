/* eslint-disable */
import React, { useState, useEffect, useContext } from 'react';
import {
  Users, UserPlus, Search, Filter, MoreVertical,
  Shield, Edit3, Trash2, Mail, CheckCircle2, XCircle,
  Clock, Key, Building2, ShieldCheck, Ban, UserCheck
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { userAPI, organizationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UserManagementScreen = () => {
  const { theme: t, language, darkMode } = useContext(ThemeContext);
  const { user: authUser } = useAuth();
  const isSuperadmin = authUser?.role === 'superadmin';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null); 

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'employee', orgId: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  const [allOrgs, setAllOrgs] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isDeleting, setIsDeleting] = useState(null);
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const data = await userAPI.getAll();
      if (data && Array.isArray(data)) {
        const mappedUsers = data.map(u => {
          const fullName = u.full_name || 'Usuario';
          return {
            id: u.id, name: fullName, email: u.email,
            role: u.role || 'employee', department: u.department || 'General',
            organization: u.organization_name || '—', organizationId: u.organization_id || null,
            status: u.is_active ? 'active' : 'inactive',
            lastLogin: u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Nunca',
            avatar: fullName.substring(0, 2).toUpperCase()
          };
        });
        setUsers(mappedUsers);
      } else if (data?.detail) {
        alert("No se pudo cargar la lista de usuarios. Verifica que tu sesión esté activa.");
      }
    } catch (error) {
      alert("Error de conexión al cargar usuarios.");
    }
  };

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    if (!isSuperadmin) { setAllOrgs([]); return; }
    let cancelled = false;
    organizationsAPI.getAll().then(data => { if (!cancelled && Array.isArray(data)) setAllOrgs(data); })
      .catch(error => { if (!cancelled) setAllOrgs([]); });
    return () => { cancelled = true; };
  }, [isSuperadmin]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setInviteMsg(null);
    try {
      let res;
      if (isSuperadmin) {
        if (!newUser.orgId) throw new Error('Selecciona una empresa para continuar.');
        res = await organizationsAPI.inviteUser(newUser.orgId, { name: newUser.full_name, email: newUser.email, role: newUser.role });
      } else {
        res = await userAPI.invite({ name: newUser.full_name, email: newUser.email, role: newUser.role });
      }
      setInviteMsg(res?.email_sent ? `Invitación enviada a ${res.email}. Definirá su contraseña al activar la cuenta.` : `Usuario creado, pero el correo no se pudo enviar. Revisa la configuración SMTP.`);
      setNewUser({ full_name: '', email: '', role: 'employee', orgId: '' });
      await loadUsers();
    } catch (error) {
      setInviteMsg(`Error al invitar usuario: ${error.message}`);
    } finally { setIsCreating(false); }
  };

  const handleQuickRoleChange = async (user, newRole) => {
    try {
      await userAPI.update(user.id, { role: newRole });
      await loadUsers();
    } catch (error) { alert("Error al cambiar el rol: " + error.message); }
  };

  const handleToggleActive = async (user, e) => {
    e.stopPropagation();
    const suspender = user.status === 'active';
    if (suspender && !window.confirm(`¿Suspender a ${user.name}? No podrá acceder a su empresa hasta reactivarlo.`)) return;
    try {
      await userAPI.update(user.id, { is_active: !suspender });
      await loadUsers();
    } catch (error) { alert("Error al cambiar el estado: " + error.message); }
  };

  const handleOpenEdit = (user, e) => {
    e.stopPropagation();
    setEditingUser({ id: user.id, full_name: user.name, email: user.email, role: user.role, is_active: user.status === 'active' });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await userAPI.update(editingUser.id, { full_name: editingUser.full_name, email: editingUser.email, role: editingUser.role, is_active: editingUser.is_active });
      setIsEditModalOpen(false); setEditingUser(null); await loadUsers();
    } catch (error) { alert("Error al actualizar usuario: " + error.message); } 
    finally { setIsUpdating(false); }
  };

  const handleDeleteUser = async (userId, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;
    setIsDeleting(userId);
    try {
      await userAPI.delete(userId);
      if (selectedUser?.id === userId) setSelectedUser(null);
      await loadUsers();
    } catch (error) { alert("Error al eliminar usuario: " + error.message); } 
    finally { setIsDeleting(null); }
  };

  const rolesConfig = {
    superadmin: { label: 'Superadmin',    color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Shield },
    owner:      { label: 'Dueño',         color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', icon: Shield },
    admin:      { label: 'Administrador',  color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: Shield },
    manager:    { label: 'Manager',        color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Key },
    auditor:    { label: 'Auditor',        color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)', icon: Search },
    dpo:        { label: 'DPO',            color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: Key },
    employee:   { label: 'Empleado',       color: t.textDim, bg: t.inputBg,                  icon: Users },
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesOrg = orgFilter === 'all' || user.organizationId === orgFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesOrg;
  });

  const orgOptions = Array.from(new Map(users.filter(u => u.organizationId).map(u => [u.organizationId, u.organization])).entries());

  return (
    <div className="users-container" style={{ animation: 'fadeIn 0.4s ease', color: t.text, minHeight: '100%', boxSizing: 'border-box', padding: '0 8px' }}>
      
      {/* HEADER ADAPTADO MÓVIL-FIRST */}
      <section className="users-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: t.text, tracking: 'tight', lineHeight: 1.2 }}>Gestión de Usuarios</h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: t.textDim, lineHeight: 1.4 }}>Administra accesos y asigna roles para cumplimiento ISO 27001</p>
        </div>
        <button
          className="btn-invite"
          onClick={() => { setInviteMsg(null); setNewUser({ full_name: '', email: '', role: 'employee', orgId: '' }); setIsAddModalOpen(true); }}
          style={{ width: '100%', padding: '12px 20px', background: '#2563eb', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)', transition: 'all 0.2s' }}
        >
          <UserPlus size={16} strokeWidth={2.5} /> Invitar usuario
        </button>
      </section>

      {/* MÉTRICAS GRID */}
      <section className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Usuarios', value: users.length, color: '#2563eb', icon: Users, bg: '#eff6ff' },
          { label: 'Usuarios Activos', value: users.filter(u => u.status === 'active').length, color: '#0ea5e9', icon: CheckCircle2, bg: '#f0f9ff' },
          { label: 'Inactivos/Pendientes', value: users.filter(u => u.status !== 'active').length, color: '#d97706', icon: Mail, bg: '#fffbeb' },
          { label: 'Equipo de Seguridad', value: users.filter(u => ['superadmin', 'owner', 'admin', 'manager', 'auditor', 'dpo'].includes(u.role)).length, color: '#7c3aed', icon: Shield, bg: '#f5f3ff' }
        ].map((stat, idx) => (
          <div key={idx} style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: t.text, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: t.textDim, fontWeight: 600, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* BÚSQUEDA Y FILTROS */}
      <section className="search-filters" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color={t.textDim} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input 
            type="search" 
            placeholder="Buscar usuarios..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 40px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', color: t.text, fontSize: '13px', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
          />
        </div>
        <div className="filters-scroll no-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '8px 12px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer', outline: 'none', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <option value="all">Todos los Roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="owner">Dueño</option>
            <option value="admin">Administrador</option>
            <option value="manager">Manager</option>
            <option value="auditor">Auditor</option>
            <option value="dpo">DPO</option>
            <option value="employee">Empleado</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer', outline: 'none', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <option value="all">Todos los Estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="pending">Pendientes</option>
          </select>
          {isSuperadmin && (
            <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} style={{ padding: '8px 12px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer', outline: 'none', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <option value="all">Todas las Empresas</option>
              {orgOptions.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
            </select>
          )}
        </div>
      </section>

      {/* LISTADO DE USUARIOS */}
      <section aria-label="Lista de Usuarios">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuarios ({filteredUsers.length})</span>
          <span style={{ fontSize: '10px', color: t.textDim }}>Desliza para ver más</span>
        </div>

        {/* VISTA ESCRITORIO (TABLA) */}
        <div className="desktop-table-wrapper" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: t.inputBg, borderBottom: `1px solid ${t.border}` }}>
                {['Usuario', 'Rol', isSuperadmin ? 'Empresa' : 'Departamento', 'Estado', 'Acciones'].map((title, i) => (
                  <th key={i} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', textAlign: i === 4 ? 'right' : 'left' }}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: t.textDim }}>No se encontraron usuarios.</td></tr>
              ) : (
                filteredUsers.map((u) => {
                  const rConfig = rolesConfig[u.role] || rolesConfig.employee;
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <tr key={u.id} onClick={() => setSelectedUser(u)} style={{ borderBottom: `1px solid ${t.border}`, background: isSelected ? 'rgba(37,99,235,0.05)' : 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{u.avatar}</div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: t.text, marginBottom: '2px' }}>{u.name}</div>
                            <div style={{ fontSize: '11px', color: t.textDim }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                        {isSuperadmin && u.role !== 'superadmin' ? (
                          <select value={u.role} onChange={(e) => handleQuickRoleChange(u, e.target.value)} style={{ padding: '4px 8px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text, fontSize: '11px', fontWeight: 600, outline: 'none' }}>
                            {Object.entries(rolesConfig).filter(([k]) => k !== 'superadmin').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: rConfig.bg, borderRadius: '6px', color: rConfig.color, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}><rConfig.icon size={12} /> {rConfig.label}</div>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '12px', color: t.text }}>{isSuperadmin ? u.organization : u.department}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.status === 'active' ? '#2563eb' : u.status === 'inactive' ? '#dc2626' : '#d97706' }} />
                          <span style={{ fontSize: '11px', color: t.textDim, fontWeight: 600 }}>{u.status === 'active' ? 'Activo' : u.status === 'inactive' ? 'Inactivo' : 'Pendiente'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button onClick={() => setMenuOpenId(menuOpenId === u.id ? null : u.id)} style={{ background: 'transparent', border: 'none', color: t.textDim, cursor: 'pointer', padding: '4px' }}><MoreVertical size={16} /></button>
                          {menuOpenId === u.id && (
                            <>
                              <div onClick={() => setMenuOpenId(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                              <div style={{ position: 'absolute', top: '100%', right: 0, minWidth: '160px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', textAlign: 'left' }}>
                                {u.role !== 'superadmin' && <button onClick={(e) => { handleToggleActive(u, e); setMenuOpenId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'transparent', border: 'none', color: u.status === 'active' ? '#d97706' : '#2563eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{u.status === 'active' ? <Ban size={14} /> : <UserCheck size={14} />} {u.status === 'active' ? 'Suspender' : 'Reactivar'}</button>}
                                <button onClick={(e) => { handleOpenEdit(u, e); setMenuOpenId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'transparent', border: 'none', color: t.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}><Edit3 size={14} /> Editar</button>
                                <button onClick={(e) => { handleDeleteUser(u.id, e); setMenuOpenId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'transparent', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderTop: `1px solid ${t.border}` }}><Trash2 size={14} /> Eliminar</button>
                              </div>
                            </>
                          )}
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
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', fontSize: '13px', color: t.textDim, background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px' }}>No se encontraron usuarios.</div>
          ) : (
            filteredUsers.map((u) => {
              const rConfig = rolesConfig[u.role] || rolesConfig.employee;
              return (
                <article key={u.id} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  
                  {/* Fila Superior: Avatar, Data & MoreMenu */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>{u.avatar}</div>
                      <div style={{ minWidth: 0, paddingTop: '2px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 800, color: t.text, margin: '0 0 2px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</h2>
                        <p style={{ fontSize: '12px', color: t.textDim, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>
                      </div>
                    </div>
                    
                    <div style={{ position: 'relative' }}>
                      <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === u.id ? null : u.id); }} style={{ background: 'transparent', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '4px', margin: '-4px' }}><MoreVertical size={18} /></button>
                      {menuOpenId === u.id && (
                        <>
                          <div onClick={() => setMenuOpenId(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                          <div style={{ position: 'absolute', top: '100%', right: 0, minWidth: '160px', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
                            {u.role !== 'superadmin' && <button onClick={(e) => { handleToggleActive(u, e); setMenuOpenId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'transparent', border: 'none', color: u.status === 'active' ? '#d97706' : '#2563eb', fontSize: '12px', fontWeight: 600 }}><Ban size={14} /> {u.status === 'active' ? 'Suspender' : 'Reactivar'}</button>}
                            <button onClick={(e) => { handleOpenEdit(u, e); setMenuOpenId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'transparent', border: 'none', color: t.text, fontSize: '12px', fontWeight: 600 }}><Edit3 size={14} /> Editar</button>
                            <button onClick={(e) => { handleDeleteUser(u.id, e); setMenuOpenId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'transparent', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: 600, borderTop: `1px solid ${t.border}` }}><Trash2 size={14} /> Eliminar</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ margin: '12px 0', borderTop: `1px solid ${t.inputBg}` }}></div>

                  {/* Fila Inferior: Rol, Empresa, Estado */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: t.textDim }}>Rol</span>
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px', background: rConfig.bg, borderRadius: '6px', color: rConfig.color, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}><rConfig.icon size={10} /> {rConfig.label}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: t.textDim, display: 'block' }}>Empresa</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: t.text }}>{isSuperadmin ? u.organization : u.department}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.status === 'active' ? '#2563eb' : u.status === 'inactive' ? '#dc2626' : '#d97706' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: t.textDim }}>{u.status === 'active' ? 'ACTIVO' : u.status === 'inactive' ? 'INACTIVO' : 'PENDIENTE'}</span>
                      </div>
                    </div>
                  </div>

                </article>
              );
            })
          )}
        </div>
      </section>

      {/* MODAL CREAR USUARIO */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="modal-content" style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, width: '100%', maxWidth: '420px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: t.text }}>Invitar Usuario</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: t.inputBg, border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}><XCircle size={18} /></button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isSuperadmin && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.textMuted, marginBottom: '6px' }}>Nombre del usuario *</label>
                  <input required type="text" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '13px', outline: 'none' }} placeholder="Ej: Ana Martínez" />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.textMuted, marginBottom: '6px' }}>Correo Electrónico *</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '13px', outline: 'none' }} placeholder="ana@empresa.com" />
              </div>
              {isSuperadmin && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.textMuted, marginBottom: '6px' }}>Empresa *</label>
                  <select required value={newUser.orgId} onChange={e => setNewUser({...newUser, orgId: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '13px', outline: 'none' }}>
                    <option value="" disabled>Seleccionar empresa…</option>
                    {allOrgs.map(org => <option key={org.id} value={org.id}>{org.nombre}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.textMuted, marginBottom: '6px' }}>Rol en el Sistema *</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: '13px', outline: 'none' }}>
                  <option value="owner">Dueño</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Manager</option>
                  <option value="auditor">Auditor</option>
                  <option value="dpo">DPO</option>
                  <option value="employee">Empleado</option>
                </select>
              </div>

              <p style={{ fontSize: '11px', color: t.textDim, margin: 0, lineHeight: 1.4 }}>Se enviará una invitación por correo. El usuario definirá su contraseña al activar la cuenta.</p>
              {inviteMsg && <div style={{ padding: '10px', background: inviteMsg.startsWith('Error') ? '#fee2e2' : '#eff6ff', color: inviteMsg.startsWith('Error') ? '#dc2626' : '#2563eb', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>{inviteMsg}</div>}

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-cancel" style={{ padding: '12px 16px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cerrar</button>
                <button type="submit" disabled={isCreating || (isSuperadmin && allOrgs.length === 0)} className="btn-save" style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, fontSize: '13px', cursor: isCreating ? 'not-allowed' : 'pointer', opacity: isCreating ? 0.7 : 1 }}>{isCreating ? 'Enviando...' : 'Enviar invitación'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO */}
      {isEditModalOpen && editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="modal-content" style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, width: '100%', maxWidth: '420px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: t.text }}>Editar Usuario</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: t.inputBg, border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}><XCircle size={18} /></button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.textMuted, marginBottom: '6px' }}>Nombre Completo</label>
                <input required type="text" value={editingUser.full_name} onChange={e => setEditingUser({...editingUser, full_name: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.textMuted, marginBottom: '6px' }}>Correo Electrónico</label>
                <input required type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.textMuted, marginBottom: '6px' }}>Rol en el Sistema</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} disabled={editingUser.role === 'superadmin'} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px', color: t.text, fontSize: '13px', outline: 'none' }}>
                  {editingUser.role === 'superadmin' && <option value="superadmin">Superadmin (Plataforma)</option>}
                  <option value="owner">Dueño</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Manager</option>
                  <option value="auditor">Auditor</option>
                  <option value="dpo">DPO</option>
                  <option value="employee">Empleado</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '10px' }}>
                <input type="checkbox" id="is_active" checked={editingUser.is_active} onChange={e => setEditingUser({...editingUser, is_active: e.target.checked})} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }} />
                <label htmlFor="is_active" style={{ fontSize: '13px', fontWeight: 600, color: t.text, cursor: 'pointer' }}>Usuario activo</label>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-cancel" style={{ padding: '12px 16px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isUpdating} className="btn-save" style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, fontSize: '13px', cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.7 : 1 }}>{isUpdating ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESTILOS INYECTADOS GLOBALES */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .desktop-table-wrapper { display: none; }
        .mobile-cards-wrapper { display: flex; }
        
        .btn-invite { width: 100%; justify-content: center; }
        .form-actions { flex-direction: column-reverse; }
        .btn-cancel, .btn-save { width: 100%; justify-content: center; }

        @media (min-width: 768px) {
          .users-container { padding: 32px 16px !important; }
          .users-header { align-items: flex-end !important; }
          .btn-invite { width: auto !important; }
          
          .metrics-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .search-filters { flex-direction: row !important; align-items: center; justify-content: space-between; }
          .search-filters > div:first-child { width: 320px; }

          .desktop-table-wrapper { display: block; }
          .mobile-cards-wrapper { display: none; }

          .modal-content { padding: 32px !important; }
          .form-actions { flex-direction: row; }
          .btn-cancel, .btn-save { width: auto !important; }
        }
      `}} />
    </div>
  );
};

export default UserManagementScreen;