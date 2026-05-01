const appJson = require('./app.json');

const expoConfig = appJson.expo ?? {};

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

module.exports = {
  expo: {
    ...expoConfig,
    plugins: [...pluginsWithoutMaps, mapsPluginConfig],
  },
};
