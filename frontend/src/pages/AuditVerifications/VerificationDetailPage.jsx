import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  Target,
  TrendingUp,
  Building2,
  Calendar,
} from 'lucide-react';

// API
import * as auditsApi from '../../api/endpoints/audits.api';

// Components
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';

// Opciones de estado de verificación
const RETEST_OPTIONS = [
  { 
    value: 'ok', 
    label: 'Remediado', 
    icon: CheckCircle, 
    color: 'bg-success-500',
    hoverColor: 'hover:bg-success-500/20',
    textColor: 'text-success-400',
    description: 'La vulnerabilidad ha sido corregida'
  },
  { 
    value: 'ko', 
    label: 'No Remediado', 
    icon: XCircle, 
    color: 'bg-danger-500',
    hoverColor: 'hover:bg-danger-500/20',
    textColor: 'text-danger-400',
    description: 'La vulnerabilidad sigue presente'
  },
  { 
    value: 'partial', 
    label: 'Parcial', 
    icon: AlertCircle, 
    color: 'bg-warning-500',
    hoverColor: 'hover:bg-warning-500/20',
    textColor: 'text-warning-400',
    description: 'Parcialmente remediado'
  },
];

// Utilidad para obtener severidad desde CVSS
const getSeverityFromCvss = (cvssVector) => {
  if (!cvssVector) return { label: 'N/A', color: 'bg-gray-500' };
  
  let score = null;
  if (cvssVector.startsWith('CVSS:3.1/') || cvssVector.startsWith('CVSS:3.0/')) {
    const metrics = {};
    cvssVector.replace(/CVSS:3\.[01]\//, '').split('/').forEach(part => {
      const [key, value] = part.split(':');
      if (key && value) metrics[key] = value;
    });
    
    const { AV, AC, PR, UI, C, I, A } = metrics;
    if (AV && C) {
      score = 5.0;
      if (AV === 'N') score += 2;
      if (AC === 'L') score += 1;
      if (PR === 'N') score += 0.5;
      if (UI === 'N') score += 0.5;
      if (C === 'H') score += 0.5;
      if (I === 'H') score += 0.3;
      if (A === 'H') score += 0.2;
      score = Math.min(score, 10);
    }
  }
  
  if (score === null) return { score: null, label: 'N/A', color: 'bg-gray-500' };
  if (score === 0) return { score, label: 'Info', color: 'bg-gray-500' };
  if (score <= 3.9) return { score, label: 'Baja', color: 'bg-success-500' };
  if (score <= 6.9) return { score, label: 'Media', color: 'bg-warning-500' };
  if (score <= 8.9) return { score, label: 'Alta', color: 'bg-danger-500' };
  return { score, label: 'Crítica', color: 'bg-danger-700' };
};

/**
 * VerificationDetailPage - Página para gestionar verificación de hallazgos
 * Permite cambiar el estado de cada finding con botones rápidos
 */
