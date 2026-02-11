const Audit = require('../../models/audit.model');
const AuditProcedure = require('../../models/audit-procedure.model');
const AuditStatus = require('../../models/audit-status.model');
const Company = require('../../models/company.model');
const baseService = require('./base.service');

/**
 * AuditDashboardService
 * 
 * Servicio para dashboard de auditorías individuales.
 * Incluye estadísticas detalladas de una auditoría específica.
 */
class AuditDashboardService {
    
    /**
     * Obtener dashboard completo de una auditoría
     * @param {ObjectId|String} auditId 
     * @returns {Promise<Object>}
     */
    async getAuditDashboard(auditId) {
        const audit = await Audit.findById(auditId)
            .populate('company', 'name shortName logo cuadroDeMando')
            .populate('creator', 'username firstname lastname')
            .populate('collaborators', 'username firstname lastname');
        
        if (!audit) {
            throw new Error('Audit not found');
        }
        
        // Obtener datos relacionados
        const [procedure, status] = await Promise.all([
            AuditProcedure.findOne({ auditId }),
            AuditStatus.findOne({ auditId })
        ]);
        
        // Analizar vulnerabilidades
        const vulnAnalysis = baseService.analyzeFindings(audit.findings || []);
        
        // Calcular tiempo de evaluación
        const tiempoEvaluacion = this._calcularTiempoAudit(audit);
        
        // Agrupar findings
        const findingsPorCategoria = baseService.groupFindingsByCategory(audit.findings || []);
        const findingsPorSeccion = this._groupFindingsBySection(audit);
        
        // Obtener colores
        const cvssColors = await baseService.getCVSSColors();
        
        return {
            audit: {
                id: audit._id,
                name: audit.name,
                auditType: audit.auditType,
                state: audit.state,
                status: status?.status || 'Sin estado',
                language: audit.language,
                dateStart: audit.date_start,
                dateEnd: audit.date_end,
                createdAt: audit.createdAt,
                updatedAt: audit.updatedAt
            },
            company: audit.company ? {
                id: audit.company._id,
                name: audit.company.name,
                shortName: audit.company.shortName,
                logo: audit.company.logo,
                cuadroDeMando: audit.company.cuadroDeMando
            } : null,
            creator: audit.creator ? {
                id: audit.creator._id,
                username: audit.creator.username,
                fullName: `${audit.creator.firstname || ''} ${audit.creator.lastname || ''}`.trim()
            } : null,
            collaborators: (audit.collaborators || []).map(c => ({
                id: c._id,
                username: c.username,
                fullName: `${c.firstname || ''} ${c.lastname || ''}`.trim()
            })),
            procedure: procedure ? {
                origen: procedure.origen,
                alcance: procedure.alcance,
                alcanceDescripcion: procedure.alcanceDescripcion,
                documentacion: {
                    solicitud: procedure.solicitud,
                    instructivo: procedure.instructivo,
                    informe: procedure.informe,
                    respuesta: procedure.respuesta,
                    notaExterna: procedure.notaExterna,
                    notaInterna: procedure.notaInterna
                },
                retest: {
                    notaRetest: procedure.notaRetest,
                    informeRetest: procedure.informeRetest,
                    respuestaRetest: procedure.respuestaRetest,
                    notaInternaRetest: procedure.notaInternaRetest
                }
            } : null,
            stats: {
                totalFindings: vulnAnalysis.total,
                tiempoEvaluacionDias: tiempoEvaluacion,
                porcentajeCompletado: this._calcularPorcentajeCompletado(audit, procedure),
                ...vulnAnalysis
            },
            vulnerabilidadesPorSeveridad: [
                { name: 'Crítica', value: vulnAnalysis.criticas, color: cvssColors.criticalColor },
                { name: 'Alta', value: vulnAnalysis.altas, color: cvssColors.highColor },
                { name: 'Media', value: vulnAnalysis.medias, color: cvssColors.mediumColor },
                { name: 'Baja', value: vulnAnalysis.bajas, color: cvssColors.lowColor },
                { name: 'Info', value: vulnAnalysis.info, color: cvssColors.noneColor }
            ],
            estadoVerificacion: [
                { name: 'Remediadas', value: vulnAnalysis.remediadas, color: '#22c55e' },
                { name: 'No Remediadas', value: vulnAnalysis.noRemediadas, color: '#ef4444' },
                { name: 'Parciales', value: vulnAnalysis.parciales, color: '#f59e0b' },
                { name: 'Sin Verificar', value: vulnAnalysis.sinVerificar, color: '#6b7280' }
            ],
            findingsPorCategoria,
            findingsPorSeccion,
            findings: (audit.findings || []).map(f => ({
                id: f._id,
                title: f.title,
                severity: baseService.getSeverityLabel(f.cvssv3 || f.cvssv4),
                cvssScore: baseService.extractCVSSScore(f.cvssv3 || f.cvssv4),
                retestStatus: f.retestStatus || 'unknown',
                retestStatusLabel: baseService.getRetestStatusLabel(f.retestStatus),
                category: f.vulnType || 'Sin categoría'
            }))
        };
    }
    
