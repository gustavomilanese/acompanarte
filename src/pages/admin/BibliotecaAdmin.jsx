import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  Search, 
  MoreVertical,
  Clock,
  Brain,
  Dumbbell,
  Users,
  Palette,
  ChevronLeft,
  Trash2,
  Edit
} from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { actividades as actividadesData } from '@/data/mockData';
import { generateId, formatCategoria } from '@/utils/formatters';
import { AdminQuickMenu } from '@/components/AdminQuickMenu';

const CATEGORIAS = [
  { id: 'cognitivo', label: 'Cognitivo', icon: Brain },
  { id: 'fisico', label: 'Físico', icon: Dumbbell },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'creativo', label: 'Creativo', icon: Palette },
];

const DIFICULTADES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

export function BibliotecaAdmin() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  const [actividades, setActividades] = useState(actividadesData);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingActividad, setEditingActividad] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: 'cognitivo',
    duracion: 30,
    dificultad: 'media',
    descripcion: '',
    instrucciones: [''],
    materiales: [''],
    indicadoPara: [''],
  });

  const filteredActividades = actividades.filter(a =>
    a.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (actividad = null) => {
    if (actividad) {
      setEditingActividad(actividad);
      setFormData({
        titulo: actividad.titulo,
        categoria: actividad.categoria,
        duracion: actividad.duracion,
        dificultad: actividad.dificultad,
        descripcion: actividad.descripcion,
        instrucciones: actividad.instrucciones,
        materiales: actividad.materiales,
        indicadoPara: actividad.indicadoPara,
      });
    } else {
      setEditingActividad(null);
      setFormData({
        titulo: '',
        categoria: 'cognitivo',
        duracion: 30,
        dificultad: 'media',
        descripcion: '',
        instrucciones: [''],
        materiales: [''],
        indicadoPara: [''],
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Limpiar arrays vacíos
    const cleanData = {
      ...formData,
      instrucciones: formData.instrucciones.filter(i => i.trim() !== ''),
      materiales: formData.materiales.filter(m => m.trim() !== ''),
      indicadoPara: formData.indicadoPara.filter(i => i.trim() !== ''),
    };
    
    if (editingActividad) {
      setActividades(prev =>
        prev.map(a =>
          a.id === editingActividad.id
            ? { ...a, ...cleanData }
            : a
        )
      );
      showSuccess('Actividad actualizada correctamente');
    } else {
      const nuevaActividad = {
        id: generateId('act'),
        ...cleanData,
      };
      setActividades(prev => [...prev, nuevaActividad]);
      showSuccess('Actividad creada correctamente');
    }
    
    setShowModal(false);
  };

  const handleEliminar = (id) => {
    setActividades(prev => prev.filter(a => a.id !== id));
    showSuccess('Actividad eliminada correctamente');
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const updateArrayItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const getCategoriaColor = (categoria) => {
    const colors = {
      cognitivo: 'bg-purple-100 text-purple-700',
      fisico: 'bg-green-100 text-green-700',
      social: 'bg-blue-100 text-blue-700',
      creativo: 'bg-pink-100 text-pink-700',
    };
    return colors[categoria] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/admin')}
                className="p-2 -ml-2 hover:bg-light-200 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-dark" />
              </button>
              <h1 className="text-xl font-bold text-dark">Biblioteca de actividades</h1>
            </div>
            <AdminQuickMenu />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Search and Add */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Buscar actividad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
            />
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {filteredActividades.map((actividad) => (
            <Card key={actividad.id}>
              <CardContent>
                <div className="flex items-start justify-between">
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
                    <h3 className="font-semibold text-dark">{actividad.titulo}</h3>
                    <p className="text-sm text-dark-500 mt-1 line-clamp-2">
                      {actividad.descripcion}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {actividad.indicadoPara.map((item, index) => (
                        <Badge key={index} variant="gray" size="sm">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleOpenModal(actividad)}
                      className="p-2 hover:bg-light-200 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5 text-dark-400" />
                    </button>
                    <button
                      onClick={() => handleEliminar(actividad.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-secondary" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingActividad ? 'Editar actividad' : 'Nueva actividad'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-auto">
          <Input
            label="Título"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Categoría
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
              >
                {CATEGORIAS.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Duración (minutos)
              </label>
              <select
                value={formData.duracion}
                onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Dificultad
            </label>
            <select
              value={formData.dificultad}
              onChange={(e) => setFormData({ ...formData, dificultad: e.target.value })}
              className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark"
            >
              {DIFICULTADES.map(dif => (
                <option key={dif.value} value={dif.value}>{dif.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl text-dark resize-none"
              required
            />
          </div>

          {/* Instrucciones */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Instrucciones paso a paso
            </label>
            <div className="space-y-2">
              {formData.instrucciones.map((instruccion, index) => (
                <div key={index} className="flex gap-2">
                  <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={instruccion}
                    onChange={(e) => updateArrayItem('instrucciones', index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-white border-2 border-light-300 rounded-xl text-dark"
                    placeholder={`Paso ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('instrucciones', index)}
                    className="p-2 text-secondary hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('instrucciones')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar paso
              </Button>
            </div>
          </div>

          {/* Materiales */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Materiales necesarios
            </label>
            <div className="space-y-2">
              {formData.materiales.map((material, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => updateArrayItem('materiales', index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-white border-2 border-light-300 rounded-xl text-dark"
                    placeholder="Material"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('materiales', index)}
                    className="p-2 text-secondary hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('materiales')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar material
              </Button>
            </div>
          </div>

          {/* Indicado para */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Indicado para
            </label>
            <div className="space-y-2">
              {formData.indicadoPara.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateArrayItem('indicadoPara', index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-white border-2 border-light-300 rounded-xl text-dark"
                    placeholder="Ej: demencia, TEA, adultos mayores"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('indicadoPara', index)}
                    className="p-2 text-secondary hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('indicadoPara')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar indicación
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth>
              {editingActividad ? 'Guardar cambios' : 'Crear actividad'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BibliotecaAdmin;
