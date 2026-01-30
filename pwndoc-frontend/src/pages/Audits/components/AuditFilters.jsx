import { memo, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { AUDIT_STATES, AUDIT_STATE_LABELS } from '../../../features/audits';
import SearchableSelect from '../../../components/common/SearchableSelect/SearchableSelect';

/**
 * AuditFilters - Filtros mejorados para lista de auditorías
 * 
 * Mejoras:
 * - Usa tipos de auditoría reales desde datos maestros
 * - SearchableSelect para empresa y entidad
 * - Muestra empresa asociada en cada cliente
 * - Tags de filtros activos
 */
const AuditFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  companies = [],
  clients = [],
  languages = [],
  auditTypes = [],
  className = '',
}) => {
  const hasActiveFilters = Object.values(filters).some(v => v && v !== '');

  const handleChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  // Opciones para empresas
  const companyOptions = useMemo(() => {
    return companies.map(company => ({
      value: company._id,
      label: company.name,
      subtitle: company.shortName || null,
    }));
  }, [companies]);

  // Opciones para clientes/entidades con empresa asociada
  const clientOptions = useMemo(() => {
    return clients.map(client => {
      // Obtener nombre de la empresa asociada
      let companyName = '';
      if (client.company) {
        if (typeof client.company === 'object') {
          companyName = client.company.name || '';
        } else {
          // Si es ID, buscar en companies
          const comp = companies.find(c => c._id === client.company);
          companyName = comp?.name || '';
        }
      }

      // Determinar el nombre a mostrar del cliente
      const clientName = client.name || 
        `${client.firstname || ''} ${client.lastname || ''}`.trim() || 
        client.email || 
        'Sin nombre';

      return {
        value: client._id,
        label: clientName,
        subtitle: companyName || 'Sin empresa asignada',
        group: companyName || 'Sin empresa',
      };
    });
  }, [clients, companies]);

  // Opciones para tipos de auditoría desde datos maestros
  const auditTypeOptions = useMemo(() => {
    return auditTypes.map(type => ({
      value: type.name,
      label: type.name,
    }));
  }, [auditTypes]);

  // Opciones para idiomas
  const languageOptions = useMemo(() => {
    return languages.map(lang => ({
      value: lang.locale,
      label: lang.language,
    }));
  }, [languages]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre de auditoría..."
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
        />
      </div>

      {/* Filtros en fila */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 text-gray-400 self-center">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        {/* Estado */}
        <div className="w-40">
          <select
            value={filters.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(AUDIT_STATES).map(([key, value]) => (
              <option key={key} value={value}>
                {AUDIT_STATE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Auditoría (datos maestros) */}
        {auditTypes.length > 0 && (
          <div className="w-52">
            <SearchableSelect
              value={filters.auditType || ''}
              onChange={(val) => handleChange('auditType', val)}
              options={auditTypeOptions}
              placeholder="Tipo de auditoría"
              searchPlaceholder="Buscar tipo..."
              emptyMessage="No hay tipos definidos"
              noResultsMessage="Tipo no encontrado"
              clearable
            />
          </div>
        )}

        {/* Empresa */}
        {companies.length > 0 && (
          <div className="w-52">
            <SearchableSelect
              value={filters.company || ''}
              onChange={(val) => handleChange('company', val)}
              options={companyOptions}
              placeholder="Todas las empresas"
              searchPlaceholder="Buscar empresa..."
              noResultsMessage="Empresa no encontrada"
              clearable
            />
          </div>
        )}

        {/* Entidad/Cliente (con empresa agrupada) */}
        {clients.length > 0 && (
          <div className="w-64">
            <SearchableSelect
              value={filters.client || ''}
              onChange={(val) => handleChange('client', val)}
              options={clientOptions}
              placeholder="Todas las entidades"
              searchPlaceholder="Buscar entidad..."
              noResultsMessage="Entidad no encontrada"
              clearable
              groupBy
            />
          </div>
        )}

        {/* Idioma */}
        {languages.length > 0 && (
          <div className="w-40">
            <SearchableSelect
              value={filters.language || ''}
              onChange={(val) => handleChange('language', val)}
              options={languageOptions}
              placeholder="Idioma"
              searchPlaceholder="Buscar..."
              noResultsMessage="No encontrado"
              clearable
            />
          </div>
        )}

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Tags de filtros activos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.state && (
            <FilterTag
              label={`Estado: ${AUDIT_STATE_LABELS[filters.state] || filters.state}`}
              onRemove={() => handleChange('state', '')}
            />
          )}
          {filters.auditType && (
            <FilterTag
              label={`Tipo: ${filters.auditType}`}
              onRemove={() => handleChange('auditType', '')}
            />
          )}
          {filters.company && (
            <FilterTag
              label={`Empresa: ${companies.find(c => c._id === filters.company)?.name || 'Desconocida'}`}
              onRemove={() => handleChange('company', '')}
            />
          )}
          {filters.client && (
            <FilterTag
              label={`Entidad: ${clients.find(c => c._id === filters.client)?.name || 
                clients.find(c => c._id === filters.client)?.email || 'Desconocida'}`}
              onRemove={() => handleChange('client', '')}
            />
          )}
          {filters.language && (
            <FilterTag
              label={`Idioma: ${languages.find(l => l.locale === filters.language)?.language || filters.language}`}
              onRemove={() => handleChange('language', '')}
            />
          )}
          {filters.search && (
            <FilterTag
              label={`Búsqueda: "${filters.search}"`}
              onRemove={() => handleChange('search', '')}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Tag de filtro activo
const FilterTag = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-xs text-primary-400">
    {label}
    <button
      onClick={onRemove}
      className="hover:bg-primary-500/20 rounded-full p-0.5 transition-colors"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default memo(AuditFilters);