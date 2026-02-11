import { useState, useRef, useEffect } from 'react';
import { Shield } from 'lucide-react';
import clsx from 'clsx';

const TOTPInput = ({ 
  length = 6, 
  value = '', 
  onChange, 
  error,
  autoFocus = true 
}) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    // Sincronizar con valor externo
    if (value) {
      const digits = value.split('').slice(0, length);
      setOtp([...digits, ...Array(length - digits.length).fill('')]);
    }
  }, [value, length]);

  const handleChange = (index, digit) => {
    if (!/^\d*$/.test(digit)) return; // Solo números
    
    const newOtp = [...otp];
    newOtp[index] = digit.slice(-1); // Solo último dígito
    setOtp(newOtp);
    
    // Notificar cambio
    const otpString = newOtp.join('');
    onChange?.(otpString);
    
    // Auto-focus siguiente input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Si está vacío, ir al anterior
        inputRefs.current[index - 1]?.focus();
      } else {
        // Limpiar actual
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    
    if (!/^\d+$/.test(pastedData)) return; // Solo números
    
    const digits = pastedData.split('');
    const newOtp = [...digits, ...Array(length - digits.length).fill('')];
    setOtp(newOtp);
    onChange?.(pastedData);
    
    // Focus en el siguiente vacío o último
    const nextIndex = Math.min(digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent-500/10">
          <Shield className="w-6 h-6 text-accent-400" />
        </div>
      </div>
      
      <div className="flex gap-2 justify-center mb-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={clsx(
              'w-12 h-14 text-center text-2xl font-semibold',
              'bg-bg-secondary border-2 rounded-lg',
              'text-text-primary',
              'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent',
              'transition-all duration-200',
              error 
                ? 'border-danger-500' 
                : 'border-border-primary hover:border-border-secondary'
            )}
          />
        ))}
      </div>
      
      {error && (
        <p className="text-center text-sm text-danger-400 mt-2">
          {error}
        </p>
      )}
    </div>
  );
};

export default TOTPInput;