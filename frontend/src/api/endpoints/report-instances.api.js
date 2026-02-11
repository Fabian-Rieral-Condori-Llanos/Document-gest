import api from '../axios.config';

/**
 * API de Instancias de Reportes
 * 
 * Endpoints para gestión de instancias de reportes (copia por auditoría).
 * Base path: /api/report-instances
 */
export const reportInstancesApi = {
  /**
   * Obtener instancia por ID de auditoría
   * GET /report-instances/audit/:auditId
   */
  getByAuditId: async (auditId) => {
    const response = await api.get(`/report-instances/audit/${auditId}`);
    return response.data;
  },

  /**
   * Obtener instancia por ID
   * GET /report-instances/:id
   */
  getById: async (id) => {
    const response = await api.get(`/report-instances/${id}`);
    return response.data;
  },

  /**
   * Crear instancia de reporte para una auditoría
   * POST /report-instances
   */
  create: async ({ auditId, templateId }) => {
    const response = await api.post('/report-instances', { auditId, templateId });
    return response.data;
  },

  /**
   * Refrescar datos inyectados desde la auditoría
   * POST /report-instances/:id/refresh
   */
  refreshData: async (id) => {
    const response = await api.post(`/report-instances/${id}/refresh`);
    return response.data;
  },

  /**
   * Actualizar contenido del reporte
   * PATCH /report-instances/:id/content
   */
  updateContent: async (id, content) => {
    const response = await api.patch(`/report-instances/${id}/content`, { content });
    return response.data;
  },

  /**
   * Guardar versión
   * POST /report-instances/:id/version
   */
  saveVersion: async (id, comment = '') => {
    const response = await api.post(`/report-instances/${id}/version`, { comment });
    return response.data;
  },

  /**
   * Obtener historial de versiones
   * GET /report-instances/:id/versions
   */
  getVersionHistory: async (id) => {
    const response = await api.get(`/report-instances/${id}/versions`);
    return response.data;
  },

  /**
   * Restaurar versión anterior
   * POST /report-instances/:id/restore/:versionNumber
   */
  restoreVersion: async (id, versionNumber) => {
    const response = await api.post(`/report-instances/${id}/restore/${versionNumber}`);
    return response.data;
  },

  /**
   * Actualizar estado del reporte
   * PATCH /report-instances/:id/status
   */
  updateStatus: async (id, status) => {
    const response = await api.patch(`/report-instances/${id}/status`, { status });
    return response.data;
  },

  /**
   * Bloquear reporte
   * POST /report-instances/:id/lock
   */
  lock: async (id) => {
    const response = await api.post(`/report-instances/${id}/lock`);
    return response.data;
  },

  /**
   * Desbloquear reporte
   * POST /report-instances/:id/unlock
   */
  unlock: async (id) => {
    const response = await api.post(`/report-instances/${id}/unlock`);
    return response.data;
  },

  /**
   * Obtener colaboradores activos
   * GET /report-instances/:id/collaborators
   */
  getCollaborators: async (id) => {
    const response = await api.get(`/report-instances/${id}/collaborators`);
    return response.data;
  },

  /**
   * Eliminar instancia
   * DELETE /report-instances/:id
   */
  delete: async (id) => {
    const response = await api.delete(`/report-instances/${id}`);
    return response.data;
  },
};

export default reportInstancesApi;
