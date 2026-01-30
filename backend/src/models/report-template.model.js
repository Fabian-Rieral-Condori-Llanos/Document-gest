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

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Variable del template (mapeo de datos)
 */
const TemplateVariableSchema = new Schema({
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    dataPath: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: ['text', 'date', 'number', 'list', 'image', 'table', 'rich-text', 'computed'],
        default: 'text'
    },
    format: { type: String, trim: true },
    defaultValue: Schema.Types.Mixed,
    required: { type: Boolean, default: false },
    isLoop: { type: Boolean, default: false },
    loopVar: { type: String, default: 'item' },
    placeholder: { type: String },
    description: { type: String, trim: true }
}, { _id: false });

/**
 * Configuración de Header/Footer
 * Permite personalización completa del encabezado y pie de página
 */
const HeaderFooterConfigSchema = new Schema({
    // Si está habilitado
    enabled: { type: Boolean, default: true },
    
    // Altura en mm
    height: { type: Number, default: 15 },
    
    // Contenido para cada posición (left, center, right)
    left: {
        type: { type: String, enum: ['text', 'variable', 'image', 'none'], default: 'none' },
        content: { type: String, default: '' },  // Texto o variable como {{company.name}}
        image: { type: String },  // Base64 o URL de imagen
        style: {
            fontSize: { type: Number, default: 9 },
            fontWeight: { type: String, enum: ['normal', 'bold'], default: 'normal' },
            color: { type: String, default: '#6b7280' },
            fontStyle: { type: String, enum: ['normal', 'italic'], default: 'normal' }
        }
    },
    center: {
        type: { type: String, enum: ['text', 'variable', 'image', 'pageNumber', 'none'], default: 'none' },
        content: { type: String, default: '' },
        image: { type: String },
        style: {
            fontSize: { type: Number, default: 9 },
            fontWeight: { type: String, enum: ['normal', 'bold'], default: 'normal' },
            color: { type: String, default: '#6b7280' },
            fontStyle: { type: String, enum: ['normal', 'italic'], default: 'normal' }
        }
    },
    right: {
        type: { type: String, enum: ['text', 'variable', 'image', 'pageNumber', 'none'], default: 'none' },
        content: { type: String, default: '' },
        image: { type: String },
        style: {
            fontSize: { type: Number, default: 9 },
            fontWeight: { type: String, enum: ['normal', 'bold'], default: 'normal' },
            color: { type: String, default: '#6b7280' },
            fontStyle: { type: String, enum: ['normal', 'italic'], default: 'normal' }
        }
    },
    
    // Línea separadora
    showLine: { type: Boolean, default: false },
    lineColor: { type: String, default: '#e5e7eb' },
    lineWidth: { type: Number, default: 1 },
    
    // Mostrar en primera página
    showOnFirstPage: { type: Boolean, default: true },
    
    // Mostrar en páginas pares/impares (para documentos a doble cara)
    showOnEvenPages: { type: Boolean, default: true },
    showOnOddPages: { type: Boolean, default: true },
    
    // Contenido diferente para primera página
    differentFirstPage: { type: Boolean, default: false },
    firstPageContent: {
        left: { type: String, default: '' },
        center: { type: String, default: '' },
        right: { type: String, default: '' }
    }
}, { _id: false });

/**
 * Configuración de numeración de páginas
 */
