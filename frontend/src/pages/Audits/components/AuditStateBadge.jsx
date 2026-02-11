import { memo } from 'react';
import { Edit3, Eye, CheckCircle } from 'lucide-react';

/**
 * Estados de auditoría y su configuración visual
 */
const STATE_CONFIG = {
  EDIT: {
    label: 'En Edición',
    icon: Edit3,
    colors: 'bg-info-500/10 text-info-400 border-info-500/20',
  },
  REVIEW: {
    label: 'En Revisión',
    icon: Eye,
    colors: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
  },
  APPROVED: {
    label: 'Aprobada',
    icon: CheckCircle,
    colors: 'bg-success-500/10 text-success-400 border-success-500/20',
  },
};

/**
 * AuditStateBadge - Badge visual para el estado de una auditoría
 */
const AuditStateBadge = ({ 
  state, 
  size = 'md',
  showIcon = true,
  className = '' 
}) => {
  const config = STATE_CONFIG[state] || STATE_CONFIG.EDIT;
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

export default memo(AuditStateBadge);

// Export config for reuse
export { STATE_CONFIG };