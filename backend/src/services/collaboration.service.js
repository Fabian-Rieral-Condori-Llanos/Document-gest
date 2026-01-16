const Y = require('yjs');
const { encodeStateAsUpdate, applyUpdate, encodeStateVector } = require('yjs');
const ReportInstance = require('../models/report-instance.model');

/**
 * CollaborationService
 * 
 * Servicio para manejar la colaboración en tiempo real usando Y.js (CRDT).
 * 
 * Y.js permite edición colaborativa sin conflictos mediante estructuras
 * de datos replicadas (CRDT - Conflict-free Replicated Data Types).
 * 
 * Flujo:
 * 1. Usuario se conecta → Se carga/crea el documento Y.js
 * 2. Usuario edita → Cambios se propagan via Socket.io
 * 3. Otros usuarios reciben → Aplican cambios automáticamente
 * 4. Periódicamente → Se persiste el estado en MongoDB
 */

class CollaborationService {
    constructor() {
        // Documentos Y.js activos en memoria (por reportInstanceId)
        this.documents = new Map();
        
        // Awareness (cursores, selecciones, usuarios activos)
        this.awareness = new Map();
        
        // Colores para colaboradores
        this.colors = [
            '#ef4444', '#f97316', '#eab308', '#22c55e', 
            '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
        ];
        
        // Intervalo de auto-guardado (ms)
        this.autoSaveInterval = 30000; // 30 segundos
        
        // Timers de auto-guardado
        this.saveTimers = new Map();
    }

    /**
     * Obtiene o crea un documento Y.js para un reporte
     * @param {string} reportInstanceId - ID del ReportInstance
     * @returns {Y.Doc}
     */
    async getOrCreateDocument(reportInstanceId) {
        // Si ya está en memoria, retornarlo
        if (this.documents.has(reportInstanceId)) {
            return this.documents.get(reportInstanceId);
        }

        // Cargar desde la base de datos
        const reportInstance = await ReportInstance.findById(reportInstanceId);
        if (!reportInstance) {
            throw new Error('Report instance not found');
        }

        // Crear nuevo documento Y.js
        const ydoc = new Y.Doc();

        // Si hay estado guardado, aplicarlo
        if (reportInstance.yDocState && reportInstance.yDocState.length > 0) {
            try {
                applyUpdate(ydoc, new Uint8Array(reportInstance.yDocState));
                console.log(`[Collab] Loaded Y.js state for report ${reportInstanceId}`);
            } catch (err) {
                console.error(`[Collab] Error loading Y.js state:`, err);
                // Si falla, inicializar con el contenido actual
                this._initializeFromContent(ydoc, reportInstance.content);
            }
        } else {
            // Inicializar con el contenido del reporte
            this._initializeFromContent(ydoc, reportInstance.content);
        }

        // Guardar en memoria
        this.documents.set(reportInstanceId, ydoc);

        // Configurar auto-guardado
        this._setupAutoSave(reportInstanceId);

        // Observar cambios para sincronización
        ydoc.on('update', (update, origin) => {
            if (origin !== 'remote') {
                // Emitir actualización a otros clientes
                this._broadcastUpdate(reportInstanceId, update);
            }
        });

        return ydoc;
    }

    /**
     * Inicializa el documento Y.js con el contenido del reporte
     * @private
     */
    _initializeFromContent(ydoc, content) {
        const yContent = ydoc.getMap('content');
        
        if (content && typeof content === 'object') {
            // Convertir el contenido TipTap a estructura Y.js
            this._setYValue(yContent, 'root', content);
        }
    }

