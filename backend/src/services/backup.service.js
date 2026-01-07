const fs = require('fs');
const path = require('path');
const tar = require('tar-stream');
const zlib = require('zlib');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Servicios
const UserService = require('./user.service');
const SettingsService = require('./settings.service');
const CompanyService = require('./company.service');
const ClientService = require('./client.service');
const TemplateService = require('./template.service');
const LanguageService = require('./language.service');
const AuditTypeService = require('./audit-type.service');
const VulnerabilityService = require('./vulnerability.service');
const AuditService = require('./audit.service');

/**
 * Backup Service
 * 
 * Maneja las operaciones de backup y restore de la aplicación.
 */

// Rutas de backup
const BACKUP_PATH = path.join(__basedir, '..', 'backup');
const BACKUP_TMP_PATH = path.join(BACKUP_PATH, 'tmpBackup');
const RESTORE_TMP_PATH = path.join(BACKUP_PATH, 'tmpRestore');

// Estados del proceso
const STATE = {
    IDLE: 'idle',
    BACKUP_STARTED: 'backup_started',
    DUMPING_DATABASE: 'dumping_database',
    BUILDING_DATA: 'building_data',
    ENCRYPTING_DATA: 'encrypting_data',
    BUILDING_ARCHIVE: 'building_archive',
    BACKUP_ERROR: 'backup_error',
    RESTORE_STARTED: 'restore_started',
    EXTRACTING_INFO: 'extracting_info',
    DECRYPTING_DATA: 'decrypting_data',
    EXTRACTING_DATA: 'extracting_data',
    RESTORING_DATA: 'restoring_data',
    RESTORE_ERROR: 'restore_error'
};

// Datos disponibles para backup
const ALL_DATA = [
    'Audits',
    'Vulnerabilities',
    'Vulnerabilities Updates',
    'Users',
    'Clients',
    'Companies',
    'Templates',
    'Audit Types',
    'Custom Fields',
    'Custom Sections',
    'Vulnerability Types',
    'Vulnerability Categories',
    'Settings'
];

class BackupService {
    // ============================================
    // STATE MANAGEMENT
    // ============================================

    /**
     * Obtiene el estado actual del proceso de backup
     */
    static getState() {
        try {
            if (!fs.existsSync(BACKUP_PATH)) {
                fs.mkdirSync(BACKUP_PATH, { recursive: true });
            }

            const statePath = path.join(BACKUP_PATH, '.state');
            if (!fs.existsSync(statePath)) {
                fs.writeFileSync(statePath, STATE.IDLE);
                return { state: STATE.IDLE, message: '' };
            }

            const content = fs.readFileSync(statePath, 'utf8');
            const lines = content.split('\n');

            return {
                state: lines[0].trim(),
                message: lines.slice(1).join('\n').trim()
            };
        } catch (error) {
            console.error('Error reading backup state:', error);
            return { state: 'error', message: error.message };
        }
    }

    /**
     * Establece el estado del proceso de backup
     */
    static setState(state, message = null) {
        if (!fs.existsSync(BACKUP_PATH)) {
            fs.mkdirSync(BACKUP_PATH, { recursive: true });
        }

        const statePath = path.join(BACKUP_PATH, '.state');
        const content = message ? `${state}\n${message}` : state;
        fs.writeFileSync(statePath, content);
    }

    /**
     * Obtiene el estado de operación actual
     */
    static getOperationStatus() {
        const { state, message } = this.getState();
        let operation = 'idle';

        const backupStates = [
            STATE.BACKUP_STARTED,
            STATE.DUMPING_DATABASE,
            STATE.BUILDING_DATA,
            STATE.ENCRYPTING_DATA,
            STATE.BUILDING_ARCHIVE
        ];

        const restoreStates = [
            STATE.RESTORE_STARTED,
            STATE.EXTRACTING_INFO,
            STATE.DECRYPTING_DATA,
            STATE.EXTRACTING_DATA,
            STATE.RESTORING_DATA
        ];

        if (backupStates.includes(state)) {
            operation = 'backup';
        } else if (restoreStates.includes(state)) {
            operation = 'restore';
        }

        return { operation, state, message };
    }

