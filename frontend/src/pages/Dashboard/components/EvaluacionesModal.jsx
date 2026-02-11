import { useState, useEffect, useMemo } from 'react';
import { 
  X, FileText, Loader2, ChevronLeft, ChevronRight, 
  Search, Filter, Calendar, ExternalLink, BarChart3, Building2
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
    'EDIT': 'bg-blue-500/15 text-blue-400',
    'REVIEW': 'bg-purple-500/15 text-purple-400',
    'APPROVED': 'bg-emerald-500/15 text-emerald-400',
    'COMPLETADO': 'bg-emerald-500/15 text-emerald-400',
    'PENDIENTE': 'bg-amber-500/15 text-amber-400',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${estilos[estado] || 'bg-gray-500/15 text-gray-400'}`}>
      {estado}
    </span>
  );
};

/**
 * Badge de Tipo de Procedimiento
 */
const TipoBadge = ({ tipo }) => {
  const tipos = {
    'PR01': { label: 'Solicitud EP', class: 'bg-indigo-500/20 text-indigo-300' },
    'PR02': { label: 'Interna', class: 'bg-cyan-500/20 text-cyan-300' },
    'PR03': { label: 'Externa', class: 'bg-emerald-500/20 text-emerald-300' },
    'PR09': { label: 'Sol. AGETIC', class: 'bg-amber-500/20 text-amber-300' },
    'VERIF': { label: 'Verificación', class: 'bg-purple-500/20 text-purple-300' },
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
 * EvaluacionesModal - Modal con lista paginada de evaluaciones recientes
 */
const EvaluacionesModal = ({ 
  isOpen, 
  onClose, 
  evaluaciones = [], 
  loading = false,
  year,
  onViewCompany,
  onViewAudit  // Nueva prop para abrir el dashboard de auditoría
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado, filterTipo]);

  // Obtener estados únicos para el filtro
  const estadosUnicos = useMemo(() => {
    const estados = [...new Set(evaluaciones.map(e => e.estado).filter(Boolean))];
    return estados.sort();
  }, [evaluaciones]);

  // Obtener tipos únicos para el filtro
  const tiposUnicos = useMemo(() => {
    const tipos = [...new Set(evaluaciones.map(e => e.tipoAudit?.split(' - ')[0]).filter(Boolean))];
    return tipos.sort();
  }, [evaluaciones]);

  // Filtrar evaluaciones
  const filteredEvaluaciones = useMemo(() => {
    return evaluaciones.filter(eval_ => {
      const matchSearch = !searchTerm || 
        eval_.entidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eval_.tipoAudit?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchEstado = !filterEstado || eval_.estado === filterEstado;
      const matchTipo = !filterTipo || eval_.tipoAudit?.startsWith(filterTipo);
      
      return matchSearch && matchEstado && matchTipo;
    });
  }, [evaluaciones, searchTerm, filterEstado, filterTipo]);

  // Paginación
  const totalPages = Math.ceil(filteredEvaluaciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvaluaciones = filteredEvaluaciones.slice(startIndex, startIndex + itemsPerPage);

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
    setFilterTipo('');
  };

  const hasActiveFilters = searchTerm || filterEstado || filterTipo;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-bg-secondary border border-gray-700 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-500/10">
              <FileText size={24} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Evaluaciones Recientes</h2>
              <p className="text-sm text-gray-400">
                Gestión {year} • {filteredEvaluaciones.length} de {evaluaciones.length} evaluaciones
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

        {/* Filters */}
        <div className="p-4 border-b border-gray-700 bg-bg-tertiary/50">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por entidad o tipo..."
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

            {/* Filter Tipo */}
            <div className="relative">
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value="">Todos los tipos</option>
                {tiposUnicos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

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
        <div className="overflow-auto max-h-[calc(90vh-280px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-primary-400" />
            </div>
          ) : paginatedEvaluaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400">
                {hasActiveFilters ? 'No se encontraron evaluaciones con los filtros aplicados' : 'No hay evaluaciones disponibles'}
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
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                    Entidad
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                    Tipo
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                    Alcance
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                    Estado
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                    Fecha
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvaluaciones.map((item, index) => (
                  <tr 
                    key={item.id || index} 
                    className="hover:bg-bg-tertiary/50 transition-colors border-b border-gray-800/50 last:border-0"
                  >
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-white font-medium">{item.entidad}</div>
                      {item.auditName && (
                        <div className="text-xs text-gray-500 mt-0.5">{item.auditName}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <TipoBadge tipo={item.tipoAudit} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {item.procedimiento?.alcance?.slice(0, 2).map((alc, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300"
                          >
                            {alc}
                          </span>
                        ))}
                        {item.procedimiento?.alcance?.length > 2 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">
                            +{item.procedimiento.alcance.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <EstadoBadge estado={item.estado} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar size={12} />
                        {item.fechaInicio}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {/* Botón para ver dashboard de auditoría */}
                        {item.id && onViewAudit && (
                          <button
                            onClick={() => onViewAudit(item.id)}
                            className="p-1.5 rounded hover:bg-primary-500/10 text-gray-400 hover:text-primary-400 transition-colors"
                            title="Ver dashboard de auditoría"
                          >
                            <BarChart3 size={14} />
                          </button>
                        )}
                        {/* Botón para ver estadísticas de empresa */}
                        {item.companyId && onViewCompany && (
                          <button
                            onClick={() => onViewCompany(item.companyId, item.entidad)}
                            className="p-1.5 rounded hover:bg-bg-tertiary text-gray-400 hover:text-cyan-400 transition-colors"
                            title="Ver estadísticas de empresa"
                          >
                            <Building2 size={14} />
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
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredEvaluaciones.length)} de {filteredEvaluaciones.length}
            </div>
            
            <div className="flex items-center gap-1">
              {/* First page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Primera página"
              >
                <ChevronLeft size={16} className="stroke-[3]" />
                <ChevronLeft size={16} className="stroke-[3] -ml-3" />
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

export default EvaluacionesModal;