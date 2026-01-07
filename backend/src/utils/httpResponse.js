/**
 * Utilidad de Respuestas HTTP
 * 
 * Proporciona métodos estandarizados para respuestas HTTP
 * Asegura consistencia en el formato de respuestas de la API
 */

class Response {
    /**
     * Respuesta exitosa (200 OK)
     * @param {Object} res - Express response
     * @param {*} data - Datos a enviar
     */
    static Ok(res, data) {
        res.status(200).json({ status: 'success', data });
    }

    /**
     * Recurso creado exitosamente (201 Created)
     * @param {Object} res - Express response
     * @param {*} data - Datos del recurso creado
     */
    static Created(res, data) {
        res.status(201).json({ status: 'success', data });
    }

    /**
     * Parámetros inválidos (400 Bad Request)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje de error
     */
    static BadParameters(res, message) {
        res.status(400).json({ status: 'error', data: message });
    }

    /**
     * No autorizado (401 Unauthorized)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje de error
     */
    static Unauthorized(res, message) {
        res.status(401).json({ status: 'error', data: message });
    }

    /**
     * Acceso prohibido (403 Forbidden)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje de error
     */
    static Forbidden(res, message) {
        res.status(403).json({ status: 'error', data: message });
    }

    /**
     * Recurso no encontrado (404 Not Found)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje de error
     */
    static NotFound(res, message) {
        res.status(404).json({ status: 'error', data: message });
    }

    /**
     * Conflicto (409 Conflict)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje de error
     */
    static Conflict(res, message) {
        res.status(409).json({ status: 'error', data: message });
    }

    /**
     * Error interno del servidor (500 Internal Server Error)
     * Maneja diferentes tipos de errores automáticamente
     * 
     * @param {Object} res - Express response
     * @param {Object|string} err - Error o mensaje
     */
    static Internal(res, err) {
        // Si el error tiene una función asociada, usar el método correspondiente
        if (err && err.fn && typeof Response[err.fn] === 'function') {
            return Response[err.fn](res, err.message);
        }

        // Log del error para debugging
        console.error('Internal Error:', err);

        // Respuesta genérica
        const message = (err && err.message) ? err.message : 'Internal server error';
        res.status(500).json({ status: 'error', data: message });
    }

    /**
     * Envía archivo como descarga
     * @param {Object} res - Express response
     * @param {Buffer|string} data - Contenido del archivo
     * @param {string} filename - Nombre del archivo
     * @param {string} contentType - Tipo MIME
     */
    static SendFile(res, data, filename, contentType) {
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);
    }
}

module.exports = Response;
