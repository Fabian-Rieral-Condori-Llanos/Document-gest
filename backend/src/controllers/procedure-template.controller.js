const ProcedureTemplateService = require('../services/procedure-template.service');
const Response = require('../utils/httpResponse');

/**
 * ProcedureTemplateController
 * 
 * Controlador para gestión de plantillas de procedimientos.
 * Solo administradores pueden crear/editar/eliminar.
 * Usuarios normales solo pueden leer plantillas activas.
 */
class ProcedureTemplateController {
    /**
     * GET /api/procedure-templates
     * Obtiene todas las plantillas (admin) o solo activas (usuario)
     */
    async getAll(req, res) {
        try {
            const isAdmin = req.decodedToken.role === 'admin';
            const filters = {};
            
            // Si no es admin, solo mostrar activas
            if (!isAdmin) {
                filters.isActive = true;
            } else {
                // Admin puede filtrar por estado
                if (req.query.isActive !== undefined) {
                    filters.isActive = req.query.isActive === 'true';
                }
            }
            
            // Búsqueda por texto
            if (req.query.search) {
                filters.search = req.query.search;
            }
            
            const templates = await ProcedureTemplateService.getAll(filters);
            
            return Response.Ok(res, templates);
        } catch (err) {
            console.error('[ProcedureTemplate] Error getting all:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/procedure-templates/active
     * Obtiene solo plantillas activas (para selectores)
     */
    async getActive(req, res) {
        try {
            const templates = await ProcedureTemplateService.getActive();
            
            return Response.Ok(res, templates);
        } catch (err) {
            console.error('[ProcedureTemplate] Error getting active:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/procedure-templates/stats
     * Obtiene estadísticas de uso (solo admin)
     */
    async getStats(req, res) {
        try {
            const stats = await ProcedureTemplateService.getStats();
            
            return Response.Ok(res, stats);
        } catch (err) {
            console.error('[ProcedureTemplate] Error getting stats:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/procedure-templates/:id
     * Obtiene una plantilla por ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const template = await ProcedureTemplateService.getById(id);
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[ProcedureTemplate] Error getting by id:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/procedure-templates/code/:code
     * Obtiene una plantilla por código
     */
    async getByCode(req, res) {
        try {
            const { code } = req.params;
            const template = await ProcedureTemplateService.getByCode(code);
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[ProcedureTemplate] Error getting by code:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/procedure-templates
     * Crea una nueva plantilla (solo admin)
     */
    async create(req, res) {
        try {
            const userId = req.decodedToken.id;
            const { name, code, description, isActive } = req.body;
            
            // Validaciones básicas
            if (!name || !code) {
                return Response.BadParameters(res, 'Name and code are required');
            }
            
            const template = await ProcedureTemplateService.create(
                { name, code, description, isActive },
                userId
            );
            
            return Response.Created(res, template);
        } catch (err) {
            console.error('[ProcedureTemplate] Error creating:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/procedure-templates/:id
     * Actualiza una plantilla (solo admin)
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            const { name, code, description, isActive } = req.body;
            
            const template = await ProcedureTemplateService.update(
                id,
                { name, code, description, isActive },
                userId
            );
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[ProcedureTemplate] Error updating:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * PATCH /api/procedure-templates/:id/toggle
     * Activa/desactiva una plantilla (solo admin)
     */
    async toggleActive(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            
            const template = await ProcedureTemplateService.toggleActive(id, userId);
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[ProcedureTemplate] Error toggling:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/procedure-templates/:id
     * Elimina una plantilla (solo admin)
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            
            const result = await ProcedureTemplateService.delete(id);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ProcedureTemplate] Error deleting:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/procedure-templates/initialize
     * Inicializa plantillas por defecto (solo admin)
     */
    async initialize(req, res) {
        try {
            const userId = req.decodedToken.id;
            
            const result = await ProcedureTemplateService.initializeDefaults(userId);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ProcedureTemplate] Error initializing:', err);
            return Response.Internal(res, err);
        }
    }
}

module.exports = new ProcedureTemplateController();
