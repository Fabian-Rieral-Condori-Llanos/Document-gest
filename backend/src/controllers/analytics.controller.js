const analyticsService = require('../services/analytics.service');
const Response = require('../utils/httpResponse');

/**
 * AnalyticsController
 * 
 * Controlador para endpoints de analytics/estadísticas
 */
class AnalyticsController {
    /**
     * GET /api/analytics/dashboard/global
     * Dashboard global de todo el sistema
     */
    async getGlobalDashboard(req, res) {
        try {
            const filters = {
                year: req.query.year ? parseInt(req.query.year) : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };
            
            console.log('[Analytics] Dashboard global - Filtros:', filters);
            
            const data = await analyticsService.getGlobalDashboard(filters);
            
            return Response.Ok(res, data);
        } catch (err) {
            console.error('[Analytics] Error en dashboard global:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/dashboard/company/:companyId
     * Dashboard específico de una compañía
     */
    async getCompanyDashboard(req, res) {
        try {
            const { companyId } = req.params;
            const filters = {
                year: req.query.year ? parseInt(req.query.year) : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };
            
            console.log(`[Analytics] Dashboard compañía ${companyId} - Filtros:`, filters);
            
            const data = await analyticsService.getCompanyDashboard(companyId, filters);
            
            return Response.Ok(res, data);
        } catch (err) {
            console.error('[Analytics] Error en dashboard de compañía:', err);
            
            if (err.message === 'Company not found') {
                return Response.NotFound(res, 'Company not found');
            }
            
            return Response.Internal(res, err);
        }
    }
}

module.exports = new AnalyticsController();