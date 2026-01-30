import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
  Building2,
  User,
  ChevronRight,
  Filter,
  RefreshCw,
  Eye,
  FileText,
} from 'lucide-react';

// Redux
import {
  fetchAuditVerifications,
  fetchAuditVerificationStats,
  selectAllVerifications,
  selectVerificationsLoading,
  selectVerificationStats,
  selectVerificationStatsLoading,
  selectVerificationFilters,
  setFilters as setVerificationFilters,
  clearFilters as clearVerificationFilters,
  VERIFICATION_STATUS,
  VERIFICATION_RESULT,
  VERIFICATION_STATUS_COLORS,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_RESULT_LABELS,
} from '../../features/audits';

// Components
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Pagination from '../../components/common/Pagination';

// Utils
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getResultIcon = (result) => {
  switch (result) {
    case 'COMPLETADO':
      return CheckCircle;
    case 'EN_PROCESO':
      return Clock;
    case 'PENDIENTE':
      return AlertTriangle;
    default:
      return Clock;
  }
};

const getResultColor = (result) => {
  switch (result) {
    case 'COMPLETADO':
      return { bg: 'bg-success-500/10', text: 'text-success-400' };
    case 'EN_PROCESO':
      return { bg: 'bg-info-500/10', text: 'text-info-400' };
    case 'PENDIENTE':
      return { bg: 'bg-warning-500/10', text: 'text-warning-400' };
    default:
      return { bg: 'bg-gray-500/10', text: 'text-gray-400' };
  }
};

/**
 * AuditVerificationsPage - Dashboard de verificaciones de auditorías
 */
const AuditVerificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const verifications = useSelector(selectAllVerifications);
  const loading = useSelector(selectVerificationsLoading);
  const stats = useSelector(selectVerificationStats);
  const statsLoading = useSelector(selectVerificationStatsLoading);
  const filters = useSelector(selectVerificationFilters);
  
  // Local state
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cargar datos
  useEffect(() => {
    dispatch(fetchAuditVerifications());
    dispatch(fetchAuditVerificationStats());
  }, [dispatch]);

  // Filtrar y paginar
  const filteredVerifications = verifications.filter(v => {
    if (filters.result && v.result !== filters.result) return false;
    return true;
  });

  const paginatedVerifications = filteredVerifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredVerifications.length / itemsPerPage);

  // Handlers
  const handleFilterChange = (key, value) => {
    dispatch(setVerificationFilters({ [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    dispatch(clearVerificationFilters());
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchAuditVerifications());
    dispatch(fetchAuditVerificationStats());
  };

  // Stats cards
  const statsCards = [
    {
      label: 'Total Verificaciones',
      value: stats?.total || verifications.length,
      icon: Shield,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
    },
    {
      label: 'En Proceso',
      value: stats?.byResult?.EN_PROCESO || verifications.filter(v => v.result === 'EN_PROCESO').length,
      icon: Clock,
      color: 'text-info-400',
      bgColor: 'bg-info-500/10',
    },
    {
      label: 'Pendientes',
      value: stats?.byResult?.PENDIENTE || verifications.filter(v => v.result === 'PENDIENTE').length,
      icon: AlertTriangle,
      color: 'text-warning-400',
      bgColor: 'bg-warning-500/10',
    },
    {
      label: 'Completadas',
      value: stats?.byResult?.COMPLETADO || verifications.filter(v => v.result === 'COMPLETADO').length,
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
          <h1 className="text-2xl font-bold text-white">Verificaciones</h1>
          <p className="text-gray-400 mt-1">
            Seguimiento de verificaciones y retests de auditorías
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
                Resultado
              </label>
              <select
                value={filters.result || ''}
                onChange={(e) => handleFilterChange('result', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Todos</option>
                {Object.entries(VERIFICATION_RESULT_LABELS || {}).map(([key, label]) => (
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
        
        {filters.result && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
            <span className="text-sm text-gray-400">Filtros activos:</span>
            <span className="px-2 py-1 bg-primary-500/10 text-primary-400 text-xs rounded-full">
              {VERIFICATION_RESULT_LABELS?.[filters.result] || filters.result}
            </span>
          </div>
        )}
      </Card>

      {/* Verifications List */}
      <Card>
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-medium text-white">
            Verificaciones ({filteredVerifications.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-500/10 mb-3">
              <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-400">Cargando verificaciones...</p>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="py-12 text-center">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">Sin verificaciones</h3>
            <p className="text-gray-400">
              Las verificaciones se crean desde las auditorías completadas
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-800">
              {paginatedVerifications.map((verification) => {
                const ResultIcon = getResultIcon(verification.result);
                const resultColor = getResultColor(verification.result);
                const parentAudit = verification.parentAuditId;
                const childAudit = verification.childAuditId;
                
                // Calcular estadísticas de findings
                const findingsStats = verification.findings?.reduce((acc, f) => {
                  acc[f.status] = (acc[f.status] || 0) + 1;
                  return acc;
                }, {}) || {};
                
                return (
                  <div
                    key={verification._id}
                    className="p-4 hover:bg-bg-tertiary transition-colors cursor-pointer"
                    onClick={() => childAudit?._id && navigate(`/audits/${childAudit._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Result Icon */}
                        <div className={`p-2 rounded-lg ${resultColor.bg}`}>
                          <ResultIcon className={`w-5 h-5 ${resultColor.text}`} />
                        </div>
                        
                        {/* Info */}
                        <div>
                          <h4 className="text-white font-medium">
                            {childAudit?.name || 'Verificación'}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            {parentAudit?.name && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                Original: {parentAudit.name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(verification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Findings Stats */}
                        {verification.findings?.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            {findingsStats.VERIFICADO > 0 && (
                              <span className="px-2 py-1 bg-success-500/10 text-success-400 rounded">
                                ✓ {findingsStats.VERIFICADO}
                              </span>
                            )}
                            {findingsStats.NO_VERIFICADO > 0 && (
                              <span className="px-2 py-1 bg-danger-500/10 text-danger-400 rounded">
                                ✗ {findingsStats.NO_VERIFICADO}
                              </span>
                            )}
                            {findingsStats.PENDIENTE > 0 && (
                              <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded">
                                ? {findingsStats.PENDIENTE}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Result Badge */}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${resultColor.bg} ${resultColor.text}`}>
                          {VERIFICATION_RESULT_LABELS?.[verification.result] || verification.result}
                        </span>
                        
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {verification.findings?.length > 0 && (
                      <div className="mt-3 ml-14">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-success-500 transition-all"
                              style={{ 
                                width: `${(findingsStats.VERIFICADO || 0) / verification.findings.length * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {findingsStats.VERIFICADO || 0}/{verification.findings.length} verificados
                          </span>
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

export default AuditVerificationsPage;