const AuditService = require('../services/audit.service');
const AuditFindingService = require('../services/audit-finding.service');
const AuditSectionService = require('../services/audit-section.service');
const Response = require('../utils/httpResponse');
const { acl } = require('../middlewares/acl.middleware');

/**
 * Audit Controller
 * 
 * Maneja las peticiones HTTP relacionadas con auditorías.
 */
class AuditController {
    // Almacena la instancia de Socket.io
    static io = null;

    /**
     * Configura la instancia de Socket.io
     */
    static setIo(io) {
        this.io = io;
    }

    /**
     * Emite un evento de actualización de auditoría
     */
    static emitUpdate(auditId, data) {
        if (this.io) {
            this.io.to(auditId).emit('updateAudit', data);
        }
    }

    /**
     * Verifica si el usuario es admin
     */
    static isAdmin(req) {
        return acl.isAllowed(req.decodedToken.role, 'audits:read-all');
    }

    // ============================================
    // CRUD BÁSICO
    // ============================================

    /**
     * GET /api/audits
     * Obtiene todas las auditorías
     */
    static async getAll(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;
            const filters = {};

            // Filtros opcionales
            if (req.query.type) filters.type = req.query.type;
            if (req.query.state) filters.state = req.query.state;

            const audits = await AuditService.getAll(isAdmin, userId, filters);
            Response.Ok(res, audits);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audits/:id
     * Obtiene una auditoría por ID
     */
    static async getById(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const audit = await AuditService.getById(isAdmin, req.params.id, userId);
            
            // Obtener usuarios conectados
            const connectedUsers = AuditService.getConnectedUsers(AuditController.io, req.params.id);

            Response.Ok(res, { audit, connectedUsers });
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/audits
     * Crea una nueva auditoría
     */
    static async create(req, res) {
        try {
            const { name, language, auditType, template, type } = req.body;

            if (!name || !language) {
                return Response.BadParameters(res, 'Name and language are required');
            }

            const audit = await AuditService.create(
                { name, language, auditType, template, type },
                req.decodedToken.id
            );

            Response.Created(res, audit);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/audits/:id
     * Elimina una auditoría
     */
    static async delete(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditService.delete(isAdmin, req.params.id, userId);
            Response.Ok(res, 'Audit deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // GENERAL
    // ============================================

    /**
     * GET /api/audits/:id/general
     * Obtiene información general de una auditoría
     */
    static async getGeneral(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const audit = await AuditService.getGeneral(isAdmin, req.params.id, userId);
            Response.Ok(res, audit);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audits/:id/general
     * Actualiza información general de una auditoría
     */
    static async updateGeneral(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditService.updateGeneral(isAdmin, req.params.id, userId, req.body);

            AuditController.emitUpdate(req.params.id, { type: 'general' });
            Response.Ok(res, 'Audit general updated successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // NETWORK
    // ============================================

    /**
     * GET /api/audits/:id/network
     * Obtiene información de red
     */
    static async getNetwork(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const audit = await AuditService.getNetwork(isAdmin, req.params.id, userId);
            Response.Ok(res, audit);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audits/:id/network
     * Actualiza información de red
     */
    static async updateNetwork(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditService.updateNetwork(isAdmin, req.params.id, userId, req.body.scope);

            AuditController.emitUpdate(req.params.id, { type: 'network' });
            Response.Ok(res, 'Audit network updated successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // FINDINGS
    // ============================================

    /**
     * GET /api/audits/:id/findings
     * Obtiene todos los findings
     */
    static async getFindings(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const result = await AuditFindingService.getAll(isAdmin, req.params.id, userId);
            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/audits/:id/findings
     * Crea un nuevo finding
     */
    static async createFinding(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const result = await AuditFindingService.create(isAdmin, req.params.id, userId, req.body);

            AuditController.emitUpdate(req.params.id, { type: 'findings' });
            Response.Created(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audits/:id/findings/:findingId
     * Obtiene un finding específico
     */
    static async getFinding(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const finding = await AuditFindingService.getById(
                isAdmin, req.params.id, userId, req.params.findingId
            );
            Response.Ok(res, finding);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audits/:id/findings/:findingId
     * Actualiza un finding
     */
    static async updateFinding(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditFindingService.update(
                isAdmin, req.params.id, userId, req.params.findingId, req.body
            );

            AuditController.emitUpdate(req.params.id, { type: 'findings', findingId: req.params.findingId });
            Response.Ok(res, 'Finding updated successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/audits/:id/findings/:findingId
     * Elimina un finding
     */
    static async deleteFinding(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditFindingService.delete(
                isAdmin, req.params.id, userId, req.params.findingId
            );

            AuditController.emitUpdate(req.params.id, { type: 'findings' });
            Response.Ok(res, 'Finding deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // SECTIONS
    // ============================================

    /**
     * GET /api/audits/:id/sections
     * Obtiene todas las secciones
     */
    static async getSections(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const sections = await AuditSectionService.getAll(isAdmin, req.params.id, userId);
            Response.Ok(res, sections);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/audits/:id/sections
     * Crea una nueva sección
     */
    static async createSection(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditSectionService.create(isAdmin, req.params.id, userId, req.body);

            AuditController.emitUpdate(req.params.id, { type: 'sections' });
            Response.Created(res, 'Section created successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audits/:id/sections/:sectionId
     * Actualiza una sección
     */
    static async updateSection(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditSectionService.update(
                isAdmin, req.params.id, userId, req.params.sectionId, req.body
            );

            AuditController.emitUpdate(req.params.id, { type: 'sections', sectionId: req.params.sectionId });
            Response.Ok(res, 'Section updated successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/audits/:id/sections/:sectionId
     * Elimina una sección
     */
    static async deleteSection(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditSectionService.delete(
                isAdmin, req.params.id, userId, req.params.sectionId
            );

            AuditController.emitUpdate(req.params.id, { type: 'sections' });
            Response.Ok(res, 'Section deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // REVIEW & APPROVAL
    // ============================================

    /**
     * PUT /api/audits/:id/state
     * Actualiza el estado de la auditoría
     */
    static async updateState(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditService.updateState(isAdmin, req.params.id, userId, req.body.state);

            AuditController.emitUpdate(req.params.id, { type: 'state' });
            Response.Ok(res, 'Audit state updated successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audits/:id/ready-for-review
     * Marca la auditoría como lista para revisión
     */
    static async updateReadyForReview(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditService.updateReadyForReview(
                isAdmin, req.params.id, userId, req.body.reviewers
            );

            AuditController.emitUpdate(req.params.id, { type: 'state' });
            Response.Ok(res, 'Audit is now ready for review');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/audits/:id/approvals
     * Agrega una aprobación
     */
    static async addApproval(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const result = await AuditService.updateApprovals(
                isAdmin, req.params.id, userId, 'add'
            );

            AuditController.emitUpdate(req.params.id, { type: 'approvals' });
            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/audits/:id/approvals
     * Quita una aprobación
     */
    static async removeApproval(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const result = await AuditService.updateApprovals(
                isAdmin, req.params.id, userId, 'remove'
            );

            AuditController.emitUpdate(req.params.id, { type: 'approvals' });
            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // COMMENTS
    // ============================================

    /**
     * POST /api/audits/:id/comments
     * Crea un comentario
     */
    static async createComment(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const commentData = {
                ...req.body,
                author: userId
            };

            const result = await AuditService.createComment(
                isAdmin, req.params.id, userId, commentData
            );

            AuditController.emitUpdate(req.params.id, { type: 'comments' });
            Response.Created(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audits/:id/comments/:commentId
     * Actualiza un comentario
     */
    static async updateComment(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditService.updateComment(
                isAdmin, req.params.id, userId, req.params.commentId, req.body
            );

            AuditController.emitUpdate(req.params.id, { type: 'comments' });
            Response.Ok(res, 'Comment updated successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/audits/:id/comments/:commentId
     * Elimina un comentario
     */
    static async deleteComment(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditService.deleteComment(
                isAdmin, req.params.id, userId, req.params.commentId
            );

            AuditController.emitUpdate(req.params.id, { type: 'comments' });
            Response.Ok(res, 'Comment deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // CHILDREN & RETEST
    // ============================================

    /**
     * GET /api/audits/:id/children
     * Obtiene auditorías hijas
     */
    static async getChildren(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const children = await AuditService.getChildren(isAdmin, req.params.id, userId);
            Response.Ok(res, children);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/audits/:id/retest
     * Obtiene el retest de una auditoría
     */
    static async getRetest(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const retest = await AuditService.getRetest(isAdmin, req.params.id, userId);
            Response.Ok(res, retest);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/audits/:id/retest
     * Crea un retest de una auditoría
     */
    static async createRetest(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            const retest = await AuditService.createRetest(
                isAdmin, req.params.id, userId, req.body.auditType
            );

            Response.Created(res, retest);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // SORTING
    // ============================================

    /**
     * PUT /api/audits/:id/sortfindings
     * Actualiza opciones de ordenamiento
     */
    static async updateSortFindings(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditService.updateSortFindings(
                isAdmin, req.params.id, userId, req.body.sortFindings
            );

            AuditController.emitUpdate(req.params.id, { type: 'findings' });
            Response.Ok(res, 'Sort options updated successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/audits/:id/findings/:findingId/move
     * Mueve un finding a una nueva posición
     */
    static async moveFinding(req, res) {
        try {
            const isAdmin = AuditController.isAdmin(req);
            const userId = req.decodedToken.id;

            await AuditService.moveFinding(
                isAdmin, req.params.id, userId, req.params.findingId, req.body.newIndex
            );

            AuditController.emitUpdate(req.params.id, { type: 'findings' });
            Response.Ok(res, 'Finding moved successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = AuditController;