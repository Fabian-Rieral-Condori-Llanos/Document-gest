const fs = require('fs');
const BackupService = require('../services/backup.service');
const Response = require('../utils/httpResponse');

/**
 * Backup Controller
 * 
 * Maneja las peticiones HTTP relacionadas con backup y restore.
 */
class BackupController {
    /**
     * GET /api/backups
     * Obtiene la lista de backups disponibles
     */
    static async getList(req, res) {
        try {
            const backups = await BackupService.getList();
            Response.Ok(res, backups);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/backups/status
     * Obtiene el estado actual del proceso de backup/restore
     */
    static async getStatus(req, res) {
        try {
            const status = BackupService.getOperationStatus();
            Response.Ok(res, status);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/backups/:slug
     * Obtiene información de un backup específico
     */
    static async getInfo(req, res) {
        try {
            const filename = await BackupService.getFilenameBySlug(req.params.slug);
            const info = await BackupService.readBackupInfo(filename);
            Response.Ok(res, info);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/backups/:slug/download
     * Descarga un archivo de backup
     */
    static async download(req, res) {
        try {
            const filename = await BackupService.getFilenameBySlug(req.params.slug);
            const filePath = BackupService.getFilePath(filename);

            if (!fs.existsSync(filePath)) {
                return Response.NotFound(res, 'Backup file not found');
            }

            res.download(filePath, filename);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/backups
     * Crea un nuevo backup
     */
    static async create(req, res) {
        try {
            // Verificar que no hay otro proceso en curso
            const status = BackupService.getOperationStatus();
            if (status.operation !== 'idle') {
                return Response.BadParameters(res, `Another ${status.operation} operation is in progress`);
            }

            const { name, password, backupData } = req.body;

            // Iniciar backup en background
            BackupService.create({ name, password, backupData })
                .then(result => {
                    console.log('Backup created:', result.slug);
                })
                .catch(err => {
                    console.error('Backup failed:', err);
                });

            Response.Ok(res, 'Backup request submitted');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/backups/upload
     * Sube un archivo de backup
     */
    static async upload(req, res) {
        try {
            if (!req.file) {
                return Response.BadParameters(res, 'Backup file is required');
            }

            // Verificar que es un archivo .tar válido
            if (!req.file.originalname.endsWith('.tar')) {
                return Response.BadParameters(res, 'File must be a .tar archive');
            }

            // Guardar archivo
            const filename = req.file.originalname;
            const filePath = BackupService.getFilePath(filename);

            fs.writeFileSync(filePath, req.file.buffer);

            // Verificar que es un backup válido
            try {
                await BackupService.readBackupInfo(filename);
            } catch (error) {
                // Si no es válido, eliminar el archivo
                fs.unlinkSync(filePath);
                return Response.BadParameters(res, 'Invalid backup file');
            }

            Response.Created(res, 'Backup uploaded successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/backups/:slug/restore
     * Restaura un backup
     */
    static async restore(req, res) {
        try {
            // Verificar que no hay otro proceso en curso
            const status = BackupService.getOperationStatus();
            if (status.operation !== 'idle') {
                return Response.BadParameters(res, `Another ${status.operation} operation is in progress`);
            }

            const { password, restoreData, mode } = req.body;

            // Iniciar restore en background
            BackupService.restore(req.params.slug, { password, restoreData, mode })
                .then(() => {
                    console.log('Restore completed');
                })
                .catch(err => {
                    console.error('Restore failed:', err);
                });

            Response.Ok(res, 'Restore request submitted');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/backups/:slug
     * Elimina un backup
     */
    static async delete(req, res) {
        try {
            await BackupService.delete(req.params.slug);
            Response.Ok(res, 'Backup deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/backups/disk-usage
     * Obtiene información de uso de disco
     */
    static async getDiskUsage(req, res) {
        try {
            const diskusage = require('diskusage');
            const usage = diskusage.checkSync(BackupService.BACKUP_PATH);

            Response.Ok(res, {
                available: usage.available,
                free: usage.free,
                total: usage.total
            });
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = BackupController;