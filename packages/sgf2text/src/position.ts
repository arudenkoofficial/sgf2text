import type { SetupStone, Vertex } from './types.ts';

/** One node's worth of editing: stones put down, points emptied. */
export type BoardEdit = {
  stones: readonly SetupStone[];
  cleared: readonly Vertex[];
};

const key = (at: Vertex): string => `${at.x},${at.y}`;

/**
 * The stones left standing after a run of edits, in the order the file put them
 * down.
 *
 * This exists because `AE` is not an event when it happens before the game does.
 * A position is stated to a reader as the stones she should place, and a point
 * that was set and then cleared is simply a point with no stone on it: she starts
 * from an empty board, so there is nothing there to take off. Announcing the
 * clearing would have her hunting the board for a stone she never placed.
 *
 * Once play has begun the opposite holds, and `replay` says so instead: by then
 * the stone is on her board, and its going has to be spoken or her board and the
 * text part company.
 */
export const settle = (edits: readonly BoardEdit[]): SetupStone[] => {
  const standing = new Map<string, SetupStone>();

  for (const edit of edits) {
    for (const stone of edit.stones) {
      standing.set(key(stone.at), stone);
    }
    for (const at of edit.cleared) {
      standing.delete(key(at));
    }
  }

  return [...standing.values()];
};
