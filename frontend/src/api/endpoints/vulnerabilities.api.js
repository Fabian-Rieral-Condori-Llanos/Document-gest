import api from '../axios.config';

/**
 * API de Vulnerabilidades (Base de Conocimiento)
 * 
 * Endpoints para gestión de vulnerabilidades
 * Base path: /api/vulnerabilities
 */
export const vulnerabilitiesApi = {
  /**
   * Obtener todas las vulnerabilidades
   * GET /vulnerabilities
   */
  getAll: async () => {
    const response = await api.get('/vulnerabilities');
    return response.data;
  },

  /**
   * Obtener vulnerabilidad por ID
   * GET /vulnerabilities/:id
   */
  getById: async (id) => {
    const response = await api.get(`/vulnerabilities/${id}`);
    return response.data;
  },

  /**
   * Buscar por título
   * GET /vulnerabilities/find?title=...&locale=...
   */
  findByTitle: async (title, locale = 'es') => {
    const response = await api.get('/vulnerabilities/find', {
      params: { title, locale }
    });
    return response.data;
  },

  /**
   * Exportar vulnerabilidades (formato reducido)
   * GET /vulnerabilities/export
   */
  export: async () => {
    const response = await api.get('/vulnerabilities/export');
    return response.data;
  },

  /**
   * Crear vulnerabilidad(es)
   * POST /vulnerabilities
   * Puede recibir un objeto o array de objetos
   */
  create: async (vulnData) => {
    const response = await api.post('/vulnerabilities', vulnData);
    return response.data;
  },

  /**
   * Actualizar vulnerabilidad
   * PUT /vulnerabilities/:id
   */
  update: async (id, vulnData) => {
    const response = await api.put(`/vulnerabilities/${id}`, vulnData);
    return response.data;
  },

  /**
   * Eliminar vulnerabilidad
   * DELETE /vulnerabilities/:id
   */
  delete: async (id) => {
    const response = await api.delete(`/vulnerabilities/${id}`);
    return response.data;
  },

  /**
   * Eliminar múltiples vulnerabilidades
   * POST /vulnerabilities/delete
   */
  deleteMany: async (vulnerabilityIds) => {
    const response = await api.post('/vulnerabilities/delete', { vulnerabilityIds });
    return response.data;
  },

  /**
   * Combinar vulnerabilidades
   * POST /vulnerabilities/merge
   */
  merge: async (vulnIdFrom, vulnIdTo) => {
    const response = await api.post('/vulnerabilities/merge', { vulnIdFrom, vulnIdTo });
    return response.data;
  },
};

/**
 * API de Datos Auxiliares
 * 
 * Endpoints para categorías, tipos, idiomas, etc.
 * Base path: /api/data
 */
export const dataApi = {
  // Idiomas
  getLanguages: async () => {
    const response = await api.get('/data/languages');
    return response.data;
  },

  // Tipos de vulnerabilidad
  getVulnerabilityTypes: async () => {
    const response = await api.get('/data/vulnerability-types');
    return response.data;
  },

  // Categorías de vulnerabilidad
  getVulnerabilityCategories: async () => {
    const response = await api.get('/data/vulnerability-categories');
    return response.data;
  },

  // Tipos de auditoría
  getAuditTypes: async () => {
    const response = await api.get('/data/audit-types');
    return response.data;
  },

  // Campos personalizados
  getCustomFields: async () => {
    const response = await api.get('/data/custom-fields');
    return response.data;
  },
};

export default vulnerabilitiesApi;