/* jshint node: true */
'use strict';

var path = require('path');
var resolve = require('resolve');
var debug = require('debug')('ember-cli-node-assets');
var clone = require('lodash/clone');
var pick = require('lodash/pick');
var map = require('lodash/map');
var omit = require('lodash/omit');


var Funnel = require('broccoli-funnel');
var UnwatchedTree = require('broccoli-unwatched-tree');
var MergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'ember-cli-node-assets',

  included: function(parent) {
    this._super.included.apply(this, arguments);
    this.doImports();
  },

  doImports: function() {
    var app = this.app || this.parent.app;
    if (!app || !app.import) { return; }

    this.getModuleOptions().forEach(function(mod) {
      if (!mod.import) return;
      mod.import.include.forEach(function(item) {
        var fullPath = path.join('vendor', mod.import.destDir, item.path);
        var options = omit(item, 'path', 'sourceMap');
        debug('importing %s with options %o', fullPath, options);
        app.import(fullPath, options);
      });
    });
  },

  treeForVendor: function() {
    return treeFor('import', this.getModuleOptions(), this.parent);
  },

  treeForPublic: function() {
    return treeFor('public', this.getModuleOptions(), this.parent);
  },

  getModuleOptions: function() {
    // For dynamic module config, we need to re-evaluate each time because stuff like
    // Fastboot may perform multiple builds from a single command with different config.
    return this.getOptions().modules.map(function(mod) {
      return typeof mod === 'function' ? mod() : mod;
    }).filter(Boolean);
  },

  getOptions: function() {
    if (!this._options) {
      var options = this.app ? this.app.options : this.parent.options;
      this._options = normalizeOptions(this.parent, options && options.nodeAssets);
    }
    return this._options;
  }
};

function normalizeOptions(parent, options) {
  if (!options) { return { modules: [] }; }

  var modules = Object.keys(options).map(function(name) {
    var moduleOptions = options[name];
    if (typeof moduleOptions === 'function') {
      return function() {
        return normalizeModuleOptions(moduleOptions.call(parent), name);
      };
    } else {
      return normalizeModuleOptions(clone(moduleOptions), name);
    }
  });

  return { modules: modules };
}

function normalizeModuleOptions(moduleOptions, name) {
  if ('enabled' in moduleOptions && !moduleOptions.enabled) {
    debug('skipping disabled module %s', name);
    return;
  }

  return {
    name: name,
    import: normalizeFunnelOptions(moduleOptions, 'import', name),
    public: normalizeFunnelOptions(moduleOptions, 'public', 'assets')
  };
}

function normalizeFunnelOptions(options, key, defaultDestDir) {
  var normalized = options[key];
  if (!normalized) { return; }

  if (Array.isArray(normalized)) {
    normalized = { include: normalized };
  }

  normalized.include = normalized.include.map(function(item) {
    return typeof item === 'string' ? { path: item } : item;
  });

  if (options.srcDir && !normalized.srcDir) {
    normalized.srcDir = options.srcDir;
  }

  normalized.destDir = normalized.destDir || defaultDestDir;

  return normalized;
}

function treeFor(type, modules, parent) {
  var trees = collectModuleTrees(type, modules, parent);
  if (trees.length === 1) {
    return trees[0];
  } else if (trees.length > 1) {
    return new MergeTrees(trees, { annotation: 'ember-cli-node-assets (' + type + ')' });
  }
}

function collectModuleTrees(type, modules, parent) {
  return modules.filter(function(mod) {
    return mod[type];
  }).map(function(mod) {
    var tree = npmTree(mod.name, parent, mod[type]);
    if (mod[type].processTree) {
      tree = mod[type].processTree.call(parent, tree);
    }
    return tree;
  });
}

function npmTree(name, parent, options) {
  var root = path.dirname(resolve.sync(name + '/package.json', { basedir: parent.root }));
  var funnelOptions = pick(options, 'srcDir', 'destDir', 'include', 'exclude');
  funnelOptions.include = normalizeIncludes(funnelOptions.include);

  debug('adding tree for %s at %s %o', name, root, funnelOptions);
  return new Funnel(new UnwatchedTree(root), funnelOptions);
}

function normalizeIncludes(includes) {
  var result = [];

  includes.forEach(function(include) {
    result.push(include.path);
    if (include.sourceMap) {
      result.push(include.sourceMap);
    }
  });

  return result;
}
