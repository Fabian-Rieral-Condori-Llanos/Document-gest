/**
 * Índice de Configuración
 * 
 * Exporta todas las configuraciones de la aplicación
 */

const database = require('./database');
const auth = require('./auth');
const configFile = require('./config.json');
const roles = require('./roles.json');

const env = process.env.NODE_ENV || 'development';

module.exports = {
    // Módulos de configuración
    database,
    auth,
    
    // Archivos de configuración raw
    config: configFile,
    roles,
    
    // Variables de ambiente
    env,
    
    // Puerto y host
    port: process.env.PORT || 4242,
    host: process.env.HOST || '0.0.0.0',
    
    // Configuración HTTPS
    https: {
        enabled: process.env.HTTPS_ENABLED === 'true',
        keyPath: process.env.HTTPS_KEY_PATH || './ssl/server.key',
        certPath: process.env.HTTPS_CERT_PATH || './ssl/server.cert'
    },
    
    // Configuración CORS
    cors: {
        origin: process.env.CORS_ORIGIN || '*'
    }
};