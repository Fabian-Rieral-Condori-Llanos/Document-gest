import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning-500/10 mb-4">
              <AlertTriangle className="w-8 h-8 text-warning-400" />
            </div>
            
            <h1 className="text-6xl font-bold text-text-primary mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              Página No Encontrada
            </h2>
            <p className="text-text-secondary mb-6">
              La página que buscas no existe o ha sido movida.
            </p>
            
            <Button
              icon={Home}
              onClick={() => navigate('/')}
            >
              Volver al Inicio
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;