const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

/**
 * Configuración de Autenticación JWT
 * 
 * Responsabilidades:
 * - Gestionar secretos JWT
 * - Generar secretos automáticamente si no existen
 * - Configurar tiempos de expiración
 */

const env = process.env.NODE_ENV || 'dev';
const configPath = path.join(__dirname, 'config.json');

/**
 * Carga y actualiza la configuración con secretos JWT
 */
const loadConfig = () => {
    let config = require('./config.json');
    let updated = false;

    // Asegurar que existe la configuración del ambiente
    if (!config[env]) {
        config[env] = {};
    }

    // Generar JWT secret si no existe
    if (!config[env].jwtSecret) {
        config[env].jwtSecret = crypto.randomBytes(32).toString('hex');
        updated = true;
        console.log('Generated new JWT secret');
    }

    // Generar JWT refresh secret si no existe
    if (!config[env].jwtRefreshSecret) {
        config[env].jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
        updated = true;
        console.log('Generated new JWT refresh secret');
    }

    // Guardar configuración actualizada
    if (updated) {
        try {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        } catch (err) {
            console.error('Warning: Could not save JWT secrets to config file:', err.message);
        }
    }

    return config[env];
};

const envConfig = loadConfig();

/**
 * Configuración de tokens
 */
const authConfig = {
    // Secreto para firmar access tokens
    jwtSecret: envConfig.jwtSecret,
    
    // Secreto para firmar refresh tokens
    jwtRefreshSecret: envConfig.jwtRefreshSecret,
    
    // Tiempo de expiración del access token
    tokenExpiration: process.env.JWT_EXPIRATION || '15 minutes',
    
    // Tiempo de expiración del refresh token
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7 days',
    
    // Opciones de cookies
    cookieOptions: {
        sameSite: 'strict',
        secure: true,
        httpOnly: true
    },
    
    // Opciones de cookie para refresh token
    refreshCookieOptions: {
        sameSite: 'strict',
        secure: true,
        httpOnly: true,
        path: '/api/users/refreshtoken'
    }
};

module.exports = authConfig;
