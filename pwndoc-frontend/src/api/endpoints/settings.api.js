import api from '../axios.config';

/**
 * API de Configuración del Sistema
 * 
 * Endpoints para configuración de reportes y revisiones.
 * Base path: /api/settings
 */
export const settingsApi = {
  /**
   * Obtener configuración pública
   * GET /settings/public
   * Disponible para todos los usuarios autenticados
   */
  getPublic: async () => {
    const response = await api.get('/settings/public');
    return response.data;
  },

  /**
   * Obtener toda la configuración
   * GET /settings
   * Requiere: settings:read (admin)
   */
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  /**
   * Actualizar configuración
   * PUT /settings
   * Requiere: settings:update (admin)
   */
  update: async (settingsData) => {
    const response = await api.put('/settings', settingsData);
    return response.data;
  },

  /**
   * Restaurar valores por defecto
   * POST /settings/revert
   * Requiere: settings:update (admin)
   */
  restoreDefaults: async () => {
    const response = await api.post('/settings/revert');
    return response.data;
  },
};

export default settingsApi;