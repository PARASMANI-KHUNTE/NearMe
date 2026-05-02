const os = require('os');

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
  const configuredIp = process.env.EXPO_PUBLIC_SERVER_IP?.trim();
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
    androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
    iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
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

module.exports = {
  expo: {
    ...expoConfig,
    ...(scheme.length ? { scheme } : {}),
    extra: {
      ...expoConfig.extra,
      ...(serverIp ? { serverIp } : {}),
    },
    plugins: [...pluginsWithoutMaps, mapsPluginConfig],
  },
};
