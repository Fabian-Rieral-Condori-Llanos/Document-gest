const ReportTemplateService = require('../services/report-template.service');
const Response = require('../utils/httpResponse');

/**
 * ReportTemplateController
 * 
 * Controlador para gestión de plantillas de reportes.
 * Solo administradores pueden crear/editar/eliminar.
 */
class ReportTemplateController {
    
    /**
     * GET /api/report-templates
     * Obtiene todas las plantillas
     */
    static async getAll(req, res) {
        try {
            const isAdmin = req.decodedToken.role === 'admin';
            const filters = {};
            
            // Si no es admin, solo mostrar activas
            if (!isAdmin) {
                filters.isActive = true;
            } else {
                if (req.query.isActive !== undefined) {
                    filters.isActive = req.query.isActive === 'true';
                }
            }
            
            if (req.query.category) {
                filters.category = req.query.category;
            }
            
            if (req.query.search) {
                filters.search = req.query.search;
            }
            
            const templates = await ReportTemplateService.getAll(filters);
            
            return Response.Ok(res, templates);
        } catch (err) {
            console.error('[ReportTemplate] Error getting all:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/report-templates/active
     * Obtiene solo plantillas activas (para selectores)
     */
    static async getActive(req, res) {
        try {
            const templates = await ReportTemplateService.getActive();
            
            return Response.Ok(res, templates);
        } catch (err) {
            console.error('[ReportTemplate] Error getting active:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/report-templates/stats
     * Obtiene estadísticas (solo admin)
     */
    static async getStats(req, res) {
        try {
            const stats = await ReportTemplateService.getStats();
            
            return Response.Ok(res, stats);
        } catch (err) {
            console.error('[ReportTemplate] Error getting stats:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/report-templates/variables
     * Obtiene variables del sistema disponibles
     */
    static async getSystemVariables(req, res) {
        try {
            const variables = ReportTemplateService.getSystemVariables();
            
            return Response.Ok(res, variables);
        } catch (err) {
            console.error('[ReportTemplate] Error getting variables:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/report-templates/categories
     * Obtiene categorías disponibles
     */
    static async getCategories(req, res) {
        try {
            const categories = ReportTemplateService.getCategories();
            
            return Response.Ok(res, categories);
        } catch (err) {
            console.error('[ReportTemplate] Error getting categories:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/report-templates/page-number-formats
     * Obtiene formatos de numeración de página
     */
    static async getPageNumberFormats(req, res) {
        try {
            const formats = ReportTemplateService.getPageNumberFormats();
            
            return Response.Ok(res, formats);
        } catch (err) {
            console.error('[ReportTemplate] Error getting page number formats:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/report-templates/defaults/header
     * Obtiene configuración por defecto del header
     */
    static async getDefaultHeaderConfig(req, res) {
        try {
            const config = ReportTemplateService.getDefaultHeaderConfig();
            
            return Response.Ok(res, config);
        } catch (err) {
            console.error('[ReportTemplate] Error getting default header config:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/report-templates/defaults/footer
     * Obtiene configuración por defecto del footer
     */
    static async getDefaultFooterConfig(req, res) {
        try {
            const config = ReportTemplateService.getDefaultFooterConfig();
            
            return Response.Ok(res, config);
        } catch (err) {
            console.error('[ReportTemplate] Error getting default footer config:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/report-templates/defaults/page-numbering
     * Obtiene configuración por defecto de numeración de página
     */
    static async getDefaultPageNumbering(req, res) {
        try {
            const config = ReportTemplateService.getDefaultPageNumbering();
            
            return Response.Ok(res, config);
        } catch (err) {
            console.error('[ReportTemplate] Error getting default page numbering:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/report-templates/:id
     * Obtiene una plantilla por ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const includeContent = req.query.content !== 'false';
            
            const template = await ReportTemplateService.getById(id, includeContent);
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[ReportTemplate] Error getting by id:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/report-templates
     * Crea una nueva plantilla
     */
    static async create(req, res) {
        try {
            const userId = req.decodedToken.id;
            const { name, description, content, category, language, styles, variables, sections } = req.body;
            
            if (!name) {
                return Response.BadParameters(res, 'Template name is required');
            }
            
            const template = await ReportTemplateService.create(
                { name, description, content, category, language, styles, variables, sections },
                userId
            );
            
            return Response.Created(res, template);
        } catch (err) {
            console.error('[ReportTemplate] Error creating:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/report-templates/upload
     * Crea plantilla desde archivo DOCX
     */
    static async createFromFile(req, res) {
        try {
            const userId = req.decodedToken.id;
            
            if (!req.file) {
                return Response.BadParameters(res, 'File is required');
            }
            
            const { name, description, category, language } = req.body;
            
            if (!name) {
                return Response.BadParameters(res, 'Template name is required');
            }
            
            // Verificar extensión
            const ext = req.file.originalname.split('.').pop().toLowerCase();
            if (ext !== 'docx') {
                return Response.BadParameters(res, 'Only DOCX files are supported');
            }
            
            const template = await ReportTemplateService.createFromDocx(
                req.file.buffer,
                req.file.originalname,
                { name, description, category, language },
                userId
            );
            
            return Response.Created(res, template);
        } catch (err) {
            console.error('[ReportTemplate] Error creating from file:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * PUT /api/report-templates/:id
     * Actualiza una plantilla
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            
            const template = await ReportTemplateService.update(id, req.body, userId);
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[ReportTemplate] Error updating:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * PATCH /api/report-templates/:id/content
     * Actualiza solo el contenido
     */
    static async updateContent(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            const { content } = req.body;
            
            if (!content) {
                return Response.BadParameters(res, 'Content is required');
            }
            
            const result = await ReportTemplateService.updateContent(id, content, userId);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ReportTemplate] Error updating content:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * PATCH /api/report-templates/:id/toggle
     * Activa/desactiva una plantilla
     */
    static async toggle(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            
            const template = await ReportTemplateService.toggle(id, userId);
            
            return Response.Ok(res, template);
        } catch (err) {
            console.error('[ReportTemplate] Error toggling:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/report-templates/:id/clone
     * Clona una plantilla
     */
    static async clone(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            const { name } = req.body;
            
            if (!name) {
                return Response.BadParameters(res, 'New template name is required');
            }
            
            const template = await ReportTemplateService.clone(id, name, userId);
            
            return Response.Created(res, template);
        } catch (err) {
            console.error('[ReportTemplate] Error cloning:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * DELETE /api/report-templates/:id
     * Elimina una plantilla
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            
            const result = await ReportTemplateService.delete(id);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ReportTemplate] Error deleting:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/report-templates/initialize
     * Inicializa plantillas por defecto
     */
    static async initialize(req, res) {
        try {
            const userId = req.decodedToken.id;
            
            const result = await ReportTemplateService.initializeDefaults(userId);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ReportTemplate] Error initializing:', err);
            return Response.Internal(res, err);
        }
    }
}

module.exports = ReportTemplateController;