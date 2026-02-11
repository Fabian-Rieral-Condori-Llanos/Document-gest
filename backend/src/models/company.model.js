const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Company Model
 * 
 * Define la estructura de datos para compañías/empresas.
 * La lógica de negocio está en services/company.service.js
 * 
 * CATEGORÍAS:
 * - CENTRAL: Nivel central del gobierno
 *   - MINISTERIO: Ministerios
 *   - UNIVERSIDAD: Universidades públicas
 *   - DESCONCENTRADO: Entidades desconcentradas
 *   - EMPRESA_CENTRAL: Empresas a nivel central
 *   - DESCENTRALIZADO: Entidades descentralizadas
 * 
 * - TERRITORIAL: Nivel territorial
 *   - GOBERNACION: Gobernaciones departamentales
 *   - EMPRESA_GOBERNACION: Empresas de gobernaciones
 *   - MUNICIPIO: Municipios
 *   - EMPRESA_MUNICIPAL: Empresas municipales
 */

/**
 * Sub-esquema para documentos con gestión, fecha, cite y descripción
 */
const DocumentoConCiteSchema = new Schema({
    gestion: {
        type: Number,
        min: 2000,
        max: 2100
    },
    fecha: {
        type: Date
    },
    cite: {
        type: String,
        maxlength: 100
    },
    descripcion: {
        type: String,
        maxlength: 500
    }
}, { _id: true, timestamps: true });

/**
 * Sub-esquema para borradores (sin cite)
 */
const DocumentoBorradorSchema = new Schema({
    gestion: {
        type: Number,
        min: 2000,
        max: 2100
    },
    fecha: {
        type: Date
    },
    descripcion: {
        type: String,
        maxlength: 500
    }
}, { _id: true, timestamps: true });

/**
 * Categorías válidas para empresas
 */
const CATEGORIAS = {
    // Nivel Central
    MINISTERIO: 'MINISTERIO',
    UNIVERSIDAD: 'UNIVERSIDAD',
    DESCONCENTRADO: 'DESCONCENTRADO',
    EMPRESA_CENTRAL: 'EMPRESA_CENTRAL',
    DESCENTRALIZADO: 'DESCENTRALIZADO',
    // Nivel Territorial
    GOBERNACION: 'GOBERNACION',
    EMPRESA_GOBERNACION: 'EMPRESA_GOBERNACION',
    MUNICIPIO: 'MUNICIPIO',
    EMPRESA_MUNICIPAL: 'EMPRESA_MUNICIPAL'
};

/**
 * Niveles válidos
 */
const NIVELES = {
    CENTRAL: 'CENTRAL',
    TERRITORIAL: 'TERRITORIAL'
};

/**
 * Esquema principal de Company
 */
