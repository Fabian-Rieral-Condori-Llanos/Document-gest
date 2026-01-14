import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Shield, FileText, Building2, AlertTriangle, CheckCircle, Clock, TrendingUp, Calendar, Filter, Download, Bell, Search, ChevronDown, ExternalLink, RefreshCw } from 'lucide-react';

// Datos simulados basados en los procedimientos ACGII
const evaluacionesPorTipo = [
  { tipo: 'PR01 - Solicitud Entidades', cantidad: 24, color: '#6366f1' },
  { tipo: 'PR02 - Interna AGETIC', cantidad: 8, color: '#06b6d4' },
  { tipo: 'PR09 - Solicitud AGETIC', cantidad: 15, color: '#f59e0b' },
  { tipo: 'PR03 - Externa', cantidad: 31, color: '#10b981' },
  { tipo: 'Verificación', cantidad: 18, color: '#8b5cf6' },
];

const vulnerabilidadesPorSeveridad = [
  { name: 'Crítica', value: 47, color: '#dc2626' },
  { name: 'Alta', value: 128, color: '#f97316' },
  { name: 'Media', value: 234, color: '#eab308' },
  { name: 'Baja', value: 312, color: '#22c55e' },
  { name: 'Info', value: 89, color: '#6b7280' },
];

const tendenciaMensual = [
  { mes: 'Jul', evaluaciones: 8, vulnerabilidades: 67, remediadas: 45 },
  { mes: 'Ago', evaluaciones: 12, vulnerabilidades: 89, remediadas: 72 },
  { mes: 'Sep', evaluaciones: 10, vulnerabilidades: 78, remediadas: 81 },
  { mes: 'Oct', evaluaciones: 15, vulnerabilidades: 112, remediadas: 95 },
  { mes: 'Nov', evaluaciones: 18, vulnerabilidades: 134, remediadas: 118 },
  { mes: 'Dic', evaluaciones: 14, vulnerabilidades: 98, remediadas: 89 },
];

const entidadesEvaluadas = [
  { id: 1, nombre: 'Min. de Economía', evaluaciones: 5, vulnCriticas: 3, vulnAltas: 12, estado: 'En Verificación', ultimaEval: '2025-12-10', tasaRemediacion: 78 },
  { id: 2, nombre: 'Min. de Salud', evaluaciones: 4, vulnCriticas: 1, vulnAltas: 8, estado: 'Completado', ultimaEval: '2025-12-05', tasaRemediacion: 92 },
  { id: 3, nombre: 'ADSIB', evaluaciones: 3, vulnCriticas: 0, vulnAltas: 4, estado: 'Completado', ultimaEval: '2025-11-28', tasaRemediacion: 100 },
  { id: 4, nombre: 'Min. de Educación', evaluaciones: 6, vulnCriticas: 5, vulnAltas: 18, estado: 'Pendiente Mitigación', ultimaEval: '2025-12-15', tasaRemediacion: 45 },
  { id: 5, nombre: 'Aduana Nacional', evaluaciones: 2, vulnCriticas: 2, vulnAltas: 9, estado: 'En Evaluación', ultimaEval: '2025-12-18', tasaRemediacion: 0 },
  { id: 6, nombre: 'SEGIP', evaluaciones: 4, vulnCriticas: 0, vulnAltas: 6, estado: 'Completado', ultimaEval: '2025-11-20', tasaRemediacion: 95 },
];

const evaluacionesRecientes = [
  { id: 'ACGII-2025-096', entidad: 'Aduana Nacional', tipo: 'PR03', estado: 'En Curso', fechaInicio: '2025-12-16', notaExterna: 'AGETIC/DGE/NE/2025/1847', citeInforme: null },
  { id: 'ACGII-2025-095', entidad: 'Min. de Educación', tipo: 'PR01', estado: 'Informe Enviado', fechaInicio: '2025-12-08', notaExterna: 'AGETIC/DGE/NE/2025/1832', citeInforme: 'ACGII/IT/2025/095' },
  { id: 'ACGII-2025-094', entidad: 'Min. de Economía', tipo: 'PR09', estado: 'Verificación', fechaInicio: '2025-12-01', notaExterna: 'AGETIC/DGE/NE/2025/1815', citeInforme: 'ACGII/IT/2025/094' },
  { id: 'ACGII-2025-093', entidad: 'AGETIC (Interno)', tipo: 'PR02', estado: 'Completado', fechaInicio: '2025-11-25', notaExterna: null, citeInforme: 'ACGII/IT/2025/093' },
  { id: 'ACGII-2025-092', entidad: 'Min. de Salud', tipo: 'PR01', estado: 'Completado', fechaInicio: '2025-11-20', notaExterna: 'AGETIC/DGE/NE/2025/1798', citeInforme: 'ACGII/IT/2025/092' },
];

const alertasActivas = [
  { tipo: 'critica', mensaje: 'Min. de Educación: 5 vulnerabilidades críticas sin mitigar (>30 días)', fecha: '2025-12-18' },
  { tipo: 'alta', mensaje: 'Aduana Nacional: Evaluación PR03 en curso - Presentación pendiente', fecha: '2025-12-17' },
  { tipo: 'media', mensaje: 'Min. de Economía: Verificación programada para 2025-12-20', fecha: '2025-12-15' },
];

const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendUp, color }) => (
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
    <div className="stat-value">{value}</div>
    <div className="stat-title">{title}</div>
    {subtitle && <div className="stat-subtitle">{subtitle}</div>}
  </div>
);

