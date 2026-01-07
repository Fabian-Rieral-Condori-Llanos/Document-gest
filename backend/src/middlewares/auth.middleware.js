const jwt = require('jsonwebtoken');

/**
 * Middleware de Autenticación JWT
 * 
 * Responsabilidades:
 * - Extraer token JWT de cookies
 * - Verificar validez del token
 * - Adjuntar datos decodificados a req.decodedToken
 */

/**
 * Obtiene la configuración de JWT
 * Se carga dinámicamente para evitar problemas de inicialización circular
 */
const getJwtSecret = () => {
    const config = require('../config/config.json');
    const env = process.env.NODE_ENV || 'dev';
    return config[env].jwtSecret;
};

const getJwtRefreshSecret = () => {
    const config = require('../config/config.json');
    const env = process.env.NODE_ENV || 'dev';
    return config[env].jwtRefreshSecret;
};

/**
 * Extrae el token JWT del cookie
 * @param {Object} req - Express request
 * @returns {Object} { valid: boolean, token: string|null, error: string|null }
 */
const extractTokenFromCookie = (req) => {
    if (!req.cookies || !req.cookies['token']) {
        return { valid: false, token: null, error: 'No token provided' };
    }

    const cookie = req.cookies['token'].split(' ');
    
    if (cookie.length !== 2 || cookie[0] !== 'JWT') {
        return { valid: false, token: null, error: 'Bad token type' };
    }

    return { valid: true, token: cookie[1], error: null };
};

/**
 * Middleware para verificar token JWT
 * Requiere token válido para continuar
 */
const verifyToken = (req, res, next) => {
    const { valid, token, error } = extractTokenFromCookie(req);

    if (!valid) {
        return res.status(401).json({ status: 'error', data: error });
    }

    jwt.verify(token, getJwtSecret(), (err, decoded) => {
        if (err) {
            const message = err.name === 'TokenExpiredError' 
                ? 'Expired token' 
                : 'Invalid token';
            return res.status(401).json({ status: 'error', data: message });
        }

        req.decodedToken = decoded;
        return next();
    });
};

/**
 * Middleware opcional para extraer token sin bloquear
 * Útil para rutas que funcionan con o sin autenticación
 */
const extractToken = (req, res, next) => {
    const { valid, token } = extractTokenFromCookie(req);

    if (valid && token) {
        try {
            const decoded = jwt.verify(token, getJwtSecret());
            req.decodedToken = decoded;
        } catch (err) {
            req.decodedToken = null;
        }
    } else {
        req.decodedToken = null;
    }

    next();
};

/**
 * Middleware para verificar refresh token
 */
const verifyRefreshToken = (req, res, next) => {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
        return res.status(401).json({ status: 'error', data: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(refreshToken, getJwtRefreshSecret());
        req.decodedRefreshToken = decoded;
        req.refreshToken = refreshToken;
        next();
    } catch (err) {
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        
        const message = err.name === 'TokenExpiredError'
            ? 'Expired refresh token'
            : 'Invalid refresh token';
        return res.status(401).json({ status: 'error', data: message });
    }
};

module.exports = {
    verifyToken,
    extractToken,
    verifyRefreshToken,
    extractTokenFromCookie,
    getJwtSecret,
    getJwtRefreshSecret
};
