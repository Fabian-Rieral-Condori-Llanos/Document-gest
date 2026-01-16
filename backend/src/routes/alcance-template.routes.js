const express = require('express');
const router = express.Router();
const { acl } = require('../middlewares/acl.middleware');
const alcanceTemplateController = require('../controllers/alcance-template.controller');

/**
 * Alcance Template Routes
 * 
 * Rutas para gestión de plantillas de alcance.
 * 
 * IMPORTANTE: Las rutas específicas deben ir ANTES de /:id
 * 
 * Permisos:
 * - GET /active: Cualquier usuario autenticado (para selectores)
 * - GET /: Admin ve todas, usuarios ven solo activas
 * - GET /:id, GET /name/:name: Cualquier usuario autenticado
 * - POST, PUT, PATCH, DELETE: Solo admin
 */

// ============================================
// RUTAS ESPECÍFICAS (deben ir ANTES de /:id)
// ============================================

/**
 * GET /api/alcance-templates/active
 * Obtiene solo plantillas activas (para selectores en formularios)
 */
router.get(
    '/active',
    acl.hasPermission('alcance-templates:read'),
    alcanceTemplateController.getActive
);

/**
 * GET /api/alcance-templates/stats
 * Obtiene estadísticas de uso (solo admin)
 */
router.get(
    '/stats',
    acl.hasPermission('alcance-templates:admin'),
    alcanceTemplateController.getStats
);

/**
 * POST /api/alcance-templates/initialize
 * Inicializa plantillas por defecto (solo admin)
 */
router.post(
    '/initialize',
    acl.hasPermission('alcance-templates:admin'),
    alcanceTemplateController.initialize
);

/**
 * GET /api/alcance-templates/name/:name
 * Obtiene una plantilla por nombre
 */
router.get(
    '/name/:name',
    acl.hasPermission('alcance-templates:read'),
    alcanceTemplateController.getByName
);

// ============================================
// RUTAS BASE
// ============================================

/**
 * GET /api/alcance-templates
 * Obtiene todas las plantillas
 * - Admin: ve todas (activas e inactivas)
 * - Usuario: ve solo activas
 */
router.get(
    '/',
    acl.hasPermission('alcance-templates:read'),
    alcanceTemplateController.getAll
);

/**
 * POST /api/alcance-templates
 * Crea una nueva plantilla (solo admin)
 */
router.post(
    '/',
    acl.hasPermission('alcance-templates:admin'),
    alcanceTemplateController.create
);

// ============================================
// RUTAS CON PARÁMETRO :id (deben ir AL FINAL)
// ============================================

/**
 * GET /api/alcance-templates/:id
 * Obtiene una plantilla por ID
 */
router.get(
    '/:id',
    acl.hasPermission('alcance-templates:read'),
    alcanceTemplateController.getById
);

/**
 * PUT /api/alcance-templates/:id
 * Actualiza una plantilla (solo admin)
 */
router.put(
    '/:id',
    acl.hasPermission('alcance-templates:admin'),
    alcanceTemplateController.update
);

/**
 * PATCH /api/alcance-templates/:id/toggle
 * Activa/desactiva una plantilla (solo admin)
 */
router.patch(
    '/:id/toggle',
    acl.hasPermission('alcance-templates:admin'),
    alcanceTemplateController.toggleActive
);

/**
 * DELETE /api/alcance-templates/:id
 * Elimina una plantilla (solo admin)
 */
router.delete(
    '/:id',
    acl.hasPermission('alcance-templates:admin'),
    alcanceTemplateController.delete
);

module.exports = router;