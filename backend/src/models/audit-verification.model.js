const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * AuditVerification Model
 * 
 * Seguimiento de la verificación de hallazgos/findings de una auditoría.
 * Permite verificar cada finding y actualizar el estado general.
 */

/**
 * Estados de verificación de un finding
 */
const VERIFICATION_STATUS_ENUM = {
    PENDIENTE: 'PENDIENTE',
    VERIFICADO: 'VERIFICADO',
    NO_VERIFICADO: 'NO_VERIFICADO',
    PARCIAL: 'PARCIAL'
};

/**
 * Resultado final de la verificación
 */
const RESULT_ENUM = {
    EN_PROCESO: 'EN_PROCESO',
    COMPLETADO: 'COMPLETADO',
    PENDIENTE: 'PENDIENTE'
};

/**
 * Esquema para verificación de cada finding
 */
const FindingVerificationSchema = new Schema({
    findingId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    originalStatus: {
        type: String
    },
    verificationStatus: {
        type: String,
        enum: Object.values(VERIFICATION_STATUS_ENUM),
        default: VERIFICATION_STATUS_ENUM.PENDIENTE
    },
    verifiedAt: {
        type: Date
    },
    verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        maxlength: [2000, 'Notes cannot exceed 2000 characters']
    },
    evidence: {
        type: String,
        maxlength: [5000, 'Evidence cannot exceed 5000 characters']
    }
}, { _id: true });

/**
 * Esquema principal de AuditVerification
 */
const AuditVerificationSchema = new Schema({
    auditId: {
        type: Schema.Types.ObjectId,
        ref: 'Audit',
        required: [true, 'Audit ID is required']
    },
    statusId: {
        type: Schema.Types.ObjectId,
        ref: 'AuditStatus',
        required: [true, 'Status ID is required']
    },
    findings: [FindingVerificationSchema],
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    result: {
        type: String,
        enum: {
            values: Object.values(RESULT_ENUM),
            message: 'Result must be one of: EN_PROCESO, COMPLETADO, PENDIENTE'
        },
        default: RESULT_ENUM.EN_PROCESO
    },
    notes: {
        type: String,
        maxlength: [2000, 'Notes cannot exceed 2000 characters']
    },
    verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
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
AuditVerificationSchema.index({ auditId: 1 });
AuditVerificationSchema.index({ statusId: 1 });
AuditVerificationSchema.index({ result: 1 });
AuditVerificationSchema.index({ createdAt: -1 });

/**
 * Virtual: Progreso de verificación
 */
AuditVerificationSchema.virtual('progress').get(function() {
    if (!this.findings || this.findings.length === 0) return 0;
    
    const verified = this.findings.filter(f => 
        f.verificationStatus !== VERIFICATION_STATUS_ENUM.PENDIENTE
    ).length;
    
    return Math.round((verified / this.findings.length) * 100);
});

/**
 * Virtual: Resumen de estados
 */
AuditVerificationSchema.virtual('summary').get(function() {
    if (!this.findings) return {};
    
    return {
        total: this.findings.length,
        pendiente: this.findings.filter(f => f.verificationStatus === VERIFICATION_STATUS_ENUM.PENDIENTE).length,
        verificado: this.findings.filter(f => f.verificationStatus === VERIFICATION_STATUS_ENUM.VERIFICADO).length,
        noVerificado: this.findings.filter(f => f.verificationStatus === VERIFICATION_STATUS_ENUM.NO_VERIFICADO).length,
        parcial: this.findings.filter(f => f.verificationStatus === VERIFICATION_STATUS_ENUM.PARCIAL).length
    };
});

/**
 * Campos para listados
 */
AuditVerificationSchema.statics.listFields = 'auditId statusId startDate endDate result findings';

/**
 * Exportar enums
 */
AuditVerificationSchema.statics.VERIFICATION_STATUS = VERIFICATION_STATUS_ENUM;
AuditVerificationSchema.statics.RESULT = RESULT_ENUM;

const AuditVerification = mongoose.model('AuditVerification', AuditVerificationSchema);

module.exports = AuditVerification;