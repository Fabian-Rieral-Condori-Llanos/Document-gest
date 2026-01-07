const SettingsService = require('../services/settings.service');
const Response = require('../utils/httpResponse');

/**
 * Settings Controller
 * 
 * Maneja las peticiones HTTP relacionadas con la configuración.
 */
class SettingsController {
    /**
     * GET /api/settings
     * Obtiene toda la configuración (admin)
     */
    static async getAll(req, res) {
        try {
            const settings = await SettingsService.getAll();
            Response.Ok(res, settings);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/settings/public
     * Obtiene la configuración pública
     */
    static async getPublic(req, res) {
        try {
            const settings = await SettingsService.getPublic();
            Response.Ok(res, settings);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/settings
     * Actualiza la configuración
     */
    static async update(req, res) {
        try {
            const settings = await SettingsService.update(req.body);
            Response.Ok(res, settings);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/settings/revert
     * Restaura la configuración a valores por defecto
     */
    static async restoreDefaults(req, res) {
        try {
            const result = await SettingsService.restoreDefaults();
            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = SettingsController;