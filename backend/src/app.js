const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const socketIo = require('socket.io');

// Configuración global
global.__basedir = __dirname;

// Configuraciones
const config = require('./config');
const dbConfig = require('./config/database');
const authConfig = require('./config/auth');

// Middlewares
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { setupHelmet, corsMiddleware, jsonParser, urlEncodedParser } = require('./middlewares/security.middleware');

// Rutas
const { registerRoutes } = require('./routes');

// Modelos
const { initializeModels } = require('./models');

// Socket handlers
const { setupSocketAuth, setupSocketHandlers } = require('./socket');

/**
 * Clase principal de la aplicación
 */
class Application {
    constructor() {
        this.app = express();
        this.server = null;
        this.io = null;
    }

    /**
     * Inicializa la aplicación
     */
    async initialize() {
        try {
            // Conectar a la base de datos
            await this.connectDatabase();

            // Inicializar modelos
            await initializeModels();

            // Configurar middlewares
            this.setupMiddlewares();

            // Configurar rutas
            this.setupRoutes();

            // Configurar manejo de errores
            this.setupErrorHandling();

            // Crear servidor HTTP/HTTPS
            this.createServer();

            // Configurar Socket.io
            this.setupSocket();

            console.log(' Application initialized successfully');
        } catch (error) {
            console.error(' Failed to initialize application:', error);
            throw error;
        }
    }

    /**
     * Conecta a la base de datos MongoDB
     */
    async connectDatabase() {
        try {
            await dbConfig.connect();
            console.log(' Connected to MongoDB');
        } catch (error) {
            console.error(' Database connection failed:', error);
            throw error;
        }
    }

    /**
     * Configura los middlewares de la aplicación
     */
    setupMiddlewares() {
        // Seguridad
        setupHelmet(this.app);
        this.app.use(corsMiddleware);

        // Parsers
        this.app.use(jsonParser);
        this.app.use(urlEncodedParser);
        this.app.use(cookieParser());

        // Request logging (desarrollo)
        if (config.env === 'development') {
            this.app.use((req, res, next) => {
                console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
                next();
            });
        }

        console.log(' Middlewares configured');
    }

    /**
     * Configura las rutas de la aplicación
     */
    setupRoutes() {
        // Servir archivos estáticos del frontend
        const frontendPath = path.join(__dirname, '..', 'dist');
        if (fs.existsSync(frontendPath)) {
            this.app.use(express.static(frontendPath));
        }

        // Registrar rutas API
        registerRoutes(this.app);

        // Servir index.html para rutas del frontend (SPA)
        if (fs.existsSync(frontendPath)) {
            this.app.get('*', (req, res, next) => {
                // Ignorar rutas de API
                if (req.path.startsWith('/api')) {
                    return next();
                }
                res.sendFile(path.join(frontendPath, 'index.html'));
            });
        }
    }

    /**
     * Configura el manejo de errores
     */
    setupErrorHandling() {
        this.app.use(notFoundHandler);
        this.app.use(errorHandler);
        console.log(' Error handling configured');
    }

    /**
     * Crea el servidor HTTP o HTTPS
     */
    createServer() {
        if (config.https.enabled) {
            const httpsOptions = {
                key: fs.readFileSync(config.https.keyPath),
                cert: fs.readFileSync(config.https.certPath)
            };
            this.server = https.createServer(httpsOptions, this.app);
            console.log(' HTTPS server created');
        } else {
            this.server = http.createServer(this.app);
            console.log(' HTTP server created');
        }
    }

    /**
     * Configura Socket.io
     */
    setupSocket() {
        this.io = socketIo(this.server, {
            cors: {
                origin: config.cors.origin,
                credentials: true
            }
        });

        // Configurar autenticación de socket
        setupSocketAuth(this.io, authConfig);

        // Configurar handlers de eventos
        setupSocketHandlers(this.io);

        // Pasar io al controller de auditorías
        const { AuditController } = require('./controllers');
        AuditController.setIo(this.io);

        console.log(' Socket.io configured');
    }

    /**
     * Inicia el servidor
     */
    start() {
        const port = config.port;
        const host = config.host;

        this.server.listen(port, host, () => {
            const protocol = config.https.enabled ? 'https' : 'http';
            console.log('');
            console.log('═══════════════════════════════════════════════════');
            console.log(`   Server running at ${protocol}://${host}:${port}`);
            console.log(`   Environment: ${config.env}`);
            console.log('═══════════════════════════════════════════════════');
            console.log('');
        });

        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    /**
     * Cierra la aplicación de forma ordenada
     */
    async shutdown() {
        console.log('\n Shutting down gracefully...');

        // Cerrar socket.io
        if (this.io) {
            this.io.close();
        }

        // Cerrar servidor HTTP
        if (this.server) {
            this.server.close();
        }

        // Cerrar conexión a MongoDB
        const mongoose = require('mongoose');
        await mongoose.connection.close();

        console.log('Server closed');
        process.exit(0);
    }
}

// Crear y exportar instancia
const application = new Application();

// Si se ejecuta directamente, iniciar
if (require.main === module) {
    application.initialize()
        .then(() => application.start())
        .catch(err => {
            console.error('Failed to start application:', err);
            process.exit(1);
        });
}

// Exportar para tests - sin inicializar servidor
module.exports = application;