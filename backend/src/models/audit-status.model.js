const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * AuditStatus Model
 * 
 * Controla el estado general del ciclo de vida de una auditoría.
 * Estados: EVALUANDO → COMPLETADO
 * 
 * FLUJO:
 * - EVALUANDO: Auditoría en progreso (estado inicial)
 * - PENDIENTE: Bloqueada/Esperando acciones (opcional)
 * - COMPLETADO: Auditoría finalizada (manual)
 * 
 * NOTA: La verificación ahora es una auditoría separada (hija),
 * no un estado dentro de la misma auditoría.
 */

/**
 * Estados posibles de una auditoría
 */
const STATUS_ENUM = {
    EVALUANDO: 'EVALUANDO',
    PENDIENTE: 'PENDIENTE',
    COMPLETADO: 'COMPLETADO'
};

/**
 * Esquema para historial de cambios de estado
 */
const StatusHistorySchema = new Schema({
    status: {
        type: String,
        enum: Object.values(STATUS_ENUM),
        required: true
    },
    changedAt: {
        type: Date,
        default: Date.now
    },
    changedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
}, { _id: false });

/**
 * Esquema principal de AuditStatus
 */
const AuditStatusSchema = new Schema({
    auditId: {
        type: Schema.Types.ObjectId,
        ref: 'Audit',
        required: [true, 'Audit ID is required'],
        unique: true
    },
    status: {
        type: String,
        enum: {
            values: Object.values(STATUS_ENUM),
            message: 'Status must be one of: EVALUANDO, PENDIENTE, COMPLETADO'
        },
        default: STATUS_ENUM.EVALUANDO
    },
    history: [StatusHistorySchema]
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

/**
 * Índices
 */
AuditStatusSchema.index({ status: 1 });
AuditStatusSchema.index({ createdAt: -1 });

/**
 * Middleware: Agregar al historial cuando cambia el estado
 */
AuditStatusSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.history.push({
            status: this.status,
            changedAt: new Date(),
            changedBy: this._changedBy || null,
            notes: this._changeNotes || ''
        });
    }
    next();
});

/**
 * Método para cambiar estado con metadata
 */
AuditStatusSchema.methods.changeStatus = function(newStatus, userId, notes = '') {
    this._changedBy = userId;
    this._changeNotes = notes;
    this.status = newStatus;
    return this.save();
};

/**
 * Campos para listados
 */
AuditStatusSchema.statics.listFields = 'auditId status history createdAt updatedAt';

/**
 * Exportar enum de estados
 */
AuditStatusSchema.statics.STATUS = STATUS_ENUM;

const AuditStatus = mongoose.model('AuditStatus', AuditStatusSchema);

module.exports = AuditStatus;