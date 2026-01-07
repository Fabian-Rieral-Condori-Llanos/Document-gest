const mongoose = require('mongoose');
const AuditVerification = require('../models/audit-verification.model');
const AuditStatus = require('../models/audit-status.model');

/**
 * AuditVerification Service
 * 
 * Lógica de negocio para el manejo de verificaciones de auditoría.
 */
class AuditVerificationService {
    /**
     * Obtiene todas las verificaciones
     */
    static async getAll(filters = {}) {
        const query = {};
        
        if (filters.auditId) {
            query.auditId = filters.auditId;
        }
        
        if (filters.result) {
            query.result = filters.result;
        }
        
        return await AuditVerification.find(query)
            .populate('auditId', 'name')
            .populate('statusId')
            .populate('verifiedBy', 'username firstname lastname')
            .populate('findings.verifiedBy', 'username firstname lastname')
            .sort({ createdAt: -1 });
    }

    /**
     * Obtiene una verificación por ID
     */
    static async getById(id) {
        const verification = await AuditVerification.findById(id)
            .populate('auditId', 'name language auditType findings')
            .populate('statusId')
            .populate('verifiedBy', 'username firstname lastname')
            .populate('findings.verifiedBy', 'username firstname lastname');
        
        if (!verification) {
            throw { fn: 'NotFound', message: 'Verification not found' };
        }
        
        return verification;
    }

    /**
     * Obtiene verificaciones de una auditoría
     */
    static async getByAuditId(auditId) {
        return await AuditVerification.find({ auditId })
            .populate('statusId')
            .populate('verifiedBy', 'username firstname lastname')
            .populate('findings.verifiedBy', 'username firstname lastname')
            .sort({ createdAt: -1 });
    }

    /**
     * Crea una nueva verificación
     */
    static async create(data, userId) {
        // Verificar que la auditoría existe
        const Audit = mongoose.model('Audit');
        const audit = await Audit.findById(data.auditId);
        
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found' };
        }
        
        // Obtener o crear el estado
        let status = await AuditStatus.findOne({ auditId: data.auditId });
        if (!status) {
            status = await AuditStatus.create({
                auditId: data.auditId,
                status: AuditStatus.STATUS.VERIFICACION,
                history: [{
                    status: AuditStatus.STATUS.VERIFICACION,
                    changedAt: new Date(),
                    changedBy: userId,
                    notes: 'Iniciando verificación'
                }]
            });
        } else {
            // Cambiar estado a verificación
            await status.changeStatus(AuditStatus.STATUS.VERIFICACION, userId, 'Iniciando verificación');
        }
        
        // Crear lista de findings a verificar
        const findingsToVerify = (audit.findings || []).map(f => ({
            findingId: f._id,
            title: f.title,
            originalStatus: f.status,
            verificationStatus: AuditVerification.VERIFICATION_STATUS.PENDIENTE
        }));
        
        const verificationData = {
            auditId: data.auditId,
            statusId: status._id,
            findings: data.findings || findingsToVerify,
            startDate: data.startDate || new Date(),
            result: AuditVerification.RESULT.EN_PROCESO,
            notes: data.notes,
            verifiedBy: userId
        };
        
        const verification = new AuditVerification(verificationData);
        await verification.save();
        
