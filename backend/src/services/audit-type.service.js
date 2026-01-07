const mongoose = require('mongoose');
const AuditType = mongoose.model('AuditType');

class AuditTypeService {
    /**
     * Obtiene todos los tipos de auditoría
     */
    static async getAll() {
        return AuditType.find()
            .sort({ order: 1 })
            .select(AuditType.listFields)
            .exec();
    }

    /**
     * Obtiene un tipo de auditoría por nombre
     * @param {string} name
     */
    static async getByName(name) {
        return AuditType.findOne({ name })
            .select(AuditType.listFields)
            .exec();
    }

    /**
     * Obtiene un tipo de auditoría por ID
     * @param {string} auditTypeId
     */
    static async getById(auditTypeId) {
        const auditType = await AuditType.findById(auditTypeId)
            .select(AuditType.listFields)
            .exec();

        if (!auditType) {
            throw { fn: 'NotFound', message: 'Audit type not found' };
        }

        return auditType;
    }

    /**
     * Crea un nuevo tipo de auditoría
     * @param {Object} auditTypeData
     */
    static async create(auditTypeData) {
        // Obtener el último orden
        const lastDoc = await AuditType.findOne({}, {}, { sort: { order: -1 } });
        auditTypeData.order = (lastDoc && lastDoc.order) ? lastDoc.order + 1 : 1;

        try {
            const auditType = new AuditType(auditTypeData);
            const saved = await auditType.save();
            return saved;
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Audit type name already exists' };
            }
            throw err;
        }
    }

    /**
     * Actualiza un tipo de auditoría
     * @param {string} auditTypeId
     * @param {Object} auditTypeData
     */
    static async update(auditTypeId, auditTypeData) {
        try {
            const auditType = await AuditType.findByIdAndUpdate(
                auditTypeId,
                auditTypeData,
                { new: true }
            );

            if (!auditType) {
                throw { fn: 'NotFound', message: 'Audit type not found' };
            }

            return auditType;
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Audit type name already exists' };
            }
            throw err;
        }
    }

    /**
     * Elimina un tipo de auditoría
     * @param {string} auditTypeId
     */
    static async delete(auditTypeId) {
        const auditType = await AuditType.findByIdAndDelete(auditTypeId);

        if (!auditType) {
            throw { fn: 'NotFound', message: 'Audit type not found' };
        }

        return auditType;
    }

    /**
     * Actualiza todos los tipos de auditoría
     * @param {Array} auditTypes
     */
    static async updateAll(auditTypes) {
        await AuditType.deleteMany();
        if (auditTypes && auditTypes.length > 0) {
            await AuditType.insertMany(auditTypes);
        }
        return 'Audit types updated successfully';
    }

    /**
     * Exporta tipos de auditoría para backup
     * @param {string} path
     */
    static async backup(path) {
        const fs = require('fs');

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(`${path}/audit-types.json`);
            writeStream.write('[');

            let auditTypes = AuditType.find().cursor();
            let isFirst = true;

            auditTypes.eachAsync(async (document) => {
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
     * Restaura tipos de auditoría desde backup
     * @param {string} path
     * @param {string} mode
     */
    static async restore(path, mode = 'upsert') {
        const fs = require('fs');
        const JSONStream = require('JSONStream');

        if (mode === 'revert') {
            await AuditType.deleteMany();
        }

        return new Promise((resolve, reject) => {
            let documents = [];

            const readStream = fs.createReadStream(`${path}/audit-types.json`);
            const jsonStream = JSONStream.parse('*');
            readStream.pipe(jsonStream);

            readStream.on('error', reject);

            jsonStream.on('data', async (document) => {
                documents.push(document);
                if (documents.length === 100) {
                    await AuditType.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { name: doc.name },
                            replacement: doc,
                            upsert: true
                        }
                    })));
                    documents = [];
                }
            });

            jsonStream.on('end', async () => {
                if (documents.length > 0) {
                    await AuditType.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { name: doc.name },
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

module.exports = AuditTypeService;