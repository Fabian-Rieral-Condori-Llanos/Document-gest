const ClientService = require('../services/client.service');
const Response = require('../utils/httpResponse');

/**
 * Client Controller
 * 
 * Maneja las peticiones HTTP relacionadas con clientes.
 */
class ClientController {
    /**
     * GET /api/clients
     * Obtiene todos los clientes
     */
    static async getAll(req, res) {
        try {
            const clients = await ClientService.getAll();
            Response.Ok(res, clients);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/clients/:id
     * Obtiene un cliente por ID
     */
    static async getById(req, res) {
        try {
            const client = await ClientService.getById(req.params.id);
            Response.Ok(res, client);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/clients
     * Crea un nuevo cliente
     */
    static async create(req, res) {
        try {
            const { email, company, lastname, firstname, phone, cell, title } = req.body;

            if (!email) {
                return Response.BadParameters(res, 'Client email is required');
            }

            // company puede ser el nombre de la compañía (string) o el ID
            const companyName = typeof company === 'string' && company.length < 24 ? company : null;

            const client = await ClientService.create(
                { email, lastname, firstname, phone, cell, title },
                companyName
            );

            Response.Created(res, client);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/clients/:id
     * Actualiza un cliente
     */
    static async update(req, res) {
        try {
            const { email, company, lastname, firstname, phone, cell, title } = req.body;
            const updateData = {};

            if (email !== undefined) updateData.email = email;
            if (lastname !== undefined) updateData.lastname = lastname;
            if (firstname !== undefined) updateData.firstname = firstname;
            if (phone !== undefined) updateData.phone = phone;
            if (cell !== undefined) updateData.cell = cell;
            if (title !== undefined) updateData.title = title;

            // company puede ser el nombre de la compañía (string) o el ID
            const companyName = typeof company === 'string' && company.length < 24 ? company : null;

            const client = await ClientService.update(req.params.id, updateData, companyName);
            Response.Ok(res, client);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/clients/:id
     * Elimina un cliente
     */
    static async delete(req, res) {
        try {
            await ClientService.delete(req.params.id);
            Response.Ok(res, 'Client deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = ClientController;