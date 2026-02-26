import React from 'react';
import { Bell, Menu, ChevronLeft, User, LogOut } from 'lucide-react';
import { UserQuickMenu } from '@/components/UserQuickMenu';

export function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  showMenu = false,
  onMenuClick,
  showNotifications = false,
  onNotificationsClick,
  showLogout = false,
  onLogout,
  showContextMenu = true,
  user,
  className = '',
}) {
  return (
    <header className={`bg-white shadow-sm ${className}`}>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Left section */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-full hover:bg-light-200 transition-colors"
                aria-label="Volver"
              >
                <ChevronLeft className="w-6 h-6 text-dark" />
              </button>
            )}
            {showMenu && (
              <button
                onClick={onMenuClick}
                className="p-2 -ml-2 rounded-full hover:bg-light-200 transition-colors"
                aria-label="Menú"
              >
                <Menu className="w-6 h-6 text-dark" />
              </button>
            )}
            <div className="min-w-0">
              {title && (
                <h1 className="text-base sm:text-xl font-bold text-dark leading-tight truncate">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-dark-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {showContextMenu && <UserQuickMenu />}
            {showNotifications && (
              <button
                onClick={onNotificationsClick}
                className="p-2 rounded-full hover:bg-light-200 transition-colors relative"
                aria-label="Notificaciones"
              >
                <Bell className="w-6 h-6 text-dark" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full" />
              </button>
            )}
            {showLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-full hover:bg-light-200 transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-6 h-6 text-dark" />
              </button>
            )}
            {user && (
              <div className="flex items-center gap-2 ml-1 sm:ml-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nombre}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function HeaderSimple({ title, className = '' }) {
  return (
    <header className={`bg-primary text-white py-4 px-4 ${className}`}>
      <h1 className="text-xl font-bold text-center">{title}</h1>
    </header>
  );
}

export default Header;
