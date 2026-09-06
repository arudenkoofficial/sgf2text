## ADDED Requirements

### Requirement: Saving the converted text as a file

The page SHALL let the visitor save the converted text to her device as a plain-text
file, and SHALL do so on the browser in her hand rather than only where a link is
allowed to write one. Where the browser honours a download from a link, the file SHALL
be written. Where it does not, the same control SHALL hand the file to the system
share sheet, so that the text still reaches her device through the one route that
browser offers.

Which branch is possible SHALL be decided when the control is pressed, with the file
already built: a capability can be granted between one press and the next, and whether
a file can be handed to a sheet is a question about that particular file.

The control SHALL be present whenever the page is, SHALL be marked disabled while
there is nothing to save, and SHALL NOT be removed from the tab order — a control that
appears only once it can be used is a control she cannot discover before she needs it,
and one taken out of the tab order is a control she never learns exists. It SHALL
carry one name, because it does one thing, and the difference between its two branches
is the browser's rather than hers.

The file name SHALL carry the date and the time of the save, in her own local time,
so that one save does not silently replace another and so that she can tell two of
them apart by name. It SHALL contain no character a file system forbids: a name the
browser has to rewrite before writing it is a name she was promised and did not get.

Every press SHALL be answered in a polite live region beside the control. A
confirmation SHALL name the file and SHALL say which of the two things happened: a
file written to her downloads and a file handed to a sheet end up in different places,
and she cannot look to find out which.

A sheet she closes, and a sheet the browser refuses because one is already open, SHALL
NOT be announced as failures. The first is a decision she made; the second has no
outcome yet, and reporting one would report something that has not happened. Where
neither branch is available, or a branch fails, the page SHALL say so and SHALL name
the result on the page as the way to take the text manually — which is why the result
keeps its place in the tab order.

Saving SHALL happen entirely in the browser. The text reaches her device without any
request carrying it anywhere, under the same promise the rest of the page makes.

Nothing SHALL interrupt her when she leaves the page or reloads it. The record came
from a file she still holds and the converted text can be saved, so there is no
unsaved work left for a confirmation dialog to defend.

#### Scenario: The text is written to her device

- **WHEN** the visitor activates the save control with a conversion on the page, in a
  browser that honours a download from a link
- **THEN** a plain-text file holding exactly the result text is written to her device,
  its name carrying the date and the time of the save, and the live region beside the
  control names the file and says it was saved

#### Scenario: Handed to the sheet where a link cannot save

- **WHEN** the visitor activates the save control in a browser that does not honour a
  download from a link
- **THEN** the file is handed to the system share sheet instead, and the live region
  names the file and says it was handed over rather than claiming it was saved

#### Scenario: A name a file system accepts

- **WHEN** the name of the file is built
- **THEN** it holds no colon and no other character forbidden by Windows or
  historically illegal in the Finder, so what lands on her device is the name she was
  told about rather than one the browser silently repaired

#### Scenario: Her clock, not a server's

- **WHEN** the file is named
- **THEN** the date and the time in the name are the ones her own device reads, since
  the name exists for her to recognise

#### Scenario: Nothing to save yet

- **WHEN** the visitor activates the save control before anything has been converted
- **THEN** the page says there is nothing to save, and does not mark the file control
  invalid or move her into it: what is missing is a conversion, not a correction

#### Scenario: Discoverable before it is needed

- **WHEN** a visitor moves through the page by keyboard before converting anything
- **THEN** she reaches the save control and hears that it exists, because it is marked
  disabled rather than removed from the page or from the tab order

#### Scenario: Saving twice is answered twice

- **WHEN** the visitor saves the text and then saves it again without converting
  anything in between
- **THEN** both saves happen and both are announced, because the second one happened
  just as much as the first

#### Scenario: A sheet she closes is not a failure

- **WHEN** the file is handed to the share sheet and the visitor closes it without
  choosing a destination
