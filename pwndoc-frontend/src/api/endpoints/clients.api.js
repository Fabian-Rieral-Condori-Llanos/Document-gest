import api from '../axios.config';

/**
 * API de Clientes/Entidades
 * 
 * Endpoints para gestión de clientes
 * Base path: /api/clients
 */
export const clientsApi = {
  /**
   * Obtener todos los clientes
   * GET /clients
   * Requiere: clients:read
   */
  getAll: async () => {
    const response = await api.get('/clients');
    return response.data;
  },

  /**
   * Obtener cliente por ID
   * GET /clients/:id
   * Requiere: clients:read
   */
  getById: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  /**
   * Crear nuevo cliente
   * POST /clients
   * Requiere: clients:create
   */
  create: async (clientData) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  /**
   * Actualizar cliente
   * PUT /clients/:id
   * Requiere: clients:update
   */
  update: async (id, clientData) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },

  /**
   * Eliminar cliente
   * DELETE /clients/:id
   * Requiere: clients:delete
   */
  delete: async (id) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
};

export default clientsApi;