    // ============================================
    // BACKUP LIST
    // ============================================

    /**
     * Lee la información de un archivo de backup
     */
    static readBackupInfo(filename) {
        return new Promise((resolve, reject) => {
            const filePath = path.join(BACKUP_PATH, filename);
            
            if (!fs.existsSync(filePath)) {
                return reject(new Error('Backup file not found'));
            }

            const fileStats = fs.statSync(filePath);
            const readStream = fs.createReadStream(filePath);
            const extract = tar.extract();

            extract.on('entry', (header, stream, next) => {
                if (header.name === 'backup.json') {
                    let jsonData = '';

                    stream.on('data', chunk => {
                        jsonData += chunk;
                    });

                    stream.on('end', () => {
                        try {
                            const data = JSON.parse(jsonData);
                            const requiredKeys = ['name', 'date', 'slug', 'type', 'protected', 'data'];

                            if (requiredKeys.every(k => Object.keys(data).includes(k))) {
                                data.filename = filename;
                                data.size = fileStats.size;
                                resolve(data);
                            } else {
                                reject(new Error('Wrong backup.json structure'));
                            }
                        } catch (error) {
                            reject(new Error('Wrong JSON data in backup.json'));
                        }
                    });

                    stream.resume();
                } else {
                    stream.on('end', () => next());
                    stream.resume();
                }
            });

            extract.on('finish', () => {
                reject(new Error('No backup.json file found in archive'));
            });

            readStream
                .pipe(zlib.createGunzip())
                .on('error', () => reject(new Error('Wrong backup file')))
                .pipe(extract)
                .on('error', () => reject(new Error('Wrong backup file')));
        });
    }

    /**
     * Obtiene la lista de backups disponibles
     */
    static async getList() {
        if (!fs.existsSync(BACKUP_PATH)) {
            return [];
        }

        const filenames = fs.readdirSync(BACKUP_PATH);
        const tarFiles = filenames.filter(f => f.endsWith('.tar'));
        const backupList = [];

        const promises = tarFiles.map(file => this.readBackupInfo(file));
        const results = await Promise.allSettled(promises);

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                backupList.push(result.value);
            }
        });

        return backupList;
    }

    /**
     * Obtiene el nombre de archivo de un backup por su slug
     */
    static async getFilenameBySlug(slug) {
        const backupList = await this.getList();
        const backup = backupList.find(b => b.slug === slug);

        if (!backup) {
            throw { fn: 'NotFound', message: 'Backup not found' };
        }

        return backup.filename;
    }

    /**
     * Obtiene la ruta completa de un archivo de backup
     */
    static getFilePath(filename) {
        return path.join(BACKUP_PATH, filename);
    }

    // ============================================
    // BACKUP CREATION
    // ============================================

    /**
     * Genera un slug único para el backup
     */
    static generateSlug() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Encripta un archivo con AES-256
     */
    static encryptFile(inputPath, outputPath, password) {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(16);
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

            const input = fs.createReadStream(inputPath);
            const output = fs.createWriteStream(outputPath);

            // Escribir salt e IV al inicio del archivo
            output.write(salt);
            output.write(iv);

            input.pipe(cipher).pipe(output);

            output.on('finish', resolve);
            output.on('error', reject);
            input.on('error', reject);
        });
    }

    /**
     * Desencripta un archivo
     */
    static decryptFile(inputPath, outputPath, password) {
        return new Promise((resolve, reject) => {
            const input = fs.createReadStream(inputPath);
            const output = fs.createWriteStream(outputPath);

            let salt, iv;
            let headerRead = false;
            let decipher;

            input.on('readable', () => {
                if (!headerRead) {
                    salt = input.read(16);
                    iv = input.read(16);

                    if (salt && iv) {
                        headerRead = true;
                        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
                        decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

                        let chunk;
                        while ((chunk = input.read()) !== null) {
                            output.write(decipher.update(chunk));
                        }
                    }
                } else {
                    let chunk;
                    while ((chunk = input.read()) !== null) {
                        output.write(decipher.update(chunk));
                    }
                }
            });

            input.on('end', () => {
                try {
                    if (decipher) {
                        output.write(decipher.final());
                    }
                    output.end();
                    resolve();
                } catch (error) {
                    reject(new Error('Wrong password or corrupted file'));
                }
            });

            input.on('error', reject);
            output.on('error', reject);
        });
    }

    /**
     * Crea un backup
     */
    static async create(options = {}) {
        const {
            name = `Backup ${new Date().toISOString()}`,
            password = null,
            backupData = ALL_DATA
        } = options;

        const slug = this.generateSlug();
        const isProtected = !!password;

        try {
            this.setState(STATE.BACKUP_STARTED);
            console.log('Backup started');

            // Crear directorio temporal
            if (!fs.existsSync(BACKUP_TMP_PATH)) {
                fs.mkdirSync(BACKUP_TMP_PATH, { recursive: true });
            }

            this.setState(STATE.DUMPING_DATABASE);
            console.log('Dumping database');

            // Exportar datos según lo solicitado
            const backupPromises = [];

            if (backupData.includes('Audits')) {
                backupPromises.push(AuditService.backup(BACKUP_TMP_PATH));
            }
            if (backupData.includes('Vulnerabilities')) {
                backupPromises.push(VulnerabilityService.backup(BACKUP_TMP_PATH));
            }
            if (backupData.includes('Users')) {
                backupPromises.push(UserService.backup(BACKUP_TMP_PATH));
            }
            if (backupData.includes('Clients')) {
                backupPromises.push(ClientService.backup(BACKUP_TMP_PATH));
            }
            if (backupData.includes('Companies')) {
                backupPromises.push(CompanyService.backup(BACKUP_TMP_PATH));
            }
            if (backupData.includes('Templates')) {
                backupPromises.push(TemplateService.backup(BACKUP_TMP_PATH));
            }
            if (backupData.includes('Settings')) {
                backupPromises.push(SettingsService.backup(BACKUP_TMP_PATH));
            }
            if (backupData.includes('Audit Types')) {
                backupPromises.push(AuditTypeService.backup(BACKUP_TMP_PATH));
            }

            // Exportar datos adicionales directamente
            if (backupData.includes('Custom Fields')) {
                const CustomField = mongoose.model('CustomField');
                backupPromises.push(this.exportCollection(CustomField, BACKUP_TMP_PATH, 'customFields.json'));
            }
            if (backupData.includes('Custom Sections')) {
                const CustomSection = mongoose.model('CustomSection');
                backupPromises.push(this.exportCollection(CustomSection, BACKUP_TMP_PATH, 'customSections.json'));
            }
            if (backupData.includes('Vulnerability Types')) {
                const VulnerabilityType = mongoose.model('VulnerabilityType');
                backupPromises.push(this.exportCollection(VulnerabilityType, BACKUP_TMP_PATH, 'vulnerabilityTypes.json'));
            }
            if (backupData.includes('Vulnerability Categories')) {
                const VulnerabilityCategory = mongoose.model('VulnerabilityCategory');
                backupPromises.push(this.exportCollection(VulnerabilityCategory, BACKUP_TMP_PATH, 'vulnerabilityCategories.json'));
            }
            if (backupData.includes('Vulnerabilities Updates')) {
                const VulnerabilityUpdate = mongoose.model('VulnerabilityUpdate');
                backupPromises.push(this.exportCollection(VulnerabilityUpdate, BACKUP_TMP_PATH, 'vulnerabilityUpdates.json'));
            }

            // Languages siempre se incluyen
            backupPromises.push(LanguageService.backup(BACKUP_TMP_PATH));

            await Promise.all(backupPromises);

            this.setState(STATE.BUILDING_DATA);
            console.log('Building data archive');

            // Crear archivo data.tar.gz
            const dataArchivePath = path.join(BACKUP_PATH, 'data.tar.gz');
            await this.createTarGz(BACKUP_TMP_PATH, dataArchivePath);

            // Encriptar si es necesario
            let finalDataPath = dataArchivePath;
            if (isProtected) {
                this.setState(STATE.ENCRYPTING_DATA);
                console.log('Encrypting data');
                
                const encryptedPath = path.join(BACKUP_PATH, 'data.tar.gz.enc');
                await this.encryptFile(dataArchivePath, encryptedPath, password);
                fs.unlinkSync(dataArchivePath);
                finalDataPath = encryptedPath;
            }

            this.setState(STATE.BUILDING_ARCHIVE);
            console.log('Building final archive');

            // Crear backup.json
            const backupInfo = {
                name,
                date: new Date().toISOString(),
                slug,
                type: 'full',
                protected: isProtected,
                data: backupData
            };

            const backupJsonPath = path.join(BACKUP_PATH, 'backup.json');
            fs.writeFileSync(backupJsonPath, JSON.stringify(backupInfo, null, 2));

            // Crear archivo final
            const finalArchivePath = path.join(BACKUP_PATH, `${slug}.tar`);
            await this.createFinalArchive(
                finalArchivePath,
                backupJsonPath,
                finalDataPath,
                isProtected
            );

            // Limpiar archivos temporales
            fs.unlinkSync(backupJsonPath);
            fs.unlinkSync(finalDataPath);
            fs.rmSync(BACKUP_TMP_PATH, { recursive: true, force: true });

            this.setState(STATE.IDLE);
            console.log('Backup completed successfully');

            return { slug, filename: `${slug}.tar` };
        } catch (error) {
            this.setState(STATE.BACKUP_ERROR, error.message);
            console.error('Backup error:', error);
            
            // Limpiar archivos temporales en caso de error
            fs.rmSync(BACKUP_TMP_PATH, { recursive: true, force: true });
            
            throw error;
        }
    }

    /**
     * Exporta una colección a JSON
     */
    static exportCollection(Model, outputPath, filename) {
        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(path.join(outputPath, filename));
            writeStream.write('[');

            let cursor = Model.find().cursor();
            let isFirst = true;

            cursor.eachAsync(async (doc) => {
                if (!isFirst) {
                    writeStream.write(',');
                } else {
                    isFirst = false;
                }
                writeStream.write(JSON.stringify(doc, null, 2));
            })
            .then(() => {
                writeStream.write(']');
                writeStream.end();
            })
            .catch(reject);

            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    }

    /**
     * Crea un archivo tar.gz
     */
    static createTarGz(sourceDir, outputPath) {
        return new Promise((resolve, reject) => {
            const pack = tar.pack();
            const gzip = zlib.createGzip();
            const output = fs.createWriteStream(outputPath);

            pack.pipe(gzip).pipe(output);

            const addFiles = (dir, prefix = '') => {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    const entryName = prefix ? `${prefix}/${file}` : file;
                    const stat = fs.statSync(filePath);

                    if (stat.isDirectory()) {
                        addFiles(filePath, entryName);
                    } else {
                        const content = fs.readFileSync(filePath);
                        pack.entry({ name: entryName, size: content.length }, content);
                    }
                });
            };

            addFiles(sourceDir);
            pack.finalize();

            output.on('finish', resolve);
            output.on('error', reject);
        });
    }

    /**
     * Crea el archivo de backup final
     */
    static createFinalArchive(outputPath, backupJsonPath, dataPath, isProtected) {
        return new Promise((resolve, reject) => {
            const pack = tar.pack();
            const gzip = zlib.createGzip();
            const output = fs.createWriteStream(outputPath);

            pack.pipe(gzip).pipe(output);

            // Agregar backup.json
            const backupJson = fs.readFileSync(backupJsonPath);
            pack.entry({ name: 'backup.json', size: backupJson.length }, backupJson);

            // Agregar data.tar.gz o data.tar.gz.enc
            const dataFilename = isProtected ? 'data.tar.gz.enc' : 'data.tar.gz';
            const dataContent = fs.readFileSync(dataPath);
            pack.entry({ name: dataFilename, size: dataContent.length }, dataContent);

            pack.finalize();

            output.on('finish', resolve);
            output.on('error', reject);
        });
    }

    // ============================================
    // RESTORE
    // ============================================

    /**
     * Restaura un backup
     */
    static async restore(slug, options = {}) {
        const {
            password = null,
            restoreData = ALL_DATA,
            mode = 'upsert'
        } = options;

        try {
            const filename = await this.getFilenameBySlug(slug);
            const filePath = this.getFilePath(filename);

            this.setState(STATE.RESTORE_STARTED);
            console.log('Restore started');

            // Leer información del backup
            this.setState(STATE.EXTRACTING_INFO);
            const info = await this.readBackupInfo(filename);

            // Verificar contraseña
            if (info.protected && !password) {
                throw { fn: 'BadParameters', message: 'Backup is protected, password is required' };
            }

            // Extraer archivo de datos
            const dataFilename = info.protected ? 'data.tar.gz.enc' : 'data.tar.gz';
            await this.extractFromTar(filePath, BACKUP_PATH, [dataFilename]);

            // Desencriptar si es necesario
            const encryptedPath = path.join(BACKUP_PATH, 'data.tar.gz.enc');
            const dataPath = path.join(BACKUP_PATH, 'data.tar.gz');

            if (info.protected) {
                this.setState(STATE.DECRYPTING_DATA);
                console.log('Decrypting data');
                await this.decryptFile(encryptedPath, dataPath, password);
                fs.unlinkSync(encryptedPath);
            }

            // Extraer datos
            this.setState(STATE.EXTRACTING_DATA);
            console.log('Extracting data');

            if (!fs.existsSync(RESTORE_TMP_PATH)) {
                fs.mkdirSync(RESTORE_TMP_PATH, { recursive: true });
            }

            await this.extractFromTar(dataPath, RESTORE_TMP_PATH);

            // Restaurar datos
            this.setState(STATE.RESTORING_DATA);
            console.log('Restoring data');

            const restorePromises = [];

            // Siempre restaurar idiomas primero
            restorePromises.push(LanguageService.restore(RESTORE_TMP_PATH, mode));

            if (info.data.includes('Audits') && restoreData.includes('Audits')) {
                restorePromises.push(AuditService.restore(RESTORE_TMP_PATH, mode));
            }
            if (info.data.includes('Vulnerabilities') && restoreData.includes('Vulnerabilities')) {
                restorePromises.push(VulnerabilityService.restore(RESTORE_TMP_PATH, mode));
            }
            if (info.data.includes('Users') && restoreData.includes('Users')) {
                restorePromises.push(UserService.restore(RESTORE_TMP_PATH, mode));
            }
            if (info.data.includes('Clients') && restoreData.includes('Clients')) {
                restorePromises.push(ClientService.restore(RESTORE_TMP_PATH, mode));
            }
            if (info.data.includes('Companies') && restoreData.includes('Companies')) {
                restorePromises.push(CompanyService.restore(RESTORE_TMP_PATH, mode));
            }
            if (info.data.includes('Templates') && restoreData.includes('Templates')) {
                restorePromises.push(TemplateService.restore(RESTORE_TMP_PATH, mode));
            }
            if (info.data.includes('Settings') && restoreData.includes('Settings')) {
                restorePromises.push(SettingsService.restore(RESTORE_TMP_PATH));
            }
            if (info.data.includes('Audit Types') && restoreData.includes('Audit Types')) {
                restorePromises.push(AuditTypeService.restore(RESTORE_TMP_PATH, mode));
            }

            // Restaurar colecciones adicionales
            if (info.data.includes('Custom Fields') && restoreData.includes('Custom Fields')) {
                const CustomField = mongoose.model('CustomField');
                restorePromises.push(this.restoreCollection(CustomField, RESTORE_TMP_PATH, 'customFields.json', mode));
            }
            if (info.data.includes('Custom Sections') && restoreData.includes('Custom Sections')) {
                const CustomSection = mongoose.model('CustomSection');
                restorePromises.push(this.restoreCollection(CustomSection, RESTORE_TMP_PATH, 'customSections.json', mode));
            }
            if (info.data.includes('Vulnerability Types') && restoreData.includes('Vulnerability Types')) {
                const VulnerabilityType = mongoose.model('VulnerabilityType');
                restorePromises.push(this.restoreCollection(VulnerabilityType, RESTORE_TMP_PATH, 'vulnerabilityTypes.json', mode));
            }
            if (info.data.includes('Vulnerability Categories') && restoreData.includes('Vulnerability Categories')) {
                const VulnerabilityCategory = mongoose.model('VulnerabilityCategory');
                restorePromises.push(this.restoreCollection(VulnerabilityCategory, RESTORE_TMP_PATH, 'vulnerabilityCategories.json', mode));
            }

            const results = await Promise.allSettled(restorePromises);

            const errors = results
                .filter(r => r.status === 'rejected')
                .map(r => r.reason);

            if (errors.length > 0) {
                throw new Error(`Restore errors: ${errors.join(', ')}`);
            }

            this.setState(STATE.IDLE);
            console.log('Restore completed successfully');

            return { success: true };
        } catch (error) {
            this.setState(STATE.RESTORE_ERROR, error.message);
            console.error('Restore error:', error);
            throw error;
        } finally {
            // Limpiar archivos temporales
            fs.rmSync(path.join(BACKUP_PATH, 'data.tar.gz'), { force: true });
            fs.rmSync(path.join(BACKUP_PATH, 'data.tar.gz.enc'), { force: true });
            fs.rmSync(RESTORE_TMP_PATH, { recursive: true, force: true });
        }
    }

    /**
     * Extrae archivos de un tar.gz
     */
    static extractFromTar(tarPath, outputDir, files = null) {
        return new Promise((resolve, reject) => {
            const extract = tar.extract();
            const readStream = fs.createReadStream(tarPath);

            extract.on('entry', (header, stream, next) => {
                const shouldExtract = !files || files.some(f => header.name.startsWith(f));

                if (shouldExtract) {
                    const outputPath = path.join(outputDir, header.name);
                    const dir = path.dirname(outputPath);

                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    if (header.type === 'directory') {
                        if (!fs.existsSync(outputPath)) {
                            fs.mkdirSync(outputPath, { recursive: true });
                        }
                        stream.resume();
                        next();
                    } else {
                        const writeStream = fs.createWriteStream(outputPath);
                        stream.pipe(writeStream);
                        writeStream.on('finish', next);
                        writeStream.on('error', reject);
                    }
                } else {
                    stream.on('end', next);
                    stream.resume();
                }
            });

            extract.on('finish', resolve);
            extract.on('error', reject);

            readStream
                .pipe(zlib.createGunzip())
                .pipe(extract);
        });
    }

    /**
     * Restaura una colección desde JSON
     */
    static restoreCollection(Model, inputPath, filename, mode) {
        return new Promise((resolve, reject) => {
            const filePath = path.join(inputPath, filename);

            if (!fs.existsSync(filePath)) {
                return resolve(); // Archivo no existe, skip
            }

            const JSONStream = require('JSONStream');

            if (mode === 'revert') {
                Model.deleteMany().then(() => {});
            }

            const documents = [];
            const readStream = fs.createReadStream(filePath);
            const jsonStream = JSONStream.parse('*');

            readStream.pipe(jsonStream);

            jsonStream.on('data', doc => {
                documents.push(doc);
            });

            jsonStream.on('end', async () => {
                try {
                    if (documents.length > 0) {
                        await Model.bulkWrite(documents.map(doc => ({
                            replaceOne: {
                                filter: { _id: doc._id },
                                replacement: doc,
                                upsert: true
                            }
                        })));
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            jsonStream.on('error', reject);
            readStream.on('error', reject);
        });
    }

    // ============================================
    // DELETE
    // ============================================

    /**
     * Elimina un backup
     */
    static async delete(slug) {
        const filename = await this.getFilenameBySlug(slug);
        const filePath = this.getFilePath(filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return { success: true };
        }

        throw { fn: 'NotFound', message: 'Backup file not found' };
    }
}

// Exportar constantes
BackupService.STATE = STATE;
BackupService.ALL_DATA = ALL_DATA;
BackupService.BACKUP_PATH = BACKUP_PATH;

module.exports = BackupService;