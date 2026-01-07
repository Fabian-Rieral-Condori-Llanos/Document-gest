const ImageService = require('../services/image.service');
const Response = require('../utils/httpResponse');

/**
 * Image Controller
 * 
 * Maneja las peticiones HTTP relacionadas con imágenes.
 */
class ImageController {
    /**
     * GET /api/images/:id
     * Obtiene una imagen por ID
     */
    static async getById(req, res) {
        try {
            const image = await ImageService.getById(req.params.id);
            Response.Ok(res, image);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/images
     * Crea una nueva imagen
     */
    static async create(req, res) {
        try {
            const { value, name, auditId } = req.body;

            if (!value) {
                return Response.BadParameters(res, 'Image value (base64) is required');
            }

            const image = await ImageService.create({ value, name, auditId });
            Response.Created(res, image);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/images/:id
     * Elimina una imagen
     */
    static async delete(req, res) {
        try {
            await ImageService.delete(req.params.id);
            Response.Ok(res, 'Image deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = ImageController;