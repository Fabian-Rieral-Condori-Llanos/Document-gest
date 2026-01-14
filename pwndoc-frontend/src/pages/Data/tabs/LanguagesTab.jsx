import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLanguages,
  createLanguage,
  deleteLanguage,
  selectLanguages,
  selectLanguagesLoading,
  selectLanguagesError,
  clearLanguagesError,
} from '../../../features/data';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import Alert from '../../../components/common/Alert/Alert';
import {
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

/**
 * LanguagesTab - Gestión de idiomas
 */
const LanguagesTab = () => {
  const dispatch = useDispatch();

  // Redux state
  const languages = useSelector(selectLanguages);
  const loading = useSelector(selectLanguagesLoading);
  const error = useSelector(selectLanguagesError);

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ language: '', locale: '' });
  const [formError, setFormError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, language: null });
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar idiomas al montar
  useEffect(() => {
    dispatch(fetchLanguages());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchLanguages());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.language.trim() || !formData.locale.trim()) {
      setFormError('Todos los campos son requeridos');
      return;
    }

    try {
      await dispatch(createLanguage(formData)).unwrap();
      setFormData({ language: '', locale: '' });
      setShowForm(false);
      setSuccessMessage('Idioma creado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setFormError(err || 'Error al crear idioma');
    }
  };

  const handleDeleteClick = (language) => {
    setDeleteModal({ open: true, language });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.language) {
      try {
        await dispatch(deleteLanguage(deleteModal.language.locale)).unwrap();
        setDeleteModal({ open: false, language: null });
        setSuccessMessage('Idioma eliminado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error al eliminar:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-400" />
            Idiomas
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Idiomas disponibles para auditorías y vulnerabilidades
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
            onClick={() => setShowForm(!showForm)}
          >
            Nuevo Idioma
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" onClose={() => dispatch(clearLanguagesError())}>
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
            <h3 className="text-lg font-medium text-white">Nuevo Idioma</h3>
            
            {formError && (
              <Alert variant="danger" onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre del Idioma"
                name="language"
                value={formData.language}
                onChange={handleChange}
                placeholder="Español"
                required
              />
              <Input
                label="Código Locale"
                name="locale"
                value={formData.locale}
                onChange={handleChange}
                placeholder="es"
                maxLength={10}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ language: '', locale: '' });
                  setFormError('');
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                Crear Idioma
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* List */}
      {loading && !languages.length ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando idiomas...</p>
          </div>
        </div>
      ) : languages.length === 0 ? (
        <Card className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No hay idiomas configurados
          </h3>
          <p className="text-gray-400 mb-4">
            Agrega el primer idioma para el sistema
          </p>
          <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
            Nuevo Idioma
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {languages.map((lang) => (
            <Card key={lang.locale} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500/10">
                  <Globe className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{lang.language}</p>
                  <p className="text-sm text-gray-400 font-mono">{lang.locale}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => handleDeleteClick(lang)}
                className="text-danger-400 hover:bg-danger-500/10"
              />
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
                Eliminar Idioma
              </h3>
              <p className="text-gray-400 mb-6">
                ¿Estás seguro de eliminar el idioma{' '}
                <span className="text-white font-medium">
                  {deleteModal.language?.language}
                </span>
                ?
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteModal({ open: false, language: null })}
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

export default LanguagesTab;