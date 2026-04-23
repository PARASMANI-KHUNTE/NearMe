import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../logger/logger';

dotenv.config();

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nearme';
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
