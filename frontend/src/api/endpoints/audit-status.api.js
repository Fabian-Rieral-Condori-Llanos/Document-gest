import api from '../axios.config';
const apiClient = api;
/**
 * Audit Status API
 * Endpoints para seguimiento del estado de auditorías
 */

// ============================================
// CONSULTAS
// ============================================

/**
 * Obtener todos los estados
 */
export const getAuditStatuses = async (params = {}) => {
  const response = await apiClient.get('/audit-status', { params });
  return response.data;
};

/**
 * Obtener estado por ID
 */
export const getAuditStatusById = async (id) => {
  const response = await apiClient.get(`/audit-status/${id}`);
  return response.data;
};

/**
 * Obtener estado por Audit ID
 */
export const getAuditStatusByAuditId = async (auditId) => {
  const response = await apiClient.get(`/audit-status/audit/${auditId}`);
  return response.data;
};

/**
 * Obtener historial de cambios por Audit ID
 */
export const getAuditStatusHistory = async (auditId) => {
  const response = await apiClient.get(`/audit-status/audit/${auditId}/history`);
  return response.data;
};

/**
 * Obtener estadísticas de estados
 */
export const getAuditStatusStats = async () => {
  const response = await apiClient.get('/audit-status/stats');
  return response.data;
};

/**
 * Obtener tipos de estado disponibles
 */
export const getAuditStatusTypes = async () => {
  const response = await apiClient.get('/audit-status/types');
  return response.data;
};

// ============================================
// MUTACIONES
// ============================================

/**
 * Crear estado para auditoría
 */
export const createAuditStatus = async (statusData) => {
  const response = await apiClient.post('/audit-status', statusData);
  return response.data;
};

/**
 * Actualizar estado por ID
 */
export const updateAuditStatus = async (id, statusData) => {
  const response = await apiClient.put(`/audit-status/${id}`, statusData);
  return response.data;
};

/**
 * Actualizar estado por Audit ID
 */
export const updateAuditStatusByAuditId = async (auditId, statusData) => {
  const response = await apiClient.put(`/audit-status/audit/${auditId}`, statusData);
  return response.data;
};

/**
 * Eliminar estado
 */
export const deleteAuditStatus = async (id) => {
  const response = await apiClient.delete(`/audit-status/${id}`);
  return response.data;
};

// ============================================
// CONSTANTES
// ============================================

/**
 * Estados posibles
 */
export const AUDIT_STATUS_TYPES = {
  EVALUANDO: 'EVALUANDO',
  VERIFICACION: 'VERIFICACION',
  PENDIENTE: 'PENDIENTE',
  COMPLETADO: 'COMPLETADO',
};

/**
 * Configuración de colores por estado
 */
export const AUDIT_STATUS_COLORS = {
  EVALUANDO: { bg: 'bg-info-500/10', text: 'text-info-400', border: 'border-info-500/20' },
  VERIFICACION: { bg: 'bg-warning-500/10', text: 'text-warning-400', border: 'border-warning-500/20' },
  PENDIENTE: { bg: 'bg-danger-500/10', text: 'text-danger-400', border: 'border-danger-500/20' },
  COMPLETADO: { bg: 'bg-success-500/10', text: 'text-success-400', border: 'border-success-500/20' },
};

/**
 * Labels en español
 */
export const AUDIT_STATUS_LABELS = {
  EVALUANDO: 'Evaluando',
  VERIFICACION: 'En Verificación',
  PENDIENTE: 'Pendiente',
  COMPLETADO: 'Completado',
};

export default {
  // Consultas
  getAuditStatuses,
  getAuditStatusById,
  getAuditStatusByAuditId,
  getAuditStatusHistory,
  getAuditStatusStats,
  getAuditStatusTypes,
  // Mutaciones
  createAuditStatus,
  updateAuditStatus,
  updateAuditStatusByAuditId,
  deleteAuditStatus,
  // Constantes
  AUDIT_STATUS_TYPES,
  AUDIT_STATUS_COLORS,
  AUDIT_STATUS_LABELS,
};