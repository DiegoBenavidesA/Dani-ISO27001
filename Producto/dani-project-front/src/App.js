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
import LandingPage from './pages/LandingPage';

// Pantalla de carga del inicio de sesión. Si la espera se alarga, avisamos que
// el servidor está despertando (plan gratuito de Render) en vez de dejar solo
// "Cargando..." sin explicación.
function LoadingScreen() {
  const [slow, setSlow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        height: '100vh',
        backgroundColor: '#f8f9ff',
        color: '#0b1c30',
        fontFamily: "'Inter', sans-serif",
        textAlign: 'center',
        padding: '0 16px'
      }}
    >
      <div>Cargando...</div>
      {slow && (
        <div style={{ fontSize: 14, color: '#5b6b82', maxWidth: 420 }}>
          El servidor se está activando tras un periodo sin uso. Esto puede
          tardar un par de minutos solo la primera vez; no cierres la página.
        </div>
      )}
    </div>
  );
}

// Componente para manejar las rutas
function AppRoutes() {
  const { isAuthenticated, isLoading, orgSlug } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
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
      <Route path="/" element={<LandingPage />} />

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