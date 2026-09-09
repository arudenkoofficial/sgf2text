## Why

Go problems are distributed as SGF, and to a blind player they are as unreadable
today as game records were before this tool existed. Converting a problem file
yields a list of 27 coordinates with nothing to say which stones are black and
which are white, so the position cannot be put on a tactile board at all. The
problem's own statement — whose turn it is, what is being asked — is dropped, and
of the eight lines the answer actually contains, exactly one survives.

Problems are how a player trains between games. Without them a blind player can
replay professional games but cannot practise.

## What Changes

- A file that sets up a position rather than recording a game is recognised as a
  problem and rendered as one, instead of being reported as a game with a
  27-stone handicap.
- Setup stones are grouped by colour and labelled, the side to move first, so
  that the position can be reproduced without guessing which stone is which.
- The side to move is stated in words, read from the `PL` property.
- The root node's comment is carried through as a note, so the theme of the
  problem and its source are not lost.
- The whole variation tree is expanded into a flat list of complete lines, each
  numbered from move 1 and each standing on its own, so no line has to be
  understood relative to another.
- Every line is replayed independently under Go rules from the setup position, so
  the stones a move captures are named. Without this the board goes wrong
  silently: a line that takes a stone leaves an extra stone on a tactile board.
- A line the file marks as correct is labelled as correct. A line the file does
  not mark carries no verdict — the converter never calls a move wrong on the
  strength of a missing mark.
- Game records are untouched. No existing output changes.

## Capabilities

### New Capabilities
- `problem-record`: recognising a problem file, and building its neutral record —
  setup stones with colours, the side to move, the note, and every line of the
  variation tree replayed under the rules.

### Modified Capabilities
- `text-rendering`: a problem is rendered as a statement block and a solution
  block rather than as a game; setup stones in a problem are named by colour
  rather than reported as a handicap.

## Impact

- `src/parse.ts`: recognises a problem, reads `PL`, the root comment and the
  variation tree.
- `src/problem.ts` (new): expands the tree into lines and replays each one.
- `src/replay.ts`: unchanged. Each line is replayed by assembling a game whose
  first event is the setup, which the existing function already handles.
- `src/render.ts`, `src/locale.ts`, `src/locales/*.ts`: a second rendering path
  and the words it needs.
- `src/index.ts`: `sgfToText` chooses the path; `sgfToRecord` keeps its shape, so
  tools consuming the record are unaffected.
- `web/main.ts`: the "converted, N moves" announcement counts numbered lines and
  would count every move of every line. It needs to announce a problem
  differently.
- `README.md`: what the converter does with a problem file.
