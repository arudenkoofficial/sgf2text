## Context

SGF is the universal storage format for Go games, and it is unreadable by ear. A
blind player who saves a game from a server ends up with a file a screen reader
pronounces as noise, so the game cannot be replayed on a tactile board.

One converter exists: https://aigo.tokyo/sgf-txt, published by the Japan Go
Association for the Visually Impaired. Its client-side `sgf2txt.js` is open and was
analysed before this design. The conversion itself is four steps — `split(';')`,
`indexOf()` per root property, two lookup tables for coordinates, join with `<br>` —
and running it against crafted inputs showed the cost of that approach: it throws on
`B[]` (the modern encoding of a pass, which OGS emits), throws on a node holding
only `C[]`, drops the result when `indexOf('RE')` matches inside a player name such
as `PB[FREDDY]`, prints the handicap count while discarding the handicap stones, and
silently splices variation branches into the main line so that the reader is given a
game that was never played.

The two useful things it does have are a proven output structure — metadata block,
then one line per move — and evidence that blind players use exactly this shape. We
keep the shape and write our own implementation.

A second constraint comes from an existing sibling project: the OGS userscript
(`ogs-voice-assistant`) already speaks coordinates to the same audience during live
play, using `A-T` without `I` and rows counted from the bottom. The converter must
agree with it, or the same board would be described two different ways.

## Goals / Non-Goals

**Goals:**

- Convert any valid SGF into a numbered, spoken-language move list.
- Name the stones removed by each capturing move, so a physical board can be kept in
  sync with the record.
- Give handicap stone coordinates, not just a count.
- Support Russian, English and Japanese, each with the coordinate convention its
  readers expect.
- Ship one conversion core reused by a web page, a CLI and — later — the OGS
  userscript.
- Convert entirely on the client, so unpublished games are never uploaded anywhere.

**Non-Goals:**

- Reverse conversion (text to SGF). The Japanese site offers it; we defer it.
- Rendering comments (`C[]`) or variation branches in the output. They must not break
  conversion, but they are not part of the text.
- Integration with the OGS userscript. The API is shaped to allow it; the wiring is a
  separate change.
- Recognising board diagrams from PDF books. Separate problem, separate project.
- Scoring, territory estimation or any game analysis.

## Decisions

### Two phases: record, then render

`sgfToRecord` produces a language-free `GameRecord`; `render` turns it into text for
a locale. The alternative — building strings while walking the SGF tree, as the
Japanese converter does — is less code today and collapses under three languages:
every wording change would touch the parser, and tests would assert on prose instead
of structure. The split also gives the userscript a way to consume moves and captures
without any text at all, which is the whole reason `sgfToRecord` is public.

### `@sabaki/sgf` for parsing

SGF is a tree with escaping inside property values, not a delimited string. Every one
of the five defects listed above is a direct consequence of pretending otherwise.
`@sabaki/sgf` (MIT, used by the Sabaki editor) returns a proper node tree, which
eliminates that class of bug rather than patching its instances. Writing our own
parser was considered and rejected: it is the one part of this project where a mature
implementation already exists.

### `@sabaki/go-board` for captures

Captured stones cannot be read out of an SGF file; they follow from the rules. The
board library applies a move and returns the resulting position, handling groups,
edges and ko. We derive the captured vertices by comparing the position before and
after each move, rather than trusting a library-specific field to exist — a small
amount of code that keeps us independent of its internals.

### A locale owns its coordinate system

`Locale = { strings, coordinateSystem }`. Japanese blind players read `16の四`;
Russian and English readers need `Q16`. Treating locale as a dictionary of words only
would have forced a second, parallel switch on notation everywhere a vertex is
printed. The Japanese convention is taken from aigo.tokyo rather than from formal
tradition, on the grounds that their readers are already trained on it.

### Native TypeScript execution

Node runs `.ts` directly by stripping types, so development needs no build step:
`node cli.ts` and `node --test` work on the sources. The cost is that only erasable
syntax is allowed — no `enum`, no `namespace`, no constructor parameter properties —
because those require code generation. Colours are therefore the union `'B' | 'W'`,
which is better typing anyway. `tsc` still runs, but only to emit `dist/` and
declarations for npm consumers.

### Developed on Node 26, supports Node 24

`.nvmrc` pins 26.7.0, the newest release. `engines` allows `>=24` so the package
installs on the current LTS, and CI runs the matrix on both so the promise is tested
rather than asserted.

### CLI without a `bin` entry

The CLI is a plain script run as `node cli.ts`. Registering a global command would
mean shipping a compiled entry point and a shebang for a tool whose primary interface
is the web page.

### Main line only for variations

Variations are followed no further than the first branch. Rendering a tree as linear
speech has no obvious good answer, and getting it wrong the way the Japanese
converter does — silently presenting branches as continuations — is worse than
omitting them.

### Built-in test runner

`node --test` on `.ts` sources, no vitest or jest. The project has two runtime
dependencies; adding a test framework with a build pipeline would be the largest
thing in it.

## Risks / Trade-offs

- **`@sabaki/go-board` may not expose captures in the shape we expect** → derive them
  by diffing positions before and after each move; verify against a real captured
  group early, in the first implementation task, before the renderer is built on top.
- **Erasable-syntax rules are easy to violate accidentally** — an `enum` compiles fine
  under `tsc` but breaks `node cli.ts` → CI runs the tests through `node --test` on
  the raw sources, so any violation fails the build rather than surfacing at runtime.
- **The Japanese locale has no native reviewer on the team** → its convention is
  copied verbatim from aigo.tokyo and marked for confirmation with the association,
  which is also a natural first contact for collaboration.
- **The Russian wording is unvalidated** → the phrasing of move lines is a locale
  file, deliberately the cheapest thing in the project to change once a real user has
  heard it read aloud.
- **Main-line-only will disappoint anyone converting a book study** → documented in
  the README as a known limitation rather than discovered by a reader.
- **GitHub Pages requires the repository to stay public** → intended; the project is
  MIT and meant to be shared with other blind players' groups.

## Migration Plan

New project; nothing to migrate. Deployment is a GitHub Actions workflow publishing
the built page to Pages on every push to the default branch. Rollback is redeploying
the previous commit. npm publication is manual and deliberately not automated for the
first release.

## Open Questions

- Exact Russian phrasing of the move and capture lines — to be read aloud with a
  screen reader by a blind player before the wording is settled.
- Whether the capture line should also state the running capture count per player.
- Whether the metadata block should be skippable, so that a reader can jump straight
  to move 1.
- Whether comments (`C[]`) deserve a later opt-in flag for study material.
