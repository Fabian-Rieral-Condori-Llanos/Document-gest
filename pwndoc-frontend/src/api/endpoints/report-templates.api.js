import api from '../axios.config';

/**
 * API de Plantillas de Reportes
 * 
 * Endpoints para gestión de plantillas de reportes colaborativos.
 * Base path: /api/report-templates
 */
export const reportTemplatesApi = {
  /**
   * Obtener todas las plantillas
   * GET /report-templates
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`/report-templates?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener solo plantillas activas (para selectores)
   * GET /report-templates/active
   */
  getActive: async () => {
    const response = await api.get('/report-templates/active');
    return response.data;
  },

  /**
   * Obtener estadísticas
   * GET /report-templates/stats
   */
  getStats: async () => {
    const response = await api.get('/report-templates/stats');
    return response.data;
  },

  /**
   * Obtener variables del sistema
   * GET /report-templates/variables
   */
  getVariables: async () => {
    const response = await api.get('/report-templates/variables');
    return response.data;
  },

  /**
   * Obtener categorías disponibles
   * GET /report-templates/categories
   */
  getCategories: async () => {
    const response = await api.get('/report-templates/categories');
    return response.data;
  },

  /**
   * Obtener plantilla por ID
   * GET /report-templates/:id
   */
  getById: async (id) => {
    const response = await api.get(`/report-templates/${id}`);
    return response.data;
  },

  /**
   * Crear nueva plantilla
   * POST /report-templates
   */
  create: async (templateData) => {
    const response = await api.post('/report-templates', templateData);
    return response.data;
  },

  /**
   * Crear plantilla desde archivo DOCX
   * POST /report-templates/upload
   */
  createFromDocx: async (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const response = await api.post('/report-templates/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Actualizar plantilla
   * PUT /report-templates/:id
   */
  update: async (id, templateData) => {
    const response = await api.put(`/report-templates/${id}`, templateData);
    return response.data;
  },

  /**
   * Actualizar solo contenido
   * PATCH /report-templates/:id/content
   */
  updateContent: async (id, content) => {
    const response = await api.patch(`/report-templates/${id}/content`, { content });
    return response.data;
  },

  /**
   * Activar/desactivar plantilla
   * PATCH /report-templates/:id/toggle
   */
  toggle: async (id) => {
    const response = await api.patch(`/report-templates/${id}/toggle`);
    return response.data;
  },

  /**
   * Clonar plantilla
   * POST /report-templates/:id/clone
   */
  clone: async (id, name) => {
    const response = await api.post(`/report-templates/${id}/clone`, { name });
    return response.data;
  },

  /**
   * Eliminar plantilla
   * DELETE /report-templates/:id
   */
  delete: async (id) => {
    const response = await api.delete(`/report-templates/${id}`);
    return response.data;
  },

  /**
   * Inicializar plantillas por defecto
   * POST /report-templates/initialize
   */
  initialize: async () => {
    const response = await api.post('/report-templates/initialize');
    return response.data;
  },
};

export default reportTemplatesApi;
