import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  TrendingUp,
  ClipboardList,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  LogOut,
  Play,
  Plus,
  Check,
  Copy,
  RotateCcw
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { adminApi } from '@/services/adminApi';

const DURACIONES_HORAS = Array.from({ length: 24 }, (_, i) => i + 1);
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
const PIE_COLORS = [
  ['#b8f26b', '#d9f99d'],
  ['#f7cf7a', '#fde7b0'],
  ['#9ad7ff', '#cbeafe'],
  ['#e2e8f0', '#f1f5f9'],
];
const ZONAS_AMBA = ['CABA', 'Zona Norte', 'Zona Sur', 'Zona Oeste'];
const ALTAS_POR_PAGINA = 4;

function statusLabel(status) {
  switch (status) {
    case 'en_curso':
      return 'En curso';
    case 'completado':
      return 'Completado';
    case 'cancelado':
      return 'Cancelado';
    default:
      return 'Pendiente';
  }
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast, showSuccess, showError } = useToast();

  const [acompanantes, setAcompanantes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [showNuevoServicio, setShowNuevoServicio] = useState(false);
  const [showDetalleStats, setShowDetalleStats] = useState(false);
  const [statSeleccionada, setStatSeleccionada] = useState(null);
  const [confirmDeleteServicioStats, setConfirmDeleteServicioStats] = useState(null);
  const [altasPage, setAltasPage] = useState(0);
  const [altasTab, setAltasTab] = useState('pendientes');
  const [editingAltaId, setEditingAltaId] = useState(null);
  const [editingAltaDraft, setEditingAltaDraft] = useState({
    fecha: '',
    hora: '',
    caregiverIds: [],
    pacienteId: '',
    provincia: '',
    zona: '',
    direccionDetalle: '',
  });
  const [caregiverSearch, setCaregiverSearch] = useState({
    provincia: '',
    zona: '',
    tipo: 'cuidador',
  });

  const [crearPacienteRapido, setCrearPacienteRapido] = useState(false);
  const [crearCuidadorRapido, setCrearCuidadorRapido] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    hora: '09:00',
    duracionHoras: 2,
    direccion: '',
    provincia: '',
    zona: '',
    direccionDetalle: '',
    repeatMode: 'none',
    repeatUntil: format(new Date(), 'yyyy-MM-dd'),
    repeatDays: [],
    estado: 'pendiente',
    notas: '',
    pacienteId: '',
    cuidadorId: '',
    cuidadorIds: [],
  });

  const [newPaciente, setNewPaciente] = useState({
    nombre: '',
    edad: '',
    tipo: 'adulto_mayor',
    condicion: '',
    direccion: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
  });

  const [newCuidador, setNewCuidador] = useState({
    nombre: '',
    email: '',
    telefono: '',
    codigo: '',
    disponibilidad: 'mañana y tarde',
  });

  const loadData = async () => {
    try {
      const [acompanantesData, pacientesData, serviciosData] = await Promise.all([
        adminApi.getAcompanantes(),
        adminApi.getClientes(),
        adminApi.getServicios(),
      ]);

      setAcompanantes(acompanantesData);
      setPacientes(pacientesData);
      setServicios(serviciosData);
    } catch (error) {
      showError(error.message || 'No se pudo cargar el dashboard');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const serviciosHoy = useMemo(() => {
    const hoy = new Date();
    return servicios
      .filter((s) => aplicaEnFecha(s, hoy))
      .map((s) => ({
        ...s,
        fechaInicio: getStartForFecha(s, hoy).toISOString(),
      }));
  }, [servicios]);

  const getZonaCorta = (direccion) => {
    if (!direccion || !direccion.trim()) return '';
    const partes = direccion.split(',').map((p) => p.trim()).filter(Boolean);
    if (partes.length >= 3) return partes[partes.length - 2];
    if (partes.length === 2) return partes[0];
    return direccion.trim().slice(0, 30);
  };

  const buildDireccionServicio = (form) => {
    return [form.direccionDetalle, form.zona, form.provincia].filter(Boolean).join(', ');
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

  const irABusquedaPorZona = (servicio) => {
    const parsed = parseDireccionServicio(servicio.direccion || servicio.paciente?.direccion || '');
    const params = new URLSearchParams();
    if (parsed.provincia) params.set('provincia', parsed.provincia);
    if (parsed.zona) params.set('zona', parsed.zona);
    params.set('tipo', 'cuidador');
    navigate(`/admin/acompanantes?${params.toString()}`);
  };

  const ejecutarBusquedaCuidadores = () => {
    const params = new URLSearchParams();
    if (caregiverSearch.provincia) params.set('provincia', caregiverSearch.provincia);
    if (caregiverSearch.zona) params.set('zona', caregiverSearch.zona);
    if (caregiverSearch.tipo) params.set('tipo', caregiverSearch.tipo);
    navigate(`/admin/acompanantes?${params.toString()}`);
  };

  const serviciosEnCurso = useMemo(() => {
    return servicios.filter((s) => s.estado === 'en_curso');
  }, [servicios]);

  const altasPorMes = useMemo(() => {
    const now = new Date();
    const serviciosOnGoing = servicios.filter((s) => s.estado === 'en_curso');
    const meses = [];
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(now.getFullYear(), i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      meses.push({
        key,
        monthLabel: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''),
        yearLabel: String(d.getFullYear()),
        value: 0,
      });
    }

    const byKey = new Map(meses.map((m) => [m.key, m]));
    serviciosOnGoing.forEach((s) => {
      const created = new Date(s.createdAt);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (byKey.has(key)) {
        byKey.get(key).value += 1;
      }
    });

    return meses;
  }, [servicios]);

  const cuidadoresPorZona = useMemo(() => {
    const activos = acompanantes.filter((a) => a.estado === 'activo');
    const counts = new Map(ZONAS_AMBA.map((z) => [z, 0]));

    const normalizarZona = (value) => {
      const raw = String(value || '').trim().toLowerCase();
      if (!raw) return '';
      if (raw === 'caba' || raw.includes('capital')) return 'CABA';
      if (raw.includes('norte')) return 'Zona Norte';
      if (raw.includes('sur')) return 'Zona Sur';
      if (raw.includes('oeste')) return 'Zona Oeste';
      return '';
    };

    activos.forEach((c) => {
      const zona = normalizarZona(c.zonaAmba) || normalizarZona(c.zona);
      if (counts.has(zona)) counts.set(zona, (counts.get(zona) || 0) + 1);
    });

    return ZONAS_AMBA.map((zona) => ({ zona, value: counts.get(zona) || 0 }));
  }, [acompanantes]);

  const opcionesZonaBusquedaCuidadores = caregiverSearch.provincia === 'CABA'
    ? BARRIOS_CABA
    : (['buenos aires', 'provincia de buenos aires'].includes(String(caregiverSearch.provincia || '').trim().toLowerCase()))
      ? PARTIDOS_GBA
      : [];

  const serviciosHoyOrdenados = [...serviciosHoy].sort(
    (a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio)
  );
  const altasPendientes = useMemo(() => {
    return [...servicios]
      .filter((s) => {
        if (s.estado === 'cancelado' || s.estado === 'completado') return false;
        if (!s.pacienteId || !s.cuidadorId || !s.fechaInicio) return false;
        return (s.altaEstado || 'pendiente') !== 'realizada';
      })
      .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
  }, [servicios]);
  const altasRealizadas = useMemo(() => {
    return [...servicios]
      .filter((s) => s.estado !== 'cancelado' && (s.altaEstado || 'pendiente') === 'realizada')
      .sort((a, b) => {
        const dateA = a.altaRealizadaAt ? new Date(a.altaRealizadaAt) : new Date(a.updatedAt || a.createdAt || 0);
        const dateB = b.altaRealizadaAt ? new Date(b.altaRealizadaAt) : new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
  }, [servicios]);
  const altasActivas = altasTab === 'realizadas' ? altasRealizadas : altasPendientes;
  const totalAltasPages = Math.max(1, Math.ceil(altasActivas.length / ALTAS_POR_PAGINA));
  const altasPagina = useMemo(() => {
    const start = altasPage * ALTAS_POR_PAGINA;
    return altasActivas.slice(start, start + ALTAS_POR_PAGINA);
  }, [altasActivas, altasPage]);

  useEffect(() => {
    setAltasPage((prev) => Math.min(prev, totalAltasPages - 1));
  }, [totalAltasPages]);

  useEffect(() => {
    setAltasPage(0);
  }, [altasTab]);

  const cuidadoresActivos = acompanantes.filter((a) => a.estado === 'activo').length;

  const statCards = [
    {
      key: 'servicios_en_curso',
      label: 'Servicios en curso',
      value: serviciosEnCurso.length,
      icon: Play,
      border: 'border-amber-200',
      accent: 'bg-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
    },
    {
      key: 'pacientes_totales',
      label: 'Pacientes totales',
      value: pacientes.length,
      icon: UserCheck,
      border: 'border-violet-200',
      accent: 'bg-violet-200',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-700',
    },
    {
      key: 'cuidadores_activos',
      label: 'Cuidadores activos',
      value: cuidadoresActivos,
      icon: Users,
      border: 'border-sky-200',
      accent: 'bg-sky-200',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-700',
    },
  ];

  const detalleStats = useMemo(() => {
    const byKey = {
      servicios_en_curso: {
        title: 'Servicios en curso',
        items: serviciosEnCurso.map((s) => ({
          id: s.id,
          target: 'servicio',
          source: s,
          focusDate: s.fechaInicio,
          line1: s.paciente?.nombre || 'Paciente',
          line2: `${format(new Date(s.fechaInicio), 'dd/MM HH:mm')} · ${s.cuidador?.nombre || 'Sin cuidador'}`,
          tag: statusLabel(s.estado),
        })),
      },
      pacientes_totales: {
        title: 'Pacientes totales',
        items: pacientes.map((p) => ({
          id: p.id,
          target: 'paciente',
          line1: p.nombre,
          line2: `${p.tipo || 'Paciente'} · ${p.condicion || 'Sin condición'}`,
          tag: '',
        })),
      },
      cuidadores_activos: {
        title: 'Cuidadores activos',
        items: acompanantes
          .filter((a) => a.estado === 'activo')
          .map((a) => ({
            id: a.id,
            target: 'cuidador',
            line1: a.nombre,
            line2: a.disponibilidad || 'Sin disponibilidad',
            tag: 'Activo',
          })),
      },
    };
    return byKey[statSeleccionada] || { title: 'Detalle', items: [] };
  }, [statSeleccionada, serviciosEnCurso, pacientes, acompanantes]);
  const detalleTitle = `${detalleStats.title} (${detalleStats.items.length})`;
  const detalleTheme = useMemo(() => {
    const themes = {
      servicios_en_curso: {
        summary: 'border-sky-200 bg-gradient-to-r from-sky-100 via-cyan-50 to-blue-100',
        item: 'border-sky-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50',
        tag: 'bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-700 border-sky-200',
      },
      pacientes_totales: {
        summary: 'border-violet-200 bg-gradient-to-r from-violet-100 via-fuchsia-50 to-pink-100',
        item: 'border-violet-200 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50',
        tag: 'bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 border-violet-200',
      },
      cuidadores_activos: {
        summary: 'border-purple-200 bg-gradient-to-r from-purple-100 via-violet-50 to-indigo-100',
        item: 'border-purple-200 bg-gradient-to-r from-purple-50 via-white to-violet-50',
        tag: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-200',
      },
    };

    return themes[statSeleccionada] || {
      summary: 'border-sky-200 bg-gradient-to-r from-sky-50 via-white to-violet-50',
      item: 'border-slate-200 bg-gradient-to-r from-white to-slate-50',
      tag: 'bg-gradient-to-r from-sky-100 to-indigo-100 text-indigo-700 border-indigo-200',
    };
  }, [statSeleccionada]);

  const navigateToServicioDetalle = (servicio) => {
    navigate(`/admin/servicios?serviceId=${servicio.id}`);
  };

  const openDetalleItem = (item) => {
    setShowDetalleStats(false);
    if (item?.target === 'servicio') {
      navigate(`/admin/servicios?serviceId=${item.id}`);
      return;
    }
    if (item?.target === 'paciente') {
      navigate('/admin/clientes');
      return;
    }
    if (item?.target === 'cuidador') {
      navigate('/admin/acompanantes');
      return;
    }
  };

  const duplicarServicioEnDashboard = (servicio) => {
    const start = new Date(servicio.fechaInicio);
    const parsedDireccion = parseDireccionServicio(servicio.direccion || servicio.paciente?.direccion || '');
    setServiceForm({
      fecha: format(start, 'yyyy-MM-dd'),
      hora: format(start, 'HH:mm'),
      duracionHoras: servicio.duracionHoras ?? (servicio.duracionMinutos || 60) / 60,
      direccion: servicio.direccion || servicio.paciente?.direccion || '',
      provincia: parsedDireccion.provincia,
      zona: parsedDireccion.zona,
      direccionDetalle: parsedDireccion.direccionDetalle,
      repeatMode: servicio.repeatMode || 'none',
      repeatUntil: servicio.repeatUntil ? format(new Date(servicio.repeatUntil), 'yyyy-MM-dd') : format(start, 'yyyy-MM-dd'),
      repeatDays: Array.isArray(servicio.repeatDays) ? servicio.repeatDays : [],
      estado: 'pendiente',
      notas: servicio.notas || '',
      pacienteId: servicio.pacienteId || '',
      cuidadorId: servicio.cuidadorId || '',
      cuidadorIds: servicio.cuidadorId ? [servicio.cuidadorId] : [],
    });
    setCrearPacienteRapido(false);
    setCrearCuidadorRapido(false);
    setShowDetalleStats(false);
    setShowNuevoServicio(true);
    showSuccess('Servicio duplicado. Revisá y guardá para crear el nuevo.');
  };

  const buildServicioUpdatePayload = (servicio, overrides = {}) => ({
    pacienteId: servicio.pacienteId,
    cuidadorId: servicio.cuidadorId,
    caregiverIds: Array.isArray(servicio.caregivers) && servicio.caregivers.length
      ? servicio.caregivers.map((c) => c.id)
      : (servicio.cuidadorId ? [servicio.cuidadorId] : []),
    fechaInicio: servicio.fechaInicio,
    duracionHoras: servicio.duracionHoras ?? (servicio.duracionMinutos || 60) / 60,
    repeatMode: servicio.repeatMode || 'none',
    repeatUntil: servicio.repeatUntil || null,
    repeatDays: Array.isArray(servicio.repeatDays) ? servicio.repeatDays : [],
    direccion: servicio.direccion || '',
    estado: servicio.estado || 'pendiente',
    notas: servicio.notas || '',
    ...overrides,
  });

  const eliminarServicioDesdeStats = async (servicio) => {
    try {
      await adminApi.updateServicio(
        servicio.id,
        buildServicioUpdatePayload(servicio, { estado: 'cancelado' }),
      );
      setServicios((prev) =>
        prev.map((item) =>
          item.id === servicio.id ? { ...item, estado: 'cancelado' } : item
        )
      );
      showSuccess('Servicio dado de baja correctamente');
      loadData();
    } catch (error) {
      showError(error.message || 'No se pudo dar de baja el servicio');
    }
  };

  const marcarAltaComoRealizada = async (servicio) => {
    try {
      if (typeof adminApi.updateServicioAltaEstado === 'function') {
        await adminApi.updateServicioAltaEstado(servicio.id, 'realizada');
      } else {
        await adminApi.updateServicio(
          servicio.id,
          buildServicioUpdatePayload(servicio, { altaEstado: 'realizada' }),
        );
      }
      setServicios((prev) =>
        prev.map((item) =>
          item.id === servicio.id
            ? { ...item, altaEstado: 'realizada', altaRealizadaAt: new Date().toISOString() }
            : item
        )
      );
      showSuccess('Alta marcada como realizada');
      loadData();
    } catch (error) {
      showError(error.message || 'No se pudo actualizar el estado del alta');
    }
  };

  const reabrirAlta = async (servicio) => {
    try {
      if (typeof adminApi.updateServicioAltaEstado === 'function') {
        await adminApi.updateServicioAltaEstado(servicio.id, 'pendiente');
      } else {
        await adminApi.updateServicio(
          servicio.id,
          buildServicioUpdatePayload(servicio, { altaEstado: 'pendiente' }),
        );
      }
      setServicios((prev) =>
        prev.map((item) =>
          item.id === servicio.id
            ? { ...item, altaEstado: 'pendiente', altaRealizadaAt: null }
            : item
        )
      );
      showSuccess('Alta reabierta');
      loadData();
    } catch (error) {
      showError(error.message || 'No se pudo reabrir el alta');
    }
  };

  const startInlineAltaEdit = (servicio) => {
    const start = new Date(servicio.fechaInicio);
    const caregiverIds = Array.isArray(servicio.caregivers) && servicio.caregivers.length
      ? servicio.caregivers.map((c) => c.id)
      : (servicio.cuidadorId ? [servicio.cuidadorId] : []);
    const parsedDireccion = parseDireccionServicio(servicio.direccion || servicio.paciente?.direccion || '');
    setEditingAltaId(servicio.id);
    setEditingAltaDraft({
      fecha: format(start, 'yyyy-MM-dd'),
      hora: format(start, 'HH:mm'),
      caregiverIds,
      pacienteId: servicio.pacienteId || '',
      provincia: parsedDireccion.provincia || '',
      zona: parsedDireccion.zona || '',
      direccionDetalle: parsedDireccion.direccionDetalle || '',
    });
  };

  const cancelInlineAltaEdit = () => {
    setEditingAltaId(null);
    setEditingAltaDraft({ fecha: '', hora: '', caregiverIds: [], pacienteId: '', provincia: '', zona: '', direccionDetalle: '' });
  };

  const toggleInlineAltaCaregiver = (caregiverId) => {
    setEditingAltaDraft((prev) => {
      const exists = prev.caregiverIds.includes(caregiverId);
      return {
        ...prev,
        caregiverIds: exists
          ? prev.caregiverIds.filter((id) => id !== caregiverId)
          : [...prev.caregiverIds, caregiverId],
      };
    });
  };

  const saveInlineAltaEdit = async (servicio, options = { reopen: false }) => {
    try {
      if (!editingAltaDraft.fecha || !editingAltaDraft.hora) {
        showError('Completá fecha y hora.');
        return;
      }
      if (!editingAltaDraft.caregiverIds.length) {
        showError('Seleccioná al menos un cuidador.');
        return;
      }
      if (!editingAltaDraft.pacienteId) {
        showError('Seleccioná un paciente.');
        return;
      }

      const fechaInicio = new Date(`${editingAltaDraft.fecha}T${editingAltaDraft.hora}:00`).toISOString();
      const direccionInline = buildDireccionServicio({
        direccionDetalle: editingAltaDraft.direccionDetalle,
        zona: editingAltaDraft.zona,
        provincia: editingAltaDraft.provincia,
      });
      const payload = buildServicioUpdatePayload(servicio, {
        pacienteId: editingAltaDraft.pacienteId,
        fechaInicio,
        cuidadorId: editingAltaDraft.caregiverIds[0],
        caregiverIds: editingAltaDraft.caregiverIds,
        direccion: direccionInline,
      });

      await adminApi.updateServicio(servicio.id, payload);
      if (options.reopen) {
        if (typeof adminApi.updateServicioAltaEstado === 'function') {
          await adminApi.updateServicioAltaEstado(servicio.id, 'pendiente');
        } else {
          await adminApi.updateServicio(servicio.id, buildServicioUpdatePayload(servicio, { altaEstado: 'pendiente' }));
        }
      }
      showSuccess(options.reopen ? 'Alta reabierta y actualizada' : 'Alta actualizada');
      cancelInlineAltaEdit();
      await loadData();
    } catch (error) {
      showError(error.message || 'No se pudo guardar la alta');
    }
  };

  const provinciaServicioNormalizada = String(serviceForm.provincia || '').trim().toLowerCase();
  const esCabaServicio = provinciaServicioNormalizada === 'caba';
  const opcionesZona = esCabaServicio
    ? BARRIOS_CABA
    : (['buenos aires', 'provincia de buenos aires'].includes(provinciaServicioNormalizada))
      ? PARTIDOS_GBA
      : [];
  const provinciaInlineNormalizada = String(editingAltaDraft.provincia || '').trim().toLowerCase();
  const esCabaInlineAlta = provinciaInlineNormalizada === 'caba';
  const opcionesZonaInlineAlta = esCabaInlineAlta
    ? BARRIOS_CABA
    : (['buenos aires', 'provincia de buenos aires'].includes(provinciaInlineNormalizada))
      ? PARTIDOS_GBA
      : [];

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/login');
  };

  const resetNuevoServicioForm = () => {
    setServiceForm({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      hora: '09:00',
      duracionHoras: 2,
      direccion: '',
      provincia: '',
      zona: '',
      direccionDetalle: '',
      repeatMode: 'none',
      repeatUntil: format(new Date(), 'yyyy-MM-dd'),
      repeatDays: [],
      estado: 'pendiente',
      notas: '',
      pacienteId: '',
      cuidadorId: '',
      cuidadorIds: [],
    });

    setCrearPacienteRapido(false);
    setCrearCuidadorRapido(false);

    setNewPaciente({
      nombre: '',
      edad: '',
      tipo: 'adulto_mayor',
      condicion: '',
      direccion: '',
      contactoEmergenciaNombre: '',
      contactoEmergenciaTelefono: '',
    });

    setNewCuidador({
      nombre: '',
      email: '',
      telefono: '',
      codigo: '',
      disponibilidad: 'mañana y tarde',
    });
  };

  const handleCreateServicio = async (e) => {
    e.preventDefault();

    try {
      let cuidadorId = serviceForm.cuidadorId;
      let cuidadorIds = Array.isArray(serviceForm.cuidadorIds)
        ? serviceForm.cuidadorIds.filter(Boolean)
        : [];
      let pacienteId = serviceForm.pacienteId;

      if (crearCuidadorRapido) {
        const cuidadorCreado = await adminApi.createAcompanante({
          ...newCuidador,
          estado: 'activo',
          avatar: '',
          bio: '',
          especialidades: [],
        });
        cuidadorId = cuidadorCreado.id;
        cuidadorIds = [cuidadorCreado.id];
      }

      if (!cuidadorIds.length && cuidadorId) {
        cuidadorIds = [cuidadorId];
      }
      cuidadorId = cuidadorIds[0] || cuidadorId;

      if (crearPacienteRapido) {
        const pacienteCreado = await adminApi.createCliente({
          nombre: newPaciente.nombre,
          edad: Number(newPaciente.edad),
          tipo: newPaciente.tipo,
          condicion: newPaciente.condicion,
          direccion: newPaciente.direccion,
          contactoEmergencia: {
            nombre: newPaciente.contactoEmergenciaNombre,
            telefono: newPaciente.contactoEmergenciaTelefono,
          },
          acompananteAsignado: cuidadorId || null,
          foto: '',
          notas: '',
          necesidadesEspeciales: [],
        });
        pacienteId = pacienteCreado.id;
      }

      if (!pacienteId || !cuidadorId || !cuidadorIds.length) {
        showError('Seleccioná o creá paciente y al menos un cuidador para el servicio.');
        return;
      }

      if (serviceForm.repeatMode !== 'none' && !serviceForm.repeatUntil) {
        showError('Seleccioná una fecha de fin para la repetición.');
        return;
      }

      if (serviceForm.repeatMode !== 'none') {
        const startDate = new Date(`${serviceForm.fecha}T00:00:00`);
        const endDate = new Date(`${serviceForm.repeatUntil}T00:00:00`);
        if (endDate < startDate) {
          showError('La fecha de fin no puede ser anterior a la fecha inicial.');
          return;
        }
      }

      if (serviceForm.repeatMode === 'custom' && serviceForm.repeatDays.length === 0) {
        showError('Seleccioná al menos un día para la repetición.');
        return;
      }

      const fechaInicio = new Date(`${serviceForm.fecha}T${serviceForm.hora}:00`).toISOString();

      await adminApi.createServicio({
        fechaInicio,
        duracionHoras: Number(serviceForm.duracionHoras),
        direccion: buildDireccionServicio(serviceForm),
        repeatMode: serviceForm.repeatMode,
        repeatUntil:
          serviceForm.repeatMode === 'none'
            ? null
            : new Date(`${serviceForm.repeatUntil}T23:59:59`).toISOString(),
        repeatDays: serviceForm.repeatMode === 'custom' ? serviceForm.repeatDays : [],
        estado: serviceForm.estado,
        notas: serviceForm.notas,
        pacienteId,
        cuidadorId,
        caregiverIds: cuidadorIds,
      });

      await loadData();
      showSuccess(
        serviceForm.repeatMode === 'none'
          ? 'Servicio creado correctamente'
          : 'Servicio recurrente creado'
      );
      setShowNuevoServicio(false);
      resetNuevoServicioForm();
    } catch (error) {
      showError(error.message || 'No se pudo crear el servicio');
    }
  };

  const toggleServiceRepeatDay = (day) => {
    setServiceForm((prev) => ({
      ...prev,
      repeatDays: prev.repeatDays.includes(day)
        ? prev.repeatDays.filter((d) => d !== day)
        : [...prev.repeatDays, day],
    }));
  };

  const toggleCuidadorServicio = (cuidadorId) => {
    setServiceForm((prev) => {
      const current = Array.isArray(prev.cuidadorIds) ? prev.cuidadorIds : [];
      const exists = current.includes(cuidadorId);
      const next = exists ? current.filter((id) => id !== cuidadorId) : [...current, cuidadorId];
      return {
        ...prev,
        cuidadorIds: next,
        cuidadorId: next[0] || '',
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 relative overflow-hidden">
      {toast}

      <header className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-40 border-b border-slate-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-dark">Panel de administración</h1>
              <p className="text-sm text-dark-400">Bienvenido, {user?.nombre}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800"
                onClick={() => setShowNuevoServicio(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo servicio
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative p-4 max-w-[1640px] mx-auto space-y-12 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-14 lg:space-y-0">
        <Card className="order-1 bg-white border border-slate-200 shadow-md rounded-2xl">
          <CardContent>
            <h2 className="text-xl font-bold text-dark mb-4">Resumen operativo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-h-[110px]">
              {statCards.map((stat) => (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => {
                    if (stat.key === 'servicios_en_curso') {
                      navigate('/admin/servicios');
                      return;
                    }
                    if (stat.key === 'pacientes_totales') {
                      navigate('/admin/clientes');
                      return;
                    }
                    if (stat.key === 'cuidadores_activos') {
                      navigate('/admin/acompanantes');
                      return;
                    }
                  }}
                  className={`relative overflow-hidden rounded-2xl border p-3 pt-6 text-left bg-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg ${stat.border}`}
                >
                  <span className={`absolute left-3 right-3 top-3 h-1 rounded-full ${stat.accent}`} />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{stat.label}</p>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                      <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                    </span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </button>
              ))}
            </div>
            <Card className="mt-12 bg-gradient-to-r from-slate-100 via-white to-slate-100 border border-slate-200 shadow-md rounded-2xl">
              <CardContent>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-slate-700">Búsqueda de cuidadores</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/admin/acompanantes')}
                      className="text-xs text-slate-600 font-medium"
                    >
                      Ver base completa
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <select
                      value={caregiverSearch.provincia}
                      onChange={(e) => setCaregiverSearch((prev) => ({ ...prev, provincia: e.target.value, zona: '' }))}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
                    >
                      <option value="">Provincia</option>
                      {PROVINCIAS_ARG.map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                    <input
                      list="zonas-busqueda-dashboard"
                      value={caregiverSearch.zona}
                      onChange={(e) => setCaregiverSearch((prev) => ({ ...prev, zona: e.target.value }))}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
                      placeholder="Zona / barrio / partido"
                    />
                    <datalist id="zonas-busqueda-dashboard">
                      {opcionesZonaBusquedaCuidadores.map((z) => (
                        <option key={z} value={z} />
                      ))}
                    </datalist>
                    <select
                      value={caregiverSearch.tipo}
                      onChange={(e) => setCaregiverSearch((prev) => ({ ...prev, tipo: e.target.value }))}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
                    >
                      <option value="cuidador">Cuidador</option>
                      <option value="masajista">Masajista</option>
                      <option value="kinesiologo">Kinesiólogo</option>
                      <option value="enfermero">Enfermero/a</option>
                      <option value="acompanante_terapeutico">Acomp. terapéutico</option>
                      <option value="otro">Otro</option>
                    </select>
                    <button
                      type="button"
                      onClick={ejecutarBusquedaCuidadores}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800"
                    >
                      Buscar
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-12">
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white shadow-sm p-3">
                <p className="text-sm font-semibold text-slate-700 mb-3">Altas por mes</p>
                <div className="h-32 flex items-end gap-2">
                  {(() => {
                    const max = Math.max(1, ...altasPorMes.map((m) => m.value));
                    return altasPorMes.map((m) => (
                      <div key={m.key} className="flex-1 min-w-0 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-500">{m.value}</span>
                        <div className="w-full bg-slate-100 rounded-t-md flex items-end h-24">
                          <div
                            className="w-full bg-gradient-to-t from-sky-500 via-cyan-400 to-indigo-300 rounded-t-md shadow-sm"
                            style={{ height: `${(m.value / max) * 100}%` }}
                          />
                        </div>
                        <div className="w-full text-center leading-tight">
                          <span className="block text-[10px] text-slate-500 uppercase truncate">{m.monthLabel}</span>
                          <span className="block text-[10px] text-slate-400">{m.yearLabel}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-lime-50/30 to-emerald-50/30 shadow-sm p-3">
                <p className="text-sm font-semibold text-slate-700 mb-3">Cuidadores por zona</p>
                {cuidadoresPorZona.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin datos de zona.</p>
                ) : (
                  <div className="grid grid-cols-[110px_1fr] gap-3 items-center">
                    {(() => {
                      const total = cuidadoresPorZona.reduce((acc, z) => acc + z.value, 0) || 1;
                      const cx = 55;
                      const cy = 55;
                      const radius = 34;
                      const circumference = 2 * Math.PI * radius;
                      let accumulated = 0;

                      return (
                        <>
                          <div className="relative w-[110px] h-[110px]">
                            <svg width="110" height="110" viewBox="0 0 110 110">
                              <defs>
                                {PIE_COLORS.map((pair, idx) => (
                                  <linearGradient key={`zona-grad-${idx}`} id={`zona-grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={pair[0]} />
                                    <stop offset="100%" stopColor={pair[1]} />
                                  </linearGradient>
                                ))}
                              </defs>
                              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="18" />
                              {cuidadoresPorZona.map((z, index) => {
                                const value = Number(z.value || 0);
                                if (value <= 0) return null;
                                const dash = (value / total) * circumference;
                                const gap = Math.max(circumference - dash, 0);
                                const offset = -accumulated;
                                accumulated += dash;

                                return (
                                  <circle
                                    key={z.zona}
                                    cx={cx}
                                    cy={cy}
                                    r={radius}
                                    fill="none"
                                    stroke={`url(#zona-grad-${index % PIE_COLORS.length})`}
                                    strokeWidth="18"
                                    strokeLinecap="round"
                                    strokeDasharray={`${dash} ${gap}`}
                                    strokeDashoffset={offset}
                                    transform={`rotate(-90 ${cx} ${cy})`}
                                  />
                                );
                              })}
                              <circle cx={cx} cy={cy} r={20} fill="#ffffff" />
                            </svg>
                          </div>
                          <div className="space-y-1">
                            {cuidadoresPorZona.map((z, index) => (
                              <div key={z.zona} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length][0] }}
                                  />
                                  <span className="text-xs text-slate-600 truncate">{z.zona}</span>
                                </div>
                                <span className="text-xs text-slate-700 font-medium">
                                  {z.value} ({Math.round((z.value / total) * 100)}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        <div className="order-2">
          <Card className="bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-slate-200 shadow-md rounded-2xl">
            <CardContent>
              <div className="flex items-center justify-between mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <h3 className="font-semibold text-dark">Gestión de altas</h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAltasTab('pendientes')}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      altasTab === 'pendientes'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white/90 text-slate-600 border-slate-200'
                    }`}
                  >
                    Pendientes ({altasPendientes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAltasTab('realizadas')}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      altasTab === 'realizadas'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white/90 text-slate-600 border-slate-200'
                    }`}
                  >
                    Realizadas ({altasRealizadas.length})
                  </button>
                </div>
              </div>

              <div className="space-y-3 min-h-[500px] max-h-[500px] xl:min-h-[540px] xl:max-h-[540px] overflow-y-auto pr-1">
                {altasActivas.length === 0 && (
                  <p className="text-sm text-dark-400">
                    {altasTab === 'realizadas' ? 'No hay altas realizadas.' : 'No hay altas pendientes hoy.'}
                  </p>
                )}

                {altasPagina.map((servicio) => {
                  const isEditing = editingAltaId === servicio.id;
                  const caregiverNames = Array.isArray(servicio.caregivers) && servicio.caregivers.length
                    ? servicio.caregivers.map((c) => c.nombre).join(', ')
                    : (servicio.cuidador?.nombre || 'Sin asignar');
                  const zonaAlta = getZonaCorta(servicio.direccion || servicio.paciente?.direccion);
                  const fechaAltaEstimada = servicio.fechaInicio ? format(new Date(servicio.fechaInicio), 'dd/MM HH:mm') : null;
                  return (
                  <div
                    key={servicio.id}
                    className="w-full text-left p-3 bg-white/95 border border-violet-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToServicioDetalle(servicio);
                        }}
                        className="font-medium text-dark text-sm truncate hover:text-sky-700"
                        title="Abrir ficha de servicio"
                      >
                        {servicio.paciente?.nombre || 'Paciente sin asignar'}
                      </button>
                      {altasTab === 'realizadas' ? (
                        <span className="text-[11px] px-2.5 py-1 rounded-full border font-semibold bg-emerald-100 text-emerald-700 border-emerald-200">
                          Alta realizada
                        </span>
                      ) : null}
                    </div>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startInlineAltaEdit(servicio);
                        }}
                        className="text-xs text-dark-400 truncate mt-1 hover:text-sky-700"
                        title="Editar cuidadores y fecha inline"
                      >
                        Cuidadores: {caregiverNames}
                      </button>
                    ) : (
                      <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50/50 p-2">
                        <div className="grid grid-cols-1 gap-2 mb-2">
                          <select
                            value={editingAltaDraft.pacienteId}
                            onChange={(e) => setEditingAltaDraft((prev) => ({ ...prev, pacienteId: e.target.value }))}
                            className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs"
                          >
                            <option value="">Seleccionar paciente</option>
                            {pacientes.map((p) => (
                              <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          <input
                            type="date"
                            value={editingAltaDraft.fecha}
                            onChange={(e) => setEditingAltaDraft((prev) => ({ ...prev, fecha: e.target.value }))}
                            className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs"
                          />
                          <input
                            type="time"
                            value={editingAltaDraft.hora}
                            onChange={(e) => setEditingAltaDraft((prev) => ({ ...prev, hora: e.target.value }))}
                            className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                          <select
                            value={editingAltaDraft.provincia}
                            onChange={(e) =>
                              setEditingAltaDraft((prev) => ({
                                ...prev,
                                provincia: e.target.value,
                                zona: '',
                              }))
                            }
                            className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs"
                          >
                            <option value="">Provincia</option>
                            {PROVINCIAS_ARG.map((prov) => (
                              <option key={prov} value={prov}>{prov}</option>
                            ))}
                          </select>
                          {opcionesZonaInlineAlta.length > 0 ? (
                            <select
                              value={editingAltaDraft.zona}
                              onChange={(e) => setEditingAltaDraft((prev) => ({ ...prev, zona: e.target.value }))}
                              className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs"
                            >
                              <option value="">{esCabaInlineAlta ? 'Barrio' : 'Partido'}</option>
                              {opcionesZonaInlineAlta.map((zona) => (
                                <option key={zona} value={zona}>{zona}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={editingAltaDraft.zona}
                              onChange={(e) => setEditingAltaDraft((prev) => ({ ...prev, zona: e.target.value }))}
                              placeholder="Zona / barrio / partido"
                              className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs"
                            />
                          )}
                          <input
                            value={editingAltaDraft.direccionDetalle}
                            onChange={(e) => setEditingAltaDraft((prev) => ({ ...prev, direccionDetalle: e.target.value }))}
                            placeholder="Calle y altura (opcional)"
                            className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs"
                          />
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {acompanantes.filter((a) => a.estado === 'activo').map((a) => {
                            const checked = editingAltaDraft.caregiverIds.includes(a.id);
                            const isPrimary = editingAltaDraft.caregiverIds[0] === a.id;
                            return (
                              <label key={a.id} className="flex items-center justify-between gap-2 px-1.5 py-1 rounded-md hover:bg-white/70 cursor-pointer">
                                <span className="inline-flex items-center gap-2 text-xs text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleInlineAltaCaregiver(a.id)}
                                  />
                                  {a.nombre}
                                </span>
                                {isPrimary ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-sky-200 bg-sky-100 text-sky-700">
                                    Principal
                                  </span>
                                ) : null}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {(zonaAlta || fechaAltaEstimada) && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startInlineAltaEdit(servicio);
                          }}
                          className="text-xs text-dark-400 truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-left hover:text-sky-700 hover:border-sky-200"
                          title="Editar zona inline"
                        >
                          Zona: {zonaAlta || 'Sin zona'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startInlineAltaEdit(servicio);
                          }}
                          className="text-xs text-dark-400 truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-left hover:text-sky-700 hover:border-sky-200"
                          title="Editar fecha inline"
                        >
                          Alta estimada: {fechaAltaEstimada || '-'}
                        </button>
                      </div>
                    )}
                    {altasTab === 'realizadas' && servicio.altaRealizadaAt && (
                      <p className="text-xs text-emerald-700 mt-1">
                        Realizada: {format(new Date(servicio.altaRealizadaAt), 'dd/MM HH:mm')}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3 items-center">
                      {isEditing && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveInlineAltaEdit(servicio);
                            }}
                            className="text-xs px-2.5 py-1 rounded-md border font-semibold bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200"
                          >
                            Guardar
                          </button>
                          {altasTab === 'realizadas' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveInlineAltaEdit(servicio, { reopen: true });
                              }}
                              className="text-xs px-2.5 py-1 rounded-md border font-semibold bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                            >
                              Guardar y reabrir
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelInlineAltaEdit();
                            }}
                            className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {!isEditing && altasTab === 'realizadas' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            reabrirAlta(servicio);
                          }}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          title="Reabrir alta"
                          aria-label="Reabrir alta"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {!isEditing && altasTab !== 'realizadas' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            marcarAltaComoRealizada(servicio);
                          }}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          title="Marcar realizada"
                          aria-label="Marcar realizada"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicarServicioEnDashboard(servicio);
                        }}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                        title="Duplicar"
                        aria-label="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )})}

                {altasActivas.length > ALTAS_POR_PAGINA && (
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAltasPage((prev) => Math.max(0, prev - 1))}
                      disabled={altasPage === 0}
                      className="text-xs px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="text-xs text-slate-500">
                      {altasPage + 1} / {totalAltasPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAltasPage((prev) => Math.min(totalAltasPages - 1, prev + 1))}
                      disabled={altasPage >= totalAltasPages - 1}
                      className="text-xs px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="order-3 lg:col-span-2 grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card
            hover
            onClick={() => navigate('/admin/servicios')}
            className="bg-white border border-slate-200 shadow-sm"
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <p className="font-semibold text-dark">Servicios</p>
                  <p className="text-sm text-slate-500">Ficha y acciones</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-300" />
            </CardContent>
          </Card>

          <Card
            hover
            onClick={() => navigate('/admin/clientes')}
            className="bg-white border border-slate-200 shadow-sm"
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-violet-700" />
                </div>
                <div>
                  <p className="font-semibold text-dark">Pacientes</p>
                  <p className="text-sm text-slate-500">Administrar pacientes</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-300" />
            </CardContent>
          </Card>

          <Card
            hover
            onClick={() => navigate('/admin/acompanantes')}
            className="bg-white border border-slate-200 shadow-sm"
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-sky-700" />
                </div>
                <div>
                  <p className="font-semibold text-dark">Cuidadores</p>
                  <p className="text-sm text-slate-500">Gestionar equipo</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-300" />
            </CardContent>
          </Card>

          <Card
            hover
            onClick={() => navigate('/admin/calendario')}
            className="bg-white border border-slate-200 shadow-sm"
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <p className="font-semibold text-dark">Vista calendario</p>
                  <p className="text-sm text-slate-500">Organizar servicios</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-300" />
            </CardContent>
          </Card>

          <Card
            hover
            onClick={() => navigate('/admin/finanzas')}
            className="bg-white border border-slate-200 shadow-sm"
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <ArrowDownCircle className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <p className="font-semibold text-dark">Finanzas</p>
                  <p className="text-sm text-slate-500">Cobros y pagos</p>
                </div>
              </div>
              <ArrowUpCircle className="w-5 h-5 text-dark-300" />
            </CardContent>
          </Card>
        </div>

      </div>

      <Modal
        isOpen={showDetalleStats}
        onClose={() => setShowDetalleStats(false)}
        title={detalleTitle}
        size="lg"
      >
        <div className={`mb-3 rounded-xl border px-3 py-2 ${detalleTheme.summary} shadow-sm`}>
          <p className="text-sm text-slate-700">
            Hacé click en un registro para abrir su detalle.
          </p>
        </div>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {detalleStats.items.length === 0 && (
            <p className="text-sm text-dark-400">No hay datos para mostrar.</p>
          )}
          {detalleStats.items.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => openDetalleItem(item)}
              className={`w-full text-left rounded-2xl border p-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${detalleTheme.item}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-dark text-sm truncate">{item.line1}</p>
                <div className="flex items-center gap-2">
                  {item.target === 'servicio' && item.source ? (
                    <>
                      {item.source.altaEstado === 'realizada' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 p-0 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            reabrirAlta(item.source);
                          }}
                          title="Reabrir alta"
                          aria-label="Reabrir alta"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicarServicioEnDashboard(item.source);
                        }}
                        title="Duplicar"
                        aria-label="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="px-2 py-1 text-[11px] border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteServicioStats(item.source);
                        }}
                      >
                        Dar de baja
                      </Button>
                    </>
                  ) : null}
                  {item.tag ? (
                    <span className={`text-[11px] px-2 py-1 rounded-full border ${detalleTheme.tag}`}>
                      {item.tag}
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-dark-400 mt-1">{item.line2}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(confirmDeleteServicioStats)}
        onClose={() => setConfirmDeleteServicioStats(null)}
        title="Confirmar eliminación"
        size="sm"
      >
        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 p-3">
          <p className="text-sm text-slate-700">
            ¿Querés dar de baja este servicio de <strong>{confirmDeleteServicioStats?.paciente?.nombre || 'paciente'}</strong>?
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="ghost" fullWidth onClick={() => setConfirmDeleteServicioStats(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            fullWidth
            onClick={async () => {
              try {
                if (confirmDeleteServicioStats) {
                  await eliminarServicioDesdeStats(confirmDeleteServicioStats);
                }
              } finally {
                setConfirmDeleteServicioStats(null);
              }
            }}
          >
            Dar de baja
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showNuevoServicio}
        onClose={() => {
          setShowNuevoServicio(false);
          resetNuevoServicioForm();
        }}
        title="Nuevo servicio"
        size="lg"
      >
        <form onSubmit={handleCreateServicio} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de inicio"
              type="date"
              value={serviceForm.fecha}
              onChange={(e) => setServiceForm({ ...serviceForm, fecha: e.target.value })}
              required
            />
            <Input
              label="Hora inicio"
              type="time"
              value={serviceForm.hora}
              onChange={(e) => setServiceForm({ ...serviceForm, hora: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Repetición</label>
              <select
                value={serviceForm.repeatMode}
                onChange={(e) => setServiceForm({ ...serviceForm, repeatMode: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
              >
                <option value="none">Sin repetición</option>
                <option value="weekdays">Lunes a Viernes</option>
                <option value="everyday">Lunes a Lunes (todos los días)</option>
                <option value="weekend">Fin de semana (Sáb y Dom)</option>
                <option value="custom">Días personalizados</option>
              </select>
            </div>
            <Input
              label="Repetir hasta"
              type="date"
              value={serviceForm.repeatUntil}
              onChange={(e) => setServiceForm({ ...serviceForm, repeatUntil: e.target.value })}
              disabled={serviceForm.repeatMode === 'none'}
            />
          </div>

          {serviceForm.repeatMode === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Días</label>
              <div className="flex flex-wrap gap-2">
                {REPEAT_DAY_OPTIONS.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleServiceRepeatDay(day.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      serviceForm.repeatDays.includes(day.id)
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Duración (horas)</label>
              <select
                value={serviceForm.duracionHoras}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, duracionHoras: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
              >
                {DURACIONES_HORAS.map((horas) => (
                  <option key={horas} value={horas}>
                    {horas} {horas === 1 ? 'hora' : 'horas'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Estado</label>
              <select
                value={serviceForm.estado}
                onChange={(e) => setServiceForm({ ...serviceForm, estado: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_curso">En curso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Provincia</label>
              <select
                value={serviceForm.provincia}
                onChange={(e) => setServiceForm({ ...serviceForm, provincia: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
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
                  {esCabaServicio ? 'Barrio' : 'Partido / Localidad'}
                </label>
                <select
                  value={serviceForm.zona}
                  onChange={(e) => setServiceForm({ ...serviceForm, zona: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
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
                value={serviceForm.zona}
                onChange={(e) => setServiceForm({ ...serviceForm, zona: e.target.value })}
                placeholder="Ej: San Luis Capital"
              />
            )}
          </div>
          <Input
            label="Calle y altura (opcional)"
            value={serviceForm.direccionDetalle}
            onChange={(e) => setServiceForm({ ...serviceForm, direccionDetalle: e.target.value })}
            placeholder="Ej: Av. Corrientes 1234"
          />

          <div className="border-t border-light-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-dark-700">Paciente</label>
              <label className="text-sm text-primary inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={crearPacienteRapido}
                  onChange={(e) => setCrearPacienteRapido(e.target.checked)}
                />
                Crear paciente rápido
              </label>
            </div>

            {!crearPacienteRapido && (
              <select
                value={serviceForm.pacienteId}
                onChange={(e) => setServiceForm({ ...serviceForm, pacienteId: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
                required={!crearPacienteRapido}
              >
                <option value="">Seleccionar paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            )}

            {crearPacienteRapido && (
              <div className="space-y-3">
                <Input
                  label="Nombre"
                  value={newPaciente.nombre}
                  onChange={(e) => setNewPaciente({ ...newPaciente, nombre: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Edad"
                    type="number"
                    value={newPaciente.edad}
                    onChange={(e) => setNewPaciente({ ...newPaciente, edad: e.target.value })}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Tipo</label>
                    <select
                      value={newPaciente.tipo}
                      onChange={(e) => setNewPaciente({ ...newPaciente, tipo: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
                    >
                      <option value="adulto_mayor">Adulto mayor</option>
                      <option value="nino">Niño/a</option>
                    </select>
                  </div>
                </div>
                <Input
                  label="Condición"
                  value={newPaciente.condicion}
                  onChange={(e) => setNewPaciente({ ...newPaciente, condicion: e.target.value })}
                  required
                />
                <Input
                  label="Dirección"
                  value={newPaciente.direccion}
                  onChange={(e) => setNewPaciente({ ...newPaciente, direccion: e.target.value })}
                  required
                />
              </div>
            )}
          </div>

          <div className="border-t border-light-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-dark-700">Cuidador / Profesional</label>
              <label className="text-sm text-primary inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={crearCuidadorRapido}
                  onChange={(e) => setCrearCuidadorRapido(e.target.checked)}
                />
                Crear cuidador rápido
              </label>
            </div>

            {!crearCuidadorRapido && (
              <div className="rounded-xl border-2 border-light-300 bg-white p-3 space-y-2 max-h-48 overflow-y-auto">
                <p className="text-xs text-slate-500">Podés seleccionar más de un cuidador. El primero queda como principal.</p>
                {acompanantes.filter((a) => a.estado === 'activo').map((a) => {
                  const checked = (serviceForm.cuidadorIds || []).includes(a.id);
                  const isPrimary = (serviceForm.cuidadorIds || [])[0] === a.id;
                  return (
                    <label key={a.id} className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCuidadorServicio(a.id)}
                        />
                        {a.nombre}
                      </span>
                      {isPrimary ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700">
                          Principal
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            )}

            {crearCuidadorRapido && (
              <div className="space-y-3">
                <Input
                  label="Nombre"
                  value={newCuidador.nombre}
                  onChange={(e) => setNewCuidador({ ...newCuidador, nombre: e.target.value })}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={newCuidador.email}
                  onChange={(e) => setNewCuidador({ ...newCuidador, email: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Teléfono"
                    value={newCuidador.telefono}
                    onChange={(e) => setNewCuidador({ ...newCuidador, telefono: e.target.value })}
                    required
                  />
                  <Input
                    label="Código"
                    value={newCuidador.codigo}
                    onChange={(e) => setNewCuidador({ ...newCuidador, codigo: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Notas</label>
            <textarea
              rows={3}
              value={serviceForm.notas}
              onChange={(e) => setServiceForm({ ...serviceForm, notas: e.target.value })}
              className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" fullWidth onClick={() => setShowNuevoServicio(false)}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth>
              Guardar servicio
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminDashboard;
