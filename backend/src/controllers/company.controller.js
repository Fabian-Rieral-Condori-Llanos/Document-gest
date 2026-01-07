const CompanyService = require('../services/company.service');
const Response = require('../utils/httpResponse');

/**
 * Company Controller
 * 
 * Maneja las peticiones HTTP relacionadas con compañías.
 */
class CompanyController {
    /**
     * GET /api/companies
     * Obtiene todas las compañías
     */
    static async getAll(req, res) {
        try {
            const companies = await CompanyService.getAll();
            Response.Ok(res, companies);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/companies/:id
     * Obtiene una compañía por ID
     */
    static async getById(req, res) {
        try {
            const company = await CompanyService.getById(req.params.id);
            Response.Ok(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/companies
     * Crea una nueva compañía
     */
    static async create(req, res) {
        try {
            const { name, shortName, logo } = req.body;

            if (!name) {
                return Response.BadParameters(res, 'Company name is required');
            }

            const company = await CompanyService.create({ name, shortName, logo });
            Response.Created(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/companies/:id
     * Actualiza una compañía
     */
    static async update(req, res) {
        try {
            const { name, shortName, logo } = req.body;
            const updateData = {};

            if (name !== undefined) updateData.name = name;
            if (shortName !== undefined) updateData.shortName = shortName;
            if (logo !== undefined) updateData.logo = logo;

            const company = await CompanyService.update(req.params.id, updateData);
            Response.Ok(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/companies/:id
     * Elimina una compañía
     */
    static async delete(req, res) {
        try {
            await CompanyService.delete(req.params.id);
            Response.Ok(res, 'Company deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = CompanyController;