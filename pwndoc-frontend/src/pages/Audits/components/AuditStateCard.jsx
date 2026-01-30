import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Edit3,
  Eye,
  CheckCircle,
  Clock,
  Pause,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  FileCheck,
  Send,
  Info,
} from 'lucide-react';

// API
import * as auditsApi from '../../../api/endpoints/audits.api';
import * as auditStatusApi from '../../../api/endpoints/audit-status.api';

// Redux

// Components
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Alert from '../../../components/common/Alert/Alert';
import Modal from '../../../components/common/Modal/Modal';
import { selectCurrentUser } from '../../../features/auth/authSelectors';

/**
 * Estados de auditoría (workflow de aprobación)
 */
const AUDIT_STATES = {
  EDIT: 'EDIT',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
};

const AUDIT_STATE_CONFIG = {
  EDIT: {
    label: 'En Edición',
    icon: Edit3,
    color: 'text-info-400',
    bgColor: 'bg-info-500/10',
    description: 'La auditoría está siendo editada',
  },
  REVIEW: {
    label: 'En Revisión',
    icon: Eye,
    color: 'text-warning-400',
    bgColor: 'bg-warning-500/10',
    description: 'Esperando aprobación de revisores',
  },
  APPROVED: {
    label: 'Aprobada',
    icon: CheckCircle,
    color: 'text-success-400',
    bgColor: 'bg-success-500/10',
    description: 'Auditoría aprobada y finalizada',
  },
};

/**
 * Estados del ciclo de vida (AuditStatus) - Cambia automáticamente
 */
const LIFECYCLE_STATE_CONFIG = {
  EVALUANDO: {
    label: 'Evaluando',
    icon: PlayCircle,
    color: 'text-info-400',
    bgColor: 'bg-info-500/10',
    description: 'Auditoría en progreso',
  },
  PENDIENTE: {
    label: 'Pendiente',
    icon: Pause,
    color: 'text-warning-400',
    bgColor: 'bg-warning-500/10',
    description: 'Auditoría bloqueada o en espera',
  },
  COMPLETADO: {
    label: 'Completado',
    icon: FileCheck,
    color: 'text-success-400',
    bgColor: 'bg-success-500/10',
    description: 'Documentación completa',
  },
};

/**
 * AuditStateCard - Gestión de estados de auditoría
 */
