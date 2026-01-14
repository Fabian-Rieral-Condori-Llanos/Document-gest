import api from '../axios.config';
const apiClient = api;
/**
 * Audit Verifications API
 * Endpoints para verificación de hallazgos post-auditoría
 */

// ============================================
// CONSULTAS
// ============================================

/**
 * Obtener todas las verificaciones
 */
export const getAuditVerifications = async (params = {}) => {
  const response = await apiClient.get('/audit-verifications', { params });
  return response.data;
};

/**
 * Obtener verificación por ID
 */
export const getAuditVerificationById = async (id) => {
  const response = await apiClient.get(`/audit-verifications/${id}`);
  return response.data;
};

/**
 * Obtener verificaciones por Audit ID
 */
export const getAuditVerificationsByAuditId = async (auditId) => {
  const response = await apiClient.get(`/audit-verifications/audit/${auditId}`);
  return response.data;
};

/**
 * Obtener estadísticas de verificaciones
 */
export const getAuditVerificationStats = async () => {
  const response = await apiClient.get('/audit-verifications/stats');
  return response.data;
};

/**
 * Obtener estados de verificación disponibles
 */
export const getVerificationStatuses = async () => {
  const response = await apiClient.get('/audit-verifications/statuses');
  return response.data;
};

// ============================================
// MUTACIONES
// ============================================

/**
 * Crear verificación
 */
export const createAuditVerification = async (verificationData) => {
  const response = await apiClient.post('/audit-verifications', verificationData);
  return response.data;
};

/**
 * Actualizar verificación
 */
export const updateAuditVerification = async (id, verificationData) => {
  const response = await apiClient.put(`/audit-verifications/${id}`, verificationData);
  return response.data;
};

/**
 * Finalizar verificación
 */
export const finalizeAuditVerification = async (id) => {
  const response = await apiClient.post(`/audit-verifications/${id}/finalize`);
  return response.data;
};

/**
 * Eliminar verificación
 */
export const deleteAuditVerification = async (id) => {
  const response = await apiClient.delete(`/audit-verifications/${id}`);
  return response.data;
};

// ============================================
// FINDINGS
// ============================================

/**
 * Agregar finding a verificación
 */
export const addFindingToVerification = async (verificationId, findingData) => {
  const response = await apiClient.post(`/audit-verifications/${verificationId}/findings`, findingData);
  return response.data;
};

/**
 * Actualizar estado de finding en verificación
 */
export const updateVerificationFinding = async (verificationId, findingId, findingData) => {
  const response = await apiClient.put(`/audit-verifications/${verificationId}/findings/${findingId}`, findingData);
  return response.data;
};

/**
 * Eliminar finding de verificación
 */
export const removeFindingFromVerification = async (verificationId, findingId) => {
  const response = await apiClient.delete(`/audit-verifications/${verificationId}/findings/${findingId}`);
  return response.data;
};

// ============================================
// CONSTANTES
// ============================================

/**
 * Estados de verificación de finding
 */
export const VERIFICATION_STATUS = {
  PENDIENTE: 'PENDIENTE',
  VERIFICADO: 'VERIFICADO',
  NO_VERIFICADO: 'NO_VERIFICADO',
  PARCIAL: 'PARCIAL',
};

/**
 * Resultado de verificación
 */
export const VERIFICATION_RESULT = {
  EN_PROCESO: 'EN_PROCESO',
  COMPLETADO: 'COMPLETADO',
  PENDIENTE: 'PENDIENTE',
};

/**
 * Colores por estado de verificación
 */
export const VERIFICATION_STATUS_COLORS = {
  PENDIENTE: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  VERIFICADO: { bg: 'bg-success-500/10', text: 'text-success-400', border: 'border-success-500/20' },
  NO_VERIFICADO: { bg: 'bg-danger-500/10', text: 'text-danger-400', border: 'border-danger-500/20' },
  PARCIAL: { bg: 'bg-warning-500/10', text: 'text-warning-400', border: 'border-warning-500/20' },
};

/**
 * Labels en español
 */
export const VERIFICATION_STATUS_LABELS = {
  PENDIENTE: 'Pendiente',
  VERIFICADO: 'Verificado',
  NO_VERIFICADO: 'No Verificado',
  PARCIAL: 'Parcial',
};

export const VERIFICATION_RESULT_LABELS = {
  EN_PROCESO: 'En Proceso',
  COMPLETADO: 'Completado',
  PENDIENTE: 'Pendiente',
};

export default {
  // Consultas
  getAuditVerifications,
  getAuditVerificationById,
  getAuditVerificationsByAuditId,
  getAuditVerificationStats,
  getVerificationStatuses,
  // Mutaciones
  createAuditVerification,
  updateAuditVerification,
  finalizeAuditVerification,
  deleteAuditVerification,
  // Findings
  addFindingToVerification,
  updateVerificationFinding,
  removeFindingFromVerification,
  // Constantes
  VERIFICATION_STATUS,
  VERIFICATION_RESULT,
  VERIFICATION_STATUS_COLORS,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_RESULT_LABELS,
};