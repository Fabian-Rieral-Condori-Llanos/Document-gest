const crypto = require('crypto');

/**
 * Funciones Helper Generales
 * 
 * Utilidades comunes usadas en toda la aplicación
 */

/**
 * Valida que un nombre de archivo contenga solo caracteres permitidos
 * @param {string} filename - Nombre a validar
 * @returns {boolean}
 */
const validFilename = (filename) => {
    const regex = /^[\p{Letter}\p{Mark}0-9 \[\]'()_,-]+$/iu;
    return regex.test(filename);
};

/**
 * Verifica que una ruta no contenga path traversal
 * @param {string} filePath - Ruta a verificar
 * @returns {boolean}
 */
const isSafePath = (filePath) => {
    return !filePath.includes('..');
};

/**
 * Escapa entidades XML especiales
 * @param {string} input - String a escapar
 * @returns {string}
 */
const escapeXMLEntities = (input) => {
    const XML_CHAR_MAP = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };
    return input.replace(/[<>&]/g, (ch) => XML_CHAR_MAP[ch]);
};

/**
 * Formatea número con padding de ceros (3 dígitos mínimo)
 * @param {number} number - Número a formatear
 * @returns {string}
 */
const lPad = (number) => {
    if (number <= 99) {
        number = ("00" + number).slice(-3);
    }
    return `${number}`;
};

/**
 * Escapa caracteres especiales de regex
 * @param {string} str - String a escapar
 * @returns {string}
 */
const escapeRegex = (str) => {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * Genera un UUID aleatorio
 * @returns {string}
 */
const generateUUID = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Obtiene todas las rutas de un objeto de forma recursiva
 * @param {Object} obj - Objeto a recorrer
 * @param {string} prefix - Prefijo de ruta
 * @returns {Array<string>}
 */
const getObjectPaths = (obj, prefix = '') => {
    return Object.keys(obj).reduce((res, el) => {
        if (Array.isArray(obj[el])) {
            return [...res, prefix + el];
        } else if (typeof obj[el] === 'object' && obj[el] !== null) {
            return [...res, ...getObjectPaths(obj[el], prefix + el + '.')];
        }
        return [...res, prefix + el];
    }, []);
};

/**
 * Obtiene todos los sockets conectados a una sala
 * @param {Object} io - Instancia de Socket.io
 * @param {string} room - Nombre de la sala
 * @returns {Array}
 */
const getSockets = (io, room) => {
    const result = [];
    if (io && io.sockets && io.sockets.sockets) {
        io.sockets.sockets.forEach((socket) => {
            if (socket.rooms.has(room)) {
                result.push(socket);
            }
        });
    }
    return result;
};

/**
 * Deep clone de un objeto
 * @param {Object} obj - Objeto a clonar
 * @returns {Object}
 */
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Verifica si un valor es un ObjectId válido de MongoDB
 * @param {string} id - ID a verificar
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string}
 */
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Elimina propiedades undefined de un objeto
 * @param {Object} obj - Objeto a limpiar
 * @returns {Object}
 */
const removeUndefined = (obj) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
    );
};

/**
 * Espera un número de milisegundos
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise}
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
    validFilename,
    isSafePath,
    escapeXMLEntities,
    lPad,
    escapeRegex,
    generateUUID,
    getObjectPaths,
    getSockets,
    deepClone,
    isValidObjectId,
    capitalize,
    removeUndefined,
    sleep
};
