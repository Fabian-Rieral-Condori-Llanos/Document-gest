const mongoose = require('mongoose');
const Audit = mongoose.model('Audit');
const { getSockets } = require('../utils/helpers');

class AuditService {
    /**
     * Obtiene todas las auditorías para un usuario
     * @param {boolean} isAdmin - Si el usuario es admin
     * @param {string} userId - ID del usuario
     * @param {Object} filters - Filtros de búsqueda
     */
    static async getAll(isAdmin, userId, filters = {}) {
        let query = Audit.find(filters);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        query.populate('creator', 'username');
        query.populate('collaborators', 'username');
        query.populate('reviewers', 'username firstname lastname');
        query.populate('approvals', 'username firstname lastname');
        query.populate('company', 'name');
        query.select(Audit.listFields);

        return query.exec();
    }

    /**
     * Obtiene una auditoría por ID
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     */
    static async getById(isAdmin, auditId, userId) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        query.populate('template');
        query.populate('creator', 'username firstname lastname email phone role');
        query.populate('company');
        query.populate('client');
        query.populate('collaborators', 'username firstname lastname email phone jobTitle role');
        query.populate('reviewers', 'username firstname lastname role');
        query.populate('approvals', 'username firstname lastname role');
        query.populate('customFields.customField', 'label fieldType text');
        query.populate({
            path: 'findings',
            populate: {
                path: 'customFields.customField',
                select: 'label fieldType text'
            }
        });
        query.populate('comments.author', 'username firstname lastname');
        query.populate('comments.replies.author', 'username firstname lastname');

