const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user.controller');
const { verifyToken, verifyRefreshToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * User Routes
 * 
 * Rutas relacionadas con autenticación y gestión de usuarios.
 * Base path: /api/users
 */

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

// Verificar si existe algún usuario (setup inicial)
router.get('/init',
    asyncHandler(UserController.checkInit)
);

// Crear primer usuario (admin)
router.post('/init',
    asyncHandler(UserController.createFirstUser)
);

// Login
router.post('/login',
    asyncHandler(UserController.login)
);

// ============================================
// REFRESH TOKEN
// ============================================

// Refrescar token
router.get('/refreshtoken',
    verifyRefreshToken,
    asyncHandler(UserController.refreshToken)
);

// Logout (eliminar sesión)
router.delete('/refreshtoken',
    verifyRefreshToken,
    asyncHandler(UserController.logout)
);

// ============================================
// RUTAS AUTENTICADAS
// ============================================

// Verificar token actual
router.get('/checktoken',
    verifyToken,
    asyncHandler(UserController.checkToken)
);

// ============================================
// PERFIL (usuario actual)
// ============================================

// Obtener perfil
router.get('/me',
    verifyToken,
    asyncHandler(UserController.getMe)
);

// Actualizar perfil
router.put('/me',
    verifyToken,
    asyncHandler(UserController.updateMe)
);

// ============================================
// TOTP
// ============================================

// Obtener QR code para configurar TOTP
router.get('/totp',
    verifyToken,
    asyncHandler(UserController.getTotpQrcode)
);

// Configurar TOTP
router.post('/totp',
    verifyToken,
    asyncHandler(UserController.setupTotp)
);

// Cancelar TOTP
router.delete('/totp',
    verifyToken,
    asyncHandler(UserController.cancelTotp)
);

// ============================================
// REVIEWERS & ROLES
// ============================================

// Obtener usuarios que pueden ser revisores
router.get('/reviewers',
    verifyToken,
    acl.hasPermission('users:read'),
    asyncHandler(UserController.getReviewers)
);

// Obtener roles disponibles
router.get('/roles',
    verifyToken,
    acl.hasPermission('roles:read'),
    asyncHandler(UserController.getRoles)
);

// ============================================
// CRUD USUARIOS (admin)
// ============================================

// Obtener todos los usuarios
router.get('/',
    verifyToken,
    acl.hasPermission('users:read'),
    asyncHandler(UserController.getAll)
);

// Obtener usuario por username
router.get('/:username',
    verifyToken,
    acl.hasPermission('users:read'),
    asyncHandler(UserController.getByUsername)
);

// Crear usuario
router.post('/',
    verifyToken,
    acl.hasPermission('users:create'),
    asyncHandler(UserController.create)
);

// Actualizar usuario
router.put('/:id',
    verifyToken,
    acl.hasPermission('users:update'),
    asyncHandler(UserController.update)
);

// Toggle enabled/disabled
router.patch('/:id/toggle-enabled',
    verifyToken,
    acl.hasPermission('users:update'),
    asyncHandler(UserController.toggleEnabled)
);

module.exports = router;