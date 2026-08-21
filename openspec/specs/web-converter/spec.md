# web-converter Specification

## Purpose
TBD - created by archiving change add-sgf-text-converter. Update Purpose after archive.
## Requirements
### Requirement: Converting on the page

The web page SHALL let a visitor convert an SGF game either by pasting its text or
by choosing a `.sgf` file, and SHALL show the converted text on the same page.

#### Scenario: Pasted game

- **WHEN** a visitor pastes SGF into the input and activates the convert control
- **THEN** the converted text appears in the result area of the same page

#### Scenario: Uploaded file

- **WHEN** a visitor chooses a `.sgf` file through the file control
- **THEN** its contents are converted and shown, without the visitor having to open
  the file themselves

#### Scenario: Multi-line input

- **WHEN** the pasted game spans many lines
- **THEN** the input accepts it in full, because the input is a textarea rather than
  a single-line field

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

### Requirement: Error reporting

The page SHALL explain failures in the visitor's chosen language and SHALL leave the
input intact so it can be corrected.

#### Scenario: Empty input

- **WHEN** the visitor converts with an empty input
- **THEN** the page states that the input is empty and nothing else changes

#### Scenario: Invalid SGF

- **WHEN** the input cannot be parsed
- **THEN** the page states what is wrong with the file and keeps the input text as
  the visitor typed it

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

### Requirement: Language switching

The page SHALL offer the supported languages and SHALL re-render an already
converted game when the language changes.

The page SHALL decide which language to show by consulting these sources in order
and stopping at the first one holding a supported language: the `lang` parameter
of the URL, then the language cookie, and finally English. A value that names an
unsupported language SHALL be passed over rather than treated as an error, so the
next source in the order still gets its turn.

The page SHALL NOT consult the browser's preferred languages. Any language other
than English SHALL be reached only through an act of choosing — a link that names
it, the language control, or the cookie remembering one of those — so that the page
a visitor gets never changes without an action of theirs.

The language of last resort SHALL be the same language the document is served in,
so that a visitor about whom nothing is known is shown the page that was already
delivered rather than watching it change after load.

Every scenario below that establishes a source has been consulted asserts Russian,
not English: English is also the language of last resort, so a scenario expecting
English would pass even if the source it names were never read at all.

#### Scenario: Language changed after conversion

- **WHEN** a visitor converts a game and then selects another language
- **THEN** the result is re-rendered in that language without the visitor having to
  paste the game again

#### Scenario: A link outranks a remembered choice

- **WHEN** a visitor whose cookie records English opens a URL carrying `lang=ru`
- **THEN** the page is shown in Russian, because a link sent to someone has to open
  in the language of that link

#### Scenario: Remembered choice used when the URL is silent

- **WHEN** a visitor whose cookie records Russian opens the page with no `lang`
  parameter
- **THEN** the page is shown in Russian

#### Scenario: The browser's language is not consulted

- **WHEN** a first-time visitor with no cookie opens the page with no `lang`
  parameter, and their browser asks for Russian ahead of every other language
- **THEN** the page is shown in English, because a language the visitor has not
  chosen is not a language the page will switch to

#### Scenario: Region subtag still matches a language

- **WHEN** the `lang` parameter is `ru-BY`, or the cookie holds `ru-BY`, and the
  supported languages are `en` and `ru`
- **THEN** Russian is chosen, because a region subtag narrows a language rather
  than naming a different one

#### Scenario: Unsupported language passed over

- **WHEN** the URL carries `lang=de`, which the page does not support, and the
  cookie records Russian
- **THEN** the page is shown in Russian rather than falling straight to the default
  or reporting an error

#### Scenario: Nothing chosen at all

- **WHEN** there is no `lang` parameter and no cookie
- **THEN** the page is shown in English, which is the language the document was
  already served in, so nothing on the page changes after load

### Requirement: Copying the result

The page SHALL let the visitor copy the converted text and SHALL confirm that the
copy happened.

#### Scenario: Copy confirmed

- **WHEN** the visitor activates the copy control
- **THEN** the plain text of the result is placed on the clipboard, with line breaks
  preserved, and the live region announces that it was copied

### Requirement: Conversion stays in the browser

The page SHALL convert entirely in the browser and SHALL NOT transmit the game to
any server, so that unpublished games remain private.

#### Scenario: No network traffic

- **WHEN** a game is converted
- **THEN** the page issues no network request carrying the game data

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

### Requirement: Rendering the result safely

The page SHALL insert converted text as text content only.

#### Scenario: Game containing markup-like characters

- **WHEN** a player name or comment contains characters such as `<`, `>` or `&`
- **THEN** they appear literally in the result and are never interpreted as markup

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

