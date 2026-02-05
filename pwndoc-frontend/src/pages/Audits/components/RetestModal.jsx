import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  RefreshCw,
  Shield,
  AlertTriangle,
  FileText,
  ArrowRight,
  Info,
  Loader2,
} from 'lucide-react';

// API
import * as auditsApi from '../../../api/endpoints/audits.api';
import * as auditStatusApi from '../../../api/endpoints/audit-status.api';

// Redux
import { selectAuditTypes } from '../../../features/data/dataSlice';

// Components
import Modal from '../../../components/common/Modal/Modal';
import Button from '../../../components/common/Button/Button';
import Alert from '../../../components/common/Alert/Alert';

/**
 * RetestModal - Modal para crear retest o verificación de una auditoría
 * 
 * Retest: Copia la auditoría para un nuevo ciclo de pruebas
 * Verificación: Crea una auditoría hija para verificar hallazgos corregidos
 */
const RetestModal = ({ 
  isOpen,
  onClose,
  audit,
  onSuccess
}) => {
  const navigate = useNavigate();
  const auditTypes = useSelector(selectAuditTypes);
  
  // State
  const [mode, setMode] = useState('verification'); // 'verification' | 'retest'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingRetest, setCheckingRetest] = useState(false);
  const [existingRetest, setExistingRetest] = useState(null);
  const [lifecycleStatus, setLifecycleStatus] = useState(null);
  const [checkingLifecycle, setCheckingLifecycle] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    auditType: '',
    name: '',
    origen: '',
    alcance: [],
  });

  // Check if retest already exists and lifecycle status
  useEffect(() => {
    if (isOpen && audit.audit?._id) {
      checkExistingRetest();
      checkLifecycleStatus();
    }
  }, [isOpen, audit.audit?._id]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && audit.audit) {
      setMode('verification');
      setError('');
      setFormData({
        auditType: audit.audit.auditType || '',
        name: ''
      });
    }
  }, [isOpen, audit.audit]);

  const checkLifecycleStatus = async () => {
    try {
      setCheckingLifecycle(true);
      const response = await auditStatusApi.getAuditStatusByAuditId(audit.audit._id);
      setLifecycleStatus(response.data);
    } catch (err) {
      // Si no existe, asumir EVALUANDO
      setLifecycleStatus({ status: 'EVALUANDO' });
    } finally {
      setCheckingLifecycle(false);
    }
  };

  const checkExistingRetest = async () => {
    try {
      setCheckingRetest(true);
      const response = await auditsApi.getAuditRetest(audit.audit._id);
      setExistingRetest(response.data);
    } catch (err) {
      // No existe retest, está bien
      setExistingRetest(null);
    } finally {
      setCheckingRetest(false);
    }
  };

  const handleCreateVerification = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await auditsApi.createAuditVerification(audit.audit._id, {
        name: formData.name || undefined,
      });
      
      onClose();
      if (onSuccess) onSuccess(response.data);
      
      // Navegar a la nueva auditoría de verificación
      if (response.data?._id) {
        navigate(`/audits/${response.data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear verificación');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRetest = async () => {
    if (!formData.auditType) {
      setError('Selecciona un tipo de auditoría');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await auditsApi.createAuditRetest(audit.audit._id, {
        auditType: formData.auditType
      });
      
      onClose();
      if (onSuccess) onSuccess(response.data);
      
      // Navegar a la nueva auditoría de retest
      if (response.data?._id) {
        navigate(`/audits/${response.data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear retest');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'verification') {
      handleCreateVerification();
    } else {
      handleCreateRetest();
    }
  };

  // Contar findings por severidad
  const findingsStats = audit.audit?.findings?.reduce((acc, f) => {
    const severity = f.severity || 'info';
    acc[severity] = (acc[severity] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {}) || { total: 0 };

  if (!audit.audit) return null;
console.log("Form", formData);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Verificación / Retest"
      size="lg"
    >
      <div className="space-y-6">
        {/* Error */}
        {error && (
          <Alert variant="error" onClose={() => setError('')}>{error}</Alert>
        )}

        {/* Audit Info */}
        <div className="p-4 bg-bg-tertiary rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-primary-400 mt-0.5" />
            <div>
              <h4 className="text-white font-medium">{audit.audit.name}</h4>
              <p className="text-sm text-gray-400 mt-1">
                {findingsStats.total} hallazgo(s) encontrado(s)
              </p>
              {findingsStats.total > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {findingsStats.critical > 0 && (
                    <span className="px-2 py-0.5 bg-danger-500/10 text-danger-400 text-xs rounded">
                      {findingsStats.critical} Crítico(s)
                    </span>
                  )}
                  {findingsStats.high > 0 && (
                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded">
                      {findingsStats.high} Alto(s)
                    </span>
                  )}
                  {findingsStats.medium > 0 && (
                    <span className="px-2 py-0.5 bg-warning-500/10 text-warning-400 text-xs rounded">
                      {findingsStats.medium} Medio(s)
                    </span>
                  )}
                  {findingsStats.low > 0 && (
                    <span className="px-2 py-0.5 bg-info-500/10 text-info-400 text-xs rounded">
                      {findingsStats.low} Bajo(s)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Tipo de seguimiento
          </label>
          
          {/* Lifecycle Status Check */}
          {checkingLifecycle ? (
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Verificando estado...</span>
            </div>
          ) : lifecycleStatus?.status !== 'COMPLETADO' && (
            <div className="p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning-400 mt-0.5" />
                <div className="text-sm text-warning-300">
                  <p className="font-medium">Auditoría no completada</p>
                  <p className="text-warning-400 mt-1">
                    Para crear una verificación, primero debes cambiar el estado del ciclo de vida a "Completado" en la sección de Estados.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {/* Verification Option */}
            <button
              type="button"
              onClick={() => setMode('verification')}
              disabled={lifecycleStatus?.status !== 'COMPLETADO'}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                lifecycleStatus?.status !== 'COMPLETADO'
                  ? 'border-gray-700 bg-bg-secondary opacity-50 cursor-not-allowed'
                  : mode === 'verification'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-700 bg-bg-tertiary hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Shield className={`w-5 h-5 ${mode === 'verification' && lifecycleStatus?.status === 'COMPLETADO' ? 'text-primary-400' : 'text-gray-400'}`} />
                <span className={`font-medium ${mode === 'verification' && lifecycleStatus?.status === 'COMPLETADO' ? 'text-white' : 'text-gray-300'}`}>
                  Verificación
                </span>
                {lifecycleStatus?.status !== 'COMPLETADO' && (
                  <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 text-xs rounded">
                    No disponible
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {lifecycleStatus?.status !== 'COMPLETADO'
                  ? 'Requiere que la auditoría esté en estado "Completado".'
                  : 'Verifica si los hallazgos fueron solucionados. Hereda los findings para validar correcciones.'
                }
              </p>
            </button>

            {/* Retest Option */}
            <button
              type="button"
              onClick={() => setMode('retest')}
              disabled={!!existingRetest}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                existingRetest 
                  ? 'border-gray-700 bg-bg-secondary opacity-50 cursor-not-allowed'
                  : mode === 'retest'
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-gray-700 bg-bg-tertiary hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw className={`w-5 h-5 ${mode === 'retest' ? 'text-accent-400' : 'text-gray-400'}`} />
                <span className={`font-medium ${mode === 'retest' ? 'text-white' : 'text-gray-300'}`}>
                  Retest
                </span>
                {existingRetest && (
                  <span className="px-2 py-0.5 bg-warning-500/10 text-warning-400 text-xs rounded">
                    Ya existe
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {existingRetest 
                  ? 'Ya existe un retest para esta auditoría.'
                  : 'Crea una nueva auditoría completa basada en esta. Copia toda la información.'
                }
              </p>
            </button>
          </div>
        </div>

        {/* Verification Form */}
        {mode === 'verification' && (
          <div className="space-y-4">
            <div className="p-3 bg-info-500/10 border border-info-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-info-400 mt-0.5" />
                <div className="text-sm text-info-300">
                  <p>Se creará una auditoría de verificación con:</p>
                  <ul className="list-disc list-inside mt-1 text-info-400">
                    <li>Todos los hallazgos heredados para verificar</li>
                    <li>Estado de verificación: Pendiente</li>
                    <li>Misma empresa, cliente y alcance</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nombre personalizado (opcional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`[VERIFICACIÓN] ${audit.audit.name}`}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        )}

        {/* Retest Form */}
        {mode === 'retest' && !existingRetest && (
          <div className="space-y-4">
            <div className="p-3 bg-accent-500/10 border border-accent-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-accent-400 mt-0.5" />
                <div className="text-sm text-accent-300">
                  <p>Se creará un retest completo con:</p>
                  <ul className="list-disc list-inside mt-1 text-accent-400">
                    <li>Copia de todos los hallazgos</li>
                    <li>Mismo alcance de red y scope</li>
                    <li>Estado de retest: Pendiente por hallazgo</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Tipo de Auditoría <span className="text-danger-400">*</span>
              </label>
              <select
                value={formData.auditType}
                onChange={(e) => setFormData({ ...formData, auditType: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Seleccionar tipo...</option>
                {auditTypes?.map(type => (
                  <option key={type._id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Existing Retest Link */}
        {existingRetest && mode === 'retest' && (
          <div className="p-4 bg-warning-500/10 border border-warning-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-300 font-medium">Retest existente</p>
                <p className="text-sm text-warning-400 mt-1">{existingRetest.name}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate(`/audits/${existingRetest._id}`);
                }}
              >
                Ver Retest
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            disabled={
              (mode === 'verification' && lifecycleStatus?.status !== 'COMPLETADO') ||
              (mode === 'retest' && (!!existingRetest || !formData.auditType))
            }
          >
            {mode === 'verification' ? (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Crear Verificación
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Crear Retest
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RetestModal;