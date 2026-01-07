const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Settings Model
 * 
 * Define la estructura de configuración de la aplicación.
 * La lógica de negocio está en services/settings.service.js
 */

/**
 * Validador de color hexadecimal
 */
const colorValidator = (v) => (/^#([0-9a-f]{3}){1,2}$/i).test(v);
const colorValidatorMsg = 'Invalid color format. Use hex format: #RGB or #RRGGBB';

/**
 * Esquema de colores CVSS
 */
const CvssColorsSchema = {
    noneColor: { 
        type: String, 
        default: '#4a86e8', 
        validate: [colorValidator, colorValidatorMsg] 
    },
    lowColor: { 
        type: String, 
        default: '#008000', 
        validate: [colorValidator, colorValidatorMsg] 
    },
    mediumColor: { 
        type: String, 
        default: '#f9a009', 
        validate: [colorValidator, colorValidatorMsg] 
    },
    highColor: { 
        type: String, 
        default: '#fe0000', 
        validate: [colorValidator, colorValidatorMsg] 
    },
    criticalColor: { 
        type: String, 
        default: '#212121', 
        validate: [colorValidator, colorValidatorMsg] 
    }
};

/**
 * Esquema de campos requeridos
 */
const RequiredFieldsSchema = {
    company: { type: Boolean, default: false },
    client: { type: Boolean, default: false },
    dateStart: { type: Boolean, default: false },
    dateEnd: { type: Boolean, default: false },
    dateReport: { type: Boolean, default: false },
    scope: { type: Boolean, default: false },
    findingType: { type: Boolean, default: false },
    findingDescription: { type: Boolean, default: false },
    findingObservation: { type: Boolean, default: false },
    findingReferences: { type: Boolean, default: false },
    findingProofs: { type: Boolean, default: false },
    findingAffected: { type: Boolean, default: false },
    findingRemediationDifficulty: { type: Boolean, default: false },
    findingPriority: { type: Boolean, default: false },
    findingRemediation: { type: Boolean, default: false }
};

/**
 * Esquema de métodos de scoring
 */
const ScoringMethodsSchema = {
    CVSS3: { type: Boolean, default: true },
    CVSS4: { type: Boolean, default: false }
};

/**
 * Esquema principal de Settings
 */
const SettingsSchema = new Schema({
    report: {
        enabled: { type: Boolean, default: true },
        public: {
            cvssColors: CvssColorsSchema,
            captions: {
                type: [{ type: String }],
                default: ['Figure']
            },
            highlightWarning: { type: Boolean, default: false },
            highlightWarningColor: { 
                type: String, 
                default: '#ffff25', 
                validate: [colorValidator, colorValidatorMsg] 
            },
            requiredFields: RequiredFieldsSchema,
            scoringMethods: ScoringMethodsSchema
        },
        private: {
            imageBorder: { type: Boolean, default: false },
            imageBorderColor: { 
                type: String, 
                default: '#000000', 
                validate: [colorValidator, colorValidatorMsg] 
            }
        }
    },
    reviews: {
        enabled: { type: Boolean, default: false },
        public: {
            mandatoryReview: { type: Boolean, default: false },
            minReviewers: { 
                type: Number, 
                default: 1, 
                min: [1, 'Minimum reviewers must be at least 1'],
                max: [100, 'Maximum reviewers cannot exceed 100'],
                validate: [Number.isInteger, 'Must be an integer']
            }
        },
        private: {
            removeApprovalsUponUpdate: { type: Boolean, default: false }
        }
    }
}, { 
    strict: true,
    timestamps: true
});

/**
 * Campos para consulta pública (sin datos privados)
 */
SettingsSchema.statics.publicFields = '-_id report.enabled report.public reviews.enabled reviews.public';

/**
 * Campos para consulta completa
 */
SettingsSchema.statics.allFields = '-_id -__v';

const Settings = mongoose.model('Settings', SettingsSchema);

module.exports = Settings;
