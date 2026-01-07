const express = require('express');
const router = express.Router();

const DataController = require('../controllers/data.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Data Routes
 * 
 * Rutas para datos auxiliares (idiomas, tipos, categorías, etc).
 * Base path: /api/data
 */

// ============================================
// LANGUAGES
// ============================================

router.get('/languages',
    verifyToken,
    acl.hasPermission('languages:read'),
    asyncHandler(DataController.getLanguages)
);

router.post('/languages',
    verifyToken,
    acl.hasPermission('languages:create'),
    asyncHandler(DataController.createLanguage)
);

router.put('/languages',
    verifyToken,
    acl.hasPermission('languages:update'),
    asyncHandler(DataController.updateLanguages)
);

router.delete('/languages/:locale',
    verifyToken,
    acl.hasPermission('languages:delete'),
    asyncHandler(DataController.deleteLanguage)
);

// ============================================
// AUDIT TYPES
// ============================================

router.get('/audit-types',
    verifyToken,
    acl.hasPermission('audit-types:read'),
    asyncHandler(DataController.getAuditTypes)
);

router.post('/audit-types',
    verifyToken,
    acl.hasPermission('audit-types:create'),
    asyncHandler(DataController.createAuditType)
);

router.put('/audit-types/:id',
    verifyToken,
    acl.hasPermission('audit-types:update'),
    asyncHandler(DataController.updateAuditType)
);

router.delete('/audit-types/:id',
    verifyToken,
    acl.hasPermission('audit-types:delete'),
    asyncHandler(DataController.deleteAuditType)
);

// ============================================
// VULNERABILITY TYPES
// ============================================

router.get('/vulnerability-types',
    verifyToken,
    acl.hasPermission('vulnerability-types:read'),
    asyncHandler(DataController.getVulnerabilityTypes)
);

router.put('/vulnerability-types',
    verifyToken,
    acl.hasPermission('vulnerability-types:update'),
    asyncHandler(DataController.updateVulnerabilityTypes)
);

// ============================================
// VULNERABILITY CATEGORIES
// ============================================

router.get('/vulnerability-categories',
    verifyToken,
    acl.hasPermission('vulnerability-categories:read'),
    asyncHandler(DataController.getVulnerabilityCategories)
);

router.put('/vulnerability-categories',
    verifyToken,
    acl.hasPermission('vulnerability-categories:update'),
    asyncHandler(DataController.updateVulnerabilityCategories)
);

// ============================================
// CUSTOM FIELDS
// ============================================

router.get('/custom-fields',
    verifyToken,
    acl.hasPermission('custom-fields:read'),
    asyncHandler(DataController.getCustomFields)
);

router.post('/custom-fields',
    verifyToken,
    acl.hasPermission('custom-fields:create'),
    asyncHandler(DataController.createCustomField)
);

router.put('/custom-fields/:id',
    verifyToken,
    acl.hasPermission('custom-fields:update'),
    asyncHandler(DataController.updateCustomField)
);

router.delete('/custom-fields/:id',
    verifyToken,
    acl.hasPermission('custom-fields:delete'),
    asyncHandler(DataController.deleteCustomField)
);

// ============================================
// CUSTOM SECTIONS
// ============================================

router.get('/sections',
    verifyToken,
    acl.hasPermission('sections:read'),
    asyncHandler(DataController.getCustomSections)
);

router.post('/sections',
    verifyToken,
    acl.hasPermission('sections:create'),
    asyncHandler(DataController.createCustomSection)
);

router.put('/sections/:id',
    verifyToken,
    acl.hasPermission('sections:update'),
    asyncHandler(DataController.updateCustomSection)
);

router.delete('/sections/:id',
    verifyToken,
    acl.hasPermission('sections:delete'),
    asyncHandler(DataController.deleteCustomSection)
);

module.exports = router;