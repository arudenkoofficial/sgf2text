import type { Color, CoordinateSystem, GameResult } from './types.ts';

export type LocaleId = 'ru' | 'en';

/**
 * Everything language-specific lives behind this interface, so the renderer
 * itself contains no words. A locale also carries its coordinate system:
 * notation is a function of the reader's convention, not only of vocabulary.
 */
export type Locale = {
  id: LocaleId;
  coordinates: CoordinateSystem;

  /** Labels for the metadata block, in the order they should be printed. */
  labels: {
    boardSize: string;
    event: string;
    place: string;
    date: string;
    black: string;
    white: string;
    komi: string;
    handicap: string;
    result: string;
  };

  boardSize(size: number): string;
  handicap(count: number, stones: string[]): string;
  result(result: GameResult): string;

  move(n: number, color: Color, coordinate: string, captured: string[], capturedFrom: Color): string;
  pass(n: number, color: Color): string;
};
