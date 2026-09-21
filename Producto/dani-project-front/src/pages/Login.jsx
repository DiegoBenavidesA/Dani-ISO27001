// src/pages/Login.jsx
import React, { useState } from 'react';
import { Shield, Mail, Lock, LogIn, UserPlus, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, isLoading, error } = useAuth();  // ← ESTO ES CLAVE
  const [empresa, setEmpresa] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [localError, setLocalError] = useState('');
  // Aviso cuando el usuario llega aquí porque su sesión expiró (401 global).
  const [sessionExpired] = useState(() => {
    try {
      const v = sessionStorage.getItem('session_expired');
      if (v) sessionStorage.removeItem('session_expired');
      return !!v;
    } catch { return false; }
  });

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const API_URL = 'https://dani-iso27001-backend.onrender.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setLocalError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword || (isRegistering && (!cleanName || !empresa.trim())))

    if (!isValidEmail(cleanEmail)) {
      setLocalError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (isRegistering) {
      if (cleanPassword !== confirmPassword.trim()) {
        setLocalError('Las contraseñas no coinciden.');
        return;
      }
      if (getPasswordStrength(cleanPassword) < 5) {
        setLocalError('La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.');
        return;
      }
    }

    try {
      await login(cleanEmail, cleanPassword, isRegistering, cleanName, empresa.trim());
      
      if (isRegistering) {
        // Mostrar mensaje de éxito
        setSuccess('✅ ¡Cuenta creada exitosamente! Redirigiendo al login...');
        
        // Limpiar formulario
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Cambiar a modo login después de 3 segundos
        setTimeout(() => {
          setIsRegistering(false);
          setSuccess('');
          // Enfocar el campo de email
          const emailInput = document.getElementById('login-email');
          if (emailInput) emailInput.focus();
        }, 3000);
      }
      // Si es login exitoso, la redirección es automática por ProtectedRoute
    } catch (err) {
      setLocalError(err.message || 'Error de conexión. Intenta de nuevo.');
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setSuccess('');
    setLocalError('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  const displayError = localError || error;
  const strength = getPasswordStrength(password);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '24px', border: '1px solid #334155', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', transition: 'all 0.3s ease' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}>
            <Shield size={36} color="white" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            {isRegistering ? 'Crear Cuenta' : 'Bienvenido a DANI'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px', textAlign: 'center' }}>
            {isRegistering ? 'Registra tus datos para acceder al sistema' : 'Acceso seguro al portal de gestión ISO 27001'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {isRegistering && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
                Nombre Completo
                {isRegistering && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
                Nombre de la Empresa
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  required={isRegistering} 
                  value={empresa} 
                  onChange={(e) => setEmpresa(e.target.value)} 
                  placeholder="Ej. TechCorp Spa"
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px', color: 'white', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>
          )}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required={isRegistering} 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ej. Juan Pérez"
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px 14px 44px', color: 'white', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#64748b' }}>
                <Mail size={18} />
              </div>
              <input 
                id="login-email"
                type="text" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="ciso@empresa.com"
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px 14px 44px', color: 'white', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#64748b' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px 14px 44px', color: 'white', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              />
            </div>

            {isRegistering && password.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ height: '4px', flex: 1, backgroundColor: i < strength ? '#10b981' : '#334155', borderRadius: '2px', transition: 'background-color 0.3s' }} />
                  ))}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <li style={{ color: password.length >= 8 ? '#10b981' : '#94a3b8' }}>{password.length >= 8 ? '✓' : '○'} Mín. 8 caracteres</li>
                  <li style={{ color: /[A-Z]/.test(password) ? '#10b981' : '#94a3b8' }}>{/[A-Z]/.test(password) ? '✓' : '○'} Mayúscula</li>
                  <li style={{ color: /[a-z]/.test(password) ? '#10b981' : '#94a3b8' }}>{/[a-z]/.test(password) ? '✓' : '○'} Minúscula</li>
                  <li style={{ color: /[0-9]/.test(password) ? '#10b981' : '#94a3b8' }}>{/[0-9]/.test(password) ? '✓' : '○'} Número</li>
                  <li style={{ color: /[^A-Za-z0-9]/.test(password) ? '#10b981' : '#94a3b8' }}>{/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Carácter especial</li>
                </ul>
              </div>
            )}
          </div>

          {isRegistering && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
                Confirmar Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required={isRegistering} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••"
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px 14px 44px', color: 'white', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {displayError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '12px', borderRadius: '10px', fontSize: '13px', textAlign: 'center', fontWeight: 500 }}>
              {displayError}
            </div>
          )}
          
          {sessionExpired && (
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              textAlign: 'center',
              fontWeight: 500,
              marginBottom: '4px'
            }}>
              Tu sesión expiró. Inicia sesión de nuevo para continuar.
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              color: '#10b981', 
              padding: '14px', 
              borderRadius: '10px', 
              fontSize: '14px', 
              textAlign: 'center', 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading} 
            style={{ marginTop: '10px', width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', fontSize: '15px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Procesando...' : (
              <>
                {isRegistering ? 'Registrar Cuenta' : 'Iniciar sesión'}
                {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #334155', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
            <button 
              onClick={toggleMode}
              type="button"
              style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, marginLeft: '8px', cursor: 'pointer', fontSize: '14px', padding: 0 }}
            >
              {isRegistering ? 'Inicia sesión' : 'Regístrate aquí'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;