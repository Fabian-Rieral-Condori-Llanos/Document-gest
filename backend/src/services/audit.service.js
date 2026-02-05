const mongoose = require('mongoose');
const Audit = mongoose.model('Audit');
const AuditStatus = require('../models/audit-status.model');
const AuditProcedure = require('../models/audit-procedure.model');
const ProcedureTemplate = require('../models/procedure-template.model');
const ReportInstance = require('../models/report-instance.model');
const { getSockets } = require('../utils/helpers');

class AuditService {
    /**
     * Obtiene todas las auditorías para un usuario (ENRIQUECIDO)
     * Incluye: procedure, auditStatus, reportCount
     * 
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
        query.populate('client', 'firstname lastname email');
        query.select(Audit.listFields);

        const audits = await query.exec();
        
        // Si no hay auditorías, retornar vacío
        if (audits.length === 0) {
            return [];
        }

        const auditIds = audits.map(a => a._id);

        // Obtener datos relacionados en paralelo
        const [procedures, statuses, reportCounts] = await Promise.all([
            AuditProcedure.find({ auditId: { $in: auditIds } })
                .select(AuditProcedure.listFields)
                .lean(),
            AuditStatus.find({ auditId: { $in: auditIds } })
                .select('auditId status updatedAt')
                .lean(),
            ReportInstance.aggregate([
                { $match: { auditId: { $in: auditIds } } },
                { $group: { _id: '$auditId', count: { $sum: 1 } } }
            ])
        ]);

        // Crear mapas para búsqueda O(1)
        const procedureMap = new Map(
            procedures.map(p => [p.auditId.toString(), p])
        );
        const statusMap = new Map(
            statuses.map(s => [s.auditId.toString(), s])
        );
        const reportCountMap = new Map(
            reportCounts.map(r => [r._id.toString(), r.count])
        );

        // Combinar datos
        return audits.map(audit => {
            const auditObj = audit.toObject();
            const auditIdStr = audit._id.toString();

            return {
                ...auditObj,
                procedure: procedureMap.get(auditIdStr) || null,
                auditStatus: statusMap.get(auditIdStr) || null,
                reportCount: reportCountMap.get(auditIdStr) || 0
            };
        });
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
     * Obtiene una auditoría completa con todos sus datos relacionados
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     */
    static async getFullById(isAdmin, auditId, userId) {
        const audit = await this.getById(isAdmin, auditId, userId);
        
        const [procedure, status, reports, children] = await Promise.all([
            AuditProcedure.findOne({ auditId }).lean(),
            AuditStatus.findOne({ auditId })
                .populate('history.changedBy', 'username firstname lastname')
                .lean(),
            ReportInstance.find({ auditId })
                .populate('templateId', 'name category')
                .select('name status currentVersion createdAt updatedAt')
                .lean(),
            Audit.find({ parentId: auditId })
                .select('name type state createdAt')
                .lean()
        ]);

        return {
            ...audit.toObject(),
            procedure,
            auditStatus: status,
            reports,
            children
        };
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

        query.populate('creator', 'username');
        query.select('name type state createdAt updatedAt');

        return query.exec();
    }

    /**
     * Obtiene el retest de una auditoría
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     */
    static async getRetest(isAdmin, auditId, userId) {
        let query = Audit.findOne({ parentId: auditId, type: { $in: ['retest', 'verification'] } });

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        const retest = await query.exec();
        if (!retest) {
            throw { fn: 'NotFound', message: 'No retest/verification found for this audit' };
        }

        return retest;
    }

