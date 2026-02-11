import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  Code,
  Settings,
  CheckCircle,
  AlertCircle,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import {
  fetchReportTemplateById,
  createReportTemplate,
  updateReportTemplate,
  updateReportTemplateContent,
  clearSelectedTemplate,
  clearOperationState,
  selectSelectedReportTemplate,
  selectSelectedReportTemplateLoading,
  selectReportTemplateOperationLoading,
  selectReportTemplateOperationSuccess,
  selectReportTemplateOperationError,
} from '../../features/reportTemplates';
import { DataSchemaExplorer, TipTapEditor } from '../../components/reports';

const CATEGORY_OPTIONS = [
  { value: 'security-audit', label: 'Auditoría de Seguridad' },
  { value: 'vulnerability-assessment', label: 'Evaluación de Vulnerabilidades' },
  { value: 'pentest', label: 'Prueba de Penetración' },
  { value: 'compliance', label: 'Cumplimiento' },
  { value: 'custom', label: 'Personalizado' },
];

/**
 * Convierte JSON de TipTap a HTML para la vista previa
 */
const tiptapToHtml = (doc) => {
  if (!doc || !doc.content) return '<p class="text-gray-400 italic">Sin contenido</p>';

  const renderNode = (node) => {
    if (!node) return '';

    // Texto
    if (node.type === 'text') {
      let text = node.text || '';
      // Aplicar marcas (bold, italic, etc.)
      if (node.marks) {
        node.marks.forEach((mark) => {
          switch (mark.type) {
            case 'bold':
              text = `<strong>${text}</strong>`;
              break;
            case 'italic':
              text = `<em>${text}</em>`;
              break;
            case 'underline':
              text = `<u>${text}</u>`;
              break;
            case 'strike':
              text = `<s>${text}</s>`;
              break;
            case 'code':
              text = `<code class="bg-gray-100 px-1 rounded">${text}</code>`;
              break;
            case 'link':
              text = `<a href="${mark.attrs?.href || '#'}" class="text-blue-600 underline">${text}</a>`;
              break;
            case 'highlight':
              text = `<mark class="bg-yellow-200">${text}</mark>`;
              break;
          }
        });
      }
      return text;
    }

    // Contenido de hijos
    const children = node.content ? node.content.map(renderNode).join('') : '';

    // Renderizar según tipo de nodo
    switch (node.type) {
      case 'doc':
        return children;
      case 'paragraph':
        const align = node.attrs?.textAlign ? `text-align: ${node.attrs.textAlign}` : '';
        return `<p style="${align}" class="mb-3">${children || '&nbsp;'}</p>`;
      case 'heading':
        const level = node.attrs?.level || 1;
        const hAlign = node.attrs?.textAlign ? `text-align: ${node.attrs.textAlign}` : '';
        const sizes = { 1: 'text-3xl font-bold', 2: 'text-2xl font-semibold', 3: 'text-xl font-semibold' };
        return `<h${level} style="${hAlign}" class="${sizes[level]} mb-4 mt-6">${children}</h${level}>`;
      case 'bulletList':
        return `<ul class="list-disc pl-6 mb-4">${children}</ul>`;
      case 'orderedList':
        return `<ol class="list-decimal pl-6 mb-4">${children}</ol>`;
      case 'listItem':
        return `<li class="mb-1">${children}</li>`;
      case 'blockquote':
        return `<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">${children}</blockquote>`;
      case 'codeBlock':
        return `<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>${children}</code></pre>`;
      case 'horizontalRule':
        return '<hr class="my-6 border-gray-300" />';
      case 'hardBreak':
        return '<br />';
      case 'image':
        return `<img src="${node.attrs?.src || ''}" alt="${node.attrs?.alt || ''}" class="max-w-full h-auto rounded-lg my-4" />`;
      case 'table':
        return `<table class="w-full border-collapse border border-gray-300 my-4">${children}</table>`;
      case 'tableRow':
        return `<tr>${children}</tr>`;
      case 'tableCell':
        return `<td class="border border-gray-300 p-2">${children}</td>`;
      case 'tableHeader':
        return `<th class="border border-gray-300 p-2 bg-gray-100 font-semibold">${children}</th>`;
      default:
        return children;
    }
  };

  return renderNode(doc);
};

/**
 * ReportTemplateEditorPage
 * 
 * Página para crear/editar plantillas de reportes.
 * Incluye editor de contenido y panel lateral de datos.
 */
const ReportTemplateEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isEditMode = !!id;

  // Selectors
  const template = useSelector(selectSelectedReportTemplate);
  const templateLoading = useSelector(selectSelectedReportTemplateLoading);
  const operationLoading = useSelector(selectReportTemplateOperationLoading);
  const operationSuccess = useSelector(selectReportTemplateOperationSuccess);
  const operationError = useSelector(selectReportTemplateOperationError);

  // Local state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'security-audit',
    isActive: true,
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
  });
  const [errors, setErrors] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('editor'); // editor, preview, settings

  // Referencia al editor para insertar variables
  const editorRef = useRef(null);

  // Cargar plantilla si estamos editando
  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchReportTemplateById(id));
    }
    return () => {
      dispatch(clearSelectedTemplate());
    };
  }, [id, isEditMode, dispatch]);

  // Sincronizar datos del template con el form
  useEffect(() => {
    if (template && isEditMode) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        category: template.category || 'security-audit',
        isActive: template.isActive !== false,
        content: template.content || { type: 'doc', content: [{ type: 'paragraph' }] },
      });
    }
  }, [template, isEditMode]);

  // Manejar notificaciones
  useEffect(() => {
    if (operationSuccess || operationError) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
        dispatch(clearOperationState());
        if (operationSuccess && !isEditMode) {
          navigate('/report-templates');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [operationSuccess, operationError, dispatch, navigate, isEditMode]);

  // Validación
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar
  const handleSave = async () => {
    if (!validate()) return;

    if (isEditMode) {
      await dispatch(updateReportTemplate({ id, data: formData }));
    } else {
      await dispatch(createReportTemplate(formData));
    }
  };

  // Insertar variable desde el panel de datos
  const handleFieldInsert = useCallback(({ variable }) => {
    // En un editor real, esto insertaría en la posición del cursor
    setEditorContent((prev) => prev + variable);
  }, []);

  if (templateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Notificación */}
      {showNotification && (operationSuccess || operationError) && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            operationSuccess
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}
        >
          {operationSuccess ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={operationSuccess ? 'text-green-400' : 'text-red-400'}>
            {operationSuccess || operationError}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-bg-secondary border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/report-templates')}
              className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {isEditMode ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h1>
              <p className="text-sm text-gray-400">
                {isEditMode ? template?.name : 'Crea una nueva plantilla de reporte'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex bg-bg-tertiary rounded-lg p-1">
              {[
                { key: 'editor', icon: Code, label: 'Editor' },
                { key: 'preview', icon: Eye, label: 'Vista previa' },
                { key: 'settings', icon: Settings, label: 'Configuración' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeTab === key
                      ? 'bg-bg-secondary text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Toggle sidebar */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
              title={showSidebar ? 'Ocultar panel' : 'Mostrar panel'}
            >
              {showSidebar ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeftOpen className="w-5 h-5" />
              )}
            </button>

            {/* Guardar */}
            <button
              onClick={handleSave}
              disabled={operationLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {operationLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <DataSchemaExplorer
            className="w-72 shrink-0"
            onFieldInsert={handleFieldInsert}
          />
        )}

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'editor' && (
            <div className="p-6">
              {/* Form básico */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Nombre <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Informe de Evaluación de Seguridad"
                    className={`w-full px-4 py-2.5 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe el propósito de esta plantilla..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>

              {/* Editor de contenido TipTap */}
              <TipTapEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Escribe el contenido de la plantilla..."
                editable={true}
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-6">
              <div className="bg-white rounded-xl p-8 max-w-4xl mx-auto shadow-lg min-h-[600px]">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-900">{formData.name || 'Título del Informe'}</h1>
                  {formData.description && (
                    <p className="text-gray-600 mt-2">{formData.description}</p>
                  )}
                </div>
                <div
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: tiptapToHtml(formData.content),
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Configuración de la plantilla</h3>

              <div className="space-y-6">
                {/* Estado activo */}
                <div className="flex items-center justify-between p-4 bg-bg-secondary border border-gray-700 rounded-xl">
                  <div>
                    <p className="font-medium text-white">Plantilla activa</p>
                    <p className="text-sm text-gray-400">
                      Las plantillas activas pueden ser seleccionadas para nuevos reportes
                    </p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.isActive ? 'bg-primary-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Más configuraciones aquí... */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportTemplateEditorPage;
