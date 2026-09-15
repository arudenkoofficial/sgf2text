## ADDED Requirements

### Requirement: What the package contains

The published tarball SHALL contain the built library, its type declarations and
the files npm needs to describe it, and SHALL NOT contain the page, the command
line, the tests, the fixtures or the TypeScript sources.

What ships is a promise. A file that reaches a consumer's disk is a file somebody
can come to depend on, whether or not it was meant as an interface, so the tarball
holds the built interface and nothing that happens to live beside it.

#### Scenario: Packing the package

- **WHEN** the package is packed
- **THEN** the file list contains the built output and its declarations, together
  with `package.json`, the README and the licence

#### Scenario: The repository stays behind

- **WHEN** the package is packed
- **THEN** no file from the page, no test, no fixture, no `.ts` source and no
  command-line entry point appears in the list

#### Scenario: No map leads to a missing source

- **WHEN** the package is packed, including from a checkout that has been built
  before
- **THEN** no source map appears in the list, since the sources a map would lead to
  are not published

### Requirement: The public interface

The package SHALL expose what `src/index.ts` exports, under the package name, with
type declarations included. A consumer SHALL NOT need to install a companion types
package, and the declarations SHALL NOT require Node's own types to be present.

#### Scenario: A consumer converts a game

- **WHEN** a project installs the package and imports `sgfToText` by the package
  name
- **THEN** it converts an SGF string to text, with no relative path into the
  package's internals

#### Scenario: Types arrive with the package

- **WHEN** a TypeScript project typechecks a file importing the package, with no
  Node types configured
- **THEN** the types resolve and the check passes

### Requirement: Usable from a browser

The package SHALL provide a build that a client-side bundler can resolve without
Node built-ins, selected through the `browser` condition of its exports. The
converter itself SHALL keep containing no import of a Node module.

`@sabaki/sgf` is CommonJS: loading it pulls in `fs`, and the optional `iconv-lite`
and `jschardet`, through requires that sit at module top level even though only its
file and buffer entry points use them. This converter calls `sgf.parse` on a string
and reaches none of them, so the browser build stubs those modules rather than
polyfilling machinery nothing executes.

#### Scenario: Bundling for the browser

- **WHEN** a file importing the package is bundled for the browser
- **THEN** the bundle is produced with no unresolved module, and in particular
  without needing `fs`, `buffer`, `string_decoder`, `iconv-lite` or `jschardet` to
  be supplied by the consumer

#### Scenario: The two builds agree

- **WHEN** the same game is converted through the package's Node entry and through
  its browser build
- **THEN** both produce identical text

#### Scenario: Licences travel with the inlined code

- **WHEN** the browser build is read
- **THEN** it carries the copyright and permission notice of every third-party
  package it inlines, in a comment a consumer's bundler preserves

### Requirement: An honest dependency graph for Node

The Node build SHALL keep its parsing and board dependencies as declared
dependencies rather than copying them into its own output, so that they can be
audited, deduplicated and updated by the consumer.

#### Scenario: Dependencies are declared, not absorbed

- **WHEN** the package is installed in a Node project
- **THEN** the parser and board libraries appear in the dependency tree as
  packages of their own

### Requirement: The page runs the published build

No file of the page SHALL import the converter by a path into the library's
sources. The page SHALL consume the package by name, so that what the page is
tested with is what a consumer installs.

The page is the only consumer under this repository's control. Letting it reach
into the sources would leave the published artefact untested by anything until a
stranger tried it.

#### Scenario: The page imports by name

- **WHEN** the page's modules are searched for how they reach the converter
- **THEN** every one of them imports the package by its name, and none reaches
  outside the page's own directory into the library

#### Scenario: The page converts through the browser build

- **WHEN** the page is built
- **THEN** the converter it bundles is the package's browser build, and the built
  page converts a game

### Requirement: Nothing but the library reaches the registry

The workspace root and the page SHALL be marked private, so that publishing
anything other than the library fails rather than succeeding quietly.

#### Scenario: Publishing the wrong package

- **WHEN** a publish is attempted for the workspace root or for the page
- **THEN** it is refused

### Requirement: How a version is published

Every version after the first SHALL reach the registry only from the repository's
own automation, on a published release, authenticating without a credential stored
in the repository, and carrying provenance linking the published version to the
commit that built it. The automation SHALL refuse to publish when the release tag
and the version in `package.json` disagree.

The first version is the one exception, and it is forced rather than chosen: npm
attaches a trusted publisher only to a package that already exists, so the name has
to be claimed once by hand before the automation can be allowed to publish it.

#### Scenario: A release publishes the package

- **WHEN** a release is published
- **THEN** the workflow installs, tests and builds, then publishes the package with
  provenance

#### Scenario: Tag and version disagree

- **WHEN** the release tag names a version other than the one in `package.json`
- **THEN** the workflow fails before publishing anything

#### Scenario: No standing credential

- **WHEN** the publishing workflow is read
- **THEN** it authenticates through the workflow's own identity, and no
  registry token is stored in the repository's secrets

#### Scenario: The first version

- **WHEN** the package does not yet exist on the registry
- **THEN** its first version is published by hand, the trusted publisher is then
  registered against the existing package, and every later version comes from the
  workflow
