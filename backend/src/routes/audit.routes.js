const express = require('express');
const router = express.Router();

const AuditController = require('../controllers/audit.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Audit Routes
 * 
 * Rutas relacionadas con auditorías.
 * Base path: /api/audits
 */

// ============================================
// CRUD BÁSICO
// ============================================

// Obtener todas las auditorías
router.get('/',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getAll)
);

// Crear auditoría
router.post('/',
    verifyToken,
    acl.hasPermission('audits:create'),
    asyncHandler(AuditController.create)
);

// Obtener auditoría por ID
router.get('/:id',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getById)
);

// Eliminar auditoría
router.delete('/:id',
    verifyToken,
    acl.hasPermission('audits:delete'),
    asyncHandler(AuditController.delete)
);

// ============================================
// GENERAL
// ============================================

// Obtener información general
router.get('/:id/general',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getGeneral)
);

// Actualizar información general
router.put('/:id/general',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.updateGeneral)
);

// ============================================
// NETWORK
// ============================================

// Obtener información de red
router.get('/:id/network',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getNetwork)
);

// Actualizar información de red
router.put('/:id/network',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.updateNetwork)
);

// ============================================
// FINDINGS
// ============================================

// Estadísticas de findings (DEBE ir antes de /:id/findings/:findingId)
router.get('/:id/findings/stats',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getFindingStats)
);

// Resumen de retest (DEBE ir antes de /:id/findings/:findingId)
router.get('/:id/findings/retest-summary',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getRetestSummary)
);

// Importar múltiples vulnerabilidades (DEBE ir antes de /:id/findings/:findingId)
router.post('/:id/findings/import',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.importVulnerabilities)
);

// Importar una sola vulnerabilidad
router.post('/:id/findings/import/:vulnerabilityId',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.importSingleVulnerability)
);

// Obtener todos los findings
router.get('/:id/findings',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getFindings)
);

// Crear finding
router.post('/:id/findings',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.createFinding)
);

// Obtener finding específico
router.get('/:id/findings/:findingId',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getFinding)
);

// Obtener vulnerabilidad original de un finding
router.get('/:id/findings/:findingId/vulnerability',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getOriginalVulnerability)
);

// Actualizar finding
router.put('/:id/findings/:findingId',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.updateFinding)
);

// Eliminar finding
router.delete('/:id/findings/:findingId',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.deleteFinding)
);

// Mover finding
router.put('/:id/findings/:findingId/move',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.moveFinding)
);

// ============================================
// SECTIONS
// ============================================

// Obtener todas las secciones
router.get('/:id/sections',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getSections)
);

// Crear sección
router.post('/:id/sections',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.createSection)
);

// Actualizar sección
router.put('/:id/sections/:sectionId',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.updateSection)
);

// Eliminar sección
router.delete('/:id/sections/:sectionId',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.deleteSection)
);

// ============================================
// STATE & REVIEW
// ============================================

// Actualizar estado
router.put('/:id/state',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.updateState)
);

// Marcar como listo para revisión
router.put('/:id/ready-for-review',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.updateReadyForReview)
);

// Agregar aprobación
router.post('/:id/approvals',
    verifyToken,
    acl.hasPermission('audits:review'),
    asyncHandler(AuditController.addApproval)
);

// Quitar aprobación
router.delete('/:id/approvals',
    verifyToken,
    acl.hasPermission('audits:review'),
    asyncHandler(AuditController.removeApproval)
);

// ============================================
// COMMENTS
// ============================================

// Crear comentario
router.post('/:id/comments',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.createComment)
);

// Actualizar comentario
router.put('/:id/comments/:commentId',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.updateComment)
);

// Eliminar comentario
router.delete('/:id/comments/:commentId',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.deleteComment)
);

// ============================================
// CHILDREN & RETEST
// ============================================

// Obtener auditorías hijas
router.get('/:id/children',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getChildren)
);

// Obtener retest
router.get('/:id/retest',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getRetest)
);

// Crear retest
router.post('/:id/retest',
    verifyToken,
    acl.hasPermission('audits:create'),
    asyncHandler(AuditController.createRetest)
);

// Crear verificación
router.post('/:id/verification',
    verifyToken,
    acl.hasPermission('audits:create'),
    asyncHandler(AuditController.createVerification)
);

// ============================================
// LIFECYCLE STATUS (AuditStatus)
// ============================================

// Obtener estado del ciclo de vida
router.get('/:id/lifecycle-status',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getLifecycleStatus)
);

// Actualizar estado del ciclo de vida
router.put('/:id/lifecycle-status',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.updateLifecycleStatus)
);

// ============================================
// FULL DATA
// ============================================

// Obtener auditoría completa con todos los datos relacionados
router.get('/:id/full',
    verifyToken,
    acl.hasPermission('audits:read'),
    asyncHandler(AuditController.getFullById)
);

// ============================================
// SORTING
// ============================================

// Actualizar opciones de ordenamiento
router.put('/:id/sortfindings',
    verifyToken,
    acl.hasPermission('audits:update'),
    asyncHandler(AuditController.updateSortFindings)
);

module.exports = router;