import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pause,
  TrendingUp,
  Calendar,
  Building2,
  User,
  ChevronRight,
  ChevronDown,
  Filter,
  RefreshCw,
  History,
  FileText,
} from 'lucide-react';

// Redux
import {
  fetchAuditStatuses,
  fetchAuditStatusStats,
  selectAllAuditStatuses,
  selectAuditStatusLoading,
  selectAuditStatusStats,
  selectAuditStatusStatsLoading,
  selectAuditStatusFilters,
  setFilters as setStatusFilters,
  clearFilters as clearStatusFilters,
  AUDIT_STATUS_LABELS,
} from '../../features/audits';

// Components
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Pagination from '../../components/common/Pagination/';

// Utils
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return formatDate(dateString);
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'EVALUANDO':
      return Activity;
    case 'PENDIENTE':
      return Pause;
    case 'COMPLETADO':
      return CheckCircle;
    default:
      return Clock;
  }
};

const getStatusColors = (status) => {
  switch (status) {
    case 'EVALUANDO':
      return { bg: 'bg-info-500/10', text: 'text-info-400', border: 'border-info-500' };
    case 'PENDIENTE':
      return { bg: 'bg-warning-500/10', text: 'text-warning-400', border: 'border-warning-500' };
    case 'COMPLETADO':
      return { bg: 'bg-success-500/10', text: 'text-success-400', border: 'border-success-500' };
    default:
      return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500' };
  }
};

/**
 * AuditStatusPage - Dashboard de estados de auditorías con historial
 */
const AuditStatusPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const statuses = useSelector(selectAllAuditStatuses);
  const loading = useSelector(selectAuditStatusLoading);
  const stats = useSelector(selectAuditStatusStats);
  const statsLoading = useSelector(selectAuditStatusStatsLoading);
  const filters = useSelector(selectAuditStatusFilters);
  
  // Local state
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState({});
  const itemsPerPage = 10;

  // Cargar datos
  useEffect(() => {
    dispatch(fetchAuditStatuses());
    dispatch(fetchAuditStatusStats());
  }, [dispatch]);

  // Filtrar y paginar
  const filteredStatuses = statuses.filter(status => {
    if (filters.status && status.status !== filters.status) return false;
    return true;
  });

  const paginatedStatuses = filteredStatuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredStatuses.length / itemsPerPage);

  // Handlers
  const handleFilterChange = (key, value) => {
    dispatch(setStatusFilters({ [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    dispatch(clearStatusFilters());
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchAuditStatuses());
    dispatch(fetchAuditStatusStats());
  };

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Stats cards data
  const statsCards = [
    {
      label: 'Total',
      value: stats?.total || statuses.length,
      icon: TrendingUp,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
    },
    {
      label: 'Evaluando',
      value: stats?.byStatus?.EVALUANDO || statuses.filter(s => s.status === 'EVALUANDO').length,
      icon: Activity,
      color: 'text-info-400',
      bgColor: 'bg-info-500/10',
    },
    {
      label: 'Pendientes',
      value: stats?.byStatus?.PENDIENTE || statuses.filter(s => s.status === 'PENDIENTE').length,
      icon: Pause,
      color: 'text-warning-400',
      bgColor: 'bg-warning-500/10',
    },
    {
      label: 'Completados',
      value: stats?.byStatus?.COMPLETADO || statuses.filter(s => s.status === 'COMPLETADO').length,
      icon: CheckCircle,
      color: 'text-success-400',
      bgColor: 'bg-success-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Estado de Auditorías</h1>
          <p className="text-gray-400 mt-1">
            Seguimiento del ciclo de vida de las auditorías
          </p>
        </div>
        <Button 
          variant="secondary" 
          icon={RefreshCw} 
          onClick={handleRefresh}
          disabled={loading}
        >
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {statsLoading ? '-' : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-white font-medium">Filtros</span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Estado
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Todos</option>
                {Object.entries(AUDIT_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button variant="ghost" onClick={handleClearFilters}>
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}
        
        {/* Active filters summary */}
        {filters.status && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
            <span className="text-sm text-gray-400">Filtros activos:</span>
            <span className="px-2 py-1 bg-primary-500/10 text-primary-400 text-xs rounded-full">
              {AUDIT_STATUS_LABELS[filters.status]}
            </span>
          </div>
        )}
      </Card>

      {/* Status List */}
      <Card>
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-medium text-white">
            Auditorías ({filteredStatuses.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-500/10 mb-3">
              <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-400">Cargando estados...</p>
          </div>
        ) : filteredStatuses.length === 0 ? (
          <div className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No se encontraron auditorías</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-800">
              {paginatedStatuses.map((statusItem) => {
                const StatusIcon = getStatusIcon(statusItem.status);
                const colors = getStatusColors(statusItem.status);
                const audit = statusItem.auditId;
                const isExpanded = expandedItems[statusItem._id];
                const hasHistory = statusItem.history?.length > 0;
                
                return (
                  <div key={statusItem._id} className="bg-bg-secondary">
                    {/* Main Row */}
                    <div
                      className="p-4 hover:bg-bg-tertiary transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Expand Button */}
                          {hasHistory && (
                            <button
                              onClick={() => toggleExpanded(statusItem._id)}
                              className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          )}
                          {!hasHistory && <div className="w-7" />}
                          
                          {/* Status Icon */}
                          <div className={`p-2 rounded-lg ${colors.bg}`}>
                            <StatusIcon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          
                          {/* Info */}
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => audit?._id && navigate(`/audits/${audit._id}`)}
                          >
                            <h4 className="text-white font-medium hover:text-primary-400 transition-colors">
                              {audit?.name || 'Auditoría sin nombre'}
                            </h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              {audit?.company?.name && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5" />
                                  {audit.company.name}
                                </span>
                              )}
                              {audit?.creator && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  {audit.creator.username || audit.creator.firstname}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(statusItem.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Status Badge */}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                            {AUDIT_STATUS_LABELS[statusItem.status] || statusItem.status}
                          </span>
                          
                          {/* History count */}
                          {hasHistory && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <History className="w-3.5 h-3.5" />
                              {statusItem.history.length}
                            </span>
                          )}
                          
                          {/* View button */}
                          <button
                            onClick={() => audit?._id && navigate(`/audits/${audit._id}`)}
                            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
                          >
                            <FileText className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded History Timeline */}
                    {isExpanded && hasHistory && (
                      <div className="px-4 pb-4 ml-16">
                        <div className="p-4 bg-bg-tertiary rounded-lg">
                          <h5 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Historial de Cambios ({statusItem.history.length})
                          </h5>
                          
                          <div className="space-y-0">
                            {/* Mostrar historial en orden cronológico inverso (más reciente primero) */}
                            {[...statusItem.history].reverse().map((historyItem, idx) => {
                              const historyColors = getStatusColors(historyItem.status);
                              const HistoryIcon = getStatusIcon(historyItem.status);
                              const isFirst = idx === 0;
                              const isLast = idx === statusItem.history.length - 1;
                              
                              return (
                                <div key={idx} className="flex gap-4">
                                  {/* Timeline line and dot */}
                                  <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full ${historyColors.bg} border-2 ${historyColors.border}`} />
                                    {!isLast && (
                                      <div className="w-0.5 h-full bg-gray-700 min-h-[40px]" />
                                    )}
                                  </div>
                                  
                                  {/* Content */}
                                  <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${historyColors.bg} ${historyColors.text}`}>
                                        {AUDIT_STATUS_LABELS[historyItem.status] || historyItem.status}
                                      </span>
                                      {isFirst && (
                                        <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 text-xs rounded">
                                          Actual
                                        </span>
                                      )}
                                    </div>
                                    
                                    <p className="text-xs text-gray-500">
                                      {formatDateTime(historyItem.changedAt)}
                                      <span className="text-gray-600 mx-1">•</span>
                                      {formatRelativeTime(historyItem.changedAt)}
                                    </p>
                                    
                                    {historyItem.changedBy && (
                                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {historyItem.changedBy.firstname || historyItem.changedBy.username || 'Usuario'}
                                        {historyItem.changedBy.lastname && ` ${historyItem.changedBy.lastname}`}
                                      </p>
                                    )}
                                    
                                    {historyItem.notes && (
                                      <p className="text-sm text-gray-400 mt-2 p-2 bg-bg-secondary rounded border-l-2 border-gray-600">
                                        {historyItem.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-800">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default AuditStatusPage;