import { memo } from 'react';
import { FileText, Layers, RefreshCw } from 'lucide-react';

/**
 * Tipos de auditoría y su configuración visual
 */
const TYPE_CONFIG = {
  default: {
    label: 'Estándar',
    icon: FileText,
    colors: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  },
  multi: {
    label: 'Multi-Auditoría',
    icon: Layers,
    colors: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
  },
  retest: {
    label: 'Retest',
    icon: RefreshCw,
    colors: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
  },
};

/**
 * AuditTypeBadge - Badge visual para el tipo de auditoría
 */
const AuditTypeBadge = ({ 
  type = 'default', 
  size = 'md',
  showIcon = true,
  className = '' 
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.default;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.colors}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
};

export default memo(AuditTypeBadge);

// Export config for reuse
export { TYPE_CONFIG };