import mongoose from 'mongoose';
import { logger } from '../logger/logger';
import { getMongoUri } from '../config';

let connectionPromise: Promise<typeof mongoose> | null = null;

mongoose.set('bufferCommands', false);

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const mongoUri = getMongoUri();
      const opts = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      };

      await mongoose.connect(mongoUri, opts);
      logger.info('✅ MongoDB Connected Successfully');
      return mongoose;
    } catch (error) {
      connectionPromise = null;
      logger.error({ error }, '❌ Failed to connect to MongoDB');
      throw error;
    }
  })();

  return connectionPromise;
};

mongoose.connection.on('error', (err) => {
  logger.error({ err }, '❌ MongoDB connection error');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB disconnected');
  connectionPromise = null;
});
