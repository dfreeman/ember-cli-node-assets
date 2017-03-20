# ember-cli-node-assets [![Build Status](https://travis-ci.org/dfreeman/ember-cli-node-assets.svg?branch=master)](https://travis-ci.org/dfreeman/ember-cli-node-assets) [![Ember Observer Score](https://emberobserver.com/badges/ember-cli-node-assets.svg)](https://emberobserver.com/addons/ember-cli-node-assets)

Incorporate stylesheets, images, globals-style scripts and other assets directly from npm packages into your Ember app or addon.

## Goals

Ember CLI makes it relatively simple for users to include files from Bower and in-repo `vendor` directories out of the box. To pull assets from an npm packages, though, requires a bit more elbow grease and understanding of the build and dependency system as a whole.

This addon aims to:
- provide a consistent means of including files from npm packages in both apps and addons
- ensure files included by addons are properly resolved (i.e. don't make assumptions about npm 2 vs 3 style layout)
- avoid forcing users to work directly with Broccoli plugins, while still allowing it when desired

## Usage

This addon allows you to add files from an npm package into an application's `public` and/or `vendor` trees at build time. Files in `public` will automatically be available in the final output in `dist/`, which is useful for assets like images or fonts. Files in `vendor` will be available to [`import()`](https://ember-cli.com/user-guide/#javascript-assets), allowing things like third party JavaScript or CSS to be built into the final output.

Configuration for ember-cli-node-assets goes in the options you pass to `EmberApp` in an app's `ember-cli-build.js`, or in an `options` hash in an addon's `index.js` export.

```js
// ember-cli-build.js for an application
let app = new EmberApp(defaults, {
  nodeAssets: {
    // node asset options
  }
});
```

```js
// index.js for an addon
module.exports = {
  name: 'my-addon',
  options: {
    nodeAssets: {
      // node asset options
    }
  }
};
```

## Module Configuration

Each key in the `nodeAssets` hash corresponds to the name of an npm package you want to include files from. At its core, what you're configuring is two funnels for pulling files from an npm package: one into `vendor` (for importing things like JS and CSS), and one into `public` (to expose things like fonts and images).

The configuration for `vendor` and `public` will be passed to [`broccoli-funnel`](https://github.com/broccolijs/broccoli-funnel#options) based in the root directory of the node package. The full range of options supported there are available if desired, but for most cases the three documented here are sufficient:

- `include`: An array of file paths (or globs) to be included.
- `srcDir`: The base directory relative to which `includes` are specified. Defaults to the root of the npm package.
- `destDir`: The directory in which the files will be placed. Defaults to the name of the package for `vendor`, and `'assets'` for `public`.

```js
'slick-carousel': {
  vendor: {
    srcDir: 'slick',
    destDir: 'slick-carousel',
    include: ['slick.js', 'slick.css', 'slick-theme.css']
  },
  public: {
    srcDir: 'slick',
    destDir: 'assets',
    include: ['ajax-loader.gif', 'fonts/*']
  }
}
```

```js
app.import('vendor/slick-carousel/slick.js');
app.import('vendor/slick-carousel/slick.css');
app.import('vendor/slick-carousel/slick-theme.css');
```

### Dynamic Configuration

If your required assets depend on runtime configuration (e.g. if you have an addon with configurable theme support), you may specify a function that returns a configuration hash.

```js
nodeAssets: {
  'some-node-module': function() {
    // Within this function, `this` refers to your app or addon instance
    return {
      vendor: {
        include: ['js/widget.js', `css/${this.addonOptions.theme}.css`]
      },
      public: {
        include: [`icons/${this.addonOptions.theme}/*.png`]
      }
    };
  }
}
```

For addons, you'll want to make sure this configuration is available before your base `included()` hook is invoked. For instance, you might do something like:

```js
included: function(parent) {
  this.addonOptions = parent.options && parent.options.myAddon || {};
  this.addonOptions.theme = this.addonOptions.theme || 'light';

  this._super.included.apply(this, arguments);

  this.import('vendor/some-node-module/js/widget.js');
  this.import(`vendor/some-node-module/css/${this.addonOptions.theme}.css`);
}
```

## Disabling Modules

If you have a module that you'd only like to include in certain situations, like an error reporting library you only want in production builds, you can include an `enabled` flag in the configuration for that model.

```js
nodeAssets: {
  'bug-reporter': function() {
    return {
      enabled: EmberApp.env() === 'production',
      vendor: {
        include: ['bug-reporter.js']
      }
    };
  }
}
```

```js
if (EmberApp.env() === 'production') {
  app.import('vendor/bug-reporter/bug-reporter.js');
}
```

## Modifying Included Files

If you wish to perform additional processing on a set of files before they're added to `vendor` or `public`, you can define a `processTree()` function to execute your Broccoli-fu. For instance, if you're importing a stylesheet and need to update relative paths where it references included assets, you might use something like [broccoli-postcss](https://github.com/jeffjewiss/broccoli-postcss):

```js
const BroccoliPostCSS = require('broccoli-postcss');

// ...

nodeAssets: {
  'some-lib': {
    public: {
      include: ['images/*.png']
    },
    vendor: {
      include: ['css/some-lib.css'],
      processTree(input) {
        return new BroccoliPostCSS(input, {
          plugins: [{
            module: require('postcss-url'),
            options: {
              url(originalURL) {
                return url.replace(/^\.\./, '.');
              }
            }
          }]
        });
      }
    }
  }
}
```

## Shorthand

Below are some shorthand configurations for common scenarios. Everything in this section is optional sugar that isn't required to use ember-cli-node-assets.

### Shared Source Directory Shorthand

If your `vendor` and `public` configurations share the same source directory within the package (e.g. `dist`), you can specify that once at the root of the hash for that package and avoid repeating it on each, e.g.

```js
'slick-carousel': {
  srcDir: 'slick',
  vendor: {
    include: ['slick.js', 'slick.css', 'slick-theme.css']
  },
  public: {
    include: ['ajax-loader.gif', 'fonts/*']
  }
}
```

### Include Shorthand

If the only piece of configuration you need to specify for a tree is the `include`, you can pass that array directly instead of nesting it. In combination with the shared `srcDir` shorthand above and the default `destDir` values for `vendor` and `public`, the configuration for Slick demonstrated at the top of this README could be shortened to:

```js
'slick-carousel': {
  srcDir: 'slick',
  vendor: ['slick.js', 'slick.css', 'slick-theme.css'],
  public: ['ajax-loader.gif', 'fonts/*']
}
```

### Import Shorthand

If you're including files in `vendor` just to `app.import` them later, you can specify an `import` key rather than a `vendor` one to automatically import them from the vendor directory. You can specify exactly the same options to `import` as you would specify to `vendor` (and the same shorthand options apply), with the exception that the `include` array cannot include globs.

The configuration below is equivalent to all other sample `slick-carousel` config in this README, except that no manual `app.import` calls are required. Notice that the `import` paths are relative to the package root, just as they are for `vendor`. When ember-cli-node-assets calls `import()` for you, it will automatically prefix the paths with `vendor/<destDir>/`.

```js
'slick-carousel': {
  srcDir: 'slick',
  import: ['slick.js', 'slick.css', 'slick-theme.css'],
  public: ['ajax-loader.gif', 'fonts/*']
}
```

Note that the import shorthand does not allow you to pass configuration to `import()` (e.g. `{ type: 'test' }` or an [anonymous AMD transform](https://github.com/ember-cli/rfcs/pull/55)). For situations like those, you'll need to specify `vendor` configuration and manually invoke `import()` instead.
