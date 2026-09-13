## Why

A blind player does not read a game in one place. She reads it on a server, in a
client, in whatever her club sends her; and each of those is somebody else's
program. This converter reaches her only through a page she has to visit, because
the only way for another program to reuse it is to clone a repository and wire the
sources in by hand. Every author who might have added spoken game records to a tool
she already uses would first have to reimplement capture replay, which is the part
that is easy to get wrong and impossible for her to audit.

Publishing the core makes the answer to "can your app read this game out?" a single
install. The page stays exactly where it is; it simply stops being the only place
the converter can be used from.

## What Changes

- The repository becomes an npm workspace: the converter lives in
  `packages/sgf2text` and is what gets published, the page lives in `web` and is
  private. The root package becomes private, so the page can never be published by
  mistake.
- The package ships a browser build alongside the Node one, selected through the
  `browser` condition in `exports`. `@sabaki/sgf` is CommonJS and requires `fs`,
  `iconv-lite` and `jschardet` at module load, which no bundler can resolve for the
  browser, so a client-side consumer cannot build against the package today. The
  browser build stubs them, which costs nothing: the converter calls
  `sgf.parse(string)` and never reaches the file or buffer entry points those
  modules serve.
- The page stops aliasing those modules in its own build command and consumes the
  published browser build under the package's own name. The workaround moves to the
  package that owns the dependency, and the page becomes the first consumer of the
  artefact every other client-side consumer will get.
- The command line stays a tool of this repository. It moves with the sources to
  `packages/sgf2text/cli.ts` and stays out of the tarball, so the flags it offers
  are not a promise to anyone outside.
- A release workflow publishes the package on a GitHub release through npm's
  trusted publishing, so no token is stored in the repository and every published
  version carries provenance back to the commit that built it.
- The GitHub Pages deployment keeps publishing the page, with the library built
  before the page that consumes it.
- **No output changes.** Nothing about a converted game, the page or the command
  line reads differently afterwards.

## Capabilities

### New Capabilities
- `published-package`: what the npm package contains and promises — its entry
  point, the environments it works in, what is deliberately left out of the
  tarball, and how a version reaches the registry.

### Modified Capabilities
- `cli-converter`: the command moves to `packages/sgf2text/cli.ts`, and the reason
  it is not a `bin` entry is now recorded as the package boundary rather than a
  preference.

## Impact

- `package.json` splits in three: a private workspace root, the published package,
  and a private `web` package holding the page's own build dependencies.
- `src`, `types`, `cli.ts` and the library's tests move under `packages/sgf2text`;
  the page's tests move under `web`. Fixtures travel with the tests that read them.
- `web/main.ts` imports `sgf2text` by name instead of reaching into `../src`. The
  shims in `web/shims` move into the package's browser build.
- `.github/workflows/ci.yml` runs the workspaces; `.github/workflows/pages.yml`
  gains a library build before the page build. A new `publish.yml` is added.
- `test/published-assets.test.ts` reads `pages.yml` by relative path and follows
  its move.
- The README splits: the package carries the one a consumer reads on npm, the root
  keeps the repository's own, including everything about the page.
- One-off manual step outside the repository: registering this repository as a
  trusted publisher for the package on npmjs, which cannot be done from code.
