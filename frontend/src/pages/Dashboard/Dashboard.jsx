import { useState, useEffect } from 'react';
import { FileText, Building2, AlertTriangle, CheckCircle } from 'lucide-react';
import analyticsApi from '../../api/endpoints/analytics.api';

// Importar componentes
import {
  StatCard,
  DashboardHeader,
  DistributionChart,
  VulnerabilidadesChart,
  TendenciaMensualChart,
  EvaluacionesRecientesTable,
  CompanyStatsModal,
  EvaluacionesModal,
  EntidadesModal,
  AuditDashboardModal,
  TopEntidadesCriticasModal,
  TopEntidadesCriticasCard
} from './components';

export default function Dashboard() {
  // ==========================================
  // STATE
  // ==========================================
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const [periodoFiltro, setPeriodoFiltro] = useState(currentYear.toString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Alertas
  const [viewedAlerts, setViewedAlerts] = useState(() => {
    const saved = localStorage.getItem('dashboard_viewedAlerts');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Modals
  const [companyModal, setCompanyModal] = useState({ isOpen: false, companyId: null, companyName: '' });
  const [evaluacionesModal, setEvaluacionesModal] = useState(false);
  const [entidadesModal, setEntidadesModal] = useState(false);
  const [topCriticasModal, setTopCriticasModal] = useState(false);
  const [auditDashboardModal, setAuditDashboardModal] = useState({ isOpen: false, auditId: null });
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    companyStats: {},
    evaluacionesPorProcedimiento: [],
    evaluacionesPorAlcance: [],
    evaluacionesPorEstado: [],
    evaluacionesPorTipo: [],
    vulnerabilidadesPorSeveridad: [],
    tendenciaMensual: [],
    entidadesEvaluadas: [],
    evaluacionesRecientes: [],
    alertasActivas: [],
  });

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => { 
    loadDashboardData(); 
  }, [periodoFiltro]);

  useEffect(() => { 
    localStorage.setItem('dashboard_viewedAlerts', JSON.stringify(viewedAlerts)); 
  }, [viewedAlerts]);

  // ==========================================
  // DATA LOADING
  // ==========================================
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      let year = parseInt(periodoFiltro);
      if (isNaN(year)) year = currentYear;
      
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

  // ==========================================
  // ALERT HANDLERS
  // ==========================================
  const markAlertAsViewed = (alertIndex) => {
    const alertKey = `${periodoFiltro}-${alertIndex}`;
    if (!viewedAlerts.includes(alertKey)) {
      setViewedAlerts([...viewedAlerts, alertKey]);
    }
  };

  const markAllAlertsAsViewed = () => {
    const allKeys = (dashboardData.alertasActivas || []).map((_, idx) => `${periodoFiltro}-${idx}`);
    setViewedAlerts([...new Set([...viewedAlerts, ...allKeys])]);
  };

  // ==========================================
  // MODAL HANDLERS
  // ==========================================
  const openCompanyModal = (companyId, companyName) => {
    if (companyId) {
      setCompanyModal({ isOpen: true, companyId, companyName });
    }
  };

  const closeCompanyModal = () => {
    setCompanyModal({ isOpen: false, companyId: null, companyName: '' });
  };

  const openAuditModal = (auditId) => {
    if (auditId) {
      setAuditDashboardModal({ isOpen: true, auditId });
    }
  };

  const closeAuditModal = () => {
    setAuditDashboardModal({ isOpen: false, auditId: null });
  };

  // ==========================================
  // DESTRUCTURE DATA
  // ==========================================
  const { 
    stats, 
    companyStats,
    evaluacionesPorProcedimiento, 
    vulnerabilidadesPorSeveridad, 
    tendenciaMensual, 
    entidadesEvaluadas, 
    evaluacionesRecientes, 
    alertasActivas 
  } = dashboardData;

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <DashboardHeader
          year={periodoFiltro}
          onYearChange={setPeriodoFiltro}
          yearOptions={yearOptions}
          alertas={alertasActivas}
          viewedAlerts={viewedAlerts}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onMarkAlertViewed={markAlertAsViewed}
          onMarkAllAlertsViewed={markAllAlertsAsViewed}
        />

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle size={18} className="text-red-400" />
            <span className="text-red-300 flex-1">{error}</span>
            <button onClick={handleRefresh} className="text-sm text-red-400 hover:text-red-300 font-medium">
              Reintentar
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={FileText} 
            title="Evaluaciones Totales" 
            value={stats?.totalEvaluaciones || 0} 
            subtitle={`Gestión ${periodoFiltro} • Click para ver detalles`} 
            color="primary" 
            loading={loading}
            onClick={() => setEvaluacionesModal(true)}
          />
          <StatCard 
            icon={Building2} 
            title="Entidades Evaluadas" 
            value={stats?.entidadesEvaluadas || 0} 
            subtitle={`De ${stats?.totalEntidades || 0} (${stats?.porcentajeCobertura || 0}%) • Click para ver`} 
            color="cyan" 
            loading={loading}
            onClick={() => setEntidadesModal(true)}
          />
          <StatCard 
            icon={AlertTriangle} 
            title="Vuln. Críticas" 
            value={stats?.vulnCriticasActivas || 0} 
            subtitle="Requieren atención" 
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
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DistributionChart
            dataSources={dashboardData}
            loading={loading}
            title="Distribución de Evaluaciones"
            defaultSource="procedimiento"
            defaultChartType="bar"
          />

          <VulnerabilidadesChart
            vulnerabilidadesPorSeveridad={vulnerabilidadesPorSeveridad}
            verificacion={stats?.verificacion}
            loading={loading}
            title="Análisis de Vulnerabilidades"
          />

          <TendenciaMensualChart
            data={tendenciaMensual}
            loading={loading}
          />
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <EvaluacionesRecientesTable
            evaluaciones={evaluacionesRecientes}
            loading={loading}
            maxItems={5}
            onViewAll={() => setEvaluacionesModal(true)}
            onViewAudit={openAuditModal}
          />

          <TopEntidadesCriticasCard
            year={parseInt(periodoFiltro)}
            loading={loading}
            onViewDetails={() => setTopCriticasModal(true)}
            onViewCompany={openCompanyModal}
            limit={5}
          />
        </div>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-800 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>AGETIC - Área Centro de Gestión de Incidentes Informáticos</span>
            <span className="text-gray-700">|</span>
            <span>Manual ACGII-M01 v4</span>
          </div>
          <div>
            <span>Última actualización: {new Date().toLocaleString('es-BO')}</span>
          </div>
        </footer>
      </div>

      {/* ==========================================
          MODALS
          ========================================== */}
      
      <CompanyStatsModal
        isOpen={companyModal.isOpen}
        onClose={closeCompanyModal}
        companyId={companyModal.companyId}
        companyName={companyModal.companyName}
        year={parseInt(periodoFiltro)}
      />

      <EvaluacionesModal
        isOpen={evaluacionesModal}
        onClose={() => setEvaluacionesModal(false)}
        evaluaciones={evaluacionesRecientes || []}
        loading={loading}
        year={periodoFiltro}
        onViewCompany={(companyId, companyName) => {
          setEvaluacionesModal(false);
          openCompanyModal(companyId, companyName);
        }}
        onViewAudit={(auditId) => {
          setEvaluacionesModal(false);
          openAuditModal(auditId);
        }}
      />

      <EntidadesModal
        isOpen={entidadesModal}
        onClose={() => setEntidadesModal(false)}
        entidades={entidadesEvaluadas || []}
        loading={loading}
        year={periodoFiltro}
        totalEntidades={stats?.totalEntidades || 0}
        onViewCompany={(companyId, companyName) => {
          setEntidadesModal(false);
          openCompanyModal(companyId, companyName);
        }}
      />

      <TopEntidadesCriticasModal
        isOpen={topCriticasModal}
        onClose={() => setTopCriticasModal(false)}
        year={parseInt(periodoFiltro)}
        onViewCompany={(companyId, companyName) => {
          setTopCriticasModal(false);
          openCompanyModal(companyId, companyName);
        }}
      />

      <AuditDashboardModal
        isOpen={auditDashboardModal.isOpen}
        onClose={closeAuditModal}
        auditId={auditDashboardModal.auditId}
        onViewCompany={(companyId, companyName) => {
          closeAuditModal();
          openCompanyModal(companyId, companyName);
        }}
      />
    </div>
  );
}