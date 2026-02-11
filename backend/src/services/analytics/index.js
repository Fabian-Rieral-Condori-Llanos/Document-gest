/**
 * Analytics Services Index
 * 
 * Exporta todos los servicios de analytics refactorizados.
 * 
 * ESTRUCTURA:
 * - base.service.js: Métodos compartidos (CVSS, fechas, análisis)
 * - global-stats.service.js: Estadísticas globales
 * - trends.service.js: Tendencias mensuales
 * - entities.service.js: Entidades (compañías) evaluadas
 * - audit-dashboard.service.js: Dashboard de auditoría individual
 * - vulnerabilities.service.js: Análisis de vulnerabilidades
 * - company-stats.service.js: Estadísticas de Companies
 */

const baseService = require('./base.service');
const globalStatsService = require('./global-stats.service');
const trendsService = require('./trends.service');
const entitiesService = require('./entities.service');
const auditDashboardService = require('./audit-dashboard.service');
const vulnerabilitiesService = require('./vulnerabilities.service');
const companyStatsService = require('./company-stats.service');

module.exports = {
    // Servicio base con helpers
    baseService,
    
    // Servicios específicos
    globalStatsService,
    trendsService,
    entitiesService,
    auditDashboardService,
    vulnerabilitiesService,
    companyStatsService,
    
    // Aliases para compatibilidad
    base: baseService,
    stats: globalStatsService,
    trends: trendsService,
    entities: entitiesService,
    audit: auditDashboardService,
    vulnerabilities: vulnerabilitiesService,
    companyStats: companyStatsService
};