### Requirement: Page metadata in the chosen language

The page SHALL present its document title, document language, description and
link-preview metadata in the resolved language, and SHALL update all of them when
the language changes without reloading the page.

#### Scenario: Metadata matches the language on arrival

- **WHEN** the page opens with Russian resolved
- **THEN** the document title, the `description` metadata and the link-preview
  metadata are all Russian, and none of them is left holding the English wording
  the document was served with

#### Scenario: Metadata follows a switch

- **WHEN** a visitor changes the language while the page is open
- **THEN** the title, the `description` and the link-preview metadata are rewritten
  in the newly chosen language, in both directions — switching back to the served
  language restores its wording rather than leaving the other language in place

#### Scenario: Screen reader speaks in the matching voice

- **WHEN** a language is resolved
- **THEN** the document's language attribute is set to it, so the screen reader
  reads the page with a speech synthesiser for that language rather than sounding
  out one language's words with another language's phonemes

#### Scenario: Title announced on load is translated

- **WHEN** a visitor opens the page with Russian resolved and their screen reader
  announces the document title
- **THEN** what it announces is the Russian title

#### Scenario: Translations declared to search engines

- **WHEN** a search engine indexes either language of the page
- **THEN** it finds a canonical address for the page and an alternate address per
  language, including a default for visitors whose language is not among them, so
  the two versions read as translations of one page rather than as duplicates

#### Scenario: Metadata is complete without JavaScript

- **WHEN** a crawler that does not execute JavaScript fetches the page
- **THEN** the served HTML already carries a full set of metadata in English —
  never an empty, placeholder or partially filled set — accepting that such a
  crawler cannot be served a translated one

#### Scenario: The served document speaks one language

- **WHEN** the HTML is read exactly as delivered, before any script runs
- **THEN** its metadata, its language attribute and its visible text all name and
  use the same language, so a crawler is given one language signal rather than two
  contradictory ones, and a screen reader reading the page before JavaScript runs
  does not sound out one language's words with another language's phonemes

#### Scenario: The language control opens on the served language

- **WHEN** the page is delivered and the language control has not been touched
- **THEN** the option it shows as selected is the language the document was served
  in, so the control never claims a language the page is not currently in

### Requirement: The language control describes the page

The control SHALL be presented as choosing the language of the page rather than of
a conversion, and SHALL sit outside the form that takes the game. It SHALL remain a
native select whose options are each named in their own language and marked with
that language, so its name is read in the voice of the language it names.

#### Scenario: Not a field of the form

- **WHEN** a visitor reaches the control
- **THEN** it is outside the form holding the game input, because it rewrites the
  title, the description, the link-preview metadata and every label on the page —
  placing it among the game fields would describe it as a per-conversion setting

#### Scenario: The current language is named, not pictured

- **WHEN** the control shows which language is active
- **THEN** it does so with that language's own name, and SHALL NOT rely on a flag
  or any other purely visual indicator, because a flag names a country rather than
  a language and tells a blind visitor nothing

#### Scenario: Each option read in its own voice

- **WHEN** a screen reader announces the options
- **THEN** each is marked with the language it names, so the synthesiser pronounces
  it with that language's phonemes rather than spelling one language's word out
  through another's

### Requirement: Every visible string follows the language

The page SHALL translate all of its own text, with no paragraph left in whichever
language the served document happens to be written in.

#### Scenario: A paragraph containing links

- **WHEN** the language changes and a paragraph holds links inside its sentence
- **THEN** the words around the links are translated too, and the paragraph is
  rebuilt from text and link nodes rather than from a string treated as markup

### Requirement: The address carries the language it is showing

The page SHALL reflect the resolved language in the URL as soon as it resolves it,
not only when the control is used, so that the address a visitor can copy opens in
the language they were looking at.

#### Scenario: Arriving on the bare URL with a remembered language

- **WHEN** a visitor whose cookie records Russian opens the page with no `lang`
  parameter
- **THEN** the address becomes the one naming Russian, so copying it hands someone
  else the page as it was seen rather than as their own cookie would render it, and
  the canonical address agrees with the address bar

### Requirement: Remembering the chosen language

The page SHALL remember the resolved language in a cookie that outlives the browser
session, so that a blind visitor operates the language control once rather than
once per visit.

#### Scenario: Choice survives to the next visit

- **WHEN** a visitor selects Russian, closes the browser, and later opens the page
  with no `lang` parameter
- **THEN** the page is in Russian, without the language control having to be found
  and operated again — the cookie is the only thing standing between her and an
  English page, since nothing else about her is consulted

