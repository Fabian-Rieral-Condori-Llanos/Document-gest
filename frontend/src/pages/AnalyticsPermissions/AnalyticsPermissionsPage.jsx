import { useEffect, useState, useCallback } from 'react';
import { analyticsApi } from '../../api/endpoints/analytics.api';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import ToggleSwitch from '../../components/common/ToggleSwitch/ToggleSwitch';
import Modal from '../../components/common/Modal/Modal';
import {
  Shield,
  Users,
  Building2,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  LayoutDashboard
} from 'lucide-react';

/**
 * AnalyticsPermissionsPage
 * 
 * Página para gestionar permisos de analytics de usuarios con rol analyst.
 * Solo accesible para administradores.
 */
const AnalyticsPermissionsPage = () => {
  // Estado principal
  const [analysts, setAnalysts] = useState([]);
  const [companies, setCompanies] = useState({ all: [], cuadroDeMando: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estado del modal de edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Estado de toggles en proceso
  const [togglingUsers, setTogglingUsers] = useState({});
  
  // Secciones expandidas
  const [expandedSections, setExpandedSections] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analystsRes, companiesRes] = await Promise.all([
        analyticsApi.getAnalystUsers(),
        analyticsApi.getAvailableCompanies()
      ]);
      
      setAnalysts(analystsRes.data?.analysts || []);
      setCompanies(companiesRes.data?.companies || { all: [], cuadroDeMando: [] });
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.data || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Toggle rápido de permisos personalizados
  const handleToggleCustomPermissions = async (userId, currentEnabled) => {
    setTogglingUsers(prev => ({ ...prev, [userId]: true }));
    try {
      await analyticsApi.toggleCustomPermissions(userId, !currentEnabled);
      setSuccess('Permisos actualizados correctamente');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.data || 'Error al actualizar permisos');
    } finally {
      setTogglingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Toggle rápido de cuadroDeMando
  const handleToggleCuadroDeMando = async (userId, currentEnabled) => {
    setTogglingUsers(prev => ({ ...prev, [`${userId}_cuadro`]: true }));
    try {
      await analyticsApi.toggleCuadroDeMando(userId, !currentEnabled);
      setSuccess('Filtro cuadro de mando actualizado');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.data || 'Error al actualizar filtro');
    } finally {
      setTogglingUsers(prev => ({ ...prev, [`${userId}_cuadro`]: false }));
    }
  };

  // Abrir modal de edición
  const handleEditPermissions = async (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
    
    try {
      const response = await analyticsApi.getUserPermissions(user._id);
      setEditingPermissions(response.data);
    } catch (err) {
      console.error('Error loading permissions:', err);
      // Crear permisos por defecto
      setEditingPermissions({
        customPermissionsEnabled: false,
        globalOnlyCuadroDeMando: false,
        globalAllowedCompanies: [],
        globalExcludedCompanies: [],
        endpoints: {
          globalDashboard: { enabled: true, onlyCuadroDeMando: false },
          companyDashboard: { enabled: true, onlyCuadroDeMando: false, allowedCompanies: [] },
          auditDashboard: { enabled: true },
          entidadesCriticas: { enabled: true, onlyCuadroDeMando: false, maxResults: null },
          vulnerabilidadesEntidad: { enabled: true }
        },
        visibleSections: {
          stats: true,
          evaluacionesPorProcedimiento: true,
          evaluacionesPorAlcance: true,
          evaluacionesPorEstado: true,
          evaluacionesPorTipo: true,
          vulnerabilidadesPorSeveridad: true,
          tendenciaMensual: true,
          entidadesEvaluadas: true,
          evaluacionesRecientes: true,
          alertasActivas: true,
          clientesAsociados: true
        }
      });
    }
  };

  // Guardar permisos editados
  const handleSavePermissions = async () => {
    if (!selectedUser || !editingPermissions) return;
    
    setSaving(true);
    try {
      await analyticsApi.upsertUserPermissions(selectedUser._id, editingPermissions);
      setSuccess('Permisos guardados correctamente');
      setEditModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.data || 'Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  // Actualizar campo de permisos en edición
  const updatePermission = (path, value) => {
    setEditingPermissions(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  // Toggle sección expandida
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Limpiar mensajes
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Secciones disponibles con sus labels
  const sectionLabels = {
    stats: 'Estadísticas generales',
    evaluacionesPorProcedimiento: 'Evaluaciones por procedimiento',
    evaluacionesPorAlcance: 'Evaluaciones por alcance',
    evaluacionesPorEstado: 'Evaluaciones por estado',
    evaluacionesPorTipo: 'Evaluaciones por tipo',
    vulnerabilidadesPorSeveridad: 'Vulnerabilidades por severidad',
    tendenciaMensual: 'Tendencia mensual',
    entidadesEvaluadas: 'Entidades evaluadas',
    evaluacionesRecientes: 'Evaluaciones recientes',
    alertasActivas: 'Alertas activas',
    clientesAsociados: 'Clientes asociados'
  };

  // Endpoints disponibles con sus labels
  const endpointLabels = {
    globalDashboard: 'Dashboard Global',
    companyDashboard: 'Dashboard por Compañía',
    auditDashboard: 'Dashboard de Auditoría',
    entidadesCriticas: 'Top Entidades Críticas',
    vulnerabilidadesEntidad: 'Vulnerabilidades por Entidad'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Cargando permisos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              Permisos de Analytics
            </h1>
            <p className="text-gray-400 mt-1">
              Configura qué datos pueden ver los usuarios con rol Analyst
            </p>
          </div>
          
          <Button
            variant="ghost"
            icon={RefreshCw}
            onClick={loadData}
            disabled={loading}
          >
            Actualizar
          </Button>
        </div>

        {/* Alertas */}
        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mb-6" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Info Card */}
        <Card className="mb-6 border-l-4 border-l-purple-500">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">Sistema de Permisos Granulares</p>
              <p className="text-gray-400 text-sm mt-1">
                Cuando los permisos personalizados están <span className="text-green-400">activados</span>, 
                el usuario solo verá los datos configurados. Si están <span className="text-red-400">desactivados</span>, 
                el usuario tiene acceso completo a todos los datos de analytics.
              </p>
            </div>
          </div>
        </Card>

        {/* Lista de Analysts */}
        {analysts.length === 0 ? (
          <Card className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No hay usuarios con rol Analyst
            </h3>
            <p className="text-gray-400">
              Crea usuarios con rol "analyst" para configurar sus permisos de analytics
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {analysts.map((analyst) => (
              <Card key={analyst._id} className="hover:border-gray-600 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Info del usuario */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white font-semibold">
                      {analyst.firstname?.charAt(0)?.toUpperCase() || ''}
                      {analyst.lastname?.charAt(0)?.toUpperCase() || ''}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {analyst.firstname} {analyst.lastname}
                      </p>
                      <p className="text-sm text-gray-400">@{analyst.username}</p>
                    </div>
                  </div>

                  {/* Estado de permisos */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Toggle Permisos Personalizados */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Permisos personalizados:</span>
                      <ToggleSwitch
                        checked={analyst.hasCustomPermissions}
                        onChange={() => handleToggleCustomPermissions(analyst._id, analyst.hasCustomPermissions)}
                        loading={togglingUsers[analyst._id]}
                        size="sm"
                      />
                      <span className={`text-xs ${analyst.hasCustomPermissions ? 'text-green-400' : 'text-gray-500'}`}>
                        {analyst.hasCustomPermissions ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Toggle Cuadro de Mando (solo si permisos activos) */}
                    {analyst.hasCustomPermissions && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Solo Cuadro de Mando:</span>
                        <ToggleSwitch
                          checked={analyst.globalOnlyCuadroDeMando}
                          onChange={() => handleToggleCuadroDeMando(analyst._id, analyst.globalOnlyCuadroDeMando)}
                          loading={togglingUsers[`${analyst._id}_cuadro`]}
                          size="sm"
                        />
                      </div>
                    )}

                    {/* Botón Configurar */}
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Settings}
                      onClick={() => handleEditPermissions(analyst)}
                    >
                      Configurar
                    </Button>
                  </div>
                </div>

                {/* Resumen de permisos (si está activo) */}
                {analyst.hasCustomPermissions && analyst.permissionSummary && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {analyst.permissionSummary.endpointsEnabled?.map(ep => (
                        <span key={ep} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          {endpointLabels[ep] || ep}
                        </span>
                      ))}
                      {analyst.permissionSummary.endpointsDisabled?.map(ep => (
                        <span key={ep} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs">
                          <EyeOff className="w-3 h-3" />
                          {endpointLabels[ep] || ep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Edición */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Configurar permisos - ${selectedUser?.firstname} ${selectedUser?.lastname}`}
          size="xl"
        >
          {editingPermissions && (
            <div className="space-y-6">
              {/* Toggle principal */}
              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div>
                  <p className="text-white font-medium">Permisos Personalizados</p>
                  <p className="text-sm text-gray-400">
                    Activar para restringir qué datos puede ver este usuario
                  </p>
                </div>
                <ToggleSwitch
                  checked={editingPermissions.customPermissionsEnabled}
                  onChange={(val) => updatePermission('customPermissionsEnabled', val)}
                />
              </div>

              {editingPermissions.customPermissionsEnabled && (
                <>
                  {/* Filtro global cuadroDeMando */}
                  <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                    <div>
                      <p className="text-white font-medium">Solo Cuadro de Mando</p>
                      <p className="text-sm text-gray-400">
                        Restringir a compañías marcadas para el cuadro de mando
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={editingPermissions.globalOnlyCuadroDeMando}
                      onChange={(val) => updatePermission('globalOnlyCuadroDeMando', val)}
                    />
                  </div>

                  {/* Endpoints */}
                  <div>
                    <button
                      onClick={() => toggleSection('endpoints')}
                      className="flex items-center justify-between w-full p-3 bg-bg-tertiary rounded-lg text-white font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-primary-400" />
                        Endpoints Habilitados
                      </span>
                      {expandedSections.endpoints ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    
                    {expandedSections.endpoints && (
                      <div className="mt-2 space-y-2 pl-4">
                        {Object.entries(endpointLabels).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                            <span className="text-gray-300">{label}</span>
                            <ToggleSwitch
                              checked={editingPermissions.endpoints?.[key]?.enabled !== false}
                              onChange={(val) => updatePermission(`endpoints.${key}.enabled`, val)}
                              size="sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Secciones visibles */}
                  <div>
                    <button
                      onClick={() => toggleSection('sections')}
                      className="flex items-center justify-between w-full p-3 bg-bg-tertiary rounded-lg text-white font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary-400" />
                        Secciones Visibles
                      </span>
                      {expandedSections.sections ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    
                    {expandedSections.sections && (
                      <div className="mt-2 space-y-2 pl-4">
                        {Object.entries(sectionLabels).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                            <span className="text-gray-300">{label}</span>
                            <ToggleSwitch
                              checked={editingPermissions.visibleSections?.[key] !== false}
                              onChange={(val) => updatePermission(`visibleSections.${key}`, val)}
                              size="sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Compañías permitidas */}
                  <div>
                    <button
                      onClick={() => toggleSection('companies')}
                      className="flex items-center justify-between w-full p-3 bg-bg-tertiary rounded-lg text-white font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary-400" />
                        Compañías Permitidas ({editingPermissions.globalAllowedCompanies?.length || 0})
                      </span>
                      {expandedSections.companies ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    
                    {expandedSections.companies && (
                      <div className="mt-2 max-h-64 overflow-y-auto space-y-2 pl-4">
                        <p className="text-xs text-gray-400 mb-2">
                          Si no seleccionas ninguna, se permiten todas (excepto las excluidas)
                        </p>
                        {companies.all?.map((company) => (
                          <div key={company._id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-300">{company.name}</span>
                              {company.cuadroDeMando && (
                                <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                  CM
                                </span>
                              )}
                            </div>
                            <ToggleSwitch
                              checked={editingPermissions.globalAllowedCompanies?.includes(company._id)}
                              onChange={(val) => {
                                const current = editingPermissions.globalAllowedCompanies || [];
                                const updated = val 
                                  ? [...current, company._id]
                                  : current.filter(id => id !== company._id);
                                updatePermission('globalAllowedCompanies', updated);
                              }}
                              size="sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <Button
                  variant="ghost"
                  onClick={() => setEditModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  icon={Save}
                  onClick={handleSavePermissions}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default AnalyticsPermissionsPage;
