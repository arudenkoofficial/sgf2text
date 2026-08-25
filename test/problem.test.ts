import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSgf } from '../src/parse.ts';
import { buildProblem } from '../src/problem.ts';
import type { ProblemRecord } from '../src/types.ts';

const fixture = (name: string): string =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

const problemOf = (sgf: string): ProblemRecord => {
  const parsed = parseSgf(sgf);
  assert.equal(parsed.kind, 'problem', 'the input was not recognised as a problem');

  return buildProblem(parsed.problem);
};

const reference = (): ProblemRecord => problemOf(fixture('problem-attack.sgf'));

test('a position built from both colours is a problem', () => {
  assert.equal(parseSgf(fixture('problem-attack.sgf')).kind, 'problem');
});

// A handicap places black stones only, so AB on its own is never evidence that
// the position was constructed rather than played.
test('a handicap game stays a game, and keeps reporting its handicap', () => {
  const parsed = parseSgf(fixture('handicap4.sgf'));

  assert.equal(parsed.kind, 'game');
  assert.equal(parsed.kind === 'game' ? parsed.game.meta.handicap : undefined, 4);
});

/**
 * The regression the first version of this shipped with, and the reason `PL` is
 * no longer evidence of anything but whose move it is.
 *
 * `PL[W]` reads like a problem's way of saying "White to play" and is in fact a
 * handicap game's way of saying the same thing: Black has already placed her
 * stones, so White opens. Counting it turned every such record into a problem,
 * threw away the players, the komi, the handicap and the result, and read the
 * moves of a real game out as the answer to a puzzle.
 *
 * The fixture on its own could not catch this — `handicap4.sgf` carries no `PL`,
 * so it only ever exercised the `AB`-alone half of the rule, which was never the
 * half at risk. Hence a handicap file written the way servers write them.
 */
test('a handicap game that names White as first to play is still a game', () => {
  const parsed = parseSgf(
    '(;GM[1]FF[4]SZ[19]HA[4]KM[0.5]PB[Bob]PW[Alice]RE[W+3.5]AB[dd][pd][dp][pp]PL[W];W[qf];B[nc])',
  );

  assert.equal(parsed.kind, 'game');
  assert.equal(parsed.kind === 'game' ? parsed.game.meta.result?.kind : undefined, 'points');
  assert.equal(parsed.kind === 'game' ? parsed.game.meta.whitePlayer : undefined, 'Alice');
});

test('a recorded result outweighs a white stone that was set up', () => {
  // A game resumed from a diagram carries real white setup stones. The result is
  // what a problem cannot honestly have, so it settles the genre first.
  const parsed = parseSgf('(;GM[1]FF[4]SZ[19]PB[Bob]PW[Alice]RE[B+R]AW[dd]AB[pp];B[qq];W[cc])');

  assert.equal(parsed.kind, 'game');
});

test('naming the side to play is not on its own a problem', () => {
  // Black stones and a side to move describe a handicap game exactly as well as
  // they describe a position, and there is nothing in the file to break the tie.
  assert.equal(parseSgf('(;GM[1]SZ[19]AB[dd][pp]PL[W];B[qq])').kind, 'game');
});

/**
 * Files commonly spend the root on `GM`/`FF`/`SZ`/`AP` and set the position out
 * in the node below it. Reading the root alone made such a problem a game, whose
 * renderer announced its black and white stones together under the handicap
 * label — the exact failure this whole change exists to remove.
 */
test('a position stated below the root is still a problem', () => {
  const parsed = parseSgf(
    '(;GM[1]FF[4]SZ[9]AP[x];AB[cc][dd]AW[cd][dc]PL[W](;W[ce];B[de])(;W[de];B[ce]))',
  );

  assert.equal(parsed.kind, 'problem');
  assert.equal(parsed.kind === 'problem' ? parsed.problem.setup.length : -1, 4);
  assert.equal(parsed.kind === 'problem' ? parsed.problem.toPlay : undefined, 'W');
  assert.equal(parsed.kind === 'problem' ? parsed.problem.lines.length : -1, 2);
});

