import sgf from '@sabaki/sgf';
import type { SgfNode } from '@sabaki/sgf';
import { isSgfError, SgfError } from './errors.ts';
import { settle } from './position.ts';
import type { Color, GameMeta, GameResult, SetupStone, Vertex } from './types.ts';

/** A move as the file records it, before the game has been replayed. */
export type ParsedMove =
  | { kind: 'move'; color: Color; at: Vertex }
  | { kind: 'pass'; color: Color }
  /**
   * `cleared` holds bare vertices rather than stones, because that is all `AE`
   * says: empty this point. Which stone was standing on it is a question about a
   * board, and this layer has not built one.
   */
  | { kind: 'setup'; stones: SetupStone[]; cleared: Vertex[] };

/** A parsed game: the file's contents, with nothing derived from the rules yet. */
export type ParsedGame = {
  size: number;
  meta: GameMeta;
  moves: ParsedMove[];
};

/**
 * A move that was played. A setup is stated for the position as a whole rather
 * than reached by playing, so it is not one of these — a fact the type carries,
 * which is what keeps callers from guarding against a case that cannot arise.
 */
export type PlayedMove = Exclude<ParsedMove, { kind: 'setup' }>;

/**
 * One path through a problem's tree, from the first move to a leaf.
 *
 * `moves` holds setups as well as moves, because a branch is allowed to add
 * stones as it goes — "and now suppose there is a white stone here". They are
 * kept in the order the file writes them so that the rules are applied to the
 * same board the reader is told to build.
 */
export type ParsedLine = {
  moves: ParsedMove[];
  correct: boolean;
};

/** A parsed problem: a constructed position and every answer the file records. */
export type ParsedProblem = {
  size: number;
  setup: SetupStone[];
  toPlay: Color;
  note?: string;
  lines: ParsedLine[];
  /**
   * Lines the file records but that could not be read. Carried rather than
   * dropped so the answer can say how much of itself is missing.
   */
  unreadable: number;
};

/**
 * What the file turned out to be. The two genres are read by one parse and told
 * apart once, so nothing downstream has to guess a second time.
 */
export type ParsedSgf =
  | { kind: 'game'; game: ParsedGame }
  | { kind: 'problem'; problem: ParsedProblem };

const DEFAULT_SIZE = 19;

/**
 * The legacy pass. SGF FF[3] wrote a pass as a move to `tt` — the 20th point of
 * the 20th row, which does not exist on a 19x19 board. On a larger board it is
 * an ordinary vertex, so the encoding only means "pass" where it cannot mean a
 * point.
 */
const LEGACY_PASS = 'tt';
const LEGACY_PASS_MAX_SIZE = 19;

/** SGF coordinates are letters: `a` is 0, `b` is 1, and so on. */
const vertexFromSgf = (value: string): Vertex | null => {
  if (value.length < 2) {
    return null;
  }

  const x = value.charCodeAt(0) - 97;
  const y = value.charCodeAt(1) - 97;
  if (Number.isNaN(x) || Number.isNaN(y) || x < 0 || y < 0) {
    return null;
  }

  return { x, y };
};

const firstValue = (node: SgfNode, property: string): string | undefined => {
  const values = node.data[property];
  return values?.[0];
};

