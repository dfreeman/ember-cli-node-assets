# ember-cli-node-assets [![Build Status](https://travis-ci.org/dfreeman/ember-cli-node-assets.svg?branch=master)](https://travis-ci.org/dfreeman/ember-cli-node-assets)

Incorporate stylesheets, images, globals-style scripts and other assets directly from node modules into your Ember app or addon.

## Usage

In an application's `ember-cli-build.js`:

```js
var app = new EmberApp(defaults, {
  nodeAssets: {
    // node asset options
  }
});
```

In an addon's `index.js`:

```js
module.exports = {
  name: 'my-addon',
  options: {
    nodeAssets: {
      // node asset options
    }
  }
}
```

## Module Configuration

Each key in the `nodeAssets` hash corresponds to the name of a node module you want to include assets from. For example, the dummy app in this repo uses [slick-carousel](https://github.com/kenwheeler/slick/) as a proof of concept and has the following configuration:

```js
nodeAssets: {
  'slick-carousel': {
    srcDir: 'slick',
    import: ['slick.js', 'slick.css', 'slick-theme.css'],
    public: ['ajax-loader.gif', 'fonts/*']
  }
}
```

Each key should contain a hash of the configuration for the corresponding module, with the options specified below. All configured paths are relative to that module's directory within the consuming app or addon's `node_modules` directory.

If your required assets depend on runtime configuration (e.g. if you have an addon with configurable theme support), you may specify a function that returns a configuration hash.

```js
nodeAssets: {
  'some-node-module': function() {
    return {
      import: ['js/widget.js'],
      public: ['css/widget-theme-' + this.config.theme + '.css']
    };
  }
}
```

### Imported Assets

Assets that should be imported into your app or addon's `vendor.js` or `vendor.css` can be configured via a hash under the `import` key. Options:

- `include`: an array of files that should be imported and concatenated into the served JS or CSS files. Each file may be:
   - a string representing the path to file that should be imported
   - a hash containing the following keys:
     - `path`: the location of the file (required)
     - `sourceMap`: the location of an existing sourceMap for that file (optional)
     - any other options to be specified to [`app.import`](http://ember-cli.com/user-guide/), like `type: 'test'` or `prepend: true` (optional)
- `srcDir` (optional): the source directory (relative to the module's directory) from which files should be included
- `processTree` (optional): a function to perform any necessary processing on the Broccoli tree containing the given files before they are imported

Note that you may pass an array of strings as the value for `import` instead of a hash as a shorthand for only specifying an `include` property, as in the usage example above.

### Public Assets

Assets that do not get built into the application itself but rather must be publicly available (e.g. images or webfonts) can be configured via a hash under the `public` key. Options:

- `include`: an array of strings representing the files to be included in the `public` directory. Note that unlike with imported files, these strings may be path globs
- `srcDir` (optional): the source directory (relative to the module's directory) from which files should be included
- `destDir` (optional): the location in `dist` where your public assets will be placed. Defaults to `assets`.
- `processTree` (optional): a function to perform any necessary processing on the Broccoli tree containing the given files before they are moved into `dist`

Note that you may pass an array of strings as the value for `public` instead of a hash as a shorthand for only specifying an `include` property, as in the usage example above.

### Shared Source directory

If your public and imported assets share a common source directory (e.g. `dist` or `build`), you may specify that as `srcDir` on the root configuration hash for the module, as in the usage example above.

### Disabling Modules

If you have a module that you'd only like to include in certain situations, like an error reporting library you only want in production builds, you can include an `enabled` flag in the configuration for that model.

```js
nodeAssets: {
  'bug-reporter': {
    enabled: EmberApp.env() === 'production',
    import: ['bug-reporter.js']
  }
}
```