- **THEN** nothing is announced as a failure, because backing out on purpose is not an
  error and reporting one would tell her something went wrong when nothing did

#### Scenario: A sheet already standing

- **WHEN** the save control is pressed while a sheet from an earlier press is still
  open and unanswered
- **THEN** nothing is announced, because the outcome she is waiting for has not
  happened yet; and a sheet whose outcome never arrives SHALL NOT leave the control
  unable to try again

#### Scenario: Neither branch, and nothing hidden

- **WHEN** the browser will neither write the file from a link nor take it into a
  sheet, or the attempt fails
- **THEN** the live region says the text could not be saved and names the result on
  the page as the way to take it manually, rather than the control failing silently

#### Scenario: Leaving is not interrupted

- **WHEN** the visitor reloads the page or navigates away after converting a game
- **THEN** nothing asks her to confirm, because the game came from a file she still
  has and the text was hers to save

#### Scenario: The text is not sent anywhere

- **WHEN** the file is saved
- **THEN** the page issues no network request carrying the converted text, so saving
  keeps the promise the conversion already makes

### Requirement: The credit stays on the page without being read out

The promise that the file never leaves the browser, and the credit naming the Japan
Go Association for the Visually Impaired with the link to this page's source, SHALL
remain visible on the page and SHALL be hidden from assistive technology.

Every link inside them SHALL leave the tab order with them. Text hidden from a screen
reader while still focusable is worse than either state alone: a keyboard user reaches
a control the screen reader cannot name, which is a control announced as nothing at
all.

Both SHALL continue to follow the chosen language. They are still on screen, and a
visible paragraph left in a language the page is not in is wrong whoever is reading
it.

#### Scenario: Read by eye, not by voice

- **WHEN** a screen reader reads the page from top to bottom
- **THEN** neither paragraph is announced, so the visitor is not made to sit through
  them on every visit

#### Scenario: The credit is still published

- **WHEN** anyone looks at the page
- **THEN** the promise, the credit to the Japan Go Association for the Visually
  Impaired and the link to the source are there to be read, so where the idea and the
  code come from stays on the page rather than only in its markup

#### Scenario: No focusable text without a name

- **WHEN** a keyboard user moves through the page to its end
- **THEN** neither link inside the hidden paragraphs takes focus

#### Scenario: Hidden but translated

- **WHEN** the language changes
- **THEN** both paragraphs are rewritten in the newly chosen language, like every
  other visible string on the page

## MODIFIED Requirements

### Requirement: Converting on the page

The web page SHALL take an SGF game as a `.sgf` file and SHALL show the converted
text on the same page. Choosing the file SHALL be what converts it: there is no
second control to press, and no way in but a file.

A game arrives as a file. A field to paste into cost a stop in the tab order, a label
and a placeholder read out as SGF punctuation, for a way in that was never used by the
visitor this page exists for.

#### Scenario: Chosen file

- **WHEN** a visitor chooses a `.sgf` file through the file control
- **THEN** its contents are converted and the text appears in the result area of the
  same page, without the visitor having to open the file or press anything else

#### Scenario: No way in but a file

- **WHEN** a visitor reaches the department that takes the game
- **THEN** the file control is the only thing there that takes one: the page offers no
  field to paste a record into and no control that converts what a field holds

### Requirement: Screen reader accessibility

Every control on the page SHALL be reachable and operable by keyboard and SHALL
carry an accessible name. The page SHALL announce a result without moving focus,
and SHALL move focus to the file control when a conversion fails, so that the visitor
is placed in the control they have to act in.

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
- **THEN** the message is announced, the file control is marked invalid, and focus
  moves to that control, which is where choosing another file happens

#### Scenario: A standing message re-read in a new language

- **WHEN** the language changes while a failure message is on screen
- **THEN** the message is restated in the new language and focus does **not** move,
  because the visitor is operating the language control and must not be thrown out
  of it

