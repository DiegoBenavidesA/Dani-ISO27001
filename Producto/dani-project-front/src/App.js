import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import DaniPlatform from './dani-platform-respaldo';
import { ProtectedRoute } from './components/ProtectedRoute';
import GapAnalysis from './pages/GapAnalysisScreen';
import PublicConsentScreen from './pages/PublicConsentScreen';
import ActivateScreen from './pages/ActivateScreen';
import PublicDataRequestScreen from './pages/PublicDataRequestScreen';

// Componente para manejar las rutas
function AppRoutes() {
  const { isAuthenticated, isLoading, orgSlug } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#0f172a',
          color: 'white'
        }}
      >
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/activar/:token" element={<ActivateScreen />} />
      <Route path="/consent/:token" element={<PublicConsentScreen />} />
      <Route path="/solicitud/:orgSlug" element={<PublicDataRequestScreen />} />

      {/* Login */}
      <Route
        path="/login"
        element={isAuthenticated && orgSlug ? <HomeRedirect /> : <Login />}
      />

      {/* Raíz */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Rutas multi-tenant */}
      <Route
        path="/:orgSlug"
        element={
          <ProtectedRoute>
            <DaniPlatform />
          </ProtectedRoute>
        }
      />

      <Route
        path="/:orgSlug/gap-analysis"
        element={
          <ProtectedRoute
            requiredRoles={[
              'superadmin',
              'owner',
              'admin',
              'manager',
              'auditor',
              'dpo'
            ]}
          >
            <GapAnalysis />
          </ProtectedRoute>
        }
      />

      {/* Cualquier ruta desconocida */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

// Redirige al usuario a la URL de su empresa.
function HomeRedirect() {
  const { isAuthenticated, orgSlug } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!orgSlug) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${orgSlug}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;