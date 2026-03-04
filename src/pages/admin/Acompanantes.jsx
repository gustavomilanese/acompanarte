import React, { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { Card, CardContent } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { adminApi } from '@/services/adminApi';
import { AdminQuickMenu } from '@/components/AdminQuickMenu';

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

const ZONA_AMBA_LABELS = Object.fromEntries(ZONA_AMBA_OPTIONS.map((item) => [item.value, item.label]));

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

const TIPO_PERFIL_LABELS = Object.fromEntries(TIPO_PERFIL_OPTIONS.map((item) => [item.value, item.label]));

const ESTADO_PROCESO_OPTIONS = [
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'en_evaluacion', label: 'En evaluación' },
  { value: 'base_datos', label: 'Base de datos' },
  { value: 'descartado', label: 'Descartado' },
];

const ESTADO_PROCESO_LABELS = Object.fromEntries(ESTADO_PROCESO_OPTIONS.map((item) => [item.value, item.label]));

const DISPONIBILIDAD_OPTIONS = [
  { value: 'mañana y tarde', label: 'Mañana y tarde' },
  { value: 'solo mañana', label: 'Solo mañana' },
  { value: 'solo tarde', label: 'Solo tarde' },
];

const ACOMPANANTES_PAGE_SIZE = 40;

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

function getEmptyAcompananteFormData(viewMode = 'activos') {
  const isBaseView = viewMode === 'base';

  return {
    nombre: '',
    email: '',
    telefono: '',
    codigo: '',
    disponibilidad: 'mañana y tarde',
    estado: isBaseView ? 'inactivo' : 'activo',
    tipoPerfil: 'cuidador',
    estadoProceso: isBaseView ? 'base_datos' : 'aprobado',
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
  };
}

function getEmptyAcompananteAssetState() {
  return {
    hasAvatar: false,
    hasCv: false,
    currentCvNombre: '',
    avatarMode: 'keep',
    cvMode: 'keep',
  };
}

function mapAcompananteToFormData(acompanante) {
  return {
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
    cvNombre: '',
    cvMimeType: '',
    cvArchivo: '',
    bio: acompanante.bio || '',
    especialidades: acompanante.especialidades || [],
  };
}

function buildAcompanantePayload(formData, assetState) {
  const payload = {
    nombre: formData.nombre,
    email: formData.email,
    telefono: formData.telefono,
    codigo: formData.codigo,
    disponibilidad: formData.disponibilidad,
    estado: formData.estado,
    tipoPerfil: formData.tipoPerfil || 'cuidador',
    estadoProceso: formData.estadoProceso || 'aprobado',
    provincia: formData.provincia || null,
    zona: formData.zona || null,
    zonaAmba: formData.zonaAmba || inferZonaAmba(formData.provincia, formData.zona) || null,
    zonasCobertura: Array.isArray(formData.zonasCobertura) ? formData.zonasCobertura : [],
    disponibilidadDias: Array.isArray(formData.disponibilidadDias) ? formData.disponibilidadDias : [],
    disponibilidadTurnos: Array.isArray(formData.disponibilidadTurnos) ? formData.disponibilidadTurnos : [],
    tarifaReferencia: formData.tarifaReferencia === '' ? null : Number(formData.tarifaReferencia),
    bio: formData.bio || null,
    especialidades: Array.isArray(formData.especialidades) ? formData.especialidades : [],
  };

  if (assetState.avatarMode === 'replace') {
    payload.avatar = formData.avatar || null;
  } else if (assetState.avatarMode === 'remove') {
    payload.avatar = null;
  }

  if (assetState.cvMode === 'replace') {
    payload.cvNombre = formData.cvNombre || null;
    payload.cvMimeType = formData.cvMimeType || null;
    payload.cvArchivo = formData.cvArchivo || null;
  } else if (assetState.cvMode === 'remove') {
    payload.cvNombre = null;
    payload.cvMimeType = null;
    payload.cvArchivo = null;
  }

  return payload;
}