const numberValue = (node: SgfNode, property: string): number | undefined => {
  const raw = firstValue(node, property);
  if (raw === undefined || raw.trim() === '') {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const textValue = (node: SgfNode, property: string): string | undefined => {
  const raw = firstValue(node, property);
  if (raw === undefined || raw.trim() === '') {
    return undefined;
  }

  return raw;
};

/** A property that names a colour, such as `PL[W]`. */
const colorValue = (node: SgfNode, property: string): Color | undefined => {
  const raw = firstValue(node, property)?.trim().toUpperCase();

  return raw === 'B' || raw === 'W' ? raw : undefined;
};

const parseSize = (root: SgfNode): number => {
  const raw = firstValue(root, 'SZ');
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_SIZE;
  }

  if (raw.includes(':')) {
    const [width, height] = raw.split(':');
    if (width !== height) {
      throw new SgfError('rectangular-board', `Rectangular boards are not supported (SZ[${raw}])`);
    }

    return Number(width);
  }

  const size = Number(raw);
  if (Number.isNaN(size) || size < 2) {
    throw new SgfError('unreadable-size', `Unreadable board size SZ[${raw}]`);
  }

  return size;
};

const parseResult = (raw: string | undefined): GameResult | undefined => {
  if (raw === undefined || raw.trim() === '') {
    return undefined;
  }

  const value = raw.trim();
  const lowered = value.toLowerCase();

  if (lowered === '0' || lowered === 'draw' || lowered === 'jigo') {
    return { kind: 'draw' };
  }
  if (lowered === 'void') {
    return { kind: 'void' };
  }
  if (lowered === '?' || lowered === 'unknown') {
    return { kind: 'unknown' };
  }

  const winner = value[0]?.toUpperCase();
  if ((winner !== 'B' && winner !== 'W') || value[1] !== '+') {
    return { kind: 'unknown' };
  }

  const margin = value.slice(2).trim().toLowerCase();

  if (margin.startsWith('r')) {
    return { kind: 'resignation', winner };
  }
  if (margin.startsWith('t')) {
    return { kind: 'time', winner };
  }
  if (margin.startsWith('f')) {
    return { kind: 'forfeit', winner };
  }

  const points = Number(margin);
  if (margin === '' || Number.isNaN(points)) {
    return { kind: 'unknown' };
  }

  return { kind: 'points', winner, points };
};

const parseMeta = (root: SgfNode): GameMeta => ({
  event: textValue(root, 'EV'),
  place: textValue(root, 'PC'),
  date: textValue(root, 'DT'),
  blackPlayer: textValue(root, 'PB'),
  whitePlayer: textValue(root, 'PW'),
  komi: numberValue(root, 'KM'),
  handicap: numberValue(root, 'HA'),
  result: parseResult(firstValue(root, 'RE')),
});

/** What one node does to the board without anybody playing: `AB`, `AW`, `AE`. */
type Edit = { stones: SetupStone[]; cleared: Vertex[] };

const parseSetup = (node: SgfNode): Edit => {
  const stones: SetupStone[] = [];

  for (const [property, color] of [
    ['AB', 'B'],
    ['AW', 'W'],
  ] as const) {
    for (const value of node.data[property] ?? []) {
      const at = vertexFromSgf(value);
      if (at !== null) {
        stones.push({ color, at });
      }
    }
  }

  const cleared: Vertex[] = [];
  for (const value of node.data['AE'] ?? []) {
    const at = vertexFromSgf(value);
    if (at !== null) {
      cleared.push(at);
    }
  }

  return { stones, cleared };
};

const editsBoard = (edit: Edit): boolean => edit.stones.length > 0 || edit.cleared.length > 0;

const parseMove = (node: SgfNode, size: number): PlayedMove | null => {
  for (const color of ['B', 'W'] as const) {
    const values = node.data[color];
    if (values === undefined) {
      continue;
    }

    const value = values[0] ?? '';

    if (value === '' || (value === LEGACY_PASS && size <= LEGACY_PASS_MAX_SIZE)) {
      return { kind: 'pass', color };
    }

    const at = vertexFromSgf(value);
    if (at === null) {
      throw new SgfError('unreadable-move', `Unreadable move ${color}[${value}]`);
    }

    return { kind: 'move', color, at };
  }

  return null;
};

/**
 * Walks the main line of the tree. Sibling variations are left alone: rendering
 * a tree as linear speech has no good answer, and presenting a branch as a
 * continuation of the game — which is what a naive parser does — is worse than
 * leaving it out.
 */
const mainLine = function* (root: SgfNode): Generator<SgfNode> {
  let node: SgfNode | undefined = root;

  while (node !== undefined) {
    yield node;
    node = node.children[0];
  }
};

/**
 * The mark a problem collection puts on a line that solves the problem. It is a
 * convention of the tools that write these files, not part of SGF, so it is
 * never inverted: a file whose convention this does not cover yields lines with
 * no verdict, which is a numbered list — while guessing would have the converter
 * tell a blind player that a winning move loses.
 *
 * The mark is read as a label rather than as the whole comment, because the
 * collections that write it also annotate it: `C[RIGHT — the vital point]` is
 * the same mark with an explanation after it, and demanding the bare word threw
 * the verdict away on every line of such a file. A label is either the whole
 * comment or is set off from what follows by punctuation, which is what keeps
 * prose that merely opens with the word — "Right, so black must…" — from being
 * read as a verdict.
 */
const CORRECT_MARK = /^RIGHT\s*(?:$|[.:;—–-])/;

const isCorrect = (node: SgfNode): boolean =>
  CORRECT_MARK.test((firstValue(node, 'C') ?? '').trim().toUpperCase());

/**
 * A run of blank lines is a silence, and a long silence read aloud is the end of
 * the text as far as a listener can tell. One blank line is a paragraph break;
 * more is a false ending.
 */
const collapseBlankLines = (text: string): string =>
  text.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');

const parseNote = (root: SgfNode): string | undefined => {
  const raw = textValue(root, 'C');

  return raw === undefined ? undefined : collapseBlankLines(raw.trim());
};

/** How many lines a subtree holds, counted without reading any of its moves. */
const leaves = (node: SgfNode): number =>
  node.children.length === 0
    ? 1
    : node.children.reduce((total, child) => total + leaves(child), 0);

/**
 * Every leaf of the tree, depth first, as the whole path of moves that reaches
 * it. A game's variations are left out on purpose; a problem's variations are
 * the answer, and the attempts that fail are half of what it teaches.
 *
 * An empty path is not a line: a file that records a position and nothing else
 * has a setup to read out and no answer.
 *
 * Stones a branch adds as it goes are carried along with its moves. The nodes
 * that state the opening position are excluded — those are the problem's own
 * setup, said once in the statement rather than at the head of all eight lines.
 *
 * A branch holding a move that cannot be read is dropped rather than allowed to
 * abort the file. This is the one place the two genres differ in what they must
 * survive: a game is read along its main line, so a corrupt byte in a variation
 * is a byte nobody visits, while every branch of a problem is content. Refusing
 * the whole file over one of them leaves a reader with nothing, when the rest of
 * the answer is intact — so the branch goes, and the count goes with it, because
 * a solution quietly one line short is a solution she cannot trust.
 */
const expandLines = (
  root: SgfNode,
  size: number,
  stated: ReadonlySet<SgfNode>,
): { lines: ParsedLine[]; unreadable: number } => {
  const lines: ParsedLine[] = [];
  let unreadable = 0;

  const walk = (node: SgfNode, path: ParsedMove[]): void => {
    let move: PlayedMove | null;
    try {
      move = parseMove(node, size);
    } catch (error) {
      if (isSgfError(error) && error.code === 'unreadable-move') {
        unreadable += leaves(node);
        return;
      }

      throw error;
    }

    const edit = stated.has(node) ? undefined : parseSetup(node);
    const here: ParsedMove[] = [
      ...path,
      ...(edit !== undefined && editsBoard(edit) ? [{ kind: 'setup' as const, ...edit }] : []),
      ...(move === null ? [] : [move]),
    ];

    if (node.children.length === 0) {
      if (here.length > 0) {
        lines.push({ moves: here, correct: isCorrect(node) });
      }

      return;
    }

    for (const child of node.children) {
      walk(child, here);
    }
  };

  walk(root, []);

  return { lines, unreadable };
};

/** Whether a node plays a stone, asked without reading where it lands. */
const hasMove = (node: SgfNode): boolean =>
  node.data['B'] !== undefined || node.data['W'] !== undefined;

/**
 * The nodes that state the position: the root, and the main line below it for as
 * long as nobody has played.
 *
 * Reading the root alone was wrong. Plenty of files keep `GM`, `FF`, `SZ` and
 * `AP` in the root and put the position in the node under it — a shape common
 * enough that the converter saw an empty board, called the file a game, and
 * announced a problem's black and white stones together as a handicap.
 */
const opening = (root: SgfNode): SgfNode[] => {
  const nodes: SgfNode[] = [];
  let node: SgfNode | undefined = root;

  while (node !== undefined && !hasMove(node)) {
    nodes.push(node);
    // A node with siblings is already one answer among several, whatever it holds
    // — following the first of them would fold one branch's stones into the
    // position and make the branch itself vanish, having nothing left of its own.
    node = node.children.length === 1 ? node.children[0] : undefined;
  }

  return nodes;
};

/**
 * The two properties a problem has no way to carry honestly: how the game ended,
 * and the handicap it began from. Both describe something that was played.
 *
 * Everything else a game record holds is deliberately absent from this list.
 * Player names, komi, date, event and place are all written by problem
 * collections out of habit — the reference problem in this repository carries
 * `PW[White]PB[Black]` and `KM[0.00]` — so they say nothing about which genre a
 * file belongs to, and vetoing on them would send problems back to being read as
 * handicap games.
 */
const PLAYED_GAME_PROPERTIES = ['RE', 'HA'] as const;

const recordsPlayedGame = (root: SgfNode): boolean =>
  PLAYED_GAME_PROPERTIES.some((property) => textValue(root, property) !== undefined);

/**
 * Whether the file sets a position to solve rather than recording a game.
 *
 * White setup stones are the evidence, and now the only evidence. A handicap
 * places black stones alone, so `AB` by itself has never meant a problem — but
 * `PL` used to count too, and that was the mistake. `PL[W]` is not the giveaway
 * it resembles: it is precisely how a handicap game states that White moves
 * first, which several servers write, so any such game came out as a problem
 * with its players, its result and its handicap discarded. `PL` still says whose
 * move it is; it no longer says what kind of file this is.
 *
 * A recorded result or handicap settles it before the stones are even examined,
 * which is what keeps a game resumed from a diagram — a real game, carrying real
 * white setup stones — on the game side.
 *
 * Branching is still not a signal, common as it is in problems: a reviewed game
 * is full of variations and is still a game.
 */
const isProblem = (root: SgfNode, stated: SgfNode[]): boolean =>
  // The position it settles to, not every stone it ever names: a file that puts a
  // white stone down and takes it off again states a position without one.
  !recordsPlayedGame(root) &&
  settle(stated.map(parseSetup)).some((stone) => stone.color === 'W');

const parseTree = (input: string): SgfNode => {
  if (input.trim() === '') {
    throw new SgfError('empty-input', 'The input is empty');
  }

  let trees: SgfNode[];
  try {
    trees = sgf.parse(input);
  } catch (cause) {
    throw new SgfError('not-sgf', 'The input could not be parsed as SGF', { cause });
  }

  const root = trees[0];
  if (root === undefined) {
    throw new SgfError('not-sgf', 'The input contains no SGF game tree');
  }

  return root;
};

const gameFrom = (root: SgfNode): ParsedGame => {
  const size = parseSize(root);
  const meta = parseMeta(root);
  const moves: ParsedMove[] = [];

  for (const node of mainLine(root)) {
    const edit = parseSetup(node);
    if (editsBoard(edit)) {
      moves.push({ kind: 'setup', ...edit });
    }

    const move = parseMove(node, size);
    if (move !== null) {
      moves.push(move);
    }
  }

  // Plain prose parses without complaint into a single empty node, so a tree
  // that carries neither properties nor moves is not a game record at all.
  if (Object.keys(root.data).length === 0 && moves.length === 0) {
    throw new SgfError('not-sgf', 'The input does not look like an SGF game record');
  }

  return { size, meta, moves };
};

const problemFrom = (root: SgfNode, nodes: SgfNode[]): ParsedProblem => {
  const size = parseSize(root);
  const { lines, unreadable } = expandLines(root, size, new Set(nodes));
  const first = lines[0]?.moves.find((move) => move.kind !== 'setup');

  return {
    size,
    setup: settle(nodes.map(parseSetup)),
    // Failing that, the colour that moves first in the tree says whose problem
    // it is just as plainly. Failing that too, black moves first.
    toPlay:
      nodes.map((node) => colorValue(node, 'PL')).find((color) => color !== undefined) ??
      first?.color ??
      'B',
    note: nodes.map(parseNote).find((text) => text !== undefined),
    lines,
    unreadable,
  };
};

/** Parses SGF text into the game it records, without applying any Go rules. */
export const parseGame = (input: string): ParsedGame => gameFrom(parseTree(input));

/** Parses SGF text into whichever of the two genres it turns out to record. */
export const parseSgf = (input: string): ParsedSgf => {
  const root = parseTree(input);
  // The nodes that state the position, found once. They decide the genre and then
  // supply the position itself, and computing them twice would leave the one
  // place a problem's setup is read in two places.
  const stated = opening(root);

  return isProblem(root, stated)
    ? { kind: 'problem', problem: problemFrom(root, stated) }
    : { kind: 'game', game: gameFrom(root) };
};
