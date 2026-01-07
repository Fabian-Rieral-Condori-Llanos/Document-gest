const express = require('express');
const router = express.Router();

const AuditStatusController = require('../controllers/audit-status.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * AuditStatus Routes
 * 
 * Rutas para gestión de estados de auditoría.
 * Base path: /api/audit-status
 */

// Obtener estadísticas
router.get('/stats',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditStatusController.getStats)
);

// Obtener tipos de estado
router.get('/types',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditStatusController.getTypes)
);

// Obtener estado por auditId
router.get('/audit/:auditId',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditStatusController.getByAuditId)
);

// Obtener historial por auditId
router.get('/audit/:auditId/history',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditStatusController.getHistory)
);

// Actualizar estado por auditId
router.put('/audit/:auditId',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditStatusController.updateStatusByAuditId)
);

// Obtener todos los estados
router.get('/',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditStatusController.getAll)
);

// Obtener estado por ID
router.get('/:id',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditStatusController.getById)
);

// Crear estado
router.post('/',
    verifyToken,
    acl.hasPermission('audits:create'),
    asyncHandler(AuditStatusController.create)
);

// Actualizar estado
router.put('/:id',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditStatusController.updateStatus)
);

// Eliminar estado
router.delete('/:id',
    verifyToken,
    acl.hasPermission('audits:delete'),
    asyncHandler(AuditStatusController.delete)
);

module.exports = router;