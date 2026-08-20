## Context

A visual redraw of a page that already worked. Everything load-bearing — the
converter, the language chain, the announcements, the metadata — stays as it was;
what changes is what a sighted visitor sees, plus the handful of measurements that
turned out to have been wrong all along.

The constraint that shaped every decision: this page serves people who read it with
a screen reader, and people who read it with the screen magnified to a few words at
a time. The first group is served by markup, the second by contrast and proximity.
It is easy to serve one and quietly break the other, and the border defect this
change closes is exactly that failure — impeccable ARIA above a field whose edge
was invisible.

## Decisions

### The fonts ship in the repository, not from Google

The spec's privacy requirement forbids "no network request **carrying the game
data**". A webfont carries none, so linking `fonts.googleapis.com` would not have
broken the letter of it. It would have broken the sentence in the footer: *the game
is converted in your browser and is never sent anywhere*. A visitor cannot verify
that claim, so it rests on the page asking nothing of anyone — and a font
stylesheet asks a third party for something, handing over an address and a
timestamp for every reader.

Four files, ~100 KB, one per alphabet per face. Both are variable fonts, so a
single file covers every weight the page uses rather than one file per weight.
Cyrillic is not optional: the page is served in two languages.

Only the Latin subsets are preloaded. The document is served in English, so the
Cyrillic files are what a *language switch* needs, not what the first paint needs,
and preloading all four would push 27 KB at every visitor to buy nothing for most
of them. `crossorigin` is required even same-origin — fonts are fetched in CORS
mode, and without the attribute the preload is discarded and the file fetched
twice, making the optimisation a pessimisation.

### Dark is the default, and light is a real inversion

The night edition is the design, not a preference the design tolerates. But
inverting a palette is not lightening it: the herb green that carries a dark page
leaves white-on-green at **2:1**, so on paper the accent becomes a deep olive and
the label on it turns white. Naively reusing the dark accent on a light background
would have produced a button whose text was unreadable, in the scheme most people
browse in during the day.

`color-scheme: dark light` in that order tells the browser to render its own
widgets — scrollbars, the native select, the file chooser — in the matching scheme,
which our variables cannot reach.

### One token, one meaning

Two splits, each closing a defect rather than tidying names.

`--accent` / `--alert`: while a palette's accent happens to be red, identity and
failure coincide by luck, and an error looks like an error only by coincidence. The
accent here is green, so a shared token would have announced a failed conversion in
the calm voice of the site's own colour.

`--rule` / `--edge`: WCAG asks 3:1 of a control's border and nothing of a
decorative divider. One value pitched at both is either too heavy for the divider
or too faint for the border — and the old palette resolved that tension in the
wrong direction, which is how a field border ended up at 1.5:1.

### The status line goes back beside the field

The grid is what broke this. In one column the status sat a few lines under the
buttons; in departments it sat in the *result* department while the field it
describes sat in the *input* one. Screen reader users never noticed —
`aria-describedby` ties the two together and a failure moves focus into the field —
but a magnified reader got the error message at the far end of the page.

Proximity is not decoration for that reader. It is the whole mechanism.

### Focus on error, and the spec follows the code

The page moves focus into the field when a conversion fails, and keeps focus
untouched when one succeeds. That asymmetry is deliberate: a failure is something
the visitor must act on, in the very control they must act in; a success is
something they should be told about without being yanked anywhere.

The spec said otherwise — it required both to be announced without moving focus —
so this change corrects the spec rather than the code. Re-announcing a standing
message after a language switch also deliberately does *not* move focus: someone
operating the language control must not be thrown out of it and into the game
field.

### `main:focus:not(:focus-visible)`, not `main:focus`

`main` carries `tabindex="-1"` because it is the skip link's target. A bare
`main:focus { outline: none }` outranks `:focus-visible` on specificity, so it
suppressed the ring in both cases — including the one case that matters, a visitor
who *used* the skip link and needs to see where they landed. Scoped to
`:not(:focus-visible)`, a pointer landing in `main` stays quiet and the keyboard
keeps its ring.

### The ring's offset is load-bearing

Ink against the accent is about 1.7:1. On its own the ring would vanish on the
button it marks. The 2px offset puts the page between ring and fill, and the page
against ink is 15.6:1 at worst, so the ring is read against the gap. This is
recorded in a comment beside the rule, because `outline-offset` looks like spacing
anyone might tidy away.

## Alternatives considered

**Link Google Fonts and keep it simple.** Rejected: see above. The cost is a
promise the page makes to the people least able to audit it.

**Keep one `--rule` token and darken it.** Rejected: a divider at 3:1 draws a
heavy line across every section break, which fights the quiet the layout is for.
Two tokens cost one line each and let both jobs be done properly.

**Give the masthead its own column widths.** Rejected: the name and the department
numerals would drift apart the first time the heading's size changed. One `--col`
variable, shared, means the grid stays a grid.

**Warn on unload unconditionally.** Rejected: the dialog would fire for every
visitor who converted nothing and is simply leaving. Guarded on the field holding
a record, which is the only state where anything is actually lost.

## Risks

- **The fonts must be deployed.** The Pages workflow enumerates its copies, so
  `web/fonts` had to be named explicitly; if a future asset directory is added and
  not named, it will fail the same silent way. A comment in the workflow says so.
- **Dark-first is a stronger opinion than the previous design held.** A visitor who
  prefers light gets a complete, contrast-checked light scheme, but the page's
  character is the night edition, and that is a deliberate narrowing.
