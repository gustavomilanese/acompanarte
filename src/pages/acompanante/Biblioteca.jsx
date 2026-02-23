import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  Brain, 
  Dumbbell, 
  Users, 
  Palette,
  X,
  Check,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { actividades } from '@/data/mockData';
import { formatCategoria, truncate } from '@/utils/formatters';

const CATEGORIAS = [
  { id: 'todas', label: 'Todas' },
  { id: 'cognitivo', label: 'Cognitivo', icon: Brain },
  { id: 'fisico', label: 'Físico', icon: Dumbbell },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'creativo', label: 'Creativo', icon: Palette },
];

const getCategoriaColor = (categoria) => {
  const colors = {
    cognitivo: 'bg-purple-100 text-purple-700',
    fisico: 'bg-green-100 text-green-700',
    social: 'bg-blue-100 text-blue-700',
    creativo: 'bg-pink-100 text-pink-700',
  };
  return colors[categoria] || 'bg-gray-100 text-gray-700';
};

export function Biblioteca() {
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);

  // Filtrar actividades
  const actividadesFiltradas = useMemo(() => {
    return actividades.filter((actividad) => {
      const matchesSearch = 
        actividad.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actividad.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategoria = 
        categoriaActiva === 'todas' || actividad.categoria === categoriaActiva;
      
      return matchesSearch && matchesCategoria;
    });
  }, [searchQuery, categoriaActiva]);

  return (
    <div className="min-h-screen bg-light pb-20">
      <Header title="Biblioteca de actividades" />

      <div className="p-4 space-y-4">
        {/* Buscador */}
        <div className="sticky top-0 z-10 bg-light pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Buscar actividades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark placeholder-dark-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            )}
          </div>
        </div>

        {/* Filtros de categoría */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
                transition-all duration-200
                ${categoriaActiva === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-dark-600 hover:bg-light-200'
                }
              `}
            >
              {cat.icon && <cat.icon className="w-4 h-4" />}
              <span className="font-medium text-sm">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Lista de actividades */}
        <div className="space-y-3">
          {actividadesFiltradas.length > 0 ? (
            actividadesFiltradas.map((actividad) => (
              <Card
                key={actividad.id}
                hover
                onClick={() => setActividadSeleccionada(actividad)}
              >
                <CardContent>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoriaColor(actividad.categoria)}>
                          {formatCategoria(actividad.categoria)}
                        </Badge>
                        <span className="text-sm text-dark-400 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {actividad.duracion} min
                        </span>
                      </div>
                      <h3 className="font-semibold text-dark mb-1">
                        {actividad.titulo}
                      </h3>
                      <p className="text-sm text-dark-500 line-clamp-2">
                        {actividad.descripcion}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-dark-300 flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-dark-300 mx-auto mb-4" />
              <p className="text-dark-400">No se encontraron actividades</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle de actividad */}
      <Modal
        isOpen={!!actividadSeleccionada}
        onClose={() => setActividadSeleccionada(null)}
        title={actividadSeleccionada?.titulo}
        size="lg"
      >
        {actividadSeleccionada && (
          <div className="space-y-4">
            {/* Info básica */}
            <div className="flex items-center gap-3">
              <Badge className={getCategoriaColor(actividadSeleccionada.categoria)}>
                {formatCategoria(actividadSeleccionada.categoria)}
              </Badge>
              <span className="text-sm text-dark-400 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {actividadSeleccionada.duracion} minutos
              </span>
              <span className="text-sm text-dark-400">
                Dificultad: {actividadSeleccionada.dificultad}
              </span>
            </div>

            {/* Descripción */}
            <div>
              <h4 className="font-semibold text-dark mb-2">Descripción</h4>
              <p className="text-dark-600">{actividadSeleccionada.descripcion}</p>
            </div>

            {/* Instrucciones */}
            <div>
              <h4 className="font-semibold text-dark mb-2">Instrucciones paso a paso</h4>
              <ol className="space-y-2">
                {actividadSeleccionada.instrucciones.map((instruccion, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-dark-600">{instruccion}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Materiales */}
            <div>
              <h4 className="font-semibold text-dark mb-2">Materiales necesarios</h4>
              <div className="flex flex-wrap gap-2">
                {actividadSeleccionada.materiales.map((material, index) => (
                  <Badge key={index} variant="gray">
                    {material}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Indicado para */}
            <div>
              <h4 className="font-semibold text-dark mb-2">Indicado para</h4>
              <div className="flex flex-wrap gap-2">
                {actividadSeleccionada.indicadoPara.map((indicacion, index) => (
                  <Badge key={index} variant="primary">
                    <Check className="w-3 h-3 mr-1" />
                    {indicacion}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <BottomNav type="acompanante" />
    </div>
  );
}

export default Biblioteca;
