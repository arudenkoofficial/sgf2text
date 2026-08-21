## ADDED Requirements

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
