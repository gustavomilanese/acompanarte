import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Check, 
  Camera, 
  X, 
  ChevronLeft, 
  Clock,
  AlertCircle,
  Brain,
  Dumbbell,
  Users,
  Palette
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Header } from '@/components/Header';
import { TextArea } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { 
  getTurnoById, 
  getClienteById, 
  getActividadesByCategoria,
  actividades 
} from '@/data/mockData';
import { formatDuration } from '@/utils/formatters';
import { generateId } from '@/utils/formatters';

const CATEGORIAS = [
  { id: 'cognitivo', label: 'Cognitivo', icon: Brain, color: 'bg-purple-100 text-purple-700' },
  { id: 'fisico', label: 'Físico', icon: Dumbbell, color: 'bg-green-100 text-green-700' },
  { id: 'social', label: 'Social', icon: Users, color: 'bg-blue-100 text-blue-700' },
  { id: 'creativo', label: 'Creativo', icon: Palette, color: 'bg-pink-100 text-pink-700' },
];

export function RegistroVisita() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast, showSuccess } = useToast();

  const [turno, setTurno] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState([]);
  const [notas, setNotas] = useState('');
  const [fotos, setFotos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [showActividadesModal, setShowActividadesModal] = useState(false);
  const [showEmergenciaModal, setShowEmergenciaModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Datos del check-in/out
  const duracion = searchParams.get('duracion') || 0;
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';

  useEffect(() => {
    const turnoData = getTurnoById(id);
    if (turnoData) {
      setTurno(turnoData);
      setCliente(getClienteById(turnoData.cliente));
    }
    setIsLoading(false);
  }, [id]);

  const handleCategoriaClick = (categoriaId) => {
    setCategoriaActiva(categoriaId);
    setShowActividadesModal(true);
  };

  const toggleActividad = (actividadId) => {
    setActividadesSeleccionadas((prev) =>
      prev.includes(actividadId)
        ? prev.filter((id) => id !== actividadId)
        : [...prev, actividadId]
    );
  };

  const handleFotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (fotos.length + files.length > 3) {
      alert('Máximo 3 fotos permitidas');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotos((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFoto = (index) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    setIsSaving(true);

    // Simular guardado
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Crear objeto de visita
    const visita = {
      id: generateId('vis'),
      turnoId: id,
      fecha: new Date().toISOString().split('T')[0],
      acompanante: user?.id,
      cliente: cliente?.id,
      horaCheckIn: checkIn,
      horaCheckOut: checkOut,
      duracion: parseInt(duracion),
      actividades: actividadesSeleccionadas,
      notas,
      fotos,
    };

    // Guardar en localStorage
    const visitasGuardadas = JSON.parse(localStorage.getItem('visitas') || '[]');
    visitasGuardadas.push(visita);
    localStorage.setItem('visitas', JSON.stringify(visitasGuardadas));

    console.log('[Visita guardada]:', visita);

    showSuccess('Visita registrada correctamente');
    
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  const handleEmergencia = () => {
    setShowEmergenciaModal(true);
  };

  const confirmarEmergencia = () => {
    console.log('[EMERGENCIA] Alerta enviada');
    showSuccess('Alerta de emergencia enviada');
    setShowEmergenciaModal(false);
  };

  const actividadesFiltradas = categoriaActiva
    ? getActividadesByCategoria(categoriaActiva)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light">
        <Header showBack onBack={() => navigate(-1)} title="Cargando..." />
        <div className="p-4">
          <div className="animate-pulse h-96 bg-light-300 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light pb-8">
      {toast}
      
      <Header
        title="Registrar visita"
        showBack
        onBack={() => navigate(-1)}
      />

      <div className="p-4 space-y-4">
        {/* Info de duración */}
        <Card className="bg-primary/5 border border-primary/20">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">Duración de la visita</p>
              <p className="text-2xl font-bold text-primary">
                {formatDuration(parseInt(duracion))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-dark-400">{checkIn} - {checkOut}</p>
              <p className="text-sm text-primary">{cliente?.nombre}</p>
            </div>
          </CardContent>
        </Card>

        {/* Actividades realizadas */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-dark mb-4">Actividades realizadas</h3>
            
            {/* Grid de categorías */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoriaClick(cat.id)}
                  className={"p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 " + (actividadesSeleccionadas.some(aId => { const act = actividades.find(a => a.id === aId); return act?.categoria === cat.id; }) ? 'border-primary bg-primary/5' : 'border-light-300 hover:border-primary/50')}
                >
                  <div className={"w-10 h-10 rounded-lg " + cat.color + " flex items-center justify-center"}>
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-dark text-sm">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Actividades seleccionadas */}
            {actividadesSeleccionadas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {actividadesSeleccionadas.map((actId) => {
                  const act = actividades.find((a) => a.id === actId);
                  return (
                    <Badge key={actId} variant="primary">
                      <Check className="w-3 h-3 mr-1" />
                      {act?.titulo}
                    </Badge>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardContent>
            <TextArea
              label="Notas y observaciones"
              placeholder="Describe cómo fue la visita, el estado del paciente, etc."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-dark mb-4">Fotos ({fotos.length}/3)</h3>
            
            <div className="grid grid-cols-3 gap-3">
              {fotos.map((foto, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={foto}
                    alt={"Foto " + (index + 1)}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    onClick={() => removeFoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {fotos.length < 3 && (
                <label className="aspect-square border-2 border-dashed border-light-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Camera className="w-8 h-8 text-dark-300 mb-1" />
                  <span className="text-xs text-dark-400">Agregar</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFotoChange}
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botón guardar */}
        <Button
          onClick={handleGuardar}
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSaving}
          disabled={actividadesSeleccionadas.length === 0}
        >
          Guardar registro
        </Button>
      </div>

      {/* Botón de emergencia flotante */}
      <button
        onClick={handleEmergencia}
        className="fixed bottom-4 right-4 w-14 h-14 bg-coral text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-500 active:scale-95 transition-all z-40"
        aria-label="Emergencia"
      >
        <AlertCircle className="w-7 h-7" />
      </button>

      {/* Modal de actividades por categoría */}
      <Modal
        isOpen={showActividadesModal}
        onClose={() => setShowActividadesModal(false)}
        title={CATEGORIAS.find(c => c.id === categoriaActiva)?.label}
        size="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          {actividadesFiltradas.map((actividad) => (
            <div
              key={actividad.id}
              onClick={() => toggleActividad(actividad.id)}
              className={"p-4 rounded-xl border-2 cursor-pointer transition-all " + (actividadesSeleccionadas.includes(actividad.id) ? 'border-primary bg-primary/5' : 'border-light-200 hover:border-primary/50')}
            >
              <div className="flex items-start gap-3">
                <div className={"w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 " + (actividadesSeleccionadas.includes(actividad.id) ? 'border-primary bg-primary' : 'border-light-300')}>
                  {actividadesSeleccionadas.includes(actividad.id) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-dark">{actividad.titulo}</h4>
                  <p className="text-sm text-dark-400">{actividad.duracion} min</p>
                  <p className="text-sm text-dark-500 mt-1">{actividad.descripcion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          onClick={() => setShowActividadesModal(false)}
          fullWidth
          className="mt-4"
        >
          Listo
        </Button>
      </Modal>

      {/* Modal de emergencia */}
      <Modal
        isOpen={showEmergenciaModal}
        onClose={() => setShowEmergenciaModal(false)}
        title="¿Confirmar emergencia?"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-coral" />
          </div>
          <p className="text-dark-600 mb-6">
            Se enviará una alerta de emergencia al equipo de soporte. 
            ¿Estás seguro?
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowEmergenciaModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={confirmarEmergencia}
            >
              Sí, es emergencia
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RegistroVisita;
