const Audit = require('../../models/audit.model');
const Company = require('../../models/company.model');
const AuditProcedure = require('../../models/audit-procedure.model');
const AuditStatus = require('../../models/audit-status.model');
const ProcedureTemplate = require('../../models/procedure-template.model');
const AlcanceTemplate = require('../../models/alcance-template.model');
const baseService = require('./base.service');

/**
 * GlobalStatsService
 * 
 * Servicio para estadísticas globales del dashboard.
 * Incluye contadores, distribuciones y tendencias.
 */
class GlobalStatsService {
    
    /**
     * Obtener estadísticas globales
     * @param {Object} matchFilter - Filtro de MongoDB (contiene company si hay permisos)
     * @param {Object} permissionFilter - Filtro de permisos (opcional)
     * @returns {Promise<Object>}
     */
    async getGlobalStats(matchFilter, permissionFilter = {}) {
        const filter = baseService.mergeFilters(matchFilter, permissionFilter);
        
        console.log('[GlobalStats] Filter aplicado:', JSON.stringify(filter, null, 2));
        
        const totalEvaluaciones = await Audit.countDocuments(filter);
        
        const evaluacionesActivas = await Audit.countDocuments({
            ...filter,
            state: { $in: ['EDIT'] }
        });
        
        const evaluacionesCompletadas = await Audit.countDocuments({
            ...filter,
            state: { $in: ['APPROVED'] }
        });
        
        // Entidades evaluadas (solo de las auditorías filtradas)
        const entidadesEvaluadas = await Audit.distinct('company', filter);
        
        // Total de entidades disponibles según permisos
        let totalEntidadesQuery = { status: true };
        if (filter.company) {
            // Si hay filtro de company, solo contar esas empresas
            totalEntidadesQuery._id = filter.company;
        }
        const totalEntidades = await Company.countDocuments(totalEntidadesQuery);
        
        const vulnStats = await this.countVulnerabilities(filter);
        const tiempoPromedio = await this.calcularTiempoPromedio(filter);
        const tasaRemediacion = await this.calcularTasaRemediacion(filter);
        
        return {
            totalEvaluaciones,
            evaluacionesActivas,
            evaluacionesCompletadas,
            entidadesEvaluadas: entidadesEvaluadas.length,
            totalEntidades,
            porcentajeCobertura: totalEntidades > 0 
                ? ((entidadesEvaluadas.length / totalEntidades) * 100).toFixed(1)
                : 0,
            vulnCriticasActivas: vulnStats.criticas,
            tasaRemediacion,
            tiempoPromedioDias: tiempoPromedio,
            verificacion: {
                remediadas: vulnStats.remediadas,
                noRemediadas: vulnStats.noRemediadas,
                parciales: vulnStats.parciales,
                sinVerificar: vulnStats.sinVerificar,
                totalVerificadas: vulnStats.verificadas
            }
        };
    }
    
    /**
     * Obtener estadísticas de una compañía específica
     * @param {Object} filter - Filtro con company incluido
     * @returns {Promise<Object>}
     */
    async getCompanyStats(filter) {
        const totalEvaluaciones = await Audit.countDocuments(filter);
        
        const evaluacionesActivas = await Audit.countDocuments({
            ...filter,
            state: { $in: ['EDIT'] }
        });
        
        const evaluacionesCompletadas = await Audit.countDocuments({
            ...filter,
            state: { $in: ['APPROVED'] }
        });
        
        const empresasEvaluadas = await Audit.distinct('company', filter);
        
        const vulnStats = await this.countVulnerabilities(filter);
        const tiempoPromedio = await this.calcularTiempoPromedio(filter);
        const tasaRemediacion = await this.calcularTasaRemediacion(filter);
        
        return {
            totalEvaluaciones,
            evaluacionesActivas,
            evaluacionesCompletadas,
            empresasEvaluadas: empresasEvaluadas.length,
            vulnCriticasActivas: vulnStats.criticas,
            tasaRemediacion,
            tiempoPromedioDias: tiempoPromedio,
            verificacion: {
                remediadas: vulnStats.remediadas,
                noRemediadas: vulnStats.noRemediadas,
                parciales: vulnStats.parciales,
                sinVerificar: vulnStats.sinVerificar,
                totalVerificadas: vulnStats.verificadas
            }
        };
    }
    
    /**
     * Contar vulnerabilidades desde findings
     * @param {Object} filter 
     * @returns {Promise<Object>}
     */
    async countVulnerabilities(filter) {
        const audits = await Audit.find(filter).select('findings');
        
        let total = 0, criticas = 0, altas = 0, medias = 0, bajas = 0, info = 0;
        let verificadas = 0, remediadas = 0, noRemediadas = 0, parciales = 0, sinVerificar = 0;
        
        audits.forEach(audit => {
            if (audit.findings && Array.isArray(audit.findings)) {
                audit.findings.forEach(finding => {
                    total++;
                    const score = baseService.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                    
                    if (score >= 9.0) criticas++;
                    else if (score >= 7.0) altas++;
                    else if (score >= 4.0) medias++;
                    else if (score > 0) bajas++;
                    else info++;
                    
                    switch (finding.retestStatus) {
                        case 'ok':
                            remediadas++;
                            verificadas++;
                            break;
                        case 'ko':
                            noRemediadas++;
                            verificadas++;
                            break;
                        case 'partial':
                            parciales++;
                            verificadas++;
                            break;
                        default:
                            sinVerificar++;
                            break;
                    }
                });
            }
        });
        
        return { 
            total, criticas, altas, medias, bajas, info, 
            remediadas, noRemediadas, parciales, sinVerificar, verificadas 
        };
    }
    
