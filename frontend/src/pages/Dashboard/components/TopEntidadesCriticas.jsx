import { useState, useEffect, useMemo } from 'react';
import { 
  X, Building2, Loader2, ChevronLeft, ChevronRight, 
  Search, Filter, ExternalLink, AlertTriangle, Shield,
  TrendingUp, TrendingDown, AlertOctagon, CheckCircle,
  XCircle, Clock, ChevronDown
} from 'lucide-react';
import analyticsApi from '../../../api/endpoints/analytics.api';

/**
 * Badge de Nivel de Riesgo
 */
const RiesgoBadge = ({ riesgo }) => {
  if (!riesgo) return null;
  
  const styles = {
    'CRÍTICO': 'bg-red-500/20 text-red-400 border-red-500/30',
    'ALTO': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'MEDIO': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'BAJO': 'bg-lime-500/20 text-lime-400 border-lime-500/30',
    'MÍNIMO': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${styles[riesgo.nivel] || 'bg-gray-500/20 text-gray-400'}`}>
      {riesgo.nivel === 'CRÍTICO' && <AlertOctagon size={10} />}
      {riesgo.nivel}
    </span>
  );
};

/**
 * Contador de vulnerabilidades con estilo
 */
const VulnCounter = ({ count, type, label, showZero = false }) => {
  if (count === 0 && !showZero) return <span className="text-gray-600">-</span>;
  
  const styles = {
    critical: 'bg-red-500/20 text-red-400',
    criticalActive: 'bg-red-600/30 text-red-300 ring-1 ring-red-500/50',
    high: 'bg-orange-500/20 text-orange-400',
    highActive: 'bg-orange-600/30 text-orange-300 ring-1 ring-orange-500/50',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-lime-500/20 text-lime-400',
    info: 'bg-cyan-500/20 text-cyan-400',
    remediated: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-gray-500/20 text-gray-400',
  };
  
  return (
    <div className="flex flex-col items-center">
      <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded text-xs font-bold font-mono ${styles[type]}`}>
        {count}
      </span>
      {label && <span className="text-[9px] text-gray-500 mt-0.5">{label}</span>}
    </div>
  );
};

/**
 * Barra de progreso de remediación
 */
const RemediacionBar = ({ tasa, size = 'normal' }) => {
  const color = tasa >= 80 ? 'bg-emerald-500' : tasa >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const height = size === 'small' ? 'h-1' : 'h-1.5';
  
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} bg-gray-700 rounded-full overflow-hidden`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${color}`} 
          style={{ width: `${Math.min(100, Math.max(0, tasa))}%` }} 
        />
      </div>
      <span className={`text-xs font-mono ${tasa >= 80 ? 'text-emerald-400' : tasa >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
        {tasa}%
      </span>
    </div>
  );
};

/**
 * Card de resumen de estadísticas
 */
const ResumenCard = ({ icon: Icon, label, value, subvalue, color = 'gray' }) => {
  const colorClasses = {
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
  };
  
  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} />
        <span className="text-[10px] uppercase tracking-wide opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      {subvalue && <div className="text-[10px] text-gray-500">{subvalue}</div>}
    </div>
  );
};

/**
 * TopEntidadesCriticasCard - Componente para mostrar en el dashboard
 */
export const TopEntidadesCriticasCard = ({ 
  year,
  loading: externalLoading,
  onViewDetails,
  onViewCompany,
  limit = 5
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getTopEntidadesCriticas({ year, limit });
      setData(response.data);
    } catch (err) {
      console.error('Error loading top entidades críticas:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || externalLoading;
  const entidades = data?.entidades || [];
  const resumen = data?.resumen || {};

  return (
    <div className="bg-bg-secondary rounded-xl border border-gray-800">
      <div className="flex items-center justify-between p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <AlertOctagon size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Entidades con Riesgo Crítico</h3>
            <p className="text-xs text-gray-500">
              {resumen.totalCriticasActivas || 0} vulnerabilidades críticas activas
            </p>
          </div>
        </div>
        <button 
          onClick={onViewDetails}
          className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1"
        >
          Ver ranking completo
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="h-48 flex flex-col items-center justify-center text-gray-500">
            <AlertTriangle size={32} className="mb-2 text-red-400" />
            <span className="text-sm">{error}</span>
            <button onClick={loadData} className="mt-2 text-xs text-primary-400 hover:text-primary-300">
              Reintentar
            </button>
          </div>
        ) : entidades.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-gray-500">
            <Shield size={32} className="mb-2 text-emerald-400" />
            <span className="text-sm">Sin vulnerabilidades críticas activas</span>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-bg-tertiary/50">
              <tr>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">
                  Entidad
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2">
                  Riesgo
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2">
                  <span className="text-red-400">Críticas</span>
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2">
                  <span className="text-orange-400">Altas</span>
                </th>
                <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 w-24">
                  Remediación
                </th>
              </tr>
            </thead>
            <tbody>
              {entidades.map((entidad, index) => (
                <tr 
                  key={entidad.companyId || index}
                  className="hover:bg-bg-tertiary/50 transition-colors cursor-pointer border-b border-gray-800/50 last:border-0"
                  onClick={() => onViewCompany?.(entidad.companyId, entidad.nombre)}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono w-4">{index + 1}</span>
                      <div>
                        <div className="text-sm text-white font-medium truncate max-w-[180px]" title={entidad.nombre}>
                          {entidad.nombre}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {entidad.totalAuditorias} auditorías
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <RiesgoBadge riesgo={entidad.riesgo} />
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <VulnCounter count={entidad.criticasActivas} type="criticalActive" />
                      <span className="text-gray-600 text-[10px]">/</span>
                      <span className="text-[10px] text-gray-500">{entidad.criticas}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <VulnCounter count={entidad.altasActivas} type="highActive" />
                      <span className="text-gray-600 text-[10px]">/</span>
                      <span className="text-[10px] text-gray-500">{entidad.altas}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 w-24">
                    <RemediacionBar tasa={entidad.tasaRemediacionCriticas} size="small" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {entidades.length > 0 && (
        <div className="p-3 border-t border-gray-800 bg-bg-tertiary/30">
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span>
              Tasa remediación críticas global: 
              <span className={`ml-1 font-semibold ${resumen.tasaRemediacionCriticas >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                {resumen.tasaRemediacionCriticas || 0}%
              </span>
            </span>
            <span>
              Total: {resumen.totalCriticas || 0} críticas, {resumen.totalAltas || 0} altas
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * TopEntidadesCriticasModal - Modal completo con ranking y filtros
 */
const TopEntidadesCriticasModal = ({ 
  isOpen, 
  onClose, 
  year,
  onViewCompany 
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRiesgo, setFilterRiesgo] = useState('');
  const [sortBy, setSortBy] = useState('criticasActivas');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, year]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRiesgo, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getTopEntidadesCriticas({ year, limit: 100 });
      setData(response.data);
    } catch (err) {
      console.error('Error loading top entidades críticas:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar
  const filteredEntidades = useMemo(() => {
    let result = data?.entidades || [];
    
    // Filtro de búsqueda
    if (searchTerm) {
      result = result.filter(e => 
        e.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro de riesgo
    if (filterRiesgo) {
      result = result.filter(e => e.riesgo?.nivel === filterRiesgo);
    }
    
    // Ordenar
    result.sort((a, b) => {
      let aVal = a[sortBy] || 0;
      let bVal = b[sortBy] || 0;
      
      if (sortBy === 'nombre') {
        aVal = a.nombre || '';
        bVal = b.nombre || '';
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return result;
  }, [data, searchTerm, filterRiesgo, sortBy, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(filteredEntidades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntidades = filteredEntidades.slice(startIndex, startIndex + itemsPerPage);

  const getPageRange = () => {
    const range = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  };

  const resumen = data?.resumen || {};
  const nivelesRiesgo = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO', 'MÍNIMO'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-bg-secondary border border-gray-700 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertOctagon size={24} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ranking de Entidades con Riesgo</h2>
              <p className="text-sm text-gray-400">
                Gestión {year} • {filteredEntidades.length} entidades con vulnerabilidades
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-bg-tertiary text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 border-b border-gray-700 bg-bg-tertiary/30">
          <ResumenCard 
            icon={AlertOctagon} 
            label="Críticas Activas" 
            value={resumen.totalCriticasActivas || 0}
            subvalue={`de ${resumen.totalCriticas || 0} totales`}
            color="red"
          />
          <ResumenCard 
            icon={AlertTriangle} 
            label="Altas Activas" 
            value={resumen.totalAltasActivas || 0}
            subvalue={`de ${resumen.totalAltas || 0} totales`}
            color="orange"
          />
          <ResumenCard 
            icon={CheckCircle} 
            label="Críticas Remediadas" 
            value={resumen.totalCriticasRemediadas || 0}
            subvalue={`${resumen.tasaRemediacionCriticas || 0}% tasa`}
            color="emerald"
          />
          <ResumenCard 
            icon={Shield} 
            label="Total Vulnerabilidades" 
            value={resumen.totalVulnerabilidades || 0}
            subvalue={`${resumen.totalRemediadas || 0} remediadas`}
            color="gray"
          />
          <ResumenCard 
            icon={Building2} 
            label="Entidades" 
            value={resumen.totalEmpresas || 0}
            subvalue="con vulnerabilidades"
            color="primary"
          />
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-700 bg-bg-tertiary/50">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar entidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Filter Riesgo */}
            <div className="relative">
              <select
                value={filterRiesgo}
                onChange={(e) => setFilterRiesgo(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value="">Todos los niveles</option>
                {nivelesRiesgo.map(nivel => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Sort by */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value="criticasActivas">Ordenar por Críticas Activas</option>
                <option value="altasActivas">Ordenar por Altas Activas</option>
                <option value="criticas">Ordenar por Total Críticas</option>
                <option value="tasaRemediacionCriticas">Ordenar por Tasa Remediación</option>
                <option value="totalVulnerabilidades">Ordenar por Total Vulns</option>
                <option value="nombre">Ordenar por Nombre</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Sort order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-600 transition-colors"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>

            {/* Items per page */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none px-3 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 por página</option>
              <option value={15}>15 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-400px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-primary-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertTriangle size={48} className="text-red-400 mb-4" />
              <p className="text-red-300">{error}</p>
              <button onClick={loadData} className="mt-4 text-primary-400 hover:text-primary-300">
                Reintentar
              </button>
            </div>
          ) : paginatedEntidades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Shield size={48} className="text-emerald-400 mb-4" />
              <p className="text-gray-400">No se encontraron entidades con los filtros aplicados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-bg-secondary z-10">
                <tr>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 border-b border-gray-800">
                    #
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 border-b border-gray-800">
                    Entidad
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 border-b border-gray-800">
                    Riesgo
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 border-b border-gray-800">
                    <span className="text-red-400">Críticas</span>
                    <div className="text-[9px] text-gray-600 font-normal">activas / total</div>
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 border-b border-gray-800">
                    <span className="text-orange-400">Altas</span>
                    <div className="text-[9px] text-gray-600 font-normal">activas / total</div>
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 border-b border-gray-800">
                    Medias
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 border-b border-gray-800">
                    Bajas
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 border-b border-gray-800">
                    Verificación
                    <div className="text-[9px] text-gray-600 font-normal flex justify-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      <span className="text-red-500">✗</span>
                      <span className="text-amber-500">◐</span>
                      <span className="text-gray-500">?</span>
                    </div>
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 border-b border-gray-800 w-28">
                    Remediación
                  </th>
                  <th className="px-3 py-3 border-b border-gray-800"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntidades.map((entidad, index) => (
                  <tr 
                    key={entidad.companyId || index}
                    className="hover:bg-bg-tertiary/50 transition-colors border-b border-gray-800/50 last:border-0"
                  >
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white font-medium">{entidad.nombre}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-2">
                        <span>{entidad.totalAuditorias} auditorías</span>
                        <span className="text-gray-700">•</span>
                        <span>{entidad.totalVulnerabilidades} vulns</span>
                        {entidad.ultimaAuditoria && (
                          <>
                            <span className="text-gray-700">•</span>
                            <span>Última: {entidad.ultimaAuditoria}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <RiesgoBadge riesgo={entidad.riesgo} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <VulnCounter count={entidad.criticasActivas} type="criticalActive" />
                        <span className="text-gray-600 text-xs">/</span>
                        <span className="text-xs text-gray-500">{entidad.criticas}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <VulnCounter count={entidad.altasActivas} type="highActive" />
                        <span className="text-gray-600 text-xs">/</span>
                        <span className="text-xs text-gray-500">{entidad.altas}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <VulnCounter count={entidad.medias} type="medium" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <VulnCounter count={entidad.bajas} type="low" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                        <span className="text-emerald-400" title="Remediadas">{entidad.remediadas}</span>
                        <span className="text-red-400" title="No Remediadas">{entidad.noRemediadas}</span>
                        <span className="text-amber-400" title="Parciales">{entidad.parciales}</span>
                        <span className="text-gray-500" title="Sin Verificar">{entidad.sinVerificar}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 w-28">
                      <RemediacionBar tasa={entidad.tasaRemediacionGeneral} size="small" />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => onViewCompany?.(entidad.companyId, entidad.nombre)}
                        className="p-1.5 rounded hover:bg-bg-tertiary text-gray-400 hover:text-primary-400 transition-colors"
                        title="Ver detalles"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-bg-tertiary/50">
            <div className="text-sm text-gray-400">
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredEntidades.length)} de {filteredEntidades.length}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} className="stroke-[3]" />
                <ChevronLeft size={16} className="stroke-[3] -ml-3" />
              </button>
              
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>

              {getPageRange().map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-bg-secondary'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} className="stroke-[3]" />
                <ChevronRight size={16} className="stroke-[3] -ml-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopEntidadesCriticasModal;