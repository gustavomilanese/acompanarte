import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, User, BookOpen, History } from 'lucide-react';

const navItemsAcompanante = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/turnos', icon: Calendar, label: 'Mis Turnos' },
  { path: '/biblioteca', icon: BookOpen, label: 'Biblioteca' },
  { path: '/perfil', icon: User, label: 'Perfil' },
];

const navItemsFamiliar = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/historial', icon: History, label: 'Historial' },
  { path: '/perfil', icon: User, label: 'Perfil' },
];

export function BottomNav({ type = 'acompanante' }) {
  const location = useLocation();
  const navItems = type === 'acompanante' ? navItemsAcompanante : navItemsFamiliar;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-light-300 shadow-lg z-50">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center
                  w-full h-full
                  transition-colors duration-200
                  ${isActive
                    ? 'text-primary'
                    : 'text-dark-400 hover:text-dark-600'
                  }
                `}
              >
                <Icon
                  className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`}
                />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default BottomNav;
