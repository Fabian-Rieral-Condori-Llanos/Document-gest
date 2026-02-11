import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCustomSections,
  createCustomSection,
  updateCustomSection,
  deleteCustomSection,
  fetchLanguages,
  selectCustomSections,
  selectCustomSectionsLoading,
  selectCustomSectionsError,
  selectLanguages,
  clearCustomSectionsError,
} from '../../../features/data';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import Alert from '../../../components/common/Alert/Alert';
import { LayoutList, Plus, Edit, Trash2, RefreshCw, AlertTriangle, Globe } from 'lucide-react';

const CustomSectionsTab = () => {
  const dispatch = useDispatch();
  const customSections = useSelector(selectCustomSections);
  const languages = useSelector(selectLanguages);
  const loading = useSelector(selectCustomSectionsLoading);
  const error = useSelector(selectCustomSectionsError);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ field: '', name: '', locale: '', icon: '', order: 0 });
  const [formError, setFormError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, section: null });
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedLocale, setSelectedLocale] = useState('');

  useEffect(() => {
    dispatch(fetchCustomSections());
    dispatch(fetchLanguages());
  }, [dispatch]);

  useEffect(() => {
    if (languages.length > 0 && !selectedLocale) {
      setSelectedLocale(languages[0].locale);
      setFormData(prev => ({ ...prev, locale: languages[0].locale }));
    }
  }, [languages, selectedLocale]);

  const handleRefresh = () => dispatch(fetchCustomSections());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleEdit = (section) => {
    setFormData({
      field: section.field || '',
      name: section.name || '',
      locale: section.locale || '',
      icon: section.icon || '',
      order: section.order || 0,
    });
    setEditingId(section._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ field: '', name: '', locale: selectedLocale, icon: '', order: 0 });
    setEditingId(null);
    setShowForm(false);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.field.trim() || !formData.name.trim() || !formData.locale) {
      setFormError('Campo, nombre e idioma son requeridos');
      return;
    }
    try {
      if (editingId) {
        await dispatch(updateCustomSection({ id: editingId, sectionData: formData })).unwrap();
        setSuccessMessage('Sección actualizada');
      } else {
        await dispatch(createCustomSection(formData)).unwrap();
        setSuccessMessage('Sección creada');
      }
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setFormError(err || 'Error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.section) {
      try {
        await dispatch(deleteCustomSection(deleteModal.section._id)).unwrap();
        setDeleteModal({ open: false, section: null });
        setSuccessMessage('Sección eliminada');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error:', err);
      }
    }
  };

  const filteredSections = customSections.filter(s => !selectedLocale || s.locale === selectedLocale);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <LayoutList className="w-5 h-5 text-info-400" />
            Secciones Personalizadas
          </h2>
          <p className="text-sm text-gray-400 mt-1">Secciones adicionales para reportes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={RefreshCw} onClick={handleRefresh} disabled={loading} />
          <Button variant="primary" icon={Plus} onClick={() => { resetForm(); setShowForm(true); }}>Nueva Sección</Button>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => dispatch(clearCustomSectionsError())}>{error}</Alert>}
      {successMessage && <Alert variant="success" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-medium text-white">{editingId ? 'Editar Sección' : 'Nueva Sección'}</h3>
            {formError && <Alert variant="danger" onClose={() => setFormError('')}>{formError}</Alert>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Campo (ID único)" name="field" value={formData.field} onChange={handleChange} placeholder="my_section" required />
              <Input label="Nombre" name="name" value={formData.name} onChange={handleChange} placeholder="Mi Sección" required />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Idioma</label>
                <select name="locale" value={formData.locale} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500" required>
                  <option value="">Seleccionar</option>
                  {languages.map(l => <option key={l.locale} value={l.locale}>{l.language}</option>)}
                </select>
              </div>
              <Input label="Icono (opcional)" name="icon" value={formData.icon} onChange={handleChange} placeholder="mdi-file" />
              <Input label="Orden" name="order" type="number" value={formData.order} onChange={handleChange} />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" variant="primary" loading={loading}>{editingId ? 'Guardar' : 'Crear'}</Button>
            </div>
          </form>
        </Card>
      )}

      {languages.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Globe className="w-5 h-5 text-gray-400" />
          <button onClick={() => setSelectedLocale('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!selectedLocale ? 'bg-primary-500 text-white' : 'bg-bg-tertiary text-gray-400 hover:text-white'}`}>Todos</button>
          {languages.map(l => (
            <button key={l.locale} onClick={() => setSelectedLocale(l.locale)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedLocale === l.locale ? 'bg-primary-500 text-white' : 'bg-bg-tertiary text-gray-400 hover:text-white'}`}>{l.language}</button>
          ))}
        </div>
      )}

      {loading && !customSections.length ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-2 border-info-400 border-t-transparent rounded-full animate-spin"></div></div>
      ) : filteredSections.length === 0 ? (
        <Card className="text-center py-12">
          <LayoutList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No hay secciones</h3>
          <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>Nueva Sección</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSections.sort((a, b) => (a.order || 0) - (b.order || 0)).map((section) => (
            <Card key={section._id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-info-500/10 flex items-center justify-center">
                  <LayoutList className="w-5 h-5 text-info-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{section.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 font-mono">{section.field}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-gray-400">{section.locale}</span>
                    {section.order > 0 && <span className="text-xs text-gray-500">Orden: {section.order}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(section)} />
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteModal({ open: true, section })} className="text-danger-400 hover:bg-danger-500/10" />
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
            <h3 className="text-lg font-semibold text-white mb-2">Eliminar Sección</h3>
            <p className="text-gray-400 mb-6">¿Eliminar <span className="text-white font-medium">{deleteModal.section?.name}</span>?</p>
            <div className="flex gap-3 justify-center">
              <Button variant="ghost" onClick={() => setDeleteModal({ open: false, section: null })}>Cancelar</Button>
              <Button variant="danger" icon={Trash2} onClick={handleDeleteConfirm} loading={loading}>Eliminar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CustomSectionsTab;