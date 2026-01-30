const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * AuditProcedure Model
 * 
 * Documentación completa del procedimiento de auditoría.
 * Incluye origen, alcance, documentos CITE, notas y sección de verificación/retest.
 * 
 * FLUJO DE DOCUMENTACIÓN:
 * 
 * EVALUACIÓN (Auditoría Principal):
 * - solicitud: CITE de solicitud recibida
 * - instructivo: CITE del instructivo enviado
 * - informe: CITE del informe enviado
 * - respuesta: CITE de respuesta del cliente
 * - notaExterna: Nota externa (indica completado de evaluación)
 * - notaInterna: Nota interna (opcional)
 * 
 * VERIFICACIÓN (Cuando es auditoría de verificación):
 * - notaRetest: Nota de verificación
 * - informeRetest: CITE del informe de verificación
 * - respuestaRetest: CITE de respuesta de verificación (indica completado)
 * - notaInternaRetest: Nota interna de verificación (opcional)
 */

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
        maxlength: [2000, 'Description cannot exceed 2000 characters']
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
        // default: '',
        maxlength: [200, 'Origen cannot exceed 200 characters']
    },
    
    // Alcance (array de strings libres para flexibilidad)
    // Ejemplos: "Sistema Específico entidad", "Externa e Interna", "Externa", "Interna", 
    //           "Sistema Específico Privado-Codigo", "Verificación", etc.
    alcance: [{
        type: String,
        trim: true,
        maxlength: [200, 'Each alcance cannot exceed 200 characters']
    }],
    
    // Descripción adicional del alcance
    alcanceDescripcion: {
        type: String,
        maxlength: [2000, 'Alcance description cannot exceed 2000 characters']
    },
    
    // ═══════════════════════════════════════════
    // DOCUMENTACIÓN DE EVALUACIÓN
    // ═══════════════════════════════════════════
    
    // Solicitud (CITE de la solicitud recibida)
    solicitud: DocumentReferenceSchema,
    
    // Instructivo (CITE del instructivo enviado)
    instructivo: DocumentReferenceSchema,
    
    // Informe (CITE del informe enviado)
    informe: DocumentReferenceSchema,
    
    // Respuesta del cliente (CITE)
    respuesta: DocumentReferenceSchema,
    
    // Nota externa - Indica que la evaluación está completa
    notaExterna: {
        type: String,
        maxlength: [5000, 'Nota externa cannot exceed 5000 characters']
    },
    
    // Nota interna (opcional, para uso interno)
    notaInterna: {
        type: String,
        maxlength: [5000, 'Nota interna cannot exceed 5000 characters']
    },
    
    // ═══════════════════════════════════════════
    // DOCUMENTACIÓN DE VERIFICACIÓN/RETEST
    // (Solo se usa cuando la auditoría es de verificación)
    // ═══════════════════════════════════════════
    
    // Nota para verificación
    notaRetest: {
        type: String,
        maxlength: [5000, 'Nota retest cannot exceed 5000 characters']
    },
    
    // Informe de verificación (CITE)
    informeRetest: DocumentReferenceSchema,
    
    // Respuesta de verificación (CITE) - Indica que la verificación está completa
    // CAMBIO: Ahora es DocumentReferenceSchema para incluir cite, fecha y descripcion
    respuestaRetest: DocumentReferenceSchema,
    
    // Nota interna de verificación (opcional)
    notaInternaRetest: {
        type: String,
        maxlength: [5000, 'Nota interna retest cannot exceed 5000 characters']
    },
    
    // ═══════════════════════════════════════════
    // METADATA
    // ═══════════════════════════════════════════
    
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
AuditProcedureSchema.index({ origen: 1, createdAt: -1 });
AuditProcedureSchema.index({ alcance: 1, createdAt: -1 });

/**
 * Virtual: Tiene sección de verificación
 */
AuditProcedureSchema.virtual('hasRetest').get(function() {
    return !!(this.notaRetest || this.informeRetest?.cite || 
                this.respuestaRetest?.cite || this.notaInternaRetest);
});

/**
 * Virtual: Documentos de evaluación completos
 */
AuditProcedureSchema.virtual('documentosEvaluacion').get(function() {
    const docs = ['solicitud', 'instructivo', 'informe', 'respuesta'];
    const completed = docs.filter(d => this[d]?.cite).length;
    return {
        completed,
        total: docs.length,
        percentage: Math.round((completed / docs.length) * 100),
        // Evaluación se considera completa cuando tiene notaExterna
        isComplete: !!this.notaExterna
    };
});

/**
 * Virtual: Documentos de verificación completos
 */
AuditProcedureSchema.virtual('documentosVerificacion').get(function() {
    const docs = ['informeRetest', 'respuestaRetest'];
    const completed = docs.filter(d => this[d]?.cite).length;
    return {
        completed,
        total: docs.length,
        percentage: Math.round((completed / docs.length) * 100),
        // Verificación se considera completa cuando tiene respuestaRetest
        isComplete: !!this.respuestaRetest?.cite
    };
});

/**
 * Virtual: Estado de completitud general (retrocompatibilidad)
 */
AuditProcedureSchema.virtual('documentosCompletos').get(function() {
    return this.documentosEvaluacion;
});

/**
 * Campos para listados
 */
AuditProcedureSchema.statics.listFields = 'auditId origen alcance solicitud instructivo informe respuesta notaExterna informeRetest respuestaRetest';

/**
 * Obtener todos los tipos de alcance únicos (para estadísticas/filtros)
 */
AuditProcedureSchema.statics.getDistinctAlcances = async function() {
    return await this.distinct('alcance');
};

const AuditProcedure = mongoose.model('AuditProcedure', AuditProcedureSchema);

module.exports = AuditProcedure;