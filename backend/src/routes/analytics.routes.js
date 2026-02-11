const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const analyticsPermissionController = require('../controllers/analytics-permission.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');
const { 
    loadAnalyticsPermissions, 
    verifyCompanyAccess,
    verifyEndpointAccess,
    filterResponseSections,
    attachCompanyFilter,
    logAnalyticsAccess
} = require('../middlewares/analytics-permission.middleware');

/**
 * =============================================
 * MIDDLEWARE COMÚN PARA RUTAS DE ANALYTICS
 * =============================================
 */
const analyticsAuth = [
    verifyToken,
    acl.hasPermission('analytics:read'),
    loadAnalyticsPermissions
];

/**
 * =============================================
 * RUTAS DE DASHBOARDS (con permisos)
 * =============================================
 */

/**
 * @route   GET /api/analytics/dashboard/global
 * @desc    Obtener dashboard global con estadísticas de todo el sistema
 * @access  Private - Requiere permiso 'analytics:read'
 * @query   {number} [year] - Año para filtrar (default: año actual)
 * @query   {string} [startDate] - Fecha inicio ISO
 * @query   {string} [endDate] - Fecha fin ISO
 */
router.get(
    '/dashboard/global',
    ...analyticsAuth,
    verifyEndpointAccess('globalDashboard'),
    attachCompanyFilter('globalDashboard'),
    filterResponseSections,
    logAnalyticsAccess('globalDashboard'),
    analyticsController.getGlobalDashboard
);

/**
 * @route   GET /api/analytics/dashboard/company/:companyId
 * @desc    Obtener dashboard de una compañía específica
 * @access  Private - Requiere permiso 'analytics:read'
 * @param   {string} companyId - ID de la compañía
 * @query   {number} [year] - Año para filtrar (default: año actual)
 * @query   {string} [startDate] - Fecha inicio ISO
 * @query   {string} [endDate] - Fecha fin ISO
 */
router.get(
    '/dashboard/company/:companyId',
    ...analyticsAuth,
    verifyEndpointAccess('companyDashboard'),
    verifyCompanyAccess('companyDashboard'),
    filterResponseSections,
    logAnalyticsAccess('companyDashboard'),
    analyticsController.getCompanyDashboard
);

/**
 * @route   GET /api/analytics/dashboard/audit/:auditId
 * @desc    Obtener dashboard de una auditoría específica
 * @access  Private - Requiere permiso 'analytics:read'
 * @param   {string} auditId - ID de la auditoría
 */
router.get(
    '/dashboard/audit/:auditId',
    ...analyticsAuth,
    verifyEndpointAccess('auditDashboard'),
    logAnalyticsAccess('auditDashboard'),
    analyticsController.getAuditDashboard
);

/**
 * @route   GET /api/analytics/entidades-criticas
 * @desc    Obtener ranking de entidades con vulnerabilidades críticas activas
 * @access  Private - Requiere permiso 'analytics:read'
 * @query   {number} [year] - Año para filtrar (default: año actual)
 * @query   {string} [startDate] - Fecha inicio ISO
 * @query   {string} [endDate] - Fecha fin ISO
 * @query   {number} [limit] - Número máximo de entidades (default: 10)
 */
router.get(
    '/entidades-criticas',
    ...analyticsAuth,
    verifyEndpointAccess('entidadesCriticas'),
    attachCompanyFilter('entidadesCriticas'),
    logAnalyticsAccess('entidadesCriticas'),
    analyticsController.getTopEntidadesCriticas
);

/**
 * @route   GET /api/analytics/vulnerabilidades/entidad/:companyId
 * @desc    Obtener vulnerabilidades detalladas de una entidad
 * @access  Private - Requiere permiso 'analytics:read'
 * @param   {string} companyId - ID de la compañía
 * @query   {number} [year] - Año para filtrar (default: año actual)
 * @query   {string} [startDate] - Fecha inicio ISO
 * @query   {string} [endDate] - Fecha fin ISO
 * @query   {boolean} [soloActivas] - Solo vulnerabilidades no remediadas
 * @query   {string} [severidad] - Filtrar por severidad (critica, alta, media, baja, info)
 */
