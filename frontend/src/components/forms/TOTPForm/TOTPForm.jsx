import { useState } from 'react';
import Button from '../../common/Button/Button';
import Alert from '../../common/Alert/Alert';
import TOTPInput from '../TOTPInput/TOTPInput';
import { ArrowLeft } from 'lucide-react';

const TOTPForm = ({ onSubmit, onBack, error, isLoading }) => {
  const [totpCode, setTotpCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totpCode.length === 6) {
      onSubmit(totpCode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Verificación en Dos Pasos
        </h3>
        <p className="text-sm text-text-secondary">
          Ingrese el código de 6 dígitos de su aplicación de autenticación
        </p>
      </div>
      
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}
      
      <TOTPInput
        length={6}
        value={totpCode}
        onChange={setTotpCode}
        error={error}
      />
      
      <div className="space-y-3">
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          disabled={totpCode.length !== 6}
        >
          Verificar Código
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          fullWidth
          icon={ArrowLeft}
          iconPosition="left"
          onClick={onBack}
        >
          Volver
        </Button>
      </div>
      
      <p className="text-xs text-center text-text-tertiary">
        ¿Problemas con la autenticación? Contacte al administrador
      </p>
    </form>
  );
};

export default TOTPForm;