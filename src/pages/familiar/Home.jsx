import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Activity,
  User,
  LogOut
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
import { 
  getClienteById, 
  getAcompananteById,
  getTurnosByCliente,
  getVisitasByCliente
} from '@/data/mockData';
import { formatRelativeDate, formatTime } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showSuccess } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [cliente, setCliente] = useState(null);
  const [acompananteActual, setAcompananteActual] = useState(null);
  const [turnoActual, setTurnoActual] = useState(null);
  const [proximosTurnos, setProximosTurnos] = useState([]);
  const [ultimaVisita, setUltimaVisita] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      const clienteData = getClienteById(user?.clienteId);
      setCliente(clienteData);
      
      if (clienteData) {
        const acompanante = getAcompananteById(clienteData.acompananteAsignado);
        setAcompananteActual(acompanante);
        
        const turnos = getTurnosByCliente(clienteData.id);
        const hoy = new Date().toISOString().split('T')[0];
        
        // Buscar turno de hoy
        const turnoHoy = turnos.find(t => t.fecha === hoy && t.estado === 'pendiente');
        setTurnoActual(turnoHoy);
        
        // Próximos turnos
        setProximosTurnos(
          turnos
            .filter(t => t.fecha >= hoy)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .slice(0, 3)
        );
        
        // Última visita
        const visitas = getVisitasByCliente(clienteData.id);
        setUltimaVisita(visitas[0] || null);
      }
      
      setIsLoading(false);
    }, 800);
  }, [user?.clienteId]);

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light pb-20">
        <HeaderSimple title="Acompañarte" />
        <SkeletonDashboard />
        <BottomNav type="familiar" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light pb-20">
      {/* Header */}
      <div className="bg-primary py-6 px-4">
        <div className="max-w-lg mx-auto flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Hola, {user?.nombre}
            </h1>
            <p className="text-white/80">
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-2">
        {/* Estado actual */}
        {turnoActual ? (
          <Card className="bg-gradient-to-br from-primary to-primary-600 text-white">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="accent" className="bg-white/20 text-white border-white/30">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  En curso
                </Badge>
                <span className="text-white/80 text-sm">
                  {formatTime(turnoActual.horaInicio)}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <img
                  src={acompananteActual?.avatar}
                  alt={acompananteActual?.nombre}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white"
                />
                <div>
                  <p className="text-white/80 text-sm">Ahora con</p>
                  <h3 className="text-xl font-bold">{acompananteActual?.nombre}</h3>
                  <p className="text-white/80 text-sm">
                    Estimado: {parseInt(turnoActual.horaInicio) + turnoActual.duracion}:00 hs
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white">
            <CardContent className="text-center py-6">
              <div className="w-16 h-16 bg-light-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-dark-300" />
              </div>
              <h3 className="font-semibold text-dark mb-1">No hay visita en curso</h3>
              <p className="text-dark-400 text-sm">
                {cliente?.nombre} está descansando en casa
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info del cliente */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src={cliente?.foto}
                alt={cliente?.nombre}
                className="w-16 h-16 rounded-2xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold text-dark">{cliente?.nombre}</h3>
                <p className="text-dark-400 text-sm">
                  {cliente?.edad} años · {cliente?.condicion}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="primary">
                    <User className="w-3 h-3 mr-1" />
                    {acompananteActual?.nombre}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximas visitas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-dark">Próximas visitas</h2>
            <button 
              onClick={() => navigate('/historial')}
              className="text-primary text-sm font-medium flex items-center hover:underline"
            >
              Ver historial
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {proximosTurnos.length > 0 ? (
            <div className="space-y-3">
              {proximosTurnos.map((turno) => (
                <Card key={turno.id}>
                  <CardContent className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-dark">
                        {formatRelativeDate(turno.fecha)}
                      </h4>
                      <p className="text-sm text-dark-400">
                        {formatTime(turno.horaInicio)} · {acompananteActual?.nombre}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="calendar"
              title="No hay visitas programadas"
              description="Próximamente se agendarán nuevas visitas"
            />
          )}
        </div>

        {/* Última visita */}
        {ultimaVisita && (
          <Card 
            hover 
            onClick={() => navigate(`/visita/${ultimaVisita.id}`)}
            className="bg-accent/10 border border-accent/20"
          >
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400 mb-1">Última visita</p>
                  <h4 className="font-semibold text-dark">
                    {formatRelativeDate(ultimaVisita.fecha)}
                  </h4>
                  <p className="text-sm text-dark-500 mt-1">
                    {ultimaVisita.actividades?.length} actividades realizadas
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-dark-300" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav type="familiar" />
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

export default Home;