router.get(
    '/vulnerabilidades/entidad/:companyId',
    ...analyticsAuth,
    verifyEndpointAccess('vulnerabilidadesEntidad'),
    verifyCompanyAccess('vulnerabilidadesEntidad'),
    logAnalyticsAccess('vulnerabilidadesEntidad'),
    analyticsController.getVulnerabilidadesEntidad
);

/**
 * @route   GET /api/analytics/company-stats
 * @desc    Obtener estadísticas generales de Companies (Entidades)
 * @access  Private - Requiere permiso 'analytics:read'
 * @query   {number} [gestion] - Año de gestión para documentación (default: año actual)
 */
router.get(
    '/company-stats',
    ...analyticsAuth,
    attachCompanyFilter('globalDashboard'),
    logAnalyticsAccess('companyStats'),
    analyticsController.getCompanyStatistics
);

/**
 * @route   GET /api/analytics/companies-with-stats
 * @desc    Obtener listado de Companies con estadísticas de auditorías
 * @access  Private - Requiere permiso 'analytics:read'
 * @query   {number} [year] - Año para filtrar auditorías (default: año actual)
 * @query   {string} [startDate] - Fecha inicio ISO
 * @query   {string} [endDate] - Fecha fin ISO
 */
router.get(
    '/companies-with-stats',
    ...analyticsAuth,
    attachCompanyFilter('globalDashboard'),
    logAnalyticsAccess('companiesWithStats'),
    analyticsController.getCompaniesWithStats
);

/**
 * =============================================
 * RUTAS DE ADMINISTRACIÓN DE PERMISOS
 * Solo accesibles por administradores
 * =============================================
 */

const adminAuth = [
    verifyToken,
    acl.hasPermission('users:update')
];

/**
 * @route   GET /api/analytics/permissions
 * @desc    Obtener todos los permisos configurados
 * @access  Admin only
 */
router.get(
    '/permissions',
    ...adminAuth,
    analyticsPermissionController.getAll
);

/**
 * @route   GET /api/analytics/permissions/analysts
 * @desc    Obtener usuarios con rol analyst y su estado de permisos
 * @access  Admin only
 */
router.get(
    '/permissions/analysts',
    ...adminAuth,
    analyticsPermissionController.getAnalystUsers
);

/**
 * @route   GET /api/analytics/permissions/companies
 * @desc    Obtener compañías disponibles para asignar
 * @access  Admin only
 * @query   {boolean} [onlyCuadroDeMando] - Solo compañías con cuadroDeMando=true
 * @query   {boolean} [onlyActive] - Solo compañías activas (default: true)
 */
router.get(
    '/permissions/companies',
    ...adminAuth,
    analyticsPermissionController.getAvailableCompanies
);

/**
 * @route   GET /api/analytics/permissions/user/:userId
 * @desc    Obtener permisos de un usuario específico
 * @access  Admin only
 * @param   {string} userId - ID del usuario
 */
router.get(
    '/permissions/user/:userId',
    ...adminAuth,
    analyticsPermissionController.getByUserId
);

/**
 * @route   PUT /api/analytics/permissions/user/:userId
 * @desc    Crear o actualizar permisos de un usuario
 * @access  Admin only
 * @param   {string} userId - ID del usuario
 */
router.put(
    '/permissions/user/:userId',
    ...adminAuth,
    analyticsPermissionController.upsert
);

/**
 * @route   PATCH /api/analytics/permissions/user/:userId
 * @desc    Actualizar parcialmente permisos de un usuario
 * @access  Admin only
 * @param   {string} userId - ID del usuario
 */
router.patch(
    '/permissions/user/:userId',
    ...adminAuth,
    analyticsPermissionController.partialUpdate
);

