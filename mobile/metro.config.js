const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom configuration here
config.resolver.blockList = [
  /.*\\node_modules\\expo-modules-core\\android\\\.cxx\\.*/,
];

module.exports = config;
