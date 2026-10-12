/* eslint-disable */
import React, { useContext, useState, useEffect } from 'react';
import { 
  Shield, Clock, CheckCircle2, FileText, X, Check
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { documentsAPI } from '../services/api';

const EmployeePortalScreen = () => {
  const { theme: t, darkMode } = useContext(ThemeContext);

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const data = await documentsAPI.getPublishedPolicies();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error("Error loading policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    setAcknowledging(true);
    try {
      await documentsAPI.acknowledgePolicy(id);
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, is_acknowledged: true } : p));
      setSelectedPolicy(null);
    } catch (error) {
      console.error("Error acknowledging policy:", error);
    } finally {
      setAcknowledging(false);
    }
  };

  const pendingCount = policies.filter(p => !p.is_acknowledged).length;
  const completedCount = policies.filter(p => p.is_acknowledged).length;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', color: t.text, display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', paddingBottom: '24px' }}>
      
      {/* HEADER TIPO TOPBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#004ac6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 74, 198, 0.3)' }}>
            <Shield size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: t.text, marginBottom: '4px' }}>Portal de Concientización</h1>
            <p style={{ color: t.textDim, fontSize: '14px' }}>Revisa y acepta las políticas de la empresa</p>
          </div>
        </div>
      </div>

      {/* TARJETAS DE RESUMEN (STATS) */}
      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
        <div style={{ width: '320px', background: darkMode ? 'rgba(245, 158, 11, 0.05)' : t.cardBg, border: `1px solid rgba(245, 158, 11, 0.3)`, borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={28} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', lineHeight: '1' }}>{loading ? '-' : pendingCount}</div>
            <div style={{ fontSize: '13px', color: t.textDim, fontWeight: 600, marginTop: '4px' }}>Pendientes</div>
          </div>
        </div>

        <div style={{ width: '320px', background: darkMode ? 'rgba(0, 74, 198, 0.02)' : t.cardBg, border: `1px solid rgba(0, 74, 198, 0.15)`, borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(0, 74, 198, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={28} color="#004ac6" />
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#004ac6', lineHeight: '1' }}>{loading ? '-' : completedCount}</div>
            <div style={{ fontSize: '13px', color: t.textDim, fontWeight: 600, marginTop: '4px' }}>Completados</div>
          </div>
        </div>
      </div>

      {/* LISTA DE POLÍTICAS */}
      <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, padding: '32px', flex: 1 }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: t.text, marginBottom: '24px' }}>Políticas Publicadas</h2>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>Cargando políticas...</div>
        ) : policies.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textDim }}>No hay políticas publicadas en este momento.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {policies.map((policy) => (
              <div key={policy.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: t.inputBg, border: `1px solid ${policy.is_acknowledged ? '#004ac630' : t.border}`, borderRadius: '16px', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: policy.is_acknowledged ? '#004ac620' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    {policy.is_acknowledged ? <CheckCircle2 size={20} color="#004ac6" /> : <FileText size={20} color={t.textDim} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: t.text }}>Capítulo {policy.chapter_id}: {policy.title}</h3>
                      <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: t.textDim, fontWeight: 600 }}>{policy.version}</span>
                      {!policy.is_acknowledged && <span style={{ fontSize: '10px', padding: '3px 8px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '6px', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pendiente</span>}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedPolicy(policy)}
                  style={{ padding: '12px 24px', background: policy.is_acknowledged ? 'transparent' : '#004ac6', border: policy.is_acknowledged ? `1px solid #004ac6` : 'none', borderRadius: '10px', color: policy.is_acknowledged ? '#004ac6' : 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {policy.is_acknowledged ? 'Ver Política' : 'Leer y Aceptar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PARA LEER Y ACEPTAR */}
      {selectedPolicy && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '40px' }}>
          <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ padding: '24px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>Capítulo {selectedPolicy.chapter_id}: {selectedPolicy.title}</h2>
                <p style={{ fontSize: '13px', color: t.textDim, marginTop: '4px' }}>Versión {selectedPolicy.version}</p>
              </div>
              <button onClick={() => setSelectedPolicy(null)} style={{ background: 'transparent', border: 'none', color: t.textDim, cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ padding: '32px', overflowY: 'auto', flex: 1, fontSize: '14px', lineHeight: '1.7', color: t.text, background: t.inputBg, whiteSpace: 'pre-wrap' }}>
              {selectedPolicy.content || 'Sin contenido disponible.'}
            </div>

            <div style={{ padding: '24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: '16px', background: t.cardBg }}>
              <button onClick={() => setSelectedPolicy(null)} style={{ padding: '12px 24px', borderRadius: '10px', background: 'transparent', border: `1px solid ${t.border}`, color: t.text, fontWeight: 600, cursor: 'pointer' }}>
                Cerrar
              </button>
              {!selectedPolicy.is_acknowledged && (
                <button 
                  onClick={() => handleAcknowledge(selectedPolicy.id)} 
                  disabled={acknowledging}
                  style={{ padding: '12px 24px', borderRadius: '10px', background: '#004ac6', border: 'none', color: 'white', fontWeight: 600, cursor: acknowledging ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {acknowledging ? 'Procesando...' : <><Check size={18} /> He leído y comprendido</>}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeePortalScreen;