import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSelectors';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';

const Forbidden = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger-500/10 mb-6">
              <ShieldAlert className="w-10 h-10 text-danger-400" />
            </div>
            
            <h1 className="text-6xl font-bold text-white mb-2">403</h1>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-400 mb-2">
              No tienes permisos para acceder a esta página.
            </p>
            
            {user && (
              <p className="text-sm text-gray-500 mb-6">
                Tu rol actual: <span className="text-primary-400 capitalize font-medium">{user.role}</span>
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="ghost"
                icon={ArrowLeft}
                onClick={() => navigate(-1)}
              >
                Volver
              </Button>
              
              <Button
                variant="primary"
                icon={Home}
                onClick={() => navigate('/dashboard')}
              >
                Ir al Dashboard
              </Button>
            </div>
            
            {!user && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-3">
                  ¿Necesitas acceso? Inicia sesión con una cuenta autorizada.
                </p>
                <Button
                  variant="ghost"
                  icon={LogIn}
                  onClick={() => navigate('/login')}
                >
                  Iniciar Sesión
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Forbidden;