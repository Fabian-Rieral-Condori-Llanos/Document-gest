const AlcanceTemplateService = require('../services/alcance-template.service');
const Response = require('../utils/httpResponse');

/**
 * AlcanceTemplateController
 * 
 * Controlador para gestión de plantillas de alcance.
 * Solo administradores pueden crear/editar/eliminar.
 * Usuarios normales solo pueden leer plantillas activas.
 */
class AlcanceTemplateController {
    /**
     * GET /api/alcance-templates
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
            
            const templates = await AlcanceTemplateService.getAll(filters);
            
            return Response.Ok(res, templates);
        } catch (err) {
            console.error('[AlcanceTemplate] Error getting all:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/alcance-templates/active
     * Obtiene solo plantillas activas (para selectores)
     */
    async getActive(req, res) {
        try {
            const templates = await AlcanceTemplateService.getActive();
            
            return Response.Ok(res, templates);
        } catch (err) {
            console.error('[AlcanceTemplate] Error getting active:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/alcance-templates/stats
     * Obtiene estadísticas de uso (solo admin)
     */
    async getStats(req, res) {
        try {
            const stats = await AlcanceTemplateService.getStats();
            
            return Response.Ok(res, stats);
        } catch (err) {
            console.error('[AlcanceTemplate] Error getting stats:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/alcance-templates/:id
     * Obtiene una plantilla por ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const template = await AlcanceTemplateService.getById(id);
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[AlcanceTemplate] Error getting by id:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/alcance-templates/name/:name
     * Obtiene una plantilla por nombre
     */
    async getByName(req, res) {
        try {
            const { name } = req.params;
            const template = await AlcanceTemplateService.getByName(decodeURIComponent(name));
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[AlcanceTemplate] Error getting by name:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/alcance-templates
     * Crea una nueva plantilla (solo admin)
     */
    async create(req, res) {
        try {
            const userId = req.decodedToken.id;
            const { name, description, color, isActive } = req.body;
            
            // Validaciones básicas
            if (!name) {
                return Response.BadParameters(res, 'Name is required');
            }
            
            const template = await AlcanceTemplateService.create(
                { name, description, color, isActive },
                userId
            );
            
            return Response.Created(res, template);
        } catch (err) {
            console.error('[AlcanceTemplate] Error creating:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/alcance-templates/:id
     * Actualiza una plantilla (solo admin)
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            const { name, description, color, isActive } = req.body;
            
            const template = await AlcanceTemplateService.update(
                id,
                { name, description, color, isActive },
                userId
            );
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[AlcanceTemplate] Error updating:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * PATCH /api/alcance-templates/:id/toggle
     * Activa/desactiva una plantilla (solo admin)
     */
    async toggleActive(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            
            const template = await AlcanceTemplateService.toggleActive(id, userId);
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[AlcanceTemplate] Error toggling:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/alcance-templates/:id
     * Elimina una plantilla (solo admin)
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            
            const result = await AlcanceTemplateService.delete(id);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[AlcanceTemplate] Error deleting:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/alcance-templates/initialize
     * Inicializa plantillas por defecto (solo admin)
     */
    async initialize(req, res) {
        try {
            const userId = req.decodedToken.id;
            
            const result = await AlcanceTemplateService.initializeDefaults(userId);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[AlcanceTemplate] Error initializing:', err);
            return Response.Internal(res, err);
        }
    }
}

module.exports = new AlcanceTemplateController();