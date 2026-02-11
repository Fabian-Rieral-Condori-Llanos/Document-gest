import api from '../axios.config';

/**
 * API de Esquemas de Datos
 * 
 * Endpoints para exploración de esquemas disponibles para plantillas.
 * Base path: /api/data-schemas
 */
export const dataSchemasApi = {
  /**
   * Obtener lista de esquemas (resumen para sidebar)
   * GET /data-schemas
   */
  getList: async () => {
    const response = await api.get('/data-schemas');
    return response.data;
  },

  /**
   * Obtener todos los esquemas completos
   * GET /data-schemas/all
   */
  getAll: async () => {
    const response = await api.get('/data-schemas/all');
    return response.data;
  },

  /**
   * Obtener un esquema específico
   * GET /data-schemas/:schemaKey
   */
  getByKey: async (schemaKey) => {
    const response = await api.get(`/data-schemas/${schemaKey}`);
    return response.data;
  },

  /**
   * Obtener datos de ejemplo para preview
   * GET /data-schemas/sample-data
   */
  getSampleData: async () => {
    const response = await api.get('/data-schemas/sample-data');
    return response.data;
  },

  /**
   * Generar sintaxis de variable
   * POST /data-schemas/generate-variable
   */
  generateVariable: async ({ schemaKey, fieldPath, format, isLoop, loopVar }) => {
    const response = await api.post('/data-schemas/generate-variable', {
      schemaKey,
      fieldPath,
      format,
      isLoop,
      loopVar
    });
    return response.data;
  },

  /**
   * Generar sintaxis de loop
   * POST /data-schemas/generate-loop
   */
  generateLoop: async ({ schemaKey, itemVar }) => {
    const response = await api.post('/data-schemas/generate-loop', {
      schemaKey,
      itemVar
    });
    return response.data;
  },

  /**
   * Generar sintaxis de condicional
   * POST /data-schemas/generate-conditional
   */
  generateConditional: async ({ variable, operator, value }) => {
    const response = await api.post('/data-schemas/generate-conditional', {
      variable,
      operator,
      value
    });
    return response.data;
  },

  /**
   * Validar una variable
   * POST /data-schemas/validate
   */
  validateVariable: async (variablePath) => {
    const response = await api.post('/data-schemas/validate', { variablePath });
    return response.data;
  },
};

export default dataSchemasApi;
