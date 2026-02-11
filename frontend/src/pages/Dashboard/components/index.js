/**
 * Dashboard Components Index
 * 
 * Exporta todos los componentes del Dashboard.
 */

// UI Components base
export { 
  StatCard, 
  MiniStatCard, 
  EstadoBadge, 
  TipoBadge, 
  VulnCount, 
  ProgressBar,
  LoadingSpinner,
  EmptyState,
  colorClasses
} from './UIComponents';

// Header
export { default as DashboardHeader } from './DashboardHeader';

// Charts
export { default as DistributionChart } from './DistributionChart';
export { default as VulnerabilidadesChart } from './VulnerabilidadesChart';
export { default as TendenciaMensualChart } from './TendenciaMensualChart';

// Tables
export { default as EvaluacionesRecientesTable } from './EvaluacionesRecientesTable';

// Modals
export { default as CompanyStatsModal } from './CompanyStatsModal';
export { default as EvaluacionesModal } from './EvaluacionesModal';
export { default as EntidadesModal } from './EntidadesModal';
export { default as AuditDashboardModal } from './AuditDashboardModal';

// Top Entidades
export { default as TopEntidadesCriticasModal, TopEntidadesCriticasCard } from './TopEntidadesCriticas';
