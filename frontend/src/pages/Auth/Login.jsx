import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/common/Card/Card';
import LoginForm from '../../components/forms/LoginForm/LoginForm';
import TOTPForm from '../../components/forms/TOTPForm/TOTPForm';

const Login = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    requiresTOTP, 
    login, 
    loginWithTOTP, 
    error, 
    isLoading
  } = useAuth();
  
  const [credentials, setCredentials] = useState(null);
  const [showTOTP, setShowTOTP] = useState(false);

  // Redirigir si ya está autenticado (AppRoutes ya verificó el token)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (data) => {
    setCredentials(data);
    const result = await login(data);
    
    // Si el error es TOTP_REQUIRED, cambiar a modo TOTP
    if (result.error && result.payload === 'TOTP_REQUIRED') {
      setShowTOTP(true);
    }
  };

  const handleTOTPSubmit = async (totpCode) => {
    await loginWithTOTP({
      ...credentials,
      totpToken: totpCode,
    });
  };

  const handleBackToLogin = () => {
    setShowTOTP(false);
    setCredentials(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-500/10">
              <Shield className="w-8 h-8 text-accent-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            ACGII Dashboard
          </h1>
          <p className="text-text-secondary">
            Centro de Gestión de Incidentes Informáticos
          </p>
        </div>

        {/* Card de Login */}
        <Card>
          {showTOTP ? (
            <TOTPForm
              onSubmit={handleTOTPSubmit}
              onBack={handleBackToLogin}
              error={error !== 'TOTP_REQUIRED' ? error : null}
              isLoading={isLoading}
            />
          ) : (
            <LoginForm
              onSubmit={handleLogin}
              error={error !== 'TOTP_REQUIRED' ? error : null}
              isLoading={isLoading}
            />
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-text-tertiary mt-8">
          PwnDoc ACGII © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Login;