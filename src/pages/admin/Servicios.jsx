import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Clock3, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/Toast';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { adminApi } from '@/services/adminApi';
import { AdminQuickMenu } from '@/components/AdminQuickMenu';

const STATUS_OPTIONS = ['todos', 'en_curso', 'pausado', 'pendiente', 'completado', 'cancelado', 'no_pago'];

const STATUS_LABEL = {
  todos: 'Todos',
  en_curso: 'En curso',
  pausado: 'Pausado',
  pendiente: 'Pendiente',
  completado: 'Completado',
  cancelado: 'Cancelado',
  no_pago: 'No pago mes actual',
};

const EXTRA_HOURS_CATEGORY = 'horas_extra';
const EXTRA_HOURS_AGGREGATE_PREFIX = '[#EXH_AGG:v1]';

function badgeByStatus(status) {
  const by = {
    en_curso: 'bg-emerald-500 text-white border-emerald-500',
    pausado: 'bg-amber-100 text-amber-700 border-amber-200',
    pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    completado: 'bg-blue-100 text-blue-700 border-blue-200',
    cancelado: 'bg-red-100 text-red-700 border-red-200',
  };
  return by[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

function prettyStatus(status) {
  if (status === 'en_curso') return 'En curso';
  if (status === 'pausado') return 'Pausado';
  if (status === 'pendiente') return 'Pendiente';
  if (status === 'completado') return 'Completado';
  if (status === 'cancelado') return 'Cancelado';
  return status || 'Sin estado';
}

function prettyEvent(event) {
  const byType = {
    created: 'Servicio creado',
    paused: 'Servicio pausado',
    resumed: 'Servicio reanudado',
    assignment_changed: 'Asignación modificada',
  };
  const base = byType[event.tipo] || 'Actualización de servicio';
  if (event.estadoDesde && event.estadoHasta) {
    return `${base}: ${prettyStatus(event.estadoDesde)} -> ${prettyStatus(event.estadoHasta)}`;
  }
  return base;
}

function detailPanelByStatus(status) {
  const by = {
    en_curso: 'border-emerald-300 bg-gradient-to-r from-emerald-100 via-white to-teal-100',
    pendiente: 'border-amber-300 bg-gradient-to-r from-amber-100 via-white to-yellow-100',
    pausado: 'border-slate-300 bg-gradient-to-r from-slate-100 via-white to-zinc-100',
    cancelado: 'border-red-300 bg-gradient-to-r from-red-100 via-white to-rose-100',
    completado: 'border-blue-300 bg-gradient-to-r from-blue-100 via-white to-indigo-100',
  };
  return by[status] || 'border-sky-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50';
}

function operationsPanelByStatus(status) {
  const by = {
    en_curso: 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50',
    pendiente: 'border-amber-200 bg-gradient-to-r from-amber-50 via-white to-yellow-50',
    pausado: 'border-slate-200 bg-gradient-to-r from-slate-50 via-white to-zinc-50',
    cancelado: 'border-red-200 bg-gradient-to-r from-red-50 via-white to-rose-50',
    completado: 'border-blue-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50',
  };
  return by[status] || 'border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50';
}

function decodeBase64ToText(base64Text) {
  const normalized = String(base64Text || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function parseExtraHoursAggregateNotes(notes) {
  const raw = String(notes || '').trim();
  if (!raw) return null;
  const markerIndex = raw.indexOf(EXTRA_HOURS_AGGREGATE_PREFIX);
  if (markerIndex < 0) return null;
  const encoded = raw.slice(markerIndex + EXTRA_HOURS_AGGREGATE_PREFIX.length).trim();
  if (!encoded) return null;

  try {
    const decoded = decodeBase64ToText(encoded);
    const payload = JSON.parse(decoded);
    if (!payload || payload.kind !== 'extra_hours_aggregate') return null;
    return payload;
  } catch {
    return null;
  }
}

function normalizeExtraHoursDetails(details) {
  if (!Array.isArray(details)) return [];
  return details
    .map((item, idx) => {
      if (!item || typeof item !== 'object') return null;
      const horas = Number(item.horas);
      const montoCobro = Number(item.montoCobro);
      const montoPago = Number(item.montoPago);
      const fechaValue = item.fecha ? new Date(item.fecha) : null;
      const fecha = fechaValue && !Number.isNaN(fechaValue.getTime())
        ? fechaValue.toISOString().slice(0, 10)
        : null;
      return {
        id: String(item.id || `det-${idx + 1}`),
        fecha,
        horas: Number.isFinite(horas) ? horas : null,
        montoCobro: Number.isFinite(montoCobro) ? montoCobro : 0,
        montoPago: Number.isFinite(montoPago) ? montoPago : 0,
        concepto: String(item.concepto || '').trim(),
      };
    })
    .filter(Boolean);
}

function parseExtraHoursInfo(mov) {
  const aggregate = parseExtraHoursAggregateNotes(mov?.notas);
  if (aggregate) {
    const details = normalizeExtraHoursDetails(aggregate.detalles);
    const totalHoras = details.reduce((acc, item) => acc + (Number.isFinite(item.horas) ? Number(item.horas) : 0), 0);
    const month = Number(aggregate.month || mov?.month || 0) || null;
    const year = Number(aggregate.year || mov?.year || 0) || null;
    const caregiverId = aggregate.caregiverId || mov?.caregiverId || null;
    const caregiverNombre = aggregate.caregiverNombre || mov?.caregiver?.nombre || null;

    return {
      isAggregate: true,
      aggregate,
      key: `${caregiverId || 'sin-cuidador'}:${year || 0}:${month || 0}`,
      caregiverId,
      caregiverNombre,
      year,
      month,
      totalHoras,
      details,
      lastDetail: details[details.length - 1] || null,
    };
  }

  const raw = String(mov?.notas || '').trim();
  const refMatch = raw.match(/\[#EXH:([^\]]+)\]/i);
  const match = raw.match(/horas?\s+extra:\s*([\d.,]+)\s*hs?/i) || raw.match(/([\d.,]+)\s*hs?\s*extra/i);
  const genericMatch = raw.match(/([\d.,]+)\s*hs/i);
  const hours = (match || genericMatch) ? Number(String((match || genericMatch)[1]).replace(',', '.')) : null;
  let detail = raw.replace(/\[#EXH:[^\]]+\]\s*/i, '');
  if (match || genericMatch) {
    detail = detail.replace((match || genericMatch)[0], '').replace(/^[·:,\-\s]+/, '').trim();
  }
  return {
    isAggregate: false,
    ref: refMatch?.[1] || null,
    key: refMatch?.[1] ? `ref:${refMatch[1]}` : `${mov?.id || 'legacy'}:${mov?.createdAt || mov?.fecha || ''}`,
    caregiverId: mov?.caregiverId || null,
    caregiverNombre: mov?.caregiver?.nombre || null,
    year: Number(mov?.year || 0) || null,
    month: Number(mov?.month || 0) || null,
    totalHoras: Number.isFinite(hours) ? hours : 0,
    details: [],
    lastDetail: detail ? { concepto: detail } : null,
  };
}

export function Servicios() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  const [servicios, setServicios] = useState([]);
  const [movimientosFinanzas, setMovimientosFinanzas] = useState([]);
  const [cuidadores, setCuidadores] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleDraft, setRoleDraft] = useState('');
  const [extraHoursEditorOpen, setExtraHoursEditorOpen] = useState(false);
  const [extraHoursForm, setExtraHoursForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    caregiverId: '',
    horas: '',
    valorHoraCobro: '',
    valorHoraPago: '',
    notas: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    tipo: 'caregiver',
    caregiverId: '',
    nombreManual: '',
    rol: '',
  });
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [pendingDetailType, setPendingDetailType] = useState('');
  const [extraHoursExpandedKey, setExtraHoursExpandedKey] = useState('');

  const cuidadoresAsignadosEnServicio = useMemo(() => {
    if (!selectedDetail) return [];
    const fromAssignments = (selectedDetail.assignments || [])
      .filter((a) => a.tipo === 'caregiver' && a.activo && a.caregiver?.id)
      .map((a) => ({ id: a.caregiver.id, nombre: a.caregiver.nombre || 'Cuidador' }));

    const unique = new Map(fromAssignments.map((c) => [c.id, c]));
    if (selectedDetail.cuidadorId && !unique.has(selectedDetail.cuidadorId)) {
      unique.set(selectedDetail.cuidadorId, {
        id: selectedDetail.cuidadorId,
        nombre: selectedDetail.cuidador?.nombre || 'Cuidador',
      });
    }
    return [...unique.values()];
  }, [selectedDetail]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [serviciosData, cuidadoresData, movimientosData] = await Promise.all([
        adminApi.getServiciosModulo(),
        adminApi.getAcompanantes(),
        adminApi.getFinanzasMovimientos(),
      ]);
      setServicios(serviciosData.filter((s) => s.estado !== 'cancelado'));
      setCuidadores(cuidadoresData.filter((c) => c.estado === 'activo'));
      setMovimientosFinanzas(Array.isArray(movimientosData) ? movimientosData : []);
    } catch (error) {
      showError(error.message || 'No se pudo cargar el módulo de servicios');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    if (!id) return;
    try {
      const detail = await adminApi.getServicioModulo(id);
      setSelectedDetail(detail);
    } catch (error) {
      showError(error.message || 'No se pudo cargar el detalle del servicio');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const qsId = new URLSearchParams(location.search).get('serviceId');
    if (qsId) {
      setSelectedId(qsId);
      return;
    }
    if (!selectedId && servicios.length > 0) {
      setSelectedId(servicios[0].id);
    }
  }, [location.search, servicios, selectedId]);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    setActionsMenuOpen(false);
    setPendingDetailType('');
    setExtraHoursExpandedKey('');
  }, [selectedId]);

  useEffect(() => {
    if (!extraHoursEditorOpen || cuidadoresAsignadosEnServicio.length === 0) return;
    setExtraHoursForm((prev) => {
      if (prev.caregiverId) return prev;
      return { ...prev, caregiverId: cuidadoresAsignadosEnServicio[0].id };
    });
  }, [extraHoursEditorOpen, cuidadoresAsignadosEnServicio]);

  const serviciosFiltrados = useMemo(() => {
    if (statusFilter === 'todos') return servicios;
    if (statusFilter === 'no_pago') {
      return servicios.filter((s) => s.currentMonthPayment?.estado !== 'pagado');
    }
    return servicios.filter((s) => s.estado === statusFilter);
  }, [servicios, statusFilter]);

  const extraHoursServicio = useMemo(() => {
    if (!selectedDetail) return [];
    const extraCobrosByKey = new Map();
    movimientosFinanzas
      .filter((m) => m.tipo === 'cobro' && m.serviceId === selectedDetail.id && m.categoria === EXTRA_HOURS_CATEGORY)
      .forEach((mov) => {
        const extraInfo = parseExtraHoursInfo(mov);
        const pairKey = extraInfo.key;
        if (!pairKey) return;
        const prev = extraCobrosByKey.get(pairKey);
        if (!prev) {
          extraCobrosByKey.set(pairKey, { ...mov, extraInfo, pairKey });
          return;
        }
        const prevDate = new Date(prev.updatedAt || prev.createdAt || prev.fecha || 0).getTime();
        const nextDate = new Date(mov.updatedAt || mov.createdAt || mov.fecha || 0).getTime();
        if (nextDate >= prevDate) {
          extraCobrosByKey.set(pairKey, { ...mov, extraInfo, pairKey });
        }
      });
    const extraCobros = [...extraCobrosByKey.values()];

    const pagosByRef = new Map();
    movimientosFinanzas
      .filter((m) => m.tipo === 'pago' && m.serviceId === selectedDetail.id && m.categoria === EXTRA_HOURS_CATEGORY)
      .forEach((mov) => {
        const info = parseExtraHoursInfo(mov);
        const key = info.key || (info.ref ? `ref:${info.ref}` : null);
        if (key) pagosByRef.set(key, { ...mov, extraInfo: info });
      });

    return extraCobros
      .map((cobro) => {
        const pairedPago = pagosByRef.get(cobro.pairKey) || null;
        return {
          ref: cobro.pairKey || cobro.id,
          cobro,
          pago: pairedPago || null,
          info: cobro.extraInfo,
        };
      })
      .sort((a, b) => new Date(b.cobro.fecha || b.cobro.createdAt || 0) - new Date(a.cobro.fecha || a.cobro.createdAt || 0));
  }, [selectedDetail, movimientosFinanzas]);

  const extraHoursPreview = useMemo(() => {
    const horas = Number(extraHoursForm.horas);
    const valorHoraCobro = Number(extraHoursForm.valorHoraCobro);
    const valorHoraPago = Number(extraHoursForm.valorHoraPago);
    const totalCobro = Number.isFinite(horas) && Number.isFinite(valorHoraCobro) ? horas * valorHoraCobro : 0;
    const totalPago = Number.isFinite(horas) && Number.isFinite(valorHoraPago) ? horas * valorHoraPago : 0;
    return {
      horas: Number.isFinite(horas) ? horas : 0,
      totalCobro: Number(totalCobro.toFixed(2)),
      totalPago: Number(totalPago.toFixed(2)),
    };
  }, [extraHoursForm.horas, extraHoursForm.valorHoraCobro, extraHoursForm.valorHoraPago]);

  const movimientosServicioPendientes = useMemo(() => {
    if (!selectedDetail) return { cobros: [], pagos: [] };
    const isPending = (estado) => String(estado || '').toLowerCase() === 'pendiente';
    const serviceMovements = movimientosFinanzas.filter((m) => m.serviceId === selectedDetail.id);
    return {
      cobros: serviceMovements
        .filter((m) => m.tipo === 'cobro' && isPending(m.estado))
        .sort((a, b) => new Date(b.fecha || b.createdAt || 0) - new Date(a.fecha || a.createdAt || 0)),
      pagos: serviceMovements
        .filter((m) => m.tipo === 'pago' && isPending(m.estado))
        .sort((a, b) => new Date(b.fecha || b.createdAt || 0) - new Date(a.fecha || a.createdAt || 0)),
    };
  }, [selectedDetail, movimientosFinanzas]);

  const pendientesCobroTotal = useMemo(
    () => movimientosServicioPendientes.cobros.reduce((acc, mov) => acc + Number(mov.monto || 0), 0),
    [movimientosServicioPendientes]
  );

  const pendientesPagoTotal = useMemo(
    () => movimientosServicioPendientes.pagos.reduce((acc, mov) => acc + Number(mov.monto || 0), 0),
    [movimientosServicioPendientes]
  );

  const refreshAll = async () => {
    await loadData();
    if (selectedId) await loadDetail(selectedId);
  };

  const resetExtraHoursForm = () => {
    setExtraHoursForm({
      fecha: new Date().toISOString().slice(0, 10),
      caregiverId: '',
      horas: '',
      valorHoraCobro: '',
      valorHoraPago: '',
      notas: '',
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({ tipo: 'caregiver', caregiverId: '', nombreManual: '', rol: '' });
  };

  const formatPeriodo = (mov) => {
    if (mov.periodType === 'week') {
      return `Semana ${mov.week || '-'} · ${mov.year || '-'}`;
    }
    const d = new Date(Number(mov.year || new Date().getFullYear()), Number((mov.month || 1) - 1), 1);
    return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };


  const submitExtraHours = async (e) => {
    e.preventDefault();
    if (!selectedDetail) return;

    try {
      if (cuidadoresAsignadosEnServicio.length === 0) {
        showError('Asigná al menos un cuidador activo antes de cargar horas extra');
        return;
      }
      if (!extraHoursForm.fecha) {
        showError('Seleccioná la fecha de la hora extra');
        return;
      }
      if (!extraHoursForm.horas) {
        showError('Completá la cantidad de horas extra');
        return;
      }
      if (!extraHoursForm.caregiverId) {
        showError('Seleccioná el cuidador que realizó la hora extra');
        return;
      }
      if (!cuidadoresAsignadosEnServicio.some((c) => c.id === extraHoursForm.caregiverId)) {
        showError('El cuidador seleccionado no está asignado al servicio');
        return;
      }
      if (!extraHoursForm.valorHoraCobro) {
        showError('Completá el valor hora a cobrar');
        return;
      }
      if (!extraHoursForm.valorHoraPago) {
        showError('Completá el costo hora a pagar al cuidador');
        return;
      }

      await adminApi.createServicioExtraHours(selectedDetail.id, {
        caregiverId: extraHoursForm.caregiverId,
        fecha: `${extraHoursForm.fecha}T12:00:00`,
        horas: Number(extraHoursForm.horas),
        valorHoraCobro: Number(extraHoursForm.valorHoraCobro),
        valorHoraPago: Number(extraHoursForm.valorHoraPago),
        detalle: extraHoursForm.notas || '',
      });
      showSuccess('Hora extra acumulada: se actualizó cobro y pago pendientes del mes');
      setExtraHoursEditorOpen(false);
      resetExtraHoursForm();
      await refreshAll();
    } catch (error) {
      showError(error.message || 'No se pudo registrar la hora extra');
    }
  };

  const cancelServicio = async () => {
    if (!selectedDetail) return;
    try {
      await adminApi.updateServicio(selectedDetail.id, {
        fechaInicio: selectedDetail.fechaInicio,
        duracionHoras: selectedDetail.duracionHoras ?? ((selectedDetail.duracionMinutos || 60) / 60),
        direccion: selectedDetail.direccion || '',
        repeatMode: selectedDetail.repeatMode || 'none',
        repeatUntil: selectedDetail.repeatUntil,
        repeatDays: Array.isArray(selectedDetail.repeatDays) ? selectedDetail.repeatDays : [],
        estado: 'cancelado',
        notas: selectedDetail.notas || '',
        pacienteId: selectedDetail.pacienteId,
        cuidadorId: selectedDetail.cuidadorId,
      });
      showSuccess('Servicio cancelado');
      await refreshAll();
    } catch (error) {
      showError(error.message || 'No se pudo cancelar el servicio');
    }
  };

  const pauseOrResume = async (mode) => {
    if (!selectedDetail) return;
    try {
      if (mode === 'pause') {
        await adminApi.pauseServicioModulo(selectedDetail.id, 'Pausa manual desde ficha');
        showSuccess('Servicio pausado');
      } else {
        await adminApi.resumeServicioModulo(selectedDetail.id, selectedDetail.estado === 'pendiente'
          ? 'Servicio iniciado manualmente desde ficha'
          : 'Reanudación manual desde ficha');
        showSuccess(selectedDetail.estado === 'pendiente' ? 'Servicio pasado a en curso' : 'Servicio reanudado');
      }
      await refreshAll();
    } catch (error) {
      showError(error.message || 'No se pudo actualizar el estado');
    }
  };

  const submitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedDetail) return;
    try {
      await adminApi.createServicioAssignment(selectedDetail.id, assignmentForm);
      showSuccess('Asignación agregada');
      resetAssignmentForm();
      setAssignmentModalOpen(false);
      await refreshAll();
    } catch (error) {
      showError(error.message || 'No se pudo agregar asignación');
    }
  };

  const toggleAssignment = async (assignment) => {
    if (!selectedDetail) return;
    try {
      await adminApi.updateServicioAssignment(selectedDetail.id, assignment.id, {
        activo: !assignment.activo,
      });
      showSuccess(assignment.activo ? 'Asignación desactivada' : 'Asignación activada');
      await refreshAll();
    } catch (error) {
      showError(error.message || 'No se pudo actualizar la asignación');
    }
  };

  const startRoleEdit = (assignment) => {
    setEditingRoleId(assignment.id);
    setRoleDraft(assignment.rol || '');
  };

  const saveRoleEdit = async (assignment) => {
    if (!selectedDetail) return;
    const nextRole = roleDraft.trim();
    setEditingRoleId(null);
    if (!nextRole || nextRole === assignment.rol) return;
    try {
      await adminApi.updateServicioAssignment(selectedDetail.id, assignment.id, { rol: nextRole });
      showSuccess('Rol actualizado');
      await refreshAll();
    } catch (error) {
      showError(error.message || 'No se pudo actualizar el rol');
    }
  };

  const handleServicioAction = (action) => {
    if (!selectedDetail || !action) return;
    if (action === 'history') {
      setHistoryOpen(true);
      return;
    }
    if (action === 'pay') {
      navigate(`/admin/finanzas?from=servicios&serviceId=${selectedDetail.id}&tab=cobros`);
      return;
    }
    if (action === 'pause') {
      setConfirmAction({ type: 'pause' });
      return;
    }
    if (action === 'resume') {
      setConfirmAction({ type: 'resume' });
      return;
    }
    if (action === 'start') {
      setConfirmAction({ type: 'start' });
      return;
    }
    if (action === 'cancel') {
      setConfirmAction({ type: 'cancel' });
    }
  };

  return (
    <div className="min-h-screen bg-light">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-light-200 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-dark" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-dark">Dashboard de servicios</h1>
              <p className="text-sm text-slate-500">Gestión operativa y administrativa</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              disabled={!selectedDetail}
            >
              <Clock3 className="w-4 h-4 mr-2" />
              Historial
            </Button>
            <AdminQuickMenu />
          </div>
        </div>
      </header>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <Card className="bg-white border border-slate-200">
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    statusFilter === st
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  {STATUS_LABEL[st]}
                </button>
              ))}
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {loading && <p className="text-sm text-slate-500">Cargando...</p>}
              {!loading && serviciosFiltrados.length === 0 && <p className="text-sm text-slate-500">Sin servicios.</p>}
              {serviciosFiltrados.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left rounded-xl border p-3 ${
                    selectedId === s.id ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 truncate">{s.paciente?.nombre || 'Paciente'}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badgeByStatus(s.estado)}`}>
                      {prettyStatus(s.estado)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {format(new Date(s.fechaInicio), 'dd/MM/yyyy HH:mm')} · {s.cuidador?.nombre || 'Sin cuidador'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Pago mes actual: {s.currentMonthPayment?.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200">
          <CardContent>
            {!selectedDetail && <p className="text-sm text-slate-500">Seleccioná un servicio.</p>}
            {selectedDetail && (
              <div className="space-y-8">
                <div className={`rounded-xl border p-5 ${detailPanelByStatus(selectedDetail.estado)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-800">{selectedDetail.paciente?.nombre || 'Paciente'}</h2>
                        <span className={`text-xs px-2 py-1 rounded-full border ${badgeByStatus(selectedDetail.estado)}`}>{prettyStatus(selectedDetail.estado)}</span>
                      </div>
                      <p className="text-sm text-slate-600">Inicio: {format(new Date(selectedDetail.fechaInicio), 'dd/MM/yyyy HH:mm')}</p>
                      <p className="text-sm text-slate-600">Dirección: {selectedDetail.direccion || selectedDetail.paciente?.direccion || 'Sin dirección'}</p>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActionsMenuOpen((prev) => !prev)}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        title="Acciones"
                        aria-label="Acciones"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {actionsMenuOpen && (
                        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg z-30 overflow-hidden">
                          {selectedDetail.estado === 'pausado' ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleServicioAction('resume');
                                setActionsMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              Reanudar servicio
                            </button>
                          ) : null}
                          {selectedDetail.estado === 'pendiente' ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleServicioAction('start');
                                setActionsMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              Pasar a en curso
                            </button>
                          ) : null}
                          {selectedDetail.estado !== 'pausado' && selectedDetail.estado !== 'cancelado' && selectedDetail.estado !== 'completado' ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleServicioAction('pause');
                                setActionsMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              Pausar servicio
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              handleServicioAction('pay');
                              setActionsMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            Registrar cobro
                          </button>
                          {selectedDetail.estado !== 'cancelado' && selectedDetail.estado !== 'completado' ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleServicioAction('cancel');
                                setActionsMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              Dar de baja
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              handleServicioAction('history');
                              setActionsMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                          >
                            Ver historial
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl border p-5 shadow-sm ${operationsPanelByStatus(selectedDetail.estado)}`}>
                  <div className="grid grid-cols-1 gap-6">
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-slate-700">Cuidadores asignados</p>
                        <button
                          type="button"
                          onClick={() => {
                            resetAssignmentForm();
                            setAssignmentModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                          title="Agregar asignación"
                          aria-label="Agregar asignación"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Gestioná asignaciones activas del servicio.</p>
                      <div className="space-y-2 mb-3">
                        {(selectedDetail.assignments || []).length === 0 && <p className="text-xs text-slate-500">Sin asignaciones.</p>}
                        {(selectedDetail.assignments || []).map((a) => (
                          <div key={a.id} className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white px-3 py-2">
                            <div>
                              <p className="text-sm text-slate-700">
                                {a.tipo === 'caregiver' ? (a.caregiver?.nombre || 'Cuidador') : (a.nombreManual || 'Profesional')}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className={a.activo ? 'border border-amber-200 bg-amber-50 text-amber-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}
                              onClick={() => toggleAssignment(a)}
                            >
                              {a.activo ? 'Desactivar' : 'Activar'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="border-t border-slate-200 pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-slate-700">Horas extra por facturar</p>
                        {selectedDetail.estado !== 'cancelado' && selectedDetail.estado !== 'completado' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setExtraHoursEditorOpen((prev) => !prev);
                              if (extraHoursEditorOpen) resetExtraHoursForm();
                            }}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            title={extraHoursEditorOpen ? 'Cerrar carga de horas extra' : 'Agregar horas extra'}
                            aria-label={extraHoursEditorOpen ? 'Cerrar carga de horas extra' : 'Agregar horas extra'}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Se acumula por cuidador y mes. El total se calcula como horas x valor hora (cobro) y horas x costo hora (pago).</p>

                      {extraHoursEditorOpen && (
                        <form onSubmit={submitExtraHours} className="rounded-xl border border-amber-100 bg-white p-3 mb-3 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              type="date"
                              value={extraHoursForm.fecha}
                              onChange={(e) => setExtraHoursForm((prev) => ({ ...prev, fecha: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              required
                            />
                            <select
                              value={extraHoursForm.caregiverId}
                              onChange={(e) => setExtraHoursForm((prev) => ({ ...prev, caregiverId: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              required
                            >
                              <option value="">Cuidador</option>
                              {cuidadoresAsignadosEnServicio.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={extraHoursForm.horas}
                              onChange={(e) => setExtraHoursForm((prev) => ({ ...prev, horas: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              placeholder="Horas extra"
                              required
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={extraHoursForm.valorHoraCobro}
                              onChange={(e) => setExtraHoursForm((prev) => ({ ...prev, valorHoraCobro: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              placeholder="Valor hora a cobrar"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={extraHoursForm.valorHoraPago}
                              onChange={(e) => setExtraHoursForm((prev) => ({ ...prev, valorHoraPago: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              placeholder="Costo hora a pagar"
                              required
                            />
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                              <input
                                value={extraHoursForm.notas}
                                onChange={(e) => setExtraHoursForm((prev) => ({ ...prev, notas: e.target.value }))}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                placeholder="Detalle opcional"
                              />
                              <Button type="submit" size="sm" className="h-full">
                                Guardar hora extra
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="px-3 py-2 rounded-lg border border-emerald-100 bg-emerald-50 text-xs text-emerald-700">
                              Total a cobrar: <span className="font-semibold">${Number(extraHoursPreview.totalCobro || 0).toLocaleString('es-AR')}</span>
                            </div>
                            <div className="px-3 py-2 rounded-lg border border-violet-100 bg-violet-50 text-xs text-violet-700">
                              Total a pagar: <span className="font-semibold">${Number(extraHoursPreview.totalPago || 0).toLocaleString('es-AR')}</span>
                            </div>
                          </div>
                        </form>
                      )}

                      <div className="rounded-xl border border-amber-100 overflow-hidden bg-white mb-5">
                        <table className="w-full text-sm">
                          <thead className="bg-amber-50">
                            <tr className="text-left text-slate-600">
                              <th className="px-3 py-2 font-semibold">Período</th>
                              <th className="px-3 py-2 font-semibold">Cuidador</th>
                              <th className="px-3 py-2 font-semibold">Horas acumuladas</th>
                              <th className="px-3 py-2 font-semibold">Cobro acumulado</th>
                              <th className="px-3 py-2 font-semibold">Pago acumulado</th>
                              <th className="px-3 py-2 font-semibold">Estado cobro</th>
                              <th className="px-3 py-2 font-semibold">Estado pago</th>
                              <th className="px-3 py-2 font-semibold text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extraHoursServicio.length === 0 && (
                              <tr>
                                <td colSpan={8} className="px-3 py-4 text-center text-slate-500">Sin horas extra registradas.</td>
                              </tr>
                            )}
                            {extraHoursServicio.map((item) => {
                              const hasPago = Boolean(item.pago?.id);
                              const periodLabel = item.info.month && item.info.year
                                ? new Date(item.info.year, item.info.month - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
                                : formatPeriodo(item.cobro);
                              const hasDetails = item.info.details.length > 0;
                              const isExpanded = extraHoursExpandedKey === item.ref;
                              return (
                                <React.Fragment key={item.ref}>
                                <tr className="border-t border-amber-100">
                                  <td className="px-3 py-2 text-slate-600 capitalize">{periodLabel}</td>
                                  <td className="px-3 py-2 text-slate-600">{item.info.caregiverNombre || item.pago?.caregiver?.nombre || 'Sin cuidador'}</td>
                                  <td className="px-3 py-2">{item.info.totalHoras ? `${item.info.totalHoras} hs` : '-'}</td>
                                  <td className="px-3 py-2">${Number(item.cobro.monto || 0).toLocaleString('es-AR')}</td>
                                  <td className="px-3 py-2">{hasPago ? `$${Number(item.pago?.monto || 0).toLocaleString('es-AR')}` : '-'}</td>
                                  <td className="px-3 py-2">
                                    <span className={`text-xs px-2 py-1 rounded-full border ${
                                      String(item.cobro.estado).toLowerCase() === 'pagado'
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-100 text-amber-700 border-amber-200'
                                    }`}>
                                      {String(item.cobro.estado).toLowerCase() === 'pagado' ? 'Pagado' : 'Pendiente'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    {hasPago ? (
                                      <span className={`text-xs px-2 py-1 rounded-full border ${
                                        String(item.pago?.estado || 'pendiente').toLowerCase() === 'pagado'
                                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                          : 'bg-amber-100 text-amber-700 border-amber-200'
                                      }`}>
                                        {String(item.pago?.estado || 'pendiente').toLowerCase() === 'pagado' ? 'Pagado' : 'Pendiente'}
                                      </span>
                                    ) : (
                                      <span className="text-xs px-2 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                                        Sin orden
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!hasDetails) return;
                                          setExtraHoursExpandedKey((prev) => (prev === item.ref ? '' : item.ref));
                                        }}
                                        className="text-xs px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                        disabled={!hasDetails}
                                      >
                                        {isExpanded ? 'Ocultar detalle' : '+ Detalle'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => navigate('/admin/finanzas?tab=cobros&estado=pendiente')}
                                        className="text-xs px-2.5 py-1 rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                                      >
                                        Gestionar en finanzas
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="border-t border-amber-100 bg-amber-50/30">
                                    <td colSpan={8} className="px-3 py-2">
                                      <div className="space-y-1">
                                        {item.info.details.map((detailItem) => (
                                          <div key={detailItem.id} className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                                            <span>{detailItem.fecha ? format(new Date(detailItem.fecha), 'dd/MM/yyyy') : '-'}</span>
                                            <span>· {Number.isFinite(detailItem.horas) ? `${detailItem.horas} hs` : '-'}</span>
                                            <span>· {detailItem.concepto || 'Sin concepto'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="border-t border-slate-200 pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-slate-700">Pendientes del servicio</p>
                        <button
                          type="button"
                          onClick={() => navigate('/admin/finanzas?tab=cobros&estado=pendiente')}
                          className="text-xs px-2.5 py-1 rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                        >
                          Gestionar en finanzas
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-xl border border-amber-100 bg-white p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs text-slate-500">Pendiente de cobro</p>
                              <p className="text-lg font-semibold text-amber-700">${Number(pendientesCobroTotal || 0).toLocaleString('es-AR')}</p>
                              <p className="text-xs text-slate-500">{movimientosServicioPendientes.cobros.length} registros</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPendingDetailType((prev) => (prev === 'cobro' ? '' : 'cobro'))}
                              className="text-xs px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            >
                              {pendingDetailType === 'cobro' ? 'Ocultar detalle' : '+ Cobros'}
                            </button>
                          </div>
                          {pendingDetailType === 'cobro' && (
                            <div className="mt-3 space-y-2">
                              {movimientosServicioPendientes.cobros.length === 0 && (
                                <p className="text-xs text-slate-500">Sin cobros pendientes.</p>
                              )}
                              {movimientosServicioPendientes.cobros.map((mov) => {
                                const extraInfo = mov.categoria === EXTRA_HOURS_CATEGORY ? parseExtraHoursInfo(mov) : null;
                                return (
                                  <div key={mov.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-medium text-slate-700 capitalize">
                                        {mov.categoria === EXTRA_HOURS_CATEGORY
                                          ? `Horas extra · ${extraInfo?.month && extraInfo?.year ? new Date(extraInfo.year, extraInfo.month - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : formatPeriodo(mov)}`
                                          : formatPeriodo(mov)}
                                      </p>
                                      <p className="text-xs font-semibold text-slate-700">${Number(mov.monto || 0).toLocaleString('es-AR')}</p>
                                    </div>
                                    {extraInfo?.details?.length > 0 && (
                                      <p className="text-[11px] text-slate-500 mt-1">
                                        {extraInfo.details.length} cargas · {Number(extraInfo.totalHoras || 0).toLocaleString('es-AR')} hs
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-violet-100 bg-white p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs text-slate-500">Pendiente de pago</p>
                              <p className="text-lg font-semibold text-violet-700">${Number(pendientesPagoTotal || 0).toLocaleString('es-AR')}</p>
                              <p className="text-xs text-slate-500">{movimientosServicioPendientes.pagos.length} registros</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPendingDetailType((prev) => (prev === 'pago' ? '' : 'pago'))}
                              className="text-xs px-2.5 py-1 rounded-md border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                            >
                              {pendingDetailType === 'pago' ? 'Ocultar detalle' : '+ Pagos'}
                            </button>
                          </div>
                          {pendingDetailType === 'pago' && (
                            <div className="mt-3 space-y-2">
                              {movimientosServicioPendientes.pagos.length === 0 && (
                                <p className="text-xs text-slate-500">Sin pagos pendientes.</p>
                              )}
                              {movimientosServicioPendientes.pagos.map((mov) => {
                                const extraInfo = mov.categoria === EXTRA_HOURS_CATEGORY ? parseExtraHoursInfo(mov) : null;
                                return (
                                  <div key={mov.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-medium text-slate-700 capitalize">
                                        {mov.categoria === EXTRA_HOURS_CATEGORY
                                          ? `Horas extra · ${mov.caregiver?.nombre || extraInfo?.caregiverNombre || 'Cuidador'}`
                                          : (mov.caregiver?.nombre || 'Pago sin cuidador')}
                                      </p>
                                      <p className="text-xs font-semibold text-slate-700">${Number(mov.monto || 0).toLocaleString('es-AR')}</p>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1 capitalize">
                                      {extraInfo?.month && extraInfo?.year
                                        ? new Date(extraInfo.year, extraInfo.month - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
                                        : formatPeriodo(mov)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={`Historial${selectedDetail?.paciente?.nombre ? ` · ${selectedDetail.paciente.nombre}` : ''}`}
        size="md"
      >
        {!selectedDetail ? (
          <p className="text-sm text-slate-500">Seleccioná un servicio para ver su historial.</p>
        ) : (
          <div>
            <p className="text-xs text-slate-500 mb-3">Cronología de cambios del servicio en lenguaje simple.</p>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {(selectedDetail.events || []).length === 0 && <p className="text-xs text-slate-500">Sin movimientos.</p>}
              {(selectedDetail.events || []).map((ev) => (
                <div key={ev.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm text-slate-700">{prettyEvent(ev)}</p>
                  {ev.nota ? <p className="text-xs text-slate-500">{ev.nota}</p> : null}
                  <p className="text-xs text-slate-400">{format(new Date(ev.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        title="Agregar asignación"
        size="md"
      >
        <form onSubmit={submitAssignment} className="space-y-3">
          <select
            value={assignmentForm.tipo}
            onChange={(e) => setAssignmentForm((prev) => ({ ...prev, tipo: e.target.value }))}
            className="w-full px-3 py-2 border-2 border-light-300 rounded-xl text-sm"
          >
            <option value="caregiver">Cuidador</option>
            <option value="professional">Profesional</option>
          </select>
          {assignmentForm.tipo === 'caregiver' ? (
            <select
              value={assignmentForm.caregiverId}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, caregiverId: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-light-300 rounded-xl text-sm"
              required
            >
              <option value="">Seleccionar cuidador</option>
              {cuidadores.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          ) : (
            <input
              value={assignmentForm.nombreManual}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, nombreManual: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-light-300 rounded-xl text-sm"
              placeholder="Nombre profesional"
              required
            />
          )}
          <input
            value={assignmentForm.rol}
            onChange={(e) => setAssignmentForm((prev) => ({ ...prev, rol: e.target.value }))}
            className="w-full px-3 py-2 border-2 border-light-300 rounded-xl text-sm"
            placeholder="Rol (ej. Masajista)"
            required
          />
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" className="w-1/2 border border-slate-300" onClick={() => setAssignmentModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="w-1/2">
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} title="Confirmar acción" size="sm">
        <p className="text-sm text-slate-600">
          {confirmAction?.type === 'pause'
            ? '¿Querés pausar este servicio?'
            : confirmAction?.type === 'resume'
              ? '¿Querés reanudar este servicio?'
              : confirmAction?.type === 'start'
                ? '¿Querés pasar este servicio de pendiente a en curso?'
              : '¿Querés cancelar este servicio?'}
        </p>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="ghost" fullWidth onClick={() => setConfirmAction(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            fullWidth
            onClick={async () => {
              try {
                if (confirmAction?.type === 'pause') await pauseOrResume('pause');
                if (confirmAction?.type === 'resume') await pauseOrResume('resume');
                if (confirmAction?.type === 'start') await pauseOrResume('resume');
                if (confirmAction?.type === 'cancel') await cancelServicio();
              } finally {
                setConfirmAction(null);
              }
            }}
          >
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Servicios;
