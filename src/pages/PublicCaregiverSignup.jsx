import React, { useMemo, useState } from 'react';
import { ShieldCheck, Send } from 'lucide-react';
import { adminApi } from '@/services/adminApi';

const PROVINCIAS_ARG = [
  'CABA',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Cordoba',
  'Corrientes',
  'Entre Rios',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquen',
  'Rio Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucuman',
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
  'Almirante Brown', 'Avellaneda', 'Berazategui', 'Berisso', 'Brandsen', 'Campana', 'Canuelas',
  'Ensenada', 'Escobar', 'Esteban Echeverria', 'Ezeiza', 'Exaltacion de la Cruz', 'Florencio Varela',
  'General Las Heras', 'General Rodriguez', 'General San Martin', 'Hurlingham', 'Ituzaingo',
  'Jose C. Paz', 'La Matanza', 'La Plata', 'Lanus', 'Lomas de Zamora', 'Lujan',
  'Malvinas Argentinas', 'Marcos Paz', 'Merlo', 'Moreno', 'Moron', 'Pilar', 'Presidente Peron',
  'Quilmes', 'San Fernando', 'San Isidro', 'San Miguel', 'San Vicente', 'Tigre',
  'Tres de Febrero', 'Vicente Lopez', 'Zarate',
];

const TIPO_PERFIL_OPTIONS = [
  { value: 'cuidador', label: 'Cuidador/a' },
  { value: 'enfermero', label: 'Enfermero/a' },
  { value: 'kinesiologo', label: 'Kinesiologo/a' },
  { value: 'masajista', label: 'Masajista' },
  { value: 'acompanante_terapeutico', label: 'Acompanante terapeutico' },
  { value: 'otro', label: 'Otro' },
];

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const TURNOS = ['Manana', 'Tarde', 'Noche', '24hs', 'Partido'];

const baseInputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100';
const CV_ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const CV_MAX_SIZE = 8 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export function PublicCaregiverSignup() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipoPerfil: 'cuidador',
    provincia: '',
    zona: '',
    especialidades: '',
    disponibilidadDias: [],
    disponibilidadTurnos: [],
    tarifaReferencia: '',
    bio: '',
    cvNombre: '',
    cvMimeType: '',
    cvArchivo: '',
    aceptaTerminos: false,
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const provinciaNorm = String(form.provincia || '').trim().toLowerCase();
  const zonaOptions = useMemo(() => {
    if (provinciaNorm === 'caba') return BARRIOS_CABA;
    if (provinciaNorm === 'buenos aires' || provinciaNorm === 'provincia de buenos aires') return PARTIDOS_GBA;
    return [];
  }, [provinciaNorm]);

  const toggleInArray = (field, value) => {
    setForm((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const exists = current.includes(value);
      return {
        ...prev,
        [field]: exists ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre || !form.email || !form.telefono || !form.provincia || !form.zona) {
      setError('Completá nombre, email, teléfono, provincia y zona.')
      return
    }
    if (!form.disponibilidadTurnos.length) {
      setError('Seleccioná al menos un turno disponible.')
      return
    }
    if (!form.aceptaTerminos) {
      setError('Tenés que aceptar la carga de datos para enviar la postulación.')
      return
    }

    setLoading(true);
    try {
      await adminApi.submitPublicCaregiverSignup({
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        tipoPerfil: form.tipoPerfil,
        provincia: form.provincia,
        zona: form.zona,
        especialidades: form.especialidades
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        disponibilidadDias: form.disponibilidadDias,
        disponibilidadTurnos: form.disponibilidadTurnos,
        tarifaReferencia: form.tarifaReferencia || null,
        bio: form.bio || null,
        cvNombre: form.cvNombre || null,
        cvMimeType: form.cvMimeType || null,
        cvArchivo: form.cvArchivo || null,
        aceptaTerminos: true,
        website: form.website,
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'No se pudo enviar la postulación.');
    } finally {
      setLoading(false);
    }
  };

  const handleCvFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!CV_ALLOWED_TYPES.includes(file.type)) {
      setError('Formato no soportado. Usá PDF, JPG, PNG o Word.');
      return;
    }
    if (file.size > CV_MAX_SIZE) {
      setError('El archivo supera el límite de 8MB.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((prev) => ({
        ...prev,
        cvNombre: file.name,
        cvMimeType: file.type,
        cvArchivo: dataUrl,
      }));
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudo cargar el archivo.');
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">Postulación enviada</h1>
          <p className="mt-2 text-slate-600">
            Tus datos quedaron registrados. El equipo de Acompañarte los revisará y te contactará.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Postulación de cuidadores</h1>
            <p className="text-sm text-slate-600">Completá este formulario para sumarte a la base de Acompañarte.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-700 font-medium">Nombre y apellido *</label>
              <input className={baseInputClass} value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-slate-700 font-medium">Tipo de perfil *</label>
              <select className={baseInputClass} value={form.tipoPerfil} onChange={(e) => setForm((p) => ({ ...p, tipoPerfil: e.target.value }))}>
                {TIPO_PERFIL_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-700 font-medium">Email *</label>
              <input type="email" className={baseInputClass} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-slate-700 font-medium">Teléfono *</label>
              <input className={baseInputClass} value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-700 font-medium">Provincia *</label>
              <select className={baseInputClass} value={form.provincia} onChange={(e) => setForm((p) => ({ ...p, provincia: e.target.value, zona: '' }))}>
                <option value="">Seleccionar</option>
                {PROVINCIAS_ARG.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-700 font-medium">Zona / barrio / partido *</label>
              {zonaOptions.length ? (
                <select className={baseInputClass} value={form.zona} onChange={(e) => setForm((p) => ({ ...p, zona: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  {zonaOptions.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              ) : (
                <input className={baseInputClass} value={form.zona} onChange={(e) => setForm((p) => ({ ...p, zona: e.target.value }))} />
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-700 font-medium">Disponibilidad (días)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIAS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleInArray('disponibilidadDias', d)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${form.disponibilidadDias.includes(d) ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-slate-300 text-slate-700'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-700 font-medium">Disponibilidad (turnos) *</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TURNOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleInArray('disponibilidadTurnos', t)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${form.disponibilidadTurnos.includes(t) ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-slate-300 text-slate-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-700 font-medium">Especialidades (opcional)</label>
              <input
                className={baseInputClass}
                placeholder="Ej: geriatría, movilización, diabetes"
                value={form.especialidades}
                onChange={(e) => setForm((p) => ({ ...p, especialidades: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-700 font-medium">Tarifa de referencia (opcional)</label>
              <input
                type="number"
                min="0"
                className={baseInputClass}
                value={form.tarifaReferencia}
                onChange={(e) => setForm((p) => ({ ...p, tarifaReferencia: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-700 font-medium">Experiencia / comentarios (opcional)</label>
            <textarea
              rows={4}
              className={baseInputClass}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm text-slate-700 font-medium">CV o documento (opcional)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className={`${baseInputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-sky-700`}
              onChange={handleCvFileChange}
            />
            {form.cvNombre ? (
              <p className="mt-1 text-xs text-slate-600">Archivo cargado: {form.cvNombre}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Máximo 8MB. Formatos: PDF, JPG, PNG, DOC, DOCX.</p>
            )}
          </div>

          <input
            type="text"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
          />

          <label className="inline-flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.aceptaTerminos}
              onChange={(e) => setForm((p) => ({ ...p, aceptaTerminos: e.target.checked }))}
              className="mt-0.5"
            />
            Autorizo a Acompañarte a guardar estos datos para fines de selección y contacto.
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Enviando...' : 'Enviar postulación'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PublicCaregiverSignup;
