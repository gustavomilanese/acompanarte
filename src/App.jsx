import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Pages
import { Login } from '@/pages/Login';
import { PublicCaregiverSignup } from '@/pages/PublicCaregiverSignup';

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
import { Usuarios } from '@/pages/admin/Usuarios';

function normalizeRole(role) {
  if (role === 'acompanante') return 'cuidador';
  if (role === 'familiar') return 'paciente';
  if (role === 'coordinador') return 'admin';
  return role;
}

// Componente para proteger rutas
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const role = normalizeRole(user?.rol);

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

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirigir según el rol del usuario
    if (role === 'cuidador') {
      return <Navigate to="/" replace />;
    } else if (role === 'paciente') {
      return <Navigate to="/" replace />;
    } else if (role === 'admin' || role === 'superadmin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleBasedHome() {
  const { user } = useAuth();
  const role = normalizeRole(user?.rol);
  return role === 'paciente' ? <FamiliarHome /> : <AcompananteDashboard />;
}

function RoleBasedProfile() {
  const { user } = useAuth();
  const role = normalizeRole(user?.rol);
  return role === 'cuidador' ? <AcompanantePerfil /> : <FamiliarPerfil />;
}

// Router principal
function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/postulate-cuidador" element={<PublicCaregiverSignup />} />

      {/* Acompañante routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['cuidador', 'paciente']}>
            <RoleBasedHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turnos"
        element={
          <ProtectedRoute allowedRoles={['cuidador']}>
            <MisTurnos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turno/:id"
        element={
          <ProtectedRoute allowedRoles={['cuidador']}>
            <TurnoDetalle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registro/:id"
        element={
          <ProtectedRoute allowedRoles={['cuidador']}>
            <RegistroVisita />
          </ProtectedRoute>
        }
      />
      <Route
        path="/biblioteca"
        element={
          <ProtectedRoute allowedRoles={['cuidador']}>
            <Biblioteca />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute allowedRoles={['cuidador', 'paciente']}>
            <RoleBasedProfile />
          </ProtectedRoute>
        }
      />

      {/* Familiar routes */}
      <Route
        path="/historial"
        element={
          <ProtectedRoute allowedRoles={['paciente']}>
            <Historial />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visita/:id"
        element={
          <ProtectedRoute allowedRoles={['paciente']}>
            <DetalleVisita />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/acompanantes"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <Acompanantes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clientes"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <Clientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/calendario"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <Calendario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/servicios"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <Servicios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/finanzas"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <Finanzas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/biblioteca-admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <BibliotecaAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/acompanantes/importar"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <ImportarCvs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <Usuarios />
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
