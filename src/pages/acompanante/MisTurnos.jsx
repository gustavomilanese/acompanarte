import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/Card';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/Skeleton';
import { 
  getTurnosByAcompanante, 
  getClienteById 
} from '@/data/mockData';
import { formatRelativeDate, formatTime, formatDate, getEstadoColor } from '@/utils/formatters';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export function MisTurnos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [turnos, setTurnos] = useState([]);
  const [semanaActual, setSemanaActual] = useState(new Date());

  useEffect(() => {
    // Simular carga
    setTimeout(() => {
      const todosTurnos = getTurnosByAcompanante(user?.id);
      setTurnos(todosTurnos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      setIsLoading(false);
    }, 600);
  }, [user?.id]);

  // Generar días de la semana
  const diasSemana = React.useMemo(() => {
    const inicio = startOfWeek(semanaActual, { weekStartsOn: 1 }); // Lunes
    return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
  }, [semanaActual]);

  // Agrupar turnos por día
  const turnosPorDia = React.useMemo(() => {
    const grouped = {};
    diasSemana.forEach(dia => {
      const diaStr = format(dia, 'yyyy-MM-dd');
      grouped[diaStr] = turnos.filter(t => t.fecha === diaStr);
    });
    return grouped;
  }, [turnos, diasSemana]);

  const getClienteInfo = (clienteId) => {
    return getClienteById(clienteId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light pb-20">
        <Header title="Mis turnos" />
        <div className="p-4">
          <SkeletonList count={5} />
        </div>
        <BottomNav type="acompanante" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light pb-20">
      <Header title="Mis turnos" />

      <div className="p-4 space-y-4">
        {/* Calendario semanal */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark">
                {format(semanaActual, 'MMMM yyyy', { locale: es })}
              </h3>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {diasSemana.map((dia, index) => {
                const diaStr = format(dia, 'yyyy-MM-dd');
                const tieneTurnos = turnosPorDia[diaStr]?.length > 0;
                const isHoy = isSameDay(dia, new Date());
                
                return (
                  <div
                    key={index}
                    className={`
                      text-center p-2 rounded-lg
                      ${isHoy ? 'bg-primary text-white' : ''}
                      ${tieneTurnos && !isHoy ? 'bg-primary/10' : ''}
                    `}
                  >
                    <p className={`text-xs ${isHoy ? 'text-white/80' : 'text-dark-400'}`}>
                      {format(dia, 'EEE', { locale: es })}
                    </p>
                    <p className={`text-lg font-bold ${isHoy ? 'text-white' : 'text-dark'}`}>
                      {format(dia, 'd')}
                    </p>
                    {tieneTurnos && (
                      <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${isHoy ? 'bg-white' : 'bg-primary'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lista de turnos */}
        <div>
          <h3 className="font-semibold text-dark mb-3">Todos los turnos</h3>
          
          {turnos.length > 0 ? (
            <div className="space-y-3">
              {turnos.map((turno) => {
                const cliente = getClienteInfo(turno.cliente);
                return (
                  <Card
                    key={turno.id}
                    hover
                    onClick={() => navigate(`/turno/${turno.id}`)}
                  >
                    <CardContent>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-dark">{cliente?.nombre}</h4>
                            <div className="flex items-center gap-2 text-sm text-dark-400 mt-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatRelativeDate(turno.fecha)} · {formatTime(turno.horaInicio)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-dark-400 mt-1">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate max-w-[200px]">{cliente?.direccion}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getEstadoColor(turno.estado)}>
                            {turno.estado === 'completado' ? 'Completado' : 'Pendiente'}
                          </Badge>
                          <ChevronRight className="w-5 h-5 text-dark-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="calendar"
              title="No tienes turnos"
              description="Tu agenda está libre por ahora"
            />
          )}
        </div>
      </div>

      <BottomNav type="acompanante" />
    </div>
  );
}

export default MisTurnos;
