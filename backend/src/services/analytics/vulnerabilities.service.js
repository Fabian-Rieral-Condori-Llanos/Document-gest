const Audit = require('../../models/audit.model');
const Company = require('../../models/company.model');
const baseService = require('./base.service');

/**
 * VulnerabilitiesAnalyticsService
 * 
 * Servicio para análisis detallado de vulnerabilidades.
 * Incluye listados, filtros y estadísticas de vulnerabilidades.
 */
class VulnerabilitiesAnalyticsService {
    
    /**
     * Obtener vulnerabilidades detalladas de una entidad
     * @param {ObjectId|String} companyId 
     * @param {Object} filters 
     * @returns {Promise<Object>}
     */
    async getVulnerabilidadesEntidad(companyId, filters = {}) {
        const { year, startDate, endDate, soloActivas = false, severidad } = filters;
        const dateFilter = baseService.buildDateFilter(startDate, endDate, year);
        
        const company = await Company.findById(companyId);
        if (!company) {
            throw new Error('Company not found');
        }
        
        const matchFilter = { 
            company: companyId,
            createdAt: dateFilter 
        };
        
        const audits = await Audit.find(matchFilter)
            .select('name findings createdAt auditType')
            .sort({ createdAt: -1 });
        
        const vulnerabilidades = [];
        
        audits.forEach(audit => {
            (audit.findings || []).forEach(finding => {
                const score = baseService.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                const severidadLabel = baseService.getSeverityLabel(finding.cvssv3 || finding.cvssv4);
                const retestStatus = finding.retestStatus || 'unknown';
                const esActiva = retestStatus !== 'ok';
                
                // Aplicar filtros
                if (soloActivas && !esActiva) return;
                if (severidad && severidadLabel.toLowerCase() !== severidad.toLowerCase()) return;
                
                vulnerabilidades.push({
                    id: finding._id,
                    auditId: audit._id,
                    auditName: audit.name,
                    auditType: audit.auditType,
                    auditDate: baseService.formatDate(audit.createdAt),
                    title: finding.title,
                    description: finding.description,
                    severity: severidadLabel,
                    cvssScore: score,
                    cvssVector: finding.cvssv3 || finding.cvssv4,
                    category: finding.vulnType || 'Sin categoría',
                    retestStatus,
                    retestStatusLabel: baseService.getRetestStatusLabel(retestStatus),
                    esActiva,
                    remediation: finding.remediation,
                    references: finding.references
                });
            });
        });
        
        // Ordenar por severidad y luego por fecha
        vulnerabilidades.sort((a, b) => {
            if (b.cvssScore !== a.cvssScore) return b.cvssScore - a.cvssScore;
            return new Date(b.auditDate) - new Date(a.auditDate);
        });
        
        // Estadísticas
        const allFindings = audits.flatMap(a => a.findings || []);
        const stats = baseService.analyzeFindings(allFindings);
        
        return {
            company: {
                id: company._id,
                name: company.name,
                shortName: company.shortName,
                cuadroDeMando: company.cuadroDeMando
            },
            period: {
                year: baseService.getYear(year),
                startDate: dateFilter.$gte,
                endDate: dateFilter.$lte
            },
            filters: {
                soloActivas,
                severidad: severidad || null
            },
            stats: {
                totalAuditorias: audits.length,
                ...stats
            },
            vulnerabilidades
        };
    }
    
    /**
     * Obtener resumen de vulnerabilidades globales
     * @param {Object} filter 
     * @returns {Promise<Object>}
     */
    async getResumenVulnerabilidades(filter) {
        const audits = await Audit.find(filter)
            .select('findings company')
            .populate('company', 'name shortName');
        
        const porSeveridad = { criticas: 0, altas: 0, medias: 0, bajas: 0, info: 0 };
        const porEstado = { remediadas: 0, noRemediadas: 0, parciales: 0, sinVerificar: 0 };
        const porCategoria = {};
        let total = 0;
        
        audits.forEach(audit => {
            (audit.findings || []).forEach(finding => {
                total++;
                
                const score = baseService.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                const category = finding.vulnType || 'Sin categoría';
                
                // Por severidad
                if (score >= 9.0) porSeveridad.criticas++;
                else if (score >= 7.0) porSeveridad.altas++;
                else if (score >= 4.0) porSeveridad.medias++;
                else if (score > 0) porSeveridad.bajas++;
                else porSeveridad.info++;
                
                // Por estado
                switch (finding.retestStatus) {
                    case 'ok': porEstado.remediadas++; break;
                    case 'ko': porEstado.noRemediadas++; break;
                    case 'partial': porEstado.parciales++; break;
                    default: porEstado.sinVerificar++; break;
                }
                
                // Por categoría
                if (!porCategoria[category]) {
                    porCategoria[category] = { total: 0, criticas: 0, remediadas: 0 };
                }
                porCategoria[category].total++;
                if (score >= 9.0) porCategoria[category].criticas++;
                if (finding.retestStatus === 'ok') porCategoria[category].remediadas++;
            });
        });
        
        return {
            total,
            porSeveridad,
            porEstado,
            porCategoria: Object.entries(porCategoria)
                .map(([categoria, datos]) => ({ categoria, ...datos }))
                .sort((a, b) => b.total - a.total),
            tasaRemediacion: total > 0 
                ? Math.round((porEstado.remediadas / total) * 100)
                : 0
        };
    }
    
