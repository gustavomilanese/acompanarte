import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  MapPin, 
  LogOut, 
  Bell,
  Shield,
  Heart
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Badge } from '@/components/Badge';
import { useToast } from '@/components/Toast';
import { getClienteById, getAcompananteById } from '@/data/mockData';

export function Perfil() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showSuccess } = useToast();

  const cliente = getClienteById(user?.clienteId);
  const acompanante = getAcompananteById(cliente?.acompananteAsignado);

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-light pb-20">
      <Header title="Configuración" />

      <div className="p-4 space-y-4">
        {/* Info del familiar */}
        <Card>
          <CardContent className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-dark">{user?.nombre}</h2>
            <p className="text-dark-400">Familiar de {cliente?.nombre}</p>
            <Badge variant="primary" className="mt-2">
              Código: {user?.clienteId === 'cli-1' ? '987654' : '••••••'}
            </Badge>
          </CardContent>
        </Card>

        {/* Info del cliente */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-dark mb-4">Información de {cliente?.nombre}</h3>
            
            <div className="flex items-center gap-4 mb-4">
              <img
                src={cliente?.foto}
                alt={cliente?.nombre}
                className="w-16 h-16 rounded-2xl object-cover"
              />
              <div>
                <p className="font-semibold text-dark">{cliente?.nombre}</p>
                <p className="text-sm text-dark-400">
                  {cliente?.edad} años · {cliente?.condicion}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-light-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Dirección</p>
                  <p className="text-dark font-medium">{cliente?.direccion}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Contacto de emergencia</p>
                  <p className="text-dark font-medium">
                    {cliente?.contactoEmergencia.nombre}
                  </p>
                  <p className="text-sm text-primary">{cliente?.contactoEmergencia.telefono}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acompañante asignado */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-dark mb-4">Acompañante asignado</h3>
            <div className="flex items-center gap-4">
              <img
                src={acompanante?.avatar}
                alt={acompanante?.nombre}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-dark">{acompanante?.nombre}</p>
                <p className="text-sm text-dark-400">{acompanante?.email}</p>
                <p className="text-sm text-primary">{acompanante?.telefono}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opciones */}
        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-dark">Preferencias</h3>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-dark" />
                </div>
                <span className="text-dark">Notificaciones</span>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="text-dark">Privacidad</span>
              </div>
            </div>
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

      <BottomNav type="familiar" />
    </div>
  );
}

export default Perfil;
