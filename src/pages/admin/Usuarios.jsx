import React, { useMemo, useState } from 'react';
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { acompanantes, clientes } from '@/data/mockData';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { AdminQuickMenu } from '@/components/AdminQuickMenu';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'cuidador', label: 'Cuidador' },
  { value: 'paciente', label: 'Paciente' },
];

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
];

const ROLE_STYLE = {
  admin: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  superadmin: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  cuidador: 'border-sky-200 bg-sky-50 text-sky-700',
  paciente: 'border-violet-200 bg-violet-50 text-violet-700',
};

function roleLabel(role) {
  if (role === 'superadmin') return 'Admin';
  return ROLES.find((r) => r.value === role)?.label || role;
}

export function Usuarios() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { appUsers, createAppUser, updateAppUser, deleteAppUser, user } = useAuth();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    codigo: '',
    rol: 'admin',
    estado: 'activo',
    caregiverId: '',
    clienteId: '',
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = Array.isArray(appUsers) ? appUsers : [];
    if (!q) return base;
    return base.filter((u) =>
      [u.nombre, u.email, u.rol, u.estado, u.codigo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [appUsers, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: '',
      email: '',
      password: '',
      codigo: '',
      rol: 'admin',
      estado: 'activo',
      caregiverId: '',
      clienteId: '',
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      nombre: item.nombre || '',
      email: item.email || '',
      password: item.password || '',
      codigo: item.codigo || '',
      rol: item.rol === 'superadmin' ? 'admin' : (item.rol || 'admin'),
      estado: item.estado || 'activo',
      caregiverId: item.caregiverId || '',
      clienteId: item.clienteId || '',
    });
    setModalOpen(true);
  };

  const submit = (e) => {
    e.preventDefault();
    if (form.rol === 'paciente' && !String(form.clienteId || '').trim()) {
      showError('Seleccioná un paciente para el usuario');
      return;
    }
    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      password: form.password,
      codigo: form.codigo.trim(),
      rol: form.rol,
      estado: form.estado,
      caregiverId: form.rol === 'cuidador' ? (form.caregiverId || null) : null,
      clienteId: form.rol === 'paciente' ? form.clienteId : null,
    };

    const result = editing ? updateAppUser(editing.id, payload) : createAppUser(payload);
    if (!result?.success) {
      showError(result?.error || 'No se pudo guardar el usuario');
      return;
    }
    showSuccess(editing ? 'Usuario actualizado' : 'Usuario creado');
    setModalOpen(false);
  };

  const confirmDeleteUser = () => {
    const result = deleteAppUser(confirmDelete.id);
    if (!result?.success) {
      showError(result?.error || 'No se pudo eliminar el usuario');
      return;
    }
    showSuccess('Usuario eliminado');
    setConfirmDelete(null);
    setConfirmText('');
  };

  return (
    <div className="min-h-screen bg-light">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-light-200 rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6 text-dark" />
              </button>
              <h1 className="text-xl font-bold text-dark">Usuarios</h1>
            </div>
            <AdminQuickMenu />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario por nombre, email, rol o código..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo usuario
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {rows.map((item) => (
            <Card key={item.id} className="bg-white border border-slate-200 shadow-sm">
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{item.nombre}</p>
                    <p className="text-sm text-slate-500">{item.email || 'Sin email'}</p>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_STYLE[item.rol] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                        {roleLabel(item.rol)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${item.estado === 'activo' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                        {item.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                      {item.codigo && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                          Código: {item.codigo}
                        </span>
                      )}
                      {user?.id === item.id && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                          Sesión actual
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDelete(item);
                        setConfirmText('');
                      }}
                      className="w-9 h-9 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center justify-center"
                      disabled={user?.id === item.id}
                      title={user?.id === item.id ? 'No podés eliminar tu propio usuario' : 'Eliminar usuario'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'} size="sm">
        <form onSubmit={submit} className="space-y-3">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))} required />

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Rol</label>
            <select
              value={form.rol}
              onChange={(e) => setForm((prev) => ({ ...prev, rol: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {(form.rol === 'admin' || form.rol === 'cuidador') && (
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          )}

          {form.rol === 'admin' && (
            <Input
              label="Contraseña"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required={!editing}
            />
          )}

          {(form.rol === 'cuidador' || form.rol === 'paciente') && (
            <Input
              label="Código de acceso"
              value={form.codigo}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
              required
            />
          )}

          {form.rol === 'cuidador' && (
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Cuidador vinculado (opcional)</label>
              <select
                value={form.caregiverId}
                onChange={(e) => setForm((prev) => ({ ...prev, caregiverId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="">Sin vincular</option>
                {acompanantes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {form.rol === 'paciente' && (
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Paciente vinculado</label>
              <select
                value={form.clienteId}
                onChange={(e) => setForm((prev) => ({ ...prev, clienteId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                required
              >
                <option value="">Seleccionar paciente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
            >
              {ESTADOS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 mt-2">
            <Button type="button" variant="ghost" fullWidth onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" fullWidth>{editing ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación" size="sm">
        <p className="text-sm text-slate-700">Escribí <strong>ELIMINAR</strong> para confirmar la baja de {confirmDelete?.nombre}.</p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="ELIMINAR"
          className="w-full mt-3 px-3 py-2 rounded-xl border border-rose-200 bg-white text-sm"
        />
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="ghost" fullWidth onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button
            type="button"
            variant="danger"
            fullWidth
            disabled={confirmText.trim().toUpperCase() !== 'ELIMINAR'}
            onClick={confirmDeleteUser}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Usuarios;
