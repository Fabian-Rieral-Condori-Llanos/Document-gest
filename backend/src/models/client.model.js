const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Client Model
 * 
 * Define la estructura de datos para clientes.
 * La lógica de negocio está en services/client.service.js
 */

const ClientSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Client email is required'],
        unique: true,
        maxlength: [255, 'Email cannot exceed 255 characters']
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company'
    },
    lastname: {
        type: String,
        maxlength: [100, 'Last name cannot exceed 100 characters']
    },
    firstname: {
        type: String,
        maxlength: [100, 'First name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        maxlength: [50, 'Phone cannot exceed 50 characters']
    },
    cell: {
        type: String,
        maxlength: [50, 'Cell cannot exceed 50 characters']
    },
    title: {
        type: String,
        maxlength: [100, 'Title cannot exceed 100 characters']
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
 * Índices
 */
ClientSchema.index({ company: 1 });

/**
 * Virtual: Nombre completo
 */
ClientSchema.virtual('fullName').get(function() {
    if (this.firstname && this.lastname) {
        return `${this.firstname} ${this.lastname}`;
    }
    return this.firstname || this.lastname || this.email;
});

/**
 * Campos para listados
 */
ClientSchema.statics.listFields = 'email lastname firstname phone cell title company';

const Client = mongoose.model('Client', ClientSchema);

module.exports = Client;
