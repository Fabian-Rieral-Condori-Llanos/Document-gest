import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const Input = ({
  label,
  type = 'text',
  error,
  icon: Icon,
  className,
  containerClassName,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <input
          type={inputType}
          className={clsx(
            'w-full px-4 py-2.5 bg-bg-secondary border rounded-lg',
            'text-text-primary placeholder-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-all duration-200',
            error 
              ? 'border-danger-500 focus:ring-danger-500' 
              : 'border-border-primary hover:border-border-secondary',
            Icon && 'pl-11',
            isPassword && 'pr-11',
            className
          )}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <div className="flex items-center mt-2 text-sm text-danger-400">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default Input;