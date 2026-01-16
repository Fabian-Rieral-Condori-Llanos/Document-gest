const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * ReportTemplate Model
 * 
 * Plantilla base para reportes de auditoría.
 * Solo administradores pueden crear/editar plantillas.
 * 
 * El contenido se almacena en formato JSON compatible con TipTap/ProseMirror
 * para permitir edición colaborativa en tiempo real.
 */

// Sub-schema para variables del template (mapeo de datos)
const TemplateVariableSchema = new Schema({
    // ID único de la variable en el template
    id: {
        type: String,
        required: true
    },
    // Nombre visible para el usuario
    label: {
        type: String,
        required: true,
        trim: true
    },
    // Ruta al dato en el esquema (ej: "audit.name", "findings.title")
    dataPath: {
        type: String,
        required: true,
        trim: true
    },
    // Tipo de dato
    type: {
        type: String,
        enum: ['text', 'date', 'number', 'list', 'image', 'table', 'rich-text', 'computed'],
        default: 'text'
    },
    // Formato de presentación (para fechas, números, etc.)
    format: {
        type: String,
        trim: true
    },
    // Valor por defecto si el dato no existe
    defaultValue: Schema.Types.Mixed,
    // Si es requerido en el reporte
    required: {
        type: Boolean,
        default: false
    },
    // Si es un loop sobre un array
    isLoop: {
        type: Boolean,
        default: false
    },
    // Variable del iterador (para loops)
    loopVar: {
        type: String,
        default: 'item'
    },
    // Placeholder en el editor (ej: "{{audit.name}}")
    placeholder: {
        type: String
    },
    // Descripción para ayuda al usuario
    description: {
        type: String,
        trim: true
    }
}, { _id: false });

// Sub-schema para estilos del documento
const DocumentStylesSchema = new Schema({
    // Fuente principal
    fontFamily: {
        type: String,
        default: 'Arial, sans-serif'
    },
    // Tamaño de fuente base
    fontSize: {
        type: Number,
        default: 12
    },
    // Márgenes (en mm)
    margins: {
        top: { type: Number, default: 25 },
        right: { type: Number, default: 20 },
        bottom: { type: Number, default: 25 },
        left: { type: Number, default: 20 }
    },
    // Tamaño de página
    pageSize: {
        type: String,
        enum: ['A4', 'Letter', 'Legal'],
        default: 'A4'
    },
    // Orientación
    orientation: {
        type: String,
        enum: ['portrait', 'landscape'],
        default: 'portrait'
    },
    // Estilos de encabezados
    headings: {
        h1: { fontSize: { type: Number, default: 24 }, color: { type: String, default: '#1a1a1a' } },
        h2: { fontSize: { type: Number, default: 20 }, color: { type: String, default: '#1a1a1a' } },
        h3: { fontSize: { type: Number, default: 16 }, color: { type: String, default: '#1a1a1a' } }
    },
    // Color primario (para tablas, bordes, etc)
    primaryColor: {
        type: String,
        default: '#2563eb'
    },
    // CSS personalizado
    customCSS: {
        type: String,
        default: ''
    }
}, { _id: false });

// Sub-schema para secciones del documento
const DocumentSectionSchema = new Schema({
    // ID único de la sección
    id: {
        type: String,
        required: true
    },
    // Nombre de la sección
    name: {
        type: String,
        required: true
    },
    // Orden de la sección
    order: {
        type: Number,
        default: 0
    },
    // Si la sección es requerida
    required: {
        type: Boolean,
        default: false
    },
    // Si la sección se repite (ej: una por vulnerabilidad)
    repeatable: {
        type: Boolean,
        default: false
    },
    // Si es repetible, sobre qué lista itera
    repeatOver: {
        type: String // ej: "vulnerabilities", "findings"
    }
}, { _id: false });

// Schema principal
const ReportTemplateSchema = new Schema({
    // Nombre de la plantilla
    name: {
        type: String,
        required: [true, 'Template name is required'],
        unique: true,
        trim: true,
        maxlength: [255, 'Template name cannot exceed 255 characters']
    },
    
    // Descripción
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    // Contenido del documento en formato TipTap/ProseMirror JSON
    content: {
        type: Schema.Types.Mixed,
        default: {
            type: 'doc',
            content: [
                {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: 'Informe de Evaluación de Seguridad' }]
                },
                {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Contenido del informe...' }]
                }
            ]
        }
    },
    
    // Variables disponibles en el template
    variables: [TemplateVariableSchema],
    
    // Secciones del documento
    sections: [DocumentSectionSchema],
    
    // Estilos del documento
    styles: {
        type: DocumentStylesSchema,
        default: () => ({})
    },
    
    // Encabezado del documento (HTML/TipTap JSON)
    header: {
        type: Schema.Types.Mixed,
        default: null
    },
    
    // Pie de página del documento (HTML/TipTap JSON)
    footer: {
        type: Schema.Types.Mixed,
        default: null
    },
    
    // Portada (si aplica)
    coverPage: {
        type: Schema.Types.Mixed,
        default: null
    },
    
    // Extensión original si se importó desde archivo
    originalExtension: {
        type: String,
        maxlength: 10
    },
    
    // Archivo original (para referencia)
    originalFile: {
        filename: String,
        mimetype: String,
        size: Number,
        uploadedAt: Date
    },
    
    // Versión del template
    version: {
        type: Number,
        default: 1
    },
    
    // Estado
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Si es plantilla del sistema (no eliminable)
    isSystem: {
        type: Boolean,
        default: false
    },
    
    // Categoría de la plantilla
    category: {
        type: String,
        enum: ['security-audit', 'vulnerability-assessment', 'pentest', 'compliance', 'custom'],
        default: 'security-audit'
    },
    
    // Idioma del template
    language: {
        type: String,
        default: 'es'
    },
    
    // Thumbnail/preview image (base64 o URL)
    thumbnail: String,
    
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
ReportTemplateSchema.index({ name: 1 }, { unique: true });
ReportTemplateSchema.index({ isActive: 1 });
ReportTemplateSchema.index({ category: 1 });
ReportTemplateSchema.index({ name: 'text', description: 'text' });

