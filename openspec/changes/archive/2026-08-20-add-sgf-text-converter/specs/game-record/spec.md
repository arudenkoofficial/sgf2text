## ADDED Requirements

### Requirement: Parse SGF into a neutral game record

The system SHALL parse an SGF string into a `GameRecord` containing the board size,
game metadata and an ordered list of events, using a real SGF tree parser rather
than string splitting. The record SHALL contain no display strings and no language.

#### Scenario: Standard game

- **WHEN** an SGF file with root properties and a sequence of moves is parsed
- **THEN** the record exposes the board size, the metadata found in the root node,
  and one event per move in play order

#### Scenario: Property letters appearing inside a value

- **WHEN** the file contains `PB[FREDDY]RE[B+2.5]`, where the player name contains
  the letters of the `RE` property
- **THEN** the result is reported as `B+2.5` and the player name as `FREDDY`

#### Scenario: Input that is not SGF

- **WHEN** the input is empty or cannot be parsed as an SGF tree
- **THEN** the system raises an error naming the problem, and never returns a
  partially filled record

### Requirement: Board size

The system SHALL read the board size from the `SZ` property and default to 19 when
it is absent. Rectangular boards SHALL be rejected with an explicit error.

#### Scenario: Explicit size

- **WHEN** the root node contains `SZ[9]`
- **THEN** the record reports a board size of 9

#### Scenario: Size omitted

- **WHEN** the root node has no `SZ` property
- **THEN** the record reports a board size of 19

#### Scenario: Rectangular board

- **WHEN** the root node contains `SZ[19:9]`
- **THEN** the system raises an error stating that rectangular boards are unsupported

### Requirement: Passes

The system SHALL represent a pass as its own event, in both the modern and the
legacy encoding.

#### Scenario: Modern pass

- **WHEN** a node contains `B[]`
- **THEN** the record contains a pass event for black, and conversion of the rest of
  the game completes normally

#### Scenario: Legacy pass

- **WHEN** a node on a 19x19 board contains `B[tt]`
- **THEN** the record contains a pass event for black

#### Scenario: Legacy encoding on a large board

- **WHEN** a node on a board larger than 19 contains `B[tt]`
- **THEN** the record contains a move at the vertex `tt` denotes, not a pass

### Requirement: Nodes carrying no move

The system SHALL skip nodes that contain no move without interrupting conversion,
and SHALL NOT let them affect move numbering.

#### Scenario: Comment-only node

- **WHEN** a node contains only `C[a comment]` between two moves
- **THEN** conversion succeeds and the two surrounding moves are numbered
  consecutively

### Requirement: Variations

The system SHALL follow the main line of the game tree and SHALL NOT merge sibling
variations into the move sequence.

#### Scenario: Game with two variations

- **WHEN** a game continues as `(;W[dp];B[pp])(;W[dd];B[qq])` after move 1
- **THEN** the record contains only the moves of the first branch, and the moves of
  the second branch appear nowhere in the record

### Requirement: Captured stones

The system SHALL maintain a board position, apply every move to it, and remove the
enemy groups that the move leaves without liberties, recording their vertices
against that move. Removal SHALL happen in the order the rules prescribe: the stone
is placed first, enemy groups without liberties are removed next, and only then is
the moving player's own group considered — so that a move which appears suicidal but
captures is handled correctly.

Judging whether a move is legal is out of scope: the system computes the
consequences of what the file records and never rejects a move for suicide or for
violating ko.

#### Scenario: Single stone captured

- **WHEN** a move removes the last liberty of a lone enemy stone
- **THEN** that move's event lists exactly that one vertex as captured

#### Scenario: Group captured

- **WHEN** a move removes the last liberty of a connected enemy group
- **THEN** that move's event lists every vertex of the group

#### Scenario: Corner group captured

- **WHEN** the captured group sits in a corner, where the board edge supplies part
  of its enclosure
- **THEN** the capture is detected and every stone of the group is listed

#### Scenario: Ko recapture

- **WHEN** a ko is captured and later recaptured
- **THEN** each capture is recorded against the move that made it, one stone each

#### Scenario: Move that looks suicidal but captures

- **WHEN** a move places a stone on a vertex with no liberties of its own, and that
  move removes the last liberty of an adjacent enemy group
- **THEN** the enemy group is recorded as captured and the placed stone stays on the
  board, because enemy removal precedes any consideration of the player's own group

#### Scenario: Move that captures nothing

- **WHEN** a move leaves every enemy group with at least one liberty
- **THEN** that move's event lists no captured vertices

### Requirement: Setup stones

The system SHALL record stones placed by the `AB` and `AW` properties as a setup
event carrying their vertices and colours, so that a handicap can be reproduced on a
physical board.

#### Scenario: Handicap stones

- **WHEN** the root node contains `HA[4]AB[dd][pd][dp][pp]`
- **THEN** the record contains a setup event listing four black stones with their
  vertices, and the metadata reports a handicap of 4

#### Scenario: Handicap count without placements

- **WHEN** the root node contains `HA[4]` but no `AB` property
- **THEN** the metadata reports a handicap of 4 and the record contains no setup
  event

### Requirement: Public record API

The system SHALL expose `sgfToRecord(sgf)` as part of its public API, returning the
record without rendering any text, so that other tools can consume the parsed data.

#### Scenario: Record requested directly

- **WHEN** a caller invokes `sgfToRecord` with a valid SGF string
- **THEN** it receives the `GameRecord` and no language-specific strings
