import { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, AreaChart, Area, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Building2, FileText, AlertTriangle, CheckCircle, Clock, X, Loader2 } from 'lucide-react';
import analyticsApi from '../../../api/endpoints/analytics.api';
import { MiniStatCard } from './UIComponents';
import VulnerabilidadesChart from './VulnerabilidadesChart';

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

  console.log("data",data)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-bg-secondary border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
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
        
        {/* Content */}
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
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStatCard icon={FileText} title="Evaluaciones" value={stats.totalEvaluaciones || 0} color="primary" />
                <MiniStatCard icon={AlertTriangle} title="Vuln. Críticas" value={stats.vulnCriticasActivas || 0} color="red" />
                <MiniStatCard icon={CheckCircle} title="Remediación" value={`${stats.tasaRemediacion || 0}%`} color="emerald" />
                <MiniStatCard icon={Clock} title="Días Promedio" value={stats.tiempoPromedioDias || 0} color="amber" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vulnerabilidades por Severidad */}
                <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                    <VulnerabilidadesChart
                      vulnerabilidadesPorSeveridad={vulnerabilidades}
                      verificacion={stats?.verificacion}
                      loading={loading}
                      title="Análisis de Vulnerabilidades"
                    />
                </div>

                {/* Estado de Evaluaciones */}
                <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                  <h3 className="text-sm font-semibold text-white mb-4">Estado de Verificación</h3>
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

              {/* Tendencia Mensual */}
              <div className="bg-bg-tertiary rounded-xl border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Hsitorico de evaluaciones</h3>
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

              {/* Estado de Verificación */}
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

export default CompanyStatsModal;
