import { useState, useEffect, useMemo } from 'react';
import { 
  X, Building2, Loader2, ChevronLeft, ChevronRight, 
  Search, Filter, ExternalLink, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Minus,
  ChevronsRight,
  ChevronsLeft
} from 'lucide-react';

/**
 * Badge de Estado
 */
const EstadoBadge = ({ estado }) => {
  const estilos = {
    'EVALUANDO': 'bg-blue-500/15 text-blue-400',
    'VERIFICACION': 'bg-amber-500/15 text-amber-400',
    'FINALIZADAS': 'bg-emerald-500/15 text-emerald-400',
    'OBSERVACION': 'bg-red-500/15 text-red-400',
    'ACTIVO': 'bg-emerald-500/15 text-emerald-400',
    'INACTIVO': 'bg-gray-500/15 text-gray-400',
    'PENDIENTE': 'bg-amber-500/15 text-amber-400',
    'CRÍTICO': 'bg-red-500/15 text-red-400',
    "APPROVED": 'bg-emerald-500/15 text-emerald-400',
    "EDIT": 'bg-yellow-500/15 text-yellow-400',
    "REVIEW": 'bg-purple-500/15 text-purple-400'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${estilos[estado] || 'bg-gray-500/15 text-gray-400'}`}>
      {estado}
    </span>
  );
};

/**
 * Contador de vulnerabilidades
 */
const VulnCount = ({ count, type }) => {
  const styles = {
    critical: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-blue-500/20 text-blue-400',
    safe: 'bg-emerald-500/10 text-emerald-400',
  };
  
  return (
    <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded text-xs font-semibold font-mono ${styles[type]}`}>
      {count}
    </span>
  );
};

/**
 * Barra de progreso
 */
