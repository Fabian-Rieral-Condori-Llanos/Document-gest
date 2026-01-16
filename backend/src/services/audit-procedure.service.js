const mongoose = require('mongoose');
const AuditProcedure = require('../models/audit-procedure.model');

/**
 * AuditProcedure Service
 * 
 * Lógica de negocio para el manejo de procedimientos de auditoría.
 */
class AuditProcedureService {
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
            .populate('auditId', 'name language auditType')
            .populate('createdBy', 'username firstname lastname')
            .populate('updatedBy', 'username firstname lastname')
            .sort({ createdAt: -1 });
    }

    /**
     * Obtiene un procedimiento por ID
     */
    static async getById(id) {
        const procedure = await AuditProcedure.findById(id)
            .populate('auditId', 'name language auditType findings')
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
            .populate('auditId', 'name language auditType')
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
            notaExternaRetest: data.notaExternaRetest,
            notaInternaRetest: data.notaInternaRetest,
            createdBy: userId
        };
        
        const procedure = new AuditProcedure(procedureData);
        await procedure.save();
        
        return procedure;
    }

    /**
     * Actualiza un procedimiento
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
            'notaExternaRetest',
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
     * Actualiza solo la sección de retest
     */
    static async updateRetest(id, retestData, userId) {
        const updateData = {};
        if (retestData.notaRetest !== undefined) updateData.notaRetest = retestData.notaRetest;
        if (retestData.informeRetest !== undefined) updateData.informeRetest = retestData.informeRetest;
        if (retestData.notaExternaRetest !== undefined) updateData.notaExternaRetest = retestData.notaExternaRetest;
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
        
        return {
            total: await AuditProcedure.countDocuments(),
            byOrigen: stats,
            byAlcance: alcanceStats
        };
    }

    /**
     * Busca procedimientos por origen
     */
    static async searchByOrigen(searchTerm) {
        return await AuditProcedure.find({
            origen: { $regex: searchTerm, $options: 'i' }
        })
        .populate('auditId', 'name')
        .sort({ createdAt: -1 });
    }
}

module.exports = AuditProcedureService;