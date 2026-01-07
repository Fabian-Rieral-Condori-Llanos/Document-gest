const AuditStatusService = require('../services/audit-status.service');
const AuditStatus = require('../models/audit-status.model');
const Response = require('../utils/httpResponse');

/**
 * AuditStatus Controller
 * 
 * Maneja las peticiones HTTP para estados de auditoría.
 */
class AuditStatusController {
    /**
     * GET /api/audit-status
     * Obtiene todos los estados
     */
    static async getAll(req, res) {
        try {
            const filters = {
                status: req.query.status,
                auditId: req.query.auditId
            };
            
            const statuses = await AuditStatusService.getAll(filters);
            Response.Ok(res, statuses);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-status/stats
     * Obtiene estadísticas de estados
     */
    static async getStats(req, res) {
        try {
            const stats = await AuditStatusService.getStats();
            Response.Ok(res, stats);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-status/types
     * Obtiene los tipos de estado disponibles
     */
    static async getTypes(req, res) {
        try {
            Response.Ok(res, Object.values(AuditStatus.STATUS));
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-status/:id
     * Obtiene un estado por ID
     */
    static async getById(req, res) {
        try {
            const status = await AuditStatusService.getById(req.params.id);
            Response.Ok(res, status);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-status/audit/:auditId
     * Obtiene el estado de una auditoría
     */
    static async getByAuditId(req, res) {
        try {
            const status = await AuditStatusService.getByAuditId(req.params.auditId);
            Response.Ok(res, status);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-status/audit/:auditId/history
     * Obtiene el historial de cambios de estado
     */
    static async getHistory(req, res) {
        try {
            const history = await AuditStatusService.getHistory(req.params.auditId);
            Response.Ok(res, history);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/audit-status
     * Crea un nuevo estado
     */
    static async create(req, res) {
        try {
            if (!req.body.auditId) {
                return Response.BadParameters(res, 'Audit ID is required');
            }
            
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const status = await AuditStatusService.create(req.body, userId);
            Response.Created(res, status);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-status/:id
     * Actualiza el estado
     */
    static async updateStatus(req, res) {
        try {
            if (!req.body.status) {
                return Response.BadParameters(res, 'Status is required');
            }
            
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const status = await AuditStatusService.updateStatus(
                req.params.id,
                req.body.status,
                userId,
                req.body.notes
            );
            Response.Ok(res, status);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-status/audit/:auditId
     * Actualiza el estado por auditId
     */
    static async updateStatusByAuditId(req, res) {
        try {
            if (!req.body.status) {
                return Response.BadParameters(res, 'Status is required');
            }
            
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const status = await AuditStatusService.updateStatusByAuditId(
                req.params.auditId,
                req.body.status,
                userId,
                req.body.notes
            );
            Response.Ok(res, status);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/audit-status/:id
     * Elimina un estado
     */
    static async delete(req, res) {
        try {
            await AuditStatusService.delete(req.params.id);
            Response.Ok(res, 'Status deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = AuditStatusController;