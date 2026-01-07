const AuditProcedureService = require('../services/audit-procedure.service');
const AuditProcedure = require('../models/audit-procedure.model');
const Response = require('../utils/httpResponse');

/**
 * AuditProcedure Controller
 * 
 * Maneja las peticiones HTTP para procedimientos de auditoría.
 */
class AuditProcedureController {
    /**
     * GET /api/audit-procedures
     * Obtiene todos los procedimientos
     */
    static async getAll(req, res) {
        try {
            const filters = {
                origen: req.query.origen,
                alcance: req.query.alcance,
                auditId: req.query.auditId
            };
            
            const procedures = await AuditProcedureService.getAll(filters);
            Response.Ok(res, procedures);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-procedures/stats
     * Obtiene estadísticas de procedimientos
     */
    static async getStats(req, res) {
        try {
            const stats = await AuditProcedureService.getStats();
            Response.Ok(res, stats);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-procedures/alcance-tipos
     * Obtiene los tipos de alcance disponibles
     */
    static async getAlcanceTipos(req, res) {
        try {
            Response.Ok(res, AuditProcedureService.getAlcanceTipos());
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-procedures/search
     * Busca procedimientos por origen
     */
    static async search(req, res) {
        try {
            if (!req.query.q) {
                return Response.BadParameters(res, 'Search query is required');
            }
            
            const procedures = await AuditProcedureService.searchByOrigen(req.query.q);
            Response.Ok(res, procedures);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-procedures/:id
     * Obtiene un procedimiento por ID
     */
    static async getById(req, res) {
        try {
            const procedure = await AuditProcedureService.getById(req.params.id);
            Response.Ok(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-procedures/audit/:auditId
     * Obtiene el procedimiento de una auditoría
     */
    static async getByAuditId(req, res) {
        try {
            const procedure = await AuditProcedureService.getByAuditId(req.params.auditId);
            Response.Ok(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/audit-procedures
     * Crea un nuevo procedimiento
     */
    static async create(req, res) {
        try {
            if (!req.body.auditId) {
                return Response.BadParameters(res, 'Audit ID is required');
            }
            
            if (!req.body.origen) {
                return Response.BadParameters(res, 'Origen is required');
            }
            
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const procedure = await AuditProcedureService.create(req.body, userId);
            Response.Created(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-procedures/:id
     * Actualiza un procedimiento
     */
    static async update(req, res) {
        try {
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const procedure = await AuditProcedureService.update(
                req.params.id,
                req.body,
                userId
            );
            Response.Ok(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-procedures/audit/:auditId
     * Actualiza por auditId (crea si no existe)
     */
    static async updateByAuditId(req, res) {
        try {
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const procedure = await AuditProcedureService.updateByAuditId(
                req.params.auditId,
                req.body,
                userId
            );
            Response.Ok(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-procedures/:id/solicitud
     * Actualiza solo la solicitud
     */
    static async updateSolicitud(req, res) {
        try {
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const procedure = await AuditProcedureService.updateSolicitud(
                req.params.id,
                req.body,
                userId
            );
            Response.Ok(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-procedures/:id/instructivo
     * Actualiza solo el instructivo
     */
    static async updateInstructivo(req, res) {
        try {
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const procedure = await AuditProcedureService.updateInstructivo(
                req.params.id,
                req.body,
                userId
            );
            Response.Ok(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-procedures/:id/informe
     * Actualiza solo el informe
     */
    static async updateInforme(req, res) {
        try {
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const procedure = await AuditProcedureService.updateInforme(
                req.params.id,
                req.body,
                userId
            );
            Response.Ok(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-procedures/:id/respuesta
     * Actualiza solo la respuesta
     */
    static async updateRespuesta(req, res) {
        try {
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const procedure = await AuditProcedureService.updateRespuesta(
                req.params.id,
                req.body,
                userId
            );
            Response.Ok(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-procedures/:id/notas
     * Actualiza solo las notas
     */
    static async updateNotas(req, res) {
        try {
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const procedure = await AuditProcedureService.updateNotas(
                req.params.id,
                req.body,
                userId
            );
            Response.Ok(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-procedures/:id/retest
     * Actualiza solo la sección de retest
     */
    static async updateRetest(req, res) {
        try {
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const procedure = await AuditProcedureService.updateRetest(
                req.params.id,
                req.body,
                userId
            );
            Response.Ok(res, procedure);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/audit-procedures/:id
     * Elimina un procedimiento
     */
    static async delete(req, res) {
        try {
            await AuditProcedureService.delete(req.params.id);
            Response.Ok(res, 'Procedure deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = AuditProcedureController;