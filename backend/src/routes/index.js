const express = require('express');

const userRoutes = require('./user.routes');
const settingsRoutes = require('./settings.routes');
const companyRoutes = require('./company.routes');
const clientRoutes = require('./client.routes');
const templateRoutes = require('./template.routes');
const imageRoutes = require('./image.routes');
const vulnerabilityRoutes = require('./vulnerability.routes');
const auditRoutes = require('./audit.routes');
const dataRoutes = require('./data.routes');
const backupRoutes = require('./backup.routes');

// Nuevas rutas de seguimiento
const auditStatusRoutes = require('./audit-status.routes');
const auditVerificationRoutes = require('./audit-verification.routes');
const auditProcedureRoutes = require('./audit-procedure.routes');

/**
 * Registra todas las rutas en la aplicación Express
 * @param {Express} app - Instancia de Express
 */
const registerRoutes = (app) => {
    // Prefijo base para todas las rutas API
    const API_PREFIX = '/api';

    // Registrar rutas
    app.use(`${API_PREFIX}/users`, userRoutes);
    app.use(`${API_PREFIX}/settings`, settingsRoutes);
    app.use(`${API_PREFIX}/companies`, companyRoutes);
    app.use(`${API_PREFIX}/clients`, clientRoutes);
    app.use(`${API_PREFIX}/templates`, templateRoutes);
    app.use(`${API_PREFIX}/images`, imageRoutes);
    app.use(`${API_PREFIX}/vulnerabilities`, vulnerabilityRoutes);
    app.use(`${API_PREFIX}/audits`, auditRoutes);
    app.use(`${API_PREFIX}/data`, dataRoutes);
    app.use(`${API_PREFIX}/backups`, backupRoutes);

    // Nuevas rutas de seguimiento
    app.use(`${API_PREFIX}/audit-status`, auditStatusRoutes);
    app.use(`${API_PREFIX}/audit-verifications`, auditVerificationRoutes);
    app.use(`${API_PREFIX}/audit-procedures`, auditProcedureRoutes);

    // Ruta de health check
    app.get(`${API_PREFIX}/health`, (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    // Log de rutas registradas
    console.log('Routes registered:');
    console.log('   - /api/users');
    console.log('   - /api/settings');
    console.log('   - /api/companies');
    console.log('   - /api/clients');
    console.log('   - /api/templates');
    console.log('   - /api/images');
    console.log('   - /api/vulnerabilities');
    console.log('   - /api/audits');
    console.log('   - /api/data');
    console.log('   - /api/backups');
    console.log('   - /api/audit-status');
    console.log('   - /api/audit-verifications');
    console.log('   - /api/audit-procedures');
    console.log('   - /api/health');
};

module.exports = {
    registerRoutes,
    userRoutes,
    settingsRoutes,
    companyRoutes,
    clientRoutes,
    templateRoutes,
    imageRoutes,
    vulnerabilityRoutes,
    auditRoutes,
    dataRoutes,
    backupRoutes,
    auditStatusRoutes,
    auditVerificationRoutes,
    auditProcedureRoutes
};