const PageNumberingSchema = new Schema({
    // Si está habilitado
    enabled: { type: Boolean, default: true },
    
    // Formato: 'numeric' (1, 2, 3), 'roman' (i, ii, iii), 'romanUpper' (I, II, III), 'alpha' (a, b, c)
    format: { 
        type: String, 
        enum: ['numeric', 'roman', 'romanUpper', 'alpha', 'alphaUpper'],
        default: 'numeric'
    },
    
    // Posición: header o footer
    position: { 
        type: String, 
        enum: ['header', 'footer'],
        default: 'footer'
    },
    
    // Alineación dentro del header/footer
    alignment: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'right'
    },
    
    // Plantilla de texto: {{pageNumber}}, {{totalPages}}
    // Ejemplos: "Página {{pageNumber}} de {{totalPages}}", "{{pageNumber}}/{{totalPages}}", "- {{pageNumber}} -"
    template: { type: String, default: 'Página {{pageNumber}} de {{totalPages}}' },
    
    // Número inicial (por defecto 1)
    startNumber: { type: Number, default: 1 },
    
    // No mostrar número en primera página
    skipFirstPage: { type: Boolean, default: false },
    
    // Estilo
    style: {
        fontSize: { type: Number, default: 9 },
        fontWeight: { type: String, enum: ['normal', 'bold'], default: 'normal' },
        color: { type: String, default: '#6b7280' },
        fontStyle: { type: String, enum: ['normal', 'italic'], default: 'normal' }
    }
}, { _id: false });

/**
 * Estilos del documento
 */
const DocumentStylesSchema = new Schema({
    // Fuente principal
    fontFamily: { type: String, default: 'Arial, sans-serif' },
    fontSize: { type: Number, default: 11 },
    lineHeight: { type: Number, default: 1.5 },
    
    // Márgenes (en mm)
    margins: {
        top: { type: Number, default: 25 },
        right: { type: Number, default: 20 },
        bottom: { type: Number, default: 25 },
        left: { type: Number, default: 20 }
    },
    
    // Tamaño y orientación de página
    pageSize: { type: String, enum: ['A4', 'Letter', 'Legal', 'A3'], default: 'A4' },
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    
    // Estilos de encabezados
    headings: {
        h1: { 
            fontSize: { type: Number, default: 22 }, 
            color: { type: String, default: '#1a1a1a' },
            marginTop: { type: Number, default: 24 },
            marginBottom: { type: Number, default: 12 },
            fontWeight: { type: String, default: 'bold' },
            borderBottom: { type: Boolean, default: true },
            borderColor: { type: String, default: '#2563eb' }
        },
        h2: { 
            fontSize: { type: Number, default: 18 }, 
            color: { type: String, default: '#1a1a1a' },
            marginTop: { type: Number, default: 20 },
            marginBottom: { type: Number, default: 10 },
            fontWeight: { type: String, default: 'bold' },
            borderBottom: { type: Boolean, default: true },
            borderColor: { type: String, default: '#e5e7eb' }
        },
        h3: { 
            fontSize: { type: Number, default: 14 }, 
            color: { type: String, default: '#374151' },
            marginTop: { type: Number, default: 16 },
            marginBottom: { type: Number, default: 8 },
            fontWeight: { type: String, default: 'bold' },
            borderBottom: { type: Boolean, default: false }
        },
        h4: { 
            fontSize: { type: Number, default: 12 }, 
            color: { type: String, default: '#374151' },
            marginTop: { type: Number, default: 12 },
            marginBottom: { type: Number, default: 6 },
            fontWeight: { type: String, default: 'bold' }
        }
    },
    
    // Colores del tema
    colors: {
        primary: { type: String, default: '#2563eb' },
        secondary: { type: String, default: '#64748b' },
        accent: { type: String, default: '#0891b2' },
        success: { type: String, default: '#16a34a' },
        warning: { type: String, default: '#ca8a04' },
        danger: { type: String, default: '#dc2626' },
        info: { type: String, default: '#2563eb' }
    },
    
    // Estilos de tablas
    tables: {
        headerBackground: { type: String, default: '#2563eb' },
        headerColor: { type: String, default: '#ffffff' },
        borderColor: { type: String, default: '#d1d5db' },
        stripedRows: { type: Boolean, default: true },
        stripedColor: { type: String, default: '#f9fafb' }
    },
    
    // Estilos de código
    code: {
        fontFamily: { type: String, default: "'Courier New', monospace" },
        fontSize: { type: Number, default: 10 },
        background: { type: String, default: '#1f2937' },
        color: { type: String, default: '#e5e7eb' },
        padding: { type: Number, default: 12 }
    },
    
    // CSS personalizado adicional
    customCSS: { type: String, default: '' }
}, { _id: false });

