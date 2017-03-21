'use strict';

var resolve = require('resolve');
var path = require('path');
var flatten = require('lodash/flatten');

var UnwatchedDir = require('broccoli-source').UnwatchedDir;
var MergeTrees = require('broccoli-merge-trees');
var Funnel = require('broccoli-funnel');

var debug = require('debug')('ember-cli-node-assets:tree-for');

/*
 * Given an array of package configuration objects, a parent app/addon relative to which those
 * packages should be resolved, and an array of which tree types should be included from each
 * package, returns a Broccoli tree.
 *
 * Each object in the packages array should have two keys:
 *  - name: the name of the npm package
 *  - config: package tree configuration function as returned by normalizePackageConfig
 */
module.exports = function treeFor(packages, parent, treeTypes) {
  var trees = packages.map(function(pkg) {
    var config = pkg.config();
    if (!config) { return; }

    return treeTypes.map(function(treeType) {
      return processedTree(parent, pkg.name, config[treeType]);
    });
  });

  return maybeMerge(flatten(trees).filter(Boolean), treeTypes);
};

function processedTree(parent, packageName, packageTreeOptions) {
  if (!packageTreeOptions) { return; }

  var tree = npmTree(parent, packageName, packageTreeOptions);
  if (packageTreeOptions.processTree) {
    tree = packageTreeOptions.processTree.call(parent, tree);
  }

  return tree;
}

function npmTree(parent, packageName, packageTreeOptions) {
  var packageRoot = path.dirname(resolve.sync(packageName + '/package.json', { basedir: parent.root }));
  var packageTree = new UnwatchedDir(packageRoot);

  debug('creating funnel for %s at %s %o', packageName, packageRoot, packageTreeOptions);

  return new Funnel(packageTree, packageTreeOptions);
}

function maybeMerge(trees, treeTypes) {
  if (trees.length === 1) {
    return trees[0];
  } else {
    return new MergeTrees(trees, { annotation: 'ember-cli-node-assets (' + treeTypes.join(', ') + ')'});
  }
}