        return verification;
    }

    /**
     * Actualiza una verificación
     */
    static async update(id, data, userId) {
        const verification = await AuditVerification.findById(id);
        
        if (!verification) {
            throw { fn: 'NotFound', message: 'Verification not found' };
        }
        
        // Actualizar campos permitidos
        if (data.notes !== undefined) verification.notes = data.notes;
        if (data.endDate !== undefined) verification.endDate = data.endDate;
        if (data.result !== undefined) verification.result = data.result;
        
        await verification.save();
        
        // Si se completó, actualizar el estado de la auditoría
        if (data.result && data.result !== AuditVerification.RESULT.EN_PROCESO) {
            const newStatus = data.result === AuditVerification.RESULT.COMPLETADO 
                ? AuditStatus.STATUS.COMPLETADO 
                : AuditStatus.STATUS.PENDIENTE;
            
            const status = await AuditStatus.findById(verification.statusId);
            if (status) {
                await status.changeStatus(newStatus, userId, `Verificación ${data.result.toLowerCase()}`);
            }
        }
        
        return verification;
    }

    /**
     * Actualiza el estado de verificación de un finding
     */
    static async updateFinding(verificationId, findingId, data, userId) {
        const verification = await AuditVerification.findById(verificationId);
        
        if (!verification) {
            throw { fn: 'NotFound', message: 'Verification not found' };
        }
        
        const finding = verification.findings.id(findingId);
        
        if (!finding) {
            throw { fn: 'NotFound', message: 'Finding not found in verification' };
        }
        
        // Actualizar finding
        if (data.verificationStatus) {
            finding.verificationStatus = data.verificationStatus;
            finding.verifiedAt = new Date();
            finding.verifiedBy = userId;
        }
        if (data.notes !== undefined) finding.notes = data.notes;
        if (data.evidence !== undefined) finding.evidence = data.evidence;
        
        await verification.save();
        
        // Verificar si todos los findings están verificados
        const allVerified = verification.findings.every(f => 
            f.verificationStatus !== AuditVerification.VERIFICATION_STATUS.PENDIENTE
        );
        
        if (allVerified && verification.result === AuditVerification.RESULT.EN_PROCESO) {
            // Determinar resultado basado en los findings
            const hasNoVerificado = verification.findings.some(f => 
                f.verificationStatus === AuditVerification.VERIFICATION_STATUS.NO_VERIFICADO ||
                f.verificationStatus === AuditVerification.VERIFICATION_STATUS.PARCIAL
            );
            
            verification.result = hasNoVerificado 
                ? AuditVerification.RESULT.PENDIENTE 
                : AuditVerification.RESULT.COMPLETADO;
            verification.endDate = new Date();
            
            await verification.save();
            
            // Actualizar estado de auditoría
            const newStatus = verification.result === AuditVerification.RESULT.COMPLETADO 
                ? AuditStatus.STATUS.COMPLETADO 
                : AuditStatus.STATUS.PENDIENTE;
            
            const status = await AuditStatus.findById(verification.statusId);
            if (status) {
                await status.changeStatus(newStatus, userId, `Verificación ${verification.result.toLowerCase()}`);
            }
        }
        
        return verification;
    }

    /**
     * Agrega un finding a la verificación
     */
    static async addFinding(verificationId, findingData, userId) {
        const verification = await AuditVerification.findById(verificationId);
        
        if (!verification) {
            throw { fn: 'NotFound', message: 'Verification not found' };
        }
        
        verification.findings.push({
            findingId: findingData.findingId,
            title: findingData.title,
            originalStatus: findingData.originalStatus,
            verificationStatus: AuditVerification.VERIFICATION_STATUS.PENDIENTE
        });
        
        await verification.save();
        
        return verification;
    }

    /**
     * Elimina un finding de la verificación
     */
    static async removeFinding(verificationId, findingId) {
        const verification = await AuditVerification.findById(verificationId);
        
        if (!verification) {
            throw { fn: 'NotFound', message: 'Verification not found' };
        }
        
        verification.findings.pull({ _id: findingId });
        await verification.save();
        
        return verification;
    }

    /**
     * Finaliza una verificación
     */
    static async finalize(id, result, userId, notes = '') {
        const verification = await AuditVerification.findById(id);
        
        if (!verification) {
            throw { fn: 'NotFound', message: 'Verification not found' };
        }
        
        verification.result = result;
        verification.endDate = new Date();
        if (notes) verification.notes = notes;
        
        await verification.save();
        
        // Actualizar estado de auditoría
        const newStatus = result === AuditVerification.RESULT.COMPLETADO 
            ? AuditStatus.STATUS.COMPLETADO 
            : AuditStatus.STATUS.PENDIENTE;
        
        const status = await AuditStatus.findById(verification.statusId);
        if (status) {
            await status.changeStatus(newStatus, userId, `Verificación finalizada: ${result}`);
        }
        
        return verification;
    }

    /**
     * Elimina una verificación
     */
    static async delete(id) {
        const verification = await AuditVerification.findByIdAndDelete(id);
        
        if (!verification) {
            throw { fn: 'NotFound', message: 'Verification not found' };
        }
        
        return verification;
    }

    /**
     * Obtiene estadísticas de verificaciones
     */
    static async getStats(auditId = null) {
        const match = auditId ? { auditId: mongoose.Types.ObjectId(auditId) } : {};
        
        const stats = await AuditVerification.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$result',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const result = {
            total: 0,
            byResult: {}
        };
        
        stats.forEach(s => {
            result.byResult[s._id] = s.count;
            result.total += s.count;
        });
        
        return result;
    }
}

module.exports = AuditVerificationService;