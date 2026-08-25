## 1. Fixtures

- [x] 1.1 Add `test/fixtures/problem-attack.sgf`: a real problem with `AB`, `AW`,
  `PL[W]`, a root comment and a four-branch tree whose solving lines end in
  `C[RIGHT]`, one of which captures a setup stone. Strip everything identifying —
  the file holds the SGF and nothing else.
- [x] 1.2 Add `test/fixtures/problem-position-only.sgf`: setup stones and no moves.
- [x] 1.3 Add `test/fixtures/problem-no-marks.sgf`: a small tree where no node
  carries a `RIGHT` comment.

## 2. Recognising a problem

- [x] 2.1 Write a failing test asserting that a file with `AW` is recognised as a
  problem and a file with `HA[4]AB[...]` and no `AW` is still a game whose
  handicap is reported.
- [x] 2.2 Write a failing test asserting that `PL[W]` alone makes a file a problem,
  and that `test/fixtures/variations.sgf` — branching, but no `AW` and no `PL` —
  is still a game rendered from its main line.
- [x] 2.3 Implement the recognition in `src/parse.ts` as a single parse returning
  either a game or a problem.

## 3. The problem record

- [x] 3.1 Write a failing test asserting that setup stones keep their colour, that
  the counts per colour are right, and that no stone lands in the wrong group.
- [x] 3.2 Write a failing test for the side to move: read from `PL`, else the
  colour of the first move in the tree, else black.
- [x] 3.3 Write a failing test asserting the root comment becomes the note with
  runs of blank lines collapsed to one, and that a file without `C` has no note.
- [x] 3.4 Implement the problem types in `src/types.ts` and the parsing in
  `src/parse.ts`.

## 4. Lines of the tree

- [x] 4.1 Write a failing test asserting the reference fixture yields exactly eight
  lines, in file order, each holding every move from the root of its branch to its
  leaf.
- [x] 4.2 Write a failing test asserting a problem with no moves yields no lines
  and still converts.
- [x] 4.3 Write a failing test asserting a line whose move captures a setup stone
  records that capture, and that a line sharing its prefix does not.
- [x] 4.4 Write a failing test asserting a line whose last node comments `RIGHT` is
  marked correct, and that an unmarked line carries no verdict and is not marked
  wrong.
- [x] 4.5 Implement `src/problem.ts`: expand the tree depth first, replay each line
  by handing `replay` a synthetic game whose first event is the setup. Do not edit
  `src/replay.ts`.

## 5. Rendering the statement

- [x] 5.1 Write a failing test asserting the statement names the board size, the
  word for a problem, the side to move, and one line per colour with count and
  coordinates, the side to move first.
- [x] 5.2 Write a failing test asserting `PW[White]PB[Black]KM[0.00]` in a problem
  produces no player line and no komi line, and that no handicap is reported.
- [x] 5.3 Write a failing test asserting the note is rendered under its label, and
  omitted with the label when absent.
- [x] 5.4 Implement the statement half of `renderProblem` in `src/render.ts`.

## 6. Rendering the solution

- [x] 6.1 Write a failing test asserting the solution heading states the number of
  lines and precedes every line of the solution.
- [x] 6.2 Write a failing test asserting each line is rendered in full from move 1,
  that two lines sharing a prefix both carry it, and that no output line begins
  with whitespace.
- [x] 6.3 Write a failing test asserting no output line consists of repeated
  punctuation used as a divider.
- [x] 6.4 Write a failing test asserting a capturing move inside a line names the
  capture in the same wording a game record uses.
- [x] 6.5 Write a failing test asserting a marked line says it is correct and an
  unmarked line says nothing about correctness.
- [x] 6.6 Implement the solution half of `renderProblem`.

## 7. Locales

- [x] 7.1 Write a failing test asserting `ru` and `en` define the same keys for the
  new wording, and that Russian inflects the stone counts (1 камень, 2 камня,
  14 камней) and the line count.
- [x] 7.2 Add the wording to `src/locale.ts`, `src/locales/ru.ts` and
  `src/locales/en.ts`.

## 8. Public API

- [x] 8.1 Write a failing test asserting `sgfToText` renders a problem file as a
  problem and a game file exactly as before.
- [x] 8.2 Write a failing test asserting `sgfToRecord` still returns a `GameRecord`
  with the shape it has today.
- [x] 8.3 Export the problem record from `src/index.ts` alongside `sgfToRecord`.

## 9. Delivery

- [x] 9.1 Write a failing test for the web announcement: converting a problem
  announces the problem rather than a move count summed across every line.
- [x] 9.2 Update `web/main.ts` and `web/ui-strings.ts` for that announcement.
- [x] 9.3 Run the whole suite and confirm every pre-existing test passes untouched;
  any test needing an edit means a game record changed, which this change forbids.
- [x] 9.4 Run `npm run typecheck`, `npm run typecheck:web` and `npm run build:web`.
- [x] 9.5 Convert the reference problem through the CLI and read the output against
  the format in `design.md`.
- [x] 9.6 Document in `README.md` what the converter does with a problem file,
  with a short example.
