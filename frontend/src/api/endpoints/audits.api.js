import api from '../axios.config';
const apiClient = api;
/**
 * Audits API
 * Endpoints para gestión de auditorías
 */

// ============================================
// CRUD BÁSICO
// ============================================

/**
 * Obtener todas las auditorías
 */
export const getAudits = async (params = {}) => {
  const response = await apiClient.get('/audits', { params });
  return response.data;
};

/**
 * Obtener auditoría por ID
 */
export const getAuditById = async (id) => {
  const response = await apiClient.get(`/audits/${id}`);
  return response.data;
};

/**
 * Crear auditoría
 */
export const createAudit = async (auditData) => {
  const response = await apiClient.post('/audits', auditData);
  return response.data;
};

/**
 * Eliminar auditoría
 */
export const deleteAudit = async (id) => {
  const response = await apiClient.delete(`/audits/${id}`);
  return response.data;
};

// ============================================
// GENERAL
// ============================================

/**
 * Obtener información general de auditoría
 */
export const getAuditGeneral = async (id) => {
  const response = await apiClient.get(`/audits/${id}/general`);
  return response.data;
};

/**
 * Actualizar información general de auditoría
 */
export const updateAuditGeneral = async (id, data) => {
  const response = await apiClient.put(`/audits/${id}/general`, data);
  return response.data;
};

// ============================================
// NETWORK
// ============================================

/**
 * Obtener información de red
 */
export const getAuditNetwork = async (id) => {
  const response = await apiClient.get(`/audits/${id}/network`);
  return response.data;
};

/**
 * Actualizar información de red
 */
export const updateAuditNetwork = async (id, data) => {
  const response = await apiClient.put(`/audits/${id}/network`, data);
  return response.data;
};

// ============================================
// FINDINGS
// ============================================

/**
 * Obtener todos los findings de una auditoría
 */
export const getAuditFindings = async (id) => {
  const response = await apiClient.get(`/audits/${id}/findings`);
  return response.data;
};

/**
 * Obtener finding específico
 */
export const getAuditFinding = async (auditId, findingId) => {
  const response = await apiClient.get(`/audits/${auditId}/findings/${findingId}`);
  return response.data;
};

/**
 * Crear finding en auditoría
 */
export const createAuditFinding = async (auditId, findingData) => {
  const response = await apiClient.post(`/audits/${auditId}/findings`, findingData);
  return response.data;
};

/**
 * Actualizar finding
 */
export const updateAuditFinding = async (auditId, findingId, findingData) => {
  const response = await apiClient.put(`/audits/${auditId}/findings/${findingId}`, findingData);
  return response.data;
};

/**
 * Eliminar finding
 */
export const deleteAuditFinding = async (auditId, findingId) => {
  const response = await apiClient.delete(`/audits/${auditId}/findings/${findingId}`);
  return response.data;
};

/**
 * Mover finding (reordenar)
 */
export const moveAuditFinding = async (auditId, findingId, data) => {
  const response = await apiClient.put(`/audits/${auditId}/findings/${findingId}/move`, data);
  return response.data;
};

/**
 * Importar múltiples vulnerabilidades como findings
 * @param {string} auditId - ID de la auditoría
 * @param {string[]} vulnerabilityIds - Array de IDs de vulnerabilidades
 * @param {string} language - Idioma para la importación (default: 'es')
 */
export const importVulnerabilities = async (auditId, vulnerabilityIds, language = 'es') => {
  const response = await apiClient.post(`/audits/${auditId}/findings/import`, {
    vulnerabilityIds,
    language
  });
  return response.data;
};

/**
 * Importar una sola vulnerabilidad como finding
 * @param {string} auditId - ID de la auditoría
 * @param {string} vulnerabilityId - ID de la vulnerabilidad
 * @param {string} language - Idioma para la importación (default: 'es')
 */
export const importSingleVulnerability = async (auditId, vulnerabilityId, language = 'es') => {
  const response = await apiClient.post(
    `/audits/${auditId}/findings/import/${vulnerabilityId}`,
    null,
    { params: { language } }
  );
  return response.data;
};

// ============================================
// SECTIONS
// ============================================

/**
 * Obtener secciones de auditoría
 */
