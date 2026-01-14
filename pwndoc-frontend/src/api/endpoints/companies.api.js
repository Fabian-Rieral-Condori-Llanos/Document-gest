import api from '../axios.config';

/**
 * API de Empresas/Compañías
 * 
 * Endpoints para gestión de empresas
 * Base path: /api/companies
 */
export const companiesApi = {
  /**
   * Obtener todas las empresas
   * GET /companies
   * Requiere: companies:read
   */
  getAll: async () => {
    const response = await api.get('/companies');
    return response.data;
  },

  /**
   * Obtener empresa por ID
   * GET /companies/:id
   * Requiere: companies:read
   */
  getById: async (id) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  /**
   * Crear nueva empresa
   * POST /companies
   * Requiere: companies:create
   */
  create: async (companyData) => {
    const response = await api.post('/companies', companyData);
    return response.data;
  },

  /**
   * Actualizar empresa
   * PUT /companies/:id
   * Requiere: companies:update
   */
  update: async (id, companyData) => {
    const response = await api.put(`/companies/${id}`, companyData);
    return response.data;
  },

  /**
   * Eliminar empresa
   * DELETE /companies/:id
   * Requiere: companies:delete
   */
  delete: async (id) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },
};

export default companiesApi;