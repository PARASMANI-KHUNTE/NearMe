import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // Database
  MONGO_URI: z.string().url().default('mongodb://localhost:27017/nearme'),

  // Redis
  REDIS_URI: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(64, 'JWT_SECRET must be at least 64 characters. Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'),
  JWT_EXPIRES_IN: z.string().default('15m'), // Access token: 15 minutes
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'), // Refresh token: 7 days

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  ANDROID_GOOGLE_CLIENT_ID: z.string().optional(),
  IOS_GOOGLE_CLIENT_ID: z.string().optional(),

  // Email (SMTP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:8081'),
});

// Validate and parse environment variables
const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e: z.ZodIssue) => e.path.join('.'));
      console.error('Invalid environment variables:');
      missingVars.forEach((v: string) => console.error(`  - ${v}`));
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
};

export const config = validateEnv();

// Helper functions
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

export const getJwtSecret = (): string => {
  if (isTest) {
    return 'test-jwt-secret';
  }
  return config.JWT_SECRET;
};

export const getJwtExpiresIn = (): string => {
  return config.JWT_EXPIRES_IN;
};

export const getJwtRefreshExpiresIn = (): string => {
  return config.JWT_REFRESH_EXPIRES_IN;
};

export const getMongoUri = (): string => {
  return config.MONGO_URI;
};

export const getRedisUri = (): string => {
  return config.REDIS_URI;
};

export const getPort = (): number => {
  return parseInt(config.PORT, 10);
};

export const getRateLimitConfig = () => ({
  windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS, 10),
  maxRequests: parseInt(config.RATE_LIMIT_MAX_REQUESTS, 10),
});

export const getCorsOrigin = (): string[] => {
  return config.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);
};

export const getGoogleClientIds = () => ({
  web: config.GOOGLE_CLIENT_ID,
  android: config.ANDROID_GOOGLE_CLIENT_ID,
  ios: config.IOS_GOOGLE_CLIENT_ID,
});

export const getSmtpConfig = () => ({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT ? parseInt(config.SMTP_PORT, 10) : 587,
  user: config.SMTP_USER,
  pass: config.SMTP_PASS,
  from: config.SMTP_FROM || 'NearMe <noreply@nearme.app>',
});

export const isEmailConfigured = (): boolean => {
  return !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
};
