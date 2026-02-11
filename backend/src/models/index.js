/**
 * Índice de Modelos
 * 
 * Registra y exporta todos los modelos de Mongoose.
 * Importar este archivo asegura que todos los modelos estén registrados.
 */

// Importar modelos en orden de dependencias
const User = require('./user.model');
const Settings = require('./settings.model');
const Company = require('./company.model');
const Client = require('./client.model');
const Template = require('./template.model');
const Image = require('./image.model');
const Language = require('./language.model');
const AuditType = require('./audit-type.model');
const VulnerabilityType = require('./vulnerability-type.model');
const VulnerabilityCategory = require('./vulnerability-category.model');
const CustomField = require('./custom-field.model');
const CustomSection = require('./custom-section.model');
const Vulnerability = require('./vulnerability.model');
const VulnerabilityUpdate = require('./vulnerability-update.model');
const Audit = require('./audit.model');
const AuditStatus = require('./audit-status.model');
const AuditProcedure = require('./audit-procedure.model');
const ProcedureTemplate = require('./procedure-template.model');
const AlcanceTemplate = require('./alcance-template.model');
const ReportTemplate = require('./report-template.model');
const ReportInstance = require('./report-instance.model');
const Analytics = require('./analytics.model');
const AnalyticsPermission = require('./analytics-permission.model');

/**
 * Inicializa los modelos y ejecuta cualquier setup necesario
 */
const initializeModels = async () => {
    // Sincronizar índices de Image (como en el original)
    await Image.syncIndexes();
    
    // Inicializar Settings si no existen
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
        console.log('Initializing Settings...');
        await Settings.create({});
    }
    
    console.log('Models initialized');
};

module.exports = {
    // Modelos
    User,
    Settings,
    Company,
    Client,
    Template,
    Image,
    Language,
    AuditType,
    VulnerabilityType,
    VulnerabilityCategory,
    CustomField,
    CustomSection,
    Vulnerability,
    VulnerabilityUpdate,
    Audit,

    AuditStatus,
    AuditProcedure,
    ProcedureTemplate,
    AlcanceTemplate,
    ReportTemplate,
    ReportInstance,
    AnalyticsPermission,
    
    // Función de inicialización
    initializeModels
};