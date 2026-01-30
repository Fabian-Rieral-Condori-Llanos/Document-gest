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
const auditProcedureRoutes = require('./audit-procedure.routes');

// Rutas de plantillas de procedimientos
const procedureTemplateRoutes = require('./procedure-template.routes');

// Rutas de plantillas de alcance
const alcanceTemplateRoutes = require('./alcance-template.routes');

// Rutas de plantillas de reportes
const reportTemplateRoutes = require('./report-template.routes');

// Rutas de esquemas de datos (para constructor de plantillas)
const dataSchemaRoutes = require('./data-schema.routes');

// Rutas de instancias de reportes
const reportInstanceRoutes = require('./report-instance.routes');

// Rutas de generación de PDF
const pdfRoutes = require('./pdf.routes');

// Rutas de análisis
const analyticsRoutes = require('./analytics.routes');

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
    app.use(`${API_PREFIX}/audit-procedures`, auditProcedureRoutes);

    // Rutas de plantillas de procedimientos
    app.use(`${API_PREFIX}/procedure-templates`, procedureTemplateRoutes);

    // Rutas de plantillas de alcance
    app.use(`${API_PREFIX}/alcance-templates`, alcanceTemplateRoutes);

    // Rutas de plantillas de reportes
    app.use(`${API_PREFIX}/report-templates`, reportTemplateRoutes);

    // Rutas de esquemas de datos (para constructor de plantillas)
    app.use(`${API_PREFIX}/data-schemas`, dataSchemaRoutes);

    // Rutas de instancias de reportes
    app.use(`${API_PREFIX}/report-instances`, reportInstanceRoutes);

    // Rutas de generación de PDF
    app.use(`${API_PREFIX}/pdf`, pdfRoutes);

    // Rutas de análisis
    app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

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
    console.log('   - /api/audit-procedures');
    console.log('   - /api/procedure-templates');
    console.log('   - /api/alcance-templates');
    console.log('   - /api/report-templates');
    console.log('   - /api/data-schemas');
    console.log('   - /api/report-instances');
    console.log('   - /api/pdf');
    console.log('   - /api/analytics');
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
    auditProcedureRoutes,
    procedureTemplateRoutes,
    alcanceTemplateRoutes,
    reportTemplateRoutes,
    dataSchemaRoutes,
    reportInstanceRoutes,
    pdfRoutes,
    analyticsRoutes
};