/**
 * Sección del documento
 */
const DocumentSectionSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    required: { type: Boolean, default: false },
    repeatable: { type: Boolean, default: false },
    repeatOver: { type: String },
    // Si esta sección inicia en nueva página
    pageBreakBefore: { type: Boolean, default: false }
}, { _id: false });

/**
 * Configuración de portada
 */
const CoverPageSchema = new Schema({
    enabled: { type: Boolean, default: true },
    
    // Contenido TipTap JSON
    content: { type: Schema.Types.Mixed },
    
    // Logo principal (empresa evaluadora)
    showCompanyLogo: { type: Boolean, default: true },
    companyLogoPosition: { type: String, enum: ['top', 'center', 'bottom'], default: 'top' },
    companyLogoMaxHeight: { type: Number, default: 60 },
    
    // Logo del cliente
    showClientLogo: { type: Boolean, default: false },
    clientLogoPosition: { type: String, enum: ['top', 'center', 'bottom'], default: 'bottom' },
    clientLogoMaxHeight: { type: Number, default: 50 },
    
    // Título
    title: {
        text: { type: String, default: '{{audit.name}}' },
        fontSize: { type: Number, default: 28 },
        color: { type: String, default: '#1a1a1a' },
        alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' }
    },
    
    // Subtítulo
    subtitle: {
        text: { type: String, default: 'Informe de Evaluación de Seguridad' },
        fontSize: { type: Number, default: 16 },
        color: { type: String, default: '#6b7280' },
        alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' }
    },
    
    // Información adicional
    showDate: { type: Boolean, default: true },
    showVersion: { type: Boolean, default: true },
    showConfidentiality: { type: Boolean, default: true },
    confidentialityText: { type: String, default: 'CONFIDENCIAL' },
    
    // Color de fondo o imagen
    backgroundColor: { type: String, default: '#ffffff' },
    backgroundImage: { type: String }
}, { _id: false });

/**
 * Configuración de tabla de contenidos
 */
