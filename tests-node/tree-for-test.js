'use strict';

var Fixturify = require('fixturify');
var Fixture = require('broccoli-fixture');
var Funnel = require('broccoli-funnel');
var fs = require('fs-extra');
var chai = require('chai'), expect = chai.expect;
var chaiAsPromised = require('chai-as-promised'); chai.use(chaiAsPromised);

var treeFor = require('../lib/tree-for');

var PARENT_ROOT = 'package-fixtures';

describe('treeFor', function() {
  before(function() {
    Fixturify.writeSync(PARENT_ROOT, {
      node_modules: {
        foo: {
          'package.json': '',
          lib: {
            'foo-main.js': 'foo JS content',
            'foo-worker.js': 'foo JS worker content'
          }
        },
        bar: {
          'package.json': '',
          js: {
            'bar.js': 'bar JS content',
            'bar-plugin.js': 'bar JS plugin content'
          },
          css: {
            'bar.css': 'bar CSS content'
          },
          node_modules: {
            baz: {
              'package.json': '',
              'baz.js': 'baz JS content'
            }
          }
        }
      }
    });
  });

  after(function() {
    fs.removeSync(PARENT_ROOT);
  });

  it('funnels files from a given package', function() {
    var config = [{
      name: 'foo',
      config: () => ({
        vendor: {
          srcDir: 'lib',
          destDir: 'foo',
          include: ['foo-main.js']
        }
      })
    }];

    var tree = treeFor(config, { root: PARENT_ROOT }, ['vendor']);

    return expect(Fixture.build(tree)).to.eventually.deep.equal({
      foo: {
        'foo-main.js': 'foo JS content'
      }
    });
  });

  it('handles disabled packages', function() {
    var config = [{
      name: 'foo',
      config: () => {}
    }];

    var tree = treeFor(config, { root: PARENT_ROOT }, ['vendor']);

    return expect(Fixture.build(tree)).to.eventually.deep.equal({});
  });

  it('honors a configured processTree function', function() {
    var parent = { root: PARENT_ROOT };
    var config = [{
      name: 'foo',
      config: () => ({
        vendor: {
          srcDir: 'lib',
          destDir: 'foo',
          processTree(tree) {
            expect(this).to.equal(parent);
            return new Funnel(tree, {
              srcDir: 'foo',
              destDir: 'foo-renamed',
              include: ['foo-worker.js']
            });
          }
        }
      })
    }];

    var tree = treeFor(config, parent, ['vendor']);

    return expect(Fixture.build(tree)).to.eventually.deep.equal({
      'foo-renamed': {
        'foo-worker.js': 'foo JS worker content'
      }
    });
  });

  it('merges inputs across tree types and packages', function() {
    var config = [
      {
        name: 'foo',
        config: () => ({
          vendor: {
            srcDir: 'lib',
            include: ['foo-worker.js']
          },
          import: {
            srcDir: 'lib',
            include: ['foo-main.js']
          }
        })
      },
      {
        name: 'bar',
        config: () => ({
          vendor: {
            srcDir: 'js',
            include: ['bar.js', 'bar-plugin.js']
          }
        })
      }
    ]

    var tree = treeFor(config, { root: PARENT_ROOT }, ['vendor', 'import']);

    return expect(Fixture.build(tree)).to.eventually.deep.equal({
      'foo-main.js': 'foo JS content',
      'foo-worker.js': 'foo JS worker content',
      'bar.js': 'bar JS content',
      'bar-plugin.js': 'bar JS plugin content'
    });
  });

  it('resolves transitive dependencies that are hoisted', function() {
    var config = [{
      name: 'foo',
      config: () => ({
        vendor: {
          srcDir: 'lib',
          include: ['foo-main.js']
        }
      })
    }];

    var tree = treeFor(config, { root: PARENT_ROOT + '/node_modules/bar' }, ['vendor']);

    return expect(Fixture.build(tree)).to.eventually.deep.equal({
      'foo-main.js': 'foo JS content'
    });
  });

  it('resolves transitive dependencies that are nested', function() {
    var config = [{
      name: 'baz',
      config: () => ({
        vendor: {
          include: ['baz.js']
        }
      })
    }];

    var tree = treeFor(config, { root: PARENT_ROOT + '/node_modules/bar' }, ['vendor']);

    return expect(Fixture.build(tree)).to.eventually.deep.equal({
      'baz.js': 'baz JS content'
    });
  });

  it('does not resolve modules outside of scope', function() {
    var config = [{
      name: 'baz',
      config: () => ({
        vendor: {
          include: ['baz.js']
        }
      })
    }];

    expect(function() {
      treeFor(config, { root: PARENT_ROOT + '/node_modules/foo' }, ['vendor']);
    }).to.throw(/Cannot find module 'baz\/package.json'/);
  });
});
