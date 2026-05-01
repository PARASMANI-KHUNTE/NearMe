import { createClient, RedisClientType } from 'redis';
import { logger } from '../logger/logger';
import { getRedisUri } from '../config';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  const redisUri = getRedisUri();

  redisClient = createClient({ url: redisUri }) as RedisClientType;

  redisClient.on('error', (err) => {
    logger.error({ err }, '❌ Redis Client Error');
  });

  redisClient.on('connect', () => {
    logger.info('✅ Redis Connected Successfully');
  });

  redisClient.on('reconnecting', () => {
    logger.warn('⚠️  Redis reconnecting...');
  });

  await redisClient.connect();
};

export const getRedis = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};
