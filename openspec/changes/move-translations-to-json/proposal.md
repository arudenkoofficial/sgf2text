## Why

Each language is currently a TypeScript module: wording, plural logic and string
assembly live together in `src/locales/ru.ts` and `src/locales/en.ts`. That makes a
translation something only a programmer can supply, and it duplicates the same
assembly logic once per language — the second copy already drifted, since Russian
plurals go through `Intl.PluralRules` while English uses an inline conditional.

The wording of this tool is the part most likely to change, and the part least
likely to be changed by a programmer: it has to be judged by ear, by blind players
listening to it through a screen reader. It should be data they, or a translator,
can edit without touching code.

## What Changes

- Translations move into JSON files, one per language, holding only wording.
- Exactly one module carries the localisation logic: placeholder interpolation,
  plural selection and the pairing of a language with its coordinate system.
- Plural forms are spelled by CLDR category, so `Intl.PluralRules` chooses the form
  for every language rather than each locale reimplementing the rule.
- A test asserts that all locale files carry identical key sets, so a forgotten
  translation fails the build instead of being read aloud as `undefined`.
- Adding a language becomes: copy a JSON file, translate the values, register it.
- **No output changes.** Every existing test must pass untouched; this refactor is
  invisible to anyone reading a converted game.

## Capabilities

### New Capabilities
- `translation-catalogue`: how translations are stored, validated and interpolated,
  and what it takes to add a language.

### Modified Capabilities

None. `text-rendering` keeps its requirements: what the output says is unchanged,
only where the words are kept.

## Impact

- `src/locales/ru.ts` and `src/locales/en.ts` are replaced by `ru.json`, `en.json`
  and a single loader module.
- JSON is imported with `with { type: 'json' }`, which both Node and esbuild accept,
  so the web bundle keeps working without a build-time code generator.
- Depends on the `add-sgf-text-converter` change being implemented first: this
  refactors what that change builds.