#### Scenario: A shared link becomes the remembered choice

- **WHEN** a visitor arrives through a URL carrying `lang=ru`
- **THEN** Russian is recorded as the remembered language, so their next visit
  without the parameter is also Russian

#### Scenario: The cookie carries only a language

- **WHEN** the cookie is written
- **THEN** its value is a language tag and nothing else — no game record, no file
  name, no identifier — so the page's promise that a game never leaves the browser
  continues to hold

#### Scenario: Cookies unavailable

- **WHEN** the browser blocks cookies, or reading them raises an error
- **THEN** the page still resolves a language and works in full — English unless the
  URL names another — and nothing is reported to the visitor about a preference that
  could not be stored

#### Scenario: Unrecognised stored value

- **WHEN** the cookie holds a value that is not a supported language
- **THEN** it is passed over as though absent, rather than leaving the page
  untranslated or failing to start

### Requirement: The served document names where the page lives

The served HTML SHALL give its canonical address, its `og:url` and every language
alternate on the host the page is published at, over `https`, so that a reader who
runs no JavaScript is handed the address that serves the page rather than one that
redirects to it.

This requirement is about the addresses baked into the document, not the ones the
page computes at runtime. A visitor running JavaScript already gets correct
addresses, rebuilt from `location`. Crawlers and messenger link previews execute
no JavaScript, so for them the baked-in values are the only values there are.

#### Scenario: A link pasted into a chat

- **WHEN** someone pastes the page's address into a messenger and the preview reads
  the served HTML without running JavaScript
- **THEN** the address it shows is the live one, so following it reaches the page
  in one hop instead of through a redirect

#### Scenario: A redirecting address is never the canonical one

- **WHEN** the served document declares a canonical address
- **THEN** that address answers with the page rather than with a redirect to
  somewhere else, because a canonical link pointing at a redirect gives a search
  engine two contradictory answers about where the page lives

#### Scenario: Every alternate names the live host

- **WHEN** the served document lists its language alternates and its `x-default`
- **THEN** each one names the live host, so no language of the page is advertised
  at an address that bounces

#### Scenario: The old address keeps resolving

- **WHEN** someone follows a link to the previous address, sent before this change
- **THEN** they still reach the page, because links already sitting in other
  people's chat histories must not stop working

### Requirement: The repository records its published address

The repository SHALL hold the address the page is published at in a file under
version control, and the deploy SHALL publish that file with the page. A test SHALL
assert the served document agrees with it.

The address is currently visible only in the hosting provider's settings, which no
test, no type check and no reviewer reading the repository can see. Recording it
turns "where does this live" from a question you answer by following a redirect
into one you answer by opening a file.

#### Scenario: Moving the page is one edit plus a failing test

- **WHEN** someone changes the recorded address without updating the served
  document
- **THEN** the test fails and names both values, so a move cannot be left
  half-finished

#### Scenario: The former address is gone from the document

- **WHEN** the served document is read after a move
- **THEN** no address in it names the previous host, so an overlooked literal
  cannot keep advertising an address the page no longer answers on

#### Scenario: The recorded address is a bare hostname

- **WHEN** the recorded address is read
- **THEN** it is a hostname with no scheme, no path and no trailing slash, so the
  file stays the single thing the hosting provider also reads it as

### Requirement: The published site is reachable only over https

The published site SHALL answer over `https`, and a plain `http` request SHALL
redirect to it, carrying any query string intact.

The language cookie is written with `Secure`, so a browser stores it only on a
secure origin. A visitor who arrives over `http` is therefore shown the language
the link names and has it forgotten by the time they return, with nothing reported
to them — the page cannot tell the difference between a cookie it failed to store
and a cookie that was never there.

#### Scenario: The remembered language survives a link from a chat

- **WHEN** a visitor follows a link naming a language, from any address the site
  answers on, including one that redirects
- **THEN** the last hop of that journey is `https`, so the cookie is stored and the
  language is still there on the next visit

#### Scenario: A redirect keeps the language it was given

- **WHEN** an address that redirects is followed with a `lang` parameter
- **THEN** the parameter survives to the destination, so the language a sender
  chose is the language the recipient sees

### Requirement: Sharing the page

The page SHALL offer a control that hands the page's own address to the operating
system's share sheet, and SHALL pass the address in the language currently being
read, so that the recipient opens the version the sender was looking at.

Where the browser offers no share sheet, the control SHALL copy the address to the
clipboard instead. It SHALL announce which of the two happened, in a polite live
region beside the controls that produced it, and SHALL NOT move focus: sharing
succeeded, and there is nothing for the visitor to act on.

