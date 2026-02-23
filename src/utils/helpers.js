// Helpers generales

// Convertir archivo a base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Comprimir imagen
export const compressImage = (base64String, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64String;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

// Obtener iniciales de nombre
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Generar color aleatorio basado en string
export const stringToColor = (str) => {
  if (!str) return '#4ECDC4';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Scroll suave a elemento
export const scrollToElement = (elementId, offset = 80) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
};

// Copiar al portapapeles
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Error al copiar:', err);
    return false;
  }
};

// Descargar archivo
export const downloadFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Formatear bytes a unidad legible
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Verificar si es dispositivo móvil
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Verificar si es iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Verificar si es modo standalone (PWA instalada)
export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
};

// Solicitar permiso de notificaciones
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Enviar notificación local
export const sendNotification = (title, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  new Notification(title, {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    ...options,
  });
};

// Throttle
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Deep clone
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Comparar objetos
export const isEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

// Obtener diferencia entre arrays
export const getArrayDifference = (arr1, arr2, key) => {
  return arr1.filter(
    (item1) => !arr2.some((item2) => item2[key] === item1[key])
  );
};

// Particionar array
export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Mezclar array aleatoriamente
export const shuffle = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Calcular distancia entre coordenadas (Haversine)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default {
  fileToBase64,
  compressImage,
  getInitials,
  stringToColor,
  scrollToElement,
  copyToClipboard,
  downloadFile,
  formatBytes,
  isMobile,
  isIOS,
  isStandalone,
  requestNotificationPermission,
  sendNotification,
  throttle,
  deepClone,
  isEqual,
  getArrayDifference,
  chunk,
  shuffle,
  calculateDistance,
};
