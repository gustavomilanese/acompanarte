import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ChevronLeft, FileUp, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { adminApi } from '@/services/adminApi';
import { AdminQuickMenu } from '@/components/AdminQuickMenu';

const PROVINCIAS = ['CABA', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Salta', 'San Luis'];
function guessTipo(text) {
  const raw = text.toLowerCase();
  if (raw.includes('masaj')) return 'masajista';
  if (raw.includes('kines')) return 'kinesiologo';
  if (raw.includes('enfermer')) return 'enfermero';
  if (raw.includes('terapeut')) return 'acompanante_terapeutico';
  return 'cuidador';
}

function inferFromFileName(fileName) {
  const source = `${fileName}`;
  const safeName = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
  return {
    nombre: safeName,
    email: '',
    telefono: '',
    tipoPerfil: guessTipo(source),
    estadoProceso: 'base_datos',
    estado: 'inactivo',
    disponibilidad: 'a coordinar',
    provincia: '',
    zona: '',
    especialidades: [],
    notasImportacion: 'Extracción asistida. Revisar antes de crear.',
    confidence: 0,
    aiError: '',
  };
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export function ImportarCvs() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canSave = useMemo(() => rows.some((r) => r.nombre), [rows]);
  const canAnalyze = useMemo(() => rows.some((r) => r.filePayload?.dataBase64), [rows]);

  const readFiles = async (files) => {
    const next = [];
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const dataBase64 = arrayBufferToBase64(buffer);
        next.push({
          id: `${Date.now()}-${Math.random()}`,
          fileName: file.name,
          filePayload: {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            dataBase64,
          },
          ...inferFromFileName(file.name),
        });
      } catch {
        next.push({
          id: `${Date.now()}-${Math.random()}`,
          fileName: file.name,
          filePayload: null,
          ...inferFromFileName(file.name),
          aiError: 'No se pudo leer el archivo local.',
        });
      }
    }
    setRows((prev) => [...prev, ...next]);
  };

  const onDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files || []);
    if (!files.length) return;
    await readFiles(files);
  };

  const onSelectFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    await readFiles(files);
    event.target.value = '';
  };

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const analyzeWithAI = async () => {
    try {
      setIsAnalyzing(true);
      const files = rows
        .filter((r) => r.filePayload?.dataBase64)
        .map((r) => r.filePayload);
      if (!files.length) {
        showError('No hay archivos válidos para analizar');
        return;
      }

      const result = await adminApi.parseAcompanantesCvAI(files);
      const byName = new Map((result.rows || []).map((r) => [r.fileName, r]));
      setRows((prev) =>
        prev.map((row) => {
          const hit = byName.get(row.fileName);
          if (!hit?.suggestion) return row;
          return {
            ...row,
            nombre: hit.suggestion.nombre || row.nombre,
            email: hit.suggestion.email || row.email,
            telefono: hit.suggestion.telefono || row.telefono,
            tipoPerfil: hit.suggestion.tipoPerfil || row.tipoPerfil,
            provincia: hit.suggestion.provincia || row.provincia,
            zona: hit.suggestion.zona || row.zona,
            especialidades: Array.isArray(hit.suggestion.especialidades)
              ? hit.suggestion.especialidades
              : row.especialidades,
            notasImportacion: hit.suggestion.bio || row.notasImportacion,
            confidence: hit.suggestion.confidence ?? row.confidence ?? 0,
            aiError: hit.error || '',
          };
        }),
      );
      showSuccess(`IA completada: ${result.parsed} OK, ${result.failed} con revisión manual`);
    } catch (error) {
      showError(error.message || 'No se pudo analizar con IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAll = async () => {
    try {
      setIsSaving(true);
      const payload = rows.map((r) => ({
        nombre: r.nombre,
        email: r.email,
        telefono: r.telefono,
        tipoPerfil: r.tipoPerfil,
        estadoProceso: r.estadoProceso || 'base_datos',
        estado: r.estado || 'inactivo',
        disponibilidad: r.disponibilidad || 'a coordinar',
        provincia: r.provincia || null,
        zona: r.zona || null,
        especialidades: Array.isArray(r.especialidades) ? r.especialidades : [],
        bio: r.notasImportacion || null,
      }));
      const result = await adminApi.importAcompanantesBulk(payload);
      showSuccess(`Importación completa: ${result.created} creados, ${result.duplicates} duplicados, ${result.skipped} omitidos`);
      navigate('/admin/acompanantes');
    } catch (error) {
      showError(error.message || 'No se pudo importar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-light">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/acompanantes')} className="p-2 hover:bg-light-200 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-dark" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-dark">Importar CVs</h1>
              <p className="text-sm text-slate-500">Arrastrá CVs y revisá antes de crear perfiles</p>
            </div>
          </div>
          <AdminQuickMenu />
        </div>
      </header>

      <div className="p-4 space-y-4">
        <Card className={`border-2 border-dashed ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white'}`}>
          <CardContent>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className="rounded-xl p-6 text-center"
            >
              <FileUp className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
              <p className="font-medium text-slate-700">Arrastrá CVs acá (PDF, DOC, TXT)</p>
              <p className="text-xs text-slate-500 mt-1">Se extraen datos sugeridos para revisión manual.</p>
              <label className="inline-flex mt-3 px-4 py-2 rounded-lg border border-indigo-300 bg-indigo-100 text-indigo-700 text-sm cursor-pointer hover:bg-indigo-200">
                Seleccionar archivos
                <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" multiple onChange={onSelectFiles} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200">
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-slate-700">Previsualización ({rows.length})</p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  disabled={!canAnalyze || isAnalyzing}
                  onClick={analyzeWithAI}
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
                  Analizar con IA
                </Button>
                <Button size="sm" disabled={!canSave || isSaving} onClick={saveAll}>
                  Guardar en base
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-[56vh] overflow-y-auto">
              {rows.length === 0 && <p className="text-sm text-slate-500">Aún no cargaste CVs.</p>}
              {rows.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs text-slate-500 truncate">{row.fileName}</p>
                    <button type="button" onClick={() => removeRow(row.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700">
                      Confianza IA: {row.confidence ?? 0}%
                    </span>
                    {row.aiError && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                        {row.aiError}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input value={row.nombre} onChange={(e) => updateRow(row.id, { nombre: e.target.value })} className="px-2.5 py-2 border rounded-lg bg-white text-sm" placeholder="Nombre" />
                    <input value={row.email} onChange={(e) => updateRow(row.id, { email: e.target.value })} className="px-2.5 py-2 border rounded-lg bg-white text-sm" placeholder="Email" />
                    <input value={row.telefono} onChange={(e) => updateRow(row.id, { telefono: e.target.value })} className="px-2.5 py-2 border rounded-lg bg-white text-sm" placeholder="Teléfono" />
                    <select value={row.tipoPerfil} onChange={(e) => updateRow(row.id, { tipoPerfil: e.target.value })} className="px-2.5 py-2 border rounded-lg bg-white text-sm">
                      <option value="cuidador">Cuidador</option>
                      <option value="masajista">Masajista</option>
                      <option value="kinesiologo">Kinesiólogo</option>
                      <option value="enfermero">Enfermero/a</option>
                      <option value="acompanante_terapeutico">Acomp. terapéutico</option>
                      <option value="otro">Otro</option>
                    </select>
                    <select value={row.provincia} onChange={(e) => updateRow(row.id, { provincia: e.target.value })} className="px-2.5 py-2 border rounded-lg bg-white text-sm">
                      <option value="">Provincia</option>
                      {PROVINCIAS.map((prov) => <option key={prov} value={prov}>{prov}</option>)}
                    </select>
                    <input value={row.zona} onChange={(e) => updateRow(row.id, { zona: e.target.value })} className="px-2.5 py-2 border rounded-lg bg-white text-sm" placeholder="Zona" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ImportarCvs;
