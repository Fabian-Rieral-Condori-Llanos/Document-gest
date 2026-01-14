import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchClientById,
  createClient,
  updateClient,
  selectSelectedClient,
  selectClientsLoading,
  selectClientsError,
  clearSelectedClient,
  clearError,
} from '../../features/clients';
import { fetchCompanies, selectAllCompanies } from '../../features/companies';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Alert from '../../components/common/Alert/Alert';
import {
  Building2,
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Smartphone,
  Briefcase,
} from 'lucide-react';

/**
 * ClientFormPage - Página para crear o editar cliente/entidad
 */
const ClientFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  // Redux state
  const selectedClient = useSelector(selectSelectedClient);
  const companies = useSelector(selectAllCompanies);
  const loading = useSelector(selectClientsLoading);
  const error = useSelector(selectClientsError);

  // Form state - guardamos el NOMBRE de la empresa, no el ID
  const [formData, setFormData] = useState({
    email: '',
    firstname: '',
    lastname: '',
    title: '',
    phone: '',
    cell: '',
    company: '', // Este será el NOMBRE de la empresa
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar empresas al montar
  useEffect(() => {
    dispatch(fetchCompanies());

    return () => {
      dispatch(clearSelectedClient());
      dispatch(clearError());
    };
  }, [dispatch]);

  // Cargar cliente si estamos en modo edición
  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchClientById(id));
    }
  }, [isEditMode, id, dispatch]);

  // Llenar formulario con datos del cliente
  useEffect(() => {
    if (isEditMode && selectedClient) {
      // Obtener el nombre de la empresa
      let companyName = '';
      if (selectedClient.company) {
        if (typeof selectedClient.company === 'object') {
          // Si viene populado: { name: "..." }
          companyName = selectedClient.company.name || '';
        } else {
          // Si viene como ID, buscar el nombre en la lista de empresas
          const found = companies.find(c => c._id === selectedClient.company);
          companyName = found?.name || '';
        }
      }
      
      setFormData({
        email: selectedClient.email || '',
        firstname: selectedClient.firstname || '',
        lastname: selectedClient.lastname || '',
        title: selectedClient.title || '',
        phone: selectedClient.phone || '',
        cell: selectedClient.cell || '',
        company: companyName,
      });
    }
  }, [selectedClient, isEditMode, companies]);

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

  // Handler especial para el select de empresa - guarda el NOMBRE
  const handleCompanyChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData(prev => ({ ...prev, company: '' }));
      return;
    }
    
    // Buscar el nombre de la empresa por su ID
    const selectedCompany = companies.find(c => c._id === selectedId);
    setFormData(prev => ({ 
      ...prev, 
      company: selectedCompany?.name || '' 
    }));
  };

  // Obtener el ID de la empresa actual para el select
  const getSelectedCompanyId = () => {
    if (!formData.company) return '';
    const found = companies.find(c => c.name === formData.company);
    return found?._id || '';
  };

  const validate = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      // El backend espera el NOMBRE de la empresa, no el ID
      const clientData = {
        email: formData.email,
        firstname: formData.firstname || undefined,
        lastname: formData.lastname || undefined,
        title: formData.title || undefined,
        phone: formData.phone || undefined,
        cell: formData.cell || undefined,
        company: formData.company || undefined, // Enviar el nombre
      };

      if (isEditMode) {
        await dispatch(updateClient({ id, clientData })).unwrap();
        setSuccessMessage('Entidad actualizada correctamente');
        // Redirigir después de actualizar
        setTimeout(() => {
          navigate('/clients');
        }, 1000);
      } else {
        await dispatch(createClient(clientData)).unwrap();
        setSuccessMessage('Entidad creada correctamente');
        setTimeout(() => {
          navigate('/clients');
        }, 1000);
      }
    } catch (err) {
      console.error('Error al guardar entidad:', err);
    }
  };

  const handleBack = () => {
    navigate('/clients');
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" icon={ArrowLeft} onClick={handleBack} />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary-400" />
              {isEditMode ? 'Editar Entidad' : 'Nueva Entidad'}
            </h1>
            <p className="text-gray-400 mt-1">
              {isEditMode
                ? `Editando: ${selectedClient?.email || ''}`
                : 'Crear un nuevo contacto/cliente'}
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
            {/* Información de contacto */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-400" />
                Información de Contacto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="Juan"
                  icon={User}
                />

                <Input
                  label="Apellido"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Pérez"
                  icon={User}
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contacto@empresa.com"
                  error={validationErrors.email}
                  icon={Mail}
                  required
                />

                <Input
                  label="Cargo/Título"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Gerente de TI"
                  icon={Briefcase}
                />
              </div>
            </div>

            {/* Teléfonos */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-info-400" />
                Teléfonos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Teléfono"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+591 2 1234567"
                  icon={Phone}
                />

                <Input
                  label="Celular"
                  name="cell"
                  type="tel"
                  value={formData.cell}
                  onChange={handleChange}
                  placeholder="+591 71234567"
                  icon={Smartphone}
                />
              </div>
            </div>

            {/* Empresa */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent-400" />
                Empresa
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Empresa asociada
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="company"
                    value={getSelectedCompanyId()}
                    onChange={handleCompanyChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none"
                  >
                    <option value="">Sin empresa</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
              <Button type="button" variant="ghost" onClick={handleBack}>
                Cancelar
              </Button>

              <Button type="submit" variant="primary" icon={Save} loading={loading}>
                {isEditMode ? 'Guardar Cambios' : 'Crear Entidad'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ClientFormPage;