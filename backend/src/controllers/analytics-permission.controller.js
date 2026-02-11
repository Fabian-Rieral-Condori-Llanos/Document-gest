const AnalyticsPermissionService = require('../services/analytics-permission.service');
const Company = require('../models/company.model');
const Response = require('../utils/httpResponse');

/**
 * AnalyticsPermissionController
 * 
 * Controller para administrar permisos de analytics.
 * Solo accesible por administradores.
 */
class AnalyticsPermissionController {
    
    /**
     * GET /api/analytics/permissions
     * Obtener todos los permisos configurados
     */
    async getAll(req, res) {
        try {
            const permissions = await AnalyticsPermissionService.getAll();
            
            return Response.Ok(res, {
                total: permissions.length,
                permissions
            });
        } catch (err) {
            console.error('[AnalyticsPermission] Error getting all:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/permissions/analysts
     * Obtener usuarios con rol analyst y su estado de permisos
     */
    async getAnalystUsers(req, res) {
        try {
            const analysts = await AnalyticsPermissionService.getAnalystUsers();
            
            return Response.Ok(res, {
                total: analysts.length,
                analysts
            });
        } catch (err) {
            console.error('[AnalyticsPermission] Error getting analysts:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/permissions/user/:userId
     * Obtener permisos de un usuario específico
     */
    async getByUserId(req, res) {
        try {
            const { userId } = req.params;
            
            const permissions = await AnalyticsPermissionService.getByUserId(userId);
            
            return Response.Ok(res, permissions);
        } catch (err) {
            console.error('[AnalyticsPermission] Error getting by userId:', err);
            
            if (err.fn === 'NotFound') {
                return Response.NotFound(res, err.message);
            }
            
            return Response.Internal(res, err);
        }
    }
    
    /**
     * PUT /api/analytics/permissions/user/:userId
     * Crear o actualizar permisos de un usuario
     * 
     * Body esperado:
     * {
     *   customPermissionsEnabled: Boolean,
     *   globalOnlyCuadroDeMando: Boolean,
     *   globalAllowedCompanies: [ObjectId],
     *   globalExcludedCompanies: [ObjectId],
     *   endpoints: {
     *     globalDashboard: { enabled: Boolean, onlyCuadroDeMando: Boolean, ... },
     *     companyDashboard: { ... },
     *     ...
     *   },
     *   visibleSections: {
     *     stats: Boolean,
     *     evaluacionesPorProcedimiento: Boolean,
     *     ...
     *   },
     *   notes: String
     * }
     */
    async upsert(req, res) {
        try {
            const { userId } = req.params;
            const permissionData = req.body;
            const updatedBy = req.decodedToken.id;
            
            // Validar datos
            const validation = AnalyticsPermissionService.validatePermissionData(permissionData);
            if (!validation.valid) {
                return Response.BadParameters(res, {
                    message: 'Invalid permission data',
                    errors: validation.errors
                });
            }
            
            const permissions = await AnalyticsPermissionService.upsert(
                userId,
                permissionData,
                updatedBy
            );
            
            console.log(`[AnalyticsPermission] Updated permissions for user ${userId} by ${updatedBy}`);
            
            return Response.Ok(res, permissions);
        } catch (err) {
            console.error('[AnalyticsPermission] Error upserting:', err);
            
            if (err.fn === 'NotFound') {
                return Response.NotFound(res, err.message);
            }
            
            return Response.Internal(res, err);
        }
    }
    
    /**
     * PATCH /api/analytics/permissions/user/:userId
     * Actualizar parcialmente permisos de un usuario
     */
    async partialUpdate(req, res) {
        try {
            const { userId } = req.params;
            const updates = req.body;
            const updatedBy = req.decodedToken.id;
            
            const permissions = await AnalyticsPermissionService.partialUpdate(
                userId,
                updates,
                updatedBy
            );
            
            return Response.Ok(res, permissions);
        } catch (err) {
            console.error('[AnalyticsPermission] Error partial update:', err);
            
            if (err.fn === 'NotFound') {
                return Response.NotFound(res, err.message);
            }
            
            return Response.Internal(res, err);
        }
    }
    
    /**
     * DELETE /api/analytics/permissions/user/:userId
     * Eliminar permisos personalizados (reset a default)
     */
    async delete(req, res) {
        try {
            const { userId } = req.params;
            
            const result = await AnalyticsPermissionService.delete(userId);
            
            console.log(`[AnalyticsPermission] Reset permissions for user ${userId}`);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[AnalyticsPermission] Error deleting:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/permissions/companies
     * Obtener compañías disponibles para asignar
     */
    async getAvailableCompanies(req, res) {
        try {
            const { onlyCuadroDeMando, onlyActive } = req.query;
            
            const companies = await AnalyticsPermissionService.getAvailableCompanies({
                onlyCuadroDeMando: onlyCuadroDeMando === 'true',
                onlyActive: onlyActive !== 'false'
            });
            
            // Agrupar por nivel para facilitar la UI
            const grouped = {
                cuadroDeMando: companies.filter(c => c.cuadroDeMando),
                sinCuadroDeMando: companies.filter(c => !c.cuadroDeMando),
                all: companies
            };
            
            return Response.Ok(res, {
                total: companies.length,
                totalCuadroDeMando: grouped.cuadroDeMando.length,
                companies: grouped
            });
        } catch (err) {
            console.error('[AnalyticsPermission] Error getting companies:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/analytics/permissions/toggle/:userId
     * Toggle rápido de permisos personalizados
     */
    async toggleCustomPermissions(req, res) {
        try {
            const { userId } = req.params;
            const { enabled } = req.body;
            const updatedBy = req.decodedToken.id;
            
            const permissions = await AnalyticsPermissionService.partialUpdate(
                userId,
                { customPermissionsEnabled: enabled },
                updatedBy
            );
            
            return Response.Ok(res, {
                message: enabled ? 'Custom permissions enabled' : 'Custom permissions disabled',
                customPermissionsEnabled: permissions.customPermissionsEnabled
            });
        } catch (err) {
            console.error('[AnalyticsPermission] Error toggling:', err);
            
            if (err.fn === 'NotFound') {
                return Response.NotFound(res, err.message);
            }
            
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/analytics/permissions/toggle-cuadro-mando/:userId
     * Toggle rápido de filtro cuadroDeMando
     */
    async toggleCuadroDeMando(req, res) {
        try {
            const { userId } = req.params;
            const { enabled } = req.body;
            const updatedBy = req.decodedToken.id;
            
            const permissions = await AnalyticsPermissionService.partialUpdate(
                userId,
                { 
                    customPermissionsEnabled: true,
                    globalOnlyCuadroDeMando: enabled 
                },
                updatedBy
            );
            
            return Response.Ok(res, {
                message: enabled 
                    ? 'Only cuadroDeMando companies enabled' 
                    : 'All companies enabled',
                globalOnlyCuadroDeMando: permissions.globalOnlyCuadroDeMando
            });
        } catch (err) {
            console.error('[AnalyticsPermission] Error toggling cuadroDeMando:', err);
            
            if (err.fn === 'NotFound') {
                return Response.NotFound(res, err.message);
            }
            
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/permissions/summary/:userId
     * Obtener resumen de permisos de un usuario
     */
    async getSummary(req, res) {
        try {
            const { userId } = req.params;
            
            const summary = await AnalyticsPermissionService.getSummary(userId);
            
            return Response.Ok(res, summary);
        } catch (err) {
            console.error('[AnalyticsPermission] Error getting summary:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/analytics/permissions/initialize
     * Inicializar permisos para todos los usuarios analyst
     * Solo para setup inicial o migración
     */
    async initializeAll(req, res) {
        try {
            const result = await AnalyticsPermissionService.initializeAnalystPermissions();
            
            console.log('[AnalyticsPermission] Initialized all analyst permissions:', result);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[AnalyticsPermission] Error initializing:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/analytics/permissions/cleanup
     * Limpiar permisos huérfanos
     */
    async cleanup(req, res) {
        try {
            const result = await AnalyticsPermissionService.cleanupOrphanPermissions();
            
            console.log('[AnalyticsPermission] Cleanup result:', result);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[AnalyticsPermission] Error cleaning up:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/permissions/preview/:userId
     * Preview de qué vería un usuario con sus permisos actuales
     */
    async previewForUser(req, res) {
        try {
            const { userId } = req.params;
            const { endpoint = 'globalDashboard' } = req.query;
            
            // Obtener permisos
            const permissions = await AnalyticsPermissionService.getByUserId(userId);
            
            // Obtener compañías que vería
            const allowedCompanyIds = await AnalyticsPermissionService.getAllowedCompanyIds(
                userId,
                endpoint
            );
            
            let companies = [];
            if (allowedCompanyIds === null) {
                // Sin restricción, mostrar todas las activas
                companies = await Company.find({ status: true })
                    .select('_id name shortName cuadroDeMando nivel')
                    .limit(20);
            } else {
                companies = await Company.find({ _id: { $in: allowedCompanyIds } })
                    .select('_id name shortName cuadroDeMando nivel');
            }
            
            // Obtener secciones visibles
            const visibleSections = permissions.getVisibleSections();
            
            return Response.Ok(res, {
                userId,
                endpoint,
                customPermissionsEnabled: permissions.customPermissionsEnabled,
                globalOnlyCuadroDeMando: permissions.globalOnlyCuadroDeMando,
                preview: {
                    companiesCount: allowedCompanyIds === null ? 'unlimited' : allowedCompanyIds.length,
                    companiesSample: companies,
                    visibleSections,
                    hiddenSections: Object.entries(visibleSections)
                        .filter(([_, visible]) => !visible)
                        .map(([section]) => section)
                }
            });
        } catch (err) {
            console.error('[AnalyticsPermission] Error generating preview:', err);
            return Response.Internal(res, err);
        }
    }
}

module.exports = new AnalyticsPermissionController();