const CompanySchema = new Schema({
    // Campos básicos existentes
    name: {
        type: String,
        required: [true, 'Company name is required'],
        unique: true,
        maxlength: [255, 'Company name cannot exceed 255 characters']
    },
    shortName: {
        type: String,
        maxlength: [50, 'Short name cannot exceed 50 characters']
    },
    logo: {
        type: String  // Base64 encoded image
    },

    // ============================================
    // NUEVOS CAMPOS
    // ============================================

    /**
     * Estado de la empresa (activo/inactivo)
     */
    status: {
        type: Boolean,
        default: true,
        index: true
    },

    /**
     * Cuadro de Mando - Prioridad para estadísticas
     * Si es true, esta empresa tiene prioridad en dashboards
     */
    cuadroDeMando: {
        type: Boolean,
        default: false,
        index: true
    },

    /**
     * Nivel de Madurez de la empresa
     */
    nivelDeMadurez: {
        type: String,
        maxlength: 100
    },

    /**
     * Nivel organizacional (Central o Territorial)
     */
    nivel: {
        type: String,
        enum: Object.values(NIVELES),
        default: NIVELES.CENTRAL
    },

    /**
     * Categoría de la empresa según su nivel
     */
    categoria: {
        type: String,
        enum: Object.values(CATEGORIAS)
    },

    /**
     * PISI - Plan Institucional de Seguridad de la Información
     * Array de documentos con gestión, fecha, cite y descripción
     */
    pisi: {
        type: [DocumentoConCiteSchema],
        default: []
    },

    /**
     * Actualizaciones del PISI
     */
    actualizacionPisi: {
        type: [DocumentoConCiteSchema],
        default: []
    },

    /**
     * Borradores de PISI (sin cite)
     */
    borradorPisi: {
        type: [DocumentoBorradorSchema],
        default: []
    },

    /**
     * Seguimiento del PISI
     */
    seguimientoPisi: {
        type: [DocumentoConCiteSchema],
        default: []
    },

    /**
     * Borradores de Plan de Contingencia (sin cite)
     */
    borradorPlanContingencia: {
        type: [DocumentoBorradorSchema],
        default: []
    },

    /**
     * Plan de Contingencia aprobado
     */
    planContingencia: {
        type: [DocumentoConCiteSchema],
        default: []
    },

    /**
     * Informes Técnicos
     */
    informeTecnico: {
        type: [DocumentoConCiteSchema],
        default: []
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
 * Índices compuestos para consultas frecuentes
 */
CompanySchema.index({ status: 1, cuadroDeMando: -1, name: 1 });
CompanySchema.index({ nivel: 1, categoria: 1 });
CompanySchema.index({ status: 1, nivel: 1 });

/**
 * Campos para listados básicos
 */
CompanySchema.statics.listFields = 'name shortName logo status cuadroDeMando nivel categoria nivelDeMadurez';

/**
 * Campos para listados completos
 */
CompanySchema.statics.fullFields = '-__v';

/**
 * Categorías disponibles
 */
CompanySchema.statics.CATEGORIAS = CATEGORIAS;

/**
 * Niveles disponibles
 */
CompanySchema.statics.NIVELES = NIVELES;

/**
 * Obtener categorías por nivel
 */
CompanySchema.statics.getCategoriasPorNivel = function(nivel) {
    if (nivel === NIVELES.CENTRAL) {
        return [
            CATEGORIAS.MINISTERIO,
            CATEGORIAS.UNIVERSIDAD,
            CATEGORIAS.DESCONCENTRADO,
            CATEGORIAS.EMPRESA_CENTRAL,
            CATEGORIAS.DESCENTRALIZADO
        ];
    } else if (nivel === NIVELES.TERRITORIAL) {
        return [
            CATEGORIAS.GOBERNACION,
            CATEGORIAS.EMPRESA_GOBERNACION,
            CATEGORIAS.MUNICIPIO,
            CATEGORIAS.EMPRESA_MUNICIPAL
        ];
    }
    return [];
};

/**
 * Virtual para obtener el nivel basado en la categoría
 */
CompanySchema.virtual('nivelCalculado').get(function() {
    const categoriasCentral = [
        CATEGORIAS.MINISTERIO,
        CATEGORIAS.UNIVERSIDAD,
        CATEGORIAS.DESCONCENTRADO,
        CATEGORIAS.EMPRESA_CENTRAL,
        CATEGORIAS.DESCENTRALIZADO
    ];
    
    if (categoriasCentral.includes(this.categoria)) {
        return NIVELES.CENTRAL;
    }
    return NIVELES.TERRITORIAL;
});

/**
 * Método para agregar documento a un array específico
 */
CompanySchema.methods.agregarDocumento = function(tipoDocumento, documento) {
    const camposValidos = [
        'pisi', 'actualizacionPisi', 'borradorPisi', 'seguimientoPisi',
        'borradorPlanContingencia', 'planContingencia', 'informeTecnico'
    ];
    
    if (!camposValidos.includes(tipoDocumento)) {
        throw new Error(`Tipo de documento inválido: ${tipoDocumento}`);
    }
    
    this[tipoDocumento].push(documento);
    return this.save();
};

/**
 * Método para obtener el último documento de un tipo
 */
CompanySchema.methods.getUltimoDocumento = function(tipoDocumento) {
    if (!this[tipoDocumento] || this[tipoDocumento].length === 0) {
        return null;
    }
    
    // Ordenar por fecha descendente y retornar el primero
    const ordenados = [...this[tipoDocumento]].sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
        const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
        return fechaB - fechaA;
    });
    
    return ordenados[0];
};

/**
 * Método para obtener documentos por gestión
 */
CompanySchema.methods.getDocumentosPorGestion = function(tipoDocumento, gestion) {
    if (!this[tipoDocumento]) {
        return [];
    }
    
    return this[tipoDocumento].filter(doc => doc.gestion === gestion);
};

const Company = mongoose.model('Company', CompanySchema);

module.exports = Company;