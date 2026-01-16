const collaborationService = require('../services/collaboration.service');
const ReportInstance = require('../models/report-instance.model');

/**
 * Report Collaboration Socket Handler
 * 
 * Maneja los eventos de Socket.io para la edición colaborativa
 * de reportes usando Y.js para sincronización.
 * 
 * Eventos:
 * - report:join - Unirse a una sesión de edición
 * - report:leave - Salir de una sesión
 * - report:sync - Sincronización inicial
 * - report:update - Actualización de contenido
 * - report:cursor - Posición del cursor
 * - report:awareness - Estado de awareness (usuarios activos)
 */

/**
 * Configura los handlers de colaboración de reportes
 * @param {SocketIO.Server} io
 */
const setupReportCollaborationHandlers = (io) => {
    // Namespace específico para reportes
    const reportNamespace = io.of('/reports');

    reportNamespace.on('connection', (socket) => {
        console.log(`Report socket connected: ${socket.username} (${socket.id})`);

        // Almacenar el reportInstanceId actual del usuario
        let currentReportId = null;

        /**
         * Unirse a una sesión de edición de reporte
         */
        socket.on('report:join', async (data) => {
            try {
                const { reportInstanceId } = data;

                if (!reportInstanceId) {
                    socket.emit('report:error', { message: 'reportInstanceId is required' });
                    return;
                }

                // Verificar que el reporte existe
                const reportInstance = await ReportInstance.findById(reportInstanceId)
                    .populate('auditId', 'name collaborators reviewers creator');

                if (!reportInstance) {
                    socket.emit('report:error', { message: 'Report not found' });
                    return;
                }

                // Verificar permisos (debe ser colaborador, revisor o creador de la auditoría)
                const audit = reportInstance.auditId;
                const userId = socket.userId;
                const hasAccess = 
                    audit.creator?.toString() === userId ||
                    audit.collaborators?.some(c => c.toString() === userId) ||
                    audit.reviewers?.some(r => r.toString() === userId) ||
                    socket.role === 'admin';

                if (!hasAccess) {
                    socket.emit('report:error', { message: 'Access denied' });
                    return;
                }

                // Salir de la sala anterior si existe
                if (currentReportId) {
                    socket.leave(`report:${currentReportId}`);
                    collaborationService.removeCollaborator(currentReportId, socket.userId);
                    
                    // Notificar a otros que salió
                    socket.to(`report:${currentReportId}`).emit('report:user-left', {
                        userId: socket.userId,
                        username: socket.username
                    });
                }

                // Unirse a la nueva sala
                currentReportId = reportInstanceId;
                socket.join(`report:${reportInstanceId}`);

                // Registrar colaborador
                const collaborators = collaborationService.addCollaborator(
                    reportInstanceId,
                    socket.userId,
                    { username: socket.username }
                );

                // Actualizar en la base de datos
                await reportInstance.addCollaborator(socket.userId, socket.username);
                await reportInstance.save();

                // Obtener o crear el documento Y.js
                const ydoc = await collaborationService.getOrCreateDocument(reportInstanceId);
                const state = collaborationService.getDocumentState(reportInstanceId);

                // Enviar estado inicial al nuevo colaborador
                socket.emit('report:sync', {
                    reportInstanceId,
                    state: state ? Array.from(state) : null,
                    collaborators
                });

                // Notificar a otros que alguien se unió
                socket.to(`report:${reportInstanceId}`).emit('report:user-joined', {
                    userId: socket.userId,
                    username: socket.username,
                    collaborators
                });

                console.log(`${socket.username} joined report ${reportInstanceId}`);
            } catch (err) {
                console.error('[ReportSocket] Error joining report:', err);
                socket.emit('report:error', { message: 'Failed to join report' });
            }
        });

        /**
         * Salir de una sesión de edición
         */
        socket.on('report:leave', async () => {
            if (currentReportId) {
                try {
                    socket.leave(`report:${currentReportId}`);
                    
                    const collaborators = collaborationService.removeCollaborator(
                        currentReportId, 
                        socket.userId
                    );

                    // Actualizar en la base de datos
                    const reportInstance = await ReportInstance.findById(currentReportId);
                    if (reportInstance) {
                        reportInstance.removeCollaborator(socket.userId);
                        await reportInstance.save();
                    }

                    // Notificar a otros
                    socket.to(`report:${currentReportId}`).emit('report:user-left', {
                        userId: socket.userId,
                        username: socket.username,
                        collaborators
                    });

                    console.log(`${socket.username} left report ${currentReportId}`);
                    currentReportId = null;
                } catch (err) {
                    console.error('[ReportSocket] Error leaving report:', err);
                }
            }
        });

        /**
         * Recibir actualización de Y.js
         */
        socket.on('report:update', (data) => {
            if (!currentReportId || currentReportId !== data.reportInstanceId) {
                return;
            }

            try {
                const { update } = data;
                
                // Convertir array a Uint8Array
                const updateArray = new Uint8Array(update);
                
                // Aplicar actualización al documento
                collaborationService.applyRemoteUpdate(currentReportId, updateArray);

                // Broadcast a otros clientes (excepto el emisor)
                socket.to(`report:${currentReportId}`).emit('report:update', {
                    reportInstanceId: currentReportId,
                    update: update,
                    origin: socket.userId
                });
            } catch (err) {
                console.error('[ReportSocket] Error applying update:', err);
            }
        });

        /**
         * Actualización de cursor
         */
        socket.on('report:cursor', (data) => {
            if (!currentReportId) return;

            try {
                const collaborators = collaborationService.updateCursor(
                    currentReportId,
                    socket.userId,
                    {
                        cursor: data.cursor,
                        selection: data.selection
                    }
                );

                // Broadcast a otros
                socket.to(`report:${currentReportId}`).emit('report:cursor', {
                    userId: socket.userId,
                    username: socket.username,
                    cursor: data.cursor,
                    selection: data.selection,
                    color: collaborators.find(c => c.userId === socket.userId)?.color
                });
            } catch (err) {
                console.error('[ReportSocket] Error updating cursor:', err);
            }
        });

        /**
         * Solicitar lista de colaboradores activos
         */
        socket.on('report:get-collaborators', () => {
            if (!currentReportId) return;

            const collaborators = collaborationService.getCollaborators(currentReportId);
            socket.emit('report:collaborators', { collaborators });
        });

        /**
         * Guardar manualmente
         */
        socket.on('report:save', async () => {
            if (!currentReportId) return;

            try {
                await collaborationService.saveDocument(currentReportId);
                socket.emit('report:saved', { 
                    success: true, 
                    timestamp: new Date().toISOString() 
                });
            } catch (err) {
                console.error('[ReportSocket] Error saving:', err);
                socket.emit('report:saved', { 
                    success: false, 
                    error: 'Failed to save' 
                });
            }
        });

        /**
         * Solicitar resincronización completa
         */
        socket.on('report:resync', async () => {
            if (!currentReportId) return;

            try {
                const state = collaborationService.getDocumentState(currentReportId);
                const collaborators = collaborationService.getCollaborators(currentReportId);

                socket.emit('report:sync', {
                    reportInstanceId: currentReportId,
                    state: state ? Array.from(state) : null,
                    collaborators
                });
            } catch (err) {
                console.error('[ReportSocket] Error resyncing:', err);
                socket.emit('report:error', { message: 'Failed to resync' });
            }
        });

        /**
         * Comentario en el documento
         */
        socket.on('report:comment', async (data) => {
            if (!currentReportId) return;

            try {
                const { text, position } = data;

                const reportInstance = await ReportInstance.findById(currentReportId);
                if (reportInstance) {
                    reportInstance.notes.push({
                        text,
                        createdBy: socket.userId,
                        position // Posición en el documento donde se agregó
                    });
                    await reportInstance.save();

                    // Broadcast a todos
                    reportNamespace.to(`report:${currentReportId}`).emit('report:new-comment', {
                        text,
                        position,
                        createdBy: {
                            userId: socket.userId,
                            username: socket.username
                        },
                        createdAt: new Date().toISOString()
                    });
                }
            } catch (err) {
                console.error('[ReportSocket] Error adding comment:', err);
            }
        });

        /**
         * Desconexión
         */
        socket.on('disconnect', async () => {
            console.log(`Report socket disconnected: ${socket.username} (${socket.id})`);

            if (currentReportId) {
                try {
                    const collaborators = collaborationService.removeCollaborator(
                        currentReportId,
                        socket.userId
                    );

                    // Actualizar en la base de datos
                    const reportInstance = await ReportInstance.findById(currentReportId);
                    if (reportInstance) {
                        reportInstance.removeCollaborator(socket.userId);
                        await reportInstance.save();
                    }

                    // Notificar a otros
                    socket.to(`report:${currentReportId}`).emit('report:user-left', {
                        userId: socket.userId,
                        username: socket.username,
                        collaborators
                    });
                } catch (err) {
                    console.error('[ReportSocket] Error on disconnect:', err);
                }
            }
        });
    });

    console.log('Report collaboration handlers configured');
};

/**
 * Obtiene los usuarios conectados a un reporte
 * @param {SocketIO.Server} io
 * @param {string} reportInstanceId
 * @returns {Array}
 */
const getReportConnectedUsers = (io, reportInstanceId) => {
    return collaborationService.getCollaborators(reportInstanceId);
};

module.exports = {
    setupReportCollaborationHandlers,
    getReportConnectedUsers
};
