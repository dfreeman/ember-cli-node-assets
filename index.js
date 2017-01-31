/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-cli-node-assets',

  included: function() {
    this._super.included.apply(this, arguments);
    this.performImports();
  },

  performImports: function() {
    var importer = this.import ? this : findHost(this);
    require('./lib/perform-imports')(importer, this.ui, this.getOptions());
  },

  treeForVendor: function() {
    return require('./lib/tree-for')(this.getOptions(), this.parent, ['vendor', 'import']);
  },

  treeForPublic: function() {
    return require('./lib/tree-for')(this.getOptions(), this.parent, ['public']);
  },

  getOptions: function() {
    if (!this._options) {
      var userOptions = this.app ? this.app.options : this.parent.options;
      this._options = normalizeUserOptions(userOptions && userOptions.nodeAssets || {});
    }
    return this._options;
  }
};

function normalizeUserOptions(options) {
  var normalizePackageConfig = require('./lib/normalize-package-config');
  return Object.keys(options).map(function(packageName) {
    return {
      name: packageName,
      config: normalizePackageConfig(packageName, options[packageName])
    };
  });
}

function findHost(addon) {
  var current = addon;
  var app;

  do {
    app = current.app || app;
  } while (current.parent.parent && (current = current.parent));

  return app;
}
