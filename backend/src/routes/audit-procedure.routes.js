const express = require('express');
const router = express.Router();

const AuditProcedureController = require('../controllers/audit-procedure.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * AuditProcedure Routes
 * 
 * Rutas para gestión de procedimientos de auditoría.
 * Base path: /api/audit-procedures
 */

// Obtener estadísticas
router.get('/stats',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditProcedureController.getStats)
);

// Obtener tipos de alcance
router.get('/alcance-tipos',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditProcedureController.getAlcanceTipos)
);

// Buscar por origen
router.get('/search',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditProcedureController.search)
);

// Obtener procedimiento por auditId
router.get('/audit/:auditId',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditProcedureController.getByAuditId)
);

// Actualizar por auditId (crea si no existe)
router.put('/audit/:auditId',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditProcedureController.updateByAuditId)
);

// Obtener todos los procedimientos
router.get('/',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditProcedureController.getAll)
);

// Obtener procedimiento por ID
router.get('/:id',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditProcedureController.getById)
);

// Crear procedimiento
router.post('/',
    verifyToken,
    acl.hasPermission('audits:create'),
    asyncHandler(AuditProcedureController.create)
);

// Actualizar procedimiento
router.put('/:id',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditProcedureController.update)
);

// === SECCIONES ESPECÍFICAS ===

// Actualizar solicitud
router.put('/:id/solicitud',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditProcedureController.updateSolicitud)
);

// Actualizar instructivo
router.put('/:id/instructivo',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditProcedureController.updateInstructivo)
);

// Actualizar informe
router.put('/:id/informe',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditProcedureController.updateInforme)
);

// Actualizar respuesta
router.put('/:id/respuesta',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditProcedureController.updateRespuesta)
);

// Actualizar notas
router.put('/:id/notas',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditProcedureController.updateNotas)
);

// Actualizar retest
router.put('/:id/retest',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditProcedureController.updateRetest)
);

// Eliminar procedimiento
router.delete('/:id',
    verifyToken,
    acl.hasPermission('audits:delete'),
    asyncHandler(AuditProcedureController.delete)
);

module.exports = router;