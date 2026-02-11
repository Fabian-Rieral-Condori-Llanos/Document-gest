const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * AnalyticsPermission Model
 * 
 * Define los permisos granulares para usuarios con rol 'analyst'.
 * Permite al admin configurar:
 * - Qué endpoints puede acceder
 * - Si solo ve compañías con cuadroDeMando=true
 * - Qué compañías específicas puede ver
 * - Qué secciones de datos son visibles
 */

/**
 * Esquema de filtros para endpoints específicos
 */
const EndpointFilterSchema = new Schema({
    // Si el endpoint está habilitado para este usuario
    enabled: {
        type: Boolean,
        default: true
    },
    // Solo mostrar compañías con cuadroDeMando = true
    onlyCuadroDeMando: {
        type: Boolean,
        default: false
    },
    // Lista de compañías permitidas (vacío = todas las permitidas por filtros globales)
    allowedCompanies: [{
        type: Schema.Types.ObjectId,
        ref: 'Company'
    }],
    // Campos específicos a excluir de la respuesta
    excludedFields: [{
        type: String,
        trim: true
    }],
    // Límite de resultados (0 = sin límite)
    maxResults: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

/**
 * Configuración de secciones visibles en dashboards
 * Cada sección corresponde a un bloque de datos en la respuesta
 */
const DataSectionSchema = new Schema({
    // Estadísticas generales (totalEvaluaciones, vulnCriticas, etc.)
    stats: { type: Boolean, default: true },
    // Gráfico de evaluaciones por procedimiento (PR01, PR02, etc.)
    evaluacionesPorProcedimiento: { type: Boolean, default: true },
    // Gráfico de evaluaciones por alcance
    evaluacionesPorAlcance: { type: Boolean, default: true },
    // Gráfico de evaluaciones por estado
    evaluacionesPorEstado: { type: Boolean, default: true },
    // Gráfico de evaluaciones por tipo
    evaluacionesPorTipo: { type: Boolean, default: true },
    // Gráfico de vulnerabilidades por severidad
    vulnerabilidadesPorSeveridad: { type: Boolean, default: true },
    // Gráfico de tendencia mensual
    tendenciaMensual: { type: Boolean, default: true },
    // Tabla de entidades evaluadas
    entidadesEvaluadas: { type: Boolean, default: true },
    // Lista de evaluaciones recientes
    evaluacionesRecientes: { type: Boolean, default: true },
    // Panel de alertas activas
    alertasActivas: { type: Boolean, default: true },
    // Clientes asociados (solo en dashboard de compañía)
    clientesAsociados: { type: Boolean, default: true }
}, { _id: false });

/**
 * Esquema principal de permisos de Analytics
 */
const AnalyticsPermissionSchema = new Schema({
    /**
     * Usuario al que aplican estos permisos
     * Relación 1:1 con User
     */
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'userId is required'],
        unique: true,
        index: true
    },
    
    /**
     * Activar/desactivar permisos personalizados
     * Si es false, el usuario ve todo (comportamiento por defecto)
     * Si es true, se aplican todas las restricciones configuradas
     */
    customPermissionsEnabled: {
        type: Boolean,
        default: false
    },
    
    /**
     * FILTROS GLOBALES
     * Estos filtros aplican a TODOS los endpoints
     */
    
    // Solo mostrar compañías con cuadroDeMando = true
    globalOnlyCuadroDeMando: {
        type: Boolean,
        default: false
    },
    
    // Lista de compañías permitidas globalmente
    // Si está vacío, se permiten todas (sujeto a otros filtros)
    globalAllowedCompanies: [{
        type: Schema.Types.ObjectId,
        ref: 'Company'
    }],
    
    // Excluir compañías específicas
    globalExcludedCompanies: [{
        type: Schema.Types.ObjectId,
        ref: 'Company'
    }],
    
    /**
     * CONFIGURACIÓN POR ENDPOINT
     * Permite configuración específica para cada endpoint
     */
    endpoints: {
        // GET /api/analytics/dashboard/global
        globalDashboard: {
            type: EndpointFilterSchema,
            default: () => ({})
        },
        // GET /api/analytics/dashboard/company/:companyId
        companyDashboard: {
            type: EndpointFilterSchema,
            default: () => ({})
        },
        // GET /api/analytics/dashboard/audit/:auditId
        auditDashboard: {
            type: EndpointFilterSchema,
            default: () => ({})
        },
        // GET /api/analytics/entidades-criticas
        entidadesCriticas: {
            type: EndpointFilterSchema,
            default: () => ({})
        },
        // GET /api/analytics/vulnerabilidades/entidad/:companyId
        vulnerabilidadesEntidad: {
            type: EndpointFilterSchema,
            default: () => ({})
        }
    },
    
    /**
     * SECCIONES DE DATOS VISIBLES
     * Controla qué bloques de información se muestran en los dashboards
     */
    visibleSections: {
        type: DataSectionSchema,
        default: () => ({})
    },
    
    /**
     * METADATOS DE AUDITORÍA
     */
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    
    /**
     * Notas del administrador sobre esta configuración
     */
    notes: {
        type: String,
        maxlength: 500
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
 * Índices para consultas frecuentes
 */
AnalyticsPermissionSchema.index({ customPermissionsEnabled: 1 });
AnalyticsPermissionSchema.index({ 'endpoints.globalDashboard.enabled': 1 });

/**
 * MÉTODOS DE INSTANCIA
 */

/**
 * Verifica si una compañía específica está permitida para un endpoint
 * @param {ObjectId|String} companyId - ID de la compañía
 * @param {String} endpointName - Nombre del endpoint
 * @returns {Boolean}
 */
AnalyticsPermissionSchema.methods.isCompanyAllowed = function(companyId, endpointName) {
    // Si no hay permisos personalizados, permitir todo
    if (!this.customPermissionsEnabled) {
        return true;
    }
    
    const companyIdStr = companyId.toString();
    
    // Verificar si está en la lista de excluidos globales
    if (this.globalExcludedCompanies && this.globalExcludedCompanies.length > 0) {
        const isExcluded = this.globalExcludedCompanies.some(
            id => id.toString() === companyIdStr
        );
        if (isExcluded) return false;
    }
    
    // Obtener configuración del endpoint
    const endpoint = this.endpoints[endpointName];
    
    // Si el endpoint está deshabilitado, no permitir
    if (endpoint && endpoint.enabled === false) {
        return false;
    }
    
    // Verificar lista de compañías permitidas del endpoint
    if (endpoint && endpoint.allowedCompanies && endpoint.allowedCompanies.length > 0) {
        return endpoint.allowedCompanies.some(
            id => id.toString() === companyIdStr
        );
    }
    
    // Verificar lista global de compañías permitidas
    if (this.globalAllowedCompanies && this.globalAllowedCompanies.length > 0) {
        return this.globalAllowedCompanies.some(
            id => id.toString() === companyIdStr
        );
    }
    
    // Si no hay restricciones específicas, permitir
    return true;
};

/**
 * Verifica si debe aplicar filtro por cuadroDeMando
 * @param {String} endpointName - Nombre del endpoint
 * @returns {Boolean}
 */
AnalyticsPermissionSchema.methods.shouldFilterByCuadroDeMando = function(endpointName) {
    if (!this.customPermissionsEnabled) {
        return false;
    }
    
    // Filtro global tiene prioridad
    if (this.globalOnlyCuadroDeMando) {
        return true;
    }
    
    // Verificar filtro específico del endpoint
    const endpoint = this.endpoints[endpointName];
    return endpoint?.onlyCuadroDeMando || false;
};

/**
 * Verifica si un endpoint está habilitado
 * @param {String} endpointName - Nombre del endpoint
 * @returns {Boolean}
 */
AnalyticsPermissionSchema.methods.isEndpointEnabled = function(endpointName) {
    if (!this.customPermissionsEnabled) {
        return true;
    }
    
    const endpoint = this.endpoints[endpointName];
    return endpoint?.enabled !== false;
};

/**
 * Obtiene los campos excluidos para un endpoint
 * @param {String} endpointName - Nombre del endpoint
 * @returns {Array<String>}
 */
AnalyticsPermissionSchema.methods.getExcludedFields = function(endpointName) {
    if (!this.customPermissionsEnabled) {
        return [];
    }
    
    const endpoint = this.endpoints[endpointName];
    return endpoint?.excludedFields || [];
};

/**
 * Obtiene el límite de resultados para un endpoint
 * @param {String} endpointName - Nombre del endpoint
 * @returns {Number} 0 = sin límite
 */
AnalyticsPermissionSchema.methods.getMaxResults = function(endpointName) {
    if (!this.customPermissionsEnabled) {
        return 0;
    }
    
    const endpoint = this.endpoints[endpointName];
    return endpoint?.maxResults || 0;
};

/**
 * Obtiene las secciones visibles
 * @returns {Object} Objeto con cada sección y su visibilidad
 */
AnalyticsPermissionSchema.methods.getVisibleSections = function() {
    // Si no hay permisos personalizados, todas las secciones son visibles
    if (!this.customPermissionsEnabled) {
        return {
            stats: true,
            evaluacionesPorProcedimiento: true,
            evaluacionesPorAlcance: true,
            evaluacionesPorEstado: true,
            evaluacionesPorTipo: true,
            vulnerabilidadesPorSeveridad: true,
            tendenciaMensual: true,
            entidadesEvaluadas: true,
            evaluacionesRecientes: true,
            alertasActivas: true,
            clientesAsociados: true
        };
    }
    
    return {
        stats: this.visibleSections.stats !== false,
        evaluacionesPorProcedimiento: this.visibleSections.evaluacionesPorProcedimiento !== false,
        evaluacionesPorAlcance: this.visibleSections.evaluacionesPorAlcance !== false,
        evaluacionesPorEstado: this.visibleSections.evaluacionesPorEstado !== false,
        evaluacionesPorTipo: this.visibleSections.evaluacionesPorTipo !== false,
        vulnerabilidadesPorSeveridad: this.visibleSections.vulnerabilidadesPorSeveridad !== false,
        tendenciaMensual: this.visibleSections.tendenciaMensual !== false,
        entidadesEvaluadas: this.visibleSections.entidadesEvaluadas !== false,
        evaluacionesRecientes: this.visibleSections.evaluacionesRecientes !== false,
        alertasActivas: this.visibleSections.alertasActivas !== false,
        clientesAsociados: this.visibleSections.clientesAsociados !== false
    };
};

/**
 * Obtiene un resumen de los permisos para logging/debug
 * @returns {Object}
 */
AnalyticsPermissionSchema.methods.getSummary = function() {
    return {
        userId: this.userId,
        customPermissionsEnabled: this.customPermissionsEnabled,
        globalOnlyCuadroDeMando: this.globalOnlyCuadroDeMando,
        globalAllowedCompaniesCount: this.globalAllowedCompanies?.length || 0,
        globalExcludedCompaniesCount: this.globalExcludedCompanies?.length || 0,
        endpointsConfig: {
            globalDashboard: this.endpoints.globalDashboard?.enabled,
            companyDashboard: this.endpoints.companyDashboard?.enabled,
            auditDashboard: this.endpoints.auditDashboard?.enabled,
            entidadesCriticas: this.endpoints.entidadesCriticas?.enabled,
            vulnerabilidadesEntidad: this.endpoints.vulnerabilidadesEntidad?.enabled
        }
    };
};

/**
 * MÉTODOS ESTÁTICOS
 */

/**
 * Campos para listados
 */
AnalyticsPermissionSchema.statics.listFields = 
    'userId customPermissionsEnabled globalOnlyCuadroDeMando createdAt updatedAt';

/**
 * Nombres de endpoints válidos
 */
AnalyticsPermissionSchema.statics.ENDPOINT_NAMES = [
    'globalDashboard',
    'companyDashboard',
    'auditDashboard',
    'entidadesCriticas',
    'vulnerabilidadesEntidad'
];

/**
 * Nombres de secciones válidas
 */
AnalyticsPermissionSchema.statics.SECTION_NAMES = [
    'stats',
    'evaluacionesPorProcedimiento',
    'evaluacionesPorAlcance',
    'evaluacionesPorEstado',
    'evaluacionesPorTipo',
    'vulnerabilidadesPorSeveridad',
    'tendenciaMensual',
    'entidadesEvaluadas',
    'evaluacionesRecientes',
    'alertasActivas',
    'clientesAsociados'
];

/**
 * Crear permisos por defecto para un usuario
 * @param {ObjectId} userId 
 * @param {ObjectId} createdBy 
 * @returns {Promise<AnalyticsPermission>}
 */
AnalyticsPermissionSchema.statics.createDefault = async function(userId, createdBy = null) {
    const permission = new this({
        userId,
        customPermissionsEnabled: false,
        createdBy
    });
    
    return permission.save();
};

/**
 * Buscar por userId, crear si no existe
 * @param {ObjectId} userId 
 * @returns {Promise<AnalyticsPermission>}
 */
AnalyticsPermissionSchema.statics.findOrCreate = async function(userId) {
    let permission = await this.findOne({ userId });
    
    if (!permission) {
        permission = await this.createDefault(userId);
    }
    
    return permission;
};

const AnalyticsPermission = mongoose.model('AnalyticsPermission', AnalyticsPermissionSchema);

module.exports = AnalyticsPermission;
