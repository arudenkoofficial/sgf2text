import GoBoard from '@sabaki/go-board';
import type { Sign, Vertex as BoardVertex } from '@sabaki/go-board';
import type { ParsedGame } from './parse.ts';
import type { Color, GameEvent, GameRecord, SetupStone, Vertex } from './types.ts';

/**
 * The package is CommonJS with ESM-style declarations, so the default import
 * is a namespace and cannot be named as a type directly. Recover the instance
 * type from the factory instead.
 */
type Board = ReturnType<typeof GoBoard.fromDimensions>;

const signOf = (color: Color): Sign => (color === 'B' ? 1 : -1);

const toBoardVertex = (vertex: Vertex): BoardVertex => [vertex.x, vertex.y];

/**
 * The stones a move removed: the vertices that changed and now hold nothing,
 * excluding the point just played.
 *
 * The captures are derived from the difference between the two positions
 * rather than read off the library, so the result does not depend on its
 * internals. Removal order — stone down, enemy groups off, own group last —
 * is the library's, and it is the order the rules prescribe: a move with no
 * liberty of its own still captures.
 */
const capturedBetween = (before: Board, after: Board, played: Vertex): Vertex[] => {
  const changed = before.diff(after) ?? [];

  return changed
    .filter(([x, y]) => !(x === played.x && y === played.y))
    .filter(([x, y]) => before.get([x, y]) !== 0 && after.get([x, y]) === 0)
    .map(([x, y]) => ({ x, y }));
};

/**
 * Replays a parsed game under Go rules, so that every move knows which stones
 * it captured. SGF records only where stones were placed; removals follow from
 * the rules and have to be computed.
 */
export const replay = (game: ParsedGame): GameRecord => {
  let board = GoBoard.fromDimensions(game.size);
  const events: GameEvent[] = [];
  let n = 0;

  for (const move of game.moves) {
    if (move.kind === 'setup') {
      for (const stone of move.stones) {
        board = board.set(toBoardVertex(stone.at), signOf(stone.color));
      }

      // Read before clearing, because afterwards there is nothing left to name.
      // `AE` says only "empty this point"; which stone was standing on it is a
      // question about the board, and this is the only place that holds one.
      // A point that was empty already is left out: nothing happened there, and
      // announcing it would send a reader looking for a stone she never had.
      const cleared: SetupStone[] = [];
      for (const at of move.cleared) {
        const sign = board.get(toBoardVertex(at));
        if (sign !== 0) {
          cleared.push({ color: sign === 1 ? 'B' : 'W', at });
        }

        board = board.set(toBoardVertex(at), 0);
      }

      events.push({ kind: 'setup', stones: move.stones, cleared });
      continue;
    }

    n += 1;

    if (move.kind === 'pass') {
      events.push({ kind: 'pass', n, color: move.color });
      continue;
    }

    const before = board;
    board = before.makeMove(signOf(move.color), toBoardVertex(move.at));

    events.push({
      kind: 'move',
      n,
      color: move.color,
      at: move.at,
      captures: capturedBetween(before, board, move.at),
    });
  }

  return { size: game.size, meta: game.meta, events };
};
