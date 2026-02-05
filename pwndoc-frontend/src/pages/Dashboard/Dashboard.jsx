import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Area, AreaChart, Line
} from 'recharts';
import { 
  Shield, FileText, Building2, AlertTriangle, CheckCircle, Clock, 
  Calendar, Bell, ChevronDown, ChevronRight, Eye,
  ExternalLink, RefreshCw, Loader2, X
} from 'lucide-react';
import analyticsApi from '../../api/endpoints/analytics.api';

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'primary', loading }) => {
  const colorClasses = {
    primary: 'bg-primary-500/10 text-primary-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    red: 'bg-red-500/10 text-red-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <div className="bg-bg-secondary rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {loading ? <Loader2 size={24} className="animate-spin" /> : value}
      </div>
      <div className="text-sm text-gray-400">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
};

const MiniStatCard = ({ icon: Icon, title, value, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-500/10 text-primary-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    red: 'bg-red-500/10 text-red-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <div className="bg-bg-tertiary rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={16} strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-lg font-bold text-white">{value}</div>
          <div className="text-xs text-gray-400">{title}</div>
        </div>
      </div>
    </div>
  );
};

const EstadoBadge = ({ estado }) => {
  const estilos = {
    'EVALUANDO': 'bg-blue-500/15 text-blue-400',
    'VERIFICACION': 'bg-amber-500/15 text-amber-400',
    'FINALIZADAS': 'bg-emerald-500/15 text-emerald-400',
    'OBSERVACION': 'bg-red-500/15 text-red-400',
    'EDIT': 'bg-blue-500/15 text-blue-400',
    'REVIEW': 'bg-purple-500/15 text-purple-400',
    'APPROVED': 'bg-emerald-500/15 text-emerald-400',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${estilos[estado] || 'bg-gray-500/15 text-gray-400'}`}>
      {estado}
    </span>
  );
};

const TipoBadge = ({ tipo }) => {
  const tipos = {
    'PR01': { label: 'Solicitud EP', class: 'bg-indigo-500/20 text-indigo-300' },
    'PR02': { label: 'Interna', class: 'bg-cyan-500/20 text-cyan-300' },
    'PR03': { label: 'Externa', class: 'bg-emerald-500/20 text-emerald-300' },
    'PR09': { label: 'Sol. AGETIC', class: 'bg-amber-500/20 text-amber-300' },
    'Verificación': { label: 'Verificación', class: 'bg-purple-500/20 text-purple-300' },
  };
  
  const tipoKey = tipo?.split(' - ')[0] || tipo;
  const config = tipos[tipoKey] || { label: tipo || 'Sin tipo', class: 'bg-gray-500/20 text-gray-400' };
  
  return (
    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide ${config.class}`}>
      {config.label}
    </span>
  );
};

