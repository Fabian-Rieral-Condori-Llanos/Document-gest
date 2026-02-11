import { useState, useEffect } from 'react';
import {
  FileText,
  FileInput,
  FileOutput,
  FileCheck,
  MessageSquare,
  Save,
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Briefcase,
  Target,
  ChevronDown,
  X,
} from 'lucide-react';

// API
import * as proceduresApi from '../../../api/endpoints/audit-procedures.api';
import { alcanceTemplatesApi } from '../../../api/endpoints/alcance-templates.api';

// Components
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Alert from '../../../components/common/Alert/Alert';
import ProcedureTemplateSelect from './ProcedureTemplateSelect';

/**
 * ProceduresTab - Tab para gestionar documentación de procedimientos
 * 
 * Documentos CITE:
 * - Solicitud: CITE de solicitud recibida
 * - Instructivo: CITE del instructivo enviado
 * - Informe: CITE del informe enviado
 * - Respuesta: CITE de respuesta del cliente (completa la auditoría)
 * 
 * Para verificaciones:
 * - Informe Retest: CITE del informe de verificación
 * - Respuesta Retest: CITE de respuesta (completa la verificación)
 */
const ProceduresTab = ({ auditId, auditType = 'default' }) => {
  // State
  const [procedure, setProcedure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Alcance templates
  const [alcanceTemplates, setAlcanceTemplates] = useState([]);
  const [loadingAlcances, setLoadingAlcances] = useState(false);
  const [showAlcanceDropdown, setShowAlcanceDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    origen: '',
    alcance: [],
    alcanceDescripcion: '',
    // Documentos de evaluación
    solicitud: { cite: '', fecha: '', descripcion: '' },
    instructivo: { cite: '', fecha: '', descripcion: '' },
    informe: { cite: '', fecha: '', descripcion: '' },
    respuesta: { cite: '', fecha: '', descripcion: '' },
    // Notas
    notaExterna: '',
    notaInterna: '',
    // Documentos de verificación
    notaRetest: '',
    informeRetest: { cite: '', fecha: '', descripcion: '' },
    respuestaRetest: { cite: '', fecha: '', descripcion: '' },
    notaInternaRetest: '',
  });

  // Cargar procedimiento y alcances
  useEffect(() => {
    if (auditId) {
      loadProcedure();
      loadAlcanceTemplates();
    }
  }, [auditId]);

  const loadProcedure = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await proceduresApi.getAuditProcedureByAuditId(auditId);
      if (response.data) {
        setProcedure(response.data);
        populateForm(response.data);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Error al cargar procedimiento');
      }
      setProcedure(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAlcanceTemplates = async () => {
    try {
      setLoadingAlcances(true);
      const response = await alcanceTemplatesApi.getActive();
      setAlcanceTemplates(response.data || []);
    } catch (err) {
      console.error('Error loading alcance templates:', err);
    } finally {
      setLoadingAlcances(false);
    }
  };

  const populateForm = (data) => {
    setFormData({
      origen: data.origen || '',
      alcance: data.alcance || [],
      alcanceDescripcion: data.alcanceDescripcion || '',
      solicitud: data.solicitud || { cite: '', fecha: '', descripcion: '' },
      instructivo: data.instructivo || { cite: '', fecha: '', descripcion: '' },
      informe: data.informe || { cite: '', fecha: '', descripcion: '' },
      respuesta: data.respuesta || { cite: '', fecha: '', descripcion: '' },
      notaExterna: data.notaExterna || '',
      notaInterna: data.notaInterna || '',
      notaRetest: data.notaRetest || '',
      informeRetest: data.informeRetest || { cite: '', fecha: '', descripcion: '' },
      respuestaRetest: data.respuestaRetest || { cite: '', fecha: '', descripcion: '' },
      notaInternaRetest: data.notaInternaRetest || '',
    });
    setHasChanges(false);
  };

  // Handlers
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleDocumentChange = (docType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleAddAlcance = (alcanceName) => {
    if (alcanceName && !formData.alcance.includes(alcanceName)) {
      handleChange('alcance', [...formData.alcance, alcanceName]);
    }
    setShowAlcanceDropdown(false);
  };

  const handleRemoveAlcance = (alcanceToRemove) => {
    handleChange('alcance', formData.alcance.filter(a => a !== alcanceToRemove));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await proceduresApi.updateAuditProcedureByAuditId(auditId, formData);
      
      setSuccess('Procedimiento guardado correctamente');
      setHasChanges(false);
      loadProcedure();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar procedimiento');
    } finally {
      setSaving(false);
    }
  };

  // Calcular progreso
  const calculateProgress = () => {
    const docs = ['solicitud', 'instructivo', 'informe', 'respuesta'];
    const completed = docs.filter(d => formData[d]?.cite).length;
    return { completed, total: docs.length, percentage: Math.round((completed / docs.length) * 100) };
  };

  const progress = calculateProgress();
  const isVerification = auditType === 'verification';

  // Alcances disponibles (filtrar los ya seleccionados)
  const availableAlcances = alcanceTemplates.filter(
    t => !formData.alcance.includes(t.name)
  );

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <span className="ml-3 text-gray-400">Cargando procedimiento...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <Alert variant="error" onClose={() => setError('')}>{error}</Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')}>{success}</Alert>
      )}

      {/* Header con progreso */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-500/10">
              <FileText className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Documentación del Procedimiento</h3>
              <p className="text-sm text-gray-500">
                {progress.completed} de {progress.total} documentos completados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress */}
            <div className="text-right">
              <span className={`text-2xl font-bold ${progress.percentage === 100 ? 'text-success-400' : 'text-white'}`}>
                {progress.percentage}%
              </span>
              <div className="w-32 h-2 bg-bg-tertiary rounded-full mt-1">
                <div 
                  className={`h-full rounded-full transition-all ${progress.percentage === 100 ? 'bg-success-500' : 'bg-primary-500'}`}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                icon={RefreshCw}
                onClick={loadProcedure}
                disabled={loading}
              />
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                isLoading={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        </div>

        {/* Unsaved changes warning */}
        {hasChanges && (
          <div className="mt-4 p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-warning-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Hay cambios sin guardar</span>
            </div>
          </div>
        )}
      </Card>

      {/* Información General */}
      <Card>
        <div className="p-4 border-b border-gray-800">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-accent-400" />
            Información General
          </h4>
        </div>
        <div className="p-4 space-y-4">
          {/* Origen - Selector de Tipo de Procedimiento */}
          <ProcedureTemplateSelect
            value={formData.origen}
            onChange={(code) => handleChange('origen', code)}
            label="Tipo de Procedimiento"
            valueField="code"
            placeholder="Seleccionar tipo de procedimiento..."
            required
          />

          {/* Alcance - Select desde templates */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              <Target className="w-4 h-4 inline mr-1" />
              Alcance
            </label>
            
            {/* Selected alcances */}
            {formData.alcance.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.alcance.map((a, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-primary-500/10 text-primary-400 rounded-lg text-sm flex items-center gap-2 border border-primary-500/20"
                  >
                    {a}
                    <button
                      onClick={() => handleRemoveAlcance(a)}
                      className="hover:text-danger-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Alcance dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAlcanceDropdown(!showAlcanceDropdown)}
                disabled={loadingAlcances || availableAlcances.length === 0}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-left transition-colors hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={availableAlcances.length === 0 ? 'text-gray-500' : 'text-gray-400'}>
                  {loadingAlcances 
                    ? 'Cargando alcances...' 
                    : availableAlcances.length === 0 
                      ? 'Todos los alcances seleccionados'
                      : 'Agregar tipo de alcance...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showAlcanceDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {showAlcanceDropdown && availableAlcances.length > 0 && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowAlcanceDropdown(false)}
                  />
                  <div className="absolute z-20 w-full mt-1 bg-bg-tertiary border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {availableAlcances.map((template) => (
                      <button
                        key={template._id}
                        type="button"
                        onClick={() => handleAddAlcance(template.name)}
                        className="w-full px-4 py-3 text-left hover:bg-bg-secondary transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <p className="text-white font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {formData.alcance.length === 0 && (
              <p className="text-xs text-warning-400 mt-1">
                Selecciona al menos un tipo de alcance
              </p>
            )}
          </div>

          {/* Descripción del Alcance */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Descripción del Alcance
            </label>
            <textarea
              value={formData.alcanceDescripcion}
              onChange={(e) => handleChange('alcanceDescripcion', e.target.value)}
              placeholder="Descripción detallada del alcance de la auditoría..."
              rows={3}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Documentos de Evaluación */}
      <Card>
        <div className="p-4 border-b border-gray-800">
          <h4 className="text-white font-medium flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-info-400" />
            Documentos de Evaluación
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Referencias CITE de los documentos del proceso de auditoría
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Solicitud */}
          <DocumentSection
            title="Solicitud"
            icon={FileInput}
            iconColor="text-info-400"
            data={formData.solicitud}
            onChange={(field, value) => handleDocumentChange('solicitud', field, value)}
            description="CITE de la solicitud de auditoría recibida"
          />

          {/* Instructivo */}
          <DocumentSection
            title="Instructivo"
            icon={FileOutput}
            iconColor="text-accent-400"
            data={formData.instructivo}
            onChange={(field, value) => handleDocumentChange('instructivo', field, value)}
            description="CITE del instructivo enviado a la entidad"
          />

          {/* Informe */}
          <DocumentSection
            title="Informe"
            icon={FileText}
            iconColor="text-warning-400"
            data={formData.informe}
            onChange={(field, value) => handleDocumentChange('informe', field, value)}
            description="CITE del informe de auditoría enviado"
          />

          {/* Respuesta */}
          <DocumentSection
            title="Respuesta"
            icon={FileCheck}
            iconColor="text-success-400"
            data={formData.respuesta}
            onChange={(field, value) => handleDocumentChange('respuesta', field, value)}
            description="CITE de la respuesta del cliente (completa la auditoría)"
            highlight
          />
        </div>
      </Card>

      {/* Notas */}
      <Card>
        <div className="p-4 border-b border-gray-800">
          <h4 className="text-white font-medium flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent-400" />
            Notas
          </h4>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nota Externa */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nota Externa
              <span className="ml-2 text-xs text-gray-500">(visible para el cliente)</span>
            </label>
            <textarea
              value={formData.notaExterna}
              onChange={(e) => handleChange('notaExterna', e.target.value)}
              placeholder="Notas para incluir en la documentación oficial..."
              rows={4}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>

          {/* Nota Interna */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nota Interna
              <span className="ml-2 text-xs text-gray-500">(uso interno)</span>
            </label>
            <textarea
              value={formData.notaInterna}
              onChange={(e) => handleChange('notaInterna', e.target.value)}
              placeholder="Notas internas del equipo..."
              rows={4}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Sección de Verificación (solo para auditorías de verificación) */}
      {isVerification && (
        <Card>
          <div className="p-4 border-b border-gray-800">
            <h4 className="text-white font-medium flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary-400" />
              Documentación de Verificación
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              Documentos específicos para el proceso de verificación
            </p>
          </div>
          <div className="p-4 space-y-6">
            {/* Nota de Retest */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nota de Verificación
              </label>
              <textarea
                value={formData.notaRetest}
                onChange={(e) => handleChange('notaRetest', e.target.value)}
                placeholder="Notas sobre el proceso de verificación..."
                rows={3}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informe Retest */}
              <DocumentSection
                title="Informe de Verificación"
                icon={FileText}
                iconColor="text-warning-400"
                data={formData.informeRetest}
                onChange={(field, value) => handleDocumentChange('informeRetest', field, value)}
                description="CITE del informe de verificación"
              />

              {/* Respuesta Retest */}
              <DocumentSection
                title="Respuesta de Verificación"
                icon={FileCheck}
                iconColor="text-success-400"
                data={formData.respuestaRetest}
                onChange={(field, value) => handleDocumentChange('respuestaRetest', field, value)}
                description="CITE de la respuesta (completa la verificación)"
                highlight
              />
            </div>

            {/* Nota Interna Retest */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nota Interna de Verificación
              </label>
              <textarea
                value={formData.notaInternaRetest}
                onChange={(e) => handleChange('notaInternaRetest', e.target.value)}
                placeholder="Notas internas sobre la verificación..."
                rows={3}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Info sobre completado automático */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-info-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-gray-300 font-medium">Sobre el estado de completado</p>
            <p className="text-gray-500 mt-1">
              {isVerification 
                ? 'La verificación se marca como COMPLETADA automáticamente cuando se llena el CITE de "Respuesta de Verificación".'
                : 'La auditoría se marca como COMPLETADA automáticamente cuando se llena el CITE de "Respuesta" del cliente.'
              }
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

/**
 * DocumentSection - Sección para un documento CITE
 */
const DocumentSection = ({ title, icon: Icon, iconColor, data, onChange, description, highlight }) => {
  const hasData = data?.cite;

  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'border-success-500/30 bg-success-500/5' : 'border-gray-700 bg-bg-tertiary'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${highlight ? 'bg-success-500/10' : 'bg-bg-secondary'}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <h5 className="text-white font-medium flex items-center gap-2">
            {title}
            {hasData && <CheckCircle className="w-4 h-4 text-success-400" />}
          </h5>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* CITE */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Código CITE
          </label>
          <input
            type="text"
            value={data?.cite || ''}
            onChange={(e) => onChange('cite', e.target.value)}
            placeholder="Ej: AGETIC-DGSI-001/2024"
            className="w-full px-3 py-2 bg-bg-secondary border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Fecha
          </label>
          <input
            type="date"
            value={data?.fecha ? new Date(data.fecha).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange('fecha', e.target.value)}
            className="w-full px-3 py-2 bg-bg-secondary border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Descripción
          </label>
          <textarea
            value={data?.descripcion || ''}
            onChange={(e) => onChange('descripcion', e.target.value)}
            placeholder="Descripción o notas adicionales..."
            rows={2}
            className="w-full px-3 py-2 bg-bg-secondary border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ProceduresTab;