const express = require('express');
const router = express.Router();

const AuditVerificationController = require('../controllers/audit-verification.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * AuditVerification Routes
 * 
 * Rutas para gestión de verificaciones de auditoría.
 * Base path: /api/audit-verifications
 */

// Obtener estadísticas
router.get('/stats',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditVerificationController.getStats)
);

// Obtener tipos de estado de verificación
router.get('/statuses',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditVerificationController.getVerificationStatuses)
);

// Obtener verificaciones por auditId
router.get('/audit/:auditId',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditVerificationController.getByAuditId)
);

// Obtener todas las verificaciones
router.get('/',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditVerificationController.getAll)
);

// Obtener verificación por ID
router.get('/:id',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditVerificationController.getById)
);

// Crear verificación
router.post('/',
    verifyToken,
    acl.hasPermission('audits:create'),
    asyncHandler(AuditVerificationController.create)
);

// Actualizar verificación
router.put('/:id',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditVerificationController.update)
);

// Finalizar verificación
router.post('/:id/finalize',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditVerificationController.finalize)
);

// === FINDINGS ===

// Agregar finding a verificación
router.post('/:id/findings',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditVerificationController.addFinding)
);

// Actualizar estado de finding
router.put('/:id/findings/:findingId',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditVerificationController.updateFinding)
);

// Eliminar finding de verificación
router.delete('/:id/findings/:findingId',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditVerificationController.removeFinding)
);

// Eliminar verificación
router.delete('/:id',
    verifyToken,
    acl.hasPermission('audits:delete'),
    asyncHandler(AuditVerificationController.delete)
);

module.exports = router;