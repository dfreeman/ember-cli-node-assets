'use strict';

var legacy = require('./legacy-stuff');

module.exports = function performImports(importer, ui, packages) {
  packages.forEach(function(pkg) {
    var config = pkg.config();
    if (!config || !config.import) { return; }

    if (legacy.hasImportsWithOptions(config.import)) {
      ui.writeDeprecateLine(
        '[ember-cli-node-assets] Defining complex imports inline is now deprecated. ' +
        'Instead, you can add the files to your `vendor` config for this package and ' +
        'import them explicitly. See the ember-cli-node-assets README for details.'
      );
      legacy.importPackageFilesWithOptions(importer, config.import);
    } else {
      importPackageFiles(importer, config);
    }
  });
}

function importPackageFiles(importer, config) {
  config.import.include.forEach(function(path) {
    importer.import('vendor/' + config.import.destDir + '/' + path);
  });
}
