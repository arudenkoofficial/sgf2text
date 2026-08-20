/** The two players. A union rather than an enum: enums are not erasable syntax. */
export type Color = 'B' | 'W';

/** A point on the board, in SGF orientation: x from the left, y from the top. */
export type Vertex = {
  x: number;
  y: number;
};

/** A stone placed by a setup property rather than by a move. */
export type SetupStone = {
  color: Color;
  at: Vertex;
};

/**
 * One thing that happened in the game. Moves carry the stones they captured,
 * which the SGF file itself never records — they come from replaying the game.
 */
export type GameEvent =
  | { kind: 'move'; n: number; color: Color; at: Vertex; captures: Vertex[] }
  | { kind: 'pass'; n: number; color: Color }
  | { kind: 'setup'; stones: SetupStone[] };

/** How a game ended, parsed out of the SGF `RE` property. */
export type GameResult =
  | { kind: 'points'; winner: Color; points: number }
  | { kind: 'resignation'; winner: Color }
  | { kind: 'time'; winner: Color }
  | { kind: 'forfeit'; winner: Color }
  | { kind: 'draw' }
  | { kind: 'void' }
  | { kind: 'unknown' };

/** Everything the root node says about the game itself. */
export type GameMeta = {
  event?: string;
  place?: string;
  date?: string;
  blackPlayer?: string;
  whitePlayer?: string;
  komi?: number;
  handicap?: number;
  result?: GameResult;
};

/** A whole game, free of any language or display formatting. */
export type GameRecord = {
  size: number;
  meta: GameMeta;
  events: GameEvent[];
};

/** Turns a vertex into the notation a locale's readers expect. */
export type CoordinateSystem = {
  name: string;
  format(vertex: Vertex, size: number): string;
};
