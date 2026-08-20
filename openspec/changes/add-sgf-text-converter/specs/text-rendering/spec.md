## ADDED Requirements

### Requirement: Rendering a record as text

The system SHALL render a `GameRecord` as plain text in a chosen locale through
`sgfToText(sgf, { locale })`, producing a metadata block followed by one line per
event. Every line SHALL be self-contained so that a screen reader user can navigate
the result line by line.

#### Scenario: Metadata block precedes the moves

- **WHEN** a game with players, komi and a result is rendered
- **THEN** the output opens with the board size, both players, the komi and the
  result, and the move list follows

#### Scenario: Missing metadata

- **WHEN** the record has no tournament, no date and no komi
- **THEN** those lines are omitted entirely rather than rendered empty or as
  `undefined`

### Requirement: Western coordinates

For the `ru` and `en` locales the system SHALL name a vertex by a column letter from
`A` to `T` omitting `I`, followed by a row number counted from the bottom edge, so
that the notation matches what the OGS userscript speaks during live play.

#### Scenario: Top-right star point

- **WHEN** the vertex `pd` on a 19x19 board is rendered
- **THEN** the output names it `Q16`

#### Scenario: The letter I is never used

- **WHEN** the ninth column of the board is rendered
- **THEN** the output names it `J`, and no coordinate anywhere in the output uses
  the letter `I`

#### Scenario: Smaller boards

- **WHEN** the vertex `cc` on a 9x9 board is rendered
- **THEN** the output names it `C7`, counting the row from the bottom edge of that
  board

### Requirement: Japanese coordinates

For the `ja` locale the system SHALL follow the convention already established by
the Japan Go Association for the Visually Impaired: the column as an arabic number
counted from the left edge, the row as a kanji numeral counted from the top edge,
joined by `の`.

#### Scenario: Top-right star point in Japanese

- **WHEN** the vertex `pd` on a 19x19 board is rendered in the `ja` locale
- **THEN** the output names it `16の四`

### Requirement: Move lines

The system SHALL render each move as a numbered line naming the player and the
vertex, numbering moves consecutively from 1 across the whole game.

#### Scenario: Ordinary move

- **WHEN** the third move of the game is black at `pp` and it captures nothing
- **THEN** the line reads as move 3, black, `Q4`, with nothing about captures

#### Scenario: Pass

- **WHEN** a player passes
- **THEN** the line names that player and states that they passed, and the move
  number continues the sequence

### Requirement: Captures in the output

When a move captures stones, the system SHALL name every captured vertex on that
move's line, together with how many stones were taken, so the player knows what to
remove from a physical board.

#### Scenario: Capturing move

- **WHEN** move 57 is black at `D5` and captures three white stones at `D4`, `D6`
  and `C5`
- **THEN** the line names the move and then states that three white stones were
  captured, listing `D4`, `D6` and `C5`

#### Scenario: Single stone

- **WHEN** a move captures exactly one stone
- **THEN** the line uses the singular form appropriate to the locale

### Requirement: Handicap in the output

The system SHALL render handicap stones by listing their coordinates, not only their
count.

#### Scenario: Four-stone handicap

- **WHEN** the record contains a setup event with four black stones
- **THEN** the metadata block states a handicap of four stones and lists all four
  coordinates

### Requirement: Result formatting

The system SHALL render the `RE` property in words rather than passing through its
code.

#### Scenario: Win by resignation

- **WHEN** the result is `W+R`
- **THEN** the output states that white won by resignation

#### Scenario: Win on points

- **WHEN** the result is `B+3.5`
- **THEN** the output states that black won by 3.5 points

#### Scenario: Win on time

- **WHEN** the result is `B+T`
- **THEN** the output states that black won on time

#### Scenario: Draw and unknown results

- **WHEN** the result is `0`, `Draw`, `Void`, `?` or absent
- **THEN** the output states the corresponding outcome, or omits the result line if
  the property is absent, and never prints a raw code

### Requirement: Locales

The system SHALL support the locales `ru`, `en` and `ja`, each bundling its
vocabulary and its coordinate system, and SHALL default to `ru` when none is given.
Adding a locale SHALL require adding one file and no changes to the renderer.

#### Scenario: Locale selection

- **WHEN** the same record is rendered with `en` and then with `ja`
- **THEN** both outputs describe the same moves, each in its own language and its
  own coordinate convention

#### Scenario: Unknown locale

- **WHEN** a caller asks for a locale that does not exist
- **THEN** the system raises an error naming the supported locales