const AuditStateCard = ({ audit, onUpdate }) => {
  const currentUser = useSelector(selectCurrentUser);
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lifecycleStatus, setLifecycleStatus] = useState(null);
  const [loadingLifecycle, setLoadingLifecycle] = useState(true);
  
  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Cargar estado del ciclo de vida
  useEffect(() => {
    if (audit.audit?._id) {
      loadLifecycleStatus();
    }
  }, [audit.audit?._id]);

  const loadLifecycleStatus = async () => {
    try {
      setLoadingLifecycle(true);
      const response = await auditStatusApi.getAuditStatusByAuditId(audit.audit._id);
      setLifecycleStatus(response.data);
    } catch (err) {
      // Si no existe, asumir EVALUANDO
      setLifecycleStatus({ status: 'EVALUANDO', history: [] });
    } finally {
      setLoadingLifecycle(false);
    }
  };

  // Permisos
  const isCreator = audit.audit?.creator?._id === currentUser?._id || 
                    audit.audit?.creator === currentUser?._id;
  const isCollaborator = audit.audit?.collaborators?.some(c => 
    (c._id || c) === currentUser?._id
  );
  const isAdmin = currentUser?.role === 'admin';
  const canChangeState = isCreator || isCollaborator || isAdmin;

  // ================================
  // audit STATE (EDIT/REVIEW/APPROVED)
  // ================================

  const handleMarkForReview = async () => {
    try {
      setLoading(true);
      setError('');
      
      await auditsApi.updateAuditState(audit.audit._id, AUDIT_STATES.REVIEW);
      
      setSuccess('Auditoría marcada para revisión');
      setShowReviewModal(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEdit = async () => {
    try {
      setLoading(true);
      setError('');
      
      await auditsApi.updateAuditState(audit.audit._id, AUDIT_STATES.EDIT);
      
      setSuccess('Auditoría regresada a edición');
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  // Config del estado actual
  const currentStateConfig = AUDIT_STATE_CONFIG[audit.audit?.state] || AUDIT_STATE_CONFIG.EDIT;
  const CurrentStateIcon = currentStateConfig.icon;

  const currentLifecycleConfig = LIFECYCLE_STATE_CONFIG[lifecycleStatus?.status] || LIFECYCLE_STATE_CONFIG.EVALUANDO;
  const CurrentLifecycleIcon = currentLifecycleConfig.icon;

  return (
    <>
      <Card className="p-4">
        {/* Alerts */}
        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="mb-4" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Header */}
        <h3 className="text-lg font-medium text-white mb-4">Estado de la Auditoría</h3>

        {/* Audit State (Workflow) */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Flujo de Aprobación
          </p>
          <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentStateConfig.bgColor}`}>
                <CurrentStateIcon className={`w-5 h-5 ${currentStateConfig.color}`} />
              </div>
              <div>
                <p className="text-white font-medium">{currentStateConfig.label}</p>
                <p className="text-xs text-gray-500">{currentStateConfig.description}</p>
              </div>
            </div>
          </div>

          {/* State Actions */}
          {canChangeState && (
            <div className="mt-3 flex gap-2">
              {audit.audit?.state === AUDIT_STATES.EDIT && (
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowReviewModal(true)}
                  disabled={loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar a Revisión
                </Button>
              )}
              {audit.audit?.state === AUDIT_STATES.REVIEW && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToEdit}
                  disabled={loading}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Volver a Edición
                </Button>
              )}
              {audit.audit?.state === AUDIT_STATES.APPROVED && (
                <p className="text-sm text-success-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Auditoría completamente aprobada
                </p>
              )}
            </div>
          )}
        </div>

        {/* Lifecycle Status (Automático) */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Ciclo de Vida
          </p>
          {loadingLifecycle ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${currentLifecycleConfig.bgColor}`}>
                    <CurrentLifecycleIcon className={`w-5 h-5 ${currentLifecycleConfig.color}`} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{currentLifecycleConfig.label}</p>
                    <p className="text-xs text-gray-500">{currentLifecycleConfig.description}</p>
                  </div>
                </div>
              </div>

              {/* Info about automatic status */}
              <div className="mt-3 p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="text-xs text-gray-400">
                    <p className="mb-1">El estado del ciclo de vida cambia automáticamente:</p>
                    <ul className="list-disc list-inside text-gray-500 space-y-0.5">
                      <li><strong>Completado</strong>: Al llenar la documentación de procedimientos</li>
                      <li>Verificaciones se completan al llenar respuestaRetest</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Info for Verification */}
              {lifecycleStatus?.status !== 'COMPLETADO' && (
                <div className="mt-3 p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning-400 mt-0.5" />
                    <p className="text-xs text-warning-300">
                      Para crear una verificación, completa la documentación en el tab de Procedimientos.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* State Flow Diagram */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-3">Flujo de aprobación:</p>
          <div className="flex items-center justify-between text-xs">
            <StateStep 
              state="EDIT" 
              current={audit.audit?.state === 'EDIT'} 
              config={AUDIT_STATE_CONFIG.EDIT} 
            />
            <ArrowRight className="w-4 h-4 text-gray-600" />
            <StateStep 
              state="REVIEW" 
              current={audit.audit?.state === 'REVIEW'} 
              config={AUDIT_STATE_CONFIG.REVIEW} 
            />
            <ArrowRight className="w-4 h-4 text-gray-600" />
            <StateStep 
              state="APPROVED" 
              current={audit.audit?.state === 'APPROVED'} 
              config={AUDIT_STATE_CONFIG.APPROVED} 
            />
          </div>
        </div>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Enviar a Revisión"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            ¿Estás seguro de enviar esta auditoría a revisión?
          </p>
          <div className="p-3 bg-info-500/10 border border-info-500/20 rounded-lg">
            <p className="text-sm text-info-300">
              Los revisores asignados podrán aprobar la auditoría una vez esté en estado de revisión.
            </p>
          </div>
          
          {audit.audit?.reviewers?.length === 0 && (
            <div className="p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning-400 mt-0.5" />
                <p className="text-sm text-warning-300">
                  No hay revisores asignados. Puedes asignarlos editando la auditoría.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowReviewModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleMarkForReview}
              isLoading={loading}
            >
              Enviar a Revisión
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/**
 * StateStep - Paso en el diagrama de flujo
 */
const StateStep = ({ state, current, config }) => {
  const Icon = config.icon;
  return (
    <div className={`flex flex-col items-center ${current ? '' : 'opacity-50'}`}>
      <div className={`p-1.5 rounded-lg ${current ? config.bgColor : 'bg-gray-700'}`}>
        <Icon className={`w-4 h-4 ${current ? config.color : 'text-gray-500'}`} />
      </div>
      <span className={`mt-1 ${current ? 'text-white' : 'text-gray-500'}`}>
        {config.label}
      </span>
    </div>
  );
};

export default AuditStateCard;