const VulnCount = ({ count, type }) => {
  const styles = {
    critical: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    safe: 'bg-emerald-500/10 text-emerald-400',
  };
  
  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded text-xs font-semibold font-mono ${styles[type]}`}>
      {count}
    </span>
  );
};

const ProgressBar = ({ value }) => {
  const color = value > 80 ? 'bg-emerald-500' : value > 50 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-400 font-mono w-10">{value}%</span>
    </div>
  );
};

// ==========================================
// MODAL DE ESTADÍSTICAS DE COMPAÑÍA
// ==========================================
const CompanyStatsModal = ({ isOpen, onClose, companyId, companyName, year }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && companyId) {
      loadCompanyStats();
    }
  }, [isOpen, companyId, year]);

  const loadCompanyStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getCompanyDashboard(companyId, { year });
      setData(response.data);
    } catch (err) {
      console.error('Error loading company stats:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const stats = data?.stats || {};
  const vulnerabilidades = data?.vulnerabilidadesPorSeveridad || [];
  const tendencia = data?.tendenciaMensual || [];
  const evaluacionesPorEstado = data?.evaluacionesPorEstado || [];
  const totalVulns = vulnerabilidades.reduce((sum, v) => sum + (v.value || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-bg-secondary border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-500/10">
              <Building2 size={24} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{companyName || 'Estadísticas de Empresa'}</h2>
              <p className="text-sm text-gray-400">Gestión {year}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-tertiary text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-primary-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertTriangle size={48} className="text-red-400 mb-4" />
              <p className="text-red-300">{error}</p>
              <button onClick={loadCompanyStats} className="mt-4 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                Reintentar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStatCard icon={FileText} title="Evaluaciones" value={stats.totalEvaluaciones || 0} color="primary" />
                <MiniStatCard icon={AlertTriangle} title="Vuln. Críticas" value={stats.vulnCriticasActivas || 0} color="red" />
                <MiniStatCard icon={CheckCircle} title="Remediación" value={`${stats.tasaRemediacion || 0}%`} color="emerald" />
                <MiniStatCard icon={Clock} title="Días Promedio" value={stats.tiempoPromedioDias || 0} color="amber" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Vulnerabilidades por Severidad</h3>
                    <span className="text-xs text-gray-400 bg-bg-secondary px-2 py-1 rounded">{totalVulns} total</span>
                  </div>
                  {vulnerabilidades.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height={140}>
                          <PieChart>
                            <Pie data={vulnerabilidades} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                              {
                              console.log('Vulnerabilidades para gráfico de pastel:', vulnerabilidades) ||
                              vulnerabilidades.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-1.5">
                        {vulnerabilidades.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                            <span className="text-[11px] text-gray-400">{item.name}</span>
                            <span className="text-[11px] text-white font-medium ml-auto">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-500 text-sm">Sin datos</div>
                  )}
                </div>

                <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                  <h3 className="text-sm font-semibold text-white mb-4">Estado de Evaluaciones</h3>
                  {evaluacionesPorEstado.length > 0 ? (
                    <div className="space-y-3">
                      {evaluacionesPorEstado.map((item, idx) => {
                        const total = evaluacionesPorEstado.reduce((sum, e) => sum + (e.cantidad || 0), 0);
                        const percentage = total > 0 ? Math.round(((item.cantidad || 0) / total) * 100) : 0;
                        const colors = { 'EVALUANDO': '#3b82f6', 'VERIFICACION': '#f59e0b', 'FINALIZADAS': '#22c55e', 'OBSERVACION': '#ef4444' };
                        const color = colors[item.estado] || '#6b7280';
                        
                        return (
                          <div key={idx}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">{item.estado}</span>
                              <span className="text-white font-medium">{item.cantidad || 0}</span>
                            </div>
                            <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-500 text-sm">Sin datos</div>
                  )}
                </div>
              </div>

              <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Tendencia Mensual</h3>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Evals</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Vulns</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Remed</span>
                  </div>
                </div>
                {tendencia.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={tendencia} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="modalColorVuln" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="modalColorRem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="mes" stroke="#6b7280" fontSize={9} tickLine={false} />
                      <YAxis stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="vulnerabilidades" stroke="#ef4444" fillOpacity={1} fill="url(#modalColorVuln)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="remediadas" stroke="#22c55e" fillOpacity={1} fill="url(#modalColorRem)" strokeWidth={1.5} />
                      <Line type="monotone" dataKey="evaluaciones" stroke="#6366f1" strokeWidth={1.5} dot={{ fill: '#6366f1', strokeWidth: 1, r: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-500 text-sm">Sin datos de tendencia</div>
                )}
              </div>

              {stats.verificacion && (
                <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                  <h3 className="text-sm font-semibold text-white mb-4">Estado de Verificación</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                      <div className="text-xl font-bold text-emerald-400">{stats.verificacion.remediadas || 0}</div>
                      <div className="text-[10px] text-gray-400">Remediadas</div>
                    </div>
                    <div className="text-center p-3 bg-red-500/10 rounded-lg">
                      <div className="text-xl font-bold text-red-400">{stats.verificacion.noRemediadas || 0}</div>
                      <div className="text-[10px] text-gray-400">No Remediadas</div>
                    </div>
                    <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                      <div className="text-xl font-bold text-amber-400">{stats.verificacion.parciales || 0}</div>
                      <div className="text-[10px] text-gray-400">Parciales</div>
                    </div>
                    <div className="text-center p-3 bg-gray-500/10 rounded-lg">
                      <div className="text-xl font-bold text-gray-400">{stats.verificacion.sinVerificar || 0}</div>
                      <div className="text-[10px] text-gray-400">Sin Verificar</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// DASHBOARD PRINCIPAL
// ==========================================
export default function Dashboard() {
  const [periodoFiltro, setPeriodoFiltro] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllEvaluaciones, setShowAllEvaluaciones] = useState(false);
  const [showAllEntidades, setShowAllEntidades] = useState(false);
  const [showAlertasPanel, setShowAlertasPanel] = useState(false);
  
  const [viewedAlerts, setViewedAlerts] = useState(() => {
    const saved = localStorage.getItem('dashboard_viewedAlerts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [companyModal, setCompanyModal] = useState({ isOpen: false, companyId: null, companyName: '' });
  
  const [dashboardData, setDashboardData] = useState({
    stats: {}, evaluacionesPorProcedimiento: [], vulnerabilidadesPorSeveridad: [],
    tendenciaMensual: [], entidadesEvaluadas: [], evaluacionesRecientes: [], alertasActivas: [],
  });

  useEffect(() => { loadDashboardData(); }, [periodoFiltro]);
  useEffect(() => { localStorage.setItem('dashboard_viewedAlerts', JSON.stringify(viewedAlerts)); }, [viewedAlerts]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      let year = parseInt(periodoFiltro);
      if (isNaN(year)) year = new Date().getFullYear();
      const response = await analyticsApi.getGlobalDashboard({ year });
      if (response.data) setDashboardData(response.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => { setRefreshing(true); await loadDashboardData(); setRefreshing(false); };

  const markAlertAsViewed = (alertIndex) => {
    const alertKey = `${periodoFiltro}-${alertIndex}`;
    if (!viewedAlerts.includes(alertKey)) setViewedAlerts([...viewedAlerts, alertKey]);
  };

  const markAllAlertsAsViewed = () => {
    const allKeys = (alertasActivas || []).map((_, idx) => `${periodoFiltro}-${idx}`);
    setViewedAlerts([...new Set([...viewedAlerts, ...allKeys])]);
    setShowAlertasPanel(false);
  };

  const openCompanyModal = (companyId, companyName) => {
    if (companyId) setCompanyModal({ isOpen: true, companyId, companyName });
  };

  const { stats, evaluacionesPorProcedimiento, vulnerabilidadesPorSeveridad, tendenciaMensual, entidadesEvaluadas, evaluacionesRecientes, alertasActivas } = dashboardData;

  const unviewedAlerts = (alertasActivas || []).filter((_, idx) => !viewedAlerts.includes(`${periodoFiltro}-${idx}`));
  const chartEvaluaciones = evaluacionesPorProcedimiento || [];
  const totalVulnerabilidades = vulnerabilidadesPorSeveridad?.reduce((sum, v) => sum + (v.value || 0), 0) || 0;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const evaluacionesToShow = showAllEvaluaciones ? evaluacionesRecientes : evaluacionesRecientes?.slice(0, 10);
  const entidadesToShow = showAllEntidades ? entidadesEvaluadas : entidadesEvaluadas?.slice(0, 10);

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-500/10">
              <Shield size={28} className="text-primary-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-gray-400">Centro de Gestión de Incidentes Informáticos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} disabled={refreshing} className="p-2.5 rounded-lg bg-bg-secondary border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white transition-colors disabled:opacity-50" title="Actualizar datos">
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            
            <div className="relative">
              <button onClick={() => setShowAlertasPanel(!showAlertasPanel)} className="p-2.5 rounded-lg bg-bg-secondary border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white transition-colors relative">
                <Bell size={18} />
                {unviewedAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unviewedAlerts.length}
                  </span>
                )}
              </button>
              
              {showAlertasPanel && (
                <div className="absolute right-0 top-12 w-96 bg-bg-secondary border border-gray-700 rounded-xl shadow-2xl z-50">
                  <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="font-semibold text-white">Alertas {unviewedAlerts.length > 0 && `(${unviewedAlerts.length} nuevas)`}</h3>
                    <div className="flex items-center gap-2">
                      {unviewedAlerts.length > 0 && (
                        <button onClick={markAllAlertsAsViewed} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                          <Eye size={12} /> Marcar vistas
                        </button>
                      )}
                      <button onClick={() => setShowAlertasPanel(false)} className="text-gray-400 hover:text-white"><X size={16} /></button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {alertasActivas?.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
                        <p>No hay alertas activas</p>
                      </div>
                    ) : (
                      alertasActivas.map((alerta, idx) => {
                        const isViewed = viewedAlerts.includes(`${periodoFiltro}-${idx}`);
                        return (
                          <div key={idx} className={`p-4 border-b border-gray-800 last:border-0 transition-colors ${isViewed ? 'opacity-50' : ''} ${alerta.tipo === 'critica' ? 'bg-red-500/5' : alerta.tipo === 'alta' ? 'bg-orange-500/5' : ''}`}>
                            <div className="flex items-start gap-3">
                              <AlertTriangle size={16} className={alerta.tipo === 'critica' ? 'text-red-400' : alerta.tipo === 'alta' ? 'text-orange-400' : 'text-yellow-400'} />
                              <div className="flex-1">
                                <p className="text-sm text-gray-300">{alerta.mensaje}</p>
                                <p className="text-xs text-gray-500 mt-1">{alerta.fecha}</p>
                              </div>
                              {!isViewed && (
                                <button onClick={() => markAlertAsViewed(idx)} className="p-1 text-gray-500 hover:text-white" title="Marcar como vista">
                                  <Eye size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-secondary border border-gray-700">
              <Calendar size={16} className="text-gray-400" />
              <select value={periodoFiltro} onChange={(e) => setPeriodoFiltro(e.target.value)} className="bg-transparent text-white text-sm outline-none cursor-pointer">
                {yearOptions.map(year => (<option key={year} value={year} className="bg-bg-secondary">Gestión {year}</option>))}
              </select>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle size={18} className="text-red-400" />
            <span className="text-red-300 flex-1">{error}</span>
            <button onClick={handleRefresh} className="text-sm text-red-400 hover:text-red-300 font-medium">Reintentar</button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={FileText} title="Evaluaciones Totales" value={stats?.totalEvaluaciones || 0} subtitle={`Gestión ${periodoFiltro}`} color="primary" loading={loading} />
          <StatCard icon={Building2} title="Entidades Evaluadas" value={stats?.entidadesEvaluadas || 0} subtitle={`De ${stats?.totalEntidades || 0} (${stats?.porcentajeCobertura || 0}%)`} color="cyan" loading={loading} />
          <StatCard icon={AlertTriangle} title="Vuln. Críticas" value={stats?.vulnCriticasActivas || 0} subtitle="Requieren atención" color="red" loading={loading} />
          <StatCard icon={CheckCircle} title="Tasa Remediación" value={`${stats?.tasaRemediacion || 0}%`} subtitle="Promedio general" color="emerald" loading={loading} />
          <StatCard icon={Clock} title="Tiempo Promedio" value={stats?.tiempoPromedioDias || 0} subtitle="Días por evaluación" color="amber" loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-bg-secondary rounded-xl border border-gray-800 p-5">
            <h3 className="text-base font-semibold text-white mb-4">Evaluaciones por Procedimiento</h3>
            <div className="h-60">
              {loading ? (
                <div className="h-full flex items-center justify-center"><Loader2 size={32} className="animate-spin text-gray-500" /></div>
              ) : chartEvaluaciones.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">Sin datos disponibles</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartEvaluaciones} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#6b7280" fontSize={11} />
                    <YAxis dataKey="tipo" type="category" stroke="#6b7280" fontSize={10} width={100} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                      {chartEvaluaciones.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-bg-secondary rounded-xl border border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Vulnerabilidades por Severidad</h3>
              <span className="text-xs text-gray-400 bg-bg-tertiary px-2 py-1 rounded">{totalVulnerabilidades} total</span>
            </div>
            <div className="h-60">
              {loading ? (
                <div className="h-full flex items-center justify-center"><Loader2 size={32} className="animate-spin text-gray-500" /></div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={vulnerabilidadesPorSeveridad} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                          {vulnerabilidadesPorSeveridad?.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#132c4e', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {vulnerabilidadesPorSeveridad?.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                        <span className="text-xs text-gray-400">{item.name}</span>
                        <span className="text-xs text-white font-medium ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-bg-secondary rounded-xl border border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Tendencia Mensual</h3>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Evals</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Vulns</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Remed</span>
              </div>
            </div>
            <div className="h-60">
              {loading ? (
                <div className="h-full flex items-center justify-center"><Loader2 size={32} className="animate-spin text-gray-500" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tendenciaMensual} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVuln" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRem" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="mes" stroke="#6b7280" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="vulnerabilidades" stroke="#ef4444" fillOpacity={1} fill="url(#colorVuln)" strokeWidth={2} />
                    <Area type="monotone" dataKey="remediadas" stroke="#22c55e" fillOpacity={1} fill="url(#colorRem)" strokeWidth={2} />
                    <Line type="monotone" dataKey="evaluaciones" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-bg-secondary rounded-xl border border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h3 className="text-base font-semibold text-white">Evaluaciones Recientes</h3>
              <button onClick={() => setShowAllEvaluaciones(!showAllEvaluaciones)} className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1">
                {showAllEvaluaciones ? 'Ver menos' : `Ver todas (${evaluacionesRecientes?.length || 0})`}
                <ChevronRight size={14} className={`transition-transform ${showAllEvaluaciones ? 'rotate-90' : ''}`} />
              </button>
            </div>
            <div className={`overflow-x-auto ${showAllEvaluaciones ? 'max-h-[600px] overflow-y-auto' : ''}`}>
              {loading ? (
                <div className="h-40 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-gray-500" /></div>
              ) : evaluacionesRecientes?.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-500">No hay evaluaciones recientes</div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-bg-secondary">
                    <tr>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">Entidad</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">Tipo</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">Estado</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">Fecha</th>
                      <th className="px-5 py-3 border-b border-gray-800"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluacionesToShow?.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-bg-tertiary/50 transition-colors cursor-pointer" onClick={() => openCompanyModal(item.companyId, item.entidad)}>
                        <td className="px-5 py-3.5 text-sm text-white font-medium">{item.entidad}</td>
                        <td className="px-5 py-3.5"><TipoBadge tipo={item.tipo} /></td>
                        <td className="px-5 py-3.5"><EstadoBadge estado={item.estado} /></td>
                        <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{item.fechaInicio}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={(e) => { e.stopPropagation(); openCompanyModal(item.companyId, item.entidad); }} className="p-1.5 rounded hover:bg-bg-tertiary text-gray-400 hover:text-primary-400 transition-colors" title="Ver estadísticas">
                            <ExternalLink size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="bg-bg-secondary rounded-xl border border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h3 className="text-base font-semibold text-white">Estado de Seguridad por Entidad</h3>
              <button onClick={() => setShowAllEntidades(!showAllEntidades)} className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1">
                {showAllEntidades ? 'Ver menos' : `Ver todas (${entidadesEvaluadas?.length || 0})`}
                <ChevronRight size={14} className={`transition-transform ${showAllEntidades ? 'rotate-90' : ''}`} />
              </button>
            </div>
            <div className={`overflow-x-auto ${showAllEntidades ? 'max-h-[600px] overflow-y-auto' : ''}`}>
              {loading ? (
                <div className="h-40 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-gray-500" /></div>
              ) : entidadesEvaluadas?.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-500">No hay entidades evaluadas</div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-bg-secondary">
                    <tr>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">Entidad</th>
                      <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">Evals</th>
                      <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">Críticas</th>
                      <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">Altas</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">Remediación</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-800">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entidadesToShow?.map((entidad, index) => (
                      <tr key={entidad.id || index} className="hover:bg-bg-tertiary/50 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-white font-medium">{entidad.nombre}</td>
                        <td className="px-5 py-3.5 text-center text-sm text-gray-300">{entidad.evaluaciones}</td>
                        <td className="px-5 py-3.5 text-center"><VulnCount count={entidad.vulnCriticas} type={entidad.vulnCriticas > 0 ? 'critical' : 'safe'} /></td>
                        <td className="px-5 py-3.5 text-center"><VulnCount count={entidad.vulnAltas} type={entidad.vulnAltas > 10 ? 'high' : 'medium'} /></td>
                        <td className="px-5 py-3.5 w-40"><ProgressBar value={entidad.tasaRemediacion || 0} /></td>
                        <td className="px-5 py-3.5"><EstadoBadge estado={entidad.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <footer className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-800 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>AGETIC - Área Centro de Gestión de Incidentes Informáticos</span>
            <span className="text-gray-700">|</span>
            <span>Manual ACGII-M01 v4</span>
          </div>
          <div><span>Última actualización: {new Date().toLocaleString('es-BO')}</span></div>
        </footer>
      </div>

      <CompanyStatsModal
        isOpen={companyModal.isOpen}
        onClose={() => setCompanyModal({ isOpen: false, companyId: null, companyName: '' })}
        companyId={companyModal.companyId}
        companyName={companyModal.companyName}
        year={parseInt(periodoFiltro)}
      />
    </div>
  );
}