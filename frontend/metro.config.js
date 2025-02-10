const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Ensure Metro recognizes `.glb` files as assets
defaultConfig.resolver.assetExts.push('glb');

module.exports = defaultConfig;