    /**
     * Calcular tiempo promedio de evaluación
     * @param {Object} filter 
     * @returns {Promise<Number>}
     */
    async calcularTiempoPromedio(filter) {
        const audits = await Audit.find({
            ...filter,
            date_start: { $exists: true },
            date_end: { $exists: true }
        }).select('date_start date_end');
        
        if (audits.length === 0) return 12.4; // Valor por defecto
        
        const totalDias = audits.reduce((sum, audit) => {
            const dias = baseService.calcularDias(audit.date_start, audit.date_end);
            return sum + dias;
        }, 0);
        
        return (totalDias / audits.length).toFixed(1);
    }
    
    /**
     * Calcular tasa de remediación
     * @param {Object} filter 
     * @returns {Promise<String>}
     */
    async calcularTasaRemediacion(filter) {
        const vulnStats = await this.countVulnerabilities(filter);
        
        if (vulnStats.total === 0) return '0';
        
        return ((vulnStats.remediadas / vulnStats.total) * 100).toFixed(0);
    }
    
    /**
     * Obtener vulnerabilidades por severidad
     * @param {Object} filter 
     * @returns {Promise<Array>}
     */
    async getVulnerabilidadesPorSeveridad(filter) {
        const vulnStats = await this.countVulnerabilities(filter);
        const cvssColors = await baseService.getCVSSColors();

        return [
            { name: 'Crítica', value: vulnStats.criticas, color: cvssColors.criticalColor },
            { name: 'Alta', value: vulnStats.altas, color: cvssColors.highColor },
            { name: 'Media', value: vulnStats.medias, color: cvssColors.mediumColor },
            { name: 'Baja', value: vulnStats.bajas, color: cvssColors.lowColor },
            { name: 'Info', value: vulnStats.info, color: cvssColors.noneColor }
        ];
    }
    
    /**
     * Evaluaciones por procedimiento (origen)
     * @param {Object} filter 
     * @returns {Promise<Array>}
     */
    async getEvaluacionesPorProcedimiento(filter) {
        const results = await Audit.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'auditprocedures',
                    localField: '_id',
                    foreignField: 'auditId',
                    as: 'procedure'
                }
            },
            { $unwind: { path: '$procedure', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$procedure.origen',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);
        
        // Obtener colores y nombres de templates
        const templates = await ProcedureTemplate.find({}).lean();
        const colorMap = {};
        const nameMap = {};
        templates.forEach(t => {
            colorMap[t.code] = t.color;
            nameMap[t.code] = t.name;
        });

        return results.map(item => {
            const origen = item._id || 'Sin procedimiento';
            const name = nameMap[origen] || 'N/A';
            return {
                tipo: name ? `${origen} - ${name}` : origen,
                cantidad: item.cantidad,
                color: colorMap[origen] || '#6b7280'
            };
        });
    }
    
    /**
     * Evaluaciones por alcance
     * @param {Object} filter 
     * @returns {Promise<Array>}
     */
    async getEvaluacionesPorAlcance(filter) {
        const results = await Audit.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'auditprocedures',
                    localField: '_id',
                    foreignField: 'auditId',
                    as: 'procedure'
                }
            },
            { $unwind: { path: '$procedure', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$procedure.alcance', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$procedure.alcance',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);
        
        const templates = await AlcanceTemplate.find({}).lean();
        const colorMap = {};
        templates.forEach(t => {
            colorMap[t.name] = t.color;
        });
        
        return results.map(item => {
            const alcance = item._id || 'Sin alcance';
            return {
                alcance,
                cantidad: item.cantidad,
                color: colorMap[alcance] || '#6b7280'
            };
        });
    }
    
    /**
     * Evaluaciones por estado
     * @param {Object} filter 
     * @returns {Promise<Array>}
     */
    async getEvaluacionesPorEstado(filter) {
        const matchStage = {};
        
        if (filter.createdAt) {
            matchStage['audit.createdAt'] = filter.createdAt;
        }
        if (filter.company) {
            matchStage['audit.company'] = filter.company;
        }
        
        const results = await AuditStatus.aggregate([
            {
                $lookup: {
                    from: 'audits',
                    localField: 'auditId',
                    foreignField: '_id',
                    as: 'audit'
                }
            },
            { $unwind: { path: '$audit', preserveNullAndEmptyArrays: false } },
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);
        
        return results.map(item => ({
            estado: item._id || 'Sin estado',
            cantidad: item.cantidad
        }));
    }
    
    /**
     * Evaluaciones por tipo
     * @param {Object} filter 
     * @returns {Promise<Array>}
     */
    async getEvaluacionesPorTipo(filter) {
        const results = await Audit.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$auditType',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);
        
        return results.map(item => ({
            tipo: item._id || 'Sin tipo',
            cantidad: item.cantidad
        }));
    }
}

module.exports = new GlobalStatsService();
