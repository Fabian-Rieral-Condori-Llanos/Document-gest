const express = require('express');
const router = express.Router();
const multer = require('multer');
const { acl } = require('../middlewares/acl.middleware');
const ReportTemplateController = require('../controllers/report-template.controller');

/**
 * Report Template Routes
 * 
 * Rutas para gestión de plantillas de reportes.
 * 
 * IMPORTANTE: Las rutas específicas van ANTES de /:id
 * 
 * Permisos:
 * - GET /active, /variables, /categories: Cualquier usuario autenticado
 * - GET /: Admin ve todas, usuarios ven solo activas
 * - POST, PUT, PATCH, DELETE: Solo admin
 */

// Configurar multer para subida de archivos DOCX
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB máximo
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only DOCX files are allowed'), false);
        }
    }
});

// ============================================
// RUTAS ESPECÍFICAS (deben ir ANTES de /:id)
// ============================================

/**
 * GET /api/report-templates/active
 * Obtiene solo plantillas activas (para selectores)
 */
router.get(
    '/active',
    acl.hasPermission('report-templates:read'),
    ReportTemplateController.getActive
);

/**
 * GET /api/report-templates/stats
 * Obtiene estadísticas (solo admin)
 */
router.get(
    '/stats',
    acl.hasPermission('report-templates:admin'),
    ReportTemplateController.getStats
);

/**
 * GET /api/report-templates/variables
 * Obtiene variables del sistema disponibles
 */
router.get(
    '/variables',
    acl.hasPermission('report-templates:read'),
    ReportTemplateController.getSystemVariables
);

/**
 * GET /api/report-templates/categories
 * Obtiene categorías disponibles
 */
router.get(
    '/categories',
    acl.hasPermission('report-templates:read'),
    ReportTemplateController.getCategories
);

/**
 * GET /api/report-templates/page-number-formats
 * Obtiene formatos de numeración de página disponibles
 */
router.get(
    '/page-number-formats',
    acl.hasPermission('report-templates:read'),
    ReportTemplateController.getPageNumberFormats
);

/**
 * GET /api/report-templates/defaults/header
 * Obtiene configuración por defecto del header
 */
router.get(
    '/defaults/header',
    acl.hasPermission('report-templates:read'),
    ReportTemplateController.getDefaultHeaderConfig
);

/**
 * GET /api/report-templates/defaults/footer
 * Obtiene configuración por defecto del footer
 */
router.get(
    '/defaults/footer',
    acl.hasPermission('report-templates:read'),
    ReportTemplateController.getDefaultFooterConfig
);

/**
 * GET /api/report-templates/defaults/page-numbering
 * Obtiene configuración por defecto de numeración
 */
router.get(
    '/defaults/page-numbering',
    acl.hasPermission('report-templates:read'),
    ReportTemplateController.getDefaultPageNumbering
);

/**
 * POST /api/report-templates/upload
 * Crea plantilla desde archivo DOCX
 */
router.post(
    '/upload',
    acl.hasPermission('report-templates:admin'),
    upload.single('file'),
    ReportTemplateController.createFromFile
);

/**
 * POST /api/report-templates/initialize
 * Inicializa plantillas por defecto
 */
router.post(
    '/initialize',
    acl.hasPermission('report-templates:admin'),
    ReportTemplateController.initialize
);

// ============================================
// RUTAS BASE
// ============================================

/**
 * GET /api/report-templates
 * Obtiene todas las plantillas
 */
router.get(
    '/',
    acl.hasPermission('report-templates:read'),
    ReportTemplateController.getAll
);

/**
 * POST /api/report-templates
 * Crea una nueva plantilla
 */
router.post(
    '/',
    acl.hasPermission('report-templates:admin'),
    ReportTemplateController.create
);

// ============================================
// RUTAS CON PARÁMETRO :id (deben ir AL FINAL)
// ============================================

/**
 * GET /api/report-templates/:id
 * Obtiene una plantilla por ID
 */
router.get(
    '/:id',
    acl.hasPermission('report-templates:read'),
    ReportTemplateController.getById
);

/**
 * PUT /api/report-templates/:id
 * Actualiza una plantilla
 */
router.put(
    '/:id',
    acl.hasPermission('report-templates:admin'),
    ReportTemplateController.update
);

/**
 * PATCH /api/report-templates/:id/content
 * Actualiza solo el contenido
 */
router.patch(
    '/:id/content',
    acl.hasPermission('report-templates:admin'),
    ReportTemplateController.updateContent
);

/**
 * PATCH /api/report-templates/:id/toggle
 * Activa/desactiva una plantilla
 */
router.patch(
    '/:id/toggle',
    acl.hasPermission('report-templates:admin'),
    ReportTemplateController.toggle
);

/**
 * POST /api/report-templates/:id/clone
 * Clona una plantilla
 */
router.post(
    '/:id/clone',
    acl.hasPermission('report-templates:admin'),
    ReportTemplateController.clone
);

/**
 * DELETE /api/report-templates/:id
 * Elimina una plantilla
 */
router.delete(
    '/:id',
    acl.hasPermission('report-templates:admin'),
    ReportTemplateController.delete
);

module.exports = router;