#### Scenario: Keyboard-only operation

- **WHEN** a visitor navigates the page using only the keyboard
- **THEN** every control — the file chooser, the language switcher, save — can be
  reached and activated, each is announced with its purpose, and the result can be
  reached so that its text can be selected

#### Scenario: Decoration is not read out

- **WHEN** a screen reader reaches a department of the page
- **THEN** it reads the department's heading, and not the numeral drawn beside it

#### Scenario: No modal dialogs

- **WHEN** any error occurs
- **THEN** the message is rendered as text on the page and announced through the
  live region, and the page never calls `alert`, `confirm` or `prompt`

### Requirement: Where the keyboard is stays visible

Every element that can hold focus SHALL show where the focus is when the focus was
asked for by keyboard.

#### Scenario: A ring that does not dissolve into the thing it marks

- **WHEN** focus lands on a control filled with the page's accent colour
- **THEN** the ring remains distinguishable, being separated from the fill rather
  than drawn against it

#### Scenario: Every stop on the page shows itself

- **WHEN** a visitor moves through the page by keyboard from the first stop to the
  last
- **THEN** each stop draws a focus ring, including the result area, which holds focus
  so that the text can be read from the keyboard and selected there when saving is not
  available

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

#### Scenario: The file control's edge is visible

- **WHEN** a partially sighted visitor looks for the control that takes the game
- **THEN** the border of the file control clears 3:1 against the page and against its
  own fill, so the control is found by looking rather than by guessing

#### Scenario: An error does not speak in the site's own colour

- **WHEN** a conversion fails
- **THEN** the message is drawn in a colour reserved for failure, distinct from the
  colour the page uses for its own identity

### Requirement: Error reporting

The page SHALL explain failures in the visitor's chosen language and SHALL leave the
result area empty rather than showing text from a file it could not read through.

#### Scenario: A file with no game in it

- **WHEN** the chosen file holds no game record
- **THEN** the page says so, in words that describe a file rather than telling her to
  paste something into a field the page no longer has

#### Scenario: Invalid SGF

- **WHEN** the chosen file cannot be parsed
- **THEN** the page states what is wrong with it and the result area stays empty

#### Scenario: A file that cannot be read

- **WHEN** the file cannot be read at all
- **THEN** the page says so, marks the file control invalid and moves focus to it,
  since choosing another file is the only thing left to do and that control is where
  it happens

#### Scenario: The game she is still holding is named

- **WHEN** a file cannot be read while a previously converted game is still on the page
- **THEN** the message says that the text on the page is the game before it, because
  nothing examined the new file and the previous result is deliberately left standing —
  and the save control is live over it, so pressing save would write that game to her
  device under a name carrying only a timestamp, which she has no way to notice
- **AND WHEN** no game was on the page
- **THEN** the message says only that the file could not be read, since there is nothing
  for her to mistake it for

### Requirement: A message stays with the field it describes

A message about the game the page has been given SHALL be rendered next to the control
that took it, in the same section of the page, so that it is visible to a reader who
can see only part of the page at a time.

Assistive technology is already served by association and by focus. This requirement
is for the visitor reading at high magnification, for whom proximity is not a
nicety but the only way the message is seen at all.

#### Scenario: A failure is seen, not only heard

- **WHEN** a conversion fails while the page is magnified enough that the result
  area is off screen
- **THEN** the message is still in view, because it sits beside the file control that
  produced it

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
  choose the file again, because the page keeps the text of the file it read

#### Scenario: A standing verdict outranks the game still on screen

- **WHEN** a file that could not be read leaves the previous game on the page, and the
  language is then changed
- **THEN** the game is not re-converted, because re-converting would announce the
  previous game as a success into the file control's own description — overwriting the
  sentence explaining the verdict and reporting the control valid, so the page would
  vouch for the file it has just said it could not read