    /**
     * Establece un valor en una estructura Y.js recursivamente
     * @private
     */
    _setYValue(ymap, key, value) {
        if (value === null || value === undefined) {
            ymap.set(key, null);
        } else if (Array.isArray(value)) {
            const yarray = new Y.Array();
            value.forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                    const nestedMap = new Y.Map();
                    Object.entries(item).forEach(([k, v]) => {
                        this._setYValue(nestedMap, k, v);
                    });
                    yarray.push([nestedMap]);
                } else {
                    yarray.push([item]);
                }
            });
            ymap.set(key, yarray);
        } else if (typeof value === 'object') {
            const nestedMap = new Y.Map();
            Object.entries(value).forEach(([k, v]) => {
                this._setYValue(nestedMap, k, v);
            });
            ymap.set(key, nestedMap);
        } else {
            ymap.set(key, value);
        }
    }

    /**
     * Configura el auto-guardado periódico
     * @private
     */
    _setupAutoSave(reportInstanceId) {
        // Limpiar timer existente si hay
        if (this.saveTimers.has(reportInstanceId)) {
            clearInterval(this.saveTimers.get(reportInstanceId));
        }

        // Crear nuevo timer
        const timer = setInterval(async () => {
            await this.saveDocument(reportInstanceId);
        }, this.autoSaveInterval);

        this.saveTimers.set(reportInstanceId, timer);
    }

    /**
     * Guarda el documento Y.js en la base de datos
     * @param {string} reportInstanceId
     */
    async saveDocument(reportInstanceId) {
        const ydoc = this.documents.get(reportInstanceId);
        if (!ydoc) return;

        try {
            // Obtener el estado binario del documento
            const state = encodeStateAsUpdate(ydoc);
            
            // Convertir contenido Y.js a JSON para el campo content
            const content = this._yToJson(ydoc.getMap('content').get('root'));

            // Actualizar en la base de datos
            await ReportInstance.findByIdAndUpdate(reportInstanceId, {
                yDocState: Buffer.from(state),
                content: content,
                updatedAt: new Date()
            });

            console.log(`[Collab] Saved document ${reportInstanceId}`);
        } catch (err) {
            console.error(`[Collab] Error saving document ${reportInstanceId}:`, err);
        }
    }

    /**
     * Convierte estructura Y.js a JSON
     * @private
     */
    _yToJson(yvalue) {
        if (yvalue instanceof Y.Map) {
            const result = {};
            yvalue.forEach((value, key) => {
                result[key] = this._yToJson(value);
            });
            return result;
        } else if (yvalue instanceof Y.Array) {
            return yvalue.toArray().map(item => this._yToJson(item));
        } else if (yvalue instanceof Y.Text) {
            return yvalue.toString();
        } else {
            return yvalue;
        }
    }

    /**
     * Broadcast de actualización a otros clientes
     * @private
     */
    _broadcastUpdate(reportInstanceId, update) {
        // Este método será llamado por el socket handler
        // Se implementa en el socket handler
    }

    /**
     * Aplica una actualización recibida de otro cliente
     * @param {string} reportInstanceId
     * @param {Uint8Array} update
     */
    applyRemoteUpdate(reportInstanceId, update) {
        const ydoc = this.documents.get(reportInstanceId);
        if (ydoc) {
            applyUpdate(ydoc, update, 'remote');
        }
    }

    /**
     * Obtiene el estado actual del documento para sincronización inicial
     * @param {string} reportInstanceId
     * @returns {Uint8Array}
     */
    getDocumentState(reportInstanceId) {
        const ydoc = this.documents.get(reportInstanceId);
        if (ydoc) {
            return encodeStateAsUpdate(ydoc);
        }
        return null;
    }

    /**
     * Obtiene el vector de estado para sincronización incremental
     * @param {string} reportInstanceId
     * @returns {Uint8Array}
     */
    getStateVector(reportInstanceId) {
        const ydoc = this.documents.get(reportInstanceId);
        if (ydoc) {
            return encodeStateVector(ydoc);
        }
        return null;
    }

    /**
     * Agrega un colaborador a la awareness
     * @param {string} reportInstanceId
     * @param {string} oderId
     * @param {Object} userInfo
     */
    addCollaborator(reportInstanceId, userId, userInfo) {
        if (!this.awareness.has(reportInstanceId)) {
            this.awareness.set(reportInstanceId, new Map());
        }

        const reportAwareness = this.awareness.get(reportInstanceId);
        
        // Asignar color si no tiene
        const usedColors = Array.from(reportAwareness.values()).map(u => u.color);
        const availableColors = this.colors.filter(c => !usedColors.includes(c));
        const color = availableColors[0] || this.colors[Math.floor(Math.random() * this.colors.length)];

        reportAwareness.set(userId, {
            oderId,
            username: userInfo.username,
            color,
            cursor: null,
            selection: null,
            lastActive: Date.now()
        });

        return this.getCollaborators(reportInstanceId);
    }

    /**
     * Remueve un colaborador de la awareness
     * @param {string} reportInstanceId
     * @param {string} userId
     */
    removeCollaborator(reportInstanceId, userId) {
        const reportAwareness = this.awareness.get(reportInstanceId);
        if (reportAwareness) {
            reportAwareness.delete(userId);
            
            // Si no hay más colaboradores, guardar y limpiar
            if (reportAwareness.size === 0) {
                this.cleanup(reportInstanceId);
            }
        }

        return this.getCollaborators(reportInstanceId);
    }

    /**
     * Actualiza la posición del cursor de un colaborador
     * @param {string} reportInstanceId
     * @param {string} userId
     * @param {Object} cursorData
     */
    updateCursor(reportInstanceId, userId, cursorData) {
        const reportAwareness = this.awareness.get(reportInstanceId);
        if (reportAwareness && reportAwareness.has(userId)) {
            const user = reportAwareness.get(userId);
            user.cursor = cursorData.cursor;
            user.selection = cursorData.selection;
            user.lastActive = Date.now();
        }

        return this.getCollaborators(reportInstanceId);
    }

    /**
     * Obtiene todos los colaboradores activos
     * @param {string} reportInstanceId
     * @returns {Array}
     */
    getCollaborators(reportInstanceId) {
        const reportAwareness = this.awareness.get(reportInstanceId);
        if (!reportAwareness) return [];

        return Array.from(reportAwareness.entries()).map(([oderId, data]) => ({
            userId: oderId,
            username: data.username,
            color: data.color,
            cursor: data.cursor,
            selection: data.selection,
            lastActive: data.lastActive
        }));
    }

    /**
     * Limpia recursos de un reporte
     * @param {string} reportInstanceId
     */
    async cleanup(reportInstanceId) {
        // Guardar antes de limpiar
        await this.saveDocument(reportInstanceId);

        // Limpiar timer
        if (this.saveTimers.has(reportInstanceId)) {
            clearInterval(this.saveTimers.get(reportInstanceId));
            this.saveTimers.delete(reportInstanceId);
        }

        // Limpiar documento
        this.documents.delete(reportInstanceId);

        // Limpiar awareness
        this.awareness.delete(reportInstanceId);

        console.log(`[Collab] Cleaned up resources for report ${reportInstanceId}`);
    }

    /**
     * Limpia colaboradores inactivos
     * @param {number} timeoutMs - Timeout de inactividad en ms
     */
    cleanInactiveCollaborators(timeoutMs = 5 * 60 * 1000) {
        const now = Date.now();

        this.awareness.forEach((reportAwareness, reportInstanceId) => {
            reportAwareness.forEach((data, userId) => {
                if (now - data.lastActive > timeoutMs) {
                    reportAwareness.delete(userId);
                }
            });

            // Si no hay colaboradores, limpiar
            if (reportAwareness.size === 0) {
                this.cleanup(reportInstanceId);
            }
        });
    }
}

// Singleton
const collaborationService = new CollaborationService();

// Limpiar colaboradores inactivos cada 5 minutos
setInterval(() => {
    collaborationService.cleanInactiveCollaborators();
}, 5 * 60 * 1000);

module.exports = collaborationService;
