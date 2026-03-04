import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Clock3, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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

function formatMonthYearLabel(year, month) {
  const y = Number(year || 0);
  const m = Number(month || 0);
  if (!y || !m) return '-';
  const monthName = new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long' });
  const prettyMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace(/\s+de\s+/i, ' ');
  return `${prettyMonth} ${y}`;
}

function roundMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
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
      const valorHoraCobro = Number(item.valorHoraCobro);
      const valorHoraPago = Number(item.valorHoraPago);
      const fechaValue = item.fecha ? new Date(item.fecha) : null;
      const fecha = fechaValue && !Number.isNaN(fechaValue.getTime())
        ? fechaValue.toISOString().slice(0, 10)
        : null;
      return {
        id: String(item.id || `det-${idx + 1}`),
        fecha,
        horas: Number.isFinite(horas) ? horas : null,
        valorHoraCobro: Number.isFinite(valorHoraCobro) ? valorHoraCobro : null,
        valorHoraPago: Number.isFinite(valorHoraPago) ? valorHoraPago : null,
        montoCobro: Number.isFinite(montoCobro) ? montoCobro : 0,
        montoPago: Number.isFinite(montoPago) ? montoPago : 0,
        concepto: String(item.concepto || '').trim(),
        createdAt: item.createdAt ? String(item.createdAt) : null,
        legacy: Boolean(item.legacy),
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
  const fallbackDate = mov?.fecha ? new Date(mov.fecha) : null;
  const fallbackYear = Number(mov?.year || (fallbackDate && !Number.isNaN(fallbackDate.getTime()) ? fallbackDate.getFullYear() : 0)) || 0;
  const fallbackMonth = Number(mov?.month || (fallbackDate && !Number.isNaN(fallbackDate.getTime()) ? fallbackDate.getMonth() + 1 : 0)) || 0;
  const fallbackServiceId = mov?.serviceId || 'sin-servicio';
  const fallbackCaregiverId = mov?.caregiverId || 'sin-cuidador';
  const fallbackGroupingKey = `svc:${fallbackServiceId}:${fallbackCaregiverId}:${fallbackYear}:${fallbackMonth}`;

  return {
    isAggregate: false,
    ref: refMatch?.[1] || null,
    key: refMatch?.[1] ? `ref:${refMatch[1]}` : fallbackGroupingKey,
    caregiverId: mov?.caregiverId || null,
    caregiverNombre: mov?.caregiver?.nombre || null,
    year: fallbackYear || null,
    month: fallbackMonth || null,
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
  const [assignmentsOpen, setAssignmentsOpen] = useState(false);
  const [extraHoursOpen, setExtraHoursOpen] = useState(false);
  const [extraHoursMonthFilter, setExtraHoursMonthFilter] = useState('all');
  const [extraHoursEditingId, setExtraHoursEditingId] = useState('');

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
    setAssignmentsOpen(false);
    setExtraHoursOpen(false);
    setExtraHoursMonthFilter('all');
    setExtraHoursEditingId('');
  }, [selectedId]);

  useEffect(() => {
    if (!extraHoursEditorOpen || cuidadoresAsignadosEnServicio.length === 0) return;
    setExtraHoursForm((prev) => {
      if (prev.caregiverId) return prev;
      return { ...prev, caregiverId: cuidadoresAsignadosEnServicio[0].id };
    });
  }, [extraHoursEditorOpen, cuidadoresAsignadosEnServicio]);

  useEffect(() => {
    if (extraHoursOpen) return;
    setExtraHoursEditorOpen(false);
    setExtraHoursEditingId('');
  }, [extraHoursOpen]);

  const serviciosFiltrados = useMemo(() => {
    if (statusFilter === 'todos') return servicios;
    if (statusFilter === 'no_pago') {
      return servicios.filter((s) => s.currentMonthPayment?.estado !== 'pagado');
    }
    return servicios.filter((s) => s.estado === statusFilter);
  }, [servicios, statusFilter]);

  const extraHoursServicio = useMemo(() => {
    if (!selectedDetail) return [];

    const extraItems = movimientosFinanzas
      .filter((m) => m.serviceId === selectedDetail.id && m.categoria === EXTRA_HOURS_CATEGORY)
      .map((mov) => ({ mov, info: parseExtraHoursInfo(mov) }));

    const getTimestamp = (item) => new Date(
      item?.mov?.updatedAt || item?.mov?.createdAt || item?.mov?.fecha || 0
    ).getTime() || 0;

    const pickCanonical = (items = []) => {
      if (!Array.isArray(items) || items.length === 0) return null;
      return [...items].sort((a, b) => {
        const aDetails = Array.isArray(a.info?.details) ? a.info.details.length : 0;
        const bDetails = Array.isArray(b.info?.details) ? b.info.details.length : 0;
        if (aDetails !== bDetails) return bDetails - aDetails;

        const aPending = String(a.mov?.estado || '').toLowerCase() === 'pendiente' ? 1 : 0;
        const bPending = String(b.mov?.estado || '').toLowerCase() === 'pendiente' ? 1 : 0;
        if (aPending !== bPending) return bPending - aPending;

        return getTimestamp(b) - getTimestamp(a);
      })[0];
    };

    const groupedByPeriod = new Map();
    for (const item of extraItems) {
      const caregiverId = item.info?.caregiverId || item.mov?.caregiverId || item.info?.aggregate?.caregiverId || 'sin-cuidador';
      const year = Number(item.info?.year || item.mov?.year || item.info?.aggregate?.year || 0) || 0;
      const month = Number(item.info?.month || item.mov?.month || item.info?.aggregate?.month || 0) || 0;
      const key = `${selectedDetail.id}:${caregiverId}:${year}:${month}`;

      if (!groupedByPeriod.has(key)) {
        groupedByPeriod.set(key, {
          key,
          caregiverId,
          year,
          month,
          cobros: [],
          pagos: [],
        });
      }

      if (item.mov.tipo === 'cobro') groupedByPeriod.get(key).cobros.push(item);
      if (item.mov.tipo === 'pago') groupedByPeriod.get(key).pagos.push(item);
    }

    return [...groupedByPeriod.values()]
      .map((group) => {
        const canonicalCobro = pickCanonical(group.cobros);
        const canonicalPago = pickCanonical(group.pagos);
        if (!canonicalCobro) return null;

        const detailSource = [canonicalCobro, canonicalPago]
          .filter(Boolean)
          .sort((a, b) => {
            const aDetails = Array.isArray(a.info?.details) ? a.info.details.length : 0;
            const bDetails = Array.isArray(b.info?.details) ? b.info.details.length : 0;
            if (aDetails !== bDetails) return bDetails - aDetails;
            return getTimestamp(b) - getTimestamp(a);
          })[0] || canonicalCobro;

        const detailItems = Array.isArray(detailSource?.info?.details) ? detailSource.info.details : [];
        const legacyFallbackDetail = {
          id: `legacy-${canonicalCobro?.mov?.id || group.key}`,
          fecha: canonicalCobro?.mov?.fecha ? new Date(canonicalCobro.mov.fecha).toISOString().slice(0, 10) : null,
          horas: Number.isFinite(Number(detailSource?.info?.totalHoras)) ? Number(detailSource.info.totalHoras) : null,
          valorHoraCobro: null,
          valorHoraPago: null,
          montoCobro: Number(canonicalCobro?.mov?.monto || 0),
          montoPago: Number(canonicalPago?.mov?.monto || 0),
          concepto: detailSource?.info?.lastDetail?.concepto || 'Registro legacy',
          createdAt: canonicalCobro?.mov?.createdAt || null,
          legacy: true,
        };
        const details = detailItems.length > 0 ? detailItems : [legacyFallbackDetail];
        const detailTotals = details.reduce((acc, detail) => ({
          horas: acc.horas + (Number.isFinite(Number(detail?.horas)) ? Number(detail.horas) : 0),
          montoCobro: acc.montoCobro + Number(detail?.montoCobro || 0),
          montoPago: acc.montoPago + Number(detail?.montoPago || 0),
        }), { horas: 0, montoCobro: 0, montoPago: 0 });

        const aggregateCobroTotal = Number(canonicalCobro?.info?.aggregate?.totals?.montoCobro || 0);
        const aggregatePagoTotal = Number(canonicalPago?.info?.aggregate?.totals?.montoPago || 0);

        const cobroMonto = detailTotals.montoCobro > 0
          ? detailTotals.montoCobro
          : (aggregateCobroTotal > 0 ? aggregateCobroTotal : Number(canonicalCobro?.mov?.monto || 0));
        const pagoMonto = detailTotals.montoPago > 0
          ? detailTotals.montoPago
          : (aggregatePagoTotal > 0 ? aggregatePagoTotal : Number(canonicalPago?.mov?.monto || 0));

        const totalHoras = detailTotals.horas > 0
          ? detailTotals.horas
          : Number(
            detailSource?.info?.totalHoras
            || canonicalCobro?.info?.totalHoras
            || canonicalPago?.info?.totalHoras
            || 0
          );

        return {
          ref: group.key,
          cobro: {
            ...canonicalCobro.mov,
            monto: cobroMonto,
          },
          pago: canonicalPago
            ? {
              ...canonicalPago.mov,
              monto: pagoMonto,
            }
            : null,
          info: {
            ...(detailSource?.info || canonicalCobro.info || {}),
            year: group.year,
            month: group.month,
            caregiverId: group.caregiverId === 'sin-cuidador' ? null : group.caregiverId,
            caregiverNombre: canonicalPago?.info?.caregiverNombre
              || canonicalPago?.mov?.caregiver?.nombre
              || canonicalCobro?.info?.caregiverNombre
              || canonicalCobro?.mov?.caregiver?.nombre
              || null,
            details,
            totalHoras,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aDate = new Date(a.cobro?.fecha || a.cobro?.updatedAt || a.cobro?.createdAt || 0).getTime();
        const bDate = new Date(b.cobro?.fecha || b.cobro?.updatedAt || b.cobro?.createdAt || 0).getTime();
        return bDate - aDate;
      });
  }, [selectedDetail, movimientosFinanzas]);

  const extraHoursPeriodOptions = useMemo(() => {
    const values = extraHoursServicio
      .map((item) => {
        const year = Number(item.info.year || 0);
        const month = Number(item.info.month || 0);
        if (!year || !month) return null;
        return { value: `${year}-${String(month).padStart(2, '0')}`, year, month };
      })
      .filter(Boolean);
    const unique = new Map(values.map((entry) => [entry.value, entry]));
    return [...unique.values()].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [extraHoursServicio]);

  const extraHoursVisible = useMemo(() => {
    if (extraHoursMonthFilter === 'all') return extraHoursServicio;
    return extraHoursServicio.filter((item) => {
      const year = Number(item.info.year || 0);
      const month = Number(item.info.month || 0);
      if (!year || !month) return false;
      return `${year}-${String(month).padStart(2, '0')}` === extraHoursMonthFilter;
    });
  }, [extraHoursServicio, extraHoursMonthFilter]);

  useEffect(() => {
    if (extraHoursMonthFilter === 'all') return;
    const exists = extraHoursPeriodOptions.some((option) => option.value === extraHoursMonthFilter);
    if (!exists) setExtraHoursMonthFilter('all');
  }, [extraHoursMonthFilter, extraHoursPeriodOptions]);

  const extraHoursDetailRows = useMemo(() => {
    return extraHoursVisible
      .flatMap((group) => {
        const year = Number(group.info.year || 0);
        const month = Number(group.info.month || 0);
        const caregiverId = group.info.caregiverId || group.pago?.caregiverId || group.cobro?.caregiverId || '';
        const caregiverNombre = group.info.caregiverNombre || group.pago?.caregiver?.nombre || group.cobro?.caregiver?.nombre || 'Sin cuidador';

        return (group.info.details || []).map((detail) => {
          const horas = Number.isFinite(Number(detail.horas)) ? Number(detail.horas) : 0;
          const valorHoraCobro = Number.isFinite(Number(detail.valorHoraCobro)) ? Number(detail.valorHoraCobro) : null;
          const valorHoraPago = Number.isFinite(Number(detail.valorHoraPago)) ? Number(detail.valorHoraPago) : null;
          const montoCobro = valorHoraCobro !== null
            ? roundMoney(horas * valorHoraCobro)
            : roundMoney(detail.montoCobro || 0);
          const montoPago = valorHoraPago !== null
            ? roundMoney(horas * valorHoraPago)
            : roundMoney(detail.montoPago || 0);

          return {
            id: String(detail.id),
            fecha: detail.fecha || null,
            caregiverId,
            caregiverNombre,
            year,
            month,
            periodValue: year && month ? `${year}-${String(month).padStart(2, '0')}` : 'n/a',
            periodLabel: year && month ? formatMonthYearLabel(year, month) : '-',
            horas,
            valorHoraCobro,
            valorHoraPago,
            montoCobro,
            montoPago,
            concepto: detail.concepto || '',
            createdAt: detail.createdAt || null,
            cobroEstado: String(group.cobro?.estado || 'pendiente').toLowerCase(),
            pagoEstado: String(group.pago?.estado || 'pendiente').toLowerCase(),
            cobroId: group.cobro?.id || null,
            pagoId: group.pago?.id || null,
          };
        });
      })
      .sort((a, b) => {
        const aDate = new Date(a.fecha || a.createdAt || 0).getTime();
        const bDate = new Date(b.fecha || b.createdAt || 0).getTime();
        return bDate - aDate;
      });
  }, [extraHoursVisible]);

  const extraHoursAccumulatedRows = useMemo(() => {
    const grouped = new Map();
    for (const row of extraHoursDetailRows) {
      const key = `${row.caregiverId || 'sin-cuidador'}:${row.periodValue}`;
      const existing = grouped.get(key) || {
        key,
        caregiverId: row.caregiverId || '',
        caregiverNombre: row.caregiverNombre || 'Sin cuidador',
        year: row.year || 0,
        month: row.month || 0,
        periodLabel: row.periodLabel || '-',
        horas: 0,
        montoCobro: 0,
        montoPago: 0,
        registros: 0,
        cobroEstado: 'pagado',
        pagoEstado: 'pagado',
      };
      existing.horas += Number(row.horas || 0);
      existing.montoCobro += Number(row.montoCobro || 0);
      existing.montoPago += Number(row.montoPago || 0);
      existing.registros += 1;
      if (row.cobroEstado === 'pendiente') existing.cobroEstado = 'pendiente';
      if (row.pagoEstado === 'pendiente') existing.pagoEstado = 'pendiente';
      grouped.set(key, existing);
    }
    return [...grouped.values()]
      .map((item) => ({
        ...item,
        horas: roundMoney(item.horas),
        montoCobro: roundMoney(item.montoCobro),
        montoPago: roundMoney(item.montoPago),
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.month !== b.month) return b.month - a.month;
        return a.caregiverNombre.localeCompare(b.caregiverNombre, 'es');
      });
  }, [extraHoursDetailRows]);

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
    const extraPendingCobros = extraHoursServicio
      .filter((item) => isPending(item.cobro.estado))
      .map((item) => item.cobro);
    const extraPendingPagos = extraHoursServicio
      .filter((item) => item.pago && isPending(item.pago.estado))
      .map((item) => item.pago);

    const regularPendingCobros = serviceMovements
      .filter((m) => m.tipo === 'cobro' && m.categoria !== EXTRA_HOURS_CATEGORY && isPending(m.estado));
    const regularPendingPagos = serviceMovements
      .filter((m) => m.tipo === 'pago' && m.categoria !== EXTRA_HOURS_CATEGORY && isPending(m.estado));

    return {
      cobros: [...regularPendingCobros, ...extraPendingCobros]
        .sort((a, b) => new Date(b.fecha || b.createdAt || 0) - new Date(a.fecha || a.createdAt || 0)),
      pagos: [...regularPendingPagos, ...extraPendingPagos]
        .sort((a, b) => new Date(b.fecha || b.createdAt || 0) - new Date(a.fecha || a.createdAt || 0)),
    };
  }, [selectedDetail, movimientosFinanzas, extraHoursServicio]);

  const pendientesCobroTotal = useMemo(
    () => movimientosServicioPendientes.cobros.reduce((acc, mov) => acc + Number(mov.monto || 0), 0),
    [movimientosServicioPendientes]
  );

  const pendientesPagoTotal = useMemo(
    () => movimientosServicioPendientes.pagos.reduce((acc, mov) => acc + Number(mov.monto || 0), 0),
    [movimientosServicioPendientes]
  );

  const extraHoursQuickStats = useMemo(() => {
    return extraHoursDetailRows.reduce((acc, row) => ({
      horas: acc.horas + Number(row.horas || 0),
      cobro: acc.cobro + Number(row.montoCobro || 0),
      pago: acc.pago + Number(row.montoPago || 0),
      rows: acc.rows + 1,
    }), { horas: 0, cobro: 0, pago: 0, rows: 0 });
  }, [extraHoursDetailRows]);

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
    setExtraHoursEditingId('');
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

      const payload = {
        caregiverId: extraHoursForm.caregiverId,
        fecha: `${extraHoursForm.fecha}T12:00:00`,
        horas: Number(extraHoursForm.horas),
        valorHoraCobro: Number(extraHoursForm.valorHoraCobro),
        valorHoraPago: Number(extraHoursForm.valorHoraPago),
        detalle: extraHoursForm.notas || '',
      };

      if (extraHoursEditingId) {
        await adminApi.updateServicioExtraHours(selectedDetail.id, extraHoursEditingId, payload);
        showSuccess('Registro de hora extra actualizado');
      } else {
        await adminApi.createServicioExtraHours(selectedDetail.id, payload);
        showSuccess('Hora extra acumulada: se actualizó cobro y pago pendientes del mes');
      }
      setExtraHoursEditorOpen(false);
      resetExtraHoursForm();
      await refreshAll();
    } catch (error) {
      showError(error.message || 'No se pudo registrar la hora extra');
    }
  };

  const startExtraHoursEdit = (row) => {
    setExtraHoursEditingId(row.id);
    setExtraHoursEditorOpen(true);
    setExtraHoursForm({
      fecha: row.fecha || new Date().toISOString().slice(0, 10),
      caregiverId: row.caregiverId || '',
      horas: row.horas ? String(row.horas) : '',
      valorHoraCobro: row.valorHoraCobro !== null && row.valorHoraCobro !== undefined ? String(row.valorHoraCobro) : '',
      valorHoraPago: row.valorHoraPago !== null && row.valorHoraPago !== undefined ? String(row.valorHoraPago) : '',
      notas: row.concepto || '',
    });
  };

  const deleteExtraHoursDetail = async (row) => {
    if (!selectedDetail) return;
    const ok = window.confirm('¿Querés eliminar este registro de hora extra?');
    if (!ok) return;

    try {
      await adminApi.deleteServicioExtraHours(selectedDetail.id, row.id);
      if (extraHoursEditingId && extraHoursEditingId === row.id) {
        resetExtraHoursForm();
        setExtraHoursEditorOpen(false);
      }
      showSuccess('Registro de hora extra eliminado');
      await refreshAll();
    } catch (error) {
      showError(error.message || 'No se pudo eliminar la hora extra');
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
                      <p className="text-sm text-slate-600">
                        {format(new Date(selectedDetail.fechaInicio), 'dd/MM/yyyy HH:mm')}
                        {' · '}
                        {selectedDetail.direccion || selectedDetail.paciente?.direccion || 'Sin dirección'}
                      </p>
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
                        <button
                          type="button"
                          onClick={() => setAssignmentsOpen((prev) => !prev)}
                          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                        >
                          Cuidadores asignados
                        </button>
                        <div className="flex items-center gap-2">
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
                          <button
                            type="button"
                            onClick={() => setAssignmentsOpen((prev) => !prev)}
                            className="inline-flex items-center justify-center h-7 px-2.5 text-xs rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          >
                            {assignmentsOpen ? 'Ocultar' : 'Ver'}
                          </button>
                        </div>
                      </div>
                      {!assignmentsOpen ? (
                        <p className="text-xs text-slate-500 mb-3">
                          {(selectedDetail.assignments || []).filter((a) => a.activo).length} asignaciones activas.
                        </p>
                      ) : (
                        <>
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
                        </>
                      )}
                    </section>

                    <section className="border-t border-slate-200 pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={() => setExtraHoursOpen((prev) => !prev)}
                          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                        >
                          Horas extra por facturar
                        </button>
                        <div className="flex items-center gap-2">
                          {extraHoursOpen && selectedDetail.estado !== 'cancelado' && selectedDetail.estado !== 'completado' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setExtraHoursEditorOpen((prev) => !prev);
                                if (extraHoursEditorOpen) {
                                  resetExtraHoursForm();
                                } else {
                                  setExtraHoursEditingId('');
                                }
                              }}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              title={extraHoursEditorOpen ? 'Cerrar carga de horas extra' : 'Agregar horas extra'}
                              aria-label={extraHoursEditorOpen ? 'Cerrar carga de horas extra' : 'Agregar horas extra'}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setExtraHoursOpen((prev) => !prev)}
                            className="inline-flex items-center justify-center h-7 px-2.5 text-xs rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          >
                            {extraHoursOpen ? 'Ocultar' : 'Ver'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                        <div className="px-3 py-2 rounded-lg border border-amber-100 bg-amber-50/70">
                          <p className="text-[11px] text-slate-500">Acumulado de horas</p>
                          <p className="text-sm font-semibold text-amber-700">{Number(extraHoursQuickStats.horas || 0).toLocaleString('es-AR')} hs</p>
                        </div>
                        <div className="px-3 py-2 rounded-lg border border-emerald-100 bg-emerald-50/70">
                          <p className="text-[11px] text-slate-500">Pendiente de cobro (horas x valor hora)</p>
                          <p className="text-sm font-semibold text-emerald-700">${Number(extraHoursQuickStats.cobro || 0).toLocaleString('es-AR')}</p>
                        </div>
                        <div className="px-3 py-2 rounded-lg border border-violet-100 bg-violet-50/70">
                          <p className="text-[11px] text-slate-500">Pendiente de pago (horas x costo hora)</p>
                          <p className="text-sm font-semibold text-violet-700">${Number(extraHoursQuickStats.pago || 0).toLocaleString('es-AR')}</p>
                        </div>
                      </div>

                      {extraHoursOpen && (
                        <>
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
                              <div className="grid grid-cols-2 gap-2">
                                {extraHoursEditingId ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-full border border-slate-300"
                                    onClick={() => {
                                      resetExtraHoursForm();
                                      setExtraHoursEditorOpen(false);
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                ) : null}
                                <Button type="submit" size="sm" className={`h-full ${extraHoursEditingId ? '' : 'col-span-2'}`}>
                                  {extraHoursEditingId ? 'Guardar cambios' : 'Guardar hora extra'}
                                </Button>
                              </div>
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

                      <div className="rounded-xl border border-amber-100 overflow-hidden bg-white mb-4">
                        <table className="w-full text-sm">
                          <thead className="bg-amber-50">
                            <tr className="text-left text-slate-600">
                              <th className="px-3 py-2 font-semibold">Período</th>
                              <th className="px-3 py-2 font-semibold">Cuidador</th>
                              <th className="px-3 py-2 font-semibold">Horas acumuladas</th>
                              <th className="px-3 py-2 font-semibold">Cobro pendiente</th>
                              <th className="px-3 py-2 font-semibold">Pago pendiente</th>
                              <th className="px-3 py-2 font-semibold">Registros</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extraHoursAccumulatedRows.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-3 py-4 text-center text-slate-500">Sin acumulados en el período seleccionado.</td>
                              </tr>
                            )}
                            {extraHoursAccumulatedRows.map((row) => (
                              <tr key={row.key} className="border-t border-amber-100">
                                <td className="px-3 py-2 text-slate-600">{row.periodLabel}</td>
                                <td className="px-3 py-2 text-slate-600">{row.caregiverNombre}</td>
                                <td className="px-3 py-2 text-slate-700">{Number(row.horas || 0).toLocaleString('es-AR')} hs</td>
                                <td className="px-3 py-2 text-slate-700">${Number(row.montoCobro || 0).toLocaleString('es-AR')}</td>
                                <td className="px-3 py-2 text-slate-700">${Number(row.montoPago || 0).toLocaleString('es-AR')}</td>
                                <td className="px-3 py-2 text-slate-600">{row.registros}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-500">Registros cargados (uno por uno).</p>
                        <button
                          type="button"
                          onClick={() => navigate('/admin/finanzas?tab=cobros&estado=pendiente')}
                          className="text-xs px-2.5 py-1 rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                        >
                          Gestionar en finanzas
                        </button>
                      </div>

                      <div className="rounded-xl border border-amber-100 overflow-x-auto bg-white mb-5">
                        <table className="w-full text-sm min-w-[980px]">
                          <thead className="bg-amber-50">
                            <tr className="text-left text-slate-600">
                              <th className="px-3 py-2 font-semibold">
                                <div className="flex items-center gap-2">
                                  <span>Período</span>
                                  <select
                                    value={extraHoursMonthFilter}
                                    onChange={(e) => setExtraHoursMonthFilter(e.target.value)}
                                    className="h-7 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 font-normal"
                                  >
                                    <option value="all">Todos</option>
                                    {extraHoursPeriodOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {formatMonthYearLabel(option.year, option.month)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </th>
                              <th className="px-3 py-2 font-semibold">Cuidador</th>
                              <th className="px-3 py-2 font-semibold">Fecha</th>
                              <th className="px-3 py-2 font-semibold">Horas</th>
                              <th className="px-3 py-2 font-semibold">Valor hora cobro</th>
                              <th className="px-3 py-2 font-semibold">Costo hora pago</th>
                              <th className="px-3 py-2 font-semibold">Cobro pendiente</th>
                              <th className="px-3 py-2 font-semibold">Pago pendiente</th>
                              <th className="px-3 py-2 font-semibold">Estado cobro</th>
                              <th className="px-3 py-2 font-semibold">Estado pago</th>
                              <th className="px-3 py-2 font-semibold">Concepto</th>
                              <th className="px-3 py-2 font-semibold text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extraHoursDetailRows.length === 0 && (
                              <tr>
                                <td colSpan={12} className="px-3 py-4 text-center text-slate-500">Sin horas extra registradas.</td>
                              </tr>
                            )}
                            {extraHoursDetailRows.map((row) => (
                              <tr key={row.id} className="border-t border-amber-100">
                                <td className="px-3 py-2 text-slate-600">{row.periodLabel}</td>
                                <td className="px-3 py-2 text-slate-700">{row.caregiverNombre}</td>
                                <td className="px-3 py-2 text-slate-600">
                                  {row.fecha ? format(new Date(row.fecha), 'dd/MM/yyyy') : '-'}
                                </td>
                                <td className="px-3 py-2 text-slate-700">{Number(row.horas || 0).toLocaleString('es-AR')} hs</td>
                                <td className="px-3 py-2 text-slate-600">
                                  {row.valorHoraCobro !== null ? `$${Number(row.valorHoraCobro).toLocaleString('es-AR')}` : '-'}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {row.valorHoraPago !== null ? `$${Number(row.valorHoraPago).toLocaleString('es-AR')}` : '-'}
                                </td>
                                <td className="px-3 py-2 text-slate-700">${Number(row.montoCobro || 0).toLocaleString('es-AR')}</td>
                                <td className="px-3 py-2 text-slate-700">${Number(row.montoPago || 0).toLocaleString('es-AR')}</td>
                                <td className={`px-3 py-2 text-xs font-medium ${row.cobroEstado === 'pagado' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {row.cobroEstado === 'pagado' ? 'Pagado' : 'Pendiente'}
                                </td>
                                <td className={`px-3 py-2 text-xs font-medium ${row.pagoEstado === 'pagado' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {row.pagoEstado === 'pagado' ? 'Pagado' : 'Pendiente'}
                                </td>
                                <td className="px-3 py-2 text-slate-600">{row.concepto || '-'}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => startExtraHoursEdit(row)}
                                      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                                      title="Editar"
                                      aria-label="Editar registro"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteExtraHoursDetail(row)}
                                      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                      title="Eliminar"
                                      aria-label="Eliminar registro"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                        </>
                      )}
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                          ? `Horas extra · ${extraInfo?.month && extraInfo?.year ? formatMonthYearLabel(extraInfo.year, extraInfo.month) : formatPeriodo(mov)}`
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
                                        ? formatMonthYearLabel(extraInfo.year, extraInfo.month)
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
