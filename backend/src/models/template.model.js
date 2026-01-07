const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Template Model
 * 
 * Define la estructura de datos para plantillas de reportes.
 * La lógica de negocio está en services/template.service.js
 */

const TemplateSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Template name is required'],
        unique: true,
        maxlength: [255, 'Template name cannot exceed 255 characters']
    },
    ext: {
        type: String,
        required: [true, 'Template extension is required'],
        maxlength: [10, 'Extension cannot exceed 10 characters']
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
 * Campos para listados
 */
TemplateSchema.statics.listFields = 'name ext';

const Template = mongoose.model('Template', TemplateSchema);

module.exports = Template;
