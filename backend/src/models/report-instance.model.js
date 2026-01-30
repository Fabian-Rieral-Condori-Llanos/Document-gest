const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * ReportInstance Model
 * 
 * Instancia de un reporte asociado a una auditoría específica.
 * Se crea como copia de un ReportTemplate cuando se selecciona en una auditoría.
 * Permite edición colaborativa en tiempo real.
 */

// Sub-schema para colaboradores activos
const ActiveCollaboratorSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: String,
    color: String, // Color del cursor del colaborador
    cursor: {
        position: Number,
        selection: {
            from: Number,
            to: Number
        }
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Sub-schema para historial de versiones
const VersionHistorySchema = new Schema({
    version: {
        type: Number,
        required: true
    },
    content: Schema.Types.Mixed,
    savedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    savedAt: {
        type: Date,
        default: Date.now
    },
    comment: String,
    // Tamaño del contenido para control
    contentSize: Number
}, { _id: true });

// Sub-schema para datos inyectados
const InjectedDataSchema = new Schema({
    // Snapshot de los datos de la auditoría al momento de generar
    audit: Schema.Types.Mixed,
    client: Schema.Types.Mixed,
    company: Schema.Types.Mixed,
    vulnerabilities: [Schema.Types.Mixed],
    stats: Schema.Types.Mixed,
    collaborators: [Schema.Types.Mixed],
    // Fecha del snapshot
    snapshotAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Schema principal
const ReportInstanceSchema = new Schema({
    // Referencia a la auditoría
    auditId: {
        type: Schema.Types.ObjectId,
        ref: 'Audit',
        required: [true, 'Audit ID is required'],
        index: true
    },
    
    // Referencia al template original
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'ReportTemplate',
        required: [true, 'Template ID is required']
    },
    
    // Nombre del reporte (puede diferir del template)
    name: {
        type: String,
        required: [true, 'Report name is required'],
        trim: true,
        maxlength: 255
    },
    
    // Contenido actual del documento (TipTap/ProseMirror JSON)
    content: {
        type: Schema.Types.Mixed,
        required: true
    },
    
    // Estado binario de Y.js para sincronización
    // Se almacena como Buffer para eficiencia
    yDocState: {
        type: Buffer,
        default: null
    },
    
    // Estilos (copiados del template, pueden modificarse)
    styles: Schema.Types.Mixed,
    
    // Header/Footer legacy (para compatibilidad)
    header: Schema.Types.Mixed,
    footer: Schema.Types.Mixed,
    coverPage: Schema.Types.Mixed,
    
    // Configuración avanzada de header/footer (nueva)
    headerConfig: Schema.Types.Mixed,
    footerConfig: Schema.Types.Mixed,
    pageNumbering: Schema.Types.Mixed,
    tableOfContents: Schema.Types.Mixed,
    
    // Datos inyectados de la auditoría
    injectedData: {
        type: InjectedDataSchema,
        default: null
    },
    
    // Variables personalizadas para este reporte
    customVariables: Schema.Types.Mixed,
    
    // Colaboradores actualmente editando
    activeCollaborators: [ActiveCollaboratorSchema],
    
    // Historial de versiones (últimas N versiones)
    versionHistory: {
        type: [VersionHistorySchema],
        default: []
    },
    
    // Versión actual
    currentVersion: {
        type: Number,
        default: 1
    },
    
    // Estado del reporte
    status: {
        type: String,
        enum: ['draft', 'in-progress', 'review', 'approved', 'exported', 'archived'],
        default: 'draft'
    },
    
    // Bloqueo para edición exclusiva (opcional)
    lockedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    lockedAt: Date,
    
    // Última exportación a PDF
    lastExport: {
        exportedAt: Date,
        exportedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        fileSize: Number,
        // Ruta o ID del archivo PDF generado
        filePath: String
    },
    
    // Comentarios/notas del reporte
    notes: [{
        text: String,
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        resolved: {
            type: Boolean,
            default: false
        }
    }],
    
    // Metadata
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    lastModifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.__v;
            // No incluir yDocState en JSON (es binario grande)
            delete ret.yDocState;
            return ret;
        }
    }
});

/**
 * Índices
 */
ReportInstanceSchema.index({ auditId: 1 }); // Permite múltiples reportes por auditoría
ReportInstanceSchema.index({ auditId: 1, templateId: 1 }, { unique: true }); // Único por combinación audit+template
ReportInstanceSchema.index({ templateId: 1 });
ReportInstanceSchema.index({ status: 1 });
ReportInstanceSchema.index({ 'activeCollaborators.userId': 1 });
ReportInstanceSchema.index({ createdAt: -1 });

