const UserService = require('../services/user.service');
const Response = require('../utils/httpResponse');
const { acl } = require('../middlewares/acl.middleware');
const authConfig = require('../config/auth');

/**
 * User Controller
 * 
 * Maneja las peticiones HTTP relacionadas con usuarios.
 */
class UserController {
    // ============================================
    // AUTHENTICATION
    // ============================================

    /**
     * POST /api/users/login
     * Autentica un usuario
     */
    static async login(req, res) {
        try {
            const { username, password, totpToken } = req.body;

            if (!username || !password) {
                return Response.BadParameters(res, 'Username and password are required');
            }

            const userAgent = req.headers['user-agent'] || '';
            const result = await UserService.authenticate(username, password, totpToken, userAgent);

            // Configurar cookies
            res.cookie('token', `JWT ${result.token}`, authConfig.cookieOptions);
            res.cookie('refreshToken', result.refreshToken, authConfig.refreshCookieOptions);

            Response.Ok(res, { token: `JWT ${result.token}` });
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/users/checktoken
     * Verifica si el token actual es válido
     */
    static async checkToken(req, res) {
        try {
            // Si llegamos aquí, el token es válido (verificado por middleware)
            Response.Ok(res, req.decodedToken);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/users/refreshtoken
     * Refresca el token de acceso
     */
    static async refreshToken(req, res) {
        try {
            const userAgent = req.headers['user-agent'] || '';
            const result = await UserService.updateRefreshToken(req.refreshToken, userAgent);

            res.cookie('token', `JWT ${result.token}`, authConfig.cookieOptions);
            res.cookie('refreshToken', result.refreshToken, authConfig.refreshCookieOptions);

            Response.Ok(res, { token: `JWT ${result.token}` });
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/users/refreshtoken
     * Cierra la sesión actual
     */
    static async logout(req, res) {
        try {
            await UserService.removeSession(
                req.decodedRefreshToken.userId,
                req.decodedRefreshToken.sessionId
            );

            res.clearCookie('token');
            res.clearCookie('refreshToken');

            Response.Ok(res, 'Logged out successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // INIT (First User)
    // ============================================

    /**
     * GET /api/users/init
     * Verifica si existe algún usuario (para setup inicial)
     */
    static async checkInit(req, res) {
        try {
            const users = await UserService.getAll();
            Response.Ok(res, users.length > 0);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/users/init
     * Crea el primer usuario (admin)
     */
    static async createFirstUser(req, res) {
        try {
            const users = await UserService.getAll();

            if (users.length > 0) {
                return Response.Forbidden(res, 'Initial user already exists');
            }

            const { username, password, firstname, lastname } = req.body;

            if (!username || !password || !firstname || !lastname) {
                return Response.BadParameters(res, 'Missing required fields');
            }

            await UserService.create({
                username,
                password,
                firstname,
                lastname,
                role: 'admin'
            });

            Response.Created(res, 'First user created successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // USER CRUD
    // ============================================

    /**
     * GET /api/users
     * Obtiene todos los usuarios
     */
    static async getAll(req, res) {
        try {
            const users = await UserService.getAll();
            Response.Ok(res, users);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/users/:username
     * Obtiene un usuario por username
     */
    static async getByUsername(req, res) {
        try {
            const user = await UserService.getByUsername(req.params.username);
            Response.Ok(res, user);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/users
     * Crea un nuevo usuario
     */
    static async create(req, res) {
        try {
            const { username, password, firstname, lastname, role, email, phone } = req.body;

            if (!username || !password || !firstname || !lastname) {
                return Response.BadParameters(res, 'Missing required fields');
            }

            // Verificar que el rol existe
            const availableRoles = acl.getAvailableRoles();
            if (role && !availableRoles.includes(role)) {
                return Response.BadParameters(res, 'Invalid role');
            }

            await UserService.create({
                username,
                password,
                firstname,
                lastname,
                role: role || 'user',
                email,
                phone
            });

            Response.Created(res, 'User created successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/users/:id
     * Actualiza un usuario (admin)
     */
    static async update(req, res) {
        try {
            const userId = req.params.id;
            const updateData = {};

            // Solo incluir campos que fueron enviados
            const allowedFields = ['username', 'password', 'firstname', 'lastname', 'role', 'email', 'phone', 'jobTitle', 'enabled', 'totpEnabled'];
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            });

            // Si se deshabilita TOTP, limpiar el secreto
            if (updateData.totpEnabled === false) {
                updateData.totpSecret = '';
            }

            await UserService.updateUser(userId, updateData);
            Response.Ok(res, 'User updated successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // PROFILE (Self)
    // ============================================

    /**
     * GET /api/users/me
     * Obtiene el perfil del usuario actual
     */
    static async getMe(req, res) {
        try {
            const user = await UserService.getByUsername(req.decodedToken.username);
            Response.Ok(res, user);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/users/me
     * Actualiza el perfil del usuario actual
     */
    static async updateMe(req, res) {
        try {
            const { password, newPassword, username, firstname, lastname, email, phone, jobTitle } = req.body;

            if (!password) {
                return Response.BadParameters(res, 'Current password is required');
            }

            const result = await UserService.updateProfile(req.decodedToken.username, {
                password,
                newPassword,
                username,
                firstname,
                lastname,
                email,
                phone,
                jobTitle
            });

            // Actualizar cookie con nuevo token
            res.cookie('token', result.token, authConfig.cookieOptions);

            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // TOTP
    // ============================================

    /**
     * GET /api/users/totp
     * Obtiene el QR code para configurar TOTP
     */
    static async getTotpQrcode(req, res) {
        try {
            const result = await UserService.getTotpQrcode(req.decodedToken.username);
            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/users/totp
     * Configura TOTP para el usuario actual
     */
    static async setupTotp(req, res) {
        try {
            const { totpToken, totpSecret } = req.body;

            if (!totpToken || !totpSecret) {
                return Response.BadParameters(res, 'TOTP token and secret are required');
            }

            const result = await UserService.setupTotp(totpToken, totpSecret, req.decodedToken.username);
            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/users/totp
     * Cancela TOTP para el usuario actual
     */
    static async cancelTotp(req, res) {
        try {
            const { totpToken } = req.body;

            if (!totpToken) {
                return Response.BadParameters(res, 'TOTP token is required');
            }

            const result = await UserService.cancelTotp(totpToken, req.decodedToken.username);
            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // REVIEWERS
    // ============================================

    /**
     * GET /api/users/reviewers
     * Obtiene usuarios que pueden ser revisores
     */
    static async getReviewers(req, res) {
        try {
            const reviewers = await UserService.getReviewers();
            Response.Ok(res, reviewers);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // ROLES
    // ============================================

    /**
     * GET /api/users/roles
     * Obtiene los roles disponibles
     */
    static async getRoles(req, res) {
        try {
            const roles = acl.getAvailableRoles();
            Response.Ok(res, roles);
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = UserController;