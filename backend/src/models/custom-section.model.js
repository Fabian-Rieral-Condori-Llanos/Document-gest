const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * CustomSection Model
 * 
 * Define secciones personalizadas para auditorías.
 * La lógica de negocio está en services/custom-section.service.js
 */

const CustomSectionSchema = new Schema({
    field: {
        type: String,
        required: [true, 'Field is required'],
        unique: true,
        maxlength: [100, 'Field cannot exceed 100 characters']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        unique: true,
        maxlength: [255, 'Name cannot exceed 255 characters']
    },
    icon: {
        type: String,
        maxlength: [50, 'Icon cannot exceed 50 characters']
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
CustomSectionSchema.index({ order: 1 });

/**
 * Campos para listados
 */
CustomSectionSchema.statics.listFields = 'field name icon';

const CustomSection = mongoose.model('CustomSection', CustomSectionSchema);

module.exports = CustomSection;
