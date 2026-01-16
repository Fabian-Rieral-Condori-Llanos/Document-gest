const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { acl } = require('../middlewares/acl.middleware');

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
    verifyToken,
    acl.hasPermission('analytics:read'),
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
    verifyToken,
    acl.hasPermission('analytics:read'),
    analyticsController.getCompanyDashboard
);

module.exports = router;