import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronRight, ChevronDown, Database, Table, Hash, Calendar, Image, FileText, List, Folder, GripVertical } from 'lucide-react';
import { fetchDataSchemas, selectDataSchemas, selectDataSchemasLoading } from '../../features/reportTemplates';

// Iconos por tipo de campo
const TYPE_ICONS = {
  text: FileText,
  number: Hash,
  date: Calendar,
  image: Image,
  'rich-text': FileText,
  list: List,
  array: List,
  enum: List,
  email: FileText,
  computed: Hash,
  object: Folder,
};

/**
 * Componente explorador de esquemas de datos
 * Permite drag & drop de campos hacia el editor
 */
export default function DataSchemaExplorer({ onFieldDrag, onFieldInsert }) {
  const dispatch = useDispatch();
  const schemas = useSelector(selectDataSchemas);
  const loading = useSelector(selectDataSchemasLoading);
  const [expandedSchemas, setExpandedSchemas] = useState({});
  const [expandedFields, setExpandedFields] = useState({});

  useEffect(() => {
    dispatch(fetchDataSchemas());
  }, [dispatch]);

  const toggleSchema = (key) => {
    setExpandedSchemas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleField = (schemaKey, fieldKey) => {
    const key = `${schemaKey}.${fieldKey}`;
    setExpandedFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDragStart = (e, schemaKey, fieldPath, fieldInfo) => {
    const variable = `{{${schemaKey}.${fieldPath}}}`;
    e.dataTransfer.setData('text/plain', variable);
    e.dataTransfer.setData('application/json', JSON.stringify({
      schemaKey,
      fieldPath,
      type: fieldInfo.type,
      label: fieldInfo.label,
      variable,
    }));
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

    return (
      <div key={fullPath}>
        <div
          draggable={!hasChildren}
          onDragStart={(e) => !hasChildren && handleDragStart(e, schemaKey, fullPath, field)}
          onClick={() => hasChildren ? toggleField(schemaKey, fullPath) : handleInsert(schemaKey, fullPath, field)}
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
            hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors
            ${!hasChildren ? 'pl-6' : ''}
          `}
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
        >
          {hasChildren && (
            <span className="text-gray-400">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          )}
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{field.label}</span>
          {!hasChildren && (
            <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100" />
          )}
          {field.isArray && (
            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">[]</span>
          )}
          {field.computed && (
            <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded">calc</span>
          )}
        </div>
        
        {/* Campos anidados */}
        {hasChildren && isExpanded && (
          <div>
            {Object.entries(field.fields).map(([k, f]) => renderField(schemaKey, k, f, fullPath, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-gray-500 mt-2">Cargando esquemas...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Datos Disponibles
        </h3>
        <p className="text-xs text-gray-500 mt-1">Arrastra campos al editor o haz clic para insertar</p>
      </div>

      <div className="p-2">
        {Object.entries(schemas).map(([schemaKey, schema]) => {
          const isExpanded = expandedSchemas[schemaKey];
          
          return (
            <div key={schemaKey} className="mb-1">
              {/* Schema header */}
              <button
                onClick={() => toggleSchema(schemaKey)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-gray-400">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
                <Folder className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{schema.label}</span>
                {schema.isArray && (
                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded ml-auto">Array</span>
                )}
              </button>

              {/* Schema fields */}
              {isExpanded && (
                <div className="ml-2 border-l-2 border-gray-200 dark:border-gray-700">
                  {Object.entries(schema.fields).map(([fieldKey, field]) => 
                    renderField(schemaKey, fieldKey, field)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Helper para loops */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 mt-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Sintaxis Especial</h4>
        <div className="space-y-2">
          <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
            <span className="text-purple-600">{'{{#each findings}}'}</span>
            <br />
            <span className="text-gray-500 ml-2">{'{{title}} - {{severity}}'}</span>
            <br />
            <span className="text-purple-600">{'{{/each}}'}</span>
          </div>
          <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
            <span className="text-blue-600">{'{{#if (gt stats.critical 0)}}'}</span>
            <br />
            <span className="text-gray-500 ml-2">Hay críticas</span>
            <br />
            <span className="text-blue-600">{'{{/if}}'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
