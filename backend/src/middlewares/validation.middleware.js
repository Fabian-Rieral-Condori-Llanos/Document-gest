/**
 * Middleware de Validación
 * 
 * Responsabilidades:
 * - Validar campos requeridos en body
 * - Validar tipos de datos
 * - Validar formatos específicos (email, ObjectId, etc.)
 * - Validar query parameters
 */

/**
 * Expresiones regulares para validaciones comunes
 */
const PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    mongoId: /^[0-9a-fA-F]{24}$/,
    phone: /^[+]?[\d\s-()]+$/,
    username: /^[a-zA-Z0-9_-]{3,30}$/,
    filename: /^[\p{Letter}\p{Mark}0-9 \[\]'()_,-]+$/iu
};

/**
 * Crea un middleware para validar el body de la request
 * 
 * @param {Object} schema - Esquema de validación
 * @param {Array} schema.required - Campos requeridos
 * @param {Object} schema.types - Tipos esperados { campo: 'string'|'number'|'boolean'|'array'|'object' }
 * @param {Object} schema.patterns - Patrones regex { campo: 'email'|'mongoId'|RegExp }
 * @param {Object} schema.custom - Validadores custom { campo: (value) => true|'error message' }
 * @returns {Function} Middleware de Express
 * 
 * @example
 * validateBody({
 *   required: ['username', 'password'],
 *   types: { username: 'string', age: 'number' },
 *   patterns: { email: 'email' },
 *   custom: { password: (v) => v.length >= 8 || 'Password must be at least 8 characters' }
 * })
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        const errors = [];

        // Validar campos requeridos
        if (schema.required) {
            for (const field of schema.required) {
                const value = req.body[field];
                if (value === undefined || value === null || value === '') {
                    errors.push(`Missing required field: ${field}`);
                }
            }
        }

        // Validar tipos de datos
        if (schema.types) {
            for (const [field, expectedType] of Object.entries(schema.types)) {
                const value = req.body[field];
                if (value !== undefined && value !== null) {
                    const actualType = Array.isArray(value) ? 'array' : typeof value;
                    if (actualType !== expectedType) {
                        errors.push(`Field '${field}' must be of type ${expectedType}`);
                    }
                }
            }
        }

        // Validar patrones
        if (schema.patterns) {
            for (const [field, pattern] of Object.entries(schema.patterns)) {
                const value = req.body[field];
                if (value !== undefined && value !== null && value !== '') {
                    const regex = typeof pattern === 'string' ? PATTERNS[pattern] : pattern;
                    if (regex && !regex.test(value)) {
                        errors.push(`Field '${field}' has invalid format`);
                    }
                }
            }
        }

        // Validaciones personalizadas
        if (schema.custom) {
            for (const [field, validator] of Object.entries(schema.custom)) {
                const value = req.body[field];
                if (value !== undefined) {
                    const result = validator(value, req.body);
                    if (result !== true) {
                        errors.push(typeof result === 'string' ? result : `Invalid value for field '${field}'`);
                    }
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ 
                status: 'error', 
                data: errors.length === 1 ? errors[0] : errors.join('; ')
            });
        }

        next();
    };
};

/**
 * Crea un middleware para validar query parameters
 * 
 * @param {Object} schema - Esquema de validación
 * @param {Array} schema.allowed - Parámetros permitidos
 * @param {Object} schema.types - Tipos esperados
 * @param {Object} schema.defaults - Valores por defecto
 * @returns {Function} Middleware de Express
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const errors = [];

        // Verificar parámetros no permitidos
        if (schema.allowed) {
            const allowedSet = new Set(schema.allowed);
            for (const param of Object.keys(req.query)) {
                if (!allowedSet.has(param)) {
                    errors.push(`Unknown query parameter: ${param}`);
                }
            }
        }

        // Aplicar valores por defecto
        if (schema.defaults) {
            for (const [param, defaultValue] of Object.entries(schema.defaults)) {
                if (req.query[param] === undefined) {
                    req.query[param] = defaultValue;
                }
            }
        }

        // Convertir tipos
        if (schema.types) {
            for (const [param, type] of Object.entries(schema.types)) {
                if (req.query[param] !== undefined) {
                    switch (type) {
                        case 'number':
                            req.query[param] = Number(req.query[param]);
                            if (isNaN(req.query[param])) {
                                errors.push(`Query parameter '${param}' must be a number`);
                            }
                            break;
                        case 'boolean':
                            req.query[param] = req.query[param] === 'true';
                            break;
                        case 'array':
                            if (!Array.isArray(req.query[param])) {
                                req.query[param] = [req.query[param]];
                            }
                            break;
                    }
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ 
                status: 'error', 
                data: errors.join('; ')
            });
        }

        next();
    };
};

/**
 * Crea un middleware para validar route parameters
 * 
 * @param {Object} schema - Esquema de validación
 * @param {Array} schema.required - Parámetros requeridos
 * @param {Array} schema.mongoId - Parámetros que deben ser MongoDB ObjectId
 * @returns {Function} Middleware de Express
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        const errors = [];

        // Validar parámetros requeridos
        if (schema.required) {
            for (const param of schema.required) {
                if (!req.params[param]) {
                    errors.push(`Missing required parameter: ${param}`);
                }
            }
        }

        // Validar formato de MongoDB ObjectId
        if (schema.mongoId) {
            for (const param of schema.mongoId) {
                const value = req.params[param];
                if (value && !PATTERNS.mongoId.test(value)) {
                    errors.push(`Parameter '${param}' must be a valid MongoDB ObjectId`);
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ 
                status: 'error', 
                data: errors.join('; ')
            });
        }

        next();
    };
};

/**
 * Validadores predefinidos para uso común
 */
const validators = {
    /**
     * Valida que el password cumpla con la política
     */
    strongPassword: (value) => {
        if (value.length < 8) return 'Password must be at least 8 characters';
        // Agregar más reglas según la política de passwords
        return true;
    },

    /**
     * Valida que sea un email válido
     */
    isEmail: (value) => {
        return PATTERNS.email.test(value) || 'Invalid email format';
    },

    /**
     * Valida que sea un ObjectId válido
     */
    isMongoId: (value) => {
        return PATTERNS.mongoId.test(value) || 'Invalid ObjectId format';
    },

    /**
     * Valida que sea un nombre de archivo válido
     */
    isValidFilename: (value) => {
        return PATTERNS.filename.test(value) || 'Invalid filename characters';
    },

    /**
     * Valida longitud mínima
     */
    minLength: (min) => (value) => {
        return value.length >= min || `Must be at least ${min} characters`;
    },

    /**
     * Valida longitud máxima
     */
    maxLength: (max) => (value) => {
        return value.length <= max || `Must be at most ${max} characters`;
    },

    /**
     * Valida que el valor esté en una lista
     */
    isIn: (allowedValues) => (value) => {
        return allowedValues.includes(value) || `Must be one of: ${allowedValues.join(', ')}`;
    }
};

module.exports = {
    validateBody,
    validateQuery,
    validateParams,
    validators,
    PATTERNS
};
