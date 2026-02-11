import { useState, useEffect, memo } from 'react';
import { ClipboardList, ChevronDown, Check, Search, X, Loader2 } from 'lucide-react';
import procedureTemplatesApi from '../../../api/endpoints/procedure-templates.api';

/**
 * ProcedureTemplateSelect - Selector de plantillas de procedimiento
 * 
 * Carga las plantillas activas y permite seleccionar una para la auditoría.
 * 
 * @param {string} value - Valor actual seleccionado
 * @param {function} onChange - Callback cuando cambia la selección
 * @param {string} valueField - Campo del template a usar como valor (default: 'code')
 *                              Ejemplos: '_id', 'code', 'name', o cualquier campo del template
 * @param {string} label - Etiqueta del campo
 * @param {string} placeholder - Placeholder cuando no hay selección
 * @param {string} error - Mensaje de error
 * @param {boolean} required - Si es requerido
 * @param {boolean} disabled - Si está deshabilitado
 * @param {string} className - Clases CSS adicionales
 * 
 * @example
 * // Devuelve el code (PR01, PR02, etc.) - Por defecto
 * <ProcedureTemplateSelect 
 *   value={formData.origen}
 *   onChange={(code) => handleChange('origen', code)}
 * />
 * 
 * @example
 * // Devuelve el _id del template
 * <ProcedureTemplateSelect 
 *   value={formData.templateId}
 *   onChange={(id) => handleChange('templateId', id)}
 *   valueField="_id"
 * />
 * 
 * @example
 * // Devuelve el name del template
 * <ProcedureTemplateSelect 
 *   value={formData.procedureName}
 *   onChange={(name) => handleChange('procedureName', name)}
 *   valueField="name"
 * />
 */
const ProcedureTemplateSelect = ({
  value = '',
  onChange,
  valueField = '_id', // Campo a devolver: '_id', 'code', 'name', etc.
  label = 'Tipo de Procedimiento',
  placeholder = 'Seleccionar procedimiento...',
  error = '',
  required = false,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Cargar plantillas activas
  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await procedureTemplatesApi.getActive();
        setTemplates(response.data || []);
      } catch (err) {
        console.error('Error loading procedure templates:', err);
        setFetchError('Error al cargar plantillas');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Filtrar plantillas por búsqueda
  const filteredTemplates = templates.filter(template =>
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener plantilla seleccionada buscando por el campo especificado
  const selectedTemplate = templates.find(t => t[valueField] === value);

  const handleSelect = (template) => {
    // Devolver el campo especificado
    const returnValue = template[valueField];
    onChange(returnValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label} {required && <span className="text-danger-400">*</span>}
        </label>
      )}

      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-3 py-2.5 bg-bg-tertiary border rounded-lg text-left transition-colors ${
          error
            ? 'border-danger-500'
            : isOpen
            ? 'border-primary-500'
            : 'border-gray-700 hover:border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <ClipboardList className="w-5 h-5 text-gray-500 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          {loading ? (
            <span className="text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando...
            </span>
          ) : selectedTemplate ? (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-xs rounded font-mono font-semibold">
                {selectedTemplate.code}
              </span>
              <p className="text-white truncate">{selectedTemplate.name}</p>
            </div>
          ) : value ? (
            // Si hay un valor pero no se encuentra el template (valor manual/antiguo)
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gray-500/20 text-gray-300 text-xs rounded font-mono font-semibold">
                {value}
              </span>
              <p className="text-gray-400 truncate text-sm">(valor existente)</p>
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-danger-400">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute left-0 right-0 top-full mt-1 bg-bg-tertiary border border-gray-700 rounded-lg shadow-xl z-20 max-h-72 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Templates List */}
            <div className="overflow-y-auto max-h-52">
              {fetchError ? (
                <div className="p-4 text-center text-danger-400 text-sm">
                  {fetchError}
                </div>
              ) : loading ? (
                <div className="p-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando plantillas...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchTerm ? 'No se encontraron plantillas' : 'No hay plantillas disponibles'}
                </div>
              ) : (
                filteredTemplates.map(template => {
                  const isSelected = template[valueField] === value;
                  return (
                    <button
                      key={template._id}
                      type="button"
                      onClick={() => handleSelect(template)}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-bg-secondary transition-colors text-left ${
                        isSelected ? 'bg-primary-500/10' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-400 font-mono text-xs font-bold">
                          {template.code}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {template.name}
                        </p>
                        {template.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                            {template.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary-400 flex-shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer info */}
            {templates.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-700 bg-bg-secondary">
                <p className="text-xs text-gray-500">
                  {filteredTemplates.length} de {templates.length} procedimientos
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default memo(ProcedureTemplateSelect);