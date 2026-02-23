import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { adminApi } from '@/services/adminApi';

const METODOS = ['mercado_pago', 'transferencia', 'electronico', 'efectivo'];
const COBRADORES = ['Gustavo', 'Marina'];
const TAB_COBROS = 'cobros';
const TAB_PAGOS = 'pagos';

export function Finanzas() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const now = new Date();

  const [tab, setTab] = useState(TAB_COBROS);
  const [movimientosTotales, setMovimientosTotales] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [cuidadores, setCuidadores] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [selectedYear, setSelectedYear] = useState(2026);
  const [estadoFiltro, setEstadoFiltro] = useState('todos');

  const [rangoCobrosDesde, setRangoCobrosDesde] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [rangoCobrosHasta, setRangoCobrosHasta] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [rangoPagosDesde, setRangoPagosDesde] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [rangoPagosHasta, setRangoPagosHasta] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  const [registroModal, setRegistroModal] = useState({
    open: false,
    mode: 'create',
    movementId: '',
    tipo: 'cobro',
    serviceId: '',
    patientId: '',
    caregiverId: '',
    monto: '',
    categoria: 'mensualidad',
    metodo: 'transferencia',
    fechaPago: now.toISOString().slice(0, 10),
    estado: 'cobrado',
    registradoPor: 'Gustavo',
    notas: '',
    periodType: 'month',
    year: 2026,
    month: now.getMonth() + 1,
  });
  const [cameFromServiciosFlow, setCameFromServiciosFlow] = useState(false);
  const [returnServiceId, setReturnServiceId] = useState('');

  const loadData = async () => {
    try {
      const [pacientesData, cuidadoresData, serviciosData] = await Promise.all([
        adminApi.getClientes(),
        adminApi.getAcompanantes(),
        adminApi.getServicios(),
      ]);
      const todos = await adminApi.getFinanzasMovimientos();
      setMovimientosTotales(todos);
      setPacientes(pacientesData);
      setCuidadores(cuidadoresData.filter((c) => c.estado === 'activo'));
      setServicios(serviciosData.filter((s) => s.estado === 'en_curso'));
    } catch (error) {
      showError(error.message || 'No se pudo cargar el módulo de finanzas');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const serviciosEnCurso = useMemo(
    () => servicios.filter((s) => s.estado === 'en_curso'),
    [servicios]
  );

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const serviceId = qs.get('serviceId');
    const fromServicios = qs.get('from') === 'servicios';
    if (!serviceId || !servicios.length) return;

    setCameFromServiciosFlow(fromServicios);
    setReturnServiceId(serviceId);

    const year = selectedYear;
    const month = now.getMonth() + 1;
    const service = servicios.find((s) => s.id === serviceId);
    if (!service) return;

    const existing = movimientosTotales.find((m) =>
      m.tipo === 'cobro' &&
      m.serviceId === serviceId &&
      Number(m.year) === year &&
      Number(m.month) === month
    );

    if (qs.get('tab') === 'cobros') setTab(TAB_COBROS);

    if (existing) {
      setRegistroModal({
        open: true,
        mode: 'update',
        movementId: existing.id,
        tipo: existing.tipo,
        serviceId: serviceId,
        patientId: existing.patientId || service.pacienteId || '',
        caregiverId: existing.caregiverId || service.cuidadorId || '',
        monto: String(existing.monto || ''),
        categoria: existing.categoria || 'mensualidad',
        metodo: existing.metodo || 'transferencia',
        fechaPago: new Date().toISOString().slice(0, 10),
        estado: 'cobrado',
        registradoPor: existing.registradoPor || 'Gustavo',
        notas: existing.notas || '',
        periodType: 'month',
        year: Number(existing.year || year),
        month: Number(existing.month || month),
      });
      navigate('/admin/finanzas', { replace: true });
    } else {
      setRegistroModal({
        open: true,
        mode: 'create',
        movementId: '',
        tipo: 'cobro',
        serviceId: serviceId,
        patientId: service.pacienteId || '',
        caregiverId: service.cuidadorId || '',
        monto: '',
        categoria: 'mensualidad',
        metodo: 'transferencia',
        fechaPago: new Date().toISOString().slice(0, 10),
        estado: 'cobrado',
        registradoPor: 'Gustavo',
        notas: `Cobro servicio ${service.paciente?.nombre || ''}`.trim(),
        periodType: 'month',
        year,
        month,
      });
      navigate('/admin/finanzas', { replace: true });
    }
  }, [location.search, servicios, movimientosTotales, navigate, selectedYear]);

  const closeRegistroModal = () => {
    setRegistroModal((prev) => ({ ...prev, open: false }));
    if (cameFromServiciosFlow && returnServiceId) {
      navigate(`/admin/servicios?serviceId=${returnServiceId}`);
    }
  };

  const openNuevoRegistroModal = () => {
    const serviceDefault = serviciosEnCurso[0] || null;
    const serviceDefaultCaregiver = serviceDefault?.caregivers?.[0]?.id || serviceDefault?.cuidadorId || '';
    setRegistroModal({
      open: true,
      mode: 'create',
      movementId: '',
      tipo: tab === TAB_COBROS ? 'cobro' : 'pago',
      serviceId: serviceDefault?.id || '',
      patientId: tab === TAB_COBROS ? (serviceDefault?.pacienteId || '') : '',
      caregiverId: tab === TAB_PAGOS ? serviceDefaultCaregiver : '',
      monto: '',
      categoria: 'mensualidad',
      metodo: 'transferencia',
      fechaPago: new Date().toISOString().slice(0, 10),
      estado: tab === TAB_COBROS ? 'cobrado' : 'pagado',
      registradoPor: 'Gustavo',
      notas: '',
      periodType: 'month',
      year: selectedYear,
      month: now.getMonth() + 1,
    });
  };

  const openEditarRegistroModal = (item) => {
    const baseYear = item.year || now.getFullYear();
    const baseMonth = item.month || (now.getMonth() + 1);
    setRegistroModal({
      open: true,
      mode: 'update',
      movementId: item.id,
      tipo: item.tipo,
      serviceId: item.serviceId || '',
      patientId: item.patientId || '',
      caregiverId: item.caregiverId || '',
      monto: String(item.monto || ''),
      categoria: item.categoria || 'mensualidad',
      metodo: item.metodo || 'transferencia',
      fechaPago: new Date().toISOString().slice(0, 10),
      estado: item.tipo === 'cobro' ? 'cobrado' : 'pagado',
      registradoPor: item.registradoPor || 'Gustavo',
      notas: item.notas || '',
      periodType: item.periodType || 'month',
      year: baseYear,
      month: baseMonth,
    });
  };

  const getCaregiversByService = (serviceId) => {
    const service = serviciosEnCurso.find((s) => s.id === serviceId);
    if (!service) return [];
    const fromAssignments = Array.isArray(service.caregivers)
      ? service.caregivers.map((c) => ({ id: c.id, nombre: c.nombre }))
      : [];
    if (fromAssignments.length > 0) return fromAssignments;
    if (service.cuidadorId) {
      return [{ id: service.cuidadorId, nombre: service.cuidador?.nombre || 'Cuidador' }];
    }
    return [];
  };

  const submitRegistroModal = async (e) => {
    e.preventDefault();
    try {
      const selectedService = registroModal.serviceId
        ? serviciosEnCurso.find((s) => s.id === registroModal.serviceId)
        : null;

      if (registroModal.mode === 'create' && registroModal.tipo === 'cobro' && !selectedService) {
        showError('Seleccioná un servicio en curso para registrar el cobro');
        return;
      }
      if (registroModal.mode === 'create' && registroModal.tipo === 'pago') {
        if (!selectedService) {
          showError('Seleccioná un servicio en curso para registrar el pago');
          return;
        }
        if (!registroModal.caregiverId) {
          showError('Seleccioná un cuidador para registrar el pago');
          return;
        }
      }

      if (registroModal.mode === 'update' && registroModal.movementId) {
        await adminApi.updateFinanzasMovimiento(registroModal.movementId, {
          metodo: registroModal.metodo,
          fechaPago: registroModal.fechaPago || null,
          estado: registroModal.estado,
          registradoPor: registroModal.registradoPor,
          notas: registroModal.notas || null,
        });
      } else {
        await adminApi.createFinanzasMovimiento({
          tipo: registroModal.tipo,
          categoria: registroModal.categoria,
          metodo: registroModal.metodo,
          monto: Number(registroModal.monto || 0),
          fechaPago: registroModal.fechaPago || null,
          estado: registroModal.estado,
          registradoPor: registroModal.registradoPor,
          notas: registroModal.notas || null,
          serviceId: selectedService?.id || null,
          patientId: registroModal.tipo === 'cobro' ? selectedService?.pacienteId || null : null,
          caregiverId: registroModal.tipo === 'pago' ? registroModal.caregiverId || null : null,
          periodType: registroModal.periodType,
          year: Number(registroModal.year || selectedYear),
          month: Number(registroModal.month || (now.getMonth() + 1)),
          week: null,
        });
      }

      showSuccess('Registro guardado');
      if (cameFromServiciosFlow && returnServiceId) {
        navigate(`/admin/servicios?serviceId=${returnServiceId}`);
      } else {
        setRegistroModal((prev) => ({ ...prev, open: false }));
        await loadData();
      }
    } catch (error) {
      showError(error.message || 'No se pudo guardar el registro');
    }
  };

  const movimientosFiltrados = useMemo(
    () => movimientosTotales
      .filter((m) => (tab === TAB_COBROS ? m.tipo === 'cobro' : m.tipo === 'pago'))
      .filter((m) => Number(m.year) === Number(selectedYear))
      .filter((m) => {
        if (estadoFiltro === 'todos') return true;
        const estado = String(m.estado || '').toLowerCase();
        if (estadoFiltro === 'pendiente') return estado === 'pendiente';
        return estado !== 'pendiente';
      })
      .sort((a, b) => {
        const aDate = new Date(a.fechaPago || a.fecha || 0).getTime();
        const bDate = new Date(b.fechaPago || b.fecha || 0).getTime();
        return bDate - aDate;
      }),
    [movimientosTotales, tab, estadoFiltro, selectedYear]
  );

  const calcularAcumulado = (tipo, desde, hasta) => {
    const [fromY, fromM] = String(desde || '').split('-').map(Number);
    const [toY, toM] = String(hasta || '').split('-').map(Number);
    if (!fromY || !fromM || !toY || !toM) return { cobrado: 0, pagado: 0 };

    const fromDate = new Date(fromY, fromM - 1, 1, 0, 0, 0, 0);
    const toDate = new Date(toY, toM, 0, 23, 59, 59, 999);

    const inRange = movimientosTotales.filter((m) => {
      const estado = String(m.estado || '').toLowerCase();
      if (estado === 'pendiente') return false;
      const ref = m.fechaPago ? new Date(m.fechaPago) : new Date(m.fecha);
      return ref >= fromDate && ref <= toDate;
    });

    return inRange
      .filter((m) => m.tipo === tipo)
      .reduce((acc, m) => acc + Number(m.monto || 0), 0);
  };

  const cobradoAcumulado = useMemo(
    () => calcularAcumulado('cobro', rangoCobrosDesde, rangoCobrosHasta),
    [movimientosTotales, rangoCobrosDesde, rangoCobrosHasta]
  );

  const pagadoAcumulado = useMemo(
    () => calcularAcumulado('pago', rangoPagosDesde, rangoPagosHasta),
    [movimientosTotales, rangoPagosDesde, rangoPagosHasta]
  );

  const handleLogout = () => {
    logout();
    showSuccess('Sesion cerrada correctamente');
    navigate('/login');
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const renderPeriodo = (m) => `${months[(m.month || 1) - 1]} ${m.year}`;

  const getNombreMovimiento = (m) => {
    if (m.tipo === 'cobro') {
      if (m.patient?.nombre) return m.patient.nombre;
      const service = m.serviceId ? serviciosEnCurso.find((s) => s.id === m.serviceId) : null;
      return service?.paciente?.nombre || 'Cliente no asignado';
    }
    return m.caregiver?.nombre || 'Cuidador no asignado';
  };

  const handleDeleteMovimiento = async (movimientoId) => {
    try {
      await adminApi.deleteFinanzasMovimiento(movimientoId);
      showSuccess('Registro eliminado');
      await loadData();
    } catch (error) {
      showError(error.message || 'No se pudo eliminar el registro');
    }
  };

  const handleToggleEstadoRapido = async (movimiento) => {
    const isPendiente = String(movimiento.estado || '').toLowerCase() === 'pendiente';
    const estadoObjetivo = isPendiente
      ? (movimiento.tipo === 'cobro' ? 'cobrado' : 'pagado')
      : 'pendiente';
    try {
      await adminApi.updateFinanzasMovimiento(movimiento.id, {
        estado: estadoObjetivo,
        fechaPago: estadoObjetivo === 'pendiente' ? null : new Date().toISOString().slice(0, 10),
      });
      showSuccess(`Estado actualizado: ${estadoObjetivo}`);
      await loadData();
    } catch (error) {
      showError(error.message || 'No se pudo actualizar el estado');
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
              <h1 className="text-xl font-bold text-dark">Modulo de finanzas</h1>
              <p className="text-sm text-slate-500">Cobros y pagos</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesion
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="md:col-span-2">
            <CardContent>
              <p className="text-xs text-slate-500">Cobrado acumulado</p>
              <p className="text-2xl font-bold">${Number(cobradoAcumulado || 0).toLocaleString('es-AR')}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="month"
                  value={rangoCobrosDesde}
                  onChange={(e) => setRangoCobrosDesde(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md border border-slate-200 bg-white text-xs"
                />
                <input
                  type="month"
                  value={rangoCobrosHasta}
                  onChange={(e) => setRangoCobrosHasta(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md border border-slate-200 bg-white text-xs"
                />
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent>
              <p className="text-xs text-slate-500">Pagado acumulado</p>
              <p className="text-2xl font-bold">${Number(pagadoAcumulado || 0).toLocaleString('es-AR')}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="month"
                  value={rangoPagosDesde}
                  onChange={(e) => setRangoPagosDesde(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md border border-slate-200 bg-white text-xs"
                />
                <input
                  type="month"
                  value={rangoPagosHasta}
                  onChange={(e) => setRangoPagosHasta(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md border border-slate-200 bg-white text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab(TAB_COBROS)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${tab === TAB_COBROS ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-300'}`}
          >
            Cobros
          </button>
          <button
            type="button"
            onClick={() => setTab(TAB_PAGOS)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${tab === TAB_PAGOS ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-300'}`}
          >
            Pagos
          </button>

          <div className="w-px h-6 bg-slate-300 mx-1" />

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value || 2026))}
            className="px-3 py-1.5 border rounded-lg bg-white text-sm"
          >
            {Array.from({ length: 8 }, (_, i) => 2024 + i).map((year) => (
              <option key={year} value={year}>
                Año {year}
              </option>
            ))}
          </select>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="px-3 py-1.5 border rounded-lg bg-white text-sm"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">{tab === TAB_COBROS ? 'Cobrado' : 'Pagado'}</option>
          </select>

          <Button type="button" onClick={openNuevoRegistroModal}>
            <Plus className="w-4 h-4 mr-1" />
            {tab === TAB_COBROS ? 'Nuevo cobro' : 'Nuevo pago'}
          </Button>
        </div>

        <Card className="bg-white border border-slate-200">
          <CardContent>
            <h3 className="font-semibold text-dark mb-3">{tab === TAB_COBROS ? 'Lista de cobros' : 'Lista de pagos'}</h3>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {movimientosFiltrados.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-700">
                      {getNombreMovimiento(m)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleEstadoRapido(m)}
                        className={`text-xs px-2 py-0.5 rounded-full border ${String(m.estado).toLowerCase() === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} hover:brightness-95`}
                        title="Cambiar estado"
                      >
                        {m.estado}
                      </button>
                      <span className="text-sm font-semibold text-slate-800">
                        ${Number(m.monto).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {m.categoria || '-'} · {m.metodo.replace('_', ' ')} · {renderPeriodo(m)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Pago: {m.fechaPago ? new Date(m.fechaPago).toLocaleDateString('es-AR') : '-'}
                    {m.registradoPor ? ` · Registrado por: ${m.registradoPor}` : ''}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditarRegistroModal(m)}
                      className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMovimiento(m.id)}
                      className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {movimientosFiltrados.length === 0 && (
                <p className="text-sm text-slate-500">Sin registros cargados.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={registroModal.open}
        onClose={closeRegistroModal}
        title={registroModal.mode === 'update' ? 'Registrar pago/cobro' : 'Nuevo registro de cobro/pago'}
        size="md"
      >
        <form onSubmit={submitRegistroModal} className="space-y-3">
          {registroModal.serviceId && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
              Vinculado a servicio: {servicios.find((s) => s.id === registroModal.serviceId)?.paciente?.nombre || registroModal.serviceId}
            </div>
          )}
          {registroModal.mode === 'create' && (
            <>
              {registroModal.tipo === 'cobro' && (
                <select
                  value={registroModal.serviceId}
                  onChange={(e) => {
                    const selected = serviciosEnCurso.find((s) => s.id === e.target.value);
                    setRegistroModal((prev) => ({
                      ...prev,
                      serviceId: e.target.value,
                      patientId: selected?.pacienteId || '',
                    }));
                  }}
                  className="w-full px-3 py-2 border-2 border-light-300 rounded-xl"
                  required
                >
                  <option value="">Seleccionar servicio en curso</option>
                  {serviciosEnCurso.map((s) => (
                    <option key={s.id} value={s.id}>
                      {(s.paciente?.nombre || 'Paciente sin nombre')} · {s.zona || 'Sin zona'}
                    </option>
                  ))}
                </select>
              )}
              {registroModal.tipo === 'pago' && (
                <>
                  <select
                    value={registroModal.serviceId}
                    onChange={(e) => {
                      const selectedService = serviciosEnCurso.find((s) => s.id === e.target.value);
                      const firstCaregiver = selectedService?.caregivers?.[0]?.id || selectedService?.cuidadorId || '';
                      setRegistroModal((prev) => ({
                        ...prev,
                        serviceId: e.target.value,
                        caregiverId: firstCaregiver,
                      }));
                    }}
                    className="w-full px-3 py-2 border-2 border-light-300 rounded-xl"
                    required
                  >
                    <option value="">Seleccionar servicio en curso</option>
                    {serviciosEnCurso.map((s) => (
                      <option key={s.id} value={s.id}>
                        {(s.paciente?.nombre || 'Paciente sin nombre')} · {s.zona || 'Sin zona'}
                      </option>
                    ))}
                  </select>
                  <select
                    value={registroModal.caregiverId}
                    onChange={(e) => setRegistroModal((prev) => ({ ...prev, caregiverId: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-light-300 rounded-xl"
                    required
                  >
                    <option value="">Seleccionar cuidador asignado</option>
                    {getCaregiversByService(registroModal.serviceId).map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </>
              )}
              <input
                type="number"
                value={registroModal.monto}
                onChange={(e) => setRegistroModal((prev) => ({ ...prev, monto: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-light-300 rounded-xl"
                placeholder="Monto"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={registroModal.year}
                  onChange={(e) => setRegistroModal((prev) => ({ ...prev, year: Number(e.target.value || selectedYear) }))}
                  className="px-3 py-2 border-2 border-light-300 rounded-xl"
                  placeholder="Año"
                />
                <select
                  value={registroModal.month}
                  onChange={(e) => setRegistroModal((prev) => ({ ...prev, month: Number(e.target.value) }))}
                  className="px-3 py-2 border-2 border-light-300 rounded-xl"
                >
                  {months.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <select
              value={registroModal.metodo}
              onChange={(e) => setRegistroModal((prev) => ({ ...prev, metodo: e.target.value }))}
              className="px-3 py-2 border-2 border-light-300 rounded-xl"
            >
              {METODOS.map((m) => (
                <option key={m} value={m}>{m.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              value={registroModal.registradoPor}
              onChange={(e) => setRegistroModal((prev) => ({ ...prev, registradoPor: e.target.value }))}
              className="px-3 py-2 border-2 border-light-300 rounded-xl"
            >
              {COBRADORES.map((persona) => (
                <option key={persona} value={persona}>{persona}</option>
              ))}
            </select>
          </div>

          <input
            type="date"
            value={registroModal.fechaPago}
            onChange={(e) => setRegistroModal((prev) => ({ ...prev, fechaPago: e.target.value }))}
            className="w-full px-3 py-2 border-2 border-light-300 rounded-xl"
            required
          />

          <select
            value={registroModal.estado}
            onChange={(e) => setRegistroModal((prev) => ({ ...prev, estado: e.target.value }))}
            className="w-full px-3 py-2 border-2 border-light-300 rounded-xl"
          >
            <option value={registroModal.tipo === 'cobro' ? 'cobrado' : 'pagado'}>
              {registroModal.tipo === 'cobro' ? 'Cobrado' : 'Pagado'}
            </option>
            <option value="pendiente">Pendiente</option>
          </select>

          <textarea
            value={registroModal.notas}
            onChange={(e) => setRegistroModal((prev) => ({ ...prev, notas: e.target.value }))}
            className="w-full px-3 py-2 border-2 border-light-300 rounded-xl resize-none"
            rows={3}
            placeholder="Notas"
          />

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="w-1/2 border border-slate-300"
              onClick={closeRegistroModal}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-1/2">
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Finanzas;
