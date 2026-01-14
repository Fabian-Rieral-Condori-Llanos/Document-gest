import api from '../axios.config';

/**
 * API de Datos del Sistema
 * 
 * Endpoints para datos auxiliares: idiomas, tipos de auditoría,
 * tipos de vulnerabilidad, categorías, campos personalizados, secciones.
 * Base path: /api/data
 */
export const dataApi = {
  // ============================================
  // LANGUAGES (Idiomas)
  // ============================================

  /**
   * Obtener todos los idiomas
   * GET /data/languages
   */
  getLanguages: async () => {
    const response = await api.get('/data/languages');
    return response.data;
  },

  /**
   * Crear un idioma
   * POST /data/languages
   */
  createLanguage: async (languageData) => {
    const response = await api.post('/data/languages', languageData);
    return response.data;
  },

  /**
   * Actualizar idiomas (bulk)
   * PUT /data/languages
   */
  updateLanguages: async (languages) => {
    const response = await api.put('/data/languages', languages);
    return response.data;
  },

  /**
   * Eliminar un idioma
   * DELETE /data/languages/:locale
   */
  deleteLanguage: async (locale) => {
    const response = await api.delete(`/data/languages/${locale}`);
    return response.data;
  },

  // ============================================
  // AUDIT TYPES (Tipos de Auditoría)
  // ============================================

  /**
   * Obtener todos los tipos de auditoría
   * GET /data/audit-types
   */
  getAuditTypes: async () => {
    const response = await api.get('/data/audit-types');
    return response.data;
  },

  /**
   * Crear un tipo de auditoría
   * POST /data/audit-types
   */
  createAuditType: async (auditTypeData) => {
    const response = await api.post('/data/audit-types', auditTypeData);
    return response.data;
  },

  /**
   * Actualizar un tipo de auditoría
   * PUT /data/audit-types/:id
   */
  updateAuditType: async (id, auditTypeData) => {
    const response = await api.put(`/data/audit-types/${id}`, auditTypeData);
    return response.data;
  },

  /**
   * Actualizar tipos de auditoría (bulk)
   * PUT /data/audit-types
   */
  updateAuditTypes: async (auditTypes) => {
    const response = await api.put('/data/audit-types', auditTypes);
    return response.data;
  },

  /**
   * Eliminar un tipo de auditoría
   * DELETE /data/audit-types/:id
   */
  deleteAuditType: async (id) => {
    const response = await api.delete(`/data/audit-types/${id}`);
    return response.data;
  },

  // ============================================
  // VULNERABILITY TYPES (Tipos de Vulnerabilidad)
  // ============================================

  /**
   * Obtener todos los tipos de vulnerabilidad
   * GET /data/vulnerability-types
   */
  getVulnerabilityTypes: async () => {
    const response = await api.get('/data/vulnerability-types');
    return response.data;
  },

  /**
   * Crear un tipo de vulnerabilidad
   * POST /data/vulnerability-types
   */
  createVulnerabilityType: async (vulnTypeData) => {
    const response = await api.post('/data/vulnerability-types', vulnTypeData);
    return response.data;
  },

  /**
   * Actualizar tipos de vulnerabilidad (bulk)
   * PUT /data/vulnerability-types
   */
  updateVulnerabilityTypes: async (vulnTypes) => {
    const response = await api.put('/data/vulnerability-types', vulnTypes);
    return response.data;
  },

  /**
   * Eliminar un tipo de vulnerabilidad
   * DELETE /data/vulnerability-types/:name
   */
  deleteVulnerabilityType: async (name) => {
    const response = await api.delete(`/data/vulnerability-types/${encodeURIComponent(name)}`);
    return response.data;
  },

  // ============================================
  // VULNERABILITY CATEGORIES (Categorías de Vulnerabilidad)
  // ============================================

  /**
   * Obtener todas las categorías de vulnerabilidad
   * GET /data/vulnerability-categories
   */
  getVulnerabilityCategories: async () => {
    const response = await api.get('/data/vulnerability-categories');
    return response.data;
  },

  /**
   * Crear una categoría de vulnerabilidad
   * POST /data/vulnerability-categories
   */
  createVulnerabilityCategory: async (categoryData) => {
    const response = await api.post('/data/vulnerability-categories', categoryData);
    return response.data;
  },

  /**
   * Actualizar categorías de vulnerabilidad (bulk)
   * PUT /data/vulnerability-categories
   */
  updateVulnerabilityCategories: async (categories) => {
    const response = await api.put('/data/vulnerability-categories', categories);
    return response.data;
  },

  /**
   * Eliminar una categoría de vulnerabilidad
   * DELETE /data/vulnerability-categories/:id
   */
  deleteVulnerabilityCategory: async (id) => {
    const response = await api.delete(`/data/vulnerability-categories/${id}`);
    return response.data;
  },

  // ============================================
  // CUSTOM FIELDS (Campos Personalizados)
  // ============================================

  /**
   * Obtener todos los campos personalizados
   * GET /data/custom-fields
   */
  getCustomFields: async () => {
    const response = await api.get('/data/custom-fields');
    return response.data;
  },

  /**
   * Crear un campo personalizado
   * POST /data/custom-fields
   */
  createCustomField: async (fieldData) => {
    const response = await api.post('/data/custom-fields', fieldData);
    return response.data;
  },

  /**
   * Actualizar un campo personalizado
   * PUT /data/custom-fields/:id
   */
  updateCustomField: async (id, fieldData) => {
    const response = await api.put(`/data/custom-fields/${id}`, fieldData);
    return response.data;
  },

  /**
   * Actualizar campos personalizados (bulk)
   * PUT /data/custom-fields
   */
  updateCustomFields: async (fields) => {
    const response = await api.put('/data/custom-fields', fields);
    return response.data;
  },

  /**
   * Eliminar un campo personalizado
   * DELETE /data/custom-fields/:id
   */
  deleteCustomField: async (id) => {
    const response = await api.delete(`/data/custom-fields/${id}`);
    return response.data;
  },

  // ============================================
  // CUSTOM SECTIONS (Secciones Personalizadas)
  // ============================================

  /**
   * Obtener todas las secciones personalizadas
   * GET /data/sections
   */
  getCustomSections: async () => {
    const response = await api.get('/data/sections');
    return response.data;
  },

  /**
   * Crear una sección personalizada
   * POST /data/sections
   */
  createCustomSection: async (sectionData) => {
    const response = await api.post('/data/sections', sectionData);
    return response.data;
  },

  /**
   * Actualizar una sección personalizada
   * PUT /data/sections/:id
   */
  updateCustomSection: async (id, sectionData) => {
    const response = await api.put(`/data/sections/${id}`, sectionData);
    return response.data;
  },

  /**
   * Actualizar secciones personalizadas (bulk)
   * PUT /data/sections
   */
  updateCustomSections: async (sections) => {
    const response = await api.put('/data/sections', sections);
    return response.data;
  },

  /**
   * Eliminar una sección personalizada
   * DELETE /data/sections/:id
   */
  deleteCustomSection: async (id) => {
    const response = await api.delete(`/data/sections/${id}`);
    return response.data;
  },
};

export default dataApi;