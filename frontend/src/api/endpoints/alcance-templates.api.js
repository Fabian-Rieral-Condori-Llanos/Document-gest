import api from '../axios.config';

/**
 * API de Plantillas de Alcance
 * 
 * Endpoints para gestión de plantillas de alcance.
 * Solo admin puede crear/editar/eliminar.
 * Base path: /api/alcance-templates
 */
export const alcanceTemplatesApi = {
  /**
   * Obtener todas las plantillas
   * GET /alcance-templates
   * Admin ve todas, usuarios ven solo activas
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`/alcance-templates?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener solo plantillas activas (para selectores)
   * GET /alcance-templates/active
   */
  getActive: async () => {
    const response = await api.get('/alcance-templates/active');
    return response.data;
  },

  /**
   * Obtener estadísticas de uso
   * GET /alcance-templates/stats
   * Solo admin
   */
  getStats: async () => {
    const response = await api.get('/alcance-templates/stats');
    return response.data;
  },

  /**
   * Obtener plantilla por ID
   * GET /alcance-templates/:id
   */
  getById: async (id) => {
    const response = await api.get(`/alcance-templates/${id}`);
    return response.data;
  },

  /**
   * Obtener plantilla por nombre
   * GET /alcance-templates/name/:name
   */
  getByName: async (name) => {
    const response = await api.get(`/alcance-templates/name/${encodeURIComponent(name)}`);
    return response.data;
  },

  /**
   * Crear nueva plantilla
   * POST /alcance-templates
   * Solo admin
   */
  create: async (templateData) => {
    const response = await api.post('/alcance-templates', templateData);
    return response.data;
  },

  /**
   * Actualizar plantilla
   * PUT /alcance-templates/:id
   * Solo admin
   */
  update: async (id, templateData) => {
    const response = await api.put(`/alcance-templates/${id}`, templateData);
    return response.data;
  },

  /**
   * Activar/desactivar plantilla
   * PATCH /alcance-templates/:id/toggle
   * Solo admin
   */
  toggle: async (id) => {
    const response = await api.patch(`/alcance-templates/${id}/toggle`);
    return response.data;
  },

  /**
   * Eliminar plantilla
   * DELETE /alcance-templates/:id
   * Solo admin
   */
  delete: async (id) => {
    const response = await api.delete(`/alcance-templates/${id}`);
    return response.data;
  },

  /**
   * Inicializar plantillas por defecto
   * POST /alcance-templates/initialize
   * Solo admin
   */
  initialize: async () => {
    const response = await api.post('/alcance-templates/initialize');
    return response.data;
  },
};

export default alcanceTemplatesApi;