- **AND** the standing failure is restated in the new language, which is the whole of
  what the change of language owes her here

#### Scenario: Two standing sentences both follow the language

- **WHEN** a verdict stands on the file control and a notice stands beside the save
  control, and the language is changed
- **THEN** both are restated in the new language, because the page can hold two true
  sentences at once and one left behind is read out with the wrong language's phonemes —
  and the one at risk is the file control's own description

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

#### Scenario: A failed file is restated, not re-read

- **WHEN** a file has failed to convert and the visitor then changes the language
- **THEN** the reason is stated again in the new language and the page does not
  convert anything, so focus stays in the language control she is operating

### Requirement: Rendering the result safely

The page SHALL insert converted text as text content only, and SHALL mark the result
as text that must not be machine translated.

#### Scenario: Game containing markup-like characters

- **WHEN** a player name or comment contains characters such as `<`, `>` or `&`
- **THEN** they appear literally in the result and are never interpreted as markup

#### Scenario: An automatic translator leaves the game alone

- **WHEN** a browser or extension translates the page
- **THEN** the converted text is left exactly as it is, because a coordinate put
  through a translator names a point that is not the one that was played

### Requirement: The language control describes the page

The control SHALL be presented as choosing the language of the page rather than of
a conversion, and SHALL sit outside the department that takes the game. It SHALL
remain a native select whose options are each named in their own language and marked
with that language, so its name is read in the voice of the language it names.

#### Scenario: Not one of the controls that takes a game

- **WHEN** a visitor reaches the control
- **THEN** it is outside the department holding the file control, because it rewrites
  the title, the description, the link-preview metadata and every label on the page —
  placing it among the controls that take a game would describe it as a
  per-conversion setting

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
language the served document happens to be written in. Text hidden from assistive
technology but still on screen SHALL be translated too: it is read by whoever is
looking at the page, and being unread by a screen reader is not the same as being
absent.

#### Scenario: A paragraph containing links

- **WHEN** the language changes and a paragraph holds links inside its sentence
- **THEN** the words around the links are translated too, and the paragraph is
  rebuilt from text and link nodes rather than from a string treated as markup

#### Scenario: The heading's own words follow the language

- **WHEN** the language changes
- **THEN** the words the heading carries beside the tool's name are translated, and
  the name itself and the mark drawn inside it are left intact

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
without the browser's own frame takes away everything she reaches a web page with —
the reader, the text size control, the share control, the way back. A page that
removed those would be trading her tools for the appearance of an app.

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
- **THEN** it opens in the browser with the browser's own controls available, so
  nothing she uses to read, share or leave a web page is missing

### Requirement: A message describes only what it is about

A message the page announces SHALL be associated with the file control only when the
game the page was given is what the message is about. A message about anything else —
the result, the file that was saved, the sheet it was handed to — SHALL NOT become
that control's description, SHALL NOT mark it invalid, and SHALL NOT move focus into
it.

What each message is about SHALL be stated where the message is announced, and the
region SHALL be derived from it rather than chosen alongside it. Choosing the region by
hand at each call site leaves the subject written down nowhere, so the choice is a
habit rather than a decision and no test can read it — which is how three messages came
to be announced about the wrong thing, none of them failing a test.

The control's description is read out every time she reaches it. A message left there
outlives the moment it was about, so "the text has been saved" becomes part of how the
page introduces the control she chooses a file with, minutes after the saving. Marking
it invalid is worse than untidy: it tells her the file she chose is wrong, on the
evidence of something that never examined it.

A file that could not be read is about that control, and this is a change. While the
page held a field to paste into, a failed read was a notice: the record in the field
might be a perfectly good game and nothing about the file had examined it. With no
field, the chosen file is the only game the page has, so a file it could not read is a
verdict on the only thing there is — and choosing another file, in that control, is the
one thing she can do about it.