/**
 * @route   DELETE /api/analytics/permissions/user/:userId
 * @desc    Eliminar permisos personalizados (reset a default)
 * @access  Admin only
 * @param   {string} userId - ID del usuario
 */
router.delete(
    '/permissions/user/:userId',
    ...adminAuth,
    analyticsPermissionController.delete
);

/**
 * @route   POST /api/analytics/permissions/toggle/:userId
 * @desc    Toggle rápido de permisos personalizados
 * @access  Admin only
 * @param   {string} userId - ID del usuario
 * @body    {boolean} enabled - Activar/desactivar permisos personalizados
 */
router.post(
    '/permissions/toggle/:userId',
    ...adminAuth,
    analyticsPermissionController.toggleCustomPermissions
);

/**
 * @route   POST /api/analytics/permissions/toggle-cuadro-mando/:userId
 * @desc    Toggle rápido de filtro cuadroDeMando
 * @access  Admin only
 * @param   {string} userId - ID del usuario
 * @body    {boolean} enabled - Activar/desactivar filtro cuadroDeMando
 */
router.post(
    '/permissions/toggle-cuadro-mando/:userId',
    ...adminAuth,
    analyticsPermissionController.toggleCuadroDeMando
);

/**
 * @route   GET /api/analytics/permissions/summary/:userId
 * @desc    Obtener resumen de permisos de un usuario
 * @access  Admin only
 * @param   {string} userId - ID del usuario
 */
router.get(
    '/permissions/summary/:userId',
    ...adminAuth,
    analyticsPermissionController.getSummary
);

/**
 * @route   GET /api/analytics/permissions/preview/:userId
 * @desc    Preview de qué vería un usuario con sus permisos actuales
 * @access  Admin only
 * @param   {string} userId - ID del usuario
 * @query   {string} [endpoint] - Nombre del endpoint a previsualizar
 */
router.get(
    '/permissions/preview/:userId',
    ...adminAuth,
    analyticsPermissionController.previewForUser
);

/**
 * @route   POST /api/analytics/permissions/initialize
 * @desc    Inicializar permisos para todos los usuarios analyst
 * @access  Admin only
 */
router.post(
    '/permissions/initialize',
    ...adminAuth,
    analyticsPermissionController.initializeAll
);

/**
 * @route   POST /api/analytics/permissions/cleanup
 * @desc    Limpiar permisos huérfanos (usuarios eliminados)
 * @access  Admin only
 */
router.post(
    '/permissions/cleanup',
    ...adminAuth,
    analyticsPermissionController.cleanup
);

// =============================================
// AGREGAR estas rutas DESPUÉS de la ruta /vulnerabilidades/entidad/:companyId
// y ANTES de la sección "RUTAS DE ADMINISTRACIÓN DE PERMISOS"
// =============================================

/**
 * @route   GET /api/analytics/company-stats
 * @desc    Obtener estadísticas generales de Companies (Entidades)
 * @access  Private - Requiere permiso 'analytics:read'
 * @query   {number} [gestion] - Año de gestión para documentación (default: año actual)
 */
router.get(
    '/company-stats',
    ...analyticsAuth,
    attachCompanyFilter('globalDashboard'),
    logAnalyticsAccess('companyStats'),
    analyticsController.getCompanyStatistics
);

/**
 * @route   GET /api/analytics/companies-with-stats
 * @desc    Obtener listado de Companies con estadísticas de auditorías
 * @access  Private - Requiere permiso 'analytics:read'
 * @query   {number} [year] - Año para filtrar auditorías (default: año actual)
 * @query   {string} [startDate] - Fecha inicio ISO
 * @query   {string} [endDate] - Fecha fin ISO
 */
router.get(
    '/companies-with-stats',
    ...analyticsAuth,
    attachCompanyFilter('globalDashboard'),
    logAnalyticsAccess('companiesWithStats'),
    analyticsController.getCompaniesWithStats
);


module.exports = router;