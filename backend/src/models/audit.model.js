const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Audit Model
 * 
 * Define la estructura de auditorías de seguridad.
 * La lógica de negocio está en services/audit.service.js
 * 
 * Este es el modelo más complejo del sistema.
 */

// ============================================
// SUB-ESQUEMAS
// ============================================

/**
 * Imagen en un párrafo
 */
const ParagraphImageSchema = {
    _id: false,
    image: { type: String },
    caption: { type: String }
};

/**
 * Párrafo de texto con imágenes
 */
const ParagraphSchema = {
    _id: false,
    text: { type: String },
    images: [ParagraphImageSchema]
};

/**
 * Campo personalizado con valor
 */
const CustomFieldValueSchema = {
    _id: false,
    customField: { type: Schema.Types.Mixed, ref: 'CustomField' },
    text: { type: Schema.Types.Mixed }
};

/**
 * Servicio de red
 */
const ServiceSchema = {
    _id: false,
    port: { type: Number },
    protocol: { type: String, enum: ['tcp', 'udp'] },
    name: { type: String },
    product: { type: String },
    version: { type: String }
};

/**
 * Host de red
 */
const HostSchema = {
    _id: false,
    hostname: { type: String },
    ip: { type: String },
    os: { type: String },
    services: [ServiceSchema]
};

/**
 * Scope de auditoría
 */
const ScopeSchema = {
    _id: false,
    name: { type: String },
    hosts: [HostSchema]
};

/**
 * Opción de ordenamiento
 */
const SortOptionSchema = {
    _id: false,
    category: { type: String },
    sortValue: { type: String },
    sortOrder: { type: String, enum: ['desc', 'asc'] },
    sortAuto: { type: Boolean }
};

/**
 * Sección de auditoría
 */
const SectionSchema = {
    _id: false,
    field: { type: String },
    name: { type: String },
    text: { type: String },
    customFields: [CustomFieldValueSchema]
};

/**
 * Finding/Hallazgo
 */
const FindingSchema = {
    id: { type: Schema.Types.ObjectId },
    identifier: { type: Number },  // ID incremental para el reporte
    title: { type: String },
    vulnType: { type: String },
    description: { type: String },
    observation: { type: String },
    remediation: { type: String },
    remediationComplexity: { type: Number, enum: [1, 2, 3] },
    priority: { type: Number, enum: [1, 2, 3, 4] },
    references: [{ type: String }],
    cvssv3: { type: String },
    cvssv4: { type: String },
    paragraphs: [ParagraphSchema],
    poc: { type: String },
    scope: { type: String },
    status: { type: Number, enum: [0, 1], default: 1 },  // 0: done, 1: redacting
    category: { type: String },
    customFields: [CustomFieldValueSchema],
    retestStatus: { type: String, enum: ['ok', 'ko', 'unknown', 'partial'] },
    retestDescription: { type: String }
};

/**
 * Respuesta a comentario
 */
const ReplySchema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, default: '' }
}, { timestamps: true });

/**
 * Comentario
 */
const CommentSchema = new Schema({
    findingId: { type: Schema.Types.ObjectId, default: null },
    sectionId: { type: Schema.Types.ObjectId, default: null },
    fieldName: { type: String, default: '' },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, default: '' },
    replies: [ReplySchema],
    resolved: { type: Boolean, default: false }
}, { timestamps: true });

// ============================================
// ESQUEMA PRINCIPAL
// ============================================

/**
 * Esquema principal de Audit
 */
const AuditSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Audit name is required'],
        maxlength: [255, 'Name cannot exceed 255 characters']
    },
    auditType: {
        type: String,
        maxlength: [100, 'Audit type cannot exceed 100 characters']
    },
    date: { type: String },
    date_start: { type: String },
    date_end: { type: String },
    summary: { type: String },
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company'
    },
    client: {
        type: Schema.Types.ObjectId,
        ref: 'Client'
    },
    collaborators: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    reviewers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    language: {
        type: String,
        required: [true, 'Language is required'],
        maxlength: [50, 'Language cannot exceed 50 characters']
    },
    scope: [ScopeSchema],
    findings: [FindingSchema],
    template: {
        type: Schema.Types.ObjectId,
        ref: 'Template'
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    sections: [SectionSchema],
    customFields: [CustomFieldValueSchema],
    sortFindings: [SortOptionSchema],
    state: {
        type: String,
        enum: ['EDIT', 'REVIEW', 'APPROVED'],
        default: 'EDIT'
    },
    approvals: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    type: {
        type: String,
        enum: ['default', 'multi', 'retest'],
        default: 'default'
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'Audit'
    },
    comments: [CommentSchema]
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

// ============================================
// ÍNDICES
// ============================================

AuditSchema.index({ name: 1 });
AuditSchema.index({ creator: 1 });
AuditSchema.index({ company: 1 });
AuditSchema.index({ client: 1 });
AuditSchema.index({ state: 1 });
AuditSchema.index({ type: 1 });
AuditSchema.index({ parentId: 1 });
AuditSchema.index({ collaborators: 1 });
AuditSchema.index({ reviewers: 1 });
AuditSchema.index({ createdAt: -1 });

/// ============================================
// ÍNDICES COMPUESTOS PARA ANALYTICS
// ============================================

AuditSchema.index({ company: 1, createdAt: -1 });
AuditSchema.index({ client: 1, createdAt: -1 });
AuditSchema.index({ auditType: 1, createdAt: -1 });
AuditSchema.index({ state: 1, createdAt: -1 });
AuditSchema.index({ company: 1, state: 1 });

// ============================================
// CONSTANTES
// ============================================

/**
 * Estados de auditoría
 */
AuditSchema.statics.STATES = {
    EDIT: 'EDIT',
    REVIEW: 'REVIEW',
    APPROVED: 'APPROVED'
};

/**
 * Tipos de auditoría
 */
AuditSchema.statics.TYPES = {
    DEFAULT: 'default',
    MULTI: 'multi',
    RETEST: 'retest'
};

/**
 * Estados de findings
 */
AuditSchema.statics.FINDING_STATUS = {
    DONE: 0,
    REDACTING: 1
};

/**
 * Estados de retest
 */
AuditSchema.statics.RETEST_STATUS = {
    OK: 'ok',
    KO: 'ko',
    UNKNOWN: 'unknown',
    PARTIAL: 'partial'
};

/**
 * Campos para listados
 */
AuditSchema.statics.listFields = 'name auditType language creator collaborators company createdAt state type parentId reviewers approvals';

const Audit = mongoose.model('Audit', AuditSchema);

module.exports = Audit;
