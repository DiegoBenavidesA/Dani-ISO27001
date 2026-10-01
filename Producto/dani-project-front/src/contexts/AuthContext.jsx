// Producto/dani-project-front/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_URL } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Empresa que el superadmin está viendo ("entrar" a una org). Se guarda en
  // localStorage para sobrevivir recargas y para que el interceptor de fetch
  // pueda inyectar la cabecera X-Org-Id en todas las llamadas.
  const [impersonatedOrg, setImpersonatedOrg] = useState(() => {
    try {
      const s = localStorage.getItem('impersonatedOrg');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const enterOrg = useCallback((org) => {
    // org: { id, slug, nombre }
    const data = { id: org.id, slug: org.slug, nombre: org.nombre };
    setImpersonatedOrg(data);
    try {
      localStorage.setItem('impersonatedOrg', JSON.stringify(data));
      localStorage.setItem('impersonate_org_id', org.id); // lo lee el interceptor
    } catch (_) {}
  }, []);

  const exitOrg = useCallback(() => {
    setImpersonatedOrg(null);
    try {
      localStorage.removeItem('impersonatedOrg');
      localStorage.removeItem('impersonate_org_id');
    } catch (_) {}
  }, []);

  const login = useCallback(async (email, password, isRegistering, name, empresa) => {
    setIsLoading(true);
    setError(null);

    const endpoint = isRegistering
      ? `${API_URL}/api/auth/register`
      : `${API_URL}/api/auth/login`;

    const payload = isRegistering
      ? { name, email, password, empresa }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (!isRegistering) {
          const userData = {
            email: email,
            name: data.name || name,
            role: data.role || 'employee',
            token: data.access_token,
            // Multi-tenant: empresa del usuario (null para el superadmin).
            organizationId: data.organization_id || null,
            organizationSlug: data.organization_slug || null,
            organizationName: data.organization_name || null,
          };
          setUser(userData);
          setToken(data.access_token);
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        return { success: true, data };
      } else {
        throw new Error(data.detail || 'Error de autenticación');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    setImpersonatedOrg(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('impersonatedOrg');
    localStorage.removeItem('impersonate_org_id');
  }, []);

  // ==========================================================================
  // Manejo global de sesión vencida (401).
  // Interceptamos TODAS las llamadas fetch: si alguna responde 401 y había una
  // sesión activa, significa que el token venció o es inválido. En ese caso
  // cerramos sesión y volvemos al login automáticamente, en vez de mostrar el
  // cartel rojo "Error cargando..." y quedar atascados.
  // ==========================================================================
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      // Superadmin "dentro" de una empresa: inyectamos X-Org-Id en las llamadas
      // a nuestra API para que el backend scope los datos a esa empresa.
      try {
        const orgId = localStorage.getItem('impersonate_org_id');
        if (orgId && args[0] && typeof args[0] === 'string' && args[0].includes('/api/')) {
          const opts = args[1] ? { ...args[1] } : {};
          opts.headers = { ...(opts.headers || {}), 'X-Org-Id': orgId };
          args[1] = opts;
        }
      } catch (_) { /* nunca romper la petición */ }

      const response = await originalFetch(...args);
      try {
        if (response.status === 401 && localStorage.getItem('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!window.__sessionExpiredRedirect) {
            window.__sessionExpiredRedirect = true;
            // Marcamos el motivo para poder avisar en la pantalla de login.
            try { sessionStorage.setItem('session_expired', '1'); } catch (_) {}
            window.location.replace('/');
          }
        }
      } catch (_) { /* nunca romper la petición original */ }
      return response;
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  // Slug de la empresa para la URL /:slug/... El superadmin de plataforma no
  // pertenece a ninguna empresa, así que usa el prefijo neutro "admin"
  // (reservado en el backend para que ninguna empresa pueda tomarlo).
  const orgSlug = user
    ? (user.role === 'superadmin' ? 'admin' : (user.organizationSlug || null))
    : null;

  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    orgSlug,
    impersonatedOrg,
    enterOrg,
    exitOrg,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
