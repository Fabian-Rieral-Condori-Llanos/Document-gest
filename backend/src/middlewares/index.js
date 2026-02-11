/**
 * Índice de Middlewares
 * 
 * Exporta todos los middlewares disponibles para uso en la aplicación
 */

// Auth Middleware
const {
    verifyToken,
    extractToken,
    verifyRefreshToken,
    extractTokenFromCookie,
    getJwtSecret,
    getJwtRefreshSecret
} = require('./auth.middleware');

// ACL Middleware
const {
    ACL,
    acl,
    builtInRoles
} = require('./acl.middleware');

// Validation Middleware
const {
    validateBody,
    validateQuery,
    validateParams,
    validators,
    PATTERNS
} = require('./validation.middleware');

// Error Middleware
const {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    createError,
    errors,
    ERROR_TYPES
} = require('./error.middleware');

// Security Middleware
const {
    setupHelmet,
    corsMiddleware,
    corsOptions,
    jsonParser,
    urlEncodedParser,
    safeCompare,
    sanitizeHeaders,
    createRateLimiter,
    requestLogger,
    preventClickjacking
} = require('./security.middleware');

// Analytics Permission Middleware
const {
    loadAnalyticsPermissions,
    verifyCompanyAccess,
    verifyEndpointAccess,
    filterResponseSections,
    fullAnalyticsAuth,
    attachCompanyFilter,
    logAnalyticsAccess,
    requireAnalystRole
} = require('./analytics-permission.middleware');

module.exports = {
    // Auth
    verifyToken,
    extractToken,
    verifyRefreshToken,
    extractTokenFromCookie,
    getJwtSecret,
    getJwtRefreshSecret,

    // ACL
    ACL,
    acl,
    builtInRoles,

    // Validation
    validateBody,
    validateQuery,
    validateParams,
    validators,
    PATTERNS,

    // Error handling
    errorHandler,
    notFoundHandler,
    asyncHandler,
    createError,
    errors,
    ERROR_TYPES,

    // Security
    setupHelmet,
    corsMiddleware,
    corsOptions,
    jsonParser,
    urlEncodedParser,
    safeCompare,
    sanitizeHeaders,
    createRateLimiter,
    requestLogger,
    preventClickjacking,

    // Analytics Permissions
    loadAnalyticsPermissions,
    verifyCompanyAccess,
    verifyEndpointAccess,
    filterResponseSections,
    fullAnalyticsAuth,
    attachCompanyFilter,
    logAnalyticsAccess,
    requireAnalystRole
};