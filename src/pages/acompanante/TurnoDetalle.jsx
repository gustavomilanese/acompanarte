import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  Play, 
  Square, 
  AlertCircle,
  ChevronLeft,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getTurnoById, getClienteById, getAcompananteById } from '@/data/mockData';
import { formatRelativeDate, formatTime, formatTimer } from '@/utils/formatters';

export function TurnoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showSuccess, showError } = useToast();
  const { getCurrentPosition } = useGeolocation();

  const [turno, setTurno] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados del cronómetro y check-in
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showEmergenciaModal, setShowEmergenciaModal] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    // Cargar datos del turno
    const turnoData = getTurnoById(id);
    if (turnoData) {
      setTurno(turnoData);
      setCliente(getClienteById(turnoData.cliente));
    }
    setIsLoading(false);
  }, [id]);

  // Manejar el cronómetro
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const handleCheckIn = async () => {
    try {
      // Simular obtención de geolocalización
      const location = await getCurrentPosition();
      
      const now = new Date();
      const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      setCheckInTime(timeString);
      setIsRunning(true);
      
      showSuccess('Check-in registrado correctamente');
      
      // Guardar en localStorage
      const visitaEnCurso = {
        turnoId: id,
        checkIn: timeString,
        location,
        timestamp: now.toISOString(),
      };
      localStorage.setItem('visita_en_curso', JSON.stringify(visitaEnCurso));
      
    } catch (error) {
      showError('Error al registrar check-in');
    }
  };

  const handleCheckOut = () => {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    setCheckOutTime(timeString);
    setIsRunning(false);
    
    // Calcular duración en minutos
    const duracionMinutos = Math.floor(elapsedSeconds / 60);
    
    // Limpiar localStorage
    localStorage.removeItem('visita_en_curso');
    
    // Redirigir a registro de visita
    navigate(`/registro/${id}?duracion=${duracionMinutos}&checkIn=${checkInTime}&checkOut=${timeString}`);
  };

  const handleEmergencia = () => {
    setShowEmergenciaModal(true);
  };

  const confirmarEmergencia = () => {
    console.log('[EMERGENCIA] Alerta enviada desde turno:', {
      turnoId: id,
      cliente: cliente?.nombre,
      acompanante: user?.nombre,
      timestamp: new Date().toISOString(),
    });
    showSuccess('Alerta de emergencia enviada');
    setShowEmergenciaModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light">
        <Header showBack onBack={() => navigate(-1)} title="Cargando..." />
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-light-300 rounded-2xl" />
            <div className="h-48 bg-light-300 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!turno || !cliente) {
    return (
      <div className="min-h-screen bg-light">
        <Header showBack onBack={() => navigate(-1)} title="Turno no encontrado" />
        <div className="p-4 text-center">
          <p className="text-dark-400">El turno solicitado no existe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light pb-8">
      {toast}
      
      <Header
        title="Detalle del turno"
        showBack
        onBack={() => navigate(-1)}
      />

      <div className="p-4 space-y-4">
        {/* Info del cliente */}
        <Card>
          <CardContent>
            <div className="flex items-start gap-4">
              <img
                src={cliente.foto}
                alt={cliente.nombre}
                className="w-16 h-16 rounded-2xl object-cover"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-dark">{cliente.nombre}</h2>
                <p className="text-dark-400">
                  {cliente.edad} años · {cliente.tipo === 'adulto_mayor' ? 'Adulto Mayor' : 'Niño/a'}
                </p>
                {cliente.condicion && (
                  <Badge variant="primary" className="mt-2">
                    {cliente.condicion}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-light-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Dirección</p>
                  <p className="text-dark font-medium">{cliente.direccion}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Contacto de emergencia</p>
                  <p className="text-dark font-medium">
                    {cliente.contactoEmergencia.nombre}
                  </p>
                  <p className="text-sm text-primary">{cliente.contactoEmergencia.telefono}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-dark" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Fecha y hora</p>
                  <p className="text-dark font-medium">
                    {formatRelativeDate(turno.fecha)} · {formatTime(turno.horaInicio)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notas especiales */}
        {cliente.notas && (
          <Card className="bg-accent/10 border border-accent/20">
            <CardContent>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-dark flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-dark mb-1">Notas importantes</h3>
                  <p className="text-dark-600">{cliente.notas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cronómetro y controles */}
        <Card className={isRunning ? 'border-primary border-2' : ''}>
          <CardContent className="text-center">
            {!checkInTime ? (
              <>
                <p className="text-dark-400 mb-4">
                  Presiona el botón cuando llegues para registrar tu entrada
                </p>
                <Button
                  onClick={handleCheckIn}
                  variant="primary"
                  size="lg"
                  fullWidth
                >
                  <Play className="w-5 h-5 mr-2" />
                  Check-in
                </Button>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-dark-400 mb-1">Tiempo de visita</p>
                  <div className="text-5xl font-bold text-primary font-mono">
                    {formatTimer(elapsedSeconds)}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 text-sm text-dark-400">
                    <span>Entrada: {checkInTime}</span>
                    {checkOutTime && <span>Salida: {checkOutTime}</span>}
                  </div>
                </div>
                
                {!checkOutTime && (
                  <Button
                    onClick={handleCheckOut}
                    variant="secondary"
                    size="lg"
                    fullWidth
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Check-out
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Necesidades especiales */}
        {cliente.necesidadesEspeciales?.length > 0 && (
          <Card>
            <CardContent>
              <h3 className="font-semibold text-dark mb-3">Necesidades especiales</h3>
              <div className="flex flex-wrap gap-2">
                {cliente.necesidadesEspeciales.map((necesidad, index) => (
                  <Badge key={index} variant="gray">
                    {necesidad}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Botón de emergencia flotante */}
      <button
        onClick={handleEmergencia}
        className="fixed bottom-4 right-4 w-14 h-14 bg-coral text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-500 active:scale-95 transition-all z-40"
        aria-label="Emergencia"
      >
        <AlertCircle className="w-7 h-7" />
      </button>

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

export default TurnoDetalle;
