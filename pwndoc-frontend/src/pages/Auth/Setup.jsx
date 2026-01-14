import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/common/Card/Card';
import SetupForm from '../../components/forms/SetupForm/SetupForm';
import Alert from '../../components/common/Alert/Alert';

const Setup = () => {
  const navigate = useNavigate();
  const { createFirstUser, checkInit, error, isLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [alreadySetup, setAlreadySetup] = useState(false);

  useEffect(() => {
    const verifySetup = async () => {
      try {
        const result = await checkInit();
        
        // Si data es true, significa que ya existe un usuario
        if (result.payload?.data === true) {
          setAlreadySetup(true);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (err) {
        console.error('Error checking init:', err);
      } finally {
        setChecking(false);
      }
    };

    verifySetup();
  }, [checkInit, navigate]);

  const handleSubmit = async (data) => {
    await createFirstUser(data);
    // El thunk redirige automáticamente al dashboard si es exitoso
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-500/10 mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-accent-400" />
          </div>
          <p className="text-text-secondary">Verificando configuración...</p>
        </div>
      </div>
    );
  }

  if (alreadySetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10 mb-4">
                <CheckCircle className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Sistema Ya Configurado
              </h2>
              <p className="text-text-secondary mb-4">
                El sistema ya ha sido configurado previamente.
              </p>
              <p className="text-sm text-text-tertiary">
                Redirigiendo al login...
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-500/10">
              <Shield className="w-8 h-8 text-accent-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Bienvenido a PwnDoc ACGII
          </h1>
        </div>

        {/* Alert Informativo */}
        <Alert variant="info" className="mb-6">
          <p className="text-sm">
            Este es el primer inicio del sistema. Configure el usuario administrador para comenzar.
          </p>
        </Alert>

        {/* Card de Setup */}
        <Card>
          <SetupForm
            onSubmit={handleSubmit}
            error={error}
            isLoading={isLoading}
          />
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-text-tertiary mt-8">
          PwnDoc ACGII © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Setup;