The control exists because handing this tool to the next blind player is something
the players do for each other, and a browser's own share control has to be hunted
for. A named button in the page is reachable by the same means as everything else
here.

Only the page's address is transmitted. The game in the input is not part of what is
shared, under any branch of this requirement.

#### Scenario: Shared through the system sheet

- **WHEN** a visitor activates the share control in a browser that offers a share
  sheet
- **THEN** the sheet opens carrying the page's address and a title naming the page,
  both in the language being read, and the live region says the page was offered for
  sharing

#### Scenario: The sheet is dismissed

- **WHEN** a visitor opens the share sheet and then closes it without choosing a
  destination
- **THEN** nothing is announced as a failure, because cancelling is not an error and
  reporting one would tell a blind visitor something went wrong when nothing did

#### Scenario: No share sheet in this browser

- **WHEN** a visitor activates the control in a browser without the share sheet
- **THEN** the address is copied to the clipboard and the live region says it was
  copied, rather than the control doing nothing or reporting a browser limitation
  the visitor cannot act on

#### Scenario: Neither sharing nor copying is possible

- **WHEN** the share sheet is unavailable and writing to the clipboard also fails
- **THEN** the live region says the address could not be shared or copied and names
  the browser's own share control as the way to do it, so the visitor is left with
  an instruction rather than with a control that failed silently

#### Scenario: The shared address carries the language

- **WHEN** a visitor reading the page in Russian shares it
- **THEN** the address handed to the sheet is the one naming Russian, so the
  recipient is not shown whichever language their own cookie happens to hold

#### Scenario: The game is not shared

- **WHEN** a visitor shares the page with a game record in the input
- **THEN** what leaves the browser is the page's address and nothing else, because
  the record is unpublished work and the page's promise about it holds here too

### Requirement: The page can be kept as an icon

The page SHALL ship a web app manifest, an `apple-touch-icon` and a favicon, all
served from this origin, so that a visitor who adds the page to their home screen
gets a named icon rather than an address and a screenshot of the page.

For a screen reader user this is the difference between one gesture and a sequence
of them. Reaching a page through a browser means finding the address bar, recalling
the address and confirming the result, every time; an icon on the home screen is a
single target. Without a manifest, what the icon is called is a fragment of a URL,
which is what the screen reader then reads out on the home screen.

The icon SHALL open the page in the browser rather than as a standalone window.
What was asked for is an icon that opens this page, not an application: opening it
without the browser's own frame takes away the share control this page's own
instruction tells her to find, along with everything else she reaches a web page
with — the reader, the text size control, the way back. A page that removed those
would be trading her tools for the appearance of an app.

#### Scenario: The icon is named, not addressed

- **WHEN** a visitor adds the page to their home screen
- **THEN** the icon carries the tool's name and a drawn mark, and a screen reader
  announces that name rather than part of an address

#### Scenario: The icons come from this origin

- **WHEN** the page declares its icons and its manifest
- **THEN** every one of them is served from the host serving the page, with no
  request to a CDN or an icon service, so the page continues to ask nothing of a
  third party

#### Scenario: A tab is identifiable

- **WHEN** the page is open in a browser tab, bookmarked, or in a reading list
- **THEN** it shows its own mark rather than a blank or generic icon

#### Scenario: The icon opens a page, not an application

- **WHEN** a visitor opens the page from its home screen icon
- **THEN** it opens in the browser with the browser's own controls available, so the
  share control named by this page's instruction is where the instruction says it is

### Requirement: The home screen name follows the chosen language

The name offered for the home screen icon SHALL be in the language the page is
being read in, and SHALL be updated when the language changes, like the document
title already is.

An icon is added once and then read every day. Getting a Russian reader's icon
named in English would leave her home screen holding one English label among her
own language, announced in English phonemes by a Russian voice.

Every source the platform may read that name from SHALL carry the chosen language,
not merely the one the page happens to write at runtime. A manifest is a static file
and cannot follow a control, so a single manifest would name the icon in whichever
language it was written in — and where the platform prefers the manifest to the
document's own tag, that name is the one she gets. Which of the two wins is not the
page's decision to make, so neither source is left holding the wrong answer.

#### Scenario: Added while reading Russian

- **WHEN** a visitor switches the page to Russian and then adds it to their home
  screen
- **THEN** the name offered for the icon is the Russian one

#### Scenario: The name follows a switch

- **WHEN** a visitor changes the language while the page is open
- **THEN** the name that would be offered for the icon is rewritten in the newly
  chosen language, in both directions, rather than keeping the language the document
  was served in

#### Scenario: Both sources of the name agree

