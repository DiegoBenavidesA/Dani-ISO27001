import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext'; // Importación vital
import Login from './pages/Login';
import DaniPlatform from './dani-platform-respaldo';
import { ProtectedRoute } from './components/ProtectedRoute';
import GapAnalysis from './pages/GapAnalysisScreen'; // o el nombre correcto de tu componente
import PublicConsentScreen from './pages/PublicConsentScreen';

// Componente para manejar las rutas protegidas (Definido una sola vez aquí)
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/consent/:token" element={<PublicConsentScreen />} />
      <Route path="/" element={<ProtectedRoute><DaniPlatform /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />

      <Route path="/gap-analysis" element={
        <ProtectedRoute requiredRoles={['admin', 'manager', 'auditor']}>
          <GapAnalysis />
        </ProtectedRoute>
      } />
    </Routes>


  );
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