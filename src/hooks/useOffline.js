import { useState, useEffect, useCallback } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      console.log('[Network] Conexión recuperada');
      
      // Simular sync de datos
      setTimeout(() => {
        console.log('[Sync] Sincronizando datos pendientes...');
        // Aquí iría la lógica real de sincronización
      }, 500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[Network] Conexión perdida');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Función para simular el estado de conexión (para testing)
  const simulateOffline = useCallback(() => {
    setIsOnline(false);
    console.log('[Network] Simulando modo offline');
  }, []);

  const simulateOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true);
    console.log('[Network] Simulando modo online');
  }, []);

  // Resetear el flag de wasOffline
  const resetWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    isOnline,
    wasOffline,
    isOffline: !isOnline,
    simulateOffline,
    simulateOnline,
    resetWasOffline,
  };
}

export default useOffline;