const ProgressBar = ({ value, showLabel = true }) => {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${color}`} 
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }} 
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-400 font-mono w-10 text-right">{value}%</span>
      )}
    </div>
  );
};

/**
 * Indicador de tendencia
 */
const TrendIndicator = ({ value }) => {
  if (value > 0) {
    return (
      <span className="flex items-center gap-0.5 text-emerald-400 text-xs">
        <TrendingUp size={12} />
        +{value}%
      </span>
    );
  } else if (value < 0) {
    return (
      <span className="flex items-center gap-0.5 text-red-400 text-xs">
        <TrendingDown size={12} />
        {value}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-gray-500 text-xs">
      <Minus size={12} />
      0%
    </span>
  );
};

/**
 * EntidadesModal - Modal con lista paginada de entidades evaluadas
 */
const EntidadesModal = ({ 
  isOpen, 
  onClose, 
  entidades = [], 
  loading = false,
  year,
  totalEntidades = 0,
  onViewCompany
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [sortBy, setSortBy] = useState('evaluaciones');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado, sortBy, sortOrder]);

  // Obtener estados únicos para el filtro
  const estadosUnicos = useMemo(() => {
    const estados = [...new Set(entidades.map(e => e.estado).filter(Boolean))];
    return estados.sort();
  }, [entidades]);

  // Filtrar y ordenar entidades
  const filteredEntidades = useMemo(() => {
    let result = entidades.filter(entidad => {
      const matchSearch = !searchTerm || 
        entidad.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchEstado = !filterEstado || entidad.estado === filterEstado;
      
      return matchSearch && matchEstado;
    });

    // Ordenar
    result.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'nombre':
          aVal = a.nombre || '';
          bVal = b.nombre || '';
          return sortOrder === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        case 'evaluaciones':
          aVal = a.evaluaciones || 0;
          bVal = b.evaluaciones || 0;
          break;
        case 'vulnCriticas':
          aVal = a.vulnCriticas || 0;
          bVal = b.vulnCriticas || 0;
          break;
        case 'vulnAltas':
          aVal = a.vulnAltas || 0;
          bVal = b.vulnAltas || 0;
          break;
        case 'remediacion':
          aVal = a.tasaRemediacion || 0;
          bVal = b.tasaRemediacion || 0;
          break;
        default:
          aVal = a.evaluaciones || 0;
          bVal = b.evaluaciones || 0;
      }

      if (typeof aVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [entidades, searchTerm, filterEstado, sortBy, sortOrder]);

  // Estadísticas resumen
  const stats = useMemo(() => {
    const totalEvals = filteredEntidades.reduce((sum, e) => sum + (e.evaluaciones || 0), 0);
    const totalCriticas = filteredEntidades.reduce((sum, e) => sum + (e.vulnCriticas || 0), 0);
    const totalAltas = filteredEntidades.reduce((sum, e) => sum + (e.vulnAltas || 0), 0);
    const avgRemediacion = filteredEntidades.length > 0
      ? Math.round(filteredEntidades.reduce((sum, e) => sum + (e.tasaRemediacion || 0), 0) / filteredEntidades.length)
      : 0;
    
    return { totalEvals, totalCriticas, totalAltas, avgRemediacion };
  }, [filteredEntidades]);

  // Paginación
  const totalPages = Math.ceil(filteredEntidades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntidades = filteredEntidades.slice(startIndex, startIndex + itemsPerPage);

  // Generar rango de páginas visibles
  const getPageRange = () => {
    const range = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    setSortBy('evaluaciones');
    setSortOrder('desc');
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const hasActiveFilters = searchTerm || filterEstado;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-bg-secondary border border-gray-700 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10">
              <Building2 size={24} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Estado de Seguridad por Entidad</h2>
              <p className="text-sm text-gray-400">
                Gestión {year} • {filteredEntidades.length} de {totalEntidades} entidades
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
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 bg-bg-tertiary/30">
          <div className="text-center p-3 bg-bg-secondary rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-white">{stats.totalEvals}</div>
            <div className="text-xs text-gray-400">Total Evaluaciones</div>
          </div>
          <div className="text-center p-3 bg-bg-secondary rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-red-400">{stats.totalCriticas}</div>
            <div className="text-xs text-gray-400">Vuln. Críticas</div>
          </div>
          <div className="text-center p-3 bg-bg-secondary rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-orange-400">{stats.totalAltas}</div>
            <div className="text-xs text-gray-400">Vuln. Altas</div>
          </div>
          <div className="text-center p-3 bg-bg-secondary rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-emerald-400">{stats.avgRemediacion}%</div>
            <div className="text-xs text-gray-400">Prom. Remediación</div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-700 bg-bg-tertiary/50">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por nombre de entidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Filter Estado */}
            <div className="relative">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value="">Todos los estados</option>
                {estadosUnicos.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Sort by */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value="evaluaciones">Ordenar por Evaluaciones</option>
                <option value="nombre">Ordenar por Nombre</option>
                <option value="vulnCriticas">Ordenar por Críticas</option>
                <option value="vulnAltas">Ordenar por Altas</option>
                <option value="remediacion">Ordenar por Remediación</option>
              </select>
            </div>

            {/* Sort order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-600 transition-colors"
            >
              {sortOrder === 'asc' ? '↑ Ascendente' : '↓ Descendente'}
            </button>

            {/* Items per page */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none px-3 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-380px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-primary-400" />
            </div>
          ) : paginatedEntidades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Building2 size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400">
                {hasActiveFilters ? 'No se encontraron entidades con los filtros aplicados' : 'No hay entidades evaluadas'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 text-sm text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-bg-secondary z-10">
                <tr>
                  <th 
                    className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800 cursor-pointer hover:text-gray-300"
                    onClick={() => toggleSort('nombre')}
                  >
                    <div className="flex items-center gap-1">
                      Entidad
                      {sortBy === 'nombre' && (
                        <span className="text-primary-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800 cursor-pointer hover:text-gray-300"
                    onClick={() => toggleSort('evaluaciones')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Evals
                      {sortBy === 'evaluaciones' && (
                        <span className="text-primary-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800 cursor-pointer hover:text-gray-300"
                    onClick={() => toggleSort('vulnCriticas')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Críticas
                      {sortBy === 'vulnCriticas' && (
                        <span className="text-primary-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800 cursor-pointer hover:text-gray-300"
                    onClick={() => toggleSort('vulnAltas')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Altas
                      {sortBy === 'vulnAltas' && (
                        <span className="text-primary-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                    Medias
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                    Bajas
                  </th>
                  <th 
                    className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800 cursor-pointer hover:text-gray-300"
                    onClick={() => toggleSort('remediacion')}
                  >
                    <div className="flex items-center gap-1">
                      Remediación
                      {sortBy === 'remediacion' && (
                        <span className="text-primary-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                    Estado
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntidades.map((entidad, index) => (
                  <tr 
                    key={entidad.id || entidad.idEntidad || index} 
                    className="hover:bg-bg-tertiary/50 transition-colors border-b border-gray-800/50 last:border-0"
                  >
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-white font-medium">{entidad.nombre}</div>
                      {entidad.sector && (
                        <div className="text-xs text-gray-500 mt-0.5">{entidad.sector}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-sm font-semibold text-white">{entidad.evaluaciones || 0}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <VulnCount 
                        count={entidad.vulnCriticas || 0} 
                        type={entidad.vulnCriticas > 0 ? 'critical' : 'safe'} 
                      />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <VulnCount 
                        count={entidad.vulnAltas || 0} 
                        type={entidad.vulnAltas > 5 ? 'high' : entidad.vulnAltas > 0 ? 'medium' : 'safe'} 
                      />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <VulnCount 
                        count={entidad.vulnMedias || 0} 
                        type="medium" 
                      />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <VulnCount 
                        count={entidad.vulnBajas || 0} 
                        type="low" 
                      />
                    </td>
                    <td className="px-5 py-3.5 w-40">
                      <ProgressBar value={entidad.tasaRemediacion || 0} />
                    </td>
                    <td className="px-5 py-3.5">
                      <EstadoBadge estado={entidad.estado} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center">
                        {(entidad.idEntidad || entidad.id) && onViewCompany && (
                          <button
                            onClick={() => onViewCompany(entidad.idEntidad || entidad.id, entidad.nombre)}
                            className="p-1.5 rounded hover:bg-bg-tertiary text-gray-400 hover:text-primary-400 transition-colors"
                            title="Ver estadísticas detalladas"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </div>
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
              {/* First page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Primera página"
              >
                <ChevronsLeft size={16} className="stroke-[3] -ml-3" />
              </button>
              
              {/* Previous */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
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

              {/* Next */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>

              {/* Last page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Última página"
              >
                <ChevronsRight size={16} className="stroke-[3] -ml-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntidadesModal;