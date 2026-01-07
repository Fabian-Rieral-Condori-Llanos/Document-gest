const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * AuditType Model
 * 
 * Define los tipos de auditoría disponibles.
 * La lógica de negocio está en services/audit-type.service.js
 */

/**
 * Esquema de plantilla por locale
 */
const TemplateLocaleSchema = {
    _id: false,
    template: { type: Schema.Types.ObjectId, ref: 'Template' },
    locale: { type: String }
};

/**
 * Esquema principal de AuditType
 */
const AuditTypeSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: [true, 'Audit type name is required'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    templates: [TemplateLocaleSchema],
    sections: [{
        type: String,
        ref: 'CustomSection'
    }],
    hidden: [{
        type: String,
        enum: ['network', 'findings']
    }],
    stage: {
        type: String,
        enum: ['default', 'retest', 'multi'],
        default: 'default'
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

/**
 * Índices
 */
AuditTypeSchema.index({ order: 1 });

/**
 * Campos para listados
 */
AuditTypeSchema.statics.listFields = 'name templates sections hidden stage order';

const AuditType = mongoose.model('AuditType', AuditTypeSchema);

module.exports = AuditType;
