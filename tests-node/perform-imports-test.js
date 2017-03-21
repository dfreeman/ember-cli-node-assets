'use strict';

var chai = require('chai'), expect = chai.expect;
var sinon = require('sinon');
var performImports = require('../lib/perform-imports');

describe('performImports', function() {
  var ui, importer;
  beforeEach(function() {
    ui = { writeDeprecateLine: sinon.spy() };
    importer = { import: sinon.spy() };
  });

  it('imports simple files', function() {
    var packages = [{
      name: 'some-package',
      config: () => ({
        import: {
          destDir: 'some-package',
          include: ['foo.js', 'bar/baz.js']
        }
      })
    }];

    performImports(importer, ui, packages);

    expect(ui.writeDeprecateLine.callCount).to.equal(0);
    expect(importer.import.callCount).to.equal(2);
    expect(importer.import.getCall(0).args).to.deep.equal(['vendor/some-package/foo.js']);
    expect(importer.import.getCall(1).args).to.deep.equal(['vendor/some-package/bar/baz.js']);
  });

  it('handles disabled packages', function() {
    var packages = [{
      name: 'some-package',
      config: () => {}
    }];

    performImports(importer, ui, packages);

    expect(ui.writeDeprecateLine.callCount).to.equal(0);
    expect(importer.import.callCount).to.equal(0);
  });

  it('handles legacy import config', function() {
    var packages = [{
      name: 'some-package',
      config: () => ({
        import: {
          destDir: 'some-package',
          include: ['foo.js'],
          _importOptions: [{ type: 'test' }]
        }
      })
    }];

    performImports(importer, ui, packages);

    expect(ui.writeDeprecateLine.callCount).to.equal(1);
    expect(importer.import.callCount).to.equal(1);
    expect(importer.import.getCall(0).args).to.deep.equal([
      'vendor/some-package/foo.js',
      { type: 'test' }
    ]);
  });
});
