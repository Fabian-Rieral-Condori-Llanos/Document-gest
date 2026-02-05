const express = require('express');
const router = express.Router();
const { acl } = require('../middlewares/acl.middleware');
const procedureTemplateController = require('../controllers/procedure-template.controller');

/**
 * Procedure Template Routes
 * 
 * Rutas para gestión de plantillas de procedimientos.
 * 
 * IMPORTANTE: Las rutas específicas deben ir ANTES de /:id
 * 
 * Permisos:
 * - GET /active: Cualquier usuario autenticado (para selectores)
 * - GET /: Admin ve todas, usuarios ven solo activas
 * - GET /:id, GET /code/:code: Cualquier usuario autenticado
 * - POST, PUT, PATCH, DELETE: Solo admin
 */

// ============================================
// RUTAS ESPECÍFICAS (deben ir ANTES de /:id)
// ============================================

/**
 * GET /api/procedure-templates/active
 * Obtiene solo plantillas activas (para selectores en formularios)
 */
router.get(
    '/active',
    acl.hasPermission('procedure-templates:read'),
    procedureTemplateController.getActive
);

/**
 * GET /api/procedure-templates/stats
 * Obtiene estadísticas de uso (solo admin)
 */
router.get(
    '/stats',
    acl.hasPermission('procedure-templates:admin'),
    procedureTemplateController.getStats
);

/**
 * POST /api/procedure-templates/initialize
 * Inicializa plantillas por defecto (solo admin)
 */
router.post(
    '/initialize',
    acl.hasPermission('procedure-templates:admin'),
    procedureTemplateController.initialize
);

/**
 * POST /api/procedure-templates/sync-colors
 * Sincroniza colores de templates existentes (migración de datos legacy)
 */
router.post(
    '/sync-colors',
    acl.hasPermission('procedure-templates:admin'),
    procedureTemplateController.syncColors
);

/**
 * GET /api/procedure-templates/code/:code
 * Obtiene una plantilla por código
 */
router.get(
    '/code/:code',
    acl.hasPermission('procedure-templates:read'),
    procedureTemplateController.getByCode
);

// ============================================
// RUTAS BASE
// ============================================

/**
 * GET /api/procedure-templates
 * Obtiene todas las plantillas
 * - Admin: ve todas (activas e inactivas)
 * - Usuario: ve solo activas
 */
router.get(
    '/',
    acl.hasPermission('procedure-templates:read'),
    procedureTemplateController.getAll
);

/**
 * POST /api/procedure-templates
 * Crea una nueva plantilla (solo admin)
 */
router.post(
    '/',
    acl.hasPermission('procedure-templates:admin'),
    procedureTemplateController.create
);

// ============================================
// RUTAS CON PARÁMETRO :id (deben ir AL FINAL)
// ============================================

/**
 * GET /api/procedure-templates/:id
 * Obtiene una plantilla por ID
 */
router.get(
    '/:id',
    acl.hasPermission('procedure-templates:read'),
    procedureTemplateController.getById
);

/**
 * PUT /api/procedure-templates/:id
 * Actualiza una plantilla (solo admin)
 */
router.put(
    '/:id',
    acl.hasPermission('procedure-templates:admin'),
    procedureTemplateController.update
);

/**
 * PATCH /api/procedure-templates/:id/toggle
 * Activa/desactiva una plantilla (solo admin)
 */
router.patch(
    '/:id/toggle',
    acl.hasPermission('procedure-templates:admin'),
    procedureTemplateController.toggleActive
);

/**
 * DELETE /api/procedure-templates/:id
 * Elimina una plantilla (solo admin)
 */
router.delete(
    '/:id',
    acl.hasPermission('procedure-templates:admin'),
    procedureTemplateController.delete
);

module.exports = router;