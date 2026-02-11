const Audit = require('../../models/audit.model');
const baseService = require('./base.service');

/**
 * TrendsService
 * 
 * Servicio para tendencias y datos históricos.
 * Incluye tendencias mensuales globales y por compañía.
 */
class TrendsService {
    
    /**
     * Tendencia mensual global
     * @param {Number} year - Año a consultar
     * @param {Object} permissionFilter - Filtro de permisos (opcional)
     * @returns {Promise<Array>}
     */
    async getTendenciaMensual(year, permissionFilter = {}) {
        const meses = baseService.getNombresMeses();
        
        const matchFilter = {
            createdAt: {
                $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                $lte: new Date(`${year}-12-31T23:59:59.999Z`)
            },
            ...permissionFilter
        };
        
        const results = await Audit.aggregate([
            { $match: matchFilter },
            {
                $project: {
                    month: { $month: '$createdAt' },
                    findingsCount: { $size: { $ifNull: ['$findings', []] } },
                    findings: 1
                }
            },
            {
                $group: {
                    _id: '$month',
                    evaluaciones: { $sum: 1 },
                    vulnerabilidades: { $sum: '$findingsCount' },
                    findings: { $push: '$findings' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        return meses.map((mes, index) => {
            const mesData = results.find(r => r._id === index + 1);
            
            if (!mesData) {
                return { 
                    mes, 
                    evaluaciones: 0, 
                    vulnerabilidades: 0, 
                    remediadas: 0, 
                    noRemediadas: 0, 
                    parciales: 0 
                };
            }
            
            // Contar por retestStatus
            let remediadas = 0, noRemediadas = 0, parciales = 0;
            mesData.findings.forEach(findingsArray => {
                if (findingsArray && Array.isArray(findingsArray)) {
                    findingsArray.forEach(f => {
                        switch (f.retestStatus) {
                            case 'ok': remediadas++; break;
                            case 'ko': noRemediadas++; break;
                            case 'partial': parciales++; break;
                        }
                    });
                }
            });
            
            return {
                mes,
                evaluaciones: mesData.evaluaciones,
                vulnerabilidades: mesData.vulnerabilidades,
                remediadas,
                noRemediadas,
                parciales
            };
        });
    }
    
    /**
     * Tendencia mensual por compañía
     * @param {Number} year - Año a consultar
     * @param {ObjectId|String} companyId - ID de la compañía
     * @returns {Promise<Array>}
     */
    async getTendenciaMensualCompany(year, companyId) {
        const meses = baseService.getNombresMeses();
        
        const results = await Audit.aggregate([
            {
                $match: {
                    company: companyId,
                    createdAt: {
                        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
                    }
                }
            },
            {
                $project: {
                    month: { $month: '$createdAt' },
                    findingsCount: { $size: { $ifNull: ['$findings', []] } },
                    findings: 1
                }
            },
            {
                $group: {
                    _id: '$month',
                    evaluaciones: { $sum: 1 },
                    vulnerabilidades: { $sum: '$findingsCount' },
                    findings: { $push: '$findings' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        return meses.map((mes, index) => {
            const mesData = results.find(r => r._id === index + 1);
            
            if (!mesData) {
                return { 
                    mes, 
                    evaluaciones: 0, 
                    vulnerabilidades: 0, 
                    remediadas: 0, 
                    noRemediadas: 0, 
                    parciales: 0 
                };
            }
            
            let remediadas = 0, noRemediadas = 0, parciales = 0;
            mesData.findings.forEach(findingsArray => {
                if (findingsArray && Array.isArray(findingsArray)) {
                    findingsArray.forEach(f => {
                        switch (f.retestStatus) {
                            case 'ok': remediadas++; break;
                            case 'ko': noRemediadas++; break;
                            case 'partial': parciales++; break;
                        }
                    });
                }
            });
            
            return {
                mes,
                evaluaciones: mesData.evaluaciones,
                vulnerabilidades: mesData.vulnerabilidades,
                remediadas,
                noRemediadas,
                parciales
            };
        });
    }
    
    /**
     * Tendencia de vulnerabilidades por severidad (mensual)
     * @param {Number} year 
     * @param {Object} permissionFilter 
     * @returns {Promise<Array>}
     */
    async getTendenciaVulnerabilidadesPorSeveridad(year, permissionFilter = {}) {
        const meses = baseService.getNombresMeses();
        
        const matchFilter = {
            createdAt: {
                $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                $lte: new Date(`${year}-12-31T23:59:59.999Z`)
            },
            ...permissionFilter
        };
        
        const audits = await Audit.find(matchFilter)
            .select('createdAt findings');
        
        // Inicializar datos por mes
        const datosPorMes = meses.map((mes, index) => ({
            mes,
            month: index + 1,
            criticas: 0,
            altas: 0,
            medias: 0,
            bajas: 0,
            info: 0
        }));
        
        // Procesar auditorías
        audits.forEach(audit => {
            const month = new Date(audit.createdAt).getMonth(); // 0-11
            
            (audit.findings || []).forEach(finding => {
                const score = baseService.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                
                if (score >= 9.0) datosPorMes[month].criticas++;
                else if (score >= 7.0) datosPorMes[month].altas++;
                else if (score >= 4.0) datosPorMes[month].medias++;
                else if (score > 0) datosPorMes[month].bajas++;
                else datosPorMes[month].info++;
            });
        });
        
        return datosPorMes;
    }
    
    /**
     * Comparativa año actual vs año anterior
     * @param {Number} year 
     * @param {Object} permissionFilter 
     * @returns {Promise<Object>}
     */
    async getComparativaAnual(year, permissionFilter = {}) {
        const yearAnterior = year - 1;
        
        const [datosActual, datosAnterior] = await Promise.all([
            this._getResumenAnual(year, permissionFilter),
            this._getResumenAnual(yearAnterior, permissionFilter)
        ]);
        
        return {
            actual: {
                year,
                ...datosActual
            },
            anterior: {
                year: yearAnterior,
                ...datosAnterior
            },
            variacion: {
                evaluaciones: this._calcularVariacion(
                    datosAnterior.totalEvaluaciones, 
                    datosActual.totalEvaluaciones
                ),
                vulnerabilidades: this._calcularVariacion(
                    datosAnterior.totalVulnerabilidades, 
                    datosActual.totalVulnerabilidades
                ),
                criticas: this._calcularVariacion(
                    datosAnterior.criticas, 
                    datosActual.criticas
                )
            }
        };
    }
    
    /**
     * Obtener resumen anual
     * @private
     */
    async _getResumenAnual(year, permissionFilter = {}) {
        const matchFilter = {
            createdAt: {
                $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                $lte: new Date(`${year}-12-31T23:59:59.999Z`)
            },
            ...permissionFilter
        };
        
        const audits = await Audit.find(matchFilter).select('findings');
        
        let totalVulnerabilidades = 0;
        let criticas = 0;
        let remediadas = 0;
        
        audits.forEach(audit => {
            (audit.findings || []).forEach(finding => {
                totalVulnerabilidades++;
                
                const score = baseService.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                if (score >= 9.0) criticas++;
                
                if (finding.retestStatus === 'ok') remediadas++;
            });
        });
        
        return {
            totalEvaluaciones: audits.length,
            totalVulnerabilidades,
            criticas,
            remediadas,
            tasaRemediacion: totalVulnerabilidades > 0 
                ? Math.round((remediadas / totalVulnerabilidades) * 100)
                : 0
        };
    }
    
    /**
     * Calcular variación porcentual
     * @private
     */
    _calcularVariacion(anterior, actual) {
        if (anterior === 0) {
            return actual > 0 ? 100 : 0;
        }
        return Math.round(((actual - anterior) / anterior) * 100);
    }
}

module.exports = new TrendsService();
