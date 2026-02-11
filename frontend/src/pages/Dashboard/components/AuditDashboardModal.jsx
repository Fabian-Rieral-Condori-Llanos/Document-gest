import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from 'recharts';
import { 
  X, FileText, Loader2, AlertTriangle, Shield, Building2,
  Calendar, Clock, User, Users, CheckCircle, XCircle,
  AlertOctagon, FileCheck, Folder, ChevronDown, ExternalLink,
  Target, TrendingUp, Activity
} from 'lucide-react';
import analyticsApi from '../../../api/endpoints/analytics.api';
import VulnerabilidadesChart from './VulnerabilidadesChart';

/**
 * Badge de Estado
 */
const EstadoBadge = ({ estado, size = 'normal' }) => {
  const estilos = {
    'EVALUANDO': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'VERIFICACION': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'FINALIZADAS': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'OBSERVACION': 'bg-red-500/15 text-red-400 border-red-500/30',
    'EDIT': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'REVIEW': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'APPROVED': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  
  const sizeClasses = size === 'large' 
    ? 'px-3 py-1.5 text-sm' 
    : 'px-2.5 py-1 text-xs';
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${estilos[estado] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'} ${sizeClasses}`}>
      {estado}
    </span>
  );
};

/**
 * Badge de Severidad
 */
const SeveridadBadge = ({ severidad }) => {
  const estilos = {
    'Crítica': 'bg-red-500/20 text-red-400',
    'Alta': 'bg-orange-500/20 text-orange-400',
    'Media': 'bg-amber-500/20 text-amber-400',
    'Baja': 'bg-lime-500/20 text-lime-400',
    'Info': 'bg-cyan-500/20 text-cyan-400',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${estilos[severidad] || 'bg-gray-500/20 text-gray-400'}`}>
      {severidad}
    </span>
  );
};

/**
 * Badge de Estado de Verificación
 */
const RetestBadge = ({ status }) => {
  const config = {
    'ok': { label: 'Remediada', class: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
    'ko': { label: 'No Remediada', class: 'bg-red-500/20 text-red-400', icon: XCircle },
    'partial': { label: 'Parcial', class: 'bg-amber-500/20 text-amber-400', icon: AlertTriangle },
    'unknown': { label: 'Sin Verificar', class: 'bg-gray-500/20 text-gray-400', icon: Clock },
  };
  
  const { label, class: className, icon: Icon } = config[status] || config['unknown'];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${className}`}>
      <Icon size={10} />
      {label}
    </span>
  );
};

/**
 * Card de Estadística
 */
const StatCard = ({ icon: Icon, label, value, subvalue, color = 'gray' }) => {
  const colorClasses = {
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
  };
  
  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} />
        <span className="text-[10px] uppercase tracking-wide opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      {subvalue && <div className="text-[10px] text-gray-500">{subvalue}</div>}
    </div>
  );
};

/**
 * Barra de Progreso
 */
