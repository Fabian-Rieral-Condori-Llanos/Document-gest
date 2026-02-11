/**
 * EvaluacionesRecientesTable.jsx
 * 
 * Tabla de evaluaciones recientes con acceso a detalles.
 */

import { ChevronRight, Loader2 } from 'lucide-react';
import { EstadoBadge, TipoBadge } from './UIComponents';

const EvaluacionesRecientesTable = ({ 
  evaluaciones = [], 
  loading = false, 
  maxItems = 5,
  onViewAll,
  onViewAudit 
}) => {
  const displayItems = evaluaciones.slice(0, maxItems);
  const hasMore = evaluaciones.length > maxItems;

  return (
    <div className="bg-bg-secondary rounded-xl border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-800">
        <h3 className="text-base font-semibold text-white">Evaluaciones Recientes</h3>
        {onViewAll && (
          <button 
            onClick={onViewAll} 
            className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1"
          >
            Ver todas ({evaluaciones.length})
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-gray-500" />
          </div>
        ) : evaluaciones.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-500">
            No hay evaluaciones recientes
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                  Entidad
                </th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                  Tipo
                </th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                  Estado
                </th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item, index) => (
                <tr 
                  key={item.id || index} 
                  className="hover:bg-bg-tertiary/50 transition-colors cursor-pointer" 
                  onClick={() => onViewAudit?.(item.id)}
                  title="Click para ver dashboard de auditoría"
                >
                  <td className="px-5 py-3 text-sm text-white font-medium">
                    {item.entidad}
                  </td>
                  <td className="px-5 py-3">
                    <TipoBadge tipo={item.tipoAudit} />
                  </td>
                  <td className="px-5 py-3">
                    <EstadoBadge estado={item.estado} />
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 font-mono">
                    {item.fechaInicio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer - Show more link */}
      {hasMore && (
        <div className="p-3 border-t border-gray-800 text-center">
          <button 
            onClick={onViewAll}
            className="text-sm text-primary-400 hover:text-primary-300 font-medium"
          >
            Ver {evaluaciones.length - maxItems} evaluaciones más →
          </button>
        </div>
      )}
    </div>
  );
};

export default EvaluacionesRecientesTable;
