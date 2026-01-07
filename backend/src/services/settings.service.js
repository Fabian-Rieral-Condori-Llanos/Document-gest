const mongoose = require('mongoose');
const Settings = mongoose.model('Settings');
const { getObjectPaths } = require('../utils/helpers');
const _ = require('lodash');

class SettingsService {
    /**
     * Obtiene toda la configuración
     */
    static async getAll() {
        const settings = await Settings.findOne({})
            .select(Settings.allFields)
            .exec();
        
        return settings;
    }

    /**
     * Obtiene solo la configuración pública
     */
    static async getPublic() {
        const settings = await Settings.findOne({})
            .select(Settings.publicFields)
            .exec();
        
        return settings;
    }

    /**
     * Actualiza la configuración
     * @param {Object} settingsData - Nuevos valores de configuración
     */
    static async update(settingsData) {
        const settings = await Settings.findOneAndUpdate(
            {},
            settingsData,
            { new: true, runValidators: true }
        );

        return settings;
    }

    /**
     * Restaura la configuración a valores por defecto
     */
    static async restoreDefaults() {
        await Settings.deleteMany({});
        await Settings.create({});
        return 'Restored default settings.';
    }

    /**
     * Inicializa la configuración si no existe
     * También limpia campos obsoletos
     */
    static async initialize() {
        const liveSettings = await Settings.findOne();

        if (!liveSettings) {
            console.log('Initializing Settings');
            await Settings.create({});
            return;
        }

        // Limpiar campos obsoletos
        let needUpdate = false;
        const liveSettingsPaths = getObjectPaths(liveSettings.toObject());
        const schema = Settings.schema;

        liveSettingsPaths.forEach(path => {
            if (!schema.path(path) && !path.startsWith('_')) {
                needUpdate = true;
                _.set(liveSettings, path, undefined);
            }
        });

        if (needUpdate) {
            console.log('Removing unused fields from Settings');
            await liveSettings.save();
        }
    }

    /**
     * Exporta configuración para backup
     * @param {string} path - Ruta de backup
     */
    static async backup(path) {
        const fs = require('fs');

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(`${path}/settings.json`);
            writeStream.write('[');

            let settings = Settings.find().cursor();
            let isFirst = true;

            settings.eachAsync(async (document) => {
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
     * Restaura configuración desde backup
     * @param {string} path - Ruta de backup
     */
    static async restore(path) {
        const fs = require('fs');
        const JSONStream = require('JSONStream');

        await Settings.deleteMany();

        return new Promise((resolve, reject) => {
            const readStream = fs.createReadStream(`${path}/settings.json`);
            const jsonStream = JSONStream.parse('*');
            readStream.pipe(jsonStream);

            readStream.on('error', reject);

            jsonStream.on('data', async (document) => {
                await Settings.findOneAndReplace(
                    { _id: document._id },
                    document,
                    { upsert: true }
                );
            });

            jsonStream.on('end', () => resolve());
            jsonStream.on('error', reject);
        });
    }
}

module.exports = SettingsService;