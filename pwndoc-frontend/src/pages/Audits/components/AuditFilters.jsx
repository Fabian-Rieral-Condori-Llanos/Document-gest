import { memo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { AUDIT_STATES, AUDIT_TYPES, AUDIT_STATE_LABELS, AUDIT_TYPE_LABELS } from '../../../features/audits';

/**
 * AuditFilters - Componente de filtros para la lista de auditorías
 */
const AuditFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  companies = [],
  languages = [],
  showCompanyFilter = true,
  showLanguageFilter = true,
  className = '',
}) => {
  const hasActiveFilters = Object.values(filters).some(v => v && v !== '');

  const handleChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o tipo de auditoría..."
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
        />
      </div>

      {/* Filtros adicionales */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        {/* Estado */}
        <select
          value={filters.state || ''}
          onChange={(e) => handleChange('state', e.target.value)}
          className="px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
        >
          <option value="">Todos los estados</option>
          {Object.entries(AUDIT_STATES).map(([key, value]) => (
            <option key={key} value={value}>
              {AUDIT_STATE_LABELS[key]}
            </option>
          ))}
        </select>

        {/* Tipo */}
        <select
          value={filters.type || ''}
          onChange={(e) => handleChange('type', e.target.value)}
          className="px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(AUDIT_TYPES).map(([key, value]) => (
            <option key={key} value={value}>
              {AUDIT_TYPE_LABELS[value]}
            </option>
          ))}
        </select>

        {/* Empresa */}
        {showCompanyFilter && companies.length > 0 && (
          <select
            value={filters.company || ''}
            onChange={(e) => handleChange('company', e.target.value)}
            className="px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">Todas las empresas</option>
            {companies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.name}
              </option>
            ))}
          </select>
        )}

        {/* Idioma */}
        {showLanguageFilter && languages.length > 0 && (
          <select
            value={filters.language || ''}
            onChange={(e) => handleChange('language', e.target.value)}
            className="px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">Todos los idiomas</option>
            {languages.map((lang) => (
              <option key={lang.locale} value={lang.locale}>
                {lang.language}
              </option>
            ))}
          </select>
        )}

        {/* Botón limpiar */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(AuditFilters);