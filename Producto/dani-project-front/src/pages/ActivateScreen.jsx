import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { authAPI } from '../services/api';

export default function ActivateScreen() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);      // {email, name, organization}
  const [error, setError] = useState(null);     // error al validar el token
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await authAPI.getActivationInfo(token);
        if (active) setInfo(data);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) { setFormError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm) { setFormError('Las contraseñas no coinciden.'); return; }
    setSubmitting(true);
    try {
      await authAPI.activate(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '20px' };
  const card = { background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '440px', color: '#e2e8f0' };
  const input = { width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const label = { display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 };

  if (loading) {
    return <div style={wrap}><div style={card}><p style={{ textAlign: 'center', color: '#94a3b8' }}>Validando invitación...</p></div></div>;
  }

  if (error) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ textAlign: 'center' }}>
            <AlertTriangle size={40} color="#ef4444" />
            <h2 style={{ margin: '16px 0 8px' }}>Enlace no válido</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>{error}</p>
            <button onClick={() => navigate('/login')} style={{ marginTop: '20px', padding: '12px 20px', background: '#10b981', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Ir al inicio de sesión</button>
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
            <h2 style={{ margin: '16px 0 8px' }}>¡Cuenta activada!</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Redirigiéndote al inicio de sesión…</p>
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
            <div style={{ fontWeight: 700, fontSize: '18px' }}>Activar cuenta</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>DANI GRC</div>
          </div>
        </div>

        <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#cbd5e1' }}>
          Hola <strong>{info?.name}</strong>, fuiste invitado a administrar
          {info?.organization ? <> la organización <strong>{info.organization}</strong></> : ' tu organización'}.
          Define tu contraseña para activar tu cuenta.
        </p>

        <div style={{ margin: '16px 0', padding: '10px 14px', background: '#0f172a', borderRadius: '10px', fontSize: '13px', color: '#94a3b8' }}>
          Correo: <strong style={{ color: '#e2e8f0' }}>{info?.email}</strong>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={label}>Nueva contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required style={input} placeholder="Mínimo 8 caracteres" />
          </div>
          <div>
            <label style={label}>Confirmar contraseña</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={input} placeholder="Repite la contraseña" />
          </div>

          {formError && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '10px', fontSize: '13px' }}>{formError}</div>}

          <button type="submit" disabled={submitting} style={{ padding: '13px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '14px', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Activando...' : 'Activar cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
