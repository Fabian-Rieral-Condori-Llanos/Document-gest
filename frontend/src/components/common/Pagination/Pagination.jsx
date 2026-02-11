import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination Component
 * Componente reutilizable para paginación
 * 
 * @param {number} currentPage - Página actual (1-indexed)
 * @param {number} totalItems - Total de items
 * @param {number} pageSize - Items por página
 * @param {function} onPageChange - Callback al cambiar página
 * @param {function} onPageSizeChange - Callback al cambiar tamaño de página
 * @param {array} pageSizeOptions - Opciones de items por página
 */
const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generar rango de páginas a mostrar
  const getPageRange = () => {
    const range = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Ajustar si estamos cerca del final
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  };

  const pageRange = getPageRange();

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-700">
      {/* Info y selector de tamaño */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
          Mostrando {startItem}-{endItem} de {totalItems}
        </span>
        
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles de navegación */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Primera página */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Primera página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Página anterior */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Indicador de páginas anteriores */}
          {pageRange[0] > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="w-8 h-8 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-bg-tertiary transition-colors"
              >
                1
              </button>
              {pageRange[0] > 2 && (
                <span className="px-1 text-gray-500">...</span>
              )}
            </>
          )}

          {/* Números de página */}
          {pageRange.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                page === currentPage
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-bg-tertiary'
              }`}
            >
              {page}
            </button>
          ))}

          {/* Indicador de páginas posteriores */}
          {pageRange[pageRange.length - 1] < totalPages && (
            <>
              {pageRange[pageRange.length - 1] < totalPages - 1 && (
                <span className="px-1 text-gray-500">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-bg-tertiary transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Página siguiente */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Última página */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;