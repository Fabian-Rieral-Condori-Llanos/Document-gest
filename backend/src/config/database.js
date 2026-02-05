const mongoose = require('mongoose');

/**
 * Configuración de Base de Datos MongoDB
 * 
 * Responsabilidades:
 * - Establecer conexión con MongoDB
 * - Configurar opciones de conexión
 * - Manejar eventos de conexión
 */

const config = require('./config.json');
const env = process.env.NODE_ENV || 'prod';

/**
 * Obtiene las opciones de conexión desde la configuración
 */
const getConnectionOptions = () => {
    if (config && config[env] && config[env].database && config[env].database.connectionOptions) {
        return config[env].database.connectionOptions;
    }
    return {};
};

/**
 * Obtiene la URI de conexión a MongoDB
 */
const getDbUri = () => {
     const defaultUri = 'mongodb+srv://fabian-DB-new:Qw7f9vH!p6GV9XW3GJFe@cluster0.oizwtoa.mongodb.net/discover?retryWrites=true&w=majority&appName=Cluster0';
//    const defaultUri = '';
    if (process.env.MONGODB_URI || defaultUri) {
        return process.env.MONGODB_URI || defaultUri;
    }

    const envConfig = config[env];

    if (!envConfig || !envConfig.database) {
        throw new Error(`Database configuration not found for environment: ${env}`);
    }

    const { server, port, name } = envConfig.database;

    return `mongodb://${server}:${port}/${name}`;
};

/**
 * Conecta a la base de datos MongoDB
 */
const connect = async () => {
    mongoose.Promise = global.Promise;
    mongoose.Schema.Types.String.set('trim', true);
    console.log('Connecting to database...', getDbUri());
    const uri = getDbUri();
    const options = getConnectionOptions();
    
    try {
        await mongoose.connect(uri, options);
        console.log('Database connection successful');
    } catch (err) {
        console.error('Database connection error:', err.message);
        throw err;
    }
};

/**
 * Desconecta de la base de datos
 */
const disconnect = async () => {
    try {
        await mongoose.disconnect();
        console.log('Database disconnected');
    } catch (err) {
        console.error('Error disconnecting from database:', err.message);
        throw err;
    }
};

/**
 * Verifica el estado de la conexión
 */
const isConnected = () => {
    return mongoose.connection.readyState === 1;
};

module.exports = {
    connect,
    disconnect,
    isConnected,
    getDbUri,
    getConnectionOptions
};
