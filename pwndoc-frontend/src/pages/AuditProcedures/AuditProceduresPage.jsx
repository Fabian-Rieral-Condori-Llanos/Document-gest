import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
  Building2,
  User,
  ChevronRight,
  Filter,
  RefreshCw,
  FileCheck,
  FilePlus,
  FileQuestion,
  Briefcase,
} from 'lucide-react';

// Redux
import {
  fetchAuditProcedures,
  fetchAuditProcedureStats,
  selectAllProcedures,
  selectProceduresLoading,
  selectProcedureStats,
  selectProcedureStatsLoading,
  selectProcedureFilters,
  setFilters as setProcedureFilters,
  clearFilters as clearProcedureFilters,
  ALCANCE_TIPOS,
  ALCANCE_LABELS,
  ALCANCE_COLORS,
} from '../../features/audits';
import * as alcanceTemplatesApi from '../../api/endpoints/alcance-templates.api';

// Components
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
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

// Calcular completitud de documentación
const calculateCompleteness = (procedure) => {
  const sections = ['solicitud', 'instructivo', 'informe', 'respuesta'];
  let completed = 0;
  
  sections.forEach(section => {
    if (procedure[section]?.estado === 'APROBADO' || procedure[section]?.estado === 'COMPLETADO') {
      completed++;
    }
  });
  
  return {
    completed,
    total: sections.length,
    percentage: Math.round((completed / sections.length) * 100),
  };
};

/**
 * AuditProceduresPage - Dashboard de procedimientos de auditorías
 */
const AuditProceduresPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const procedures = useSelector(selectAllProcedures);
  const loading = useSelector(selectProceduresLoading);
  const stats = useSelector(selectProcedureStats);
  const statsLoading = useSelector(selectProcedureStatsLoading);
  const filters = useSelector(selectProcedureFilters);
  
  // Local state
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [alcanceTipos, setAlcanceTipos] = useState([]);
  const [loadingAlcances, setLoadingAlcances] = useState(false);
  const itemsPerPage = 10;

  // Cargar datos
  useEffect(() => {
    dispatch(fetchAuditProcedures());
    dispatch(fetchAuditProcedureStats());
    loadAlcanceTipos();
  }, [dispatch]);

  // Cargar tipos de alcance desde el backend

  const loadAlcanceTipos = async () => {
    try {
      setLoadingAlcances(true);
      const response = await alcanceTemplatesApi.getAlcanceTipos();
      if (response) {
        setAlcanceTipos(response);
      }
    } catch (err) {
      console.error('Error loading alcance tipos:', err);
      // Fallback a constantes si falla
      setAlcanceTipos(Object.keys(ALCANCE_LABELS || {}));
    } finally {
      setLoadingAlcances(false);
    }
  };

  // Filtrar y paginar
  const filteredProcedures = procedures.filter(p => {
    if (filters.alcance && !p.alcance?.includes(filters.alcance)) return false;
    if (filters.origen && !p.origen?.toLowerCase().includes(filters.origen.toLowerCase())) return false;
    return true;
  });

  const paginatedProcedures = filteredProcedures.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProcedures.length / itemsPerPage);

  // Handlers
  const handleFilterChange = (key, value) => {
    dispatch(setProcedureFilters({ [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    dispatch(clearProcedureFilters());
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchAuditProcedures());
    dispatch(fetchAuditProcedureStats());
  };

  // Stats cards
  const statsCards = [
    {
      label: 'Total Procedimientos',
      value: stats?.total || procedures.length,
      icon: FolderOpen,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
    },
    {
      label: 'Documentación Completa',
      value: stats?.complete || procedures.filter(p => calculateCompleteness(p).percentage === 100).length,
      icon: FileCheck,
      color: 'text-success-400',
      bgColor: 'bg-success-500/10',
    },
    {
      label: 'En Proceso',
      value: stats?.inProgress || procedures.filter(p => {
        const c = calculateCompleteness(p);
        return c.percentage > 0 && c.percentage < 100;
      }).length,
      icon: Clock,
      color: 'text-info-400',
      bgColor: 'bg-info-500/10',
    },
    {
      label: 'Sin Iniciar',
      value: stats?.notStarted || procedures.filter(p => calculateCompleteness(p).percentage === 0).length,
      icon: FileQuestion,
      color: 'text-warning-400',
      bgColor: 'bg-warning-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Procedimientos</h1>
          <p className="text-gray-400 mt-1">
            Gestión de documentación de procedimientos de auditorías
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
                Tipo de Alcance
              </label>
              <select
                value={filters.alcance || ''}
                onChange={(e) => handleFilterChange('alcance', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                disabled={loadingAlcances}
              >
                <option value="">Todos</option>
                {alcanceTipos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {ALCANCE_LABELS?.[tipo] || tipo}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Origen
              </label>
              <input
                type="text"
                value={filters.origen || ''}
                onChange={(e) => handleFilterChange('origen', e.target.value)}
                placeholder="Buscar por origen..."
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            
            <div className="flex items-end">
              <Button variant="ghost" onClick={handleClearFilters}>
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}
        
        {(filters.alcance || filters.origen) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
            <span className="text-sm text-gray-400">Filtros activos:</span>
            {filters.alcance && (
              <span className="px-2 py-1 bg-primary-500/10 text-primary-400 text-xs rounded-full">
                {ALCANCE_LABELS?.[filters.alcance] || filters.alcance}
              </span>
            )}
            {filters.origen && (
              <span className="px-2 py-1 bg-accent-500/10 text-accent-400 text-xs rounded-full">
                Origen: {filters.origen}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Procedures List */}
      <Card>
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-medium text-white">
            Procedimientos ({filteredProcedures.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-500/10 mb-3">
              <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-400">Cargando procedimientos...</p>
          </div>
        ) : filteredProcedures.length === 0 ? (
          <div className="py-12 text-center">
            <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">Sin procedimientos</h3>
            <p className="text-gray-400">
              Los procedimientos se crean al asignar una plantilla a una auditoría
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-800">
              {paginatedProcedures.map((procedure) => {
                const completeness = calculateCompleteness(procedure);
                const audit = procedure.auditId;
                
                return (
                  <div
                    key={procedure._id}
                    className="p-4 hover:bg-bg-tertiary transition-colors cursor-pointer"
                    onClick={() => audit?._id && navigate(`/audits/${audit._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Icon based on completeness */}
                        <div className={`p-2 rounded-lg ${
                          completeness.percentage === 100 
                            ? 'bg-success-500/10' 
                            : completeness.percentage > 0 
                              ? 'bg-info-500/10' 
                              : 'bg-gray-500/10'
                        }`}>
                          {completeness.percentage === 100 ? (
                            <FileCheck className="w-5 h-5 text-success-400" />
                          ) : completeness.percentage > 0 ? (
                            <FilePlus className="w-5 h-5 text-info-400" />
                          ) : (
                            <FileQuestion className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Info */}
                        <div>
                          <h4 className="text-white font-medium">
                            {audit?.name || 'Auditoría sin nombre'}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            {procedure.origen && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5" />
                                {procedure.origen}
                              </span>
                            )}
                            {procedure.alcance?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                {procedure.alcance.length} tipo(s)
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(procedure.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Document Status Icons */}
                        <div className="flex items-center gap-1">
                          <DocumentStatusIcon 
                            status={procedure.solicitud?.estado} 
                            label="Solicitud" 
                          />
                          <DocumentStatusIcon 
                            status={procedure.instructivo?.estado} 
                            label="Instructivo" 
                          />
                          <DocumentStatusIcon 
                            status={procedure.informe?.estado} 
                            label="Informe" 
                          />
                          <DocumentStatusIcon 
                            status={procedure.respuesta?.estado} 
                            label="Respuesta" 
                          />
                        </div>
                        
                        {/* Completeness Badge */}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          completeness.percentage === 100 
                            ? 'bg-success-500/10 text-success-400' 
                            : completeness.percentage > 0 
                              ? 'bg-info-500/10 text-info-400' 
                              : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {completeness.percentage}%
                        </span>
                        
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3 ml-14">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              completeness.percentage === 100 
                                ? 'bg-success-500' 
                                : 'bg-info-500'
                            }`}
                            style={{ width: `${completeness.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {completeness.completed}/{completeness.total} documentos
                        </span>
                      </div>
                    </div>
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

/**
 * DocumentStatusIcon - Icono de estado de documento
 */
const DocumentStatusIcon = ({ status, label }) => {
  let color = 'text-gray-600';
  let bgColor = 'bg-gray-500/10';
  
  if (status === 'APROBADO' || status === 'COMPLETADO') {
    color = 'text-success-400';
    bgColor = 'bg-success-500/10';
  } else if (status === 'EN_REVISION' || status === 'PENDIENTE') {
    color = 'text-warning-400';
    bgColor = 'bg-warning-500/10';
  } else if (status === 'BORRADOR') {
    color = 'text-info-400';
    bgColor = 'bg-info-500/10';
  }
  
  return (
    <div 
      className={`w-6 h-6 rounded flex items-center justify-center ${bgColor}`}
      title={`${label}: ${status || 'Sin iniciar'}`}
    >
      <FileText className={`w-3.5 h-3.5 ${color}`} />
    </div>
  );
};

export default AuditProceduresPage;