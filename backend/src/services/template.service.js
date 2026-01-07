const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Template = mongoose.model('Template');

class TemplateService {
    /**
     * Obtiene todas las plantillas
     */
    static async getAll() {
        return Template.find()
            .select(Template.listFields)
            .exec();
    }

    /**
     * Obtiene una plantilla por ID
     * @param {string} templateId
     */
    static async getById(templateId) {
        const template = await Template.findById(templateId)
            .select(Template.listFields)
            .exec();

        if (!template) {
            throw { fn: 'NotFound', message: 'Template not found' };
        }

        return template;
    }

    /**
     * Crea una nueva plantilla
     * @param {Object} templateData
     */
    static async create(templateData) {
        try {
            const template = new Template(templateData);
            const saved = await template.save();
            return { _id: saved._id, name: saved.name, ext: saved.ext };
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Template name already exists' };
            }
            throw err;
        }
    }

    /**
     * Actualiza una plantilla
     * @param {string} templateId
     * @param {Object} templateData
     */
    static async update(templateId, templateData) {
        try {
            const template = await Template.findByIdAndUpdate(
                templateId,
                templateData,
                { new: true }
            );

            if (!template) {
                throw { fn: 'NotFound', message: 'Template not found' };
            }

            return template;
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Template name already exists' };
            }
            throw err;
        }
    }

    /**
     * Elimina una plantilla
     * @param {string} templateId
     */
    static async delete(templateId) {
        const template = await Template.findByIdAndDelete(templateId);

        if (!template) {
            throw { fn: 'NotFound', message: 'Template not found' };
        }

        return template;
    }

    /**
     * Obtiene la ruta del directorio de plantillas
     */
    static getTemplatesDir() {
        return path.join(__basedir, '..', 'report-templates');
    }

    /**
     * Exporta plantillas para backup
     * @param {string} backupPath
     */
    static async backup(backupPath) {
        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(`${backupPath}/templates.json`);
            writeStream.write('[');

            let templates = Template.find().cursor();
            let isFirst = true;

            templates.eachAsync(async (document) => {
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

            writeStream.on('finish', () => {
                // Copiar archivos de plantillas
                const templatesDir = this.getTemplatesDir();
                if (fs.existsSync(templatesDir)) {
                    fs.cpSync(templatesDir, `${backupPath}/report-templates`, { recursive: true });
                }
                resolve();
            });

            writeStream.on('error', reject);
        });
    }

    /**
     * Restaura plantillas desde backup
     * @param {string} backupPath
     * @param {string} mode
     */
    static async restore(backupPath, mode = 'upsert') {
        const JSONStream = require('JSONStream');

        if (mode === 'revert') {
            await Template.deleteMany();
        }

        return new Promise((resolve, reject) => {
            let documents = [];

            const readStream = fs.createReadStream(`${backupPath}/templates.json`);
            const jsonStream = JSONStream.parse('*');
            readStream.pipe(jsonStream);

            readStream.on('error', reject);

            jsonStream.on('data', async (document) => {
                documents.push(document);
                if (documents.length === 100) {
                    await Template.bulkWrite(documents.map(doc => ({
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
                    await Template.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { name: doc.name },
                            replacement: doc,
                            upsert: true
                        }
                    })));
                }

                // Restaurar archivos de plantillas
                const templatesDir = TemplateService.getTemplatesDir();
                const backupTemplatesDir = `${backupPath}/report-templates`;
                if (fs.existsSync(backupTemplatesDir)) {
                    fs.cpSync(backupTemplatesDir, templatesDir, { recursive: true });
                }

                resolve();
            });

            jsonStream.on('error', reject);
        });
    }
}

module.exports = TemplateService;