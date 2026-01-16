import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProcedureTemplates,
  fetchProcedureTemplateStats,
  createProcedureTemplate,
  updateProcedureTemplate,
  toggleProcedureTemplate,
  deleteProcedureTemplate,
  initializeProcedureTemplates,
  setFilters,
  clearOperationState,
  selectAllProcedureTemplates,
  selectProcedureTemplatesLoading,
  selectProcedureTemplateStats,
  selectProcedureTemplateFilters,
  selectProcedureTemplateOperationLoading,
  selectProcedureTemplateOperationError,
  selectProcedureTemplateOperationSuccess,
  selectFilteredProcedureTemplates,
} from '../../features/procedureTemplates';
import Pagination from '../../components/common/Pagination/Pagination';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Download,
  BarChart3,
} from 'lucide-react';

// Modal de formulario
const TemplateFormModal = ({ isOpen, onClose, template, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (template) {
      setFormData({
        code: template.code || '',
        name: template.name || '',
        description: template.description || '',
      });
    } else {
      setFormData({ code: '', name: '', description: '' });
    }
    setErrors({});
  }, [template, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.code.trim()) newErrors.code = 'El código es requerido';
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-bg-secondary border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Código <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="PR01"
              className={`w-full px-4 py-2.5 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.code ? 'border-red-500' : 'border-gray-600'
              }`}
              disabled={!!template}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-400">{errors.code}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Evaluación por Solicitud de Entidades"
              className={`w-full px-4 py-2.5 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del procedimiento..."
              rows={3}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {template ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
          <span className="font-semibold text-white">{template?.code} - {template?.name}</span>?
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

// Componente principal
const ProcedureTemplatesPage = () => {
  const dispatch = useDispatch();
  
  const filteredTemplates = useSelector(selectFilteredProcedureTemplates);
  const allTemplates = useSelector(selectAllProcedureTemplates);
  const isLoading = useSelector(selectProcedureTemplatesLoading);
  const stats = useSelector(selectProcedureTemplateStats);
  const filters = useSelector(selectProcedureTemplateFilters);
  const operationLoading = useSelector(selectProcedureTemplateOperationLoading);
  const operationError = useSelector(selectProcedureTemplateOperationError);
  const operationSuccess = useSelector(selectProcedureTemplateOperationSuccess);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  
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
  }, [filters.search]);

  useEffect(() => {
    dispatch(fetchProcedureTemplates());
    dispatch(fetchProcedureTemplateStats());
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
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedTemplate(null);
      dispatch(fetchProcedureTemplateStats());
    }
  }, [operationSuccess, dispatch]);

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setIsFormModalOpen(true);
  };

  const handleDelete = (template) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const handleToggle = (template) => {
    dispatch(toggleProcedureTemplate(template._id));
  };

  const handleFormSubmit = (formData) => {
    if (selectedTemplate) {
      dispatch(updateProcedureTemplate({ id: selectedTemplate._id, data: formData }));
    } else {
      dispatch(createProcedureTemplate(formData));
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTemplate) {
      dispatch(deleteProcedureTemplate(selectedTemplate._id));
    }
  };

  const handleInitialize = () => {
    dispatch(initializeProcedureTemplates());
  };

  const handleSearch = (e) => {
    dispatch(setFilters({ search: e.target.value }));
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
              Plantillas de Procedimientos
            </h1>
            <p className="text-gray-400 mt-1">
              Gestiona las plantillas de procedimientos para las evaluaciones
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
              onClick={handleCreate}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Plantillas</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
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
                <p className="text-2xl font-bold text-green-400">{stats.active}</p>
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
                <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearch}
            placeholder="Buscar por código, nombre o descripción..."
            className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
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
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Código</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Nombre</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 hidden md:table-cell">Descripción</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-300">Uso</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-300">Estado</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginatedTemplates.map((template) => {
                    const usageCount = stats?.templates?.find(t => t.code === template.code)?.usageCount || 0;
                    
                    return (
                      <tr key={template._id} className="hover:bg-bg-tertiary/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary-500/10 text-primary-400 font-mono text-sm font-medium">
                            {template.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">{template.name}</span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-gray-400 text-sm line-clamp-2">
                            {template.description || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-gray-300">
                            <BarChart3 className="w-4 h-4" />
                            {usageCount}
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
                                Activo
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-3.5 h-3.5" />
                                Inactivo
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(template)}
                              className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(template)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
      <TemplateFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onSubmit={handleFormSubmit}
        isLoading={operationLoading}
      />

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
    </div>
  );
};

export default ProcedureTemplatesPage;