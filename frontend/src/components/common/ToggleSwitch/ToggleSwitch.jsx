import { useState } from 'react';

/**
 * ToggleSwitch - Componente de interruptor de deslizamiento
 * 
 * @param {boolean} checked - Estado actual del toggle
 * @param {function} onChange - Callback cuando cambia el estado
 * @param {boolean} disabled - Si está deshabilitado
 * @param {string} size - Tamaño: 'sm', 'md', 'lg'
 * @param {string} label - Texto opcional a mostrar
 * @param {boolean} loading - Estado de carga
 */
const ToggleSwitch = ({ 
  checked = false, 
  onChange, 
  disabled = false,
  size = 'md',
  label,
  loading = false,
  className = ''
}) => {
  const [isChanging, setIsChanging] = useState(false);

  const handleChange = async () => {
    if (disabled || loading || isChanging) return;
    
    setIsChanging(true);
    try {
      if (onChange) {
        await onChange(!checked);
      }
    } finally {
      setIsChanging(false);
    }
  };

  // Tamaños
  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
      labelSize: 'text-xs'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
      labelSize: 'text-sm'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
      labelSize: 'text-base'
    }
  };

  const currentSize = sizes[size] || sizes.md;
  const isLoading = loading || isChanging;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled || isLoading}
        onClick={handleChange}
        className={`
          relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-primary
          ${currentSize.track}
          ${checked 
            ? 'bg-primary-500' 
            : 'bg-gray-600'
          }
          ${(disabled || isLoading) 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:opacity-90'
          }
        `}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out
            ${currentSize.thumb}
            ${checked ? currentSize.translate : 'translate-x-0.5'}
            ${isLoading ? 'animate-pulse' : ''}
          `}
        >
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-2 h-2 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            </span>
          )}
        </span>
      </button>
      
      {label && (
        <span className={`text-gray-300 ${currentSize.labelSize} ${disabled ? 'opacity-50' : ''}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default ToggleSwitch;
