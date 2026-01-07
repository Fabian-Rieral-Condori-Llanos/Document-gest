/**
 * Índice de Services
 * 
 * Exporta todos los servicios de la aplicación.
 * Los services contienen la lógica de negocio.
 */

const UserService = require('./user.service');
const SettingsService = require('./settings.service');
const CompanyService = require('./company.service');
const ClientService = require('./client.service');
const TemplateService = require('./template.service');
const ImageService = require('./image.service');
const LanguageService = require('./language.service');
const AuditTypeService = require('./audit-type.service');
const VulnerabilityService = require('./vulnerability.service');
const AuditService = require('./audit.service');
const AuditFindingService = require('./audit-finding.service');
const AuditSectionService = require('./audit-section.service');
const BackupService = require('./backup.service');
const AuditStatusService = require('./audit-status.service');
const AuditVerificationService = require('./audit-verification.service');
const AuditProcedureService = require('./audit-procedure.service');

module.exports = {
    UserService,
    SettingsService,
    CompanyService,
    ClientService,
    TemplateService,
    ImageService,
    LanguageService,
    AuditTypeService,
    VulnerabilityService,
    AuditService,
    AuditFindingService,
    AuditSectionService,
    BackupService,

    AuditStatusService,
    AuditVerificationService,
    AuditProcedureService
};