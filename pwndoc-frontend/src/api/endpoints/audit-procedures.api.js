import api from '../axios.config';
const apiClient = api;
/**
 * Audit Procedures API
 * Endpoints para documentación de procedimientos de auditoría
 */

// ============================================
// CONSULTAS
// ============================================

/**
 * Obtener todos los procedimientos
 */
export const getAuditProcedures = async (params = {}) => {
  const response = await apiClient.get('/audit-procedures', { params });
  return response.data;
};

/**
 * Obtener procedimiento por ID
 */
export const getAuditProcedureById = async (id) => {
  const response = await apiClient.get(`/audit-procedures/${id}`);
  return response.data;
};

/**
 * Obtener procedimiento por Audit ID
 */
export const getAuditProcedureByAuditId = async (auditId) => {
  const response = await apiClient.get(`/audit-procedures/audit/${auditId}`);
  return response.data;
};

/**
 * Obtener estadísticas de procedimientos
 */
export const getAuditProcedureStats = async () => {
  const response = await apiClient.get('/audit-procedures/stats');
  return response.data;
};

/**
 * Obtener tipos de alcance disponibles
 */
export const getAlcanceTipos = async () => {
  const response = await apiClient.get('/audit-procedures/alcance-tipos');
  return response.data;
};

/**
 * Buscar procedimientos por origen
 */
export const searchAuditProcedures = async (query) => {
  const response = await apiClient.get('/audit-procedures/search', { params: { q: query } });
  return response.data;
};

// ============================================
// MUTACIONES
// ============================================

/**
 * Crear procedimiento
 */
export const createAuditProcedure = async (procedureData) => {
  const response = await apiClient.post('/audit-procedures', procedureData);
  return response.data;
};

/**
 * Actualizar procedimiento
 */
export const updateAuditProcedure = async (id, procedureData) => {
  const response = await apiClient.put(`/audit-procedures/${id}`, procedureData);
  return response.data;
};

/**
 * Actualizar procedimiento por Audit ID (crea si no existe)
 */
export const updateAuditProcedureByAuditId = async (auditId, procedureData) => {
  const response = await apiClient.put(`/audit-procedures/audit/${auditId}`, procedureData);
  return response.data;
};

/**
 * Eliminar procedimiento
 */
export const deleteAuditProcedure = async (id) => {
  const response = await apiClient.delete(`/audit-procedures/${id}`);
  return response.data;
};

// ============================================
// SECCIONES ESPECÍFICAS
// ============================================

/**
 * Actualizar solicitud
 */
export const updateProcedureSolicitud = async (id, data) => {
  const response = await apiClient.put(`/audit-procedures/${id}/solicitud`, data);
  return response.data;
};

/**
 * Actualizar instructivo
 */
export const updateProcedureInstructivo = async (id, data) => {
  const response = await apiClient.put(`/audit-procedures/${id}/instructivo`, data);
  return response.data;
};

/**
 * Actualizar informe
 */
export const updateProcedureInforme = async (id, data) => {
  const response = await apiClient.put(`/audit-procedures/${id}/informe`, data);
  return response.data;
};

/**
 * Actualizar respuesta
 */
export const updateProcedureRespuesta = async (id, data) => {
  const response = await apiClient.put(`/audit-procedures/${id}/respuesta`, data);
  return response.data;
};

/**
 * Actualizar notas
 */
export const updateProcedureNotas = async (id, data) => {
  const response = await apiClient.put(`/audit-procedures/${id}/notas`, data);
  return response.data;
};

/**
 * Actualizar sección retest
 */
export const updateProcedureRetest = async (id, data) => {
  const response = await apiClient.put(`/audit-procedures/${id}/retest`, data);
  return response.data;
};

// ============================================
// CONSTANTES
// ============================================

/**
 * Tipos de alcance
 */
export const ALCANCE_TIPOS = {
  INTERNO: 'INTERNO',
  EXTERNO: 'EXTERNO',
  SISTEMA_ESPECIFICO: 'SISTEMA_ESPECIFICO',
  MIXTO_INTERNO_EXTERNO: 'MIXTO_INTERNO_EXTERNO',
  MIXTO_INTERNO_ESPECIFICO: 'MIXTO_INTERNO_ESPECIFICO',
  MIXTO_EXTERNO_ESPECIFICO: 'MIXTO_EXTERNO_ESPECIFICO',
  MIXTO_COMPLETO: 'MIXTO_COMPLETO',
};

/**
 * Labels de tipos de alcance
 */
export const ALCANCE_LABELS = {
  INTERNO: 'Interno',
  EXTERNO: 'Externo',
  SISTEMA_ESPECIFICO: 'Sistema Específico',
  MIXTO_INTERNO_EXTERNO: 'Mixto (Interno + Externo)',
  MIXTO_INTERNO_ESPECIFICO: 'Mixto (Interno + Sistema)',
  MIXTO_EXTERNO_ESPECIFICO: 'Mixto (Externo + Sistema)',
  MIXTO_COMPLETO: 'Mixto Completo',
};

/**
 * Colores por tipo de alcance
 */
export const ALCANCE_COLORS = {
  INTERNO: { bg: 'bg-info-500/10', text: 'text-info-400', border: 'border-info-500/20' },
  EXTERNO: { bg: 'bg-warning-500/10', text: 'text-warning-400', border: 'border-warning-500/20' },
  SISTEMA_ESPECIFICO: { bg: 'bg-accent-500/10', text: 'text-accent-400', border: 'border-accent-500/20' },
  MIXTO_INTERNO_EXTERNO: { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20' },
  MIXTO_INTERNO_ESPECIFICO: { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20' },
  MIXTO_EXTERNO_ESPECIFICO: { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20' },
  MIXTO_COMPLETO: { bg: 'bg-danger-500/10', text: 'text-danger-400', border: 'border-danger-500/20' },
};

/**
 * Secciones de documentación
 */
export const DOCUMENT_SECTIONS = {
  SOLICITUD: 'solicitud',
  INSTRUCTIVO: 'instructivo',
  INFORME: 'informe',
  RESPUESTA: 'respuesta',
};

export default {
  // Consultas
  getAuditProcedures,
  getAuditProcedureById,
  getAuditProcedureByAuditId,
  getAuditProcedureStats,
  getAlcanceTipos,
  searchAuditProcedures,
  // Mutaciones
  createAuditProcedure,
  updateAuditProcedure,
  updateAuditProcedureByAuditId,
  deleteAuditProcedure,
  // Secciones
  updateProcedureSolicitud,
  updateProcedureInstructivo,
  updateProcedureInforme,
  updateProcedureRespuesta,
  updateProcedureNotas,
  updateProcedureRetest,
  // Constantes
  ALCANCE_TIPOS,
  ALCANCE_LABELS,
  ALCANCE_COLORS,
  DOCUMENT_SECTIONS,
};