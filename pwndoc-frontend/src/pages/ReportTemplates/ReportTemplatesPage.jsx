import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchReportTemplates,
  fetchReportTemplateStats,
  fetchReportTemplateCategories,
  toggleReportTemplate,
  deleteReportTemplate,
  cloneReportTemplate,
  initializeReportTemplates,
  setFilters,
  clearFilters,
  clearOperationState,
  selectFilteredReportTemplates,
  selectAllReportTemplates,
  selectReportTemplatesLoading,
  selectReportTemplateStats,
  selectReportTemplateStatsLoading,
  selectReportTemplateCategories,
  selectReportTemplateFilters,
  selectReportTemplateOperationLoading,
  selectReportTemplateOperationSuccess,
  selectReportTemplateOperationError,
} from '../../features/reportTemplates';
import Pagination from '../../components/common/Pagination/Pagination';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Download,
  BarChart3,
  Eye,
  Upload,
  Filter,
} from 'lucide-react';

// Mapeo de categorías
const CATEGORY_LABELS = {
  'security-audit': 'Auditoría de Seguridad',
  'vulnerability-assessment': 'Evaluación de Vulnerabilidades',
  'pentest': 'Prueba de Penetración',
  'compliance': 'Cumplimiento',
  'custom': 'Personalizado',
};

const CATEGORY_COLORS = {
  'security-audit': 'bg-info-500/10 text-info-400',
  'vulnerability-assessment': 'bg-warning-500/10 text-warning-400',
  'pentest': 'bg-danger-500/10 text-danger-400',
  'compliance': 'bg-accent-500/10 text-accent-400',
  'custom': 'bg-gray-500/10 text-gray-400',
};