export const getAuditSections = async (id) => {
  const response = await apiClient.get(`/audits/${id}/sections`);
  return response.data;
};

/**
 * Crear sección
 */
export const createAuditSection = async (auditId, sectionData) => {
  const response = await apiClient.post(`/audits/${auditId}/sections`, sectionData);
  return response.data;
};

/**
 * Actualizar sección
 */
export const updateAuditSection = async (auditId, sectionId, sectionData) => {
  const response = await apiClient.put(`/audits/${auditId}/sections/${sectionId}`, sectionData);
  return response.data;
};

/**
 * Eliminar sección
 */
export const deleteAuditSection = async (auditId, sectionId) => {
  const response = await apiClient.delete(`/audits/${auditId}/sections/${sectionId}`);
  return response.data;
};

// ============================================
// STATE & REVIEW
// ============================================

/**
 * Actualizar estado de auditoría
 */
export const updateAuditState = async (id, state) => {
  const response = await apiClient.put(`/audits/${id}/state`, { state });
  return response.data;
};

/**
 * Marcar como listo para revisión
 */
export const setAuditReadyForReview = async (id) => {
  const response = await apiClient.put(`/audits/${id}/ready-for-review`);
  return response.data;
};

/**
 * Agregar aprobación
 */
export const addAuditApproval = async (id) => {
  const response = await apiClient.post(`/audits/${id}/approvals`);
  return response.data;
};

/**
 * Quitar aprobación
 */
export const removeAuditApproval = async (id) => {
  const response = await apiClient.delete(`/audits/${id}/approvals`);
  return response.data;
};

// ============================================
// COMMENTS
// ============================================

/**
 * Crear comentario
 */
export const createAuditComment = async (auditId, commentData) => {
  const response = await apiClient.post(`/audits/${auditId}/comments`, commentData);
  return response.data;
};

/**
 * Actualizar comentario
 */
export const updateAuditComment = async (auditId, commentId, commentData) => {
  const response = await apiClient.put(`/audits/${auditId}/comments/${commentId}`, commentData);
  return response.data;
};

/**
 * Eliminar comentario
 */
export const deleteAuditComment = async (auditId, commentId) => {
  const response = await apiClient.delete(`/audits/${auditId}/comments/${commentId}`);
  return response.data;
};

// ============================================
// CHILDREN & RETEST
// ============================================

/**
 * Obtener auditorías hijas
 */
export const getAuditChildren = async (id) => {
  const response = await apiClient.get(`/audits/${id}/children`);
  return response.data;
};

/**
 * Obtener retest de auditoría
 */
export const getAuditRetest = async (id) => {
  const response = await apiClient.get(`/audits/${id}/retest`);
  return response.data;
};

/**
 * Crear retest
 */
export const createAuditRetest = async (id, retestData) => {
  const response = await apiClient.post(`/audits/${id}/retest`, retestData);
  return response.data;
};

/**
 * Crear verificación
 */
export const createAuditVerification = async (id, verificationData) => {
  const response = await apiClient.post(`/audits/${id}/verification`, verificationData);
  return response.data;
};

// ============================================
// SORTING
// ============================================

/**
 * Actualizar opciones de ordenamiento de findings
 */
export const updateAuditSortFindings = async (id, sortOptions) => {
  const response = await apiClient.put(`/audits/${id}/sortfindings`, sortOptions);
  return response.data;
};

export default {
  // CRUD
  getAudits,
  getAuditById,
  createAudit,
  deleteAudit,
  // General
  getAuditGeneral,
  updateAuditGeneral,
  // Network
  getAuditNetwork,
  updateAuditNetwork,
  // Findings
  getAuditFindings,
  getAuditFinding,
  createAuditFinding,
  updateAuditFinding,
  deleteAuditFinding,
  moveAuditFinding,
  // Sections
  getAuditSections,
  createAuditSection,
  updateAuditSection,
  deleteAuditSection,
  // State & Review
  updateAuditState,
  setAuditReadyForReview,
  addAuditApproval,
  removeAuditApproval,
  // Comments
  createAuditComment,
  updateAuditComment,
  deleteAuditComment,
  // Children & Retest
  getAuditChildren,
  getAuditRetest,
  createAuditRetest,
  createAuditVerification,
  // Sorting
  updateAuditSortFindings,
};