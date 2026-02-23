import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  ChevronRight, 
  Clock, 
  Image as ImageIcon,
  ChevronDown,
  Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/Card';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/Skeleton';
import { 
  getVisitasByCliente, 
  getAcompananteById,
  getActividadById
} from '@/data/mockData';
import { formatDate, formatDuration, formatCategoria } from '@/utils/formatters';
import { format, parseISO, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';

export function Historial() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [visitas, setVisitas] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState('todos');
  const [showFiltroMes, setShowFiltroMes] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      const visitasData = getVisitasByCliente(user?.clienteId);
      setVisitas(visitasData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      setIsLoading(false);
    }, 600);
  }, [user?.clienteId]);

  // Generar opciones de meses
  const mesesDisponibles = useMemo(() => {
    const meses = new Set();
    visitas.forEach(v => {
      const fecha = parseISO(v.fecha);
      meses.add(`${getYear(fecha)}-${getMonth(fecha)}`);
    });
    
    return Array.from(meses).map(ym => {
      const [year, month] = ym.split('-');
      const date = new Date(parseInt(year), parseInt(month), 1);
      return {
        value: ym,
        label: format(date, 'MMMM yyyy', { locale: es }),
      };
    });
  }, [visitas]);

  // Filtrar visitas por mes
  const visitasFiltradas = useMemo(() => {
    if (mesSeleccionado === 'todos') return visitas;
    
    const [year, month] = mesSeleccionado.split('-');
    return visitas.filter(v => {
      const fecha = parseISO(v.fecha);
      return getYear(fecha) === parseInt(year) && getMonth(fecha) === parseInt(month);
    });
  }, [visitas, mesSeleccionado]);

  const getAcompananteInfo = (acompananteId) => {
    return getAcompananteById(acompananteId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light pb-20">
        <Header title="Historial de visitas" />
        <div className="p-4">
          <SkeletonList count={5} />
        </div>
        <BottomNav type="familiar" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light pb-20">
      <Header title="Historial de visitas" />

      <div className="p-4 space-y-4">
        {/* Filtro por mes */}
        <div className="relative">
          <button
            onClick={() => setShowFiltroMes(!showFiltroMes)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-dark-400" />
              <span>
                {mesSeleccionado === 'todos' 
                  ? 'Todos los meses' 
                  : mesesDisponibles.find(m => m.value === mesSeleccionado)?.label
                }
              </span>
            </div>
            <ChevronDown className={`w-5 h-5 text-dark-400 transition-transform ${showFiltroMes ? 'rotate-180' : ''}`} />
          </button>

          {showFiltroMes && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-light-300 rounded-xl shadow-lg z-10 overflow-hidden">
              <button
                onClick={() => {
                  setMesSeleccionado('todos');
                  setShowFiltroMes(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-light-100 ${mesSeleccionado === 'todos' ? 'bg-primary/5 text-primary' : ''}`}
              >
                Todos los meses
              </button>
              {mesesDisponibles.map((mes) => (
                <button
                  key={mes.value}
                  onClick={() => {
                    setMesSeleccionado(mes.value);
                    setShowFiltroMes(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-light-100 capitalize ${mesSeleccionado === mes.value ? 'bg-primary/5 text-primary' : ''}`}
                >
                  {mes.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de visitas */}
        {visitasFiltradas.length > 0 ? (
          <div className="space-y-4">
            {visitasFiltradas.map((visita) => {
              const acompanante = getAcompananteInfo(visita.acompanante);
              
              return (
                <Card
                  key={visita.id}
                  hover
                  onClick={() => navigate(`/visita/${visita.id}`)}
                >
                  <CardContent>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={acompanante?.avatar}
                          alt={acompanante?.nombre}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-dark">{acompanante?.nombre}</p>
                          <p className="text-sm text-dark-400">
                            {formatDate(visita.fecha, 'EEEE d MMMM')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">
                          {formatDuration(visita.duracion)}
                        </p>
                      </div>
                    </div>

                    {/* Fotos */}
                    {visita.fotos?.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {visita.fotos.map((foto, index) => (
                          <div
                            key={index}
                            className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                          >
                            <img
                              src={foto}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actividades */}
                    {visita.actividades?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {visita.actividades.slice(0, 3).map((actId) => {
                          const actividad = getActividadById(actId);
                          return (
                            <Badge key={actId} variant="primary" size="sm">
                              {actividad?.titulo}
                            </Badge>
                          );
                        })}
                        {visita.actividades.length > 3 && (
                          <Badge variant="gray" size="sm">
                            +{visita.actividades.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Notas */}
                    {visita.notas && (
                      <p className="text-sm text-dark-500 line-clamp-2">
                        "{visita.notas}"
                      </p>
                    )}

                    {/* Ver más */}
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-light-200">
                      <span className="text-sm text-primary font-medium flex items-center">
                        Ver detalle
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="calendar"
            title="No hay visitas registradas"
            description="Aún no hay visitas en el período seleccionado"
          />
        )}
      </div>

      <BottomNav type="familiar" />
    </div>
  );
}

export default Historial;
