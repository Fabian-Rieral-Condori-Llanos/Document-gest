const Company = require('../models/company.model');
const AnalyticsPermissionService = require('./analytics-permission.service');

// Importar servicios refactorizados
const {
    baseService,
    globalStatsService,
    trendsService,
    entitiesService,
    auditDashboardService,
    vulnerabilitiesService,
    companyStatsService
} = require('./analytics');

/**
 * AnalyticsService
 * 
 * Servicio principal de analytics que orquesta los servicios refactorizados.
 * Integra el sistema de permisos para filtrar datos según la configuración del usuario.
 */
class AnalyticsService {
    
    /**
     * Obtener dashboard global
     */
    async getGlobalDashboard(filters = {}, userId = null) {
        const { year, startDate, endDate } = filters;
        const dateFilter = baseService.buildDateFilter(startDate, endDate, year);
        
        let auditMatchFilter = { createdAt: dateFilter };
        let companyFilter = { status: true };
        
        // Aplicar filtro de permisos
        if (userId) {
            const permissionInfo = await this._getPermissionInfo(userId, 'globalDashboard');
            
            if (permissionInfo.hasRestrictions) {
                if (permissionInfo.companyFilter.company) {
                    auditMatchFilter.company = permissionInfo.companyFilter.company;
                    companyFilter._id = permissionInfo.companyFilter.company;
                }
            }
        }
        
        const [
            stats,
            companyStats,
            evaluacionesPorProcedimiento,
            evaluacionesPorAlcance,
            evaluacionesPorEstado,
            evaluacionesPorTipo,
            vulnerabilidadesPorSeveridad,
            tendenciaMensual,
            entidadesEvaluadas,
            evaluacionesRecientes,
            alertasActivas,
            distribucionNivelCategoria
        ] = await Promise.all([
            globalStatsService.getGlobalStats(auditMatchFilter, {}),
            companyStatsService.getCompanyStats(companyFilter._id ? { _id: companyFilter._id } : {}),
            globalStatsService.getEvaluacionesPorProcedimiento(auditMatchFilter),
            globalStatsService.getEvaluacionesPorAlcance(auditMatchFilter),
            globalStatsService.getEvaluacionesPorEstado(auditMatchFilter),
            globalStatsService.getEvaluacionesPorTipo(auditMatchFilter),
            globalStatsService.getVulnerabilidadesPorSeveridad(auditMatchFilter),
            trendsService.getTendenciaMensual(year || new Date().getFullYear(), companyFilter._id ? { company: companyFilter._id } : {}),
            entitiesService.getEntidadesEvaluadas(auditMatchFilter),
            entitiesService.getEvaluacionesRecientes(auditMatchFilter),
            entitiesService.getAlertasActivas(auditMatchFilter),
            companyStatsService.getDistribucionNivelCategoria(companyFilter._id ? { _id: companyFilter._id } : {})
        ]);
        
        return {
            period: {
                year: year || new Date().getFullYear(),
                startDate: auditMatchFilter.createdAt.$gte || null,
                endDate: auditMatchFilter.createdAt.$lte || null
            },
            stats,
            companyStats,
            evaluacionesPorProcedimiento,
            evaluacionesPorAlcance,
            evaluacionesPorEstado,
            evaluacionesPorTipo,
            vulnerabilidadesPorSeveridad,
            tendenciaMensual,
            entidadesEvaluadas,
            evaluacionesRecientes,
            alertasActivas,
            distribucionNivelCategoria
        };
    }
    
    /**
     * Obtener dashboard de una compañía específica
     */
    async getCompanyDashboard(companyId, filters = {}, userId = null) {
        const { year, startDate, endDate } = filters;
                
        const company = await Company.findById(companyId);
        if (!company) {
            throw new Error('Company not found');
        }
        
        if (userId) {
            const hasAccess = await AnalyticsPermissionService.canAccessCompany(
                userId, companyId, 'companyDashboard'
            );
            if (!hasAccess) {
                throw new Error('Access denied to this company');
            }
        }
        
        const dateFilter = baseService.buildDateFilter(startDate, endDate, year);
        const companyFilter = { company: companyId, createdAt: dateFilter };
        
        const [
            companyInfo,
            stats,
            evaluacionesPorProcedimiento,
            evaluacionesPorAlcance,
            evaluacionesPorEstado,
            evaluacionesPorTipo,
            vulnerabilidadesPorSeveridad,
            tendenciaMensual,
            evaluacionesRecientes,
            clientesAsociados
        ] = await Promise.all([
            entitiesService.getCompanyInfo(companyId),
            globalStatsService.getCompanyStats(companyFilter),
            globalStatsService.getEvaluacionesPorProcedimiento(companyFilter),
            globalStatsService.getEvaluacionesPorAlcance(companyFilter),
            globalStatsService.getEvaluacionesPorEstado(companyFilter),
            globalStatsService.getEvaluacionesPorTipo(companyFilter),
            globalStatsService.getVulnerabilidadesPorSeveridad(companyFilter),
            trendsService.getTendenciaMensualCompany(year || new Date().getFullYear(), companyId),
            entitiesService.getEvaluacionesRecientesCompany(companyId),
            entitiesService.getClientesAsociados(companyId)
        ]);
        
        return {
            period: {
                year: year || new Date().getFullYear(),
                startDate: dateFilter.$gte || null,
                endDate: dateFilter.$lte || null
            },
            company: companyInfo,
            stats,
            evaluacionesPorProcedimiento,
            evaluacionesPorAlcance,
            evaluacionesPorEstado,
            evaluacionesPorTipo,
            vulnerabilidadesPorSeveridad,
            tendenciaMensual,
            evaluacionesRecientes,
            clientesAsociados
        };
    }
    
