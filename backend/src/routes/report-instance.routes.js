const express = require('express');
const router = express.Router();
const { acl } = require('../middlewares/acl.middleware');
const ReportInstanceController = require('../controllers/report-instance.controller');

/**
 * Report Instance Routes
 * 
 * Rutas para gestión de instancias de reportes.
 * Una instancia es una copia de una plantilla asociada a una auditoría.
 */

// ============================================
// RUTAS ESPECÍFICAS (antes de :id)
// ============================================

/**
 * GET /api/report-instances/audit/:auditId
 * Obtiene la instancia de reporte de una auditoría
 */
router.get(
    '/audit/:auditId',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.getByAuditId
);

// ============================================
// RUTAS BASE
// ============================================

/**
 * POST /api/report-instances
 * Crea una nueva instancia de reporte
 */
router.post(
    '/',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.create
);

// ============================================
// RUTAS CON :id
// ============================================

/**
 * GET /api/report-instances/:id
 * Obtiene una instancia por ID
 */
router.get(
    '/:id',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.getById
);

/**
 * DELETE /api/report-instances/:id
 * Elimina la instancia de reporte
 */
router.delete(
    '/:id',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.delete
);

/**
 * POST /api/report-instances/:id/refresh
 * Refresca los datos inyectados desde la auditoría
 */
router.post(
    '/:id/refresh',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.refreshData
);

/**
 * PATCH /api/report-instances/:id/content
 * Actualiza el contenido del reporte
 */
router.patch(
    '/:id/content',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.updateContent
);

/**
 * POST /api/report-instances/:id/version
 * Guarda una versión del reporte
 */
router.post(
    '/:id/version',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.saveVersion
);

/**
 * GET /api/report-instances/:id/versions
 * Obtiene el historial de versiones
 */
router.get(
    '/:id/versions',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.getVersionHistory
);

/**
 * POST /api/report-instances/:id/restore/:versionNumber
 * Restaura una versión anterior
 */
router.post(
    '/:id/restore/:versionNumber',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.restoreVersion
);

/**
 * PATCH /api/report-instances/:id/status
 * Actualiza el estado del reporte
 */
router.patch(
    '/:id/status',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.updateStatus
);

/**
 * POST /api/report-instances/:id/lock
 * Bloquea el reporte para edición exclusiva
 */
router.post(
    '/:id/lock',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.lock
);

/**
 * POST /api/report-instances/:id/unlock
 * Desbloquea el reporte
 */
router.post(
    '/:id/unlock',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.unlock
);

/**
 * GET /api/report-instances/:id/collaborators
 * Obtiene colaboradores activos
 */
router.get(
    '/:id/collaborators',
    acl.hasPermission('report-templates:read'),
    ReportInstanceController.getCollaborators
);

module.exports = router;
