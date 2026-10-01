// src/components/ProtectedRoute.jsx
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, requiredRoles = null }) => {
  const { isAuthenticated, isLoading, user, orgSlug } = useAuth();
  const { orgSlug: urlSlug } = useParams();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0f172a',
        color: 'white'
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Aislamiento por URL: si el slug de la URL no es el de la empresa del
  // usuario, lo devolvemos a la suya. El superadmin ("plataforma") también
  // queda anclado a su propio prefijo. Evita que alguien escriba /otra-empresa.
  if (urlSlug && orgSlug && urlSlug !== orgSlug) {
    return <Navigate to={`/${orgSlug}`} replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user?.role)) {
    return <Navigate to={orgSlug ? `/${orgSlug}` : '/login'} replace />;
  }

  return children;
};
