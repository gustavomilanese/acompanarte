import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { acompanantes, admins, codigosFamiliares, getClienteById } from '@/data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('acompanarte_user', null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión al cargar
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Login de acompañante
  const loginAcompanante = useCallback((email, codigo) => {
    const acompanante = acompanantes.find(
      (a) => a.email === email && a.codigo === codigo && a.estado === 'activo'
    );

    if (acompanante) {
      const userData = {
        id: acompanante.id,
        nombre: acompanante.nombre,
        email: acompanante.email,
        avatar: acompanante.avatar,
        rol: 'acompanante',
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    return { success: false, error: 'Email o código incorrecto' };
  }, [setUser]);

  // Login de familiar
  const loginFamiliar = useCallback((codigo) => {
    const familiarData = codigosFamiliares[codigo];

    if (familiarData) {
      const cliente = getClienteById(familiarData.clienteId);
      const userData = {
        id: `fam-${familiarData.clienteId}`,
        nombre: familiarData.familiarNombre,
        clienteId: familiarData.clienteId,
        clienteNombre: cliente?.nombre || 'Familiar',
        clienteFoto: cliente?.foto,
        rol: 'familiar',
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    return { success: false, error: 'Código de acceso incorrecto' };
  }, [setUser]);

  // Login de admin
  const loginAdmin = useCallback((email, password) => {
    const admin = admins.find(
      (a) => a.email === email && a.password === password
    );

    if (admin) {
      const userData = {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        rol: 'admin',
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    return { success: false, error: 'Email o contraseña incorrectos' };
  }, [setUser]);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  // Verificar si tiene rol específico
  const hasRole = useCallback((...roles) => {
    return user && roles.includes(user.rol);
  }, [user]);

  // Verificar si está autenticado
  const isAuthenticated = !!user;

  const value = {
    user,
    isAuthenticated,
    isLoading,
    loginAcompanante,
    loginFamiliar,
    loginAdmin,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;
