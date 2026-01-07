const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * CustomField Model
 * 
 * Define campos personalizados para auditorías y findings.
 * La lógica de negocio está en services/custom-field.service.js
 */

/**
 * Esquema para texto por locale
 */
const TextLocaleSchema = {
    _id: false,
    locale: { type: String },
    value: { type: Schema.Types.Mixed }
};

/**
 * Esquema para opciones por locale
 */
const OptionLocaleSchema = {
    _id: false,
    locale: { type: String },
    value: { type: String }
};

/**
 * Esquema principal de CustomField
 */
const CustomFieldSchema = new Schema({
    fieldType: {
        type: String,
        required: [true, 'Field type is required'],
        maxlength: [50, 'Field type cannot exceed 50 characters']
    },
    label: {
        type: String,
        required: [true, 'Label is required'],
        maxlength: [100, 'Label cannot exceed 100 characters']
    },
    display: {
        type: String,
        required: [true, 'Display is required'],
        maxlength: [50, 'Display cannot exceed 50 characters']
    },
    displaySub: {
        type: String,
        default: '',
        maxlength: [50, 'Display sub cannot exceed 50 characters']
    },
    position: {
        type: Number,
        default: 0
    },
    size: {
        type: Number,
        enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        default: 12
    },
    offset: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        default: 0
    },
    required: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: '',
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    inline: {
        type: Boolean,
        default: false
    },
    text: [TextLocaleSchema],
    options: [OptionLocaleSchema]
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
 * Índices - label + display + displaySub debe ser único
 */
CustomFieldSchema.index(
    { label: 1, display: 1, displaySub: 1 },
    { 
        name: 'unique_label_display', 
        unique: true,
        partialFilterExpression: { label: { $exists: true, $gt: '' } }
    }
);
CustomFieldSchema.index({ position: 1 });

/**
 * Campos para listados
 */
CustomFieldSchema.statics.listFields = 'fieldType label display displaySub size offset required description inline text options';

const CustomField = mongoose.model('CustomField', CustomFieldSchema);

module.exports = CustomField;