- **WHEN** a visitor reading the page in Russian adds it to their home screen, in a
  platform that takes the name from the manifest rather than from the document's own
  tag
- **THEN** the manifest in force is the Russian one, so the icon is named in Russian
  whichever of the two sources the platform prefers

#### Scenario: A manifest for every language offered

- **WHEN** the page offers a language in its language control
- **THEN** a manifest exists for that language and is published, so no choice of
  language can leave the icon naming itself from a file that is not there

### Requirement: Telling the visitor how to keep the page

The page SHALL explain, in the reader's language, how to add it to the home screen,
and SHALL name each control the visitor has to find by the name their screen reader
announces for it rather than by how it looks.

This text exists because the page cannot perform the gesture. On iOS, "Add to Home
Screen" is an item in Safari's own share menu and is not reachable from a web page's
share sheet, so no button here can do it. Words are the only help a page can offer,
which makes the wording the whole of the feature rather than a note beside it.

Naming controls rather than describing them is the part that is easy to get wrong.
Instructions written for sighted readers say "tap the square with an arrow coming out
of it", which tells a blind visitor nothing about where the control is or what
VoiceOver will call it when she reaches it.

#### Scenario: The instruction is on the page, in the reader's language

- **WHEN** a visitor reads the page in either supported language
- **THEN** the instruction is present in that language, as text on the page, and is
  reached by the same means as the rest of the page

#### Scenario: Controls are named, not pictured

- **WHEN** the instruction refers to a control of the browser
- **THEN** it names the control as a screen reader announces it, and does not
  identify it by shape, colour or position alone

#### Scenario: No dialog and no interruption

- **WHEN** the instruction is shown
- **THEN** it is text in the page rather than a dialog, and it does not interrupt
  what is being read

### Requirement: A message describes only what it is about

A message the page announces SHALL be associated with the game field only when the
field is what the message is about. A message about anything else — the result, the
clipboard, the address of the page — SHALL NOT become the field's description, SHALL
NOT mark the field invalid, and SHALL NOT move focus into it.

The field's description is read out every time she reaches the field. A message left
there outlives the moment it was about, so "the address of this page has been copied"
becomes part of how the page introduces her own game record, minutes after the
copying. Marking the field invalid is worse than untidy: it tells her the record she
is holding is wrong, on the evidence of something that never examined it.

Both messages SHALL sit beside the controls that produced them, as the requirement
about a message staying with its field already asks: what changes here is which
message the field claims as its own description, not where either one is drawn.

#### Scenario: A share failure does not accuse the record

- **WHEN** a record that failed to parse is still in the field and a share attempt
  then fails
- **THEN** the failure is announced, the field keeps whatever it was already saying
  about the record, and focus stays on the control she pressed

#### Scenario: Nothing to copy is not a bad record

- **WHEN** the visitor activates the copy control before anything has been converted
- **THEN** the page says there is nothing to copy yet, and does not mark the record
  invalid or move her into the field: what is missing is a conversion, not a
  correction

#### Scenario: The field's description holds only its own messages

- **WHEN** the address of the page has been copied and the visitor later reaches the
  game field
- **THEN** what is read out with the field is the field's own label and description,
  and not the message about the address

### Requirement: Every asset the document names is published

The deploy SHALL publish every file the served document references, every file a
manifest references, and every manifest the page can put in force, and a test SHALL
assert that it does by reading those references rather than a list maintained beside
them.

The deploy enumerates what it copies. A new kind of asset therefore ships only if
someone remembers to name it there, and a forgotten one fails quietly: the page
still loads, the icon is simply absent, and the visitor least able to notice a
missing icon is the one this page is for.

Reading the document alone is not enough once a file is reached only at runtime. The
manifest for the language that was not served is named by no tag in the document, and
an icon may be named by a manifest and by nothing else — so a sweep of the document
would report both as nobody's business and let them ship as a 404.

#### Scenario: A referenced file that the deploy would not copy

- **WHEN** the document references a file the deploy does not publish
- **THEN** the test fails and names the file, so the omission is found in the build
  rather than as a 404 on the live page

#### Scenario: The manifest and the icons reach the published site

- **WHEN** the site is assembled for publishing
- **THEN** the manifest and every icon the document names are among the published
  files

#### Scenario: A file named only by a manifest

- **WHEN** a manifest names an icon that the document itself never references
- **THEN** the test still requires it to be published, because the manifest is served
  to the same visitor and a 404 beneath it is no less broken

#### Scenario: A manifest reached only by the language control

- **WHEN** the manifest for a language is put in force at runtime rather than named
  in the served document
- **THEN** it is still required to be published, because the visitor who switches
  language is exactly the visitor it exists for

