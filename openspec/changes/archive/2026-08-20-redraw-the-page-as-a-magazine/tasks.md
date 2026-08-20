## 1. Choose the design

- [x] 1.1 Draft three whole-page directions and render them, rather than describing
      them: goban grid, Swiss grid, book-on-Go
- [x] 1.2 Draft the chosen direction in three palettes and render those too, in
      Russian, so bold Cyrillic could be judged rather than assumed
- [x] 1.3 Settle on the night edition, quietened: Rubik, a herb-green accent, no
      uppercase and no cover-scale type

## 2. Ship the typefaces

- [x] 2.1 Download Rubik and JetBrains Mono as variable `.woff2`, Latin and
      Cyrillic subsets, into `web/fonts`
- [x] 2.2 Confirm each file is variable rather than static (an `fvar` table),
      so the weights are real and not synthesised
- [x] 2.3 Declare them with `@font-face` and `unicode-range`, `font-display: swap`
- [x] 2.4 Preload the Latin subsets only, with `crossorigin`

## 3. Redraw the page

- [x] 3.1 Masthead: the name against the language chooser, aligned on baselines
- [x] 3.2 Opening block on the left kerb, above the grid
- [x] 3.3 Two departments on one shared `--col` track, each with a numeral and a
      heading
- [x] 3.4 Palette as tokens, with `--accent`/`--alert` and `--rule`/`--edge` split
- [x] 3.5 Light scheme as a true inversion, with the accent inverted rather than
      lightened
- [x] 3.6 `theme-color` for both schemes matching what the page paints

## 4. Keep the page usable

- [x] 4.1 Add `subtitle` and `inputHeading` to the string catalogue in both
      languages, and wire them in `main.ts`
- [x] 4.2 Hide the department numerals from assistive technology
- [x] 4.3 Move the status line into the input's department
- [x] 4.4 Scope the `main` focus rule to `:not(:focus-visible)`
- [x] 4.5 Mark the input `translate="no"`
- [x] 4.6 Warn on unload while the input holds a record
- [x] 4.7 Fold safe-area insets into the body padding with `max()`
- [x] 4.8 Remove the `.hint` rule nothing used

## 5. Verify

- [x] 5.1 Compute every contrast pair from the tokens as they ship, in both
      schemes — 26 pairs, text ≥ 4.5:1, borders ≥ 3:1
- [x] 5.2 Render the real page in both schemes and convert a game in Russian,
      confirming the live conversion, the focus ring and the Cyrillic
- [x] 5.3 Render a failing conversion and confirm the message sits beside the field
- [x] 5.4 Check every id `main.ts` requires still exists exactly once
- [x] 5.5 `npm test`, `npm run typecheck`, `npm run typecheck:web`
- [x] 5.6 Review the result against the Web Interface Guidelines and fix all seven
      findings

## 6. Ship it

- [x] 6.1 Teach the Pages workflow to copy `web/fonts`, and say in a comment why an
      unnamed asset directory fails silently
- [x] 6.2 Simulate the deploy assembly locally and confirm every asset resolves
