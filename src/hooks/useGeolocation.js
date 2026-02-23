import { useState, useCallback } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simular obtención de geolocalización
  const getCurrentPosition = useCallback(() => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      // Simular delay de geolocalización
      setTimeout(() => {
        // Coordenadas dummy de Buenos Aires
        const mockLocation = {
          latitude: -34.603722 + (Math.random() - 0.5) * 0.01,
          longitude: -58.381592 + (Math.random() - 0.5) * 0.01,
          accuracy: 10 + Math.random() * 20,
          timestamp: new Date().toISOString(),
        };

        console.log('[Geolocation] Posición obtenida:', mockLocation);
        
        setLocation(mockLocation);
        setLoading(false);
        resolve(mockLocation);
      }, 1000);
    });
  }, []);

  // Función para cuando se implemente geolocalización real
  const getRealPosition = useCallback(() => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocalización no soportada');
        setError(error.message);
        setLoading(false);
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          };
          
          setLocation(locationData);
          setLoading(false);
          resolve(locationData);
        },
        (error) => {
          const errorMessage = `Error de geolocalización: ${error.message}`;
          setError(errorMessage);
          setLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    error,
    loading,
    getCurrentPosition,
    getRealPosition,
    clearLocation,
  };
}

export default useGeolocation;