        try {
            const audit = await query.exec();
            if (!audit) {
                throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
            }
            return audit;
        } catch (err) {
            if (err.name === 'CastError') {
                throw { fn: 'BadParameters', message: 'Bad Audit Id' };
            }
            throw err;
        }
    }

    /**
     * Obtiene información general de una auditoría
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     */
    static async getGeneral(isAdmin, auditId, userId) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        query.populate('template', 'name ext');
        query.populate('creator', 'username firstname lastname');
        query.populate('company', 'name');
        query.populate('client');
        query.populate('collaborators', 'username firstname lastname');
        query.populate('reviewers', 'username firstname lastname');
        query.populate('approvals', 'username firstname lastname');

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        return audit;
    }

    /**
     * Obtiene auditorías hijas
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     */
    static async getChildren(isAdmin, auditId, userId) {
        let query = Audit.find({ parentId: auditId });

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        return query.exec();
    }

    /**
     * Obtiene el retest de una auditoría
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     */
    static async getRetest(isAdmin, auditId, userId) {
        let query = Audit.findOne({ parentId: auditId, type: 'retest' });

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        const retest = await query.exec();
        if (!retest) {
            throw { fn: 'NotFound', message: 'No retest found for this audit' };
        }

        return retest;
    }

    /**
     * Crea una nueva auditoría
     * @param {Object} auditData
     * @param {string} creatorId
     */
    static async create(auditData, creatorId) {
        const audit = new Audit({
            ...auditData,
            creator: creatorId,
            collaborators: [creatorId]
        });

        try {
            return await audit.save();
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Audit name already exists' };
            }
            throw err;
        }
    }

    /**
     * Crea un retest de una auditoría
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {string} auditType
     */
    static async createRetest(isAdmin, auditId, userId, auditType) {
        const parentAudit = await this.getById(isAdmin, auditId, userId);

        // Verificar si ya existe retest
        const existingRetest = await Audit.findOne({ parentId: auditId, type: 'retest' });
        if (existingRetest) {
            throw { fn: 'BadParameters', message: 'Retest already exists' };
        }

        const retestData = {
            name: `${parentAudit.name} - Retest`,
            language: parentAudit.language,
            auditType: auditType,
            type: 'retest',
            parentId: auditId,
            company: parentAudit.company?._id,
            client: parentAudit.client?._id,
            scope: parentAudit.scope,
            findings: parentAudit.findings.map(f => ({
                ...f.toObject(),
                retestStatus: 'unknown',
                retestDescription: ''
            }))
        };

        return this.create(retestData, userId);
    }

    /**
     * Actualiza información general de una auditoría
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {Object} updateData
     */
    static async updateGeneral(isAdmin, auditId, userId, updateData) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId }
            ]);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        // Aplicar actualizaciones
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                audit[key] = updateData[key];
            }
        });

        await audit.save();
        return 'Audit updated successfully';
    }

    /**
     * Elimina una auditoría
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     */
    static async delete(isAdmin, auditId, userId) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.where('creator').equals(userId);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        // Eliminar auditoría y sus hijos
        await Audit.deleteOne({ _id: auditId });
        await Audit.deleteMany({ parentId: auditId });

        return 'Audit deleted successfully';
    }

    /**
     * Actualiza el padre de una auditoría
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {string} parentId
     */
    static async updateParent(isAdmin, auditId, userId, parentId) {
        const audit = await this.getById(isAdmin, auditId, userId);
        await this.getById(isAdmin, parentId, userId); // Verificar acceso al padre

        audit.parentId = parentId;
        await audit.save();

        return 'Parent updated successfully';
    }

    /**
     * Elimina el padre de una auditoría
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     */
    static async deleteParent(isAdmin, auditId, userId) {
        const audit = await this.getById(isAdmin, auditId, userId);
        const previousParentId = audit.parentId;

        audit.parentId = undefined;
        await audit.save();

        return { message: 'Parent removed', parentId: previousParentId };
    }

    /**
     * Crea un comentario
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {Object} commentData
     */
    static async createComment(isAdmin, auditId, userId, commentData) {
        const audit = await this.getById(isAdmin, auditId, userId);
        audit.comments.push(commentData);
        await audit.save();

        const newComment = audit.comments[audit.comments.length - 1];
        return { message: 'Comment created', commentId: newComment._id };
    }

    /**
     * Actualiza un comentario
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {string} commentId
     * @param {Object} updateData
     */
    static async updateComment(isAdmin, auditId, userId, commentId, updateData) {
        const audit = await this.getById(isAdmin, auditId, userId);
        const comment = audit.comments.id(commentId);

        if (!comment) {
            throw { fn: 'NotFound', message: 'Comment not found' };
        }

        if (updateData.text !== undefined) comment.text = updateData.text;
        if (updateData.replies !== undefined) comment.replies = updateData.replies;
        if (updateData.resolved !== undefined) comment.resolved = updateData.resolved;

        await audit.save();
        return 'Comment updated successfully';
    }

    /**
     * Elimina un comentario
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {string} commentId
     */
    static async deleteComment(isAdmin, auditId, userId, commentId) {
        const audit = await this.getById(isAdmin, auditId, userId);
        const commentIndex = audit.comments.findIndex(c => c._id.toString() === commentId);

        if (commentIndex === -1) {
            throw { fn: 'NotFound', message: 'Comment not found' };
        }

        audit.comments.splice(commentIndex, 1);
        await audit.save();

        return 'Comment deleted successfully';
    }

    /**
     * Obtiene usuarios conectados a una sala
     * @param {Object} io - Instancia de Socket.io
     * @param {string} room
     */
    static getConnectedUsers(io, room) {
        return getSockets(io, room).map(s => s.username);
    }

    /**
     * Exporta auditorías para backup
     * @param {string} path
     */
    static async backup(path) {
        const fs = require('fs');

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(`${path}/audits.json`);
            writeStream.write('[');

            let audits = Audit.find().cursor();
            let isFirst = true;

            audits.eachAsync(async (document) => {
                if (!isFirst) {
                    writeStream.write(',');
                } else {
                    isFirst = false;
                }
                writeStream.write(JSON.stringify(document, null, 2));
            })
            .then(() => {
                writeStream.write(']');
                writeStream.end();
            })
            .catch(reject);

            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
        });
    }

    /**
     * Restaura auditorías desde backup
     * @param {string} path
     * @param {string} mode
     */
    static async restore(path, mode = 'upsert') {
        const fs = require('fs');
        const JSONStream = require('JSONStream');

        if (mode === 'revert') {
            await Audit.deleteMany();
        }

        return new Promise((resolve, reject) => {
            let documents = [];

            const readStream = fs.createReadStream(`${path}/audits.json`);
            const jsonStream = JSONStream.parse('*');
            readStream.pipe(jsonStream);

            readStream.on('error', reject);

            jsonStream.on('data', async (document) => {
                documents.push(document);
                if (documents.length === 100) {
                    await Audit.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { _id: doc._id },
                            replacement: doc,
                            upsert: true
                        }
                    })));
                    documents = [];
                }
            });

            jsonStream.on('end', async () => {
                if (documents.length > 0) {
                    await Audit.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { _id: doc._id },
                            replacement: doc,
                            upsert: true
                        }
                    })));
                }
                resolve();
            });

            jsonStream.on('error', reject);
        });
    }
}

module.exports = AuditService;