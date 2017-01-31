## 0.2.0-beta.1 (January 31, 2017)
### Added
- Users can now specify `vendor` configuration to funnel files into the vendor tree without implicitly importing anything.

### Changed
- Documentation has been updated to encourage thinking primarily in terms of funneling files from an npm package into `vendor` and/or `public`. Importing specific files (while still possible), is now presented as a simple shorthand for funneling those files into `vendor` and then importing them explicitly.
- When operating on behalf of a nested addon, in the past ember-cli-node-assets would short circuit and do nothing. This forced addons that depended on others using ember-cli-node-assets (e.g. ember-shepherd -> ember-tether -> ember-cli-node-assets) to either declare them as `peerDependencies` or add a blueprint to make sure there upstream dependencies were installed in the parent application.

  As of this release, ember-cli-node-assets will now operate regardless of the level of nesting. This is motivated by a desire to avoid forcing `peerDependencies` or installation blueprints, and by a [change in `import` behavior](https://github.com/ember-cli/ember-cli/pull/6603) in the upcoming Ember CLI 2.12.

### Deprecated
- Specifying complex import configuration e.g. `import: [{ path: 'foo', type: 'test' }]` is now deprecated. Instead, use `vendor` configuration (see above) and call `app.import` with the additional options explicitly.
