const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./auth.middleware');

/**
 * Middleware de Control de Acceso (ACL)
 * 
 * Responsabilidades:
 * - Definir y gestionar roles y permisos
 * - Verificar si un usuario tiene permiso para una acción
 * - Proveer middleware para proteger rutas
 */

/**
 * Roles predefinidos del sistema
 */
const builtInRoles = {
    user: {
        allows: [
            // Audits
            'audits:create',
            'audits:read',
            'audits:update',
            'audits:delete',
            // Images
            'images:create',
            'images:read',
            // Clients
            'clients:create',
            'clients:read',
            'clients:update',
            'clients:delete',
            // Companies
            'companies:create',
            'companies:read',
            'companies:update',
            'companies:delete',
            // Languages
            'languages:read',
            // Audit Types
            'audit-types:read',
            // Vulnerability Types
            'vulnerability-types:read',
            // Vulnerability Categories
            'vulnerability-categories:read',
            // Sections Data
            'sections:read',
            // Templates
            'templates:read',
            // Users
            'users:read',
            // Roles
            'roles:read',
            // Vulnerabilities
            'vulnerabilities:read',
            'vulnerability-updates:create',
            // Custom Fields
            'custom-fields:read',
            // Settings
            'settings:read-public',
            // Analytics
            'analytics:read',
            // Procedure Templates (solo lectura para usuarios)
            'procedure-templates:read',
            // Alcance Templates (solo lectura para usuarios)
            'alcance-templates:read',
            // Report Templates (solo lectura para usuarios)
            'report-templates:read'
        ]
    },
    // analytics: {
    //     allows: [
    //         'analytics:read',
    //         "companies:read"
    //     ]
    // },
    admin: {
        allows: '*'  // Todos los permisos
    }
};

/**
 * Cargar roles personalizados desde archivo
 */
const loadCustomRoles = () => {
    try {
        return require('../config/roles.json');
    } catch (error) {
        return {};
    }
};

/**
 * Clase ACL para gestión de permisos
 */
class ACL {
    constructor(roles) {
        if (typeof roles !== 'object') {
            throw new TypeError('Expected an object as input');
        }
        this.roles = roles;
    }

    /**
     * Verifica si un rol tiene un permiso específico
     * @param {string} role - Nombre del rol
     * @param {string} permission - Permiso a verificar
     * @returns {boolean}
     */
    isAllowed(role, permission) {
        // Si no existe el rol, usar rol por defecto 'user'
        if (!this.roles[role] && !this.roles['user']) {
            return false;
        }

        const $role = this.roles[role] || this.roles['user'];

        // Verificar permiso directo o wildcard
        if ($role.allows) {
            if ($role.allows === '*') return true;
            if ($role.allows.includes(permission)) return true;
            if ($role.allows.includes(`${permission}-all`)) return true;
        }

        // Verificar herencia de roles
        if (!$role.inherits || $role.inherits.length < 1) {
            return false;
        }

        // Verificar recursivamente en roles heredados
        return $role.inherits.some(inheritedRole => this.isAllowed(inheritedRole, permission));
    }

    /**
     * Middleware factory para verificar permisos
     * @param {string} permission - Permiso requerido
     * @returns {Function} Middleware de Express
     */
    hasPermission(permission) {
        return (req, res, next) => {
            // Verificar que existe token en cookies
            if (!req.cookies || !req.cookies['token']) {
                return res.status(401).json({ status: 'error', data: 'No token provided' });
            }

            const cookie = req.cookies['token'].split(' ');
            if (cookie.length !== 2 || cookie[0] !== 'JWT') {
                return res.status(401).json({ status: 'error', data: 'Bad token type' });
            }

            const token = cookie[1];

            // Verificar y decodificar token
            jwt.verify(token, getJwtSecret(), (err, decoded) => {
                if (err) {
                    const message = err.name === 'TokenExpiredError'
                        ? 'Expired token'
                        : 'Invalid token';
                    return res.status(401).json({ status: 'error', data: message });
                }

                // 'validtoken' es un permiso especial que solo requiere token válido
                if (permission === 'validtoken' || this.isAllowed(decoded.role, permission)) {
                    req.decodedToken = decoded;
                    return next();
                }

                return res.status(403).json({ status: 'error', data: 'Insufficient privileges' });
            });
        };
    }

    /**
     * Construye lista de permisos para un rol (incluyendo heredados)
     * @param {string} role - Nombre del rol
     * @returns {Array|string} Lista de permisos o '*'
     */
    buildRoles(role) {
        const currentRole = this.roles[role] || this.roles['user'];
        let result = currentRole.allows || [];

        if (currentRole.inherits) {
            currentRole.inherits.forEach(inheritedRole => {
                const inheritedPermissions = this.buildRoles(inheritedRole);
                result = [...new Set([...result, ...inheritedPermissions])];
            });
        }

        return result;
    }

    /**
     * Obtiene todos los permisos de un rol
     * @param {string} role - Nombre del rol
     * @returns {Array|string} Lista de permisos o '*'
     */
    getRoles(role) {
        const result = this.buildRoles(role);
        return result.includes('*') ? '*' : result;
    }

    /**
     * Obtiene lista de roles disponibles
     * @returns {Array} Lista de nombres de roles
     */
    getAvailableRoles() {
        return Object.keys(this.roles);
    }
}

// Combinar roles personalizados con los predefinidos
const customRoles = loadCustomRoles();
const allRoles = { ...customRoles, ...builtInRoles };

// Instancia singleton de ACL
const acl = new ACL(allRoles);

module.exports = {
    ACL,
    acl,
    builtInRoles
};