    /**
     * Verificar si un usuario puede acceder a una auditoría
     * (basado en la compañía de la auditoría)
     * @param {ObjectId|String} auditId 
     * @returns {Promise<ObjectId|null>} Company ID o null si no existe
     */
    async getAuditCompanyId(auditId) {
        const audit = await Audit.findById(auditId).select('company');
        return audit?.company || null;
    }
    
    /**
     * Calcular tiempo de evaluación de una auditoría
     * @private
     */
    _calcularTiempoAudit(audit) {
        if (!audit.date_start) {
            return baseService.calcularDias(audit.createdAt, new Date());
        }
        
        const endDate = audit.date_end || new Date();
        return baseService.calcularDias(audit.date_start, endDate);
    }
    
    /**
     * Calcular porcentaje de completado
     * @private
     */
    _calcularPorcentajeCompletado(audit, procedure) {
        let total = 0;
        let completados = 0;
        
        // Verificar campos de procedimiento
        if (procedure) {
            const camposEvaluacion = [
                'solicitud', 'instructivo', 'informe', 'respuesta'
            ];
            
            camposEvaluacion.forEach(campo => {
                total++;
                if (procedure[campo] && 
                    (procedure[campo].cite || procedure[campo].fecha)) {
                    completados++;
                }
            });
        }
        
        // Verificar estado de auditoría
        total++;
        if (audit.state === 'APPROVED') {
            completados++;
        }
        
        // Verificar findings
        if (audit.findings && audit.findings.length > 0) {
            total++;
            completados++;
        }
        
        return total > 0 ? Math.round((completados / total) * 100) : 0;
    }
    
    /**
     * Agrupar findings por sección
     * @private
     */
    _groupFindingsBySection(audit) {
        const sections = audit.sections || [];
        const findings = audit.findings || [];
        
        return sections.map(section => {
            const sectionFindings = findings.filter(f => 
                section.customFields?.some(cf => 
                    cf.customField?.toString() === f._id?.toString()
                )
            );
            
            const analysis = baseService.analyzeFindings(sectionFindings);
            
            return {
                name: section.name || 'Sin nombre',
                field: section.field || '',
                totalFindings: sectionFindings.length,
                ...analysis
            };
        });
    }
    
    /**
     * Obtener resumen rápido de una auditoría
     * @param {ObjectId|String} auditId 
     * @returns {Promise<Object>}
     */
    async getAuditSummary(auditId) {
        const audit = await Audit.findById(auditId)
            .populate('company', 'name shortName')
            .select('name auditType state findings createdAt');
        
        if (!audit) {
            return null;
        }
        
        const status = await AuditStatus.findOne({ auditId }).select('status');
        const vulnAnalysis = baseService.analyzeFindings(audit.findings || []);
        
        return {
            id: audit._id,
            name: audit.name,
            company: audit.company?.name || audit.company?.shortName || 'Sin compañía',
            companyId: audit.company?._id,
            auditType: audit.auditType,
            state: audit.state,
            status: status?.status || 'Sin estado',
            createdAt: baseService.formatDate(audit.createdAt),
            stats: {
                total: vulnAnalysis.total,
                criticas: vulnAnalysis.criticas,
                altas: vulnAnalysis.altas,
                remediadas: vulnAnalysis.remediadas,
                tasaRemediacion: vulnAnalysis.tasaRemediacion
            }
        };
    }
}

module.exports = new AuditDashboardService();
