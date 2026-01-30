import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Eye,
  RefreshCw,
  Clock,
  Lock,
  Unlock,
  ChevronDown,
} from 'lucide-react';
import {
  fetchReportInstanceByAuditId,
  fetchReportInstanceById,
  createReportInstance,
  refreshReportInstanceData,
  updateReportInstanceContent,
  saveReportInstanceVersion,
  fetchReportInstanceVersionHistory,
  restoreReportInstanceVersion,
  lockReportInstance,
  unlockReportInstance,
  selectCurrentReportInstance,
  selectCurrentReportInstanceLoading,
  selectVersionHistory,
  selectPDFLoading,
} from '../../features/reportInstances';
import {
  fetchActiveReportTemplates,
  selectActiveReportTemplates,
} from '../../features/reportTemplates';
import { selectCurrentUser } from '../../features/auth/authSelectors';
import {
  DataSchemaExplorer,
  CollaboratorsList,
  PDFActions,
  CollaborativeEditor,
} from '../../components/reports';

/**
 * ReportEditorPage
 * 
 * Página para editar el reporte de una auditoría específica.
 * Incluye:
 * - Editor colaborativo en tiempo real
 * - Panel de datos disponibles
 * - Historial de versiones
 * - Generación de PDF
 */
const ReportEditorPage = () => {
  const { auditId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const currentUser = useSelector(selectCurrentUser);
  const instance = useSelector(selectCurrentReportInstance);
  const instanceLoading = useSelector(selectCurrentReportInstanceLoading);
  const versionHistory = useSelector(selectVersionHistory);
  const pdfLoading = useSelector(selectPDFLoading);
  const activeTemplates = useSelector(selectActiveReportTemplates);

  // Local state
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('data'); // data, history
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [notification, setNotification] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const editorRef = useRef(null);

  // Cargar instancia de reporte
  useEffect(() => {
    if (auditId) {
      dispatch(fetchReportInstanceByAuditId(auditId));
    }
    dispatch(fetchActiveReportTemplates());
  }, [auditId, dispatch]);

  // Si no hay instancia, mostrar selector de plantilla
  useEffect(() => {
    if (!instanceLoading && !instance && activeTemplates.length > 0) {
      setShowTemplateSelector(true);
    }
  }, [instanceLoading, instance, activeTemplates]);

  // Mostrar notificación temporal
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Crear nueva instancia desde plantilla
  const handleCreateInstance = async () => {
    if (!selectedTemplateId || !auditId) return;

    setIsCreating(true);
    try {
      await dispatch(createReportInstance({
        auditId,
        templateId: selectedTemplateId,
      })).unwrap();
      setShowTemplateSelector(false);
      showNotification('Reporte creado correctamente');
    } catch (error) {
      showNotification(error.message || 'Error al crear el reporte', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Refrescar datos del reporte
  const handleRefreshData = async () => {
    if (!instance?._id) return;
    
    try {
      await dispatch(refreshReportInstanceData(instance._id)).unwrap();
      showNotification('Datos actualizados');
    } catch (error) {
      showNotification('Error al actualizar datos', 'error');
    }
  };

  // Guardar versión
  const handleSaveVersion = async () => {
    if (!instance?._id) return;

    const description = window.prompt('Descripción de la versión (opcional):');
    try {
      await dispatch(saveReportInstanceVersion({
        id: instance._id,
        description: description || undefined,
      })).unwrap();
      showNotification('Versión guardada');
      dispatch(fetchReportInstanceVersionHistory(instance._id));
    } catch (error) {
      showNotification('Error al guardar versión', 'error');
    }
  };

  // Restaurar versión
  const handleRestoreVersion = async (versionNumber) => {
    if (!instance?._id) return;
    
    const confirm = window.confirm(`¿Restaurar a la versión ${versionNumber}? El contenido actual se perderá.`);
    if (!confirm) return;

    try {
      await dispatch(restoreReportInstanceVersion({
        id: instance._id,
        versionNumber,
      })).unwrap();
      showNotification(`Restaurado a versión ${versionNumber}`);
    } catch (error) {
      showNotification('Error al restaurar versión', 'error');
    }
  };

  // Insertar variable desde el panel
  const handleFieldInsert = useCallback(({ variable }) => {
    if (editorRef.current?.insertVariable) {
      editorRef.current.insertVariable(variable);
    }
  }, []);

  // Guardar contenido
  const handleSave = async (content) => {
    if (!instance?._id) return;

    try {
      await dispatch(updateReportInstanceContent({
        id: instance._id,
        content,
      })).unwrap();
      showNotification('Guardado');
    } catch (error) {
      showNotification('Error al guardar', 'error');
    }
  };

  // Bloquear/Desbloquear
  const handleToggleLock = async () => {
    if (!instance?._id) return;

    try {
      if (instance.isLocked) {
        await dispatch(unlockReportInstance(instance._id)).unwrap();
        showNotification('Reporte desbloqueado');
      } else {
        await dispatch(lockReportInstance(instance._id)).unwrap();
        showNotification('Reporte bloqueado');
      }
    } catch (error) {
      showNotification('Error al cambiar bloqueo', 'error');
    }
  };

  // Loading state
  if (instanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  // Selector de plantilla
  if (showTemplateSelector) {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(`/audits/${auditId}`)}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la auditoría
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-primary-400" />
              Crear Reporte
            </h1>
            <p className="text-gray-400 mt-1">
              Selecciona una plantilla para comenzar
            </p>
          </div>

          {/* Selector de plantillas */}
          <div className="bg-bg-secondary border border-gray-700 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Plantilla de reporte
            </label>

            {activeTemplates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">No hay plantillas disponibles</p>
                <button
                  onClick={() => navigate('/report-templates')}
                  className="text-primary-400 hover:text-primary-300"
                >
                  Crear una plantilla
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-80 overflow-auto mb-6">
                  {activeTemplates.map((template) => (
                    <button
                      key={template._id}
                      onClick={() => setSelectedTemplateId(template._id)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selectedTemplateId === template._id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <p className="font-medium text-white">{template.name}</p>
                      {template.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-bg-tertiary rounded text-gray-400">
                          v{template.version || 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {template.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCreateInstance}
                  disabled={!selectedTemplateId || isCreating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  Crear Reporte
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Si no hay instancia
  if (!instance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No se encontró el reporte</p>
          <button
            onClick={() => navigate(`/audits/${auditId}`)}
            className="mt-4 text-primary-400 hover:text-primary-300"
          >
            Volver a la auditoría
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Notificación */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={notification.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {notification.message}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-bg-secondary border-b border-gray-700 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/audits/${auditId}`)}
              className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {instance.name || 'Reporte'}
                {instance.isLocked && (
                  <Lock className="w-4 h-4 text-warning-400" title="Bloqueado" />
                )}
              </h1>
              <p className="text-sm text-gray-400">
                {instance.template?.name} • v{instance.version || 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Acciones */}
            <button
              onClick={handleRefreshData}
              className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={handleSaveVersion}
              className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
              title="Guardar versión"
            >
              <History className="w-5 h-5" />
            </button>

            <button
              onClick={handleToggleLock}
              className={`p-2 rounded-lg transition-colors ${
                instance.isLocked
                  ? 'text-warning-400 hover:bg-warning-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-bg-tertiary'
              }`}
              title={instance.isLocked ? 'Desbloquear' : 'Bloquear'}
            >
              {instance.isLocked ? (
                <Lock className="w-5 h-5" />
              ) : (
                <Unlock className="w-5 h-5" />
              )}
            </button>

            {/* Toggle sidebar */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              {showSidebar ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeftOpen className="w-5 h-5" />
              )}
            </button>

            {/* PDF Actions */}
            <PDFActions
              reportInstanceId={instance._id}
              reportName={instance.name}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-72 shrink-0 flex flex-col border-r border-gray-700">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setSidebarTab('data')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  sidebarTab === 'data'
                    ? 'text-white border-b-2 border-primary-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Datos
              </button>
              <button
                onClick={() => {
                  setSidebarTab('history');
                  if (instance?._id) {
                    dispatch(fetchReportInstanceVersionHistory(instance._id));
                  }
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  sidebarTab === 'history'
                    ? 'text-white border-b-2 border-primary-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Historial
              </button>
            </div>

            {/* Tab content */}
            {sidebarTab === 'data' ? (
              <DataSchemaExplorer
                className="flex-1"
                onFieldInsert={handleFieldInsert}
              />
            ) : (
              <div className="flex-1 overflow-auto p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Versiones</h3>
                {versionHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Sin versiones guardadas
                  </p>
                ) : (
                  <div className="space-y-2">
                    {versionHistory.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-bg-tertiary rounded-lg hover:bg-bg-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">v{v.version}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {v.description && (
                          <p className="text-sm text-gray-400 mb-2">{v.description}</p>
                        )}
                        <button
                          onClick={() => handleRestoreVersion(v.version)}
                          className="text-xs text-primary-400 hover:text-primary-300"
                        >
                          Restaurar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-hidden p-4">
          <CollaborativeEditor
            ref={editorRef}
            reportInstanceId={instance._id}
            currentUser={currentUser}
            initialContent={instance.content}
            onSave={handleSave}
            readOnly={instance.isLocked && instance.lockedBy !== currentUser?._id}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ReportEditorPage;
