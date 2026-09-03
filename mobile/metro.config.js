const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Monorepo root is one level up from mobile/
const monorepoRoot = path.resolve(__dirname, "..");

const config = getDefaultConfig(__dirname);

// Allow Metro to watch the root node_modules (where hoisted packages live)
config.watchFolders = [monorepoRoot];

// Tell Metro to look in both mobile/node_modules and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
