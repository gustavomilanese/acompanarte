import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Pages
import { Login } from '@/pages/Login';

// Acompañante pages
import { Dashboard as AcompananteDashboard } from '@/pages/acompanante/Dashboard';
import { MisTurnos } from '@/pages/acompanante/MisTurnos';
import { TurnoDetalle } from '@/pages/acompanante/TurnoDetalle';
import { RegistroVisita } from '@/pages/acompanante/RegistroVisita';
import { Biblioteca } from '@/pages/acompanante/Biblioteca';
import { Perfil as AcompanantePerfil } from '@/pages/acompanante/Perfil';

// Familiar pages
import { Home as FamiliarHome } from '@/pages/familiar/Home';
import { Historial } from '@/pages/familiar/Historial';
import { DetalleVisita } from '@/pages/familiar/DetalleVisita';
import { Perfil as FamiliarPerfil } from '@/pages/familiar/Perfil';

// Admin pages
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { Acompanantes } from '@/pages/admin/Acompanantes';
import { Clientes } from '@/pages/admin/Clientes';
import { Calendario } from '@/pages/admin/Calendario';
import { BibliotecaAdmin } from '@/pages/admin/BibliotecaAdmin';
import { Servicios } from '@/pages/admin/Servicios';
import { Finanzas } from '@/pages/admin/Finanzas';
import { ImportarCvs } from '@/pages/admin/ImportarCvs';

// Componente para proteger rutas
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="animate-pulse text-primary">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-center">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    // Redirigir según el rol del usuario
    if (user?.rol === 'acompanante') {
      return <Navigate to="/" replace />;
    } else if (user?.rol === 'familiar') {
      return <Navigate to="/" replace />;
    } else if (user?.rol === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleBasedHome() {
  const { user } = useAuth();
  return user?.rol === 'familiar' ? <FamiliarHome /> : <AcompananteDashboard />;
}

function RoleBasedProfile() {
  const { user } = useAuth();
  return user?.rol === 'acompanante' ? <AcompanantePerfil /> : <FamiliarPerfil />;
}

// Router principal
function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Acompañante routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['acompanante', 'familiar']}>
            <RoleBasedHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turnos"
        element={
          <ProtectedRoute allowedRoles={['acompanante']}>
            <MisTurnos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turno/:id"
        element={
          <ProtectedRoute allowedRoles={['acompanante']}>
            <TurnoDetalle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registro/:id"
        element={
          <ProtectedRoute allowedRoles={['acompanante']}>
            <RegistroVisita />
          </ProtectedRoute>
        }
      />
      <Route
        path="/biblioteca"
        element={
          <ProtectedRoute allowedRoles={['acompanante']}>
            <Biblioteca />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute allowedRoles={['acompanante', 'familiar']}>
            <RoleBasedProfile />
          </ProtectedRoute>
        }
      />

      {/* Familiar routes */}
      <Route
        path="/historial"
        element={
          <ProtectedRoute allowedRoles={['familiar']}>
            <Historial />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visita/:id"
        element={
          <ProtectedRoute allowedRoles={['familiar']}>
            <DetalleVisita />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/acompanantes"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Acompanantes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clientes"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Clientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/calendario"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Calendario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/servicios"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Servicios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/finanzas"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Finanzas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/biblioteca-admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <BibliotecaAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/acompanantes/importar"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ImportarCvs />
          </ProtectedRoute>
        }
      />

      {/* Redirect root */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// App principal
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
