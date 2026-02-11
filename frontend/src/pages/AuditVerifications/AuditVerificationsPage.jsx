import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  Building2,
  ChevronRight,
  RefreshCw,
  FileText,
  TrendingUp,
  Search,
} from 'lucide-react';

// API - Usamos la API de audits que SÍ existe
import * as auditsApi from '../../api/endpoints/audits.api';

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

// Calcular estadísticas de findings de una verificación
const calculateFindingsStats = (findings = []) => {
  const stats = {
    total: findings.length,
    ok: 0,
    ko: 0,
    partial: 0,
    unknown: 0,
  };
  
  findings.forEach(f => {
    const status = f.retestStatus || 'unknown';
    if (status === 'ok') stats.ok++;
    else if (status === 'ko') stats.ko++;
    else if (status === 'partial') stats.partial++;
    else stats.unknown++;
  });
  
  stats.verified = stats.ok + stats.ko + stats.partial;
  stats.progress = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;
  
  return stats;
};

// Determinar estado general de la verificación
const getVerificationStatus = (stats) => {
  if (stats.total === 0) return { label: 'Sin Hallazgos', color: 'bg-gray-500', textColor: 'text-gray-400' };
  if (stats.progress === 100) {
    if (stats.ko > 0) return { label: 'Completada - Con Pendientes', color: 'bg-warning-500', textColor: 'text-warning-400' };
    return { label: 'Completada', color: 'bg-success-500', textColor: 'text-success-400' };
  }
  if (stats.progress > 0) return { label: 'En Proceso', color: 'bg-info-500', textColor: 'text-info-400' };
  return { label: 'Pendiente', color: 'bg-gray-500', textColor: 'text-gray-400' };
};

/**
 * AuditVerificationsPage - Dashboard de verificaciones de auditorías
 * Lista todas las auditorías con type='verification'
 */
