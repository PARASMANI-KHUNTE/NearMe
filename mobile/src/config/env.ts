import Constants from 'expo-constants';

interface EnvConfig {
  API_BASE_URL: string;
  SOCKET_URL: string;
}

const getEnvConfig = (): EnvConfig => {
  const { manifest } = Constants;

  // For Expo, environment variables can be set in app.json or .env files
  // In development, use localhost/tunnel, in production use deployed URL
  const isDevelopment = __DEV__;

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
    (isDevelopment ? 'http://192.168.1.8:3000/api' : 'https://your-production-api.com/api');
 
  const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 
    (isDevelopment ? 'http://192.168.1.8:3000' : 'https://your-production-api.com');

  return {
    API_BASE_URL,
    SOCKET_URL,
  };
};

export const env = getEnvConfig();