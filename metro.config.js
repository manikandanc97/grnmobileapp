const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure .mjs is properly resolved
config.resolver.sourceExts.push('mjs');

module.exports = config;
