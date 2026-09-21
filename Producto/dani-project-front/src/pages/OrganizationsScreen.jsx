import React, { useState, useEffect, useContext } from 'react';
import { Building2, Search, Activity, PauseCircle } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { organizationsAPI } from '../services/api';

export default function OrganizationsScreen() {
  const { theme: t, darkMode } = useContext(ThemeContext);
  const [orgs, setOrgs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    try {
      const data = await organizationsAPI.getAll();
      setOrgs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (org) => {
    try {
      await organizationsAPI.update(org.id, { activo: !org.activo });
      loadOrgs();
    } catch (e) {
      alert("Error al actualizar la empresa");
    }
  };

  const filtered = orgs.filter(o => o.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: t.text, marginBottom: '8px' }}>Gestión de Empresas</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>Administración del sistema Multi-Tenant</p>
        </div>
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
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>Plan</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', color: t.textDim, textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(org => (
              <tr key={org.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', background: '#3b82f620', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={16} color="#3b82f6" /></div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{org.nombre}</span>
                </td>
                <td style={{ padding: '16px 20px', fontSize: '13px', color: t.textDim }}>{org.plan}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ padding: '4px 10px', background: org.activo ? '#10b98120' : '#ef444420', color: org.activo ? '#10b981' : '#ef4444', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>{org.activo ? 'Activa' : 'Suspendida'}</span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button onClick={() => toggleStatus(org)} style={{ padding: '6px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.textMuted, fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {org.activo ? <PauseCircle size={12}/> : <Activity size={12}/>} {org.activo ? 'Suspender' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}