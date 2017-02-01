'use strict';

var sinon = require('sinon');
var chai = require('chai'), expect = chai.expect;
var normalizePackageConfig = require('../lib/normalize-package-config');

describe('normalizePackageConfig', function() {
  it('passes through full funnel configuration untouched', function() {
    var optionsFn = normalizePackageConfig('test-pkg', null, {
      srcDir: 'joint-src-dir',
      destDir: 'joint-dest-dir',
      public: {
        srcDir: 'public-src-dir',
        destDir: 'public-dest-dir',
        include: ['foo']
      },
      vendor: {
        srcDir: 'vendor-src-dir',
        destDir: 'vendor-dest-dir',
        include: ['bar']
      },
      import: {
        srcDir: 'import-src-dir',
        destDir: 'import-dest-dir',
        include: ['baz']
      }
    });

    expect(optionsFn()).to.deep.equal({
      srcDir: 'joint-src-dir',
      destDir: 'joint-dest-dir',
      public: {
        srcDir: 'public-src-dir',
        destDir: 'public-dest-dir',
        include: ['foo']
      },
      vendor: {
        srcDir: 'vendor-src-dir',
        destDir: 'vendor-dest-dir',
        include: ['bar']
      },
      import: {
        srcDir: 'import-src-dir',
        destDir: 'import-dest-dir',
        include: ['baz']
      }
    });
  });

  it('passes through arbitrary additional configuration', function() {
    var optionsFn = normalizePackageConfig('test-pkg', null, {
      vendor: {
        foo: 'bar',
        baz: ['qux']
      }
    });

    expect(optionsFn()).to.deep.equal({
      vendor: {
        srcDir: '',
        destDir: 'test-pkg',
        foo: 'bar',
        baz: ['qux']
      }
    });
  });

  it('accepts a function returning configuration', function() {
    var parent = {};
    var configFn = sinon.spy(function() {
      return {
        srcDir: 'foo',
        vendor: ['test.js']
      };
    });

    var optionsFn = normalizePackageConfig('test-pkg', parent, configFn);

    expect(optionsFn()).to.deep.equal({
      srcDir: 'foo',
      vendor: {
        srcDir: 'foo',
        destDir: 'test-pkg',
        include: ['test.js']
      }
    });

    expect(configFn.thisValues.length).to.equal(1);
    expect(configFn.thisValues[0]).to.equal(parent);
  });

  describe('with legacy import configuration', function() {
    it('extracts import options to be dealt with later', function() {
      var optionsFn = normalizePackageConfig('test-pkg', null, {
        import: {
          include: [
            'bar.js',
            { path: 'foo.js', type: 'test' }
          ]
        }
      });

      expect(optionsFn()).to.deep.equal({
        import: {
          srcDir: '',
          destDir: 'test-pkg',
          include: ['bar.js', 'foo.js'],
          _importOptions: [{}, { type: 'test' }]
        }
      });
    });

    it('leaves non-import config alone', function() {
      var optionsFn = normalizePackageConfig('test-pkg', null, {
        vendor: {
          include: [{ path: 'foo.js', type: 'test' }]
        }
      });

      expect(optionsFn()).to.deep.equal({
        vendor: {
          srcDir: '',
          destDir: 'test-pkg',
          include: [{ path: 'foo.js', type: 'test' }]
        }
      });
    });
  });

  describe('with configuration gaps', function() {
    it('defaults to the package name for vendor/import destDir', function() {
      var optionsFn = normalizePackageConfig('test-pkg', null, {
        vendor: {
          include: ['foo'],
        },
        import: {
          include: ['bar']
        }
      });

      expect(optionsFn()).to.deep.equal({
        vendor: {
          include: ['foo'],
          srcDir: '',
          destDir: 'test-pkg'
        },
        import: {
          include: ['bar'],
          srcDir: '',
          destDir: 'test-pkg'
        }
      });
    });

    it('defaults to `assets` for the public destDir', function() {
      var optionsFn = normalizePackageConfig('test-pkg', null, {
        public: {
          include: ['foo']
        }
      });

      expect(optionsFn()).to.deep.equal({
        public: {
          srcDir: '',
          destDir: 'assets',
          include: ['foo']
        }
      });
    });

    it('treats plain arrays as shorthand for `include`', function() {
      var optionsFn = normalizePackageConfig('test-pkg', null, {
        srcDir: 'joint-src-dir',
        destDir: 'joint-dest-dir',
        public: ['foo'],
        vendor: ['bar'],
        import: ['baz']
      });

      expect(optionsFn()).to.deep.equal({
        srcDir: 'joint-src-dir',
        destDir: 'joint-dest-dir',
        public: {
          srcDir: 'joint-src-dir',
          destDir: 'joint-dest-dir',
          include: ['foo']
        },
        vendor: {
          srcDir: 'joint-src-dir',
          destDir: 'joint-dest-dir',
          include: ['bar']
        },
        import: {
          srcDir: 'joint-src-dir',
          destDir: 'joint-dest-dir',
          include: ['baz']
        }
      });
    });

    it('applies default srcDir/destDir options when funnel-specific ones are unspecified', function() {
      var optionsFn = normalizePackageConfig('test-pkg', null, {
        srcDir: 'joint-src-dir',
        destDir: 'joint-dest-dir',
        public: {
          include: ['foo']
        },
        vendor: {
          include: ['bar']
        },
        import: {
          include: ['baz']
        }
      });

      expect(optionsFn()).to.deep.equal({
        srcDir: 'joint-src-dir',
        destDir: 'joint-dest-dir',
        public: {
          srcDir: 'joint-src-dir',
          destDir: 'joint-dest-dir',
          include: ['foo']
        },
        vendor: {
          srcDir: 'joint-src-dir',
          destDir: 'joint-dest-dir',
          include: ['bar']
        },
        import: {
          srcDir: 'joint-src-dir',
          destDir: 'joint-dest-dir',
          include: ['baz']
        }
      });
    });
  });

  describe('with disabled packages', function() {
    it('returns nothing when no package config is given', function() {
      var optionsFn = normalizePackageConfig('test-pkg');

      expect(optionsFn()).to.equal(undefined);
    });

    it('returns nothing when explicitly disabled', function() {
      var optionsFn = normalizePackageConfig('test-pkg', null, {
        enabled: false,
        vendor: {
          include: ['foo', 'bar']
        }
      });

      expect(optionsFn()).to.equal(undefined);
    });

    it('returns nothing when the input function returns nothing', function() {
      var optionsFn = normalizePackageConfig('test-pkg', null, function() {});

      expect(optionsFn()).to.equal(undefined);
    });
  });
});