const AuditVerificationsPage = () => {
  const navigate = useNavigate();
  
  // State
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cargar datos
  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obtener todas las auditorías
      const response = await auditsApi.getAudits();
      
      // Filtrar solo las de tipo 'verification'
      const verificationsData = (response.data || [])
        .filter(audit => audit.type === 'verification')
        .map(audit => ({
          ...audit,
          stats: calculateFindingsStats(audit.findings || []),
        }));
      
      setVerifications(verificationsData);
    } catch (err) {
      setError('Error al cargar verificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar verificaciones
  const filteredVerifications = useMemo(() => {
    return verifications.filter(v => {
      // Búsqueda por nombre
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const name = (v.name || '').toLowerCase();
        const company = (v.company?.name || '').toLowerCase();
        if (!name.includes(search) && !company.includes(search)) {
          return false;
        }
      }
      
      // Filtro por estado
      if (statusFilter) {
        if (statusFilter === 'pending' && v.stats.progress !== 0) return false;
        if (statusFilter === 'in_progress' && (v.stats.progress === 0 || v.stats.progress === 100)) return false;
        if (statusFilter === 'completed' && v.stats.progress !== 100) return false;
      }
      
      return true;
    });
  }, [verifications, searchTerm, statusFilter]);

  // Paginación
  const paginatedVerifications = filteredVerifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredVerifications.length / itemsPerPage);

  // Estadísticas globales
  const globalStats = useMemo(() => {
    return {
      total: verifications.length,
      pending: verifications.filter(v => v.stats.progress === 0).length,
      inProgress: verifications.filter(v => v.stats.progress > 0 && v.stats.progress < 100).length,
      completed: verifications.filter(v => v.stats.progress === 100).length,
    };
  }, [verifications]);

  // Handlers
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary-400" />
            Verificaciones
          </h1>
          <p className="text-gray-400 mt-1">
            Seguimiento de verificaciones de hallazgos
          </p>
        </div>
        <Button 
          variant="secondary" 
          icon={RefreshCw} 
          onClick={loadVerifications}
          disabled={loading}
        >
          Actualizar
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="danger" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white mt-1">{globalStats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-500/10">
              <Shield className="w-6 h-6 text-primary-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-white mt-1">{globalStats.pending}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-500/10">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">En Proceso</p>
              <p className="text-2xl font-bold text-white mt-1">{globalStats.inProgress}</p>
            </div>
            <div className="p-3 rounded-lg bg-info-500/10">
              <TrendingUp className="w-6 h-6 text-info-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Completadas</p>
              <p className="text-2xl font-bold text-white mt-1">{globalStats.completed}</p>
            </div>
            <div className="p-3 rounded-lg bg-success-500/10">
              <CheckCircle className="w-6 h-6 text-success-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar por nombre o empresa..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          
          {/* Filtro de estado */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="in_progress">En Proceso</option>
            <option value="completed">Completadas</option>
          </select>
          
          {hasActiveFilters && (
            <Button variant="ghost" onClick={handleClearFilters}>
              Limpiar
            </Button>
          )}
        </div>
      </Card>

      {/* Lista de Verificaciones */}
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
            <h3 className="text-lg font-medium text-white mb-2">
              {hasActiveFilters ? 'Sin resultados' : 'Sin verificaciones'}
            </h3>
            <p className="text-gray-400 mb-4">
              {hasActiveFilters 
                ? 'No se encontraron verificaciones con los filtros aplicados'
                : 'Las verificaciones se crean desde las auditorías completadas'
              }
            </p>
            {hasActiveFilters && (
              <Button variant="secondary" onClick={handleClearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-800">
              {paginatedVerifications.map((verification) => {
                const status = getVerificationStatus(verification.stats);
                
                return (
                  <div
                    key={verification._id}
                    className="p-4 hover:bg-bg-tertiary transition-colors cursor-pointer"
                    onClick={() => navigate(`/audit-verifications/${verification._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Icono de estado */}
                        <div className={`p-2.5 rounded-lg ${status.color}/10`}>
                          {verification.stats.progress === 100 ? (
                            <CheckCircle className={`w-5 h-5 ${status.textColor}`} />
                          ) : verification.stats.progress > 0 ? (
                            <TrendingUp className={`w-5 h-5 ${status.textColor}`} />
                          ) : (
                            <Clock className={`w-5 h-5 ${status.textColor}`} />
                          )}
                        </div>
                        
                        {/* Info */}
                        <div>
                          <h4 className="text-white font-medium">
                            {verification.name}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            {verification.company?.name && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {verification.company.name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(verification.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              {verification.stats.total} hallazgos
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Estadísticas de findings */}
                        {verification.stats.total > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            {verification.stats.ok > 0 && (
                              <span className="px-2 py-1 bg-success-500/10 text-success-400 rounded flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {verification.stats.ok}
                              </span>
                            )}
                            {verification.stats.ko > 0 && (
                              <span className="px-2 py-1 bg-danger-500/10 text-danger-400 rounded flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                {verification.stats.ko}
                              </span>
                            )}
                            {verification.stats.partial > 0 && (
                              <span className="px-2 py-1 bg-warning-500/10 text-warning-400 rounded flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {verification.stats.partial}
                              </span>
                            )}
                            {verification.stats.unknown > 0 && (
                              <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {verification.stats.unknown}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Badge de estado */}
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${status.color}/10 ${status.textColor}`}>
                          {verification.stats.progress}% completado
                        </span>
                        
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {verification.stats.total > 0 && (
                      <div className="mt-3 ml-14">
                        <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden flex">
                          {verification.stats.ok > 0 && (
                            <div 
                              className="h-full bg-success-500"
                              style={{ width: `${(verification.stats.ok / verification.stats.total) * 100}%` }}
                            />
                          )}
                          {verification.stats.partial > 0 && (
                            <div 
                              className="h-full bg-warning-500"
                              style={{ width: `${(verification.stats.partial / verification.stats.total) * 100}%` }}
                            />
                          )}
                          {verification.stats.ko > 0 && (
                            <div 
                              className="h-full bg-danger-500"
                              style={{ width: `${(verification.stats.ko / verification.stats.total) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Paginación */}
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