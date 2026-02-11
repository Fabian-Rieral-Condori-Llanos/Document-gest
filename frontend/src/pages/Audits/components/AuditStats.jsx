import { memo } from 'react';
import { 
  FileText, 
  Edit3, 
  Eye, 
  CheckCircle,
  TrendingUp
} from 'lucide-react';

/**
 * AuditStats - Muestra estadísticas de auditorías
 */
const AuditStats = ({ audits = [], className = '' }) => {
  // Calcular estadísticas
  const stats = {
    total: audits.length,
    edit: audits.filter(a => a.state === 'EDIT').length,
    review: audits.filter(a => a.state === 'REVIEW').length,
    approved: audits.filter(a => a.state === 'APPROVED').length,
  };

  const statItems = [
    {
      label: 'Total',
      value: stats.total,
      icon: FileText,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
    },
    {
      label: 'En Edición',
      value: stats.edit,
      icon: Edit3,
      color: 'text-info-400',
      bgColor: 'bg-info-500/10',
    },
    {
      label: 'En Revisión',
      value: stats.review,
      icon: Eye,
      color: 'text-warning-400',
      bgColor: 'bg-warning-500/10',
    },
    {
      label: 'Aprobadas',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-success-400',
      bgColor: 'bg-success-500/10',
    },
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="bg-bg-secondary border border-gray-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${item.bgColor}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="text-sm text-gray-400">{item.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(AuditStats);