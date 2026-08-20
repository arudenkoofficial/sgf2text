import type { CoordinateSystem, Vertex } from './types.ts';

/**
 * Column letters, with I omitted. The gap is conventional in Go and not
 * cosmetic: I is dropped so it cannot be misread as the digit 1 or as J.
 */
const COLUMNS = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';

/** The largest board this notation can name. */
export const MAX_WESTERN_SIZE = COLUMNS.length;

/**
 * Western notation: a column letter from the left edge and a row number
 * counted from the bottom edge, as in `Q16`. This is what the OGS userscript
 * speaks during live play, so a game sounds the same live and in review.
 */
export const western: CoordinateSystem = {
  name: 'western',

  format(vertex: Vertex, size: number): string {
    const column = COLUMNS[vertex.x];
    if (column === undefined) {
      throw new Error(`Column ${vertex.x} cannot be named in western notation`);
    }

    // SGF counts rows downwards from the top; western notation counts them
    // upwards from the bottom, so the row number is the board's complement.
    return `${column}${size - vertex.y}`;
  },
};
