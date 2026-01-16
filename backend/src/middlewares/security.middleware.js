const helmet = require('helmet');
const cors = require('cors');
const express = require('express');
const config = require('../config');

/**
 * Security Middleware
 * 
 * Configura middlewares de seguridad: Helmet, CORS, y parsers.
 */

/**
 * Configura Helmet para headers de seguridad
 * @param {Express} app
 */
const setupHelmet = (app) => {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", "http://localhost:*", "ws:", "wss:"],
                fontSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
};

/**
 * Configuración de CORS
 */
const corsOptions = {
    origin: (origin, callback) => {
        // Permitir requests sin origin (mobile apps, curl, etc)
        if (!origin) {
            return callback(null, true);
        }

        const allowedOrigins = config.cors?.origin || ['http://localhost:3000'];
        
        // Si es string, convertir a array
        const origins = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];

        if (origins.includes('*') || origins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400 // 24 horas
};

/**
 * Middleware CORS configurado
 */
const corsMiddleware = cors(corsOptions);

/**
 * Parser JSON con límite de tamaño
 */
const jsonParser = express.json({
    limit: '50mb',
    strict: true
});

/**
 * Parser URL-encoded con límite de tamaño
 */
const urlEncodedParser = express.urlencoded({
    extended: true,
    limit: '50mb'
});

/**
 * Middleware para prevenir ataques de timing en comparaciones
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
const safeCompare = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    
    const crypto = require('crypto');
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    
    if (bufA.length !== bufB.length) {
        // Comparar contra sí mismo para mantener tiempo constante
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    
    return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Middleware para sanitizar headers peligrosos
 */
const sanitizeHeaders = (req, res, next) => {
    // Remover headers que podrían ser usados para ataques
    delete req.headers['x-powered-by'];
    
    // Asegurar que no se cacheen respuestas sensibles
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    next();
};

/**
 * Middleware para rate limiting básico (en memoria)
 * Para producción usar redis
 */
const createRateLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutos
        maxRequests = 100,
        message = 'Too many requests, please try again later'
    } = options;

    const requests = new Map();

    // Limpiar entradas antiguas cada minuto
    setInterval(() => {
        const now = Date.now();
        for (const [key, data] of requests.entries()) {
            if (now - data.startTime > windowMs) {
                requests.delete(key);
            }
        }
    }, 60000);

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        if (!requests.has(key)) {
            requests.set(key, {
                count: 1,
                startTime: now
            });
            return next();
        }

        const data = requests.get(key);

        if (now - data.startTime > windowMs) {
            // Reiniciar ventana
            requests.set(key, {
                count: 1,
                startTime: now
            });
            return next();
        }

        data.count++;

        if (data.count > maxRequests) {
            return res.status(429).json({
                status: 'error',
                message
            });
        }

        next();
    };
};

/**
 * Middleware para logging de requests (desarrollo)
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
        
        if (res.statusCode >= 400) {
            console.error(` ${log}`);
        } else {
            console.log(`✓ ${log}`);
        }
    });
    
    next();
};

/**
 * Middleware para prevenir clickjacking
 */
const preventClickjacking = (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
};

module.exports = {
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
};