/**
 * UIComponents.jsx
 * 
 * Componentes UI base reutilizables para el Dashboard.
 * Importar desde: ./components/UIComponents
 */

import { Loader2, ChevronRight } from 'lucide-react';

// Clases de color compartidas
export const colorClasses = {
  primary: 'bg-primary-500/10 text-primary-400',
  cyan: 'bg-cyan-500/10 text-cyan-400',
  red: 'bg-red-500/10 text-red-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-400',
  purple: 'bg-purple-500/10 text-purple-400',
};

/**
 * StatCard - Tarjeta de estadística principal
 */
export const StatCard = ({ icon: Icon, title, value, subtitle, color = 'primary', loading, onClick }) => {
  const isClickable = !!onClick;

  return (
    <div 
      className={`bg-bg-secondary rounded-xl p-5 border border-gray-800 transition-colors ${
        isClickable 
          ? 'hover:border-primary-500/50 hover:bg-bg-secondary/80 cursor-pointer group' 
          : 'hover:border-gray-700'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colorClasses[color]} ${isClickable ? 'group-hover:scale-110 transition-transform' : ''}`}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
        {isClickable && (
          <ChevronRight size={16} className="text-gray-600 group-hover:text-primary-400 transition-colors" />
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {loading ? <Loader2 size={24} className="animate-spin" /> : value}
      </div>
      <div className="text-sm text-gray-400">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
};

/**
 * MiniStatCard - Tarjeta de estadística pequeña
 */
export const MiniStatCard = ({ icon: Icon, title, value, color = 'primary' }) => {
  return (
    <div className="bg-bg-tertiary rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={16} strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-lg font-bold text-white">{value}</div>
          <div className="text-xs text-gray-400">{title}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * EstadoBadge - Badge de estado de evaluación
 */
export const EstadoBadge = ({ estado }) => {
  const estilos = {
    'EVALUANDO': 'bg-blue-500/15 text-blue-400',
    'VERIFICACION': 'bg-amber-500/15 text-amber-400',
    'FINALIZADAS': 'bg-emerald-500/15 text-emerald-400',
    'OBSERVACION': 'bg-red-500/15 text-red-400',
    'EDIT': 'bg-blue-500/15 text-blue-400',
    'REVIEW': 'bg-purple-500/15 text-purple-400',
    'APPROVED': 'bg-emerald-500/15 text-emerald-400',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${estilos[estado] || 'bg-gray-500/15 text-gray-400'}`}>
      {estado}
    </span>
  );
};

/**
 * TipoBadge - Badge de tipo de procedimiento
 */
export const TipoBadge = ({ tipo }) => {
  const tipos = {
    'PR01': { label: 'Solicitud EP', class: 'bg-indigo-500/20 text-indigo-300' },
    'PR02': { label: 'Interna', class: 'bg-cyan-500/20 text-cyan-300' },
    'PR03': { label: 'Externa', class: 'bg-emerald-500/20 text-emerald-300' },
    'PR09': { label: 'Sol. AGETIC', class: 'bg-amber-500/20 text-amber-300' },
    'Verificación': { label: 'Verificación', class: 'bg-purple-500/20 text-purple-300' },
  };
  
  const tipoKey = tipo?.split(' - ')[0] || tipo;
  const config = tipos[tipoKey] || { label: tipo || 'Sin tipo', class: 'bg-gray-500/20 text-gray-400' };
  
  return (
    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide ${config.class}`}>
      {config.label}
    </span>
  );
};

/**
 * VulnCount - Contador de vulnerabilidades con color
 */
export const VulnCount = ({ count, type }) => {
  const styles = {
    critical: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-emerald-500/20 text-emerald-400',
    safe: 'bg-emerald-500/10 text-emerald-400',
  };
  
  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded text-xs font-semibold font-mono ${styles[type]}`}>
      {count}
    </span>
  );
};

/**
 * ProgressBar - Barra de progreso
 */
export const ProgressBar = ({ value, showLabel = true }) => {
  const color = value > 80 ? 'bg-emerald-500' : value > 50 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      {showLabel && <span className="text-xs text-gray-400 font-mono w-10">{value}%</span>}
    </div>
  );
};

/**
 * LoadingSpinner - Spinner de carga centrado
 */
export const LoadingSpinner = ({ size = 32, className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <Loader2 size={size} className="animate-spin text-gray-500" />
  </div>
);

/**
 * EmptyState - Estado vacío
 */
export const EmptyState = ({ message = 'No hay datos disponibles', icon: Icon }) => (
  <div className="h-40 flex flex-col items-center justify-center text-gray-500">
    {Icon && <Icon size={32} className="mb-2 text-gray-600" />}
    <p>{message}</p>
  </div>
);
