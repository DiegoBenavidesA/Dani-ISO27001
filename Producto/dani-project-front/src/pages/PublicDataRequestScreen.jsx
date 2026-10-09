import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { dataRequestsAPI } from '../services/api';

const TIPOS = [
  { value: 'acceso', label: 'Acceso — saber qué datos míos tienen' },
  { value: 'rectificacion', label: 'Rectificación — corregir datos incorrectos' },
  { value: 'cancelacion', label: 'Cancelación / Supresión — eliminar mis datos' },
  { value: 'oposicion', label: 'Oposición — que dejen de usar mis datos' },
  { value: 'portabilidad', label: 'Portabilidad — recibir mis datos' },
];

export default function PublicDataRequestScreen() {
  const { orgSlug } = useParams();

  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [error, setError] = useState(null);

  const [titular, setTitular] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('acceso');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await dataRequestsAPI.getPublicOrgInfo(orgSlug);
        if (active) setOrg(data);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [orgSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!titular.trim() || !descripcion.trim()) { setFormError('Completa tu nombre y la descripción.'); return; }
    setSubmitting(true);
    try {
      await dataRequestsAPI.submitPublic(orgSlug, { titular, titular_email: email, tipo, descripcion });
      setDone(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '20px' };
  const card = { background: '#111827', border: '1px solid #334155', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '520px', color: '#e2e8f0' };
  const input = { width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const label = { display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 };

  if (loading) {
    return <div style={wrap}><div style={card}><p style={{ textAlign: 'center', color: '#94a3b8' }}>Cargando…</p></div></div>;
  }

  if (error) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ textAlign: 'center' }}>
            <AlertTriangle size={40} color="#ef4444" />
            <h2 style={{ margin: '16px 0 8px' }}>Enlace no válido</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={40} color="#10b981" />
            <h2 style={{ margin: '16px 0 8px' }}>¡Solicitud enviada!</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
              {org?.nombre} atenderá tu solicitud dentro del plazo legal. Si dejaste tu correo, te contactarán por ahí.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px' }}>Solicitud sobre mis datos personales</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{org?.nombre}</div>
          </div>
        </div>

        <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#cbd5e1', marginBottom: '20px' }}>
          Como titular de datos personales, puedes ejercer tus derechos (Ley 21.719). Completa el formulario y
          <strong> {org?.nombre}</strong> atenderá tu solicitud dentro del plazo legal.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={label}>Tu nombre completo</label>
            <input value={titular} onChange={e => setTitular(e.target.value)} required style={input} placeholder="Nombre y apellido" />
          </div>
          <div>
            <label style={label}>Tu correo (para responderte)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={input} placeholder="tucorreo@ejemplo.com" />
          </div>
          <div>
            <label style={label}>Tipo de solicitud</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} style={input}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Describe tu solicitud</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} required rows={4} style={{ ...input, resize: 'vertical' }} placeholder="Explica qué necesitas (por ejemplo, qué dato corregir o eliminar)." />
          </div>

          {formError && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '10px', fontSize: '13px' }}>{formError}</div>}

          <button type="submit" disabled={submitting} style={{ padding: '13px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '14px', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
}
