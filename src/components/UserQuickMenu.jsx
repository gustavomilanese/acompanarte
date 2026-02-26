import React, { useMemo, useState } from 'react';
import { Menu, X, LogOut, House, Calendar, BookOpen, Clock, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

function normalizeRole(role) {
  if (role === 'acompanante') return 'cuidador';
  if (role === 'familiar') return 'paciente';
  return role;
}

const MENU_BY_ROLE = {
  cuidador: [
    { key: 'inicio', label: 'Inicio', path: '/', icon: House },
    { key: 'turnos', label: 'Mis turnos', path: '/turnos', icon: Calendar },
    { key: 'biblioteca', label: 'Biblioteca', path: '/biblioteca', icon: BookOpen },
    { key: 'perfil', label: 'Perfil', path: '/perfil', icon: UserRound },
  ],
  paciente: [
    { key: 'inicio', label: 'Inicio', path: '/', icon: House },
    { key: 'historial', label: 'Historial', path: '/historial', icon: Clock },
    { key: 'perfil', label: 'Perfil', path: '/perfil', icon: UserRound },
  ],
};

function isCurrentPath(currentPath, itemPath) {
  if (itemPath === '/') return currentPath === '/';
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function UserQuickMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const role = normalizeRole(user?.rol);
  const roleItems = MENU_BY_ROLE[role] || [];
  const items = useMemo(
    () => roleItems.filter((item) => !isCurrentPath(location.pathname, item.path)),
    [location.pathname, roleItems]
  );

  if (!user || !['cuidador', 'paciente'].includes(role)) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-10 h-10 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center"
        aria-label="Abrir menú"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-1.5 z-50">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(item.path);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
          <div className="my-1 border-t border-slate-200" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-700 hover:bg-rose-50"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default UserQuickMenu;
