import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Mail,
  Phone,
  FileUp,
  CheckCircle,
  XCircle,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { Card, CardContent } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/services/adminApi';

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

const ZONA_AMBA_OPTIONS = [
  { value: 'caba', label: 'CABA' },
  { value: 'zona_norte', label: 'Zona Norte' },
  { value: 'zona_sur', label: 'Zona Sur' },
  { value: 'zona_oeste', label: 'Zona Oeste' },
];

const ZONA_AMBA_BY_PARTIDO = {
  'almirante brown': 'zona_sur',
  avellaneda: 'zona_sur',
  berazategui: 'zona_sur',
  berisso: 'zona_sur',
  brandsen: 'zona_sur',
  campana: 'zona_norte',
  canuelas: 'zona_sur',
  ensenada: 'zona_sur',
  escobar: 'zona_norte',
  'esteban echeverria': 'zona_sur',
  ezeiza: 'zona_sur',
  'exaltacion de la cruz': 'zona_norte',
  'florencio varela': 'zona_sur',
  'general las heras': 'zona_oeste',
  'general rodriguez': 'zona_oeste',
  'general san martin': 'zona_norte',
  hurlingham: 'zona_oeste',
  ituzaingo: 'zona_oeste',
  'jose c. paz': 'zona_norte',
  'la matanza': 'zona_oeste',
  'la plata': 'zona_sur',
  lanus: 'zona_sur',
  'lomas de zamora': 'zona_sur',
  lujan: 'zona_oeste',
  'malvinas argentinas': 'zona_norte',
  'marcos paz': 'zona_oeste',
  merlo: 'zona_oeste',
  moreno: 'zona_oeste',
  moron: 'zona_oeste',
  pilar: 'zona_norte',
  'presidente peron': 'zona_sur',
  quilmes: 'zona_sur',
  'san fernando': 'zona_norte',
  'san isidro': 'zona_norte',
  'san miguel': 'zona_norte',
  'san vicente': 'zona_sur',
  tigre: 'zona_norte',
  'tres de febrero': 'zona_oeste',
  'vicente lopez': 'zona_norte',
  zarate: 'zona_norte',
};

const TIPO_PERFIL_OPTIONS = [
  { value: 'cuidador', label: 'Cuidador' },
  { value: 'masajista', label: 'Masajista' },
  { value: 'kinesiologo', label: 'Kinesiólogo' },
  { value: 'enfermero', label: 'Enfermero/a' },
  { value: 'acompanante_terapeutico', label: 'Acompañante terapéutico' },
  { value: 'otro', label: 'Otro' },
];

const ESTADO_PROCESO_OPTIONS = [
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'en_evaluacion', label: 'En evaluación' },
  { value: 'base_datos', label: 'Base de datos' },
  { value: 'descartado', label: 'Descartado' },
];

