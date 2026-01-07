const express = require('express');
const router = express.Router();
const multer = require('multer');

const BackupController = require('../controllers/backup.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Backup Routes
 * 
 * Rutas relacionadas con backup y restore.
 * Base path: /api/backups
 */

// Configurar multer para subida de archivos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB máximo
    }
});

// Obtener estado del proceso
router.get('/status',
    verifyToken,
    acl.hasPermission('backups:read'),
    asyncHandler(BackupController.getStatus)
);

// Obtener uso de disco
router.get('/disk-usage',
    verifyToken,
    acl.hasPermission('backups:read'),
    asyncHandler(BackupController.getDiskUsage)
);

// Obtener lista de backups
router.get('/',
    verifyToken,
    acl.hasPermission('backups:read'),
    asyncHandler(BackupController.getList)
);

// Obtener información de un backup
router.get('/:slug',
    verifyToken,
    acl.hasPermission('backups:read'),
    asyncHandler(BackupController.getInfo)
);

// Descargar backup
router.get('/:slug/download',
    verifyToken,
    acl.hasPermission('backups:read'),
    asyncHandler(BackupController.download)
);

// Crear backup
router.post('/',
    verifyToken,
    acl.hasPermission('backups:create'),
    asyncHandler(BackupController.create)
);

// Subir backup
router.post('/upload',
    verifyToken,
    acl.hasPermission('backups:create'),
    upload.single('file'),
    asyncHandler(BackupController.upload)
);

// Restaurar backup
router.post('/:slug/restore',
    verifyToken,
    acl.hasPermission('backups:restore'),
    asyncHandler(BackupController.restore)
);

// Eliminar backup
router.delete('/:slug',
    verifyToken,
    acl.hasPermission('backups:delete'),
    asyncHandler(BackupController.delete)
);

module.exports = router;