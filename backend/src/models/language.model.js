const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Language Model
 * 
 * Define la estructura de datos para idiomas disponibles.
 * La lógica de negocio está en services/language.service.js
 */

const LanguageSchema = new Schema({
    language: {
        type: String,
        unique: true,
        required: [true, 'Language name is required'],
        maxlength: [100, 'Language name cannot exceed 100 characters']
    },
    locale: {
        type: String,
        unique: true,
        required: [true, 'Locale is required'],
        maxlength: [10, 'Locale cannot exceed 10 characters']
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
LanguageSchema.statics.listFields = '-_id language locale';

const Language = mongoose.model('Language', LanguageSchema);

module.exports = Language;
