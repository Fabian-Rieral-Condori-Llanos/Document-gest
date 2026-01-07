const express = require('express');
const router = express.Router();

const ClientController = require('../controllers/client.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Client Routes
 * 
 * Rutas relacionadas con clientes.
 * Base path: /api/clients
 */

// Obtener todos los clientes
router.get('/',
    verifyToken,
    acl.hasPermission('clients:read'),
    asyncHandler(ClientController.getAll)
);

// Obtener cliente por ID
router.get('/:id',
    verifyToken,
    acl.hasPermission('clients:read'),
    asyncHandler(ClientController.getById)
);

// Crear cliente
router.post('/',
    verifyToken,
    acl.hasPermission('clients:create'),
    asyncHandler(ClientController.create)
);

// Actualizar cliente
router.put('/:id',
    verifyToken,
    acl.hasPermission('clients:update'),
    asyncHandler(ClientController.update)
);

// Eliminar cliente
router.delete('/:id',
    verifyToken,
    acl.hasPermission('clients:delete'),
    asyncHandler(ClientController.delete)
);

module.exports = router;