import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  selectCustomFields,
  selectCustomFieldsLoading,
  selectCustomFieldsError,
  clearCustomFieldsError,
} from '../../../features/data';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import Alert from '../../../components/common/Alert/Alert';
import { FormInput, Plus, Edit, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'input', label: 'Input' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Select' },
  { value: 'select-multiple', label: 'Select Múltiple' },
  { value: 'radio', label: 'Radio' },
  { value: 'space', label: 'Espacio' },
];

const DISPLAY_OPTIONS = [
  { value: 'vulnerability', label: 'Vulnerabilidad' },
  { value: 'audit', label: 'Auditoría' },
  { value: 'finding', label: 'Hallazgo' },
];

const CustomFieldsTab = () => {
  const dispatch = useDispatch();
  const customFields = useSelector(selectCustomFields);
  const loading = useSelector(selectCustomFieldsLoading);
  const error = useSelector(selectCustomFieldsError);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    fieldType: 'input',
    display: 'vulnerability',
    displaySub: '',
    size: 12,
    offset: 0,
    required: false,
    description: '',
    options: [],
  });
  const [formError, setFormError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, field: null });
  const [successMessage, setSuccessMessage] = useState('');
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    dispatch(fetchCustomFields());
  }, [dispatch]);

  const handleRefresh = () => dispatch(fetchCustomFields());

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setFormError('');
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setFormData(prev => ({ ...prev, options: [...prev.options, newOption.trim()] }));
      setNewOption('');
    }
  };

  const handleRemoveOption = (index) => {
    setFormData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  };

  const handleEdit = (field) => {
    setFormData({
      label: field.label || '',
      fieldType: field.fieldType || 'input',
      display: field.display || 'vulnerability',
      displaySub: field.displaySub || '',
      size: field.size || 12,
      offset: field.offset || 0,
      required: field.required || false,
      description: field.description || '',
      options: field.options || [],
    });
    setEditingId(field._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ label: '', fieldType: 'input', display: 'vulnerability', displaySub: '', size: 12, offset: 0, required: false, description: '', options: [] });
    setEditingId(null);
    setShowForm(false);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      setFormError('La etiqueta es requerida');
      return;
    }
    try {
      if (editingId) {
        await dispatch(updateCustomField({ id: editingId, fieldData: formData })).unwrap();
        setSuccessMessage('Campo actualizado');
      } else {
        await dispatch(createCustomField(formData)).unwrap();
        setSuccessMessage('Campo creado');
      }
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setFormError(err || 'Error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.field) {
      try {
        await dispatch(deleteCustomField(deleteModal.field._id)).unwrap();
        setDeleteModal({ open: false, field: null });
        setSuccessMessage('Campo eliminado');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error:', err);
      }
    }
  };

  const getTypeLabel = (type) => FIELD_TYPES.find(t => t.value === type)?.label || type;
  const getDisplayLabel = (display) => DISPLAY_OPTIONS.find(d => d.value === display)?.label || display;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FormInput className="w-5 h-5 text-success-400" />
            Campos Personalizados
          </h2>
          <p className="text-sm text-gray-400 mt-1">Campos adicionales para vulnerabilidades y auditorías</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={RefreshCw} onClick={handleRefresh} disabled={loading} />
          <Button variant="primary" icon={Plus} onClick={() => { resetForm(); setShowForm(true); }}>Nuevo Campo</Button>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => dispatch(clearCustomFieldsError())}>{error}</Alert>}
      {successMessage && <Alert variant="success" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-medium text-white">{editingId ? 'Editar Campo' : 'Nuevo Campo'}</h3>
            {formError && <Alert variant="danger" onClose={() => setFormError('')}>{formError}</Alert>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Etiqueta" name="label" value={formData.label} onChange={handleChange} placeholder="Mi Campo" required />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tipo</label>
                <select name="fieldType" value={formData.fieldType} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500">
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Mostrar en</label>
                <select name="display" value={formData.display} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500">
                  {DISPLAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input label="Tamaño (1-12)" name="size" type="number" min="1" max="12" value={formData.size} onChange={handleChange} />
              <Input label="Offset" name="offset" type="number" min="0" max="11" value={formData.offset} onChange={handleChange} />
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer py-2.5">
                  <input type="checkbox" name="required" checked={formData.required} onChange={handleChange} className="w-4 h-4 rounded border-gray-600 bg-bg-tertiary text-primary-500" />
                  <span className="text-gray-300">Requerido</span>
                </label>
              </div>
            </div>

            <Input label="Descripción" name="description" value={formData.description} onChange={handleChange} placeholder="Descripción del campo" />

            {['select', 'select-multiple', 'radio'].includes(formData.fieldType) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Opciones</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newOption} onChange={(e) => setNewOption(e.target.value)} placeholder="Nueva opción" className="flex-1 px-4 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())} />
                  <Button type="button" variant="ghost" icon={Plus} onClick={handleAddOption}>Agregar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.options.map((opt, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-bg-tertiary rounded-lg text-sm text-gray-300">
                      {opt}
                      <button type="button" onClick={() => handleRemoveOption(i)} className="text-danger-400 hover:text-danger-300">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" variant="primary" loading={loading}>{editingId ? 'Guardar' : 'Crear'}</Button>
            </div>
          </form>
        </Card>
      )}

      {loading && !customFields.length ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-2 border-success-400 border-t-transparent rounded-full animate-spin"></div></div>
      ) : customFields.length === 0 ? (
        <Card className="text-center py-12">
          <FormInput className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No hay campos personalizados</h3>
          <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>Nuevo Campo</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {customFields.map((field) => (
            <Card key={field._id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center">
                  <FormInput className="w-5 h-5 text-success-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{field.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-gray-400">{getTypeLabel(field.fieldType)}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-gray-400">{getDisplayLabel(field.display)}</span>
                    {field.required && <span className="text-xs px-2 py-0.5 rounded bg-danger-500/10 text-danger-400">Requerido</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(field)} />
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteModal({ open: true, field })} className="text-danger-400 hover:bg-danger-500/10" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-danger-500/10 mb-4">
              <AlertTriangle className="w-6 h-6 text-danger-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Eliminar Campo</h3>
            <p className="text-gray-400 mb-6">¿Eliminar <span className="text-white font-medium">{deleteModal.field?.label}</span>?</p>
            <div className="flex gap-3 justify-center">
              <Button variant="ghost" onClick={() => setDeleteModal({ open: false, field: null })}>Cancelar</Button>
              <Button variant="danger" icon={Trash2} onClick={handleDeleteConfirm} loading={loading}>Eliminar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CustomFieldsTab;