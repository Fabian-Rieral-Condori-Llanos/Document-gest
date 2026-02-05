const mongoose = require('mongoose');
const AuditStatus = require('../models/audit-status.model');

/**
 * AuditStatus Service
 * 
 * Lógica de negocio para el manejo de estados de auditoría.
 */
class AuditStatusService {
    /**
     * Obtiene todos los estados
     */
    static async getAll(filters = {}) {
        const query = {};
        
        if (filters.status) {
            query.status = filters.status;
        }
        
        if (filters.auditId) {
            query.auditId = filters.auditId;
        }
        
        return await AuditStatus.find(query)
            .populate('auditId', 'name')
            .populate('history.changedBy', 'username firstname lastname')
            .sort({ createdAt: -1 });
    }

    /**
     * Obtiene un estado por ID
     */
    static async getById(id) {
        const status = await AuditStatus.findById(id)
            .populate('auditId', 'name language auditType')
            .populate('history.changedBy', 'username firstname lastname');
        
        if (!status) {
            throw { fn: 'NotFound', message: 'Audit status not found' };
        }
        
        return status;
    }

    /**
     * Obtiene el estado de una auditoría específica
     * MODIFICADO: Crea automáticamente si no existe (para auditorías antiguas)
     */
    static async getByAuditId(auditId, createIfNotExists = true) {
        let status = await AuditStatus.findOne({ auditId })
            .populate('auditId', 'name language auditType')
            .populate('history.changedBy', 'username firstname lastname');
        
        if (!status) {
            if (createIfNotExists) {
                // Verificar que la auditoría existe
                const Audit = mongoose.model('Audit');
                const audit = await Audit.findById(auditId);
                
                if (!audit) {
                    throw { fn: 'NotFound', message: 'Audit not found' };
                }
                
                // Crear AuditStatus con estado inicial basado en el state de la auditoría
                const initialStatus = audit.state === 'APPROVED' 
                    ? AuditStatus.STATUS.COMPLETADO 
                    : AuditStatus.STATUS.EVALUANDO;
                
                const newStatus = new AuditStatus({
                    auditId,
                    status: initialStatus,
                    history: [{
                        status: initialStatus,
                        changedAt: new Date(),
                        changedBy: null,
                        notes: 'Estado inicial creado automáticamente'
                    }]
                });
                
                await newStatus.save();
                console.log(`[AuditStatus] Created auto status for audit ${auditId}: ${initialStatus}`);
                
                // Re-fetch con populate
                status = await AuditStatus.findOne({ auditId })
                    .populate('auditId', 'name language auditType')
                    .populate('history.changedBy', 'username firstname lastname');
            } else {
                throw { fn: 'NotFound', message: 'Audit status not found for this audit' };
            }
        }
        
        return status;
    }

    /**
     * Crea un nuevo estado para una auditoría
     */
    static async create(data, userId) {
        // Verificar que la auditoría existe
        const Audit = mongoose.model('Audit');
        const audit = await Audit.findById(data.auditId);
        
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found' };
        }
        
        // Verificar que no exista ya un estado para esta auditoría
        const existing = await AuditStatus.findOne({ auditId: data.auditId });
        if (existing) {
            throw { fn: 'BadParameters', message: 'Audit already has a status record' };
        }
        
        const statusData = {
            auditId: data.auditId,
            status: data.status || AuditStatus.STATUS.EVALUANDO,
            history: [{
                status: data.status || AuditStatus.STATUS.EVALUANDO,
                changedAt: new Date(),
                changedBy: userId,
                notes: data.notes || 'Estado inicial'
            }]
        };
        
        const status = new AuditStatus(statusData);
        await status.save();
        
        return status;
    }

    /**
     * Crea estado automáticamente al crear auditoría (si no existe)
     */
    static async createForAudit(auditId, userId) {
        const existing = await AuditStatus.findOne({ auditId });
        if (existing) {
            return existing;
        }
        
        return await this.create({ auditId }, userId);
    }

    /**
     * Actualiza el estado de una auditoría
     */
    static async updateStatus(id, newStatus, userId, notes = '') {
        const status = await AuditStatus.findById(id);
        
        if (!status) {
            throw { fn: 'NotFound', message: 'Audit status not found' };
        }
        
        // Validar transición de estado
        this.validateStatusTransition(status.status, newStatus);
        
        // Cambiar estado
        await status.changeStatus(newStatus, userId, notes);
        
        return status;
    }

    /**
     * Actualiza el estado por auditId
     */
    static async updateStatusByAuditId(auditId, newStatus, userId, notes = '') {
        let status = await AuditStatus.findOne({ auditId });
        
        if (!status) {
            // Crear si no existe
            status = await this.create({ auditId, status: newStatus, notes }, userId);
            return status;
        }
        
        // Validar transición de estado
        this.validateStatusTransition(status.status, newStatus);
        
        // Cambiar estado
        await status.changeStatus(newStatus, userId, notes);
        
        return status;
    }

    /**
     * Valida las transiciones de estado permitidas
     * 
     * Transiciones válidas:
     * - EVALUANDO → COMPLETADO (manual, cuando toda la documentación está lista)
     * - EVALUANDO → PENDIENTE (manual, cuando hay bloqueos)
     * - PENDIENTE → EVALUANDO (reabrir)
     * - PENDIENTE → COMPLETADO (completar desde pendiente)
     * - COMPLETADO → PENDIENTE (reabrir si es necesario)
     */
    static validateStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            [AuditStatus.STATUS.EVALUANDO]: [
                AuditStatus.STATUS.COMPLETADO,
                AuditStatus.STATUS.PENDIENTE
            ],
            [AuditStatus.STATUS.PENDIENTE]: [
                AuditStatus.STATUS.EVALUANDO,
                AuditStatus.STATUS.COMPLETADO
            ],
            [AuditStatus.STATUS.COMPLETADO]: [
                AuditStatus.STATUS.PENDIENTE  // Reabrir si es necesario
            ]
        };
        
        const allowed = validTransitions[currentStatus] || [];
        
        if (!allowed.includes(newStatus)) {
            throw { 
                fn: 'BadParameters', 
                message: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ')}` 
            };
        }
        
        return true;
    }

    /**
     * Obtiene el historial de cambios de estado
     */
    static async getHistory(auditId) {
        const status = await AuditStatus.findOne({ auditId })
            .populate('history.changedBy', 'username firstname lastname');
        
        if (!status) {
            throw { fn: 'NotFound', message: 'Audit status not found' };
        }
        
        return status.history;
    }

    /**
     * Elimina el estado de una auditoría
     */
    static async delete(id) {
        const status = await AuditStatus.findByIdAndDelete(id);
        
        if (!status) {
            throw { fn: 'NotFound', message: 'Audit status not found' };
        }
        
        return status;
    }

    /**
     * Elimina por auditId
     */
    static async deleteByAuditId(auditId) {
        return await AuditStatus.findOneAndDelete({ auditId });
    }

    /**
     * Obtiene estadísticas de estados
     */
    static async getStats() {
        const stats = await AuditStatus.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const result = {
            total: 0,
            byStatus: {}
        };
        
        stats.forEach(s => {
            result.byStatus[s._id] = s.count;
            result.total += s.count;
        });
        
        return result;
    }
}

module.exports = AuditStatusService;