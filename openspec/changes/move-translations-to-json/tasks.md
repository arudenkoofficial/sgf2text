## 1. Catalogue format

- [ ] 1.1 Write a failing test asserting that every language file defines the same keys, naming the language and the missing key when it fails.
- [ ] 1.2 Write a failing test asserting that each language defines every plural category its own language uses, taken from `Intl.PluralRules(lang).resolvedOptions().pluralCategories`, not from a fixed list.
- [ ] 1.3 Write a failing test asserting that a template with an unsupplied placeholder raises an error naming the template and the placeholder, rather than emitting `{...}` or `undefined`.

## 2. Translations

- [ ] 2.1 Move the Russian wording into `src/locales/ru.json`: metadata labels, move and pass templates, capture and handicap templates, result phrasings, colour names in the cases the grammar needs, and plural variants by CLDR category.
- [ ] 2.2 Move the English wording into `src/locales/en.json` with the same key set.

## 3. The single localisation module

- [ ] 3.1 Implement `src/locales/index.ts`: import the JSON with `with { type: 'json' }`, interpolate named placeholders, select plural variants through `Intl.PluralRules`, and pair each language with its coordinate system.
- [ ] 3.2 Derive `TranslationKey` from one JSON file so a mistyped key fails `tsc`.
- [ ] 3.3 Delete `src/locales/ru.ts` and `src/locales/en.ts`, and adapt `src/locale.ts` to the catalogue-backed shape.
- [ ] 3.4 Run the whole existing suite unchanged and confirm every test passes — any test that needs editing means the output changed, which this refactor must not do.

## 4. Delivery

- [ ] 4.1 Confirm the web bundle still builds and still makes no network request, since the JSON must be inlined by esbuild rather than fetched.
- [ ] 4.2 Document in the README how to add a language: copy a JSON file, translate the values, register it with its coordinate system.
