## 1. The workspace

- [x] 1.1 Write a failing test asserting the layout: the workspace root is private and declares its workspaces, the library package is not private, and the page package is private.
- [x] 1.2 Create `packages/sgf2text/package.json` and `web/package.json`, and turn the root into a private workspace root. `esbuild` moves to the page's dev dependencies; the parser and board stay dependencies of the library.
- [x] 1.3 Move `src`, `types`, `cli.ts` and the library's tests, fixtures included, into `packages/sgf2text`. Run the whole suite and confirm every test passes with no edit to what it asserts.
- [x] 1.4 Move the page's tests into `web/test`, correcting the relative paths they use to reach the page's modules and `pages.yml`. Confirm the test that reads the deploy workflow still fails when an asset is missing from it.
- [x] 1.5 Wire the root scripts to the workspaces so `npm test`, `npm run typecheck`, `npm run typecheck:web`, `npm run build` and `npm run build:web` all still work from the root.

## 2. What the package contains

- [x] 2.1 Write a failing test that packs the library package and asserts the file list: the built output, its declarations, `package.json`, the README and the licence, and nothing else — no source, no test, no fixture, no command line, no page.
- [x] 2.2 Set `files`, `exports`, `engines` and the metadata on the library package, with `repository` keeping the repository URL and adding `"directory": "packages/sgf2text"`, since npm matches trusted publishing against it. Place the package's own README and a copy of the licence inside the package directory, since npm takes both from there rather than from the repository root.
- [x] 2.3 Write a failing test that imports the package by name rather than by path and converts a fixture, proving `exports` resolves through the workspace link.
- [x] 2.4 Write a failing test asserting that no source map is packed, including maps an earlier build left in `dist`.
- [x] 2.5 Stop emitting source and declaration maps, and make the library's build start from an empty `dist`, since `tsc` never removes what an earlier build wrote.

## 3. The browser build

- [x] 3.1 Write a failing test that bundles a file importing the package for the browser and asserts the bundle is produced with no unresolved module.
- [x] 3.2 Write a failing test that converts the same fixture through the Node entry and through the browser build and asserts the two texts are identical.
- [x] 3.3 Write a failing test asserting that the browser bundle carries the copyright and permission notice of every third-party package it inlines, in a comment a consumer's bundler preserves.
- [x] 3.4 Move `web/shims/node-empty.js` into the library package and add the build step that emits the browser bundle with the five aliases, prefixed by the licence notices of the packages the bundle actually inlines, taken from the bundler's own record of its inputs. Declare `esbuild` as a dev dependency of the library, and add the `browser` condition to `exports` above the default entry.

## 4. The page consumes the package

- [x] 4.1 Write a failing test asserting that no file under `web` reaches the converter by a relative path into the library.
- [x] 4.2 Point `web/main.ts` at the package name, drop the five aliases from the page's build command, and add the step that builds the library before the page.
- [x] 4.3 Build the page and confirm the existing page tests pass unchanged, including the ones covering conversion, saving and the language chain.

## 5. Delivery

- [x] 5.1 Write a failing test that reads the publishing workflow and asserts it runs on a published release, checks the release tag against the version in `package.json` before publishing, requests the identity token, publishes with `--provenance`, and names no registry secret. The tag check itself lives in a script and is tested by running it with matching, mismatching and missing tags.
- [x] 5.2 Add `.github/workflows/publish.yml` and the tag-check script implementing exactly that, publishing only the library package with an npm of at least 11.5.1.
- [x] 5.3 Update `ci.yml` to run the workspaces, and `pages.yml` to build the library before the page. Confirm the asset test still reads the deploy step correctly.
- [x] 5.4 Split the README: a consumer's one inside the package covering installation, the interface, both environments and the languages; the repository's one at the root keeping the page, the layout and the development commands.

## 6. First release (by hand, outside the repository)

- [x] 6.1 With the change merged, log in to npm on a maintainer's machine with two-factor authentication enabled, and publish `0.1.0` of the library package by hand. npm cannot attach a trusted publisher to a package that does not exist yet, so the first version cannot come from the workflow.
- [ ] 6.2 On npmjs, in the package's settings, register this repository and `publish.yml` as its trusted publisher.
- [ ] 6.3 Draw the next release through GitHub and confirm the workflow publishes it and the version on npmjs shows provenance.
