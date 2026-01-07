#!/usr/bin/env node

/**
 * PwnDoc Server
 * 
 * Punto de entrada principal de la aplicación.
 */

const application = require('./src/app');

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Iniciar aplicación
application.initialize()
    .then(() => application.start())
    .catch(err => {
        console.error('Failed to start application:', err);
        process.exit(1);
    });