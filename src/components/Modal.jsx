import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  contentClassName = '',
  headerClassName = '',
  showCloseButton = true,
  closeOnOverlayClick = true,
}) {
  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-md transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal content */}
      <div
        className={`
          relative bg-white rounded-3xl shadow-2xl border border-white
          w-full ${sizeClasses[size]}
          max-h-[90vh] overflow-auto
          animate-in fade-in zoom-in-95 duration-200
          ${contentClassName}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between p-4 border-b border-light-200 bg-gradient-to-r from-white via-sky-50 to-violet-50 rounded-t-3xl ${headerClassName}`}>
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-slate-800">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  p-2 rounded-full hover:bg-white transition-colors border border-slate-200
                  ${!title ? 'ml-auto' : ''}
                `}
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
