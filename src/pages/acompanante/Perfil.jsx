import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  LogOut, 
  ChevronRight,
  Star,
  Calendar,
  Award
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Badge } from '@/components/Badge';
import { useToast } from '@/components/Toast';
import { getAcompananteById, getVisitasByAcompanante } from '@/data/mockData';

export function Perfil() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showSuccess } = useToast();

  const acompanante = getAcompananteById(user?.id);
  const visitas = getVisitasByAcompanante(user?.id);

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/login');
  };

  const menuItems = [
    { icon: Star, label: 'Mis especialidades', value: acompanante?.especialidades?.join(', ') },
    { icon: Calendar, label: 'Disponibilidad', value: acompanante?.disponibilidad },
    { icon: Award, label: 'Visitas completadas', value: `${visitas.length} visitas` },
  ];

  return (
    <div className="min-h-screen bg-light pb-20">
      <Header title="Mi perfil" />

      <div className="p-4 space-y-4">
        {/* Perfil header */}
        <Card>
          <CardContent className="text-center">
            <div className="relative inline-block mb-4">
              <img
                src={acompanante?.avatar || 'https://i.pravatar.cc/150?u=default'}
                alt={acompanante?.nombre}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-dark">{acompanante?.nombre}</h2>
            <p className="text-dark-400">Acompañante profesional</p>
            
            <Badge variant="success" className="mt-2">
              {acompanante?.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </Badge>

            {acompanante?.bio && (
              <p className="text-dark-500 mt-4 text-sm">{acompanante.bio}</p>
            )}
          </CardContent>
        </Card>

        {/* Info de contacto */}
        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-dark">Información de contacto</h3>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-dark-400">Email</p>
                <p className="text-dark font-medium">{acompanante?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-dark-400">Teléfono</p>
                <p className="text-dark font-medium">{acompanante?.telefono}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas y más info */}
        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-dark">Información adicional</h3>
            
            {menuItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-dark" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-dark-400">{item.label}</p>
                  <p className="text-dark font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cerrar sesión */}
        <Button
          onClick={handleLogout}
          variant="outline"
          fullWidth
          className="border-secondary text-secondary hover:bg-secondary hover:text-white"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar sesión
        </Button>
      </div>

      <BottomNav type="acompanante" />
    </div>
  );
}

export default Perfil;
