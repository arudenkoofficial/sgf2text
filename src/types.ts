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

/**
 * Something that was played rather than placed. A problem's setup is stated once
 * in the problem itself, so no line of its answer can hold one — a fact the type
 * carries rather than a comment promising it.
 */
export type PlayedEvent = Exclude<GameEvent, { kind: 'setup' }>;

/**
 * One line of a problem's answer, replayed under the rules from the setup
 * position. Complete in itself: it holds every move from the first, not only
 * the part where it diverges from its neighbour, because it is read aloud and a
 * listener has no way to hold a position in a tree while moving stones by hand.
 */
export type ProblemLine = {
  /** Its ordinal in the file's own order, counted from one. */
  n: number;
  /**
   * Whether the file marks this line as solving the problem. Never inverted:
   * SGF has no way of saying that a branch fails, so an unmarked line means the
   * file said nothing, not that the line is wrong.
   */
  correct: boolean;
  /**
   * Everything the line does, in order: its moves, and any stones it places as it
   * goes. The problem's own setup is not among them — that is stated once in the
   * statement rather than repeated at the head of every line.
   */
  events: GameEvent[];
};

/**
 * A problem: a position that was constructed rather than played, and the tree of
 * answers to it flattened into lines.
 *
 * Separate from `GameRecord` rather than folded into it. A game's own record has
 * been checked against real files by a blind player, and nothing here may reach
 * it.
 */
export type ProblemRecord = {
  size: number;
  setup: SetupStone[];
  toPlay: Color;
  /** The problem's statement, as the file writes it. Absent when it has none. */
  note?: string;
  lines: ProblemLine[];
  /**
   * Lines the file records but that could not be read. Said out loud rather than
   * passed over: a solution that is quietly one line short is a solution a reader
   * has no way to know she is missing.
   */
  unreadable: number;
};

/** Turns a vertex into the notation a locale's readers expect. */
export type CoordinateSystem = {
  name: string;
  format(vertex: Vertex, size: number): string;
};
