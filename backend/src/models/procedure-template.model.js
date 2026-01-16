const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * ProcedureTemplate Model
 * 
 * Catálogo de plantillas de procedimientos.
 * Solo administradores pueden crear/editar.
 * Se usa para seleccionar el tipo de procedimiento al crear una auditoría.
 * 
 * Ejemplos:
 * - PR01: Evaluación por Solicitud de Entidades
 * - PR02: Evaluación Interna AGETIC
 * - PR03: Evaluación Externa
 * - PR09: Evaluación por Solicitud AGETIC
 */

const ProcedureTemplateSchema = new Schema({
    // Nombre descriptivo del procedimiento
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [200, 'Name cannot exceed 200 characters']
    },
    
    // Código único del procedimiento (PR01, PR02, etc.)
    code: {
        type: String,
        required: [true, 'Code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [50, 'Code cannot exceed 50 characters']
    },
    
    // Descripción del procedimiento
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
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
ProcedureTemplateSchema.index({ code: 1 }, { unique: true });
ProcedureTemplateSchema.index({ isActive: 1 });
ProcedureTemplateSchema.index({ name: 'text', description: 'text' });

/**
 * Virtual: Nombre completo (código + nombre)
 */
ProcedureTemplateSchema.virtual('fullName').get(function() {
    return `${this.code} - ${this.name}`;
});

/**
 * Campos para listados
 */
ProcedureTemplateSchema.statics.listFields = 'name code description isActive createdAt';

/**
 * Método estático: Obtener solo activos
 */
ProcedureTemplateSchema.statics.getActive = function() {
    return this.find({ isActive: true }).sort({ code: 1 });
};

/**
 * Método estático: Buscar por código
 */
ProcedureTemplateSchema.statics.findByCode = function(code) {
    return this.findOne({ code: code.toUpperCase() });
};

const ProcedureTemplate = mongoose.model('ProcedureTemplate', ProcedureTemplateSchema);

module.exports = ProcedureTemplate;
