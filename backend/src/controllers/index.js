/**
 * Índice de Controllers
 * 
 * Exporta todos los controladores de la aplicación.
 * Los controllers manejan las peticiones HTTP.
 */

const UserController = require('./user.controller');
const SettingsController = require('./settings.controller');
const CompanyController = require('./company.controller');
const ClientController = require('./client.controller');
const TemplateController = require('./template.controller');
const ImageController = require('./image.controller');
const VulnerabilityController = require('./vulnerability.controller');
const AuditController = require('./audit.controller');
const DataController = require('./data.controller');
const BackupController = require('./backup.controller');
const AuditStatusController = require('./audit-status.controller');
const AuditProcedureController = require('./audit-procedure.controller');

module.exports = {
    UserController,
    SettingsController,
    CompanyController,
    ClientController,
    TemplateController,
    ImageController,
    VulnerabilityController,
    AuditController,
    DataController,
    BackupController,

    AuditStatusController,
    AuditProcedureController
};
