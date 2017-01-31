'use strict';

var omit = require('lodash/omit');

// Helpers for dealing with (now-deprecated) import configuration with options inline

/*
 * Converts `include: [{ path: 'foo', ...options }]` into `include: ['foo']` with the
 * additional import options stashed in a side configuration array.
 */
module.exports.extractImportsWithOptions = function extractImportsWithOptions(treeConfig) {
  if (onlyStringImports(treeConfig)) { return; }

  treeConfig._importOptions = [];
  treeConfig.include = treeConfig.include.map(function(item) {
    if (item && item.path) {
      treeConfig._importOptions.push(omit(item, 'path'));
      return item.path;
    } else {
      treeConfig._importOptions.push({});
      return item;
    }
  });
};

/*
 * Checks for legacy import configuration stashed by `extractImportsWithOptions`
 */
module.exports.hasImportsWithOptions = function hasImportsWithOptions(treeConfig) {
  return '_importOptions' in treeConfig;
};

/*
 * Performs the requested imports for a given package, honoring their corresponding import options.
 */
module.exports.importPackageFilesWithOptions = function importPackageFilesWithOptions(importer, treeConfig) {
  treeConfig._importOptions.forEach(function(importOptions, index) {
    var importPath = 'vendor/' + treeConfig.destDir + '/' + treeConfig.include[index];
    importer.import(importPath, importOptions);
  });
};

function onlyStringImports(treeConfig) {
  return (treeConfig.include || []).every(function(include) {
    return typeof include === 'string';
  });
}