Every message SHALL sit beside the control that produced it, as the requirement about
a message staying with its field already asks. Where the page offers more than one
control that answers in a notice, each SHALL have its own region, since one fixed
region cannot sit beside two controls at opposite ends of a page. After this change one
control answers in a notice, so the page has one notice region and it stands beside
that control; the rule holds for the next one to arrive.

At most one such message SHALL be readable at a time: putting a message in one region
SHALL clear whatever another region was holding, so a sentence that has stopped being
true is not left behind for a visitor reading the page in order.

The control's own description is not one of these messages and SHALL NOT be cleared by
them. It states the condition of the game the page was given, so it SHALL stand until
that condition changes — otherwise a control marked invalid is left without the
sentence saying why, and a screen reader announces a problem it cannot explain.

#### Scenario: Nothing to save is not a bad file

- **WHEN** the visitor activates the save control before anything has been converted
- **THEN** the page says there is nothing to save yet, and does not mark the file
  control invalid or move her into it: what is missing is a conversion, not a
  correction

#### Scenario: A saving failure does not accuse the file

- **WHEN** a file that failed to parse is the last one chosen and the visitor then
  presses the save control
- **THEN** the outcome is announced beside the save control, the file control keeps
  whatever it was already saying about that file, and focus stays on the control she
  pressed

#### Scenario: The control's description holds only its own messages

- **WHEN** the converted text has been saved and the visitor later reaches the file
  control
- **THEN** what is read out with it is its own label and description, and not the
  message about the file that was saved

#### Scenario: One message at a time, wherever it is

- **WHEN** a visitor presses save before converting anything, and then chooses a file
  that converts
- **THEN** the conversion is announced with the file control and the sentence saying
  there was nothing to save is no longer anywhere on the page, rather than both
  standing as if both had just happened

#### Scenario: A mark of invalidity keeps its explanation

- **WHEN** a file that failed to parse is the last one chosen, and the visitor then
  presses the save control and later returns to the file control
- **THEN** that control is still marked invalid and still describes what was wrong
  with the file, because pressing save never examined it and so cannot be the reason
  its explanation disappears

### Requirement: Every action is answered, including a repeat

Every activation of a control SHALL be answered, and an activation that produces the
same outcome as the one before it SHALL be answered again rather than skipped because
the page has already said that sentence once. Choosing the same file twice SHALL
likewise be two answered actions.

A polite live region reports what appears in it. A sentence rewritten identically is
still an appearance and SHALL be written; a sentence left in place is not, and reads as
a control that did nothing.

She presses a second time precisely because she is unsure the first press registered.
Silence is the one outcome she cannot investigate: she cannot see the button flash, or
check whether anything moved, or look in a folder without leaving the page. A control
that answers once and then ignores her is indistinguishable, from where she is, from a
control that is broken.

Silence remains correct where there is genuinely no outcome yet — a share sheet she
dismissed, a sheet the browser refuses because one is already open. What this
requirement forbids is silence standing in for an outcome that has happened.

#### Scenario: The same answer, twice

- **WHEN** the visitor activates the save control twice with nothing converted
- **THEN** the page says there is nothing to save on both presses, rather than
  answering the first and ignoring the second because the sentence has not changed

#### Scenario: A second save is confirmed too

- **WHEN** the visitor saves the result and then saves it again
- **THEN** both saves are confirmed, and each names the file it wrote

#### Scenario: The same file, chosen again

- **WHEN** the visitor chooses a file, and later chooses that same file again
- **THEN** it is read again and the outcome announced again, rather than the second
  choice reaching nothing because the control still holds the first

### Requirement: A message does not outlive what it describes

A message SHALL stand only while what it describes still holds. A message about a
completed action SHALL NOT be announced a second time by anything other than that action
happening again; a message about the game the page was given SHALL be cleared, along with
any mark of invalidity, when another file is chosen.

