const ReportInstanceService = require('../services/report-instance.service');
const Response = require('../utils/httpResponse');

/**
 * ReportInstanceController
 * 
 * Controlador para gestión de instancias de reportes.
 */
class ReportInstanceController {

    /**
     * GET /api/report-instances/audit/:auditId
     * Obtiene la instancia de reporte de una auditoría
     */
    static async getByAuditId(req, res) {
        try {
            const { auditId } = req.params;
            const instance = await ReportInstanceService.getByAuditId(auditId);

            if (!instance) {
                return Response.NotFound(res, 'No report instance found for this audit');
            }

            // Agregar colaboradores activos
            const collaborators = ReportInstanceService.getActiveCollaborators(instance._id.toString());

            return Response.Ok(res, { ...instance.toJSON(), activeCollaborators: collaborators });
        } catch (err) {
            console.error('[ReportInstance] Error getting by audit:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/report-instances/:id
     * Obtiene una instancia por ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const instance = await ReportInstanceService.getById(id);

            // Agregar colaboradores activos
            const collaborators = ReportInstanceService.getActiveCollaborators(id);

            return Response.Ok(res, { ...instance.toJSON(), activeCollaborators: collaborators });
        } catch (err) {
            console.error('[ReportInstance] Error getting by id:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/report-instances
     * Crea una nueva instancia de reporte
     */
    static async create(req, res) {
        try {
            const userId = req.decodedToken.id;
            const { auditId, templateId } = req.body;

            if (!auditId || !templateId) {
                return Response.BadParameters(res, 'auditId and templateId are required');
            }

            const instance = await ReportInstanceService.create(auditId, templateId, userId);

            return Response.Created(res, instance);
        } catch (err) {
            console.error('[ReportInstance] Error creating:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/report-instances/:id/refresh
     * Refresca los datos inyectados desde la auditoría
     */
    static async refreshData(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;

            const instance = await ReportInstanceService.refreshInjectedData(id, userId);

            return Response.Ok(res, instance);
        } catch (err) {
            console.error('[ReportInstance] Error refreshing data:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * PATCH /api/report-instances/:id/content
     * Actualiza el contenido del reporte
     */
    static async updateContent(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            const { content } = req.body;

            if (!content) {
                return Response.BadParameters(res, 'content is required');
            }

            const result = await ReportInstanceService.updateContent(id, content, userId);

            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ReportInstance] Error updating content:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/report-instances/:id/version
     * Guarda una versión del reporte
     */
    static async saveVersion(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            const { comment } = req.body;

            const result = await ReportInstanceService.saveVersion(id, userId, comment);

            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ReportInstance] Error saving version:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/report-instances/:id/versions
     * Obtiene el historial de versiones
     */
    static async getVersionHistory(req, res) {
        try {
            const { id } = req.params;

            const history = await ReportInstanceService.getVersionHistory(id);

            return Response.Ok(res, history);
        } catch (err) {
            console.error('[ReportInstance] Error getting version history:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/report-instances/:id/restore/:versionNumber
     * Restaura una versión anterior
     */
    static async restoreVersion(req, res) {
        try {
            const { id, versionNumber } = req.params;
            const userId = req.decodedToken.id;

            const result = await ReportInstanceService.restoreVersion(
                id, 
                parseInt(versionNumber), 
                userId
            );

            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ReportInstance] Error restoring version:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * PATCH /api/report-instances/:id/status
     * Actualiza el estado del reporte
     */
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            const { status } = req.body;

            if (!status) {
                return Response.BadParameters(res, 'status is required');
            }

            const instance = await ReportInstanceService.updateStatus(id, status, userId);

            return Response.Ok(res, instance);
        } catch (err) {
            console.error('[ReportInstance] Error updating status:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/report-instances/:id/lock
     * Bloquea el reporte para edición exclusiva
     */
    static async lock(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;

            const result = await ReportInstanceService.lock(id, userId);

            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ReportInstance] Error locking:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/report-instances/:id/unlock
     * Desbloquea el reporte
     */
    static async unlock(req, res) {
        try {
            const { id } = req.params;
            const userId = req.decodedToken.id;
            const isAdmin = req.decodedToken.role === 'admin';

            const result = await ReportInstanceService.unlock(id, userId, isAdmin);

            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ReportInstance] Error unlocking:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/report-instances/:id/collaborators
     * Obtiene colaboradores activos
     */
    static async getCollaborators(req, res) {
        try {
            const { id } = req.params;

            const collaborators = ReportInstanceService.getActiveCollaborators(id);

            return Response.Ok(res, collaborators);
        } catch (err) {
            console.error('[ReportInstance] Error getting collaborators:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/report-instances/:id
     * Elimina la instancia de reporte
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;

            const result = await ReportInstanceService.delete(id);

            return Response.Ok(res, result);
        } catch (err) {
            console.error('[ReportInstance] Error deleting:', err);
            return Response.Internal(res, err);
        }
    }
}

module.exports = ReportInstanceController;