/**
 * Estados del reporte
 */
ReportInstanceSchema.statics.STATUS = {
    DRAFT: 'draft',
    IN_PROGRESS: 'in-progress',
    REVIEW: 'review',
    APPROVED: 'approved',
    EXPORTED: 'exported',
    ARCHIVED: 'archived'
};

ReportInstanceSchema.statics.STATUS_LABELS = {
    'draft': 'Borrador',
    'in-progress': 'En Progreso',
    'review': 'En Revisión',
    'approved': 'Aprobado',
    'exported': 'Exportado',
    'archived': 'Archivado'
};

/**
 * Virtual: Tiene colaboradores activos
 */
ReportInstanceSchema.virtual('hasActiveCollaborators').get(function() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.activeCollaborators.some(c => c.lastActive > fiveMinutesAgo);
});

/**
 * Virtual: Cantidad de colaboradores activos
 */
ReportInstanceSchema.virtual('activeCollaboratorCount').get(function() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.activeCollaborators.filter(c => c.lastActive > fiveMinutesAgo).length;
});

/**
 * Método para agregar colaborador activo
 */
ReportInstanceSchema.methods.addCollaborator = function(userId, username) {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    const existingIndex = this.activeCollaborators.findIndex(
        c => c.userId.toString() === userId.toString()
    );
    
    if (existingIndex >= 0) {
        this.activeCollaborators[existingIndex].lastActive = new Date();
    } else {
        const usedColors = this.activeCollaborators.map(c => c.color);
        const availableColors = colors.filter(c => !usedColors.includes(c));
        const color = availableColors[0] || colors[Math.floor(Math.random() * colors.length)];
        
        this.activeCollaborators.push({
            userId,
            username,
            color,
            lastActive: new Date()
        });
    }
    
    return this;
};

/**
 * Método para remover colaborador
 */
ReportInstanceSchema.methods.removeCollaborator = function(userId) {
    this.activeCollaborators = this.activeCollaborators.filter(
        c => c.userId.toString() !== userId.toString()
    );
    return this;
};

/**
 * Método para limpiar colaboradores inactivos
 */
ReportInstanceSchema.methods.cleanInactiveCollaborators = function(minutes = 5) {
    const threshold = new Date(Date.now() - minutes * 60 * 1000);
    this.activeCollaborators = this.activeCollaborators.filter(
        c => c.lastActive > threshold
    );
    return this;
};

/**
 * Método para guardar versión
 */
ReportInstanceSchema.methods.saveVersion = function(userId, comment = '') {
    const MAX_VERSIONS = 20; // Mantener últimas 20 versiones
    
    this.versionHistory.push({
        version: this.currentVersion,
        content: this.content,
        savedBy: userId,
        savedAt: new Date(),
        comment,
        contentSize: JSON.stringify(this.content).length
    });
    
    // Limitar historial
    if (this.versionHistory.length > MAX_VERSIONS) {
        this.versionHistory = this.versionHistory.slice(-MAX_VERSIONS);
    }
    
    this.currentVersion += 1;
    this.lastModifiedBy = userId;
    
    return this;
};

/**
 * Método para restaurar versión
 */
ReportInstanceSchema.methods.restoreVersion = function(versionNumber, userId) {
    const version = this.versionHistory.find(v => v.version === versionNumber);
    if (!version) {
        throw new Error('Version not found');
    }
    
    // Guardar versión actual antes de restaurar
    this.saveVersion(userId, `Auto-save before restoring to version ${versionNumber}`);
    
    // Restaurar contenido
    this.content = version.content;
    this.lastModifiedBy = userId;
    
    return this;
};

/**
 * Método estático para obtener por auditoría
 */
ReportInstanceSchema.statics.getByAuditId = function(auditId) {
    return this.findOne({ auditId })
        .populate('templateId', 'name category')
        .populate('createdBy', 'username firstname lastname')
        .populate('lastModifiedBy', 'username firstname lastname');
};

/**
 * Middleware pre-save para actualizar timestamps
 */
ReportInstanceSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        this.markModified('content');
    }
    next();
});

const ReportInstance = mongoose.model('ReportInstance', ReportInstanceSchema);

module.exports = ReportInstance;