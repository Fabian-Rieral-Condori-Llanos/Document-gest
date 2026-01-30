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
};

export default analyticsApi;