import { parseGame } from './parse.ts';
import { replay } from './replay.ts';
import { render } from './render.ts';
import { DEFAULT_LOCALE, getLocale } from './locales/index.ts';
import type { GameRecord } from './types.ts';

export type {
  Color,
  CoordinateSystem,
  GameEvent,
  GameMeta,
  GameRecord,
  GameResult,
  SetupStone,
  Vertex,
} from './types.ts';
export type { Locale, LocaleId } from './locale.ts';
export type { ParsedGame, ParsedMove } from './parse.ts';

export { SgfError, isSgfError } from './errors.ts';
export type { SgfErrorCode } from './errors.ts';
export { western } from './coords.ts';
export { DEFAULT_LOCALE, LOCALE_IDS, getLocale, isLocaleId } from './locales/index.ts';

export type ConvertOptions = {
  /** Output language. Defaults to Russian. */
  locale?: string;
};

/**
 * Parses an SGF game and replays it, returning the moves, passes, setup stones
 * and captures as data. No text, no language — this is the half other tools
 * consume, such as a live-play assistant that needs events rather than prose.
 */
export const sgfToRecord = (sgf: string): GameRecord => replay(parseGame(sgf));

/** Converts an SGF game into text a screen reader can read out. */
export const sgfToText = (sgf: string, options: ConvertOptions = {}): string =>
  render(sgfToRecord(sgf), getLocale(options.locale ?? DEFAULT_LOCALE));