const VerificationDetailPage = () => {
  const navigate = useNavigate();
  const { auditId } = useParams();

  // State
  const [audit, setAudit] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estado de edición
  const [expandedFinding, setExpandedFinding] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, [auditId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Cargar auditoría
      const auditResponse = await auditsApi.getAuditById(auditId);
      setAudit(auditResponse.data);
      // Cargar findings
      const findingsResponse = await auditsApi.getAuditFindings(auditId);
      setFindings(findingsResponse.data?.findings || []);
    } catch (err) {
      setError('Error al cargar la verificación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

//   // Calcular estadísticas
  const stats = useMemo(() => {
    const total = findings.length;
    const ok = findings.filter(f => f.retestStatus === 'ok').length;
    const ko = findings.filter(f => f.retestStatus === 'ko').length;
    const partial = findings.filter(f => f.retestStatus === 'partial').length;
    const unknown = findings.filter(f => !f.retestStatus || f.retestStatus === 'unknown').length;
    const progress = total > 0 ? Math.round(((ok + ko + partial) / total) * 100) : 0;
    
    return { total, ok, ko, partial, unknown, progress };
  }, [findings]);

  // Handler para seleccionar estado
  const handleSelectStatus = (findingId, status) => {
    const finding = findings.find(f => (f._id || f.id) === findingId);
    
    // Si ya tiene el mismo estado, solo actualizar sin descripción
    if (finding?.retestStatus === status) {
      return;
    }
    
    setExpandedFinding(findingId);
    setSelectedStatus(status);
    setDescription(finding?.retestDescription || '');
  };

  // Handler para guardar estado
  const handleSaveStatus = async (findingId) => {
    if (!selectedStatus) return;
    
    try {
      setSaving(true);
      setError('');
      
      await auditsApi.updateAuditFinding(auditId, findingId, {
        retestStatus: selectedStatus,
        retestDescription: description.trim() || undefined,
      });
      
      // Actualizar estado local
      setFindings(prev => prev.map(f => {
        if ((f._id || f.id) === findingId) {
          return { ...f, retestStatus: selectedStatus, retestDescription: description.trim() };
        }
        return f;
      }));
      
      setSuccess('Estado actualizado correctamente');
      setTimeout(() => setSuccess(''), 2000);
      
      // Cerrar panel
      handleCancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setSaving(false);
    }
  };

  // Handler para actualización rápida (sin descripción)
  const handleQuickUpdate = async (findingId, status) => {
    const finding = findings.find(f => (f._id || f.id) === findingId);
    
    // Si ya tiene el mismo estado, no hacer nada
    if (finding?.retestStatus === status) {
      return;
    }
    
    try {
      setSaving(true);
      
      await auditsApi.updateAuditFinding(auditId, findingId, {
        retestStatus: status,
      });
      
      // Actualizar estado local
      setFindings(prev => prev.map(f => {
        if ((f._id || f.id) === findingId) {
          return { ...f, retestStatus: status };
        }
        return f;
      }));
      
      setSuccess('Estado actualizado');
      setTimeout(() => setSuccess(''), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setExpandedFinding(null);
    setSelectedStatus(null);
    setDescription('');
  };

  // Obtener info del estado actual
  const getStatusInfo = (status) => {
    if (!status || status === 'unknown') {
      return { label: 'Pendiente', color: 'bg-gray-500', textColor: 'text-gray-400', icon: Clock };
    }
    return RETEST_OPTIONS.find(o => o.value === status) || RETEST_OPTIONS[0];
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400">Cargando verificación...</p>
        </div>
      </div>
    );
  }

  // No encontrado
  if (!audit) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/audit-verifications')} className="mb-6">
            Volver
          </Button>
          <Card className="py-12 text-center">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Verificación no encontrada</h3>
            <p className="text-gray-400">La verificación solicitada no existe o fue eliminada.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/audit-verifications')} />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-primary-400" />
                <h1 className="text-2xl font-bold text-white">{audit.name}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                {audit.company?.name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {audit.company.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(audit.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>
          
          <Button variant="secondary" icon={RefreshCw} onClick={loadData} disabled={loading}>
            Actualizar
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="mb-6">
            {success}
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-400">Total</p>
          </Card>
          <Card className="p-4 text-center bg-success-500/5 border-success-500/20">
            <p className="text-2xl font-bold text-success-400">{stats.ok}</p>
            <p className="text-xs text-gray-400">Remediados</p>
          </Card>
          <Card className="p-4 text-center bg-danger-500/5 border-danger-500/20">
            <p className="text-2xl font-bold text-danger-400">{stats.ko}</p>
            <p className="text-xs text-gray-400">No Remediados</p>
          </Card>
          <Card className="p-4 text-center bg-warning-500/5 border-warning-500/20">
            <p className="text-2xl font-bold text-warning-400">{stats.partial}</p>
            <p className="text-xs text-gray-400">Parciales</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{stats.unknown}</p>
            <p className="text-xs text-gray-400">Pendientes</p>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progreso de verificación</span>
            <span className="text-sm font-medium text-white">{stats.progress}%</span>
          </div>
          <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden flex">
            {stats.ok > 0 && (
              <div 
                className="h-full bg-success-500 transition-all"
                style={{ width: `${(stats.ok / stats.total) * 100}%` }}
              />
            )}
            {stats.partial > 0 && (
              <div 
                className="h-full bg-warning-500 transition-all"
                style={{ width: `${(stats.partial / stats.total) * 100}%` }}
              />
            )}
            {stats.ko > 0 && (
              <div 
                className="h-full bg-danger-500 transition-all"
                style={{ width: `${(stats.ko / stats.total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success-500"></span>
              <span className="text-gray-400">Remediados ({stats.ok})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-warning-500"></span>
              <span className="text-gray-400">Parciales ({stats.partial})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-danger-500"></span>
              <span className="text-gray-400">No Remediados ({stats.ko})</span>
            </span>
          </div>
        </Card>

        {/* Findings List */}
        <Card>
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-lg font-medium text-white">
              Hallazgos a Verificar ({findings.length})
            </h3>
          </div>

          {findings.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No hay hallazgos para verificar</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {findings.map((finding) => {
                const findingId = finding._id || finding.id;
                const severity = getSeverityFromCvss(finding.cvssv3 || finding.cvssv4);
                const statusInfo = getStatusInfo(finding.retestStatus);
                const isExpanded = expandedFinding === findingId;
                const StatusIcon = statusInfo.icon;

                return (
                  <div key={findingId} className="p-4">
                    {/* Finding Header */}
                    <div className="flex items-start justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 font-mono">
                            #{finding.identifier || '?'}
                          </span>
                          <h4 className="text-white font-medium truncate">
                            {finding.title || 'Sin título'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {finding.category && (
                            <span className="px-2 py-0.5 bg-bg-tertiary rounded text-xs text-gray-400">
                              {finding.category}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${severity.color}`}>
                            {severity.score?.toFixed(1) || 'N/A'} - {severity.label}
                          </span>
                          {/* Estado actual */}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${statusInfo.color} text-white`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        {finding.retestDescription && !isExpanded && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {finding.retestDescription}
                          </p>
                        )}
                      </div>

                      {/* Botones de Estado */}
                      <div className="flex items-center gap-1">
                        {RETEST_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          const isSelected = finding.retestStatus === option.value;
                          
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleQuickUpdate(findingId, option.value)}
                              onDoubleClick={() => handleSelectStatus(findingId, option.value)}
                              disabled={saving}
                              className={`p-2.5 rounded-lg transition-all ${
                                isSelected
                                  ? `${option.color} text-white`
                                  : `bg-bg-tertiary ${option.textColor} ${option.hoverColor}`
                              }`}
                              title={`${option.label} - Doble click para agregar descripción`}
                            >
                              <Icon className="w-5 h-5" />
                            </button>
                          );
                        })}
                        
                        {/* Botón expandir para descripción */}
                        <button
                          onClick={() => isExpanded ? handleCancelEdit() : handleSelectStatus(findingId, finding.retestStatus || 'ok')}
                          className="p-2 ml-1 text-gray-500 hover:text-white hover:bg-bg-tertiary rounded-lg"
                          title="Agregar/editar descripción"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Panel Expandido para Descripción */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="space-y-3">
                          {/* Selector de estado */}
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                              Estado de Verificación
                            </label>
                            <div className="flex gap-2">
                              {RETEST_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                return (
                                  <button
                                    key={option.value}
                                    onClick={() => setSelectedStatus(option.value)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                      selectedStatus === option.value
                                        ? `${option.color} text-white`
                                        : `bg-bg-tertiary text-gray-400 hover:text-white`
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm"
                              icon={Save}
                              onClick={() => handleSaveStatus(findingId)}
                              isLoading={saving}
                              disabled={!selectedStatus}
                            >
                              Guardar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-500"></p>
          <div className="flex gap-3">
            <Button 
              variant="ghost"
              onClick={() => navigate(`/audits/${auditId}`)}
            >
              Ver Auditoría Completa
            </Button>
            {stats.progress === 100 && (
              <Button variant="primary" icon={CheckCircle}>
                Finalizar Verificación
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationDetailPage;