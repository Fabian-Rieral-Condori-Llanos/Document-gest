import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Edit, Copy, Trash2, ToggleLeft, ToggleRight, RefreshCw, Eye, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchReportTemplates, fetchReportTemplateStats, toggleReportTemplate, deleteReportTemplate,
  cloneReportTemplate, initializeReportTemplates, setFilters, clearOperationState,
  selectFilteredReportTemplates, selectReportTemplatesLoading, selectReportTemplateStats,
  selectReportTemplateFilters, selectReportTemplateOperationSuccess, selectReportTemplateOperationError,
} from '../../features/reportTemplates';

const CATEGORY_LABELS = {
  'security-audit': 'Auditoría de Seguridad',
  'vulnerability-assessment': 'Evaluación de Vulnerabilidades',
  'pentest': 'Prueba de Penetración',
  'compliance': 'Cumplimiento',
  'custom': 'Personalizado',
};

export default function ReportTemplatesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const templates = useSelector(selectFilteredReportTemplates);
  const loading = useSelector(selectReportTemplatesLoading);
  const stats = useSelector(selectReportTemplateStats);
  const filters = useSelector(selectReportTemplateFilters);
  const operationSuccess = useSelector(selectReportTemplateOperationSuccess);
  const operationError = useSelector(selectReportTemplateOperationError);

  const [deleteModal, setDeleteModal] = useState(null);
  const [cloneModal, setCloneModal] = useState(null);
  const [cloneName, setCloneName] = useState('');
  const [dropdown, setDropdown] = useState(null);

  useEffect(() => {
    dispatch(fetchReportTemplates());
    dispatch(fetchReportTemplateStats());
  }, [dispatch]);

  useEffect(() => {
    if (operationSuccess) { toast.success(operationSuccess); dispatch(clearOperationState()); }
    if (operationError) { toast.error(operationError); dispatch(clearOperationState()); }
  }, [operationSuccess, operationError, dispatch]);

  const handleToggle = async (t) => { await dispatch(toggleReportTemplate(t._id)); setDropdown(null); };
  const handleDelete = async () => { if (deleteModal) { await dispatch(deleteReportTemplate(deleteModal._id)); setDeleteModal(null); }};
  const handleClone = async () => { if (cloneModal && cloneName) { await dispatch(cloneReportTemplate({ id: cloneModal._id, name: cloneName })); setCloneModal(null); setCloneName(''); }};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-7 h-7 text-blue-600" /> Plantillas de Reportes
              </h1>
              <p className="mt-1 text-sm text-gray-500">Gestiona las plantillas para la generación de reportes</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { dispatch(initializeReportTemplates()); dispatch(fetchReportTemplates()); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Inicializar
              </button>
              <button onClick={() => navigate('/report-templates/new')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nueva Plantilla
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats?.total || 0, color: 'blue' },
            { label: 'Activas', value: stats?.active || 0, color: 'green' },
            { label: 'Inactivas', value: stats?.inactive || 0, color: 'gray' },
            { label: 'En uso', value: stats?.inUse || 0, color: 'purple' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Buscar plantillas..." value={filters.search}
                onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={filters.category || ''} onChange={(e) => dispatch(setFilters({ category: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Todas las categorías</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={(e) => dispatch(setFilters({ isActive: e.target.value === '' ? undefined : e.target.value === 'true' }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los estados</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron plantillas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((t) => (
              <div key={t._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{t.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t.description || 'Sin descripción'}</p>
                    </div>
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setDropdown(dropdown === t._id ? null : t._id); }}
                        className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                      {dropdown === t._id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                          <button onClick={() => navigate(`/report-templates/${t._id}/edit`)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          <button onClick={() => navigate(`/report-templates/${t._id}/preview`)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Eye className="w-4 h-4" /> Vista previa
                          </button>
                          <button onClick={() => { setCloneModal(t); setCloneName(`${t.name} (Copia)`); setDropdown(null); }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Copy className="w-4 h-4" /> Clonar
                          </button>
                          <button onClick={() => handleToggle(t)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            {t.isActive ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                            {t.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          {!t.isSystem && (
                            <button onClick={() => { setDeleteModal(t); setDropdown(null); }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {t.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {CATEGORY_LABELS[t.category] || t.category}
                    </span>
                    {t.isSystem && <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">Sistema</span>}
                  </div>
                </div>
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-t text-xs text-gray-500">
                  v{t.version} • {t.usageCount || 0} usos
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Eliminar Plantilla</h3>
            <p className="text-gray-600 mb-4">¿Estás seguro de eliminar "{deleteModal.name}"? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Modal */}
      {cloneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Clonar Plantilla</h3>
            <input type="text" value={cloneName} onChange={(e) => setCloneName(e.target.value)}
              placeholder="Nombre de la nueva plantilla"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setCloneModal(null); setCloneName(''); }} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleClone} disabled={!cloneName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Clonar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
