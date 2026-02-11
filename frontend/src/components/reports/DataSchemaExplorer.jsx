import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChevronRight,
  ChevronDown,
  Database,
  Folder,
  FileText,
  Hash,
  Calendar,
  Image,
  List,
  Mail,
  Calculator,
  GripVertical,
} from 'lucide-react';
import {
  fetchDataSchemas,
  selectDataSchemas,
  selectDataSchemasLoading,
} from '../../features/reportTemplates';

// Iconos por tipo de campo
const TYPE_ICONS = {
  text: FileText,
  string: FileText,
  number: Hash,
  date: Calendar,
  image: Image,
  'rich-text': FileText,
  list: List,
  array: List,
  enum: List,
  email: Mail,
  computed: Calculator,
  object: Folder,
};

// Colores por tipo de campo
const TYPE_COLORS = {
  text: 'text-gray-400',
  string: 'text-gray-400',
  number: 'text-info-400',
  date: 'text-warning-400',
  image: 'text-accent-400',
  'rich-text': 'text-primary-400',
  list: 'text-chart-purple',
  array: 'text-chart-purple',
  computed: 'text-chart-orange',
};

/**
 * DataSchemaExplorer
 * 
 * Panel lateral que muestra los datos disponibles para arrastrar al editor.
 * Permite explorar esquemas jerárquicos y generar variables.
 */
const DataSchemaExplorer = ({ onFieldDrag, onFieldInsert, className = '' }) => {
  const dispatch = useDispatch();
  const schemas = useSelector(selectDataSchemas);
  const loading = useSelector(selectDataSchemasLoading);

  const [expandedSchemas, setExpandedSchemas] = useState({});
  const [expandedFields, setExpandedFields] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchDataSchemas());
  }, [dispatch]);

  const toggleSchema = (key) => {
    setExpandedSchemas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleField = (schemaKey, fieldKey) => {
    const key = `${schemaKey}.${fieldKey}`;
    setExpandedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDragStart = (e, schemaKey, fieldPath, fieldInfo) => {
    const variable = `{{${schemaKey}.${fieldPath}}}`;
    e.dataTransfer.setData('text/plain', variable);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        schemaKey,
        fieldPath,
        type: fieldInfo.type,
        label: fieldInfo.label,
        variable,
      })
    );
    if (onFieldDrag) onFieldDrag({ schemaKey, fieldPath, fieldInfo, variable });
  };

  const handleInsert = (schemaKey, fieldPath, fieldInfo) => {
    const variable = `{{${schemaKey}.${fieldPath}}}`;
    if (onFieldInsert) onFieldInsert({ schemaKey, fieldPath, fieldInfo, variable });
  };

  const renderField = (schemaKey, fieldKey, field, path = '', level = 0) => {
    const fullPath = path ? `${path}.${fieldKey}` : fieldKey;
    const hasChildren = field.fields && Object.keys(field.fields).length > 0;
    const isExpanded = expandedFields[`${schemaKey}.${fullPath}`];
    const Icon = TYPE_ICONS[field.type] || FileText;
    const colorClass = TYPE_COLORS[field.type] || 'text-gray-400';

    // Filtrar por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        fieldKey.toLowerCase().includes(searchLower) ||
        field.label?.toLowerCase().includes(searchLower);
      if (!matchesSearch && !hasChildren) return null;
    }

    return (
      <div key={fullPath}>
        <div
          draggable={!hasChildren}
          onDragStart={(e) => !hasChildren && handleDragStart(e, schemaKey, fullPath, field)}
          onClick={() =>
            hasChildren ? toggleField(schemaKey, fullPath) : handleInsert(schemaKey, fullPath, field)
          }
          className={`
            group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
            hover:bg-bg-tertiary transition-colors
            ${!hasChildren ? 'hover:bg-primary-500/10' : ''}
          `}
          style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
          title={field.description || field.label}
        >
          {hasChildren && (
            <span className="text-gray-500">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          {!hasChildren && <span className="w-4" />}
          <Icon className={`w-4 h-4 ${colorClass}`} />
          <span className="text-sm text-gray-300 flex-1 truncate">{field.label}</span>
          {!hasChildren && (
            <GripVertical className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          {field.isArray && (
            <span className="text-xs px-1.5 py-0.5 bg-accent-500/10 text-accent-400 rounded">
              []
            </span>
          )}
        </div>

        {/* Campos anidados */}
        {hasChildren && isExpanded && (
          <div>
            {Object.entries(field.fields).map(([k, f]) =>
              renderField(schemaKey, k, f, fullPath, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-bg-secondary border-r border-gray-700 ${className}`}>
        <div className="p-4 text-center">
          <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-2">Cargando esquemas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-secondary border-r border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-primary-400" />
          Datos Disponibles
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Arrastra campos al editor o haz clic para insertar
        </p>
      </div>

      {/* Buscador */}
      <div className="p-3 border-b border-gray-700">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar campo..."
          className="w-full px-3 py-2 bg-bg-tertiary border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Lista de esquemas */}
      <div className="flex-1 overflow-auto p-2 scrollbar-thin">
        {Object.entries(schemas).map(([schemaKey, schema]) => {
          const isExpanded = expandedSchemas[schemaKey];

          return (
            <div key={schemaKey} className="mb-1">
              {/* Schema header */}
              <button
                onClick={() => toggleSchema(schemaKey)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                <span className="text-gray-500">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
                <Folder className="w-4 h-4 text-warning-400" />
                <span className="font-medium text-gray-200 text-sm flex-1 text-left">
                  {schema.label}
                </span>
                {schema.isArray && (
                  <span className="text-xs px-1.5 py-0.5 bg-accent-500/10 text-accent-400 rounded">
                    Array
                  </span>
                )}
              </button>

              {/* Schema fields */}
              {isExpanded && schema.fields && (
                <div className="ml-2 border-l-2 border-gray-700">
                  {Object.entries(schema.fields).map(([fieldKey, field]) =>
                    renderField(schemaKey, fieldKey, field)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sintaxis especial */}
      <div className="p-3 border-t border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Sintaxis Especial</h4>
        <div className="space-y-2 text-xs">
          <div className="bg-bg-tertiary p-2 rounded-lg font-mono">
            <span className="text-accent-400">{'{{#each findings}}'}</span>
            <br />
            <span className="text-gray-500 ml-2">{'{{title}}'}</span>
            <br />
            <span className="text-accent-400">{'{{/each}}'}</span>
          </div>
          <div className="bg-bg-tertiary p-2 rounded-lg font-mono">
            <span className="text-info-400">{'{{#if (gt stats.critical 0)}}'}</span>
            <br />
            <span className="text-gray-500 ml-2">Hay críticas</span>
            <br />
            <span className="text-info-400">{'{{/if}}'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSchemaExplorer;
