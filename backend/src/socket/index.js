const jwt = require('jsonwebtoken');

/**
 * Socket.io Handlers
 * 
 * Maneja la autenticación y eventos de Socket.io.
 */

/**
 * Configura la autenticación de Socket.io
 * @param {SocketIO.Server} io
 * @param {Object} authConfig
 */
const setupSocketAuth = (io, authConfig) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || 
                        socket.handshake.headers.authorization;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        // Remover prefijo 'JWT ' si existe
        const tokenValue = token.replace('JWT ', '');

        try {
            const decoded = jwt.verify(tokenValue, authConfig.jwtSecret);
            socket.userId = decoded.id;
            socket.username = decoded.username;
            socket.role = decoded.role;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });
};

/**
 * Configura los handlers de eventos de Socket.io
 * @param {SocketIO.Server} io
 */
const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.username} (${socket.id})`);

        // Unirse a una sala de auditoría
        socket.on('join', (auditId) => {
            if (auditId) {
                socket.join(auditId);
                console.log(` ${socket.username} joined audit: ${auditId}`);

                // Notificar a otros usuarios
                socket.to(auditId).emit('userJoined', {
                    username: socket.username,
                    userId: socket.userId
                });

                // Enviar lista de usuarios conectados
                const users = getConnectedUsers(io, auditId);
                io.to(auditId).emit('connectedUsers', users);
            }
        });

        // Salir de una sala de auditoría
        socket.on('leave', (auditId) => {
            if (auditId) {
                socket.leave(auditId);
                console.log(` ${socket.username} left audit: ${auditId}`);

                // Notificar a otros usuarios
                socket.to(auditId).emit('userLeft', {
                    username: socket.username,
                    userId: socket.userId
                });

                // Actualizar lista de usuarios conectados
                const users = getConnectedUsers(io, auditId);
                io.to(auditId).emit('connectedUsers', users);
            }
        });

        // Notificación de edición en progreso
        socket.on('editing', (data) => {
            if (data.auditId) {
                socket.to(data.auditId).emit('userEditing', {
                    username: socket.username,
                    userId: socket.userId,
                    section: data.section,
                    field: data.field
                });
            }
        });

        // Notificación de edición terminada
        socket.on('stopEditing', (data) => {
            if (data.auditId) {
                socket.to(data.auditId).emit('userStoppedEditing', {
                    username: socket.username,
                    userId: socket.userId,
                    section: data.section,
                    field: data.field
                });
            }
        });

        // Cursor position (para edición colaborativa)
        socket.on('cursor', (data) => {
            if (data.auditId) {
                socket.to(data.auditId).emit('userCursor', {
                    username: socket.username,
                    userId: socket.userId,
                    position: data.position
                });
            }
        });

        // Mensaje de chat
        socket.on('message', (data) => {
            if (data.auditId) {
                io.to(data.auditId).emit('newMessage', {
                    username: socket.username,
                    userId: socket.userId,
                    message: data.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Desconexión
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.username} (${socket.id})`);

            // Notificar a todas las salas donde estaba el usuario
            socket.rooms.forEach(room => {
                if (room !== socket.id) {
                    socket.to(room).emit('userLeft', {
                        username: socket.username,
                        userId: socket.userId
                    });

                    // Actualizar lista de usuarios conectados
                    const users = getConnectedUsers(io, room);
                    io.to(room).emit('connectedUsers', users);
                }
            });
        });

        // Error handling
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.username}:`, error);
        });
    });

    console.log(' Socket handlers configured');
};

/**
 * Obtiene los usuarios conectados a una sala
 * @param {SocketIO.Server} io
 * @param {string} room
 * @returns {Array}
 */
const getConnectedUsers = (io, room) => {
    const sockets = io.sockets.adapter.rooms.get(room);
    if (!sockets) return [];

    const users = [];
    sockets.forEach(socketId => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
            users.push({
                socketId: socket.id,
                userId: socket.userId,
                username: socket.username
            });
        }
    });

    return users;
};

/**
 * Emite un evento a una sala específica
 * @param {SocketIO.Server} io
 * @param {string} room
 * @param {string} event
 * @param {any} data
 */
const emitToRoom = (io, room, event, data) => {
    io.to(room).emit(event, data);
};

module.exports = {
    setupSocketAuth,
    setupSocketHandlers,
    getConnectedUsers,
    emitToRoom
};

// Re-export report collaboration handlers
const { setupReportCollaborationHandlers, getReportConnectedUsers } = require('./report-collaboration');
module.exports.setupReportCollaborationHandlers = setupReportCollaborationHandlers;
module.exports.getReportConnectedUsers = getReportConnectedUsers;