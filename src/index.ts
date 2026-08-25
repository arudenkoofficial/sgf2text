import { parseGame, parseSgf } from './parse.ts';
import { buildProblem } from './problem.ts';
import { replay } from './replay.ts';
import { render, renderProblem } from './render.ts';
import { DEFAULT_LOCALE, getLocale } from './locales/index.ts';
import type { GameRecord, ProblemRecord } from './types.ts';

export type {
  Color,
  CoordinateSystem,
  GameEvent,
  GameMeta,
  GameRecord,
  GameResult,
  PlayedEvent,
  ProblemLine,
  ProblemRecord,
  SetupStone,
  Vertex,
} from './types.ts';
export type { Locale, LocaleId } from './locale.ts';
export type {
  ParsedGame,
  ParsedLine,
  ParsedMove,
  ParsedProblem,
  ParsedSgf,
  PlayedMove,
} from './parse.ts';

export { SgfError, isSgfError } from './errors.ts';
export type { SgfErrorCode } from './errors.ts';
export { western } from './coords.ts';
export { DEFAULT_LOCALE, LOCALE_IDS, getLocale, isLocaleId } from './locales/index.ts';

export type ConvertOptions = {
  /** Output language. Defaults to Russian. */
  locale?: string;
};

/**
 * An SGF file is one of two things, and which one it is decides everything that
 * follows: a game is a single line of play with a history, a problem is a
 * constructed position with a tree of answers.
 */
export type SgfDocument =
  | { kind: 'game'; record: GameRecord }
  | { kind: 'problem'; problem: ProblemRecord };

/**
 * Parses an SGF game and replays it, returning the moves, passes, setup stones
 * and captures as data. No text, no language — this is the half other tools
 * consume, such as a live-play assistant that needs events rather than prose.
 *
 * Always a game record, including for a problem file. Problems arrived later
 * than this function did, and a tool that reads games has no reason to start
 * receiving something else.
 */
export const sgfToRecord = (sgf: string): GameRecord => replay(parseGame(sgf));

/** Reads an SGF file as whichever of the two genres it turns out to be. */
export const sgfToDocument = (sgf: string): SgfDocument => {
  const parsed = parseSgf(sgf);

  return parsed.kind === 'problem'
    ? { kind: 'problem', problem: buildProblem(parsed.problem) }
    : { kind: 'game', record: replay(parsed.game) };
};

/**
 * Renders an already-read file. Separate from `sgfToText` so a caller that needs
 * both the text and what the file was — the web page, which has to announce one
 * or the other — does not parse it twice.
 */
export const documentToText = (document: SgfDocument, options: ConvertOptions = {}): string => {
  const locale = getLocale(options.locale ?? DEFAULT_LOCALE);

  return document.kind === 'problem'
    ? renderProblem(document.problem, locale)
    : render(document.record, locale);
};

/** Converts an SGF game or problem into text a screen reader can read out. */
export const sgfToText = (sgf: string, options: ConvertOptions = {}): string =>
  documentToText(sgfToDocument(sgf), options);
