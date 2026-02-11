const Company = require('../../models/company.model');
const Audit = require('../../models/audit.model');
const Client = require('../../models/client.model');
const baseService = require('./base.service');

/**
 * CompanyStatsService
 * 
 * Servicio para estadísticas de Companies (Entidades).
 * Proporciona datos agregados sobre las empresas para el dashboard.
 * 
 * NIVEL DE MADUREZ: Escala 0-5
 * 0 = Sin asignar
 * 1 = Inicial
 * 2 = Básico
 * 3 = Intermedio
 * 4 = Avanzado
 * 5 = Óptimo
 */
class CompanyStatsService {
    
    /**
     * Labels para niveles de madurez
     */
    static NIVELES_MADUREZ = {
        0: 'Sin asignar',
        1: 'Inicial',
        2: 'Básico', 
        3: 'Intermedio',
        4: 'Avanzado',
        5: 'Óptimo'
    };
    
    /**
     * Obtener estadísticas generales de Companies
     * @param {Object} companyFilter - Filtro para companies { _id: { $in: [...] } } o {}
     * @returns {Promise<Object>}
     */
    async getCompanyStats(companyFilter = {}) {
        const query = { status: true, ...companyFilter };
        
        if (companyFilter._id) {
            query._id = companyFilter._id;
        }
        
        // Total de entidades según filtro
        const totalEntidades = await Company.countDocuments(query);
        
        // Entidades en cuadro de mando
        const entidadesCuadroDeMando = await Company.countDocuments({
            ...query,
            cuadroDeMando: true
        });
        
        // Por nivel organizacional (CENTRAL/TERRITORIAL)
        const porNivelOrganizacional = await Company.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$nivel',
                    cantidad: { $sum: 1 }
                }
            }
        ]);
        
        // Por categoría
        const porCategoria = await Company.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$categoria',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);
        
        // Por nivel de madurez (1-5)
        const porNivelMadurez = await Company.aggregate([
            { $match: { ...query, nivelDeMadurez: { $ne: null, $ne: '' } } },
            {
                $group: {
                    _id: '$nivelDeMadurez',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Con PISI
        const conPisi = await Company.countDocuments({
            ...query,
            'pisi.0': { $exists: true }
        });
        
        // Con Plan de Contingencia
        const conPlanContingencia = await Company.countDocuments({
            ...query,
            'planContingencia.0': { $exists: true }
        });
        
        // Calcular promedio de nivel de madurez
        const promedioMadurez = await this._calcularPromedioMadurez(query);
        
        return {
            totalEntidades,
            entidadesCuadroDeMando,
            porcentajeCuadroDeMando: totalEntidades > 0 
                ? ((entidadesCuadroDeMando / totalEntidades) * 100).toFixed(1)
                : 0,
            porNivelOrganizacional: porNivelOrganizacional.map(n => ({
                nivel: n._id || 'Sin nivel',
                cantidad: n.cantidad
            })),
            porCategoria: porCategoria.map(c => ({
                categoria: c._id || 'Sin categoría',
                cantidad: c.cantidad
            })),
            porNivelMadurez: this._formatNivelesMadurez(porNivelMadurez, totalEntidades),
            promedioMadurez,
            documentacion: {
                conPisi,
                sinPisi: totalEntidades - conPisi,
                porcentajePisi: totalEntidades > 0 
                    ? ((conPisi / totalEntidades) * 100).toFixed(1)
                    : 0,
                conPlanContingencia,
                sinPlanContingencia: totalEntidades - conPlanContingencia,
                porcentajePlanContingencia: totalEntidades > 0 
                    ? ((conPlanContingencia / totalEntidades) * 100).toFixed(1)
                    : 0
            }
        };
    }
    
    /**
     * Formatear niveles de madurez con labels
     * @private
     */
    _formatNivelesMadurez(niveles, total) {
        // Crear estructura base con todos los niveles (0-5)
        const resultado = [];
        
        for (let i = 0; i <= 5; i++) {
            const encontrado = niveles.find(n => String(n._id) === String(i));
            resultado.push({
                nivel: i,
                label: CompanyStatsService.NIVELES_MADUREZ[i],
                cantidad: encontrado ? encontrado.cantidad : 0,
                porcentaje: total > 0 && encontrado 
                    ? ((encontrado.cantidad / total) * 100).toFixed(1)
                    : '0'
            });
        }
        
        // Contar empresas sin nivel asignado (null, undefined, vacío)
        const totalConNivel = niveles.reduce((sum, n) => {
            const nivelNum = parseInt(n._id);
            if (nivelNum >= 0 && nivelNum <= 5) {
                return sum + n.cantidad;
            }
            return sum;
        }, 0);
        
        const sinNivel = total - totalConNivel;
        
        // Sumar los sin nivel al nivel 0 (Sin asignar)
        if (sinNivel > 0) {
            resultado[0].cantidad += sinNivel;
            resultado[0].porcentaje = total > 0 
                ? ((resultado[0].cantidad / total) * 100).toFixed(1)
                : '0';
        }
        
        return resultado;
    }
    
    /**
     * Calcular promedio de nivel de madurez
     * @private
     */
    async _calcularPromedioMadurez(query) {
        const result = await Company.aggregate([
            { $match: { ...query, nivelDeMadurez: { $ne: null, $ne: '' } } },
            {
                $addFields: {
                    nivelNumerico: {
                        $convert: {
                            input: '$nivelDeMadurez',
                            to: 'int',
                            onError: 0,
                            onNull: 0
                        }
                    }
                }
            },
            {
                $match: { nivelNumerico: { $gte: 1, $lte: 5 } }
            },
            {
                $group: {
                    _id: null,
                    promedio: { $avg: '$nivelNumerico' },
                    total: { $sum: 1 }
                }
            }
        ]);
        
        if (result.length === 0) {
            return { promedio: 0, label: 'Sin datos', totalEvaluadas: 0 };
        }
        
        const promedio = parseFloat(result[0].promedio.toFixed(2));
        const nivelRedondeado = Math.round(promedio);
        
        return {
            promedio,
            label: CompanyStatsService.NIVELES_MADUREZ[nivelRedondeado] || 'Sin datos',
            totalEvaluadas: result[0].total
        };
    }
    
    /**
     * Obtener listado de Companies con estadísticas de evaluaciones
     * @param {Object} companyFilter - Filtro para companies
     * @param {Object} auditFilter - Filtro adicional para auditorías
     * @returns {Promise<Array>}
     */
    async getCompaniesWithAuditStats(companyFilter = {}, auditFilter = {}) {
        const query = { status: true, ...companyFilter };
        
        const companies = await Company.find(query)
            .select('name shortName logo cuadroDeMando nivel categoria nivelDeMadurez status pisi planContingencia')
            .lean();
        
        const enrichedCompanies = await Promise.all(
            companies.map(async (company) => {
                const companyAuditFilter = {
                    company: company._id,
                    ...auditFilter
                };
                
                const totalAuditorias = await Audit.countDocuments(companyAuditFilter);
                const totalClientes = await Client.countDocuments({ company: company._id });
                
                const ultimaAuditoria = await Audit.findOne(companyAuditFilter)
                    .sort({ createdAt: -1 })
                    .select('createdAt name')
                    .lean();
                
                // Estadísticas de vulnerabilidades
                const auditsWithFindings = await Audit.find(companyAuditFilter)
                    .select('findings')
                    .lean();
                
                let totalVulnerabilidades = 0;
                let vulnCriticas = 0;
                let vulnAltas = 0;
                let remediadas = 0;
                
                auditsWithFindings.forEach(audit => {
                    (audit.findings || []).forEach(finding => {
                        totalVulnerabilidades++;
                        const score = baseService.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                        if (score >= 9.0) vulnCriticas++;
                        else if (score >= 7.0) vulnAltas++;
                        if (finding.retestStatus === 'ok') remediadas++;
                    });
                });
                
                // Parsear nivel de madurez a número
                const nivelMadurezNum = parseInt(company.nivelDeMadurez) || 0;
                
                return {
                    id: company._id,
                    nombre: company.name,
                    nombreCorto: company.shortName,
                    logo: company.logo,
                    cuadroDeMando: company.cuadroDeMando || false,
                    nivelOrganizacional: company.nivel,
                    categoria: company.categoria,
                    nivelMadurez: {
                        valor: nivelMadurezNum,
                        label: CompanyStatsService.NIVELES_MADUREZ[nivelMadurezNum] || 'Sin asignar'
                    },
                    tienePisi: (company.pisi?.length || 0) > 0,
                    tienePlanContingencia: (company.planContingencia?.length || 0) > 0,
                    estadisticas: {
                        totalAuditorias,
                        totalClientes,
                        totalVulnerabilidades,
                        vulnCriticas,
                        vulnAltas,
                        remediadas,
                        tasaRemediacion: totalVulnerabilidades > 0
                            ? Math.round((remediadas / totalVulnerabilidades) * 100)
                            : 100
                    },
                    ultimaAuditoria: ultimaAuditoria ? {
                        fecha: baseService.formatDate(ultimaAuditoria.createdAt),
                        nombre: ultimaAuditoria.name
                    } : null
                };
            })
        );
        
        return enrichedCompanies;
    }
    
    /**
     * Obtener resumen de documentación por gestión
     * @param {Object} companyFilter - Filtro para companies
     * @param {Number} gestion - Año de gestión
     * @returns {Promise<Object>}
     */
    async getDocumentacionPorGestion(companyFilter = {}, gestion = new Date().getFullYear()) {
        const query = { status: true, ...companyFilter };
        
        const companies = await Company.find(query)
            .select('name shortName pisi actualizacionPisi borradorPisi seguimientoPisi borradorPlanContingencia planContingencia informeTecnico')
            .lean();
        
        let conPisi = 0;
        let conActualizacionPisi = 0;
        let conBorradorPisi = 0;
        let conSeguimientoPisi = 0;
        let conBorradorPlanContingencia = 0;
        let conPlanContingencia = 0;
        let conInformeTecnico = 0;
        
        companies.forEach(company => {
            if (company.pisi?.some(d => d.gestion === gestion)) conPisi++;
            if (company.actualizacionPisi?.some(d => d.gestion === gestion)) conActualizacionPisi++;
            if (company.borradorPisi?.some(d => d.gestion === gestion)) conBorradorPisi++;
            if (company.seguimientoPisi?.some(d => d.gestion === gestion)) conSeguimientoPisi++;
            if (company.borradorPlanContingencia?.some(d => d.gestion === gestion)) conBorradorPlanContingencia++;
            if (company.planContingencia?.some(d => d.gestion === gestion)) conPlanContingencia++;
            if (company.informeTecnico?.some(d => d.gestion === gestion)) conInformeTecnico++;
        });
        
        const total = companies.length;
        
        return {
            gestion,
            totalEntidades: total,
            documentacion: {
                pisi: { cantidad: conPisi, porcentaje: total > 0 ? ((conPisi / total) * 100).toFixed(1) : 0 },
                actualizacionPisi: { cantidad: conActualizacionPisi, porcentaje: total > 0 ? ((conActualizacionPisi / total) * 100).toFixed(1) : 0 },
                borradorPisi: { cantidad: conBorradorPisi, porcentaje: total > 0 ? ((conBorradorPisi / total) * 100).toFixed(1) : 0 },
                seguimientoPisi: { cantidad: conSeguimientoPisi, porcentaje: total > 0 ? ((conSeguimientoPisi / total) * 100).toFixed(1) : 0 },
                borradorPlanContingencia: { cantidad: conBorradorPlanContingencia, porcentaje: total > 0 ? ((conBorradorPlanContingencia / total) * 100).toFixed(1) : 0 },
                planContingencia: { cantidad: conPlanContingencia, porcentaje: total > 0 ? ((conPlanContingencia / total) * 100).toFixed(1) : 0 },
                informeTecnico: { cantidad: conInformeTecnico, porcentaje: total > 0 ? ((conInformeTecnico / total) * 100).toFixed(1) : 0 }
            }
        };
    }
    
    /**
     * Obtener distribución por nivel organizacional y categoría
     * @param {Object} companyFilter - Filtro para companies
     * @returns {Promise<Object>}
     */
    async getDistribucionNivelCategoria(companyFilter = {}) {
        const query = { status: true, ...companyFilter };
        
        const distribucion = await Company.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        nivel: '$nivel',
                        categoria: '$categoria'
                    },
                    cantidad: { $sum: 1 },
                    conCuadroDeMando: {
                        $sum: { $cond: ['$cuadroDeMando', 1, 0] }
                    }
                }
            },
            { $sort: { '_id.nivel': 1, 'cantidad': -1 } }
        ]);
        
        const porNivel = {};
        distribucion.forEach(item => {
            const nivel = item._id.nivel || 'Sin nivel';
            if (!porNivel[nivel]) {
                porNivel[nivel] = {
                    nivel,
                    total: 0,
                    conCuadroDeMando: 0,
                    categorias: []
                };
            }
            porNivel[nivel].total += item.cantidad;
            porNivel[nivel].conCuadroDeMando += item.conCuadroDeMando;
            porNivel[nivel].categorias.push({
                categoria: item._id.categoria || 'Sin categoría',
                cantidad: item.cantidad,
                conCuadroDeMando: item.conCuadroDeMando
            });
        });
        
        return Object.values(porNivel);
    }
}

module.exports = new CompanyStatsService();