const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Company Model
 * 
 * Define la estructura de datos para compañías/empresas.
 * La lógica de negocio está en services/company.service.js
 */

const CompanySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        unique: true,
        maxlength: [255, 'Company name cannot exceed 255 characters']
    },
    shortName: {
        type: String,
        maxlength: [50, 'Short name cannot exceed 50 characters']
    },
    logo: {
        type: String  // Base64 encoded image
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

/**
 * Campos para listados
 */
CompanySchema.statics.listFields = 'name shortName logo';

const Company = mongoose.model('Company', CompanySchema);

module.exports = Company;
