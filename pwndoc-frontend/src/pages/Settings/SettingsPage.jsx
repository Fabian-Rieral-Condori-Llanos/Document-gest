import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSettings,
  updateSettings,
  restoreSettingsDefaults,
  selectSettings,
  selectSettingsLoading,
  selectSettingsError,
  selectSettingsUpdateSuccess,
  clearError,
  clearUpdateSuccess,
} from '../../features/settings';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import {
  Settings,
  Save,
  RotateCcw,
  FileText,
  Palette,
  CheckSquare,
  Calculator,
  Image,
  Users,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

/**
 * SettingsPage - Página de configuración del sistema
 */
const SettingsPage = () => {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const loading = useSelector(selectSettingsLoading);
  const error = useSelector(selectSettingsError);
  const updateSuccess = useSelector(selectSettingsUpdateSuccess);

  // Estado local del formulario
  const [formData, setFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [restoreModal, setRestoreModal] = useState(false);

  // Cargar configuración al montar
  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  // Inicializar formulario cuando llegan los datos
  useEffect(() => {
    if (settings) {
      setFormData(JSON.parse(JSON.stringify(settings)));
      setHasChanges(false);
    }
  }, [settings]);

  // Limpiar mensaje de éxito
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => {
        dispatch(clearUpdateSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess, dispatch]);

  const handleChange = (path, value) => {
    setFormData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
    setHasChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData) {
      await dispatch(updateSettings(formData));
    }
  };

  const handleRestore = async () => {
    await dispatch(restoreSettingsDefaults());
    setRestoreModal(false);
  };

  const handleRefresh = () => {
    dispatch(fetchSettings());
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary-400" />
              Configuración
            </h1>
            <p className="text-gray-400 mt-1">
              Ajustes generales del sistema
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
              variant="ghost"
              icon={RotateCcw}
              onClick={() => setRestoreModal(true)}
              className="text-warning-400"
            >
              Restaurar
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {updateSuccess && (
          <Alert variant="success" className="mb-6">
            Configuración guardada correctamente
          </Alert>
        )}

        {hasChanges && (
          <Alert variant="warning" className="mb-6">
            Tienes cambios sin guardar
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ============================================ */}
          {/* REPORTES */}
          {/* ============================================ */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Reportes</h2>
                <p className="text-sm text-gray-400">Configuración de generación de reportes</p>
              </div>
              <div className="ml-auto">
                <ToggleSwitch
                  checked={formData.report?.enabled}
                  onChange={(v) => handleChange('report.enabled', v)}
                  label="Habilitado"
                />
              </div>
            </div>

            {formData.report?.enabled && (
              <div className="space-y-6 pt-4 border-t border-gray-700">
                {/* Métodos de Scoring */}
                <div>
                  <h3 className="text-md font-medium text-white mb-3 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-info-400" />
                    Métodos de Scoring
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ToggleSwitch
                      checked={formData.report?.public?.scoringMethods?.CVSS3}
                      onChange={(v) => handleChange('report.public.scoringMethods.CVSS3', v)}
                      label="CVSS 3.1"
                    />
                    <ToggleSwitch
                      checked={formData.report?.public?.scoringMethods?.CVSS4}
                      onChange={(v) => handleChange('report.public.scoringMethods.CVSS4', v)}
                      label="CVSS 4.0"
                    />
                  </div>
                </div>

                {/* Colores CVSS */}
                <div>
                  <h3 className="text-md font-medium text-white mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-accent-400" />
                    Colores por Severidad
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <ColorPicker
                      label="Ninguno"
                      value={formData.report?.public?.cvssColors?.noneColor || '#4a86e8'}
                      onChange={(v) => handleChange('report.public.cvssColors.noneColor', v)}
                    />
                    <ColorPicker
                      label="Bajo"
                      value={formData.report?.public?.cvssColors?.lowColor || '#008000'}
                      onChange={(v) => handleChange('report.public.cvssColors.lowColor', v)}
                    />
                    <ColorPicker
                      label="Medio"
                      value={formData.report?.public?.cvssColors?.mediumColor || '#f9a009'}
                      onChange={(v) => handleChange('report.public.cvssColors.mediumColor', v)}
                    />
                    <ColorPicker
                      label="Alto"
                      value={formData.report?.public?.cvssColors?.highColor || '#fe0000'}
                      onChange={(v) => handleChange('report.public.cvssColors.highColor', v)}
                    />
                    <ColorPicker
                      label="Crítico"
                      value={formData.report?.public?.cvssColors?.criticalColor || '#212121'}
                      onChange={(v) => handleChange('report.public.cvssColors.criticalColor', v)}
                    />
                  </div>
                </div>

                {/* Highlight Warning */}
                <div>
                  <h3 className="text-md font-medium text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning-400" />
                    Resaltado de Advertencias
                  </h3>
                  <div className="flex items-center gap-6">
                    <ToggleSwitch
                      checked={formData.report?.public?.highlightWarning}
                      onChange={(v) => handleChange('report.public.highlightWarning', v)}
                      label="Habilitar resaltado"
                    />
                    {formData.report?.public?.highlightWarning && (
                      <ColorPicker
                        label="Color"
                        value={formData.report?.public?.highlightWarningColor || '#ffff25'}
                        onChange={(v) => handleChange('report.public.highlightWarningColor', v)}
                      />
                    )}
                  </div>
                </div>

                {/* Imágenes */}
                <div>
                  <h3 className="text-md font-medium text-white mb-3 flex items-center gap-2">
                    <Image className="w-5 h-5 text-success-400" />
                    Imágenes
                  </h3>
                  <div className="flex items-center gap-6">
                    <ToggleSwitch
                      checked={formData.report?.private?.imageBorder}
                      onChange={(v) => handleChange('report.private.imageBorder', v)}
                      label="Borde en imágenes"
                    />
                    {formData.report?.private?.imageBorder && (
                      <ColorPicker
                        label="Color del borde"
                        value={formData.report?.private?.imageBorderColor || '#000000'}
                        onChange={(v) => handleChange('report.private.imageBorderColor', v)}
                      />
                    )}
                  </div>
                </div>

                {/* Captions */}
                <div>
                  <h3 className="text-md font-medium text-white mb-3">
                    Etiquetas de Figuras
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(formData.report?.public?.captions || []).map((caption, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-bg-tertiary rounded-lg text-sm text-gray-300"
                      >
                        {caption}
                        <button
                          type="button"
                          onClick={() => {
                            const newCaptions = [...(formData.report?.public?.captions || [])];
                            newCaptions.splice(index, 1);
                            handleChange('report.public.captions', newCaptions);
                          }}
                          className="text-danger-400 hover:text-danger-300 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <CaptionInput
                      onAdd={(caption) => {
                        const newCaptions = [...(formData.report?.public?.captions || []), caption];
                        handleChange('report.public.captions', newCaptions);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ============================================ */}
          {/* CAMPOS REQUERIDOS */}
          {/* ============================================ */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-warning-500/10 rounded-lg">
                <CheckSquare className="w-6 h-6 text-warning-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Campos Requeridos</h2>
                <p className="text-sm text-gray-400">Define qué campos son obligatorios</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Auditoría */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Auditoría</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.company}
                    onChange={(v) => handleChange('report.public.requiredFields.company', v)}
                    label="Empresa"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.client}
                    onChange={(v) => handleChange('report.public.requiredFields.client', v)}
                    label="Cliente"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.dateStart}
                    onChange={(v) => handleChange('report.public.requiredFields.dateStart', v)}
                    label="Fecha Inicio"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.dateEnd}
                    onChange={(v) => handleChange('report.public.requiredFields.dateEnd', v)}
                    label="Fecha Fin"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.dateReport}
                    onChange={(v) => handleChange('report.public.requiredFields.dateReport', v)}
                    label="Fecha Reporte"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.scope}
                    onChange={(v) => handleChange('report.public.requiredFields.scope', v)}
                    label="Alcance"
                    size="sm"
                  />
                </div>
              </div>

              {/* Hallazgos */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Hallazgos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.findingType}
                    onChange={(v) => handleChange('report.public.requiredFields.findingType', v)}
                    label="Tipo"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.findingDescription}
                    onChange={(v) => handleChange('report.public.requiredFields.findingDescription', v)}
                    label="Descripción"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.findingObservation}
                    onChange={(v) => handleChange('report.public.requiredFields.findingObservation', v)}
                    label="Observación"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.findingReferences}
                    onChange={(v) => handleChange('report.public.requiredFields.findingReferences', v)}
                    label="Referencias"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.findingProofs}
                    onChange={(v) => handleChange('report.public.requiredFields.findingProofs', v)}
                    label="Pruebas"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.findingAffected}
                    onChange={(v) => handleChange('report.public.requiredFields.findingAffected', v)}
                    label="Afectados"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.findingRemediationDifficulty}
                    onChange={(v) => handleChange('report.public.requiredFields.findingRemediationDifficulty', v)}
                    label="Dificultad Remediación"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.findingPriority}
                    onChange={(v) => handleChange('report.public.requiredFields.findingPriority', v)}
                    label="Prioridad"
                    size="sm"
                  />
                  <ToggleSwitch
                    checked={formData.report?.public?.requiredFields?.findingRemediation}
                    onChange={(v) => handleChange('report.public.requiredFields.findingRemediation', v)}
                    label="Remediación"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* ============================================ */}
          {/* REVISIONES */}
          {/* ============================================ */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-info-500/10 rounded-lg">
                <Users className="w-6 h-6 text-info-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Revisiones</h2>
                <p className="text-sm text-gray-400">Sistema de revisión y aprobación de auditorías</p>
              </div>
              <div className="ml-auto">
                <ToggleSwitch
                  checked={formData.reviews?.enabled}
                  onChange={(v) => handleChange('reviews.enabled', v)}
                  label="Habilitado"
                />
              </div>
            </div>

            {formData.reviews?.enabled && (
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ToggleSwitch
                    checked={formData.reviews?.public?.mandatoryReview}
                    onChange={(v) => handleChange('reviews.public.mandatoryReview', v)}
                    label="Revisión obligatoria"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Mínimo de revisores
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.reviews?.public?.minReviewers || 1}
                      onChange={(e) => handleChange('reviews.public.minReviewers', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                <ToggleSwitch
                  checked={formData.reviews?.private?.removeApprovalsUponUpdate}
                  onChange={(v) => handleChange('reviews.private.removeApprovalsUponUpdate', v)}
                  label="Eliminar aprobaciones al actualizar"
                />
              </div>
            )}
          </Card>

          {/* Botón Guardar */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleRefresh}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              loading={loading}
              disabled={!hasChanges}
            >
              Guardar Configuración
            </Button>
          </div>
        </form>

        {/* Modal de Restaurar */}
        {restoreModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-warning-500/10 mb-4">
                  <RotateCcw className="w-6 h-6 text-warning-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Restaurar Valores por Defecto
                </h3>
                <p className="text-gray-400 mb-6">
                  ¿Estás seguro? Esta acción restablecerá toda la configuración a los valores originales.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="ghost" onClick={() => setRestoreModal(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="warning"
                    icon={RotateCcw}
                    onClick={handleRestore}
                    loading={loading}
                  >
                    Restaurar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

/**
 * Toggle Switch Component
 */
const ToggleSwitch = ({ checked, onChange, label, size = 'md' }) => {
  const isChecked = checked || false;
  
  const sizeClasses = size === 'sm' 
    ? 'w-9 h-5' 
    : 'w-12 h-6';
  const dotSizeClasses = size === 'sm'
    ? 'w-4 h-4'
    : 'w-5 h-5';

  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <div 
        className={`relative ${sizeClasses} rounded-full transition-colors duration-200 ${
          isChecked ? 'bg-primary-500' : 'bg-gray-600'
        }`}
        onClick={() => onChange(!isChecked)}
      >
        <div 
          className={`${dotSizeClasses} bg-white rounded-full shadow-md absolute top-0.5 transition-all duration-200 ${
            isChecked ? 'left-[calc(100%-1.25rem-0.125rem)]' : 'left-0.5'
          }`}
        />
      </div>
      {label && (
        <span 
          className={`text-gray-300 ${size === 'sm' ? 'text-sm' : ''}`}
          onClick={() => onChange(!isChecked)}
        >
          {label}
        </span>
      )}
    </label>
  );
};

/**
 * Color Picker Component
 */
const ColorPicker = ({ label, value, onChange }) => {
  const colorValue = value || '#000000';
  
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={colorValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div 
            className="w-10 h-10 rounded-lg border-2 border-gray-600 cursor-pointer shadow-inner"
            style={{ backgroundColor: colorValue }}
          />
        </div>
        <input
          type="text"
          value={colorValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
              onChange(val);
            }
          }}
          className="w-24 px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm font-mono uppercase focus:outline-none focus:border-primary-500"
          maxLength={7}
        />
      </div>
    </div>
  );
};

/**
 * Caption Input Component
 */
const CaptionInput = ({ onAdd }) => {
  const [value, setValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="inline-flex items-center gap-1 px-3 py-1 bg-bg-tertiary hover:bg-gray-700 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
      >
        + Agregar
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        placeholder="Nueva etiqueta"
        className="w-32 px-2 py-1 bg-bg-tertiary border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-primary-500"
        autoFocus
      />
      <button
        type="button"
        onClick={handleAdd}
        className="text-success-400 hover:text-success-300 px-1"
      >
        ✓
      </button>
      <button
        type="button"
        onClick={() => { setIsAdding(false); setValue(''); }}
        className="text-danger-400 hover:text-danger-300 px-1"
      >
        ×
      </button>
    </div>
  );
};

export default SettingsPage;