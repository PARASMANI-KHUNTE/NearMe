import mongoose from 'mongoose';
import { logger } from '../logger/logger';
import { getMongoUri } from '../config';

export const connectDB = async () => {
  try {
    const mongoUri = getMongoUri();
    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB Connected Successfully');

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, '❌ MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected');
    });
  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to MongoDB');
    process.exit(1);
  }
};
