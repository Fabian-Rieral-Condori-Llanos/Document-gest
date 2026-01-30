const mongoose = require('mongoose');
const AuditProcedure = require('../models/audit-procedure.model');
const AuditStatus = require('../models/audit-status.model');

/**
 * AuditProcedure Service
 * 
 * Lógica de negocio para el manejo de procedimientos de auditoría.
 * 
 * CAMBIO AUTOMÁTICO A COMPLETADO:
 * ===============================
 * El estado de AuditStatus cambia automáticamente a COMPLETADO cuando:
 * 
 * 1. Para EVALUACIONES (type: default, multi):
 *    - Se llena el campo respuesta.cite
 * 
 * 2. Para VERIFICACIONES (type: verification, retest):
 *    - Se llena el campo respuestaRetest.cite
 * 
 * El sistema detecta automáticamente el tipo de auditoría basándose en:
 * - El campo audit.type
 * - El alcance (si incluye "verificación" o "retest")
 */
class AuditProcedureService {
    /**
     * Verifica si la auditoría debe marcarse como COMPLETADA
     * y actualiza el estado automáticamente
     * 
     * @private
     * @param {Object} procedure - Documento de AuditProcedure
     * @param {string} userId - ID del usuario que hace el cambio
     */
    static async _checkAndUpdateCompletionStatus(procedure, userId) {
        const Audit = mongoose.model('Audit');
        const audit = await Audit.findById(procedure.auditId).select('type state');
        
        if (!audit) return;

        // Solo auto-completar si la auditoría está APPROVED
        if (audit.state !== 'APPROVED') {
            console.log(`[AuditProcedure] Audit ${procedure.auditId} not APPROVED, skipping auto-complete`);
            return;
        }

        let shouldComplete = false;
        let completionReason = '';

        // Determinar si es auditoría de verificación
        const isVerification = this._isVerificationAudit(audit, procedure);

        if (isVerification) {
            // Para verificaciones: completar cuando tiene respuestaRetest.cite
            if (procedure.respuestaRetest?.cite) {
                shouldComplete = true;
                completionReason = `Verificación completada - CITE respuestaRetest: ${procedure.respuestaRetest.cite}`;
            }
        } else {
            // Para evaluaciones: completar cuando tiene respuesta.cite
            if (procedure.respuesta?.cite) {
                shouldComplete = true;
                completionReason = `Evaluación completada - CITE respuesta: ${procedure.respuesta.cite}`;
            }
        }

        if (shouldComplete) {
            try {
                const status = await AuditStatus.findOne({ auditId: procedure.auditId });
                if (status && status.status !== AuditStatus.STATUS.COMPLETADO) {
                    await status.changeStatus(
                        AuditStatus.STATUS.COMPLETADO, 
                        userId, 
                        completionReason
                    );
                    console.log(`[AuditProcedure] Auto-completed audit ${procedure.auditId}: ${completionReason}`);
                }
            } catch (err) {
                console.error('[AuditProcedure] Error auto-completing:', err.message);
            }
        }
    }

    /**
     * Determina si una auditoría es de tipo verificación
     * @private
     */
    static _isVerificationAudit(audit, procedure) {
        // Verificar por tipo de auditoría
        if (audit.type === 'verification' || audit.type === 'retest') {
            return true;
        }

        // Verificar por alcance (si incluye palabras clave)
        if (procedure.alcance && Array.isArray(procedure.alcance)) {
            const verificationKeywords = ['verificación', 'verificacion', 'retest', 'seguimiento'];
            return procedure.alcance.some(a => 
                verificationKeywords.some(keyword => 
                    a.toLowerCase().includes(keyword)
                )
            );
        }

        return false;
    }

    /**
     * Obtiene todos los procedimientos
     */
    static async getAll(filters = {}) {
        const query = {};
        
        if (filters.origen) {
            query.origen = { $regex: filters.origen, $options: 'i' };
        }
        
        if (filters.alcance) {
            query.alcance = { $in: Array.isArray(filters.alcance) ? filters.alcance : [filters.alcance] };
        }
        
        if (filters.auditId) {
            query.auditId = filters.auditId;
        }
        
        return await AuditProcedure.find(query)
            .populate('auditId', 'name language auditType type state')
            .populate('createdBy', 'username firstname lastname')
            .populate('updatedBy', 'username firstname lastname')
            .sort({ createdAt: -1 });
    }

