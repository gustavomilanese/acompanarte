import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const toastTypes = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-500',
    textColor: 'text-white',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-secondary',
    textColor: 'text-white',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-accent',
    textColor: 'text-dark',
  },
  info: {
    icon: Info,
    bgColor: 'bg-primary',
    textColor: 'text-white',
  },
};

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  show = true,
}) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const { icon: Icon, bgColor, textColor } = toastTypes[type];

  return (
    <div
      className={`
        fixed top-4 left-4 right-4 z-[100]
        flex items-center gap-3
        ${bgColor} ${textColor}
        px-4 py-3 rounded-xl shadow-lg
        animate-in slide-in-from-top-2 fade-in duration-200
      `}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Hook para manejar toasts
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, duration, show: true });
  };

  const hideToast = () => {
    setToast((prev) => (prev ? { ...prev, show: false } : null));
  };

  const toastComponent = toast?.show ? (
    <Toast
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      onClose={hideToast}
      show={toast.show}
    />
  ) : null;

  return {
    toast: toastComponent,
    showToast,
    hideToast,
    showSuccess: (msg, dur) => showToast(msg, 'success', dur),
    showError: (msg, dur) => showToast(msg, 'error', dur),
    showWarning: (msg, dur) => showToast(msg, 'warning', dur),
    showInfo: (msg, dur) => showToast(msg, 'info', dur),
  };
}

export default Toast;