/**
 * A game is read along its main line, so a corrupt byte in a variation is a byte
 * nobody visits. Every branch of a problem is content, so the same byte used to
 * abort the file and leave the page showing nothing at all.
 */
test('a branch that cannot be read costs its own lines and no more', () => {
  const parsed = parseSgf('(;GM[1]SZ[9]AW[cc]AB[dd]PL[B];B[ba](;W[ab];B[bb])(;W[!!];B[ee]))');

  assert.equal(parsed.kind, 'problem');
  assert.equal(parsed.kind === 'problem' ? parsed.problem.lines.length : -1, 1);
  assert.equal(parsed.kind === 'problem' ? parsed.problem.unreadable : -1, 1);
});

test('every line under an unreadable move is counted, not just one', () => {
  const parsed = parseSgf('(;GM[1]SZ[9]AW[cc]AB[dd]PL[B];B[ba](;W[ab])(;W[!!](;B[ee])(;B[ff])))');

  assert.equal(parsed.kind === 'problem' ? parsed.problem.unreadable : -1, 2);
});

test('an annotated correctness mark still marks the line correct', () => {
  // `C[RIGHT]` is what the reference collection writes; others explain the mark
  // in the same comment, and demanding the bare word lost every verdict there.
  const parsed = parseSgf('(;GM[1]SZ[9]AB[cc]AW[dd]PL[W](;W[ee]C[RIGHT — the vital point])(;W[ff]))');

  assert.deepEqual(
    parsed.kind === 'problem' ? parsed.problem.lines.map((line) => line.correct) : [],
    [true, false],
  );
});

test('prose that merely opens with the word is not a verdict', () => {
  // The mark is a label, so it is either the whole comment or set off from what
  // follows. Guessing here would tell a blind player that a losing move wins.
  const parsed = parseSgf('(;GM[1]SZ[9]AB[cc]AW[dd]PL[W](;W[ee]C[Right, so black must answer])) ');

  assert.deepEqual(
    parsed.kind === 'problem' ? parsed.problem.lines.map((line) => line.correct) : [],
    [false],
  );
});

// The signal that is deliberately not used. A reviewed game is full of sibling
// variations and is still a game; announcing a solution inside one would be a
// worse failure than anything this change fixes.
test('branching alone does not make a game into a problem', () => {
  const parsed = parseSgf(fixture('variations.sgf'));

  assert.equal(parsed.kind, 'game');
  // Three moves down the first branch, not the five the whole tree holds.
  assert.equal(
    parsed.kind === 'game' ? parsed.game.moves.length : -1,
    3,
    'a game is still read along its main line only',
  );
});

test('setup stones keep the colour they were placed with', () => {
  const problem = reference();

  const black = problem.setup.filter((stone) => stone.color === 'B');
  const white = problem.setup.filter((stone) => stone.color === 'W');

  assert.equal(black.length, 13);
  assert.equal(white.length, 14);

  // No vertex may appear under both colours: a stone in the wrong group puts a
  // stone of the wrong colour on a board the reader cannot look at.
  const key = (stone: { at: { x: number; y: number } }): string => `${stone.at.x},${stone.at.y}`;
  const blackKeys = new Set(black.map(key));
  for (const stone of white) {
    assert.ok(!blackKeys.has(key(stone)), `${key(stone)} is claimed by both colours`);
  }

  // bb is the first AB value and be the first AW value, in SGF orientation.
  assert.ok(black.some((stone) => stone.at.x === 1 && stone.at.y === 1));
  assert.ok(white.some((stone) => stone.at.x === 1 && stone.at.y === 4));
});

