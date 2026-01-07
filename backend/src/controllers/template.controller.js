const fs = require('fs');
const path = require('path');
const TemplateService = require('../services/template.service');
const Response = require('../utils/httpResponse');
const { validFilename } = require('../utils/helpers');

/**
 * Template Controller
 * 
 * Maneja las peticiones HTTP relacionadas con plantillas de reportes.
 */
class TemplateController {
    /**
     * GET /api/templates
     * Obtiene todas las plantillas
     */
    static async getAll(req, res) {
        try {
            const templates = await TemplateService.getAll();
            Response.Ok(res, templates);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/templates/:id
     * Obtiene una plantilla por ID
     */
    static async getById(req, res) {
        try {
            const template = await TemplateService.getById(req.params.id);
            Response.Ok(res, template);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/templates
     * Crea una nueva plantilla (con archivo)
     */
    static async create(req, res) {
        try {
            if (!req.file) {
                return Response.BadParameters(res, 'Template file is required');
            }

            const { name } = req.body;
            if (!name) {
                return Response.BadParameters(res, 'Template name is required');
            }

            if (!validFilename(name)) {
                return Response.BadParameters(res, 'Invalid template name characters');
            }

            // Obtener extensión del archivo
            const ext = path.extname(req.file.originalname).slice(1);
            if (!ext) {
                return Response.BadParameters(res, 'File must have an extension');
            }

            // Crear registro en BD
            const template = await TemplateService.create({ name, ext });

            // Guardar archivo
            const templatesDir = path.join(__basedir, '..', 'report-templates');
            if (!fs.existsSync(templatesDir)) {
                fs.mkdirSync(templatesDir, { recursive: true });
            }

            const filePath = path.join(templatesDir, `${template._id}.${ext}`);
            fs.writeFileSync(filePath, req.file.buffer);

            Response.Created(res, template);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/templates/:id
     * Actualiza una plantilla
     */
    static async update(req, res) {
        try {
            const { name } = req.body;
            const updateData = {};

            if (name !== undefined) {
                if (!validFilename(name)) {
                    return Response.BadParameters(res, 'Invalid template name characters');
                }
                updateData.name = name;
            }

            // Si hay archivo nuevo
            if (req.file) {
                const ext = path.extname(req.file.originalname).slice(1);
                if (ext) {
                    updateData.ext = ext;

                    // Obtener plantilla actual para eliminar archivo viejo
                    const currentTemplate = await TemplateService.getById(req.params.id);
                    const templatesDir = path.join(__basedir, '..', 'report-templates');

                    // Eliminar archivo anterior
                    const oldPath = path.join(templatesDir, `${req.params.id}.${currentTemplate.ext}`);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }

                    // Guardar nuevo archivo
                    const newPath = path.join(templatesDir, `${req.params.id}.${ext}`);
                    fs.writeFileSync(newPath, req.file.buffer);
                }
            }

            const template = await TemplateService.update(req.params.id, updateData);
            Response.Ok(res, template);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/templates/:id
     * Elimina una plantilla
     */
    static async delete(req, res) {
        try {
            const template = await TemplateService.getById(req.params.id);

            // Eliminar archivo
            const templatesDir = path.join(__basedir, '..', 'report-templates');
            const filePath = path.join(templatesDir, `${req.params.id}.${template.ext}`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await TemplateService.delete(req.params.id);
            Response.Ok(res, 'Template deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/templates/:id/download
     * Descarga el archivo de plantilla
     */
    static async download(req, res) {
        try {
            const template = await TemplateService.getById(req.params.id);
            const templatesDir = path.join(__basedir, '..', 'report-templates');
            const filePath = path.join(templatesDir, `${req.params.id}.${template.ext}`);

            if (!fs.existsSync(filePath)) {
                return Response.NotFound(res, 'Template file not found');
            }

            res.download(filePath, `${template.name}.${template.ext}`);
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = TemplateController;