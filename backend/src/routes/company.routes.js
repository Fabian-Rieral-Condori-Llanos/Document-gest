const express = require('express');
const router = express.Router();

const CompanyController = require('../controllers/company.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Company Routes
 * 
 * Rutas relacionadas con la gestión de compañías.
 * Base path: /api/companies
 */

// Obtener todas las compañías
router.get('/',
    verifyToken,
    acl.hasPermission('companies:read'),
    asyncHandler(CompanyController.getAll)
);

// Obtener una compañía por ID
router.get('/:id',
    verifyToken,
    acl.hasPermission('companies:read'),
    asyncHandler(CompanyController.getById)
);

// Crear nueva compañía
router.post('/',
    verifyToken,
    acl.hasPermission('companies:create'),
    asyncHandler(CompanyController.create)
);

// Actualizar compañía
router.put('/:id',
    verifyToken,
    acl.hasPermission('companies:update'),
    asyncHandler(CompanyController.update)
);

// Eliminar compañía
router.delete('/:id',
    verifyToken,
    acl.hasPermission('companies:delete'),
    asyncHandler(CompanyController.delete)
);

module.exports = router;