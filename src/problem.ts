import { replay } from './replay.ts';
import type { ParsedLine, ParsedProblem } from './parse.ts';
import type { ProblemLine, ProblemRecord } from './types.ts';

/**
 * One line of the answer, replayed under the rules.
 *
 * A line is exactly a game whose first event is the setup, so it is replayed by
 * assembling one and handing it to `replay` — which means the logic that finds
 * captures needs no edit, and the problem path inherits everything already
 * tested about ko, corner groups and moves that look suicidal.
 *
 * That reuse is the point rather than a convenience. Captures are the half a
 * blind reader cannot check: a missed one leaves a stone standing on the tactile
 * board and every coordinate after it lands in a position that no longer
 * matches.
 */
const lineOf = (problem: ParsedProblem, line: ParsedLine, n: number): ProblemLine => {
  const played = replay({
    size: problem.size,
    meta: {},
    moves: [{ kind: 'setup', stones: problem.setup }, ...line.moves],
  });

  return {
    n,
    correct: line.correct,
    // The first event is the setup injected above, and only that one is dropped:
    // the position is stated once in the problem itself, and repeating it under
    // every line would be the whole board read out eight times over. A setup
    // further down belongs to the line — a branch adding a stone as it goes — and
    // survives, or the reader builds a board the rules were not applied to.
    events: played.events.slice(1),
  };
};

/**
 * Applies the rules to a parsed problem, one line at a time.
 *
 * Independently, rather than by walking the tree with an undo stack. It costs a
 * replay per line, which for a problem is nothing, and it cannot leak a capture
 * from one branch into the branch beside it — two lines sharing three moves and
 * disagreeing about what is on the board is the failure that would be hardest to
 * notice and worst to hear.
 */
export const buildProblem = (problem: ParsedProblem): ProblemRecord => ({
  size: problem.size,
  setup: problem.setup,
  toPlay: problem.toPlay,
  note: problem.note,
  lines: problem.lines.map((line, index) => lineOf(problem, line, index + 1)),
  unreadable: problem.unreadable,
});
