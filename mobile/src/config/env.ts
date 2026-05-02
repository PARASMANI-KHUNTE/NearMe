import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface EnvConfig {
  API_BASE_URL: string;
  SOCKET_URL: string;
}

const readConfigValue = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed || null;
};

const extractHostFromUri = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
  const [host] = withoutProtocol.split(':');

  return host || null;
};

const getAutoDetectedHost = (): string | null => {
  const expoHostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost;

  return extractHostFromUri(expoHostUri);
};

const getDefaultHost = (): string => {
  const detectedHost = getAutoDetectedHost();
  if (detectedHost) {
    return detectedHost;
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return '127.0.0.1';
};

const getEnvConfig = (): EnvConfig => {
  const expoConfig = (Constants.expoConfig || Constants.manifest) as any;
  const configuredHost = extractHostFromUri(expoConfig?.extra?.serverIp);
  const autoDetectedHost = getAutoDetectedHost();
  const configuredApiUrl =
    readConfigValue(expoConfig?.extra?.apiUrl) ||
    readConfigValue(process.env.EXPO_PUBLIC_API_URL);
  const configuredSocketUrl =
    readConfigValue(expoConfig?.extra?.socketUrl) ||
    readConfigValue(process.env.EXPO_PUBLIC_SOCKET_URL);

  // 1. Prioritize explicit environment variables (e.g. from EAS or .env)
  if (configuredApiUrl && configuredSocketUrl) {
    return {
      API_BASE_URL: configuredApiUrl,
      SOCKET_URL: configuredSocketUrl,
    };
  }

  // 2. Prefer the host Metro already reached. This avoids stale LAN IPs in local dev.
  if (autoDetectedHost) {
    return {
      API_BASE_URL: `http://${autoDetectedHost}:3000/api`,
      SOCKET_URL: `http://${autoDetectedHost}:3000`,
    };
  }

  // 3. Fallback to app.config.js injected LAN IP for dev clients/standalone builds.
  if (configuredHost) {
    return {
      API_BASE_URL: `http://${configuredHost}:3000/api`,
      SOCKET_URL: `http://${configuredHost}:3000`,
    };
  }

  // 4. Final fallback to localhost/simulator
  const serverHost = getDefaultHost();
  return {
    API_BASE_URL: `http://${serverHost}:3000/api`,
    SOCKET_URL: `http://${serverHost}:3000`,
  };
};

// Create a proxy to lazy-evaluate the config on first access
export const env = new Proxy({} as EnvConfig, {
  get: (target, prop) => {
    const config = getEnvConfig();
    return (config as any)[prop];
  },
});
