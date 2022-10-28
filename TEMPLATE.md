# Template

TODO: You should delete this file after setting up your project.

_No poly-filling is performed during the library build process!_ When a library is consumed, the consumer must provide its own polyfills if necessary.

This template is pre-configured to build both a NodeJS version (commonjs requires) _and_ a Webpack version (tree-shakable imports).

Depending on what kind of library you're building, you may want to make some of the following changes.

## NodeJS support

- Add "node" to the [tsconfig.json](tsconfig.json) `types` array.
- Change `"node": false` to `"node": true` in [.eslint.cjs](.eslint.cjs).

## Browser support

- Add "DOM" to the [tsconfig.json](tsconfig.json) `lib` array.

## NodeJS ES Modules

- Switch the [ESLint](.eslintrc.cjs) `import/extensions` rule to `['error', 'ignorePackages']`.

At the time of this writing, TypeScript support for NodeJS native ES modules is incomplete at best. It's probably a good idea to wait on adopting them until TypeScript has officially released support.

However, you can use the `"type": "module"` package option if use import paths with `.js` extensions, _even when importing local `.ts` files!_ TypeScript will resolve the `.js` paths to `.ts` files during development.

For example, instead of the old TS import path:

```ts
import foo from './foo';
```

Use a JS path import:

```ts
import foo from './foo.js';
// Or, if foo is a directory...
import foo from './foo/index.js';
```
