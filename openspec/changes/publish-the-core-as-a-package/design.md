## Context

The repository is one package whose root holds the library, the command line and
the page. `package.json` already carries `exports`, `files: ["dist"]` and a `tsc`
build, so `npm pack` today produces a tarball containing `dist` and nothing else.
What is missing is not packaging but reach: nothing has ever been published, and
the package as it stands cannot be built against by a client-side application.

Two facts were established by running the tools rather than reasoning about them,
and both shape the decisions below.

A browser consumer cannot bundle the package. Building a file that imports
`sgf2text` with `esbuild --platform=browser` fails three times:

```
✘ Could not resolve "fs"              @sabaki/sgf/src/parse.js:1
✘ Could not resolve "buffer"          safer-buffer/safer.js:5
✘ Could not resolve "string_decoder"  iconv-lite/encodings/internal.js:49
```

None of it comes from this codebase, which contains no `node:` import at all. It
comes from the shape of `@sabaki/sgf`: CommonJS, so `main.js` loads `parse.js` and
`tokenize.js` unconditionally. `parse.js` requires `fs` on its first line and
dereferences it only inside `parseFile`; `tokenize.js` requires wrappers around
`iconv-lite` and `jschardet`, used only when decoding a buffer of unknown encoding.
This converter calls exactly one function from the library, `sgf.parse` on a
string, so none of those paths can execute. A bundler still has to resolve every
`require` it can reach, because a module graph is static where a call graph is not.

The package's types are already fine. A consumer project was typechecked against
the built `dist` on TypeScript 5.6 and on TypeScript 7, with `types: []` so no Node
globals could paper over a leak. Both pass, so the `.ts` specifiers that
`rewriteRelativeImportExtensions` leaves in the emitted declarations resolve
correctly and no declaration depends on `@types/node`.

## Goals / Non-Goals

**Goals:**

- One `npm install` makes the converter usable in another project, in Node and in
  the browser alike.
- The published surface is exactly what `src/index.ts` exports, and nothing else
  in the repository is a promise to anyone outside it.
- The page keeps being deployed to GitHub Pages, unchanged in what it does.
- A published version is traceable to the commit that produced it, with no
  long-lived credential stored in the repository.

**Non-Goals:**

- No change to any converted text, to the page or to the command line's behaviour.
- No replacement of `@sabaki/sgf`, however awkward its module shape.
- No CommonJS build. The package stays ESM.
- No second published package for the command line.
- No move of the page out of this repository.

## Decisions

### The repository becomes an npm workspace, with the library in a package of its own

`packages/sgf2text` holds `src`, `types`, `cli.ts`, its build scripts and the
library's tests. `web` becomes a private workspace package owning the page's tests
and depending on the library by name. The library declares `esbuild` itself, since
its browser build needs it. The root becomes `private: true`.

The alternative was to keep one package at the root and leave `web` as a plain
folder, which is less movement and equally correct about the tarball. It was
rejected for two reasons. The page's modules, tests and build would stay mixed into
the published package's directory and manifest, which makes the boundary a matter
of memory rather than structure; and `private: true` on a workspace root is a
mechanical guarantee that the wrong thing cannot be published, which no amount of
care in `files` gives.

Two published packages, splitting the command line out, was rejected: it doubles
the release ceremony for a tool that has no audience outside this repository.

### The page consumes the package by name, through its built output

The page's modules import `sgf2text` rather than a path into the library's
sources; npm links the workspace, and `exports` routes the import to the built
browser bundle. The page's own `prebuild` hook builds the library first, and root
`pretest` and `pretypecheck` hooks do the same for every command that reads the
built package, so the ordering cannot be forgotten.

The alternative was a `source` condition in `exports` pointing at `src/index.ts`,
letting esbuild read TypeScript directly and skipping `tsc` in the page's build.
It is faster and it is what a monorepo usually does. It was rejected because it
would make the page the one consumer that never exercises the published artefact.
Routing the page through `dist` means CI proves on every push that `exports`
resolves, that the browser build works, and that the bundle a stranger installs
converts a real game.

### The browser gets its own build, selected by the `browser` condition

`exports` maps `browser` to a self-contained bundle and leaves the default entry
pointing at the `tsc` output with its dependencies intact:

```
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "browser": "./dist/browser/index.js",
    "default": "./dist/index.js"
  }
}
```

The browser bundle is produced by esbuild with `fs`, `buffer`, `string_decoder`,
`iconv-lite` and `jschardet` aliased to an empty module — the same five aliases the
page carries today in its own build command, moved to the package that owns the
dependency. `iconv-lite` and `jschardet` are optional dependencies of
`@sabaki/sgf`, and its wrappers already require them inside `try`/`catch` with a
working fallback, so stubbing them is the path the parser itself provides rather
than a patch against it. `fs` is required without a guard but only dereferenced
inside `parseFile`, so an empty object is safe and a future version that touches it
at load time would fail loudly.

Stubbing the Node modules does not leave the bundle free of anyone else's code. It
inlines `@sabaki/sgf`, `@sabaki/go-board` and `doken`, all MIT, and MIT asks that
their copyright and permission notice travel with every copy. The build therefore
reads which packages it inlined from esbuild's metafile and prefixes the bundle with
each one's licence in a `/*! … */` comment. A notice kept in a separate file would
stay behind in the tarball; a legal comment is carried by the consumer's own bundler
into the application, which is where the code actually ends up. Deriving the list
from the metafile rather than naming the three packages means a dependency added
later cannot ship without its notice.