export function Acompanantes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  const [acompanantes, setAcompanantes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('activos');
  const [filterZonaAmba, setFilterZonaAmba] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAcompanante, setEditingAcompanante] = useState(null);
  const [downloadingCvId, setDownloadingCvId] = useState('');
  const [loadingEditId, setLoadingEditId] = useState('');
  const [confirmEstadoModal, setConfirmEstadoModal] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ACOMPANANTES_PAGE_SIZE);
  const latestListRequestRef = useRef(0);
  const acompanantesCacheRef = useRef({ activos: null, base: null });

  const [formData, setFormData] = useState(getEmptyAcompananteFormData);
  const [assetState, setAssetState] = useState(getEmptyAcompananteAssetState);

  const provinciaNormalizadaForm = String(formData.provincia || '').trim().toLowerCase();
  const esCabaForm = provinciaNormalizadaForm === 'caba';
  const esBuenosAiresForm = provinciaNormalizadaForm === 'buenos aires' || provinciaNormalizadaForm === 'provincia de buenos aires';
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredFilterZonaAmba = useDeferredValue(filterZonaAmba);

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
    const query = params.get('q') || '';
    const zonaAmba = params.get('zonaAmba') || '';
    const fallbackQuery = [provincia, zona, tipo, especialidad].filter(Boolean).join(' ');
    setSearchQuery(query || fallbackQuery);
    if (zonaAmba) {
      setFilterZonaAmba(
        zonaAmba
          .split(',')
          .map((z) => z.trim())
          .filter(Boolean)
      );
    }
    if (provincia || zona || tipo || especialidad || zonaAmba || query) {
      setViewMode('base');
    }
  }, [location.search]);

  const loadAcompanantes = useCallback(async (scope = 'activos') => {
    const normalizedScope = scope === 'base' ? 'base' : 'activos';
    const cached = acompanantesCacheRef.current[normalizedScope];
    if (cached) {
      setAcompanantes(cached);
      return cached;
    }

    const requestId = latestListRequestRef.current + 1;
    latestListRequestRef.current = requestId;
    setIsLoadingList(true);
    try {
      const data = await adminApi.getAcompanantes(normalizedScope);
      if (latestListRequestRef.current === requestId) {
        setAcompanantes(data);
      }
      acompanantesCacheRef.current[normalizedScope] = data;
      return data;
    } catch (error) {
      if (latestListRequestRef.current === requestId) {
        showError(error.message || 'No se pudieron cargar los acompañantes');
      }
      throw error;
    } finally {
      if (latestListRequestRef.current === requestId) {
        setIsLoadingList(false);
      }
    }
  }, [showError]);

  useEffect(() => {
    loadAcompanantes(viewMode);
  }, [loadAcompanantes, viewMode]);

  useEffect(() => {
    const otherScope = viewMode === 'activos' ? 'base' : 'activos';
    if (acompanantesCacheRef.current[otherScope]) return;

    let cancelled = false;

    adminApi.getAcompanantes(otherScope)
      .then((data) => {
        if (!cancelled) {
          acompanantesCacheRef.current[otherScope] = data;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [viewMode]);

  const invalidateAcompanantesCache = useCallback(() => {
    acompanantesCacheRef.current = { activos: null, base: null };
  }, []);

  const indexedAcompanantes = useMemo(() => acompanantes.map((a) => {
    const resolvedZonaAmba = a.zonaAmba || inferZonaAmba(a.provincia, a.zona);
    const zonaAmbaLabel = ZONA_AMBA_LABELS[resolvedZonaAmba] || '';
    const tipoPerfilLabel = TIPO_PERFIL_LABELS[a.tipoPerfil] || 'Perfil';
    const estadoProcesoKey = a.estadoProceso || 'aprobado';
    const estadoProcesoLabel = ESTADO_PROCESO_LABELS[estadoProcesoKey] || 'Proceso';

    return {
      ...a,
      resolvedZonaAmba,
      zonaAmbaLabel,
      tipoPerfilLabel,
      estadoProcesoLabel,
      searchIndex: [
        a.nombre,
        a.email,
        a.telefono,
        a.codigo,
        a.zona,
        a.provincia,
        a.tipoPerfil,
        tipoPerfilLabel,
        resolvedZonaAmba,
        zonaAmbaLabel,
        estadoProcesoKey,
        estadoProcesoLabel,
        ...(Array.isArray(a.especialidades) ? a.especialidades : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    };
  }), [acompanantes]);

  const filteredAcompanantes = useMemo(() => {
    const text = deferredSearchQuery.toLowerCase();

    return indexedAcompanantes.filter((a) => {
      if (deferredFilterZonaAmba.length > 0 && !deferredFilterZonaAmba.includes(a.resolvedZonaAmba)) return false;
      if (!text) return true;
      return a.searchIndex.includes(text);
    });
  }, [
    indexedAcompanantes,
    deferredSearchQuery,
    deferredFilterZonaAmba,
  ]);

  const baseParaConteoZonas = indexedAcompanantes;

  const conteoPorZonaAmba = useMemo(() => {
    const initial = { caba: 0, zona_norte: 0, zona_sur: 0, zona_oeste: 0 };
    for (const item of baseParaConteoZonas) {
      if (item.resolvedZonaAmba && initial[item.resolvedZonaAmba] !== undefined) {
        initial[item.resolvedZonaAmba] += 1;
      }
    }
    return initial;
  }, [baseParaConteoZonas]);

  const isFilterTransitionPending = deferredSearchQuery !== searchQuery || deferredFilterZonaAmba !== filterZonaAmba;
  const publicSignupLink = `${window.location.origin}/postulate-cuidador`;
  const visibleAcompanantes = useMemo(
    () => filteredAcompanantes.slice(0, visibleCount),
    [filteredAcompanantes, visibleCount],
  );
  const hasMoreAcompanantes = filteredAcompanantes.length > visibleCount;

  useEffect(() => {
    setVisibleCount(ACOMPANANTES_PAGE_SIZE);
  }, [viewMode, deferredSearchQuery, deferredFilterZonaAmba, acompanantes.length]);

  const closeModal = () => {
    setShowModal(false);
    setEditingAcompanante(null);
    setFormData(getEmptyAcompananteFormData(viewMode));
    setAssetState(getEmptyAcompananteAssetState());
    setLoadingEditId('');
  };

  const handleOpenModal = async (acompanante = null) => {
    if (!acompanante) {
      setEditingAcompanante(null);
      setFormData(getEmptyAcompananteFormData(viewMode));
      setAssetState(getEmptyAcompananteAssetState());
      setShowModal(true);
      return;
    }

    setLoadingEditId(acompanante.id);
    try {
      const detail = await adminApi.getAcompanante(acompanante.id);
      const nextAcompanante = { ...acompanante, ...detail };
      setEditingAcompanante(nextAcompanante);
      setFormData(mapAcompananteToFormData(nextAcompanante));
      setAssetState({
        hasAvatar: Boolean(nextAcompanante.hasAvatar),
        hasCv: Boolean(nextAcompanante.hasCvArchivo),
        currentCvNombre: nextAcompanante.cvNombre || '',
        avatarMode: 'keep',
        cvMode: 'keep',
      });
      setShowModal(true);
    } catch (error) {
      showError(error.message || 'No se pudo abrir el acompañante');
    } finally {
      setLoadingEditId('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const currentViewMode = viewMode;

    try {
      const payload = buildAcompanantePayload(formData, assetState);
      invalidateAcompanantesCache();

      if (editingAcompanante) {
        await adminApi.updateAcompanante(editingAcompanante.id, payload);
        showSuccess('Acompañante actualizado correctamente');
      } else {
        await adminApi.createAcompanante(payload);
        showSuccess('Acompañante creado correctamente');
      }

      closeModal();
      await loadAcompanantes(currentViewMode);
    } catch (error) {
      showError(error.message || 'No se pudo guardar el acompañante');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEstado = async (item) => {
    const nextEstado = item.estado === 'activo' ? 'inactivo' : 'activo';
    const currentViewMode = viewMode;

    try {
      invalidateAcompanantesCache();
      if (nextEstado === 'inactivo') {
        await adminApi.deleteAcompanante(item.id);
        showSuccess('Acompañante eliminado');
        await loadAcompanantes(currentViewMode);
        return;
      }

      await adminApi.updateAcompanante(item.id, { estado: nextEstado });
      showSuccess('Acompañante dado de alta');
      await loadAcompanantes(currentViewMode);
    } catch (error) {
      showError(error.message || 'No se pudo cambiar el estado');
    }
  };

  const aprobarPerfil = async (item) => {
    const currentViewMode = viewMode;

    try {
      invalidateAcompanantesCache();
      await adminApi.updateAcompanante(item.id, {
        estado: 'activo',
        estadoProceso: 'aprobado',
      });
      showSuccess('Perfil pasado a aprobados');
      await loadAcompanantes(currentViewMode);
    } catch (error) {
      showError(error.message || 'No se pudo aprobar el perfil');
    }
  };

  const requestToggleEstado = (item, forcedNextEstado = null) => {
    const nextEstado = forcedNextEstado || (item.estado === 'activo' ? 'inactivo' : 'activo');
    setDeleteConfirmText('');
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
      setAssetState((prev) => ({ ...prev, avatarMode: 'replace' }));
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
      setAssetState((prev) => ({ ...prev, cvMode: 'replace' }));
    } catch (error) {
      showError(error.message || 'No se pudo cargar el CV');
    }
  };

  const handleAvatarRemove = () => {
    setFormData((prev) => ({ ...prev, avatar: '' }));
    setAssetState((prev) => ({
      ...prev,
      avatarMode: editingAcompanante && prev.hasAvatar ? 'remove' : 'keep',
    }));
  };

  const handleCvRemove = () => {
    setFormData((prev) => ({ ...prev, cvNombre: '', cvMimeType: '', cvArchivo: '' }));
    setAssetState((prev) => ({
      ...prev,
      cvMode: editingAcompanante && prev.hasCv ? 'remove' : 'keep',
    }));
  };

  const handleDownloadCv = async (acompanante) => {
    setDownloadingCvId(acompanante.id);
    try {
      const detail = await adminApi.getAcompananteCv(acompanante.id);

      const link = document.createElement('a');
      link.href = detail.cvArchivo;
      link.download = detail.cvNombre || `${detail.nombre}-cv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showError(error.message || 'No se pudo descargar el CV');
    } finally {
      setDownloadingCvId('');
    }
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
            <AdminQuickMenu />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('activos')}
            disabled={isLoadingList && viewMode !== 'activos'}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              viewMode === 'activos'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-slate-600 border-slate-300'
            } ${isLoadingList && viewMode !== 'activos' ? 'opacity-60 cursor-wait' : ''}`}
          >
            Aprobados activos
          </button>
          <button
            type="button"
            onClick={() => setViewMode('base')}
            disabled={isLoadingList && viewMode !== 'base'}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              viewMode === 'base'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-slate-600 border-slate-300'
            } ${isLoadingList && viewMode !== 'base' ? 'opacity-60 cursor-wait' : ''}`}
          >
            Base de datos
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="ml-auto text-xs px-3 py-1.5 rounded-full border bg-sky-600 text-white border-sky-600 hover:bg-sky-700"
            title="Nuevo acompañante"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <Card className="bg-gradient-to-r from-sky-50 via-white to-indigo-50 border border-sky-200">
          <CardContent>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-slate-700">Cuidadores por zona</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ZONA_AMBA_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setFilterZonaAmba((prev) =>
                        prev.includes(item.value)
                          ? prev.filter((z) => z !== item.value)
                          : [...prev, item.value]
                      );
                    });
                  }}
                  className={`text-left rounded-xl border px-3 py-2 transition-colors ${
                    filterZonaAmba.includes(item.value)
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
              placeholder="Buscar por zona, barrio, especialidad, nombre o tipo de perfil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setFilterZonaAmba([]);
                }
              }}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(publicSignupLink);
                showSuccess('Link público copiado');
              } catch {
                showError(`No se pudo copiar. Link: ${publicSignupLink}`);
              }
            }}
            className="shrink-0 px-3 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            title="Copiar link público para postulación"
          >
            Copiar link de postulación
          </button>
        </div>

        {isFilterTransitionPending && (
          <p className="text-xs text-slate-500 -mt-1">Actualizando filtros...</p>
        )}

        <div className="space-y-3">
          {isLoadingList && (
            <Card>
              <CardContent>
                <p className="text-sm text-slate-500">Cargando acompañantes...</p>
              </CardContent>
            </Card>
          )}
          {!isLoadingList && filteredAcompanantes.length === 0 && (
            <Card>
              <CardContent>
                <p className="text-sm text-slate-500">Sin resultados para los filtros seleccionados.</p>
              </CardContent>
            </Card>
          )}
          {!isLoadingList && filteredAcompanantes.length > 0 && (
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500 px-1">
              <span>Mostrando {visibleAcompanantes.length} de {filteredAcompanantes.length} cuidadores</span>
            </div>
          )}
          {!isLoadingList && visibleAcompanantes.map((acompanante) => (
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
                          {acompanante.tipoPerfilLabel || 'Perfil'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full border border-sky-200 bg-sky-50">
                          {(acompanante.provincia || 'Sin provincia')}{acompanante.zona ? ` · ${acompanante.zona}` : ''}
                        </span>
                        {acompanante.resolvedZonaAmba && (
                          <span className="px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50">
                            {acompanante.zonaAmbaLabel || 'AMBA'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50">
                          {acompanante.estadoProcesoLabel || 'Proceso'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(acompanante.hasCvArchivo || acompanante.cvArchivo) && (
                      <button
                        type="button"
                        onClick={() => handleDownloadCv(acompanante)}
                        className="px-3 py-2 rounded-lg transition-colors text-sm font-medium inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        title="Descargar CV adjunto"
                        disabled={downloadingCvId === acompanante.id}
                      >
                        {downloadingCvId === acompanante.id ? 'Descargando...' : 'CV'}
                      </button>
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
                    {viewMode === 'base' ? (
                      <button
                        onClick={() => requestToggleEstado(acompanante, 'inactivo')}
                        className="px-3 py-2 rounded-lg transition-colors text-sm font-medium inline-flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200"
                        title="Dar de baja"
                      >
                        <XCircle className="w-4 h-4" />
                        Dar de baja
                      </button>
                    ) : (
                      <button
                        onClick={() => requestToggleEstado(acompanante)}
                        className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium inline-flex items-center gap-2 ${
                          acompanante.estado === 'activo'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                        title={acompanante.estado === 'activo' ? 'Dar de baja' : 'Dar de alta'}
                      >
                        {acompanante.estado === 'activo' ? (
                          <>
                            <XCircle className="w-4 h-4" />
                            Dar de baja
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Dar de alta
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenModal(acompanante)}
                      disabled={loadingEditId === acompanante.id}
                      className="p-2 hover:bg-light-200 rounded-lg transition-colors"
                      title="Modificar acompañante"
                    >
                      {loadingEditId === acompanante.id ? (
                        <span className="text-xs text-dark-400">...</span>
                      ) : (
                        <Pencil className="w-5 h-5 text-dark-400" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!isLoadingList && hasMoreAcompanantes && (
            <Card>
              <CardContent>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + ACOMPANANTES_PAGE_SIZE)}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Mostrar más
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={Boolean(confirmEstadoModal)}
        onClose={() => {
          setConfirmEstadoModal(null);
          setDeleteConfirmText('');
        }}
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
          {confirmEstadoModal?.nextEstado === 'inactivo' && (
            <div className="mt-3">
              <p className="text-xs text-slate-600 mb-1.5">
                Para confirmar, escribí <strong>ELIMINAR</strong>.
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm"
                placeholder="ELIMINAR"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => {
              setConfirmEstadoModal(null);
              setDeleteConfirmText('');
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={confirmEstadoModal?.nextEstado === 'inactivo' ? 'danger' : 'primary'}
            fullWidth
            disabled={confirmEstadoModal?.nextEstado === 'inactivo' && deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR'}
            onClick={async () => {
              try {
                if (confirmEstadoModal?.item) {
                  await toggleEstado(confirmEstadoModal.item);
                }
              } finally {
                setConfirmEstadoModal(null);
                setDeleteConfirmText('');
              }
            }}
          >
            {confirmEstadoModal?.nextEstado === 'inactivo' ? 'Dar de baja' : 'Dar de alta'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
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
              {!DISPONIBILIDAD_OPTIONS.some((option) => option.value === formData.disponibilidad) && formData.disponibilidad && (
                <option value={formData.disponibilidad}>{formData.disponibilidad}</option>
              )}
              {DISPONIBILIDAD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
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
            {formData.avatar ? (
              <div className="mt-3 flex items-center gap-3">
                <img src={formData.avatar} alt="Preview" className="w-14 h-14 rounded-full object-cover border border-light-300" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAvatarRemove}
                >
                  Quitar foto
                </Button>
              </div>
            ) : (editingAcompanante && assetState.hasAvatar && assetState.avatarMode === 'keep') ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
                <p className="text-sm text-sky-800">La foto actual se mantiene guardada.</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAvatarRemove}
                >
                  Quitar foto
                </Button>
              </div>
            ) : null}
            {editingAcompanante && assetState.hasAvatar && assetState.avatarMode === 'remove' && (
              <p className="mt-2 text-xs text-red-600">La foto actual se eliminará al guardar.</p>
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
            {formData.cvArchivo ? (
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
                  onClick={handleCvRemove}
                >
                  Quitar documento
                </Button>
              </div>
            ) : (editingAcompanante && assetState.hasCv && assetState.cvMode === 'keep') ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
                <p className="text-sm text-indigo-800">CV actual: {assetState.currentCvNombre || 'adjunto cargado'}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadCv(editingAcompanante)}
                >
                  Descargar actual
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCvRemove}
                >
                  Quitar documento
                </Button>
              </div>
            ) : null}
            {editingAcompanante && assetState.hasCv && assetState.cvMode === 'remove' && (
              <p className="mt-2 text-xs text-red-600">El CV actual se eliminará al guardar.</p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={closeModal}
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth disabled={isSaving}>
              {isSaving ? 'Guardando...' : (editingAcompanante ? 'Guardar cambios' : 'Crear acompañante')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Acompanantes;
