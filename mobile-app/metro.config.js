const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

/**
 * Metro configuration for monorepos: force a single React/React Native copy
 * by restricting module resolution to the project's node_modules and the workspace root.
 */
const config = getDefaultConfig(__dirname);

const workspaceRoot = path.resolve(__dirname, '..');

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
  disableHierarchicalLookup: true,
};

module.exports = config;
