'use strict';

var clone = require('lodash/clone');
var legacy = require('./legacy-stuff');

/*
 * Given the name of a package and user-provided configuration for that package,
 * returns a function that will produce a standardized version of that configuration,
 * with `vendor`, `public` and `import` keys containing fully-specified Funnel
 * options (or nothing at all).
 */
module.exports = function normalizePackageConfig(packageName, parent, inputConfig) {
  return function() {
    var config = typeof inputConfig === 'function' ? inputConfig.call(parent) : clone(inputConfig);
    if (!config || ('enabled' in config && !config.enabled)) { return; }

    computeTreeConfig(config, 'vendor', packageName);
    computeTreeConfig(config, 'import', packageName);
    computeTreeConfig(config, 'public', 'assets');

    if (config.import) {
      legacy.extractImportsWithOptions(config.import);
    }

    return config;
  };
};

function computeTreeConfig(config, key, defaultDestDir) {
  if (!config[key]) { return; }
  var treeConfig = config[key];

  // Array shorthand for `include`
  if (Array.isArray(treeConfig)) {
    treeConfig = config[key] = { include: treeConfig };
  }

  // Default values for `srcDir` and `destDir`
  treeConfig.srcDir = treeConfig.srcDir || config.srcDir || '';
  treeConfig.destDir = treeConfig.destDir || config.destDir || defaultDestDir;
}
