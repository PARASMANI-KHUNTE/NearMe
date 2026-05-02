const os = require('os');
const fs = require('fs');
const path = require('path');

const loadLocalEnv = () => {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return values;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return values;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');

      if (key) {
        values[key] = value;
      }

      return values;
    }, {});
};

const localEnv = loadLocalEnv();

const readConfigValue = (key) => {
  const value = process.env[key] || localEnv[key];
  const trimmed = value?.trim();

  return trimmed || undefined;
};

const expoConfig = {
  name: 'nearme',
  slug: 'nearme',
  version: '1.0.0',
  runtimeVersion: {
    policy: 'appVersion',
  },
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0F172A',
  },
  updates: {
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  scheme: 'nearme',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.parasmani.nearme',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
      backgroundColor: '#0F172A',
    },
    package: 'com.parasmani.nearme',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-secure-store',
    'expo-updates',
    'expo-font',
    'expo-web-browser',
  ],
  extra: {
    eas: {
      projectId: '39e48b99-60c0-4676-b094-68a2159c9460',
    },
  },
};
const baseSchemes = Array.isArray(expoConfig.scheme)
  ? expoConfig.scheme
  : expoConfig.scheme
    ? [expoConfig.scheme]
    : [];
const generatedSchemes = [
  ...baseSchemes,
  expoConfig.android?.package,
  expoConfig.ios?.bundleIdentifier,
].filter(Boolean);
const scheme = [...new Set(generatedSchemes)];

const isPrivateIpv4 = (address) =>
  /^10\./.test(address) ||
  /^192\.168\./.test(address) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(address);

const scoreInterface = ({ name, address }) => {
  let score = 0;
  const normalizedName = name.toLowerCase();

  if (/^192\.168\./.test(address.address)) score += 100;
  if (/^10\./.test(address.address)) score += 60;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(address.address)) score += 20;
  if (/wi-?fi|wlan|wireless|ethernet/.test(normalizedName)) score += 30;
  if (/vethernet|virtual|wsl|vmware|hyper-v|bluetooth/.test(normalizedName)) score -= 100;

  return score;
};

const getLocalServerIp = () => {
  const configuredIp = readConfigValue('EXPO_PUBLIC_SERVER_IP');
  if (configuredIp) {
    return configuredIp;
  }

  const networkInterfaces = os.networkInterfaces();
  const addresses = Object.entries(networkInterfaces)
    .flatMap(([name, values]) => (values ?? []).map((address) => ({ name, address })))
    .filter(({ address }) => {
      const isIpv4 = address.family === 'IPv4' || address.family === 4;
      return isIpv4 && !address.internal && isPrivateIpv4(address.address);
    })
    .sort((a, b) => scoreInterface(b) - scoreInterface(a));

  return addresses[0]?.address.address;
};

const mapsPluginConfig = [
  'react-native-maps',
  {
    androidGoogleMapsApiKey: readConfigValue('GOOGLE_MAPS_ANDROID_API_KEY'),
    iosGoogleMapsApiKey: readConfigValue('GOOGLE_MAPS_IOS_API_KEY'),
  },
];

const basePlugins = Array.isArray(expoConfig.plugins) ? expoConfig.plugins : [];
const pluginsWithoutMaps = basePlugins.filter((plugin) => {
  if (typeof plugin === 'string') {
    return plugin !== 'react-native-maps';
  }

  return Array.isArray(plugin) ? plugin[0] !== 'react-native-maps' : true;
});
const serverIp = getLocalServerIp() ?? expoConfig.extra?.serverIp;
const apiUrl = readConfigValue('EXPO_PUBLIC_API_URL');
const socketUrl = readConfigValue('EXPO_PUBLIC_SOCKET_URL');

module.exports = {
  expo: {
    ...expoConfig,
    ...(scheme.length ? { scheme } : {}),
    extra: {
      ...expoConfig.extra,
      ...(apiUrl ? { apiUrl } : {}),
      ...(socketUrl ? { socketUrl } : {}),
      ...(serverIp ? { serverIp } : {}),
    },
    plugins: [...pluginsWithoutMaps, mapsPluginConfig],
  },
};
