import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Shield,
  AlertTriangle,
  ThumbsUp,
  Loader2,
} from 'lucide-react';

// API
import * as auditsApi from '../../../api/endpoints/audits.api';

// Redux
import { selectCurrentUser } from '../../../features/auth/authSelectors';

// Components
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Alert from '../../../components/common/Alert/Alert';

/**
 * ApprovalCard - Muestra el estado de aprobaciones de una auditoría
 * Permite a los revisores aprobar cuando la auditoría está en estado REVIEW
 */
const ApprovalCard = ({ audit, onUpdate }) => {
  const currentUser = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Determinar si el usuario actual es revisor
  const isReviewer = audit.audit?.reviewers?.some(r => {
    const reviewerId = r._id || r;
    return reviewerId === currentUser?._id;
  });

  // Verificar si el usuario actual ya aprobó
  const hasApproved = audit.audit?.approvals?.some(a => {
    const approvalId = a._id || a;
    return approvalId === currentUser?._id;
  });

  // Contar aprobaciones
  const totalReviewers = audit.audit?.reviewers?.length || 0;
  const totalApprovals = audit.audit?.approvals?.length || 0;

  // Estado de aprobación
  const isFullyApproved = totalReviewers > 0 && totalApprovals >= totalReviewers;
  const isInReviewState = audit.audit?.state === 'REVIEW';
  const canApprove = isReviewer && isInReviewState && !hasApproved;

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await auditsApi.addAuditApproval(audit.audit._id);
      
    //   await auditsApi.getAuditById(audit.audit._id);

    await auditsApi.updateAuditState(audit.audit._id, 'APPROVED');

      setSuccess('Has aprobado la auditoría');
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al aprobar');
    } finally {
      setLoading(false);
    }
  };

  const getReviewerName = (reviewer) => {
    if (!reviewer) return 'Usuario';
    if (typeof reviewer === 'string') return reviewer;
    if (reviewer.firstname || reviewer.lastname) {
      return `${reviewer.firstname || ''} ${reviewer.lastname || ''}`.trim();
    }
    return reviewer.username || 'Usuario';
  };

  const getReviewerId = (reviewer) => {
    return reviewer?._id || reviewer;
  };

  return (
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isFullyApproved 
              ? 'bg-success-500/10' 
              : isInReviewState 
                ? 'bg-warning-500/10' 
                : 'bg-gray-500/10'
          }`}>
            {isFullyApproved ? (
              <CheckCircle className="w-5 h-5 text-success-400" />
            ) : isInReviewState ? (
              <Clock className="w-5 h-5 text-warning-400" />
            ) : (
              <Shield className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <h4 className="text-white font-medium">Aprobaciones</h4>
            <p className="text-sm text-gray-500">
              {totalApprovals} de {totalReviewers} revisor(es)
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        {totalReviewers > 0 && (
          <div className="text-right">
            <span className={`text-2xl font-bold ${
              isFullyApproved ? 'text-success-400' : 'text-white'
            }`}>
              {Math.round((totalApprovals / totalReviewers) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalReviewers > 0 && (
        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full transition-all ${
              isFullyApproved ? 'bg-success-500' : 'bg-primary-500'
            }`}
            style={{ width: `${(totalApprovals / totalReviewers) * 100}%` }}
          />
        </div>
      )}

      {/* Status Messages */}
      {!isInReviewState && audit.audit?.state === 'EDIT' && (
        <div className="p-3 bg-info-500/10 border border-info-500/20 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-info-300">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              La auditoría debe estar en estado "En Revisión" para poder aprobar.
            </span>
          </div>
        </div>
      )}

      {isInReviewState && !isFullyApproved && (
        <div className="p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-warning-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Esperando aprobación de los revisores.
            </span>
          </div>
        </div>
      )}

      {isFullyApproved && (
        <div className="p-3 bg-success-500/10 border border-success-500/20 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-success-300">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">
              Auditoría aprobada por todos los revisores.
            </span>
          </div>
        </div>
      )}

      {/* Reviewers List */}
      {totalReviewers > 0 && (
        <div className="space-y-2 mb-4">
          <h5 className="text-xs text-gray-500 uppercase tracking-wider">Revisores</h5>
          {audit.audit.reviewers.map((reviewer, idx) => {
            const reviewerId = getReviewerId(reviewer);
            const isApproved = audit.audit.approvals?.some(a => getReviewerId(a) === reviewerId);
            const isCurrentUser = reviewerId === currentUser?._id;
            
            return (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-2 rounded-lg ${
                  isCurrentUser ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-bg-tertiary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCurrentUser ? 'bg-primary-500/20' : 'bg-gray-700'
                  }`}>
                    <User className={`w-4 h-4 ${isCurrentUser ? 'text-primary-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <span className={`text-sm ${isCurrentUser ? 'text-primary-300' : 'text-white'}`}>
                      {getReviewerName(reviewer)}
                    </span>
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-primary-400">(Tú)</span>
                    )}
                  </div>
                </div>
                {isApproved ? (
                  <span className="flex items-center gap-1 text-success-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Aprobado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    Pendiente
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No Reviewers */}
      {totalReviewers === 0 && (
        <div className="p-3 bg-bg-tertiary rounded-lg mb-4 text-center">
          <User className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            No hay revisores asignados a esta auditoría.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Puedes asignar revisores editando la auditoría.
          </p>
        </div>
      )}

      {/* Action Buttons for Reviewers */}
      {isReviewer && isInReviewState && (
        <div className="pt-4 border-t border-gray-800">
          {hasApproved ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-success-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Ya has aprobado esta auditoría</span>
              </div>
            </div>
          ) : (
            <Button 
              variant="primary" 
              className="w-full"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ThumbsUp className="w-4 h-4 mr-2" />
              )}
              Aprobar Auditoría
            </Button>
          )}
        </div>
      )}

      {/* Message for non-reviewers */}
      {!isReviewer && isInReviewState && totalReviewers > 0 && (
        <div className="pt-4 border-t border-gray-800">
          <p className="text-sm text-gray-500 text-center">
            Solo los revisores asignados pueden aprobar esta auditoría.
          </p>
        </div>
      )}
    </Card>
  );
};

export default ApprovalCard;