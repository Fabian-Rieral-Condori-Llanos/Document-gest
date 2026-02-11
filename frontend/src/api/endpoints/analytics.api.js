import api from '../axios.config';

/**
 * API de Analytics/Dashboard
 * 
 * Endpoints para obtener estadísticas del dashboard.
 * Base path: /api/analytics
 */
export const analyticsApi = {
  /**
   * Obtener dashboard global
   * GET /analytics/dashboard/global
   * @param {Object} filters - Filtros opcionales
   * @param {number} filters.year - Año para filtrar
   * @param {string} filters.startDate - Fecha inicio ISO
   * @param {string} filters.endDate - Fecha fin ISO
   */
  getGlobalDashboard: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString();
    const url = `/analytics/dashboard/global${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener dashboard de una compañía específica
   * GET /analytics/dashboard/company/:companyId
   * @param {string} companyId - ID de la compañía
   * @param {Object} filters - Filtros opcionales
   */
  getCompanyDashboard: async (companyId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString();
    const url = `/analytics/dashboard/company/${companyId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener dashboard de una auditoría específica
   * GET /analytics/dashboard/audit/:auditId
   * @param {string} auditId - ID de la auditoría
   */
  getAuditDashboard: async (auditId) => {
    const response = await api.get(`/analytics/dashboard/audit/${auditId}`);
    return response.data;
  },

  /**
   * Obtener top entidades con vulnerabilidades críticas
   * GET /analytics/entidades-criticas
   * @param {Object} filters - Filtros opcionales
   * @param {number} filters.year - Año para filtrar
   * @param {string} filters.startDate - Fecha inicio ISO
   * @param {string} filters.endDate - Fecha fin ISO
   * @param {number} filters.limit - Número máximo de entidades
   */
  getTopEntidadesCriticas: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const url = `/analytics/entidades-criticas${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener vulnerabilidades detalladas de una entidad
   * GET /analytics/vulnerabilidades/entidad/:companyId
   * @param {string} companyId - ID de la compañía
   * @param {Object} filters - Filtros opcionales
   * @param {number} filters.year - Año para filtrar
   * @param {boolean} filters.soloActivas - Solo vulnerabilidades no remediadas
   * @param {string} filters.severidad - Filtrar por severidad
   */
  getVulnerabilidadesEntidad: async (companyId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.soloActivas) params.append('soloActivas', 'true');
    if (filters.severidad) params.append('severidad', filters.severidad);
    
    const queryString = params.toString();
    const url = `/analytics/vulnerabilidades/entidad/${companyId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  // ============================================
  // PERMISOS DE ANALYTICS (Admin only)
  // ============================================

  /**
   * Obtener todos los permisos configurados
   * GET /analytics/permissions
   */
  getAllPermissions: async () => {
    const response = await api.get('/analytics/permissions');
    return response.data;
  },

  /**
   * Obtener usuarios con rol analyst y su estado de permisos
   * GET /analytics/permissions/analysts
   */
  getAnalystUsers: async () => {
    const response = await api.get('/analytics/permissions/analysts');
    return response.data;
  },

  /**
   * Obtener compañías disponibles para asignar
   * GET /analytics/permissions/companies
   * @param {Object} options
   * @param {boolean} options.onlyCuadroDeMando - Solo cuadroDeMando
   * @param {boolean} options.onlyActive - Solo activas
   */
  getAvailableCompanies: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.onlyCuadroDeMando) params.append('onlyCuadroDeMando', 'true');
    if (options.onlyActive !== undefined) params.append('onlyActive', options.onlyActive);
    
    const queryString = params.toString();
    const url = `/analytics/permissions/companies${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener permisos de un usuario específico
   * GET /analytics/permissions/user/:userId
   * @param {string} userId
   */
  getUserPermissions: async (userId) => {
    const response = await api.get(`/analytics/permissions/user/${userId}`);
    return response.data;
  },

  /**
   * Crear o actualizar permisos de un usuario
   * PUT /analytics/permissions/user/:userId
   * @param {string} userId
   * @param {Object} permissionData
   */
  upsertUserPermissions: async (userId, permissionData) => {
    const response = await api.put(`/analytics/permissions/user/${userId}`, permissionData);
    return response.data;
  },

  /**
   * Actualizar parcialmente permisos de un usuario
   * PATCH /analytics/permissions/user/:userId
   * @param {string} userId
   * @param {Object} updates
   */
  updateUserPermissions: async (userId, updates) => {
    const response = await api.patch(`/analytics/permissions/user/${userId}`, updates);
    return response.data;
  },

  /**
   * Eliminar permisos personalizados (reset a default)
   * DELETE /analytics/permissions/user/:userId
   * @param {string} userId
   */
  deleteUserPermissions: async (userId) => {
    const response = await api.delete(`/analytics/permissions/user/${userId}`);
    return response.data;
  },

  /**
   * Toggle rápido de permisos personalizados
   * POST /analytics/permissions/toggle/:userId
   * @param {string} userId
   * @param {boolean} enabled
   */
  toggleCustomPermissions: async (userId, enabled) => {
    const response = await api.post(`/analytics/permissions/toggle/${userId}`, { enabled });
    return response.data;
  },

  /**
   * Toggle rápido de filtro cuadroDeMando
   * POST /analytics/permissions/toggle-cuadro-mando/:userId
   * @param {string} userId
   * @param {boolean} enabled
   */
  toggleCuadroDeMando: async (userId, enabled) => {
    const response = await api.post(`/analytics/permissions/toggle-cuadro-mando/${userId}`, { enabled });
    return response.data;
  },

  /**
   * Obtener resumen de permisos de un usuario
   * GET /analytics/permissions/summary/:userId
   * @param {string} userId
   */
  getPermissionsSummary: async (userId) => {
    const response = await api.get(`/analytics/permissions/summary/${userId}`);
    return response.data;
  },

  /**
   * Preview de qué vería un usuario con sus permisos actuales
   * GET /analytics/permissions/preview/:userId
   * @param {string} userId
   * @param {string} endpoint - Nombre del endpoint a previsualizar
   */
  getPermissionsPreview: async (userId, endpoint = 'globalDashboard') => {
    const response = await api.get(`/analytics/permissions/preview/${userId}?endpoint=${endpoint}`);
    return response.data;
  },

  /**
   * Inicializar permisos para todos los usuarios analyst
   * POST /analytics/permissions/initialize
   */
  initializeAllPermissions: async () => {
    const response = await api.post('/analytics/permissions/initialize');
    return response.data;
  },

  /**
   * Limpiar permisos huérfanos
   * POST /analytics/permissions/cleanup
   */
  cleanupPermissions: async () => {
    const response = await api.post('/analytics/permissions/cleanup');
    return response.data;
  },

  // ============================================
  // ESTADÍSTICAS DE COMPANIES (Entidades)
  // ============================================

  /**
   * Obtener estadísticas generales de Companies
   * GET /analytics/company-stats
   * @param {Object} options
   * @param {number} options.gestion - Año de gestión para documentación
   */
  getCompanyStatistics: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.gestion) params.append('gestion', options.gestion);
    
    const queryString = params.toString();
    const url = `/analytics/company-stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener listado de Companies con estadísticas de auditorías
   * GET /analytics/companies-with-stats
   * @param {Object} filters
   * @param {number} filters.year - Año para filtrar
   * @param {string} filters.startDate - Fecha inicio ISO
   * @param {string} filters.endDate - Fecha fin ISO
   */
  getCompaniesWithStats: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString();
    const url = `/analytics/companies-with-stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },
};

export default analyticsApi;