    /**
     * Obtener top vulnerabilidades más frecuentes
     * @param {Object} filter 
     * @param {Number} limit 
     * @returns {Promise<Array>}
     */
    async getTopVulnerabilidades(filter, limit = 10) {
        const audits = await Audit.find(filter).select('findings');
        
        const conteo = {};
        
        audits.forEach(audit => {
            (audit.findings || []).forEach(finding => {
                const title = finding.title || 'Sin título';
                const category = finding.vulnType || 'Sin categoría';
                const key = `${title}|||${category}`;
                
                if (!conteo[key]) {
                    conteo[key] = {
                        title,
                        category,
                        count: 0,
                        severidadMax: 0,
                        remediadas: 0
                    };
                }
                
                conteo[key].count++;
                
                const score = baseService.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                if (score > conteo[key].severidadMax) {
                    conteo[key].severidadMax = score;
                }
                
                if (finding.retestStatus === 'ok') {
                    conteo[key].remediadas++;
                }
            });
        });
        
        return Object.values(conteo)
            .map(v => ({
                ...v,
                severidad: baseService.getSeverityLabel(
                    v.severidadMax >= 9 ? 'AV:N/PR:N/C:H/I:H/A:H' :
                    v.severidadMax >= 7 ? 'AV:N/PR:N/C:H' :
                    v.severidadMax >= 4 ? 'AV:L/PR:L/C:L' : 'AV:L/PR:H/C:N'
                ),
                tasaRemediacion: v.count > 0 
                    ? Math.round((v.remediadas / v.count) * 100)
                    : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    
    /**
     * Obtener vulnerabilidades críticas activas
     * @param {Object} filter 
     * @returns {Promise<Array>}
     */
    async getVulnerabilidadesCriticasActivas(filter) {
        const audits = await Audit.find(filter)
            .select('name findings company createdAt')
            .populate('company', 'name shortName');
        
        const criticas = [];
        
        audits.forEach(audit => {
            (audit.findings || []).forEach(finding => {
                const score = baseService.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                const retestStatus = finding.retestStatus || 'unknown';
                
                // Solo críticas activas
                if (score >= 9.0 && retestStatus !== 'ok') {
                    criticas.push({
                        id: finding._id,
                        title: finding.title,
                        cvssScore: score,
                        retestStatus,
                        retestStatusLabel: baseService.getRetestStatusLabel(retestStatus),
                        auditId: audit._id,
                        auditName: audit.name,
                        auditDate: baseService.formatDate(audit.createdAt),
                        company: audit.company ? {
                            id: audit.company._id,
                            name: audit.company.name || audit.company.shortName
                        } : null,
                        diasSinRemediar: baseService.calcularDias(audit.createdAt, new Date())
                    });
                }
            });
        });
        
        // Ordenar por días sin remediar (más antiguas primero)
        return criticas.sort((a, b) => b.diasSinRemediar - a.diasSinRemediar);
    }
    
    /**
     * Obtener distribución de vulnerabilidades por compañía
     * @param {Object} filter 
     * @returns {Promise<Array>}
     */
    async getDistribucionPorCompania(filter) {
        const audits = await Audit.find(filter)
            .select('company findings')
            .populate('company', 'name shortName cuadroDeMando');
        
        const distribucion = {};
        
        audits.forEach(audit => {
            if (!audit.company) return;
            
            const companyId = audit.company._id.toString();
            
            if (!distribucion[companyId]) {
                distribucion[companyId] = {
                    companyId: audit.company._id,
                    nombre: audit.company.name || audit.company.shortName,
                    cuadroDeMando: audit.company.cuadroDeMando,
                    total: 0,
                    criticas: 0,
                    altas: 0,
                    remediadas: 0
                };
            }
            
            (audit.findings || []).forEach(finding => {
                distribucion[companyId].total++;
                
                const score = baseService.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                if (score >= 9.0) distribucion[companyId].criticas++;
                else if (score >= 7.0) distribucion[companyId].altas++;
                
                if (finding.retestStatus === 'ok') {
                    distribucion[companyId].remediadas++;
                }
            });
        });
        
        return Object.values(distribucion)
            .map(d => ({
                ...d,
                tasaRemediacion: d.total > 0 
                    ? Math.round((d.remediadas / d.total) * 100)
                    : 0
            }))
            .sort((a, b) => b.criticas - a.criticas);
    }
}

module.exports = new VulnerabilitiesAnalyticsService();
