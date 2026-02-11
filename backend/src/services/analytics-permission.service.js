const mongoose = require('mongoose');
const AnalyticsPermission = require('../models/analytics-permission.model');
const Company = require('../models/company.model');
const User = require('../models/user.model');

/**
 * AnalyticsPermissionService
 * 
 * Servicio para gestionar los permisos granulares de analytics.
 * Permite al admin configurar qué datos puede ver cada usuario analyst.
 * 
 * FUNCIONALIDADES:
 * - CRUD de permisos por usuario
 * - Construcción de filtros MongoDB según permisos
 * - Verificación de acceso a compañías
 * - Filtrado de respuestas por secciones
 */
class AnalyticsPermissionService {
    
    /**
     * ========================================
     * MÉTODOS DE OBTENCIÓN
     * ========================================
     */
    
    /**
     * Obtener permisos de un usuario por su ID
     * Si no existen, crea permisos por defecto
     * @param {String|ObjectId} userId 
     * @returns {Promise<AnalyticsPermission>}
     */
    static async getByUserId(userId) {
        let permission = await AnalyticsPermission.findOne({ userId })
            .populate('globalAllowedCompanies', 'name shortName cuadroDeMando status')
            .populate('globalExcludedCompanies', 'name shortName')
            .populate('endpoints.globalDashboard.allowedCompanies', 'name shortName cuadroDeMando')
            .populate('endpoints.companyDashboard.allowedCompanies', 'name shortName cuadroDeMando')
            .populate('endpoints.entidadesCriticas.allowedCompanies', 'name shortName cuadroDeMando')
            .populate('endpoints.vulnerabilidadesEntidad.allowedCompanies', 'name shortName cuadroDeMando')
            .populate('createdBy', 'username firstname lastname')
            .populate('updatedBy', 'username firstname lastname');
        
        // Si no existe, crear uno por defecto (sin restricciones)
        if (!permission) {
            permission = await this.createDefault(userId);
        }
        
        return permission;
    }
    
    /**
     * Obtener permisos sin crear por defecto
     * @param {String|ObjectId} userId 
     * @returns {Promise<AnalyticsPermission|null>}
     */
    static async findByUserId(userId) {
        return AnalyticsPermission.findOne({ userId });
    }
    
    /**
     * Obtener todos los permisos configurados (para admin)
     * @returns {Promise<Array<AnalyticsPermission>>}
     */
    static async getAll() {
        return AnalyticsPermission.find()
            .populate('userId', 'username firstname lastname email role')
            .populate('globalAllowedCompanies', 'name shortName cuadroDeMando')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username')
            .sort({ updatedAt: -1 });
    }
    
    /**
     * Obtener usuarios con rol analyst
     * @returns {Promise<Array<User>>}
     */
    static async getAnalystUsers() {
        const analysts = await User.find({ role: 'analyst', enabled: true })
            .select('_id username firstname lastname email role createdAt')
            .sort({ username: 1 });
        
        // Enriquecer con información de permisos
        const enrichedAnalysts = await Promise.all(
            analysts.map(async (analyst) => {
                const permission = await AnalyticsPermission.findOne({ userId: analyst._id })
                    .select('customPermissionsEnabled globalOnlyCuadroDeMando updatedAt');
                
                return {
                    ...analyst.toObject(),
                    hasCustomPermissions: permission?.customPermissionsEnabled || false,
                    permissionInfo: permission ? {
                        customPermissionsEnabled: permission.customPermissionsEnabled,
                        globalOnlyCuadroDeMando: permission.globalOnlyCuadroDeMando,
                        lastUpdated: permission.updatedAt
                    } : null
                };
            })
        );
        
        return enrichedAnalysts;
    }
    
    /**
     * ========================================
     * MÉTODOS DE CREACIÓN/ACTUALIZACIÓN
     * ========================================
     */
    
