const express = require('express');
const router = express.Router();

const ImageController = require('../controllers/image.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Image Routes
 * 
 * Rutas relacionadas con imágenes.
 * Base path: /api/images
 */

// Obtener imagen por ID
router.get('/:id',
    verifyToken,
    acl.hasPermission('images:read'),
    asyncHandler(ImageController.getById)
);

// Crear imagen
router.post('/',
    verifyToken,
    acl.hasPermission('images:create'),
    asyncHandler(ImageController.create)
);

// Eliminar imagen
router.delete('/:id',
    verifyToken,
    acl.hasPermission('images:delete'),
    asyncHandler(ImageController.delete)
);

module.exports = router;