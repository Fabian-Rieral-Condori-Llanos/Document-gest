const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Image Model
 * 
 * Define la estructura de datos para imágenes de auditorías.
 * La lógica de negocio está en services/image.service.js
 */

const ImageSchema = new Schema({
    auditId: {
        type: Schema.Types.ObjectId,
        ref: 'Audit'
    },
    value: {
        type: String,
        required: [true, 'Image value is required'],
        unique: true
    },
    name: {
        type: String,
        maxlength: [255, 'Image name cannot exceed 255 characters']
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
ImageSchema.index({ auditId: 1 });

/**
 * Campos para listados
 */
ImageSchema.statics.listFields = 'auditId value name';

const Image = mongoose.model('Image', ImageSchema);

module.exports = Image;
