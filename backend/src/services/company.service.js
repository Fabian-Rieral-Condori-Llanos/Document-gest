const mongoose = require('mongoose');
const Company = mongoose.model('Company');

/**
 * CompanyService
 * 
 * Servicio para gestión de compañías/empresas.
 */
class CompanyService {
    /**
     * Obtiene todas las compañías
     * @param {Object} filters - Filtros opcionales
     * @param {boolean} filters.status - Filtrar por estado
     * @param {boolean} filters.cuadroDeMando - Filtrar por prioridad
     * @param {string} filters.nivel - Filtrar por nivel (CENTRAL/TERRITORIAL)
     * @param {string} filters.categoria - Filtrar por categoría
     * @param {boolean} filters.prioritarias - Si true, ordena primero las de cuadro de mando
     */
    static async getAll(filters = {}) {
        const query = {};
        
        // Aplicar filtros
        if (filters.status !== undefined) {
            query.status = filters.status;
        }
        if (filters.cuadroDeMando !== undefined) {
            query.cuadroDeMando = filters.cuadroDeMando;
        }
        if (filters.nivel) {
            query.nivel = filters.nivel;
        }
        if (filters.categoria) {
            query.categoria = filters.categoria;
        }
        
        // Ordenar: primero cuadro de mando, luego por nombre
        const sort = filters.prioritarias !== false 
            ? { cuadroDeMando: -1, name: 1 }
            : { name: 1 };
        
        return Company.find(query)
            .select(Company.listFields)
            .sort(sort)
            .exec();
    }

    /**
     * Obtiene compañías activas con prioridad en cuadro de mando
     */
    static async getActivas() {
        return Company.find({ status: true })
            .select(Company.listFields)
            .sort({ cuadroDeMando: -1, name: 1 })
            .exec();
    }

    /**
     * Obtiene compañías prioritarias (cuadro de mando)
     */
    static async getPrioritarias() {
        return Company.find({ status: true, cuadroDeMando: true })
            .select(Company.listFields)
            .sort({ name: 1 })
            .exec();
    }

    /**
     * Obtiene una compañía por ID
     * @param {string} companyId
     * @param {boolean} full - Si true, retorna todos los campos
     */
    static async getById(companyId, full = false) {
        const selectFields = full ? Company.fullFields : Company.listFields;
        
        const company = await Company.findById(companyId)
            .select(selectFields)
            .exec();

        if (!company) {
            throw { fn: 'NotFound', message: 'Company not found' };
        }

        return company;
    }

