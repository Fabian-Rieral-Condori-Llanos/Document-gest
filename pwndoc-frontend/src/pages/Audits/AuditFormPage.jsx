import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Save,
  Building2,
  Users,
  Globe,
  Calendar,
  FileCode,
  Info,
} from 'lucide-react';

// Redux
import {
  fetchAuditById,
  createAudit,
  updateAuditGeneral,
  selectSelectedAudit,
  selectSelectedAuditLoading,
  selectSelectedAuditError,
  clearSelectedAudit,
  clearError,
  AUDIT_TYPES,
  AUDIT_TYPE_LABELS,
} from '../../features/audits';
import { fetchCompanies, selectAllCompanies } from '../../features/companies/companiesSlice';
import { fetchClients, selectAllClients } from '../../features/clients/clientsSlice';
import { selectAllUsers } from '../../features/users/usersSelectors';
import { fetchUsers } from '../../features/users/usersThunks';
import { fetchLanguages, selectLanguages, fetchAuditTypes, selectAuditTypes } from '../../features/data/dataSlice';

// Components
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import { CollaboratorsSelect } from './components';

/**
 * AuditFormPage - Crear o editar auditoría
 */
const AuditFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  // Redux state
  const selectedAudit = useSelector(selectSelectedAudit);
  const loading = useSelector(selectSelectedAuditLoading);
  const error = useSelector(selectSelectedAuditError);
  const companies = useSelector(selectAllCompanies);
  const clients = useSelector(selectAllClients);
  const users = useSelector(selectAllUsers);
  const languages = useSelector(selectLanguages);
  const auditTypes = useSelector(selectAuditTypes);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    auditType: '',
    language: 'es',
    type: 'default',
    company: '',
    client: '',
    collaborators: [],
    reviewers: [],
    date: '',
    date_start: '',
    date_end: '',
    summary: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar datos auxiliares al montar
  useEffect(() => {
    dispatch(fetchCompanies());
    dispatch(fetchClients());
    dispatch(fetchUsers());
    dispatch(fetchLanguages());
    dispatch(fetchAuditTypes());

    return () => {
      dispatch(clearSelectedAudit());
      dispatch(clearError());
    };
  }, [dispatch]);

  // Cargar auditoría si estamos en modo edición
  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchAuditById(id));
    }
  }, [isEditMode, id, dispatch]);

  // Llenar formulario con datos de la auditoría
  useEffect(() => {
    if (isEditMode && selectedAudit) {
      setFormData({
        name: selectedAudit.name || '',
        auditType: selectedAudit.auditType || '',
        language: selectedAudit.language || 'es',
        type: selectedAudit.type || 'default',
        company: typeof selectedAudit.company === 'object' 
          ? selectedAudit.company?._id 
          : selectedAudit.company || '',
        client: typeof selectedAudit.client === 'object' 
          ? selectedAudit.client?._id 
          : selectedAudit.client || '',
        collaborators: selectedAudit.collaborators?.map(c => 
          typeof c === 'object' ? c._id : c
        ) || [],
        reviewers: selectedAudit.reviewers?.map(r => 
          typeof r === 'object' ? r._id : r
        ) || [],
        date: selectedAudit.date || '',
        date_start: selectedAudit.date_start || '',
        date_end: selectedAudit.date_end || '',
        summary: selectedAudit.summary || '',
      });
    }
  }, [selectedAudit, isEditMode]);

  // Filtrar clientes por empresa seleccionada
  const filteredClients = formData.company
    ? clients.filter(c => {
        const clientCompany = typeof c.company === 'object' ? c.company?._id : c.company;
        return clientCompany === formData.company;
      })
    : clients;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpiar cliente si cambia la empresa
    if (name === 'company') {
      setFormData(prev => ({ ...prev, client: '' }));
    }

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCollaboratorsChange = (collaborators) => {
    setFormData(prev => ({ ...prev, collaborators }));
  };

  const handleReviewersChange = (reviewers) => {
    setFormData(prev => ({ ...prev, reviewers }));
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!formData.language) {
      errors.language = 'El idioma es requerido';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const auditData = {
        ...formData,
        // Limpiar campos vacíos
        company: formData.company || undefined,
        client: formData.client || undefined,
        date: formData.date || undefined,
        date_start: formData.date_start || undefined,
        date_end: formData.date_end || undefined,
      };

      if (isEditMode) {
        await dispatch(updateAuditGeneral({ id, data: auditData })).unwrap();
        setSuccessMessage('Auditoría actualizada correctamente');
      } else {
        const result = await dispatch(createAudit(auditData)).unwrap();
        setSuccessMessage('Auditoría creada correctamente');
        // Redirigir a la nueva auditoría
        setTimeout(() => {
          navigate(`/audits/${result._id}`);
        }, 1500);
        return;
      }

      setTimeout(() => {
        navigate('/audits');
      }, 1500);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleBack = () => {
    navigate('/audits');
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" icon={ArrowLeft} onClick={handleBack} />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-400" />
              {isEditMode ? 'Editar Auditoría' : 'Nueva Auditoría'}
            </h1>
            <p className="text-gray-400 mt-1">
              {isEditMode 
                ? 'Modifica la información general de la auditoría' 
                : 'Completa la información para crear una nueva auditoría'}
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
          <Alert variant="success" className="mb-6">
            {successMessage}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-400" />
              Información Básica
            </h3>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nombre de la Auditoría <span className="text-danger-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Auditoría Web - Portal Cliente Q1 2024"
                  className={`w-full px-3 py-2.5 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                    validationErrors.name ? 'border-danger-500' : 'border-gray-700 focus:border-primary-500'
                  }`}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-danger-400">{validationErrors.name}</p>
                )}
              </div>

              {/* Tipo de Auditoría y Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Tipo de Auditoría
                  </label>
                  <select
                    name="auditType"
                    value={formData.auditType}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Seleccionar tipo</option>
                    {auditTypes.map(type => (
                      <option key={type.name} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Clasificación
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  >
                    {Object.entries(AUDIT_TYPES).map(([key, value]) => (
                      <option key={key} value={value}>
                        {AUDIT_TYPE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Idioma */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Idioma <span className="text-danger-400">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 py-2.5 bg-bg-tertiary border rounded-lg text-white focus:outline-none transition-colors ${
                      validationErrors.language ? 'border-danger-500' : 'border-gray-700 focus:border-primary-500'
                    }`}
                  >
                    <option value="">Seleccionar idioma</option>
                    {languages.map(lang => (
                      <option key={lang.locale} value={lang.locale}>
                        {lang.language}
                      </option>
                    ))}
                  </select>
                </div>
                {validationErrors.language && (
                  <p className="mt-1 text-sm text-danger-400">{validationErrors.language}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Cliente y Empresa */}
          <Card>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-info-400" />
              Cliente y Empresa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Empresa
                </label>
                <select
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Seleccionar empresa</option>
                  {companies.map(company => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Cliente
                </label>
                <select
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  disabled={!formData.company && filteredClients.length === 0}
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 disabled:opacity-50"
                >
                  <option value="">Seleccionar cliente</option>
                  {filteredClients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name || client.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Fechas */}
          <Card>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-warning-400" />
              Fechas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Fecha de Reporte
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  name="date_start"
                  value={formData.date_start}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  name="date_end"
                  value={formData.date_end}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </Card>

          {/* Equipo */}
          <Card>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-accent-400" />
              Equipo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colaboradores */}
              <CollaboratorsSelect
                users={users}
                selectedIds={formData.collaborators}
                onChange={handleCollaboratorsChange}
                label="Colaboradores"
                placeholder="Agregar colaboradores..."
              />

              {/* Revisores */}
              <CollaboratorsSelect
                users={users}
                selectedIds={formData.reviewers}
                onChange={handleReviewersChange}
                label="Revisores"
                placeholder="Agregar revisores..."
              />
            </div>
          </Card>

          {/* Resumen */}
          <Card>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-success-400" />
              Resumen Ejecutivo
            </h3>

            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Resumen ejecutivo de la auditoría..."
              rows={5}
              className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleBack}>
              Cancelar
            </Button>

            <Button type="submit" variant="primary" icon={Save} loading={loading}>
              {isEditMode ? 'Guardar Cambios' : 'Crear Auditoría'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuditFormPage;