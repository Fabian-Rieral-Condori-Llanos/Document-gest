const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const OTPAuth = require('otpauth');

const authConfig = require('../config/auth');
const { acl } = require('../middlewares/acl.middleware');
const { generateUUID } = require('../utils/helpers');
const { User } = require('../models');

const SALT_ROUNDS = 10;

/**
 * Configuración TOTP
 */
const TOTP_CONFIG = {
    issuer: 'PwnDoc',
    label: '',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: ''
};

/**
 * Verifica un token TOTP
 * @param {string} token - Token TOTP de 6 dígitos
 * @param {string} secret - Secreto TOTP
 * @throws {Object} Error si el token es inválido
 */
const verifyTotpToken = (token, secret) => {
    if (!token) {
        throw { fn: 'BadParameters', message: 'TOTP token required' };
    }
    if (token.length !== 6) {
        throw { fn: 'BadParameters', message: 'Invalid TOTP token length' };
    }
    if (!secret) {
        throw { fn: 'BadParameters', message: 'TOTP secret required' };
    }

    const config = { ...TOTP_CONFIG, secret };
    const totp = new OTPAuth.TOTP(config);
    const delta = totp.validate({ token, window: 5 });

    if (delta === null) {
        throw { fn: 'Unauthorized', message: 'Wrong TOTP token.' };
    }
    if (delta < -2 || delta > 2) {
        throw { fn: 'Unauthorized', message: 'TOTP token out of window.' };
    }

    return true;
};

/**
 * Construye el payload del JWT
 * @param {Object} user - Documento de usuario
 * @returns {Object} Payload para el JWT
 */
const buildTokenPayload = (user) => ({
    id: user._id,
    username: user.username,
    role: user.role,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phone: user.phone,
    jobTitle: user.jobTitle,
    roles: acl.getRoles(user.role)
});

class UserService {
    /**
     * Obtiene todos los usuarios
     */
    static async getAll() {
        return User.find()
            .select(User.publicFields)
            .exec();
    }

    /**
     * Obtiene un usuario por username
     * @param {string} username
     */
    static async getByUsername(username) {
        const user = await User.findOne({ username })
            .select(User.publicFields)
            .exec();

        if (!user) {
            throw { fn: 'NotFound', message: 'User not found' };
        }

        return user;
    }

    /**
     * Obtiene un usuario por ID
     * @param {string} userId
     */
    static async getById(userId) {
        const user = await User.findById(userId)
            .select(User.publicFields)
            .exec();

        if (!user) {
            throw { fn: 'NotFound', message: 'User not found' };
        }

        return user;
    }

