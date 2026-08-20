import sgf from '@sabaki/sgf';
import type { SgfNode } from '@sabaki/sgf';
import { SgfError } from './errors.ts';
import type { Color, GameMeta, GameResult, SetupStone, Vertex } from './types.ts';

/** A move as the file records it, before the game has been replayed. */
export type ParsedMove =
  | { kind: 'move'; color: Color; at: Vertex }
  | { kind: 'pass'; color: Color }
  | { kind: 'setup'; stones: SetupStone[] };

/** A parsed game: the file's contents, with nothing derived from the rules yet. */
export type ParsedGame = {
  size: number;
  meta: GameMeta;
  moves: ParsedMove[];
};

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

const parseSetup = (node: SgfNode): SetupStone[] => {
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

  return stones;
};

const parseMove = (node: SgfNode, size: number): ParsedMove | null => {
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

/** Parses SGF text into the game it records, without applying any Go rules. */
export const parseGame = (input: string): ParsedGame => {
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

  const size = parseSize(root);
  const meta = parseMeta(root);
  const moves: ParsedMove[] = [];

  for (const node of mainLine(root)) {
    const setup = parseSetup(node);
    if (setup.length > 0) {
      moves.push({ kind: 'setup', stones: setup });
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