function getInitials(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'A';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function inferZonaAmba(provincia, zona) {
  const provinciaNorm = normalizeText(provincia);
  const zonaNorm = normalizeText(zona);
  if (provinciaNorm === 'caba') return 'caba';
  if (provinciaNorm !== 'buenos aires' && provinciaNorm !== 'provincia de buenos aires') return '';
  return ZONA_AMBA_BY_PARTIDO[zonaNorm] || '';
}

export function Acompanantes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [acompanantes, setAcompanantes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('activos');
  const [filterProvincia, setFilterProvincia] = useState('');
  const [filterZona, setFilterZona] = useState('');
  const [filterTipoPerfil, setFilterTipoPerfil] = useState('');
  const [filterZonaAmba, setFilterZonaAmba] = useState('');
  const [filterEstadoProceso, setFilterEstadoProceso] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAcompanante, setEditingAcompanante] = useState(null);
  const [confirmEstadoModal, setConfirmEstadoModal] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    codigo: '',
    disponibilidad: 'mañana y tarde',
    estado: 'activo',
    tipoPerfil: 'cuidador',
    estadoProceso: 'aprobado',
    provincia: '',
    zona: '',
    zonaAmba: '',
    zonasCobertura: [],
    disponibilidadDias: [],
    disponibilidadTurnos: [],
    tarifaReferencia: '',
    avatar: '',
    cvNombre: '',
    cvMimeType: '',
    cvArchivo: '',
    bio: '',
    especialidades: [],
  });

  const provinciaNormalizadaFiltro = String(filterProvincia || '').trim().toLowerCase();
  const provinciaNormalizadaForm = String(formData.provincia || '').trim().toLowerCase();
  const esCabaFiltro = provinciaNormalizadaFiltro === 'caba';
  const esBuenosAiresFiltro = provinciaNormalizadaFiltro === 'buenos aires' || provinciaNormalizadaFiltro === 'provincia de buenos aires';
  const esCabaForm = provinciaNormalizadaForm === 'caba';
  const esBuenosAiresForm = provinciaNormalizadaForm === 'buenos aires' || provinciaNormalizadaForm === 'provincia de buenos aires';

  const opcionesZona = esCabaFiltro
    ? BARRIOS_CABA
    : esBuenosAiresFiltro
      ? PARTIDOS_GBA
      : [];

  const opcionesZonaForm = esCabaForm
    ? BARRIOS_CABA
    : esBuenosAiresForm
      ? PARTIDOS_GBA
      : [];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const provincia = params.get('provincia') || '';
    const zona = params.get('zona') || '';
    const tipo = params.get('tipo') || '';
    const especialidad = params.get('especialidad') || '';
    const zonaAmba = params.get('zonaAmba') || '';
    if (provincia) setFilterProvincia(provincia);
    if (zona) setFilterZona(zona);
    if (tipo) setFilterTipoPerfil(tipo);
    if (especialidad) setFilterEspecialidad(especialidad);
    if (zonaAmba) setFilterZonaAmba(zonaAmba);
    if (provincia || zona || tipo || especialidad || zonaAmba) {
      setViewMode('base');
    }
  }, [location.search]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await adminApi.getAcompanantes();
        setAcompanantes(data);
      } catch (error) {
        showError(error.message || 'No se pudieron cargar los acompañantes');
      }
    };

    loadData();
  }, [showError]);

  const filteredAcompanantes = useMemo(() => {
    return acompanantes.filter((a) => {
      const isActivoAprobado = a.estado === 'activo' && (a.estadoProceso || 'aprobado') === 'aprobado';
      if (viewMode === 'activos' && !isActivoAprobado) return false;
      if (viewMode === 'base' && isActivoAprobado) return false;

      if (filterProvincia && (a.provincia || '') !== filterProvincia) return false;
      if (filterZona && !`${a.zona || ''}`.toLowerCase().includes(filterZona.toLowerCase())) return false;
      if (filterTipoPerfil && (a.tipoPerfil || '') !== filterTipoPerfil) return false;
      const zonaAmbaActual = a.zonaAmba || inferZonaAmba(a.provincia, a.zona);
      if (filterZonaAmba && zonaAmbaActual !== filterZonaAmba) return false;
      if (filterEstadoProceso && (a.estadoProceso || 'aprobado') !== filterEstadoProceso) return false;
      if (filterEspecialidad) {
        const special = Array.isArray(a.especialidades) ? a.especialidades.join(' ').toLowerCase() : '';
        const tipo = (a.tipoPerfil || '').toLowerCase();
        if (!special.includes(filterEspecialidad.toLowerCase()) && !tipo.includes(filterEspecialidad.toLowerCase())) {
          return false;
        }
      }

      const text = searchQuery.toLowerCase();
      if (!text) return true;
      const raw = [
        a.nombre,
        a.email,
        a.telefono,
        a.zona,
        a.provincia,
        a.tipoPerfil,
        ...(Array.isArray(a.especialidades) ? a.especialidades : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return raw.includes(text);
    });
  }, [
    acompanantes,
    searchQuery,
    viewMode,
    filterProvincia,
    filterZona,
    filterTipoPerfil,
    filterZonaAmba,
    filterEstadoProceso,
    filterEspecialidad,
  ]);

  const baseParaConteoZonas = useMemo(() => {
    return acompanantes.filter((a) => {
      const isActivoAprobado = a.estado === 'activo' && (a.estadoProceso || 'aprobado') === 'aprobado';
      if (viewMode === 'activos') return isActivoAprobado;
      return !isActivoAprobado;
    });
  }, [acompanantes, viewMode]);

  const conteoPorZonaAmba = useMemo(() => {
    const initial = { caba: 0, zona_norte: 0, zona_sur: 0, zona_oeste: 0 };
    for (const item of baseParaConteoZonas) {
      const zone = item.zonaAmba || inferZonaAmba(item.provincia, item.zona);
      if (zone && initial[zone] !== undefined) {
        initial[zone] += 1;
      }
    }
    return initial;
  }, [baseParaConteoZonas]);

  const handleOpenModal = (acompanante = null) => {
    if (acompanante) {
      setEditingAcompanante(acompanante);
      setFormData({
        nombre: acompanante.nombre,
        email: acompanante.email,
        telefono: acompanante.telefono,
        codigo: acompanante.codigo,
        disponibilidad: acompanante.disponibilidad,
        estado: acompanante.estado,
        tipoPerfil: acompanante.tipoPerfil || 'cuidador',
        estadoProceso: acompanante.estadoProceso || 'aprobado',
        provincia: acompanante.provincia || '',
        zona: acompanante.zona || '',
        zonaAmba: acompanante.zonaAmba || inferZonaAmba(acompanante.provincia, acompanante.zona) || '',
        zonasCobertura: acompanante.zonasCobertura || [],
        disponibilidadDias: acompanante.disponibilidadDias || [],
        disponibilidadTurnos: acompanante.disponibilidadTurnos || [],
        tarifaReferencia: acompanante.tarifaReferencia ?? '',
        avatar: acompanante.avatar || '',
        cvNombre: acompanante.cvNombre || '',
        cvMimeType: acompanante.cvMimeType || '',
        cvArchivo: acompanante.cvArchivo || '',
        bio: acompanante.bio || '',
        especialidades: acompanante.especialidades || [],
      });
    } else {
      setEditingAcompanante(null);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        codigo: '',
        disponibilidad: 'mañana y tarde',
        estado: 'activo',
        tipoPerfil: 'cuidador',
        estadoProceso: 'aprobado',
        provincia: '',
        zona: '',
        zonaAmba: '',
        zonasCobertura: [],
        disponibilidadDias: [],
        disponibilidadTurnos: [],
        tarifaReferencia: '',
        avatar: '',
        cvNombre: '',
        cvMimeType: '',
        cvArchivo: '',
        bio: '',
        especialidades: [],
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        especialidades: Array.isArray(formData.especialidades) ? formData.especialidades : [],
        zonasCobertura: Array.isArray(formData.zonasCobertura) ? formData.zonasCobertura : [],
        disponibilidadDias: Array.isArray(formData.disponibilidadDias) ? formData.disponibilidadDias : [],
        disponibilidadTurnos: Array.isArray(formData.disponibilidadTurnos) ? formData.disponibilidadTurnos : [],
        tarifaReferencia: formData.tarifaReferencia === '' ? null : Number(formData.tarifaReferencia),
        zonaAmba: formData.zonaAmba || inferZonaAmba(formData.provincia, formData.zona) || null,
      };
      if (editingAcompanante) {
        const updated = await adminApi.updateAcompanante(editingAcompanante.id, payload);
        setAcompanantes((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        showSuccess('Acompañante actualizado correctamente');
      } else {
        const created = await adminApi.createAcompanante(payload);
        setAcompanantes((prev) => [...prev, created]);
        showSuccess('Acompañante creado correctamente');
      }

      setShowModal(false);
    } catch (error) {
      showError(error.message || 'No se pudo guardar el acompañante');
    }
  };

  const toggleEstado = async (item) => {
    const nextEstado = item.estado === 'activo' ? 'inactivo' : 'activo';

    try {
      const updated = await adminApi.updateAcompanante(item.id, {
        ...item,
        estado: nextEstado,
      });

      setAcompanantes((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showSuccess(nextEstado === 'inactivo' ? 'Acompañante dado de baja' : 'Acompañante dado de alta');
    } catch (error) {
      showError(error.message || 'No se pudo cambiar el estado');
    }
  };

  const aprobarPerfil = async (item) => {
    try {
      const updated = await adminApi.updateAcompanante(item.id, {
        ...item,
        estado: 'activo',
        estadoProceso: 'aprobado',
      });
      setAcompanantes((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showSuccess('Perfil pasado a aprobados');
    } catch (error) {
      showError(error.message || 'No se pudo aprobar el perfil');
    }
  };

  const requestToggleEstado = (item) => {
    const nextEstado = item.estado === 'activo' ? 'inactivo' : 'activo';
    setConfirmEstadoModal({ item, nextEstado });
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Seleccioná un archivo de imagen válido.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((prev) => ({ ...prev, avatar: dataUrl }));
    } catch (error) {
      showError(error.message || 'No se pudo cargar la imagen');
    }
  };

  const handleCvFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      showError('Formato no soportado. Usá PDF, JPG, JPEG, PNG o Word.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((prev) => ({
        ...prev,
        cvNombre: file.name,
        cvMimeType: file.type,
        cvArchivo: dataUrl,
      }));
    } catch (error) {
      showError(error.message || 'No se pudo cargar el CV');
    }
  };

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/login');
  };

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
              <h1 className="text-xl font-bold text-dark">Acompañantes</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('activos')}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              viewMode === 'activos'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            Aprobados activos
          </button>
          <button
            type="button"
            onClick={() => setViewMode('base')}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              viewMode === 'base'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            Base de datos
          </button>
        </div>

        <Card className="bg-gradient-to-r from-sky-50 via-white to-indigo-50 border border-sky-200">
          <CardContent>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-slate-700">Cuidadores por zona</p>
              <button
                type="button"
                onClick={() => {
                  setFilterZonaAmba('');
                  setFilterProvincia('');
                }}
                className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              >
                Ver todas
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ZONA_AMBA_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setFilterZonaAmba(item.value);
                    setFilterProvincia(item.value === 'caba' ? 'CABA' : 'Buenos Aires');
                  }}
                  className={`text-left rounded-xl border px-3 py-2 transition-colors ${
                    filterZonaAmba === item.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-indigo-200 text-slate-700 hover:bg-indigo-50'
                  }`}
                >
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-lg font-bold">{conteoPorZonaAmba[item.value] || 0}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Buscar acompañante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/acompanantes/importar')}
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Importar CVs
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <select
            value={filterProvincia}
            onChange={(e) => setFilterProvincia(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-light-300 rounded-lg text-sm"
          >
            <option value="">Provincia (todas)</option>
            {PROVINCIAS_ARG.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
          <input
            list="zonas-predefinidas"
            value={filterZona}
            onChange={(e) => setFilterZona(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-light-300 rounded-lg text-sm"
            placeholder="Zona / Barrio / Partido"
          />
          <datalist id="zonas-predefinidas">
            {opcionesZona.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
          <select
            value={filterTipoPerfil}
            onChange={(e) => setFilterTipoPerfil(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-light-300 rounded-lg text-sm"
          >
            <option value="">Tipo perfil (todos)</option>
            {TIPO_PERFIL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filterZonaAmba}
            onChange={(e) => setFilterZonaAmba(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-light-300 rounded-lg text-sm"
          >
            <option value="">Zona AMBA (todas)</option>
            {ZONA_AMBA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filterEstadoProceso}
            onChange={(e) => setFilterEstadoProceso(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-light-300 rounded-lg text-sm"
          >
            <option value="">Estado proceso (todos)</option>
            {ESTADO_PROCESO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            value={filterEspecialidad}
            onChange={(e) => setFilterEspecialidad(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-light-300 rounded-lg text-sm md:col-span-2"
            placeholder="Especialidad"
          />
        </div>

        <div className="space-y-3">
          {filteredAcompanantes.length === 0 && (
            <Card>
              <CardContent>
                <p className="text-sm text-slate-500">Sin resultados para los filtros seleccionados.</p>
              </CardContent>
            </Card>
          )}
          {filteredAcompanantes.map((acompanante) => (
            <Card key={acompanante.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {acompanante.avatar ? (
                      <img
                        src={acompanante.avatar}
                        alt={acompanante.nombre}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-semibold">
                        {getInitials(acompanante.nombre)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-dark">{acompanante.nombre}</h3>
                        <Badge
                          variant={acompanante.estado === 'activo' ? 'success' : 'gray'}
                          size="sm"
                        >
                          {acompanante.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-dark-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {acompanante.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-dark-400">
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {acompanante.telefono}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1.5">
                        <span className="px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50">
                          {TIPO_PERFIL_OPTIONS.find((o) => o.value === acompanante.tipoPerfil)?.label || 'Perfil'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full border border-sky-200 bg-sky-50">
                          {(acompanante.provincia || 'Sin provincia')}{acompanante.zona ? ` · ${acompanante.zona}` : ''}
                        </span>
                        {(acompanante.zonaAmba || inferZonaAmba(acompanante.provincia, acompanante.zona)) && (
                          <span className="px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50">
                            {ZONA_AMBA_OPTIONS.find((z) => z.value === (acompanante.zonaAmba || inferZonaAmba(acompanante.provincia, acompanante.zona)))?.label || 'AMBA'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50">
                          {ESTADO_PROCESO_OPTIONS.find((o) => o.value === (acompanante.estadoProceso || 'aprobado'))?.label || 'Proceso'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {acompanante.cvArchivo && (
                      <a
                        href={acompanante.cvArchivo}
                        download={acompanante.cvNombre || `${acompanante.nombre}-cv`}
                        className="px-3 py-2 rounded-lg transition-colors text-sm font-medium inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        title="Descargar CV adjunto"
                      >
                        CV
                      </a>
                    )}
                    {acompanante.estadoProceso !== 'aprobado' && (
                      <button
                        onClick={() => aprobarPerfil(acompanante)}
                        className="px-3 py-2 rounded-lg transition-colors text-sm font-medium inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        title="Pasar a aprobado"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprobar
                      </button>
                    )}
                    <button
                      onClick={() => requestToggleEstado(acompanante)}
                      className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium inline-flex items-center gap-2 ${
                        acompanante.estado === 'activo'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                      title={acompanante.estado === 'activo' ? 'Eliminar' : 'Dar de alta'}
                    >
                      {acompanante.estado === 'activo' ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          Eliminar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Dar de alta
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenModal(acompanante)}
                      className="p-2 hover:bg-light-200 rounded-lg transition-colors"
                      title="Modificar acompañante"
                    >
                      <Pencil className="w-5 h-5 text-dark-400" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        isOpen={Boolean(confirmEstadoModal)}
        onClose={() => setConfirmEstadoModal(null)}
        title={confirmEstadoModal?.nextEstado === 'inactivo' ? 'Confirmar baja' : 'Confirmar alta'}
        size="sm"
      >
        <div className={`rounded-xl border p-3 ${
          confirmEstadoModal?.nextEstado === 'inactivo'
            ? 'border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-orange-50'
            : 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50'
        }`}>
          <p className="text-sm text-slate-700">
            {confirmEstadoModal?.nextEstado === 'inactivo'
              ? <>¿Querés dar de baja a <strong>{confirmEstadoModal?.item?.nombre}</strong>?</>
              : <>¿Querés dar de alta a <strong>{confirmEstadoModal?.item?.nombre}</strong>?</>}
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="ghost" fullWidth onClick={() => setConfirmEstadoModal(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={confirmEstadoModal?.nextEstado === 'inactivo' ? 'danger' : 'primary'}
            fullWidth
            onClick={async () => {
              try {
                if (confirmEstadoModal?.item) {
                  await toggleEstado(confirmEstadoModal.item);
                }
              } finally {
                setConfirmEstadoModal(null);
              }
            }}
          >
            {confirmEstadoModal?.nextEstado === 'inactivo' ? 'Eliminar' : 'Dar de alta'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAcompanante ? 'Editar acompañante' : 'Nuevo acompañante'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Teléfono"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            required
          />
          <Input
            label="Código de acceso"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            required
            helperText="Código numérico de 4 dígitos"
          />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Disponibilidad
            </label>
            <select
              value={formData.disponibilidad}
              onChange={(e) => setFormData({ ...formData, disponibilidad: e.target.value })}
              className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
            >
              <option value="mañana y tarde">Mañana y tarde</option>
              <option value="solo mañana">Solo mañana</option>
              <option value="solo tarde">Solo tarde</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Tipo de perfil</label>
              <select
                value={formData.tipoPerfil}
                onChange={(e) => setFormData({ ...formData, tipoPerfil: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
              >
                {TIPO_PERFIL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Estado de proceso</label>
              <select
                value={formData.estadoProceso}
                onChange={(e) => setFormData({ ...formData, estadoProceso: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
              >
                {ESTADO_PROCESO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Provincia</label>
              <select
                value={formData.provincia}
                onChange={(e) => setFormData({ ...formData, provincia: e.target.value, zona: '', zonaAmba: inferZonaAmba(e.target.value, '') })}
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
              >
                <option value="">Seleccionar provincia</option>
                {PROVINCIAS_ARG.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">{esCabaForm ? 'Barrio' : 'Zona / Partido'}</label>
              {opcionesZonaForm.length > 0 ? (
                <select
                  value={formData.zona}
                  onChange={(e) => {
                    const nextZona = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      zona: nextZona,
                      zonaAmba: inferZonaAmba(prev.provincia, nextZona),
                    }));
                  }}
                  className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
                >
                  <option value="">Seleccionar {esCabaForm ? 'barrio' : 'partido'}</option>
                  {opcionesZonaForm.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={formData.zona}
                  onChange={(e) => setFormData({ ...formData, zona: e.target.value, zonaAmba: '' })}
                  className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
                  placeholder="Zona / barrio / partido"
                />
              )}
            </div>
          </div>
          <Input
            label="Zonas de cobertura (separadas por coma)"
            value={(formData.zonasCobertura || []).join(', ')}
            onChange={(e) => setFormData({
              ...formData,
              zonasCobertura: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
            })}
          />
          <Input
            label="Especialidades (separadas por coma)"
            value={(formData.especialidades || []).join(', ')}
            onChange={(e) => setFormData({
              ...formData,
              especialidades: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
            })}
          />
          <Input
            label="Tarifa de referencia (opcional)"
            type="number"
            value={formData.tarifaReferencia}
            onChange={(e) => setFormData({ ...formData, tarifaReferencia: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="w-full px-4 py-2 bg-white border-2 border-light-300 rounded-xl text-dark"
            />
            {formData.avatar && (
              <div className="mt-3 flex items-center gap-3">
                <img src={formData.avatar} alt="Preview" className="w-14 h-14 rounded-full object-cover border border-light-300" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                >
                  Quitar foto
                </Button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">CV / Documento adjunto</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleCvFileChange}
              className="w-full px-4 py-2 bg-white border-2 border-light-300 rounded-xl text-dark"
            />
            {formData.cvArchivo && (
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={formData.cvArchivo}
                  download={formData.cvNombre || 'cv-adjunto'}
                  className="px-3 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 text-sm hover:bg-indigo-100"
                >
                  Descargar {formData.cvNombre || 'adjunto'}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, cvNombre: '', cvMimeType: '', cvArchivo: '' }))}
                >
                  Quitar documento
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth>
              {editingAcompanante ? 'Guardar cambios' : 'Crear acompañante'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Acompanantes;
