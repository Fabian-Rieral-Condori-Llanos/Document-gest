const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * AuditProcedure Model
 * 
 * Documentación completa del procedimiento de auditoría.
 * Incluye origen, alcance, documentos CITE, notas y sección de retest.
 */

/**
 * Tipos de alcance disponibles
 */
const ALCANCE_TIPOS = {
    INTERNO: 'INTERNO',
    EXTERNO: 'EXTERNO',
    SISTEMA_ESPECIFICO: 'SISTEMA_ESPECIFICO',
    MIXTO_INTERNO_EXTERNO: 'MIXTO_INTERNO_EXTERNO',
    MIXTO_INTERNO_ESPECIFICO: 'MIXTO_INTERNO_ESPECIFICO',
    MIXTO_EXTERNO_ESPECIFICO: 'MIXTO_EXTERNO_ESPECIFICO',
    MIXTO_COMPLETO: 'MIXTO_COMPLETO'
};

/**
 * Esquema para documentos/referencias CITE
 */
const DocumentReferenceSchema = new Schema({
    cite: {
        type: String,
        maxlength: [200, 'CITE cannot exceed 200 characters']
    },
    fecha: {
        type: Date
    },
    descripcion: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    }
}, { _id: false });

/**
 * Esquema principal de AuditProcedure
 */
const AuditProcedureSchema = new Schema({
    auditId: {
        type: Schema.Types.ObjectId,
        ref: 'Audit',
        required: [true, 'Audit ID is required'],
        unique: true  // Solo un procedimiento por auditoría
    },
    
    // Tipo de procedimiento (string libre)
    origen: {
        type: String,
        required: [true, 'Origen is required'],
        maxlength: [200, 'Origen cannot exceed 200 characters']
    },
    
    // Alcance (array de tipos)
    alcance: [{
        type: String,
        enum: {
            values: Object.values(ALCANCE_TIPOS),
            message: 'Invalid alcance type'
        }
    }],
    
    // Descripción adicional del alcance
    alcanceDescripcion: {
        type: String,
        maxlength: [2000, 'Alcance description cannot exceed 2000 characters']
    },
    
    // === DOCUMENTACIÓN ===
    
    // Solicitud (CITE de la solicitud recibida)
    solicitud: DocumentReferenceSchema,
    
    // Instructivo (CITE del instructivo enviado)
    instructivo: DocumentReferenceSchema,
    
    // Informe (CITE del informe enviado)
    informe: DocumentReferenceSchema,
    
    // Respuesta del cliente
    respuesta: DocumentReferenceSchema,
    
    // === NOTAS ===
    
    // Nota externa
    notaExterna: {
        type: String,
        maxlength: [5000, 'Nota externa cannot exceed 5000 characters']
    },
    
    // Nota interna
    notaInterna: {
        type: String,
        maxlength: [5000, 'Nota interna cannot exceed 5000 characters']
    },
    
    // === SECCIÓN RETEST ===
    
    // Nota para retest (verificar si se solucionó)
    notaRetest: {
        type: String,
        maxlength: [5000, 'Nota retest cannot exceed 5000 characters']
    },
    
    // Informe de retest
    informeRetest: DocumentReferenceSchema,
    
    // Nota externa de retest
    notaExternaRetest: {
        type: String,
        maxlength: [5000, 'Nota externa retest cannot exceed 5000 characters']
    },
    
    // Nota interna de retest
    notaInternaRetest: {
        type: String,
        maxlength: [5000, 'Nota interna retest cannot exceed 5000 characters']
    },
    
    // === METADATA ===
    
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
AuditProcedureSchema.index({ origen: 1 });
AuditProcedureSchema.index({ createdAt: -1 });

/**
 * Virtual: Tiene retest
 */
AuditProcedureSchema.virtual('hasRetest').get(function() {
    return !!(this.notaRetest || this.informeRetest?.cite || 
              this.notaExternaRetest || this.notaInternaRetest);
});

/**
 * Virtual: Documentos completos
 */
AuditProcedureSchema.virtual('documentosCompletos').get(function() {
    const docs = ['solicitud', 'instructivo', 'informe', 'respuesta'];
    const completed = docs.filter(d => this[d]?.cite).length;
    return {
        completed,
        total: docs.length,
        percentage: Math.round((completed / docs.length) * 100)
    };
});

/**
 * Campos para listados
 */
AuditProcedureSchema.statics.listFields = 'auditId origen alcance solicitud instructivo informe respuesta';

/**
 * Exportar tipos de alcance
 */
AuditProcedureSchema.statics.ALCANCE_TIPOS = ALCANCE_TIPOS;

const AuditProcedure = mongoose.model('AuditProcedure', AuditProcedureSchema);

module.exports = AuditProcedure;