    /**
     * Crea una nueva auditoría
     * Automáticamente crea:
     * - AuditStatus con estado EVALUANDO
     * - AuditProcedure con el origen del template seleccionado
     * 
     * @param {Object} auditData
     * @param {string} auditData.procedureTemplateId - ID del template de procedimiento (opcional)
     * @param {string} creatorId
     */
    static async create(auditData, creatorId) {
        // Extraer procedureTemplateId antes de crear la auditoría
        const { procedureTemplateId, ...auditFields } = auditData;
        
        const audit = new Audit({
            ...auditFields,
            creator: creatorId,
            collaborators: auditFields.collaborators || [creatorId]
        });

        try {
            // Guardar la auditoría
            await audit.save();
            
            // Crear AuditStatus automáticamente
            const auditStatus = new AuditStatus({
                auditId: audit._id,
                status: AuditStatus.STATUS.EVALUANDO,
                history: [{
                    status: AuditStatus.STATUS.EVALUANDO,
                    changedAt: new Date(),
                    changedBy: creatorId,
                    notes: 'Estado inicial - Auditoría creada'
                }]
            });
            await auditStatus.save();
            
            // Crear AuditProcedure automáticamente
            let origen = auditData.origen || '';
            
            // Si se proporcionó un template, obtener el código
            if (procedureTemplateId) {
                const template = await ProcedureTemplate.findById(procedureTemplateId);
                if (template) {
                    origen = template.code;
                }
            }
            
            const auditProcedure = new AuditProcedure({
                auditId: audit._id,
                origen: origen,
                alcance: auditData.alcance || [],
                createdBy: creatorId
            });
            await auditProcedure.save();
            
            console.log(`[Audit] Created audit ${audit._id} with status and procedure`);
            
            return audit;
        } catch (err) {
            // Si falla, intentar limpiar los registros creados
            if (audit._id) {
                await AuditStatus.deleteOne({ auditId: audit._id }).catch(() => {});
                await AuditProcedure.deleteOne({ auditId: audit._id }).catch(() => {});
                await Audit.deleteOne({ _id: audit._id }).catch(() => {});
            }
            
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Audit name already exists' };
            }
            throw err;
        }
    }

    /**
     * Crea un retest de una auditoría (legacy)
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
            origen: 'RETEST-001',
            findings: parentAudit.findings.map(f => ({
                ...f.toObject(),
                retestStatus: 'unknown',
                retestDescription: ''
            }))
        };

        return this.create(retestData, userId);
    }

    /**
     * Crea una auditoría de verificación
     * Se crea desde una auditoría COMPLETADA
     * Hereda los findings para verificar si fueron solucionados
     * Permite verificación de verificación (cadena)
     * 
     * @param {boolean} isAdmin
     * @param {string} auditId - ID de la auditoría padre
     * @param {string} userId
     * @param {Object} options - Opciones adicionales
     * @param {string} options.name - Nombre personalizado (opcional)
     * @param {Array} options.alcance - Alcance personalizado (opcional)
     */
    static async createVerification(isAdmin, auditId, userId, options = {}) {
        const parentAudit = await this.getById(isAdmin, auditId, userId);

        // Verificar que la auditoría padre está COMPLETADA
        const parentStatus = await AuditStatus.findOne({ auditId });
        if (!parentStatus || parentStatus.status !== AuditStatus.STATUS.COMPLETADO) {
            throw { 
                fn: 'BadParameters', 
                message: 'Parent audit must be COMPLETADO to create verification' 
            };
        }

        // Contar verificaciones existentes para numeración
        const existingVerifications = await Audit.countDocuments({ 
            parentId: auditId, 
            type: 'verification' 
        });
        const verificationNumber = existingVerifications + 1;

        // Preparar nombre
        const baseName = parentAudit.name.replace(/^\[VERIFICACIÓN.*?\]\s*/, '');
        const verificationName = options.name || 
            `[VERIFICACIÓN ${verificationNumber}] ${baseName}`;

        // Preparar findings heredados
        const inheritedFindings = parentAudit.findings.map(f => {
            const findingObj = f.toObject ? f.toObject() : { ...f };
            return {
                ...findingObj,
                id: new mongoose.Types.ObjectId(),
                retestStatus: 'unknown',
                retestDescription: ''
            };
        });

        // Crear auditoría de verificación
        const verificationData = {
            name: verificationName,
            language: parentAudit.language,
            auditType: parentAudit.auditType,
            type: 'verification',
            parentId: auditId,
            company: parentAudit.company?._id,
            client: parentAudit.client?._id,
            collaborators: parentAudit.collaborators?.map(c => c._id || c) || [userId],
            reviewers: parentAudit.reviewers?.map(r => r._id || r) || [],
            scope: parentAudit.scope,
            template: parentAudit.template?._id || parentAudit.template,
            findings: inheritedFindings,
            origen: 'VERIF-001',
            alcance: ['Verificación']
        };

        const verification = await this.create(verificationData, userId);

        console.log(`[Audit] Created verification ${verification._id} for parent ${auditId}`);

        return verification;
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

        // Extraer procedureTemplateId si se proporciona
        const { procedureTemplateId, ...auditUpdateData } = updateData;

        // Aplicar actualizaciones a la auditoría
        Object.keys(auditUpdateData).forEach(key => {
            if (auditUpdateData[key] !== undefined) {
                audit[key] = auditUpdateData[key];
            }
        });

        await audit.save();

        // Si se proporciona procedureTemplateId, crear o actualizar AuditProcedure
        if (procedureTemplateId) {
            // Verificar si ya existe un AuditProcedure
            let auditProcedure = await AuditProcedure.findOne({ auditId });
            
            // Obtener el código del template
            const template = await ProcedureTemplate.findById(procedureTemplateId);
            if (!template) {
                throw { fn: 'NotFound', message: 'Procedure template not found' };
            }

            if (auditProcedure) {
                // Si ya existe y no tiene origen, actualizar
                if (!auditProcedure.origen) {
                    auditProcedure.origen = template.code;
                    auditProcedure.updatedBy = userId;
                    await auditProcedure.save();
                    console.log(`[Audit] Updated procedure for audit ${auditId} with template ${template.code}`);
                }
            } else {
                // Crear nuevo AuditProcedure
                const newProcedure = new AuditProcedure({
                    auditId: audit._id,
                    origen: template.code,
                    alcance: [],
                    createdBy: userId
                });
                await newProcedure.save();
                console.log(`[Audit] Created procedure for audit ${auditId} with template ${template.code}`);
            }
        }

        return 'Audit updated successfully';
    }

    /**
     * Elimina una auditoría
     * También elimina: AuditStatus, AuditProcedure, ReportInstances relacionados
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

        // Eliminar registros relacionados
        await Promise.all([
            AuditStatus.deleteOne({ auditId }),
            AuditProcedure.deleteOne({ auditId }),
            ReportInstance.deleteMany({ auditId })
        ]);

        // Eliminar auditoría y sus hijos (recursivamente)
        const children = await Audit.find({ parentId: auditId }).select('_id');
        for (const child of children) {
            await this.delete(true, child._id, userId); // Admin para poder eliminar hijos
        }

        await Audit.deleteOne({ _id: auditId });

        console.log(`[Audit] Deleted audit ${auditId} with related records`);

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

    // ============================================
    // STATE MANAGEMENT
    // ============================================

    /**
     * Actualiza el estado de una auditoría
     * Estados válidos: EDIT, REVIEW, APPROVED
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {string} newState
     */
    static async updateState(isAdmin, auditId, userId, newState) {
        // Validar estado
        const validStates = ['EDIT', 'REVIEW', 'APPROVED'];
        if (!validStates.includes(newState)) {
            throw { fn: 'BadParameters', message: `Invalid state. Must be one of: ${validStates.join(', ')}` };
        }

        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        const currentState = audit.state;

        // Validar transiciones de estado
        const validTransitions = {
            'EDIT': ['REVIEW'],
            'REVIEW': ['EDIT', 'APPROVED'],
            'APPROVED': ['REVIEW']  // Puede volver a revisión si se necesitan cambios
        };

        if (!validTransitions[currentState]?.includes(newState)) {
            throw { 
                fn: 'BadParameters', 
                message: `Invalid state transition from ${currentState} to ${newState}` 
            };
        }

        // Si va a APPROVED, verificar que haya al menos una aprobación
        if (newState === 'APPROVED' && (!audit.approvals || audit.approvals.length === 0)) {
            throw { 
                fn: 'BadParameters', 
                message: 'Cannot approve audit without any approvals' 
            };
        }

        // Si vuelve de APPROVED a REVIEW, limpiar aprobaciones
        if (currentState === 'APPROVED' && newState === 'REVIEW') {
            audit.approvals = [];
        }

        audit.state = newState;
        await audit.save();

        console.log(`[Audit] State changed from ${currentState} to ${newState} for audit ${auditId}`);

        return { 
            message: 'State updated successfully',
            previousState: currentState,
            newState: newState
        };
    }

    /**
     * Marca una auditoría como lista para revisión
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {string[]} reviewers - IDs de revisores a asignar
     */
    static async updateReadyForReview(isAdmin, auditId, userId, reviewers = []) {
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

        if (audit.state !== 'EDIT') {
            throw { fn: 'BadParameters', message: 'Audit must be in EDIT state to mark as ready for review' };
        }

        // Asignar revisores si se proporcionan
        if (reviewers && reviewers.length > 0) {
            audit.reviewers = reviewers;
        }

        audit.state = 'REVIEW';
        await audit.save();

        console.log(`[Audit] Marked as ready for review: ${auditId}`);

        return { message: 'Audit is now ready for review' };
    }

    /**
     * Gestiona las aprobaciones de una auditoría
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {string} action - 'add' o 'remove'
     */
    static async updateApprovals(isAdmin, auditId, userId, action) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        if (audit.state !== 'REVIEW') {
            throw { fn: 'BadParameters', message: 'Audit must be in REVIEW state to manage approvals' };
        }

        // Verificar que el usuario sea revisor (o admin)
        const isReviewer = audit.reviewers?.some(r => r.toString() === userId) || isAdmin;
        if (!isReviewer) {
            throw { fn: 'Forbidden', message: 'Only reviewers can approve audits' };
        }

        if (!audit.approvals) {
            audit.approvals = [];
        }

        const userIdStr = userId.toString();
        const hasApproved = audit.approvals.some(a => a.toString() === userIdStr);

        if (action === 'add') {
            if (hasApproved) {
                throw { fn: 'BadParameters', message: 'User has already approved this audit' };
            }
            audit.approvals.push(userId);
        } else if (action === 'remove') {
            if (!hasApproved) {
                throw { fn: 'BadParameters', message: 'User has not approved this audit' };
            }
            audit.approvals = audit.approvals.filter(a => a.toString() !== userIdStr);
        } else {
            throw { fn: 'BadParameters', message: 'Action must be "add" or "remove"' };
        }

        await audit.save();

        console.log(`[Audit] Approval ${action}ed by user ${userId} for audit ${auditId}`);

        return {
            message: `Approval ${action === 'add' ? 'added' : 'removed'} successfully`,
            approvals: audit.approvals,
            approvalCount: audit.approvals.length
        };
    }

    /**
     * Obtiene información de red de una auditoría
     */
    static async getNetwork(isAdmin, auditId, userId) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        query.select('scope');

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        return { scope: audit.scope || [] };
    }

    /**
     * Actualiza información de red de una auditoría
     */
    static async updateNetwork(isAdmin, auditId, userId, scope) {
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

        audit.scope = scope || [];
        await audit.save();

        return { message: 'Network information updated successfully' };
    }

    /**
     * Actualiza las opciones de ordenamiento de findings
     */
    static async updateSortFindings(isAdmin, auditId, userId, sortFindings) {
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

        audit.sortFindings = sortFindings || [];
        await audit.save();

        return { message: 'Sort options updated successfully' };
    }

    /**
     * Mueve un finding a una nueva posición
     */
    static async moveFinding(isAdmin, auditId, userId, findingId, newIndex) {
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

        // Encontrar el finding por _id o id (ambos son válidos)
        const currentIndex = audit.findings.findIndex(f => {
            const fId = f._id?.toString();
            const fCustomId = f.id?.toString();
            const targetId = findingId.toString();
            return fId === targetId || fCustomId === targetId;
        });

        if (currentIndex === -1) {
            throw { fn: 'NotFound', message: 'Finding not found' };
        }

        if (newIndex < 0 || newIndex >= audit.findings.length) {
            throw { fn: 'BadParameters', message: 'Invalid new index' };
        }

        // Mover el finding
        const [finding] = audit.findings.splice(currentIndex, 1);
        audit.findings.splice(newIndex, 0, finding);

        await audit.save();

        return { message: 'Finding moved successfully' };
    }
}

module.exports = AuditService;