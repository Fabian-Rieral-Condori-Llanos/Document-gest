import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Edit,
  Settings,
  AlertTriangle,
  Network,
  FileCode,
  MessageSquare,
  Users,
  CheckCircle,
  Clock,
  Building2,
  Globe,
  Calendar,
  RefreshCw,
  Shield,
  FolderOpen,
} from 'lucide-react';

// Redux
import {
  fetchAuditById,
  fetchAuditFindings,
  selectSelectedAudit,
  selectSelectedAuditLoading,
  selectSelectedAuditError,
  selectAuditFindings,
  selectFindingsLoading,
  clearSelectedAudit,
  clearError,
} from '../../features/audits';

// Components
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import { AuditStateBadge, AuditTypeBadge, FindingsTab, NetworkTab, SectionsTab, CommentsTab, RetestModal, ApprovalCard, AuditStateCard, ProceduresTab } from './components';

// Tabs
const TABS = {
  GENERAL: 'general',
  FINDINGS: 'findings',
  NETWORK: 'network',
  SECTIONS: 'sections',
  PROCEDURES: 'procedures',
  COMMENTS: 'comments',
};

/**
 * AuditDetailPage - Vista detallada de una auditoría
 */
const AuditDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  // Redux state
  const audit = useSelector(selectSelectedAudit);
  const loading = useSelector(selectSelectedAuditLoading);
  const error = useSelector(selectSelectedAuditError);
  const findings = useSelector(selectAuditFindings);
  const findingsLoading = useSelector(selectFindingsLoading);

  // Local state
  const [activeTab, setActiveTab] = useState(TABS.GENERAL);
  const [showRetestModal, setShowRetestModal] = useState(false);

  // Cargar auditoría
  useEffect(() => {
    if (id) {
      dispatch(fetchAuditById(id));
      dispatch(fetchAuditFindings(id));
    }

    return () => {
      dispatch(clearSelectedAudit());
    };
  }, [id, dispatch]);

  const handleBack = () => {
    navigate('/audits');
  };

  const handleEdit = () => {
    navigate(`/audits/${id}/edit`);
  };

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Obtener nombres
  const getCompanyName = () => {
    if (!audit.audit?.company) return '-';
    return typeof audit.audit.company === 'object' ? audit.audit.company.name : audit.audit.company;
  };
  
  console.log("audit in detail page", audit);

  const getClientName = () => {
    if (!audit.audit?.client) return '-';
    const firstname = audit.audit.client?.firstname;
    const lastname = audit.audit.client?.lastname;
    return typeof audit.audit.client === 'object' ? `${firstname || ''} ${lastname || ''}`.trim() : audit.audit.client;
  };

  const getCreatorName = () => {
    if (!audit.audit?.creator) return '-';
    if (typeof audit.audit.creator === 'object') {
      return `${audit.audit.creator.firstname || ''} ${audit.audit.creator.lastname || ''}`.trim() || audit.audit.creator.username;
    }
    return audit.creator;
  };

  // Loading state
  if (loading && !audit) {
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

  // Not found
  if (!loading && !audit) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" icon={ArrowLeft} onClick={handleBack} className="mb-6" />
          <Card className="py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Auditoría no encontrada
              </h3>
              <p className="text-gray-400 mb-6">
                La auditoría que buscas no existe o fue eliminada.
              </p>
              <Button variant="primary" onClick={handleBack}>
                Volver a Auditorías
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: TABS.GENERAL, label: 'General', icon: Settings },
    { id: TABS.FINDINGS, label: `Hallazgos (${findings.length})`, icon: AlertTriangle },
    { id: TABS.NETWORK, label: 'Red', icon: Network },
    // { id: TABS.SECTIONS, label: 'Secciones', icon: FileCode },
    { id: TABS.PROCEDURES, label: 'Procedimiento', icon: FolderOpen },
    { id: TABS.COMMENTS, label: 'Comentarios', icon: MessageSquare },
  ];

  console.log("audit.audit", audit.audit);

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" icon={ArrowLeft} onClick={handleBack} />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  {audit.name}
                </h1>
                <AuditStateBadge state={audit.state} />
                <AuditTypeBadge type={audit.type} />
              </div>
              {audit.auditType && (
                <p className="text-gray-400">{audit.auditType}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" icon={RefreshCw} onClick={() => dispatch(fetchAuditById(id))} />
            <Button 
              variant="secondary" 
              onClick={() => setShowRetestModal(true)}
              title="Crear verificación o retest"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificación
            </Button>
            <Button variant="primary" icon={Edit} onClick={handleEdit}>
              Editar
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-info-500/10">
                <Building2 className="w-5 h-5 text-info-400" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-gray-500">Empresa</p>
                <p className="text-sm font-medium text-white break-words">
                  {getCompanyName()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent-500/10">
                <Globe className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Idioma</p>
                <p className="text-sm font-medium text-white uppercase">{audit.audit.language || '-'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning-500/10">
                <Calendar className="w-5 h-5 text-warning-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Creada</p>
                <p className="text-sm font-medium text-white">{formatDate(audit.audit.createdAt)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-danger-500/10">
                <AlertTriangle className="w-5 h-5 text-danger-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Hallazgos</p>
                <p className="text-sm font-medium text-white">{findings.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-800 mb-6">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary-400 border-primary-400'
                      : 'text-gray-400 border-transparent hover:text-white hover:border-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {/* General Tab */}
          {activeTab === TABS.GENERAL && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <h3 className="text-lg font-medium text-white mb-4">Información General</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Cliente</p>
                      <p className="text-white">{getClientName()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Creador</p>
                      <p className="text-white">{getCreatorName()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fecha Inicio</p>
                      <p className="text-white">{formatDate(audit.audit.date_start)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fecha Fin</p>
                      <p className="text-white">{formatDate(audit.audit.date_end)}</p>
                    </div>
                  </div>
                </Card>

                {audit.audit.summary && (
                  <Card>
                    <h3 className="text-lg font-medium text-white mb-4">Resumen Ejecutivo</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{audit.audit.summary}</p>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Team */}
                <Card>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent-400" />
                    Equipo
                  </h3>
                  
                  {/* Colaboradores */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Colaboradores ({audit.collaborators?.length || 0})</p>
                    {audit.collaborators?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {audit.collaborators.map((collab, idx) => {
                          const name = typeof collab === 'object' 
                            ? `${collab.firstname || ''} ${collab.lastname || ''}`.trim() || collab.username
                            : collab;
                          return (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-bg-tertiary rounded-lg text-sm text-gray-300"
                            >
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Sin colaboradores</p>
                    )}
                  </div>

                  {/* Revisores */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Revisores ({audit.reviewers?.length || 0})</p>
                    {audit.reviewers?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {audit.reviewers.map((reviewer, idx) => {
                          const name = typeof reviewer === 'object' 
                            ? `${reviewer.firstname || ''} ${reviewer.lastname || ''}`.trim() || reviewer.username
                            : reviewer;
                          return (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-bg-tertiary rounded-lg text-sm text-gray-300"
                            >
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Sin revisores</p>
                    )}
                  </div>
                </Card>

                {/* State Management */}
                <AuditStateCard 
                  audit={audit} 
                  onUpdate={() => dispatch(fetchAuditById(id))} 
                />

                {/* Approvals */}
                <ApprovalCard 
                  audit={audit} 
                  onUpdate={() => dispatch(fetchAuditById(id))} 
                />
              </div>
            </div>
          )}

          {/* Findings Tab */}
          {activeTab === TABS.FINDINGS && (
            <FindingsTab
              auditId={id}
              findings={findings}
              findingsLoading={findingsLoading}
              language={audit?.language || 'es'}
              onRefresh={() => dispatch(fetchAuditFindings(id))}
            />
          )}

          {/* Network Tab */}
          {activeTab === TABS.NETWORK && (
            <NetworkTab auditId={id} />
          )}

          {/* Sections Tab */}
          {/* {activeTab === TABS.SECTIONS && (
            <SectionsTab auditId={id} />
          )} */}

          {/* Procedures Tab */}
          {activeTab === TABS.PROCEDURES && (
            <ProceduresTab 
              auditId={id} 
              auditType={audit?.type || 'default'}
            />
          )}

          {/* Comments Tab */}
          {activeTab === TABS.COMMENTS && (
            <CommentsTab 
              auditId={id} 
              comments={audit.comments || []}
              findings={findings}
              // sections={audit.sections || []}
              onRefresh={() => dispatch(fetchAuditById(id))}
            />
          )}
        </div>
      </div>

      {/* Retest/Verification Modal */}
      <RetestModal
        isOpen={showRetestModal}
        onClose={() => setShowRetestModal(false)}
        audit={audit}
        onSuccess={() => dispatch(fetchAuditById(id))}
      />
    </div>
  );
};

export default AuditDetailPage;