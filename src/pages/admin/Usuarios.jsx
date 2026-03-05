import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/services/adminApi';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { AdminQuickMenu } from '@/components/AdminQuickMenu';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
];

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
];

const ROLE_STYLE = {
  admin: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  superadmin: 'border-slate-200 bg-slate-100 text-slate-700',
};

function roleLabel(role) {
  return ROLES.find((r) => r.value === role)?.label || role || 'Admin';
}

function formatDate(value) {
  if (!value) return 'Nunca';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nunca';
  return date.toLocaleString('es-AR');
}

function createEmptyForm() {
  return {
    nombre: '',
    email: '',
    password: '',
    rol: 'admin',
    estado: 'activo',
  };
}

export function Usuarios() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [form, setForm] = useState(createEmptyForm());

  const canManageUsers = user?.rol === 'superadmin';
  const currentSessionUserId = String(user?.userId || user?.id || '');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const payload = await adminApi.getAdminUsers();
      setRows(Array.isArray(payload) ? payload : []);
    } catch (error) {
      showError(error?.message || 'No se pudo cargar la lista de usuarios.');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((item) =>
      [item.nombre, item.email, item.rol, item.estado]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(createEmptyForm());
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      nombre: item.nombre || '',
      email: item.email || '',
      password: '',
      rol: item.rol || 'admin',
      estado: item.estado || 'activo',
    });
    setModalOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!canManageUsers) {
      showError('Solo superadmin puede gestionar usuarios.');
      return;
    }

    const payload = {
      nombre: String(form.nombre || '').trim(),
      email: String(form.email || '').trim().toLowerCase(),
      rol: form.rol,
      estado: form.estado,
    };

    if (!payload.nombre || !payload.email) {
      showError('Completá nombre y email.');
      return;
    }

    const password = String(form.password || '');
    if (!editing && !password.trim()) {
      showError('Definí una contraseña para el usuario.');
      return;
    }
    if (password.trim()) {
      payload.password = password;
    }

    try {
      if (editing) {
        await adminApi.updateAdminUser(editing.id, payload);
        showSuccess('Usuario actualizado.');
      } else {
        await adminApi.createAdminUser(payload);
        showSuccess('Usuario creado.');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(createEmptyForm());
      await loadUsers();
    } catch (error) {
      showError(error?.message || 'No se pudo guardar el usuario.');
    }
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete?.id) return;
    try {
      await adminApi.deleteAdminUser(confirmDelete.id);
      showSuccess('Usuario eliminado.');
      setConfirmDelete(null);
      setConfirmText('');
      await loadUsers();
    } catch (error) {
      showError(error?.message || 'No se pudo eliminar el usuario.');
    }
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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, email, rol o estado..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
              {canManageUsers && (
                <Button onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo usuario
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent>
              <div className="py-10 flex items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando usuarios...
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRows.map((item) => {
              const isCurrentSession = currentSessionUserId && currentSessionUserId === item.id;
              return (
                <Card key={item.id} className="bg-white border border-slate-200 shadow-sm">
                  <CardContent>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">{item.nombre}</p>
                        <p className="text-sm text-slate-500">{item.email}</p>
                        <p className="text-xs text-slate-400 mt-1">Último acceso: {formatDate(item.lastLoginAt)}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_STYLE[item.rol] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                            {roleLabel(item.rol)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${item.estado === 'activo' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                            {item.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                          {isCurrentSession && (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                              Sesión actual
                            </span>
                          )}
                        </div>
                      </div>
                      {canManageUsers && (
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
                            disabled={isCurrentSession}
                            title={isCurrentSession ? 'No podés eliminar tu propio usuario' : 'Eliminar usuario'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {!filteredRows.length && (
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent>
                  <p className="py-10 text-center text-slate-500">No hay usuarios para mostrar.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'} size="sm">
        <form onSubmit={submit} className="space-y-3">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
            required
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />

          <Input
            label={editing ? 'Contraseña (opcional)' : 'Contraseña'}
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required={!editing}
          />

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Rol</label>
            <select
              value={form.rol}
              onChange={(event) => setForm((prev) => ({ ...prev, rol: event.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Estado</label>
            <select
              value={form.estado}
              onChange={(event) => setForm((prev) => ({ ...prev, estado: event.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
            >
              {ESTADOS.map((state) => (
                <option key={state.value} value={state.value}>{state.label}</option>
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
          onChange={(event) => setConfirmText(event.target.value)}
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
