import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAlcanceTemplates,
  fetchAlcanceTemplateStats,
  createAlcanceTemplate,
  updateAlcanceTemplate,
  toggleAlcanceTemplate,
  deleteAlcanceTemplate,
  initializeAlcanceTemplates,
  setFilters,
  setPage,
  setPageSize,
  clearOperationState,
  selectAlcanceTemplatesLoading,
  selectAlcanceTemplateStats,
  selectAlcanceTemplateFilters,
  selectAlcanceTemplatePagination,
  selectAlcanceTemplateOperationLoading,
  selectAlcanceTemplateOperationError,
  selectAlcanceTemplateOperationSuccess,
  selectPaginatedAlcanceTemplates,
  selectAllAlcanceTemplates,
} from '../../features/alcanceTemplates';
import Pagination from '../../components/common/Pagination/Pagination';
import {
  Target,
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
  Palette,
} from 'lucide-react';

// Colores predefinidos para selector
const PRESET_COLORS = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f43f5e', '#84cc16', '#6b7280',
];

// Modal de formulario
const TemplateFormModal = ({ isOpen, onClose, template, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        color: template.color || '#6366f1',
      });
    } else {
      setFormData({ name: '', description: '', color: '#6366f1' });
    }
    setErrors({});
  }, [template, isOpen]);

  const validate = () => {
    const newErrors = {};
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
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-bg-secondary border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {template ? 'Editar Alcance' : 'Nuevo Alcance'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Externa"
              className={`w-full px-4 py-2.5 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del tipo de alcance..."
              rows={3}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Color (para gráficas)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      formData.color === color 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-secondary scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer"
                title="Elegir color personalizado"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: formData.color }}
              />
              <span className="text-sm text-gray-400 font-mono">{formData.color}</span>
            </div>
          </div>

          {/* Actions */}
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
            <h3 className="text-lg font-semibold text-white">Eliminar Alcance</h3>
            <p className="text-sm text-gray-400">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <p className="text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar el alcance{' '}
          <span className="font-semibold text-white">{template?.name}</span>?
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
const AlcanceTemplatesPage = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const paginatedData = useSelector(selectPaginatedAlcanceTemplates);
  const allTemplates = useSelector(selectAllAlcanceTemplates);
  const isLoading = useSelector(selectAlcanceTemplatesLoading);
  const stats = useSelector(selectAlcanceTemplateStats);
  const filters = useSelector(selectAlcanceTemplateFilters);
  const pagination = useSelector(selectAlcanceTemplatePagination);
  const operationLoading = useSelector(selectAlcanceTemplateOperationLoading);
  const operationError = useSelector(selectAlcanceTemplateOperationError);
  const operationSuccess = useSelector(selectAlcanceTemplateOperationSuccess);

  // Local state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    dispatch(fetchAlcanceTemplates());
    dispatch(fetchAlcanceTemplateStats());
  }, [dispatch]);

  // Manejar notificaciones
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

  // Cerrar modales después de operación exitosa
  useEffect(() => {
    if (operationSuccess) {
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedTemplate(null);
      dispatch(fetchAlcanceTemplateStats());
    }
  }, [operationSuccess, dispatch]);

  // Handlers
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
    dispatch(toggleAlcanceTemplate(template._id));
  };

  const handleFormSubmit = (formData) => {
    if (selectedTemplate) {
      dispatch(updateAlcanceTemplate({ id: selectedTemplate._id, data: formData }));
    } else {
      dispatch(createAlcanceTemplate(formData));
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTemplate) {
      dispatch(deleteAlcanceTemplate(selectedTemplate._id));
    }
  };

  const handleInitialize = () => {
    dispatch(initializeAlcanceTemplates());
  };

  const handleSearch = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handlePageChange = (page) => {
    dispatch(setPage(page));
  };

  const handlePageSizeChange = (size) => {
    dispatch(setPageSize(size));
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
              <Target className="w-8 h-8 text-primary-400" />
              Tipos de Alcance
            </h1>
            <p className="text-gray-400 mt-1">
              Gestiona los tipos de alcance disponibles para las evaluaciones
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
              Nuevo Alcance
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
                <p className="text-sm text-gray-400">Total Alcances</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-400" />
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Activos</p>
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
                <p className="text-sm text-gray-400">Inactivos</p>
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
            placeholder="Buscar por nombre o descripción..."
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
        ) : paginatedData.items.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No se encontraron alcances</p>
            {allTemplates.length === 0 && (
              <button
                onClick={handleInitialize}
                className="mt-4 text-primary-400 hover:text-primary-300"
              >
                Inicializar alcances por defecto
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-tertiary border-b border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Color</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Nombre</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 hidden md:table-cell">Descripción</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-300">Uso</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-300">Estado</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginatedData.items.map((template) => {
                    const usageCount = stats?.templates?.find(t => t.id === template._id)?.usageCount || 0;
                    
                    return (
                      <tr key={template._id} className="hover:bg-bg-tertiary/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-md shadow-sm"
                              style={{ backgroundColor: template.color || '#6b7280' }}
                            />
                            <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                              {template.color}
                            </span>
                          </div>
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

            {/* Pagination */}
            <div className="px-6 pb-4">
              <Pagination
                currentPage={paginatedData.page}
                totalItems={paginatedData.total}
                pageSize={paginatedData.pageSize}
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

export default AlcanceTemplatesPage;