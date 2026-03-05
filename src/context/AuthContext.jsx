import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { acompanantes, admins, codigosFamiliares, getClienteById } from '@/data/mockData';
import { adminApi } from '@/services/adminApi';

const AuthContext = createContext(null);

function seedUsers() {
  const now = new Date().toISOString();
  const adminUsers = admins.map((a) => ({
    id: `usr-${a.id}`,
    nombre: a.nombre,
    email: a.email,
    password: a.password,
    codigo: '',
    rol: a.rol === 'superadmin' ? 'superadmin' : 'admin',
    estado: 'activo',
    caregiverId: null,
    clienteId: null,
    createdAt: now,
    updatedAt: now,
  }));

  const caregiverUsers = acompanantes.map((a) => ({
    id: `usr-cui-${a.id}`,
    nombre: a.nombre,
    email: a.email,
    password: '',
    codigo: a.codigo,
    rol: 'cuidador',
    estado: a.estado || 'activo',
    caregiverId: a.id,
    clienteId: null,
    createdAt: now,
    updatedAt: now,
  }));

  const patientUsers = Object.entries(codigosFamiliares).map(([codigo, data]) => ({
    id: `usr-pac-${data.clienteId}`,
    nombre: data.familiarNombre || `Paciente ${data.clienteId}`,
    email: '',
    password: '',
    codigo,
    rol: 'paciente',
    estado: 'activo',
    caregiverId: null,
    clienteId: data.clienteId,
    createdAt: now,
    updatedAt: now,
  }));

  return [...adminUsers, ...caregiverUsers, ...patientUsers];
}

function findMockCaregiver(email, codigo) {
  return acompanantes.find(
    (a) => a.email === email && a.codigo === codigo && a.estado === 'activo'
  );
}

function normalizeRol(rol) {
  if (rol === 'acompanante') return 'cuidador';
  if (rol === 'familiar') return 'paciente';
  if (rol === 'coordinador') return 'admin';
  return rol;
}

