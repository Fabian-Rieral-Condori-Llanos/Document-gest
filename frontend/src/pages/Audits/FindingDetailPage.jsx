import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  ExternalLink,
  FileCode,
  Target,
  Link as LinkIcon,
  Copy,
  RefreshCw,
} from 'lucide-react';

// Redux
import {
  fetchAuditFinding,
  deleteAuditFinding,
  selectSelectedFinding,
  selectSelectedFindingLoading,
  selectSelectedFindingError,
  clearSelectedFinding,
  clearError,
} from '../../features/audits';

// Components
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Modal from '../../components/common/Modal/Modal';

// Utils - Calcular severidad desde CVSS
const getSeverityFromScore = (score) => {
  if (score === null || score === undefined) return null;
  
  if (score === 0) return { score, label: 'Ninguna', color: 'bg-gray-500' };
  if (score <= 3.9) return { score, label: 'Baja', color: 'bg-success-500' };
  if (score <= 6.9) return { score, label: 'Media', color: 'bg-warning-500' };
  if (score <= 8.9) return { score, label: 'Alta', color: 'bg-danger-500' };
  return { score, label: 'Crítica', color: 'bg-danger-700' };
};

const PRIORITY_LABELS = {
  1: { label: 'Urgente', color: 'bg-danger-500' },
  2: { label: 'Alta', color: 'bg-warning-500' },
  3: { label: 'Media', color: 'bg-info-500' },
  4: { label: 'Baja', color: 'bg-success-500' },
};

const COMPLEXITY_LABELS = {
  1: { label: 'Fácil', color: 'bg-success-500' },
  2: { label: 'Media', color: 'bg-warning-500' },
  3: { label: 'Difícil', color: 'bg-danger-500' },
};

const RETEST_STATUS = {
  ok: { label: 'Remediado', color: 'bg-success-500', icon: CheckCircle },
  ko: { label: 'No Remediado', color: 'bg-danger-500', icon: AlertTriangle },
  partial: { label: 'Parcialmente', color: 'bg-warning-500', icon: RefreshCw },
  unknown: { label: 'Sin Verificar', color: 'bg-gray-500', icon: Clock },
};

/**
 * FindingDetailPage - Ver detalle de un hallazgo
 */
const FindingDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { auditId, findingId } = useParams();

  // Redux state
  const finding = useSelector(selectSelectedFinding);
  const loading = useSelector(selectSelectedFindingLoading);
  const error = useSelector(selectSelectedFindingError);

  // Local state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  // Cargar finding
  useEffect(() => {
    if (auditId && findingId) {
      dispatch(fetchAuditFinding({ auditId, findingId }));
    }

    return () => {
      dispatch(clearSelectedFinding());
      dispatch(clearError());
    };
  }, [dispatch, auditId, findingId]);

  // Handlers
  const handleBack = () => {
    navigate(`/audits/${auditId}`);
  };

  const handleEdit = () => {
    navigate(`/audits/${auditId}/findings/${findingId}/edit`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');

    try {
      await dispatch(deleteAuditFinding({ auditId, findingId })).unwrap();
      navigate(`/audits/${auditId}`);
    } catch (error) {
      setDeleteError(error?.message || error || 'Error al eliminar el hallazgo');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400">Cargando hallazgo...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" icon={ArrowLeft} onClick={handleBack} className="mb-6" />
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
          <Button variant="primary" onClick={handleBack}>
            Volver a la Auditoría
          </Button>
        </div>
      </div>
    );
  }

  // Not found
  if (!loading && !finding) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" icon={ArrowLeft} onClick={handleBack} className="mb-6" />
          <Card className="py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                <AlertTriangle className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Hallazgo no encontrado
              </h3>
              <p className="text-gray-400 mb-6">
                El hallazgo que buscas no existe o fue eliminado.
              </p>
              <Button variant="primary" onClick={handleBack}>
                Volver a la Auditoría
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // El backend retorna cvssScore y severity calculados
  const severity31 = finding.cvssv3 ? getSeverityFromScore(finding.cvssScore) : null;
  const severity40 = finding.cvssv4 && !finding.cvssv3 ? getSeverityFromScore(finding.cvssScore) : null;
  
  const priorityInfo = PRIORITY_LABELS[finding?.priority] || PRIORITY_LABELS[3];
  const complexityInfo = COMPLEXITY_LABELS[finding?.remediationComplexity] || COMPLEXITY_LABELS[2];
  const retestInfo = finding?.retestStatus ? RETEST_STATUS[finding.retestStatus] : null;

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" icon={ArrowLeft} onClick={handleBack} />
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-sm text-gray-500">#{finding.identifier || '?'}</span>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  {finding.title}
                </h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {finding.category && (
                  <span className="px-2 py-1 bg-bg-tertiary rounded text-sm text-gray-300">
                    {finding.category}
                  </span>
                )}
                {finding.vulnType && (
                  <span className="px-2 py-1 bg-accent-500/10 text-accent-400 rounded text-sm">
                    {finding.vulnType}
                  </span>
                )}
                <span className={`px-2 py-1 rounded text-sm ${
                  finding.status === 0 
                    ? 'bg-success-500/10 text-success-400' 
                    : 'bg-warning-500/10 text-warning-400'
                }`}>
                  {finding.status === 0 ? 'Completado' : 'Redactando'}
                </span>
                {finding.severity && (
                  <span className={`px-2 py-1 rounded text-sm font-medium text-white ${
                    finding.severity === 'Critical' ? 'bg-danger-700' :
                    finding.severity === 'High' ? 'bg-danger-500' :
                    finding.severity === 'Medium' ? 'bg-warning-500' :
                    finding.severity === 'Low' ? 'bg-success-500' :
                    'bg-gray-500'
                  }`}>
                    {finding.severity}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-12 lg:ml-0">
            <Button variant="danger" icon={Trash2} onClick={() => setShowDeleteModal(true)}>
              Eliminar
            </Button>
            <Button variant="primary" icon={Edit} onClick={handleEdit}>
              Editar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Severity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CVSS 3.1 */}
              {finding.cvssv3 && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">CVSS v3.1</span>
                    <button
                      onClick={() => copyToClipboard(finding.cvssv3, 'cvss31')}
                      className="p-1 hover:bg-bg-tertiary rounded"
                      title="Copiar vector"
                    >
                      <Copy className={`w-4 h-4 ${copiedField === 'cvss31' ? 'text-success-400' : 'text-gray-500'}`} />
                    </button>
                  </div>
                  {finding.cvssScore !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-lg ${severity31?.color || 'bg-gray-500'} flex items-center justify-center`}>
                        <span className="text-2xl font-bold text-white">
                          {finding.cvssScore?.toFixed(1) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{severity31?.label || finding.severity}</p>
                        <p className="text-xs text-gray-500 font-mono truncate max-w-[180px]">
                          {finding.cvssv3}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* CVSS 4.0 */}
              {finding.cvssv4 && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">CVSS v4.0</span>
                    <button
                      onClick={() => copyToClipboard(finding.cvssv4, 'cvss40')}
                      className="p-1 hover:bg-bg-tertiary rounded"
                      title="Copiar vector"
                    >
                      <Copy className={`w-4 h-4 ${copiedField === 'cvss40' ? 'text-success-400' : 'text-gray-500'}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-lg ${severity40?.color || 'bg-gray-500'} flex items-center justify-center`}>
                      <span className="text-2xl font-bold text-white">
                        {finding.cvssScore?.toFixed(1) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{severity40?.label || finding.severity}</p>
                      <p className="text-xs text-gray-500 font-mono truncate max-w-[180px]">
                        {finding.cvssv4}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Description */}
            {finding.description && (
              <Card>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-400" />
                  Descripción
                </h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{finding.description}</p>
                </div>
              </Card>
            )}

            {/* Observation */}
            {finding.observation && (
              <Card>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-warning-400" />
                  Observación
                </h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{finding.observation}</p>
                </div>
              </Card>
            )}

            {/* POC */}
            {finding.poc && (
              <Card>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-accent-400" />
                  Prueba de Concepto (PoC)
                </h3>
                <div className="bg-bg-tertiary rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {finding.poc}
                  </pre>
                </div>
              </Card>
            )}

            {/* Remediation */}
            {finding.remediation && (
              <Card>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-400" />
                  Remediación
                </h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{finding.remediation}</p>
                </div>
              </Card>
            )}

            {/* References */}
            {finding.references && finding.references.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-info-400" />
                  Referencias
                </h3>
                <div className="space-y-2">
                  {finding.references.map((ref, idx) => (
                    <a
                      key={idx}
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-lg text-info-400 hover:text-info-300 hover:bg-gray-800 transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate text-sm">{ref}</span>
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-danger-400" />
                Información
              </h3>

              <div className="space-y-4">
                {/* Scope */}
                {finding.scope && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Alcance</p>
                    <p className="text-white font-mono text-sm bg-bg-tertiary px-2 py-1 rounded">
                      {finding.scope}
                    </p>
                  </div>
                )}

                {/* Priority */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Prioridad</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium text-white ${priorityInfo.color}`}>
                    {priorityInfo.label}
                  </span>
                </div>

                {/* Complexity */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Complejidad de Remediación</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium text-white ${complexityInfo.color}`}>
                    {complexityInfo.label}
                  </span>
                </div>

                {/* Retest Status */}
                {retestInfo && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estado de Verificación</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium text-white ${retestInfo.color}`}>
                      <retestInfo.icon className="w-4 h-4" />
                      {retestInfo.label}
                    </span>
                    {finding.retestDescription && (
                      <p className="text-sm text-gray-400 mt-2">{finding.retestDescription}</p>
                    )}
                  </div>
                )}

                {/* Vulnerability Reference */}
                {finding.vulnerabilityId && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Vulnerabilidad Original</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {finding.vulnerabilityId}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions Card */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Acciones</h3>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  icon={Edit}
                  fullWidth
                  onClick={handleEdit}
                >
                  Editar Hallazgo
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={handleBack}
                >
                  Volver a la Auditoría
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Hallazgo"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            ¿Estás seguro de que deseas eliminar el hallazgo <strong className="text-white">"{finding?.title}"</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>

          {deleteError && (
            <Alert variant="error" className="mt-4">
              {deleteError}
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FindingDetailPage;