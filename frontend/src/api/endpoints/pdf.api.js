import api from '../axios.config';

/**
 * API de Generación de PDF
 * 
 * Endpoints para generación y gestión de PDFs.
 * Base path: /api/pdf
 */
export const pdfApi = {
  /**
   * Generar y descargar PDF
   * POST /pdf/generate/:reportInstanceId
   */
  generate: async (reportInstanceId, options = {}) => {
    const response = await api.post(
      `/pdf/generate/${reportInstanceId}`,
      options,
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Generar y guardar PDF en servidor
   * POST /pdf/generate/:reportInstanceId/save
   */
  generateAndSave: async (reportInstanceId, options = {}) => {
    const response = await api.post(`/pdf/generate/${reportInstanceId}/save`, options);
    return response.data;
  },

  /**
   * Obtener preview como imagen
   * GET /pdf/preview/:reportInstanceId
   */
  getPreviewUrl: (reportInstanceId, page = 0) => {
    const token = localStorage.getItem('token');
    return `${api.defaults.baseURL}/pdf/preview/${reportInstanceId}?page=${page}&token=${token}`;
  },

  /**
   * Obtener preview como blob
   * GET /pdf/preview/:reportInstanceId
   */
  getPreview: async (reportInstanceId, page = 0) => {
    const response = await api.get(
      `/pdf/preview/${reportInstanceId}?page=${page}`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Obtener HTML preview (para debug)
   * GET /pdf/preview-html/:reportInstanceId
   */
  getHtmlPreview: async (reportInstanceId) => {
    const response = await api.get(`/pdf/preview-html/${reportInstanceId}`);
    return response.data;
  },

  /**
   * Descargar último PDF guardado
   * GET /pdf/download/:reportInstanceId
   */
  download: async (reportInstanceId) => {
    const response = await api.get(
      `/pdf/download/${reportInstanceId}`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Obtener estado de exportación
   * GET /pdf/status/:reportInstanceId
   */
  getStatus: async (reportInstanceId) => {
    const response = await api.get(`/pdf/status/${reportInstanceId}`);
    return response.data;
  },

  /**
   * Eliminar PDF guardado
   * DELETE /pdf/:reportInstanceId
   */
  delete: async (reportInstanceId) => {
    const response = await api.delete(`/pdf/${reportInstanceId}`);
    return response.data;
  },
};

/**
 * Helper para descargar el blob como archivo
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default pdfApi;
