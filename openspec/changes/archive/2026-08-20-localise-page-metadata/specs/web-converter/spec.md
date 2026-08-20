## MODIFIED Requirements

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

## ADDED Requirements

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