// Modal de confirmación de eliminación
const DeleteConfirmModal = ({ isOpen, onClose, template, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-bg-secondary border border-gray-700 rounded-xl w-full max-w-md mx-4 shadow-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Eliminar Plantilla</h3>
            <p className="text-sm text-gray-400">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <p className="text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar la plantilla{' '}
          <span className="font-semibold text-white">"{template?.name}"</span>?
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de clonar plantilla
const CloneModal = ({ isOpen, onClose, template, onConfirm, isLoading }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (template) {
      setName(`${template.name} (Copia)`);
    }
  }, [template]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-bg-secondary border border-gray-700 rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Clonar Plantilla</h2>
          <button onClick={onClose} className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre de la nueva plantilla
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la plantilla"
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(name)}
              disabled={isLoading || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Clonar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal
const ReportTemplatesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const filteredTemplates = useSelector(selectFilteredReportTemplates);
  const allTemplates = useSelector(selectAllReportTemplates);
  const isLoading = useSelector(selectReportTemplatesLoading);
  const stats = useSelector(selectReportTemplateStats);
  const statsLoading = useSelector(selectReportTemplateStatsLoading);
  const categories = useSelector(selectReportTemplateCategories);
  const filters = useSelector(selectReportTemplateFilters);
  const operationLoading = useSelector(selectReportTemplateOperationLoading);
  const operationError = useSelector(selectReportTemplateOperationError);
  const operationSuccess = useSelector(selectReportTemplateOperationSuccess);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calcular datos paginados
  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTemplates.slice(startIndex, endIndex);
  }, [filteredTemplates, currentPage, pageSize]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.category, filters.isActive]);

  useEffect(() => {
    dispatch(fetchReportTemplates());
    dispatch(fetchReportTemplateStats());
    dispatch(fetchReportTemplateCategories());
  }, [dispatch]);

  useEffect(() => {
    if (operationSuccess || operationError) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
        dispatch(clearOperationState());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [operationSuccess, operationError, dispatch]);

  useEffect(() => {
    if (operationSuccess) {
      setIsDeleteModalOpen(false);
      setIsCloneModalOpen(false);
      setSelectedTemplate(null);
      dispatch(fetchReportTemplateStats());
    }
  }, [operationSuccess, dispatch]);

  const handleSearch = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handleCategoryFilter = (category) => {
    dispatch(setFilters({ category: category === filters.category ? '' : category }));
  };

  const handleStatusFilter = (isActive) => {
    dispatch(setFilters({ isActive: isActive === filters.isActive ? undefined : isActive }));
  };

  const handleToggle = (template) => {
    dispatch(toggleReportTemplate(template._id));
  };

  const handleDelete = (template) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTemplate) {
      dispatch(deleteReportTemplate(selectedTemplate._id));
    }
  };

  const handleClone = (template) => {
    setSelectedTemplate(template);
    setIsCloneModalOpen(true);
  };

  const handleCloneConfirm = (name) => {
    if (selectedTemplate && name) {
      dispatch(cloneReportTemplate({ id: selectedTemplate._id, name }));
    }
  };

  const handleInitialize = () => {
    dispatch(initializeReportTemplates());
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Notificación */}
      {showNotification && (operationSuccess || operationError) && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          operationSuccess ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
        }`}>
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
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-400" />
              Plantillas de Reportes
            </h1>
            <p className="text-gray-400 mt-1">
              Gestiona las plantillas para la generación de informes
            </p>
          </div>

          <div className="flex items-center gap-3">
            {allTemplates.length === 0 && (
              <button
                onClick={handleInitialize}
                disabled={operationLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Inicializar Por Defecto
              </button>
            )}
            <button
              onClick={() => navigate('/report-templates/new')}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Plantilla
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Plantillas</p>
                <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-400" />
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Activas</p>
                <p className="text-2xl font-bold text-green-400">{stats.active || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ToggleRight className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Inactivas</p>
                <p className="text-2xl font-bold text-gray-400">{stats.inactive || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">En Uso</p>
                <p className="text-2xl font-bold text-info-400">{stats.inUse || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-info-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-info-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Buscador */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={handleSearch}
              placeholder="Buscar por nombre o descripción..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de categoría */}
          <select
            value={filters.category || ''}
            onChange={(e) => dispatch(setFilters({ category: e.target.value }))}
            className="px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Filtro de estado */}
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => dispatch(setFilters({ isActive: e.target.value === '' ? undefined : e.target.value === 'true' }))}
            className="px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </select>

          {/* Botón limpiar filtros */}
          {(filters.search || filters.category || filters.isActive !== undefined) && (
            <button
              onClick={() => dispatch(clearFilters())}
              className="px-4 py-2.5 text-gray-400 hover:text-white hover:bg-bg-tertiary border border-gray-600 rounded-lg transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No se encontraron plantillas</p>
            {allTemplates.length === 0 && (
              <button
                onClick={handleInitialize}
                className="mt-4 text-primary-400 hover:text-primary-300"
              >
                Inicializar plantillas por defecto
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-tertiary border-b border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Nombre</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 hidden lg:table-cell">Descripción</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-300">Categoría</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-300">Versión</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-300">Uso</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-300">Estado</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginatedTemplates.map((template) => (
                    <tr key={template._id} className="hover:bg-bg-tertiary/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-white font-medium">{template.name}</span>
                          {template.isSystem && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-500/10 text-accent-400">
                              Sistema
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-gray-400 text-sm line-clamp-2">
                          {template.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${CATEGORY_COLORS[template.category] || CATEGORY_COLORS.custom}`}>
                          {CATEGORY_LABELS[template.category] || template.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-300">v{template.version || 1}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-gray-300">
                          <BarChart3 className="w-4 h-4" />
                          {template.usageCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggle(template)}
                          disabled={operationLoading}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            template.isActive
                              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                          }`}
                        >
                          {template.isActive ? (
                            <>
                              <ToggleRight className="w-3.5 h-3.5" />
                              Activa
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5" />
                              Inactiva
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/report-templates/${template._id}/preview`)}
                            className="p-2 text-gray-400 hover:text-info-400 hover:bg-info-500/10 rounded-lg transition-colors"
                            title="Vista previa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/report-templates/${template._id}/edit`)}
                            className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleClone(template)}
                            className="p-2 text-gray-400 hover:text-accent-400 hover:bg-accent-500/10 rounded-lg transition-colors"
                            title="Clonar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {!template.isSystem && (
                            <button
                              onClick={() => handleDelete(template)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-6 pb-4">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredTemplates.length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[5, 10, 25, 50]}
              />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onConfirm={handleDeleteConfirm}
        isLoading={operationLoading}
      />

      <CloneModal
        isOpen={isCloneModalOpen}
        onClose={() => {
          setIsCloneModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onConfirm={handleCloneConfirm}
        isLoading={operationLoading}
      />
    </div>
  );
};

export default ReportTemplatesPage;
