import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Save,
  AlertTriangle,
  Tag,
  FileCode,
  Link as LinkIcon,
  Plus,
  X,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

// Redux
import {
  fetchAuditById,
  fetchAuditFinding,
  createAuditFinding,
  updateAuditFinding,
  selectSelectedAudit,
  selectSelectedAuditLoading,
  selectSelectedFinding,
  selectSelectedFindingLoading,
  clearSelectedAudit,
  clearSelectedFinding,
  clearError,
} from '../../features/audits';
import {
  fetchVulnerabilityCategories,
  selectVulnerabilityCategories,
} from '../../features/data/dataSlice';

// Components
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import { CVSSInput } from '../../components/common/CVSSCalculator';

// Constants
const PRIORITY_OPTIONS = [
  { value: 1, label: 'Urgente', color: 'bg-danger-500' },
  { value: 2, label: 'Alta', color: 'bg-warning-500' },
  { value: 3, label: 'Media', color: 'bg-info-500' },
  { value: 4, label: 'Baja', color: 'bg-success-500' },
];

const COMPLEXITY_OPTIONS = [
  { value: 1, label: 'Fácil', color: 'bg-success-500' },
  { value: 2, label: 'Media', color: 'bg-warning-500' },
  { value: 3, label: 'Difícil', color: 'bg-danger-500' },
];

const STATUS_OPTIONS = [
  { value: 1, label: 'Redactando', icon: Clock, color: 'text-warning-400' },
  { value: 0, label: 'Completado', icon: CheckCircle, color: 'text-success-400' },
];

/**
 * FindingFormPage - Crear o editar hallazgo de auditoría
 */
const FindingFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { auditId, findingId } = useParams();

  const isEditMode = Boolean(findingId);

  // Redux state
  const audit = useSelector(selectSelectedAudit);
  const auditLoading = useSelector(selectSelectedAuditLoading);
  const selectedFinding = useSelector(selectSelectedFinding);
  const findingLoading = useSelector(selectSelectedFindingLoading);
  const categories = useSelector(selectVulnerabilityCategories);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    vulnType: '',
    description: '',
    observation: '',
    remediation: '',
    remediationComplexity: 2,
    priority: 2,
    references: [],
    cvssv3: '',
    cvssv4: '',
    category: '',
    poc: '',
    scope: '',
    status: 1,
  });

  const [newReference, setNewReference] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    dispatch(fetchVulnerabilityCategories());
    
    // Cargar auditoría (para mostrar nombre)
    if (auditId) {
      dispatch(fetchAuditById(auditId));
    }
    
    // En modo edición, cargar el finding específico
    if (isEditMode && auditId && findingId) {
      dispatch(fetchAuditFinding({ auditId, findingId }));
    }

    return () => {
      dispatch(clearSelectedAudit());
      dispatch(clearSelectedFinding());
      dispatch(clearError());
    };
  }, [dispatch, auditId, findingId, isEditMode]);

  // Cargar datos del finding en modo edición
  useEffect(() => {
    if (isEditMode && selectedFinding && !isDataLoaded) {
      setFormData({
        title: selectedFinding.title || '',
        vulnType: selectedFinding.vulnType || '',
        description: selectedFinding.description || '',
        observation: selectedFinding.observation || '',
        remediation: selectedFinding.remediation || '',
        remediationComplexity: selectedFinding.remediationComplexity || 2,
        priority: selectedFinding.priority || 2,
        references: selectedFinding.references || [],
        cvssv3: selectedFinding.cvssv3 || '',
        cvssv4: selectedFinding.cvssv4 || '',
        category: selectedFinding.category || '',
        poc: selectedFinding.poc || '',
        scope: selectedFinding.scope || '',
        status: selectedFinding.status ?? 1,
      });
      setIsDataLoaded(true);
    }
  }, [selectedFinding, isEditMode, isDataLoaded]);

  // Obtener finding actual para mostrar info
  const currentFinding = useMemo(() => {
    if (!isEditMode) return null;
    return selectedFinding;
  }, [selectedFinding, isEditMode]);

  // Handlers
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddReference = () => {
    if (newReference.trim()) {
      setFormData(prev => ({
        ...prev,
        references: [...prev.references, newReference.trim()]
      }));
      setNewReference('');
    }
  };

  const handleRemoveReference = (index) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const handleKeyDownReference = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddReference();
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'El título es requerido';
    }

    if (!formData.category) {
      errors.category = 'La categoría es requerida';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const findingData = {
        ...formData,
        // Asegurar tipos correctos
        remediationComplexity: Number(formData.remediationComplexity),
        priority: Number(formData.priority),
        status: Number(formData.status),
      };

      if (isEditMode) {
        await dispatch(updateAuditFinding({
          auditId,
          findingId,
          findingData
        })).unwrap();
      } else {
        await dispatch(createAuditFinding({
          auditId,
          findingData
        })).unwrap();
      }

      navigate(`/audits/${auditId}`);
    } catch (error) {
      setSubmitError(error?.message || error || 'Error al guardar el hallazgo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/audits/${auditId}`);
  };

  // Loading state
  const isLoading = auditLoading || (isEditMode && findingLoading && !selectedFinding);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400">Cargando...</p>
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
              <AlertTriangle className="w-8 h-8 text-warning-400" />
              {isEditMode ? 'Editar Hallazgo' : 'Nuevo Hallazgo'}
            </h1>
            {audit && (
              <p className="text-gray-400 mt-1">
                Auditoría: {audit.name}
              </p>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {submitError && (
          <Alert variant="error" className="mb-6" onClose={() => setSubmitError('')}>
            {submitError}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Principal */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              Información Principal
            </h2>

            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Título <span className="text-danger-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Título del hallazgo"
                  className={`w-full px-4 py-2.5 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 ${
                    validationErrors.title ? 'border-danger-500' : 'border-gray-700'
                  }`}
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-danger-400">{validationErrors.title}</p>
                )}
              </div>

              {/* Categoría y Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Categoría <span className="text-danger-400">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-bg-tertiary border rounded-lg text-white focus:outline-none focus:border-primary-500 ${
                      validationErrors.category ? 'border-danger-500' : 'border-gray-700'
                    }`}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.category && (
                    <p className="mt-1 text-sm text-danger-400">{validationErrors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Tipo de Vulnerabilidad
                  </label>
                  <input
                    type="text"
                    value={formData.vulnType}
                    onChange={(e) => handleChange('vulnType', e.target.value)}
                    placeholder="Ej: SQL Injection, XSS, etc."
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Estado
                </label>
                <div className="flex gap-3">
                  {STATUS_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChange('status', option.value)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                          formData.status === option.value
                            ? 'bg-bg-tertiary border-primary-500 text-white'
                            : 'bg-bg-secondary border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${option.color}`} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Severidad - CVSS */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-danger-400" />
              Severidad (CVSS)
            </h2>

            <CVSSInput
              cvssv3={formData.cvssv3}
              cvssv4={formData.cvssv4}
              onCvssv3Change={(value) => handleChange('cvssv3', value)}
              onCvssv4Change={(value) => handleChange('cvssv4', value)}
            />

            {/* Prioridad y Complejidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Prioridad de Remediación
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange('priority', option.value)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        formData.priority === option.value
                          ? `${option.color} border-transparent text-white`
                          : 'bg-bg-tertiary border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Complejidad de Remediación
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COMPLEXITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange('remediationComplexity', option.value)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        formData.remediationComplexity === option.value
                          ? `${option.color} border-transparent text-white`
                          : 'bg-bg-tertiary border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Descripción y Observación */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-accent-400" />
              Detalles
            </h2>

            <div className="space-y-4">
              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descripción técnica de la vulnerabilidad"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              {/* Observación */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Observación
                </label>
                <textarea
                  value={formData.observation}
                  onChange={(e) => handleChange('observation', e.target.value)}
                  placeholder="Observaciones específicas encontradas en el sistema auditado"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Alcance / Scope
                </label>
                <input
                  type="text"
                  value={formData.scope}
                  onChange={(e) => handleChange('scope', e.target.value)}
                  placeholder="URLs, IPs o sistemas afectados"
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* POC */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Prueba de Concepto (PoC)
                </label>
                <textarea
                  value={formData.poc}
                  onChange={(e) => handleChange('poc', e.target.value)}
                  placeholder="Pasos para reproducir la vulnerabilidad, comandos, payloads, etc."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none font-mono text-sm"
                />
              </div>
            </div>
          </Card>

          {/* Remediación */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success-400" />
              Remediación
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Recomendaciones de Remediación
              </label>
              <textarea
                value={formData.remediation}
                onChange={(e) => handleChange('remediation', e.target.value)}
                placeholder="Pasos recomendados para remediar la vulnerabilidad"
                rows={4}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>
          </Card>

          {/* Referencias */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-info-400" />
              Referencias
            </h2>

            <div className="space-y-3">
              {/* Input para nueva referencia */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newReference}
                  onChange={(e) => setNewReference(e.target.value)}
                  onKeyDown={handleKeyDownReference}
                  placeholder="https://cve.mitre.org/..."
                  className="flex-1 px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  icon={Plus}
                  onClick={handleAddReference}
                >
                  Agregar
                </Button>
              </div>

              {/* Lista de referencias */}
              {formData.references.length > 0 && (
                <div className="space-y-2">
                  {formData.references.map((ref, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-lg group"
                    >
                      <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <a
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-info-400 hover:text-info-300 truncate text-sm"
                      >
                        {ref}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveReference(index)}
                        className="p-1 text-gray-500 hover:text-danger-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.references.length === 0 && (
                <p className="text-sm text-gray-500">
                  No hay referencias agregadas. Agrega links a CVEs, CWEs, documentación, etc.
                </p>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="ghost" onClick={handleBack}>
              Cancelar
            </Button>

            <div className="flex items-center gap-3">
              {isEditMode && currentFinding && (
                <Button
                  type="button"
                  variant="secondary"
                  icon={Eye}
                  onClick={() => navigate(`/audits/${auditId}/findings/${findingId}`)}
                >
                  Ver Hallazgo
                </Button>
              )}

              <Button
                type="submit"
                variant="primary"
                icon={Save}
                isLoading={isSubmitting}
              >
                {isEditMode ? 'Guardar Cambios' : 'Crear Hallazgo'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FindingFormPage;