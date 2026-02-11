const AnalyticsPermissionService = require('../services/analytics-permission.service');

/**
 * Analytics Permission Middleware
 * 
 * Middleware para gestionar permisos de analytics en las rutas.
 * 
 * FUNCIONALIDADES:
 * - Cargar permisos del usuario en req.analyticsPermissions
 * - Verificar acceso a compañías específicas
 * - Verificar acceso a endpoints
 * - Filtrar respuestas automáticamente
 */

/**
 * Cargar permisos de analytics del usuario autenticado
 * Adjunta los permisos a req.analyticsPermissions
 */
const loadAnalyticsPermissions = async (req, res, next) => {
    try {
        const userId = req.decodedToken?.id;
        
        if (!userId) {
            console.warn('[AnalyticsPermission] No user ID in token');
            return res.status(401).json({ 
                status: 'error', 
                data: 'User not authenticated' 
            });
        }
        
        // Cargar permisos
        const permissions = await AnalyticsPermissionService.getByUserId(userId);
        req.analyticsPermissions = permissions;
        
        // Log para debugging (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
            console.log(`[AnalyticsPermission] Loaded for user ${userId}:`, 
                permissions.getSummary());
        }
        
        next();
    } catch (error) {
        console.error('[AnalyticsPermission] Error loading permissions:', error);
        return res.status(500).json({ 
            status: 'error', 
            data: 'Error loading analytics permissions' 
        });
    }
};

/**
 * Factory para verificar acceso a compañía específica
 * @param {String} endpointName - Nombre del endpoint para verificar
 * @returns {Function} Middleware de Express
 */
const verifyCompanyAccess = (endpointName) => {
    return async (req, res, next) => {
        try {
            const userId = req.decodedToken?.id;
            const companyId = req.params.companyId;
            
            // Si no hay companyId en params, continuar
            if (!companyId) {
                return next();
            }
            
            // Verificar acceso
            const hasAccess = await AnalyticsPermissionService.canAccessCompany(
                userId,
                companyId,
                endpointName
            );
            
            if (!hasAccess) {
                console.warn(`[AnalyticsPermission] Access denied: user ${userId} -> company ${companyId} (${endpointName})`);
                return res.status(403).json({ 
                    status: 'error', 
                    data: 'Access denied to this company analytics' 
                });
            }
            
            next();
        } catch (error) {
            console.error('[AnalyticsPermission] Error verifying company access:', error);
            return res.status(500).json({ 
                status: 'error', 
                data: 'Error verifying company access' 
            });
        }
    };
};

/**
 * Factory para verificar si un endpoint está habilitado
 * @param {String} endpointName - Nombre del endpoint
 * @returns {Function} Middleware de Express
 */
const verifyEndpointAccess = (endpointName) => {
    return async (req, res, next) => {
        try {
            const userId = req.decodedToken?.id;
            
            const isEnabled = await AnalyticsPermissionService.isEndpointEnabled(
                userId,
                endpointName
            );
            
            if (!isEnabled) {
                console.warn(`[AnalyticsPermission] Endpoint disabled: user ${userId} -> ${endpointName}`);
                return res.status(403).json({ 
                    status: 'error', 
                    data: 'This analytics endpoint is not available for your account' 
                });
            }
            
            next();
        } catch (error) {
            console.error('[AnalyticsPermission] Error verifying endpoint access:', error);
            return res.status(500).json({ 
                status: 'error', 
                data: 'Error verifying endpoint access' 
            });
        }
    };
};

/**
 * Middleware para filtrar respuesta por secciones visibles
 * Intercepta res.json() y filtra los datos antes de enviarlos
 */
const filterResponseSections = async (req, res, next) => {
    // Guardar referencia al método original
    const originalJson = res.json.bind(res);
    
    // Override res.json
    res.json = async function(data) {
        try {
            // Solo filtrar respuestas exitosas con datos
            if (data && data.status === 'success' && data.data) {
                const userId = req.decodedToken?.id;
                
                if (userId) {
                    // Filtrar secciones
                    data.data = await AnalyticsPermissionService.filterResponseSections(
                        userId,
                        data.data
                    );
                    
                    // Agregar info de permisos a la respuesta
                    const permissionInfo = await AnalyticsPermissionService.getPermissionInfo(userId);
                    data.data._permissionInfo = permissionInfo;
                }
            }
        } catch (error) {
            console.error('[AnalyticsPermission] Error filtering response:', error);
            // En caso de error, enviar respuesta sin filtrar
        }
        
        return originalJson(data);
    };
    
    next();
};

/**
 * Middleware combinado para endpoints que requieren todas las verificaciones
 * @param {String} endpointName - Nombre del endpoint
 * @param {Object} options - Opciones adicionales
 * @returns {Array} Array de middlewares
 */
const fullAnalyticsAuth = (endpointName, options = {}) => {
    const middlewares = [loadAnalyticsPermissions];
    
    // Verificar endpoint si se especifica
    if (options.checkEndpoint !== false) {
        middlewares.push(verifyEndpointAccess(endpointName));
    }
    
    // Verificar compañía si hay :companyId en la ruta
    if (options.checkCompany !== false) {
        middlewares.push(verifyCompanyAccess(endpointName));
    }
    
    // Filtrar respuesta si se especifica
    if (options.filterResponse !== false) {
        middlewares.push(filterResponseSections);
    }
    
    return middlewares;
};

/**
 * Middleware para agregar filtro de compañías a req
 * Útil para que el controller pueda usar el filtro en sus queries
 * @param {String} endpointName - Nombre del endpoint
 */
const attachCompanyFilter = (endpointName) => {
    return async (req, res, next) => {
        try {
            const userId = req.decodedToken?.id;
            
            // Construir filtro de compañías basado en permisos
            const companyFilter = await AnalyticsPermissionService.buildCompanyFilter(
                userId,
                endpointName
            );
            
            // Adjuntar al request para uso en controller/service
            req.analyticsCompanyFilter = companyFilter;
            
            next();
        } catch (error) {
            console.error('[AnalyticsPermission] Error building company filter:', error);
            return res.status(500).json({ 
                status: 'error', 
                data: 'Error building company filter' 
            });
        }
    };
};

/**
 * Middleware para logging de accesos a analytics
 */
const logAnalyticsAccess = (endpointName) => {
    return (req, res, next) => {
        const userId = req.decodedToken?.id;
        const username = req.decodedToken?.username;
        const companyId = req.params.companyId || 'N/A';
        
        console.log(`[AnalyticsAccess] ${username}(${userId}) -> ${endpointName} | Company: ${companyId}`);
        
        // Continuar con el siguiente middleware
        next();
    };
};

/**
 * Middleware para verificar rol de analyst
 * Útil para rutas que solo deben ser accesibles por analysts
 */
const requireAnalystRole = (req, res, next) => {
    const role = req.decodedToken?.role;
    
    // Permitir admin también
    if (role === 'analyst' || role === 'admin') {
        return next();
    }
    
    return res.status(403).json({
        status: 'error',
        data: 'This endpoint is only available for analyst users'
    });
};

module.exports = {
    loadAnalyticsPermissions,
    verifyCompanyAccess,
    verifyEndpointAccess,
    filterResponseSections,
    fullAnalyticsAuth,
    attachCompanyFilter,
    logAnalyticsAccess,
    requireAnalystRole
};
