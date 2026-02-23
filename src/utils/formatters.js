import { format, parseISO, isToday, isTomorrow, isYesterday, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

// Formatear fecha
export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: es });
};

// Formatear fecha relativa (hoy, mañana, ayer)
export const formatRelativeDate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(dateObj)) return 'Hoy';
  if (isTomorrow(dateObj)) return 'Mañana';
  if (isYesterday(dateObj)) return 'Ayer';

  return format(dateObj, 'EEEE d MMMM', { locale: es });
};

// Formatear hora
export const formatTime = (time) => {
  if (!time) return '';
  return time;
};

// Formatear duración en minutos a horas y minutos
export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  
  return `${hours} h ${mins} min`;
};

// Formatear cronómetro (mm:ss)
export const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Formatear número de teléfono
export const formatPhone = (phone) => {
  if (!phone) return '';
  return phone;
};

// Capitalizar primera letra
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Truncar texto
export const truncate = (str, length = 50) => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
};

// Formatear nombre de categoría
export const formatCategoria = (categoria) => {
  const categorias = {
    cognitivo: 'Cognitivo',
    fisico: 'Físico',
    social: 'Social',
    creativo: 'Creativo',
  };
  return categorias[categoria] || capitalize(categoria);
};

// Formatear tipo de cliente
export const formatTipoCliente = (tipo) => {
  const tipos = {
    adulto_mayor: 'Adulto Mayor',
    nino: 'Niño/a',
  };
  return tipos[tipo] || capitalize(tipo);
};

// Formatear estado
export const formatEstado = (estado) => {
  const estados = {
    pendiente: 'Pendiente',
    completado: 'Completado',
    cancelado: 'Cancelado',
    en_curso: 'En curso',
    activo: 'Activo',
    inactivo: 'Inactivo',
  };
  return estados[estado] || capitalize(estado);
};

// Obtener color de estado
export const getEstadoColor = (estado) => {
  const colores = {
    pendiente: 'warning',
    completado: 'success',
    cancelado: 'secondary',
    en_curso: 'primary',
    activo: 'success',
    inactivo: 'gray',
  };
  return colores[estado] || 'gray';
};

// Calcular edad
export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const birthDate = typeof fechaNacimiento === 'string' 
    ? parseISO(fechaNacimiento) 
    : fechaNacimiento;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Formatear moneda
export const formatCurrency = (amount, currency = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Agrupar array por propiedad
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

// Ordenar array por fecha
export const sortByDate = (array, dateKey = 'fecha', descending = true) => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateKey]);
    const dateB = new Date(b[dateKey]);
    return descending ? dateB - dateA : dateA - dateB;
  });
};

// Filtrar por rango de fechas
export const filterByDateRange = (array, dateKey, startDate, endDate) => {
  return array.filter((item) => {
    const itemDate = new Date(item[dateKey]);
    return itemDate >= startDate && itemDate <= endDate;
  });
};

// Generar ID único
export const generateId = (prefix = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Debounce
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Validar email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validar código numérico
export const isValidCode = (code, length = 4) => {
  const regex = new RegExp(`^\\d{${length}}$`);
  return regex.test(code);
};

export default {
  formatDate,
  formatRelativeDate,
  formatTime,
  formatDuration,
  formatTimer,
  formatPhone,
  capitalize,
  truncate,
  formatCategoria,
  formatTipoCliente,
  formatEstado,
  getEstadoColor,
  calcularEdad,
  formatCurrency,
  groupBy,
  sortByDate,
  filterByDateRange,
  generateId,
  debounce,
  isValidEmail,
  isValidCode,
};
