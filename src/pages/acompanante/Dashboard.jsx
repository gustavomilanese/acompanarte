import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  ChevronRight, 
  BookOpen,
  AlertCircle,
  Play
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonDashboard } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { 
  getTurnosHoy, 
  getProximosTurnos, 
  getClienteById,
  getTurnoActual 
} from '@/data/mockData';
import { formatRelativeDate, formatTime } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast, showSuccess } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [turnoHoy, setTurnoHoy] = useState(null);
  const [proximosTurnos, setProximosTurnos] = useState([]);
  const [showEmergenciaModal, setShowEmergenciaModal] = useState(false);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      const hoy = getTurnosHoy(user?.id);
      setTurnoHoy(hoy[0] || null);
      setProximosTurnos(getProximosTurnos(user?.id, 3));
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [user?.id]);

  const handleIniciarVisita = () => {
    if (turnoHoy) {
      navigate(`/turno/${turnoHoy.id}`);
    }
  };

  const handleEmergencia = () => {
    setShowEmergenciaModal(true);
  };

  const confirmarEmergencia = () => {
    console.log('[EMERGENCIA] Alerta enviada:', {
      acompanante: user?.nombre,
      timestamp: new Date().toISOString(),
      tipo: 'EMERGENCIA',
    });
    showSuccess('Alerta de emergencia enviada');
    setShowEmergenciaModal(false);
  };

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/login');
  };

  const getClienteInfo = (clienteId) => {
    return getClienteById(clienteId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light pb-20">
        <HeaderSimple title="Acompañarte" />
        <SkeletonDashboard />
        <BottomNav type="acompanante" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light pb-20">
      {toast}
      
      {/* Header */}
      <Header
        title={`¡Hola, ${user?.nombre?.split(' ')[0]}!`}
        subtitle={format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        user={user}
        showNotifications
        showLogout
        onLogout={handleLogout}
      />

      <div className="p-4 space-y-4">
        {/* Turno de hoy destacado */}
        {turnoHoy ? (
          <Card className="bg-gradient-to-br from-primary to-primary-600 text-white">
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="accent" className="bg-white/20 text-white border-white/30">
                  <Clock className="w-3 h-3 mr-1" />
                  Hoy
                </Badge>
                <span className="text-white/80 text-sm">
                  {formatTime(turnoHoy.horaInicio)}
                </span>
              </div>
              
              {(() => {
                const cliente = getClienteInfo(turnoHoy.cliente);
                return (
                  <>
                    <h3 className="text-xl font-bold mb-1">{cliente?.nombre}</h3>
                    <div className="flex items-center gap-1 text-white/80 text-sm mb-4">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{cliente?.direccion}</span>
                    </div>
                    
                    {cliente?.notas && (
                      <div className="flex items-start gap-2 bg-white/10 rounded-lg p-2 mb-4">
                        <AlertCircle className="w-4 h-4 text-white/80 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-white/90">{cliente.notas}</p>
                      </div>
                    )}
                  </>
                );
              })()}
              
              <Button
                onClick={handleIniciarVisita}
                variant="accent"
                fullWidth
                className="mt-2"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar visita
              </Button>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon="calendar"
            title="No tienes turnos hoy"
            description="Descansa y recarga energías para tu próxima visita"
            className="bg-white rounded-2xl shadow-md"
          />
        )}

        {/* Próximos turnos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-dark">Próximos turnos</h2>
            <button 
              onClick={() => navigate('/turnos')}
              className="text-primary text-sm font-medium flex items-center hover:underline"
            >
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {proximosTurnos.length > 0 ? (
            <div className="space-y-3">
              {proximosTurnos.map((turno) => {
                const cliente = getClienteInfo(turno.cliente);
                return (
                  <Card
                    key={turno.id}
                    hover
                    onClick={() => navigate(`/turno/${turno.id}`)}
                  >
                    <CardContent className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-dark truncate">
                          {cliente?.nombre}
                        </h4>
                        <p className="text-sm text-dark-400">
                          {formatRelativeDate(turno.fecha)} · {formatTime(turno.horaInicio)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-dark-300" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="calendar"
              title="No hay próximos turnos"
              description="Tu agenda está libre por ahora"
            />
          )}
        </div>

        {/* Acceso rápido a biblioteca */}
        <Card 
          hover 
          onClick={() => navigate('/biblioteca')}
          className="bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/20"
        >
          <CardContent className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-dark" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-dark">Biblioteca de actividades</h3>
              <p className="text-sm text-dark-400">
                Explora actividades para tus visitas
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-dark-300" />
          </CardContent>
        </Card>
      </div>

      {/* Botón de emergencia flotante */}
      <button
        onClick={handleEmergencia}
        className="fixed bottom-24 right-4 w-14 h-14 bg-coral text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-500 active:scale-95 transition-all z-40"
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

      <BottomNav type="acompanante" />
    </div>
  );
}

function HeaderSimple({ title }) {
  return (
    <header className="bg-primary text-white py-4 px-4">
      <h1 className="text-xl font-bold text-center">{title}</h1>
    </header>
  );
}

export default Dashboard;