    /**
     * Obtiene un procedimiento por ID
     */
    static async getById(id) {
        const procedure = await AuditProcedure.findById(id)
            .populate('auditId', 'name language auditType type state findings')
            .populate('createdBy', 'username firstname lastname')
            .populate('updatedBy', 'username firstname lastname');
        
        if (!procedure) {
            throw { fn: 'NotFound', message: 'Procedure not found' };
        }
        
        return procedure;
    }

    /**
     * Obtiene el procedimiento de una auditoría
     */
    static async getByAuditId(auditId) {
        const procedure = await AuditProcedure.findOne({ auditId })
            .populate('auditId', 'name language auditType type state')
            .populate('createdBy', 'username firstname lastname')
            .populate('updatedBy', 'username firstname lastname');
        
        if (!procedure) {
            throw { fn: 'NotFound', message: 'Procedure not found for this audit' };
        }
        
        return procedure;
    }

    /**
     * Crea un nuevo procedimiento
     */
    static async create(data, userId) {
        // Verificar que la auditoría existe
        const Audit = mongoose.model('Audit');
        const audit = await Audit.findById(data.auditId);
        
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found' };
        }
        
        // Verificar que no exista ya un procedimiento para esta auditoría
        const existing = await AuditProcedure.findOne({ auditId: data.auditId });
        if (existing) {
            throw { fn: 'BadParameters', message: 'Audit already has a procedure record' };
        }
        
        // Validar alcance
        if (data.alcance && !Array.isArray(data.alcance)) {
            data.alcance = [data.alcance];
        }
        
        const procedureData = {
            auditId: data.auditId,
            origen: data.origen,
            alcance: data.alcance || [],
            alcanceDescripcion: data.alcanceDescripcion,
            solicitud: data.solicitud,
            instructivo: data.instructivo,
            informe: data.informe,
            respuesta: data.respuesta,
            notaExterna: data.notaExterna,
            notaInterna: data.notaInterna,
            notaRetest: data.notaRetest,
            informeRetest: data.informeRetest,
            respuestaRetest: data.respuestaRetest,
            notaInternaRetest: data.notaInternaRetest,
            createdBy: userId
        };
        
        const procedure = new AuditProcedure(procedureData);
        await procedure.save();

        // Verificar si debe auto-completar
        await this._checkAndUpdateCompletionStatus(procedure, userId);
        
