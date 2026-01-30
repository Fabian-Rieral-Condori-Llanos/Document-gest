import { useState, useEffect, memo } from 'react';
import { FileText, ChevronDown, Check, Search, X, Loader2 } from 'lucide-react';
import reportTemplatesApi from '../../../api/endpoints/report-templates.api';

/**
 * ReportTemplateSelect - Selector de plantillas de reporte
 * 
 * Carga las plantillas activas y permite seleccionar una para la auditoría.
 */
const ReportTemplateSelect = ({
  value = '',
  onChange,
  label = 'Plantilla de Reporte',
  placeholder = 'Seleccionar plantilla...',
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
        const response = await reportTemplatesApi.getActive();
        setTemplates(response.data || []);
      } catch (err) {
        console.error('Error loading report templates:', err);
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
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por categoría
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'Sin categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {});

  // Obtener plantilla seleccionada
  const selectedTemplate = templates.find(t => t._id === value);

  const handleSelect = (templateId) => {
    onChange(templateId);
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
        <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          {loading ? (
            <span className="text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando...
            </span>
          ) : selectedTemplate ? (
            <div>
              <p className="text-white truncate">{selectedTemplate.name}</p>
              {selectedTemplate.category && (
                <p className="text-xs text-gray-500 truncate">{selectedTemplate.category}</p>
              )}
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
          <div className="absolute left-0 right-0 top-full mt-1 bg-bg-tertiary border border-gray-700 rounded-lg shadow-xl z-20 max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Templates List */}
            <div className="overflow-y-auto max-h-60">
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
                Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="px-3 py-1.5 bg-bg-secondary text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                      {category}
                    </div>
                    
                    {/* Templates in Category */}
                    {categoryTemplates.map(template => {
                      const isSelected = template._id === value;
                      return (
                        <button
                          key={template._id}
                          type="button"
                          onClick={() => handleSelect(template._id)}
                          className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-bg-secondary transition-colors text-left ${
                            isSelected ? 'bg-primary-500/10' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 text-primary-400" />
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
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer info */}
            {templates.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-700 bg-bg-secondary">
                <p className="text-xs text-gray-500">
                  {filteredTemplates.length} de {templates.length} plantillas
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default memo(ReportTemplateSelect);