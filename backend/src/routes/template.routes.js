const express = require('express');
const router = express.Router();
const multer = require('multer');

const TemplateController = require('../controllers/template.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Template Routes
 * 
 * Rutas relacionadas con plantillas de reportes.
 * Base path: /api/templates
 */

// Configurar multer para subida de archivos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB máximo
    }
});

// Obtener todas las plantillas
router.get('/',
    verifyToken,
    acl.hasPermission('templates:read'),
    asyncHandler(TemplateController.getAll)
);

// Obtener plantilla por ID
router.get('/:id',
    verifyToken,
    acl.hasPermission('templates:read'),
    asyncHandler(TemplateController.getById)
);

// Descargar archivo de plantilla
router.get('/:id/download',
    verifyToken,
    acl.hasPermission('templates:read'),
    asyncHandler(TemplateController.download)
);

// Crear plantilla
router.post('/',
    verifyToken,
    acl.hasPermission('templates:create'),
    upload.single('file'),
    asyncHandler(TemplateController.create)
);

// Actualizar plantilla
router.put('/:id',
    verifyToken,
    acl.hasPermission('templates:update'),
    upload.single('file'),
    asyncHandler(TemplateController.update)
);

// Eliminar plantilla
router.delete('/:id',
    verifyToken,
    acl.hasPermission('templates:delete'),
    asyncHandler(TemplateController.delete)
);

module.exports = router;