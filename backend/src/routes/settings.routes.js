const express = require('express');
const router = express.Router();

const SettingsController = require('../controllers/settings.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Settings Routes
 * 
 * Rutas relacionadas con la configuración de la aplicación.
 * Base path: /api/settings
 */

// Obtener configuración pública (sin autenticación completa)
router.get('/public',
    verifyToken,
    acl.hasPermission('settings:read-public'),
    asyncHandler(SettingsController.getPublic)
);

// Obtener toda la configuración (admin)
router.get('/',
    verifyToken,
    acl.hasPermission('settings:read'),
    asyncHandler(SettingsController.getAll)
);

// Actualizar configuración
router.put('/',
    verifyToken,
    acl.hasPermission('settings:update'),
    asyncHandler(SettingsController.update)
);

// Restaurar valores por defecto
router.post('/revert',
    verifyToken,
    acl.hasPermission('settings:update'),
    asyncHandler(SettingsController.restoreDefaults)
);

module.exports = router;