    /**
     * Obtiene una compañía completa por ID (todos los campos)
     * @param {string} companyId
     */
    static async getFullById(companyId) {
        return this.getById(companyId, true);
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
            // Validar categoría según nivel
            if (companyData.categoria && companyData.nivel) {
                const categoriasValidas = Company.getCategoriasPorNivel(companyData.nivel);
                if (!categoriasValidas.includes(companyData.categoria)) {
                    throw { 
                        fn: 'BadParameters', 
                        message: `Categoría ${companyData.categoria} no es válida para nivel ${companyData.nivel}` 
                    };
                }
            }
            
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
            // Validar categoría según nivel si ambos están presentes
            if (companyData.categoria || companyData.nivel) {
                const company = await Company.findById(companyId);
                if (!company) {
                    throw { fn: 'NotFound', message: 'Company Id not found' };
                }
                
                const nivelFinal = companyData.nivel || company.nivel;
                const categoriaFinal = companyData.categoria || company.categoria;
                
                if (categoriaFinal && nivelFinal) {
                    const categoriasValidas = Company.getCategoriasPorNivel(nivelFinal);
                    if (!categoriasValidas.includes(categoriaFinal)) {
                        throw { 
                            fn: 'BadParameters', 
                            message: `Categoría ${categoriaFinal} no es válida para nivel ${nivelFinal}` 
                        };
                    }
                }
            }
            
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
     * Actualiza el estado de una compañía
     * @param {string} companyId
     * @param {boolean} status
     */
    static async updateStatus(companyId, status) {
        const company = await Company.findOneAndUpdate(
            { _id: companyId },
            { status },
            { new: true }
        );

        if (!company) {
            throw { fn: 'NotFound', message: 'Company Id not found' };
        }

        return company;
    }

    /**
     * Actualiza la prioridad de cuadro de mando
     * @param {string} companyId
     * @param {boolean} cuadroDeMando
     */
    static async updateCuadroDeMando(companyId, cuadroDeMando) {
        const company = await Company.findOneAndUpdate(
            { _id: companyId },
            { cuadroDeMando },
            { new: true }
        );

        if (!company) {
            throw { fn: 'NotFound', message: 'Company Id not found' };
        }

        return company;
    }

    /**
     * Agrega un documento a un array específico
     * @param {string} companyId
     * @param {string} tipoDocumento - pisi, actualizacionPisi, borradorPisi, etc.
     * @param {Object} documento - { gestion, fecha, cite?, descripcion }
     */
    static async agregarDocumento(companyId, tipoDocumento, documento) {
        const camposValidos = [
            'pisi', 'actualizacionPisi', 'borradorPisi', 'seguimientoPisi',
            'borradorPlanContingencia', 'planContingencia', 'informeTecnico'
        ];
        
        if (!camposValidos.includes(tipoDocumento)) {
            throw { fn: 'BadParameters', message: `Tipo de documento inválido: ${tipoDocumento}` };
        }
        
        const updateQuery = {};
        updateQuery[tipoDocumento] = documento;
        
        const company = await Company.findOneAndUpdate(
            { _id: companyId },
            { $push: updateQuery },
            { new: true }
        );

        if (!company) {
            throw { fn: 'NotFound', message: 'Company Id not found' };
        }

        return company;
    }

    /**
     * Actualiza un documento específico en un array
     * @param {string} companyId
     * @param {string} tipoDocumento
     * @param {string} documentoId
     * @param {Object} documento
     */
    static async actualizarDocumento(companyId, tipoDocumento, documentoId, documento) {
        const camposValidos = [
            'pisi', 'actualizacionPisi', 'borradorPisi', 'seguimientoPisi',
            'borradorPlanContingencia', 'planContingencia', 'informeTecnico'
        ];
        
        if (!camposValidos.includes(tipoDocumento)) {
            throw { fn: 'BadParameters', message: `Tipo de documento inválido: ${tipoDocumento}` };
        }
        
        const updateQuery = {};
        Object.keys(documento).forEach(key => {
            updateQuery[`${tipoDocumento}.$[elem].${key}`] = documento[key];
        });
        
        const company = await Company.findOneAndUpdate(
            { _id: companyId },
            { $set: updateQuery },
            { 
                new: true,
                arrayFilters: [{ 'elem._id': documentoId }]
            }
        );

        if (!company) {
            throw { fn: 'NotFound', message: 'Company Id not found' };
        }

        return company;
    }

    /**
     * Elimina un documento de un array
     * @param {string} companyId
     * @param {string} tipoDocumento
     * @param {string} documentoId
     */
    static async eliminarDocumento(companyId, tipoDocumento, documentoId) {
        const camposValidos = [
            'pisi', 'actualizacionPisi', 'borradorPisi', 'seguimientoPisi',
            'borradorPlanContingencia', 'planContingencia', 'informeTecnico'
        ];
        
        if (!camposValidos.includes(tipoDocumento)) {
            throw { fn: 'BadParameters', message: `Tipo de documento inválido: ${tipoDocumento}` };
        }
        
        const pullQuery = {};
        pullQuery[tipoDocumento] = { _id: documentoId };
        
        const company = await Company.findOneAndUpdate(
            { _id: companyId },
            { $pull: pullQuery },
            { new: true }
        );

        if (!company) {
            throw { fn: 'NotFound', message: 'Company Id not found' };
        }

        return company;
    }

    /**
     * Obtiene estadísticas de compañías
     */
    static async getEstadisticas() {
        const [
            total,
            activas,
            inactivas,
            prioritarias,
            porNivel,
            porCategoria
        ] = await Promise.all([
            Company.countDocuments(),
            Company.countDocuments({ status: true }),
            Company.countDocuments({ status: false }),
            Company.countDocuments({ cuadroDeMando: true, status: true }),
            Company.aggregate([
                { $match: { status: true } },
                { $group: { _id: '$nivel', count: { $sum: 1 } } }
            ]),
            Company.aggregate([
                { $match: { status: true } },
                { $group: { _id: '$categoria', count: { $sum: 1 } } }
            ])
        ]);
        
        return {
            total,
            activas,
            inactivas,
            prioritarias,
            porNivel: porNivel.reduce((acc, item) => {
                acc[item._id || 'SIN_NIVEL'] = item.count;
                return acc;
            }, {}),
            porCategoria: porCategoria.reduce((acc, item) => {
                acc[item._id || 'SIN_CATEGORIA'] = item.count;
                return acc;
            }, {})
        };
    }

    /**
     * Obtiene categorías y niveles disponibles
     */
    static async getCatalogos() {
        return {
            niveles: Object.values(Company.NIVELES),
            categorias: Object.values(Company.CATEGORIAS),
            categoriasPorNivel: {
                CENTRAL: Company.getCategoriasPorNivel('CENTRAL'),
                TERRITORIAL: Company.getCategoriasPorNivel('TERRITORIAL')
            }
        };
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