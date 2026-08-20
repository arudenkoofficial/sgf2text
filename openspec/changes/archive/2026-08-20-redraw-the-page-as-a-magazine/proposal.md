## Why

The converter looked like a page nobody had decided anything about: a system serif
on warm paper, a single column, an accent borrowed — unintentionally — from another
company's brand. It read as a draft, and a tool for blind and partially sighted
players is exactly the wrong place for a draft to sit: the audience that most needs
to trust it is the audience least able to check it by glancing.

Two things were wrong beneath the surface, and both were invisible until the
palette was rebuilt.

The border of a text field cleared the page by **1.5:1**, and the field's own fill
cleared it by **1.09:1**. So for a great many partially sighted visitors there was
nothing at all marking where the input began — on a page whose entire purpose is
to serve them. Nothing in the repository said this, because nothing measured it.

And the spec had drifted from the page. It required results *and errors* to be
announced "without moving focus", while the code deliberately moves focus into the
field on failure — the behaviour every interface guideline asks for, and the one a
keyboard visitor actually needs. The spec was describing a page that no longer
existed.

## What Changes

- The page is redrawn as a magazine spread: a masthead line carrying the name
  against the language chooser, an opening block on the left kerb, and the work
  below in numbered departments on a shared grid. Dark is the default, and light is
  a true inversion of it rather than an afterthought.
- Two typefaces ship **as files in the repository**, not as a link to Google. The
  spec forbids only requests carrying game data, so a webfont was always permitted
  — but a stylesheet from `fonts.googleapis.com` hands a third party the visitor's
  address, and the footer promises the game never leaves the browser. Serving the
  fonts from this origin keeps that promise literal rather than technical.
- Colour is split into tokens that mean one thing each: `--accent` for identity and
  `--alert` for failure, `--rule` for lines that divide and `--edge` for the border
  that says where a field begins. The last split is what closes the invisible-border
  defect: `--edge` clears 3:1 against the page **and** against the field's own fill,
  because a border has two sides and a value checked against one of them is only
  half checked.
- Every contrast pair is computed from the tokens as they ship, in both schemes,
  rather than judged by eye.
- Two strings join the catalogue, since both are visible and neither could stay in
  the HTML: `subtitle`, the line between the name and the tagline, and
  `inputHeading`, which gives the first department a heading to match the second's.
  The numerals beside them are hidden from assistive technology — read aloud, "01"
  ahead of "Input" is noise.
- The status line moves back beside the field it describes. The single column used
  to keep the two close; the grid pulled them into different departments, which put
  an error message off screen for a reader using magnification while leaving screen
  reader users unaffected.
- The keyboard's position stays visible. `main:focus { outline: none }` outranked
  `:focus-visible` on specificity, so the ring was suppressed even for a focus the
  visitor asked for by keyboard — on the one element the skip link exists to reach.
- A pasted record is treated as code (`translate="no"`, so an auto-translator
  cannot mangle SGF into something that no longer parses) and as unsaved work
  (`beforeunload` while the field holds one, since nothing here stores it).
- The deploy learns to copy the fonts. Its copies are enumerated one by one, so a
  new kind of asset ships only if it is named — and a missing font fails silently,
  leaving every visitor a system fallback with nothing in the build to say so.

## Impact

- Affected specs: `web-converter`
- Affected code: `web/index.html`, `web/main.ts`, `web/ui-strings.ts`,
  `web/fonts/*.woff2` (new), `.github/workflows/pages.yml`
- No change to the converter library, the CLI, or any conversion output: the game
  text this page produces is byte-for-byte what it produced before.
