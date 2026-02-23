import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Clock, 
  User, 
  CheckCircle,
  Play,
  Square,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { Header } from '@/components/Header';
import { Badge } from '@/components/Badge';
import { SkeletonList } from '@/components/Skeleton';
import { 
  getVisitaById, 
  getAcompananteById,
  getActividadById
} from '@/data/mockData';
import { formatDate, formatDuration, formatTime, formatCategoria } from '@/utils/formatters';

export function DetalleVisita() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [visita, setVisita] = useState(null);
  const [acompanante, setAcompanante] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      const visitaData = getVisitaById(id);
      if (visitaData) {
        setVisita(visitaData);
        setAcompanante(getAcompananteById(visitaData.acompanante));
      }
      setIsLoading(false);
    }, 400);
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light">
        <Header showBack onBack={() => navigate(-1)} title="Detalle de visita" />
        <div className="p-4">
          <SkeletonList count={3} />
        </div>
      </div>
    );
  }

  if (!visita) {
    return (
      <div className="min-h-screen bg-light">
        <Header showBack onBack={() => navigate(-1)} title="Visita no encontrada" />
        <div className="p-4 text-center">
          <p className="text-dark-400">La visita solicitada no existe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light pb-8">
      <Header
        title="Detalle de visita"
        showBack
        onBack={() => navigate(-1)}
      />

      <div className="p-4 space-y-4">
        {/* Fecha y duración */}
        <Card className="bg-primary/5 border border-primary/20">
          <CardContent className="text-center">
            <p className="text-3xl font-bold text-primary">
              {formatDate(visita.fecha, 'd MMMM')}
            </p>
            <p className="text-dark-400 capitalize">
              {formatDate(visita.fecha, 'EEEE yyyy')}
            </p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <Badge variant="primary">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(visita.duracion)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Info del acompañante */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-dark mb-3">Acompañante</h3>
            <div className="flex items-center gap-4">
              <img
                src={acompanante?.avatar}
                alt={acompanante?.nombre}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-dark">{acompanante?.nombre}</p>
                <p className="text-sm text-dark-400">{acompanante?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-dark mb-4">Timeline de la visita</h3>
            
            <div className="space-y-4">
              {/* Check-in */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Play className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-dark">Check-in</p>
                  <p className="text-sm text-dark-400">{visita.horaCheckIn}</p>
                </div>
              </div>

              {/* Actividades */}
              {visita.actividades?.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-dark">Actividades realizadas</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {visita.actividades.map((actId) => {
                        const actividad = getActividadById(actId);
                        return (
                          <Badge key={actId} variant="primary" size="sm">
                            {actividad?.titulo}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Check-out */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Square className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-dark">Check-out</p>
                  <p className="text-sm text-dark-400">{visita.horaCheckOut}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fotos */}
        {visita.fotos?.length > 0 && (
          <Card>
            <CardContent>
              <h3 className="font-semibold text-dark mb-3">
                <ImageIcon className="w-5 h-5 inline mr-2" />
                Fotos ({visita.fotos.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {visita.fotos.map((foto, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-xl overflow-hidden"
                  >
                    <img
                      src={foto}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notas */}
        {visita.notas && (
          <Card>
            <CardContent>
              <h3 className="font-semibold text-dark mb-3">
                <FileText className="w-5 h-5 inline mr-2" />
                Observaciones
              </h3>
              <div className="bg-light-100 rounded-xl p-4">
                <p className="text-dark-600 italic">"{visita.notas}"</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default DetalleVisita;
