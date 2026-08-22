## ADDED Requirements

### Requirement: Every action is answered, including a repeat

Every activation of a control SHALL be answered, and an activation that produces the
same outcome as the one before it SHALL be answered again rather than skipped because
the page has already said that sentence once. Choosing the same file twice SHALL
likewise be two answered actions.

A polite live region reports what appears in it. A sentence rewritten identically is
still an appearance and SHALL be written; a sentence left in place is not, and reads as
a control that did nothing.

She presses a second time precisely because she is unsure the first press registered.
Silence is the one outcome she cannot investigate: she cannot glance at the clipboard, or
see the button flash, or check whether anything moved. A control that answers once and
then ignores her is indistinguishable, from where she is, from a control that is broken.

Silence remains correct where there is genuinely no outcome yet — a dismissed share
sheet, a share the browser refuses because one is already open. What this requirement
forbids is silence standing in for an outcome that has happened.

#### Scenario: The same answer, twice

- **WHEN** the visitor activates the copy control twice with nothing converted
- **THEN** the page says there is nothing to copy on both presses, rather than
  answering the first and ignoring the second because the sentence has not changed

#### Scenario: A second copy is confirmed too

- **WHEN** the visitor copies the result and then copies it again
- **THEN** both copies are confirmed, because the second one happened just as much as
  the first

#### Scenario: The same file, chosen again

- **WHEN** the visitor chooses a file, and later chooses that same file again
- **THEN** it is read again and the outcome announced again, rather than the second
  choice reaching nothing because the control still holds the first

### Requirement: A message does not outlive what it describes

A message SHALL stand only while what it describes still holds. A message about a
completed action SHALL NOT be announced a second time by anything other than that action
happening again; a message about the record in the field SHALL be cleared, along with any
mark of invalidity, when that record is replaced.

This is the third of the three questions a message has to answer, beside what it is
about and where it is said: for how long is it true. Getting it wrong produces the
page's most misleading behaviour, because a sentence that was accurate when written is
read out as though it were accurate now.

A failure is different from a confirmation here. A failure describes a condition that is
still in force — the record is still broken, and she is still owed the reason in a
language she reads — so restating it in the new language is restating something true. A
confirmation describes an event that finished; repeating it reports an event that is not
happening.

#### Scenario: Changing the language does not repeat a finished action

- **WHEN** the visitor copies the page's address and then changes the language
- **THEN** the confirmation is not announced again in the new language, because nothing
  was copied by changing the language

#### Scenario: Changing the language restates a standing failure

- **WHEN** a record has failed to convert and the visitor then changes the language
- **THEN** the reason is stated again in the new language, because the record is still
  broken and the explanation is what she has to act on

#### Scenario: A replaced record loses the verdict on the old one

- **WHEN** a record has failed to convert and the visitor then edits or replaces it in
  the field
- **THEN** the field stops being marked invalid and stops describing the old failure,
  rather than telling a screen reader that a record the page has never examined is wrong

#### Scenario: The verdict returns with the next conversion

- **WHEN** the visitor replaces a failed record with another one and converts it
- **THEN** the page states the outcome of that conversion, so clearing the old verdict
  leaves the field described by its own present state rather than by nothing at all

## MODIFIED Requirements

### Requirement: Copying the result

The page SHALL let the visitor copy the converted text and SHALL confirm that the
copy happened. Every copy SHALL be confirmed, including one that repeats the copy
before it: the confirmation belongs to the action, not to the sentence.

#### Scenario: Copy confirmed

- **WHEN** the visitor activates the copy control
- **THEN** the plain text of the result is placed on the clipboard, with line breaks
  preserved, and the live region announces that it was copied

#### Scenario: Copying twice is confirmed twice

- **WHEN** the visitor activates the copy control a second time without converting
  anything in between
- **THEN** the text is placed on the clipboard again and the live region announces it
  again, because a confirmation she does not hear is a copy she cannot know happened
