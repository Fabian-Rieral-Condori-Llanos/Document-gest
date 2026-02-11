import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAuditTypes,
  createAuditType,
  updateAuditType,
  deleteAuditType,
  selectAuditTypes,
  selectAuditTypesLoading,
  selectAuditTypesError,
  clearAuditTypesError,
} from '../../../features/data';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import Alert from '../../../components/common/Alert/Alert';
import {
  FileType,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  GripVertical,
} from 'lucide-react';

/**
 * AuditTypesTab - Gestión de tipos de auditoría
 */
const AuditTypesTab = () => {
  const dispatch = useDispatch();

  // Redux state
  const auditTypes = useSelector(selectAuditTypes);
  const loading = useSelector(selectAuditTypesLoading);
  const error = useSelector(selectAuditTypesError);

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    stage: 'default',
    hidden: [],
  });
  const [formError, setFormError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, auditType: null });
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar tipos de auditoría al montar
  useEffect(() => {
    dispatch(fetchAuditTypes());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchAuditTypes());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleHiddenChange = (field) => {
    setFormData((prev) => {
      const hidden = prev.hidden.includes(field)
        ? prev.hidden.filter(h => h !== field)
        : [...prev.hidden, field];
      return { ...prev, hidden };
    });
  };

  const handleEdit = (auditType) => {
    setFormData({
      name: auditType.name,
      stage: auditType.stage || 'default',
      hidden: auditType.hidden || [],
    });
    setEditingId(auditType._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setFormError('El nombre es requerido');
      return;
    }

    try {
      if (editingId) {
        await dispatch(updateAuditType({ 
          id: editingId, 
          auditTypeData: formData 
        })).unwrap();
        setSuccessMessage('Tipo de auditoría actualizado correctamente');
      } else {
        await dispatch(createAuditType(formData)).unwrap();
        setSuccessMessage('Tipo de auditoría creado correctamente');
      }
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setFormError(err || 'Error al guardar');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', stage: 'default', hidden: [] });
    setEditingId(null);
    setShowForm(false);
    setFormError('');
  };

  const handleDeleteClick = (auditType) => {
    setDeleteModal({ open: true, auditType });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.auditType) {
      try {
        await dispatch(deleteAuditType(deleteModal.auditType._id)).unwrap();
        setDeleteModal({ open: false, auditType: null });
        setSuccessMessage('Tipo de auditoría eliminado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error al eliminar:', err);
      }
    }
  };

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'default': return 'Estándar';
      case 'retest': return 'Re-test';
      case 'multi': return 'Multi-fase';
      default: return stage;
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'default': return 'bg-info-500/10 text-info-400 border-info-500/20';
      case 'retest': return 'bg-warning-500/10 text-warning-400 border-warning-500/20';
      case 'multi': return 'bg-accent-500/10 text-accent-400 border-accent-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileType className="w-5 h-5 text-info-400" />
            Tipos de Auditoría
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Tipos de evaluaciones disponibles en el sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            icon={RefreshCw}
            onClick={handleRefresh}
            disabled={loading}
          />
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Nuevo Tipo
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" onClose={() => dispatch(clearAuditTypesError())}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              {editingId ? 'Editar Tipo de Auditoría' : 'Nuevo Tipo de Auditoría'}
            </h3>
            
            {formError && (
              <Alert variant="danger" onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Pentest Web"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Etapa
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="default">Estándar</option>
                  <option value="retest">Re-test</option>
                  <option value="multi">Multi-fase</option>
                </select>
              </div>
            </div>

            {/* Hidden sections */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ocultar secciones
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hidden.includes('network')}
                    onChange={() => handleHiddenChange('network')}
                    className="w-4 h-4 rounded border-gray-600 bg-bg-tertiary text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Red</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hidden.includes('findings')}
                    onChange={() => handleHiddenChange('findings')}
                    className="w-4 h-4 rounded border-gray-600 bg-bg-tertiary text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Hallazgos</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                {editingId ? 'Guardar Cambios' : 'Crear Tipo'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* List */}
      {loading && !auditTypes.length ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-info-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando tipos de auditoría...</p>
          </div>
        </div>
      ) : auditTypes.length === 0 ? (
        <Card className="text-center py-12">
          <FileType className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No hay tipos de auditoría
          </h3>
          <p className="text-gray-400 mb-4">
            Crea el primer tipo de auditoría
          </p>
          <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
            Nuevo Tipo
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...auditTypes]
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((auditType) => (
            <Card key={auditType._id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-gray-600 cursor-grab" />
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info-500/10">
                  <FileType className="w-5 h-5 text-info-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{auditType.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStageColor(auditType.stage)}`}>
                      {getStageLabel(auditType.stage)}
                    </span>
                    {auditType.hidden?.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {auditType.hidden.length} sección(es) oculta(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit}
                  onClick={() => handleEdit(auditType)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDeleteClick(auditType)}
                  className="text-danger-400 hover:bg-danger-500/10"
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-danger-500/10 mb-4">
                <AlertTriangle className="w-6 h-6 text-danger-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Eliminar Tipo de Auditoría
              </h3>
              <p className="text-gray-400 mb-6">
                ¿Estás seguro de eliminar{' '}
                <span className="text-white font-medium">
                  {deleteModal.auditType?.name}
                </span>
                ?
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteModal({ open: false, auditType: null })}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={handleDeleteConfirm}
                  loading={loading}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuditTypesTab;