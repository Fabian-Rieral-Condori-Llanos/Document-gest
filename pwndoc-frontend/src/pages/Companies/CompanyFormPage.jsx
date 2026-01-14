import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchCompanyById,
  createCompany,
  updateCompany,
  selectSelectedCompany,
  selectCompaniesLoading,
  selectCompaniesError,
  clearSelectedCompany,
  clearError,
} from '../../features/companies';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Alert from '../../components/common/Alert/Alert';
import {
  Landmark,
  ArrowLeft,
  Save,
  Building2,
  Image,
  Upload,
  X,
} from 'lucide-react';

/**
 * CompanyFormPage - Página para crear o editar empresa
 */
const CompanyFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  const isEditMode = Boolean(id);

  // Redux state
  const selectedCompany = useSelector(selectSelectedCompany);
  const loading = useSelector(selectCompaniesLoading);
  const error = useSelector(selectCompaniesError);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    logo: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [logoPreview, setLogoPreview] = useState('');

  // Cargar empresa si estamos en modo edición
  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchCompanyById(id));
    }

    return () => {
      dispatch(clearSelectedCompany());
      dispatch(clearError());
    };
  }, [isEditMode, id, dispatch]);

  // Llenar formulario con datos de la empresa
  useEffect(() => {
    if (isEditMode && selectedCompany) {
      setFormData({
        name: selectedCompany.name || '',
        shortName: selectedCompany.shortName || '',
        logo: selectedCompany.logo || '',
      });
      setLogoPreview(selectedCompany.logo || '');
    }
  }, [selectedCompany, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setValidationErrors((prev) => ({
        ...prev,
        logo: 'El archivo debe ser una imagen',
      }));
      return;
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setValidationErrors((prev) => ({
        ...prev,
        logo: 'La imagen no debe superar 2MB',
      }));
      return;
    }

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setFormData((prev) => ({
        ...prev,
        logo: base64,
      }));
      setLogoPreview(base64);
      setValidationErrors((prev) => ({
        ...prev,
        logo: '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo: '',
    }));
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre de la empresa es requerido';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const companyData = {
        name: formData.name,
        shortName: formData.shortName || undefined,
        logo: formData.logo || undefined,
      };

      if (isEditMode) {
        await dispatch(updateCompany({ id, companyData })).unwrap();
        setSuccessMessage('Empresa actualizada correctamente');
        // Redirigir después de actualizar
        setTimeout(() => {
          navigate('/companies');
        }, 1000);
      } else {
        await dispatch(createCompany(companyData)).unwrap();
        setSuccessMessage('Empresa creada correctamente');
        setTimeout(() => {
          navigate('/companies');
        }, 1000);
      }
    } catch (err) {
      console.error('Error al guardar empresa:', err);
    }
  };

  const handleBack = () => {
    navigate('/companies');
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" icon={ArrowLeft} onClick={handleBack} />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <Landmark className="w-8 h-8 text-accent-400" />
              {isEditMode ? 'Editar Empresa' : 'Nueva Empresa'}
            </h1>
            <p className="text-gray-400 mt-1">
              {isEditMode
                ? `Editando: ${selectedCompany?.name || ''}`
                : 'Crear una nueva empresa u organización'}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="mb-6" onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent-400" />
                Información de la Empresa
              </h3>

              <div className="space-y-4">
                <Input
                  label="Nombre de la Empresa"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="AGETIC"
                  error={validationErrors.name}
                  icon={Landmark}
                  required
                />

                <Input
                  label="Nombre Corto / Siglas"
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleChange}
                  placeholder="AGETIC"
                  icon={Building2}
                />
              </div>
            </div>

            {/* Logo */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-info-400" />
                Logo de la Empresa
              </h3>

              <div className="space-y-4">
                {/* Preview */}
                {logoPreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 rounded-lg object-cover bg-bg-tertiary border border-gray-700"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-2">Logo actual</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={X}
                        onClick={handleRemoveLogo}
                        className="text-danger-400"
                      >
                        Eliminar logo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-accent-500 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-1">
                      Haz clic para subir una imagen
                    </p>
                    <p className="text-sm text-gray-500">PNG, JPG hasta 2MB</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />

                {validationErrors.logo && (
                  <p className="text-sm text-danger-400">{validationErrors.logo}</p>
                )}

                {logoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={Upload}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Cambiar imagen
                  </Button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
              <Button type="button" variant="ghost" onClick={handleBack}>
                Cancelar
              </Button>

              <Button type="submit" variant="primary" icon={Save} loading={loading}>
                {isEditMode ? 'Guardar Cambios' : 'Crear Empresa'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CompanyFormPage;