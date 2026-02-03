import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart 
} from 'recharts';
import { 
  Shield, FileText, Building2, AlertTriangle, CheckCircle, Clock, 
  TrendingUp, Calendar, Filter, Download, Bell, Search, ChevronDown, 
  ExternalLink, RefreshCw, Loader2 
} from 'lucide-react';
import analyticsApi from '../../api/endpoints/analytics.api';

// Componente StatCard
const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendUp, color, loading }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <div className={`stat-icon ${color}`}>
        <Icon size={22} strokeWidth={1.5} />
      </div>
      {trend && (
        <div className={`trend ${trendUp ? 'up' : 'down'}`}>
          <TrendingUp size={14} className={!trendUp ? 'rotate' : ''} />
          <span>{trend}</span>
        </div>
      )}
    </div>
    <div className="stat-value">
      {loading ? <Loader2 size={24} className="animate-spin" /> : value}
    </div>
    <div className="stat-title">{title}</div>
    {subtitle && <div className="stat-subtitle">{subtitle}</div>}
  </div>
);

// Componente EstadoBadge
const EstadoBadge = ({ estado }) => {
  const estados = {
    'En Curso': 'badge-blue',
    'En Evaluación': 'badge-blue',
    'EVALUANDO': 'badge-blue',
    'Informe Enviado': 'badge-purple',
    'Verificación': 'badge-amber',
    'En Verificación': 'badge-amber',
    'PENDIENTE': 'badge-amber',
    'Pendiente Mitigación': 'badge-red',
    'Completado': 'badge-green',
    'COMPLETADO': 'badge-green',
    'EDIT': 'badge-blue',
    'REVIEW': 'badge-purple',
    'APPROVED': 'badge-green',
  };
  return <span className={`badge ${estados[estado] || 'badge-gray'}`}>{estado}</span>;
};

