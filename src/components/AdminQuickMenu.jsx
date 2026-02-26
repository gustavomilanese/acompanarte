import React, { useMemo, useState } from 'react';
import { Menu, X, LogOut, Users, House, Calendar, HandHeart, Wallet, ClipboardList } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin', icon: House },
  { key: 'servicios', label: 'Servicios', path: '/admin/servicios', icon: ClipboardList },
  { key: 'calendario', label: 'Calendario', path: '/admin/calendario', icon: Calendar },
  { key: 'pacientes', label: 'Pacientes', path: '/admin/clientes', icon: HandHeart },
  { key: 'cuidadores', label: 'Cuidadores', path: '/admin/acompanantes', icon: Users },
  { key: 'finanzas', label: 'Finanzas', path: '/admin/finanzas', icon: Wallet },
  { key: 'usuarios', label: 'Usuarios', path: '/admin/usuarios', icon: Users },
];

export function AdminQuickMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => MENU_ITEMS.filter((item) => item.path !== location.pathname),
    [location.pathname]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
              handleLogout();
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

export default AdminQuickMenu;
