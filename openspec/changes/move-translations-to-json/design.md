## Context

`add-sgf-text-converter` ships two locales as TypeScript modules. Each exports an
object whose methods build strings: `move()`, `pass()`, `result()`, `handicap()`.
This works, and it put the renderer's own vocabulary at zero — but it means the
wording is code, and the assembly logic exists once per language. The drift is
already visible: Russian selects plurals with `Intl.PluralRules`, English with a
ternary.

The people best placed to judge this wording are blind players hearing it read
aloud, and translators. Neither should have to open a `.ts` file.

## Goals / Non-Goals

**Goals:**

- Wording lives in JSON: editable without reading code.
- One module holds all localisation logic.
- A missing translation fails the build, never reaches a reader as `undefined`.
- Adding a language is copy, translate, register.
- Byte-identical output: the existing tests pass untouched.

**Non-Goals:**

- Changing any wording. That is a separate decision, to be made with a real user.
- Adding a language. This change only makes it cheap.
- Runtime language files loaded over the network, or a translation platform.
- Localising the web page's own interface labels — that is the page's concern and
  can follow the same catalogue later.

## Decisions

### JSON, imported with an import attribute

`import ru from './ru.json' with { type: 'json' }`. Node supports it natively and
esbuild inlines it into the web bundle, so there is no build-time code generator
and no runtime file reading — the browser build stays a single file with no network
request, which the web page's privacy requirement depends on.

Alternatives considered: keeping `.ts` files that export plain objects (still code,
still needs a programmer's editor and a compiler in the loop), and YAML or PO files
(both need a parser dependency; PO would bring the gettext toolchain, which is a
sensible choice at fifty languages and overkill at two).

### Flat keys with named placeholders

Templates such as `move.plain` = `{n}. {color} {coordinate}`. Named rather than
positional, because word order differs between languages and a translator must be
free to move `{coordinate}` before `{color}`.

A missing placeholder value is an error, not an empty string: silently rendering
`. Чёрные` is the kind of failure a screen reader user cannot see and cannot
diagnose.

### Plural variants named by CLDR category

`captured.one`, `captured.few`, `captured.many`, chosen by `Intl.PluralRules`. The
categories a language actually uses come from the language, not from us: English
declares `one` and `other`, Russian declares `one`, `few`, `many` and `other`. The
completeness test checks each file against its own language's categories rather
than against a fixed list, otherwise adding a two-form language would demand three
identical forms.

### The key type comes from the translations

`type TranslationKey = keyof typeof ru` — one file is the reference. A typo in the
renderer then fails `tsc`, and the completeness test covers the other direction,
where a translation is missing a key the reference has.

## Risks / Trade-offs

- **JSON cannot hold logic, and some wording genuinely needs it** — Russian
  requires the genitive of a colour (`снято 2 камня белых`), which is a second form
  of the same word → keep colour names as their own keys per grammatical case
  (`color.black.nominative`, `color.black.genitive`) rather than deriving them in
  code. More keys, no grammar engine.
- **Import attributes are recent syntax** → both toolchains in use support them; CI
  runs the tests on Node 24 and 26, so a gap would fail the build rather than
  surface at runtime.
- **A refactor with no visible outcome can silently change output** → the existing
  test suite is the contract, and it must pass without edits. Any test that needs
  changing is evidence the refactor changed behaviour.
- **Flat keys grow unwieldy** at many languages or many strings → acceptable at
  this size; a nested structure can come later without changing the file format.

## Open Questions

- Should the web page's own labels move into the same catalogue, or keep their own?
  Bundling them means one file per language for everything; separating them keeps
  the library free of interface strings.
- Do we need a locale that falls back to another for missing keys, or is failing
  the build enough? Failing is stricter and, with two languages, probably right.