    /**
     * Crear permisos por defecto para un usuario
     * @param {String|ObjectId} userId 
     * @param {String|ObjectId} createdBy 
     * @returns {Promise<AnalyticsPermission>}
     */
    static async createDefault(userId, createdBy = null) {
        const permission = new AnalyticsPermission({
            userId,
            customPermissionsEnabled: false,
            createdBy
        });
        
        await permission.save();
        
        // Actualizar referencia en usuario
        await User.findByIdAndUpdate(userId, { 
            analyticsPermissions: permission._id 
        });
        
        return permission;
    }
    
    /**
     * Crear o actualizar permisos de un usuario
     * @param {String|ObjectId} userId 
     * @param {Object} permissionData 
     * @param {String|ObjectId} updatedBy 
     * @returns {Promise<AnalyticsPermission>}
     */
    static async upsert(userId, permissionData, updatedBy) {
        // Validar que el usuario existe
        const user = await User.findById(userId);
        if (!user) {
            throw { fn: 'NotFound', message: 'User not found' };
        }
        
        // Validar que es un analyst (o admin configurando)
        if (user.role !== 'analyst' && user.role !== 'admin') {
            console.warn(`[AnalyticsPermission] Warning: Setting permissions for non-analyst user ${userId}`);
        }
        
        // Buscar permisos existentes
        const existing = await AnalyticsPermission.findOne({ userId });
        
        if (existing) {
            // Actualizar existente
            Object.assign(existing, permissionData, { updatedBy });
            await existing.save();
            
            return this.getByUserId(userId);
        }
        
        // Crear nuevo
        const permission = new AnalyticsPermission({
            ...permissionData,
            userId,
            createdBy: updatedBy,
            updatedBy
        });
        
        await permission.save();
        
        // Actualizar referencia en usuario
        await User.findByIdAndUpdate(userId, { 
            analyticsPermissions: permission._id 
        });
        
        return this.getByUserId(userId);
    }
    
