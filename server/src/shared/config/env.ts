export const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const getJwtSecret = (): string => {
  if (process.env.NODE_ENV === 'test') {
    return process.env.JWT_SECRET || 'test-jwt-secret';
  }
  return requireEnv('JWT_SECRET');
};

