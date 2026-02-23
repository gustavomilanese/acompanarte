import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';

const ROLES = {
  ACOMPANANTE: 'acompanante',
  FAMILIAR: 'familiar',
  ADMIN: 'admin',
};

export function Login() {
  const navigate = useNavigate();
  const { loginAcompanante, loginFamiliar, loginAdmin } = useAuth();
  const { toast, showSuccess, showError } = useToast();

  const [selectedRole, setSelectedRole] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { id: ROLES.ACOMPANANTE, label: 'Soy acompañante', icon: Users, color: 'text-primary' },
    { id: ROLES.FAMILIAR, label: 'Soy familiar', icon: Heart, color: 'text-secondary' },
    { id: ROLES.ADMIN, label: 'Soy administrador', icon: Shield, color: 'text-dark' },
  ];

  const selectedRoleData = roles.find((r) => r.id === selectedRole);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setIsRoleDropdownOpen(false);
    // Reset form
    setEmail('');
    setCode('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;

      switch (selectedRole) {
        case ROLES.ACOMPANANTE:
          result = loginAcompanante(email, code);
          break;
        case ROLES.FAMILIAR:
          result = loginFamiliar(code);
          break;
        case ROLES.ADMIN:
          result = loginAdmin(email, password);
          break;
        default:
          showError('Selecciona un tipo de usuario');
          setIsLoading(false);
          return;
      }

      if (result.success) {
        showSuccess(`¡Bienvenido, ${result.user.nombre}!`);
        
        // Redirigir según rol
        setTimeout(() => {
          switch (selectedRole) {
            case ROLES.ACOMPANANTE:
              navigate('/');
              break;
            case ROLES.FAMILIAR:
              navigate('/');
              break;
            case ROLES.ADMIN:
              navigate('/admin');
              break;
          }
        }, 500);
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    switch (selectedRole) {
      case ROLES.ACOMPANANTE:
        return (
          <>
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Código de acceso"
              type="password"
              placeholder="1234"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              helperText="Ingresa tu código de 4 dígitos"
            />
          </>
        );
      
      case ROLES.FAMILIAR:
        return (
          <Input
            label="Código de acceso"
            type="password"
            placeholder="987654"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            helperText="Ingresa el código de 6 dígitos que te proporcionaron"
          />
        );
      
      case ROLES.ADMIN:
        return (
          <>
            <Input
              label="Email"
              type="email"
              placeholder="admin@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-light flex flex-col">
      {toast}
      
      {/* Header */}
      <div className="bg-primary py-8 px-4">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Acompañarte</h1>
          <p className="text-white/80">Cuidado con amor</p>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 px-4 py-8 -mt-4">
        <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-dark text-center mb-6">
            Iniciar sesión
          </h2>

          {/* Role Selector */}
          <div className="relative mb-6">
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Tipo de usuario
            </label>
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className={`
                w-full px-4 py-3 bg-white border-2 border-light-300 rounded-xl
                flex items-center justify-between
                transition-all duration-200
                ${selectedRole ? 'border-primary' : ''}
                focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
              `}
            >
              <div className="flex items-center gap-3">
                {selectedRoleData ? (
                  <>
                    <selectedRoleData.icon className={`w-5 h-5 ${selectedRoleData.color}`} />
                    <span className="text-dark font-medium">{selectedRoleData.label}</span>
                  </>
                ) : (
                  <span className="text-dark-400">Selecciona tu perfil</span>
                )}
              </div>
              <ChevronDown
                className={`w-5 h-5 text-dark-400 transition-transform ${
                  isRoleDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown */}
            {isRoleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-light-300 rounded-xl shadow-lg z-10 overflow-hidden">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={`
                      w-full px-4 py-3 flex items-center gap-3
                      hover:bg-light-100 transition-colors
                      ${selectedRole === role.id ? 'bg-primary/5' : ''}
                    `}
                  >
                    <role.icon className={`w-5 h-5 ${role.color}`} />
                    <span className="text-dark font-medium">{role.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          {selectedRole && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2">
              {renderForm()}
              
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
                className="mt-6"
              >
                Ingresar
              </Button>
            </form>
          )}

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-light-200">
            <p className="text-xs text-dark-400 text-center">
              ¿Necesitas ayuda? Contacta a soporte
            </p>
          </div>
        </div>

        {/* Test credentials */}
        <div className="max-w-sm mx-auto mt-6 px-4">
          <p className="text-xs text-dark-400 text-center mb-2">Datos de prueba:</p>
          <div className="text-xs text-dark-300 text-center space-y-1">
            <p><strong>Acompañante:</strong> maria@ejemplo.com / 1234</p>
            <p><strong>Familiar:</strong> 987654</p>
            <p><strong>Admin:</strong> admin@acompanarte.online / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