/**
 * Variables predefinidas del sistema
 * Estas variables están disponibles automáticamente en todos los templates
 */
ReportTemplateSchema.statics.SYSTEM_VARIABLES = [
    // Auditoría
    { name: 'audit.name', type: 'text', description: 'Nombre de la auditoría', dataPath: 'audit.name' },
    { name: 'audit.date.start', type: 'date', description: 'Fecha de inicio', dataPath: 'audit.date.start' },
    { name: 'audit.date.end', type: 'date', description: 'Fecha de fin', dataPath: 'audit.date.end' },
    { name: 'audit.scope', type: 'rich-text', description: 'Alcance de la auditoría', dataPath: 'audit.scope' },
    
    // Cliente
    { name: 'client.name', type: 'text', description: 'Nombre del cliente', dataPath: 'client.name' },
    { name: 'client.logo', type: 'image', description: 'Logo del cliente', dataPath: 'client.logo' },
    
    // Empresa evaluadora
    { name: 'company.name', type: 'text', description: 'Nombre de la empresa', dataPath: 'company.name' },
    { name: 'company.logo', type: 'image', description: 'Logo de la empresa', dataPath: 'company.logo' },
    
    // Vulnerabilidades
    { name: 'vulnerabilities', type: 'list', description: 'Lista de vulnerabilidades', dataPath: 'findings' },
    { name: 'vulnerabilities.critical', type: 'list', description: 'Vulnerabilidades críticas', dataPath: 'findings.critical' },
    { name: 'vulnerabilities.high', type: 'list', description: 'Vulnerabilidades altas', dataPath: 'findings.high' },
    { name: 'vulnerabilities.medium', type: 'list', description: 'Vulnerabilidades medias', dataPath: 'findings.medium' },
    { name: 'vulnerabilities.low', type: 'list', description: 'Vulnerabilidades bajas', dataPath: 'findings.low' },
    { name: 'vulnerabilities.info', type: 'list', description: 'Vulnerabilidades informativas', dataPath: 'findings.info' },
    
    // Estadísticas
    { name: 'stats.total', type: 'number', description: 'Total de vulnerabilidades', dataPath: 'stats.total' },
    { name: 'stats.critical', type: 'number', description: 'Cantidad de críticas', dataPath: 'stats.critical' },
    { name: 'stats.high', type: 'number', description: 'Cantidad de altas', dataPath: 'stats.high' },
    { name: 'stats.medium', type: 'number', description: 'Cantidad de medias', dataPath: 'stats.medium' },
    { name: 'stats.low', type: 'number', description: 'Cantidad de bajas', dataPath: 'stats.low' },
    { name: 'stats.info', type: 'number', description: 'Cantidad de informativas', dataPath: 'stats.info' },
    
    // Colaboradores
    { name: 'collaborators', type: 'list', description: 'Lista de colaboradores', dataPath: 'collaborators' },
    
    // Fechas del documento
    { name: 'document.date', type: 'date', description: 'Fecha del documento', dataPath: 'document.date' },
    { name: 'document.version', type: 'text', description: 'Versión del documento', dataPath: 'document.version' }
];

/**
 * Categorías disponibles
 */
ReportTemplateSchema.statics.CATEGORIES = {
    'security-audit': 'Auditoría de Seguridad',
    'vulnerability-assessment': 'Evaluación de Vulnerabilidades',
    'pentest': 'Prueba de Penetración',
    'compliance': 'Cumplimiento',
    'custom': 'Personalizado'
};

/**
 * Método para obtener todas las variables (sistema + custom)
 */
ReportTemplateSchema.methods.getAllVariables = function() {
    const systemVars = ReportTemplateSchema.statics.SYSTEM_VARIABLES;
    const customVars = this.variables || [];
    return [...systemVars, ...customVars];
};

/**
 * Método para clonar template
 */
ReportTemplateSchema.methods.clone = function(newName) {
    const cloned = this.toObject();
    delete cloned._id;
    delete cloned.createdAt;
    delete cloned.updatedAt;
    cloned.name = newName;
    cloned.isSystem = false;
    cloned.version = 1;
    return new this.constructor(cloned);
};

/**
 * Método estático para obtener templates activos
 */
ReportTemplateSchema.statics.getActive = function() {
    return this.find({ isActive: true })
        .select('name description category language thumbnail createdAt')
        .sort({ name: 1 });
};

/**
 * Middleware pre-save para incrementar versión
 */
ReportTemplateSchema.pre('save', function(next) {
    if (this.isModified('content') && !this.isNew) {
        this.version += 1;
    }
    next();
});

const ReportTemplate = mongoose.model('ReportTemplate', ReportTemplateSchema);

module.exports = ReportTemplate;
