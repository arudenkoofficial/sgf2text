# problem-record Specification

## Purpose
Reading an SGF file that sets a position to solve rather than recording a game,
and holding it as a neutral record: the setup stones with their colours, the side
to move, the file's own statement and every line of the answer.
## Requirements
### Requirement: Recognising a problem

The system SHALL treat an SGF file as a problem when the position it opens with
holds at least one white setup stone, and as a game record otherwise. The position
is the one those opening nodes settle to, so stones the file places and takes off
again do not count towards it. The opening nodes are the root and the nodes below
it that set stones before anybody plays, since a file is free to spend its root on
`GM`, `FF` and `SZ` alone.

A recorded result (`RE`) or handicap (`HA`) SHALL settle the file as a game record
before its stones are examined. Both describe something that was played, and a
problem can carry neither honestly; this keeps a game resumed from a diagram — a
real game holding real white setup stones — on the game side.

`PL` SHALL NOT be part of the test. It resembles a problem's way of naming the
side to play, but it is equally how a handicap game states that White moves first,
so counting it read such games as problems with their players, komi, handicap and
result discarded. `PL` still says whose move it is once the file is known to be a
problem.

A handicap game SHALL remain a game record: a handicap places black stones only,
so `AB` alone is never evidence of a problem.

Recognition SHALL happen once, on a single parse of the input, and SHALL NOT
depend on the presence of variations — a commented game is full of variations and
is still a game.

#### Scenario: Position built from both colours

- **WHEN** the root node contains `AB[bb][bd]AW[be][bg]PL[W]`
- **THEN** the file is recognised as a problem

#### Scenario: Position stated below the root

- **WHEN** the root node holds `GM`, `FF`, `SZ` and `AP` alone, and the node below
  it contains `AB[cc][dd]AW[cd][dc]`
- **THEN** the file is recognised as a problem, and its setup holds all four stones

#### Scenario: Side to play without white setup stones

- **WHEN** the root node contains `AB[dd][pp]PL[W]` and no `AW`
- **THEN** the file is recognised as a game record

#### Scenario: Handicap game

- **WHEN** the root node contains `HA[4]AB[dd][pd][dp][pp]` and no `AW`
- **THEN** the file is recognised as a game record and its handicap is reported
  as before

#### Scenario: Handicap game that names White as first to play

- **WHEN** the root node contains `HA[4]PB[Bob]PW[Alice]RE[W+3.5]AB[dd][pd][dp][pp]PL[W]`
- **THEN** the file is recognised as a game record, and its players and result
  survive

#### Scenario: Game resumed from a diagram

- **WHEN** the root node contains `RE[B+R]AW[dd]AB[pp]` and moves follow
- **THEN** the file is recognised as a game record, the recorded result outweighing
  the white setup stone

#### Scenario: Commented game with variations

- **WHEN** a game record contains sibling variations but no white setup stones
- **THEN** the file is recognised as a game record and only its main line is
  reported

### Requirement: Setup stones carry their colour

The system SHALL record a problem's setup stones with the colour of each stone
preserved, so that the position can be reproduced on a physical board without
inferring which stone is which.

#### Scenario: Both colours present

- **WHEN** a problem's root node contains thirteen `AB` stones and fourteen `AW`
  stones
- **THEN** the record reports thirteen black stones and fourteen white stones,
  each group separately, and no stone appears in the wrong group

### Requirement: Side to move

The system SHALL read the side to move from the `PL` property. When `PL` is
absent, the system SHALL take the colour of the first move in the tree. When the
tree holds no move either, the system SHALL report black.

#### Scenario: Side named explicitly

- **WHEN** the root node contains `PL[W]`
- **THEN** the record reports white to move

#### Scenario: Side inferred from the first move

- **WHEN** the root node has no `PL` and the first node of the tree contains
  `W[eg]`
- **THEN** the record reports white to move

#### Scenario: Position with no moves at all

- **WHEN** the root node has no `PL` and the tree contains no move
- **THEN** the record reports black to move

### Requirement: The problem's note

The system SHALL carry the root node's comment through to the record unchanged as
a note, and SHALL omit the note when the root node has no comment or its comment
is blank. Runs of blank lines inside the note SHALL be collapsed to one, so that
text from the file cannot be mistaken for a break between blocks.

#### Scenario: Root comment present

- **WHEN** the root node's comment holds two paragraphs separated by more than one
  blank line
- **THEN** the record carries that text as its note, with the run of blank lines
  reduced to one

#### Scenario: No root comment

- **WHEN** the root node has no `C` property
- **THEN** the record carries no note

### Requirement: Lines of the variation tree

The system SHALL expand the whole variation tree into a flat list of lines, one
per leaf, each holding every move from the root of the tree to that leaf. Lines
SHALL appear in the order the file lists their branches, depth first.

#### Scenario: Tree with several branches

- **WHEN** the tree holds four first moves, the first of which branches into four
  leaves of its own and the last into two
- **THEN** the record holds eight lines, the first four beginning with the first
  of those moves

#### Scenario: Line holds its whole path

- **WHEN** a leaf sits three moves deep
- **THEN** its line holds all three moves in play order, beginning at the first
  move of the branch and not at the leaf

### Requirement: Captures within a line

The system SHALL replay each line independently under Go rules, starting from the
setup position, and SHALL record the stones each move captures. Lines diverge, so
a single traversal of the tree cannot supply them.

#### Scenario: Line that captures

- **WHEN** a move in one line removes the last liberty of a setup stone
- **THEN** that move records the captured vertex, and the moves of the other lines
  are unaffected by it

#### Scenario: Lines do not contaminate each other

- **WHEN** two lines share their first three moves and then diverge
- **THEN** each line is replayed from the setup position, and a capture in one
  line does not appear in the other

### Requirement: A line's verdict

The system SHALL mark a line as correct when the file marks it so, and SHALL leave
a line unmarked otherwise. The system SHALL NOT infer that an unmarked line is
wrong: SGF has no way of saying that a branch fails, and telling a blind player
that a correct move is wrong is worse than telling them nothing.

#### Scenario: Line the file marks

- **WHEN** the comment on a line's last node reads `RIGHT`
- **THEN** the line is recorded as correct

#### Scenario: Line the file does not mark

- **WHEN** a line's nodes carry no comment
- **THEN** the line is recorded without a verdict, and not as wrong

### Requirement: Problem with no lines

The system SHALL accept a problem that records a position and no moves, reporting
its setup, side to move and note with an empty list of lines.

#### Scenario: Position only

- **WHEN** the file sets up stones and the tree holds no move
- **THEN** the record holds the setup and no lines, and conversion succeeds

### Requirement: Public problem API

The system SHALL expose the problem record as part of its public API, returning it
without rendering any text, and SHALL keep `sgfToRecord` returning a `GameRecord`
so that existing consumers are unaffected.

#### Scenario: Problem requested directly

- **WHEN** a caller asks for the problem record of a problem file
- **THEN** it receives the setup, the side to move, the note and the lines, and no
  language-specific strings