        return procedure;
    }

    /**
     * Actualiza un procedimiento
     * IMPORTANTE: Esto puede auto-completar la auditoría si se llena respuesta.cite o respuestaRetest.cite
     */
    static async update(id, data, userId) {
        const procedure = await AuditProcedure.findById(id);
        
        if (!procedure) {
            throw { fn: 'NotFound', message: 'Procedure not found' };
        }
        
        // Campos actualizables
        const updateableFields = [
            'origen',
            'alcance',
            'alcanceDescripcion',
            'solicitud',
            'instructivo',
            'informe',
            'respuesta',
            'notaExterna',
            'notaInterna',
            'notaRetest',
            'informeRetest',
            'respuestaRetest',
            'notaInternaRetest'
        ];
        
        updateableFields.forEach(field => {
            if (data[field] !== undefined) {
                procedure[field] = data[field];
            }
        });
        
        // Validar alcance
        if (data.alcance && !Array.isArray(data.alcance)) {
            procedure.alcance = [data.alcance];
        }
        
        procedure.updatedBy = userId;
        
        await procedure.save();

        // Verificar si debe auto-completar
        await this._checkAndUpdateCompletionStatus(procedure, userId);
        
        return procedure;
    }

    /**
     * Actualiza por auditId
     */
    static async updateByAuditId(auditId, data, userId) {
        let procedure = await AuditProcedure.findOne({ auditId });
        
        if (!procedure) {
            // Crear si no existe
            data.auditId = auditId;
            return await this.create(data, userId);
        }
        
        return await this.update(procedure._id, data, userId);
    }

    /**
     * Actualiza solo la sección de solicitud
     */
    static async updateSolicitud(id, solicitudData, userId) {
        return await this.update(id, { solicitud: solicitudData }, userId);
    }

    /**
     * Actualiza solo la sección de instructivo
     */
    static async updateInstructivo(id, instructivoData, userId) {
        return await this.update(id, { instructivo: instructivoData }, userId);
    }

    /**
     * Actualiza solo la sección de informe
     */
    static async updateInforme(id, informeData, userId) {
        return await this.update(id, { informe: informeData }, userId);
    }

    /**
     * Actualiza solo la sección de respuesta
     * IMPORTANTE: Esto puede AUTO-COMPLETAR la auditoría de evaluación
     */
    static async updateRespuesta(id, respuestaData, userId) {
        return await this.update(id, { respuesta: respuestaData }, userId);
    }

    /**
     * Actualiza solo las notas
     */
    static async updateNotas(id, notasData, userId) {
        const updateData = {};
        if (notasData.notaExterna !== undefined) updateData.notaExterna = notasData.notaExterna;
        if (notasData.notaInterna !== undefined) updateData.notaInterna = notasData.notaInterna;
        
        return await this.update(id, updateData, userId);
    }

    /**
     * Actualiza solo la sección de verificación/retest
     * IMPORTANTE: Esto puede AUTO-COMPLETAR la auditoría de verificación
     */
    static async updateRetest(id, retestData, userId) {
        const updateData = {};
        if (retestData.notaRetest !== undefined) updateData.notaRetest = retestData.notaRetest;
        if (retestData.informeRetest !== undefined) updateData.informeRetest = retestData.informeRetest;
        if (retestData.respuestaRetest !== undefined) updateData.respuestaRetest = retestData.respuestaRetest;
        if (retestData.notaInternaRetest !== undefined) updateData.notaInternaRetest = retestData.notaInternaRetest;
        
        return await this.update(id, updateData, userId);
    }

    /**
     * Elimina un procedimiento
     */
    static async delete(id) {
        const procedure = await AuditProcedure.findByIdAndDelete(id);
        
        if (!procedure) {
            throw { fn: 'NotFound', message: 'Procedure not found' };
        }
        
        return procedure;
    }

    /**
     * Elimina por auditId
     */
    static async deleteByAuditId(auditId) {
        return await AuditProcedure.findOneAndDelete({ auditId });
    }

    /**
     * Obtiene los tipos de alcance únicos usados en el sistema
     */
    static async getDistinctAlcances() {
        return await AuditProcedure.distinct('alcance');
    }

    /**
     * Obtiene estadísticas de procedimientos
     */
    static async getStats() {
        const stats = await AuditProcedure.aggregate([
            {
                $group: {
                    _id: '$origen',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        const alcanceStats = await AuditProcedure.aggregate([
            { $unwind: '$alcance' },
            {
                $group: {
                    _id: '$alcance',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Estadísticas de completitud
        const completionStats = await AuditProcedure.aggregate([
            {
                $project: {
                    hasRespuesta: { $cond: [{ $ifNull: ['$respuesta.cite', false] }, 1, 0] },
                    hasRespuestaRetest: { $cond: [{ $ifNull: ['$respuestaRetest.cite', false] }, 1, 0] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    withRespuesta: { $sum: '$hasRespuesta' },
                    withRespuestaRetest: { $sum: '$hasRespuestaRetest' }
                }
            }
        ]);
        
        return {
            total: await AuditProcedure.countDocuments(),
            byOrigen: stats,
            byAlcance: alcanceStats,
            completion: completionStats[0] || { total: 0, withRespuesta: 0, withRespuestaRetest: 0 }
        };
    }

    /**
     * Busca procedimientos por origen
     */
    static async searchByOrigen(searchTerm) {
        return await AuditProcedure.find({
            origen: { $regex: searchTerm, $options: 'i' }
        })
        .populate('auditId', 'name type state')
        .sort({ createdAt: -1 });
    }

    /**
     * Verifica el estado de completitud de un procedimiento
     * Útil para el frontend para mostrar indicadores
     */
    static async getCompletionStatus(auditId) {
        const procedure = await AuditProcedure.findOne({ auditId });
        const Audit = mongoose.model('Audit');
        const audit = await Audit.findById(auditId).select('type state');

        if (!procedure || !audit) {
            return null;
        }

        const isVerification = this._isVerificationAudit(audit, procedure);

        return {
            auditId,
            auditType: audit.type,
            auditState: audit.state,
            isVerification,
            documentsStatus: {
                solicitud: !!procedure.solicitud?.cite,
                instructivo: !!procedure.instructivo?.cite,
                informe: !!procedure.informe?.cite,
                respuesta: !!procedure.respuesta?.cite,
                // Solo para verificaciones
                informeRetest: !!procedure.informeRetest?.cite,
                respuestaRetest: !!procedure.respuestaRetest?.cite
            },
            isComplete: isVerification 
                ? !!procedure.respuestaRetest?.cite 
                : !!procedure.respuesta?.cite,
            canComplete: audit.state === 'APPROVED'
        };
    }
}

module.exports = AuditProcedureService;