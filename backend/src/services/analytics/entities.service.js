const Audit = require('../../models/audit.model');
const Company = require('../../models/company.model');
const Client = require('../../models/client.model');
const AuditProcedure = require('../../models/audit-procedure.model');
const AuditStatus = require('../../models/audit-status.model');
const baseService = require('./base.service');

/**
 * EntitiesService
 * 
 * Servicio para gestión de entidades (compañías) en analytics.
 * Incluye listados, rankings y detalles de entidades evaluadas.
 */
class EntitiesService {
    
    /**
     * Obtener entidades evaluadas con estadísticas
     * @param {Object} filter - Filtro de MongoDB
     * @returns {Promise<Array>}
     */
    async getEntidadesEvaluadas(filter) {
        const results = await Audit.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'companies',
                    localField: 'company',
                    foreignField: '_id',
                    as: 'companyInfo'
                }
            },
            { $unwind: { path: '$companyInfo', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'auditstatus',
                    localField: '_id',
                    foreignField: 'auditId',
                    as: 'statusInfo'
                }
            },
            { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    company: 1,
                    companyName: '$companyInfo.name',
                    companyShortName: '$companyInfo.shortName',
                    cuadroDeMando: '$companyInfo.cuadroDeMando',
                    state: 1,
                    status: '$statusInfo.status',
                    createdAt: 1,
                    findings: 1
                }
            },
            {
                $group: {
                    _id: '$company',
                    nombre: { $first: '$companyName' },
                    nombreCorto: { $first: '$companyShortName' },
                    cuadroDeMando: { $first: '$cuadroDeMando' },
                    evaluaciones: { $sum: 1 },
                    ultimaEval: { $max: '$createdAt' },
                    ultimoEstado: { $last: '$status' },
                    estado: { $last: '$state' },
                    allFindings: { $push: '$findings' }
                }
            },
            { $sort: { evaluaciones: -1 } }
        ]);
        
        // Enriquecer con progreso de verificación
        const entidadesConProgreso = results.map((item, index) => {
            let vulnCriticas = 0, vulnAltas = 0, totalVulns = 0;
            let remediadas = 0, noRemediadas = 0, parciales = 0, sinVerificar = 0;
            
            item.allFindings.forEach(findings => {
                if (findings && Array.isArray(findings)) {
                    findings.forEach(f => {
                        totalVulns++;
                        const score = baseService.extractCVSSScore(f.cvssv3 || f.cvssv4);
                        if (score >= 9.0) vulnCriticas++;
                        else if (score >= 7.0) vulnAltas++;
                        
                        switch (f.retestStatus) {
                            case 'ok': remediadas++; break;
                            case 'ko': noRemediadas++; break;
                            case 'partial': parciales++; break;
                            default: sinVerificar++; break;
                        }
                    });
                }
            });
            
            const tasaRemediacion = totalVulns > 0 
                ? Math.round((remediadas / totalVulns) * 100)
                : 0;
            
            return {
                id: index + 1,
                nombre: item.nombre || item.nombreCorto || 'Sin nombre',
                nombreCorto: item.nombreCorto || '',
                idEntidad: item._id,
                cuadroDeMando: item.cuadroDeMando || false,
                evaluaciones: item.evaluaciones,
                vulnCriticas,
                vulnAltas,
                totalVulnerabilidades: totalVulns,
                remediadas,
                noRemediadas,
                parciales,
                sinVerificar,
                estado: item.ultimoEstado || item.estado || 'Sin estado',
                ultimaEval: baseService.formatDate(item.ultimaEval) || 'N/A',
                tasaRemediacion
            };
        });
        
        return entidadesConProgreso;
    }
    
    /**
     * Obtener top entidades con vulnerabilidades críticas
     * @param {Object} filters - Filtros { year, startDate, endDate, limit, prioritizeCuadroDeMando }
     * @param {Object} permissionFilter - Filtro de permisos
     * @returns {Promise<Object>}
     */
    async getTopEntidadesCriticas(filters = {}, permissionFilter = {}) {
        const { year, startDate, endDate, limit = 10, prioritizeCuadroDeMando = false } = filters;
        const dateFilter = baseService.buildDateFilter(startDate, endDate, year);
        const matchFilter = baseService.mergeFilters(
            { createdAt: dateFilter },
            permissionFilter
        );
        
        // Obtener auditorías con findings
        const audits = await Audit.find(matchFilter)
            .populate('company', 'name shortName logo cuadroDeMando nivelDeMadurez nivel categoria')
            .select('company findings createdAt');
        
        // Agrupar por empresa
        const empresaMap = {};
        
        audits.forEach(audit => {
            if (!audit.company) return;
            
            const companyId = audit.company._id.toString();
            
            if (!empresaMap[companyId]) {
                empresaMap[companyId] = {
                    companyId: audit.company._id,
                    nombre: audit.company.name || audit.company.shortName || 'Sin nombre',
                    nombreCorto: audit.company.shortName || '',
                    logo: audit.company.logo,
                    cuadroDeMando: audit.company.cuadroDeMando || false,
                    nivelMadurez: parseInt(audit.company.nivelDeMadurez) || 0,
                    nivelOrganizacional: audit.company.nivel,
                    categoria: audit.company.categoria,
                    totalAuditorias: 0,
                    totalVulnerabilidades: 0,
                    criticas: 0,
                    criticasActivas: 0,
                    criticasRemediadas: 0,
                    criticasParciales: 0,
                    criticasSinVerificar: 0,
                    altas: 0,
                    altasActivas: 0,
                    altasRemediadas: 0,
                    medias: 0,
                    bajas: 0,
                    info: 0,
                    remediadas: 0,
                    noRemediadas: 0,
                    parciales: 0,
                    sinVerificar: 0,
                    ultimaAuditoria: null
                };
            }
            
            empresaMap[companyId].totalAuditorias++;
            
            if (!empresaMap[companyId].ultimaAuditoria || 
                audit.createdAt > empresaMap[companyId].ultimaAuditoria) {
                empresaMap[companyId].ultimaAuditoria = audit.createdAt;
            }
            
            // Analizar findings
            (audit.findings || []).forEach(finding => {
                empresaMap[companyId].totalVulnerabilidades++;
                
                const score = baseService.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                const retestStatus = finding.retestStatus || 'unknown';
                
                if (score >= 9.0) {
                    empresaMap[companyId].criticas++;
                    switch (retestStatus) {
                        case 'ok':
                            empresaMap[companyId].criticasRemediadas++;
                            break;
                        case 'ko':
                            empresaMap[companyId].criticasActivas++;
                            break;
                        case 'partial':
                            empresaMap[companyId].criticasParciales++;
                            break;
                        default:
                            empresaMap[companyId].criticasSinVerificar++;
                            empresaMap[companyId].criticasActivas++;
                            break;
                    }
                } else if (score >= 7.0) {
                    empresaMap[companyId].altas++;
                    switch (retestStatus) {
                        case 'ok':
                            empresaMap[companyId].altasRemediadas++;
                            break;
                        default:
                            empresaMap[companyId].altasActivas++;
                            break;
                    }
                } else if (score >= 4.0) {
                    empresaMap[companyId].medias++;
                } else if (score > 0) {
                    empresaMap[companyId].bajas++;
                } else {
                    empresaMap[companyId].info++;
                }
                
                switch (retestStatus) {
                    case 'ok': empresaMap[companyId].remediadas++; break;
                    case 'ko': empresaMap[companyId].noRemediadas++; break;
                    case 'partial': empresaMap[companyId].parciales++; break;
                    default: empresaMap[companyId].sinVerificar++; break;
                }
            });
        });
        
        // Convertir a array y ordenar
        const ranking = Object.values(empresaMap)
            .map(empresa => ({
                ...empresa,
                tasaRemediacionCriticas: empresa.criticas > 0 
                    ? Math.round((empresa.criticasRemediadas / empresa.criticas) * 100) 
                    : 100,
                tasaRemediacionGeneral: empresa.totalVulnerabilidades > 0
                    ? Math.round((empresa.remediadas / empresa.totalVulnerabilidades) * 100)
                    : 100,
                riesgo: baseService.calcularNivelRiesgo(empresa),
                ultimaAuditoria: baseService.formatDate(empresa.ultimaAuditoria)
            }))
            .sort((a, b) => {
                // Si prioritizeCuadroDeMando está activo, primero las de cuadroDeMando
                if (prioritizeCuadroDeMando) {
                    if (a.cuadroDeMando && !b.cuadroDeMando) return -1;
                    if (!a.cuadroDeMando && b.cuadroDeMando) return 1;
                }
                
                // Luego ordenar por criticidad
                if (b.criticasActivas !== a.criticasActivas) {
                    return b.criticasActivas - a.criticasActivas;
                }
                return b.altasActivas - a.altasActivas;
            })
            .slice(0, limit);
        
        // Calcular totales
        const totales = ranking.reduce((acc, e) => ({
            totalEmpresas: acc.totalEmpresas + 1,
            totalCriticas: acc.totalCriticas + e.criticas,
            totalCriticasActivas: acc.totalCriticasActivas + e.criticasActivas,
            totalCriticasRemediadas: acc.totalCriticasRemediadas + e.criticasRemediadas,
            totalAltas: acc.totalAltas + e.altas,
            totalAltasActivas: acc.totalAltasActivas + e.altasActivas,
            totalVulnerabilidades: acc.totalVulnerabilidades + e.totalVulnerabilidades,
            totalRemediadas: acc.totalRemediadas + e.remediadas
        }), {
            totalEmpresas: 0,
            totalCriticas: 0,
            totalCriticasActivas: 0,
            totalCriticasRemediadas: 0,
            totalAltas: 0,
            totalAltasActivas: 0,
            totalVulnerabilidades: 0,
            totalRemediadas: 0
        });
        
        return {
            period: {
                year: baseService.getYear(year),
                startDate: dateFilter.$gte,
                endDate: dateFilter.$lte
            },
            resumen: {
                ...totales,
                tasaRemediacionCriticas: totales.totalCriticas > 0
                    ? Math.round((totales.totalCriticasRemediadas / totales.totalCriticas) * 100)
                    : 100,
                tasaRemediacionGeneral: totales.totalVulnerabilidades > 0
                    ? Math.round((totales.totalRemediadas / totales.totalVulnerabilidades) * 100)
                    : 100
            },
            entidades: ranking
        };
    }
    
    /**
     * Obtener información de una compañía
     * @param {ObjectId|String} companyId 
     * @returns {Promise<Object>}
     */
    async getCompanyInfo(companyId) {
        const company = await Company.findById(companyId)
            .select('name shortName logo cuadroDeMando nivel categoria status');
        
        if (!company) {
            return null;
        }
        
        return {
            id: company._id,
            name: company.name,
            shortName: company.shortName,
            logo: company.logo,
            cuadroDeMando: company.cuadroDeMando,
            nivel: company.nivel,
            categoria: company.categoria,
            status: company.status
        };
    }
    
    /**
     * Obtener clientes asociados a una compañía
     * @param {ObjectId|String} companyId 
     * @returns {Promise<Array>}
     */
    async getClientesAsociados(companyId) {
        const clients = await Client.find({ company: companyId })
            .select('firstname lastname email phone');
        
        return clients.map(client => ({
            id: client._id,
            nombre: `${client.firstname} ${client.lastname}`,
            email: client.email,
            phone: client.phone
        }));
    }
    
    /**
     * Obtener evaluaciones recientes (global)
     * @param {Object} filter 
     * @param {Number} limit 
     * @returns {Promise<Array>}
     */
    async getEvaluacionesRecientes(filter, limit = 50) {
        const audits = await Audit.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('company', 'name shortName')
            .select('name createdAt company auditType');
        
        const evaluaciones = await Promise.all(
            audits.map(async (audit) => {
                const procedure = await AuditProcedure.findOne({ auditId: audit._id });
                const status = await AuditStatus.findOne({ auditId: audit._id })
                    .select('status');
                
                return {
                    id: audit._id,
                    companyId: audit.company?._id || null,
                    entidad: audit.company?.name || audit.company?.shortName || 'Sin entidad',
                    tipoAudit: audit.auditType || 'Sin tipo',
                    estado: status?.status || 'Sin estado',
                    fechaInicio: baseService.formatDate(audit.createdAt),
                    procedimiento: procedure ? {
                        origen: procedure.origen,
                        alcance: procedure.alcance,
                        alcanceDescripcion: procedure.alcanceDescripcion,
                        documentacionEvaluacion: {
                            solicitud: procedure.solicitud,
                            instructivo: procedure.instructivo,
                            informe: procedure.informe,
                            respuesta: procedure.respuesta,
                            notaExterna: procedure.notaExterna,
                            notaInterna: procedure.notaInterna
                        },
                        documentacionRetest: {
                            notaRetest: procedure.notaRetest,
                            informeRetest: procedure.informeRetest,
                            respuestaRetest: procedure.respuestaRetest,
                            notaInternaRetest: procedure.notaInternaRetest
                        }
                    } : null
                };
            })
        );
        
        return evaluaciones;
    }
    
    /**
     * Obtener evaluaciones recientes de una compañía
     * @param {ObjectId|String} companyId 
     * @param {Number} limit 
     * @returns {Promise<Array>}
     */
    async getEvaluacionesRecientesCompany(companyId, limit = 50) {
        return this.getEvaluacionesRecientes({ company: companyId }, limit);
    }
    
    /**
     * Obtener alertas activas
     * @param {Object} filter 
     * @returns {Promise<Array>}
     */
    async getAlertasActivas(filter) {
        const globalStatsService = require('./global-stats.service');
        const vulnStats = await globalStatsService.countVulnerabilities(filter);
        const alertas = [];
        
        if (vulnStats.criticas > 0) {
            alertas.push({
                tipo: 'critica',
                mensaje: `${vulnStats.criticas} vulnerabilidades críticas sin mitigar detectadas`,
                fecha: baseService.formatDate(new Date())
            });
        }
        
        if (vulnStats.altas > 50) {
            alertas.push({
                tipo: 'alta',
                mensaje: `${vulnStats.altas} vulnerabilidades de severidad alta requieren atención`,
                fecha: baseService.formatDate(new Date())
            });
        }
        
        // Verificar evaluaciones atrasadas
        const atrasadas = await Audit.countDocuments({
            ...filter,
            date_end: { $lt: new Date() },
            state: 'EDIT'
        });
        
        if (atrasadas > 0) {
            alertas.push({
                tipo: 'media',
                mensaje: `${atrasadas} evaluaciones con fecha de finalización vencida`,
                fecha: baseService.formatDate(new Date())
            });
        }
        
        return alertas;
    }
}

module.exports = new EntitiesService();