const EstadoBadge = ({ estado }) => {
  const estados = {
    'En Curso': 'badge-blue',
    'En Evaluación': 'badge-blue',
    'Informe Enviado': 'badge-purple',
    'Verificación': 'badge-amber',
    'En Verificación': 'badge-amber',
    'Pendiente Mitigación': 'badge-red',
    'Completado': 'badge-green',
  };
  return <span className={`badge ${estados[estado] || 'badge-gray'}`}>{estado}</span>;
};

const TipoBadge = ({ tipo }) => {
  const tipos = {
    'PR01': { label: 'Solicitud EP', class: 'tipo-pr01' },
    'PR02': { label: 'Interna', class: 'tipo-pr02' },
    'PR03': { label: 'Externa', class: 'tipo-pr03' },
    'PR09': { label: 'Sol. AGETIC', class: 'tipo-pr09' },
    'Verificación': { label: 'Verificación', class: 'tipo-verif' },
  };
  const config = tipos[tipo] || { label: tipo, class: 'tipo-default' };
  return <span className={`tipo-badge ${config.class}`}>{config.label}</span>;
};

export default function Dashboard() {
  const [periodoFiltro, setPeriodoFiltro] = useState('2025');
  const [searchTerm, setSearchTerm] = useState('');

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
            <button className="btn-icon notifications">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <div className="periodo-selector">
              <Calendar size={16} />
              <select value={periodoFiltro} onChange={(e) => setPeriodoFiltro(e.target.value)}>
                <option value="2025">Gestión 2025</option>
                <option value="2024">Gestión 2024</option>
                <option value="Q4-2025">Q4 2025</option>
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

      {/* Alertas Banner */}
      {alertasActivas.length > 0 && (
        <div className="alertas-banner">
          <div className="alerta-icon">
            <AlertTriangle size={18} />
          </div>
          <div className="alertas-content">
            <strong>{alertasActivas.length} alertas activas:</strong>
            <span>{alertasActivas[0].mensaje}</span>
          </div>
          <button className="ver-todas">Ver todas →</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard 
          icon={FileText} 
          title="Evaluaciones Totales" 
          value="96" 
          subtitle="Gestión 2025"
          trend="+12%"
          trendUp={true}
          color="indigo"
        />
        <StatCard 
          icon={Building2} 
          title="Entidades Evaluadas" 
          value="34" 
          subtitle="De 180 registradas"
          trend="18.9%"
          trendUp={true}
          color="cyan"
        />
        <StatCard 
          icon={AlertTriangle} 
          title="Vuln. Críticas Activas" 
          value="18" 
          subtitle="Requieren atención inmediata"
          trend="-23%"
          trendUp={true}
          color="red"
        />
        <StatCard 
          icon={CheckCircle} 
          title="Tasa Remediación" 
          value="76%" 
          subtitle="Promedio general"
          trend="+8%"
          trendUp={true}
          color="emerald"
        />
        <StatCard 
          icon={Clock} 
          title="Tiempo Promedio" 
          value="12.4" 
          subtitle="Días por evaluación"
          trend="-2.1"
          trendUp={true}
          color="amber"
        />
      </div>

      {/* Main Content Grid */}
      <div className="main-grid">
        {/* Evaluaciones por Tipo */}
        <div className="card evaluaciones-tipo">
          <div className="card-header">
            <h3>Evaluaciones por Procedimiento</h3>
            <button className="btn-icon-small"><RefreshCw size={14} /></button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={evaluacionesPorTipo} layout="vertical" margin={{ left: 20, right: 20 }}>
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
                  {evaluacionesPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vulnerabilidades por Severidad */}
        <div className="card vulnerabilidades-severidad">
          <div className="card-header">
            <h3>Vulnerabilidades por Severidad</h3>
            <span className="total-badge">810 total</span>
          </div>
          <div className="pie-chart-container">
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
                  {vulnerabilidadesPorSeveridad.map((entry, index) => (
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
              {vulnerabilidadesPorSeveridad.map((item, index) => (
                <div key={index} className="legend-item">
                  <span className="legend-dot" style={{ background: item.color }}></span>
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
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
              <button className="btn-text">Ver todas →</button>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID Evaluación</th>
                  <th>Entidad</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Nota Externa</th>
                  <th>CITE Informe</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {evaluacionesRecientes.map((eval_item) => (
                  <tr key={eval_item.id}>
                    <td className="id-cell">{eval_item.id}</td>
                    <td className="entidad-cell">{eval_item.entidad}</td>
                    <td><TipoBadge tipo={eval_item.tipo} /></td>
                    <td><EstadoBadge estado={eval_item.estado} /></td>
                    <td className="cite-cell">
                      {eval_item.notaExterna ? (
                        <span className="cite-link">{eval_item.notaExterna}</span>
                      ) : (
                        <span className="na">N/A</span>
                      )}
                    </td>
                    <td className="cite-cell">
                      {eval_item.citeInforme ? (
                        <span className="cite-link">{eval_item.citeInforme}</span>
                      ) : (
                        <span className="pending">Pendiente</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-icon-small">
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Entidades - Estado de Seguridad */}
        <div className="card table-card entidades-card">
          <div className="card-header">
            <h3>Estado de Seguridad por Entidad</h3>
            <button className="btn-text">Historial completo →</button>
          </div>
          <div className="table-wrapper">
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
                {entidadesEvaluadas.map((entidad) => (
                  <tr key={entidad.id}>
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
          <span>Última actualización: 19/12/2025 14:32</span>
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
