import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Plus
} from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/services/adminApi';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears
} from 'date-fns';
import { es } from 'date-fns/locale';

const HORAS = Array.from({ length: 24 }, (_, i) => i); // 00:00 a 23:00
const DURACIONES_HORAS = Array.from({ length: 24 }, (_, i) => i + 1);
const DAY_HOUR_CELL_HEIGHT = 32;
const WEEK_HOUR_CELL_HEIGHT = 48;
const DAY_CARD_WIDTH = 210;
const DAY_CARD_GAP = 6;
const MAX_DAY_PARALLEL = 3;
const PERSONALIZADO_SCHEDULE_MODE = {
  repeat: 'repeat',
  specific_dates: 'specific_dates',
};
const REPEAT_DAY_OPTIONS = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' },
];
const PROVINCIAS_ARG = [
  'CABA',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];
const BARRIOS_CABA = [
  'Agronomia', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo', 'Caballito', 'Chacarita',
  'Coghlan', 'Colegiales', 'Constitucion', 'Flores', 'Floresta', 'La Boca', 'Liniers', 'Mataderos',
  'Monserrat', 'Monte Castro', 'Nueva Pompeya', 'Nunez', 'Palermo', 'Parque Avellaneda',
  'Parque Chacabuco', 'Parque Chas', 'Parque Patricios', 'Puerto Madero', 'Recoleta', 'Retiro',
  'Saavedra', 'San Cristobal', 'San Nicolas', 'San Telmo', 'Velez Sarsfield', 'Versalles',
  'Villa Crespo', 'Villa Devoto', 'Villa Lugano', 'Villa Luro', 'Villa Ortuzar', 'Villa Pueyrredon',
  'Villa Real', 'Villa Santa Rita', 'Villa Soldati', 'Villa Urquiza',
];
const PARTIDOS_GBA = [
  'Almirante Brown',
  'Avellaneda',
  'Berazategui',
  'Berisso',
  'Brandsen',
  'Campana',
  'Canuelas',
  'Ensenada',
  'Escobar',
  'Esteban Echeverria',
  'Ezeiza',
  'Exaltacion de la Cruz',
  'Florencio Varela',
  'General Las Heras',
  'General Rodriguez',
  'General San Martin',
  'Hurlingham',
  'Ituzaingo',
  'Jose C. Paz',
  'La Matanza',
  'La Plata',
  'Lanus',
  'Lomas de Zamora',
  'Lujan',
  'Malvinas Argentinas',
  'Marcos Paz',
  'Merlo',
  'Moreno',
  'Moron',
  'Pilar',
  'Presidente Peron',
  'Quilmes',
  'San Fernando',
  'San Isidro',
  'San Miguel',
  'San Vicente',
  'Tigre',
  'Tres de Febrero',
  'Vicente Lopez',
  'Zarate',
];

const COLORES_CUIDADOR = [
  'bg-sky-50 text-slate-700 border-sky-200',
  'bg-emerald-50 text-slate-700 border-emerald-200',
  'bg-violet-50 text-slate-700 border-violet-200',
  'bg-amber-50 text-slate-700 border-amber-200',
  'bg-rose-50 text-slate-700 border-rose-200',
];

const STATUS_LABEL = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const STATUS_CLASS = {
  pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  en_curso: 'bg-sky-100 text-sky-700 border-sky-200',
  completado: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelado: 'bg-red-100 text-red-700 border-red-200',
};

const REPEAT_MODE_LABEL = {
  none: 'Sin repeticion',
  weekdays: 'Lunes a Viernes',
  everyday: 'Lunes a Lunes',
  weekend: 'Fin de semana',
  custom: 'Dias personalizados',
};
const MONTH_OPTIONS = [
  { value: 1, label: 'Ene' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dic' },
];
const HOURS_12_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

export function Calendario() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [servicios, setServicios] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [cuidadores, setCuidadores] = useState([]);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [viewMode, setViewMode] = useState('day');
  const [showModal, setShowModal] = useState(false);
  const [servicioDetalle, setServicioDetalle] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmMoveDialog, setConfirmMoveDialog] = useState(null);
  const [servicioEditando, setServicioEditando] = useState(null);
  const [servicioArrastrandoId, setServicioArrastrandoId] = useState(null);
  const [repeatMode, setRepeatMode] = useState('none');
  const [repeatUntil, setRepeatUntil] = useState('');
  const [repeatDays, setRepeatDays] = useState([]);
  const [isPersonalizadoNuevoServicio, setIsPersonalizadoNuevoServicio] = useState(false);
  const [personalizadoScheduleMode, setPersonalizadoScheduleMode] = useState(PERSONALIZADO_SCHEDULE_MODE.repeat);
  const [specificDates, setSpecificDates] = useState([]);
  const [serviceBlocks, setServiceBlocks] = useState([]);
  const dayScrollRef = useRef(null);
  const weekScrollRef = useRef(null);

  const [formData, setFormData] = useState({
    fecha: '',
    horaInicio: '09:00',
    duracionHoras: 2,
    direccion: '',
    provincia: '',
    zona: '',
    direccionDetalle: '',
    cuidadorId: '',
    pacienteId: '',
    estado: 'pendiente',
    notas: '',
  });
  const modernPickerClass =
    'w-full h-12 px-3 bg-white border-2 border-sky-200 rounded-xl text-slate-800 font-normal shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition';
  const formFieldClass =
    'w-full px-4 py-3 bg-white border-2 border-sky-200 rounded-xl text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition';
  const createEmptyBlock = (horaInicio = '09:00') => ({
    id: `${Date.now()}-${Math.random()}`,
    horaInicio,
    duracionHoras: 2,
    cuidadorId: '',
  });

  const loadData = async () => {
    try {
      const [serviciosData, pacientesData, cuidadoresData] = await Promise.all([
        adminApi.getServicios(),
        adminApi.getClientes(),
        adminApi.getAcompanantes(),
      ]);

      setServicios(serviciosData);
      setPacientes(pacientesData);
      setCuidadores(cuidadoresData);
    } catch (error) {
      showError(error.message || 'No se pudo cargar el calendario');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const diasMesGrilla = useMemo(() => {
    const start = startOfWeek(startOfMonth(fechaActual), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(fechaActual), { weekStartsOn: 1 });
    const days = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [fechaActual]);

  const diasSemana = useMemo(() => {
    const inicio = startOfWeek(fechaActual, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
  }, [fechaActual]);

  const coloresCuidadores = useMemo(() => {
    const map = {};
    cuidadores.forEach((c, index) => {
      map[c.id] = COLORES_CUIDADOR[index % COLORES_CUIDADOR.length];
    });
    return map;
  }, [cuidadores]);

  const navegarAnterior = () => {
    setFechaActual((prev) => (
      viewMode === 'day'
        ? addDays(prev, -1)
        : viewMode === 'week'
          ? subWeeks(prev, 1)
          : viewMode === 'month'
            ? subMonths(prev, 1)
            : subYears(prev, 1)
    ));
  };

  const navegarSiguiente = () => {
    setFechaActual((prev) => (
      viewMode === 'day'
        ? addDays(prev, 1)
        : viewMode === 'week'
          ? addWeeks(prev, 1)
          : viewMode === 'month'
            ? addMonths(prev, 1)
            : addYears(prev, 1)
    ));
  };

  const getZonaCorta = (direccion) => {
    if (!direccion || !direccion.trim()) return '';
    const partes = direccion.split(',').map((p) => p.trim()).filter(Boolean);
    if (partes.length >= 3) return partes[partes.length - 2];
    if (partes.length === 2) return partes[0];
    return direccion.trim().slice(0, 30);
  };

  const parseDireccionServicio = (direccion) => {
    if (!direccion) return { provincia: '', zona: '', direccionDetalle: '' };
    const partes = direccion.split(',').map((p) => p.trim()).filter(Boolean);
    if (partes.length >= 3) {
      return {
        provincia: partes[partes.length - 1],
        zona: partes[partes.length - 2],
        direccionDetalle: partes.slice(0, -2).join(', '),
      };
    }
    if (partes.length === 2) {
      return {
        provincia: partes[1],
        zona: partes[0],
        direccionDetalle: '',
      };
    }
    return { provincia: '', zona: partes[0] || '', direccionDetalle: '' };
  };

  const buildDireccionServicio = (form) => {
    return [form.direccionDetalle, form.zona, form.provincia].filter(Boolean).join(', ');
  };

  const provinciaFormNormalizada = String(formData.provincia || '').trim().toLowerCase();
  const esCabaForm = provinciaFormNormalizada === 'caba';
  const opcionesZona = esCabaForm
    ? BARRIOS_CABA
    : (['buenos aires', 'provincia de buenos aires'].includes(provinciaFormNormalizada))
      ? PARTIDOS_GBA
      : [];

  const aplicaEnFecha = (servicio, fecha) => {
    const start = new Date(servicio.fechaInicio);
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);
    const targetDay = new Date(fecha);
    targetDay.setHours(0, 0, 0, 0);

    if (targetDay < startDay) return false;

    const mode = servicio.repeatMode || 'none';
    if (mode === 'none') return isSameDay(startDay, targetDay);

    if (servicio.repeatUntil) {
      const untilDay = new Date(servicio.repeatUntil);
      untilDay.setHours(0, 0, 0, 0);
      if (targetDay > untilDay) return false;
    }

    const day = targetDay.getDay();
    if (mode === 'weekdays') return day >= 1 && day <= 5;
    if (mode === 'everyday') return true;
    if (mode === 'weekend') return day === 0 || day === 6;
    if (mode === 'custom') return Array.isArray(servicio.repeatDays) && servicio.repeatDays.includes(day);

    return false;
  };

  const getStartForFecha = (servicio, fecha) => {
    const original = new Date(servicio.fechaInicio);
    const start = new Date(fecha);
    start.setHours(original.getHours(), original.getMinutes(), 0, 0);
    return start;
  };

  const serviciosEnCurso = useMemo(
    () => servicios.filter((s) => s.estado === 'en_curso'),
    [servicios]
  );

  const getServiciosQueEmpiezanEnCelda = (fecha, hora) => {
    return serviciosEnCurso.filter((s) => {
      if (!aplicaEnFecha(s, fecha)) return false;
      const start = getStartForFecha(s, fecha);
      return start.getHours() === hora;
    });
  };

  const getServiciosDelDia = (fecha) => {
    return serviciosEnCurso
      .filter((s) => aplicaEnFecha(s, fecha))
      .map((s) => ({
        ...s,
        fechaInicio: getStartForFecha(s, fecha).toISOString(),
      }))
      .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
  };

  const getCantidadServiciosProgramadosDelDia = (fecha) => {
    return servicios.filter((s) => s.estado !== 'cancelado' && aplicaEnFecha(s, fecha)).length;
  };

  const serviciosDiaActual = useMemo(() => getServiciosDelDia(fechaActual), [serviciosEnCurso, fechaActual]);

  const servicioTieneOcurrenciaEnRango = (servicio, rangeStart, rangeEnd) => {
    const start = new Date(servicio.fechaInicio);
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);

    const from = new Date(Math.max(startDay.getTime(), rangeStart.getTime()));
    const until = servicio.repeatUntil ? new Date(servicio.repeatUntil) : null;
    if (until) until.setHours(0, 0, 0, 0);
    const to = new Date(Math.min(rangeEnd.getTime(), until ? until.getTime() : rangeEnd.getTime()));

    if (to < from) return false;

    const cursor = new Date(from);
    while (cursor <= to) {
      if (aplicaEnFecha(servicio, cursor)) return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  };

  const serviciosAnioPorMes = useMemo(() => {
    const year = fechaActual.getFullYear();
    const meses = Array.from({ length: 12 }, (_, month) => ({
      date: new Date(year, month, 1),
      count: 0,
    }));

    meses.forEach((mes) => {
      const monthStart = new Date(mes.date.getFullYear(), mes.date.getMonth(), 1);
      const monthEnd = endOfMonth(monthStart);
      mes.count = serviciosEnCurso.filter((servicio) =>
        servicioTieneOcurrenciaEnRango(servicio, monthStart, monthEnd)
      ).length;
    });

    return meses;
  }, [fechaActual, serviciosEnCurso]);

  const abrirNuevoServicio = (fecha, hora) => {
    setServicioEditando(null);
    const startDate = format(fecha, 'yyyy-MM-dd');
    setFormData({
      fecha: startDate,
      horaInicio: `${String(hora).padStart(2, '0')}:00`,
      duracionHoras: 2,
      direccion: '',
      provincia: '',
      zona: '',
      direccionDetalle: '',
      cuidadorId: '',
      pacienteId: '',
      estado: 'pendiente',
      notas: '',
    });
    setRepeatMode('none');
    setRepeatUntil(startDate);
    setRepeatDays([fecha.getDay()]);
    setIsPersonalizadoNuevoServicio(false);
    setPersonalizadoScheduleMode(PERSONALIZADO_SCHEDULE_MODE.repeat);
    setSpecificDates([startDate]);
    setServiceBlocks([createEmptyBlock(`${String(hora).padStart(2, '0')}:00`)]);
    setShowModal(true);
  };

  const abrirEditarServicio = (servicio) => {
    const start = new Date(servicio.fechaInicio);
    const parsedDireccion = parseDireccionServicio(servicio.direccion || servicio.paciente?.direccion || '');
    setServicioEditando(servicio);
    setFormData({
      fecha: format(start, 'yyyy-MM-dd'),
      horaInicio: format(start, 'HH:mm'),
      duracionHoras: servicio.duracionHoras ?? (servicio.duracionMinutos || 60) / 60,
      direccion: servicio.direccion || servicio.paciente?.direccion || '',
      provincia: parsedDireccion.provincia,
      zona: parsedDireccion.zona,
      direccionDetalle: parsedDireccion.direccionDetalle,
      cuidadorId: servicio.cuidadorId,
      pacienteId: servicio.pacienteId,
      estado: servicio.estado || 'pendiente',
      notas: servicio.notas || '',
    });
    setRepeatMode(servicio.repeatMode || 'none');
    setRepeatUntil(servicio.repeatUntil ? format(new Date(servicio.repeatUntil), 'yyyy-MM-dd') : format(start, 'yyyy-MM-dd'));
    setRepeatDays(Array.isArray(servicio.repeatDays) && servicio.repeatDays.length > 0 ? servicio.repeatDays : [start.getDay()]);
    setIsPersonalizadoNuevoServicio(false);
    setPersonalizadoScheduleMode(PERSONALIZADO_SCHEDULE_MODE.repeat);
    setSpecificDates([format(start, 'yyyy-MM-dd')]);
    setServiceBlocks([
      {
        id: `${Date.now()}-${Math.random()}`,
        horaInicio: format(start, 'HH:mm'),
        duracionHoras: servicio.duracionHoras ?? (servicio.duracionMinutos || 60) / 60,
        cuidadorId: servicio.cuidadorId || '',
      },
    ]);
    setShowModal(true);
  };

  const abrirDuplicadoServicio = (servicio) => {
    const start = new Date(servicio.fechaInicio);
    const parsedDireccion = parseDireccionServicio(servicio.direccion || servicio.paciente?.direccion || '');
    setServicioEditando(null);
    setFormData({
      fecha: format(start, 'yyyy-MM-dd'),
      horaInicio: format(start, 'HH:mm'),
      duracionHoras: servicio.duracionHoras ?? (servicio.duracionMinutos || 60) / 60,
      direccion: servicio.direccion || servicio.paciente?.direccion || '',
      provincia: parsedDireccion.provincia,
      zona: parsedDireccion.zona,
      direccionDetalle: parsedDireccion.direccionDetalle,
      cuidadorId: servicio.cuidadorId,
      pacienteId: servicio.pacienteId,
      estado: 'pendiente',
      notas: servicio.notas || '',
    });
    setRepeatMode(servicio.repeatMode || 'none');
    setRepeatUntil(
      servicio.repeatUntil
        ? format(new Date(servicio.repeatUntil), 'yyyy-MM-dd')
        : format(start, 'yyyy-MM-dd')
    );
    setRepeatDays(
      Array.isArray(servicio.repeatDays) && servicio.repeatDays.length > 0
        ? servicio.repeatDays
        : [start.getDay()]
    );
    setIsPersonalizadoNuevoServicio(false);
    setPersonalizadoScheduleMode(PERSONALIZADO_SCHEDULE_MODE.repeat);
    setSpecificDates([format(start, 'yyyy-MM-dd')]);
    setServiceBlocks([
      {
        id: `${Date.now()}-${Math.random()}`,
        horaInicio: format(start, 'HH:mm'),
        duracionHoras: servicio.duracionHoras ?? (servicio.duracionMinutos || 60) / 60,
        cuidadorId: servicio.cuidadorId || '',
      },
    ]);
    setShowModal(true);
  };

  const handleDuplicarDesdeEdicion = () => {
    setServicioEditando(null);
    setFormData((prev) => ({
      ...prev,
      estado: 'pendiente',
    }));
    setIsPersonalizadoNuevoServicio(false);
    setPersonalizadoScheduleMode(PERSONALIZADO_SCHEDULE_MODE.repeat);
    setSpecificDates([formData.fecha || format(new Date(), 'yyyy-MM-dd')]);
    setServiceBlocks([
      {
        id: `${Date.now()}-${Math.random()}`,
        horaInicio: formData.horaInicio || '09:00',
        duracionHoras: Number(formData.duracionHoras) || 2,
        cuidadorId: formData.cuidadorId || '',
      },
    ]);
    showSuccess('Servicio duplicado. Revisá los datos y guardá para crear el nuevo.');
  };

  const addServiceBlock = () => {
    setServiceBlocks((prev) => [...prev, createEmptyBlock('09:00')]);
  };

  const updateServiceBlock = (blockId, field, value) => {
    setServiceBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, [field]: value } : b))
    );
  };

  const removeServiceBlock = (blockId) => {
    setServiceBlocks((prev) => (prev.length > 1 ? prev.filter((b) => b.id !== blockId) : prev));
  };

  const addSpecificDate = () => {
    const base = specificDates[specificDates.length - 1] || formData.fecha || format(new Date(), 'yyyy-MM-dd');
    setSpecificDates((prev) => [...prev, base]);
  };

  const updateSpecificDate = (idx, value) => {
    setSpecificDates((prev) => prev.map((d, i) => (i === idx ? value : d)));
  };

  const removeSpecificDate = (idx) => {
    setSpecificDates((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const applyBlockPreset = (preset) => {
    const presets = {
      maniana_noche: [
        { id: `${Date.now()}-m1`, horaInicio: '08:00', duracionHoras: 4, cuidadorId: '' },
        { id: `${Date.now()}-m2`, horaInicio: '20:00', duracionHoras: 4, cuidadorId: '' },
      ],
      jornada_doble: [
        { id: `${Date.now()}-j1`, horaInicio: '08:00', duracionHoras: 8, cuidadorId: '' },
        { id: `${Date.now()}-j2`, horaInicio: '16:00', duracionHoras: 8, cuidadorId: '' },
      ],
      completo_24h: [
        { id: `${Date.now()}-c1`, horaInicio: '00:00', duracionHoras: 24, cuidadorId: '' },
      ],
    };
    const currentCaregivers = serviceBlocks.map((b) => b.cuidadorId).filter(Boolean);
    setServiceBlocks(
      (presets[preset] || []).map((b, idx) => ({
        ...b,
        cuidadorId: currentCaregivers[idx] || '',
      }))
    );
  };

  const togglePersonalizacionNuevoServicio = () => {
    setIsPersonalizadoNuevoServicio((prev) => {
      const next = !prev;
      if (next) {
        setServiceBlocks((blocks) => (
          blocks.length > 0
            ? blocks
            : [
                {
                  id: `${Date.now()}-${Math.random()}`,
                  horaInicio: formData.horaInicio || '09:00',
                  duracionHoras: Number(formData.duracionHoras) || 2,
                  cuidadorId: formData.cuidadorId || '',
                },
              ]
        ));
      } else {
        const firstBlock = serviceBlocks[0];
        if (firstBlock) {
          setFormData((prevForm) => ({
            ...prevForm,
            horaInicio: firstBlock.horaInicio || prevForm.horaInicio,
            duracionHoras: Number(firstBlock.duracionHoras) || prevForm.duracionHoras,
            cuidadorId: firstBlock.cuidadorId || prevForm.cuidadorId,
          }));
        }
      }
      return next;
    });
  };

  const abrirDetalleServicio = (servicio) => {
    setServicioDetalle(servicio);
  };

  useEffect(() => {
    const focusServiceId = location.state?.focusServiceId;
    if (!focusServiceId || servicios.length === 0) return;

    const servicio = servicios.find((s) => s.id === focusServiceId);
    if (!servicio) return;

    const focusDate = location.state?.focusDate ? new Date(location.state.focusDate) : new Date(servicio.fechaInicio);
    setFechaActual(focusDate);
    setViewMode('day');
    abrirDetalleServicio({
      ...servicio,
      fechaInicio: focusDate.toISOString(),
    });

    navigate('/admin/calendario', { replace: true });
  }, [location.state, servicios]);

  const handleCeldaClick = (fecha, hora) => {
    const serviciosEnCelda = getServiciosQueEmpiezanEnCelda(fecha, hora);
    if (serviciosEnCelda.length > 0) {
      abrirDetalleServicio(serviciosEnCelda[0]);
    } else {
      abrirNuevoServicio(fecha, hora);
    }
  };

  const handleNuevoServicio = () => {
    const ahora = new Date();
    abrirNuevoServicio(ahora, 9);
  };

  const updateServicioWith = async (servicio, overrides = {}) => {
    const payload = {
      fechaInicio: servicio.fechaInicio,
      duracionHoras: servicio.duracionHoras ?? (servicio.duracionMinutos || 60) / 60,
      cuidadorId: servicio.cuidadorId,
      pacienteId: servicio.pacienteId,
      estado: servicio.estado || 'pendiente',
      direccion: servicio.direccion || null,
      notas: servicio.notas || '',
      repeatMode: servicio.repeatMode || 'none',
      repeatUntil: servicio.repeatUntil || null,
      repeatDays: Array.isArray(servicio.repeatDays) ? servicio.repeatDays : [],
      ...overrides,
    };
    await adminApi.updateServicio(servicio.id, payload);
  };

  const applyMoveServicio = async ({ servicio, fecha, hora, scope }) => {
    const droppedStart = new Date(fecha);
    droppedStart.setHours(hora, 0, 0, 0);

    const newStart = new Date(droppedStart);
    newStart.setMinutes(0, 0, 0);

    if (scope === 'single' && (servicio.repeatMode || 'none') !== 'none') {
      showError('Mover solo este día para servicios recurrentes todavía no está habilitado. Elegí "Toda la secuencia".');
      return;
    }

    let nextRepeatDays = Array.isArray(servicio.repeatDays) ? [...servicio.repeatDays] : [];
    if (scope === 'series' && (servicio.repeatMode || 'none') === 'custom') {
      const originalStart = new Date(servicio.fechaInicio);
      const oldDay = originalStart.getDay();
      const newDay = newStart.getDay();
      if (nextRepeatDays.includes(oldDay) && !nextRepeatDays.includes(newDay)) {
        nextRepeatDays = nextRepeatDays.map((d) => (d === oldDay ? newDay : d));
      } else if (!nextRepeatDays.includes(newDay)) {
        nextRepeatDays.push(newDay);
      }
    }

    await updateServicioWith(servicio, {
      fechaInicio: newStart.toISOString(),
      repeatDays: nextRepeatDays,
    });
    showSuccess(scope === 'series' ? 'Secuencia movida correctamente' : 'Servicio movido correctamente');
    await loadData();
  };

  const handleDropServicio = (fecha, hora) => {
    if (!servicioArrastrandoId) return;
    const servicio = servicios.find((s) => s.id === servicioArrastrandoId);
    if (!servicio) {
      setServicioArrastrandoId(null);
      return;
    }

    setConfirmMoveDialog({ servicio, fecha, hora });
  };

  const resolverDropServicio = async (scope) => {
    if (!confirmMoveDialog) return;
    try {
      await applyMoveServicio({
        servicio: confirmMoveDialog.servicio,
        fecha: confirmMoveDialog.fecha,
        hora: confirmMoveDialog.hora,
        scope,
      });
    } catch (error) {
      showError(error.message || 'No se pudo mover el servicio');
    } finally {
      setConfirmMoveDialog(null);
      setServicioArrastrandoId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (repeatMode !== 'none' && !repeatUntil) {
        showError('Seleccioná una fecha de fin para la repetición.');
        return;
      }

      if (repeatMode !== 'none') {
        const startDate = new Date(`${formData.fecha}T00:00:00`);
        const endDate = new Date(`${repeatUntil}T00:00:00`);
        if (endDate < startDate) {
          showError('La fecha de fin no puede ser anterior a la fecha inicial.');
          return;
        }
      }

      if (repeatMode === 'custom' && repeatDays.length === 0) {
        showError('Seleccioná al menos un día para la repetición.');
        return;
      }

      const basePayload = {
        direccion: buildDireccionServicio(formData),
        pacienteId: formData.pacienteId,
        estado: formData.estado,
        notas: formData.notas,
        repeatMode,
        repeatUntil: repeatMode === 'none' ? null : new Date(`${repeatUntil}T23:59:59`).toISOString(),
        repeatDays: repeatMode === 'custom' ? repeatDays : [],
      };

      if (servicioEditando) {
        const payload = {
          ...basePayload,
          fechaInicio: new Date(`${formData.fecha}T${formData.horaInicio}:00`).toISOString(),
          duracionHoras: Number(formData.duracionHoras),
          cuidadorId: formData.cuidadorId,
        };
        await adminApi.updateServicio(servicioEditando.id, payload);
        showSuccess('Servicio actualizado correctamente');
      } else {
        const blocksToCreate = isPersonalizadoNuevoServicio
          ? serviceBlocks
          : [
              {
                horaInicio: formData.horaInicio,
                duracionHoras: Number(formData.duracionHoras),
                cuidadorId: formData.cuidadorId,
              },
            ];

        if (!blocksToCreate.length) {
          showError('Agregá al menos un bloque horario.');
          return;
        }
        if (blocksToCreate.some((b) => !b.cuidadorId)) {
          showError('Seleccioná un cuidador para cada bloque.');
          return;
        }
        const usingSpecificDates =
          isPersonalizadoNuevoServicio && personalizadoScheduleMode === PERSONALIZADO_SCHEDULE_MODE.specific_dates;

        const datesToCreate = usingSpecificDates ? specificDates.filter(Boolean) : [formData.fecha];
        if (!datesToCreate.length) {
          showError('Agregá al menos una fecha puntual.');
          return;
        }

        await Promise.all(
          datesToCreate.flatMap((dateStr) =>
            blocksToCreate.map((block) =>
              adminApi.createServicio({
                ...basePayload,
                repeatMode: usingSpecificDates ? 'none' : basePayload.repeatMode,
                repeatUntil: usingSpecificDates ? null : basePayload.repeatUntil,
                repeatDays: usingSpecificDates ? [] : basePayload.repeatDays,
                fechaInicio: new Date(`${dateStr}T${block.horaInicio}:00`).toISOString(),
                duracionHoras: Number(block.duracionHoras),
                cuidadorId: block.cuidadorId,
              })
            )
          )
        );
        showSuccess(
          (blocksToCreate.length > 1 || datesToCreate.length > 1)
            ? `Servicio personalizado creado (${datesToCreate.length * blocksToCreate.length} registros)`
            : (repeatMode === 'none' ? 'Servicio creado correctamente' : 'Servicio recurrente creado')
        );
      }

      setShowModal(false);
      await loadData();
    } catch (error) {
      showError(error.message || 'No se pudo guardar el servicio');
    }
  };

  const handleEliminarDia = async () => {
    if (!servicioEditando) return;
    setConfirmDialog({
      title: 'Eliminar día',
      message: 'Se eliminará solo este servicio del día actual.',
      confirmText: 'Eliminar día',
      action: async () => {
        await adminApi.deleteServicio(servicioEditando.id);
        showSuccess('Servicio del día eliminado');
        setShowModal(false);
        await loadData();
      },
    });
  };

  const handleEliminarSerie = async () => {
    if (!servicioEditando) return;
    setConfirmDialog({
      title: 'Eliminar serie completa',
      message: 'Se eliminarán todos los servicios de esta serie.',
      confirmText: 'Eliminar serie',
      action: async () => {
        const result = await adminApi.deleteSerieServicio(servicioEditando.id);
        showSuccess(`Serie eliminada (${result?.deletedCount ?? 1} servicios)`);
        setShowModal(false);
        await loadData();
      },
    });
  };

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/login');
  };

  const toggleRepeatDay = (day) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleUpdateEstadoDetalle = async (estado) => {
    if (!servicioDetalle) return;
    try {
      await updateServicioWith(servicioDetalle, { estado });
      showSuccess('Estado actualizado');
      setServicioDetalle(null);
      await loadData();
    } catch (error) {
      showError(error.message || 'No se pudo actualizar el estado');
    }
  };

  const handleBajaDesdeDetalle = () => {
    if (!servicioDetalle) return;
    setConfirmDialog({
      title: 'Dar de baja servicio',
      message: 'El servicio se marcará como cancelado.',
      confirmText: 'Dar de baja',
      action: async () => {
        await updateServicioWith(servicioDetalle, { estado: 'cancelado' });
        showSuccess('Servicio dado de baja');
        setServicioDetalle(null);
        await loadData();
      },
    });
  };
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 9 }, (_, i) => currentYear - 3 + i);

  const parseDateParts = (dateStr) => {
    const fallback = format(new Date(), 'yyyy-MM-dd');
    const safe = /^\d{4}-\d{2}-\d{2}$/.test(dateStr || '') ? dateStr : fallback;
    const [y, m, d] = safe.split('-').map(Number);
    return { year: y, month: m, day: d };
  };

  const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

  const updateDatePart = (field, part, value) => {
    const current = parseDateParts(field === 'fecha' ? formData.fecha : repeatUntil);
    const next = { ...current, [part]: Number(value) };
    const maxDay = daysInMonth(next.year, next.month);
    if (next.day > maxDay) next.day = maxDay;
    const nextDate = `${String(next.year).padStart(4, '0')}-${String(next.month).padStart(2, '0')}-${String(next.day).padStart(2, '0')}`;

    if (field === 'fecha') {
      setFormData((prev) => ({ ...prev, fecha: nextDate }));
    } else {
      setRepeatUntil(nextDate);
    }
  };

  const to12hParts = (timeValue) => {
    const [hRaw = '09', mRaw = '00'] = (timeValue || '09:00').split(':');
    const h24 = Number(hRaw);
    const minute = mRaw;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return { hour12: String(h12).padStart(2, '0'), minute, ampm };
  };

  const setHoraInicio12h = (part, value) => {
    const current = to12hParts(formData.horaInicio);
    const next = { ...current, [part]: value };
    let h = Number(next.hour12) % 12;
    if (next.ampm === 'PM') h += 12;
    const next24 = `${String(h).padStart(2, '0')}:${next.minute}`;
    setFormData((prev) => ({ ...prev, horaInicio: next24 }));
  };

  const DAY_START_HOUR = HORAS[0];
  const DAY_END_HOUR = HORAS[HORAS.length - 1] + 1;
  const DAY_TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

  const layoutServiciosDelDia = (fecha, minHeightPct = 4) => {
    const visibleStart = new Date(fecha);
    visibleStart.setHours(DAY_START_HOUR, 0, 0, 0);
    const visibleEnd = new Date(fecha);
    visibleEnd.setHours(DAY_END_HOUR, 0, 0, 0);

    const base = getServiciosDelDia(fecha)
      .map((servicio, index) => {
        const inicio = new Date(servicio.fechaInicio);
        const duracionHoras = Number(servicio.duracionHoras ?? (servicio.duracionMinutos || 60) / 60);
        const duracionMinutos = Math.max(30, Math.round(duracionHoras * 60));
        const fin = new Date(inicio.getTime() + duracionMinutos * 60 * 1000);

        if (fin <= visibleStart || inicio >= visibleEnd) return null;

        const startMs = Math.max(inicio.getTime(), visibleStart.getTime());
        const endMs = Math.min(fin.getTime(), visibleEnd.getTime());

        return {
          key: `${servicio.id}-${index}-${startMs}`,
          servicio,
          inicio,
          fin,
          startMs,
          endMs,
          lane: 0,
          columns: 1,
          topPct: 0,
          heightPct: 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

    const active = [];
    base.forEach((event) => {
      for (let i = active.length - 1; i >= 0; i -= 1) {
        if (active[i].endMs <= event.startMs) {
          active.splice(i, 1);
        }
      }

      const used = new Set(active.map((a) => a.lane));
      let lane = 0;
      while (used.has(lane)) lane += 1;
      event.lane = lane;
      active.push(event);
    });

    base.forEach((event) => {
      const points = [event.startMs, event.endMs - 1];

      base.forEach((other) => {
        const overlaps = other.startMs < event.endMs && other.endMs > event.startMs;
        if (!overlaps) return;
        points.push(Math.max(event.startMs, other.startMs));
        points.push(Math.min(event.endMs - 1, other.endMs - 1));
      });

      let maxConcurrent = 1;
      points.forEach((p) => {
        const concurrent = base.filter((o) => o.startMs <= p && o.endMs > p).length;
        if (concurrent > maxConcurrent) maxConcurrent = concurrent;
      });

      event.columns = maxConcurrent;

      const minutesFromStart = (event.startMs - visibleStart.getTime()) / 60000;
      const durationMinutes = Math.max(30, (event.endMs - event.startMs) / 60000);
      event.topPct = (minutesFromStart / DAY_TOTAL_MINUTES) * 100;
      event.heightPct = Math.max((durationMinutes / DAY_TOTAL_MINUTES) * 100, minHeightPct);
    });

    return base;
  };

  const dayTimeline = useMemo(() => layoutServiciosDelDia(fechaActual, 2.2), [serviciosEnCurso, fechaActual]);
  const weekTimeline = useMemo(
    () => diasSemana.map((dia) => ({ dia, events: layoutServiciosDelDia(dia, 3.2) })),
    [serviciosEnCurso, diasSemana]
  );
  const dayMaxColumns = useMemo(
    () => Math.max(1, ...dayTimeline.map((event) => event.columns || 1)),
    [dayTimeline]
  );
  const dayTimelineVisible = useMemo(
    () => dayTimeline.filter((event) => event.lane < MAX_DAY_PARALLEL),
    [dayTimeline]
  );
  const dayHiddenByParallelLimit = useMemo(
    () => Math.max(0, dayTimeline.length - dayTimelineVisible.length),
    [dayTimeline.length, dayTimelineVisible.length]
  );

  useEffect(() => {
    if (viewMode === 'day' && dayScrollRef.current) {
      dayScrollRef.current.scrollTop = 8 * DAY_HOUR_CELL_HEIGHT;
    }
    if (viewMode === 'week' && weekScrollRef.current) {
      weekScrollRef.current.scrollTop = 8 * WEEK_HOUR_CELL_HEIGHT;
    }
  }, [viewMode, fechaActual]);

  return (
    <div className="min-h-screen bg-light">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 -ml-2 hover:bg-light-200 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-dark" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-dark">Calendario de servicios</h1>
                <p className="text-sm text-dark-400">
                  {viewMode === 'day' && format(fechaActual, "d MMM yyyy")}
                  {viewMode === 'week' && `${format(diasSemana[0], "d MMM", { locale: es })} - ${format(diasSemana[6], "d MMM yyyy", { locale: es })}`}
                  {viewMode === 'month' && format(fechaActual, "MMMM yyyy", { locale: es })}
                  {viewMode === 'year' && format(fechaActual, "yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-light-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-2 py-1 text-xs rounded-md ${viewMode === 'day' ? 'bg-sky-500 text-white shadow-sm' : 'text-dark-500'}`}
                >
                  Día
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-2 py-1 text-xs rounded-md ${viewMode === 'week' ? 'bg-cyan-500 text-white shadow-sm' : 'text-dark-500'}`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-2 py-1 text-xs rounded-md ${viewMode === 'month' ? 'bg-indigo-500 text-white shadow-sm' : 'text-dark-500'}`}
                >
                  Mes
                </button>
                <button
                  onClick={() => setViewMode('year')}
                  className={`px-2 py-1 text-xs rounded-md ${viewMode === 'year' ? 'bg-violet-500 text-white shadow-sm' : 'text-dark-500'}`}
                >
                  Año
                </button>
              </div>
              <Button variant="primary" size="sm" onClick={handleNuevoServicio}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo servicio
              </Button>
              <button
                onClick={navegarAnterior}
                className="p-2 hover:bg-light-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-dark" />
              </button>
              <button
                onClick={navegarSiguiente}
                className="p-2 hover:bg-light-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-dark" />
              </button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {viewMode === 'day' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-dark">
                    Servicios del día
                    <span className="ml-2 text-xs font-normal text-slate-500">(máx. 3 en paralelo)</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                      Mostrando {dayTimelineVisible.length} de {dayTimeline.length}
                    </span>
                    {dayHiddenByParallelLimit > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                        +{dayHiddenByParallelLimit} ocultos por solapamiento
                      </span>
                    )}
                    <span className="text-sm text-dark-500">{dayTimeline.length} servicios</span>
                  </div>
                </div>
                <div
                  ref={dayScrollRef}
                  className="rounded-xl border border-light-200 overflow-auto max-h-[calc(100vh-260px)] w-full relative"
                >
                  <div className="min-w-[820px]">
                    <div className="grid grid-cols-[76px_1fr] sticky top-0 z-30">
                      <div className="bg-light-100 border-r border-b border-light-200 px-2 py-1 text-xs font-semibold text-dark-500 sticky left-0 z-40">
                        Hora
                      </div>
                      <div className="bg-white border-b border-light-200 px-3 py-1 text-xs font-semibold text-dark-500">
                        {format(fechaActual, "EEEE d 'de' MMMM", { locale: es })}
                      </div>
                    </div>

                    <div className="grid grid-cols-[76px_1fr]">
                    <div className="bg-light-100 border-r border-light-200 sticky left-0 z-20">
                      {HORAS.map((hora) => (
                        <div
                          key={hora}
                          className="px-2 flex items-start pt-1 border-b border-light-200 text-xs text-dark-500"
                          style={{ height: `${DAY_HOUR_CELL_HEIGHT}px` }}
                        >
                          {String(hora).padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>
                    <div
                      className="relative bg-white"
                      style={{
                        height: `${HORAS.length * DAY_HOUR_CELL_HEIGHT}px`,
                        minWidth: `${Math.max(820, Math.min(MAX_DAY_PARALLEL, dayMaxColumns) * (DAY_CARD_WIDTH + DAY_CARD_GAP) + 16)}px`,
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const hourIndex = Math.max(0, Math.min(HORAS.length - 1, Math.floor(y / DAY_HOUR_CELL_HEIGHT)));
                        handleDropServicio(fechaActual, HORAS[hourIndex]);
                      }}
                      onDoubleClick={() => abrirNuevoServicio(fechaActual, DAY_START_HOUR)}
                    >
                      {HORAS.map((hora, idx) => (
                        <div
                          key={hora}
                          className="absolute left-0 right-0 border-b border-light-200/80"
                          style={{ top: `${idx * DAY_HOUR_CELL_HEIGHT}px` }}
                        />
                      ))}

                      {dayTimelineVisible.map((event) => {
                        const { servicio, inicio, fin, lane, topPct, heightPct, key } = event;
                        return (
                          <button
                            key={key}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              setServicioArrastrandoId(servicio.id);
                            }}
                            onDragEnd={() => setServicioArrastrandoId(null)}
                            onClick={() => abrirDetalleServicio(servicio)}
                            className={`absolute text-left rounded-md border p-1 text-[10px] leading-tight shadow-sm overflow-hidden ${coloresCuidadores[servicio.cuidadorId] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                            style={{
                              top: `calc(${topPct}% + 2px)`,
                              height: `calc(${heightPct}% - 4px)`,
                              left: `${2 + lane * (DAY_CARD_WIDTH + DAY_CARD_GAP)}px`,
                              width: `${DAY_CARD_WIDTH}px`,
                            }}
                          >
                            <p className="font-semibold truncate">{servicio.paciente?.nombre || 'Paciente'}</p>
                            <p className="opacity-80 truncate">{format(inicio, 'HH:mm')} - {format(fin, 'HH:mm')}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'week' && (
              <div
                ref={weekScrollRef}
                className="p-3 overflow-auto max-h-[calc(100vh-260px)] relative"
              >
                <div className="grid min-w-[1360px] bg-light-100/70 rounded-xl" style={{ gridTemplateColumns: '84px repeat(7, minmax(180px, 1fr))' }}>
                  <div className="border-b border-r-[10px] border-b-light-200 border-r-white bg-light-100 sticky top-0 left-0 z-40" />
                  {diasSemana.map((dia, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFechaActual(dia);
                        setViewMode('day');
                      }}
                      className={`px-3 py-2 text-center border-b border-r-[10px] border-b-light-200 border-r-white sticky top-0 z-30 transition-colors hover:bg-sky-50 ${
                        isSameDay(dia, new Date()) ? 'bg-primary/5' : 'bg-white'
                      }`}
                    >
                      <p className="text-xs text-dark-400 uppercase">{format(dia, 'EEE', { locale: es })}</p>
                      <p className={`text-lg font-bold ${isSameDay(dia, new Date()) ? 'text-primary' : 'text-dark'}`}>{format(dia, 'd')}</p>
                      <div className="mt-1 flex justify-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700">
                          {getCantidadServiciosProgramadosDelDia(dia)} servicios
                        </span>
                      </div>
                    </button>
                  ))}

                  <div className="border-r-[10px] border-r-white bg-light-100 sticky left-0 z-20">
                    {HORAS.map((hora) => (
                      <div
                        key={hora}
                        className="px-2 pt-1 border-b border-light-200 text-xs text-dark-500"
                        style={{ height: `${WEEK_HOUR_CELL_HEIGHT}px` }}
                      >
                        {String(hora).padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>

                  {weekTimeline.map(({ dia, events }) => (
                    <div
                      key={format(dia, 'yyyy-MM-dd')}
                      className="relative border-r-[10px] border-r-white bg-white"
                      style={{ height: `${HORAS.length * WEEK_HOUR_CELL_HEIGHT}px` }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const hourIndex = Math.max(0, Math.min(HORAS.length - 1, Math.floor(y / WEEK_HOUR_CELL_HEIGHT)));
                        handleDropServicio(dia, HORAS[hourIndex]);
                      }}
                    >
                      {HORAS.map((hora, idx) => (
                        <div
                          key={hora}
                          className="absolute left-0 right-0 border-b border-light-200/80"
                          style={{ top: `${idx * WEEK_HOUR_CELL_HEIGHT}px` }}
                        />
                      ))}

                      {events.map((event) => {
                        const { servicio, inicio, fin, lane, columns, topPct, heightPct, key } = event;
                        const widthPct = 100 / columns;
                        const leftPct = lane * widthPct;
                        return (
                          <button
                            key={key}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              setServicioArrastrandoId(servicio.id);
                            }}
                            onDragEnd={() => setServicioArrastrandoId(null)}
                            onClick={() => abrirDetalleServicio(servicio)}
                            className={`absolute text-left rounded-lg border p-1.5 text-[11px] shadow-sm overflow-hidden ${coloresCuidadores[servicio.cuidadorId] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                            style={{
                              top: `calc(${topPct}% + 2px)`,
                              height: `calc(${heightPct}% - 4px)`,
                              left: `calc(${leftPct}% + 2px)`,
                              width: `calc(${widthPct}% - 4px)`,
                            }}
                          >
                            <p className="font-semibold truncate">{servicio.paciente?.nombre || 'Paciente'}</p>
                            <p className="truncate opacity-80">{servicio.cuidador?.nombre || 'Sin cuidador'}</p>
                            <p className="opacity-80">{format(inicio, 'HH:mm')} - {format(fin, 'HH:mm')}</p>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'month' && (
              <div className="p-4">
                <div className="grid grid-cols-7 border border-light-200 rounded-xl overflow-hidden bg-white">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                    <div key={d} className="bg-light-100 p-2 text-center text-xs font-semibold text-dark-500 border-b border-light-200">
                      {d}
                    </div>
                  ))}

                  {diasMesGrilla.map((day) => {
                    const serviciosDia = getServiciosDelDia(day);
                    const isCurrentMonth = isSameMonth(day, fechaActual);
                    const maxVisible = 5;

                    return (
                      <div
                        key={format(day, 'yyyy-MM-dd')}
                        className={`min-h-[130px] border-b border-r border-light-200 p-2 ${isCurrentMonth ? 'bg-white' : 'bg-light-100/60'}`}
                        onClick={() => {
                          if (serviciosDia.length === 0) {
                            abrirNuevoServicio(day, 9);
                          } else {
                            setFechaActual(day);
                            setViewMode('day');
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-semibold ${isSameDay(day, new Date()) ? 'text-primary' : isCurrentMonth ? 'text-dark' : 'text-dark-300'}`}>
                            {format(day, 'd')}
                          </span>
                          {serviciosDia.length > 0 && (
                            <span className="text-[10px] text-dark-400">{serviciosDia.length}</span>
                          )}
                        </div>

                        <div className="space-y-1 overflow-hidden">
                          {serviciosDia.slice(0, maxVisible).map((servicio) => (
                            <button
                              key={`${servicio.id}-${servicio.fechaInicio}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDetalleServicio(servicio);
                              }}
                              className={`w-full text-left px-1.5 py-1 rounded text-[11px] truncate border ${coloresCuidadores[servicio.cuidadorId] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                              title={`${format(new Date(servicio.fechaInicio), 'HH:mm')} ${servicio.paciente?.nombre || 'Servicio'}`}
                            >
                              {format(new Date(servicio.fechaInicio), 'HH:mm')} {servicio.paciente?.nombre || 'Servicio'}
                            </button>
                          ))}
                          {serviciosDia.length > maxVisible && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFechaActual(day);
                                setViewMode('day');
                              }}
                              className="text-[11px] text-primary font-medium"
                            >
                              +{serviciosDia.length - maxVisible} más
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'year' && (
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {serviciosAnioPorMes.map((item) => (
                  <button
                    key={format(item.date, 'yyyy-MM')}
                    type="button"
                    onClick={() => {
                      setFechaActual(item.date);
                      setViewMode('month');
                    }}
                    className="rounded-xl border border-light-200 p-3 text-left bg-white hover:bg-light-100 transition-colors"
                  >
                    <p className="text-sm font-semibold text-dark">
                      {format(item.date, 'MMMM', { locale: es })}
                    </p>
                    <div className="mt-2 h-2 bg-light-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${Math.min(100, (item.count / Math.max(1, ...serviciosAnioPorMes.map((m) => m.count))) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-dark-400 mt-2">{item.count} servicios</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex flex-wrap gap-3">
          <p className="text-sm text-dark-400 w-full mb-1">Cuidadores:</p>
          {cuidadores.filter((c) => c.estado === 'activo').map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${(coloresCuidadores[c.id] || '').split(' ')[0] || 'bg-slate-300'}`} />
              <span className="text-sm text-dark">{c.nombre}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={Boolean(servicioDetalle)}
        onClose={() => setServicioDetalle(null)}
        title="Detalle del servicio"
        size="lg"
      >
        {servicioDetalle && (
          <div className="space-y-4">
            <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-500">Servicio</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {servicioDetalle.paciente?.nombre || 'Paciente sin nombre'} (Paciente)
                  </p>
                  <p className="text-sm text-slate-600">
                    {servicioDetalle.cuidador?.nombre || 'Cuidador sin asignar'} (Cuidador)
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_CLASS[servicioDetalle.estado] || STATUS_CLASS.pendiente}`}>
                  {STATUS_LABEL[servicioDetalle.estado] || 'Pendiente'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-slate-200 p-2">
                <p className="text-slate-500">Fecha de inicio</p>
                <p className="font-medium text-slate-800">{format(new Date(servicioDetalle.fechaInicio), 'dd/MM/yyyy')}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-2">
                <p className="text-slate-500">Horario de entrada y duracion</p>
                <p className="font-medium text-slate-800">
                  {(() => {
                    const inicio = new Date(servicioDetalle.fechaInicio);
                    const duracionHoras = Number(servicioDetalle.duracionHoras ?? (servicioDetalle.duracionMinutos || 60) / 60);
                    const fin = new Date(inicio.getTime() + duracionHoras * 60 * 60 * 1000);
                    return `${format(inicio, 'HH:mm')} a ${format(fin, 'HH:mm')} (${duracionHoras} ${duracionHoras === 1 ? 'hora' : 'horas'})`;
                  })()}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-2">
              <p className="text-sm text-slate-500">Modalidad</p>
              <p className="text-sm font-medium text-slate-800">
                {REPEAT_MODE_LABEL[servicioDetalle.repeatMode || 'none'] || 'Sin repeticion'}
              </p>
            </div>

            {(servicioDetalle.direccion || servicioDetalle.paciente?.direccion) && (
              <div className="rounded-lg border border-slate-200 p-2">
                <p className="text-sm text-slate-500">Ubicación</p>
                <p className="text-sm font-medium text-slate-800">{servicioDetalle.direccion || servicioDetalle.paciente?.direccion}</p>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 p-2">
              <p className="text-sm text-slate-500">Notas</p>
              <p className="text-sm text-slate-700">
                {servicioDetalle.notas?.trim() ? servicioDetalle.notas : 'Sin notas'}
              </p>
            </div>

            <div className="flex flex-nowrap gap-2 pt-1">
              {servicioDetalle.estado === 'pendiente' && (
                <Button size="sm" type="button" variant="outline" className="flex-1" onClick={() => handleUpdateEstadoDetalle('en_curso')}>
                  Marcar en curso
                </Button>
              )}
              {servicioDetalle.estado === 'en_curso' && (
                <Button size="sm" type="button" variant="outline" className="flex-1" onClick={() => handleUpdateEstadoDetalle('completado')}>
                  Marcar completado
                </Button>
              )}
              <Button
                size="sm"
                type="button"
                className="flex-1"
                onClick={() => {
                  const actual = servicioDetalle;
                  setServicioDetalle(null);
                  abrirEditarServicio(actual);
                }}
              >
                Editar servicio
              </Button>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                className="flex-1 border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                onClick={() => {
                  const actual = servicioDetalle;
                  setServicioDetalle(null);
                  abrirDuplicadoServicio(actual);
                }}
              >
                Duplicar
              </Button>
              {servicioDetalle.estado !== 'cancelado' && (
                <Button size="sm" type="button" variant="danger" className="flex-1" onClick={handleBajaDesdeDetalle}>
                  Dar de baja
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={servicioEditando ? 'Editar servicio' : 'Nuevo servicio'}
        size={servicioEditando ? '2xl' : 'xl'}
        contentClassName="border-0 bg-white"
        headerClassName="border-b-0 bg-white"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white p-0"
        >
          <div className="rounded-2xl bg-white overflow-hidden">
            <div className="grid grid-cols-1">
              <div className="p-4">
                <label className="block text-sm font-medium text-dark-700 mb-2">Fecha de inicio</label>
                <div className="grid grid-cols-[0.9fr_1fr_1.35fr] gap-2">
                  <select
                    value={parseDateParts(formData.fecha).day}
                    onChange={(e) => updateDatePart('fecha', 'day', e.target.value)}
                    className={modernPickerClass}
                  >
                    {Array.from({ length: daysInMonth(parseDateParts(formData.fecha).year, parseDateParts(formData.fecha).month) }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    value={parseDateParts(formData.fecha).month}
                    onChange={(e) => updateDatePart('fecha', 'month', e.target.value)}
                    className={modernPickerClass}
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={parseDateParts(formData.fecha).year}
                    onChange={(e) => updateDatePart('fecha', 'year', e.target.value)}
                    className={modernPickerClass}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(servicioEditando || !isPersonalizadoNuevoServicio) && (
                <div className="p-4">
                  <label className="block text-sm font-medium text-dark-700 mb-2">Hora inicio</label>
                  <div className="grid grid-cols-[0.9fr_1fr_1.35fr] gap-2">
                    <select
                      value={to12hParts(formData.horaInicio).hour12}
                      onChange={(e) => setHoraInicio12h('hour12', e.target.value)}
                      className={modernPickerClass}
                    >
                      {HOURS_12_OPTIONS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select
                      value={to12hParts(formData.horaInicio).minute}
                      onChange={(e) => setHoraInicio12h('minute', e.target.value)}
                      className={modernPickerClass}
                    >
                      {MINUTE_OPTIONS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={to12hParts(formData.horaInicio).ampm}
                      onChange={(e) => setHoraInicio12h('ampm', e.target.value)}
                      className={modernPickerClass}
                    >
                      <option value="AM">a.m.</option>
                      <option value="PM">p.m.</option>
                    </select>
                  </div>
                </div>
              )}

              <div className={`p-4 ${!servicioEditando && isPersonalizadoNuevoServicio && personalizadoScheduleMode === PERSONALIZADO_SCHEDULE_MODE.specific_dates ? 'opacity-55' : ''}`}>
                <label className="block text-sm font-medium text-dark-700 mb-2">Repetición</label>
                <select
                  value={repeatMode}
                  onChange={(e) => setRepeatMode(e.target.value)}
                  disabled={!servicioEditando && isPersonalizadoNuevoServicio && personalizadoScheduleMode === PERSONALIZADO_SCHEDULE_MODE.specific_dates}
                  className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
                >
                  <option value="none">Sin repetición</option>
                  <option value="weekdays">Lunes a Viernes</option>
                  <option value="everyday">Lunes a Lunes (todos los días)</option>
                  <option value="weekend">Fin de semana (Sáb y Dom)</option>
                  <option value="custom">Días personalizados</option>
                </select>
              </div>

              <div className={`p-4 transition-opacity ${repeatMode === 'none' || (!servicioEditando && isPersonalizadoNuevoServicio && personalizadoScheduleMode === PERSONALIZADO_SCHEDULE_MODE.specific_dates) ? 'opacity-55' : 'opacity-100'}`}>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Repetir hasta {repeatMode === 'none' ? '(no aplica)' : ''}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={parseDateParts(repeatUntil).day}
                    onChange={(e) => updateDatePart('repeatUntil', 'day', e.target.value)}
                    disabled={repeatMode === 'none' || (!servicioEditando && isPersonalizadoNuevoServicio && personalizadoScheduleMode === PERSONALIZADO_SCHEDULE_MODE.specific_dates)}
                    className={`${modernPickerClass} disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200`}
                  >
                    {Array.from({ length: daysInMonth(parseDateParts(repeatUntil).year, parseDateParts(repeatUntil).month) }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    value={parseDateParts(repeatUntil).month}
                    onChange={(e) => updateDatePart('repeatUntil', 'month', e.target.value)}
                    disabled={repeatMode === 'none' || (!servicioEditando && isPersonalizadoNuevoServicio && personalizadoScheduleMode === PERSONALIZADO_SCHEDULE_MODE.specific_dates)}
                    className={`${modernPickerClass} disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200`}
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={parseDateParts(repeatUntil).year}
                    onChange={(e) => updateDatePart('repeatUntil', 'year', e.target.value)}
                    disabled={repeatMode === 'none' || (!servicioEditando && isPersonalizadoNuevoServicio && personalizadoScheduleMode === PERSONALIZADO_SCHEDULE_MODE.specific_dates)}
                    className={`${modernPickerClass} disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200`}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(servicioEditando || !isPersonalizadoNuevoServicio) && (
                <div className="p-4">
                  <label className="block text-sm font-medium text-dark-700 mb-2">Duración (horas)</label>
                  <select
                    value={formData.duracionHoras}
                    onChange={(e) => setFormData({ ...formData, duracionHoras: Number(e.target.value) })}
                    className={formFieldClass}
                  >
                    {DURACIONES_HORAS.map((horas) => (
                      <option key={horas} value={horas}>
                        {horas} {horas === 1 ? 'hora' : 'horas'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {repeatMode === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Días</label>
              <div className="flex flex-wrap gap-2">
                {REPEAT_DAY_OPTIONS.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleRepeatDay(day.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      repeatDays.includes(day.id)
                        ? 'bg-sky-100 text-sky-700 border-sky-300'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!servicioEditando && (
            <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/50 p-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Configuración avanzada</p>
                <p className="text-xs text-slate-500">Usá “Personalizar” para servicio partido, múltiples cuidadores o múltiples horarios.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isPersonalizadoNuevoServicio ? 'primary' : 'ghost'}
                className={!isPersonalizadoNuevoServicio ? 'border border-sky-200 bg-white text-sky-700 hover:bg-sky-50' : ''}
                onClick={togglePersonalizacionNuevoServicio}
              >
                {isPersonalizadoNuevoServicio ? 'Quitar personalización' : 'Personalizar'}
              </Button>
            </div>
          )}

          {!servicioEditando && isPersonalizadoNuevoServicio && (
            <div className="rounded-xl border border-sky-200 bg-white p-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Tipo:</span>
                <button
                  type="button"
                  onClick={() => setPersonalizadoScheduleMode(PERSONALIZADO_SCHEDULE_MODE.repeat)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    personalizadoScheduleMode === PERSONALIZADO_SCHEDULE_MODE.repeat
                      ? 'bg-sky-100 text-sky-700 border-sky-300'
                      : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  Repetición
                </button>
                <button
                  type="button"
                  onClick={() => setPersonalizadoScheduleMode(PERSONALIZADO_SCHEDULE_MODE.specific_dates)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    personalizadoScheduleMode === PERSONALIZADO_SCHEDULE_MODE.specific_dates
                      ? 'bg-sky-100 text-sky-700 border-sky-300'
                      : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  Días puntuales
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-600 mr-1">Presets:</span>
                <Button type="button" size="sm" variant="ghost" className="border border-slate-200 bg-slate-50 text-slate-700" onClick={() => applyBlockPreset('maniana_noche')}>
                  Mañana + Noche
                </Button>
                <Button type="button" size="sm" variant="ghost" className="border border-slate-200 bg-slate-50 text-slate-700" onClick={() => applyBlockPreset('jornada_doble')}>
                  Doble turno
                </Button>
                <Button type="button" size="sm" variant="ghost" className="border border-slate-200 bg-slate-50 text-slate-700" onClick={() => applyBlockPreset('completo_24h')}>
                  24h
                </Button>
              </div>

              {personalizadoScheduleMode === PERSONALIZADO_SCHEDULE_MODE.specific_dates && (
                <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/70">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">Fechas puntuales</p>
                    <Button type="button" size="sm" variant="ghost" className="border border-sky-200 bg-white text-sky-700" onClick={addSpecificDate}>
                      + Fecha
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {specificDates.map((d, idx) => (
                      <div key={`${d}-${idx}`} className="grid grid-cols-[1fr_auto] gap-2">
                        <input
                          type="date"
                          value={d}
                          onChange={(e) => updateSpecificDate(idx, e.target.value)}
                          className={formFieldClass}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="border border-red-200 bg-red-50 text-red-700 disabled:opacity-40"
                          disabled={specificDates.length <= 1}
                          onClick={() => removeSpecificDate(idx)}
                        >
                          Quitar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(servicioEditando || !isPersonalizadoNuevoServicio) ? (
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Cuidador</label>
              <select
                value={formData.cuidadorId}
                onChange={(e) => setFormData({ ...formData, cuidadorId: e.target.value })}
                className={formFieldClass}
                required
              >
                <option value="">Seleccionar...</option>
                {cuidadores.filter((c) => c.estado === 'activo').map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-dark-700">Bloques del servicio</label>
                <Button type="button" size="sm" variant="ghost" className="border border-sky-200 bg-sky-50 text-sky-700" onClick={addServiceBlock}>
                  + Agregar bloque
                </Button>
              </div>
              <div className="space-y-2">
                {serviceBlocks.map((block, idx) => (
                  <div key={block.id} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 p-2 rounded-xl border border-sky-100 bg-sky-50/40">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Hora bloque {idx + 1}</label>
                      <input
                        type="time"
                        value={block.horaInicio}
                        onChange={(e) => updateServiceBlock(block.id, 'horaInicio', e.target.value)}
                        className={formFieldClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Duración (h)</label>
                      <select
                        value={block.duracionHoras}
                        onChange={(e) => updateServiceBlock(block.id, 'duracionHoras', Number(e.target.value))}
                        className={formFieldClass}
                      >
                        {DURACIONES_HORAS.map((horas) => (
                          <option key={horas} value={horas}>{horas}h</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Cuidador</label>
                      <select
                        value={block.cuidadorId}
                        onChange={(e) => updateServiceBlock(block.id, 'cuidadorId', e.target.value)}
                        className={formFieldClass}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {cuidadores.filter((c) => c.estado === 'activo').map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="border border-red-200 bg-red-50 text-red-700 disabled:opacity-40"
                        disabled={serviceBlocks.length <= 1}
                        onClick={() => removeServiceBlock(block.id)}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Provincia</label>
              <select
                value={formData.provincia}
                onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                className={formFieldClass}
              >
                <option value="">Seleccionar provincia...</option>
                {PROVINCIAS_ARG.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            {opcionesZona.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  {esCabaForm ? 'Barrio' : 'Partido / Localidad'}
                </label>
                <select
                  value={formData.zona}
                  onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                  className={formFieldClass}
                >
                  <option value="">Seleccionar...</option>
                  {opcionesZona.map((zona) => (
                    <option key={zona} value={zona}>{zona}</option>
                  ))}
                </select>
              </div>
            ) : (
              <Input
                label="Ciudad / Localidad"
                value={formData.zona}
                onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                placeholder="Ej: San Luis Capital"
              />
            )}
          </div>
          <Input
            label="Calle y altura (opcional)"
            value={formData.direccionDetalle}
            onChange={(e) => setFormData({ ...formData, direccionDetalle: e.target.value })}
            placeholder="Ej: Av. Corrientes 1234"
          />

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Paciente</label>
            <select
              value={formData.pacienteId}
              onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
              className={formFieldClass}
              required
            >
              <option value="">Seleccionar...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Estado</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              className={formFieldClass}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_curso">En curso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Notas</label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white border-2 border-sky-200 rounded-xl text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 resize-none"
              placeholder="Notas especiales para este servicio..."
            />
          </div>

          <div
            className="grid gap-2 pt-4"
            style={{
              gridTemplateColumns: servicioEditando
                ? 'repeat(5, minmax(0, 1fr))'
                : 'repeat(2, minmax(0, 1fr))',
            }}
          >
            {servicioEditando && (
              <>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="w-full whitespace-nowrap border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 px-3 py-1.5 text-sm"
                  onClick={handleDuplicarDesdeEdicion}
                >
                  Duplicar
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="danger"
                  className="w-full whitespace-nowrap !bg-red-100 !text-red-700 hover:!bg-red-200 border border-red-200 px-3 py-1.5 text-sm"
                  onClick={handleEliminarDia}
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Eliminar día
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="danger"
                  className="w-full whitespace-nowrap bg-red-500 hover:bg-red-600 px-3 py-1.5 text-sm"
                  onClick={handleEliminarSerie}
                >
                  Eliminar serie
                </Button>
              </>
            )}
            <Button
              size="sm"
              type="button"
              variant="ghost"
              className="w-full whitespace-nowrap border border-slate-300 bg-white px-3 py-1.5 text-sm"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" type="submit" className="w-full whitespace-nowrap px-3 py-1.5 text-sm">
              {servicioEditando ? 'Guardar cambios' : 'Crear servicio'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(confirmMoveDialog)}
        onClose={() => {
          setConfirmMoveDialog(null);
          setServicioArrastrandoId(null);
        }}
        title="Mover servicio"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          ¿Querés mover solo este día o toda la secuencia?
        </p>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="outline" fullWidth onClick={() => resolverDropServicio('single')}>
            Solo este día
          </Button>
          <Button type="button" fullWidth onClick={() => resolverDropServicio('series')}>
            Toda la secuencia
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(confirmDialog)}
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog?.title || 'Confirmar acción'}
        size="sm"
      >
        <p className="text-sm text-slate-600">{confirmDialog?.message}</p>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="ghost" fullWidth onClick={() => setConfirmDialog(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            fullWidth
            onClick={async () => {
              try {
                await confirmDialog?.action?.();
              } catch (error) {
                showError(error.message || 'No se pudo completar la acción');
              } finally {
                setConfirmDialog(null);
              }
            }}
          >
            {confirmDialog?.confirmText || 'Confirmar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Calendario;
