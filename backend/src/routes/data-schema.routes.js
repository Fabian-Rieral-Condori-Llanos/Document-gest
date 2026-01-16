const express = require('express');
const router = express.Router();
const { acl } = require('../middlewares/acl.middleware');
const DataSchemaController = require('../controllers/data-schema.controller');

/**
 * Data Schema Routes
 * 
 * Rutas para exponer los esquemas de datos disponibles
 * para el constructor visual de plantillas.
 * 
 * Todos los usuarios autenticados pueden leer los esquemas.
 */

// ============================================
// RUTAS ESPECÍFICAS (antes de parámetros)
// ============================================

/**
 * GET /api/data-schemas/all
 * Obtiene todos los esquemas con sus campos completos
 */
router.get(
    '/all',
    acl.hasPermission('report-templates:read'),
    DataSchemaController.getAllSchemas
);

/**
 * GET /api/data-schemas/sample-data
 * Obtiene datos de ejemplo para preview
 */
router.get(
    '/sample-data',
    acl.hasPermission('report-templates:read'),
    DataSchemaController.getSampleData
);

/**
 * POST /api/data-schemas/generate-variable
 * Genera sintaxis de variable
 */
router.post(
    '/generate-variable',
    acl.hasPermission('report-templates:read'),
    DataSchemaController.generateVariable
);

/**
 * POST /api/data-schemas/generate-loop
 * Genera sintaxis de loop
 */
router.post(
    '/generate-loop',
    acl.hasPermission('report-templates:read'),
    DataSchemaController.generateLoop
);

/**
 * POST /api/data-schemas/generate-conditional
 * Genera sintaxis de condicional
 */
router.post(
    '/generate-conditional',
    acl.hasPermission('report-templates:read'),
    DataSchemaController.generateConditional
);

/**
 * POST /api/data-schemas/validate
 * Valida una variable
 */
router.post(
    '/validate',
    acl.hasPermission('report-templates:read'),
    DataSchemaController.validateVariable
);

// ============================================
// RUTAS BASE
// ============================================

/**
 * GET /api/data-schemas
 * Obtiene la lista de esquemas (resumen)
 */
router.get(
    '/',
    acl.hasPermission('report-templates:read'),
    DataSchemaController.getSchemaList
);

// ============================================
// RUTAS CON PARÁMETRO (al final)
// ============================================

/**
 * GET /api/data-schemas/:schemaKey
 * Obtiene un esquema específico
 */
router.get(
    '/:schemaKey',
    acl.hasPermission('report-templates:read'),
    DataSchemaController.getSchema
);

module.exports = router;
