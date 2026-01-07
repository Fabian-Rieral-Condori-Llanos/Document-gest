const mongoose = require('mongoose');
const Client = mongoose.model('Client');
const CompanyService = require('./company.service');

class ClientService {
    /**
     * Obtiene todos los clientes
     */
    static async getAll() {
        return Client.find()
            .populate('company', '-_id name')
            .select(Client.listFields)
            .exec();
    }

    /**
     * Obtiene un cliente por ID
     * @param {string} clientId
     */
    static async getById(clientId) {
        const client = await Client.findById(clientId)
            .populate('company', '-_id name')
            .select(Client.listFields)
            .exec();

        if (!client) {
            throw { fn: 'NotFound', message: 'Client not found' };
        }

        return client;
    }

    /**
     * Crea un nuevo cliente
     * @param {Object} clientData
     * @param {string} companyName - Nombre de la compañía (opcional)
     */
    static async create(clientData, companyName) {
        // Si se proporciona nombre de compañía, buscarla o crearla
        if (companyName) {
            const company = await CompanyService.findOrCreate(companyName);
            clientData.company = company._id;
        }

        try {
            const client = new Client(clientData);
            const saved = await client.save();

            return {
                _id: saved._id,
                email: saved.email,
                firstname: saved.firstname,
                lastname: saved.lastname,
                title: saved.title,
                phone: saved.phone,
                cell: saved.cell,
                company: saved.company
            };
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Client email already exists' };
            }
            throw err;
        }
    }

    /**
     * Actualiza un cliente
     * @param {string} clientId
     * @param {Object} clientData
     * @param {string} companyName - Nombre de la compañía (opcional)
     */
    static async update(clientId, clientData, companyName) {
        // Si se proporciona nombre de compañía, buscarla o crearla
        if (companyName) {
            const company = await CompanyService.findOrCreate(companyName);
            clientData.company = company._id;
        }

        try {
            const client = await Client.findOneAndUpdate(
                { _id: clientId },
                clientData,
                { new: true }
            );

            if (!client) {
                throw { fn: 'NotFound', message: 'Client Id not found' };
            }

            return client;
        } catch (err) {
            if (err.code === 11000) {
                throw { fn: 'BadParameters', message: 'Client email already exists' };
            }
            throw err;
        }
    }

    /**
     * Elimina un cliente
     * @param {string} clientId
     */
    static async delete(clientId) {
        const client = await Client.findOneAndDelete({ _id: clientId });

        if (!client) {
            throw { fn: 'NotFound', message: 'Client Id not found' };
        }

        return client;
    }

    /**
     * Exporta clientes para backup
     * @param {string} path
     */
    static async backup(path) {
        const fs = require('fs');

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(`${path}/clients.json`);
            writeStream.write('[');

            let clients = Client.find().cursor();
            let isFirst = true;

            clients.eachAsync(async (document) => {
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
     * Restaura clientes desde backup
     * @param {string} path
     * @param {string} mode
     */
    static async restore(path, mode = 'upsert') {
        const fs = require('fs');
        const JSONStream = require('JSONStream');

        if (mode === 'revert') {
            await Client.deleteMany();
        }

        return new Promise((resolve, reject) => {
            let documents = [];

            const readStream = fs.createReadStream(`${path}/clients.json`);
            const jsonStream = JSONStream.parse('*');
            readStream.pipe(jsonStream);

            readStream.on('error', reject);

            jsonStream.on('data', async (document) => {
                documents.push(document);
                if (documents.length === 100) {
                    await Client.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { email: doc.email },
                            replacement: doc,
                            upsert: true
                        }
                    })));
                    documents = [];
                }
            });

            jsonStream.on('end', async () => {
                if (documents.length > 0) {
                    await Client.bulkWrite(documents.map(doc => ({
                        replaceOne: {
                            filter: { email: doc.email },
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

module.exports = ClientService;