// Componente TipoBadge
const TipoBadge = ({ tipo }) => {
  const tipos = {
    'PR01': { label: 'Solicitud EP', class: 'tipo-pr01' },
    'PR02': { label: 'Interna', class: 'tipo-pr02' },
    'PR03': { label: 'Externa', class: 'tipo-pr03' },
    'PR09': { label: 'Sol. AGETIC', class: 'tipo-pr09' },
    'Verificación': { label: 'Verificación', class: 'tipo-verif' },
  };
  
  // Extraer código de tipo (PR01, PR02, etc.)
  const tipoKey = tipo?.split(' - ')[0] || tipo;
  const config = tipos[tipoKey] || { label: tipo || 'Sin tipo', class: 'tipo-default' };
  return <span className={`tipo-badge ${config.class}`}>{config.label}</span>;
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Estado
  const [periodoFiltro, setPeriodoFiltro] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Datos del dashboard
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    evaluacionesPorTipo: [],
    evaluacionesPorAlcance: [],
    evaluacionesPorEstado: [],
    vulnerabilidadesPorSeveridad: [],
    tendenciaMensual: [],
    entidadesEvaluadas: [],
    evaluacionesRecientes: [],
    alertasActivas: [],
  });

  // Cargar datos al montar y cuando cambia el filtro
  useEffect(() => {
    loadDashboardData();
  }, [periodoFiltro]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Parsear año del filtro
      let year = parseInt(periodoFiltro);
      if (isNaN(year)) {
        year = new Date().getFullYear();
      }
      
      const response = await analyticsApi.getGlobalDashboard({ year });
      
      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Extraer datos
  const { 
    stats, 
    evaluacionesPorTipo, 
    evaluacionesPorProcedimiento,
    vulnerabilidadesPorSeveridad, 
    tendenciaMensual, 
    entidadesEvaluadas, 
    evaluacionesRecientes, 
    alertasActivas 
  } = dashboardData;

  console.log("dashboardData", dashboardData);
  // Usar evaluacionesPorProcedimiento o evaluacionesPorTipo
  const chartEvaluaciones = evaluacionesPorProcedimiento || evaluacionesPorTipo || [];

  // Calcular total de vulnerabilidades
  const totalVulnerabilidades = vulnerabilidadesPorSeveridad?.reduce((sum, v) => sum + (v.value || 0), 0) || 0;

  // Generar opciones de años
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    yearOptions.push(y);
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-icon">
              <Shield size={28} strokeWidth={1.5} />
            </div>
            <div className="logo-text">
              <h1>Dashboard</h1>
              <span>Centro de Gestión de Incidentes Informáticos</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar entidad, CITE, evaluación..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="header-actions">
            <button 
              className="btn-icon" 
              onClick={handleRefresh}
              disabled={refreshing}
              title="Actualizar datos"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button className="btn-icon notifications">
              <Bell size={20} />
              {alertasActivas?.length > 0 && <span className="notification-dot"></span>}
            </button>
            <div className="periodo-selector">
              <Calendar size={16} />
              <select value={periodoFiltro} onChange={(e) => setPeriodoFiltro(e.target.value)}>
                {yearOptions.map(year => (
                  <option key={year} value={year}>Gestión {year}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <button className="btn-primary">
              <Download size={16} />
              Exportar
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={handleRefresh}>Reintentar</button>
        </div>
      )}

      {/* Alertas Banner */}
      {alertasActivas?.length > 0 && (
        <div className="alertas-banner">
          <div className="alerta-icon">
            <AlertTriangle size={18} />
          </div>
          <div className="alertas-content">
            <strong>{alertasActivas.length} alertas activas:</strong>
            <span>{alertasActivas[0]?.mensaje}</span>
          </div>
          <button className="ver-todas">Ver todas →</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard 
          icon={FileText} 
          title="Evaluaciones Totales" 
          value={stats?.totalEvaluaciones || 0}
          subtitle={`Gestión ${periodoFiltro}`}
          color="indigo"
          loading={loading}
        />
        <StatCard 
          icon={Building2} 
          title="Entidades Evaluadas" 
          value={stats?.entidadesEvaluadas || 0}
          subtitle={`De ${stats?.totalEntidades || 0} registradas (${stats?.porcentajeCobertura || 0}%)`}
          color="cyan"
          loading={loading}
        />
        <StatCard 
          icon={AlertTriangle} 
          title="Vuln. Críticas Activas" 
          value={stats?.vulnCriticasActivas || 0}
          subtitle="Requieren atención inmediata"
          color="red"
          loading={loading}
        />
        <StatCard 
          icon={CheckCircle} 
          title="Tasa Remediación" 
          value={`${stats?.tasaRemediacion || 0}%`}
          subtitle="Promedio general"
          color="emerald"
          loading={loading}
        />
        <StatCard 
          icon={Clock} 
          title="Tiempo Promedio" 
          value={stats?.tiempoPromedioDias || 0}
          subtitle="Días por evaluación"
          color="amber"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="main-grid">
        {/* Evaluaciones por Tipo/Procedimiento */}
        <div className="card evaluaciones-tipo">
          <div className="card-header">
            <h3>Evaluaciones por Procedimiento</h3>
            <button className="btn-icon-small" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="chart-container">
            {loading ? (
              <div className="chart-loading">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : chartEvaluaciones.length === 0 ? (
              <div className="chart-empty">Sin datos disponibles</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartEvaluaciones} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                  <YAxis dataKey="tipo" type="category" stroke="#9ca3af" fontSize={11} width={140} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                    {chartEvaluaciones.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Vulnerabilidades por Severidad */}
        <div className="card vulnerabilidades-severidad">
          <div className="card-header">
            <h3>Vulnerabilidades por Severidad</h3>
            <span className="total-badge">{totalVulnerabilidades} total</span>
          </div>
          <div className="pie-chart-container">
            {loading ? (
              <div className="chart-loading">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={vulnerabilidadesPorSeveridad}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {vulnerabilidadesPorSeveridad?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1f2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="severity-legend">
                  {vulnerabilidadesPorSeveridad?.map((item, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-dot" style={{ background: item.color }}></span>
                      <span className="legend-label">{item.name}</span>
                      <span className="legend-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tendencia Mensual */}
        <div className="card tendencia-card">
          <div className="card-header">
            <h3>Tendencia de Evaluaciones y Remediación</h3>
            <div className="legend-inline">
              <span><i className="dot blue"></i> Evaluaciones</span>
              <span><i className="dot red"></i> Vulnerabilidades</span>
              <span><i className="dot green"></i> Remediadas</span>
            </div>
          </div>
          <div className="chart-container">
            {loading ? (
              <div className="chart-loading">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tendenciaMensual} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVuln" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="mes" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="vulnerabilidades" stroke="#ef4444" fillOpacity={1} fill="url(#colorVuln)" strokeWidth={2} />
                  <Area type="monotone" dataKey="remediadas" stroke="#22c55e" fillOpacity={1} fill="url(#colorRem)" strokeWidth={2} />
                  <Line type="monotone" dataKey="evaluaciones" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="tables-grid">
        {/* Evaluaciones Recientes */}
        <div className="card table-card">
          <div className="card-header">
            <h3>Evaluaciones Recientes</h3>
            <div className="card-actions">
              <button className="btn-filter">
                <Filter size={14} />
                Filtrar
              </button>
              <button className="btn-text" onClick={() => navigate('/audits')}>Ver todas →</button>
            </div>
          </div>
          <div className="table-wrapper">
            {loading ? (
              <div className="table-loading">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : evaluacionesRecientes?.length === 0 ? (
              <div className="table-empty">No hay evaluaciones recientes</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Entidad</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>CITE Informe</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {evaluacionesRecientes?.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="entidad-cell">{item.entidad}</td>
                      <td><TipoBadge tipo={item.tipo} /></td>
                      <td><EstadoBadge estado={item.estado} /></td>
                      <td className="date-cell">{item.fechaInicio}</td>
                      <td className="cite-cell">
                        {item.citeInforme ? (
                          <span className="cite-link">{item.citeInforme}</span>
                        ) : (
                          <span className="pending">Pendiente</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn-icon-small"
                          onClick={() => navigate(`/audits/${item.id}`)}
                        >
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

        {/* Entidades - Estado de Seguridad */}
        <div className="card table-card entidades-card">
          <div className="card-header">
            <h3>Estado de Seguridad por Entidad</h3>
            <button className="btn-text" onClick={() => navigate('/clients')}>Historial completo →</button>
          </div>
          <div className="table-wrapper">
            {loading ? (
              <div className="table-loading">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : entidadesEvaluadas?.length === 0 ? (
              <div className="table-empty">No hay entidades evaluadas</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Entidad</th>
                    <th>Evals</th>
                    <th>Críticas</th>
                    <th>Altas</th>
                    <th>Remediación</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {entidadesEvaluadas?.map((entidad, index) => (
                    <tr key={entidad.id || index}>
                      <td className="entidad-name">{entidad.nombre}</td>
                      <td className="center">{entidad.evaluaciones}</td>
                      <td className="center">
                        <span className={`vuln-count ${entidad.vulnCriticas > 0 ? 'critical' : 'safe'}`}>
                          {entidad.vulnCriticas}
                        </span>
                      </td>
                      <td className="center">
                        <span className={`vuln-count ${entidad.vulnAltas > 10 ? 'high' : 'medium'}`}>
                          {entidad.vulnAltas}
                        </span>
                      </td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${entidad.tasaRemediacion}%`,
                              background: entidad.tasaRemediacion > 80 ? '#22c55e' : entidad.tasaRemediacion > 50 ? '#eab308' : '#ef4444'
                            }}
                          ></div>
                          <span className="progress-text">{entidad.tasaRemediacion}%</span>
                        </div>
                      </td>
                      <td><EstadoBadge estado={entidad.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-left">
          <span>AGETIC - Área Centro de Gestión de Incidentes Informáticos</span>
          <span className="separator">|</span>
          <span>Manual ACGII-M01 v4</span>
        </div>
        <div className="footer-right">
          <span>Última actualización: {new Date().toLocaleString('es-BO')}</span>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .dashboard-container {
          font-family: 'IBM Plex Sans', -apple-system, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          min-height: 100vh;
          color: #e2e8f0;
          padding: 0;
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        }
        
        .logo-text h1 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
        }
        
        .logo-text span {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 400;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 16px;
          width: 320px;
          transition: all 0.2s;
        }
        
        .search-box:focus-within {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
        }
        
        .search-box svg {
          color: #64748b;
        }
        
        .search-box input {
          background: none;
          border: none;
          color: #e2e8f0;
          font-size: 13px;
          width: 100%;
          outline: none;
        }
        
        .search-box input::placeholder {
          color: #64748b;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .btn-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          position: relative;
        }
        
        .btn-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        .btn-icon:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .notifications .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid #0f172a;
        }
        
        .periodo-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
          color: #94a3b8;
        }
        
        .periodo-selector select {
          background: none;
          border: none;
          color: #e2e8f0;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          outline: none;
          appearance: none;
          padding-right: 4px;
        }
        
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        }
        
        /* Error Banner */
        .error-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
          border-left: 3px solid #ef4444;
          padding: 12px 32px;
          color: #fca5a5;
        }
        
        .error-banner button {
          background: rgba(239, 68, 68, 0.2);
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          color: #fca5a5;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
        }
        
        /* Alertas Banner */
        .alertas-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
          border-left: 3px solid #ef4444;
          padding: 12px 32px;
          margin: 0;
        }
        
        .alerta-icon {
          color: #ef4444;
        }
        
        .alertas-content {
          flex: 1;
          font-size: 13px;
        }
        
        .alertas-content strong {
          color: #fca5a5;
          margin-right: 8px;
        }
        
        .alertas-content span {
          color: #94a3b8;
        }
        
        .ver-todas {
          background: none;
          border: none;
          color: #f87171;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
        }
        
        .ver-todas:hover {
          color: #fca5a5;
        }
        
        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          padding: 24px 32px;
        }
        
        .stat-card {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          backdrop-filter: blur(8px);
          transition: all 0.3s;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-icon.indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
        .stat-icon.cyan { background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
        .stat-icon.red { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .stat-icon.emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .stat-icon.amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        
        .trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
        }
        
        .trend.up {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }
        
        .trend.down {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }
        
        .trend .rotate {
          transform: rotate(180deg);
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1;
          display: flex;
          align-items: center;
          min-height: 38px;
        }
        
        .stat-title {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 8px;
          font-weight: 500;
        }
        
        .stat-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
        }
        
        /* Main Grid */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1.5fr;
          gap: 20px;
          padding: 0 32px 24px;
        }
        
        .card {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          backdrop-filter: blur(8px);
          overflow: hidden;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        
        .card-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }
        
        .btn-icon-small {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          background: rgba(255, 255, 255, 0.05);
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .btn-icon-small:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #94a3b8;
        }
        
        .btn-icon-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .total-badge {
          font-size: 11px;
          color: #64748b;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 10px;
          border-radius: 20px;
        }
        
        .chart-container {
          padding: 16px;
        }
        
        .chart-loading, .chart-empty, .table-loading, .table-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          color: #64748b;
          font-size: 14px;
        }
        
        /* Pie Chart */
        .pie-chart-container {
          display: flex;
          align-items: center;
          padding: 16px;
        }
        
        .severity-legend {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-left: 16px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
        }
        
        .legend-label {
          color: #94a3b8;
          flex: 1;
        }
        
        .legend-value {
          color: #e2e8f0;
          font-weight: 600;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        /* Tendencia */
        .legend-inline {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: #64748b;
        }
        
        .legend-inline span {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .legend-inline .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        
        .dot.blue { background: #6366f1; }
        .dot.red { background: #ef4444; }
        .dot.green { background: #22c55e; }
        
        /* Tables */
        .tables-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
          padding: 0 32px 24px;
        }
        
        .table-card {
          display: flex;
          flex-direction: column;
        }
        
        .card-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .btn-filter {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 6px 12px;
          color: #94a3b8;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
        }
        
        .btn-filter:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .btn-text {
          background: none;
          border: none;
          color: #818cf8;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
        }
        
        .btn-text:hover {
          color: #a5b4fc;
        }
        
        .table-wrapper {
          flex: 1;
          overflow-x: auto;
          padding: 0 8px 16px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        td {
          padding: 14px 16px;
          font-size: 13px;
          color: #cbd5e1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        
        tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        
        .id-cell {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: #818cf8;
        }
        
        .entidad-cell, .entidad-name {
          font-weight: 500;
          color: #e2e8f0;
        }
        
        .date-cell {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: #94a3b8;
        }
        
        .cite-cell {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
        }
        
        .cite-link {
          color: #94a3b8;
        }
        
        .na, .pending {
          color: #475569;
          font-style: italic;
        }
        
        .pending {
          color: #fbbf24;
        }
        
        .center {
          text-align: center;
        }
        
        /* Badges */
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .badge-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .badge-purple { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
        .badge-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .badge-red { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .badge-green { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
        .badge-gray { background: rgba(107, 114, 128, 0.15); color: #9ca3af; }
        
        .tipo-badge {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .tipo-pr01 { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
        .tipo-pr02 { background: rgba(6, 182, 212, 0.2); color: #67e8f9; }
        .tipo-pr03 { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
        .tipo-pr09 { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
        .tipo-verif { background: rgba(139, 92, 246, 0.2); color: #c4b5fd; }
        .tipo-default { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
        
        .vuln-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .vuln-count.critical { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .vuln-count.high { background: rgba(249, 115, 22, 0.2); color: #fb923c; }
        .vuln-count.medium { background: rgba(234, 179, 8, 0.2); color: #facc15; }
        .vuln-count.safe { background: rgba(34, 197, 94, 0.1); color: #4ade80; }
        
        /* Progress Bar */
        .progress-bar {
          position: relative;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          min-width: 80px;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }
        
        .progress-text {
          position: absolute;
          right: -36px;
          top: -5px;
          font-size: 11px;
          color: #94a3b8;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        /* Footer */
        .dashboard-footer {
          display: flex;
          justify-content: space-between;
          padding: 16px 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 11px;
          color: #475569;
        }
        
        .footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .separator {
          color: #334155;
        }
        
        /* Responsive */
        @media (max-width: 1400px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .main-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .tendencia-card {
            grid-column: span 2;
          }
          
          .tables-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .main-grid {
            grid-template-columns: 1fr;
          }
          
          .tendencia-card {
            grid-column: span 1;
          }
          
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }
          
          .search-box {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}