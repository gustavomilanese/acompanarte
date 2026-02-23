import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Plus, Clock3, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { adminApi } from '@/services/adminApi';

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

const METODOS_PAGO = ['transferencia', 'mercado_pago', 'efectivo', 'electronica'];

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

export function Servicios() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
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
  const [paymentEditorOpen, setPaymentEditorOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    periodType: 'month',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    week: '',
    estado: 'pendiente',
    monto: '',
    metodo: 'transferencia',
    fechaPago: '',
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

  const cuidadoresAsignadosDetalle = useMemo(() => {
    if (!selectedDetail) return [];
    return (selectedDetail.assignments || [])
      .filter((a) => a.tipo === 'caregiver' && a.activo)
      .map((a) => a.caregiver?.nombre)
      .filter(Boolean);
  }, [selectedDetail]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [serviciosData, cuidadoresData, movimientosData] = await Promise.all([
        adminApi.getServiciosModulo(),
        adminApi.getAcompanantes(),
        adminApi.getFinanzasMovimientos({ tipo: 'cobro' }),
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
  }, [selectedId]);

  const serviciosFiltrados = useMemo(() => {
    if (statusFilter === 'todos') return servicios;
    if (statusFilter === 'no_pago') {
      return servicios.filter((s) => s.currentMonthPayment?.estado !== 'pagado');
    }
    return servicios.filter((s) => s.estado === statusFilter);
  }, [servicios, statusFilter]);

  const pagosServicio = useMemo(() => {
    if (!selectedDetail) return [];
    return movimientosFinanzas
      .filter((m) => m.tipo === 'cobro' && m.serviceId === selectedDetail.id)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [selectedDetail, movimientosFinanzas]);

  const refreshAll = async () => {
    await loadData();
    if (selectedId) await loadDetail(selectedId);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      periodType: 'month',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      week: '',
      estado: 'pendiente',
      monto: '',
      metodo: 'transferencia',
      fechaPago: '',
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

  const submitPaymentPeriod = async (e) => {
    e.preventDefault();
    if (!selectedDetail) return;
    try {
      if (!paymentForm.year) {
        showError('Completá el año');
        return;
      }
      if (paymentForm.periodType === 'month' && !paymentForm.month) {
        showError('Seleccioná el mes');
        return;
      }
      if (paymentForm.periodType === 'week' && !paymentForm.week) {
        showError('Seleccioná la semana');
        return;
      }
      if (!paymentForm.monto) {
        showError('Completá el monto');
        return;
      }
      await adminApi.createFinanzasMovimiento({
        tipo: 'cobro',
        metodo: paymentForm.metodo,
        monto: Number(paymentForm.monto),
        periodType: paymentForm.periodType,
        year: Number(paymentForm.year),
        month: paymentForm.periodType === 'month' ? Number(paymentForm.month) : null,
        week: paymentForm.periodType === 'week' ? Number(paymentForm.week) : null,
        estado: paymentForm.estado,
        fechaPago: paymentForm.estado === 'pagado' ? (paymentForm.fechaPago || new Date().toISOString()) : null,
        notas: paymentForm.notas || null,
        patientId: selectedDetail.pacienteId,
        caregiverId: selectedDetail.cuidadorId,
        serviceId: selectedDetail.id,
      });
      showSuccess('Período de cobro agregado');
      setPaymentEditorOpen(false);
      resetPaymentForm();
      await refreshAll();
    } catch (error) {
      showError(error.message || 'No se pudo registrar el período');
    }
  };

  const updatePaymentStatus = async (mov, estado) => {
    try {
      await adminApi.updateFinanzasMovimiento(mov.id, {
        estado,
        fechaPago: estado === 'pagado' ? (mov.fechaPago || new Date().toISOString()) : null,
      });
      showSuccess(estado === 'pagado' ? 'Cobro marcado como pagado' : 'Cobro marcado como pendiente');
      await refreshAll();
    } catch (error) {
      showError(error.message || 'No se pudo actualizar el cobro');
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
        await adminApi.resumeServicioModulo(selectedDetail.id, 'Reanudación manual desde ficha');
        showSuccess('Servicio reanudado');
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

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/login');
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
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
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
                        <p className="text-sm font-semibold text-slate-700">Estado de cobros del servicio</p>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentEditorOpen((prev) => !prev);
                            if (paymentEditorOpen) resetPaymentForm();
                          }}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                          title={paymentEditorOpen ? 'Cerrar alta de período' : 'Agregar período'}
                          aria-label={paymentEditorOpen ? 'Cerrar alta de período' : 'Agregar período'}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {paymentEditorOpen && (
                        <form onSubmit={submitPaymentPeriod} className="rounded-xl border border-violet-100 bg-white p-3 mb-3 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <select
                              value={paymentForm.periodType}
                              onChange={(e) => setPaymentForm((prev) => ({ ...prev, periodType: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              <option value="month">Mensual</option>
                              <option value="week">Semanal</option>
                            </select>
                            <input
                              type="number"
                              min="2020"
                              max="2100"
                              value={paymentForm.year}
                              onChange={(e) => setPaymentForm((prev) => ({ ...prev, year: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              placeholder="Año"
                              required
                            />
                            {paymentForm.periodType === 'month' ? (
                              <select
                                value={paymentForm.month}
                                onChange={(e) => setPaymentForm((prev) => ({ ...prev, month: e.target.value }))}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                required
                              >
                                {Array.from({ length: 12 }, (_, idx) => (
                                  <option key={idx + 1} value={idx + 1}>
                                    {new Date(2026, idx, 1).toLocaleDateString('es-AR', { month: 'long' })}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="number"
                                min="1"
                                max="53"
                                value={paymentForm.week}
                                onChange={(e) => setPaymentForm((prev) => ({ ...prev, week: e.target.value }))}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                placeholder="Semana (1-53)"
                                required
                              />
                            )}
                            <select
                              value={paymentForm.estado}
                              onChange={(e) => setPaymentForm((prev) => ({ ...prev, estado: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="pagado">Pagado</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={paymentForm.monto}
                              onChange={(e) => setPaymentForm((prev) => ({ ...prev, monto: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              placeholder="Monto"
                              required
                            />
                            <select
                              value={paymentForm.metodo}
                              onChange={(e) => setPaymentForm((prev) => ({ ...prev, metodo: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              {METODOS_PAGO.map((metodo) => (
                                <option key={metodo} value={metodo}>{metodo.replace('_', ' ')}</option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={paymentForm.fechaPago}
                              onChange={(e) => setPaymentForm((prev) => ({ ...prev, fechaPago: e.target.value }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              disabled={paymentForm.estado !== 'pagado'}
                            />
                            <Button type="submit" size="sm" className="h-full">
                              Guardar período
                            </Button>
                          </div>
                        </form>
                      )}

                      <div className="rounded-xl border border-violet-100 overflow-hidden bg-white">
                        <table className="w-full text-sm">
                          <thead className="bg-violet-50">
                            <tr className="text-left text-slate-600">
                              <th className="px-3 py-2 font-semibold">Período</th>
                              <th className="px-3 py-2 font-semibold">Monto</th>
                              <th className="px-3 py-2 font-semibold">Estado</th>
                              <th className="px-3 py-2 font-semibold">Fecha pago</th>
                              <th className="px-3 py-2 font-semibold text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagosServicio.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-3 py-4 text-center text-slate-500">Sin períodos registrados.</td>
                              </tr>
                            )}
                            {pagosServicio.map((mov) => (
                              <tr key={mov.id} className="border-t border-violet-100">
                                <td className="px-3 py-2 capitalize">{formatPeriodo(mov)}</td>
                                <td className="px-3 py-2">${Number(mov.monto || 0).toLocaleString('es-AR')}</td>
                                <td className="px-3 py-2">
                                  <span className={`text-xs px-2 py-1 rounded-full border ${
                                    String(mov.estado).toLowerCase() === 'pagado'
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-100 text-amber-700 border-amber-200'
                                  }`}>
                                    {String(mov.estado).toLowerCase() === 'pagado' ? 'Pagado' : 'Pendiente'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-500">
                                  {mov.fechaPago ? format(new Date(mov.fechaPago), 'dd/MM/yyyy') : '-'}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updatePaymentStatus(mov, 'pagado')}
                                      className="text-xs px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    >
                                      Pagado
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updatePaymentStatus(mov, 'pendiente')}
                                      className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    >
                                      Pendiente
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
