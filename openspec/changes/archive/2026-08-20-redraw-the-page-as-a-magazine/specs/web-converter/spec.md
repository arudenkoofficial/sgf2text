## ADDED Requirements

### Requirement: The page is legible in either colour scheme

The page SHALL follow the reader's colour scheme, and SHALL be measured rather than
judged by eye: every pair of text and its surface SHALL clear 4.5:1, and every
border that marks a control SHALL clear 3:1 against both the surface around it and
the fill inside it.

A border has two sides. A value chosen against the page alone is only half checked,
and that is how this page once shipped a field whose border cleared the page by
1.5:1 above a fill that cleared it by 1.09:1 — leaving nothing at all to mark where
the input began, for the readers this converter exists for.

#### Scenario: Either scheme, fully drawn

- **WHEN** a visitor's system asks for dark or for light
- **THEN** the page is drawn in that scheme with every colour defined for it, and
  the browser's own widgets — scrollbars, the native select, the file chooser —
  match, rather than staying light on a dark page

#### Scenario: The address bar matches the page

- **WHEN** a browser tints its interface from the document's `theme-color`
- **THEN** the colour it is given is the background the page actually paints in
  that scheme

#### Scenario: A field's edge is visible

- **WHEN** a partially sighted visitor looks for where to paste a game
- **THEN** the border of the input clears 3:1 against the page and against its own
  fill, so the field is found by looking rather than by guessing

#### Scenario: An error does not speak in the site's own colour

- **WHEN** a conversion fails
- **THEN** the message is drawn in a colour reserved for failure, distinct from the
  colour the page uses for its own identity

### Requirement: The page asks nothing of a third party

Every subresource the page loads SHALL come from the origin serving the page. The
page SHALL NOT request a stylesheet, script, font or image from anyone else.

The privacy requirement elsewhere in this spec forbids requests carrying game data,
which a webfont does not carry. This requirement is stricter on purpose: the footer
tells the visitor the game never leaves the browser, and a visitor cannot audit
that claim. It holds only while the page asks nobody for anything — a font
stylesheet from another host would hand that host an address and a timestamp for
every reader of the page.

#### Scenario: A font is served from the page's own origin

- **WHEN** the page needs a typeface it does not assume the system has
- **THEN** the file is served from this origin, and no request is made to a font
  host or a CDN

#### Scenario: Reading a game offline

- **WHEN** a visitor opens the page and converts a game with no network available
  after the first load
- **THEN** the conversion works and the page is drawn as designed, because nothing
  it needs lives elsewhere

### Requirement: Where the keyboard is stays visible

Every element that can hold focus SHALL show where the focus is when the focus was
asked for by keyboard, including elements that exist only as a destination for the
skip link.

#### Scenario: Arriving by skip link

- **WHEN** a visitor activates the skip link from the keyboard
- **THEN** the destination shows a focus ring, so a sighted keyboard user can see
  where they have arrived

#### Scenario: A ring that does not dissolve into the thing it marks

- **WHEN** focus lands on a control filled with the page's accent colour
- **THEN** the ring remains distinguishable, being separated from the fill rather
  than drawn against it

#### Scenario: A pointer does not raise a ring

- **WHEN** a visitor clicks into a region that is focusable only as a skip-link
  destination
- **THEN** no focus ring is drawn, since nobody asked to be shown where the
  keyboard is

### Requirement: A message stays with the field it describes

A message about the input SHALL be rendered next to that input, in the same section
of the page, so that it is visible to a reader who can see only part of the page at
a time.

Assistive technology is already served by association and by focus. This requirement
is for the visitor reading at high magnification, for whom proximity is not a
nicety but the only way the message is seen at all.

#### Scenario: A failure is seen, not only heard

- **WHEN** a conversion fails while the page is magnified enough that the result
  area is off screen
- **THEN** the message is still in view, because it sits beside the field and the
  buttons that produced it

### Requirement: A pasted record is code, and unsaved

A game record in the input SHALL be marked as text that must not be machine
translated, and the page SHALL warn before discarding one that has not been dealt
with.

#### Scenario: An automatic translator leaves the record alone

- **WHEN** a browser or extension translates the page
- **THEN** the pasted record is left exactly as it is, since translating SGF
  produces something that no longer parses

#### Scenario: Leaving with a record still in the field

- **WHEN** a visitor reloads or navigates away while the input holds a game record
- **THEN** the browser asks them to confirm, because the record was pasted or read
  from a file and this page stores nothing

#### Scenario: Leaving with nothing in the field

- **WHEN** a visitor leaves the page with an empty input
- **THEN** nothing interrupts them

## MODIFIED Requirements

### Requirement: Screen reader accessibility

Every control on the page SHALL be reachable and operable by keyboard and SHALL
carry an accessible name. The page SHALL announce a result without moving focus,
and SHALL move focus to the input when a conversion fails, so that the visitor is
placed in the control they have to act in.

The asymmetry is deliberate, and it is what the code has always done. A success is
something to be told about; a failure is something to act on, and leaving focus
elsewhere would announce a problem while hiding the place to fix it. Decoration
that carries no meaning — the numerals labelling each department — SHALL be hidden
from assistive technology rather than read out.

#### Scenario: Result announced

- **WHEN** conversion finishes
- **THEN** the status, marked as a polite live region, announces that the
  conversion is ready, and focus stays where the visitor left it

#### Scenario: Failure announced, and focus follows it

- **WHEN** a conversion fails
- **THEN** the message is announced, the input is marked invalid, and focus moves
  to the input

#### Scenario: A standing message re-read in a new language

- **WHEN** the language changes while a failure message is on screen
- **THEN** the message is restated in the new language and focus does **not** move,
  because the visitor is operating the language control and must not be thrown out
  of it

#### Scenario: Keyboard-only operation

- **WHEN** a visitor navigates the page using only the keyboard
- **THEN** every control — input, file chooser, language switcher, convert, copy —
  can be reached and activated, and each is announced with its purpose

#### Scenario: Decoration is not read out

- **WHEN** a screen reader reaches a department of the page
- **THEN** it reads the department's heading, and not the numeral drawn beside it

#### Scenario: No modal dialogs

- **WHEN** any error occurs
- **THEN** the message is rendered as text on the page and announced through the
  live region, and the page never calls `alert`, `confirm` or `prompt`