test('reads the side to move from PL, then from the first move, then defaults', () => {
  assert.equal(reference().toPlay, 'W');
  assert.equal(problemOf('(;GM[1]SZ[19]AW[dd];W[eg])').toPlay, 'W');
  assert.equal(problemOf('(;GM[1]SZ[19]AW[dd];B[eg])').toPlay, 'B');
  assert.equal(problemOf('(;GM[1]SZ[19]AW[dd]AB[pp])').toPlay, 'B');
});

test('carries the root comment as the note, collapsing runs of blank lines', () => {
  const note = problemOf('(;GM[1]SZ[19]AW[dd]PL[B]C[First.\n\n\n\nSecond.])').note;

  assert.equal(note, 'First.\n\nSecond.');
});

test('a problem with no comment carries no note', () => {
  assert.equal(problemOf(fixture('problem-position-only.sgf')).note, undefined);
  assert.equal(problemOf('(;GM[1]SZ[19]AW[dd]PL[B]C[   ])').note, undefined);
});

test('expands the whole tree into one line per leaf, in file order', () => {
  const problem = reference();

  assert.equal(problem.lines.length, 8, 'every leaf of the tree is a line');
  assert.deepEqual(
    problem.lines.map((line) => line.n),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );

  // The file's first branch opens with W[eg] and holds four leaves of its own,
  // so the first four lines all begin there.
  const opening = problem.lines.map((line) => {
    const first = line.events[0];
    return first?.kind === 'move' ? `${first.color}${first.at.x},${first.at.y}` : '';
  });

  assert.deepEqual(opening.slice(0, 4), Array<string>(4).fill('W4,6'));
  assert.equal(opening[4], 'W3,8', 'the second branch follows the whole of the first');
});

test('a line holds every move from the root of its branch, not only its leaf', () => {
  const problem = reference();

  assert.deepEqual(
    problem.lines.map((line) => line.events.length),
    [5, 5, 3, 3, 8, 4, 8, 9],
  );

  // Numbered from the first move of the line, so it can be followed on a board
  // that starts from the setup position. Counted over what was played: a line may
  // also place stones as it goes, and those carry no number.
  for (const line of problem.lines) {
    const played = line.events.filter((event) => event.kind !== 'setup');

    assert.deepEqual(
      played.map((event) => event.n),
      played.map((_, index) => index + 1),
      `line ${line.n} is numbered from 1`,
    );
  }
});

/**
 * Stones a branch adds as it goes — "and now suppose there is a white stone
 * here". They used to be dropped, which left the reader building a position the
 * file does not record and the rules being applied to a different one.
 */
test('a stone placed inside a line is kept, in the order the file writes it', () => {
  const problem = problemOf('(;GM[1]SZ[9]AB[hh]AW[dd]PL[B];B[ba](;AW[aa];B[ab]))');

  const [line] = problem.lines;
  assert.ok(line !== undefined);
  assert.deepEqual(
    line.events.map((event) => event.kind),
    ['move', 'setup', 'move'],
  );

  // And the rules were applied to it: the move after it takes the stone.
  const last = line.events[2];
  assert.equal(last?.kind === 'move' ? last.captures.length : -1, 1);
});

test('stones placed before any move belong to the position, not to a line', () => {
  // No move separates them from the root, so they are part of what the reader
  // sets out before starting — not something that happens during an answer.
  const problem = problemOf('(;GM[1]FF[4]SZ[9]AB[cc][dd]AW[cd][dc]PL[W];AB[ee];W[ce];B[de])');

  assert.equal(problem.setup.length, 5);
  assert.deepEqual(
    problem.lines[0]?.events.map((event) => event.kind),
    ['move', 'move'],
  );
});

/**
 * `AE` in the opening is not an event. A reader builds the position from an empty
 * board, so a point set and then cleared is a point with no stone: there is
 * nothing there for her to take off, and saying so would send her looking for it.
 */