This is the third of the three questions a message has to answer, beside what it is
about and where it is said: for how long is it true. Getting it wrong produces the
page's most misleading behaviour, because a sentence that was accurate when written is
read out as though it were accurate now.

A failure is different from a confirmation here. A failure describes a condition that is
still in force — the file is still the one that would not convert, and she is still owed
the reason in a language she reads — so restating it in the new language is restating
something true. A confirmation describes an event that finished; repeating it reports an
event that is not happening.

#### Scenario: Changing the language does not repeat a finished action

- **WHEN** the visitor saves the converted text and then changes the language
- **THEN** the confirmation is not announced again in the new language, because nothing
  was saved by changing the language

#### Scenario: Changing the language restates a standing failure

- **WHEN** a file has failed to convert and the visitor then changes the language
- **THEN** the reason is stated again in the new language, because the file is still
  the one she has to replace and the explanation is what she has to act on

#### Scenario: Another file loses the verdict on the last one

- **WHEN** a file has failed to convert and the visitor then chooses a different file
- **THEN** the file control stops being marked invalid and stops describing the old
  failure, before the new file has even been read, rather than telling a screen reader
  that a file the page has never examined is wrong

#### Scenario: The verdict returns with the next conversion

- **WHEN** the visitor chooses another file after a failure and it converts
- **THEN** the page states the outcome of that conversion, so clearing the old verdict
  leaves the control described by its own present state rather than by nothing at all

## REMOVED Requirements

### Requirement: Copying the result

**Reason**: A file on her device is the durable version of what the clipboard offered,
so keeping both would leave two controls for one job — and the clipboard is the one
that loses the game when the browser closes. The player this page is for asked for the
control to go once saving arrived.

**Migration**: Saving the converted text as a file replaces it, and is the control the
page now names whenever the text has to be taken away. A manual copy remains possible
and is what the page falls back to when saving fails: the result keeps its selectable
text and its place in the tab order, so it can be reached and selected from the
keyboard. `copy`, `copied`, `copyFailed` and `emptyResult` leave the string catalogue;
the sentence about there being nothing to copy is replaced by the save control's own.

### Requirement: Sharing the page

**Reason**: The player this page is for asked for both controls to go. Sharing is a
page-level action she does not perform from here, and the two controls — one in the
masthead, one in the footer — were two of the stops she passes through on every visit
to reach the file control. The browser's own share control still does the job the
buttons were saving her from hunting for.

**Migration**: Sharing happens through the browser's own share control, which the home
screen icon requirement already guarantees stays available by opening the page in the
browser rather than as a standalone window. The strings for the three share outcomes
leave the catalogue. `web/share.ts` is not deleted but renamed to `web/save.ts`: its
payload becomes the converted file instead of the page's address, and its outcome
model — a cancelled sheet and an already-open sheet are silence rather than failure —
is what the save control's sheet branch requires. This requirement stays in git, so
bringing the control back is a revert rather than a rewrite.

### Requirement: Telling the visitor how to keep the page

**Reason**: The instruction is four lines of text needed once and read out on every
visit, and it sat in the footer as a permanent stop in a page being cut down to the
two things she came for.

**Migration**: The manifest, the icons and the translated icon name all stay, so
adding the page to a home screen through the browser's own menu still produces an
icon named in her language. What goes is the paragraph explaining how, and the
disclosure holding it.

### Requirement: A pasted record is code, and unsaved

**Reason**: Both halves were about a field that no longer exists. Nothing can be
pasted into the page, so nothing needs marking as text a translator must leave alone
in the input; and the warning before leaving defended text that existed nowhere else,
which stopped being true the moment the record began arriving as a file the visitor
still holds.

**Migration**: The requirement that the game text must not be machine translated moves
to "Rendering the result safely", where it now covers the converted result. The
warning before leaving is not replaced but inverted: "Saving the converted text as a
file" requires that leaving the page is never interrupted, because the text can now be
saved and the file is still on her device.
