import { useEffect, useState, useMemo } from 'react';
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
  AlertCircle,
  Layers,
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
import SearchableSelect from '../../components/common/SearchableSelect/SearchableSelect';
import { 
  CollaboratorsSelect, 
  ProcedureTemplateSelect 
} from './components';

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
    company: '',
    client: '',
    collaborators: [],
    reviewers: [],
    date: '',
    date_start: '',
    date_end: '',
    summary: '',
    procedureTemplateId: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

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

  // Llenar formulario con datos de la auditoría cuando se carga
  useEffect(() => {
    if (isEditMode && selectedAudit && companies.length > 0 && clients.length > 0 && !isDataLoaded) {
      console.log('Cargando datos de auditoría:', selectedAudit);
      
      // Obtener IDs de company y client
      // El backend devuelve: { _id, name, ... } para company y client
      let companyId = '';
      if (selectedAudit.company) {
        if (typeof selectedAudit.company === 'object' && selectedAudit.company._id) {
          companyId = selectedAudit.company._id;
        } else if (typeof selectedAudit.company === 'object' && selectedAudit.company.name) {
          // Si viene solo con name, buscar el ID en companies
          const foundCompany = companies.find(c => c.name === selectedAudit.company.name);
          companyId = foundCompany?._id || '';
        } else if (typeof selectedAudit.company === 'string') {
          companyId = selectedAudit.company;
        }
      }

      let clientId = '';
      if (selectedAudit.client) {
        if (typeof selectedAudit.client === 'object' && selectedAudit.client._id) {
          clientId = selectedAudit.client._id;
        } else if (typeof selectedAudit.client === 'object' && (selectedAudit.client.email || selectedAudit.client.firstname)) {
          // Si viene sin _id, buscar en clients
          const foundClient = clients.find(c => 
            c.email === selectedAudit.client.email || 
            (c.firstname === selectedAudit.client.firstname && c.lastname === selectedAudit.client.lastname)
          );
          clientId = foundClient?._id || '';
        } else if (typeof selectedAudit.client === 'string') {
          clientId = selectedAudit.client;
        }
      }

      // Formatear fechas para input type="date"
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      const audit = selectedAudit.audit || {};

      setFormData({
        name: audit.name || '',
        auditType: audit.auditType || '',
        language: audit.language || 'es',
        company: audit.company?._id || audit.company || '',
        client: audit.client?._id || audit.client || '',
        collaborators: audit.collaborators?.map(c =>
          typeof c === 'object' ? c._id : c
        ) || [],
        reviewers: audit.reviewers?.map(r =>
          typeof r === 'object' ? r._id : r
        ) || [],
        date: formatDate(audit.date),
        date_start: formatDate(audit.date_start),
        date_end: formatDate(audit.date_end),
        summary: audit.summary || '',
        procedureTemplateId:
          typeof audit.procedureTemplate === 'object'
            ? audit.procedureTemplate?._id
            : audit.procedureTemplate || '',
      });
      
      setIsDataLoaded(true);
    }
  }, [selectedAudit, isEditMode, companies, clients, isDataLoaded]);

  // Reset isDataLoaded cuando cambia el ID
  useEffect(() => {
    setIsDataLoaded(false);
  }, [id]);

  // Opciones de empresas para SearchableSelect
  const companyOptions = useMemo(() => {
    return companies.map(company => ({
      value: company._id,
      label: company.name,
      subtitle: company.shortName || null,
    }));
  }, [companies]);

  // Opciones de clientes con empresa asociada
  const clientOptions = useMemo(() => {
    // Si hay empresa seleccionada, filtrar clientes
    let clientsToShow = clients;
    
    if (formData.company) {
      const selectedCompanyObj = companies.find(c => c._id === formData.company);
      const selectedCompanyName = selectedCompanyObj?.name;
      
      if (selectedCompanyName) {
        clientsToShow = clients.filter(client => {
          const clientCompanyName = typeof client.company === 'object' 
            ? client.company?.name 
            : '';
          return clientCompanyName === selectedCompanyName;
        });
      }
    }
    
    return clientsToShow.map(client => {
      let companyName = '';
      if (client.company && typeof client.company === 'object') {
        companyName = client.company.name || '';
      }

      const clientName = client.name || 
        `${client.firstname || ''} ${client.lastname || ''}`.trim() || 
        client.email || 
        'Sin nombre';

      return {
        value: client._id,
        label: clientName,
        subtitle: companyName || 'Sin empresa',
        group: companyName || 'Sin empresa',
      };
    });
  }, [clients, companies, formData.company]);

  // Opciones de tipos de auditoría
  const auditTypeOptions = useMemo(() => {
    return auditTypes.map(type => ({
      value: type.name,
      label: type.name,
    }));
  }, [auditTypes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCompanyChange = (value) => {
    // Al cambiar empresa, limpiar cliente
    setFormData(prev => ({ ...prev, company: value, client: '' }));
  };

  const handleClientChange = (value) => {
    setFormData(prev => ({ ...prev, client: value }));
  };

  const handleAuditTypeChange = (value) => {
    setFormData(prev => ({ ...prev, auditType: value }));
  };

  const handleCollaboratorsChange = (collaborators) => {
    setFormData(prev => ({ ...prev, collaborators }));
  };

  const handleReviewersChange = (reviewers) => {
    setFormData(prev => ({ ...prev, reviewers }));
  };

  const handleProcedureTemplateChange = (templateId) => {
    setFormData(prev => ({ ...prev, procedureTemplateId: templateId }));
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
        name: formData.name,
        auditType: formData.auditType || undefined,
        language: formData.language,
        company: formData.company || undefined,
        client: formData.client || undefined,
        collaborators: formData.collaborators,
        reviewers: formData.reviewers,
        date: formData.date || undefined,
        date_start: formData.date_start || undefined,
        date_end: formData.date_end || undefined,
        summary: formData.summary || undefined,
      };

      if (isEditMode) {
        // En edición, si tiene procedureTemplateId y no tenía antes, agregarlo
        if (formData.procedureTemplateId) {
          auditData.procedureTemplateId = formData.procedureTemplateId;
        }
        await dispatch(updateAuditGeneral({ id, data: auditData })).unwrap();
        setSuccessMessage('Auditoría actualizada correctamente');
      } else {
        // En creación, siempre enviar procedureTemplateId si existe
        if (formData.procedureTemplateId) {
          auditData.procedureTemplateId = formData.procedureTemplateId;
        }
        const result = await dispatch(createAudit(auditData)).unwrap();
        setSuccessMessage('Auditoría creada correctamente');
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

  // Verificar si la auditoría tiene procedimiento asignado
  // IMPORTANTE: Este hook debe estar ANTES de cualquier return condicional
  const hasProcedureTemplate = useMemo(() => {
    if (!selectedAudit) return false;
    
    // Tiene secciones definidas
    if (selectedAudit.sections && selectedAudit.sections.length > 0) {
      return true;
    }
    
    // Tiene procedure con origen
    if (selectedAudit.procedure && selectedAudit.procedure.origen) {
      return true;
    }
    
    return false;
  }, [selectedAudit]);

  // Loading en modo edición
  if (isEditMode && loading && !selectedAudit) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400">Cargando auditoría...</p>
        </div>
      </div>
    );
  }

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
                ? 'Modifica los datos de la auditoría'
                : 'Completa la información para crear una nueva auditoría'
              }
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="error" className="mb-6">
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
                  placeholder="Ej: Evaluación de Seguridad - Sistema X"
                  className={`w-full px-3 py-2.5 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                    validationErrors.name ? 'border-danger-500' : 'border-gray-700 focus:border-primary-500'
                  }`}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-danger-400">{validationErrors.name}</p>
                )}
              </div>

              {/* Tipo de auditoría e Idioma */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableSelect
                  value={formData.auditType}
                  onChange={handleAuditTypeChange}
                  options={auditTypeOptions}
                  label="Tipo de Auditoría"
                  placeholder="Seleccionar tipo..."
                  searchPlaceholder="Buscar tipo..."
                  emptyMessage="No hay tipos definidos"
                  noResultsMessage="Tipo no encontrado"
                  clearable
                />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Idioma <span className="text-danger-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
            </div>
          </Card>

          {/* Plantilla de Procedimiento - Solo en modo creación */}
          {!isEditMode && (
            <Card>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Plantilla de Procedimiento
              </h3>

              <ProcedureTemplateSelect
                value={formData.procedureTemplateId}
                onChange={handleProcedureTemplateChange}
                label="Procedimiento / Alcance"
                placeholder="Seleccionar procedimiento..."
              />

              <div className="mt-3 flex items-start gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-400">
                  El procedimiento define el alcance y las secciones iniciales de la auditoría. 
                  Puedes dejarlo vacío y configurarlo después desde el tab "Procedimiento".
                </p>
              </div>
            </Card>
          )}

          {/* Mensaje en modo edición - Procedimiento se edita en otro tab */}
          {isEditMode && (
            <Card>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Procedimiento y Alcance
              </h3>

              <div className="p-4 bg-info-500/10 border border-info-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-info-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-info-300 font-medium">
                      El origen, alcance y documentación CITE se gestionan desde el tab "Procedimiento"
                    </p>
                    <p className="text-xs text-info-400/70 mt-1">
                      Accede a la vista de detalle de la auditoría y selecciona la pestaña "Procedimiento" 
                      para editar esta información.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Cliente y Empresa */}
          <Card>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-info-400" />
              Cliente y Empresa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchableSelect
                value={formData.company}
                onChange={handleCompanyChange}
                options={companyOptions}
                label="Empresa Auditora"
                placeholder="Seleccionar empresa..."
                searchPlaceholder="Buscar empresa..."
                noResultsMessage="Empresa no encontrada"
                clearable
              />

              <SearchableSelect
                value={formData.client}
                onChange={handleClientChange}
                options={clientOptions}
                label="Entidad / Cliente"
                placeholder={
                  formData.company 
                    ? (clientOptions.length === 0 
                        ? 'No hay clientes para esta empresa' 
                        : 'Seleccionar cliente...')
                    : 'Seleccionar cliente...'
                }
                searchPlaceholder="Buscar cliente/entidad..."
                noResultsMessage="Cliente no encontrado"
                emptyMessage="No hay clientes disponibles"
                clearable
                groupBy={!formData.company}
              />
            </div>

            {formData.company && clientOptions.length === 0 && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-warning-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-warning-400">
                  No hay clientes asociados a esta empresa. Puedes crear uno en la sección de Entidades.
                </p>
              </div>
            )}
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
              <CollaboratorsSelect
                users={users}
                selectedIds={formData.collaborators}
                onChange={handleCollaboratorsChange}
                label="Colaboradores"
                placeholder="Agregar colaboradores..."
              />

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

            <Button type="submit" variant="primary" icon={Save} isLoading={loading}>
              {isEditMode ? 'Guardar Cambios' : 'Crear Auditoría'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuditFormPage;