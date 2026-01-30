const mongoose = require('mongoose');
const ReportInstance = require('../models/report-instance.model');
const ReportTemplate = require('../models/report-template.model');
const Audit = require('../models/audit.model');
const collaborationService = require('./collaboration.service');

/**
 * ReportInstanceService
 * 
 * Servicio para gestión de instancias de reportes.
 * Una instancia es una copia de una plantilla asociada a una auditoría específica.
 */
class ReportInstanceService {

    /**
     * Obtiene la instancia de reporte de una auditoría
     * NOTA: Ahora puede haber múltiples, este método retorna el primero (para retrocompatibilidad)
     * @param {string} auditId
     */
    static async getByAuditId(auditId) {
        const instance = await ReportInstance.findOne({ auditId })
            .populate('templateId', 'name category version')
            .populate('createdBy', 'username firstname lastname')
            .populate('lastModifiedBy', 'username firstname lastname');

        return instance;
    }

    /**
     * Obtiene todas las instancias de reporte de una auditoría
     * @param {string} auditId
     */
    static async getAllByAuditId(auditId) {
        const instances = await ReportInstance.find({ auditId })
            .populate('templateId', 'name category version')
            .populate('createdBy', 'username firstname lastname')
            .populate('lastModifiedBy', 'username firstname lastname')
            .sort({ createdAt: -1 });

        return instances;
    }

    /**
     * Obtiene una instancia por ID
     * @param {string} id
     */
    static async getById(id) {
        const instance = await ReportInstance.findById(id)
            .populate('templateId', 'name category version styles')
            .populate('auditId')
            .populate('createdBy', 'username firstname lastname')
            .populate('lastModifiedBy', 'username firstname lastname');

        if (!instance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        return instance;
    }

    /**
     * Crea una instancia de reporte para una auditoría
     * REQUIERE: Auditoría debe estar en estado APPROVED
     * PERMITE: Múltiples reportes por auditoría (con diferentes templates)
     * 
     * @param {string} auditId
     * @param {string} templateId
     * @param {string} userId
     */
    static async create(auditId, templateId, userId) {
        // Obtener la auditoría primero para validaciones
        const audit = await Audit.findById(auditId)
            .populate('company')
            .populate('client')
            .populate('creator', 'username firstname lastname email phone')
            .populate('collaborators', 'username firstname lastname email phone jobTitle');

        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found' };
        }

        // VALIDACIÓN: La auditoría debe estar APPROVED
        if (audit.state !== 'APPROVED') {
            throw { 
                fn: 'Forbidden', 
                message: 'Audit must be APPROVED before creating reports. Current state: ' + audit.state 
            };
        }

        // Verificar que no exista ya una instancia con este template para esta auditoría
        const existing = await ReportInstance.findOne({ auditId, templateId });
        if (existing) {
            throw { 
                fn: 'BadParameters', 
                message: 'A report with this template already exists for this audit' 
            };
        }

        // Obtener la plantilla
        const template = await ReportTemplate.findById(templateId);
        if (!template) {
            throw { fn: 'NotFound', message: 'Report template not found' };
        }

        if (!template.isActive) {
            throw { fn: 'BadParameters', message: 'Template is not active' };
        }

        // Crear la instancia con copia del contenido del template
        const instance = new ReportInstance({
            auditId,
            templateId,
            name: `${template.name} - ${audit.name}`,
            content: JSON.parse(JSON.stringify(template.content)), // Deep copy
            styles: JSON.parse(JSON.stringify(template.styles || {})),
            header: template.header ? JSON.parse(JSON.stringify(template.header)) : null,
            footer: template.footer ? JSON.parse(JSON.stringify(template.footer)) : null,
            coverPage: template.coverPage ? JSON.parse(JSON.stringify(template.coverPage)) : null,
            status: ReportInstance.STATUS.DRAFT,
            createdBy: userId
        });

        // Inyectar datos iniciales
        instance.injectedData = this._extractAuditData(audit);

        await instance.save();

        console.log(`[ReportInstance] Created report instance ${instance._id} for audit ${auditId}`);

        return instance;
    }

    /**
     * Extrae los datos de la auditoría para inyección
     * @private
     */
    static _extractAuditData(audit) {
        // Calcular estadísticas de findings
        const stats = this._calculateStats(audit.findings || []);

        return {
            audit: {
                name: audit.name,
                auditType: audit.auditType,
                date: audit.date,
                date_start: audit.date_start,
                date_end: audit.date_end,
                summary: audit.summary,
                language: audit.language,
                state: audit.state,
                type: audit.type
            },
            client: audit.client ? {
                name: audit.client.name,
                lastname: audit.client.lastname,
                email: audit.client.email,
                phone: audit.client.phone,
                cell: audit.client.cell,
                title: audit.client.title,
                logo: audit.client.logo
            } : null,
            company: audit.company ? {
                name: audit.company.name,
                shortName: audit.company.shortName,
                logo: audit.company.logo
            } : null,
            creator: audit.creator ? {
                username: audit.creator.username,
                firstname: audit.creator.firstname,
                lastname: audit.creator.lastname,
                email: audit.creator.email,
                phone: audit.creator.phone
            } : null,
            collaborators: (audit.collaborators || []).map(c => ({
                username: c.username,
                firstname: c.firstname,
                lastname: c.lastname,
                email: c.email,
                phone: c.phone,
                jobTitle: c.jobTitle
            })),
            scope: audit.scope || [],
            findings: (audit.findings || []).map(f => ({
                identifier: f.identifier,
                title: f.title,
                vulnType: f.vulnType,
                description: f.description,
                observation: f.observation,
                remediation: f.remediation,
                remediationComplexity: f.remediationComplexity,
                priority: f.priority,
                cvssv3: f.cvssv3,
                cvssv4: f.cvssv4,
                cvssScore: this._extractCvssScore(f.cvssv3),
                severity: this._getSeverityFromCvss(f.cvssv3),
                references: f.references || [],
                poc: f.poc,
                scope: f.scope,
                status: f.status,
                category: f.category,
                retestStatus: f.retestStatus,
                retestDescription: f.retestDescription,
                paragraphs: f.paragraphs || []
            })),
            sections: (audit.sections || []).map(s => ({
                field: s.field,
                name: s.name,
                text: s.text
            })),
            stats,
            document: {
                date: new Date().toISOString().split('T')[0],
                version: '1.0'
            },
            snapshotAt: new Date()
        };
    }

    /**
     * Calcula estadísticas de findings
     * @private
     */
    static _calculateStats(findings) {
        const stats = {
            total: findings.length,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
            byCategory: {},
            byType: {}
        };

        findings.forEach(f => {
            const severity = this._getSeverityFromCvss(f.cvssv3);
            
            switch (severity) {
                case 'Crítica': stats.critical++; break;
                case 'Alta': stats.high++; break;
                case 'Media': stats.medium++; break;
                case 'Baja': stats.low++; break;
                case 'Informativa': stats.info++; break;
            }

            // Por categoría
            if (f.category) {
                stats.byCategory[f.category] = (stats.byCategory[f.category] || 0) + 1;
            }

            // Por tipo
            if (f.vulnType) {
                stats.byType[f.vulnType] = (stats.byType[f.vulnType] || 0) + 1;
            }
        });

        // Calcular puntuación de riesgo promedio
        const scores = findings
            .map(f => this._extractCvssScore(f.cvssv3))
            .filter(s => s !== null);
        
        stats.riskScore = scores.length > 0 
            ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
            : 0;

        return stats;
    }

    /**
     * Extrae el score numérico de un vector CVSS
     * @private
     */
    static _extractCvssScore(cvssVector) {
        if (!cvssVector) return null;
        
        // Intentar calcular el score (simplificado)
        // En producción usar una librería como ae-cvss-calculator
        try {
            const cvssCalc = require('ae-cvss-calculator');
            const result = cvssCalc.calculateCVSSv3(cvssVector);
            return result.base ? parseFloat(result.base) : null;
        } catch (err) {
            // Fallback: extraer de forma básica si el vector incluye el score
            const match = cvssVector.match(/\/(\d+\.?\d*)/);
            return match ? parseFloat(match[1]) : null;
        }
    }

    /**
     * Obtiene la severidad basada en el score CVSS
     * @private
     */
    static _getSeverityFromCvss(cvssVector) {
        const score = this._extractCvssScore(cvssVector);
        
        if (score === null) return 'Informativa';
        if (score >= 9.0) return 'Crítica';
        if (score >= 7.0) return 'Alta';
        if (score >= 4.0) return 'Media';
        if (score >= 0.1) return 'Baja';
        return 'Informativa';
    }

    /**
     * Actualiza los datos inyectados (refresca desde la auditoría)
     * @param {string} instanceId
     * @param {string} userId
     */
    static async refreshInjectedData(instanceId, userId) {
        const instance = await ReportInstance.findById(instanceId);
        if (!instance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        const audit = await Audit.findById(instance.auditId)
            .populate('company')
            .populate('client')
            .populate('creator', 'username firstname lastname email phone')
            .populate('collaborators', 'username firstname lastname email phone jobTitle');

        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found' };
        }

        instance.injectedData = this._extractAuditData(audit);
        instance.lastModifiedBy = userId;
        
        await instance.save();

        return instance;
    }

    /**
     * Actualiza el contenido del reporte
     * @param {string} instanceId
     * @param {Object} content
     * @param {string} userId
     */
    static async updateContent(instanceId, content, userId) {
        const instance = await ReportInstance.findById(instanceId);
        if (!instance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        instance.content = content;
        instance.lastModifiedBy = userId;

        await instance.save();

        return { success: true, version: instance.currentVersion };
    }

    /**
     * Guarda una versión del reporte
     * @param {string} instanceId
     * @param {string} userId
     * @param {string} comment
     */
    static async saveVersion(instanceId, userId, comment = '') {
        const instance = await ReportInstance.findById(instanceId);
        if (!instance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        instance.saveVersion(userId, comment);
        await instance.save();

        return {
            success: true,
            version: instance.currentVersion,
            historyCount: instance.versionHistory.length
        };
    }

    /**
     * Restaura una versión anterior
     * @param {string} instanceId
     * @param {number} versionNumber
     * @param {string} userId
     */
    static async restoreVersion(instanceId, versionNumber, userId) {
        const instance = await ReportInstance.findById(instanceId);
        if (!instance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        instance.restoreVersion(versionNumber, userId);
        await instance.save();

        return {
            success: true,
            restoredVersion: versionNumber,
            currentVersion: instance.currentVersion
        };
    }

    /**
     * Obtiene el historial de versiones
     * @param {string} instanceId
     */
    static async getVersionHistory(instanceId) {
        const instance = await ReportInstance.findById(instanceId)
            .select('versionHistory currentVersion')
            .populate('versionHistory.savedBy', 'username firstname lastname');

        if (!instance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        return {
            currentVersion: instance.currentVersion,
            history: instance.versionHistory.map(v => ({
                version: v.version,
                savedBy: v.savedBy,
                savedAt: v.savedAt,
                comment: v.comment,
                contentSize: v.contentSize
            }))
        };
    }

    /**
     * Actualiza el estado del reporte
     * @param {string} instanceId
     * @param {string} status
     * @param {string} userId
     */
    static async updateStatus(instanceId, status, userId) {
        const validStatuses = Object.values(ReportInstance.STATUS);
        if (!validStatuses.includes(status)) {
            throw { fn: 'BadParameters', message: 'Invalid status' };
        }

        const instance = await ReportInstance.findById(instanceId);
        if (!instance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        instance.status = status;
        instance.lastModifiedBy = userId;

        await instance.save();

        return instance;
    }

    /**
     * Bloquea el reporte para edición exclusiva
     * @param {string} instanceId
     * @param {string} userId
     */
    static async lock(instanceId, userId) {
        const instance = await ReportInstance.findById(instanceId);
        if (!instance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        if (instance.lockedBy && instance.lockedBy.toString() !== userId) {
            throw { fn: 'Forbidden', message: 'Report is locked by another user' };
        }

        instance.lockedBy = userId;
        instance.lockedAt = new Date();

        await instance.save();

        return { locked: true, lockedBy: userId };
    }

    /**
     * Desbloquea el reporte
     * @param {string} instanceId
     * @param {string} userId
     * @param {boolean} isAdmin
     */
    static async unlock(instanceId, userId, isAdmin = false) {
        const instance = await ReportInstance.findById(instanceId);
        if (!instance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        if (instance.lockedBy && instance.lockedBy.toString() !== userId && !isAdmin) {
            throw { fn: 'Forbidden', message: 'Only the user who locked or admin can unlock' };
        }

        instance.lockedBy = null;
        instance.lockedAt = null;

        await instance.save();

        return { locked: false };
    }

    /**
     * Elimina la instancia de reporte
     * @param {string} instanceId
     */
    static async delete(instanceId) {
        const instance = await ReportInstance.findById(instanceId);
        if (!instance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        // Limpiar colaboración si está activa
        await collaborationService.cleanup(instanceId);

        await ReportInstance.findByIdAndDelete(instanceId);

        return { message: 'Report instance deleted successfully' };
    }

    /**
     * Obtiene colaboradores activos de un reporte
     * @param {string} instanceId
     */
    static getActiveCollaborators(instanceId) {
        return collaborationService.getCollaborators(instanceId);
    }
}

module.exports = ReportInstanceService;