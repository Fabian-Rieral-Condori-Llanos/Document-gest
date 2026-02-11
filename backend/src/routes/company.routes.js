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

// ============================================
// RUTAS DE LISTADO Y CONSULTA
// ============================================

/**
 * Obtener todas las compañías
 * Query params: status, cuadroDeMando, nivel, categoria, prioritarias
 */
router.get('/',
    verifyToken,
    acl.hasPermission('companies:read'),
    asyncHandler(CompanyController.getAll)
);

/**
 * Obtener compañías activas ordenadas por prioridad
 */
router.get('/activas',
    verifyToken,
    acl.hasPermission('companies:read'),
    asyncHandler(CompanyController.getActivas)
);

/**
 * Obtener compañías prioritarias (cuadro de mando)
 */
router.get('/prioritarias',
    verifyToken,
    acl.hasPermission('companies:read'),
    asyncHandler(CompanyController.getPrioritarias)
);

/**
 * Obtener estadísticas de compañías
 */
router.get('/estadisticas',
    verifyToken,
    acl.hasPermission('companies:read'),
    asyncHandler(CompanyController.getEstadisticas)
);

/**
 * Obtener catálogos de niveles y categorías
 */
router.get('/catalogos',
    verifyToken,
    acl.hasPermission('companies:read'),
    asyncHandler(CompanyController.getCatalogos)
);

/**
 * Obtener una compañía por ID
 * Query params: full=true para todos los campos
 */
router.get('/:id',
    verifyToken,
    acl.hasPermission('companies:read'),
    asyncHandler(CompanyController.getById)
);

/**
 * Obtener una compañía completa por ID
 */
router.get('/:id/full',
    verifyToken,
    acl.hasPermission('companies:read'),
    asyncHandler(CompanyController.getFullById)
);

// ============================================
// RUTAS DE CREACIÓN Y ACTUALIZACIÓN
// ============================================

/**
 * Crear nueva compañía
 */
router.post('/',
    verifyToken,
    acl.hasPermission('companies:create'),
    asyncHandler(CompanyController.create)
);

/**
 * Actualizar compañía
 */
router.put('/:id',
    verifyToken,
    acl.hasPermission('companies:update'),
    asyncHandler(CompanyController.update)
);

/**
 * Actualizar estado de compañía
 */
router.patch('/:id/status',
    verifyToken,
    acl.hasPermission('companies:update'),
    asyncHandler(CompanyController.updateStatus)
);

/**
 * Actualizar cuadro de mando
 */
router.patch('/:id/cuadro-de-mando',
    verifyToken,
    acl.hasPermission('companies:update'),
    asyncHandler(CompanyController.updateCuadroDeMando)
);

// ============================================
// RUTAS DE DOCUMENTOS
// ============================================

/**
 * Agregar documento a un array específico
 * Tipos válidos: pisi, actualizacionPisi, borradorPisi, seguimientoPisi,
 *                borradorPlanContingencia, planContingencia, informeTecnico
 */
router.post('/:id/documentos/:tipo',
    verifyToken,
    acl.hasPermission('companies:update'),
    asyncHandler(CompanyController.agregarDocumento)
);

/**
 * Actualizar un documento específico
 */
router.put('/:id/documentos/:tipo/:docId',
    verifyToken,
    acl.hasPermission('companies:update'),
    asyncHandler(CompanyController.actualizarDocumento)
);

/**
 * Eliminar un documento específico
 */
router.delete('/:id/documentos/:tipo/:docId',
    verifyToken,
    acl.hasPermission('companies:update'),
    asyncHandler(CompanyController.eliminarDocumento)
);

// ============================================
// RUTAS DE ELIMINACIÓN
// ============================================

/**
 * Eliminar compañía
 */
router.delete('/:id',
    verifyToken,
    acl.hasPermission('companies:delete'),
    asyncHandler(CompanyController.delete)
);

module.exports = router;