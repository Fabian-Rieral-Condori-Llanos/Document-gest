const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * User Model
 * 
 * Define la estructura de datos para usuarios.
 * La lógica de negocio está en services/user.service.js
 */

/**
 * Esquema de sesión de refresh token
 */
const RefreshTokenSchema = {
    _id: false,
    sessionId: { type: String, required: true },
    userAgent: { type: String },
    token: { type: String, required: true }
};

/**
 * Esquema principal de Usuario
 */
const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: [true, 'Username is required'],
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [50, 'Username cannot exceed 50 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    firstname: {
        type: String,
        required: [true, 'First name is required'],
        maxlength: [100, 'First name cannot exceed 100 characters']
    },
    lastname: {
        type: String,
        required: [true, 'Last name is required'],
        maxlength: [100, 'Last name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: false,
        maxlength: [255, 'Email cannot exceed 255 characters']
    },
    phone: {
        type: String,
        required: false,
        maxlength: [50, 'Phone cannot exceed 50 characters']
    },
    jobTitle: {
        type: String,
        required: false,
        maxlength: [100, 'Job title cannot exceed 100 characters']
    },
    role: {
        type: String,
        default: 'user'
    },
    totpEnabled: {
        type: Boolean,
        default: false
    },
    totpSecret: {
        type: String,
        default: ''
    },
    enabled: {
        type: Boolean,
        default: true
    },
    refreshTokens: [RefreshTokenSchema]
}, {
    timestamps: true,  // Agrega createdAt y updatedAt
    toJSON: {
        // Excluir campos sensibles al convertir a JSON
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.totpSecret;
            delete ret.refreshTokens;
            delete ret.__v;
            return ret;
        }
    }
});

/**
 * Índices
 */
UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ role: 1 });

/**
 * Virtual: Nombre completo
 */
UserSchema.virtual('fullName').get(function() {
    return `${this.firstname} ${this.lastname}`;
});

/**
 * Campos que se seleccionan por defecto en consultas públicas
 */
UserSchema.statics.publicFields = 'username firstname lastname email phone jobTitle role totpEnabled enabled';

/**
 * Campos que se seleccionan para listados
 */
UserSchema.statics.listFields = 'username firstname lastname email phone jobTitle role totpEnabled enabled createdAt';

const User = mongoose.model('User', UserSchema);

module.exports = User;
