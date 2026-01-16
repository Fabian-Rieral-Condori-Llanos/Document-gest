const express = require('express');
const router = express.Router();
const { acl } = require('../middlewares/acl.middleware');
const PDFController = require('../controllers/pdf.controller');

/**
 * PDF Routes
 * 
 * Rutas para generación y gestión de PDFs.
 */

/**
 * POST /api/pdf/generate/:reportInstanceId
 * Genera un PDF y lo devuelve directamente
 * 
 * Body (opcional):
 * {
 *   format: 'A4' | 'Letter' | 'Legal',
 *   landscape: boolean,
 *   margins: { top, right, bottom, left },
 *   displayHeaderFooter: boolean,
 *   printBackground: boolean
 * }
 */
router.post(
    '/generate/:reportInstanceId',
    acl.hasPermission('report-templates:read'),
    PDFController.generate
);

/**
 * POST /api/pdf/generate/:reportInstanceId/save
 * Genera y guarda el PDF en el servidor
 */
router.post(
    '/generate/:reportInstanceId/save',
    acl.hasPermission('report-templates:read'),
    PDFController.generateAndSave
);

/**
 * GET /api/pdf/preview/:reportInstanceId
 * Genera un preview del PDF como imagen PNG
 * 
 * Query params:
 * - page: número de página (0 = todas)
 */
router.get(
    '/preview/:reportInstanceId',
    acl.hasPermission('report-templates:read'),
    PDFController.preview
);

/**
 * GET /api/pdf/preview-html/:reportInstanceId
 * Devuelve el HTML que se usaría para generar el PDF
 */
router.get(
    '/preview-html/:reportInstanceId',
    acl.hasPermission('report-templates:read'),
    PDFController.previewHtml
);

/**
 * GET /api/pdf/download/:reportInstanceId
 * Descarga el último PDF exportado
 */
router.get(
    '/download/:reportInstanceId',
    acl.hasPermission('report-templates:read'),
    PDFController.download
);

/**
 * GET /api/pdf/status/:reportInstanceId
 * Obtiene el estado de exportación del PDF
 */
router.get(
    '/status/:reportInstanceId',
    acl.hasPermission('report-templates:read'),
    PDFController.getStatus
);

/**
 * DELETE /api/pdf/:reportInstanceId
 * Elimina el PDF exportado
 */
router.delete(
    '/:reportInstanceId',
    acl.hasPermission('report-templates:read'),
    PDFController.deletePDF
);

module.exports = router;