    /**
     * Obtener dashboard de una auditoría específica
     */
    async getAuditDashboard(auditId, userId = null) {
        if (userId) {
            const companyId = await auditDashboardService.getAuditCompanyId(auditId);
            if (companyId) {
                const hasAccess = await AnalyticsPermissionService.canAccessCompany(
                    userId, companyId, 'auditDashboard'
                );
                if (!hasAccess) {
                    throw new Error('Access denied to this audit');
                }
            }
        }
        
        return auditDashboardService.getAuditDashboard(auditId);
    }
    
    /**
     * Obtener ranking de entidades con vulnerabilidades críticas
     */
    async getTopEntidadesCriticas(filters = {}, userId = null) {
        let permissionFilter = {};
        let prioritizeCuadroDeMando = false;
        
        if (userId) {
            const permissionInfo = await this._getPermissionInfo(userId, 'entidadesCriticas');
            if (permissionInfo.hasRestrictions && permissionInfo.companyFilter.company) {
                permissionFilter = { company: permissionInfo.companyFilter.company };
            }
            
            // Si tiene globalOnlyCuadroDeMando activo, priorizar en ranking
            const permission = await AnalyticsPermissionService.findByUserId(userId);
            if (permission?.customPermissionsEnabled && permission?.globalOnlyCuadroDeMando) {
                prioritizeCuadroDeMando = true;
            }
        }
        
        // Agregar flag de priorización
        const filtersWithPriority = { ...filters, prioritizeCuadroDeMando };
        
        const result = await entitiesService.getTopEntidadesCriticas(filtersWithPriority, permissionFilter);
        
        if (userId) {
            result.entidades = await AnalyticsPermissionService.applyMaxResults(
                userId, 'entidadesCriticas', result.entidades
            );
        }
        
        return result;
    }
    
    /**
     * Obtener vulnerabilidades detalladas de una entidad
     */
    async getVulnerabilidadesEntidad(companyId, filters = {}, userId = null) {
        if (userId) {
            const hasAccess = await AnalyticsPermissionService.canAccessCompany(
                userId, companyId, 'vulnerabilidadesEntidad'
            );
            if (!hasAccess) {
                throw new Error('Access denied to this company');
            }
        }
        
        return vulnerabilitiesService.getVulnerabilidadesEntidad(companyId, filters);
    }
    
    /**
     * Obtener estadísticas de Companies (Entidades)
     */
    async getCompanyStatistics(filters = {}, userId = null) {
        let companyFilter = {};
        
        if (userId) {
            const permissionInfo = await this._getPermissionInfo(userId, 'globalDashboard');
            if (permissionInfo.hasRestrictions && permissionInfo.companyFilter.company) {
                companyFilter._id = permissionInfo.companyFilter.company;
            }
        }
        
        const [stats, documentacionPorGestion, distribucion] = await Promise.all([
            companyStatsService.getCompanyStats(companyFilter),
            companyStatsService.getDocumentacionPorGestion(companyFilter, filters.gestion),
            companyStatsService.getDistribucionNivelCategoria(companyFilter)
        ]);
        
        return { stats, documentacionPorGestion, distribucion };
    }
    
    /**
     * Obtener listado de Companies con estadísticas
     */
    async getCompaniesWithStats(filters = {}, userId = null) {
        const { year, startDate, endDate } = filters;
        const dateFilter = baseService.buildDateFilter(startDate, endDate, year);
        
        let companyFilter = {};
        
        if (userId) {
            const permissionInfo = await this._getPermissionInfo(userId, 'globalDashboard');
            if (permissionInfo.hasRestrictions && permissionInfo.companyFilter.company) {
                companyFilter._id = permissionInfo.companyFilter.company;
            }
        }
        
        return companyStatsService.getCompaniesWithAuditStats(companyFilter, { createdAt: dateFilter });
    }
    
    /**
     * Obtener información de permisos y construir filtro
     * @private
     */
    async _getPermissionInfo(userId, endpointName) {
        if (!userId) {
            return { hasRestrictions: false, companyFilter: {} };
        }
        
        try {
            const companyFilter = await AnalyticsPermissionService.buildCompanyFilter(
                userId, endpointName
            );
            
            const hasRestrictions = companyFilter && 
                Object.keys(companyFilter).length > 0 && 
                companyFilter.company !== undefined;
            
            return { hasRestrictions, companyFilter };
        } catch (error) {
            console.error('[AnalyticsService] Error getting permission info:', error);
            return { hasRestrictions: false, companyFilter: {} };
        }
    }
    
    // Métodos legacy para compatibilidad
    _buildDateFilter(startDate, endDate, year) {
        return baseService.buildDateFilter(startDate, endDate, year);
    }
}

module.exports = new AnalyticsService();