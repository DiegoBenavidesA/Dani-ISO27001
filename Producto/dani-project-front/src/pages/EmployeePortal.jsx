/* eslint-disable */
import React, { useContext, useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle2, FileText, X, Check } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { documentsAPI } from '../services/api';

const EmployeePortalScreen = () => {
  const { theme: t, darkMode } = useContext(ThemeContext);

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => { loadPolicies(); }, []);

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
    <div className="portal-container" style={{ animation: 'fadeIn 0.4s ease', padding: '0 8px', color: t.text, minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER ADAPTADO */}
      <section className="portal-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', flexShrink: 0 }}>
          <Shield size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: t.text, margin: '0 0 4px', lineHeight: 1.2 }}>Portal de Concientización</h1>
          <p style={{ color: t.textDim, fontSize: '12px', margin: 0 }}>Revisa y acepta las políticas de la empresa</p>
        </div>
      </section>

      {/* MÉTRICAS (GRID ADAPTABLE) */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={20} color="#d97706" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{loading ? '-' : pendingCount}</div>
            <div style={{ fontSize: '11px', color: t.textDim, fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Pendientes</div>
          </div>
        </div>

        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={20} color="#2563eb" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>{loading ? '-' : completedCount}</div>
            <div style={{ fontSize: '11px', color: t.textDim, fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Completados</div>
          </div>
        </div>
      </div>

      {/* LISTADO DE POLÍTICAS */}
      <section style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        
        <div style={{ padding: '16px', borderBottom: `1px solid ${t.inputBg}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 800, color: t.text, margin: 0 }}>Políticas Publicadas</h2>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', background: t.inputBg, color: t.textDim }}>{policies.length} activas</span>
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textDim, fontSize: '13px' }}>Cargando políticas...</div>
        ) : policies.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <FileText size={24} color={t.textDim} />
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: t.text, margin: '0 0 4px' }}>No hay políticas publicadas en este momento.</p>
            <p style={{ fontSize: '12px', color: t.textDim, maxWidth: '300px', margin: 0, lineHeight: 1.4 }}>Cuando el administrador asigne nuevos documentos normativos, aparecerán aquí para tu lectura y firma digital.</p>
          </div>
        ) : (
          <div className="policies-list" style={{ display: 'flex', flexDirection: 'column' }}>
            {policies.map((policy) => (
              <article key={policy.id} style={{ padding: '16px', borderBottom: `1px solid ${t.inputBg}`, background: policy.is_acknowledged ? 'transparent' : 'rgba(37, 99, 235, 0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: policy.is_acknowledged ? '#eff6ff' : t.inputBg, border: `1px solid ${policy.is_acknowledged ? '#bfdbfe' : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      {policy.is_acknowledged ? <CheckCircle2 size={20} color="#2563eb" /> : <FileText size={20} color={t.textDim} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: t.text, margin: 0, lineHeight: 1.3 }}>Cap. {policy.chapter_id}: {policy.title}</h3>
                        {!policy.is_acknowledged && <span style={{ fontSize: '9px', padding: '3px 6px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', color: '#d97706', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pendiente</span>}
                      </div>
                      <span style={{ fontSize: '11px', color: t.textDim, fontWeight: 600 }}>Versión {policy.version}</span>
                    </div>
                  </div>

                  {/* Botón en Escritorio */}
                  <div className="btn-desktop-only">
                    <button onClick={() => setSelectedPolicy(policy)} style={{ padding: '10px 20px', background: policy.is_acknowledged ? 'transparent' : '#2563eb', border: policy.is_acknowledged ? `1px solid ${t.border}` : 'none', borderRadius: '10px', color: policy.is_acknowledged ? t.text : 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                      {policy.is_acknowledged ? 'Ver Política' : 'Leer y Aceptar'}
                    </button>
                  </div>
                </div>

                {/* Botón en Móvil */}
                <div className="btn-mobile-only">
                  <button onClick={() => setSelectedPolicy(policy)} style={{ width: '100%', padding: '10px 16px', background: policy.is_acknowledged ? 'transparent' : '#2563eb', border: policy.is_acknowledged ? `1px solid ${t.border}` : 'none', borderRadius: '10px', color: policy.is_acknowledged ? t.text : 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {policy.is_acknowledged ? 'Ver Política' : 'Leer y Aceptar'}
                  </button>
                </div>

              </article>
            ))}
          </div>
        )}
      </section>

      {/* TIP LEY 21.719 */}
      <div style={{ padding: '14px', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '11px', color: '#1e3a8a', marginTop: '24px' }}>
        <Shield size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          <strong style={{ fontWeight: 700 }}>Portal de Empleados · Ley 21.719:</strong> Las políticas de seguridad y privacidad deben ser revisadas y aceptadas periódicamente por los colaboradores.
        </p>
      </div>

      {/* MODAL PARA LEER Y ACEPTAR */}
      {selectedPolicy && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, width: '100%', maxWidth: '800px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ padding: '20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: t.text, margin: '0 0 4px', lineHeight: 1.2 }}>Capítulo {selectedPolicy.chapter_id}: {selectedPolicy.title}</h2>
                <p style={{ fontSize: '11px', color: t.textDim, margin: 0, fontWeight: 600 }}>Versión {selectedPolicy.version}</p>
              </div>
              <button onClick={() => setSelectedPolicy(null)} style={{ background: t.inputBg, border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer', flexShrink: 0 }}><X size={18} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '13px', lineHeight: '1.6', color: t.text, background: t.inputBg, whiteSpace: 'pre-wrap' }}>
              {selectedPolicy.content || 'Sin contenido disponible.'}
            </div>

            <div className="modal-actions" style={{ padding: '16px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: '12px', background: t.cardBg }}>
              <button className="btn-cancel" onClick={() => setSelectedPolicy(null)} style={{ padding: '12px 20px', borderRadius: '12px', background: 'transparent', border: `1px solid ${t.border}`, color: t.text, fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                Cerrar
              </button>
              {!selectedPolicy.is_acknowledged && (
                <button 
                  className="btn-accept"
                  onClick={() => handleAcknowledge(selectedPolicy.id)} 
                  disabled={acknowledging}
                  style={{ padding: '12px 20px', borderRadius: '12px', background: '#2563eb', border: 'none', color: 'white', fontWeight: 700, fontSize: '12px', cursor: acknowledging ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: acknowledging ? 0.7 : 1 }}>
                  {acknowledging ? 'Procesando...' : <><Check size={16} strokeWidth={3} /> He leído y comprendido</>}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ESTILOS INYECTADOS */}
      <style dangerouslySetInnerHTML={{__html: `
        .btn-desktop-only { display: none; }
        .btn-mobile-only { display: block; }
        
        .modal-actions { flex-direction: column-reverse; }
        .btn-cancel, .btn-accept { width: 100%; justify-content: center; }

        @media (min-width: 768px) {
          .portal-container { padding: 32px 16px !important; }
          .metrics-grid { grid-template-columns: repeat(2, 320px) !important; justify-content: center; }
          
          .btn-desktop-only { display: block; }
          .btn-mobile-only { display: none; }

          .modal-actions { flex-direction: row; }
          .btn-cancel, .btn-accept { width: auto; }
        }
      `}} />
    </div>
  );
};

export default EmployeePortalScreen;