    /**
     * Actualizar solo campos específicos
     * @param {String|ObjectId} userId 
     * @param {Object} updates 
     * @param {String|ObjectId} updatedBy 
     * @returns {Promise<AnalyticsPermission>}
     */
    static async partialUpdate(userId, updates, updatedBy) {
        const permission = await AnalyticsPermission.findOne({ userId });
        
        if (!permission) {
            throw { fn: 'NotFound', message: 'Permission not found for this user' };
        }
        
        // Campos permitidos para actualización parcial
        const allowedFields = [
            'customPermissionsEnabled',
            'globalOnlyCuadroDeMando',
            'globalAllowedCompanies',
            'globalExcludedCompanies',
            'endpoints',
            'visibleSections',
            'notes'
        ];
        
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                permission[field] = updates[field];
            }
        });
        
        permission.updatedBy = updatedBy;
        await permission.save();
        
        return this.getByUserId(userId);
    }
    
    /**
     * Eliminar permisos (reset a default)
     * @param {String|ObjectId} userId 
     * @returns {Promise<Object>}
     */
    static async delete(userId) {
        await AnalyticsPermission.findOneAndDelete({ userId });
        await User.findByIdAndUpdate(userId, { 
            $unset: { analyticsPermissions: 1 } 
        });
        
        return { message: 'Permissions reset to default' };
    }
    
    /**
     * ========================================
     * MÉTODOS DE VERIFICACIÓN DE ACCESO
     * ========================================
     */
    
    /**
     * Verificar si un usuario puede acceder a una compañía específica
     * @param {String|ObjectId} userId 
     * @param {String|ObjectId} companyId 
     * @param {String} endpointName 
     * @returns {Promise<Boolean>}
     */
    static async canAccessCompany(userId, companyId, endpointName) {
        const permission = await this.getByUserId(userId);
        
        // Sin permisos personalizados = acceso total
        if (!permission.customPermissionsEnabled) {
            return true;
        }
        
        // Verificar si el endpoint está habilitado
        if (!permission.isEndpointEnabled(endpointName)) {
            return false;
        }
        
        // Verificar si la compañía está en lista permitida
        if (!permission.isCompanyAllowed(companyId, endpointName)) {
            return false;
        }
        
        // Verificar filtro cuadroDeMando
        if (permission.shouldFilterByCuadroDeMando(endpointName)) {
            const company = await Company.findById(companyId).select('cuadroDeMando');
            if (!company || company.cuadroDeMando !== true) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Verificar si un endpoint está habilitado para un usuario
     * @param {String|ObjectId} userId 
     * @param {String} endpointName 
     * @returns {Promise<Boolean>}
     */
    static async isEndpointEnabled(userId, endpointName) {
        const permission = await this.getByUserId(userId);
        return permission.isEndpointEnabled(endpointName);
    }
    
    /**
     * ========================================
     * MÉTODOS DE CONSTRUCCIÓN DE FILTROS
     * ========================================
     */
    
    /**
     * Obtener IDs de compañías permitidas para un usuario y endpoint
     * @param {String|ObjectId} userId 
     * @param {String} endpointName 
     * @returns {Promise<Array<ObjectId>>}
     */
    static async getAllowedCompanyIds(userId, endpointName) {
        const permission = await this.getByUserId(userId);
        
        // Sin permisos personalizados = todas las compañías
        if (!permission.customPermissionsEnabled) {
            return null; // null significa "sin restricción"
        }
        
        // Construir query base
        let query = { status: true };
        
        // Aplicar filtro cuadroDeMando
        if (permission.shouldFilterByCuadroDeMando(endpointName)) {
            query.cuadroDeMando = true;
        }
        
        // Obtener lista de permitidas (del endpoint o global)
        const endpoint = permission.endpoints[endpointName];
        const allowedFromEndpoint = endpoint?.allowedCompanies || [];
        const allowedGlobal = permission.globalAllowedCompanies || [];
        const excludedGlobal = permission.globalExcludedCompanies || [];
        
        // Si hay lista específica del endpoint, usar esa
        if (allowedFromEndpoint.length > 0) {
            query._id = { $in: allowedFromEndpoint };
        } 
        // Si hay lista global, usar esa
        else if (allowedGlobal.length > 0) {
            query._id = { $in: allowedGlobal };
        }
        
        // Aplicar exclusiones globales
        if (excludedGlobal.length > 0) {
            if (query._id) {
                // Filtrar de la lista existente
                query._id.$nin = excludedGlobal;
            } else {
                query._id = { $nin: excludedGlobal };
            }
        }
        
        // Obtener IDs
        const companies = await Company.find(query).select('_id');
        return companies.map(c => c._id);
    }
    
    /**
     * Construir filtro de MongoDB para queries de analytics
     * Este filtro se agrega a las consultas de auditorías
     * @param {String|ObjectId} userId 
     * @param {String} endpointName 
     * @param {Object} baseFilter - Filtro base (ej: { createdAt: {...} })
     * @returns {Promise<Object>}
     */
    static async buildCompanyFilter(userId, endpointName, baseFilter = {}) {
        const allowedIds = await this.getAllowedCompanyIds(userId, endpointName);
        
        // null significa sin restricción
        if (allowedIds === null) {
            return baseFilter;
        }
        
        // Si no hay compañías permitidas, devolver filtro que no matchea nada
        if (allowedIds.length === 0) {
            return { 
                ...baseFilter, 
                company: { $in: [] } // No matcheará nada
            };
        }
        
        return {
            ...baseFilter,
            company: { $in: allowedIds }
        };
    }
    
    /**
     * Construir filtro para agregaciones que usan lookup con companies
     * @param {String|ObjectId} userId 
     * @param {String} endpointName 
     * @returns {Promise<Object>}
     */
    static async buildAggregationCompanyMatch(userId, endpointName) {
        const permission = await this.getByUserId(userId);
        
        if (!permission.customPermissionsEnabled) {
            return {}; // Sin filtro adicional
        }
        
        const allowedIds = await this.getAllowedCompanyIds(userId, endpointName);
        
        if (allowedIds === null) {
            return {};
        }
        
        if (allowedIds.length === 0) {
            return { _id: { $in: [] } }; // No matcheará nada
        }
        
        return { _id: { $in: allowedIds } };
    }
    
    /**
     * ========================================
     * MÉTODOS DE FILTRADO DE RESPUESTA
     * ========================================
     */
    
    /**
     * Filtrar respuesta según secciones visibles
     * @param {String|ObjectId} userId 
     * @param {Object} responseData 
     * @returns {Promise<Object>}
     */
    static async filterResponseSections(userId, responseData) {
        const permission = await this.getByUserId(userId);
        const visibleSections = permission.getVisibleSections();
        
        // Crear copia para no mutar el original
        const filtered = { ...responseData };
        
        // Mapeo de secciones a campos en la respuesta
        const sectionMapping = {
            stats: 'stats',
            evaluacionesPorProcedimiento: 'evaluacionesPorProcedimiento',
            evaluacionesPorAlcance: 'evaluacionesPorAlcance',
            evaluacionesPorEstado: 'evaluacionesPorEstado',
            evaluacionesPorTipo: 'evaluacionesPorTipo',
            vulnerabilidadesPorSeveridad: 'vulnerabilidadesPorSeveridad',
            tendenciaMensual: 'tendenciaMensual',
            entidadesEvaluadas: 'entidadesEvaluadas',
            evaluacionesRecientes: 'evaluacionesRecientes',
            alertasActivas: 'alertasActivas',
            clientesAsociados: 'clientesAsociados'
        };
        
        // Eliminar secciones no visibles
        Object.entries(sectionMapping).forEach(([section, field]) => {
            if (!visibleSections[section] && filtered[field] !== undefined) {
                delete filtered[field];
            }
        });
        
        return filtered;
    }
    
    /**
     * Filtrar lista de entidades según permisos
     * @param {String|ObjectId} userId 
     * @param {String} endpointName 
     * @param {Array} entities - Array de entidades con campo company o _id
     * @returns {Promise<Array>}
     */
    static async filterEntities(userId, endpointName, entities) {
        const allowedIds = await this.getAllowedCompanyIds(userId, endpointName);
        
        // Sin restricción
        if (allowedIds === null) {
            return entities;
        }
        
        const allowedIdsStr = allowedIds.map(id => id.toString());
        
        return entities.filter(entity => {
            const entityId = (entity.company || entity._id || entity.idEntidad)?.toString();
            return entityId && allowedIdsStr.includes(entityId);
        });
    }
    
    /**
     * Aplicar límite de resultados según permisos
     * @param {String|ObjectId} userId 
     * @param {String} endpointName 
     * @param {Array} results 
     * @returns {Promise<Array>}
     */
    static async applyMaxResults(userId, endpointName, results) {
        const permission = await this.getByUserId(userId);
        const maxResults = permission.getMaxResults(endpointName);
        
        if (maxResults > 0 && results.length > maxResults) {
            return results.slice(0, maxResults);
        }
        
        return results;
    }
    
    /**
     * ========================================
     * MÉTODOS DE INFORMACIÓN
     * ========================================
     */
    
    /**
     * Obtener información de permisos para incluir en respuesta
     * @param {String|ObjectId} userId 
     * @returns {Promise<Object>}
     */
    static async getPermissionInfo(userId) {
        const permission = await this.getByUserId(userId);
        
        return {
            customPermissionsEnabled: permission.customPermissionsEnabled,
            globalOnlyCuadroDeMando: permission.globalOnlyCuadroDeMando,
            visibleSections: permission.getVisibleSections(),
            hasRestrictions: permission.customPermissionsEnabled && (
                permission.globalOnlyCuadroDeMando ||
                (permission.globalAllowedCompanies?.length > 0) ||
                (permission.globalExcludedCompanies?.length > 0)
            )
        };
    }
    
    /**
     * Obtener compañías disponibles para asignar (para el admin)
     * @param {Object} options 
     * @returns {Promise<Array<Company>>}
     */
    static async getAvailableCompanies(options = {}) {
        const { onlyCuadroDeMando, onlyActive = true } = options;
        
        const query = {};
        
        if (onlyActive) {
            query.status = true;
        }
        
        if (onlyCuadroDeMando) {
            query.cuadroDeMando = true;
        }
        
        return Company.find(query)
            .select('_id name shortName cuadroDeMando nivel categoria status')
            .sort({ name: 1 });
    }
    
    /**
     * Obtener resumen de permisos para un usuario
     * @param {String|ObjectId} userId 
     * @returns {Promise<Object>}
     */
    static async getSummary(userId) {
        const permission = await this.getByUserId(userId);
        return permission.getSummary();
    }
    
    /**
     * ========================================
     * MÉTODOS DE VALIDACIÓN
     * ========================================
     */
    
    /**
     * Validar datos de permisos antes de guardar
     * @param {Object} permissionData 
     * @returns {Object} { valid: Boolean, errors: Array }
     */
    static validatePermissionData(permissionData) {
        const errors = [];
        
        // Validar endpoints
        if (permissionData.endpoints) {
            const validEndpoints = AnalyticsPermission.ENDPOINT_NAMES;
            Object.keys(permissionData.endpoints).forEach(ep => {
                if (!validEndpoints.includes(ep)) {
                    errors.push(`Invalid endpoint name: ${ep}`);
                }
            });
        }
        
        // Validar secciones
        if (permissionData.visibleSections) {
            const validSections = AnalyticsPermission.SECTION_NAMES;
            Object.keys(permissionData.visibleSections).forEach(section => {
                if (!validSections.includes(section)) {
                    errors.push(`Invalid section name: ${section}`);
                }
            });
        }
        
        // Validar IDs de compañías
        const companyArrays = [
            'globalAllowedCompanies',
            'globalExcludedCompanies'
        ];
        
        companyArrays.forEach(field => {
            if (permissionData[field]) {
                permissionData[field].forEach((id, index) => {
                    if (!mongoose.Types.ObjectId.isValid(id)) {
                        errors.push(`Invalid company ID at ${field}[${index}]: ${id}`);
                    }
                });
            }
        });
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * ========================================
     * MÉTODOS DE MIGRACIÓN/SETUP
     * ========================================
     */
    
    /**
     * Crear permisos por defecto para todos los usuarios analyst existentes
     * @returns {Promise<Object>}
     */
    static async initializeAnalystPermissions() {
        const analysts = await User.find({ role: 'analyst' }).select('_id');
        let created = 0;
        let skipped = 0;
        
        for (const analyst of analysts) {
            const existing = await AnalyticsPermission.findOne({ userId: analyst._id });
            if (!existing) {
                await this.createDefault(analyst._id);
                created++;
            } else {
                skipped++;
            }
        }
        
        return {
            message: 'Analyst permissions initialized',
            created,
            skipped,
            total: analysts.length
        };
    }
    
    /**
     * Limpiar permisos huérfanos (usuarios eliminados)
     * @returns {Promise<Object>}
     */
    static async cleanupOrphanPermissions() {
        const permissions = await AnalyticsPermission.find().select('userId');
        let deleted = 0;
        
        for (const permission of permissions) {
            const userExists = await User.exists({ _id: permission.userId });
            if (!userExists) {
                await AnalyticsPermission.findByIdAndDelete(permission._id);
                deleted++;
            }
        }
        
        return {
            message: 'Orphan permissions cleaned up',
            deleted
        };
    }
}

module.exports = AnalyticsPermissionService;
