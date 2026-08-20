## ADDED Requirements

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
carry an accessible name. The page SHALL announce results and errors without moving
focus away from what the visitor is doing.

#### Scenario: Result announced

- **WHEN** conversion finishes
- **THEN** the result region, marked as a polite live region, announces that the
  conversion is ready, and focus stays where the visitor left it

#### Scenario: Keyboard-only operation

- **WHEN** a visitor navigates the page using only the keyboard
- **THEN** every control — input, file chooser, language switcher, convert, copy —
  can be reached and activated, and each is announced with its purpose

#### Scenario: No modal dialogs

- **WHEN** any error occurs
- **THEN** the message is rendered as text on the page and announced through the
  live region, and the page never calls `alert`, `confirm` or `prompt`

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

### Requirement: Language switching

The page SHALL offer the supported languages and SHALL re-render an already
converted game when the language changes.

#### Scenario: Language changed after conversion

- **WHEN** a visitor converts a game and then selects another language
- **THEN** the result is re-rendered in that language without the visitor having to
  paste the game again

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

### Requirement: Rendering the result safely

The page SHALL insert converted text as text content only.

#### Scenario: Game containing markup-like characters

- **WHEN** a player name or comment contains characters such as `<`, `>` or `&`
- **THEN** they appear literally in the result and are never interpreted as markup
