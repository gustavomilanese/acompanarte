import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MapPin,
  ChevronLeft,
  User
} from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { adminApi } from '@/services/adminApi';
import { formatTipoCliente } from '@/utils/formatters';
import { AdminQuickMenu } from '@/components/AdminQuickMenu';

function getInitials(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'P';
}

function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

function getEmptyClienteFormData() {
  return {
    nombre: '',
    edad: '',
    tipo: 'adulto_mayor',
    condicion: '',
    direccion: '',
    contactoEmergencia: {
      nombre: '',
      telefono: '',
    },
    acompananteAsignado: '',
    foto: '',
    notas: '',
    necesidadesEspeciales: [],
  };
}

function mapClienteToFormData(cliente) {
  return {
    nombre: cliente.nombre,
    edad: cliente.edad,
    tipo: cliente.tipo,
    condicion: cliente.condicion,
    direccion: cliente.direccion,
    contactoEmergencia: cliente.contactoEmergencia || { nombre: '', telefono: '' },
    acompananteAsignado: cliente.acompananteAsignado || '',
    foto: cliente.foto || '',
    notas: cliente.notas || '',
    necesidadesEspeciales: cliente.necesidadesEspeciales || [],
  };
}

export function Clientes() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [clientes, setClientes] = useState([]);
  const [acompanantes, setAcompanantes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);
  const detailRequestRef = useRef(0);

  const [formData, setFormData] = useState(getEmptyClienteFormData);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientesData, acompanantesData] = await Promise.all([
          adminApi.getClientes(),
          adminApi.getAcompanantes(),
        ]);

        setClientes(clientesData);
        setAcompanantes(acompanantesData);
      } catch (error) {
        showError(error.message || 'No se pudieron cargar los datos');
      }
    };

    loadData();
  }, [showError]);

  const filteredClientes = clientes.filter((c) => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.condicion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
    return matchesSearch && matchesTipo;
  });

  const closeModal = () => {
    detailRequestRef.current += 1;
    setIsDetailLoading(false);
    setShowModal(false);
  };

  const handleOpenModal = async (cliente = null) => {
    if (!cliente) {
      setEditingCliente(null);
      setFormData(getEmptyClienteFormData());
      setIsDetailLoading(false);
      setShowModal(true);
      return;
    }

    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setEditingCliente(cliente);
    setFormData(getEmptyClienteFormData());
    setIsDetailLoading(true);
    setShowModal(true);

    try {
      const detail = await adminApi.getCliente(cliente.id);
      if (detailRequestRef.current !== requestId) return;
      setEditingCliente(detail);
      setFormData(mapClienteToFormData(detail));
    } catch (error) {
      if (detailRequestRef.current !== requestId) return;
      setShowModal(false);
      setEditingCliente(null);
      showError(error.message || 'No se pudo cargar el paciente');
    } finally {
      if (detailRequestRef.current === requestId) {
        setIsDetailLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        edad: Number(formData.edad),
      };

      if (editingCliente) {
        const updated = await adminApi.updateCliente(editingCliente.id, payload);
        setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showSuccess('Paciente actualizado correctamente');
      } else {
        const created = await adminApi.createCliente(payload);
        setClientes((prev) => [...prev, created]);
        showSuccess('Paciente creado correctamente');
      }

      setShowModal(false);
    } catch (error) {
      showError(error.message || 'No se pudo guardar el paciente');
    }
  };

  const executeDeletePaciente = async (paciente) => {
    try {
      await adminApi.deleteCliente(paciente.id);
      setClientes((prev) => prev.filter((c) => c.id !== paciente.id));
      setShowModal(false);
      showSuccess('Paciente dado de baja correctamente');
    } catch (error) {
      showError(error.message || 'No se pudo dar de baja el paciente');
    }
  };

  const handleDeletePaciente = (paciente) => {
    setConfirmDeleteModal(paciente);
  };

  const handleFotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Seleccioná un archivo de imagen válido.');
      return;
    }
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setFormData((prev) => ({ ...prev, foto: dataUrl }));
    } catch (error) {
      showError(error.message || 'No se pudo cargar la imagen');
    }
  };

  const getAcompananteNombre = (id) => {
    const a = acompanantes.find((ac) => ac.id === id);
    return a?.nombre || 'Sin asignar';
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
              <h1 className="text-xl font-bold text-dark">Pacientes</h1>
            </div>
            <AdminQuickMenu />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
            />
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
          >
            <option value="todos">Todos</option>
            <option value="adulto_mayor">Adultos Mayores</option>
            <option value="nino">Niños</option>
          </select>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-3">
          {filteredClientes.map((cliente) => (
            <Card key={cliente.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {cliente.foto ? (
                      <img
                        src={cliente.foto}
                        alt={cliente.nombre}
                        className="w-14 h-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-semibold">
                        {getInitials(cliente.nombre)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-dark">{cliente.nombre}</h3>
                        <Badge
                          variant={cliente.tipo === 'adulto_mayor' ? 'primary' : 'accent'}
                          size="sm"
                        >
                          {formatTipoCliente(cliente.tipo)}
                        </Badge>
                      </div>
                      <p className="text-sm text-dark-400 mt-1">
                        {cliente.edad} años · {cliente.condicion}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-dark-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {cliente.direccion}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-sm text-dark-500">
                          {getAcompananteNombre(cliente.acompananteAsignado)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(cliente)}
                      className="px-3 py-2 text-sm font-medium hover:bg-light-200 rounded-lg transition-colors"
                      title="Modificar paciente"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletePaciente(cliente)}
                      className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors inline-flex items-center gap-2"
                      title="Eliminar paciente"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        isOpen={Boolean(confirmDeleteModal)}
        onClose={() => setConfirmDeleteModal(null)}
        title="Confirmar eliminación"
        size="sm"
      >
        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 p-3">
          <p className="text-sm text-slate-700">
            ¿Querés eliminar a <strong>{confirmDeleteModal?.nombre || 'este paciente'}</strong>?
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="ghost" fullWidth onClick={() => setConfirmDeleteModal(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            fullWidth
            onClick={async () => {
              try {
                if (confirmDeleteModal) {
                  await executeDeletePaciente(confirmDeleteModal);
                }
              } finally {
                setConfirmDeleteModal(null);
              }
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCliente ? 'Editar paciente' : 'Nuevo paciente'}
        size="lg"
      >
        {isDetailLoading ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-700">Cargando datos del paciente...</p>
            <p className="text-xs text-slate-500 mt-2">La foto completa se trae solo cuando abrís la edición para evitar bloqueos en la página.</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre completo"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
            <Input
              label="Edad"
              type="number"
              value={formData.edad}
              onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Tipo
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
              >
                <option value="adulto_mayor">Adulto Mayor</option>
                <option value="nino">Niño/a</option>
              </select>
            </div>
            <Input
              label="Condición/Motivo"
              value={formData.condicion}
              onChange={(e) => setFormData({ ...formData, condicion: e.target.value })}
              required
            />
          </div>

          <Input
            label="Dirección"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFotoFileChange}
              className="w-full px-4 py-2 bg-white border-2 border-light-300 rounded-xl text-dark"
            />
            {formData.foto && (
              <div className="mt-3 flex items-center gap-3">
                <img src={formData.foto} alt="Preview" className="w-14 h-14 rounded-2xl object-cover border border-light-300" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, foto: '' }))}
                >
                  Quitar foto
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-light-200 pt-4">
            <p className="font-medium text-dark mb-3">Contacto de emergencia</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                value={formData.contactoEmergencia.nombre}
                onChange={(e) => setFormData({
                  ...formData,
                  contactoEmergencia: { ...formData.contactoEmergencia, nombre: e.target.value }
                })}
                required
              />
              <Input
                label="Teléfono"
                value={formData.contactoEmergencia.telefono}
                onChange={(e) => setFormData({
                  ...formData,
                  contactoEmergencia: { ...formData.contactoEmergencia, telefono: e.target.value }
                })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Acompañante asignado
            </label>
            <select
              value={formData.acompananteAsignado}
              onChange={(e) => setFormData({ ...formData, acompananteAsignado: e.target.value })}
              className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
            >
              <option value="">Seleccionar...</option>
              {acompanantes.filter((a) => a.estado === 'activo').map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark resize-none"
            />
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
            {editingCliente && (
              <Button
                type="button"
                variant="danger"
                fullWidth
                onClick={() => handleDeletePaciente(editingCliente)}
              >
                Dar de baja
              </Button>
            )}
            <Button type="submit" fullWidth>
              {editingCliente ? 'Guardar cambios' : 'Crear paciente'}
            </Button>
          </div>
        </form>
        )}
      </Modal>
    </div>
  );
}

export default Clientes;
