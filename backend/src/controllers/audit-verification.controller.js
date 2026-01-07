const AuditVerificationService = require('../services/audit-verification.service');
const AuditVerification = require('../models/audit-verification.model');
const Response = require('../utils/httpResponse');

/**
 * AuditVerification Controller
 * 
 * Maneja las peticiones HTTP para verificaciones de auditoría.
 */
class AuditVerificationController {
    /**
     * GET /api/audit-verifications
     * Obtiene todas las verificaciones
     */
    static async getAll(req, res) {
        try {
            const filters = {
                auditId: req.query.auditId,
                result: req.query.result
            };
            
            const verifications = await AuditVerificationService.getAll(filters);
            Response.Ok(res, verifications);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-verifications/stats
     * Obtiene estadísticas de verificaciones
     */
    static async getStats(req, res) {
        try {
            const stats = await AuditVerificationService.getStats(req.query.auditId);
            Response.Ok(res, stats);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-verifications/statuses
     * Obtiene los tipos de estado de verificación disponibles
     */
    static async getVerificationStatuses(req, res) {
        try {
            Response.Ok(res, {
                verificationStatus: Object.values(AuditVerification.VERIFICATION_STATUS),
                result: Object.values(AuditVerification.RESULT)
            });
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-verifications/:id
     * Obtiene una verificación por ID
     */
    static async getById(req, res) {
        try {
            const verification = await AuditVerificationService.getById(req.params.id);
            Response.Ok(res, verification);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audit-verifications/audit/:auditId
     * Obtiene verificaciones de una auditoría
     */
    static async getByAuditId(req, res) {
        try {
            const verifications = await AuditVerificationService.getByAuditId(req.params.auditId);
            Response.Ok(res, verifications);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/audit-verifications
     * Crea una nueva verificación
     */
    static async create(req, res) {
        try {
            if (!req.body.auditId) {
                return Response.BadParameters(res, 'Audit ID is required');
            }
            
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const verification = await AuditVerificationService.create(req.body, userId);
            Response.Created(res, verification);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-verifications/:id
     * Actualiza una verificación
     */
    static async update(req, res) {
        try {
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const verification = await AuditVerificationService.update(
                req.params.id,
                req.body,
                userId
            );
            Response.Ok(res, verification);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audit-verifications/:id/findings/:findingId
     * Actualiza el estado de verificación de un finding
     */
    static async updateFinding(req, res) {
        try {
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const verification = await AuditVerificationService.updateFinding(
                req.params.id,
                req.params.findingId,
                req.body,
                userId
            );
            Response.Ok(res, verification);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/audit-verifications/:id/findings
     * Agrega un finding a la verificación
     */
    static async addFinding(req, res) {
        try {
            if (!req.body.findingId || !req.body.title) {
                return Response.BadParameters(res, 'Finding ID and title are required');
            }
            
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const verification = await AuditVerificationService.addFinding(
                req.params.id,
                req.body,
                userId
            );
            Response.Ok(res, verification);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/audit-verifications/:id/findings/:findingId
     * Elimina un finding de la verificación
     */
    static async removeFinding(req, res) {
        try {
            const verification = await AuditVerificationService.removeFinding(
                req.params.id,
                req.params.findingId
            );
            Response.Ok(res, verification);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/audit-verifications/:id/finalize
     * Finaliza una verificación
     */
    static async finalize(req, res) {
        try {
            if (!req.body.result) {
                return Response.BadParameters(res, 'Result is required');
            }
            
            const userId = req.decodedToken ? req.decodedToken.id : null;
            const verification = await AuditVerificationService.finalize(
                req.params.id,
                req.body.result,
                userId,
                req.body.notes
            );
            Response.Ok(res, verification);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/audit-verifications/:id
     * Elimina una verificación
     */
    static async delete(req, res) {
        try {
            await AuditVerificationService.delete(req.params.id);
            Response.Ok(res, 'Verification deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = AuditVerificationController;