const ProgressBar = ({ value, label, color = 'primary' }) => {
  const colorClass = {
    primary: 'bg-primary-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }[color] || 'bg-primary-500';
  
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">{label}</span>
          <span className="text-white font-medium">{value}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Tooltip personalizado para gráficos
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-bg-secondary border border-gray-700 rounded-lg p-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="text-white font-medium text-sm">{data.name}</span>
        </div>
        <p className="text-gray-400 text-xs">
          Cantidad: <span className="text-white font-semibold">{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * AuditDashboardModal - Modal con estadísticas de una auditoría
 */
const AuditDashboardModal = ({ 
  isOpen, 
  onClose, 
  auditId,
  onViewCompany
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllFindings, setShowAllFindings] = useState(false);

  useEffect(() => {
    if (isOpen && auditId) {
      loadAuditData();
    }
  }, [isOpen, auditId]);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getAuditDashboard(auditId);
      setData(response.data);
    } catch (err) {
      console.error('Error loading audit dashboard:', err);
      setError('Error al cargar las estadísticas de la auditoría');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const audit = data?.audit || {};
  const company = data?.company;
  const creator = data?.creator;
  const collaborators = data?.collaborators || [];
  const procedure = data?.procedure;
  const stats = data?.stats || {};
  const vulnsPorSeveridad = data?.vulnerabilidadesPorSeveridad || [];
  const estadoVerificacion = data?.estadoVerificacion || [];
  const findingsPorCategoria = data?.findingsPorCategoria || [];
  const findings = data?.findings || [];

  const tabs = [
    { key: 'overview', label: 'Resumen', icon: Activity },
    { key: 'findings', label: `Hallazgos (${stats.totalFindings || 0})`, icon: AlertTriangle },
    { key: 'procedure', label: 'Procedimiento', icon: FileCheck },
  ];

  const estadoVerificacionFinal = {
    noRemediadas: 0,
    parciales: 0,
    remediadas: 0,
    sinVerificar: 0,
    totalVerificadas: 0
  };

  estadoVerificacion.forEach(item => {
  const { name, value } = item;

    // Asignar valor basado en el nombre
    switch (name) {
      case "Remediadas":
        estadoVerificacionFinal.remediadas = value;
        break;
      case "No Remediadas":
        estadoVerificacionFinal.noRemediadas = value;
        break;
      case "Parciales":
        estadoVerificacionFinal.parciales = value;
        break;
      case "Sin Verificar":
        estadoVerificacionFinal.sinVerificar = value;
        break;
    }
  });

  // Calcular el total de verificadas
  estadoVerificacionFinal.totalVerificadas = 
  estadoVerificacionFinal.remediadas +
  estadoVerificacionFinal.noRemediadas +
  estadoVerificacionFinal.parciales +
  estadoVerificacionFinal.sinVerificar;

  const findingsToShow = showAllFindings ? findings : findings.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-bg-secondary border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-700">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-500/10">
              <FileText size={24} className="text-primary-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">
                  {audit.name || 'Dashboard de Auditoría'}
                </h2>
                <EstadoBadge estado={audit.status || audit.state} size="large" />
              </div>
              {company && (
                <button 
                  onClick={() => onViewCompany?.(company.id, company.name)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-400 transition-colors"
                >
                  <Building2 size={14} />
                  {company.name}
                  <ExternalLink size={12} />
                </button>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {audit.auditType && (
                  <span className="flex items-center gap-1">
                    <Folder size={12} />
                    {audit.auditType}
                  </span>
                )}
                {audit.dateStart && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(audit.dateStart).toLocaleDateString('es-BO')}
                    {audit.dateEnd && ` - ${new Date(audit.dateEnd).toLocaleDateString('es-BO')}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-bg-tertiary text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-bg-tertiary/30">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'text-primary-400 border-primary-500 bg-primary-500/5'
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-bg-tertiary/50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-200px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-primary-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertTriangle size={48} className="text-red-400 mb-4" />
              <p className="text-red-300 mb-4">{error}</p>
              <button 
                onClick={loadAuditData}
                className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StatCard 
                      icon={AlertTriangle} 
                      label="Total Hallazgos" 
                      value={stats.totalFindings || 0}
                      color="primary"
                    />
                    <StatCard 
                      icon={AlertOctagon} 
                      label="Críticas" 
                      value={stats.criticas || 0}
                      color="red"
                    />
                    <StatCard 
                      icon={AlertTriangle} 
                      label="Altas" 
                      value={stats.altas || 0}
                      color="orange"
                    />
                    <StatCard 
                      icon={CheckCircle} 
                      label="Remediadas" 
                      value={stats.remediadas || 0}
                      subvalue={`${stats.tasaRemediacion || 0}% tasa`}
                      color="emerald"
                    />
                    <StatCard 
                      icon={Clock} 
                      label="Días Eval." 
                      value={stats.tiempoEvaluacionDias || '-'}
                      color="blue"
                    />
                    <StatCard 
                      icon={Target} 
                      label="Completado" 
                      value={`${stats.porcentajeCompletado || 0}%`}
                      color="purple"
                    />
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vulnerabilidades por Severidad */}
                    <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                      <VulnerabilidadesChart
                        vulnerabilidadesPorSeveridad={vulnsPorSeveridad}
                        verificacion={estadoVerificacionFinal}
                        loading={loading}
                        title="Análisis de Vulnerabilidades"
                      />
                    </div>

                    {/* Estado de Verificación */}
                    <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                      <h3 className="text-sm font-semibold text-white mb-4">Estado de Verificación</h3>
                      {estadoVerificacion.length > 0 && stats.totalFindings > 0 ? (
                        <div className="space-y-3">
                          {estadoVerificacion.map((item, index) => {
                            const percentage = stats.totalFindings > 0 
                              ? Math.round((item.value / stats.totalFindings) * 100) 
                              : 0;
                            return (
                              <div key={index}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="flex items-center gap-2">
                                    <span 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-gray-400">{item.name}</span>
                                  </span>
                                  <span className="text-white font-medium">
                                    {item.value} ({percentage}%)
                                  </span>
                                </div>
                                <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${percentage}%`,
                                      backgroundColor: item.color 
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center text-gray-500">
                          <Clock size={32} className="mr-2 opacity-50" />
                          Sin verificaciones
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Equipo */}
                  {(creator || collaborators.length > 0) && (
                    <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                      <h3 className="text-sm font-semibold text-white mb-3">Equipo</h3>
                      <div className="flex flex-wrap gap-3">
                        {creator && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                            <User size={14} className="text-primary-400" />
                            <div>
                              <div className="text-xs text-white">{creator.fullName || creator.username}</div>
                              <div className="text-[10px] text-gray-500">Creador</div>
                            </div>
                          </div>
                        )}
                        {collaborators.map((collab, index) => (
                          <div key={index} className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                            <Users size={14} className="text-gray-400" />
                            <div>
                              <div className="text-xs text-white">{collab.fullName || collab.username}</div>
                              <div className="text-[10px] text-gray-500">Colaborador</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Findings */}
              {activeTab === 'findings' && (
                <div className="space-y-4">
                  {findings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <Shield size={48} className="mb-4 opacity-50" />
                      <p>No hay hallazgos registrados</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-bg-tertiary">
                            <tr>
                              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                                Hallazgo
                              </th>
                              <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-24">
                                Severidad
                              </th>
                              <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-20">
                                CVSS
                              </th>
                              <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-28">
                                Estado
                              </th>
                              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                                Categoría
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {findingsToShow.map((finding, index) => (
                              <tr 
                                key={finding.id || index}
                                className="border-b border-gray-800/50 hover:bg-bg-tertiary/50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <div className="text-sm text-white">{finding.title}</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <SeveridadBadge severidad={finding.severity} />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-sm font-mono font-semibold ${
                                    finding.cvssScore >= 9 ? 'text-red-400' :
                                    finding.cvssScore >= 7 ? 'text-orange-400' :
                                    finding.cvssScore >= 4 ? 'text-amber-400' :
                                    'text-lime-400'
                                  }`}>
                                    {finding.cvssScore?.toFixed(1) || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <RetestBadge status={finding.retestStatus} />
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-gray-400">{finding.category}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {findings.length > 10 && (
                        <div className="text-center">
                          <button
                            onClick={() => setShowAllFindings(!showAllFindings)}
                            className="text-sm text-primary-400 hover:text-primary-300 font-medium"
                          >
                            {showAllFindings 
                              ? 'Mostrar menos' 
                              : `Ver todos (${findings.length} hallazgos)`
                            }
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Tab: Procedure */}
              {activeTab === 'procedure' && (
                <div className="space-y-6">
                  {!procedure ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <FileCheck size={48} className="mb-4 opacity-50" />
                      <p>No hay información de procedimiento</p>
                    </div>
                  ) : (
                    <>
                      {/* Info básica del procedimiento */}
                      <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                        <h3 className="text-sm font-semibold text-white mb-4">Información del Procedimiento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-500">Origen</span>
                            <div className="text-sm text-white mt-1">
                              {procedure.origen || 'No especificado'}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Alcance</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {procedure.alcance?.map((alc, i) => (
                                <span 
                                  key={i}
                                  className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded"
                                >
                                  {alc}
                                </span>
                              )) || <span className="text-sm text-gray-400">No especificado</span>}
                            </div>
                          </div>
                          {procedure.alcanceDescripcion && (
                            <div className="md:col-span-2">
                              <span className="text-xs text-gray-500">Descripción del Alcance</span>
                              <div className="text-sm text-gray-300 mt-1">
                                {procedure.alcanceDescripcion}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Documentación de Evaluación */}
                      {procedure.documentacion && (
                        <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                          <h3 className="text-sm font-semibold text-white mb-4">Documentación de Evaluación</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(procedure.documentacion).map(([key, value]) => (
                              <div 
                                key={key}
                                className={`p-3 rounded-lg border ${
                                  value?.cite 
                                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                                    : 'bg-bg-secondary border-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {value?.cite ? (
                                    <CheckCircle size={12} className="text-emerald-400" />
                                  ) : (
                                    <Clock size={12} className="text-gray-500" />
                                  )}
                                  <span className="text-xs text-gray-400 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                </div>
                                {value?.cite ? (
                                  <div className="text-xs text-white font-mono">{value.cite}</div>
                                ) : (
                                  <div className="text-xs text-gray-500">Pendiente</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documentación de Retest */}
                      {procedure.retest && Object.values(procedure.retest).some(v => v?.cite) && (
                        <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                          <h3 className="text-sm font-semibold text-white mb-4">Documentación de Verificación</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(procedure.retest).map(([key, value]) => (
                              <div 
                                key={key}
                                className={`p-3 rounded-lg border ${
                                  value?.cite 
                                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                                    : 'bg-bg-secondary border-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {value?.cite ? (
                                    <CheckCircle size={12} className="text-emerald-400" />
                                  ) : (
                                    <Clock size={12} className="text-gray-500" />
                                  )}
                                  <span className="text-xs text-gray-400 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').replace('Retest', '').trim()}
                                  </span>
                                </div>
                                {value?.cite ? (
                                  <div className="text-xs text-white font-mono">{value.cite}</div>
                                ) : (
                                  <div className="text-xs text-gray-500">Pendiente</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditDashboardModal;