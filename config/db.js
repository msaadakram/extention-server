const mongoose = require('mongoose');
const pino = require('pino');

const logger = pino({ name: 'db' });

const MONGODB_URI = process.env.MONGODB_URI;

// Serverless-safe connection cache on globalThis
const globalWithMongoose = globalThis;

if (!globalWithMongoose.__ucpMongooseCache) {
    globalWithMongoose.__ucpMongooseCache = {
        conn: null,
        promise: null
    };
}

const mongooseCache = globalWithMongoose.__ucpMongooseCache;

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected, clearing cache');
    mongooseCache.conn = null;
    mongooseCache.promise = null;
});

mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
});

async function connectDB() {
    // Return existing connection if ready
    if (mongoose.connection.readyState === 1 && mongooseCache.conn) {
        return mongooseCache.conn;
    }

    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not configured');
    }

    // If not currently connecting, start a new connection
    if (!mongooseCache.promise || mongoose.connection.readyState === 0) {
        logger.info('Initiating MongoDB connection');
        mongooseCache.promise = mongoose
            .connect(MONGODB_URI, {
                maxPoolSize: 5,
                minPoolSize: 0,
                maxIdleTimeMS: 20000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 20000,
                serverSelectionTimeoutMS: 10000
            })
            .then((mongooseInstance) => {
                mongooseCache.conn = mongooseInstance;
                logger.info('MongoDB connected successfully');
                return mongooseInstance;
            })
            .catch((err) => {
                mongooseCache.promise = null;
                logger.error({ err }, 'MongoDB connection failed');
                throw err;
            });
    }

    return mongooseCache.promise;
}

module.exports = { connectDB };
