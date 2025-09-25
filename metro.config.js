const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add react-native-reanimated web support
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-reanimated': 'react-native-reanimated',
};

// Add platform-specific file extensions for better module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