function isAdminRole(rol) {
  const normalized = normalizeRol(rol);
  return normalized === 'admin' || normalized === 'superadmin';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('acompanarte_user', null);
  const [appUsers, setAppUsers] = useLocalStorage('acompanarte_users', seedUsers());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!Array.isArray(appUsers) || appUsers.length === 0) {
      setAppUsers(seedUsers());
      return;
    }
    const normalizedUsers = appUsers.map((u) => {
      const normalizedRol = normalizeRol(u.rol);
      if (normalizedRol === u.rol) return u;
      return { ...u, rol: normalizedRol, updatedAt: new Date().toISOString() };
    });
    const hasChanges = normalizedUsers.some((u, idx) => u !== appUsers[idx]);
    if (hasChanges) {
      setAppUsers(normalizedUsers);
    }
  }, [appUsers, setAppUsers]);

  useEffect(() => {
    let active = true;

    const hydrateAdminSession = async () => {
      const currentUser = user;
      const shouldCheckSession = !currentUser || isAdminRole(currentUser?.rol);

      if (!shouldCheckSession) {
        if (active) setIsLoading(false);
        return;
      }

      try {
        const session = await adminApi.getAdminSession();
        const sessionUser = session?.authenticated ? session.user : null;

        if (!active) return;

        if (sessionUser) {
          setUser({
            id: sessionUser.id || `adm-${sessionUser.email || 'admin'}`,
            userId: sessionUser.id || `adm-${sessionUser.email || 'admin'}`,
            nombre: sessionUser.nombre || 'Administrador',
            email: sessionUser.email || '',
            rol: normalizeRol(sessionUser.rol || 'admin'),
          });
        } else if (isAdminRole(currentUser?.rol)) {
          setUser(null);
        }
      } catch {
        if (active && isAdminRole(currentUser?.rol)) {
          setUser(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    hydrateAdminSession();

    return () => {
      active = false;
    };
  }, []);

  const loginAcompanante = useCallback((email, codigo) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const users = Array.isArray(appUsers) ? appUsers : [];
    const cuidadorUser = users.find(
      (u) =>
        u.rol === 'cuidador' &&
        u.estado === 'activo' &&
        String(u.email || '').trim().toLowerCase() === normalizedEmail &&
        String(u.codigo || '') === String(codigo || '')
    );

    if (cuidadorUser) {
      const mockCaregiver = acompanantes.find((a) => a.id === cuidadorUser.caregiverId);
      const userData = {
        id: cuidadorUser.caregiverId || cuidadorUser.id,
        userId: cuidadorUser.id,
        nombre: cuidadorUser.nombre,
        email: cuidadorUser.email,
        avatar: mockCaregiver?.avatar || null,
        rol: 'cuidador',
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    const acomp = findMockCaregiver(email, codigo);
    if (acomp) {
      const userData = {
        id: acomp.id,
        nombre: acomp.nombre,
        email: acomp.email,
        avatar: acomp.avatar,
        rol: 'cuidador',
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    return { success: false, error: 'Email o código incorrecto' };
  }, [setUser, appUsers]);

  const loginFamiliar = useCallback((codigo) => {
    const users = Array.isArray(appUsers) ? appUsers : [];
    const pacienteUser = users.find(
      (u) => u.rol === 'paciente' && u.estado === 'activo' && String(u.codigo || '') === String(codigo || '')
    );

    if (pacienteUser) {
      const cliente = getClienteById(pacienteUser.clienteId);
      const userData = {
        id: pacienteUser.id,
        userId: pacienteUser.id,
        nombre: pacienteUser.nombre,
        clienteId: pacienteUser.clienteId,
        clienteNombre: cliente?.nombre || 'Paciente',
        clienteFoto: cliente?.foto,
        rol: 'paciente',
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    const familiarData = codigosFamiliares[codigo];
    if (familiarData) {
      const cliente = getClienteById(familiarData.clienteId);
      const userData = {
        id: `pac-${familiarData.clienteId}`,
        nombre: familiarData.familiarNombre,
        clienteId: familiarData.clienteId,
        clienteNombre: cliente?.nombre || 'Paciente',
        clienteFoto: cliente?.foto,
        rol: 'paciente',
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    return { success: false, error: 'Código de acceso incorrecto' };
  }, [setUser, appUsers]);

  const loginAdmin = useCallback(async (email, password) => {
    try {
      const response = await adminApi.loginAdmin({
        email: String(email || '').trim().toLowerCase(),
        password: String(password || ''),
      });

      const sessionUser = response?.user;
      if (!sessionUser) {
        return { success: false, error: 'No se pudo validar la sesión de administrador.' };
      }

      const userData = {
        id: sessionUser.id || `adm-${sessionUser.email || 'admin'}`,
        userId: sessionUser.id || `adm-${sessionUser.email || 'admin'}`,
        nombre: sessionUser.nombre || 'Administrador',
        email: sessionUser.email || '',
        rol: normalizeRol(sessionUser.rol || 'admin'),
      };
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error?.message || 'Email o contraseña incorrectos' };
    }
  }, [setUser]);

  const createAppUser = useCallback((payload) => {
    const list = Array.isArray(appUsers) ? appUsers : [];
    const email = String(payload.email || '').trim().toLowerCase();
    const codigo = String(payload.codigo || '').trim();
    const rol = payload.rol || 'admin';

    if (!payload.nombre?.trim()) return { success: false, error: 'Nombre requerido' };
    if (['admin', 'superadmin', 'cuidador'].includes(rol) && !email) {
      return { success: false, error: 'Email requerido para este rol' };
    }
    if (['cuidador', 'paciente'].includes(rol) && !codigo) {
      return { success: false, error: 'Código requerido para este rol' };
    }
    if (email && list.some((u) => String(u.email || '').trim().toLowerCase() === email)) {
      return { success: false, error: 'Ya existe un usuario con ese email' };
    }
    if (codigo && list.some((u) => String(u.codigo || '').trim() === codigo)) {
      return { success: false, error: 'Ya existe un usuario con ese código' };
    }

    const created = {
      id: `usr-${Date.now()}`,
      nombre: payload.nombre.trim(),
      email,
      password: payload.password || '',
      codigo,
      rol,
      estado: payload.estado || 'activo',
      caregiverId: payload.caregiverId || null,
      clienteId: payload.clienteId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAppUsers([...list, created]);
    return { success: true, user: created };
  }, [appUsers, setAppUsers]);

  const updateAppUser = useCallback((id, payload) => {
    const list = Array.isArray(appUsers) ? appUsers : [];
    const target = list.find((u) => u.id === id);
    if (!target) return { success: false, error: 'Usuario no encontrado' };

    const next = {
      ...target,
      ...payload,
      email: payload.email !== undefined ? String(payload.email || '').trim().toLowerCase() : String(target.email || '').trim().toLowerCase(),
      codigo: payload.codigo !== undefined ? String(payload.codigo || '').trim() : String(target.codigo || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    if (!next.nombre?.trim()) return { success: false, error: 'Nombre requerido' };
    if (['admin', 'superadmin', 'cuidador'].includes(next.rol) && !next.email) {
      return { success: false, error: 'Email requerido para este rol' };
    }
    if (['cuidador', 'paciente'].includes(next.rol) && !next.codigo) {
      return { success: false, error: 'Código requerido para este rol' };
    }
    if (next.email && list.some((u) => u.id !== id && String(u.email || '').trim().toLowerCase() === next.email)) {
      return { success: false, error: 'Ya existe un usuario con ese email' };
    }
    if (next.codigo && list.some((u) => u.id !== id && String(u.codigo || '').trim() === next.codigo)) {
      return { success: false, error: 'Ya existe un usuario con ese código' };
    }

    setAppUsers(list.map((u) => (u.id === id ? next : u)));
    return { success: true, user: next };
  }, [appUsers, setAppUsers]);

  const deleteAppUser = useCallback((id) => {
    const list = Array.isArray(appUsers) ? appUsers : [];
    const target = list.find((u) => u.id === id);
    if (!target) return { success: false, error: 'Usuario no encontrado' };
    if ((user?.userId || user?.id) === id) return { success: false, error: 'No podés eliminar tu propio usuario' };
    setAppUsers(list.filter((u) => u.id !== id));
    return { success: true };
  }, [appUsers, setAppUsers, user]);

  const logout = useCallback(() => {
    if (isAdminRole(user?.rol)) {
      adminApi.logoutAdmin().catch(() => null);
    }
    setUser(null);
  }, [setUser, user]);

  const hasRole = useCallback((...roles) => {
    return user && roles.includes(user.rol);
  }, [user]);

  const isAuthenticated = !!user;

  const value = {
    user,
    isAuthenticated,
    isLoading,
    appUsers: Array.isArray(appUsers) ? appUsers : [],
    adminUsers: (Array.isArray(appUsers) ? appUsers : []).filter((u) => ['admin', 'superadmin'].includes(u.rol)),
    loginAcompanante,
    loginFamiliar,
    loginAdmin,
    createAppUser,
    updateAppUser,
    deleteAppUser,
    createAdminUser: createAppUser,
    updateAdminUser: updateAppUser,
    deleteAdminUser: deleteAppUser,
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