test('a stone AE clears before play is simply absent from the position', () => {
  const problem = problemOf('(;GM[1]SZ[9]AB[cc][dd]AW[cd][dc]PL[W]AE[cc])');

  assert.deepEqual(
    problem.setup.map((stone) => `${stone.color}${stone.at.x}${stone.at.y}`),
    ['B33', 'W23', 'W32'],
  );
});

test('a stone AE clears during a line is announced where it goes', () => {
  const problem = problemOf('(;GM[1]SZ[9]AB[cc][dd]AW[cd][dc]PL[W];W[ce];AE[cc];B[de])');

  assert.equal(problem.setup.length, 4, 'the position still holds it');

  const [line] = problem.lines;
  assert.deepEqual(line?.events.map((event) => event.kind), ['move', 'setup', 'move']);

  const edit = line?.events[1];
  assert.deepEqual(edit?.kind === 'setup' ? edit.cleared : null, [
    { color: 'B', at: { x: 2, y: 2 } },
  ]);
});

test('a branch that only places a stone is a line of its own', () => {
  // It used to vanish: a node with no move contributed nothing, so the branch had
  // an empty path and was never recorded. Following it as though it were part of
  // the position would be worse — the other branch would inherit its stone.
  const problem = problemOf('(;GM[1]SZ[9]AW[cc]PL[B](;AB[dd])(;B[ee]))');

  assert.equal(problem.setup.length, 1, 'the branch keeps its own stone');
  assert.deepEqual(
    problem.lines.map((line) => line.events.map((event) => event.kind)),
    [['setup'], ['move']],
  );
});

test('a problem that records a position and no moves has no lines', () => {
  const problem = problemOf(fixture('problem-position-only.sgf'));

  assert.equal(problem.lines.length, 0);
  assert.equal(problem.setup.length, 4);
  assert.equal(problem.toPlay, 'B');
});

/**
 * The half a blind reader cannot check. A capture the converter misses leaves a
 * stone standing on the tactile board, and every coordinate after it lands in a
 * position that no longer matches the text.
 */
test('a move that captures inside one line records what it removed', () => {
  const problem = reference();

  const captures = problem.lines.flatMap((line) =>
    line.events
      .filter((event) => event.kind === 'move')
      .filter((event) => event.captures.length > 0)
      .map((event) => ({ line: line.n, n: event.n, at: event.captures })),
  );

  assert.deepEqual(captures, [{ line: 2, n: 4, at: [{ x: 3, y: 7 }] }]);
});

test('a capture in one line does not appear in the line beside it', () => {
  const problem = reference();

  // Lines 1 and 2 share their first three moves and diverge at the fourth.
  const [first, second] = problem.lines;
  assert.ok(first !== undefined && second !== undefined);

  assert.deepEqual(
    first.events.slice(0, 3).map((event) => (event.kind === 'move' ? event.at : null)),
    second.events.slice(0, 3).map((event) => (event.kind === 'move' ? event.at : null)),
    'the two lines really do share a prefix',
  );

  const captured = (line: typeof first): number =>
    line.events.reduce((total, event) => total + (event.kind === 'move' ? event.captures.length : 0), 0);

  assert.equal(captured(second), 1);
  assert.equal(captured(first), 0, 'replaying line 2 did not disturb line 1');
});

test('marks the lines the file marks, and says nothing about the rest', () => {
  const problem = reference();

  assert.deepEqual(
    problem.lines.filter((line) => line.correct).map((line) => line.n),
    [1, 2, 3, 4],
  );
});

// SGF has no way of saying that a branch fails. A collection whose convention
// the converter does not know degrades into a numbered list, which is correct;
// telling a blind player that a winning move loses is not.
test('an unmarked line is not marked wrong', () => {
  const problem = problemOf(fixture('problem-no-marks.sgf'));

  assert.equal(problem.lines.length, 2);
  for (const line of problem.lines) {
    assert.equal(line.correct, false);
  }
});
