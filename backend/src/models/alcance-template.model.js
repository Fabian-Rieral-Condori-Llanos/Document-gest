const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * AlcanceTemplate Model
 * 
 * Catálogo de tipos de alcance para evaluaciones.
 * Solo administradores pueden crear/editar.
 * Se usa para seleccionar el alcance al configurar una auditoría.
 * 
 * Ejemplos:
 * - Externa
 * - Interna
 * - Externa e Interna
 * - Sistema Específico entidad
 * - Sistema Específico Privado-Codigo
 * - Aplicación Web
 * - Aplicación Móvil
 * - API
 * - Infraestructura
 */

const AlcanceTemplateSchema = new Schema({
    // Nombre del alcance
    name: {
        type: String,
        required: [true, 'Name is required'],
        unique: true,
        trim: true,
        maxlength: [200, 'Name cannot exceed 200 characters']
    },
    
    // Descripción del alcance
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    // Color para gráficas (opcional)
    color: {
        type: String,
        trim: true,
        maxlength: [20, 'Color cannot exceed 20 characters'],
        default: '#6b7280'
    },
    
    // Estado activo/inactivo
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Metadata
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
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
AlcanceTemplateSchema.index({ name: 1 }, { unique: true });
AlcanceTemplateSchema.index({ isActive: 1 });
AlcanceTemplateSchema.index({ name: 'text', description: 'text' });

/**
 * Campos para listados
 */
AlcanceTemplateSchema.statics.listFields = 'name description color isActive createdAt';

/**
 * Método estático: Obtener solo activos
 */
AlcanceTemplateSchema.statics.getActive = function() {
    return this.find({ isActive: true }).sort({ name: 1 });
};

/**
 * Método estático: Buscar por nombre
 */
AlcanceTemplateSchema.statics.findByName = function(name) {
    return this.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
};

const AlcanceTemplate = mongoose.model('AlcanceTemplate', AlcanceTemplateSchema);

module.exports = AlcanceTemplate;