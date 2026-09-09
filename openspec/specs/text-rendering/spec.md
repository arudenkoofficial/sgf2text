# text-rendering Specification

## Purpose
TBD - created by archiving change add-sgf-text-converter. Update Purpose after archive.
## Requirements
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

The system SHALL name a vertex by a column letter from `A` to `T` omitting `I`,
followed by a row number counted from the bottom edge, so that the notation matches
what the OGS userscript speaks during live play. Western notation is the only
coordinate system in this version, but it SHALL be held in a named coordinate system
rather than inlined into the renderer, so that a locale needing another notation can
supply one.

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

The system SHALL render handicap stones by listing their coordinates, not only
their count. This applies to a game record. A problem's setup stones SHALL NOT be
rendered as a handicap: they are a constructed position, they include both
colours, and their count is not a handicap.

#### Scenario: Four-stone handicap

- **WHEN** the record contains a setup event with four black stones
- **THEN** the metadata block states a handicap of four stones and lists all four
  coordinates

#### Scenario: Constructed position

- **WHEN** a problem sets up stones of both colours
- **THEN** the output states no handicap, and names the stones by colour instead

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

The system SHALL support the locales `ru` and `en`, each bundling its vocabulary and
the coordinate system it uses, and SHALL default to `ru` when none is given. Adding
a locale SHALL require adding one file and no changes to the renderer.

#### Scenario: Locale selection

- **WHEN** the same record is rendered with `ru` and then with `en`
- **THEN** both outputs describe the same moves with the same coordinates, each in
  its own language

#### Scenario: Unknown locale

- **WHEN** a caller asks for a locale that does not exist
- **THEN** the system raises an error naming the supported locales

### Requirement: Rendering a problem

The system SHALL render a problem as a statement block followed by a solution
block, in the same locales and the same coordinate system as a game record. The
statement SHALL name the board size, say that the file is a problem, state the
side to move, list the setup stones by colour and carry the note. The solution
SHALL follow under a heading of its own.

The blocks SHALL be separated by that heading rather than by a rule drawn in
punctuation: a screen reader speaks a row of dashes as a row of dashes. The
heading is also what lets a player stop reading before the answer, so it SHALL
precede every line of the solution.

#### Scenario: Statement precedes the solution

- **WHEN** a problem with setup stones and a variation tree is rendered
- **THEN** the output opens with the board size, the word for a problem, the side
  to move and the setup stones, and the solution follows under its own heading

#### Scenario: No punctuation rules

- **WHEN** any problem is rendered
- **THEN** no line of the output consists of repeated dashes, equals signs or
  other punctuation used as a divider

### Requirement: Setup stones named by colour

The system SHALL render a problem's setup stones as one line per colour, each
naming the colour, how many stones it has and their coordinates. The side to move
SHALL come first, so that a player hears their own stones before the opponent's.

#### Scenario: White to move

- **WHEN** a problem where white is to move holds fourteen white and thirteen
  black setup stones
- **THEN** the white line comes first, names fourteen stones and lists their
  coordinates, and the black line follows with thirteen

#### Scenario: One colour only

- **WHEN** a problem's setup holds stones of one colour
- **THEN** only that colour's line is rendered, and no empty line is produced for
  the other

### Requirement: The solution as a flat list of lines

The system SHALL render each line of the solution in full, numbered from move 1,
under a heading naming its ordinal. A line SHALL NOT be rendered relative to
another line, and the output SHALL NOT use indentation to express the shape of the
tree: a screen reader conveys neither indentation nor position within a nesting.

The solution heading SHALL state how many lines follow.

#### Scenario: Lines are self-contained

- **WHEN** two lines share their first three moves
- **THEN** both are rendered in full from move 1, and neither refers to the other

#### Scenario: Line count announced

- **WHEN** a solution holds eight lines
- **THEN** the solution heading states that there are eight

#### Scenario: No indentation

- **WHEN** a solution of any depth is rendered
- **THEN** no line of the output begins with whitespace

### Requirement: Verdicts in the output

The system SHALL mark a line the file marks as correct, and SHALL render an
unmarked line with its ordinal alone.

#### Scenario: Marked line

- **WHEN** a line is recorded as correct
- **THEN** its heading names its ordinal and says that it is correct

#### Scenario: Unmarked line

- **WHEN** a line carries no verdict
- **THEN** its heading names its ordinal and says nothing about correctness

### Requirement: Captures inside a solution

The system SHALL name the stones a move captures on that move's line, in a
problem exactly as in a game record, so that a player removes the right stones
from a physical board while following the answer.

#### Scenario: Capturing move inside a line

- **WHEN** the fourth move of a line captures one stone
- **THEN** that move's line names the capture and the captured vertex, in the same
  wording a game record uses

### Requirement: Game metadata omitted from a problem

The system SHALL omit player names, komi, result, event, place and date when
rendering a problem. A problem file carries these as artefacts of the format
rather than as facts, and reading them aloud is noise.

#### Scenario: Placeholder players and zero komi

- **WHEN** a problem's root node contains `PW[White]PB[Black]KM[0.00]`
- **THEN** the output names no players and no komi

### Requirement: The note in the output

The system SHALL render the problem's note under a label of its own, passing the
text through unchanged, and SHALL omit the label when there is no note.

#### Scenario: Note present

- **WHEN** the problem carries a note
- **THEN** the output holds a labelled note line with the text of the note

#### Scenario: No note

- **WHEN** the problem carries no note
- **THEN** the output holds no note label

