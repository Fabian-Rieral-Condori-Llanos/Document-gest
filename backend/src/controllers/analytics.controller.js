const analyticsService = require('../services/analytics.service');
const Response = require('../utils/httpResponse');

/**
 * AnalyticsController
 * 
 * Controlador para endpoints de analytics/estadísticas.
 * Integra el sistema de permisos pasando userId a los servicios.
 */
class AnalyticsController {
    /**
     * GET /api/analytics/dashboard/global
     * Dashboard global de todo el sistema
     */
    async getGlobalDashboard(req, res) {
        try {
            const userId = req.decodedToken?.id;
            const filters = {
                year: req.query.year ? parseInt(req.query.year) : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };
            
            console.log('[Analytics] Dashboard global - User:', userId, 'Filtros:', filters);
            
            // Pasar userId para aplicar permisos
            const data = await analyticsService.getGlobalDashboard(filters, userId);
            
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
            const userId = req.decodedToken?.id;
            const { companyId } = req.params;
            const filters = {
                year: req.query.year ? parseInt(req.query.year) : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };
            
            // Pasar userId para aplicar permisos
            const data = await analyticsService.getCompanyDashboard(companyId, filters, userId);
            
            return Response.Ok(res, data);
        } catch (err) {
            console.error('[Analytics] Error en dashboard de compañía:', err);
            
            if (err.message === 'Company not found') {
                return Response.NotFound(res, 'Company not found');
            }
            
            if (err.message === 'Access denied to this company') {
                return Response.Forbidden(res, 'Access denied to this company');
            }
            
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/analytics/dashboard/audit/:auditId
     * Dashboard específico de una auditoría
     */
    async getAuditDashboard(req, res) {
        try {
            const userId = req.decodedToken?.id;
            const { auditId } = req.params;
            
            console.log(`[Analytics] Dashboard auditoría: ${auditId} - User: ${userId}`);
            
            // Pasar userId para aplicar permisos
            const data = await analyticsService.getAuditDashboard(auditId, userId);
            
            return Response.Ok(res, data);
        } catch (err) {
            console.error('[Analytics] Error en dashboard de auditoría:', err);
            
            if (err.message === 'Audit not found') {
                return Response.NotFound(res, 'Audit not found');
            }
            
            if (err.message === 'Access denied to this audit') {
                return Response.Forbidden(res, 'Access denied to this audit');
            }
            
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/entidades-criticas
     * Top entidades con vulnerabilidades críticas activas
     */
    async getTopEntidadesCriticas(req, res) {
        try {
            const userId = req.decodedToken?.id;
            const filters = {
                year: req.query.year ? parseInt(req.query.year) : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                limit: req.query.limit ? parseInt(req.query.limit) : 10
            };
            
            console.log('[Analytics] Top entidades críticas - User:', userId, 'Filtros:', filters);
            
            // Pasar userId para aplicar permisos
            const data = await analyticsService.getTopEntidadesCriticas(filters, userId);
            
            return Response.Ok(res, data);
        } catch (err) {
            console.error('[Analytics] Error en top entidades críticas:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/vulnerabilidades/entidad/:companyId
     * Vulnerabilidades detalladas de una entidad
     */
    async getVulnerabilidadesEntidad(req, res) {
        try {
            const userId = req.decodedToken?.id;
            const { companyId } = req.params;
            const filters = {
                year: req.query.year ? parseInt(req.query.year) : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                soloActivas: req.query.soloActivas === 'true',
                severidad: req.query.severidad
            };
            
            console.log(`[Analytics] Vulnerabilidades entidad ${companyId} - User: ${userId} - Filtros:`, filters);
            
            // Pasar userId para aplicar permisos
            const data = await analyticsService.getVulnerabilidadesEntidad(companyId, filters, userId);
            
            return Response.Ok(res, data);
        } catch (err) {
            console.error('[Analytics] Error en vulnerabilidades de entidad:', err);
            
            if (err.message === 'Company not found') {
                return Response.NotFound(res, 'Company not found');
            }
            
            if (err.message === 'Access denied to this company') {
                return Response.Forbidden(res, 'Access denied to this company');
            }
            
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/company-stats
     * Estadísticas generales de Companies (Entidades)
     */
    async getCompanyStatistics(req, res) {
        try {
            const userId = req.decodedToken?.id;
            const filters = {
                gestion: req.query.gestion ? parseInt(req.query.gestion) : new Date().getFullYear()
            };
            
            console.log('[Analytics] Company Statistics - User:', userId, 'Filtros:', filters);
            
            const data = await analyticsService.getCompanyStatistics(filters, userId);
            
            return Response.Ok(res, data);
        } catch (err) {
            console.error('[Analytics] Error en estadísticas de companies:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/companies-with-stats
     * Listado de Companies con estadísticas de auditorías
     */
    async getCompaniesWithStats(req, res) {
        try {
            const userId = req.decodedToken?.id;
            const filters = {
                year: req.query.year ? parseInt(req.query.year) : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };
            
            console.log('[Analytics] Companies with Stats - User:', userId, 'Filtros:', filters);
            
            const data = await analyticsService.getCompaniesWithStats(filters, userId);
            
            return Response.Ok(res, data);
        } catch (err) {
            console.error('[Analytics] Error en companies with stats:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/analytics/company-stats
     * Estadísticas generales de Companies (Entidades)
     */
        async getCompanyStatistics(req, res) {
        try {
            const userId = req.decodedToken?.id;
            const filters = {
                gestion: req.query.gestion ? parseInt(req.query.gestion) : new Date().getFullYear()
            };
            
            const data = await analyticsService.getCompanyStatistics(filters, userId);
            
            return Response.Ok(res, data);
        } catch (err) {
            console.error('[Analytics] Error en estadísticas de companies:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/analytics/companies-with-stats
     * Listado de Companies con estadísticas de auditorías
     */
    async getCompaniesWithStats(req, res) {
        try {
            const userId = req.decodedToken?.id;
            const filters = {
                year: req.query.year ? parseInt(req.query.year) : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };
            
            const data = await analyticsService.getCompaniesWithStats(filters, userId);
            
            return Response.Ok(res, data);
        } catch (err) {
            console.error('[Analytics] Error en companies with stats:', err);
            return Response.Internal(res, err);
        }
    }
}

module.exports = new AnalyticsController();