Bundling everything for every environment, leaving the package with no runtime
dependencies at all, was the main alternative. It is simpler to reason about and
nothing can diverge. It was rejected because it also vendors somebody else's code
into the tarball for Node consumers who do not need it: the dependency graph stops
being auditable and deduplicable, the MIT notices have to be carried by hand, and a
fix upstream reaches users only through a rebuild here. Keeping the Node path
honest is worth maintaining a second artefact.

Documenting the five aliases and leaving the consumer to apply them was rejected as
the worst of both: it works only for the reader who finds the note before giving up
on three unexplained build errors.

### One set of declarations serves both builds

`tsc` emits `dist/*.js` and `dist/*.d.ts`; esbuild emits `dist/browser/index.js`
only. `exports` lists `types` once, above the conditions, so both environments see
the same interface. This is sound because the two builds differ in how a dependency
is packaged, never in what this library exports.

### Release by trusted publishing on a GitHub release

A `publish.yml` workflow runs on a published release: install, test, build, then
`npm publish -w sgf2text --provenance` authenticating over OIDC, with
`id-token: write`. The flag is passed explicitly rather than trusted to be implied.
The workflow first checks that the release tag matches the version in
`package.json` and fails before publishing if they disagree, and it runs an npm of
at least 11.5.1, the first to publish over OIDC.

npm matches the publishing workflow against the package's `repository` field, so
the library's `package.json` keeps the repository URL and adds
`"directory": "packages/sgf2text"`, which is where the package now lives inside it.

Trusted publishing cannot make the first release. npm attaches a trusted publisher
only to a package that already exists on the registry, and has no way to reserve
one for a name not yet published. So `0.1.0` is published by hand from a
maintainer's machine, the trusted publisher is then registered against the existing
package, and every version after it goes through the workflow. Publishing a
placeholder `0.0.0` by hand and letting CI publish `0.1.0` would have kept
provenance on the first real version; it was rejected because the placeholder stays
on the registry for good, installable under the very name people are meant to use.

A stored `NPM_TOKEN` was the alternative; it works everywhere with no setup on
npmjs, at the cost of a long-lived credential in repository secrets and no
provenance. Publishing by hand was rejected because it leaves no record of what
built a given version.

## Risks / Trade-offs

- **Two builds of the same code could drift in behaviour, and only one of them is
  what most consumers run.** → A test converts the same fixture through the Node
  entry and through the browser bundle and asserts the two texts are identical. It
  fails the moment a stub changes an outcome.
- **The page could be built against a stale `dist` and pass CI while the sources
  are broken.** → The page's `prebuild` hook rebuilds the library; CI runs a clean
  checkout, so there is no stale output to inherit.
- **A future version of `@sabaki/sgf` could use `fs` at module load, breaking the
  browser build.** → The stub is an empty object, so such a version throws at load
  rather than misbehaving quietly, and the browser conversion test catches it in CI
  before it reaches the page.
- **The first version carries no provenance**, because it has to be published by
  hand before npm will accept a trusted publisher for the name. → Accepted as a
  one-time cost. Every later version is published by the workflow, and the manual
  steps are recorded as their own group in the tasks rather than left implicit.
- **Trusted publishing fails in ways that look alike**: an npm older than 11.5.1, a
  missing `id-token: write`, or a `repository` field that does not match what is
  registered on npmjs. → The workflow's test asserts the permission and the flag,
  the npm version is set in the workflow itself, and the `repository` field is part
  of the package task rather than something discovered on release day.
- **Moving files breaks tests that read other files by relative path**, in
  particular the one that reads `pages.yml` to check every published asset. → Those
  paths are updated with the move, and the tests themselves fail if they are not.
- **The workspace layout makes the first clone slightly less obvious**: `npm test`
  at the root now delegates to the workspaces. → The root README documents the
  layout, and the root scripts keep working from the root.

## Migration Plan

There are no consumers to migrate: nothing has been published, so the first
release is `0.1.0` and no interface promise is being broken. Within the repository
the order matters:

1. Move the library, its types, the command line and their tests into
   `packages/sgf2text`; move the page's tests into `web`. Every test must pass
   before anything else changes.
2. Split `package.json` into the three packages and wire the scripts, keeping the
   root commands working.
3. Add the browser build and the `browser` condition, with the tests that cover
   the tarball's contents and the equality of the two builds.
4. Switch the page to importing the package by name and delete the aliases from
   its build command.
5. Update both workflows, add `publish.yml`, split the README.
6. Publish `0.1.0` by hand from a maintainer's machine, logged in to npm with
   two-factor authentication.
7. Register this repository and `publish.yml` as the package's trusted publisher
   on npmjs.
8. Draw the next release through GitHub and confirm the workflow publishes it with
   provenance.

Rollback before step 6 is an ordinary revert. After publication a version cannot be
replaced, only superseded, which is the usual npm constraint and the reason only
the first version, which cannot avoid it, is published from a laptop.

## Open Questions

None. The layout, the command line's status, the browser strategy, the release
mechanism and the starting version were all settled before this document was
written.
