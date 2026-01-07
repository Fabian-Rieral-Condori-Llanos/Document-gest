/**
 * Constantes de la Aplicación
 * 
 * Valores constantes usados en toda la aplicación
 */

/**
 * Estados posibles de una auditoría
 */
const AUDIT_STATES = {
    EDIT: 'EDIT',
    REVIEW: 'REVIEW',
    APPROVED: 'APPROVED'
};

/**
 * Tipos de auditoría
 */
const AUDIT_TYPES = {
    DEFAULT: 'default',
    MULTI: 'multi',
    RETEST: 'retest'
};

/**
 * Estados de retest de un finding
 */
const RETEST_STATUS = {
    OK: 'ok',
    KO: 'ko',
    UNKNOWN: 'unknown',
    PARTIAL: 'partial'
};

/**
 * Prioridades de findings
 */
const FINDING_PRIORITIES = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4
};

/**
 * Complejidad de remediación
 */
const REMEDIATION_COMPLEXITY = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3
};

/**
 * Estados de findings
 */
const FINDING_STATUS = {
    DONE: 0,
    REDACTING: 1
};

/**
 * Protocolos de servicios
 */
const SERVICE_PROTOCOLS = ['tcp', 'udp'];

/**
 * Órdenes de ordenamiento
 */
const SORT_ORDERS = {
    ASC: 'asc',
    DESC: 'desc'
};

/**
 * Códigos HTTP comunes
 */
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500
};

/**
 * Configuración de paginación por defecto
 */
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

/**
 * Configuración de tokens
 */
const TOKEN_CONFIG = {
    ACCESS_TOKEN_EXPIRY: '15 minutes',
    REFRESH_TOKEN_EXPIRY: '7 days'
};

module.exports = {
    AUDIT_STATES,
    AUDIT_TYPES,
    RETEST_STATUS,
    FINDING_PRIORITIES,
    REMEDIATION_COMPLEXITY,
    FINDING_STATUS,
    SERVICE_PROTOCOLS,
    SORT_ORDERS,
    HTTP_STATUS,
    PAGINATION,
    TOKEN_CONFIG
};
