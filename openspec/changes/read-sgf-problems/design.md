## Context

The converter reads a game as a single line of play: `parseGame` walks the main
line of the tree, `replay` applies the moves to a board to find captures, and
`render` turns the resulting `GameRecord` into text. Following only the main line
was a deliberate choice, recorded in `src/parse.ts` and in the `game-record`
spec — a branch presented as a continuation of the game is worse than a branch
left out.

A problem file breaks every assumption behind that pipeline. Its position comes
from `AB` and `AW` rather than from play, so the renderer reports it as a handicap
and drops the colours on the way — `render` maps setup stones to coordinates and
discards `stone.color` before the locale ever sees them. Its answer is the tree
itself, so following the main line yields one branch of several with nothing to
say that the others exist. Its statement lives in the root comment, which nothing
reads.

Game records themselves work and have been confirmed against real files by a
blind player. Whatever is done for problems must not touch them.

## Goals / Non-Goals

**Goals:**

- A problem can be reproduced on a tactile board from the text alone: every stone
  named with its colour, every capture named as it happens.
- The answer is complete: every line of the tree, not one branch of it.
- The converter states only what the file states, and marks a line wrong never.
- Game records are byte-identical to what they are today.

**Non-Goals:**

- Marking up the language of a note so a screen reader switches voice. It needs
  the library to return segments rather than a string, which is a larger change
  than this one and worth making only once there is evidence the mixed language
  actually gets in the way.
- Rendering variations inside game records. Commented games would benefit, but
  that changes output a blind player has already checked, and it belongs in its
  own change.
- Judging whether a move is legal, or whether an unmarked line really fails. The
  converter computes consequences; it does not hold opinions.
- Capping the size of the output. A deep tree will produce a long text. Whether
  that is a problem is a question for a real collection, not for a guess.

## Decisions

### A problem is its own record, rendered by its own path

Three shapes were considered.

Folding both genres into one model — `GameRecord` holding a setup and a list of
lines, a game being the case with one line — is the cleanest description of the
domain. It was rejected because it breaks `sgfToRecord`, which the README
documents as the API other tools consume, and because it means rewriting the
renderer and editing every existing test for a feature that does not concern
games at all.

Hanging an optional `variations` field on `GameRecord` is the smallest diff, and
was rejected because the main line would then exist twice — once in `events`,
once in `lines[0]`. Two places to change is one place to forget.

What is built instead: `parseSgf` returns either a game or a problem, `problem.ts`
builds the problem record, and `render.ts` gains a second entry point. Games
cannot break because nothing on their path changes.

### Each line is replayed by assembling a game

`replay` takes a `ParsedGame` whose moves may open with a setup event, and applies
them to a board in order. A line of a problem is exactly that: the setup,
followed by the moves from the root of the tree to one leaf. So each line is
replayed by handing `replay` a synthetic game, and `replay.ts` needs no edit at
all.

This matters more than it looks. Captures are the part a blind player cannot
verify: a missed capture leaves a stone on the tactile board and every later
coordinate lands in a position that no longer matches. The logic that finds them
is already tested against ko, corner groups and moves that look suicidal; the
alternative — a tree-aware replay written for this change — would be new code on
the one path where a silent error does the most damage.

Lines are replayed independently rather than by walking the tree with an undo
stack. Independent replay is O(lines x depth) instead of O(nodes), which for a
problem is nothing, and it cannot leak a capture from one branch into another.

### Genre is decided by `AW` or `PL`, never by branching

A handicap places black stones only, so white setup stones mean the position was
constructed rather than played. `PL` is the same evidence from the other side: a
game record has no reason to say whose turn it is, because the history says so.

Branching was rejected as a signal even though every problem has it. A reviewed
game is full of variations and is still a game, and announcing a solution in the
middle of one would be a worse failure than anything this change fixes.

### The solution is a flat list of complete lines

The tree could be rendered as a tree — a shared prefix written once, branches
introduced by "if black answers here". It is shorter, and on screen it is
obviously better.

It was rejected because the reader is listening, not looking. Indentation does
not survive speech: a screen reader either ignores leading whitespace or announces
it as a count of spaces. Following a nested answer means holding a position in the
tree in memory while moving stones on a board with both hands. A flat line can be
followed from move 1 to the end and re-read on its own.

The cost is repetition — eight lines sharing prefixes in the reference file. This
was checked with blind players before choosing, and the flat form was preferred.
That preference came from reading the two forms rather than from solving on a
board, so it is worth revisiting once a collection has been used in practice.

### A missing mark means nothing

Problem files mark a solving line with `RIGHT` in a comment. That is a convention
of the tools that produce them, not part of SGF, and other collections use other
words or the standard `TE`, `GB` and `BM` properties instead.

So the rule is asymmetric: a mark the system recognises produces a verdict, and
the absence of one produces no verdict at all. A collection whose marks the system
does not recognise degrades into a numbered list of lines — correct, if less
useful. The alternative, treating unmarked as wrong, turns an unrecognised
convention into the converter telling a blind player that the right move fails,
which they have no way to check.

### Locales stay TypeScript for now

`move-translations-to-json` is proposed and unimplemented, and it will move the
new wording along with the old. Doing it first delays a feature a player is
waiting for in exchange for nothing they can hear, and its own proposal promises
no output changes, so it can absorb these strings whenever it lands.

## Risks / Trade-offs

- **A collection marks its solutions in a way the system does not recognise** →
  Output degrades to unnumbered verdicts rather than to wrong ones. Recognising
  more conventions is additive and can follow once real collections are seen.

- **A file is a constructed position but a genuine game continuation, such as a
  study of a joseki set up with `AW`** → It renders as a problem. Acceptable: the
  statement block describes such a file correctly, and only the words "problem"
  and "solution" are wrong.

- **A deep tree produces an unreadably long text** → Not mitigated in this change.
  The reference file yields eight lines, which is fine. A cap invented now would
  be a guess, and a silent cap on an accessibility tool is worse than a long text.

- **The web page announces "converted, N moves" by counting numbered lines** →
  For a problem that counts every move of every line. The announcement needs its
  own wording for problems, or the count would mislead.

- **Test fixtures come from correspondence** → Fixtures must be reduced to the SGF
  itself, with no name, contact or quotation anywhere in the repository.

- **The flat format was chosen from reading, not from solving on a board** →
  Revisit after a collection has been used. The renderer is one function, so a
  different shape is a contained change.

## Open Questions

- Whether a problem should be convertible to statement only, with the solution
  withheld until asked for. The heading serves this today by letting a listener
  stop, which may be enough.
- Whether mixed-language notes are a real obstacle in use, which decides if
  segment-returning output is worth building.