const TOCConfigSchema = new Schema({
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Tabla de Contenidos' },
    maxLevel: { type: Number, default: 3 },  // Hasta h3
    showPageNumbers: { type: Boolean, default: true },
    dotLeader: { type: Boolean, default: true },  // Puntos entre título y número
    pageBreakAfter: { type: Boolean, default: true }
}, { _id: false });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const ReportTemplateSchema = new Schema({
    // Nombre único de la plantilla
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
    
    // Configuración de Header
    headerConfig: {
        type: HeaderFooterConfigSchema,
        default: () => ({
            enabled: true,
            height: 15,
            left: { type: 'variable', content: '{{company.shortName}}' },
            center: { type: 'none' },
            right: { type: 'variable', content: '{{audit.name}}' },
            showLine: true,
            showOnFirstPage: false
        })
    },
    
    // Configuración de Footer
    footerConfig: {
        type: HeaderFooterConfigSchema,
        default: () => ({
            enabled: true,
            height: 15,
            left: { type: 'text', content: 'CONFIDENCIAL' },
            center: { type: 'none' },
            right: { type: 'pageNumber' },
            showLine: true,
            showOnFirstPage: false
        })
    },
    
    // Configuración de numeración de páginas
    pageNumbering: {
        type: PageNumberingSchema,
        default: () => ({})
    },
    
    // Configuración de portada
    coverPage: {
        type: CoverPageSchema,
        default: () => ({})
    },
    
    // Configuración de tabla de contenidos
    tableOfContents: {
        type: TOCConfigSchema,
        default: () => ({})
    },
    
    // Campos legacy (para compatibilidad)
    header: { type: Schema.Types.Mixed, default: null },
    footer: { type: Schema.Types.Mixed, default: null },
    
    // Metadatos del archivo original
    originalExtension: { type: String, maxlength: 10 },
    originalFile: {
        filename: String,
        mimetype: String,
        size: Number,
        uploadedAt: Date
    },
    
    // Versión del template
    version: { type: Number, default: 1 },
    
    // Estado
    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false },
    
    // Categoría
    category: {
        type: String,
        enum: ['security-audit', 'vulnerability-assessment', 'pentest', 'compliance', 'verification', 'custom'],
        default: 'security-audit'
    },
    
    // Idioma
    language: { type: String, default: 'es' },
    
    // Thumbnail
    thumbnail: String,
    
    // Auditoría
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
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

// ============================================
// ÍNDICES
// ============================================

ReportTemplateSchema.index({ name: 1 }, { unique: true });
ReportTemplateSchema.index({ isActive: 1 });
ReportTemplateSchema.index({ category: 1 });
ReportTemplateSchema.index({ language: 1 });
ReportTemplateSchema.index({ name: 'text', description: 'text' });

// ============================================
// CONSTANTES ESTÁTICAS
// ============================================

/**
 * Variables del sistema disponibles automáticamente
 */
ReportTemplateSchema.statics.SYSTEM_VARIABLES = [
    // Auditoría
    { id: 'audit.name', label: 'Nombre de Auditoría', dataPath: 'audit.name', type: 'text' },
    { id: 'audit.auditType', label: 'Tipo de Auditoría', dataPath: 'audit.auditType', type: 'text' },
    { id: 'audit.date', label: 'Fecha de Auditoría', dataPath: 'audit.date', type: 'date' },
    { id: 'audit.date_start', label: 'Fecha Inicio', dataPath: 'audit.date_start', type: 'date' },
    { id: 'audit.date_end', label: 'Fecha Fin', dataPath: 'audit.date_end', type: 'date' },
    { id: 'audit.summary', label: 'Resumen', dataPath: 'audit.summary', type: 'rich-text' },
    { id: 'audit.language', label: 'Idioma', dataPath: 'audit.language', type: 'text' },
    
    // Procedure
    { id: 'procedure.alcance', label: 'Alcance', dataPath: 'procedure.alcance', type: 'list' },
    { id: 'procedure.alcanceDescripcion', label: 'Descripción del Alcance', dataPath: 'procedure.alcanceDescripcion', type: 'rich-text' },
    { id: 'procedure.solicitud.cite', label: 'CITE Solicitud', dataPath: 'procedure.solicitud.cite', type: 'text' },
    { id: 'procedure.informe.cite', label: 'CITE Informe', dataPath: 'procedure.informe.cite', type: 'text' },
    
    // Cliente
    { id: 'client.firstname', label: 'Nombre del Contacto', dataPath: 'client.firstname', type: 'text' },
    { id: 'client.lastname', label: 'Apellido del Contacto', dataPath: 'client.lastname', type: 'text' },
    { id: 'client.email', label: 'Email del Contacto', dataPath: 'client.email', type: 'text' },
    { id: 'client.title', label: 'Cargo del Contacto', dataPath: 'client.title', type: 'text' },
    
    // Empresa (cliente)
    { id: 'company.name', label: 'Nombre de Empresa', dataPath: 'company.name', type: 'text' },
    { id: 'company.shortName', label: 'Nombre Corto', dataPath: 'company.shortName', type: 'text' },
    { id: 'company.logo', label: 'Logo de Empresa', dataPath: 'company.logo', type: 'image' },
    
    // Findings/Vulnerabilidades
    { id: 'findings', label: 'Lista de Hallazgos', dataPath: 'findings', type: 'list', isLoop: true },
    { id: 'findings.critical', label: 'Hallazgos Críticos', dataPath: 'findings.critical', type: 'list', isLoop: true },
    { id: 'findings.high', label: 'Hallazgos Altos', dataPath: 'findings.high', type: 'list', isLoop: true },
    { id: 'findings.medium', label: 'Hallazgos Medios', dataPath: 'findings.medium', type: 'list', isLoop: true },
    { id: 'findings.low', label: 'Hallazgos Bajos', dataPath: 'findings.low', type: 'list', isLoop: true },
    { id: 'findings.info', label: 'Hallazgos Informativos', dataPath: 'findings.info', type: 'list', isLoop: true },
    
    // Estadísticas
    { id: 'stats.total', label: 'Total de Hallazgos', dataPath: 'stats.total', type: 'number' },
    { id: 'stats.critical', label: 'Cantidad Críticos', dataPath: 'stats.critical', type: 'number' },
    { id: 'stats.high', label: 'Cantidad Altos', dataPath: 'stats.high', type: 'number' },
    { id: 'stats.medium', label: 'Cantidad Medios', dataPath: 'stats.medium', type: 'number' },
    { id: 'stats.low', label: 'Cantidad Bajos', dataPath: 'stats.low', type: 'number' },
    { id: 'stats.info', label: 'Cantidad Informativos', dataPath: 'stats.info', type: 'number' },
    
    // Retest (para verificaciones)
    { id: 'retest.total', label: 'Total Verificados', dataPath: 'retest.total', type: 'number' },
    { id: 'retest.ok', label: 'Corregidos', dataPath: 'retest.ok', type: 'number' },
    { id: 'retest.ko', label: 'No Corregidos', dataPath: 'retest.ko', type: 'number' },
    { id: 'retest.partial', label: 'Parcialmente Corregidos', dataPath: 'retest.partial', type: 'number' },
    
    // Colaboradores
    { id: 'collaborators', label: 'Colaboradores', dataPath: 'collaborators', type: 'list' },
    { id: 'reviewers', label: 'Revisores', dataPath: 'reviewers', type: 'list' },
    
    // Documento
    { id: 'document.date', label: 'Fecha del Documento', dataPath: 'document.date', type: 'date' },
    { id: 'document.version', label: 'Versión del Documento', dataPath: 'document.version', type: 'text' },
    { id: 'document.generatedAt', label: 'Fecha de Generación', dataPath: 'document.generatedAt', type: 'date' }
];

/**
 * Categorías disponibles
 */
ReportTemplateSchema.statics.CATEGORIES = {
    'security-audit': 'Auditoría de Seguridad',
    'vulnerability-assessment': 'Evaluación de Vulnerabilidades',
    'pentest': 'Prueba de Penetración',
    'compliance': 'Cumplimiento',
    'verification': 'Verificación/Retest',
    'custom': 'Personalizado'
};

/**
 * Formatos de numeración de página
 */
ReportTemplateSchema.statics.PAGE_NUMBER_FORMATS = {
    'numeric': { name: 'Numérico', example: '1, 2, 3...' },
    'roman': { name: 'Romano minúscula', example: 'i, ii, iii...' },
    'romanUpper': { name: 'Romano mayúscula', example: 'I, II, III...' },
    'alpha': { name: 'Alfabético minúscula', example: 'a, b, c...' },
    'alphaUpper': { name: 'Alfabético mayúscula', example: 'A, B, C...' }
};

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Obtiene todas las variables (sistema + custom)
 */
ReportTemplateSchema.methods.getAllVariables = function() {
    const systemVars = ReportTemplateSchema.statics.SYSTEM_VARIABLES;
    const customVars = this.variables || [];
    return [...systemVars, ...customVars];
};

/**
 * Clona el template
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

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Obtiene templates activos
 */
ReportTemplateSchema.statics.getActive = function() {
    return this.find({ isActive: true })
        .select('name description category language thumbnail createdAt')
        .sort({ name: 1 });
};

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Incrementa versión al modificar contenido
 */
ReportTemplateSchema.pre('save', function(next) {
    if (this.isModified('content') && !this.isNew) {
        this.version += 1;
    }
    next();
});

const ReportTemplate = mongoose.model('ReportTemplate', ReportTemplateSchema);

module.exports = ReportTemplate;