import api from '../axios.config';

/**
 * Backups API
 * 
 * Endpoints para gestión de backups del sistema.
 * Base: /api/backups
 */

const backupsApi = {
  /**
   * Obtiene la lista de backups disponibles
   * GET /api/backups
   */
  getAll: () => api.get('/backups'),

  /**
   * Obtiene el estado actual del proceso de backup/restore
   * GET /api/backups/status
   */
  getStatus: () => api.get('/backups/status'),

  /**
   * Obtiene información de uso de disco
   * GET /api/backups/disk-usage
   */
  getDiskUsage: () => api.get('/backups/disk-usage'),

  /**
   * Obtiene información de un backup específico
   * GET /api/backups/:slug
   */
  getInfo: (slug) => api.get(`/backups/${slug}`),

  /**
   * Descarga un backup
   * GET /api/backups/:slug/download
   */
  download: (slug) => api.get(`/backups/${slug}/download`, {
    responseType: 'blob',
  }),

  /**
   * Crea un nuevo backup
   * POST /api/backups
   * @param {object} data - { name, password, backupData }
   */
  create: (data) => api.post('/backups', data),

  /**
   * Sube un archivo de backup
   * POST /api/backups/upload
   * @param {File} file - Archivo .tar de backup
   */
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/backups/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Restaura un backup
   * POST /api/backups/:slug/restore
   * @param {string} slug - Identificador del backup
   * @param {object} data - { password, restoreData, mode }
   */
  restore: (slug, data) => api.post(`/backups/${slug}/restore`, data),

  /**
   * Elimina un backup
   * DELETE /api/backups/:slug
   */
  delete: (slug) => api.delete(`/backups/${slug}`),
};

export default backupsApi;