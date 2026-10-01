import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext'; // Importación vital
import Login from './pages/Login';
import DaniPlatform from './dani-platform-respaldo';
import { ProtectedRoute } from './components/ProtectedRoute';
import GapAnalysis from './pages/GapAnalysisScreen'; // o el nombre correcto de tu componente
import ActivateScreen from './pages/ActivateScreen';

// Componente para manejar las rutas protegidas (Definido una sola vez aquí)
function AppRoutes() {
  const { isAuthenticated, isLoading, orgSlug } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Solo redirigimos fuera del login si hay sesión CON empresa resuelta.
          Una sesión vieja sin slug (guardada antes de esta feature) muestra el
          login para re-autenticar, evitando un bucle de redirección. */}
      {/* Activación de cuenta por invitación (público, sin sesión) */}
      <Route path="/activar/:token" element={<ActivateScreen />} />

      <Route path="/login" element={isAuthenticated && orgSlug ? <HomeRedirect /> : <Login />} />

      {/* Raíz: manda al usuario a la URL de su empresa /:orgSlug */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Rutas multi-tenant: la empresa va en el primer segmento de la URL */}
      <Route path="/:orgSlug" element={
        <ProtectedRoute><DaniPlatform /></ProtectedRoute>
      } />
      <Route path="/:orgSlug/gap-analysis" element={
        <ProtectedRoute requiredRoles={['superadmin', 'owner', 'admin', 'manager', 'auditor', 'dpo']}>
          <GapAnalysis />
        </ProtectedRoute>
      } />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

// Redirige a la URL de la empresa del usuario (/:orgSlug). Si no hay sesión,
// va al login. Si es superadmin sin empresa, usa el prefijo "plataforma".
function HomeRedirect() {
  const { isAuthenticated, orgSlug } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!orgSlug) return <Navigate to="/login" replace />;
  return <Navigate to={`/${orgSlug}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      {/* ThemeProvider envolviendo todo para que useTheme funcione */}
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;