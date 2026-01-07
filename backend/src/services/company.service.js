const mongoose = require('mongoose');
const Company = mongoose.model('Company');

class CompanyService {
    /**
     * Obtiene todas las compañías
     */
    static async getAll() {
        return Company.find()
            .select(Company.listFields)
            .exec();
    }

    /**
     * Obtiene una compañía por ID
     * @param {string} companyId
     */
    static async getById(companyId) {
        const company = await Company.findById(companyId)
            .select(Company.listFields)
            .exec();

        if (!company) {
            throw { fn: 'NotFound', message: 'Company not found' };
        }

        return company;
    }

    /**
     * Obtiene una compañía por nombre
     * @param {string} name
     */
    static async getByName(name) {
        const company = await Company.findOne({ name })
            .select(Company.listFields)
            .exec();

        return company;
    }

    /**
     * Crea una nueva compañía
     * @param {Object} companyData
     */
    static async create(companyData) {
        try {
            const company = new Company(companyData);
            const saved = await company.save();
            return { _id: saved._id, name: saved.name };
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Company name already exists' };
            }
            throw err;
        }
    }

    /**
     * Crea o obtiene una compañía por nombre
     * @param {string} name
     */
    static async findOrCreate(name) {
        const company = await Company.findOneAndUpdate(
            { name },
            {},
            { upsert: true, new: true }
        );
        return company;
    }

    /**
     * Actualiza una compañía
     * @param {string} companyId
     * @param {Object} companyData
     */
    static async update(companyId, companyData) {
        try {
            const company = await Company.findOneAndUpdate(
                { _id: companyId },
                companyData,
                { new: true }
            );

            if (!company) {
                throw { fn: 'NotFound', message: 'Company Id not found' };
            }

            return company;
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Company name already exists' };
            }
            throw err;
        }
    }

    /**
     * Elimina una compañía
     * @param {string} companyId
     */
    static async delete(companyId) {
        const company = await Company.findOneAndDelete({ _id: companyId });

        if (!company) {
            throw { fn: 'NotFound', message: 'Company Id not found' };
        }

        return company;
    }

    /**
     * Exporta compañías para backup
     * @param {string} path
     */
    static async backup(path) {
        const fs = require('fs');

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(`${path}/companies.json`);
            writeStream.write('[');

            let companies = Company.find().cursor();
            let isFirst = true;

            companies.eachAsync(async (document) => {
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
     * Restaura compañías desde backup
     * @param {string} path
     * @param {string} mode - 'upsert' o 'revert'
     */
    static async restore(path, mode = 'upsert') {
        const fs = require('fs');
        const JSONStream = require('JSONStream');

        if (mode === 'revert') {
            await Company.deleteMany();
        }

        return new Promise((resolve, reject) => {
            let documents = [];

            const readStream = fs.createReadStream(`${path}/companies.json`);
            const jsonStream = JSONStream.parse('*');
            readStream.pipe(jsonStream);

            readStream.on('error', reject);

            jsonStream.on('data', async (document) => {
                documents.push(document);
                if (documents.length === 100) {
                    await Company.bulkWrite(documents.map(doc => ({
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
                    await Company.bulkWrite(documents.map(doc => ({
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

module.exports = CompanyService;