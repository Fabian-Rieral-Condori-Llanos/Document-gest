import api from '../axios.config';

/**
 * API de Plantillas de Procedimientos
 * 
 * Endpoints para gestión de plantillas de procedimientos.
 * Solo admin puede crear/editar/eliminar.
 * Base path: /api/procedure-templates
 */
export const procedureTemplatesApi = {
  /**
   * Obtener todas las plantillas
   * GET /procedure-templates
   * Admin ve todas, usuarios ven solo activas
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`/procedure-templates?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener solo plantillas activas (para selectores)
   * GET /procedure-templates/active
   */
  getActive: async () => {
    const response = await api.get('/procedure-templates/active');
    return response.data;
  },

  /**
   * Obtener estadísticas de uso
   * GET /procedure-templates/stats
   * Solo admin
   */
  getStats: async () => {
    const response = await api.get('/procedure-templates/stats');
    return response.data;
  },

  /**
   * Obtener plantilla por ID
   * GET /procedure-templates/:id
   */
  getById: async (id) => {
    const response = await api.get(`/procedure-templates/${id}`);
    return response.data;
  },

  /**
   * Obtener plantilla por código
   * GET /procedure-templates/code/:code
   */
  getByCode: async (code) => {
    const response = await api.get(`/procedure-templates/code/${code}`);
    return response.data;
  },

  /**
   * Crear nueva plantilla
   * POST /procedure-templates
   * Solo admin
   */
  create: async (templateData) => {
    const response = await api.post('/procedure-templates', templateData);
    return response.data;
  },

  /**
   * Actualizar plantilla
   * PUT /procedure-templates/:id
   * Solo admin
   */
  update: async (id, templateData) => {
    const response = await api.put(`/procedure-templates/${id}`, templateData);
    return response.data;
  },

  /**
   * Activar/desactivar plantilla
   * PATCH /procedure-templates/:id/toggle
   * Solo admin
   */
  toggle: async (id) => {
    const response = await api.patch(`/procedure-templates/${id}/toggle`);
    return response.data;
  },

  /**
   * Eliminar plantilla
   * DELETE /procedure-templates/:id
   * Solo admin
   */
  delete: async (id) => {
    const response = await api.delete(`/procedure-templates/${id}`);
    return response.data;
  },

  /**
   * Inicializar plantillas por defecto
   * POST /procedure-templates/initialize
   * Solo admin
   */
  initialize: async () => {
    const response = await api.post('/procedure-templates/initialize');
    return response.data;
  },
};

export default procedureTemplatesApi;
