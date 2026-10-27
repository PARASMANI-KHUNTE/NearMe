import { createClient, RedisClientType } from 'redis';
import { logger } from '../logger/logger';
import { getRedisUri } from '../config';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  const redisUri = getRedisUri();

  redisClient = createClient({
    url: redisUri,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          return new Error('Max retries reached, stopping Redis reconnection.');
        }
        return Math.min(retries * 500, 2000);
      }
    }
  }) as RedisClientType;

  redisClient.on('error', (err) => {
    logger.error({ err }, '❌ Redis Client Error');
  });

  redisClient.on('connect', () => {
    logger.info('✅ Redis Connected Successfully');
  });

  redisClient.on('reconnecting', () => {
    logger.warn('⚠️  Redis reconnecting...');
  });

  try {
    await redisClient.connect();
  } catch (err) {
    logger.error({ err }, '❌ Failed to connect to Redis on startup. Running without Redis.');
  }
};

export { redisClient };

export const getRedis = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};
