/**
 * Middleware de Manejo de Errores
 * 
 * Responsabilidades:
 * - Capturar errores no manejados
 * - Formatear respuestas de error consistentes
 * - Logging de errores
 * - Manejar diferentes tipos de errores
 */

/**
 * Tipos de errores conocidos del sistema
 * Mapeo de nombre de error a código HTTP
 */
const ERROR_TYPES = {
    BadParameters: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    Conflict: 409,
    ValidationError: 400,
    CastError: 400
};

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware registrado
 * 
 * @param {Error} err - Error capturado
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    // Log del error para debugging
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'dev' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Error ya enviado, no hacer nada
    if (res.headersSent) {
        return next(err);
    }

    // Errores conocidos del sistema (con propiedad 'fn')
    if (err.fn && ERROR_TYPES[err.fn]) {
        return res.status(ERROR_TYPES[err.fn]).json({
            status: 'error',
            data: err.message || err.fn
        });
    }

    // Error de validación de Mongoose
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            status: 'error',
            data: messages.join('; ')
        });
    }

    // Error de cast de Mongoose (ObjectId inválido)
    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            data: `Invalid ${err.kind}: ${err.value}`
        });
    }

    // Error de duplicado de Mongoose
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return res.status(409).json({
            status: 'error',
            data: `Duplicate value for ${field}`
        });
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            data: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'error',
            data: 'Token expired'
        });
    }

    // Error de sintaxis JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            status: 'error',
            data: 'Invalid JSON in request body'
        });
    }

    // Error genérico del servidor
    return res.status(500).json({
        status: 'error',
        data: 'Internal server error. Please contact your administrator.'
    });
};

/**
 * Middleware para manejar rutas no encontradas (404)
 * Debe ir después de todas las rutas definidas
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        status: 'error',
        data: 'Route undefined'
    });
};

/**
 * Wrapper para funciones async en controladores
 * Captura errores y los pasa al error handler
 * 
 * @param {Function} fn - Función async del controlador
 * @returns {Function} Middleware de Express
 * 
 * @example
 * router.get('/', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * }));
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Crea un error con formato estándar del sistema
 * 
 * @param {string} type - Tipo de error (BadParameters, NotFound, etc.)
 * @param {string} message - Mensaje del error
 * @returns {Object} Objeto de error
 * 
 * @example
 * throw createError('NotFound', 'User not found');
 */
const createError = (type, message) => {
    return { fn: type, message };
};

/**
 * Helpers para crear errores comunes
 */
const errors = {
    badRequest: (message = 'Bad request') => createError('BadParameters', message),
    unauthorized: (message = 'Unauthorized') => createError('Unauthorized', message),
    forbidden: (message = 'Forbidden') => createError('Forbidden', message),
    notFound: (message = 'Not found') => createError('NotFound', message),
    conflict: (message = 'Conflict') => createError('Conflict', message)
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    createError,
    errors,
    ERROR_TYPES
};
