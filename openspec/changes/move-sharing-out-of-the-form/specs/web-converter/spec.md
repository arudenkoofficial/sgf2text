## MODIFIED Requirements

### Requirement: Sharing the page

The page SHALL offer, in the masthead and again in the footer, a control that hands
the page's own address to the operating system's share sheet, and SHALL pass the
address in the language currently being read, so that the recipient opens the version
the sender was looking at.

Both controls SHALL carry the same accessible name, because they perform the same
action and two names would promise a difference that does not exist. Neither SHALL be
placed among the controls that convert a game: the page's own actions belong with the
page's own actions, which is where the language control and the home screen
instruction already are.

Where the browser offers no share sheet, the control SHALL copy the address to the
clipboard instead. It SHALL announce which of the two happened, in a polite live
region beside the control that was pressed, and SHALL NOT move focus: sharing
succeeded, and there is nothing for the visitor to act on.

The control exists because handing this tool to the next blind player is something
the players do for each other, and a browser's own share control has to be hunted
for. A named button in the page is reachable by the same means as everything else
here.

A share the browser refuses because one is already outstanding SHALL NOT be announced
as a failure and SHALL NOT fall through to the clipboard: the outcome she is waiting
for has not happened, and overwriting what she was holding is a loss she did not ask
for. Whether a share is outstanding SHALL be answered by the browser rather than
remembered by the page, and no share SHALL leave either control unable to try again.

The page's own memory of an open sheet agrees with the browser's answer for as long as
outcomes arrive. Where they part is where it matters: a share whose outcome never
arrives leaves that memory shut for the rest of the visit, and both controls then
answer every press with nothing at all. Silence is the one outcome a blind visitor
cannot detect — a control that has gone permanently mute is indistinguishable, to her,
from one she failed to activate.

Each control MAY carry a mark beside its name. Such a mark SHALL be hidden from
assistive technology and SHALL NOT be the only thing naming the control, since a
glyph names nothing to a visitor who cannot see it.

Only the page's address is transmitted. The game in the input is not part of what is
shared, under any branch of this requirement.

#### Scenario: Shared through the system sheet

- **WHEN** a visitor activates either share control in a browser that offers a share
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

- **WHEN** a visitor activates either control in a browser without the share sheet
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

#### Scenario: The outcome is announced where the visitor is

- **WHEN** a visitor activates the share control in the footer
- **THEN** the outcome is announced in the region belonging to that control, not in
  one at the other end of the page, because a reader at high magnification sees only
  the part of the page she is in

#### Scenario: Sharing is not offered among the conversion controls

- **WHEN** a visitor reaches the buttons that convert and copy a game
- **THEN** sharing the page is not one of them, so nothing there suggests that the
  game is what would be shared

#### Scenario: A second press while the sheet still stands

- **WHEN** a visitor opens the share sheet from one control and activates the other
  control while that sheet is still open
- **THEN** nothing is announced and the clipboard is left untouched, because the share
  she started may still succeed and reporting an outcome now would report one that has
  not happened

#### Scenario: A share whose outcome never arrives

- **WHEN** a share is started and the browser never reports how it ended
- **THEN** a later press still reaches the browser and is answered on its own merits,
  rather than both controls going permanently silent on the strength of the page's own
  record of a sheet it can no longer see

### Requirement: A message describes only what it is about

A message the page announces SHALL be associated with the game field only when the
field is what the message is about. A message about anything else — the result, the
clipboard, a file that could not be read, the address of the page — SHALL NOT become
the field's description, SHALL NOT mark the field invalid, and SHALL NOT move focus
into it.

What each message is about SHALL be stated where the message is announced, and the
region SHALL be derived from it rather than chosen alongside it. Choosing the region by
hand at each call site leaves the subject written down nowhere, so the choice is a
habit rather than a decision and no test can read it — which is how three messages came
to be announced about the wrong thing, none of them failing a test.

The field's description is read out every time she reaches the field. A message left
there outlives the moment it was about, so "the address of this page has been copied"
becomes part of how the page introduces her own game record, minutes after the
copying. Marking the field invalid is worse than untidy: it tells her the record she
is holding is wrong, on the evidence of something that never examined it.

A file that could not be read is the closest of these calls, since the field is where
the file's contents were going and where she can paste them instead. It is still not
about the field: the record already sitting there may be a perfectly good game, and
nothing about a failed file read examined it.

Every message SHALL sit beside the control that produced it, as the requirement about
a message staying with its field already asks. Where a page offers the same action in
more than one place, each place SHALL have its own region, since one fixed region
cannot be beside two controls at opposite ends of a page.

At most one such message SHALL be readable at a time: putting a message in one region
SHALL clear whatever another region was holding, so a sentence that has stopped being
true is not left behind for a visitor reading the page in order.

The field's own description is not one of these messages and SHALL NOT be cleared by
them. It states the condition of the field, so it SHALL stand until that condition
changes — otherwise a field marked invalid is left without the sentence saying why,
and a screen reader announces a problem it cannot explain.

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

#### Scenario: A file that could not be read is not a bad record

- **WHEN** a chosen file cannot be read while a game record the visitor pasted earlier
  is still in the field
- **THEN** the page says the file could not be read, and does not mark that record
  invalid or move her into the field, because nothing about the file examined the
  record

#### Scenario: The field's description holds only its own messages

- **WHEN** the address of the page has been copied and the visitor later reaches the
  game field
- **THEN** what is read out with the field is the field's own label and description,
  and not the message about the address

#### Scenario: One message at a time, wherever it is

- **WHEN** a visitor shares from the masthead and then shares from the footer
- **THEN** the second outcome is announced beside the footer control and the first is
  no longer anywhere on the page, rather than both standing as if both had just
  happened

#### Scenario: A mark of invalidity keeps its explanation

- **WHEN** a record that failed to parse is in the field, and the visitor then shares
  the page and later returns to the field
- **THEN** the field is still marked invalid and still describes what was wrong with
  the record, because sharing the page never examined the record and so cannot be the
  reason its explanation disappears
