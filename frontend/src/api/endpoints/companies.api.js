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
   * @param {Object} filters - Filtros opcionales
   * @param {boolean} filters.status - Filtrar por estado
   * @param {boolean} filters.cuadroDeMando - Filtrar por prioridad
   * @param {string} filters.nivel - Filtrar por nivel (CENTRAL/TERRITORIAL)
   * @param {string} filters.categoria - Filtrar por categoría
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status !== undefined) params.append('status', filters.status);
    if (filters.cuadroDeMando !== undefined) params.append('cuadroDeMando', filters.cuadroDeMando);
    if (filters.nivel) params.append('nivel', filters.nivel);
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.prioritarias !== undefined) params.append('prioritarias', filters.prioritarias);
    
    const queryString = params.toString();
    const url = `/companies${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener empresas activas ordenadas por prioridad
   * GET /companies/activas
   */
  getActivas: async () => {
    const response = await api.get('/companies/activas');
    return response.data;
  },

  /**
   * Obtener empresas prioritarias (cuadro de mando)
   * GET /companies/prioritarias
   */
  getPrioritarias: async () => {
    const response = await api.get('/companies/prioritarias');
    return response.data;
  },

  /**
   * Obtener estadísticas de empresas
   * GET /companies/estadisticas
   */
  getEstadisticas: async () => {
    const response = await api.get('/companies/estadisticas');
    return response.data;
  },

  /**
   * Obtener catálogos de niveles y categorías
   * GET /companies/catalogos
   */
  getCatalogos: async () => {
    const response = await api.get('/companies/catalogos');
    return response.data;
  },

  /**
   * Obtener empresa por ID
   * GET /companies/:id
   * @param {boolean} full - Si true, obtiene todos los campos
   */
  getById: async (id, full = false) => {
    const url = full ? `/companies/${id}?full=true` : `/companies/${id}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener empresa completa por ID
   * GET /companies/:id/full
   */
  getFullById: async (id) => {
    const response = await api.get(`/companies/${id}/full`);
    return response.data;
  },

  /**
   * Crear nueva empresa
   * POST /companies
   */
  create: async (companyData) => {
    const response = await api.post('/companies', companyData);
    return response.data;
  },

  /**
   * Actualizar empresa
   * PUT /companies/:id
   */
  update: async (id, companyData) => {
    const response = await api.put(`/companies/${id}`, companyData);
    return response.data;
  },

  /**
   * Actualizar estado de empresa
   * PATCH /companies/:id/status
   */
  updateStatus: async (id, status) => {
    const response = await api.patch(`/companies/${id}/status`, { status });
    return response.data;
  },

  /**
   * Actualizar cuadro de mando
   * PATCH /companies/:id/cuadro-de-mando
   */
  updateCuadroDeMando: async (id, cuadroDeMando) => {
    const response = await api.patch(`/companies/${id}/cuadro-de-mando`, { cuadroDeMando });
    return response.data;
  },

  /**
   * Agregar documento a un array específico
   * POST /companies/:id/documentos/:tipo
   * @param {string} tipo - pisi, actualizacionPisi, borradorPisi, seguimientoPisi,
   *                        borradorPlanContingencia, planContingencia, informeTecnico
   */
  agregarDocumento: async (id, tipo, documento) => {
    const response = await api.post(`/companies/${id}/documentos/${tipo}`, documento);
    return response.data;
  },

  /**
   * Actualizar documento específico
   * PUT /companies/:id/documentos/:tipo/:docId
   */
  actualizarDocumento: async (id, tipo, docId, documento) => {
    const response = await api.put(`/companies/${id}/documentos/${tipo}/${docId}`, documento);
    return response.data;
  },

  /**
   * Eliminar documento específico
   * DELETE /companies/:id/documentos/:tipo/:docId
   */
  eliminarDocumento: async (id, tipo, docId) => {
    const response = await api.delete(`/companies/${id}/documentos/${tipo}/${docId}`);
    return response.data;
  },

  /**
   * Eliminar empresa
   * DELETE /companies/:id
   */
  delete: async (id) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },
};

export default companiesApi;