    /**
     * Crea un nuevo usuario
     * @param {Object} userData - Datos del usuario
     */
    static async create(userData) {
        const hashedPassword = bcrypt.hashSync(userData.password, SALT_ROUNDS);

        try {
            const user = new User({
                ...userData,
                password: hashedPassword
            });
            await user.save();
            return { message: 'User created successfully' };
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Username already exists' };
            }
            throw err;
        }
    }

    /**
     * Autentica un usuario y genera tokens
     * @param {string} username
     * @param {string} password
     * @param {string} totpToken - Token TOTP opcional
     * @param {string} userAgent
     */
    static async authenticate(username, password, totpToken, userAgent) {
        const user = await User.findOne({ username });

        // Protección contra timing attacks
        if (!user) {
            const randomHash = "$2b$10$" + [...Array(53)].map(() => Math.random().toString(36)[2]).join('');
            bcrypt.compareSync(password, randomHash);
            throw { fn: 'Unauthorized', message: 'Authentication Failed.' };
        }

        if (user.enabled === false) {
            throw { fn: 'Unauthorized', message: 'Authentication Failed.' };
        }

        if (!bcrypt.compareSync(password, user.password)) {
            throw { fn: 'Unauthorized', message: 'Authentication Failed.' };
        }

        // Verificación TOTP si está habilitado
        if (user.totpEnabled) {
            if (!totpToken) {
                throw { fn: 'BadParameters', message: 'Missing TOTP token' };
            }
            verifyTotpToken(totpToken, user.totpSecret);
        }

        // Generar refresh token inicial
        const refreshToken = jwt.sign(
            { sessionId: null, userId: user._id },
            authConfig.jwtRefreshSecret
        );

        return this.updateRefreshToken(refreshToken, userAgent);
    }

    /**
     * Actualiza el refresh token y genera nuevo access token
     * @param {string} refreshToken
     * @param {string} userAgent
     */
    static async updateRefreshToken(refreshToken, userAgent) {
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, authConfig.jwtRefreshSecret);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw { fn: 'Unauthorized', message: 'Expired refreshToken' };
            }
            throw { fn: 'Unauthorized', message: 'Invalid refreshToken' };
        }

        const { userId, sessionId } = decoded;
        const user = await User.findById(userId);

        if (!user || user.enabled === false) {
            throw { fn: 'Unauthorized', message: 'User not found or disabled' };
        }

        // Verificar que la sesión existe (si no es login nuevo)
        if (sessionId !== null) {
            const sessionExists = user.refreshTokens.findIndex(
                e => e.sessionId === sessionId && e.token === refreshToken
            );
            if (sessionExists === -1) {
                throw { fn: 'Unauthorized', message: 'Session not found' };
            }
        }

        // Generar nuevos tokens
        const payload = buildTokenPayload(user);
        const newToken = jwt.sign(payload, authConfig.jwtSecret, { 
            expiresIn: authConfig.tokenExpiration 
        });
        
        const newSessionId = generateUUID();
        const newRefreshToken = jwt.sign(
            { sessionId: newSessionId, userId: user._id },
            authConfig.jwtRefreshSecret,
            { expiresIn: authConfig.refreshTokenExpiration }
        );

        // Limpiar sesiones expiradas y actualizar
        user.refreshTokens = user.refreshTokens.filter(e => {
            try {
                jwt.verify(e.token, authConfig.jwtRefreshSecret);
                return e.sessionId !== sessionId;
            } catch {
                return false;
            }
        });

        user.refreshTokens.push({
            sessionId: newSessionId,
            userAgent,
            token: newRefreshToken
        });

        await user.save();

        return {
            token: newToken,
            refreshToken: newRefreshToken
        };
    }

    /**
     * Elimina una sesión
     * @param {string} userId
     * @param {string} sessionId
     */
    static async removeSession(userId, sessionId) {
        const user = await User.findById(userId);
        if (!user) {
            throw { fn: 'NotFound', message: 'User not found' };
        }

        user.refreshTokens = user.refreshTokens.filter(e => e.sessionId !== sessionId);
        await user.save();

        return 'Session removed successfully';
    }

    /**
     * Actualiza el perfil del usuario (requiere password actual)
     * @param {string} username
     * @param {Object} userData
     */
    static async updateProfile(username, userData) {
        const user = await User.findOne({ username });

        if (!user) {
            throw { fn: 'NotFound', message: 'User not found' };
        }

        if (!bcrypt.compareSync(userData.password, user.password)) {
            throw { fn: 'Unauthorized', message: 'Current password is invalid' };
        }

        // Actualizar campos
        if (userData.username) user.username = userData.username;
        if (userData.firstname) user.firstname = userData.firstname;
        if (userData.lastname) user.lastname = userData.lastname;
        if (userData.email !== undefined) user.email = userData.email;
        if (userData.phone !== undefined) user.phone = userData.phone;
        if (userData.jobTitle !== undefined) user.jobTitle = userData.jobTitle;
        if (userData.newPassword) {
            user.password = bcrypt.hashSync(userData.newPassword, SALT_ROUNDS);
        }

        try {
            await user.save();
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Username already exists' };
            }
            throw err;
        }

        // Generar nuevo token con info actualizada
        const payload = buildTokenPayload(user);
        const token = jwt.sign(payload, authConfig.jwtSecret, { 
            expiresIn: authConfig.tokenExpiration 
        });

        return { token: `JWT ${token}` };
    }

    /**
     * Actualiza un usuario (admin)
     * @param {string} userId
     * @param {Object} userData
     */
    static async updateUser(userId, userData) {
        if (userData.password) {
            userData.password = bcrypt.hashSync(userData.password, SALT_ROUNDS);
        }

        try {
            const result = await User.findOneAndUpdate({ _id: userId }, userData);
            if (!result) {
                throw { fn: 'NotFound', message: 'User not found' };
            }
            return 'User updated successfully';
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Username already exists' };
            }
            throw err;
        }
    }

    /**
     * Obtiene el QR code para configurar TOTP
     * @param {string} username
     */
    static async getTotpQrcode(username) {
        const user = await User.findOne({ username })
            .select('totpEnabled totpSecret')
            .exec();

        if (!user) {
            throw { fn: 'NotFound', message: 'User not found' };
        }

        if (user.totpEnabled) {
            throw { fn: 'BadParameters', message: 'TOTP already enabled' };
        }

        const secret = new OTPAuth.Secret();
        const config = { ...TOTP_CONFIG, label: username, secret: secret.base32 };
        const totp = new OTPAuth.TOTP(config);
        const totpUrl = totp.toString();

        const qrCode = await QRCode.toDataURL(totpUrl);

        return {
            totpQrCode: qrCode,
            totpSecret: secret.base32
        };
    }

    /**
     * Configura TOTP para un usuario
     * @param {string} token - Token TOTP
     * @param {string} secret - Secreto TOTP
     * @param {string} username
     */
    static async setupTotp(token, secret, username) {
        verifyTotpToken(token, secret);

        const user = await User.findOne({ username });

        if (!user) {
            throw { fn: 'NotFound', message: 'User not found' };
        }

        if (user.totpEnabled) {
            throw { fn: 'BadParameters', message: 'TOTP already enabled' };
        }

        user.totpEnabled = true;
        user.totpSecret = secret;
        await user.save();

        return { msg: true };
    }

    /**
     * Cancela TOTP para un usuario
     * @param {string} token - Token TOTP actual
     * @param {string} username
     */
    static async cancelTotp(token, username) {
        const user = await User.findOne({ username });

        if (!user) {
            throw { fn: 'NotFound', message: 'User not found' };
        }

        if (!user.totpEnabled) {
            throw { fn: 'BadParameters', message: 'TOTP is not enabled' };
        }

        verifyTotpToken(token, user.totpSecret);

        user.totpEnabled = false;
        user.totpSecret = '';
        await user.save();

        return { msg: 'TOTP is canceled.' };
    }

    /**
     * Obtiene todos los revisores
     */
    static async getReviewers() {
        const users = await this.getAll();
        return users.filter(user =>
            acl.isAllowed(user.role, 'audits:review') ||
            acl.isAllowed(user.role, 'audits:review-all')
        );
    }

    /**
     * Exporta usuarios para backup
     * @param {string} path - Ruta de backup
     */
    static async backup(path) {
        const fs = require('fs');

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(`${path}/users.json`);
            writeStream.write('[');

            let users = User.find().cursor();
            let isFirst = true;

            users.eachAsync(async (document) => {
                document = document.toObject();
                delete document.refreshTokens;
                
                if (!isFirst) {
                    writeStream.write(',');
                } else {
                    isFirst = false;
                }
                writeStream.write(JSON.stringify(document, null, 2));
            })
            .then(() => {
                writeStream.write(']');
                writeStream.end();
            })
            .catch(reject);

            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
        });
    }

    /**
     * Restaura usuarios desde backup
     * @param {string} path - Ruta de backup
     * @param {string} mode - 'upsert' o 'revert'
     */
    static async restore(path, mode = 'upsert') {
        const fs = require('fs');
        const JSONStream = require('JSONStream');

        if (mode === 'revert') {
            await User.deleteMany();
        }

        return new Promise((resolve, reject) => {
            let documents = [];

            const readStream = fs.createReadStream(`${path}/users.json`);
            const jsonStream = JSONStream.parse('*');
            readStream.pipe(jsonStream);

            readStream.on('error', reject);

            jsonStream.on('data', async (document) => {
                documents.push(document);
                if (documents.length === 100) {
                    await User.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { _id: doc._id },
                            replacement: doc,
                            upsert: true
                        }
                    })));
                    documents = [];
                }
            });

            jsonStream.on('end', async () => {
                if (documents.length > 0) {
                    await User.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { _id: doc._id },
                            replacement: doc,
                            upsert: true
                        }
                    })));
                }
                resolve();
            });

            jsonStream.on('error', reject);
        });
    }

    /**
     * Toggle enabled/disabled de un usuario
     * @param {string} userId - ID del usuario
     * @param {boolean} enabled - Nuevo estado
     * @returns {Promise<Object>} Usuario actualizado
     */
    static async toggleEnabled(userId, enabled) {
        const user = await User.findById(userId);
        
        if (!user) {
            throw { fn: 'NotFound', message: 'User not found' };
        }
        
        // No permitir desactivar al propio usuario admin
        if (user.role === 'admin' && !enabled) {
            // Verificar si hay otros admins activos
            const activeAdmins = await User.countDocuments({ 
                role: 'admin', 
                enabled: true,
                _id: { $ne: userId }
            });
            
            if (activeAdmins === 0) {
                throw { fn: 'BadParameters', message: 'Cannot disable the last active admin' };
            }
        }
        
        user.enabled = enabled;
        await user.save();
        
        // Retornar usuario sin password
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.totpSecret;
        
        return userObj;
    }
}

module.exports = UserService;