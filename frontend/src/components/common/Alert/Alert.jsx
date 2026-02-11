import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

const Alert = ({ 
  variant = 'info', 
  title, 
  children, 
  onClose,
  className 
}) => {
  const variants = {
    success: {
      bg: 'bg-primary-500/10 border-primary-500/20',
      text: 'text-primary-400',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-danger-500/10 border-danger-500/20',
      text: 'text-danger-400',
      icon: AlertCircle,
    },
    danger: {
      bg: 'bg-danger-500/10 border-danger-500/20',
      text: 'text-danger-400',
      icon: AlertCircle,
    },
    warning: {
      bg: 'bg-warning-500/10 border-warning-500/20',
      text: 'text-warning-400',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-info-500/10 border-info-500/20',
      text: 'text-info-400',
      icon: Info,
    },
  };
  
  const config = variants[variant] || variants.info;
  const Icon = config.icon;
  
  return (
    <div className={clsx(
      'rounded-lg border p-4',
      config.bg,
      className
    )}>
      <div className="flex items-start">
        <Icon className={clsx('w-5 h-5 mt-0.5', config.text)} />
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={clsx('text-sm font-medium', config.text)}>
              {title}
            </h3>
          )}
          {children && (
            <div className={clsx('text-sm mt-1', config.text)}>
              {children}
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className={clsx('ml-3 transition-colors', config.text, 'hover:opacity-70')}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;