const mongoose = require('mongoose');
const Language = mongoose.model('Language');

class LanguageService {
    /**
     * Obtiene todos los idiomas
     */
    static async getAll() {
        return Language.find()
            .select(Language.listFields)
            .exec();
    }

    /**
     * Crea un nuevo idioma
     * @param {Object} languageData
     */
    static async create(languageData) {
        try {
            const language = new Language(languageData);
            const saved = await language.save();
            return saved;
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Language already exists' };
            }
            throw err;
        }
    }

    /**
     * Actualiza todos los idiomas (reemplaza la lista completa)
     * @param {Array} languages
     */
    static async updateAll(languages) {
        await Language.deleteMany();
        await Language.insertMany(languages);
        return 'Languages updated successfully';
    }

    /**
     * Elimina un idioma por locale
     * @param {string} locale
     */
    static async delete(locale) {
        const result = await Language.deleteOne({ locale });

        if (result.deletedCount === 0) {
            throw { fn: 'NotFound', message: 'Language not found' };
        }

        return 'Language deleted';
    }

    /**
     * Exporta idiomas para backup
     * @param {string} path
     */
    static async backup(path) {
        const fs = require('fs');

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(`${path}/languages.json`);
            writeStream.write('[');

            let languages = Language.find().cursor();
            let isFirst = true;

            languages.eachAsync(async (document) => {
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
     * Restaura idiomas desde backup
     * @param {string} path
     * @param {string} mode
     */
    static async restore(path, mode = 'upsert') {
        const fs = require('fs');
        const JSONStream = require('JSONStream');

        if (mode === 'revert') {
            await Language.deleteMany();
        }

        return new Promise((resolve, reject) => {
            let documents = [];

            const readStream = fs.createReadStream(`${path}/languages.json`);
            const jsonStream = JSONStream.parse('*');
            readStream.pipe(jsonStream);

            readStream.on('error', reject);

            jsonStream.on('data', async (document) => {
                documents.push(document);
                if (documents.length === 100) {
                    await Language.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { language: doc.language, locale: doc.locale },
                            replacement: doc,
                            upsert: true
                        }
                    })));
                    documents = [];
                }
            });

            jsonStream.on('end', async () => {
                if (documents.length > 0) {
                    await Language.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { language: doc.language, locale: doc.locale },
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

module.exports = LanguageService;